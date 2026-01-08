/**
 * Quest Templates - Hardcoded Quest Definitions
 * Contains 40+ quest configurations across all difficulty levels and objective types
 */

import type { QuestTemplate, QuestDifficulty, QuestObjectiveType } from '@/types/quest';

/**
 * Reward configuration by difficulty
 */
export const QUEST_REWARDS: Record<QuestDifficulty, { xp: number; currency: number }> = {
    easy: { xp: 500, currency: 25 },
    medium: { xp: 1000, currency: 50 },
    hard: { xp: 1500, currency: 100 },
};

/**
 * Easy Quest Templates (XP: 500, Shards: 25)
 * Quick objectives achievable in 1-2 matches
 */
export const EASY_QUESTS: QuestTemplate[] = [
    {
        id: 'e01',
        title: 'First Blood',
        description: 'Win a match to prove your skills',
        objectiveType: 'win_matches',
        targetValue: 1,
        difficulty: 'easy',
        xpReward: QUEST_REWARDS.easy.xp,
        currencyReward: QUEST_REWARDS.easy.currency,
        isActive: true,
    },
    {
        id: 'e02',
        title: 'Warm Up',
        description: 'Play 2 matches to get warmed up',
        objectiveType: 'play_matches',
        targetValue: 2,
        difficulty: 'easy',
        xpReward: QUEST_REWARDS.easy.xp,
        currencyReward: QUEST_REWARDS.easy.currency,
        isActive: true,
    },
    {
        id: 'e03',
        title: 'Light Damage',
        description: 'Deal 200 total damage to opponents',
        objectiveType: 'deal_damage',
        targetValue: 200,
        difficulty: 'easy',
        xpReward: QUEST_REWARDS.easy.xp,
        currencyReward: QUEST_REWARDS.easy.currency,
        isActive: true,
    },
    {
        id: 'e04',
        title: 'Basic Punch',
        description: 'Use punch attack 5 times',
        objectiveType: 'use_ability',
        targetValue: 5,
        difficulty: 'easy',
        xpReward: QUEST_REWARDS.easy.xp,
        currencyReward: QUEST_REWARDS.easy.currency,
        isActive: true,
    },
    {
        id: 'e05',
        title: 'Quick Kick',
        description: 'Use kick attack 5 times',
        objectiveType: 'use_ability',
        targetValue: 5,
        difficulty: 'easy',
        xpReward: QUEST_REWARDS.easy.xp,
        currencyReward: QUEST_REWARDS.easy.currency,
        isActive: true,
    },
    {
        id: 'e06',
        title: 'Shield Up',
        description: 'Use block 3 times in matches',
        objectiveType: 'use_ability',
        targetValue: 3,
        difficulty: 'easy',
        xpReward: QUEST_REWARDS.easy.xp,
        currencyReward: QUEST_REWARDS.easy.currency,
        isActive: true,
    },
    {
        id: 'e07',
        title: 'Special Touch',
        description: 'Use special attack 2 times',
        objectiveType: 'use_ability',
        targetValue: 2,
        difficulty: 'easy',
        xpReward: QUEST_REWARDS.easy.xp,
        currencyReward: QUEST_REWARDS.easy.currency,
        isActive: true,
    },
    {
        id: 'e08',
        title: 'Getting Started',
        description: 'Play your first match of the day',
        objectiveType: 'play_matches',
        targetValue: 1,
        difficulty: 'easy',
        xpReward: QUEST_REWARDS.easy.xp,
        currencyReward: QUEST_REWARDS.easy.currency,
        isActive: true,
    },
    {
        id: 'e09',
        title: 'Early Bird',
        description: 'Win a match before completing other quests',
        objectiveType: 'win_matches',
        targetValue: 1,
        difficulty: 'easy',
        xpReward: QUEST_REWARDS.easy.xp,
        currencyReward: QUEST_REWARDS.easy.currency,
        isActive: true,
    },
    {
        id: 'e10',
        title: 'Scratch Damage',
        description: 'Deal 100 damage in a single match',
        objectiveType: 'deal_damage',
        targetValue: 100,
        difficulty: 'easy',
        xpReward: QUEST_REWARDS.easy.xp,
        currencyReward: QUEST_REWARDS.easy.currency,
        isActive: true,
    },
    {
        id: 'e11',
        title: 'Opponent Defeated',
        description: 'Defeat 1 opponent in battle',
        objectiveType: 'defeat_opponents',
        targetValue: 1,
        difficulty: 'easy',
        xpReward: QUEST_REWARDS.easy.xp,
        currencyReward: QUEST_REWARDS.easy.currency,
        isActive: true,
    },
    {
        id: 'e12',
        title: 'Quick Combo',
        description: 'Execute a combo sequence',
        objectiveType: 'execute_combo',
        targetValue: 1,
        difficulty: 'easy',
        xpReward: QUEST_REWARDS.easy.xp,
        currencyReward: QUEST_REWARDS.easy.currency,
        isActive: true,
    },
];

