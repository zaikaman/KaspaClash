/**
 * Prestige Cosmetics Definitions
 * Defines exclusive cosmetic rewards for each prestige level
 * These are used by the prestige handler to grant rewards
 */

import type { CosmeticRarity } from '@/types/cosmetic';

/**
 * Prestige cosmetic reward definition
 */
export interface PrestigeCosmeticReward {
    id: string;
    name: string;
    description: string;
    category: 'profile_badge' | 'profile_frame' | 'aura' | 'character' | 'sticker' | 'victory_pose' | 'title';
    rarity: CosmeticRarity;
    prestigeLevel: number;
    thumbnailUrl: string;
    previewUrl: string;
    tags: string[];
}

/**
 * All prestige cosmetic rewards by level
 */
export const PRESTIGE_COSMETICS: PrestigeCosmeticReward[] = [
    // ===================
    // PRESTIGE 1 - Bronze Tier
    // ===================
    {
        id: 'prestige_1_badge',
        name: 'Bronze Veteran',
        description: 'Awarded for reaching Prestige 1. Shows your dedication to the arena.',
        category: 'profile_badge',
        rarity: 'prestige',
        prestigeLevel: 1,
        thumbnailUrl: '/cosmetics/prestige/badges/bronze_veteran.webp',
        previewUrl: '/cosmetics/prestige/badges/bronze_veteran.webp',
        tags: ['prestige', 'bronze', 'veteran', 'exclusive'],
    },
    {
        id: 'prestige_bronze_border',
        name: 'Bronze Frame',
        description: 'A distinguished bronze border for Prestige 1 warriors.',
        category: 'profile_frame',
        rarity: 'prestige',
        prestigeLevel: 1,
        thumbnailUrl: '/cosmetics/prestige/frames/bronze_frame.webp',
        previewUrl: '/cosmetics/prestige/frames/bronze_frame.webp',
        tags: ['prestige', 'bronze', 'frame', 'exclusive'],
    },

    // ===================
    // PRESTIGE 2
    // ===================
    {
        id: 'prestige_2_badge',
        name: 'Rising Star',
        description: 'Prestige 2 badge. Your legend grows.',
        category: 'profile_badge',
        rarity: 'prestige',
        prestigeLevel: 2,
        thumbnailUrl: '/cosmetics/prestige/badges/rising_star.webp',
        previewUrl: '/cosmetics/prestige/badges/rising_star.webp',
        tags: ['prestige', 'star', 'rising', 'exclusive'],
    },

    // ===================
    // PRESTIGE 3 - Silver Tier
    // ===================
    {
        id: 'prestige_3_badge',
        name: 'Silver Elite',
        description: 'Prestige 3 badge. You have proven yourself in countless battles.',
        category: 'profile_badge',
        rarity: 'prestige',
        prestigeLevel: 3,
        thumbnailUrl: '/cosmetics/prestige/badges/silver_elite.webp',
        previewUrl: '/cosmetics/prestige/badges/silver_elite.webp',
        tags: ['prestige', 'silver', 'elite', 'exclusive'],
    },
    {
        id: 'prestige_silver_border',
        name: 'Silver Frame',
        description: 'A shimmering silver border for Prestige 3 champions.',
        category: 'profile_frame',
        rarity: 'prestige',
        prestigeLevel: 3,
        thumbnailUrl: '/cosmetics/prestige/frames/silver_frame.webp',
        previewUrl: '/cosmetics/prestige/frames/silver_frame.webp',
        tags: ['prestige', 'silver', 'frame', 'exclusive'],
    },
    {
        id: 'prestige_silver_aura',
        name: 'Silver Aura',
        description: 'A subtle silver glow surrounds your avatar.',
        category: 'aura',
        rarity: 'prestige',
        prestigeLevel: 3,
        thumbnailUrl: '/cosmetics/prestige/auras/silver_aura.webp',
        previewUrl: '/cosmetics/prestige/auras/silver_aura.webp',
        tags: ['prestige', 'silver', 'aura', 'glow', 'exclusive'],
    },

    // ===================
    // PRESTIGE 4
    // ===================
    {
        id: 'prestige_4_badge',
        name: 'War Veteran',
        description: 'Prestige 4 badge. Your experience speaks volumes.',
        category: 'profile_badge',
        rarity: 'prestige',
        prestigeLevel: 4,
        thumbnailUrl: '/cosmetics/prestige/badges/war_veteran.webp',
        previewUrl: '/cosmetics/prestige/badges/war_veteran.webp',
        tags: ['prestige', 'war', 'veteran', 'exclusive'],
    },

    // ===================
    // PRESTIGE 5 - Gold Tier
    // ===================
    {
        id: 'prestige_5_badge',
        name: 'Golden Master',
        description: 'Prestige 5 badge. You have reached mastery.',
        category: 'profile_badge',
        rarity: 'prestige',
        prestigeLevel: 5,
        thumbnailUrl: '/cosmetics/prestige/badges/golden_master.webp',
        previewUrl: '/cosmetics/prestige/badges/golden_master.webp',
        tags: ['prestige', 'gold', 'master', 'exclusive'],
    },
    {
        id: 'prestige_gold_border',
        name: 'Golden Frame',
        description: 'A brilliant golden border for Prestige 5 masters.',
        category: 'profile_frame',
        rarity: 'prestige',
        prestigeLevel: 5,
        thumbnailUrl: '/cosmetics/prestige/frames/golden_frame.webp',
        previewUrl: '/cosmetics/prestige/frames/golden_frame.webp',
        tags: ['prestige', 'gold', 'frame', 'exclusive'],
    },
    {
        id: 'prestige_gold_aura',
        name: 'Golden Aura',
        description: 'A radiant golden glow emanates from your avatar.',
        category: 'aura',
        rarity: 'prestige',
        prestigeLevel: 5,
        thumbnailUrl: '/cosmetics/prestige/auras/golden_aura.webp',
        previewUrl: '/cosmetics/prestige/auras/golden_aura.webp',
        tags: ['prestige', 'gold', 'aura', 'glow', 'exclusive'],
    },
    {
        id: 'prestige_5_skin_variant',
        name: 'Golden Champion',
        description: 'A special golden skin variant unlocked at Prestige 5.',
        category: 'character',
        rarity: 'prestige',
        prestigeLevel: 5,
        thumbnailUrl: '/cosmetics/prestige/skins/golden_champion.webp',
        previewUrl: '/cosmetics/prestige/skins/golden_champion.webp',
        tags: ['prestige', 'gold', 'skin', 'variant', 'exclusive'],
    },

    // ===================
    // PRESTIGE 6
    // ===================
    {
        id: 'prestige_6_badge',
        name: 'Battlefield Legend',
        description: 'Prestige 6 badge. Your name echoes through the arena.',
        category: 'profile_badge',
        rarity: 'prestige',
        prestigeLevel: 6,
        thumbnailUrl: '/cosmetics/prestige/badges/battlefield_legend.webp',
        previewUrl: '/cosmetics/prestige/badges/battlefield_legend.webp',
        tags: ['prestige', 'legend', 'battlefield', 'exclusive'],
    },

    // ===================
    // PRESTIGE 7 - Platinum Tier
    // ===================
    {
        id: 'prestige_7_badge',
        name: 'Platinum Champion',
        description: 'Prestige 7 badge. Among the elite few.',
        category: 'profile_badge',
        rarity: 'prestige',
        prestigeLevel: 7,
        thumbnailUrl: '/cosmetics/prestige/badges/platinum_champion.webp',
        previewUrl: '/cosmetics/prestige/badges/platinum_champion.webp',
        tags: ['prestige', 'platinum', 'champion', 'exclusive'],
    },
    {
        id: 'prestige_platinum_border',
        name: 'Platinum Frame',
        description: 'An elegant platinum border for Prestige 7 champions.',
        category: 'profile_frame',
        rarity: 'prestige',
        prestigeLevel: 7,
        thumbnailUrl: '/cosmetics/prestige/frames/platinum_frame.webp',
        previewUrl: '/cosmetics/prestige/frames/platinum_frame.webp',
        tags: ['prestige', 'platinum', 'frame', 'exclusive'],
    },
    {
        id: 'prestige_platinum_aura',
        name: 'Platinum Aura',
        description: 'A cool platinum shimmer surrounds your avatar.',
        category: 'aura',
        rarity: 'prestige',
        prestigeLevel: 7,
        thumbnailUrl: '/cosmetics/prestige/auras/platinum_aura.webp',
        previewUrl: '/cosmetics/prestige/auras/platinum_aura.webp',
        tags: ['prestige', 'platinum', 'aura', 'shimmer', 'exclusive'],
    },
    {
        id: 'prestige_7_skin_variant',
        name: 'Platinum Warrior',
        description: 'A sleek platinum skin variant unlocked at Prestige 7.',
        category: 'character',
        rarity: 'prestige',
        prestigeLevel: 7,
        thumbnailUrl: '/cosmetics/prestige/skins/platinum_warrior.webp',
        previewUrl: '/cosmetics/prestige/skins/platinum_warrior.webp',
        tags: ['prestige', 'platinum', 'skin', 'variant', 'exclusive'],
    },
    {
        id: 'prestige_7_emote',
        name: 'Prestige Salute',
        description: 'A prestigious salute exclusive to Prestige 7+ players.',
        category: 'sticker',
        rarity: 'prestige',
        prestigeLevel: 7,
        thumbnailUrl: '/cosmetics/prestige/emotes/prestige_salute.webp',
        previewUrl: '/cosmetics/prestige/emotes/prestige_salute.webp',
        tags: ['prestige', 'emote', 'salute', 'exclusive'],
    },

    // ===================
    // PRESTIGE 8
    // ===================
    {
        id: 'prestige_8_badge',
        name: 'Arena Dominator',
        description: 'Prestige 8 badge. You dominate the battlefield.',
        category: 'profile_badge',
        rarity: 'prestige',
        prestigeLevel: 8,
        thumbnailUrl: '/cosmetics/prestige/badges/arena_dominator.webp',
        previewUrl: '/cosmetics/prestige/badges/arena_dominator.webp',
        tags: ['prestige', 'arena', 'dominator', 'exclusive'],
    },

    // ===================
    // PRESTIGE 9
    // ===================
    {
        id: 'prestige_9_badge',
        name: 'Ascended Warrior',
        description: 'Prestige 9 badge. You have transcended.',
        category: 'profile_badge',
        rarity: 'prestige',
        prestigeLevel: 9,
        thumbnailUrl: '/cosmetics/prestige/badges/ascended_warrior.webp',
        previewUrl: '/cosmetics/prestige/badges/ascended_warrior.webp',
        tags: ['prestige', 'ascended', 'warrior', 'exclusive'],
    },

    // ===================
    // PRESTIGE 10 - Diamond Tier (MAX)
    // ===================
    {
        id: 'prestige_10_badge',
        name: 'Diamond Legend',
        description: 'Maximum Prestige! The ultimate badge of honor.',
        category: 'profile_badge',
        rarity: 'prestige',
        prestigeLevel: 10,
        thumbnailUrl: '/cosmetics/prestige/badges/diamond_legend.webp',
        previewUrl: '/cosmetics/prestige/badges/diamond_legend.webp',
        tags: ['prestige', 'diamond', 'legend', 'max', 'exclusive'],
    },
    {
        id: 'prestige_diamond_border',
        name: 'Diamond Frame',
        description: 'The ultimate diamond border for max prestige legends.',
        category: 'profile_frame',
        rarity: 'prestige',
        prestigeLevel: 10,
        thumbnailUrl: '/cosmetics/prestige/frames/diamond_frame.webp',
        previewUrl: '/cosmetics/prestige/frames/diamond_frame.webp',
        tags: ['prestige', 'diamond', 'frame', 'max', 'exclusive'],
    },
    {
        id: 'prestige_diamond_aura',
        name: 'Diamond Aura',
        description: 'A brilliant diamond sparkle effect around your avatar.',
        category: 'aura',
        rarity: 'prestige',
        prestigeLevel: 10,
        thumbnailUrl: '/cosmetics/prestige/auras/diamond_aura.webp',
        previewUrl: '/cosmetics/prestige/auras/diamond_aura.webp',
        tags: ['prestige', 'diamond', 'aura', 'sparkle', 'max', 'exclusive'],
    },
    {
        id: 'prestige_max_skin_exclusive',
        name: 'Diamond Apex',
        description: 'The ultimate prestige skin. Reserved for legends.',
        category: 'character',
        rarity: 'prestige',
        prestigeLevel: 10,
        thumbnailUrl: '/cosmetics/prestige/skins/diamond_apex.webp',
        previewUrl: '/cosmetics/prestige/skins/diamond_apex.webp',
        tags: ['prestige', 'diamond', 'skin', 'apex', 'max', 'exclusive'],
    },
    {
        id: 'prestige_max_emote',
        name: 'Diamond Flex',
        description: 'The ultimate show of prestige power.',
        category: 'sticker',
        rarity: 'prestige',
        prestigeLevel: 10,
        thumbnailUrl: '/cosmetics/prestige/emotes/diamond_flex.webp',
        previewUrl: '/cosmetics/prestige/emotes/diamond_flex.webp',
        tags: ['prestige', 'diamond', 'emote', 'flex', 'max', 'exclusive'],
    },
    {
        id: 'prestige_max_victory_pose',
        name: 'Diamond Ascension',
        description: 'An ethereal victory pose for max prestige legends.',
        category: 'victory_pose',
        rarity: 'prestige',
        prestigeLevel: 10,
        thumbnailUrl: '/cosmetics/prestige/poses/diamond_ascension.webp',
        previewUrl: '/cosmetics/prestige/poses/diamond_ascension.webp',
        tags: ['prestige', 'diamond', 'pose', 'ascension', 'max', 'exclusive'],
    },
];

