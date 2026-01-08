/**
 * Quest Progress API Route
 * Endpoint: POST /api/quests/progress
 * Updates quest progress based on game events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import {
    canApplyProgress,
    calculateNewProgress,
    validateProgressEvent,
    mapGameEventToQuestProgress,
    type QuestProgressEvent,
} from '@/lib/quests/quest-validator';
import { getQuestTemplateById } from '@/lib/quests/quest-templates';
import { getTodayUTC } from '@/lib/quests/quest-generator';
import type { DailyQuest, QuestProgress } from '@/types/quest';

/**
 * Request body for updating quest progress
 */
interface UpdateProgressRequest {
    playerId: string;
    eventType: string;
    eventData: Record<string, unknown>;
}

/**
 * Response for progress update
 */
interface UpdateProgressResponse {
    success: boolean;
    updatedQuests: {
        questId: string;
        previousProgress: number;
        newProgress: number;
        targetProgress: number;
        isCompleted: boolean;
        justCompleted: boolean;
    }[];
    completedCount: number;
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
 * POST /api/quests/progress
 * Update quest progress based on game events
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<UpdateProgressResponse | ApiErrorResponse>> {
    try {
        const body = await request.json() as UpdateProgressRequest;
        const { playerId, eventType, eventData } = body;

        // Validate required fields
        if (!playerId) {
            throw Errors.badRequest('playerId is required');
        }

        if (!isValidKaspaAddress(playerId)) {
            throw Errors.invalidAddress(playerId);
        }

        if (!eventType) {
            throw Errors.badRequest('eventType is required');
        }

        // Map game event to quest progress event
        const progressEvent = mapGameEventToQuestProgress(playerId, eventType, eventData || {});

        if (!progressEvent) {
            // Event type doesn't affect quests, return success with no updates
            return NextResponse.json({
                success: true,
                updatedQuests: [],
                completedCount: 0,
            });
        }

        // Validate the progress event
        const validation = validateProgressEvent(progressEvent);
        if (!validation.valid) {
            throw Errors.badRequest(validation.reason || 'Invalid progress event');
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

        if (fetchError) {
            console.error('Error fetching quests:', fetchError);
            throw Errors.badRequest('Failed to fetch quests');
        }

        if (!questRows || questRows.length === 0) {
            return NextResponse.json({
                success: true,
                updatedQuests: [],
                completedCount: 0,
            });
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
        const updatedQuests: UpdateProgressResponse['updatedQuests'] = [];
        let completedCount = 0;

        for (const quest of quests) {
            if (canApplyProgress(quest, progressEvent)) {
                const result = calculateNewProgress(quest, progressEvent);

                // Update the quest in database
                const { error: updateError } = await supabase
                    .from('daily_quests')
                    .update({
                        current_progress: result.newProgress,
                        is_completed: result.isCompleted,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', quest.id);

                if (updateError) {
                    console.error('Error updating quest progress:', updateError);
                    continue;
                }

                updatedQuests.push(result);

                if (result.justCompleted) {
                    completedCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            updatedQuests,
            completedCount,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
