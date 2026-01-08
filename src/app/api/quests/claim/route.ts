/**
 * Quest Claim API Route
 * Endpoint: POST /api/quests/claim
 * Claims rewards for completed quests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import { canClaimQuest, getQuestRewards, calculateStreakBonus } from '@/lib/quests/quest-validator';
import { getQuestTemplateById } from '@/lib/quests/quest-templates';
import { CURRENCY_SOURCES } from '@/lib/progression/currency-utils';
import { getTodayUTC } from '@/lib/quests/quest-generator';

/**
 * Request body for claiming quest
 */
interface ClaimQuestRequest {
    playerId: string;
    questId: string;
}

/**
 * Response for quest claim
 */
interface ClaimQuestResponse {
    success: boolean;
    questId: string;
    rewards: {
        xp: number;
        currency: number;
    };
    streakBonus?: {
        bonusXP: number;
        bonusCurrency: number;
        newStreak: number;
    };
    allQuestsCompleted: boolean;
    allQuestsClaimed: boolean;
}

/**
 * Validate Kaspa address format
 */
function isValidKaspaAddress(address: string): boolean {
    return (
        typeof address === 'string' &&
        (address.startsWith('kaspa:') || address.startsWith('kaspatest:')) &&
        address.length >= 40
    );
}

/**
 * POST /api/quests/claim
 * Claim rewards for a completed quest
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ClaimQuestResponse | ApiErrorResponse>> {
    try {
        const body = await request.json() as ClaimQuestRequest;
        const { playerId, questId } = body;

        // Validate required fields
        if (!playerId) {
            throw Errors.badRequest('playerId is required');
        }

        if (!isValidKaspaAddress(playerId)) {
            throw Errors.invalidAddress(playerId);
        }

        if (!questId) {
            throw Errors.badRequest('questId is required');
        }

        const supabase = createSupabaseAdminClient() as any;

        // Fetch the quest
        const { data: questRow, error: fetchError } = await supabase
            .from('daily_quests')
            .select('*')
            .eq('id', questId)
            .eq('player_id', playerId)
            .single();

        if (fetchError || !questRow) {
            throw Errors.notFound('Quest not found');
        }

        // Get template
        const template = getQuestTemplateById(questRow.template_id);
        if (!template) {
            throw Errors.badRequest('Quest template not found');
        }

        // Build DailyQuest object for validation
        const quest = {
            id: questRow.id,
            playerId: questRow.player_id,
            templateId: questRow.template_id,
            template,
            assignedDate: new Date(questRow.assigned_date),
            expiresAt: new Date(questRow.expires_at),
            currentProgress: questRow.current_progress,
            targetProgress: questRow.target_progress,
            isCompleted: questRow.is_completed,
            isClaimed: questRow.is_claimed,
            claimedAt: questRow.claimed_at ? new Date(questRow.claimed_at) : undefined,
        };

        // Validate claim eligibility
        const claimValidation = canClaimQuest(quest);
        if (!claimValidation.valid) {
            throw Errors.badRequest(claimValidation.reason || 'Cannot claim quest');
        }

        // Get rewards
        const rewards = getQuestRewards(quest);

        // Mark quest as claimed
        const { error: updateError } = await supabase
            .from('daily_quests')
            .update({
                is_claimed: true,
                claimed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', questId);

        if (updateError) {
            throw Errors.badRequest('Failed to claim quest');
        }

        // Award XP via progression system
        try {
            const xpResponse = await fetch(new URL('/api/progression/award-xp', request.url).toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId,
                    amount: rewards.xp,
                    source: 'daily_quest',
                    sourceId: questId,
                }),
            });

            if (!xpResponse.ok) {
                console.error('Failed to award XP:', await xpResponse.text());
            }
        } catch (xpError) {
            console.error('Error awarding XP:', xpError);
        }

        // Award currency
        if (rewards.currency > 0) {
            // Get current currency balance
            const { data: currencyData } = await supabase
                .from('player_currency')
                .select('*')
                .eq('player_id', playerId)
                .single();

            const currentBalance = currencyData?.clash_shards || 0;
            const newBalance = currentBalance + rewards.currency;

            if (currencyData) {
                await supabase
                    .from('player_currency')
                    .update({
                        clash_shards: newBalance,
                        total_earned: (currencyData.total_earned || 0) + rewards.currency,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('player_id', playerId);
            } else {
                await supabase.from('player_currency').insert({
                    player_id: playerId,
                    clash_shards: rewards.currency,
                    total_earned: rewards.currency,
                    total_spent: 0,
                });
            }

            // Record currency transaction
            await supabase.from('currency_transactions').insert({
                player_id: playerId,
                amount: rewards.currency,
                transaction_type: 'earn',
                source: CURRENCY_SOURCES.QUEST_CLAIM,
                balance_before: currentBalance,
                balance_after: newBalance,
                metadata: { quest_id: questId, template_id: template.id },
            });
        }

        // Get today's date for checking all quests
        const today = getTodayUTC();
        const todayStr = today.toISOString().split('T')[0];

        // Check if all daily quests are now claimed
        const { data: allQuests } = await supabase
            .from('daily_quests')
            .select('is_completed, is_claimed')
            .eq('player_id', playerId)
            .eq('assigned_date', todayStr);

        const allCompleted = allQuests?.every((q: any) => q.is_completed) || false;
        const allClaimed = allQuests?.every((q: any) => q.is_claimed) || false;

        // Update quest statistics
        const { data: stats } = await supabase
            .from('quest_statistics')
            .select('*')
            .eq('player_id', playerId)
            .single();

        let streakBonus;

        if (stats) {
            const updates: any = {
                total_quests_completed: (stats.total_quests_completed || 0) + 1,
                total_quests_claimed: (stats.total_quests_claimed || 0) + 1,
                total_xp_earned: (stats.total_xp_earned || 0) + rewards.xp,
                total_currency_earned: (stats.total_currency_earned || 0) + rewards.currency,
                updated_at: new Date().toISOString(),
            };

            // Check for streak bonus
            if (allClaimed && allCompleted) {
                const bonus = calculateStreakBonus(stats.current_streak || 0, true);
                updates.current_streak = bonus.newStreak;
                updates.longest_streak = Math.max(stats.longest_streak || 0, bonus.newStreak);
                updates.last_quest_date = todayStr;

                if (bonus.bonusXP > 0 || bonus.bonusCurrency > 0) {
                    streakBonus = {
                        bonusXP: bonus.bonusXP,
                        bonusCurrency: bonus.bonusCurrency,
                        newStreak: bonus.newStreak,
                    };

                    // Award streak bonus XP and currency
                    if (bonus.bonusXP > 0) {
                        try {
                            await fetch(new URL('/api/progression/award-xp', request.url).toString(), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    playerId,
                                    amount: bonus.bonusXP,
                                    source: 'daily_quest',
                                    sourceId: `streak_${bonus.newStreak}`,
                                }),
                            });
                        } catch (e) {
                            console.error('Failed to award streak XP:', e);
                        }
                    }

                    if (bonus.bonusCurrency > 0) {
                        const { data: currentCurrency } = await supabase
                            .from('player_currency')
                            .select('clash_shards, total_earned')
                            .eq('player_id', playerId)
                            .single();

                        const balanceBefore = currentCurrency?.clash_shards || 0;
                        await supabase
                            .from('player_currency')
                            .update({
                                clash_shards: balanceBefore + bonus.bonusCurrency,
                                total_earned: (currentCurrency?.total_earned || 0) + bonus.bonusCurrency,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('player_id', playerId);
                    }
                }
            }

            await supabase
                .from('quest_statistics')
                .update(updates)
                .eq('player_id', playerId);
        } else {
            // Create new stats record
            await supabase.from('quest_statistics').insert({
                player_id: playerId,
                total_quests_completed: 1,
                total_quests_claimed: 1,
                total_xp_earned: rewards.xp,
                total_currency_earned: rewards.currency,
                current_streak: allClaimed ? 1 : 0,
                longest_streak: allClaimed ? 1 : 0,
                last_quest_date: allClaimed ? todayStr : null,
            });
        }

        return NextResponse.json({
            success: true,
            questId,
            rewards,
            streakBonus,
            allQuestsCompleted: allCompleted,
            allQuestsClaimed: allClaimed,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
