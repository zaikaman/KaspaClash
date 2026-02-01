/**
 * Combat Surge Effects
 * Applies Power Surge card effects during combat resolution
 * 
 * This module provides functions to calculate damage modifiers,
 * priority changes, and other effects based on active surge cards.
 */

import type { MoveType } from "@/types";
import type {
  PowerSurgeCardId,
  PowerSurgeCard,
  PowerSurgeEffectType,
} from "@/types/power-surge";
import { getPowerSurgeCard } from "@/types/power-surge";

// =============================================================================
// TYPES
// =============================================================================

export interface SurgeModifiers {
  /** Damage multiplier (1.0 = normal) */
  damageMultiplier: number;
  /** Incoming damage reduction (0.0 = none, 0.6 = 60% less damage) */
  incomingDamageReduction: number;
  /** Priority boost (0 = normal) */
  priorityBoost: number;
  /** Energy burn on hit */
  energyBurn: number;
  /** Energy steal on hit */
  energySteal: number;
  /** Passive energy drain (always applies) */
  energyDrain: number;
  /** HP regen this turn */
  hpRegen: number;
  /** HP cost to pay when using this surge */
  hpCost: number;
  /** Full heal flag */
  fullHeal: boolean;
  /** Damage immunity flag */
  damageImmunity: boolean;
  /** Invisible move (cannot be countered) */
  invisibleMove: boolean;
  /** Random win chance (0-1) for dodge/evasion */
  randomWinChance: number;
  /** Double hit for affected moves */
  doubleHit: boolean;
  /** Counter multiplier (for counter-attacks) */
  counterMultiplier: number;
  /** Damage reflect percent (0-1) */
  reflectPercent: number;
  /** Opponent stun next turn */
  opponentStun: boolean;
  /** Bypass opponent's block reduction on any hit */
  bypassBlockOnHit: boolean;
  /** Critical hit guaranteed */
  criticalHit: boolean;
  /** Energy regen bonus */
  energyRegenBonus: number;
  /** Moves affected by double hit */
  doubleHitMoves: MoveType[];
  /** Block is disabled (cannot use block effectively) */
  blockDisabled: boolean;
  /** Opponent's block is disabled (Pruned Rage) */
  opponentBlockDisabled: boolean;
  /** Lifesteal percentage */
  lifestealPercent: number;
  /** Extra energy cost for special move (Finality Fist) */
  specialEnergyCost: number;
}

export interface SurgeEffectResult {
  player1Modifiers: SurgeModifiers;
  player2Modifiers: SurgeModifiers;
}

// =============================================================================
// DEFAULT MODIFIERS
// =============================================================================

function getDefaultModifiers(): SurgeModifiers {
  return {
    damageMultiplier: 1.0,
    incomingDamageReduction: 0,
    priorityBoost: 0,
    energyBurn: 0,
    energySteal: 0,
    energyDrain: 0,
    hpRegen: 0,
    hpCost: 0,
    fullHeal: false,
    damageImmunity: false,
    invisibleMove: false,
    randomWinChance: 0,
    doubleHit: false,
    counterMultiplier: 1.0,
    reflectPercent: 0,
    opponentStun: false,
    bypassBlockOnHit: false,
    criticalHit: false,
    energyRegenBonus: 0,
    doubleHitMoves: [],
    blockDisabled: false,
    opponentBlockDisabled: false,
    lifestealPercent: 0,
    specialEnergyCost: 0,
  };
}

// =============================================================================
// SURGE EFFECT CALCULATION
// =============================================================================

/**
 * Calculate surge modifiers for both players based on their active cards.
 * 
 * @param player1Surge - Player 1's active surge card (or null)
 * @param player2Surge - Player 2's active surge card (or null)
 * @returns Modifiers for both players
 */
