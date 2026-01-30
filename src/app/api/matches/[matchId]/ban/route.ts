/**
 * POST /api/matches/[matchId]/ban
 * Save character ban for a match
 * 
 * This endpoint persists ban selections to the database for server-side synchronization.
 * Bans are saved immediately when confirmed, ensuring state survives page refreshes.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { broadcastToChannel } from "@/lib/supabase/broadcast";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import { isValidCharacterId, getCharacter } from "@/data/characters";
import type { ApiSuccessResponse } from "@/types/api";

/**
 * Ban request body.
 */
interface BanRequest {
  playerAddress: string;
  characterId: string;
}

/**
 * Ban response data.
 */
interface BanResponse {
  matchId: string;
  playerAddress: string;
  characterId: string;
  characterName: string;
  playerRole: "player1" | "player2";
  opponentBanId: string | null;
  bothBansComplete: boolean;
}

/**
 * POST handler - Submit character ban
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
    const body: BanRequest = await request.json();

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

    // Fetch match - cast to include ban columns that may not be in auto-generated types
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !matchData) {
      console.error("Match fetch error:", matchError);
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Match not found")
      );
    }
    
    // Cast to include ban columns
    const match = matchData as typeof matchData & {
      player1_ban_id: string | null;
      player2_ban_id: string | null;
    };

    // Verify player is in the match
    const isPlayer1 = match.player1_address === body.playerAddress;
    const isPlayer2 = match.player2_address === body.playerAddress;

    if (!isPlayer1 && !isPlayer2) {
      return createErrorResponse(
        new ApiError(ErrorCodes.FORBIDDEN, "Player not in this match")
      );
    }

    // Check match status - allow pending, waiting, character_select
    const allowedStatuses = ["pending", "waiting", "character_select"];
    if (!allowedStatuses.includes(match.status)) {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.CONFLICT,
          `Cannot submit ban in match status: ${match.status}`
        )
      );
    }

    const playerRole = isPlayer1 ? "player1" : "player2";
    const banColumn = isPlayer1 ? "player1_ban_id" : "player2_ban_id";
    const opponentBanColumn = isPlayer1 ? "player2_ban_id" : "player1_ban_id";

    // Check if player has already submitted a ban
    const existingBan = isPlayer1 ? match.player1_ban_id : match.player2_ban_id;
    if (existingBan) {
      console.log(`[Ban API] Player ${playerRole} already banned: ${existingBan}`);
      return createErrorResponse(
        new ApiError(ErrorCodes.CONFLICT, "You have already submitted a ban")
      );
    }

    // Update ban in database
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        [banColumn]: body.characterId,
      })
      .eq("id", matchId);

    if (updateError) {
      console.error("Failed to save ban:", updateError);
      return createErrorResponse(
        new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to save ban")
      );
    }

    console.log(`[Ban API] Saved ban for ${playerRole}: ${body.characterId}`);

    // Broadcast ban_confirmed to opponent
    try {
      await broadcastToChannel(supabase, `game:${matchId}`, "ban_confirmed", {
        player: playerRole,
        characterId: body.characterId,
      });
      console.log(`[Ban API] Broadcast ban_confirmed for ${playerRole}`);
    } catch (broadcastError) {
      console.error("[Ban API] Broadcast failed (non-fatal):", broadcastError);
      // Continue - client will sync via database on reconnect
    }

    // Check if both bans are now complete
    const opponentBan = isPlayer1 ? match.player2_ban_id : match.player1_ban_id;
    const bothBansComplete = !!opponentBan;

    const response: ApiSuccessResponse<BanResponse> = {
      success: true,
      data: {
        matchId,
        playerAddress: body.playerAddress,
        characterId: body.characterId,
        characterName: character.name,
        playerRole,
        opponentBanId: opponentBan || null,
        bothBansComplete,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Ban submission error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to process ban")
    );
  }
}

/**
 * GET handler - Get current ban state
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
    
    // Cast to include ban columns
    const match = matchData as typeof matchData & {
      player1_ban_id: string | null;
      player2_ban_id: string | null;
    };

    // Verify player is in the match
    const isPlayer1 = match.player1_address === playerAddress;
    const isPlayer2 = match.player2_address === playerAddress;

    if (!isPlayer1 && !isPlayer2) {
      return createErrorResponse(
        new ApiError(ErrorCodes.FORBIDDEN, "Player not in this match")
      );
    }

    // Get bans from both perspectives
    const playerBanId = isPlayer1 ? match.player1_ban_id : match.player2_ban_id;
    const opponentBanId = isPlayer1 ? match.player2_ban_id : match.player1_ban_id;

    const response: ApiSuccessResponse<{
      matchId: string;
      playerBanId: string | null;
      opponentBanId: string | null;
      bothBansComplete: boolean;
    }> = {
      success: true,
      data: {
        matchId,
        playerBanId: playerBanId || null,
        opponentBanId: opponentBanId || null,
        bothBansComplete: !!playerBanId && !!opponentBanId,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get ban state error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to get ban state")
    );
  }
}
