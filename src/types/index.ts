/**
 * Base TypeScript types for KaspaClash
 * Generated from: specs/001-core-fighting-game/data-model.md
 */

// =============================================================================
// PLAYER
// =============================================================================

/**
 * Represents a connected user identified by their Kaspa wallet address.
 */
export interface Player {
  /** Kaspa wallet address (e.g., `kaspa:qz...`) - Primary Key */
  address: string;
  /** Optional display name, defaults to truncated address */
  displayName: string | null;
  /** Total match wins */
  wins: number;
  /** Total match losses */
  losses: number;
  /** ELO-style rating for matchmaking (100-3000) */
  rating: number;
  /** Account creation timestamp */
  createdAt: Date;
  /** Last profile update */
  updatedAt: Date;
}

// =============================================================================
// CHARACTER
// =============================================================================

/**
 * Animation configuration for a character sprite.
 */
export interface SpriteAnimation {
  sheet: string;
  frames: number;
  frameRate: number;
  hitFrame?: number;
}

/**
 * Complete sprite configuration for a character.
 */
export interface SpriteConfig {
  idle: SpriteAnimation;
  punch: SpriteAnimation;
  kick: SpriteAnimation;
  block: SpriteAnimation;
  special: SpriteAnimation;
  hurt: SpriteAnimation;
  victory: SpriteAnimation;
  defeat: SpriteAnimation;
}

/**
 * A selectable fighter with distinct visual theme and animations.
 */
export interface Character {
  /** Unique identifier (e.g., `cyber-ninja`) */
  id: string;
  /** Display name (e.g., "Cyber Ninja") */
  name: string;
  /** Visual theme description */
  theme: string;
  /** Path to character portrait image */
  portraitUrl: string;
  /** Animation configuration */
  spriteConfig: SpriteConfig;
}

// =============================================================================
// MATCH
// =============================================================================

/**
 * Match format options.
 */
export type MatchFormat = "best_of_3" | "best_of_5";

/**
 * Match status states.
 */
export type MatchStatus =
  | "waiting"
  | "character_select"
  | "in_progress"
  | "completed";

/**
 * A game session between two players.
 */
export interface Match {
  /** Match identifier (UUID) */
  id: string;
  /** 6-character room code for private matches */
  roomCode: string | null;
  /** Host player address */
  player1Address: string;
  /** Joined player address */
  player2Address: string | null;
  /** P1's selected character */
  player1CharacterId: string | null;
  /** P2's selected character */
  player2CharacterId: string | null;
  /** Match format */
  format: MatchFormat;
  /** Current state */
  status: MatchStatus;
  /** Selection deadline for character select timer sync */
  selectionDeadlineAt: string | null;
  /** Winner address (set on completion) */
  winnerAddress: string | null;
  /** P1 round wins */
  player1RoundsWon: number;
  /** P2 round wins */
  player2RoundsWon: number;
  /** Match creation time */
  createdAt: Date;
  /** When gameplay began */
  startedAt: Date | null;
  /** When match ended */
  completedAt: Date | null;
}

// =============================================================================
// ROUND
// =============================================================================

/**
 * Available move types.
 */
export type MoveType = "punch" | "kick" | "block" | "special";

/**
 * A single round within a match.
 */
export interface Round {
  /** Round identifier (UUID) */
  id: string;
  /** Parent match ID */
  matchId: string;
  /** Round number (1, 2, 3, etc.) */
  roundNumber: number;
  /** P1's selected move */
  player1Move: MoveType | null;
  /** P2's selected move */
  player2Move: MoveType | null;
  /** Damage P1 dealt to P2 */
  player1DamageDealt: number | null;
  /** Damage P2 dealt to P1 */
  player2DamageDealt: number | null;
  /** P1's health after resolution */
  player1HealthAfter: number | null;
  /** P2's health after resolution */
  player2HealthAfter: number | null;
  /** Round winner (null for draw) */
  winnerAddress: string | null;
  /** Round creation time */
  createdAt: Date;
}

// =============================================================================
// MOVE
// =============================================================================

/**
 * An individual move action with on-chain verification.
 */
export interface Move {
  /** Move identifier (UUID) */
  id: string;
  /** Parent round ID */
  roundId: string;
  /** Player who made the move */
  playerAddress: string;
  /** Type of move */
  moveType: MoveType;
  /** Kaspa transaction ID */
  txId: string | null;
  /** Transaction confirmation timestamp */
  txConfirmedAt: Date | null;
  /** Move creation time */
  createdAt: Date;
}

// =============================================================================
// PLAYER ROLE
// =============================================================================

/**
 * Player role in a match.
 */
export type PlayerRole = "player1" | "player2";

// =============================================================================
// ROUND RESULT
// =============================================================================

/**
 * Round winner result.
 */
export type RoundWinner = "player1" | "player2" | "draw";

/**
 * Match end reason.
 */
export type MatchEndReason = "knockout" | "rounds_won" | "forfeit" | "timeout";

/**
 * Match completion data.
 */
export interface MatchResult {
  winner: PlayerRole | null;
  reason: MatchEndReason;
  player1FinalHealth: number;
  player2FinalHealth: number;
  player1RoundsWon: number;
  player2RoundsWon: number;
  txIds: string[];
}
