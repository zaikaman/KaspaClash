/**
 * Quest Service
 * Handles quest progress tracking and integration with game events
 */

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getQuestTemplateById } from './quest-templates';
import { getTodayUTC } from './quest-generator';
import {
    mapGameEventToQuestProgress,
    canApplyProgress,
    calculateNewProgress,
    validateProgressEvent,
} from './quest-validator';
import type { DailyQuest } from '@/types/quest';

/**
 * Track quest progress for a game event
 */
export async function trackQuestProgress(
    playerId: string,
    eventType: string,
    eventData: Record<string, unknown>
): Promise<{
    success: boolean;
    updatedQuests: { questId: string; newProgress: number; isCompleted: boolean }[];
    completedCount: number;
}> {
    try {
        // Map game event to quest progress event
        const progressEvent = mapGameEventToQuestProgress(playerId, eventType, eventData);

        if (!progressEvent) {
            return { success: true, updatedQuests: [], completedCount: 0 };
        }

        // Validate the progress event
        const validation = validateProgressEvent(progressEvent);
        if (!validation.valid) {
            console.warn(`Invalid quest progress event: ${validation.reason}`);
            return { success: false, updatedQuests: [], completedCount: 0 };
        }

        const supabase = createSupabaseAdminClient() as any;

        // Get today's quests for the player
        const today = getTodayUTC();
        const todayStr = today.toISOString().split('T')[0];

        const { data: questRows, error: fetchError } = await supabase
            .from('daily_quests')
            .select('*')
            .eq('player_id', playerId)
            .eq('assigned_date', todayStr)
            .eq('is_claimed', false);

        if (fetchError || !questRows || questRows.length === 0) {
            return { success: true, updatedQuests: [], completedCount: 0 };
        }

        // Convert rows to DailyQuest objects
        const quests: DailyQuest[] = questRows.map((row: any) => {
            const template = getQuestTemplateById(row.template_id);
            return {
                id: row.id,
                playerId: row.player_id,
                templateId: row.template_id,
                template: template || {
                    id: row.template_id,
                    title: 'Unknown',
                    description: '',
                    objectiveType: 'play_matches' as const,
                    targetValue: row.target_progress,
                    difficulty: 'easy' as const,
                    xpReward: 0,
                    currencyReward: 0,
                    isActive: false,
                },
                assignedDate: new Date(row.assigned_date),
                expiresAt: new Date(row.expires_at),
                currentProgress: row.current_progress,
                targetProgress: row.target_progress,
                isCompleted: row.is_completed,
                isClaimed: row.is_claimed,
            };
        });

        // Find quests that can receive progress from this event
        // Collect all updates to batch them
        const updatedQuests: { questId: string; newProgress: number; isCompleted: boolean }[] = [];
        const pendingUpdates: { id: string; current_progress: number; is_completed: boolean }[] = [];
        let completedCount = 0;

        for (const quest of quests) {
            if (canApplyProgress(quest, progressEvent)) {
                const result = calculateNewProgress(quest, progressEvent);

                pendingUpdates.push({
                    id: quest.id,
                    current_progress: result.newProgress,
                    is_completed: result.isCompleted,
                });

                updatedQuests.push({
                    questId: quest.id,
                    newProgress: result.newProgress,
                    isCompleted: result.isCompleted,
                });

                if (result.justCompleted) {
                    completedCount++;
                }
            }
        }

        // Batch update all quests in parallel instead of sequentially
        if (pendingUpdates.length > 0) {
            const updatePromises = pendingUpdates.map(update =>
                supabase
                    .from('daily_quests')
                    .update({
                        current_progress: update.current_progress,
                        is_completed: update.is_completed,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', update.id)
            );

            const results = await Promise.all(updatePromises);

            // Log any errors but don't fail the whole operation
            results.forEach((result, index) => {
                if (result.error) {
                    console.error(`Error updating quest ${pendingUpdates[index].id}:`, result.error);
                }
            });
        }

        return { success: true, updatedQuests, completedCount };
    } catch (error) {
        console.error('Error tracking quest progress:', error);
        return { success: false, updatedQuests: [], completedCount: 0 };
    }
}

/**
 * Track match completion event
 */
export async function trackMatchCompletion(
    playerId: string,
    matchId: string,
    isWin: boolean
): Promise<void> {
    // Track match played
    await trackQuestProgress(playerId, 'match_complete', { matchId, isWin });

    // Track win if applicable
    if (isWin) {
        await trackQuestProgress(playerId, 'match_win', { matchId, isWin: true });
    }
}

/**
 * Track damage dealt in a round
 */
export async function trackDamageDealt(
    playerId: string,
    matchId: string,
    damage: number
): Promise<void> {
    if (damage > 0) {
        await trackQuestProgress(playerId, 'damage_dealt', { matchId, damage });
    }
}

/**
 * Track ability used
 */
export async function trackAbilityUsed(
    playerId: string,
    matchId: string,
    abilityType: string
): Promise<void> {
    await trackQuestProgress(playerId, 'ability_used', { matchId, abilityType });
}

/**
 * Track opponent defeated (round win by KO)
 */
export async function trackOpponentDefeated(
    playerId: string,
    matchId: string
): Promise<void> {
    await trackQuestProgress(playerId, 'opponent_defeated', { matchId });
}

/**
 * Track combo executed
 */
export async function trackComboExecuted(
    playerId: string,
    matchId: string,
    comboLength: number
): Promise<void> {
    await trackQuestProgress(playerId, 'combo_executed', { matchId, comboLength });
}

/**
 * Track win streak update
 */
export async function trackWinStreak(
    playerId: string,
    matchId: string,
    streakLength: number
): Promise<void> {
    await trackQuestProgress(playerId, 'win_streak', { matchId, streakLength });
}
