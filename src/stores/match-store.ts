/**
 * Match Store - Zustand state management for match data
 * Manages current match state, rounds, and moves
 */

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import type {
  Match,
  Round,
  Move,
  MoveType,
  PlayerRole,
  MatchStatus,
  RoundWinner,
  MatchEndReason,
} from "@/types";
import { GAME_CONSTANTS, MOVE_PROPERTIES } from "@/types/constants";
import { GameState, type GameStateType, getValidTransitions } from "@/lib/game/state-machine";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Current round state for local tracking.
 */
export interface RoundState {
  roundNumber: number;
  player1Move: MoveType | null;
  player2Move: MoveType | null;
  player1MoveConfirmed: boolean;
  player2MoveConfirmed: boolean;
  player1Health: number;
  player2Health: number;
  timeRemaining: number;
  isResolved: boolean;
}

/**
 * Move submission state.
 */
export interface MoveSubmission {
  move: MoveType;
  txId: string | null;
  status: "pending" | "submitted" | "confirmed" | "failed";
  error?: string;
}

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

/**
 * Match store state.
 */
export interface MatchState {
  // Match data
  match: Match | null;
  matchId: string | null;
  playerRole: PlayerRole | null;

  // Game state
  gameState: GameStateType;

  // Round data
  currentRound: RoundState;
  roundHistory: Round[];

  // Move submission
  currentMove: MoveSubmission | null;
  
  // Match result
  result: MatchResult | null;

  // Loading/error states
  isLoading: boolean;
  error: string | null;