export function calculateSurgeEffects(
  player1Surge: PowerSurgeCardId | null,
  player2Surge: PowerSurgeCardId | null
): SurgeEffectResult {
  return {
    player1Modifiers: player1Surge
      ? calculateCardModifiers(getPowerSurgeCard(player1Surge) ?? null)
      : getDefaultModifiers(),
    player2Modifiers: player2Surge
      ? calculateCardModifiers(getPowerSurgeCard(player2Surge) ?? null)
      : getDefaultModifiers(),
  };
}

/**
 * Calculate modifiers for a single surge card.
 */
function calculateCardModifiers(card: PowerSurgeCard | null): SurgeModifiers {
  const mods = getDefaultModifiers();
  if (!card) return mods;

  const params = card.effectParams;

  switch (card.effectType) {
    case "damage_multiplier":
      mods.damageMultiplier = params.damageMultiplier ?? 1.0;
      // Also check for defense reduction (DAG Overclock)
      if (params.incomingDamageReduction !== undefined) {
        // Negative value means MORE damage taken
        mods.incomingDamageReduction = params.incomingDamageReduction;
      }
      break;

    case "damage_reduction":
      // Sompi Shield - reduce incoming damage
      mods.incomingDamageReduction = params.incomingDamageReduction ?? 0;
      break;

    case "hp_regen":
      mods.hpRegen = params.hpRegen ?? 0;
      break;

    case "damage_reflect":
      mods.hpRegen = params.hpRegen ?? 0;
      mods.reflectPercent = params.reflectPercent ?? 0;
      break;

    case "priority_boost":
      mods.priorityBoost = params.priorityBoost ?? 0;
      break;

    case "energy_burn":
      mods.energyBurn = params.energyBurn ?? 0;
      break;

    case "energy_drain":
      mods.energyDrain = params.energyDrain ?? 0;
      break;

    case "conditional_heal":
      // Blue Set Heal - full heal if tx confirms first
      // For simplicity, we grant full heal since we can't verify tx order easily
      mods.fullHeal = true;
      break;

    case "counter_multiplier":
      mods.counterMultiplier = params.counterMultiplier ?? 1.0;
      break;

    case "double_hit":
      mods.doubleHit = true;
      mods.doubleHitMoves = (params.affectedMoves ?? ["punch", "kick"]) as MoveType[];
      break;

    case "fury_boost":
      // Pruned Rage: damage boost and opponent can't block
      mods.damageMultiplier = params.damageMultiplier ?? 1.3;
      mods.opponentBlockDisabled = params.opponentBlockDisabled ?? false;
      break;

    case "damage_immunity":
      mods.damageImmunity = true;
      break;

    case "random_win":
      // Hash Hurricane: chance to dodge/auto-win
      mods.randomWinChance = params.randomWinChance ?? 1.0;
      break;

    case "invisible_move":
      mods.invisibleMove = true;
      break;

    case "critical_special":
      mods.criticalHit = true;
      mods.damageMultiplier = params.damageMultiplier ?? 1.7;
      mods.specialEnergyCost = params.energyCostBonus ?? 12;
      break;

    case "energy_regen":
      mods.energyRegenBonus = params.energyRegenBonus ?? 18;
      break;

    case "energy_regen_with_cost":
      // Tx Storm: gain energy but lose HP
      mods.energyRegenBonus = params.energyRegenBonus ?? 25;
      mods.hpCost = params.hpCost ?? 4;
      break;

    case "energy_steal":
      mods.energySteal = params.energySteal ?? 18;
      break;

    case "opponent_stun":
      mods.opponentStun = true;
      mods.hpCost = params.hpCost ?? 6; // Mempool Congest HP cost
      break;

    case "lifesteal":
      mods.lifestealPercent = params.lifestealPercent ?? 0.35;
      break;

    case "guard_break":
      // Chainbreaker: bypass block on any hit
      mods.bypassBlockOnHit = true;
      mods.damageMultiplier = params.damageMultiplier ?? 1.15;
      break;
  }

  return mods;
}

// =============================================================================
// EFFECT APPLICATION HELPERS
// =============================================================================

