/**
 * Daily Quests API Route
 * Endpoint: GET /api/quests/daily
 * Fetches player's current daily quests, generating new ones if needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import { generateDailyQuests, getTodayUTC, isQuestSetForToday } from '@/lib/quests/quest-generator';
import { getQuestTemplateById, ALL_QUEST_TEMPLATES } from '@/lib/quests/quest-templates';
import type { DailyQuest } from '@/types/quest';

/**
 * Response for daily quests
 */
interface DailyQuestsResponse {
    success: boolean;
    quests: DailyQuest[];
    resetTime: string;
    statistics: {
        totalCompleted: number;
        totalClaimed: number;
        currentStreak: number;
    };
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
 * GET /api/quests/daily
 * Fetch player's daily quests
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<DailyQuestsResponse | ApiErrorResponse>> {
    try {
        const { searchParams } = new URL(request.url);
        const playerId = searchParams.get('playerId');

        if (!playerId) {
            throw Errors.badRequest('playerId is required');
        }

        if (!isValidKaspaAddress(playerId)) {
            throw Errors.invalidAddress(playerId);
        }

        const supabase = createSupabaseAdminClient() as any;

        // Get today's date range
        const today = getTodayUTC();
        const todayStr = today.toISOString().split('T')[0];

        // Fetch existing quests for today
        const { data: existingQuests, error: fetchError } = await supabase
            .from('daily_quests')
            .select('*')
            .eq('player_id', playerId)
            .eq('assigned_date', todayStr);

        if (fetchError) {
            console.error('Error fetching quests:', fetchError);
            throw Errors.badRequest('Failed to fetch daily quests');
        }

        let quests: DailyQuest[] = [];

        if (existingQuests && existingQuests.length > 0) {
            // Map database rows to DailyQuest format
            quests = existingQuests.map((row: any) => {
                // Get template from hardcoded list
                const template = getQuestTemplateById(row.template_id);
                return {
                    id: row.id,
                    playerId: row.player_id,
                    templateId: row.template_id,
                    template: template || {
                        id: row.template_id,
                        title: 'Unknown Quest',
                        description: 'Quest template not found',
                        objectiveType: 'play_matches' as const,
                        targetValue: row.target_progress,
                        difficulty: 'easy' as const,
                        xpReward: 500,
                        currencyReward: 25,
                        isActive: false,
                    },
                    assignedDate: new Date(row.assigned_date),
                    expiresAt: new Date(row.expires_at),
                    currentProgress: row.current_progress,
                    targetProgress: row.target_progress,
                    isCompleted: row.is_completed,
                    isClaimed: row.is_claimed,
                    claimedAt: row.claimed_at ? new Date(row.claimed_at) : undefined,
                };
            });
        } else {
            // Generate new quests for today
            const generatedSet = generateDailyQuests(playerId, [], today);

            // Insert quests into database
            const questsToInsert = generatedSet.quests.map(({ template, expiresAt }) => ({
                player_id: playerId,
                template_id: template.id,
                assigned_date: todayStr,
                expires_at: expiresAt.toISOString(),
                current_progress: 0,
                target_progress: template.targetValue,
                is_completed: false,
                is_claimed: false,
            }));

            const { data: insertedQuests, error: insertError } = await supabase
                .from('daily_quests')
                .insert(questsToInsert)
                .select();

            if (insertError) {
                console.error('Error inserting quests:', insertError);
                throw Errors.badRequest('Failed to generate daily quests');
            }

            // Map inserted rows to DailyQuest format
            quests = insertedQuests.map((row: any, index: number) => {
                const template = generatedSet.quests[index].template;
                return {
                    id: row.id,
                    playerId: row.player_id,
                    templateId: row.template_id,
                    template,
                    assignedDate: new Date(row.assigned_date),
                    expiresAt: new Date(row.expires_at),
                    currentProgress: row.current_progress,
                    targetProgress: row.target_progress,
                    isCompleted: row.is_completed,
                    isClaimed: row.is_claimed,
                };
            });
        }

        // Fetch quest statistics
        const { data: stats } = await supabase
            .from('quest_statistics')
            .select('*')
            .eq('player_id', playerId)
            .single();

        // Calculate reset time (midnight UTC)
        const resetTime = new Date(today);
        resetTime.setUTCDate(resetTime.getUTCDate() + 1);

        return NextResponse.json({
            success: true,
            quests,
            resetTime: resetTime.toISOString(),
            statistics: {
                totalCompleted: stats?.total_quests_completed || 0,
                totalClaimed: stats?.total_quests_claimed || 0,
                currentStreak: stats?.current_streak || 0,
            },
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
