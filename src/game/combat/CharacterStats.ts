/**
 * Character Combat Stats
 * Defines the combat-specific stats for each character
 */

import type { CharacterCombatStats } from "./types";

// =============================================================================
// CHARACTER STATS DEFINITIONS
// =============================================================================

/**
 * Cyber Ninja - Fast and technical (Purple theme)
 * - Lower HP (92) but higher energy (105)
 * - Enhanced punch damage and speed
 * - Better blocking
 * - Cheaper specials
 */
export const CYBER_NINJA_STATS: CharacterCombatStats = {
    maxHp: 92,
    maxEnergy: 105,
    damageModifiers: {
        punch: 1.15,   // 15% more punch damage
        kick: 1.0,
        block: 1.0,
        special: 1.0,
    },
    blockEffectiveness: 0.6,      // Takes only 40% damage when blocking (vs 50%)
    specialCostModifier: 0.85,    // Specials cost 15% less energy
    energyRegen: 20,
};

/**
 * DAG Warrior - Balanced all-rounder (Blue theme)
 * - Standard HP (100) and energy (100)
 * - No modifications - the baseline character
 */
export const DAG_WARRIOR_STATS: CharacterCombatStats = {
    maxHp: 100,
    maxEnergy: 100,
    damageModifiers: {
        punch: 1.0,
        kick: 1.0,
        block: 1.0,
        special: 1.0,
    },
    blockEffectiveness: 0.5,      // Standard 50% damage reduction
    specialCostModifier: 1.0,     // Standard special cost
    energyRegen: 20,
};

/**
 * Block Bruiser - Heavy tank (Orange theme)
 * - Higher HP (115) but lower energy (85)
 * - Enhanced kick damage
 * - Better blocking
 * - Expensive specials
 */
export const BLOCK_BRUISER_STATS: CharacterCombatStats = {
    maxHp: 115,
    maxEnergy: 85,
    damageModifiers: {
        punch: 1.0,
        kick: 1.2,     // 20% more kick damage
        block: 1.0,
        special: 1.0,
    },
    blockEffectiveness: 0.4,      // Takes only 40% damage when blocking
    specialCostModifier: 1.25,    // Specials cost 25% more energy
    energyRegen: 20,
};

/**
 * Hash Hunter - Aggressive attacker (Red theme)
 * - Slightly lower HP (98) but higher energy (105)
 * - Enhanced kick and special damage
 * - Weaker blocking
 */
export const HASH_HUNTER_STATS: CharacterCombatStats = {
    maxHp: 98,
    maxEnergy: 105,
    damageModifiers: {
        punch: 1.0,
        kick: 1.1,     // 10% more kick damage
        block: 1.0,
        special: 1.15, // 15% more special damage
    },
    blockEffectiveness: 0.65,     // Takes 65% damage when blocking (weaker)
    specialCostModifier: 1.0,     // Standard special cost
    energyRegen: 20,
};

// =============================================================================
// STATS LOOKUP
// =============================================================================

/**
 * Character stats lookup by character ID.
 */
export const CHARACTER_COMBAT_STATS: Record<string, CharacterCombatStats> = {
    "cyber-ninja": CYBER_NINJA_STATS,
    "dag-warrior": DAG_WARRIOR_STATS,
    "block-bruiser": BLOCK_BRUISER_STATS,
    "hash-hunter": HASH_HUNTER_STATS,
};

/**
 * Get combat stats for a character by ID.
 * Falls back to DAG Warrior stats if not found.
 */
export function getCharacterCombatStats(characterId: string): CharacterCombatStats {
    return CHARACTER_COMBAT_STATS[characterId] ?? DAG_WARRIOR_STATS;
}
