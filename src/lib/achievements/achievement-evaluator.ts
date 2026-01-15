/**
 * Achievement Evaluator
 * Server-side evaluation of achievement completion and reward processing
 * Task: T114 [US8]
 */

import type { Achievement, AchievementUnlock } from '@/types/achievement';
import { getAchievementById, ALL_ACHIEVEMENTS } from './achievement-definitions';
import { calculateProgress, isComplete, type PlayerStats } from './achievement-tracker';

/** Evaluation result for a single achievement */
export interface EvaluationResult {
    achievementId: string;
    isEligible: boolean;
    currentProgress: number;
    targetProgress: number;
    progressPercentage: number;
}

/** Unlock result with rewards */
export interface UnlockResult {
    success: boolean;
    achievement: Achievement;
    xpAwarded: number;
    currencyAwarded: number;
    badgeAwarded?: string;
    error?: string;
}

/**
 * Evaluate a single achievement for unlock eligibility
 */
export function evaluateAchievement(
    achievementId: string,
    stats: PlayerStats,
    alreadyUnlocked: Set<string>
): EvaluationResult | null {
    const achievement = getAchievementById(achievementId);
    if (!achievement) return null;

    const current = calculateProgress(achievement, stats);
    const target = achievement.requirement.targetValue ?? 1;

    return {
        achievementId,
        isEligible: !alreadyUnlocked.has(achievementId) && current >= target,
        currentProgress: current,
        targetProgress: target,
        progressPercentage: Math.min(100, (current / target) * 100),
    };
}

/**
 * Evaluate all achievements and find eligible unlocks
 */
export function evaluateAllAchievements(
    stats: PlayerStats,
    alreadyUnlocked: Set<string>
): EvaluationResult[] {
    return ALL_ACHIEVEMENTS
        .map((a) => evaluateAchievement(a.id, stats, alreadyUnlocked))
        .filter((r): r is EvaluationResult => r !== null);
}

/**
 * Find all achievements that can be unlocked
 */
export function findEligibleUnlocks(
    stats: PlayerStats,
    alreadyUnlocked: Set<string>
): Achievement[] {
    return ALL_ACHIEVEMENTS.filter(
        (a) => !alreadyUnlocked.has(a.id) && isComplete(a, stats)
    );
}

/**
 * Calculate rewards for unlocking an achievement
 */
export function calculateUnlockRewards(achievement: Achievement): {
    xp: number;
    currency: number;
    badge?: string;
} {
    return {
        xp: achievement.xpReward,
        currency: achievement.currencyReward,
        badge: achievement.badgeReward,
    };
}

/**
 * Process an achievement unlock (validation + rewards)
 */
export function processUnlock(
    achievementId: string,
    playerId: string,
    stats: PlayerStats,
    alreadyUnlocked: Set<string>
): UnlockResult {
    const achievement = getAchievementById(achievementId);

    if (!achievement) {
        return {
            success: false,
            achievement: null as any,
            xpAwarded: 0,
            currencyAwarded: 0,
            error: 'Achievement not found',
        };
    }

    if (alreadyUnlocked.has(achievementId)) {
        return {
            success: false,
            achievement,
            xpAwarded: 0,
            currencyAwarded: 0,
            error: 'Achievement already unlocked',
        };
    }

    if (!isComplete(achievement, stats)) {
        return {
            success: false,
            achievement,
            xpAwarded: 0,
            currencyAwarded: 0,
            error: 'Achievement requirements not met',
        };
    }

    const rewards = calculateUnlockRewards(achievement);

    return {
        success: true,
        achievement,
        xpAwarded: rewards.xp,
        currencyAwarded: rewards.currency,
        badgeAwarded: rewards.badge,
    };
}

/**
 * Create an unlock event record
 */
export function createUnlockEvent(
    playerId: string,
    unlockResult: UnlockResult
): AchievementUnlock | null {
    if (!unlockResult.success) return null;

    return {
        playerId,
        achievementId: unlockResult.achievement.id,
        unlockedAt: new Date(),
        xpAwarded: unlockResult.xpAwarded,
        currencyAwarded: unlockResult.currencyAwarded,
        badgeAwarded: unlockResult.badgeAwarded,
    };
}

/**
 * Batch evaluate and process multiple achievements
 */
export function batchProcessUnlocks(
    playerId: string,
    stats: PlayerStats,
    alreadyUnlocked: Set<string>
): UnlockResult[] {
    const eligible = findEligibleUnlocks(stats, alreadyUnlocked);
    return eligible.map((a) => processUnlock(a.id, playerId, stats, alreadyUnlocked));
}
