/**
 * Fight State Sync Service
 * Server-side service for managing and broadcasting fight scene state
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { broadcastToChannel } from "@/lib/supabase/broadcast";
import type {
  FightPhase,
  AnimationPhase,
  CharacterAnimation,
  FightStateUpdate,
  ANIMATION_TIMING,
} from "@/types/fight-state";

/**
 * Initialize fight state when match starts
 */
export async function initializeFightState(
  supabase: SupabaseClient,
  matchId: string,
  player1MaxHealth: number,
  player1MaxEnergy: number,
  player2MaxHealth: number,
  player2MaxEnergy: number,
  countdownSeconds: number = 3,
  moveTimerMs: number = 20000
): Promise<void> {
  const now = Date.now();
  const countdownEndsAt = new Date(now + countdownSeconds * 1000).toISOString();
  const moveDeadlineAt = new Date(now + countdownSeconds * 1000 + moveTimerMs).toISOString();

  const { error } = await supabase.rpc("update_fight_state", {
    p_match_id: matchId,
    p_current_round: 1,
    p_current_turn: 1,
    p_phase: "countdown",
    p_player1_health: player1MaxHealth,
    p_player1_energy: player1MaxEnergy,
    p_player1_guard_meter: 0,
    p_player1_rounds_won: 0,
    p_player1_is_stunned: false,
    p_player1_current_animation: "idle",
    p_player1_has_submitted_move: false,
    p_player2_health: player2MaxHealth,
    p_player2_energy: player2MaxEnergy,
    p_player2_guard_meter: 0,
    p_player2_rounds_won: 0,
    p_player2_is_stunned: false,
    p_player2_current_animation: "idle",
    p_player2_has_submitted_move: false,
    p_move_deadline_at: moveDeadlineAt,
    p_countdown_ends_at: countdownEndsAt,
  });

  if (error) {
    console.error("[FightStateService] Failed to initialize fight state:", error);
    throw error;
  }

  // Broadcast the initial state
  await broadcastFightStateUpdate(supabase, matchId, {
    phase: "countdown",
    currentRound: 1,
    currentTurn: 1,
    countdownEndsAt: new Date(countdownEndsAt).getTime(),
    moveDeadlineAt: new Date(moveDeadlineAt).getTime(),
    player1Health: player1MaxHealth,
    player1Energy: player1MaxEnergy,
    player2Health: player2MaxHealth,
    player2Energy: player2MaxEnergy,
  });

  console.log(`[FightStateService] Initialized fight state for match ${matchId}`);
}

/**
 * Update fight phase
 */
export async function updateFightPhase(
  supabase: SupabaseClient,
  matchId: string,
  phase: FightPhase,
  additionalUpdates: FightStateUpdate = {}
): Promise<void> {
  const update: FightStateUpdate = {
    phase,
    ...additionalUpdates,
  };

  await updateFightState(supabase, matchId, update);
}

/**
 * Update player move submission status
 */
export async function updateMoveSubmission(
  supabase: SupabaseClient,
  matchId: string,
  player: "player1" | "player2",
  hasSubmitted: boolean
): Promise<void> {
  const update: FightStateUpdate = player === "player1"
    ? { player1HasSubmittedMove: hasSubmitted }
    : { player2HasSubmittedMove: hasSubmitted };

  await updateFightState(supabase, matchId, update);
}

/**
 * Update animation state during resolution
 */
export async function updateAnimationState(
  supabase: SupabaseClient,
  matchId: string,
  animationPhase: AnimationPhase,
  durationMs: number,
  player1Animation?: CharacterAnimation,
  player2Animation?: CharacterAnimation
): Promise<void> {
  const now = Date.now();
  const update: FightStateUpdate = {
    phase: "resolving",
    animationPhase,
    animationStartedAt: now,
    animationEndsAt: now + durationMs,
  };

  if (player1Animation) {
    update.player1CurrentAnimation = player1Animation;
  }
  if (player2Animation) {
    update.player2CurrentAnimation = player2Animation;
  }

  await updateFightState(supabase, matchId, update);
}

