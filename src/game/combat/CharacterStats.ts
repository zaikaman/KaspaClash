/**
 * Character Combat Stats
 * Defines the combat-specific stats for each character
 */

import type { CharacterCombatStats } from "./types";

// =============================================================================
// SPEED ARCHETYPE STATS (Cyber-Ninja Base)
// =============================================================================

export const NEON_WRAITH_STATS: CharacterCombatStats = {
    archetype: 'speed',
    maxHp: 92, // Glass Cannon (Buffed)
    maxEnergy: 120, // Very high energy
    damageModifiers: { punch: 1.1, kick: 1.1, block: 1.0, special: 1.15, stunned: 1.0 },
    blockEffectiveness: 0.45, // Weak block (Buffed)
    specialCostModifier: 0.9, // Lower cost (Buffed)
    energyRegen: 25, // Fast regen
};

export const KITSUNE_09_STATS: CharacterCombatStats = {
    archetype: 'speed',
    maxHp: 90,
    maxEnergy: 110,
    damageModifiers: { punch: 1.0, kick: 1.1, block: 1.0, special: 1.1, stunned: 1.0 },
    blockEffectiveness: 0.7, // Agile/Evasive (Simulated by good block)
    specialCostModifier: 0.9,
    energyRegen: 22,
};

export const VIPERBLADE_STATS: CharacterCombatStats = {
    archetype: 'speed',
    maxHp: 105, // Balanced Speedster (Buffed)
    maxEnergy: 100,
    damageModifiers: { punch: 1.15, kick: 1.15, block: 1.0, special: 1.1, stunned: 1.0 },
    blockEffectiveness: 0.6,
    specialCostModifier: 1.0,
    energyRegen: 23, // Buffed Regen
};

export const CHRONO_DRIFTER_STATS: CharacterCombatStats = {
    archetype: 'speed',
    maxHp: 120, // Tanky Speedster (Buffed)
    maxEnergy: 105, // Buffed
    damageModifiers: { punch: 1.1, kick: 1.1, block: 1.0, special: 1.25, stunned: 1.0 }, // Buffed Modifiers
    blockEffectiveness: 0.65,
    specialCostModifier: 1.0,
    energyRegen: 22, // Buffed
};

// =============================================================================
// TANK ARCHETYPE STATS (Block-Bruiser Base)
// =============================================================================

export const HEAVY_LOADER_STATS: CharacterCombatStats = {
    archetype: 'tank',
    maxHp: 135, // Super Tank (Buffed)
    maxEnergy: 70, // Low energy
    damageModifiers: { punch: 1.1, kick: 1.0, block: 1.0, special: 1.0, stunned: 1.0 },
    blockEffectiveness: 0.4, // Relies on HP, not blocking technique
    specialCostModifier: 1.3,
    energyRegen: 15,
};

export const GENE_SMASHER_STATS: CharacterCombatStats = {
    archetype: 'tank',
    maxHp: 115,
    maxEnergy: 90,
    damageModifiers: { punch: 1.25, kick: 1.25, block: 1.0, special: 1.1, stunned: 1.0 },
    blockEffectiveness: 0.25, // Terrible block (Berzerker)
    specialCostModifier: 1.0,
    energyRegen: 20,
};

export const BASTION_HULK_STATS: CharacterCombatStats = {
    archetype: 'tank',
    maxHp: 115, // Buffed HP
    maxEnergy: 115, // Energy Tank
    damageModifiers: { punch: 1.0, kick: 1.0, block: 1.0, special: 1.1, stunned: 1.0 },
    blockEffectiveness: 0.85, // Incredible shield
    specialCostModifier: 0.9,
    energyRegen: 20,
};

export const SCRAP_GOLIATH_STATS: CharacterCombatStats = {
    archetype: 'tank',
    maxHp: 115, // Regen Tank (Nerfed)
    maxEnergy: 80,
    damageModifiers: { punch: 1.1, kick: 1.1, block: 1.0, special: 1.1, stunned: 1.0 },
    blockEffectiveness: 0.6,
    specialCostModifier: 1.1,
    energyRegen: 25, // Very high regen
};

// =============================================================================
// TECH ARCHETYPE STATS (DAG-Warrior Base)
// =============================================================================

export const CYBER_PALADIN_STATS: CharacterCombatStats = {
    archetype: 'tech',
    maxHp: 115, // Buffed HP
    maxEnergy: 95,
    damageModifiers: { punch: 1.05, kick: 1.05, block: 1.0, special: 1.05, stunned: 1.0 },
    blockEffectiveness: 0.6,
    specialCostModifier: 1.0,
    energyRegen: 20,
};

export const NANO_BRAWLER_STATS: CharacterCombatStats = {
    archetype: 'tech',
    maxHp: 95, // Aggressive Warrior
    maxEnergy: 105,
    damageModifiers: { punch: 1.2, kick: 1.0, block: 1.0, special: 1.1, stunned: 1.0 },
    blockEffectiveness: 0.4,
    specialCostModifier: 1.0,
    energyRegen: 22,
};

export const TECHNOMANCER_STATS: CharacterCombatStats = {
    archetype: 'tech',
    maxHp: 95, // Special Specialist
    maxEnergy: 120,
    damageModifiers: { punch: 0.95, kick: 0.95, block: 1.0, special: 1.25, stunned: 1.0 }, // Nerfed Special
    blockEffectiveness: 0.55,
    specialCostModifier: 0.85, // Increased cost slightly
    energyRegen: 25,
};

