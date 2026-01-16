/**
 * Achievements Unlock API Route
 * POST /api/achievements/unlock - Unlock an achievement and award rewards
 * Task: T117 [P] [US8]
 * 
 * Fixed: Now verifies player has actually met achievement requirements
 * by checking real player stats from game data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import { getAchievementById } from '@/lib/achievements/achievement-definitions';
import { fetchPlayerStats } from '@/lib/achievements/player-stats-fetcher';
import type { PlayerStats } from '@/lib/achievements/achievement-tracker';
import { calculateTierFromXP, calculateTierProgress, applyPrestigeMultiplier } from '@/lib/progression/xp-calculator';

interface UnlockRequest {
    playerId: string;
    achievementId: string;
}

interface UnlockResponse {
    success: boolean;
    achievementId: string;
    xpAwarded: number;
    currencyAwarded: number;
    badgeAwarded?: string;
    newBalance?: number;
}

function isValidKaspaAddress(address: string): boolean {
    return (
        typeof address === 'string' &&
        (address.startsWith('kaspa:') || address.startsWith('kaspatest:')) &&
        address.length >= 40
    );
}

export async function POST(
    request: NextRequest
): Promise<NextResponse<UnlockResponse | ApiErrorResponse>> {
    try {
        const body: UnlockRequest = await request.json();
        const { playerId, achievementId } = body;

        if (!playerId || !achievementId) {
            throw Errors.badRequest('playerId and achievementId are required');
        }

        if (!isValidKaspaAddress(playerId)) {
            throw Errors.invalidAddress(playerId);
        }

        const achievement = getAchievementById(achievementId);
        if (!achievement) {
            throw Errors.badRequest('Achievement not found');
        }

        const supabase = createSupabaseAdminClient() as any;

        // Ensure player exists in the players table (required for foreign key)
        // Use upsert with onConflict to handle existing players
        console.log(`[unlock] Ensuring player ${playerId} exists in players table...`);
        const { error: playerUpsertError } = await supabase
            .from('players')
            .upsert(
                { address: playerId },
                { onConflict: 'address' }
            );

        if (playerUpsertError) {
            console.error('[unlock] Error ensuring player exists:', playerUpsertError);
            throw Errors.badRequest(`Failed to create player record: ${playerUpsertError.message || 'Database error'}`);
        }
        console.log(`[unlock] Player record ensured`);

        // Check if already unlocked
        const { data: existing } = await supabase
            .from('player_achievements')
            .select('*')
            .eq('player_id', playerId)
            .eq('achievement_id', achievementId)
            .eq('is_unlocked', true)
            .single();

        if (existing) {
            throw Errors.badRequest('Achievement already unlocked');
        }

        // Fetch player's actual stats from game data
        console.log(`[unlock] Fetching player stats for ${playerId}...`);
        const playerStats = await fetchPlayerStats(supabase, playerId);
        
        // Verify player has met the achievement requirements
        const trackingKey = achievement.requirement.trackingKey as keyof PlayerStats;
        const currentProgress = playerStats[trackingKey] || 0;
        const targetProgress = achievement.requirement.targetValue || 1;
        
        console.log(`[unlock] Achievement ${achievementId} (${achievement.name}): trackingKey=${trackingKey}, progress=${currentProgress}/${targetProgress}`);
        console.log(`[unlock] Full player stats for ${playerId}:`, JSON.stringify(playerStats, null, 2));
        
        if (currentProgress < targetProgress) {
            const errorMsg = `Achievement "${achievement.name}" requirements not met. Your ${trackingKey}: ${currentProgress}/${targetProgress}`;
            console.log(`[unlock] REJECTED: ${errorMsg}`);
            throw Errors.badRequest(errorMsg);
        }
        
        console.log(`[unlock] APPROVED: Unlocking achievement ${achievementId} for ${playerId}`);

        // Upsert player achievement as unlocked
        console.log(`[unlock] Upserting achievement record...`);
        const { error: upsertError } = await supabase
            .from('player_achievements')
            .upsert({
                player_id: playerId,
                achievement_id: achievementId,
                current_progress: currentProgress,
                target_progress: targetProgress,
                is_unlocked: true,
                unlocked_at: new Date().toISOString(),
            }, { onConflict: 'player_id,achievement_id' });

        if (upsertError) {
            console.error('[unlock] Error unlocking achievement:', upsertError);
            throw Errors.badRequest(`Failed to unlock achievement: ${upsertError.message || upsertError.code || 'Database error'}`);
        }
        
        console.log(`[unlock] Achievement record upserted successfully`);

        // Award currency
        let newBalance = 0;
        if (achievement.currencyReward > 0) {
            const { data: currencyData, error: currencyError } = await supabase
                .from('player_currency')
                .select('clash_shards')
                .eq('player_id', playerId)
                .single();

            const currentShards = currencyData?.clash_shards || 0;
            newBalance = currentShards + achievement.currencyReward;

            await supabase
                .from('player_currency')
                .upsert({
                    player_id: playerId,
                    clash_shards: newBalance,
                    total_earned: (currencyData?.total_earned || 0) + achievement.currencyReward,
                }, { onConflict: 'player_id' });

            // Log transaction
            await supabase.from('currency_transactions').insert({
                player_id: playerId,
                amount: achievement.currencyReward,
                transaction_type: 'earn',
                source: `achievement_${achievementId}`,
                balance_before: currentShards,
                balance_after: newBalance,
                metadata: { achievementId, achievementName: achievement.name },
            });
        }

        // Award XP if there's an XP reward
        if (achievement.xpReward > 0) {
            // Get current active season
            const { data: season } = await supabase
                .from('battle_pass_seasons')
                .select('*')
                .eq('is_active', true)
                .single();

            if (season) {
                // Get or create player progression
                let { data: progression } = await supabase
                    .from('player_progression')
                    .select('*')
                    .eq('player_id', playerId)
                    .eq('season_id', season.id)
                    .single();

                if (!progression) {
                    // Create default progression
                    const { data: newProgression } = await supabase
                        .from('player_progression')
                        .insert({
                            player_id: playerId,
                            season_id: season.id,
                            current_tier: 1,
                            current_xp: 0,
                            total_xp: 0,
                            prestige_level: 0,
                            prestige_xp_multiplier: 1.0,
                            prestige_currency_multiplier: 1.0,
                        })
                        .select()
                        .single();

                    progression = newProgression;
                }

                if (progression) {
                    // Apply prestige multiplier
                    const finalXP = applyPrestigeMultiplier(achievement.xpReward, progression.prestige_level);
                    const newTotalXP = progression.total_xp + finalXP;
                    const newTier = Math.min(50, calculateTierFromXP(newTotalXP));
                    const tierProgress = calculateTierProgress(newTotalXP, newTier);

                    // Update progression
                    await supabase
                        .from('player_progression')
                        .update({
                            current_tier: newTier,
                            current_xp: tierProgress.currentXP,
                            total_xp: newTotalXP,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', progression.id);

                    // Record XP award
                    await supabase.from('xp_awards').insert({
                        player_id: playerId,
                        season_id: season.id,
                        amount: achievement.xpReward,
                        source: 'achievement',
                        source_id: achievementId,
                        multiplier: progression.prestige_level > 0 ? Math.pow(1.1, progression.prestige_level) : 1.0,
                    });
                }
            }
        }

        // Update achievement statistics
        try {
            const { error: statsError } = await supabase.rpc('increment_achievement_stats', {
                p_player_id: playerId,
                p_category: achievement.category,
                p_xp: achievement.xpReward,
                p_currency: achievement.currencyReward,
            });

            if (statsError) {
                console.warn('increment_achievement_stats RPC failed:', statsError);
            }
        } catch (statsError) {
            // RPC may not exist or failed; skip silently
            console.warn('increment_achievement_stats RPC threw:', statsError);
        }

        return NextResponse.json({
            success: true,
            achievementId,
            xpAwarded: achievement.xpReward,
            currencyAwarded: achievement.currencyReward,
            badgeAwarded: achievement.badgeReward,
            newBalance,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