/**
 * Medium Quest Templates (XP: 1000, Shards: 50)
 * Moderate objectives requiring 3-5 matches
 */
export const MEDIUM_QUESTS: QuestTemplate[] = [
    {
        id: 'm01',
        title: 'Winning Streak',
        description: 'Win 3 matches to show your dominance',
        objectiveType: 'win_matches',
        targetValue: 3,
        difficulty: 'medium',
        xpReward: QUEST_REWARDS.medium.xp,
        currencyReward: QUEST_REWARDS.medium.currency,
        isActive: true,
    },
    {
        id: 'm02',
        title: 'Active Player',
        description: 'Play 5 matches in ranked mode',
        objectiveType: 'play_matches',
        targetValue: 5,
        difficulty: 'medium',
        xpReward: QUEST_REWARDS.medium.xp,
        currencyReward: QUEST_REWARDS.medium.currency,
        isActive: true,
    },
    {
        id: 'm03',
        title: 'Heavy Hitter',
        description: 'Deal 1000 total damage to opponents',
        objectiveType: 'deal_damage',
        targetValue: 1000,
        difficulty: 'medium',
        xpReward: QUEST_REWARDS.medium.xp,
        currencyReward: QUEST_REWARDS.medium.currency,
        isActive: true,
    },
    {
        id: 'm04',
        title: 'Punch Master',
        description: 'Use punch attack 15 times',
        objectiveType: 'use_ability',
        targetValue: 15,
        difficulty: 'medium',
        xpReward: QUEST_REWARDS.medium.xp,
        currencyReward: QUEST_REWARDS.medium.currency,
        isActive: true,
    },
    {
        id: 'm05',
        title: 'Kick Expert',
        description: 'Use kick attack 15 times',
        objectiveType: 'use_ability',
        targetValue: 15,
        difficulty: 'medium',
        xpReward: QUEST_REWARDS.medium.xp,
        currencyReward: QUEST_REWARDS.medium.currency,
        isActive: true,
    },
    {
        id: 'm06',
        title: 'Defensive Mind',
        description: 'Use block 10 times to defend yourself',
        objectiveType: 'use_ability',
        targetValue: 10,
        difficulty: 'medium',
        xpReward: QUEST_REWARDS.medium.xp,
        currencyReward: QUEST_REWARDS.medium.currency,
        isActive: true,
    },
    {
        id: 'm07',
        title: 'Special Force',
        description: 'Use special attack 8 times',
        objectiveType: 'use_ability',
        targetValue: 8,
        difficulty: 'medium',
        xpReward: QUEST_REWARDS.medium.xp,
        currencyReward: QUEST_REWARDS.medium.currency,
        isActive: true,
    },
    {
        id: 'm08',
        title: 'Damage Dealer',
        description: 'Deal 500 damage in a single match',
        objectiveType: 'deal_damage',
        targetValue: 500,
        difficulty: 'medium',
        xpReward: QUEST_REWARDS.medium.xp,
        currencyReward: QUEST_REWARDS.medium.currency,
        isActive: true,
    },
    {
        id: 'm09',
        title: 'Combo Chain',
        description: 'Execute 5 combo sequences',
        objectiveType: 'execute_combo',
        targetValue: 5,
        difficulty: 'medium',
        xpReward: QUEST_REWARDS.medium.xp,
        currencyReward: QUEST_REWARDS.medium.currency,
        isActive: true,
    },
    {
        id: 'm10',
        title: 'Defeat Trio',
        description: 'Defeat 3 opponents in battle',
        objectiveType: 'defeat_opponents',
        targetValue: 3,
        difficulty: 'medium',
        xpReward: QUEST_REWARDS.medium.xp,
        currencyReward: QUEST_REWARDS.medium.currency,
        isActive: true,
    },
    {
        id: 'm11',
        title: 'Double Win',
        description: 'Win 2 consecutive matches',
        objectiveType: 'win_streak',
        targetValue: 2,
        difficulty: 'medium',
        xpReward: QUEST_REWARDS.medium.xp,
        currencyReward: QUEST_REWARDS.medium.currency,
        isActive: true,
    },
    {
        id: 'm12',
        title: 'Persistence',
        description: 'Play 4 matches without giving up',
        objectiveType: 'play_matches',
        targetValue: 4,
        difficulty: 'medium',
        xpReward: QUEST_REWARDS.medium.xp,
        currencyReward: QUEST_REWARDS.medium.currency,
        isActive: true,
    },
];

