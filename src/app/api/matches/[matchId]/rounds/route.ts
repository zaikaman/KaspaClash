/**
 * GET /api/matches/[matchId]/rounds
 * Fetch round history for a match
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";

/**
 * GET handler - Fetch rounds
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

    // Verify match exists
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Match not found")
      );
    }

    // Fetch rounds with moves
    const { data: rounds, error: roundsError } = await supabase
      .from("rounds")
      .select(
        `
        id,
        match_id,
        round_number,
        player1_move,
        player2_move,
        player1_damage_dealt,
        player2_damage_dealt,
        player1_health_after,
        player2_health_after,
        winner_address,
        created_at,
        moves:moves(
          id,
          player_address,
          move_type,
          tx_id,
          tx_confirmed_at,
          created_at
        )
      `
      )
      .eq("match_id", matchId)
      .order("round_number", { ascending: true });

    if (roundsError) {
      console.error("Rounds fetch error:", roundsError);
      return createErrorResponse(
        new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to fetch rounds")
      );
    }

    // Transform to camelCase response
    const response = {
      rounds: rounds.map((round) => ({
        id: round.id,
        matchId: round.match_id,
        roundNumber: round.round_number,
        player1Move: round.player1_move,
        player2Move: round.player2_move,
        player1DamageDealt: round.player1_damage_dealt,
        player2DamageDealt: round.player2_damage_dealt,
        player1HealthAfter: round.player1_health_after,
        player2HealthAfter: round.player2_health_after,
        winnerAddress: round.winner_address,
        createdAt: round.created_at,
        moves: round.moves?.map((move) => ({
          id: move.id,
          playerAddress: move.player_address,
          moveType: move.move_type,
          txId: move.tx_id,
          txConfirmedAt: move.tx_confirmed_at,
          createdAt: move.created_at,
        })),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Rounds endpoint error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Internal server error")
    );
  }
}