/**
 * Get all cosmetics for a specific prestige level
 */
export function getPrestigeCosmeticsForLevel(level: number): PrestigeCosmeticReward[] {
    return PRESTIGE_COSMETICS.filter(c => c.prestigeLevel === level);
}

/**
 * Get all cosmetics up to and including a prestige level
 */
export function getAllPrestigeCosmeticsUpToLevel(level: number): PrestigeCosmeticReward[] {
    return PRESTIGE_COSMETICS.filter(c => c.prestigeLevel <= level);
}

/**
 * Get a specific prestige cosmetic by ID
 */
export function getPrestigeCosmeticById(id: string): PrestigeCosmeticReward | undefined {
    return PRESTIGE_COSMETICS.find(c => c.id === id);
}

/**
 * Get all prestige badges
 */
export function getAllPrestigeBadges(): PrestigeCosmeticReward[] {
    return PRESTIGE_COSMETICS.filter(c => c.category === 'profile_badge');
}

/**
 * Get all prestige frames
 */
export function getAllPrestigeFrames(): PrestigeCosmeticReward[] {
    return PRESTIGE_COSMETICS.filter(c => c.category === 'profile_frame');
}

/**
 * Get all prestige auras
 */
export function getAllPrestigeAuras(): PrestigeCosmeticReward[] {
    return PRESTIGE_COSMETICS.filter(c => c.category === 'aura');
}

/**
 * Check if a cosmetic ID is a prestige exclusive
 */
export function isPrestigeExclusive(cosmeticId: string): boolean {
    return PRESTIGE_COSMETICS.some(c => c.id === cosmeticId);
}
