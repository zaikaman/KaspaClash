/**
 * Prestige Calculator
 * Handles prestige level calculations, multipliers, and rewards
 */

import type { PrestigeStatus } from '@/types/progression';

/**
 * Maximum prestige level allowed
 */
export const MAX_PRESTIGE_LEVEL = 10;

/**
 * Base XP multiplier increment per prestige level (10% per level)
 */
export const XP_MULTIPLIER_INCREMENT = 0.10;

/**
 * Base currency multiplier increment per prestige level (10% per level)
 */
export const CURRENCY_MULTIPLIER_INCREMENT = 0.10;

/**
 * Required tier to prestige
 */
export const PRESTIGE_REQUIRED_TIER = 50;

/**
 * Prestige milestone levels that grant exclusive rewards
 */
export const PRESTIGE_MILESTONES = [1, 3, 5, 7, 10] as const;

/**
 * Calculate XP multiplier for a given prestige level
 * Formula: 1.1^prestigeLevel (compounding 10% per level)
 * 
 * @param prestigeLevel - Current prestige level (0-10)
 * @returns XP multiplier (1.0 for level 0, 1.1 for level 1, 1.21 for level 2, etc.)
 */
export function calculateXPMultiplier(prestigeLevel: number): number {
    const safeLevel = Math.max(0, Math.min(prestigeLevel, MAX_PRESTIGE_LEVEL));
    return Math.pow(1 + XP_MULTIPLIER_INCREMENT, safeLevel);
}

/**
 * Calculate currency multiplier for a given prestige level
 * Formula: 1.1^prestigeLevel (compounding 10% per level)
 * 
 * @param prestigeLevel - Current prestige level (0-10)
 * @returns Currency multiplier (1.0 for level 0, 1.1 for level 1, 1.21 for level 2, etc.)
 */
export function calculateCurrencyMultiplier(prestigeLevel: number): number {
    const safeLevel = Math.max(0, Math.min(prestigeLevel, MAX_PRESTIGE_LEVEL));
    return Math.pow(1 + CURRENCY_MULTIPLIER_INCREMENT, safeLevel);
}

/**
 * Get the percentage bonus for display (e.g., "+10%", "+21%")
 * 
 * @param prestigeLevel - Current prestige level
 * @returns Formatted percentage string
 */
export function getXPBonusPercentage(prestigeLevel: number): string {
    const multiplier = calculateXPMultiplier(prestigeLevel);
    const bonus = Math.round((multiplier - 1) * 100);
    return bonus > 0 ? `+${bonus}%` : '0%';
}

/**
 * Get the percentage bonus for currency display
 * 
 * @param prestigeLevel - Current prestige level
 * @returns Formatted percentage string
 */
export function getCurrencyBonusPercentage(prestigeLevel: number): string {
    const multiplier = calculateCurrencyMultiplier(prestigeLevel);
    const bonus = Math.round((multiplier - 1) * 100);
    return bonus > 0 ? `+${bonus}%` : '0%';
}

/**
 * Apply prestige XP multiplier to base XP
 * 
 * @param baseXP - Base XP amount before multiplier
 * @param prestigeLevel - Current prestige level
 * @returns XP amount after multiplier applied (floored to integer)
 */
export function applyXPMultiplier(baseXP: number, prestigeLevel: number): number {
    const multiplier = calculateXPMultiplier(prestigeLevel);
    return Math.floor(baseXP * multiplier);
}

/**
 * Apply prestige currency multiplier to base currency amount
 * 
 * @param baseCurrency - Base currency amount before multiplier
 * @param prestigeLevel - Current prestige level
 * @returns Currency amount after multiplier applied (floored to integer)
 */
export function applyCurrencyMultiplier(baseCurrency: number, prestigeLevel: number): number {
    const multiplier = calculateCurrencyMultiplier(prestigeLevel);
    return Math.floor(baseCurrency * multiplier);
}

/**
 * Check if player is eligible to prestige
 * 
 * @param currentTier - Player's current battle pass tier
 * @param currentPrestigeLevel - Player's current prestige level
 * @returns Whether the player can prestige
 */
export function canPrestige(currentTier: number, currentPrestigeLevel: number): boolean {
    return currentTier >= PRESTIGE_REQUIRED_TIER && currentPrestigeLevel < MAX_PRESTIGE_LEVEL;
}

/**
 * Check if a prestige level is a milestone level
 * 
 * @param prestigeLevel - Prestige level to check
 * @returns Whether this is a milestone level
 */
export function isPrestigeMilestone(prestigeLevel: number): boolean {
    return PRESTIGE_MILESTONES.includes(prestigeLevel as typeof PRESTIGE_MILESTONES[number]);
}

/**
 * Get prestige milestone rewards for a specific level
 * 
 * @param prestigeLevel - Prestige level to get rewards for
 * @returns Array of reward item IDs for this prestige level
 */
