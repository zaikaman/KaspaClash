/**
 * Quest Validator
 * Server-side validation for quest completion and progress updates
 */

import type { QuestTemplate, QuestObjectiveType, DailyQuest } from '@/types/quest';
import { getQuestTemplateById } from './quest-templates';

/**
 * Quest progress event from game actions
 */
export interface QuestProgressEvent {
    playerId: string;
    objectiveType: QuestObjectiveType;
    value: number;
    metadata?: {
        matchId?: string;
        characterId?: string;
        abilityType?: string;
        isWin?: boolean;
        damage?: number;
    };
}

/**
 * Result of validating and applying quest progress
 */
export interface QuestProgressResult {
    questId: string;
    previousProgress: number;
    newProgress: number;
    targetProgress: number;
    isCompleted: boolean;
    justCompleted: boolean;
}

/**
 * Validate that a quest can receive progress for an event
 */
export function canApplyProgress(
    quest: DailyQuest,
    event: QuestProgressEvent
): boolean {
    // Quest must be active and not already claimed
    if (quest.isCompleted && quest.isClaimed) {
        return false;
    }

    // Quest must not be expired
    const expiresAt = typeof quest.expiresAt === 'string'
        ? new Date(quest.expiresAt)
        : quest.expiresAt;
    if (new Date() >= expiresAt) {
        return false;
    }

    // Objective type must match
    if (quest.template.objectiveType !== event.objectiveType) {
        return false;
    }

    return true;
}

/**
 * Calculate new progress for a quest based on an event
 */
export function calculateNewProgress(
    quest: DailyQuest,
    event: QuestProgressEvent
): QuestProgressResult {
    const previousProgress = quest.currentProgress;
    const targetProgress = quest.targetProgress;

    // Calculate new progress (capped at target)
    const newProgress = Math.min(previousProgress + event.value, targetProgress);
    const isCompleted = newProgress >= targetProgress;
    const justCompleted = isCompleted && !quest.isCompleted;

    return {
        questId: quest.id,
        previousProgress,
        newProgress,
        targetProgress,
        isCompleted,
        justCompleted,
    };
}

/**
 * Validate that a quest can be claimed
 */
export function canClaimQuest(quest: DailyQuest): {
    valid: boolean;
    reason?: string;
} {
    // Must be completed
    if (!quest.isCompleted) {
        return {
            valid: false,
            reason: 'Quest is not completed yet'
        };
    }

    // Must not be already claimed
    if (quest.isClaimed) {
        return {
            valid: false,
            reason: 'Quest rewards already claimed'
        };
    }

    // Must not be expired (with grace period for claiming)
    const expiresAt = typeof quest.expiresAt === 'string'
        ? new Date(quest.expiresAt)
        : quest.expiresAt;

    // Allow 1 hour grace period after expiry for claiming completed quests
    const gracePeriod = 60 * 60 * 1000; // 1 hour
    const claimDeadline = new Date(expiresAt.getTime() + gracePeriod);

    if (new Date() > claimDeadline) {
        return {
            valid: false,
            reason: 'Quest claim period has expired'
        };
    }

    return { valid: true };
}

/**
 * Get quest rewards for claiming
 */
export function getQuestRewards(quest: DailyQuest): {
    xp: number;
    currency: number;
} {
    return {
        xp: quest.template.xpReward,
        currency: quest.template.currencyReward,
    };
}

/**
 * Map game events to quest progress events
 */
export function mapGameEventToQuestProgress(
    playerId: string,
    eventType: string,
    eventData: Record<string, unknown>
): QuestProgressEvent | null {
    switch (eventType) {
        case 'match_complete':
            return {
                playerId,
                objectiveType: 'play_matches',
                value: 1,
                metadata: {
                    matchId: eventData.matchId as string,
                    isWin: eventData.isWin as boolean,
                },
            };

        case 'match_win':
            return {
                playerId,
                objectiveType: 'win_matches',
                value: 1,
                metadata: {
                    matchId: eventData.matchId as string,
                    isWin: true,
                },
            };

        case 'damage_dealt':
            return {
                playerId,
                objectiveType: 'deal_damage',
                value: eventData.damage as number,
                metadata: {
                    matchId: eventData.matchId as string,
                    damage: eventData.damage as number,
                },
            };

        case 'opponent_defeated':
            return {
                playerId,
                objectiveType: 'defeat_opponents',
                value: 1,
                metadata: {
                    matchId: eventData.matchId as string,
                },
            };

        case 'ability_used':
            return {
                playerId,
                objectiveType: 'use_ability',
                value: 1,
                metadata: {
                    matchId: eventData.matchId as string,
                    abilityType: eventData.abilityType as string,
                },
            };

        case 'combo_executed':
            return {
                playerId,
                objectiveType: 'execute_combo',
                value: 1,
                metadata: {
                    matchId: eventData.matchId as string,
                },
            };

        case 'win_streak':
            return {
                playerId,
                objectiveType: 'win_streak',
                value: eventData.streakLength as number,
                metadata: {
                    matchId: eventData.matchId as string,
                },
            };

        default:
            return null;
    }
}

/**
 * Validate progress event integrity
 */
export function validateProgressEvent(event: QuestProgressEvent): {
    valid: boolean;
    reason?: string;
} {
    // Validate player ID format (Kaspa address)
    if (!event.playerId ||
        (!event.playerId.startsWith('kaspa:') && !event.playerId.startsWith('kaspatest:'))) {
        return { valid: false, reason: 'Invalid player ID format' };
    }

    // Validate value is positive
    if (typeof event.value !== 'number' || event.value <= 0) {
        return { valid: false, reason: 'Progress value must be positive' };
    }

    // Validate value is reasonable (anti-cheat)
    const maxValues: Partial<Record<QuestObjectiveType, number>> = {
        win_matches: 1,     // Can only win 1 match at a time
        play_matches: 1,    // Can only play 1 match at a time
        deal_damage: 5000,  // Max damage per event
        defeat_opponents: 1, // Can only defeat 1 opponent at a time
        use_ability: 10,    // Max abilities per event
        execute_combo: 5,   // Max combos per event
        win_streak: 10,     // Max streak
    };

    const maxValue = maxValues[event.objectiveType];
    if (maxValue && event.value > maxValue) {
        return { valid: false, reason: 'Progress value exceeds maximum' };
    }

    return { valid: true };
}

/**
 * Calculate streak bonus if all daily quests are completed
 */
export function calculateStreakBonus(
    currentStreak: number,
    allQuestsCompleted: boolean
): {
    newStreak: number;
    bonusXP: number;
    bonusCurrency: number;
} {
    if (!allQuestsCompleted) {
        return { newStreak: 0, bonusXP: 0, bonusCurrency: 0 };
    }

    const newStreak = currentStreak + 1;

    // Streak bonuses scale with consecutive days
    const streakMultiplier = Math.min(newStreak, 7); // Cap at 7 days
    const bonusXP = 100 * streakMultiplier;
    const bonusCurrency = 10 * streakMultiplier;

    return { newStreak, bonusXP, bonusCurrency };
}
