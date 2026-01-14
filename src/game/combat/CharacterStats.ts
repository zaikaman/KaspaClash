/**
 * Character Combat Stats
 * Defines the combat-specific stats for each character
 */

import type { CharacterCombatStats } from "./types";

// =============================================================================
// SPEED ARCHETYPE STATS (Cyber-Ninja Base)
// =============================================================================

export const NEON_WRAITH_STATS: CharacterCombatStats = {
    maxHp: 85, // Glass Cannon
    maxEnergy: 120, // Very high energy
    damageModifiers: { punch: 1.2, kick: 1.1, block: 1.0, special: 1.2, stunned: 1.0 },
    blockEffectiveness: 0.3, // Very weak block
    specialCostModifier: 0.8, // Cheap specials
    energyRegen: 25, // Fast regen
};

export const KITSUNE_09_STATS: CharacterCombatStats = {
    maxHp: 90,
    maxEnergy: 110,
    damageModifiers: { punch: 1.0, kick: 1.1, block: 1.0, special: 1.1, stunned: 1.0 },
    blockEffectiveness: 0.7, // Agile/Evasive (Simulated by good block)
    specialCostModifier: 0.9,
    energyRegen: 22,
};

export const VIPERBLADE_STATS: CharacterCombatStats = {
    maxHp: 100, // Balanced Speedster
    maxEnergy: 100,
    damageModifiers: { punch: 1.1, kick: 1.1, block: 1.0, special: 1.0, stunned: 1.0 },
    blockEffectiveness: 0.5,
    specialCostModifier: 1.0,
    energyRegen: 20,
};

export const CHRONO_DRIFTER_STATS: CharacterCombatStats = {
    maxHp: 105, // Tanky Speedster
    maxEnergy: 95,
    damageModifiers: { punch: 1.05, kick: 1.0, block: 1.0, special: 1.1, stunned: 1.0 },
    blockEffectiveness: 0.6,
    specialCostModifier: 1.1,
    energyRegen: 18,
};

// =============================================================================
// TANK ARCHETYPE STATS (Block-Bruiser Base)
// =============================================================================

export const HEAVY_LOADER_STATS: CharacterCombatStats = {
    maxHp: 130, // Super Tank
    maxEnergy: 70, // Low energy
    damageModifiers: { punch: 1.1, kick: 1.0, block: 1.0, special: 1.0, stunned: 1.0 },
    blockEffectiveness: 0.3, // Relies on HP, not blocking technique
    specialCostModifier: 1.3,
    energyRegen: 15,
};

export const GENE_SMASHER_STATS: CharacterCombatStats = {
    maxHp: 115,
    maxEnergy: 90,
    damageModifiers: { punch: 1.3, kick: 1.3, block: 1.0, special: 1.2, stunned: 1.0 },
    blockEffectiveness: 0.2, // Terrible block (Berzerker)
    specialCostModifier: 1.0,
    energyRegen: 20,
};

export const BASTION_HULK_STATS: CharacterCombatStats = {
    maxHp: 105,
    maxEnergy: 110, // Energy Tank
    damageModifiers: { punch: 0.9, kick: 0.9, block: 1.0, special: 1.1, stunned: 1.0 },
    blockEffectiveness: 0.8, // Incredible shield
    specialCostModifier: 0.9,
    energyRegen: 20,
};

export const SCRAP_GOLIATH_STATS: CharacterCombatStats = {
    maxHp: 120, // Regen Tank
    maxEnergy: 80,
    damageModifiers: { punch: 1.1, kick: 1.1, block: 1.0, special: 1.1, stunned: 1.0 },
    blockEffectiveness: 0.5,
    specialCostModifier: 1.2,
    energyRegen: 30, // Very high regen
};

// =============================================================================
// TECH ARCHETYPE STATS (DAG-Warrior Base)
// =============================================================================

export const CYBER_PALADIN_STATS: CharacterCombatStats = {
    maxHp: 110, // Defensive Warrior
    maxEnergy: 95,
    damageModifiers: { punch: 1.0, kick: 1.0, block: 1.0, special: 1.0, stunned: 1.0 },
    blockEffectiveness: 0.6,
    specialCostModifier: 1.0,
    energyRegen: 18,
};