  // Actions
  actions: {
    // Match lifecycle
    initMatch: (match: Match, playerRole: PlayerRole) => void;
    updateMatch: (match: Partial<Match>) => void;
    setMatchStatus: (status: MatchStatus) => void;
    resetMatch: () => void;

    // Game state transitions
    transitionTo: (newState: GameStateType) => boolean;
    
    // Round management
    startRound: (roundNumber: number) => void;
    updateTimeRemaining: (seconds: number) => void;
    
    // Move management
    selectMove: (move: MoveType) => void;
    submitMove: (move: MoveType, txId: string) => void;
    confirmMove: (playerRole: PlayerRole) => void;
    failMoveSubmission: (error: string) => void;
    
    // Round resolution
    resolveRound: (
      player1Move: MoveType,
      player2Move: MoveType,
      player1Damage: number,
      player2Damage: number
    ) => RoundWinner;
    setRoundWinner: (winner: RoundWinner) => void;
    
    // Match completion
    endMatch: (result: MatchResult) => void;

    // Health management
    setPlayerHealth: (player: PlayerRole, health: number) => void;
    applyDamage: (player: PlayerRole, damage: number) => void;
    
    // Error handling
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
  };
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialRoundState: RoundState = {
  roundNumber: 1,
  player1Move: null,
  player2Move: null,
  player1MoveConfirmed: false,
  player2MoveConfirmed: false,
  player1Health: GAME_CONSTANTS.STARTING_HEALTH,
  player2Health: GAME_CONSTANTS.STARTING_HEALTH,
  timeRemaining: GAME_CONSTANTS.MOVE_TIME_LIMIT,
  isResolved: false,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useMatchStore = create<MatchState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      match: null,
      matchId: null,
      playerRole: null,
      gameState: GameState.IDLE,
      currentRound: { ...initialRoundState },
      roundHistory: [],
      currentMove: null,
      result: null,
      isLoading: false,
      error: null,

      actions: {
        // =====================================================================
        // MATCH LIFECYCLE
        // =====================================================================

        initMatch: (match, playerRole) => {
          set({
            match,
            matchId: match.id,
            playerRole,
            gameState: GameState.WAITING,
            currentRound: { ...initialRoundState },
            roundHistory: [],
            currentMove: null,
            result: null,
            error: null,
          });
        },

        updateMatch: (matchUpdate) => {
          const { match } = get();
          if (!match) return;

          set({
            match: { ...match, ...matchUpdate },
          });
        },

        setMatchStatus: (status) => {
          const { match } = get();
          if (!match) return;

          set({
            match: { ...match, status },
          });
        },

        resetMatch: () => {
          set({
            match: null,
            matchId: null,
            playerRole: null,
            gameState: GameState.IDLE,
            currentRound: { ...initialRoundState },
            roundHistory: [],
            currentMove: null,
            result: null,
            isLoading: false,
            error: null,
          });
        },

        // =====================================================================
        // GAME STATE TRANSITIONS
        // =====================================================================

        transitionTo: (newState) => {
          const { gameState } = get();
          const validTransitions = getValidTransitions(gameState);

          if (!validTransitions.includes(newState)) {
            console.warn(`Invalid state transition: ${gameState} -> ${newState}`);
            return false;
          }

          set({ gameState: newState });
          return true;
        },

        // =====================================================================
        // ROUND MANAGEMENT
        // =====================================================================

        startRound: (roundNumber) => {
          set({
            currentRound: {
              ...initialRoundState,
              roundNumber,
              player1Health: get().currentRound.player1Health,
              player2Health: get().currentRound.player2Health,
            },
            currentMove: null,
            gameState: GameState.AWAITING_MOVES,
          });
        },

        updateTimeRemaining: (seconds) => {
          set((state) => ({
            currentRound: {
              ...state.currentRound,
              timeRemaining: seconds,
            },
          }));
        },

        // =====================================================================
        // MOVE MANAGEMENT
        // =====================================================================

        selectMove: (move) => {
          set({
            currentMove: {
              move,
              txId: null,
              status: "pending",
            },
          });
        },

        submitMove: (move, txId) => {
          set({
            currentMove: {
              move,
              txId,
              status: "submitted",
            },
            gameState: GameState.MOVE_SUBMITTED,
          });
        },

        confirmMove: (playerRole) => {
          const { currentRound, currentMove, playerRole: localPlayerRole } = get();

          // Update the appropriate player's move status
          if (playerRole === "player1") {
            set((state) => ({
              currentRound: {
                ...state.currentRound,
                player1MoveConfirmed: true,
                player1Move: playerRole === localPlayerRole ? currentMove?.move ?? null : state.currentRound.player1Move,
              },
            }));
          } else {
            set((state) => ({
              currentRound: {
                ...state.currentRound,
                player2MoveConfirmed: true,
                player2Move: playerRole === localPlayerRole ? currentMove?.move ?? null : state.currentRound.player2Move,
              },
            }));
          }

          // Check if both moves are confirmed
          const { currentRound: updatedRound } = get();
          if (updatedRound.player1MoveConfirmed && updatedRound.player2MoveConfirmed) {
            set({ gameState: GameState.RESOLVING_ROUND });
          }

          // Update current move status if it's the local player
          if (playerRole === localPlayerRole) {
            set((state) => ({
              currentMove: state.currentMove ? { ...state.currentMove, status: "confirmed" } : null,
            }));
          }
        },

        failMoveSubmission: (error) => {
          set((state) => ({
            currentMove: state.currentMove ? { ...state.currentMove, status: "failed", error } : null,
            error,
          }));
        },

        // =====================================================================
        // ROUND RESOLUTION
        // =====================================================================

        resolveRound: (player1Move, player2Move, player1Damage, player2Damage) => {
          const { currentRound, roundHistory, match } = get();

          // Calculate new health values
          const newPlayer1Health = Math.max(0, currentRound.player1Health - player2Damage);
          const newPlayer2Health = Math.max(0, currentRound.player2Health - player1Damage);

          // Determine round winner
          let winner: RoundWinner = "draw";
          if (player1Damage > player2Damage) {
            winner = "player1";
          } else if (player2Damage > player1Damage) {
            winner = "player2";
          }

          // Create round record
          const round: Round = {
            id: `round-${currentRound.roundNumber}-${Date.now()}`,
            matchId: match?.id ?? "",
            roundNumber: currentRound.roundNumber,
            player1Move,
            player2Move,
            player1DamageDealt: player1Damage,
            player2DamageDealt: player2Damage,
            player1HealthAfter: newPlayer1Health,
            player2HealthAfter: newPlayer2Health,
            winnerAddress: null, // Set by server
            createdAt: new Date(),
          };

          set({
            currentRound: {
              ...currentRound,
              player1Move,
              player2Move,
              player1Health: newPlayer1Health,
              player2Health: newPlayer2Health,
              isResolved: true,
            },
            roundHistory: [...roundHistory, round],
            gameState: GameState.ROUND_RESOLVED,
          });

          return winner;
        },

        setRoundWinner: (winner) => {
          const { match } = get();
          if (!match) return;

          const newRoundsWon = {
            player1RoundsWon: match.player1RoundsWon + (winner === "player1" ? 1 : 0),
            player2RoundsWon: match.player2RoundsWon + (winner === "player2" ? 1 : 0),
          };

          set((state) => ({
            match: state.match ? { ...state.match, ...newRoundsWon } : null,
          }));
        },

        // =====================================================================
        // MATCH COMPLETION
        // =====================================================================

        endMatch: (result) => {
          set({
            result,
            gameState: GameState.MATCH_ENDED,
          });
        },

        // =====================================================================
        // HEALTH MANAGEMENT
        // =====================================================================

        setPlayerHealth: (player, health) => {
          const clampedHealth = Math.max(0, Math.min(health, GAME_CONSTANTS.STARTING_HEALTH));

          set((state) => ({
            currentRound: {
              ...state.currentRound,
              [player === "player1" ? "player1Health" : "player2Health"]: clampedHealth,
            },
          }));
        },

        applyDamage: (player, damage) => {
          const { currentRound } = get();
          const currentHealth = player === "player1"
            ? currentRound.player1Health
            : currentRound.player2Health;

          get().actions.setPlayerHealth(player, currentHealth - damage);
        },

        // =====================================================================
        // ERROR HANDLING
        // =====================================================================

        setError: (error) => set({ error }),
        setLoading: (loading) => set({ isLoading: loading }),
      },
    })),
    { name: "match-store" }
  )
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/**
 * Select match data.
 */