export function getPrestigeMilestoneRewards(prestigeLevel: number): {
    badge?: string;
    profileBorder?: string;
    aura?: string;
    title?: string;
    cosmetics?: string[];
} {
    const rewards: {
        badge?: string;
        profileBorder?: string;
        aura?: string;
        title?: string;
        cosmetics?: string[];
    } = {};

    // Every prestige level grants a badge
    rewards.badge = `prestige_${prestigeLevel}_badge`;

    // Milestone-specific rewards
    switch (prestigeLevel) {
        case 1:
            rewards.profileBorder = 'prestige_bronze_border';
            rewards.title = 'Veteran';
            break;
        case 3:
            rewards.profileBorder = 'prestige_silver_border';
            rewards.aura = 'prestige_silver_aura';
            rewards.title = 'Elite';
            break;
        case 5:
            rewards.profileBorder = 'prestige_gold_border';
            rewards.aura = 'prestige_gold_aura';
            rewards.title = 'Master';
            rewards.cosmetics = ['prestige_5_skin_variant'];
            break;
        case 7:
            rewards.profileBorder = 'prestige_platinum_border';
            rewards.aura = 'prestige_platinum_aura';
            rewards.title = 'Champion';
            rewards.cosmetics = ['prestige_7_skin_variant', 'prestige_7_emote'];
            break;
        case 10:
            rewards.profileBorder = 'prestige_diamond_border';
            rewards.aura = 'prestige_diamond_aura';
            rewards.title = 'Legend';
            rewards.cosmetics = [
                'prestige_max_skin_exclusive',
                'prestige_max_emote',
                'prestige_max_victory_pose',
            ];
            break;
    }

    return rewards;
}

/**
 * Get all rewards unlocked up to and including a prestige level
 * 
 * @param prestigeLevel - Current prestige level
 * @returns Accumulated rewards from all prestige levels
 */
export function getAccumulatedPrestigeRewards(prestigeLevel: number): {
    badges: string[];
    profileBorders: string[];
    auras: string[];
    titles: string[];
    cosmetics: string[];
} {
    const accumulated = {
        badges: [] as string[],
        profileBorders: [] as string[],
        auras: [] as string[],
        titles: [] as string[],
        cosmetics: [] as string[],
    };

    for (let level = 1; level <= prestigeLevel; level++) {
        const rewards = getPrestigeMilestoneRewards(level);
        
        if (rewards.badge) accumulated.badges.push(rewards.badge);
        if (rewards.profileBorder) accumulated.profileBorders.push(rewards.profileBorder);
        if (rewards.aura) accumulated.auras.push(rewards.aura);
        if (rewards.title) accumulated.titles.push(rewards.title);
        if (rewards.cosmetics) accumulated.cosmetics.push(...rewards.cosmetics);
    }

    return accumulated;
}

/**
 * Build a PrestigeStatus object from database values
 * 
 * @param playerId - Player's wallet address
 * @param prestigeLevel - Current prestige level
 * @param currentTier - Current battle pass tier
 * @param totalResets - Total number of prestige resets
 * @param lastPrestigeDate - Date of last prestige (optional)
 * @returns PrestigeStatus object
 */
export function buildPrestigeStatus(
    playerId: string,
    prestigeLevel: number,
    currentTier: number,
    totalResets: number,
    lastPrestigeDate?: Date
): PrestigeStatus {
    return {
        playerId,
        level: prestigeLevel,
        xpMultiplier: calculateXPMultiplier(prestigeLevel),
        currencyMultiplier: calculateCurrencyMultiplier(prestigeLevel),
        totalResets,
        lastPrestigeDate,
        eligibleForPrestige: canPrestige(currentTier, prestigeLevel),
    };
}

/**
 * Calculate total XP bonus percentage for display
 * 
 * @param prestigeLevel - Current prestige level
 * @returns Object with raw bonus value and formatted string
 */
export function getPrestigeBonusDisplay(prestigeLevel: number): {
    xpBonus: number;
    currencyBonus: number;
    xpBonusFormatted: string;
    currencyBonusFormatted: string;
    nextXpBonus: number;
    nextCurrencyBonus: number;
} {
    const xpBonus = Math.round((calculateXPMultiplier(prestigeLevel) - 1) * 100);
    const currencyBonus = Math.round((calculateCurrencyMultiplier(prestigeLevel) - 1) * 100);
    
    const nextLevel = Math.min(prestigeLevel + 1, MAX_PRESTIGE_LEVEL);
    const nextXpBonus = Math.round((calculateXPMultiplier(nextLevel) - 1) * 100);
    const nextCurrencyBonus = Math.round((calculateCurrencyMultiplier(nextLevel) - 1) * 100);

    return {
        xpBonus,
        currencyBonus,
        xpBonusFormatted: xpBonus > 0 ? `+${xpBonus}%` : '0%',
        currencyBonusFormatted: currencyBonus > 0 ? `+${currencyBonus}%` : '0%',
        nextXpBonus,
        nextCurrencyBonus,
    };
}

/**
 * Get prestige tier display info (Bronze, Silver, Gold, etc.)
 * 
 * @param prestigeLevel - Current prestige level
 * @returns Display info for the prestige tier
 */
export function getPrestigeTierInfo(prestigeLevel: number): {
    tier: string;
    color: string;
    cssClass: string;
    icon: string;
} {
    if (prestigeLevel >= 10) {
        return {
            tier: 'Diamond',
            color: '#00D4FF',
            cssClass: 'text-cyan-400',
            icon: '💎',
        };
    }
    if (prestigeLevel >= 7) {
        return {
            tier: 'Platinum',
            color: '#E5E4E2',
            cssClass: 'text-gray-200',
            icon: '⭐',
        };
    }
    if (prestigeLevel >= 5) {
        return {
            tier: 'Gold',
            color: '#FFD700',
            cssClass: 'text-yellow-400',
            icon: '🏆',
        };
    }
    if (prestigeLevel >= 3) {
        return {
            tier: 'Silver',
            color: '#C0C0C0',
            cssClass: 'text-gray-400',
            icon: '🥈',
        };
    }
    if (prestigeLevel >= 1) {
        return {
            tier: 'Bronze',
            color: '#CD7F32',
            cssClass: 'text-amber-600',
            icon: '🥉',
        };
    }
    return {
        tier: 'None',
        color: '#666666',
        cssClass: 'text-gray-600',
        icon: '',
    };
}