export const NANO_BRAWLER_STATS: CharacterCombatStats = {
    maxHp: 95, // Aggressive Warrior
    maxEnergy: 105,
    damageModifiers: { punch: 1.2, kick: 1.0, block: 1.0, special: 1.1, stunned: 1.0 },
    blockEffectiveness: 0.4,
    specialCostModifier: 1.0,
    energyRegen: 22,
};

export const TECHNOMANCER_STATS: CharacterCombatStats = {
    maxHp: 90, // Special Specialist
    maxEnergy: 120,
    damageModifiers: { punch: 0.8, kick: 0.8, block: 1.0, special: 1.4, stunned: 1.0 },
    blockEffectiveness: 0.5,
    specialCostModifier: 0.7, // Very cheap specials
    energyRegen: 25,
};

export const AEON_GUARD_STATS: CharacterCombatStats = {
    maxHp: 105, // Elite Balanced
    maxEnergy: 105,
    damageModifiers: { punch: 1.05, kick: 1.05, block: 1.0, special: 1.05, stunned: 1.0 },
    blockEffectiveness: 0.55,
    specialCostModifier: 1.0,
    energyRegen: 21,
};

// =============================================================================
// PRECISION ARCHETYPE STATS (Hash-Hunter Base)
// =============================================================================

export const RAZOR_BOT_STATS: CharacterCombatStats = {
    maxHp: 90,
    maxEnergy: 100,
    damageModifiers: { punch: 1.0, kick: 1.0, block: 1.0, special: 1.3, stunned: 1.0 }, // Big finishes
    blockEffectiveness: 0.5,
    specialCostModifier: 1.0,
    energyRegen: 20,
};

export const SONIC_STRIKER_STATS: CharacterCombatStats = {
    maxHp: 100,
    maxEnergy: 100,
    damageModifiers: { punch: 1.15, kick: 1.15, block: 1.0, special: 1.0, stunned: 1.0 }, // Heavy hits
    blockEffectiveness: 0.5,
    specialCostModifier: 1.0,
    energyRegen: 15, // Slower regen due to heavy gear
};

export const PRISM_DUELIST_STATS: CharacterCombatStats = {
    maxHp: 95,
    maxEnergy: 100,
    damageModifiers: { punch: 1.0, kick: 1.0, block: 1.0, special: 1.1, stunned: 1.0 },
    blockEffectiveness: 0.75, // Excellent parry/block
    specialCostModifier: 0.9,
    energyRegen: 20,
};

export const VOID_REAPER_STATS: CharacterCombatStats = {
    maxHp: 88, // Glass Reaper
    maxEnergy: 115,
    damageModifiers: { punch: 1.25, kick: 1.25, block: 1.0, special: 1.25, stunned: 1.0 },
    blockEffectiveness: 0.3,
    specialCostModifier: 1.1,
    energyRegen: 20,
};

// Original Base Stats (Kept for fallback/reference)
export const CYBER_NINJA_STATS: CharacterCombatStats = {
    maxHp: 96, maxEnergy: 105,
    damageModifiers: { punch: 1.15, kick: 1.0, block: 1.0, special: 1.0, stunned: 1.0 },
    blockEffectiveness: 0.6, specialCostModifier: 0.85, energyRegen: 20,
};
export const DAG_WARRIOR_STATS: CharacterCombatStats = {
    maxHp: 100, maxEnergy: 100,
    damageModifiers: { punch: 1.0, kick: 1.0, block: 1.0, special: 1.0, stunned: 1.0 },
    blockEffectiveness: 0.5, specialCostModifier: 1.0, energyRegen: 20,
};
export const BLOCK_BRUISER_STATS: CharacterCombatStats = {
    maxHp: 110, maxEnergy: 85,
    damageModifiers: { punch: 1.0, kick: 1.2, block: 1.0, special: 1.0, stunned: 1.0 },
    blockEffectiveness: 0.4, specialCostModifier: 1.25, energyRegen: 20,
};
export const HASH_HUNTER_STATS: CharacterCombatStats = {
    maxHp: 98, maxEnergy: 105,
    damageModifiers: { punch: 1.0, kick: 1.1, block: 1.0, special: 1.15, stunned: 1.0 },
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
    "razor-bot-7": RAZOR_BOT_STATS,
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
