/**
 * Power Surge Types
 * Definitions for the Power Surge round boost feature
 * 
 * Power Surge cards appear at the start of each round in FightScene.
 * Players can choose one card by clicking and confirming via Kaspa transaction.
 * Effects last for ONE round only.
 */

// =============================================================================
// CARD DEFINITIONS
// =============================================================================

/**
 * Unique identifier for each Power Surge card.
 */
export type PowerSurgeCardId =
  | "dag-overclock"
  | "block-fortress"
  | "tx-storm"
  | "mempool-congest"
  | "blue-set-heal"
  | "orphan-smasher"
  | "10bps-barrage"
  | "pruned-rage"
  | "sompi-shield"
  | "hash-hurricane"
  | "ghost-dag"
  | "finality-fist"
  | "bps-blitz"
  | "vaultbreaker"
  | "chainbreaker";

/**
 * Rarity tier for visual styling.
 */
export type PowerSurgeRarity = "common" | "rare" | "epic" | "legendary";

/**
 * Power Surge card definition with all display and effect data.
 */
export interface PowerSurgeCard {
  /** Unique identifier */
  id: PowerSurgeCardId;
  /** Display name */
  name: string;
  /** Short description of effect */
  description: string;
  /** Neon border color (hex) */
  glowColor: number;
  /** Icon key for Phaser (e.g., "surge_dag_overclock") */
  iconKey: string;
  /** Effect type for combat engine */
  effectType: PowerSurgeEffectType;
  /** Effect parameters */
  effectParams: PowerSurgeEffectParams;
}

// =============================================================================
// EFFECT TYPES
// =============================================================================

/**
 * Categories of power surge effects.
 */
export type PowerSurgeEffectType =
  | "damage_multiplier"    // Multiply damage dealt
  | "damage_reduction"     // Reduce incoming damage
  | "hp_regen"            // Restore HP
  | "damage_reflect"      // Reflect damage when blocking
  | "priority_boost"      // Move goes first
  | "energy_burn"         // Burn opponent energy on hit
  | "conditional_heal"    // Heal on condition
  | "counter_multiplier"  // Multiplied counter damage
  | "double_hit"          // Attacks hit twice
  | "fury_boost"          // Boost fury/damage meter (+ damage, can't block)
  | "damage_immunity"     // Immune to all damage
  | "random_win"          // Random move auto-wins / dodge chance
  | "invisible_move"      // Move cannot be countered
  | "critical_special"    // Guaranteed crit on special
  | "energy_regen"        // Bonus energy regen
  | "energy_regen_with_cost" // Energy regen with HP cost
  | "energy_steal"        // Steal opponent energy
  | "opponent_stun"       // Stun opponent next move
  | "lifesteal"           // Heal for % of damage dealt
  | "energy_drain"        // Passive energy drain from opponent
  | "guard_break";        // Break guard on any hit

/**
 * Parameters for power surge effects.
 */
export interface PowerSurgeEffectParams {
  /** Damage multiplier (e.g., 1.5 for +50%) */
  damageMultiplier?: number;
  /** Incoming damage reduction (0.6 = take 60% less damage) */
  incomingDamageReduction?: number;
  /** HP amount to restore */
  hpRestore?: number;
  /** HP regen per turn */
  hpRegen?: number;
  /** HP cost to pay */
  hpCost?: number;
  /** Damage reflect percentage (0-1) */
  reflectPercent?: number;
  /** Priority boost amount */
  priorityBoost?: number;
  /** Energy to burn on hit */
  energyBurn?: number;
  /** Moves affected (e.g., ["punch", "kick"]) */
  affectedMoves?: string[];
  /** Counter damage multiplier */
  counterMultiplier?: number;
  /** Fury meter boost */
  furyBoost?: number;
  /** Energy to steal */
  energySteal?: number;
  /** Energy regen bonus per turn */
  energyRegenBonus?: number;
  /** Random win chance (0-1) */
  randomWinChance?: number;
  /** Disable block for this player */
  blockDisabled?: boolean;
  /** Percentage of damage converted to HP */
  lifestealPercent?: number;
  /** Energy drained from opponent */
  energyDrain?: number;
}