/**
 * Hard Quest Templates (XP: 1500, Shards: 100)
 * Challenging objectives requiring dedication
 */
export const HARD_QUESTS: QuestTemplate[] = [
    {
        id: 'h01',
        title: 'Champion',
        description: 'Win 5 matches to become a true champion',
        objectiveType: 'win_matches',
        targetValue: 5,
        difficulty: 'hard',
        xpReward: QUEST_REWARDS.hard.xp,
        currencyReward: QUEST_REWARDS.hard.currency,
        isActive: true,
    },
    {
        id: 'h02',
        title: 'Marathon',
        description: 'Play 10 matches in a single day',
        objectiveType: 'play_matches',
        targetValue: 10,
        difficulty: 'hard',
        xpReward: QUEST_REWARDS.hard.xp,
        currencyReward: QUEST_REWARDS.hard.currency,
        isActive: true,
    },
    {
        id: 'h03',
        title: 'Devastator',
        description: 'Deal 2500 total damage to opponents',
        objectiveType: 'deal_damage',
        targetValue: 2500,
        difficulty: 'hard',
        xpReward: QUEST_REWARDS.hard.xp,
        currencyReward: QUEST_REWARDS.hard.currency,
        isActive: true,
    },
    {
        id: 'h04',
        title: 'Hot Streak',
        description: 'Win 3 matches in a row',
        objectiveType: 'win_streak',
        targetValue: 3,
        difficulty: 'hard',
        xpReward: QUEST_REWARDS.hard.xp,
        currencyReward: QUEST_REWARDS.hard.currency,
        isActive: true,
    },
    {
        id: 'h05',
        title: 'Combo Master',
        description: 'Execute 10 combo sequences',
        objectiveType: 'execute_combo',
        targetValue: 10,
        difficulty: 'hard',
        xpReward: QUEST_REWARDS.hard.xp,
        currencyReward: QUEST_REWARDS.hard.currency,
        isActive: true,
    },
    {
        id: 'h06',
        title: 'Perfect Defense',
        description: 'Use block 20 times successfully',
        objectiveType: 'use_ability',
        targetValue: 20,
        difficulty: 'hard',
        xpReward: QUEST_REWARDS.hard.xp,
        currencyReward: QUEST_REWARDS.hard.currency,
        isActive: true,
    },
    {
        id: 'h07',
        title: 'Ultimate Power',
        description: 'Use special attack 15 times',
        objectiveType: 'use_ability',
        targetValue: 15,
        difficulty: 'hard',
        xpReward: QUEST_REWARDS.hard.xp,
        currencyReward: QUEST_REWARDS.hard.currency,
        isActive: true,
    },
    {
        id: 'h08',
        title: 'Relentless',
        description: 'Defeat 5 opponents in a single day',
        objectiveType: 'defeat_opponents',
        targetValue: 5,
        difficulty: 'hard',
        xpReward: QUEST_REWARDS.hard.xp,
        currencyReward: QUEST_REWARDS.hard.currency,
        isActive: true,
    },
    {
        id: 'h09',
        title: 'Damage King',
        description: 'Deal 1500 damage in a single match',
        objectiveType: 'deal_damage',
        targetValue: 1500,
        difficulty: 'hard',
        xpReward: QUEST_REWARDS.hard.xp,
        currencyReward: QUEST_REWARDS.hard.currency,
        isActive: true,
    },
    {
        id: 'h10',
        title: 'Win Spree',
        description: 'Win 4 matches without losing',
        objectiveType: 'win_streak',
        targetValue: 4,
        difficulty: 'hard',
        xpReward: QUEST_REWARDS.hard.xp,
        currencyReward: QUEST_REWARDS.hard.currency,
        isActive: true,
    },
    {
        id: 'h11',
        title: 'Endurance',
        description: 'Play 8 matches and win at least half',
        objectiveType: 'play_matches',
        targetValue: 8,
        difficulty: 'hard',
        xpReward: QUEST_REWARDS.hard.xp,
        currencyReward: QUEST_REWARDS.hard.currency,
        isActive: true,
    },
    {
        id: 'h12',
        title: 'Victorious',
        description: 'Win 6 matches in ranked mode',
        objectiveType: 'win_matches',
        targetValue: 6,
        difficulty: 'hard',
        xpReward: QUEST_REWARDS.hard.xp,
        currencyReward: QUEST_REWARDS.hard.currency,
        isActive: true,
    },
];

