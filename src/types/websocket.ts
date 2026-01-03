/**
 * WebSocket event types for KaspaClash
 * Generated from: specs/001-core-fighting-game/contracts/websocket.md
 */

import type { MoveType, PlayerRole, RoundWinner, MatchEndReason } from "./index";

// =============================================================================
// BASE TYPES
// =============================================================================

/**
 * Base structure for all broadcast events.
 */
export interface BroadcastEvent<T> {
  type: "broadcast";
  event: string;
  payload: T;
}

// =============================================================================
// MATCHMAKING QUEUE CHANNEL
// =============================================================================

/**
 * Channel: matchmaking:queue (Presence)
 */

/**
 * Player join presence track payload.
 */
export interface QueuePlayerPresence {
  address: string;
  joinedAt: number; // Unix timestamp (ms)
  rating: number;
}

/**
 * Queue presence state format.
 */
export interface QueuePresenceState {
  [presenceKey: string]: (QueuePlayerPresence & { presenceRef: string })[];
}

// =============================================================================
// GAME ROOM CHANNEL
// =============================================================================

/**
 * Channel: game:${matchId} (Broadcast + Presence)
 */

/**
 * Game player presence payload.
 */
export interface GamePlayerPresence {
  address: string;
  role: PlayerRole;
  isReady: boolean;
}

/**
 * Player disconnect event payload.
 */
export interface PlayerDisconnectPayload {
  key: string;
  leftAt: number;
}

// =============================================================================
// BROADCAST EVENTS
// =============================================================================

/**
 * Event: character_selected
 * Sent when a player selects their character.
 */
export interface CharacterSelectedPayload {
  player: PlayerRole;
  /** Only visible after both select (null during selection) */
  characterId: string | null;
  locked: boolean;
}

/**
 * Event: match_starting
 * Sent when both players have selected characters.
 */
export interface MatchStartingPayload {
  matchId: string;
  player1: {
    address: string;
    characterId: string;
  };
  player2: {
    address: string;
    characterId: string;
  };
  format: "best_of_3" | "best_of_5";
  /** Unix timestamp when countdown ends */
  startsAt: number;
}

/**
 * Event: round_starting
 * Sent at the beginning of each round.
 */
export interface RoundStartingPayload {
  roundNumber: number;
  player1Health: number;
  player2Health: number;
  player1RoundsWon: number;
  player2RoundsWon: number;
  /** Unix timestamp for move deadline */
  moveDeadline: number;
}

/**
 * Event: move_submitted
 * Sent when a player submits their move (without revealing it).
 */
export interface MoveSubmittedPayload {
  player: PlayerRole;
  /** Transaction ID if on-chain, null for pending */
  txId: string | null;
  submittedAt: number;
}

/**
 * Event: move_confirmed
 * Sent when a move's transaction is confirmed on Kaspa.
 */
export interface MoveConfirmedPayload {
  player: PlayerRole;
  txId: string;
  confirmedAt: number;
  blockHeight: number;
}

/**
 * Round effect types.
 */
export type RoundEffectType = "hit" | "block" | "critical" | "ko";

/**
 * Individual round effect.
 */
export interface RoundEffect {
  type: RoundEffectType;
  target: PlayerRole;
  value?: number;
}

/**
 * Player result in a round.
 */
export interface PlayerRoundResult {
  move: MoveType;
  damageDealt: number;
  healthAfter: number;
  txId: string;
}

/**
 * Event: round_resolved
 * Sent when both moves are confirmed and round is resolved.
 */
export interface RoundResolvedPayload {
  roundNumber: number;
  player1: PlayerRoundResult;
  player2: PlayerRoundResult;
  roundWinner: RoundWinner;
  effects: RoundEffect[];
}

/**
 * Match statistics.
 */
export interface MatchStats {
  totalRounds: number;
  player1TotalDamage: number;
  player2TotalDamage: number;
  player1MostUsedMove: string;
  player2MostUsedMove: string;
  matchDurationSeconds: number;
}

/**
 * Event: match_ended
 * Sent when the match concludes.
 */
export interface MatchEndedPayload {
  matchId: string;
  winner: PlayerRole;
  winnerAddress: string;
  finalScore: {
    player1RoundsWon: number;
    player2RoundsWon: number;
  };
  reason: MatchEndReason;
  stats: MatchStats;
  shareUrl: string;
  explorerUrl: string;
}

/**
 * Event: player_reconnected
 * Sent when a player reconnects to an active match.
 */
export interface PlayerReconnectedPayload {
  player: PlayerRole;
  address: string;
  reconnectedAt: number;
}

/**
 * Event: player_disconnected
 * Sent when a player disconnects from an active match.
 */
export interface PlayerDisconnectedPayload {
  player: PlayerRole;
  address: string;
  disconnectedAt: number;
  timeoutSeconds: number;
}

/**
 * Event: state_sync
 * Sent to reconnecting players with current game state.
 */
export interface StateSyncPayload {
  matchId: string;
  status: string;
  currentRound: number;
  player1Health: number;
  player2Health: number;
  player1RoundsWon: number;
  player2RoundsWon: number;
  timeRemaining: number;
  pendingMoves: {
    player1: boolean;
    player2: boolean;
  };
}

// =============================================================================
// TYPED EVENT MAP
// =============================================================================

/**
 * All WebSocket event types mapped by event name.
 */
export interface WebSocketEventMap {
  character_selected: CharacterSelectedPayload;
  match_starting: MatchStartingPayload;
  round_starting: RoundStartingPayload;
  move_submitted: MoveSubmittedPayload;
  move_confirmed: MoveConfirmedPayload;
  round_resolved: RoundResolvedPayload;
  match_ended: MatchEndedPayload;
  player_reconnected: PlayerReconnectedPayload;
  player_disconnected: PlayerDisconnectedPayload;
  state_sync: StateSyncPayload;
}

/**
 * Type-safe event handler type.
 */
export type WebSocketEventHandler<E extends keyof WebSocketEventMap> = (
  payload: WebSocketEventMap[E]
) => void;