// =============================================================================
// CARD CATALOG
// =============================================================================

/**
 * Complete catalog of all 15 Power Surge cards.
 */
export const POWER_SURGE_CARDS: readonly PowerSurgeCard[] = [
  {
    id: "dag-overclock",
    name: "DAG Overclock",
    description: "+85% damage",
    glowColor: 0x00ff88,
    iconKey: "surge_dag-overclock",
    effectType: "damage_multiplier",
    effectParams: { damageMultiplier: 1.85, incomingDamageReduction: 0.0 }, // Buffed to 1.85
  },
  {
    id: "block-fortress",
    name: "Block Fortress",
    description: "Blocks reflect 1050% damage",
    glowColor: 0x00ffff,
    iconKey: "surge_block-fortress",
    effectType: "damage_reflect",
    effectParams: { reflectPercent: 10.5 }, // Buffed to 10.5
  },
  {
    id: "tx-storm",
    name: "Tx Storm",
    description: "+38 energy, lose 5 HP",
    glowColor: 0xffff00,
    iconKey: "surge_tx-storm",
    effectType: "energy_regen_with_cost",
    effectParams: { energyRegenBonus: 38, hpCost: 5 }, // Reduced to 38
  },
  {
    id: "mempool-congest",
    name: "Mempool Congest",
    description: "Stun opponent (Costs 7 HP)",
    glowColor: 0xff4400,
    iconKey: "surge_mempool-burn", // Reuse icon for now
    effectType: "opponent_stun",
    effectParams: { hpCost: 7 }, // Reduced cost to 7
  },
  {
    id: "blue-set-heal",
    name: "Blue Set Heal",
    description: "Restore 6.5 HP over time",
    glowColor: 0x0088ff,
    iconKey: "surge_blue-set-heal",
    effectType: "hp_regen",
    effectParams: { hpRegen: 6.5 }, // Reduced to 6.5
  },
  {
    id: "orphan-smasher",
    name: "Orphan Smasher",
    description: "Counter deals +125% damage",
    glowColor: 0xff0044,
    iconKey: "surge_orphan-smasher",
    effectType: "counter_multiplier",
    effectParams: { counterMultiplier: 2.25 }, // Reduced to 2.25
  },
  {
    id: "10bps-barrage",
    name: "10BPS Barrage",
    description: "Punch and kick cost 0 energy (+22 regen)",
    glowColor: 0x00ff44,
    iconKey: "surge_10bps-barrage",
    effectType: "energy_regen",
    effectParams: { energyRegenBonus: 22 }, // Reduced to 22
  },
  {
    id: "pruned-rage",
    name: "Pruned Rage",
    description: "+60% damage, can't block",
    glowColor: 0xff4444,
    iconKey: "surge_pruned-rage",
    effectType: "fury_boost",
    effectParams: { damageMultiplier: 1.6, blockDisabled: true }, // Reduced to 1.6
  },
  {
    id: "sompi-shield",
    name: "Sompi Shield",
    description: "Take 82% less damage",
    glowColor: 0xffd700,
    iconKey: "surge_sompi-shield",
    effectType: "damage_reduction",
    effectParams: { incomingDamageReduction: 0.82 }, // Increased to 0.82
  },
  {
    id: "hash-hurricane",
    name: "Hash Hurricane",
    description: "82% chance to dodge attack",
    glowColor: 0x8800ff,
    iconKey: "surge_hash-hurricane",
    effectType: "random_win",
    effectParams: { randomWinChance: 0.82 }, // Increased to 0.82
  },
  {
    id: "ghost-dag",
    name: "GhostDAG",
    description: "Opponent loses 22 Energy every turn",
    glowColor: 0x666699,
    iconKey: "surge_ghost-dag",
    effectType: "energy_drain",
    effectParams: { energyDrain: 22 },
  },
  {
    id: "finality-fist",
    name: "Finality Fist",
    description: "Special +125% dmg, costs +15 energy",
    glowColor: 0xff00ff,
    iconKey: "surge_finality-fist",
    effectType: "critical_special",
    effectParams: { damageMultiplier: 2.25 }, // Increased to 2.25
  },
  {
    id: "bps-blitz",
    name: "BPS Syphon",
    description: "Heal for 82% of damage dealt",
    glowColor: 0x44ff88,
    iconKey: "surge_bps-blitz",
    effectType: "lifesteal",
    effectParams: { lifestealPercent: 0.82 }, // Increased to 0.82
  },
  {
    id: "vaultbreaker",
    name: "Vaultbreaker",
    description: "Steal 35 energy on hit",
    glowColor: 0xffaa00,
    iconKey: "surge_vaultbreaker",
    effectType: "energy_steal",
    effectParams: { energySteal: 35 }, // Increased to 35
  },
  {
    id: "chainbreaker",
    name: "Chainbreaker",
    description: "Bypass block on any hit. +53% Dmg",
    glowColor: 0xff0000,
    iconKey: "surge_chainbreaker",
    effectType: "guard_break",
    effectParams: { damageMultiplier: 1.53 }, // Reduced to 1.53
  },
] as const;