/**
 * Apply damage modifiers to base damage.
 * 
 * @param baseDamage - Original damage value
 * @param modifiers - Active surge modifiers
 * @param move - The move being used
 * @param isCounter - Whether this is a counter-attack
 * @returns Modified damage value
 */
export function applyDamageModifiers(
  baseDamage: number,
  modifiers: SurgeModifiers,
  move: MoveType,
  isCounter: boolean = false
): number {
  let damage = baseDamage;

  // Apply base damage multiplier
  damage *= modifiers.damageMultiplier;

  // Apply counter multiplier if this is a counter
  if (isCounter) {
    damage *= modifiers.counterMultiplier;
  }

  // Apply double hit
  if (modifiers.doubleHit && modifiers.doubleHitMoves.includes(move)) {
    damage *= 2;
  }

  // Note: criticalHit flag is informational only - the damage bonus is already
  // applied via damageMultiplier for Finality Fist (critical_special effect type)

  return Math.floor(damage);
}

/**
 * Check if a player should win the matchup randomly (Hash Hurricane).
 * 
 * @param modifiers - Active surge modifiers
 * @returns True if random win triggers
 */
export function checkRandomWin(modifiers: SurgeModifiers): boolean {
  if (modifiers.randomWinChance <= 0) return false;
  return Math.random() < modifiers.randomWinChance;
}

/**
 * Apply incoming damage considering immunity, reflection, and damage reduction.
 * 
 * @param incomingDamage - Damage being received
 * @param defenderModifiers - Defender's surge modifiers
 * @param isBlocking - Whether defender is blocking (required for Block Fortress reflection)
 * @returns { actualDamage, reflectedDamage }
 */
export function applyDefensiveModifiers(
  incomingDamage: number,
  defenderModifiers: SurgeModifiers,
  isBlocking: boolean = false
): { actualDamage: number; reflectedDamage: number } {
  // Sompi Shield - complete immunity
  if (defenderModifiers.damageImmunity) {
    return { actualDamage: 0, reflectedDamage: 0 };
  }

  let actualDamage = incomingDamage;

  // Apply incoming damage reduction (Sompi Shield style)
  // Positive value = damage reduction, negative = damage amplification (DAG Overclock weakness)
  if (defenderModifiers.incomingDamageReduction !== 0) {
    // If reduction is 0.6, take 40% damage (60% less)
    // If reduction is -0.25, take 125% damage (25% more)
    const multiplier = 1 - defenderModifiers.incomingDamageReduction;
    actualDamage = Math.floor(actualDamage * multiplier);
  }

  // Block Fortress - damage reflection ONLY when blocking
  let reflectedDamage = 0;
  if (isBlocking && defenderModifiers.reflectPercent > 0) {
    reflectedDamage = Math.floor(incomingDamage * defenderModifiers.reflectPercent);
  }

  return { actualDamage, reflectedDamage };
}

/**
 * Apply energy effects (burn, steal, regen, drain).
 * 
 * @param attackerModifiers - Attacker's surge modifiers
 * @param defenderEnergy - Defender's current energy
 * @param didHit - Whether the attack connected
 * @returns { energyBurned, energyStolen, energyRegenBonus }
 */
export function applyEnergyEffects(
  attackerModifiers: SurgeModifiers,
  defenderEnergy: number,
  didHit: boolean
): { energyBurned: number; energyStolen: number; energyRegenBonus: number } {
  let energyBurned = 0;
  let energyStolen = 0;

  if (didHit) {
    // Mempool Burn - burn opponent energy
    energyBurned += Math.min(attackerModifiers.energyBurn, defenderEnergy);

    // Vaultbreaker - steal opponent energy
    energyStolen += Math.min(attackerModifiers.energySteal, defenderEnergy);
  }

  // Passive Drain (GhostDAG) - Applies regardless of hit
  if (attackerModifiers.energyDrain > 0) {
    // Add to energyBurned, but cap at remaining defender energy (after burn from hit)
    const remainingEnergy = Math.max(0, defenderEnergy - energyBurned);
    energyBurned += Math.min(attackerModifiers.energyDrain, remainingEnergy);
  }

  return {
    energyBurned,
    energyStolen,
    energyRegenBonus: attackerModifiers.energyRegenBonus,
  };
}

