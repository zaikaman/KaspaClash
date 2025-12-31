/**
 * API response types for KaspaClash
 * Generated from: specs/001-core-fighting-game/contracts/api.yaml
 */

import type {
  Match,
  Round,
  Player,
  MoveType,
  MatchFormat,
  MatchStatus,
} from "./index";

// =============================================================================
// COMMON ERROR RESPONSES
// =============================================================================

/**
 * Standard API error response.
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * API error codes.
 */
export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "INVALID_SIGNATURE"
  | "INVALID_ADDRESS"
  | "MATCH_NOT_FOUND"
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "ALREADY_IN_QUEUE"
  | "NOT_IN_QUEUE"
  | "INVALID_MOVE"
  | "MOVE_ALREADY_SUBMITTED"
  | "INVALID_CHARACTER"
  | "CHARACTER_ALREADY_SELECTED";

// =============================================================================
// MATCHMAKING API RESPONSES
// =============================================================================

/**
 * POST /api/matchmaking/queue - Match found response.
 */
export interface QueueMatchFoundResponse {
  matchId: string;
  roomCode: string | null;
  opponentAddress: string;
}

/**
 * POST /api/matchmaking/queue - Queued response.
 */
export interface QueuedResponse {
  status: "queued";
  position: number;
  estimatedWaitSeconds: number;
}

/**
 * POST /api/matchmaking/rooms - Room created response.
 */
export interface RoomCreatedResponse {
  matchId: string;
  roomCode: string;
  shareUrl: string;
}

/**
 * GET /api/matchmaking/rooms/{roomCode} - Room info.
 */
export interface RoomInfo {
  matchId: string;
  roomCode: string;
  hostAddress: string;
  status: MatchStatus;
  format: MatchFormat;
  createdAt: string;
  isFull: boolean;
}

/**
 * POST /api/matchmaking/rooms/{roomCode} - Room joined response.
 */
export interface RoomJoinedResponse {
  matchId: string;
  status: "character_select";
}

// =============================================================================
// GAME API RESPONSES
// =============================================================================

/**
 * GET /api/matches/{matchId} - Match response.
 */
export interface MatchResponse {
  match: Match;
  player1?: Player;
  player2?: Player;
}

/**
 * POST /api/matches/{matchId}/character - Character selected response.
 */
export interface CharacterSelectedResponse {
  confirmed: boolean;
  bothReady: boolean;
}

/**
 * POST /api/matches/{matchId}/move - Move recorded response.
 */
export interface MoveRecordedResponse {
  moveId: string;
  roundId: string;
  awaitingOpponent: boolean;
}

/**
 * GET /api/matches/{matchId}/rounds - Rounds list response.
 */
export interface RoundsResponse {
  rounds: Round[];
}

/**
 * POST /api/matches/{matchId}/forfeit - Forfeit response.
 */
export interface ForfeitResponse {
  winnerAddress: string;
}

// =============================================================================
// LEADERBOARD API RESPONSES
// =============================================================================

/**
 * Leaderboard entry.
 */
export interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string | null;
  wins: number;
  losses: number;
  rating: number;
  winRate: number;
}

/**
 * GET /api/leaderboard - Leaderboard response.
 */
export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
}

// =============================================================================
// PLAYER API RESPONSES
// =============================================================================

/**
 * GET /api/players/{address} - Player profile response.
 */
export interface PlayerProfileResponse {
  player: Player;
  recentMatches: MatchSummary[];
  stats: PlayerStats;
}

/**
 * Match summary for player history.
 */
export interface MatchSummary {
  matchId: string;
  opponentAddress: string;
  opponentDisplayName: string | null;
  result: "win" | "loss" | "draw";
  score: string; // e.g., "2-1"
  characterId: string;
  opponentCharacterId: string;
  playedAt: string;
}

/**
 * Player statistics.
 */
export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  favoriteCharacter: string | null;
  totalDamageDealt: number;
  averageRoundsPerMatch: number;
}

/**
 * GET /api/players/{address}/matches - Match history response.
 */
export interface MatchHistoryResponse {
  matches: MatchSummary[];
  total: number;
  page: number;
  pageSize: number;
}

// =============================================================================
// REQUEST BODIES
// =============================================================================

/**
 * Base request with wallet signature.
 */
export interface SignedRequest {
  address: string;
  signature: string;
}

/**
 * POST /api/matchmaking/queue - Join queue request.
 */
export interface JoinQueueRequest extends SignedRequest {}

/**
 * DELETE /api/matchmaking/queue - Leave queue request.
 */
export interface LeaveQueueRequest {
  address: string;
}

/**
 * POST /api/matchmaking/rooms - Create room request.
 */
export interface CreateRoomRequest extends SignedRequest {
  format?: MatchFormat;
}

/**
 * POST /api/matchmaking/rooms/{roomCode} - Join room request.
 */
export interface JoinRoomRequest extends SignedRequest {}

/**
 * POST /api/matches/{matchId}/character - Select character request.
 */
export interface SelectCharacterRequest extends SignedRequest {
  characterId: string;
}

/**
 * POST /api/matches/{matchId}/move - Submit move request.
 */
export interface SubmitMoveRequest {
  address: string;
  moveType: MoveType;
  txId: string;
}

/**
 * POST /api/matches/{matchId}/forfeit - Forfeit request.
 */
export interface ForfeitRequest extends SignedRequest {}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * GET /api/health - Health check response.
 */
export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  version: string;
  services: {
    database: "ok" | "error";
    kaspa: "ok" | "error";
  };
}