/**
 * Update state after round resolution
 */
export async function updateAfterRoundResolution(
  supabase: SupabaseClient,
  matchId: string,
  player1Health: number,
  player2Health: number,
  player1Energy: number,
  player2Energy: number,
  player1GuardMeter: number,
  player2GuardMeter: number,
  player1RoundsWon: number,
  player2RoundsWon: number,
  player1Move: string,
  player2Move: string,
  narrative: string,
  roundWinner: "player1" | "player2" | "draw" | null,
  isRoundOver: boolean,
  isMatchOver: boolean
): Promise<void> {
  let phase: FightPhase = "selecting";
  if (isMatchOver) {
    phase = "match_end";
  } else if (isRoundOver) {
    phase = "round_end";
  }

  const update: FightStateUpdate = {
    phase,
    player1Health,
    player2Health,
    player1Energy,
    player2Energy,
    player1GuardMeter,
    player2GuardMeter,
    player1RoundsWon,
    player2RoundsWon,
    player1HasSubmittedMove: false,
    player2HasSubmittedMove: false,
    player1CurrentAnimation: "idle",
    player2CurrentAnimation: "idle",
    animationPhase: null,
    animationStartedAt: null,
    animationEndsAt: null,
    lastResolvedPlayer1Move: player1Move,
    lastResolvedPlayer2Move: player2Move,
    lastNarrative: narrative,
    roundWinner: isRoundOver ? roundWinner : null,
    roundEndCountdown: isRoundOver ? 5 : null,
  };

  await updateFightState(supabase, matchId, update);
}

/**
 * Start next turn after round resolution
 */
export async function startNextTurn(
  supabase: SupabaseClient,
  matchId: string,
  currentRound: number,
  currentTurn: number,
  moveDeadlineAt: number,
  countdownEndsAt: number,
  player1Health: number,
  player2Health: number,
  player1Energy: number,
  player2Energy: number,
  player1GuardMeter: number,
  player2GuardMeter: number,
  player1IsStunned: boolean,
  player2IsStunned: boolean
): Promise<void> {
  const update: FightStateUpdate = {
    phase: "countdown",
    currentRound,
    currentTurn,
    moveDeadlineAt,
    countdownEndsAt,
    player1Health,
    player2Health,
    player1Energy,
    player2Energy,
    player1GuardMeter,
    player2GuardMeter,
    player1IsStunned,
    player2IsStunned,
    player1HasSubmittedMove: false,
    player2HasSubmittedMove: false,
    player1CurrentAnimation: "idle",
    player2CurrentAnimation: "idle",
    animationPhase: null,
    roundWinner: null,
    roundEndCountdown: null,
  };

  await updateFightState(supabase, matchId, update);
}

/**
 * Core update function - updates database and broadcasts
 */
