/**
 * Prestige Handler
 * Handles the prestige process including tier reset and reward distribution
 */

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import {
    calculateXPMultiplier,
    calculateCurrencyMultiplier,
    canPrestige,
    getPrestigeMilestoneRewards,
    MAX_PRESTIGE_LEVEL,
    PRESTIGE_REQUIRED_TIER,
} from './prestige-calculator';
import type { PrestigeStatus } from '@/types/progression';

/**
 * Prestige result interface
 */
export interface PrestigeResult {
    success: boolean;
    error?: string;
    previousLevel: number;
    newLevel: number;
    xpMultiplier: number;
    currencyMultiplier: number;
    rewards: {
        badge?: string;
        profileBorder?: string;
        aura?: string;
        title?: string;
        cosmetics?: string[];
    };
}

/**
 * Database row types
 */
interface PlayerProgressionRow {
    id: string;
    player_id: string;
    season_id: string;
    current_tier: number;
    current_xp: number;
    total_xp: number;
    prestige_level: number;
    prestige_xp_multiplier: number;
    prestige_currency_multiplier: number;
    updated_at: string;
    created_at: string;
    claimed_tiers: number[];
}

interface PrestigeHistoryRow {
    id: string;
    player_id: string;
    prestige_level: number;
    season_id: string;
    tier_at_prestige: number;
    total_xp_at_prestige: number;
    rewards_granted: Record<string, unknown>;
    created_at: string;
}

/**
 * Validate if player can prestige
 * 
 * @param playerId - Player's wallet address
 * @returns Validation result with current state
 */
export async function validatePrestigeEligibility(playerId: string): Promise<{
    eligible: boolean;
    error?: string;
    currentTier?: number;
    currentPrestigeLevel?: number;
    seasonId?: string;
}> {
    const supabase = createSupabaseAdminClient() as any;

    // Get current active season
    const { data: season, error: seasonError } = await supabase
        .from('battle_pass_seasons')
        .select('id')
        .eq('is_active', true)
        .single();

    if (seasonError || !season) {
        return { eligible: false, error: 'No active season found' };
    }

    // Get player progression
    const { data: progression, error: progressionError } = await supabase
        .from('player_progression')
        .select('*')
        .eq('player_id', playerId)
        .eq('season_id', season.id)
        .single() as { data: PlayerProgressionRow | null; error: any };

    if (progressionError || !progression) {
        return { eligible: false, error: 'Player progression not found' };
    }

    const currentTier = progression.current_tier;
    const currentPrestigeLevel = progression.prestige_level;

    // Check tier requirement
    if (currentTier < PRESTIGE_REQUIRED_TIER) {
        return {
            eligible: false,
            error: `Must reach tier ${PRESTIGE_REQUIRED_TIER} to prestige (currently tier ${currentTier})`,
            currentTier,
            currentPrestigeLevel,
            seasonId: season.id,
        };
    }

    // Check max prestige level
    if (currentPrestigeLevel >= MAX_PRESTIGE_LEVEL) {
        return {
            eligible: false,
            error: `Already at maximum prestige level (${MAX_PRESTIGE_LEVEL})`,
            currentTier,
            currentPrestigeLevel,
            seasonId: season.id,
        };
    }

    return {
        eligible: true,
        currentTier,
        currentPrestigeLevel,
        seasonId: season.id,
    };
}

/**
 * Execute prestige for a player
 * Resets tier to 1, increments prestige level, grants rewards
 * 
 * @param playerId - Player's wallet address
 * @returns Prestige result with new status and rewards
 */
export async function executePrestige(playerId: string): Promise<PrestigeResult> {
    const supabase = createSupabaseAdminClient() as any;

    // Validate eligibility first
    const validation = await validatePrestigeEligibility(playerId);
    if (!validation.eligible) {
        return {
            success: false,
            error: validation.error || 'Not eligible for prestige',
            previousLevel: validation.currentPrestigeLevel || 0,
            newLevel: validation.currentPrestigeLevel || 0,
            xpMultiplier: 1,
            currencyMultiplier: 1,
            rewards: {},
        };
    }

    const { currentTier, currentPrestigeLevel, seasonId } = validation;
    const newPrestigeLevel = (currentPrestigeLevel || 0) + 1;
    const newXPMultiplier = calculateXPMultiplier(newPrestigeLevel);
    const newCurrencyMultiplier = calculateCurrencyMultiplier(newPrestigeLevel);

    // Get rewards for new prestige level
    const rewards = getPrestigeMilestoneRewards(newPrestigeLevel);

    // Start transaction-like operations
    try {
        // 1. Update player progression - reset tier, increment prestige
        const { error: updateError } = await supabase
            .from('player_progression')
            .update({
                current_tier: 1,
                current_xp: 0,
                total_xp: 0,
                prestige_level: newPrestigeLevel,
                prestige_xp_multiplier: newXPMultiplier,
                prestige_currency_multiplier: newCurrencyMultiplier,
                claimed_tiers: [],
                updated_at: new Date().toISOString(),
            })
            .eq('player_id', playerId)
            .eq('season_id', seasonId);

        if (updateError) {
            throw new Error(`Failed to update progression: ${updateError.message}`);
        }

        // 2. Record prestige history
        const { error: historyError } = await supabase
            .from('prestige_history')
            .insert({
                player_id: playerId,
                prestige_level: newPrestigeLevel,
                season_id: seasonId,
                tier_at_prestige: currentTier,
                total_xp_at_prestige: 0, // Was reset
                rewards_granted: rewards,
                created_at: new Date().toISOString(),
            });

        // History insert is non-critical, just log if it fails
        if (historyError) {
            console.warn('Failed to record prestige history:', historyError);
        }

        // 3. Grant prestige rewards to player inventory
        await grantPrestigeRewards(playerId, newPrestigeLevel, rewards);

        return {
            success: true,
            previousLevel: currentPrestigeLevel || 0,
            newLevel: newPrestigeLevel,
            xpMultiplier: newXPMultiplier,
            currencyMultiplier: newCurrencyMultiplier,
            rewards,
        };
    } catch (error) {
        console.error('Prestige execution failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to execute prestige',
            previousLevel: currentPrestigeLevel || 0,
            newLevel: currentPrestigeLevel || 0,
            xpMultiplier: calculateXPMultiplier(currentPrestigeLevel || 0),
            currencyMultiplier: calculateCurrencyMultiplier(currentPrestigeLevel || 0),
            rewards: {},
        };
    }
}

