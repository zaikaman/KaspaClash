/**
 * Season Manager
 * Utilities for managing battle pass seasons and player progression
 * 
 * Note: Uses type assertions for battle pass tables until Supabase types are regenerated
 */

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { BattlePassSeason, PlayerProgression, SeasonTransition } from "@/types/progression";

// Type definitions for battle pass tables
interface BattlePassSeasonRow {
    id: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string;
    tier_count: number;
    is_active: boolean;
    version: number;
}

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
}

/**
 * Season history entry for player profile
 */
export interface SeasonHistoryEntry {
    seasonId: string;
    seasonName: string;
    finalTier: number;
    totalXP: number;
    prestigeLevel: number;
    startDate: Date;
    endDate: Date;
    rewardsEarned: {
        currency: number;
        cosmetics: number;
        badges: number;
    };
}

/**
 * Get the currently active season
 */
export async function getCurrentSeason(): Promise<BattlePassSeason | null> {
    const supabase = createSupabaseAdminClient() as any;

    const { data, error } = await supabase
        .from("battle_pass_seasons")
        .select("*")
        .eq("is_active", true)
        .single() as { data: BattlePassSeasonRow | null; error: any };

    if (error || !data) {
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        tierCount: data.tier_count,
        isActive: data.is_active,
        version: data.version,
    };
}

/**
 * Get all seasons (active and past)
 */
export async function getAllSeasons(): Promise<BattlePassSeason[]> {
    const supabase = createSupabaseAdminClient() as any;

    const { data, error } = await supabase
        .from("battle_pass_seasons")
        .select("*")
        .order("start_date", { ascending: false }) as { data: BattlePassSeasonRow[] | null; error: any };

    if (error || !data) {
        return [];
    }

    return data.map((season) => ({
        id: season.id,
        name: season.name,
        description: season.description || "",
        startDate: new Date(season.start_date),
        endDate: new Date(season.end_date),
        tierCount: season.tier_count,
        isActive: season.is_active,
        version: season.version,
    }));
}

/**
 * Get player's progression for current season
 */
export async function getPlayerProgression(playerId: string): Promise<PlayerProgression | null> {
    const currentSeason = await getCurrentSeason();
    if (!currentSeason) {
        return null;
    }

    const supabase = createSupabaseAdminClient() as any;

    const { data, error } = await supabase
        .from("player_progression")
        .select("*")
        .eq("player_id", playerId)
        .eq("season_id", currentSeason.id)
        .single() as { data: PlayerProgressionRow | null; error: any };

    if (error || !data) {
        return null;
    }

    return {
        playerId: data.player_id,
        seasonId: data.season_id,
        currentTier: data.current_tier,
        currentXP: data.current_xp,
        totalXP: data.total_xp,
        prestigeLevel: data.prestige_level,
        lastUpdated: new Date(data.updated_at),
    };
}

/**
 * Initialize player for a new season
 */