async function updateFightState(
  supabase: SupabaseClient,
  matchId: string,
  update: FightStateUpdate
): Promise<void> {
  // Convert to database column names
  const dbUpdate: Record<string, any> = {};
  
  if (update.phase !== undefined) dbUpdate.p_phase = update.phase;
  if (update.currentRound !== undefined) dbUpdate.p_current_round = update.currentRound;
  if (update.currentTurn !== undefined) dbUpdate.p_current_turn = update.currentTurn;
  
  if (update.player1Health !== undefined) dbUpdate.p_player1_health = update.player1Health;
  if (update.player1Energy !== undefined) dbUpdate.p_player1_energy = update.player1Energy;
  if (update.player1GuardMeter !== undefined) dbUpdate.p_player1_guard_meter = update.player1GuardMeter;
  if (update.player1RoundsWon !== undefined) dbUpdate.p_player1_rounds_won = update.player1RoundsWon;
  if (update.player1IsStunned !== undefined) dbUpdate.p_player1_is_stunned = update.player1IsStunned;
  if (update.player1CurrentAnimation !== undefined) dbUpdate.p_player1_current_animation = update.player1CurrentAnimation;
  if (update.player1HasSubmittedMove !== undefined) dbUpdate.p_player1_has_submitted_move = update.player1HasSubmittedMove;
  
  if (update.player2Health !== undefined) dbUpdate.p_player2_health = update.player2Health;
  if (update.player2Energy !== undefined) dbUpdate.p_player2_energy = update.player2Energy;
  if (update.player2GuardMeter !== undefined) dbUpdate.p_player2_guard_meter = update.player2GuardMeter;
  if (update.player2RoundsWon !== undefined) dbUpdate.p_player2_rounds_won = update.player2RoundsWon;
  if (update.player2IsStunned !== undefined) dbUpdate.p_player2_is_stunned = update.player2IsStunned;
  if (update.player2CurrentAnimation !== undefined) dbUpdate.p_player2_current_animation = update.player2CurrentAnimation;
  if (update.player2HasSubmittedMove !== undefined) dbUpdate.p_player2_has_submitted_move = update.player2HasSubmittedMove;
  
  if (update.moveDeadlineAt !== undefined) {
    dbUpdate.p_move_deadline_at = update.moveDeadlineAt 
      ? new Date(update.moveDeadlineAt).toISOString() 
      : null;
  }
  if (update.countdownEndsAt !== undefined) {
    dbUpdate.p_countdown_ends_at = update.countdownEndsAt 
      ? new Date(update.countdownEndsAt).toISOString() 
      : null;
  }
  
  if (update.animationPhase !== undefined) dbUpdate.p_animation_phase = update.animationPhase;
  if (update.animationStartedAt !== undefined) {
    dbUpdate.p_animation_started_at = update.animationStartedAt 
      ? new Date(update.animationStartedAt).toISOString() 
      : null;
  }
  if (update.animationEndsAt !== undefined) {
    dbUpdate.p_animation_ends_at = update.animationEndsAt 
      ? new Date(update.animationEndsAt).toISOString() 
      : null;
  }
  
  if (update.roundWinner !== undefined) dbUpdate.p_round_winner = update.roundWinner;
  if (update.roundEndCountdown !== undefined) dbUpdate.p_round_end_countdown = update.roundEndCountdown;
  
  if (update.lastResolvedPlayer1Move !== undefined) dbUpdate.p_last_resolved_player1_move = update.lastResolvedPlayer1Move;
  if (update.lastResolvedPlayer2Move !== undefined) dbUpdate.p_last_resolved_player2_move = update.lastResolvedPlayer2Move;
  if (update.lastNarrative !== undefined) dbUpdate.p_last_narrative = update.lastNarrative;

  // Always include match_id
  dbUpdate.p_match_id = matchId;

  const { error } = await supabase.rpc("update_fight_state", dbUpdate);

  if (error) {
    console.error("[FightStateService] Failed to update fight state:", error);
    throw error;
  }

  // Broadcast the update
  await broadcastFightStateUpdate(supabase, matchId, update);
}

/**
 * Broadcast fight state update to all connected clients
 */
async function broadcastFightStateUpdate(
  supabase: SupabaseClient,
  matchId: string,
  update: FightStateUpdate
): Promise<void> {
  try {
    await broadcastToChannel(supabase, `game:${matchId}`, "fight_state_update", {
      matchId,
      update,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[FightStateService] Failed to broadcast fight state update:", error);
    // Don't throw - broadcast failures shouldn't block state updates
  }
}

/**
 * Get current fight state from database
 */
export async function getFightState(
  supabase: SupabaseClient,
  matchId: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from("fight_state_snapshots")
    .select("*")
    .eq("match_id", matchId)
    .single();

  if (error) {
    console.error("[FightStateService] Failed to get fight state:", error);
    return null;
  }

  return data;
}

/**
 * Delete fight state when match ends
 */
export async function deleteFightState(
  supabase: SupabaseClient,
  matchId: string
): Promise<void> {
  const { error } = await supabase
    .from("fight_state_snapshots")
    .delete()
    .eq("match_id", matchId);

  if (error) {
    console.error("[FightStateService] Failed to delete fight state:", error);
    // Don't throw - cleanup failures shouldn't cause issues
  }
}
