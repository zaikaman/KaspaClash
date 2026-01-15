/**
 * Achievements Progress API Route
 * GET /api/achievements/progress - Fetch player achievement statistics
 * Task: T118 [P] [US8]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import { ALL_ACHIEVEMENTS, getAchievementsByCategory } from '@/lib/achievements/achievement-definitions';
import type { PlayerAchievementSummary, AchievementCategoryStats, AchievementCategory } from '@/types/achievement';

interface ProgressResponse {
    success: boolean;
    summary: PlayerAchievementSummary;
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
): Promise<NextResponse<ProgressResponse | ApiErrorResponse>> {
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

        // Fetch player achievements
        const { data: playerAchievements, error: fetchError } = await supabase
            .from('player_achievements')
            .select('*')
            .eq('player_id', playerId);

        if (fetchError) {
            console.error('Error fetching achievements:', fetchError);
            throw Errors.badRequest('Failed to fetch achievement progress');
        }

        // Build unlocked set
        const unlockedIds = new Set<string>();
        (playerAchievements || []).forEach((pa: any) => {
            if (pa.is_unlocked) {
                unlockedIds.add(pa.achievement_id);
            }
        });

        // Calculate category stats
        const categories: AchievementCategory[] = ['combat', 'progression', 'social', 'collection', 'mastery'];
        const categoryStats: AchievementCategoryStats[] = categories.map((category) => {
            const catAchievements = getAchievementsByCategory(category);
            const unlocked = catAchievements.filter((a) => unlockedIds.has(a.id));

            return {
                category,
                totalAchievements: catAchievements.length,
                unlockedAchievements: unlocked.length,
                progressPercentage: catAchievements.length > 0
                    ? (unlocked.length / catAchievements.length) * 100
                    : 0,
                xpEarned: unlocked.reduce((sum, a) => sum + a.xpReward, 0),
                currencyEarned: unlocked.reduce((sum, a) => sum + a.currencyReward, 0),
            };
        });

        // Calculate totals
        const totalXPEarned = categoryStats.reduce((sum, cat) => sum + cat.xpEarned, 0);
        const totalCurrencyEarned = categoryStats.reduce((sum, cat) => sum + cat.currencyEarned, 0);

        // Get recent unlocks (last 5)
        const recentUnlocks = (playerAchievements || [])
            .filter((pa: any) => pa.is_unlocked)
            .sort((a: any, b: any) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
            .slice(0, 5)
            .map((pa: any) => {
                const achievement = ALL_ACHIEVEMENTS.find((a) => a.id === pa.achievement_id);
                return achievement ? {
                    playerId,
                    achievementId: pa.achievement_id,
                    achievement,
                    currentProgress: pa.current_progress,
                    targetProgress: pa.target_progress,
                    isUnlocked: true,
                    unlockedAt: new Date(pa.unlocked_at),
                    progressPercentage: 100,
                } : null;
            })
            .filter(Boolean);

        const summary: PlayerAchievementSummary = {
            playerId,
            totalAchievements: ALL_ACHIEVEMENTS.length,
            unlockedAchievements: unlockedIds.size,
            totalXPEarned,
            totalCurrencyEarned,
            categoryStats,
            recentUnlocks: recentUnlocks as any,
            nextMilestones: [], // Could add logic to find closest achievements
        };

        return NextResponse.json({
            success: true,
            summary,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
