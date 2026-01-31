/**
 * GET/PATCH /api/matches/[matchId]/fight-state
 * 
 * Server-side fight scene state management API.
 * This enables full synchronization of fight scene state across all clients.
 * 
 * GET: Retrieve current fight state for reconnection/sync
 * PATCH: Update fight state (used by server during state transitions)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";

/**
 * Fight state snapshot type
 */
export interface FightStateSnapshot {
  id: string;
  matchId: string;
  currentRound: number;
  currentTurn: number;
  phase: "waiting" | "countdown" | "selecting" | "resolving" | "round_end" | "match_end";
  phaseStartedAt: string;
  
  // Player 1 state
  player1Health: number;
  player1MaxHealth: number;
  player1Energy: number;
  player1MaxEnergy: number;
  player1GuardMeter: number;
  player1RoundsWon: number;
  player1IsStunned: boolean;
  player1CurrentAnimation: string;
  player1HasSubmittedMove: boolean;
  
  // Player 2 state
  player2Health: number;
  player2MaxHealth: number;
  player2Energy: number;
  player2MaxEnergy: number;
  player2GuardMeter: number;
  player2RoundsWon: number;
  player2IsStunned: boolean;
  player2CurrentAnimation: string;
  player2HasSubmittedMove: boolean;
  
  // Timer state
  moveDeadlineAt: string | null;
  countdownEndsAt: string | null;
  
  // Animation state
  animationPhase: string | null;
  animationStartedAt: string | null;
  animationEndsAt: string | null;
  
  // Round end state
  roundWinner: "player1" | "player2" | "draw" | null;
  roundEndCountdown: number | null;
  
  // Last resolved turn data
  lastResolvedPlayer1Move: string | null;
  lastResolvedPlayer2Move: string | null;
  lastNarrative: string | null;
  
  updatedAt: string;
}

/**
 * Convert snake_case database row to camelCase
 */
function toFightStateSnapshot(row: any): FightStateSnapshot {
  return {
    id: row.id,
    matchId: row.match_id,
    currentRound: row.current_round,
    currentTurn: row.current_turn,
    phase: row.phase,
    phaseStartedAt: row.phase_started_at,
    
    player1Health: row.player1_health,
    player1MaxHealth: row.player1_max_health,
    player1Energy: row.player1_energy,
    player1MaxEnergy: row.player1_max_energy,
    player1GuardMeter: row.player1_guard_meter,
    player1RoundsWon: row.player1_rounds_won,
    player1IsStunned: row.player1_is_stunned,
    player1CurrentAnimation: row.player1_current_animation,
    player1HasSubmittedMove: row.player1_has_submitted_move,
    
    player2Health: row.player2_health,
    player2MaxHealth: row.player2_max_health,
    player2Energy: row.player2_energy,
    player2MaxEnergy: row.player2_max_energy,
    player2GuardMeter: row.player2_guard_meter,
    player2RoundsWon: row.player2_rounds_won,
    player2IsStunned: row.player2_is_stunned,
    player2CurrentAnimation: row.player2_current_animation,
    player2HasSubmittedMove: row.player2_has_submitted_move,
    
    moveDeadlineAt: row.move_deadline_at,
    countdownEndsAt: row.countdown_ends_at,
    
    animationPhase: row.animation_phase,
    animationStartedAt: row.animation_started_at,
    animationEndsAt: row.animation_ends_at,
    
    roundWinner: row.round_winner,
    roundEndCountdown: row.round_end_countdown,
    
    lastResolvedPlayer1Move: row.last_resolved_player1_move,
    lastResolvedPlayer2Move: row.last_resolved_player2_move,
    lastNarrative: row.last_narrative,
    
    updatedAt: row.updated_at,
  };
}

