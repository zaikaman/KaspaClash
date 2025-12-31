/**
 * GET /api/matches/[matchId]
 * Fetch match state and details
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";

/**
 * GET handler - Fetch match state
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

    // Fetch match with player details
    const { data: match, error } = await supabase
      .from("matches")
      .select(
        `
        id,
        room_code,
        player1_address,
        player2_address,
        player1_character_id,
        player2_character_id,
        format,
        status,
        winner_address,
        player1_rounds_won,
        player2_rounds_won,
        created_at,
        started_at,
        completed_at,
        player1:players!matches_player1_address_fkey(
          address,
          display_name,
          rating
        ),
        player2:players!matches_player2_address_fkey(
          address,
          display_name,
          rating
        )
      `
      )
      .eq("id", matchId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return createErrorResponse(
          new ApiError(ErrorCodes.NOT_FOUND, "Match not found")
        );
      }
      console.error("Match fetch error:", error);
      return createErrorResponse(
        new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to fetch match")
      );
    }

    // Transform to camelCase response
    const response = {
      id: match.id,
      roomCode: match.room_code,
      player1Address: match.player1_address,
      player2Address: match.player2_address,
      player1CharacterId: match.player1_character_id,
      player2CharacterId: match.player2_character_id,
      format: match.format,
      status: match.status,
      winnerAddress: match.winner_address,
      player1RoundsWon: match.player1_rounds_won,
      player2RoundsWon: match.player2_rounds_won,
      createdAt: match.created_at,
      startedAt: match.started_at,
      completedAt: match.completed_at,
      player1: match.player1
        ? {
            address: match.player1.address,
            displayName: match.player1.display_name,
            rating: match.player1.rating,
          }
        : null,
      player2: match.player2
        ? {
            address: match.player2.address,
            displayName: match.player2.display_name,
            rating: match.player2.rating,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Match endpoint error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Internal server error")
    );
  }
}
