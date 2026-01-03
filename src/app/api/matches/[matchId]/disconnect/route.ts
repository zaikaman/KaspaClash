/**
 * POST /api/matches/[matchId]/disconnect
 * Handle player disconnect/reconnect events
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
 * Disconnect request body.
 */
interface DisconnectRequest {
  address: string;
  action: "disconnect" | "reconnect";
}

/**
 * Disconnect response data.
 */
interface DisconnectResponse {
  matchId: string;
  playerAddress: string;
  action: string;
  matchStatus: string;
  disconnectState: {
    player1Disconnected: boolean;
    player2Disconnected: boolean;
    player1DisconnectedAt: string | null;
    player2DisconnectedAt: string | null;
  };
  // For reconnect: current game state to sync
  gameState?: {
    status: string;
    currentRound: number;
    player1Health: number;
    player2Health: number;
    player1RoundsWon: number;
    player2RoundsWon: number;
    player1CharacterId: string | null;
    player2CharacterId: string | null;
    player1Energy: number;
    player2Energy: number;
    moveDeadlineAt: number | null;
    pendingMoves: {
      player1: boolean;
      player2: boolean;
    };
  };
}

/**
 * POST handler - Handle disconnect/reconnect
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
    const body: DisconnectRequest = await request.json();

    // Validate required fields
    if (!body.address) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Player address is required")
      );
    }

    if (!body.action || !["disconnect", "reconnect"].includes(body.action)) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Action must be 'disconnect' or 'reconnect'")
      );
    }

    const supabase = await createSupabaseServerClient();

    // Fetch match - cast to extended type with disconnect fields
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

    // Check match status - only process for active matches
    if (match.status === "completed") {
      return createErrorResponse(
        new ApiError(ErrorCodes.CONFLICT, "Match is already completed")
      );
    }

    const now = new Date().toISOString();
    const disconnectColumn = isPlayer1 ? "player1_disconnected_at" : "player2_disconnected_at";

    if (body.action === "disconnect") {
      // Mark player as disconnected
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          [disconnectColumn]: now,
        })
        .eq("id", matchId);

      if (updateError) {
        console.error("Failed to update disconnect status:", updateError);
        return createErrorResponse(
          new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to update disconnect status")
        );
      }

      // Broadcast disconnect event to the game channel
      const gameChannel = supabase.channel(`game:${matchId}`);
      await gameChannel.send({
        type: "broadcast",
        event: "player_disconnected",
        payload: {
          player: isPlayer1 ? "player1" : "player2",
          address: body.address,
          disconnectedAt: Date.now(),
          timeoutSeconds: match.disconnect_timeout_seconds || 30,
        },
      });
      await supabase.removeChannel(gameChannel);

      // Refetch to get updated state
      const { data: updatedMatchData } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      const updatedMatch = updatedMatchData as unknown as MatchWithDisconnect | null;

      const response: ApiSuccessResponse<DisconnectResponse> = {
        success: true,
        data: {
          matchId,
          playerAddress: body.address,
          action: "disconnect",
          matchStatus: updatedMatch?.status || match.status,
          disconnectState: {
            player1Disconnected: !!updatedMatch?.player1_disconnected_at,
            player2Disconnected: !!updatedMatch?.player2_disconnected_at,
            player1DisconnectedAt: updatedMatch?.player1_disconnected_at || null,
            player2DisconnectedAt: updatedMatch?.player2_disconnected_at || null,
          },
        },
      };

      return NextResponse.json(response);
    } else {
      // Reconnect - clear disconnect timestamp
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          [disconnectColumn]: null,
        })
        .eq("id", matchId);

      if (updateError) {
        console.error("Failed to clear disconnect status:", updateError);
        return createErrorResponse(
          new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to clear disconnect status")
        );
      }

      // Get current round info for state sync
      const { data: currentRound } = await supabase
        .from("rounds")
        .select("*")
        .eq("match_id", matchId)
        .order("round_number", { ascending: false })
        .limit(1)
        .single();

      // Check if we have pending moves in current round
      const pendingMoves = {
        player1: !!currentRound?.player1_move,
        player2: !!currentRound?.player2_move,
      };

      // Broadcast reconnect event
      const gameChannel = supabase.channel(`game:${matchId}`);
      await gameChannel.send({
        type: "broadcast",
        event: "player_reconnected",
        payload: {
          player: isPlayer1 ? "player1" : "player2",
          address: body.address,
          reconnectedAt: Date.now(),
        },
      });
      await supabase.removeChannel(gameChannel);

      // Build game state for the reconnecting player
      // Default values for when round data isn't available
      const defaultHealth = 100;
      const defaultEnergy = 100;
      
      // Calculate move deadline (if in active round, give them the remaining time)
      const moveDeadlineAt = match.status === "in_progress" && currentRound && !currentRound.winner_address
        ? Date.now() + 15000 // Give them 15 seconds to make a move
        : null;

      const gameState = {
        status: match.status,
        currentRound: currentRound?.round_number || 1,
        player1Health: currentRound?.player1_health_after ?? defaultHealth,
        player2Health: currentRound?.player2_health_after ?? defaultHealth,
        player1RoundsWon: match.player1_rounds_won,
        player2RoundsWon: match.player2_rounds_won,
        player1CharacterId: match.player1_character_id,
        player2CharacterId: match.player2_character_id,
        player1Energy: defaultEnergy, // Would need to track in rounds table for accuracy
        player2Energy: defaultEnergy,
        moveDeadlineAt,
        pendingMoves,
      };

      const response: ApiSuccessResponse<DisconnectResponse> = {
        success: true,
        data: {
          matchId,
          playerAddress: body.address,
          action: "reconnect",
          matchStatus: match.status,
          disconnectState: {
            player1Disconnected: isPlayer1 ? false : !!match.player1_disconnected_at,
            player2Disconnected: isPlayer2 ? false : !!match.player2_disconnected_at,
            player1DisconnectedAt: isPlayer1 ? null : match.player1_disconnected_at,
            player2DisconnectedAt: isPlayer2 ? null : match.player2_disconnected_at,
          },
          gameState,
        },
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("Disconnect/reconnect error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to process disconnect/reconnect")
    );
  }
}

/**
 * GET handler - Get current disconnect state
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

    // Fetch match
    const { data: matchData, error } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (error || !matchData) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Match not found")
      );
    }

    // Cast to extended type
    const match = matchData as unknown as MatchWithDisconnect;

    const response: ApiSuccessResponse<{
      matchId: string;
      status: string;
      disconnectState: {
        player1Disconnected: boolean;
        player2Disconnected: boolean;
        player1DisconnectedAt: string | null;
        player2DisconnectedAt: string | null;
        timeoutSeconds: number;
      };
    }> = {
      success: true,
      data: {
        matchId,
        status: match.status,
        disconnectState: {
          player1Disconnected: !!match.player1_disconnected_at,
          player2Disconnected: !!match.player2_disconnected_at,
          player1DisconnectedAt: match.player1_disconnected_at || null,
          player2DisconnectedAt: match.player2_disconnected_at || null,
          timeoutSeconds: match.disconnect_timeout_seconds || 30,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get disconnect state error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to get disconnect state")
    );
  }
}
