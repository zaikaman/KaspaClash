/**
 * Character Selection Service
 * Manages character selection state and validation
 */

import { getCharacter, isValidCharacterId, getRandomCharacter } from "@/data/characters";
import type { Character } from "@/types";

/**
 * Selection state for a player.
 */
export interface PlayerSelection {
  playerId: string;
  characterId: string | null;
  isConfirmed: boolean;
  selectedAt: number | null;
  confirmedAt: number | null;
}

/**
 * Match selection state.
 */
export interface MatchSelectionState {
  matchId: string;
  player1: PlayerSelection;
  player2: PlayerSelection;
  selectionDeadline: number;
  isBothReady: boolean;
}

/**
 * Selection event types.
 */
export type SelectionEventType =
  | "character_selected"
  | "character_confirmed"
  | "selection_timeout"
  | "both_ready";

/**
 * Selection event payload.
 */
export interface SelectionEvent {
  type: SelectionEventType;
  playerId: string;
  matchId: string;
  characterId?: string;
  timestamp: number;
}

/**
 * Create initial player selection state.
 */
export function createPlayerSelection(playerId: string): PlayerSelection {
  return {
    playerId,
    characterId: null,
    isConfirmed: false,
    selectedAt: null,
    confirmedAt: null,
  };
}

/**
 * Create initial match selection state.
 */
export function createMatchSelectionState(
  matchId: string,
  player1Id: string,
  player2Id: string,
  timeoutSeconds: number = 30
): MatchSelectionState {
  return {
    matchId,
    player1: createPlayerSelection(player1Id),
    player2: createPlayerSelection(player2Id),
    selectionDeadline: Date.now() + timeoutSeconds * 1000,
    isBothReady: false,
  };
}

/**
 * Validate character selection.
 */
export function validateSelection(characterId: string): {
  valid: boolean;
  error?: string;
  character?: Character;
} {
  if (!characterId) {
    return { valid: false, error: "Character ID is required" };
  }

  if (!isValidCharacterId(characterId)) {
    return { valid: false, error: `Invalid character ID: ${characterId}` };
  }

  const character = getCharacter(characterId);
  if (!character) {
    return { valid: false, error: `Character not found: ${characterId}` };
  }

  return { valid: true, character };
}

/**
 * Apply character selection to player.
 */
export function selectCharacter(
  state: MatchSelectionState,
  playerId: string,
  characterId: string
): { success: boolean; error?: string; state: MatchSelectionState } {
  const validation = validateSelection(characterId);
  if (!validation.valid) {
    return { success: false, error: validation.error, state };
  }

  const player = getPlayerSelection(state, playerId);
  if (!player) {
    return { success: false, error: "Player not in match", state };
  }

  if (player.isConfirmed) {
    return { success: false, error: "Selection already confirmed", state };
  }

  if (Date.now() > state.selectionDeadline) {
    return { success: false, error: "Selection timeout expired", state };
  }

  // Update player selection
  player.characterId = characterId;
  player.selectedAt = Date.now();

  return { success: true, state };
}

/**
 * Confirm character selection for player.
 */
export function confirmSelection(
  state: MatchSelectionState,
  playerId: string
): { success: boolean; error?: string; state: MatchSelectionState } {
  const player = getPlayerSelection(state, playerId);
  if (!player) {
    return { success: false, error: "Player not in match", state };
  }

  if (!player.characterId) {
    return { success: false, error: "No character selected", state };
  }

  if (player.isConfirmed) {
    return { success: false, error: "Already confirmed", state };
  }

  // Confirm selection
  player.isConfirmed = true;
  player.confirmedAt = Date.now();

  // Check if both ready
  state.isBothReady = state.player1.isConfirmed && state.player2.isConfirmed;

  return { success: true, state };
}

/**
 * Handle selection timeout - auto-select random characters for unconfirmed players.
 */
export function handleTimeout(
  state: MatchSelectionState
): { state: MatchSelectionState; autoSelected: string[] } {
  const autoSelected: string[] = [];

  // Auto-select for player1 if not confirmed
  if (!state.player1.isConfirmed) {
    if (!state.player1.characterId) {
      state.player1.characterId = getRandomCharacter().id;
    }
    state.player1.isConfirmed = true;
    state.player1.confirmedAt = Date.now();
    autoSelected.push(state.player1.playerId);
  }

  // Auto-select for player2 if not confirmed
  if (!state.player2.isConfirmed) {
    if (!state.player2.characterId) {
      state.player2.characterId = getRandomCharacter().id;
    }
    state.player2.isConfirmed = true;
    state.player2.confirmedAt = Date.now();
    autoSelected.push(state.player2.playerId);
  }

  state.isBothReady = true;

  return { state, autoSelected };
}

/**
 * Get player selection from state.
 */
function getPlayerSelection(
  state: MatchSelectionState,
  playerId: string
): PlayerSelection | null {
  if (state.player1.playerId === playerId) {
    return state.player1;
  }
  if (state.player2.playerId === playerId) {
    return state.player2;
  }
  return null;
}

/**
 * Get opponent selection from state.
 */
export function getOpponentSelection(
  state: MatchSelectionState,
  playerId: string
): PlayerSelection | null {
  if (state.player1.playerId === playerId) {
    return state.player2;
  }
  if (state.player2.playerId === playerId) {
    return state.player1;
  }
  return null;
}

/**
 * Check if player can still select.
 */
export function canSelect(
  state: MatchSelectionState,
  playerId: string
): boolean {
  const player = getPlayerSelection(state, playerId);
  if (!player) return false;
  if (player.isConfirmed) return false;
  if (Date.now() > state.selectionDeadline) return false;
  return true;
}

/**
 * Get time remaining until deadline.
 */
export function getTimeRemaining(state: MatchSelectionState): number {
  const remaining = state.selectionDeadline - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Create selection event.
 */
export function createSelectionEvent(
  type: SelectionEventType,
  matchId: string,
  playerId: string,
  characterId?: string
): SelectionEvent {
  return {
    type,
    matchId,
    playerId,
    characterId,
    timestamp: Date.now(),
  };
}

/**
 * Get final selections for match start.
 */
export function getFinalSelections(
  state: MatchSelectionState
): {
  player1Character: string;
  player2Character: string;
} | null {
  if (!state.isBothReady) return null;
  if (!state.player1.characterId || !state.player2.characterId) return null;

  return {
    player1Character: state.player1.characterId,
    player2Character: state.player2.characterId,
  };
}