/**
 * GET handler - Retrieve current fight state
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;

    // Validate match ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(matchId)) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid match ID format")
      );
    }

    const supabase = await createSupabaseServerClient();

    // Try to get existing fight state
    // Note: TypeScript types will be updated after migration runs
    const { data: existingState, error: fetchError } = await (supabase as any)
      .from("fight_state_snapshots")
      .select("*")
      .eq("match_id", matchId)
      .single();

    if (existingState) {
      return NextResponse.json({
        success: true,
        state: toFightStateSnapshot(existingState),
        source: "snapshot",
      });
    }

    // No snapshot exists, reconstruct from match and rounds data
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Match not found")
      );
    }

    // Get character max stats
    const { getCharacterCombatStats } = await import("@/game/combat");
    const p1Stats = getCharacterCombatStats(match.player1_character_id || "dag-warrior");
    const p2Stats = getCharacterCombatStats(match.player2_character_id || "dag-warrior");

    // Get the latest round for current state
    // Note: TypeScript types will be updated after migration runs
    const { data: latestRound } = await (supabase as any)
      .from("rounds")
      .select("*")
      .eq("match_id", matchId)
      .order("round_number", { ascending: false })
      .limit(1)
      .single();

    // Determine current phase based on match status
    let phase: FightStateSnapshot["phase"] = "waiting";
    if (match.status === "completed" || match.status === "cancelled") {
      phase = "match_end";
    } else if (match.status === "in_progress") {
      if (latestRound) {
        if (latestRound.player1_move && latestRound.player2_move) {
          phase = "resolving";
        } else if (latestRound.player1_move || latestRound.player2_move) {
          phase = "selecting";
        } else {
          phase = "selecting";
        }
      } else {
        phase = "countdown";
      }
    }

    // Build reconstructed state
    const reconstructedState: FightStateSnapshot = {
      id: "reconstructed",
      matchId,
      currentRound: latestRound?.round_number || 1,
      currentTurn: 1,
      phase,
      phaseStartedAt: new Date().toISOString(),
      
      player1Health: latestRound?.player1_health_after ?? p1Stats.maxHp,
      player1MaxHealth: p1Stats.maxHp,
      player1Energy: latestRound?.player1_energy ?? p1Stats.maxEnergy,
      player1MaxEnergy: p1Stats.maxEnergy,
      player1GuardMeter: latestRound?.player1_guard_meter ?? 0,
      player1RoundsWon: match.player1_rounds_won || 0,
      player1IsStunned: latestRound?.player1_is_stunned ?? false,
      player1CurrentAnimation: "idle",
      player1HasSubmittedMove: !!latestRound?.player1_move,
      
      player2Health: latestRound?.player2_health_after ?? p2Stats.maxHp,
      player2MaxHealth: p2Stats.maxHp,
      player2Energy: latestRound?.player2_energy ?? p2Stats.maxEnergy,
      player2MaxEnergy: p2Stats.maxEnergy,
      player2GuardMeter: latestRound?.player2_guard_meter ?? 0,
      player2RoundsWon: match.player2_rounds_won || 0,
      player2IsStunned: latestRound?.player2_is_stunned ?? false,
      player2CurrentAnimation: "idle",
      player2HasSubmittedMove: !!latestRound?.player2_move,
      
      moveDeadlineAt: latestRound?.move_deadline_at || null,
      countdownEndsAt: null,
      
      animationPhase: null,
      animationStartedAt: null,
      animationEndsAt: null,
      
      roundWinner: null,
      roundEndCountdown: null,
      
      lastResolvedPlayer1Move: latestRound?.player1_move || null,
      lastResolvedPlayer2Move: latestRound?.player2_move || null,
      lastNarrative: null,
      
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      state: reconstructedState,
      source: "reconstructed",
    });

  } catch (error) {
    console.error("[Fight State API] GET error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to get fight state")
    );
  }
}

/**
 * PATCH handler - Update fight state (partial update)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;

    // Validate match ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(matchId)) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid match ID format")
      );
    }

    const body = await request.json();

    const supabase = await createSupabaseServerClient();

    // Use the update_fight_state function for atomic upsert
    // Note: TypeScript types will be updated after migration runs
    const { data: result, error } = await (supabase as any).rpc("update_fight_state", {
      p_match_id: matchId,
      p_current_round: body.currentRound ?? null,
      p_current_turn: body.currentTurn ?? null,
      p_phase: body.phase ?? null,
      p_player1_health: body.player1Health ?? null,
      p_player1_energy: body.player1Energy ?? null,
      p_player1_guard_meter: body.player1GuardMeter ?? null,
      p_player1_rounds_won: body.player1RoundsWon ?? null,
      p_player1_is_stunned: body.player1IsStunned ?? null,
      p_player1_current_animation: body.player1CurrentAnimation ?? null,
      p_player1_has_submitted_move: body.player1HasSubmittedMove ?? null,
      p_player2_health: body.player2Health ?? null,
      p_player2_energy: body.player2Energy ?? null,
      p_player2_guard_meter: body.player2GuardMeter ?? null,
      p_player2_rounds_won: body.player2RoundsWon ?? null,
      p_player2_is_stunned: body.player2IsStunned ?? null,
      p_player2_current_animation: body.player2CurrentAnimation ?? null,
      p_player2_has_submitted_move: body.player2HasSubmittedMove ?? null,
      p_move_deadline_at: body.moveDeadlineAt ? new Date(body.moveDeadlineAt).toISOString() : null,
      p_countdown_ends_at: body.countdownEndsAt ? new Date(body.countdownEndsAt).toISOString() : null,
      p_animation_phase: body.animationPhase ?? null,
      p_animation_started_at: body.animationStartedAt ? new Date(body.animationStartedAt).toISOString() : null,
      p_animation_ends_at: body.animationEndsAt ? new Date(body.animationEndsAt).toISOString() : null,
      p_round_winner: body.roundWinner ?? null,
      p_round_end_countdown: body.roundEndCountdown ?? null,
      p_last_resolved_player1_move: body.lastResolvedPlayer1Move ?? null,
      p_last_resolved_player2_move: body.lastResolvedPlayer2Move ?? null,
      p_last_narrative: body.lastNarrative ?? null,
    });

    if (error) {
      console.error("[Fight State API] PATCH error:", error);
      return createErrorResponse(
        new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to update fight state")
      );
    }

    return NextResponse.json({
      success: true,
      state: toFightStateSnapshot(result),
    });

  } catch (error) {
    console.error("[Fight State API] PATCH error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to update fight state")
    );
  }
}

/**
 * POST handler - Initialize fight state when match starts
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;

    // Validate match ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(matchId)) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid match ID format")
      );
    }

    const body = await request.json();
    const supabase = await createSupabaseServerClient();

    // Get match to fetch character info
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Match not found")
      );
    }

    // Get character max stats
    const { getCharacterCombatStats } = await import("@/game/combat");
    const p1Stats = getCharacterCombatStats(match.player1_character_id || "dag-warrior");
    const p2Stats = getCharacterCombatStats(match.player2_character_id || "dag-warrior");

    // Calculate countdown end time
    const countdownSeconds = body.countdownSeconds ?? 3;
    const countdownEndsAt = new Date(Date.now() + countdownSeconds * 1000).toISOString();
    
    // Calculate move deadline (after countdown + power surge selection)
    const powerSurgeSelectionMs = 15000; // Time allocated for Power Surge card selection
    const moveTimerMs = body.moveTimerMs ?? 20000;
    const moveDeadlineAt = new Date(Date.now() + countdownSeconds * 1000 + powerSurgeSelectionMs + moveTimerMs).toISOString();

    // Create initial fight state
    // Note: TypeScript types will be updated after migration runs
    const { data: result, error } = await (supabase as any).rpc("update_fight_state", {
      p_match_id: matchId,
      p_current_round: 1,
      p_current_turn: 1,
      p_phase: "countdown",
      p_player1_health: p1Stats.maxHp,
      p_player1_energy: p1Stats.maxEnergy,
      p_player1_guard_meter: 0,
      p_player1_rounds_won: 0,
      p_player1_is_stunned: false,
      p_player1_current_animation: "idle",
      p_player1_has_submitted_move: false,
      p_player2_health: p2Stats.maxHp,
      p_player2_energy: p2Stats.maxEnergy,
      p_player2_guard_meter: 0,
      p_player2_rounds_won: 0,
      p_player2_is_stunned: false,
      p_player2_current_animation: "idle",
      p_player2_has_submitted_move: false,
      p_move_deadline_at: moveDeadlineAt,
      p_countdown_ends_at: countdownEndsAt,
      p_animation_phase: null,
      p_animation_started_at: null,
      p_animation_ends_at: null,
      p_round_winner: null,
      p_round_end_countdown: null,
      p_last_resolved_player1_move: null,
      p_last_resolved_player2_move: null,
      p_last_narrative: null,
    });

    if (error) {
      console.error("[Fight State API] POST error:", error);
      return createErrorResponse(
        new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to initialize fight state")
      );
    }

    return NextResponse.json({
      success: true,
      state: toFightStateSnapshot(result),
    });

  } catch (error) {
    console.error("[Fight State API] POST error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to initialize fight state")
    );
  }
}
