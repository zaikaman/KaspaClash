/**
 * Achievements List API Route
 * GET /api/achievements/list - Fetch all achievements with player progress
 * Task: T116 [P] [US8]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import { ALL_ACHIEVEMENTS, getAchievementById } from '@/lib/achievements/achievement-definitions';
import type { PlayerAchievement } from '@/types/achievement';

interface AchievementsListResponse {
    success: boolean;
    achievements: PlayerAchievement[];
    totalCount: number;
    unlockedCount: number;
}

function isValidKaspaAddress(address: string): boolean {
    return (
        typeof address === 'string' &&
        (address.startsWith('kaspa:') || address.startsWith('kaspatest:')) &&
        address.length >= 40
    );
}

export async function GET(
    request: NextRequest
): Promise<NextResponse<AchievementsListResponse | ApiErrorResponse>> {
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

        // Fetch player's unlocked achievements
        const { data: playerAchievements, error: fetchError } = await supabase
            .from('player_achievements')
            .select('*')
            .eq('player_id', playerId);

        if (fetchError) {
            console.error('Error fetching achievements:', fetchError);
            throw Errors.badRequest('Failed to fetch achievements');
        }

        // Build unlocked set
        const unlockedMap = new Map<string, { unlockedAt: Date; progress: number }>();
        (playerAchievements || []).forEach((pa: any) => {
            if (pa.is_unlocked) {
                unlockedMap.set(pa.achievement_id, {
                    unlockedAt: new Date(pa.unlocked_at),
                    progress: pa.current_progress,
                });
            }
        });

        // Build progress map for in-progress achievements
        const progressMap = new Map<string, number>();
        (playerAchievements || []).forEach((pa: any) => {
            progressMap.set(pa.achievement_id, pa.current_progress || 0);
        });

        // Map all achievements with player progress
        const achievements: PlayerAchievement[] = ALL_ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlockedMap.has(achievement.id);
            const unlockData = unlockedMap.get(achievement.id);
            const currentProgress = progressMap.get(achievement.id) || 0;
            const targetProgress = achievement.requirement.targetValue || 1;

            return {
                playerId,
                achievementId: achievement.id,
                achievement,
                currentProgress: Math.min(currentProgress, targetProgress),
                targetProgress,
                isUnlocked,
                unlockedAt: unlockData?.unlockedAt,
                progressPercentage: Math.min(100, (currentProgress / targetProgress) * 100),
            };
        });

        const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

        return NextResponse.json({
            success: true,
            achievements,
            totalCount: achievements.length,
            unlockedCount,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
