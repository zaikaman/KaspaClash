/**
 * Achievements Unlock API Route
 * POST /api/achievements/unlock - Unlock an achievement and award rewards
 * Task: T117 [P] [US8]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import { getAchievementById } from '@/lib/achievements/achievement-definitions';

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

        // Upsert player achievement as unlocked
        const { error: upsertError } = await supabase
            .from('player_achievements')
            .upsert({
                player_id: playerId,
                achievement_id: achievementId,
                current_progress: achievement.requirement.targetValue || 1,
                target_progress: achievement.requirement.targetValue || 1,
                is_unlocked: true,
                unlocked_at: new Date().toISOString(),
            }, { onConflict: 'player_id,achievement_id' });

        if (upsertError) {
            console.error('Error unlocking achievement:', upsertError);
            throw Errors.badRequest('Failed to unlock achievement');
        }

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

        // Update achievement statistics
        await supabase.rpc('increment_achievement_stats', {
            p_player_id: playerId,
            p_category: achievement.category,
            p_xp: achievement.xpReward,
            p_currency: achievement.currencyReward,
        }).catch(() => {
            // RPC may not exist, skip silently
        });

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
