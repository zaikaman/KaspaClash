/**
 * POST /api/matches/[matchId]/select
 * Submit character selection for a match
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import { isValidCharacterId, getCharacter } from "@/data/characters";
import type { ApiSuccessResponse } from "@/types/api";

/**
 * Selection request body.
 */
interface SelectionRequest {
  playerAddress: string;
  characterId: string;
  confirm?: boolean; // If true, locks in the selection
}

/**
 * Selection response data.
 */
interface SelectionResponse {
  matchId: string;
  playerAddress: string;
  characterId: string;
  characterName: string;
  isConfirmed: boolean;
  opponentReady: boolean;
  matchReady: boolean;
}

/**
 * POST handler - Submit character selection
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
    const body: SelectionRequest = await request.json();

    // Validate required fields
    if (!body.playerAddress) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Player address is required")
      );
    }

    if (!body.characterId) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Character ID is required")
      );
    }

    // Validate character ID
    if (!isValidCharacterId(body.characterId)) {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          `Invalid character ID: ${body.characterId}`
        )
      );
    }

    const character = getCharacter(body.characterId);
    if (!character) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Character not found")
      );
    }

    const supabase = await createSupabaseServerClient();

    // Fetch match
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

    // Verify player is in the match
    const isPlayer1 = match.player1_address === body.playerAddress;
    const isPlayer2 = match.player2_address === body.playerAddress;

    if (!isPlayer1 && !isPlayer2) {
      return createErrorResponse(
        new ApiError(ErrorCodes.FORBIDDEN, "Player not in this match")
      );
    }

    // Check match status
    if (match.status !== "character_select" && match.status !== "pending") {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.CONFLICT,
          `Cannot select character in match status: ${match.status}`
        )
      );
    }

    // Determine which column to update
    const characterColumn = isPlayer1
      ? "player1_character_id"
      : "player2_character_id";

    // Update character selection
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        [characterColumn]: body.characterId,
        status: "character_select", // Ensure status is correct
      })
      .eq("id", matchId);

    if (updateError) {
      console.error("Failed to update character selection:", updateError);
      return createErrorResponse(
        new ApiError(
          ErrorCodes.INTERNAL_ERROR,
          "Failed to save character selection"
        )
      );
    }

    // If confirm flag is set, check if match can start
    let matchReady = false;
    let opponentReady = false;

    if (body.confirm) {
      // Refetch to get updated state
      const { data: updatedMatch } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (updatedMatch) {
        opponentReady = isPlayer1
          ? !!updatedMatch.player2_character_id
          : !!updatedMatch.player1_character_id;

        matchReady =
          !!updatedMatch.player1_character_id &&
          !!updatedMatch.player2_character_id;

        // Broadcast character_selected event to opponent
        const gameChannel = supabase.channel(`game:${matchId}`);
        await gameChannel.send({
          type: "broadcast",
          event: "character_selected",
          payload: {
            player: isPlayer1 ? "player1" : "player2",
            characterId: body.characterId,
            locked: true,
          },
        });

        // If both ready, update match status to active and broadcast match_starting
        if (matchReady) {
          await supabase
            .from("matches")
            .update({
              status: "active",
              started_at: new Date().toISOString(),
            })
            .eq("id", matchId);

          // Broadcast match_starting event to both players
          await gameChannel.send({
            type: "broadcast",
            event: "match_starting",
            payload: {
              matchId,
              player1: {
                address: updatedMatch.player1_address,
                characterId: updatedMatch.player1_character_id,
              },
              player2: {
                address: updatedMatch.player2_address,
                characterId: updatedMatch.player2_character_id,
              },
              format: updatedMatch.format || "best_of_3",
              startsAt: Date.now() + 3000, // 3 second countdown
            },
          });
        }

        await supabase.removeChannel(gameChannel);
      }
    }

    const response: ApiSuccessResponse<SelectionResponse> = {
      success: true,
      data: {
        matchId,
        playerAddress: body.playerAddress,
        characterId: body.characterId,
        characterName: character.name,
        isConfirmed: body.confirm ?? false,
        opponentReady,
        matchReady,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Character selection error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to process selection")
    );
  }
}

/**
 * GET handler - Get current selection state
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

    const playerAddress = request.nextUrl.searchParams.get("playerAddress");
    if (!playerAddress) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Player address is required")
      );
    }

    const supabase = await createSupabaseServerClient();

    // Fetch match
    const { data: match, error } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (error || !match) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Match not found")
      );
    }

    // Verify player is in the match
    const isPlayer1 = match.player1_address === playerAddress;
    const isPlayer2 = match.player2_address === playerAddress;

    if (!isPlayer1 && !isPlayer2) {
      return createErrorResponse(
        new ApiError(ErrorCodes.FORBIDDEN, "Player not in this match")
      );
    }

    // Get selections
    const playerCharacterId = isPlayer1
      ? match.player1_character_id
      : match.player2_character_id;
    const opponentCharacterId = isPlayer1
      ? match.player2_character_id
      : match.player1_character_id;

    const response: ApiSuccessResponse<{
      matchId: string;
      playerCharacterId: string | null;
      opponentCharacterId: string | null;
      matchStatus: string;
      matchReady: boolean;
    }> = {
      success: true,
      data: {
        matchId,
        playerCharacterId,
        opponentCharacterId,
        matchStatus: match.status,
        matchReady:
          !!match.player1_character_id && !!match.player2_character_id,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get selection state error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to get selection state")
    );
  }
}