/**
 * Get a card by its ID.
 */
export function getPowerSurgeCard(id: PowerSurgeCardId): PowerSurgeCard | undefined {
  return POWER_SURGE_CARDS.find((card) => card.id === id);
}

/**
 * Get random cards for a round.
 * @param count Number of cards to select (default 3)
 * @param excludeIds Card IDs to exclude (e.g., cards used in previous rounds)
 */
export function getRandomPowerSurgeCards(count: number = 3, excludeIds: PowerSurgeCardId[] = []): PowerSurgeCard[] {
  const available = POWER_SURGE_CARDS.filter((card) => !excludeIds.includes(card.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// =============================================================================
// MATCH STATE TYPES
// =============================================================================

/**
 * Power surge state for a single round.
 */
export interface RoundSurgeState {
  /** Round number (1-5) */
  roundNumber: number;
  /** Cards offered this round */
  offeredCards: PowerSurgeCardId[];
  /** Player 1's selection (null if not chosen) */
  player1Selection: PowerSurgeCardId | null;
  /** Player 1's transaction ID (null if not confirmed) */
  player1TxId: string | null;
  /** Player 2's selection (null if not chosen) */
  player2Selection: PowerSurgeCardId | null;
  /** Player 2's transaction ID (null if not confirmed) */
  player2TxId: string | null;
  /** Timestamp when cards were shown */
  shownAt: number;
  /** Deadline for selection (shownAt + 15000ms) */
  selectionDeadline: number;
}

/**
 * Complete power surge state for a match.
 */
export interface MatchSurgeState {
  /** Surge state per round */
  rounds: RoundSurgeState[];
  /** Cards used in previous rounds (to avoid repeats if desired) */
  usedCards: PowerSurgeCardId[];
}

/**
 * Payload for power surge selection event.
 */
export interface PowerSurgeSelectedPayload {
  /** Match ID */
  matchId: string;
  /** Round number */
  roundNumber: number;
  /** Player who selected */
  player: "player1" | "player2";
  /** Selected card ID */
  cardId: PowerSurgeCardId;
  /** Transaction ID */
  txId: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Payload for power surge cards shown event.
 */
export interface PowerSurgeCardsPayload {
  /** Match ID */
  matchId: string;
  /** Round number */
  roundNumber: number;
  /** Offered card IDs */
  cardIds: PowerSurgeCardId[];
  /** Selection deadline timestamp */
  deadline: number;
}

// =============================================================================
// TRANSACTION PAYLOAD
// =============================================================================

/**
 * Encode power surge selection as transaction payload.
 * Format: "surge:cardId|matchId|roundNumber"
 */
export function encodeSurgePayload(cardId: PowerSurgeCardId, matchId: string, roundNumber: number): string {
  return `surge:${cardId}|${matchId.substring(0, 8)}|${roundNumber}`;
}

/**
 * Decode power surge transaction payload.
 */
export function decodeSurgePayload(payload: string): { cardId: string; matchIdPrefix: string; roundNumber: number } | null {
  if (!payload.startsWith("surge:")) return null;
  const parts = payload.substring(6).split("|");
  if (parts.length !== 3) return null;
  return {
    cardId: parts[0],
    matchIdPrefix: parts[1],
    roundNumber: parseInt(parts[2], 10),
  };
}
