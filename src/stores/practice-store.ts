/**
 * Practice Mode Store
 * Local-only state management for practice mode (no persistence)
 */

import { create } from "zustand";
import type { MoveType, Character } from "@/types";
import type { AIDifficulty } from "@/lib/game/ai-opponent";

/**
 * Practice session statistics.
 */
export interface PracticeStats {
  totalMatches: number;
  wins: number;
  losses: number;
  roundsPlayed: number;
  movesUsed: Record<MoveType, number>;
  favoriteMove: MoveType | null;
}

/**
 * Current practice match state.
 */
export interface PracticeMatchState {
  isActive: boolean;
  characterId: string | null;
  aiDifficulty: AIDifficulty;
  currentRound: number;
  playerHealth: number;
  aiHealth: number;
  playerRoundsWon: number;
  aiRoundsWon: number;
  roundsToWin: number;
}

/**
 * Practice store state.
 */
interface PracticeState {
  // Current match
  match: PracticeMatchState;

  // Session stats (not persisted)
  sessionStats: PracticeStats;

  // Preferences
  lastUsedCharacter: string | null;
  lastUsedDifficulty: AIDifficulty;

  // Actions
  startMatch: (characterId: string, difficulty: AIDifficulty, format?: "best_of_3" | "best_of_5") => void;
  endMatch: (playerWon: boolean) => void;
  updateHealth: (playerHealth: number, aiHealth: number) => void;
  recordRoundWin: (winner: "player" | "ai") => void;
  recordMove: (move: MoveType) => void;
  resetMatch: () => void;
  resetSession: () => void;
}

/**
 * Initial match state.
 */
const initialMatchState: PracticeMatchState = {
  isActive: false,
  characterId: null,
  aiDifficulty: "medium",
  currentRound: 1,
  playerHealth: 100,
  aiHealth: 100,
  playerRoundsWon: 0,
  aiRoundsWon: 0,
  roundsToWin: 2,
};

/**
 * Initial session stats.
 */
const initialSessionStats: PracticeStats = {
  totalMatches: 0,
  wins: 0,
  losses: 0,
  roundsPlayed: 0,
  movesUsed: {
    punch: 0,
    kick: 0,
    block: 0,
    special: 0,
    stunned: 0,
  },
  favoriteMove: null,
};

/**
 * Practice store.
 */
export const usePracticeStore = create<PracticeState>((set, get) => ({
  match: initialMatchState,
  sessionStats: initialSessionStats,
  lastUsedCharacter: null,
  lastUsedDifficulty: "medium",

  startMatch: (characterId, difficulty, format = "best_of_3") => {
    const roundsToWin = format === "best_of_5" ? 3 : 2;

    set({
      match: {
        isActive: true,
        characterId,
        aiDifficulty: difficulty,
        currentRound: 1,
        playerHealth: 100,
        aiHealth: 100,
        playerRoundsWon: 0,
        aiRoundsWon: 0,
        roundsToWin,
      },
      lastUsedCharacter: characterId,
      lastUsedDifficulty: difficulty,
    });
  },

  endMatch: (playerWon) => {
    const { sessionStats, match } = get();

    set({
      match: {
        ...match,
        isActive: false,
      },
      sessionStats: {
        ...sessionStats,
        totalMatches: sessionStats.totalMatches + 1,
        wins: playerWon ? sessionStats.wins + 1 : sessionStats.wins,
        losses: playerWon ? sessionStats.losses : sessionStats.losses + 1,
      },
    });
  },

  updateHealth: (playerHealth, aiHealth) => {
    const { match } = get();
    set({
      match: {
        ...match,
        playerHealth,
        aiHealth,
      },
    });
  },

  recordRoundWin: (winner) => {
    const { match, sessionStats } = get();

    const newMatch = {
      ...match,
      currentRound: match.currentRound + 1,
      playerHealth: 100,
      aiHealth: 100,
      playerRoundsWon:
        winner === "player"
          ? match.playerRoundsWon + 1
          : match.playerRoundsWon,
      aiRoundsWon:
        winner === "ai" ? match.aiRoundsWon + 1 : match.aiRoundsWon,
    };

    set({
      match: newMatch,
      sessionStats: {
        ...sessionStats,
        roundsPlayed: sessionStats.roundsPlayed + 1,
      },
    });
  },

  recordMove: (move) => {
    const { sessionStats } = get();
    const newMovesUsed = {
      ...sessionStats.movesUsed,
      [move]: sessionStats.movesUsed[move] + 1,
    };

    // Calculate favorite move
    let favoriteMove: MoveType = "punch";
    let maxCount = 0;
    (Object.keys(newMovesUsed) as MoveType[]).forEach((m) => {
      if (newMovesUsed[m] > maxCount) {
        maxCount = newMovesUsed[m];
        favoriteMove = m;
      }
    });

    set({
      sessionStats: {
        ...sessionStats,
        movesUsed: newMovesUsed,
        favoriteMove: maxCount > 0 ? favoriteMove : null,
      },
    });
  },

  resetMatch: () => {
    const { lastUsedCharacter, lastUsedDifficulty } = get();
    set({
      match: {
        ...initialMatchState,
        characterId: lastUsedCharacter,
        aiDifficulty: lastUsedDifficulty,
      },
    });
  },

  resetSession: () => {
    set({
      match: initialMatchState,
      sessionStats: initialSessionStats,
    });
  },
}));

/**
 * Selector hooks for practice store.
 */
export const usePracticeMatch = () => usePracticeStore((s) => s.match);
export const usePracticeStats = () => usePracticeStore((s) => s.sessionStats);
export const usePracticeActions = () =>
  usePracticeStore((s) => ({
    startMatch: s.startMatch,
    endMatch: s.endMatch,
    updateHealth: s.updateHealth,
    recordRoundWin: s.recordRoundWin,
    recordMove: s.recordMove,
    resetMatch: s.resetMatch,
    resetSession: s.resetSession,
  }));

/**
 * Get win rate for session.
 */
export function getSessionWinRate(stats: PracticeStats): number {
  if (stats.totalMatches === 0) return 0;
  return Math.round((stats.wins / stats.totalMatches) * 100);
}

/**
 * Get most used move.
 */
export function getMostUsedMove(stats: PracticeStats): MoveType | null {
  return stats.favoriteMove;
}