/**
 * All quest templates combined
 */
export const ALL_QUEST_TEMPLATES: QuestTemplate[] = [
    ...EASY_QUESTS,
    ...MEDIUM_QUESTS,
    ...HARD_QUESTS,
];

/**
 * Get quest templates by difficulty
 */
export function getQuestsByDifficulty(difficulty: QuestDifficulty): QuestTemplate[] {
    switch (difficulty) {
        case 'easy':
            return EASY_QUESTS.filter(q => q.isActive);
        case 'medium':
            return MEDIUM_QUESTS.filter(q => q.isActive);
        case 'hard':
            return HARD_QUESTS.filter(q => q.isActive);
        default:
            return [];
    }
}

/**
 * Get a quest template by ID
 */
export function getQuestTemplateById(id: string): QuestTemplate | undefined {
    return ALL_QUEST_TEMPLATES.find(q => q.id === id);
}

/**
 * Get quest count by difficulty
 */
export function getQuestCount(): { easy: number; medium: number; hard: number; total: number } {
    return {
        easy: EASY_QUESTS.filter(q => q.isActive).length,
        medium: MEDIUM_QUESTS.filter(q => q.isActive).length,
        hard: HARD_QUESTS.filter(q => q.isActive).length,
        total: ALL_QUEST_TEMPLATES.filter(q => q.isActive).length,
    };
}

/**
 * Get objective type display name
 */
export function getObjectiveTypeDisplayName(type: QuestObjectiveType): string {
    const names: Record<QuestObjectiveType, string> = {
        win_matches: 'Win Matches',
        play_matches: 'Play Matches',
        deal_damage: 'Deal Damage',
        defeat_opponents: 'Defeat Opponents',
        use_character: 'Use Character',
        use_ability: 'Use Ability',
        execute_combo: 'Execute Combo',
        win_streak: 'Win Streak',
        survival_waves: 'Survival Waves',
        combo_challenge_stars: 'Combo Stars',
    };
    return names[type] || type;
}
