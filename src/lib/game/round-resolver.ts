/**
 * Round Resolver
 * Calculates damage and determines round winners based on MOVE_PROPERTIES
 */

import type { MoveType, RoundWinner, PlayerRole } from "@/types";
import { MOVE_PROPERTIES, GAME_CONSTANTS, DAMAGE_MULTIPLIERS } from "@/types/constants";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Move resolution result for a single player.
 */
export interface PlayerMoveResult {
  move: MoveType;
  damageDealt: number;
  damageTaken: number;
  moveSuccess: boolean; // True if move "beat" opponent's move
}

/**
 * Complete round resolution result.
 */
export interface RoundResolutionResult {
  player1: PlayerMoveResult;
  player2: PlayerMoveResult;
  winner: RoundWinner;
  isKnockout: boolean;
  player1HealthAfter: number;
  player2HealthAfter: number;
}

/**
 * Input for round resolution.
 */
export interface RoundResolutionInput {
  player1Move: MoveType;
  player2Move: MoveType;
  player1Health: number;
  player2Health: number;
}

// =============================================================================
// MOVE COMPARISON
// =============================================================================

/**
 * Check if move A beats move B.
 */
export function doesMoveBeat(moveA: MoveType, moveB: MoveType): boolean {
  const moveAProps = MOVE_PROPERTIES[moveA];
  return moveAProps.beats.includes(moveB);
}

/**
 * Get the advantage in a move matchup.
 * Returns: 1 if move1 wins, -1 if move2 wins, 0 if draw
 */
export function getMoveAdvantage(move1: MoveType, move2: MoveType): -1 | 0 | 1 {
  const move1Beats = doesMoveBeat(move1, move2);
  const move2Beats = doesMoveBeat(move2, move1);

  if (move1Beats && !move2Beats) return 1;
  if (move2Beats && !move1Beats) return -1;
  return 0;
}

// =============================================================================
// DAMAGE CALCULATION
// =============================================================================

/**
 * Calculate damage dealt by a move against an opponent's move.
 */
export function calculateDamage(
  attackerMove: MoveType,
  defenderMove: MoveType
): number {
  const attackProps = MOVE_PROPERTIES[attackerMove];
  const baseDamage = attackProps.damage;

  // Check if the attack beats the defense
  const attackBeats = doesMoveBeat(attackerMove, defenderMove);
  const defenseBeats = doesMoveBeat(defenderMove, attackerMove);

  // If attacker's move beats defender's move, full damage
  if (attackBeats) {
    // Apply counter bonus multiplier if applicable
    return Math.floor(baseDamage * DAMAGE_MULTIPLIERS.COUNTER_BONUS);
  }

  // If defender's move beats attacker's move, no damage
  if (defenseBeats) {
    return 0;
  }

  // Same move (draw) - both take reduced damage
  if (attackerMove === defenderMove) {
    return Math.floor(baseDamage * DAMAGE_MULTIPLIERS.SAME_MOVE);
  }

  // Neutral matchup (neither beats the other, but different moves)
  // This shouldn't happen with current move set, but handle it
  return baseDamage;
}

/**
 * Calculate special move damage with bonus mechanics.
 */
export function calculateSpecialDamage(
  defenderMove: MoveType,
  defenderHealth: number
): number {
  const specialProps = MOVE_PROPERTIES.special;
  let damage = specialProps.damage;

  // Special beats punch and kick
  if (doesMoveBeat("special", defenderMove)) {
    damage = Math.floor(damage * DAMAGE_MULTIPLIERS.COUNTER_BONUS);

    // Bonus damage if opponent is at low health
    if (defenderHealth <= GAME_CONSTANTS.STARTING_HEALTH * 0.25) {
      damage = Math.floor(damage * DAMAGE_MULTIPLIERS.LOW_HEALTH_BONUS);
    }
  }

  // Block beats special - no damage
  if (doesMoveBeat(defenderMove, "special")) {
    return 0;
  }

  return damage;
}

// =============================================================================
// ROUND RESOLUTION
// =============================================================================

/**
 * Resolve a complete round between two players.
 */
