/**
 * Achievements List API Route
 * GET /api/achievements/list - Fetch all achievements with player progress
 * Task: T116 [P] [US8]
 * 
 * Fixed: Now fetches real player stats from game data sources
 * instead of only relying on player_achievements table
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import { ALL_ACHIEVEMENTS } from '@/lib/achievements/achievement-definitions';
import { fetchPlayerStats } from '@/lib/achievements/player-stats-fetcher';
import type { PlayerStats } from '@/lib/achievements/achievement-tracker';
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

        // Fetch player's unlocked achievements and real stats in parallel
        const [playerAchievementsResult, playerStats] = await Promise.all([
            supabase
                .from('player_achievements')
                .select('*')
                .eq('player_id', playerId),
            fetchPlayerStats(supabase, playerId),
        ]);

        const { data: playerAchievements, error: fetchError } = playerAchievementsResult;

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

        // Map all achievements with player progress from REAL stats
        const achievements: PlayerAchievement[] = ALL_ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlockedMap.has(achievement.id);
            const unlockData = unlockedMap.get(achievement.id);
            const targetProgress = achievement.requirement.targetValue || 1;
            
            // Get current progress from real player stats
            const trackingKey = achievement.requirement.trackingKey as keyof PlayerStats;
            const currentProgress = isUnlocked 
                ? targetProgress  // If unlocked, show as complete
                : Math.min(playerStats[trackingKey] || 0, targetProgress);

            return {
                playerId,
                achievementId: achievement.id,
                achievement,
                currentProgress,
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