/**
 * Grant prestige rewards to player inventory
 * 
 * @param playerId - Player's wallet address
 * @param prestigeLevel - New prestige level
 * @param rewards - Rewards to grant
 */
async function grantPrestigeRewards(
    playerId: string,
    prestigeLevel: number,
    rewards: ReturnType<typeof getPrestigeMilestoneRewards>
): Promise<void> {
    const supabase = createSupabaseAdminClient() as any;

    const itemsToGrant: { item_id: string; item_type: string }[] = [];

    // Add badge
    if (rewards.badge) {
        itemsToGrant.push({ item_id: rewards.badge, item_type: 'badge' });
    }

    // Add profile border
    if (rewards.profileBorder) {
        itemsToGrant.push({ item_id: rewards.profileBorder, item_type: 'profile_border' });
    }

    // Add aura
    if (rewards.aura) {
        itemsToGrant.push({ item_id: rewards.aura, item_type: 'aura' });
    }

    // Add cosmetics
    if (rewards.cosmetics) {
        for (const cosmetic of rewards.cosmetics) {
            itemsToGrant.push({ item_id: cosmetic, item_type: 'skin' });
        }
    }

    // Insert all items into player inventory
    for (const item of itemsToGrant) {
        const { error } = await supabase
            .from('player_inventory')
            .upsert({
                player_id: playerId,
                item_id: item.item_id,
                item_type: item.item_type,
                source: `prestige_${prestigeLevel}`,
                acquired_at: new Date().toISOString(),
            }, {
                onConflict: 'player_id,item_id',
            });

        if (error) {
            console.warn(`Failed to grant item ${item.item_id}:`, error);
        }
    }
}

/**
 * Get player's prestige status
 * 
 * @param playerId - Player's wallet address
 * @returns Current prestige status
 */
export async function getPrestigeStatus(playerId: string): Promise<PrestigeStatus | null> {
    const supabase = createSupabaseAdminClient() as any;

    // Get current active season
    const { data: season, error: seasonError } = await supabase
        .from('battle_pass_seasons')
        .select('id')
        .eq('is_active', true)
        .single();

    if (seasonError || !season) {
        return null;
    }

    // Get player progression
    const { data: progression, error: progressionError } = await supabase
        .from('player_progression')
        .select('*')
        .eq('player_id', playerId)
        .eq('season_id', season.id)
        .single() as { data: PlayerProgressionRow | null; error: any };

    if (progressionError || !progression) {
        return null;
    }

    // Get prestige history count
    const { count } = await supabase
        .from('prestige_history')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', playerId);

    // Get last prestige date
    const { data: lastPrestige } = await supabase
        .from('prestige_history')
        .select('created_at')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    return {
        playerId,
        level: progression.prestige_level,
        xpMultiplier: progression.prestige_xp_multiplier || calculateXPMultiplier(progression.prestige_level),
        currencyMultiplier: progression.prestige_currency_multiplier || calculateCurrencyMultiplier(progression.prestige_level),
        totalResets: count || 0,
        lastPrestigeDate: lastPrestige?.created_at ? new Date(lastPrestige.created_at) : undefined,
        eligibleForPrestige: canPrestige(progression.current_tier, progression.prestige_level),
    };
}

/**
 * Get player's prestige history
 * 
 * @param playerId - Player's wallet address
 * @returns Array of prestige history entries
 */
export async function getPrestigeHistory(playerId: string): Promise<{
    level: number;
    tierAtPrestige: number;
    rewards: ReturnType<typeof getPrestigeMilestoneRewards>;
    date: Date;
}[]> {
    const supabase = createSupabaseAdminClient() as any;

    const { data, error } = await supabase
        .from('prestige_history')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false }) as { data: PrestigeHistoryRow[] | null; error: any };

    if (error || !data) {
        return [];
    }

    return data.map(entry => ({
        level: entry.prestige_level,
        tierAtPrestige: entry.tier_at_prestige,
        rewards: entry.rewards_granted as ReturnType<typeof getPrestigeMilestoneRewards>,
        date: new Date(entry.created_at),
    }));
}