export async function initializePlayerSeason(
    playerId: string,
    seasonId: string
): Promise<PlayerProgression | null> {
    const supabase = createSupabaseAdminClient() as any;

    // Check if progression already exists
    const { data: existing } = await supabase
        .from("player_progression")
        .select("id")
        .eq("player_id", playerId)
        .eq("season_id", seasonId)
        .single();

    if (existing) {
        // Return existing progression
        return getPlayerProgression(playerId);
    }

    // Get player's prestige level from previous season (if any)
    const { data: previousProgression } = await supabase
        .from("player_progression")
        .select("prestige_level, prestige_xp_multiplier, prestige_currency_multiplier")
        .eq("player_id", playerId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single() as { data: { prestige_level: number; prestige_xp_multiplier: number; prestige_currency_multiplier: number } | null; error: any };

    const prestigeLevel = previousProgression?.prestige_level || 0;
    const prestigeXPMultiplier = previousProgression?.prestige_xp_multiplier || 1.0;
    const prestigeCurrencyMultiplier = previousProgression?.prestige_currency_multiplier || 1.0;

    // Create new progression
    const { data, error } = await supabase
        .from("player_progression")
        .insert({
            player_id: playerId,
            season_id: seasonId,
            current_tier: 1,
            current_xp: 0,
            total_xp: 0,
            prestige_level: prestigeLevel,
            prestige_xp_multiplier: prestigeXPMultiplier,
            prestige_currency_multiplier: prestigeCurrencyMultiplier,
        })
        .select()
        .single() as { data: PlayerProgressionRow | null; error: any };

    if (error || !data) {
        return null;
    }

    return {
        playerId: data.player_id,
        seasonId: data.season_id,
        currentTier: data.current_tier,
        currentXP: data.current_xp,
        totalXP: data.total_xp,
        prestigeLevel: data.prestige_level,
        lastUpdated: new Date(data.updated_at),
    };
}

/**
 * Get season history for a player
 */
export async function getSeasonHistory(playerId: string): Promise<SeasonHistoryEntry[]> {
    const supabase = createSupabaseAdminClient() as any;

    // Get all player progressions with season info
    const { data, error } = await supabase
        .from("player_progression")
        .select(`
            *,
            battle_pass_seasons (
                id,
                name,
                start_date,
                end_date,
                is_active
            )
        `)
        .eq("player_id", playerId)
        .order("created_at", { ascending: false });

    if (error || !data) {
        return [];
    }

    // Process results
    const history: SeasonHistoryEntry[] = [];

    for (const progression of data as any[]) {
        const season = progression.battle_pass_seasons;
        if (!season) continue;

        // Calculate approximate rewards earned based on tier reached
        const rewardsEarned = calculateTierRewardsEarned(progression.current_tier);

        history.push({
            seasonId: progression.season_id,
            seasonName: season.name,
            finalTier: progression.current_tier,
            totalXP: progression.total_xp,
            prestigeLevel: progression.prestige_level,
            startDate: new Date(season.start_date),
            endDate: new Date(season.end_date),
            rewardsEarned,
        });
    }

    return history;
}

/**
 * Calculate approximate rewards earned for tier
 */
function calculateTierRewardsEarned(tier: number): {
    currency: number;
    cosmetics: number;
    badges: number;
} {
    let currency = 0;
    let cosmetics = 0;
    let badges = 0;

    for (let t = 1; t <= tier; t++) {
        // Base currency per tier
        const baseShard = 50;
        const tierBonus = Math.floor(t / 10) * 25;
        currency += baseShard + tierBonus;

        // Cosmetics every 5 tiers
        if (t % 5 === 0) cosmetics++;
        // Extra cosmetics every 10 tiers
        if (t % 10 === 0) cosmetics++;
        // Badge at tier 50
        if (t === 50) badges++;
    }

    return { currency, cosmetics, badges };
}

/**
 * Check if season is ending soon
 */
export function isSeasonEndingSoon(
    season: BattlePassSeason,
    daysThreshold: number = 7
): boolean {
    const now = new Date();
    const endDate = new Date(season.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= daysThreshold && diffDays > 0;
}

/**
 * Get time remaining in season
 */
export function getSeasonTimeRemaining(season: BattlePassSeason): {
    days: number;
    hours: number;
    minutes: number;
    isEnded: boolean;
} {
    const now = new Date();
    const endDate = new Date(season.endDate);
    const diffTime = endDate.getTime() - now.getTime();

    if (diffTime <= 0) {
        return { days: 0, hours: 0, minutes: 0, isEnded: true };
    }

    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, isEnded: false };
}

/**
 * Create a new season
 */
export async function createSeason(params: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    tierCount?: number;
}): Promise<BattlePassSeason | null> {
    const supabase = createSupabaseAdminClient() as any;

    const { data, error } = await supabase
        .from("battle_pass_seasons")
        .insert({
            name: params.name,
            description: params.description || null,
            start_date: params.startDate.toISOString(),
            end_date: params.endDate.toISOString(),
            tier_count: params.tierCount || 50,
            is_active: false,
            version: 1,
        })
        .select()
        .single() as { data: BattlePassSeasonRow | null; error: any };

    if (error || !data) {
        console.error("Failed to create season:", error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        tierCount: data.tier_count,
        isActive: data.is_active,
        version: data.version,
    };
}

/**
 * Activate a season (deactivates current active season)
 */
export async function activateSeason(seasonId: string): Promise<boolean> {
    const supabase = createSupabaseAdminClient() as any;

    // Deactivate current active season
    await supabase
        .from("battle_pass_seasons")
        .update({ is_active: false })
        .eq("is_active", true);

    // Activate the new season
    const { error } = await supabase
        .from("battle_pass_seasons")
        .update({ is_active: true })
        .eq("id", seasonId);

    return !error;
}

/**
 * Perform season transition
 */
export async function performSeasonTransition(
    oldSeasonId: string,
    newSeasonId: string
): Promise<SeasonTransition | null> {
    const supabase = createSupabaseAdminClient() as any;

    // Get all players with progression in old season
    const { data: progressions, error: fetchError } = await supabase
        .from("player_progression")
        .select("player_id, current_tier, prestige_level, prestige_xp_multiplier, prestige_currency_multiplier")
        .eq("season_id", oldSeasonId) as { data: any[] | null; error: any };

    if (fetchError || !progressions) {
        console.error("Failed to fetch progressions:", fetchError);
        return null;
    }

    let rewardsDistributed = 0;

    // Initialize each player in the new season
    for (const progression of progressions) {
        const { error: insertError } = await supabase
            .from("player_progression")
            .insert({
                player_id: progression.player_id,
                season_id: newSeasonId,
                current_tier: 1,
                current_xp: 0,
                total_xp: 0,
                prestige_level: progression.prestige_level,
                prestige_xp_multiplier: progression.prestige_xp_multiplier,
                prestige_currency_multiplier: progression.prestige_currency_multiplier,
            });

        if (!insertError) {
            rewardsDistributed++;
        }
    }

    // Deactivate old season
    await supabase
        .from("battle_pass_seasons")
        .update({ is_active: false })
        .eq("id", oldSeasonId);

    // Activate new season
    await supabase
        .from("battle_pass_seasons")
        .update({ is_active: true })
        .eq("id", newSeasonId);

    return {
        oldSeasonId,
        newSeasonId,
        playersAffected: progressions.length,
        rewardsDistributed,
        transitionDate: new Date(),
    };
}
