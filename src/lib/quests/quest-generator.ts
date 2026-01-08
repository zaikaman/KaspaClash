/**
 * Quest Generator
 * Selects 3 daily quests (1 Easy, 1 Medium, 1 Hard) with variety logic
 */

import type { QuestTemplate, QuestDifficulty, DailyQuest } from '@/types/quest';
import { getQuestsByDifficulty, getQuestTemplateById } from './quest-templates';

/**
 * Result of quest generation
 */
export interface GeneratedQuestSet {
    quests: { template: QuestTemplate; expiresAt: Date }[];
    assignedDate: Date;
}

/**
 * Generate a deterministic but varied selection of quests
 * Uses the date and player ID as seed for consistent daily quests per player
 */
export function generateDailyQuests(
    playerId: string,
    previousQuestIds: string[] = [],
    targetDate: Date = new Date()
): GeneratedQuestSet {
    // Normalize to UTC date for consistency
    const utcDate = new Date(Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate()
    ));

    // Create a simple hash from player ID and date for variety
    const dateStr = utcDate.toISOString().split('T')[0];
    const seed = hashCode(`${playerId}-${dateStr}`);

    // Get available quests for each difficulty
    const easyQuests = getQuestsByDifficulty('easy');
    const mediumQuests = getQuestsByDifficulty('medium');
    const hardQuests = getQuestsByDifficulty('hard');

    // Select one quest from each difficulty, avoiding recent quests
    const selectedEasy = selectQuestWithVariety(easyQuests, previousQuestIds, seed, 0);
    const selectedMedium = selectQuestWithVariety(mediumQuests, previousQuestIds, seed, 1);
    const selectedHard = selectQuestWithVariety(hardQuests, previousQuestIds, seed, 2);

    // Calculate expiration time (midnight UTC next day)
    const expiresAt = new Date(utcDate);
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 1);

    return {
        quests: [
            { template: selectedEasy, expiresAt },
            { template: selectedMedium, expiresAt },
            { template: selectedHard, expiresAt },
        ],
        assignedDate: utcDate,
    };
}

/**
 * Select a quest with variety (avoid recently used quests)
 */
function selectQuestWithVariety(
    quests: QuestTemplate[],
    recentQuestIds: string[],
    seed: number,
    offset: number
): QuestTemplate {
    if (quests.length === 0) {
        throw new Error('No quests available for selection');
    }

    // Filter out recently used quests if possible
    const availableQuests = quests.filter(q => !recentQuestIds.includes(q.id));
    const questPool = availableQuests.length > 0 ? availableQuests : quests;

    // Use seeded selection for consistency
    const index = Math.abs((seed + offset * 31) % questPool.length);
    return questPool[index];
}

/**
 * Simple hash function for string to number
 */
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Convert generated quests to DailyQuest format for database/UI
 */
export function toDailyQuests(
    playerId: string,
    generatedSet: GeneratedQuestSet
): Omit<DailyQuest, 'id'>[] {
    return generatedSet.quests.map(({ template, expiresAt }) => ({
        playerId,
        templateId: template.id,
        template,
        assignedDate: generatedSet.assignedDate,
        expiresAt,
        currentProgress: 0,
        targetProgress: template.targetValue,
        isCompleted: false,
        isClaimed: false,
    }));
}

/**
 * Get time until daily quest reset (midnight UTC)
 */
export function getTimeUntilReset(): {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
} {
    const now = new Date();
    const midnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
    ));

    const diffMs = midnight.getTime() - now.getTime();
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds, totalSeconds };
}

/**
 * Check if a quest set has expired
 */
export function isQuestExpired(expiresAt: Date | string): boolean {
    const expireTime = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return new Date() >= expireTime;
}

/**
 * Get today's date in UTC for quest assignment
 */
export function getTodayUTC(): Date {
    const now = new Date();
    return new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    ));
}

/**
 * Validate that a quest set is for today
 */
export function isQuestSetForToday(assignedDate: Date | string): boolean {
    const assigned = typeof assignedDate === 'string' ? new Date(assignedDate) : assignedDate;
    const today = getTodayUTC();

    return (
        assigned.getUTCFullYear() === today.getUTCFullYear() &&
        assigned.getUTCMonth() === today.getUTCMonth() &&
        assigned.getUTCDate() === today.getUTCDate()
    );
}