export const useMatch = () => useMatchStore((state) => state.match);

/**
 * Select player role.
 */
export const usePlayerRole = () => useMatchStore((state) => state.playerRole);

/**
 * Select game state.
 */
export const useGameState = () => useMatchStore((state) => state.gameState);

/**
 * Select current round state.
 */
export const useCurrentRound = () => useMatchStore((state) => state.currentRound);

/**
 * Select current move submission.
 */
export const useCurrentMove = () => useMatchStore((state) => state.currentMove);

/**
 * Select match result.
 */
export const useMatchResult = () => useMatchStore((state) => state.result);

/**
 * Select match actions.
 */
export const useMatchActions = () => useMatchStore((state) => state.actions);

/**
 * Check if it's the local player's turn to act.
 */
export const useIsLocalPlayerTurn = () => {
  return useMatchStore((state) => {
    if (state.gameState !== GameState.AWAITING_MOVES) return false;

    const { playerRole, currentRound } = state;
    if (!playerRole) return false;

    const isConfirmed = playerRole === "player1"
      ? currentRound.player1MoveConfirmed
      : currentRound.player2MoveConfirmed;

    return !isConfirmed;
  });
};

/**
 * Get opponent's move confirmation status.
 */
export const useOpponentMoveConfirmed = () => {
  return useMatchStore((state) => {
    const { playerRole, currentRound } = state;
    if (!playerRole) return false;

    return playerRole === "player1"
      ? currentRound.player2MoveConfirmed
      : currentRound.player1MoveConfirmed;
  });
};
