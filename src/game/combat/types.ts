/**
 * Combat Types for KaspaClash
 * Core type definitions for the turn-based fighting system
 */

import type { MoveType } from "@/types";

// =============================================================================
// CHARACTER COMBAT STATS
// =============================================================================

/**
 * Combat-specific stats for a character.
 */
export interface CharacterCombatStats {
    /** Base health points */
    maxHp: number;
    /** Base energy pool */
    maxEnergy: number;
    /** Damage modifiers per move type (multiplier, 1.0 = 100%) */
    damageModifiers: Record<MoveType, number>;
    /** Block effectiveness (damage reduction multiplier) */
    blockEffectiveness: number;
    /** Special move cost modifier (multiplier) */
    specialCostModifier: number;
    /** Energy regeneration per turn */
    energyRegen: number;
}

// =============================================================================
// MOVE DEFINITIONS
// =============================================================================

/**
 * Base stats for each move type.
 */
export interface MoveStats {
    damage: number;
    energyCost: number;
    /** Priority: higher = faster (used for same-speed resolution) */
    priority: number;
}

/**
 * Default move stats (before character modifiers).
 */
export const BASE_MOVE_STATS: Record<MoveType, MoveStats> = {
    punch: { damage: 10, energyCost: 0, priority: 3 },
    kick: { damage: 15, energyCost: 10, priority: 2 },
    block: { damage: 0, energyCost: 0, priority: 4 },
    special: { damage: 30, energyCost: 45, priority: 1 },
};

// =============================================================================
// TURN RESOLUTION
// =============================================================================

/**
 * Result of a move interaction (what happened to a player).
 */
export type MoveOutcome =
    | "hit"           // Normal hit, full damage
    | "blocked"       // Attack was blocked (reduced damage)
    | "stunned"       // Special was interrupted, no damage
    | "staggered"     // Punch was beaten by kick, no damage
    | "reflected"     // Kick was reflected by block
    | "shattered"     // Block was broken by special
    | "missed"        // Special missed due to stun
    | "guarding";     // Actively blocking

/**
 * Result for a single player in a turn.
 */
export interface PlayerTurnResult {
    move: MoveType;
    outcome: MoveOutcome;
    damageDealt: number;
    damageTaken: number;
    energySpent: number;
    guardBuildup: number;
    effects: TurnEffect[];
}

/**
 * Effects applied after a turn.
 */
export type TurnEffect =
    | "stun"          // Skip next action
    | "stagger"       // Reduced damage next turn
    | "guard_break"   // Guard meter reset, vulnerable
    | "guard_up";     // Guard meter increased

/**
 * Complete turn resolution result.
 */
export interface TurnResult {
    player1: PlayerTurnResult;
    player2: PlayerTurnResult;
    /** Description of what happened */
    narrative: string;
}

// =============================================================================
// GAME STATE
// =============================================================================

/**
 * Current state of a player during combat.
 */
export interface PlayerCombatState {
    characterId: string;
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
    guardMeter: number;     // 0-100, breaks at 100
    isStunned: boolean;
    isStaggered: boolean;
    roundsWon: number;
}

/**
 * Current state of the combat.
 */
export interface CombatState {
    player1: PlayerCombatState;
    player2: PlayerCombatState;
    currentRound: number;
    currentTurn: number;
    matchFormat: "best_of_3" | "best_of_5";
    roundsToWin: number;
    isRoundOver: boolean;
    isMatchOver: boolean;
    roundWinner: "player1" | "player2" | null;
    matchWinner: "player1" | "player2" | null;
}

// =============================================================================
// MOVE RESOLUTION MATRIX
// =============================================================================

/**
 * Resolution matrix: [attacker move][defender move] = attacker outcome
 * This defines the rock-paper-scissors interactions.
 */
export type ResolutionMatrix = Record<MoveType, Record<MoveType, MoveOutcome>>;

/**
 * The game's resolution matrix.
 * Punch > Special, Kick > Punch, Block > Kick, Special > Block
 */
export const RESOLUTION_MATRIX: ResolutionMatrix = {
    punch: {
        punch: "hit",        // Both punch, both hit
        kick: "staggered",   // Kick beats punch
        block: "blocked",    // Block stops punch
        special: "hit",      // Punch stuns special user
    },
    kick: {
        punch: "hit",        // Kick staggers punch
        kick: "hit",         // Both kick, both hit
        block: "reflected",  // Block reflects kick
        special: "hit",      // Kick lands on special user
    },
    block: {
        punch: "guarding",   // Block stops punch
        kick: "guarding",    // Block reflects kick
        block: "guarding",   // Both block, nothing happens
        special: "shattered",// Special breaks block
    },
    special: {
        punch: "missed",     // Special is stunned by punch
        kick: "hit",         // Special hits kick user
        block: "hit",        // Special shatters block
        special: "hit",      // Both special, both hit
    },
};

// =============================================================================
// CONSTANTS
// =============================================================================

export const COMBAT_CONSTANTS = {
    /** Energy regenerated per turn */
    BASE_ENERGY_REGEN: 20,
    /** Guard meter increase when blocking */
    GUARD_BUILDUP_ON_BLOCK: 25,
    /** Guard meter increase when block is hit */
    GUARD_BUILDUP_ON_HIT: 15,
    /** Guard meter threshold for break */
    GUARD_BREAK_THRESHOLD: 100,
    /** Damage multiplier when block is shattered */
    SHATTER_DAMAGE_MULTIPLIER: 1.5,
    /** Damage reduction when blocking */
    BLOCK_DAMAGE_REDUCTION: 0.5,
    /** Damage reflection amount for blocked kicks */
    KICK_REFLECT_PERCENT: 0.3,
    /** Stagger damage reduction */
    STAGGER_DAMAGE_REDUCTION: 0.5,
};
