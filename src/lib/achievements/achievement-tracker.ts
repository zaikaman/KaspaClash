/**
 * Achievement Tracker
 * Tracks player progress across all achievements
 * Task: T113 [US8]
 */

import type { Achievement, PlayerAchievement, AchievementCategory, AchievementCategoryStats } from '@/types/achievement';
import { ALL_ACHIEVEMENTS, getAchievementsByCategory } from './achievement-definitions';

/** Player statistics for achievement tracking */
export interface PlayerStats {
    total_wins: number;
    total_losses: number;
    total_combos: number;
    total_damage_dealt: number;
    total_blocks: number;
    perfect_rounds: number;
    perfect_matches: number;
    win_streak: number;
    max_win_streak: number;
    current_tier: number;
    total_xp: number;
    quests_completed: number;
    quest_streak: number;
    prestige_level: number;
    matches_played: number;
    unique_opponents: number;
    shop_purchases: number;
    cosmetics_owned: number;
    total_shards_earned: number;
    epic_or_legendary_owned: number;
    legendary_owned: number;
    max_survival_waves: number;
    achievements_unlocked: number;
    categories_completed: number;
    combat_bronze_unlocked: number;
}

/** Default player stats */
export const DEFAULT_PLAYER_STATS: PlayerStats = {
    total_wins: 0, total_losses: 0, total_combos: 0, total_damage_dealt: 0,
    total_blocks: 0, perfect_rounds: 0, perfect_matches: 0, win_streak: 0,
    max_win_streak: 0, current_tier: 1, total_xp: 0, quests_completed: 0,
    quest_streak: 0, prestige_level: 0, matches_played: 0, unique_opponents: 0,
    shop_purchases: 0, cosmetics_owned: 0, total_shards_earned: 0,
    epic_or_legendary_owned: 0, legendary_owned: 0, max_survival_waves: 0,
    achievements_unlocked: 0, categories_completed: 0, combat_bronze_unlocked: 0,
};

/** Calculate current progress for an achievement */
export function calculateProgress(achievement: Achievement, stats: PlayerStats): number {
    const key = achievement.requirement.trackingKey as keyof PlayerStats;
    return stats[key] ?? 0;
}

/** Check if achievement is complete */
export function isComplete(achievement: Achievement, stats: PlayerStats): boolean {
    return calculateProgress(achievement, stats) >= (achievement.requirement.targetValue ?? 0);
}

/** Get all player achievements with progress */
export function getPlayerAchievements(
    playerId: string, stats: PlayerStats, unlocked: Set<string>
): PlayerAchievement[] {
    return ALL_ACHIEVEMENTS.map((a) => {
        const current = calculateProgress(a, stats);
        const target = a.requirement.targetValue ?? 1;
        const isUnlocked = unlocked.has(a.id);
        return {
            playerId, achievementId: a.id, achievement: a,
            currentProgress: Math.min(current, target), targetProgress: target,
            isUnlocked, unlockedAt: isUnlocked ? new Date() : undefined,
            progressPercentage: Math.min(100, (current / target) * 100),
        };
    });
}

/** Find newly completed achievements */
export function findNewlyCompleted(stats: PlayerStats, unlocked: Set<string>): Achievement[] {
    return ALL_ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && isComplete(a, stats));
}

/** Get category statistics */
export function getCategoryStats(stats: PlayerStats, unlocked: Set<string>): AchievementCategoryStats[] {
    const categories: AchievementCategory[] = ['combat', 'progression', 'social', 'collection', 'mastery'];
    return categories.map((cat) => {
        const all = getAchievementsByCategory(cat);
        const unlockedList = all.filter((a) => unlocked.has(a.id));
        return {
            category: cat,
            totalAchievements: all.length,
            unlockedAchievements: unlockedList.length,
            progressPercentage: all.length > 0 ? (unlockedList.length / all.length) * 100 : 0,
            xpEarned: unlockedList.reduce((s, a) => s + a.xpReward, 0),
            currencyEarned: unlockedList.reduce((s, a) => s + a.currencyReward, 0),
        };
    });
}

/** Get completed categories count */
export function getCompletedCategoriesCount(unlocked: Set<string>): number {
    const categories: AchievementCategory[] = ['combat', 'progression', 'social', 'collection', 'mastery'];
    return categories.filter((cat) => getAchievementsByCategory(cat).every((a) => unlocked.has(a.id))).length;
}
