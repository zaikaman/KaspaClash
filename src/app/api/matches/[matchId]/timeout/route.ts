/**
 * POST /api/matches/[matchId]/timeout
 * Handle disconnect timeout - called when 30 seconds expire
 * Determines winner based on who is still connected
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import type { ApiSuccessResponse } from "@/types/api";

/**
 * Extended match type with disconnect tracking columns.
 * These columns are added by migration 006_add_disconnect_tracking.sql
 */
interface MatchWithDisconnect {
  id: string;
  room_code: string | null;
  player1_address: string;
  player2_address: string | null;
  player1_character_id: string | null;
  player2_character_id: string | null;
  format: string;
  status: string;
  winner_address: string | null;
  player1_rounds_won: number;
  player2_rounds_won: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  selection_deadline_at: string | null;
  // Disconnect tracking fields
  player1_disconnected_at: string | null;
  player2_disconnected_at: string | null;
  disconnect_timeout_seconds: number | null;
}

/**
 * Timeout request body.
 */
interface TimeoutRequest {
  address: string; // The player calling the timeout (must be the connected one)
}

/**
 * Timeout response data.
 */
interface TimeoutResponse {
  matchId: string;
  result: "win" | "cancelled" | "no_action";
  winnerAddress?: string;
  reason: string;
}

/**
 * POST handler - Process disconnect timeout
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

    // Parse request body
    const body: TimeoutRequest = await request.json();

    if (!body.address) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Player address is required")
      );
    }

    const supabase = await createSupabaseServerClient();

    // Fetch match - cast to extended type
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !matchData) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Match not found")
      );
    }

    // Cast to extended type
    const match = matchData as unknown as MatchWithDisconnect;

    // Verify player is in the match
    const isPlayer1 = match.player1_address === body.address;
    const isPlayer2 = match.player2_address === body.address;

    if (!isPlayer1 && !isPlayer2) {
      return createErrorResponse(
        new ApiError(ErrorCodes.FORBIDDEN, "Player not in this match")
      );
    }

    // Check match status
    if (match.status === "completed") {
      const response: ApiSuccessResponse<TimeoutResponse> = {
        success: true,
        data: {
          matchId,
          result: "no_action",
          reason: "Match is already completed",
        },
      };
      return NextResponse.json(response);
    }

    const timeoutSeconds = match.disconnect_timeout_seconds || 30;
    const now = Date.now();

    // Check disconnect states
    const p1DisconnectedAt = match.player1_disconnected_at
      ? new Date(match.player1_disconnected_at).getTime()
      : null;
    const p2DisconnectedAt = match.player2_disconnected_at
      ? new Date(match.player2_disconnected_at).getTime()
      : null;

    const p1TimedOut = p1DisconnectedAt && (now - p1DisconnectedAt) > timeoutSeconds * 1000;
    const p2TimedOut = p2DisconnectedAt && (now - p2DisconnectedAt) > timeoutSeconds * 1000;

    // Neither player has timed out yet
    if (!p1TimedOut && !p2TimedOut) {
      const response: ApiSuccessResponse<TimeoutResponse> = {
        success: true,
        data: {
          matchId,
          result: "no_action",
          reason: "No player has timed out yet",
        },
      };
      return NextResponse.json(response);
    }

    // Both players timed out - cancel the match
    if (p1TimedOut && p2TimedOut) {
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          // No winner - it's a draw/cancellation
        })
        .eq("id", matchId);

      if (updateError) {
        console.error("Failed to cancel match:", updateError);
        return createErrorResponse(
          new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to cancel match")
        );
      }

      // Broadcast match cancelled
      const gameChannel = supabase.channel(`game:${matchId}`);
      await gameChannel.send({
        type: "broadcast",
        event: "match_cancelled",
        payload: {
          matchId,
          reason: "both_disconnected",
          message: "Both players disconnected. Match cancelled.",
          redirectTo: "/matchmaking",
        },
      });
      await supabase.removeChannel(gameChannel);

      const response: ApiSuccessResponse<TimeoutResponse> = {
        success: true,
        data: {
          matchId,
          result: "cancelled",
          reason: "Both players disconnected and timed out",
        },
      };
      return NextResponse.json(response);
    }

    // One player timed out - the other wins
    const winnerAddress = p1TimedOut ? match.player2_address : match.player1_address;
    const winnerRole = p1TimedOut ? "player2" : "player1";

    // Verify the caller is the winner (the one still connected)
    if (body.address !== winnerAddress) {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.FORBIDDEN,
          "Only the connected player can claim timeout victory"
        )
      );
    }

    // Update match as completed with winner
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        status: "completed",
        winner_address: winnerAddress,
        completed_at: new Date().toISOString(),
        // Clear disconnect timestamps
        player1_disconnected_at: null,
        player2_disconnected_at: null,
      })
      .eq("id", matchId);

    if (updateError) {
      console.error("Failed to complete match:", updateError);
      return createErrorResponse(
        new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to complete match")
      );
    }

    // Update player stats - winner gets a win, disconnected player gets a loss
    // Note: Using direct updates instead of RPC functions
    const loserAddress = p1TimedOut ? match.player1_address : match.player2_address;
    
    // Update winner stats
    if (winnerAddress) {
      const { data: winner } = await supabase
        .from("players")
        .select("wins")
        .eq("address", winnerAddress)
        .single();
      
      if (winner) {
        await supabase
          .from("players")
          .update({ wins: winner.wins + 1 })
          .eq("address", winnerAddress);
      }
    }
    
    // Update loser stats
    if (loserAddress) {
      const { data: loser } = await supabase
        .from("players")
        .select("losses")
        .eq("address", loserAddress)
        .single();
      
      if (loser) {
        await supabase
          .from("players")
          .update({ losses: loser.losses + 1 })
          .eq("address", loserAddress);
      }
    }

    // Broadcast match ended
    const gameChannel = supabase.channel(`game:${matchId}`);
    await gameChannel.send({
      type: "broadcast",
      event: "match_ended",
      payload: {
        matchId,
        winner: winnerRole,
        winnerAddress,
        reason: "opponent_disconnected",
        finalScore: {
          player1RoundsWon: match.player1_rounds_won,
          player2RoundsWon: match.player2_rounds_won,
        },
        stats: {
          totalRounds: match.player1_rounds_won + match.player2_rounds_won,
          player1TotalDamage: 0,
          player2TotalDamage: 0,
          player1MostUsedMove: "N/A",
          player2MostUsedMove: "N/A",
          matchDurationSeconds: 0,
        },
        shareUrl: `/m/${matchId}`,
        explorerUrl: "",
      },
    });
    await supabase.removeChannel(gameChannel);

    const response: ApiSuccessResponse<TimeoutResponse> = {
      success: true,
      data: {
        matchId,
        result: "win",
        winnerAddress,
        reason: `Opponent disconnected and timed out after ${timeoutSeconds} seconds`,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Timeout processing error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to process timeout")
    );
  }
}