export const AEON_GUARD_STATS: CharacterCombatStats = {
    archetype: 'tech',
    maxHp: 120, // Elite Balanced (Buffed)
    maxEnergy: 120, // Buffed
    damageModifiers: { punch: 1.1, kick: 1.1, block: 1.0, special: 1.2, stunned: 1.0 }, // Buffed
    blockEffectiveness: 0.65, // Buffed
    specialCostModifier: 1.0,
    energyRegen: 24, // Buffed
};

// =============================================================================
// PRECISION ARCHETYPE STATS (Hash-Hunter Base)
// =============================================================================

export const RAZOR_BOT_7_STATS: CharacterCombatStats = {
    archetype: 'precision',
    maxHp: 95,
    maxEnergy: 100,
    damageModifiers: { punch: 1.05, kick: 1.05, block: 1.0, special: 1.3, stunned: 1.0 },
    blockEffectiveness: 0.5,
    specialCostModifier: 1.0,
    energyRegen: 22, // Buffed
};

export const SONIC_STRIKER_STATS: CharacterCombatStats = {
    archetype: 'precision',
    maxHp: 105, // Buffed
    maxEnergy: 100,
    damageModifiers: { punch: 1.15, kick: 1.15, block: 1.0, special: 1.0, stunned: 1.0 },
    blockEffectiveness: 0.5,
    specialCostModifier: 1.0,
    energyRegen: 18,
};

export const PRISM_DUELIST_STATS: CharacterCombatStats = {
    archetype: 'precision',
    maxHp: 100, // Buffed
    maxEnergy: 110,
    damageModifiers: { punch: 1.05, kick: 1.05, block: 1.0, special: 1.2, stunned: 1.0 },
    blockEffectiveness: 0.75, // Excellent parry/block
    specialCostModifier: 0.9,
    energyRegen: 22,
};

export const VOID_REAPER_STATS: CharacterCombatStats = {
    archetype: 'precision',
    maxHp: 95, // Glass Reaper (Buffed/Nerfed)
    maxEnergy: 120,
    damageModifiers: { punch: 1.25, kick: 1.25, block: 1.0, special: 1.25, stunned: 1.0 },
    blockEffectiveness: 0.35,
    specialCostModifier: 1.0,
    energyRegen: 22,
};

// Original Base Stats (Kept for fallback/reference)
export const CYBER_NINJA_STATS: CharacterCombatStats = {
    archetype: 'speed',
    maxHp: 96, maxEnergy: 105,
    damageModifiers: { punch: 1.15, kick: 1.05, block: 1.0, special: 1.0, stunned: 1.0 },
    blockEffectiveness: 0.6, specialCostModifier: 0.85, energyRegen: 20,
};
export const DAG_WARRIOR_STATS: CharacterCombatStats = {
    archetype: 'tech',
    maxHp: 100, maxEnergy: 100,
    damageModifiers: { punch: 1.05, kick: 1.05, block: 1.0, special: 1.05, stunned: 1.0 },
    blockEffectiveness: 0.55, specialCostModifier: 1.0, energyRegen: 20,
};
export const BLOCK_BRUISER_STATS: CharacterCombatStats = {
    archetype: 'tank',
    maxHp: 115, maxEnergy: 90,
    damageModifiers: { punch: 1.0, kick: 1.2, block: 1.0, special: 1.0, stunned: 1.0 },
    blockEffectiveness: 0.45, specialCostModifier: 1.25, energyRegen: 20,
};
export const HASH_HUNTER_STATS: CharacterCombatStats = {
    archetype: 'precision',
    maxHp: 98, maxEnergy: 105,
    damageModifiers: { punch: 1.0, kick: 1.1, block: 1.0, special: 1.2, stunned: 1.0 },
    blockEffectiveness: 0.65, specialCostModifier: 1.0, energyRegen: 20,
};

// =============================================================================
// STATS LOOKUP
// =============================================================================

export const CHARACTER_COMBAT_STATS: Record<string, CharacterCombatStats> = {
    // Legacy mapping
    "cyber-ninja": CYBER_NINJA_STATS,
    "dag-warrior": DAG_WARRIOR_STATS,
    "block-bruiser": BLOCK_BRUISER_STATS,
    "hash-hunter": HASH_HUNTER_STATS,

    // NEW UNIQUE CHARACTERS

    // Speed (Ninja Base)
    "neon-wraith": NEON_WRAITH_STATS,
    "kitsune-09": KITSUNE_09_STATS,
    "viperblade": VIPERBLADE_STATS,
    "chrono-drifter": CHRONO_DRIFTER_STATS,

    // Tank (Bruiser Base)
    "heavy-loader": HEAVY_LOADER_STATS,
    "gene-smasher": GENE_SMASHER_STATS,
    "bastion-hulk": BASTION_HULK_STATS,
    "scrap-goliath": SCRAP_GOLIATH_STATS,

    // Tech (Warrior Base)
    "cyber-paladin": CYBER_PALADIN_STATS,
    "nano-brawler": NANO_BRAWLER_STATS,
    "technomancer": TECHNOMANCER_STATS,
    "aeon-guard": AEON_GUARD_STATS,

    // Precision (Hunter Base)
    "razor-bot-7": RAZOR_BOT_7_STATS,
    "sonic-striker": SONIC_STRIKER_STATS, // Renamed from sonic-boom
    "prism-duelist": PRISM_DUELIST_STATS,
    "void-reaper": VOID_REAPER_STATS,
};

/**
 * Get combat stats for a character by ID.
 * Falls back to DAG Warrior stats if not found.
 */
export function getCharacterCombatStats(characterId: string): CharacterCombatStats {
    return CHARACTER_COMBAT_STATS[characterId] ?? DAG_WARRIOR_STATS;
}