export function resolveRound(input: RoundResolutionInput): RoundResolutionResult {
  const { player1Move, player2Move, player1Health, player2Health } = input;

  // Calculate damage for each player
  let player1Damage: number;
  let player2Damage: number;

  // Handle special moves separately for bonus mechanics
  if (player1Move === "special") {
    player1Damage = calculateSpecialDamage(player2Move, player2Health);
  } else {
    player1Damage = calculateDamage(player1Move, player2Move);
  }

  if (player2Move === "special") {
    player2Damage = calculateSpecialDamage(player1Move, player1Health);
  } else {
    player2Damage = calculateDamage(player2Move, player1Move);
  }

  // Calculate new health values
  const player1HealthAfter = Math.max(0, player1Health - player2Damage);
  const player2HealthAfter = Math.max(0, player2Health - player1Damage);

  // Check for knockout
  const player1Knockout = player1HealthAfter <= 0;
  const player2Knockout = player2HealthAfter <= 0;
  const isKnockout = player1Knockout || player2Knockout;

  // Determine winner
  let winner: RoundWinner;

  if (player1Knockout && player2Knockout) {
    // Double knockout - compare remaining damage dealt
    winner = player1Damage > player2Damage ? "player1" :
      player2Damage > player1Damage ? "player2" : "draw";
  } else if (player1Knockout) {
    winner = "player2";
  } else if (player2Knockout) {
    winner = "player1";
  } else {
    // No knockout - compare damage dealt this round
    if (player1Damage > player2Damage) {
      winner = "player1";
    } else if (player2Damage > player1Damage) {
      winner = "player2";
    } else {
      winner = "draw";
    }
  }

  return {
    player1: {
      move: player1Move,
      damageDealt: player1Damage,
      damageTaken: player2Damage,
      moveSuccess: doesMoveBeat(player1Move, player2Move),
    },
    player2: {
      move: player2Move,
      damageDealt: player2Damage,
      damageTaken: player1Damage,
      moveSuccess: doesMoveBeat(player2Move, player1Move),
    },
    winner,
    isKnockout,
    player1HealthAfter,
    player2HealthAfter,
  };
}

// =============================================================================
// MATCH RESOLUTION
// =============================================================================

/**
 * Check if match is over based on rounds won.
 */
export function isMatchOver(
  player1RoundsWon: number,
  player2RoundsWon: number,
  roundsToWin: number = GAME_CONSTANTS.ROUNDS_TO_WIN_BEST_OF_3
): boolean {
  return player1RoundsWon >= roundsToWin || player2RoundsWon >= roundsToWin;
}

/**
 * Get match winner if match is over.
 */
export function getMatchWinner(
  player1RoundsWon: number,
  player2RoundsWon: number,
  roundsToWin: number = GAME_CONSTANTS.ROUNDS_TO_WIN_BEST_OF_3
): PlayerRole | null {
  if (player1RoundsWon >= roundsToWin) return "player1";
  if (player2RoundsWon >= roundsToWin) return "player2";
  return null;
}

/**
 * Calculate new health for next round (doesn't reset between rounds).
 */
export function getNextRoundHealth(
  currentHealth: number,
  minHealth: number = 1
): number {
  // Health carries over between rounds, but ensure minimum for fairness
  return Math.max(minHealth, currentHealth);
}

// =============================================================================
// MOVE DESCRIPTIONS
// =============================================================================

/**
 * Get a description of the move interaction.
 */
export function getMoveInteractionDescription(
  move1: MoveType,
  move2: MoveType
): string {
  if (move1 === move2) {
    return `Both players used ${move1}! It's a clash!`;
  }

  if (doesMoveBeat(move1, move2)) {
    return `${capitalize(move1)} beats ${move2}!`;
  }

  if (doesMoveBeat(move2, move1)) {
    return `${capitalize(move2)} beats ${move1}!`;
  }

  return `${capitalize(move1)} vs ${move2}!`;
}

/**
 * Get result announcement text.
 */
export function getRoundResultText(result: RoundResolutionResult): string {
  const { player1, player2, winner, isKnockout } = result;

  if (isKnockout) {
    if (winner === "draw") {
      return "DOUBLE KNOCKOUT!";
    }
    return `${winner === "player1" ? "PLAYER 1" : "PLAYER 2"} WINS BY KNOCKOUT!`;
  }

  if (winner === "draw") {
    return "DRAW!";
  }

  const winnerName = winner === "player1" ? "Player 1" : "Player 2";
  const winnerDamage = winner === "player1" ? player1.damageDealt : player2.damageDealt;

  return `${winnerName} deals ${winnerDamage} damage!`;
}

// =============================================================================
// HELPERS
// =============================================================================

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get all valid moves.
 */
export function getValidMoves(): MoveType[] {
  return ["punch", "kick", "block", "special"];
}

/**
 * Get random move (for AI/practice mode).
 */
export function getRandomMove(): MoveType {
  const moves = getValidMoves();
  return moves[Math.floor(Math.random() * moves.length)];
}

/**
 * Get weighted random move (for smarter AI).
 */
export function getWeightedRandomMove(
  weights: Record<MoveType, number> = { punch: 30, kick: 30, block: 25, special: 15, stunned: 0 }
): MoveType {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [move, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return move as MoveType;
    }
  }

  return "punch"; // Fallback
}