/**
 * Apply HP effects (regen, full heal).
 * 
 * @param modifiers - Player's surge modifiers
 * @param currentHp - Current HP
 * @param maxHp - Maximum HP
 * @returns New HP value
 */
export function applyHpEffects(
  modifiers: SurgeModifiers,
  currentHp: number,
  maxHp: number
): number {
  // CRITICAL: Don't apply HP effects to dead players (prevents resurrection bug)
  if (currentHp <= 0) {
    return currentHp;
  }

  let hp = currentHp;

  // Full heal (Blue Set Heal)
  if (modifiers.fullHeal) {
    return maxHp;
  }

  // HP regen
  if (modifiers.hpRegen > 0) {
    hp = Math.min(maxHp, hp + modifiers.hpRegen);
  }

  // HP cost (Tx Storm, Mempool Congest)
  if (modifiers.hpCost > 0) {
    hp = Math.max(1, hp - modifiers.hpCost); // Never kill from HP cost, min 1 HP
  }

  return hp;
}

/**
 * Check if attacker's move should bypass counter (GhostDAG).
 * 
 * @param modifiers - Attacker's surge modifiers
 * @returns True if move is invisible
 */
export function isInvisibleMove(modifiers: SurgeModifiers): boolean {
  return modifiers.invisibleMove;
}

/**
 * Check if opponent should be stunned (Chainbreaker).
 * 
 * @param modifiers - Attacker's surge modifiers
 * @returns True if opponent should be stunned
 */
export function shouldStunOpponent(modifiers: SurgeModifiers): boolean {
  return modifiers.opponentStun;
}

/**
 * Check if attacker should bypass opponent's block on hit (Chainbreaker).
 * 
 * @param modifiers - Attacker's surge modifiers
 * @returns True if block should be bypassed on hit
 */
export function shouldBypassBlock(modifiers: SurgeModifiers): boolean {
  return modifiers.bypassBlockOnHit;
}

/**
 * Check if block is disabled for this player.
 * Block can be disabled by:
 * 1. Player's own effect (legacy, not currently used)
 * 2. Opponent's Pruned Rage effect (opponentBlockDisabled)
 * 
 * @param myModifiers - This player's surge modifiers
 * @param opponentModifiers - Opponent's surge modifiers (optional, for Pruned Rage check)
 * @returns True if block is disabled
 */
export function isBlockDisabled(myModifiers: SurgeModifiers, opponentModifiers?: SurgeModifiers): boolean {
  // Check if my own effect disables my block (legacy)
  if (myModifiers.blockDisabled) return true;
  
  // Check if opponent's Pruned Rage disables my block
  if (opponentModifiers?.opponentBlockDisabled) return true;
  
  return false;
}

/**
 * Compare priorities for move resolution order.
 * Higher priority goes first. BPS Blitz adds priority.
 * 
 * @param p1Priority - Player 1's base priority
 * @param p1Modifiers - Player 1's surge modifiers
 * @param p2Priority - Player 2's base priority
 * @param p2Modifiers - Player 2's surge modifiers
 * @returns 1 if P1 goes first, -1 if P2 goes first, 0 if simultaneous
 */
export function comparePriority(
  p1Priority: number,
  p1Modifiers: SurgeModifiers,
  p2Priority: number,
  p2Modifiers: SurgeModifiers
): number {
  const p1Total = p1Priority + p1Modifiers.priorityBoost;
  const p2Total = p2Priority + p2Modifiers.priorityBoost;

  if (p1Total > p2Total) return 1;
  if (p2Total > p1Total) return -1;
  return 0;
}
