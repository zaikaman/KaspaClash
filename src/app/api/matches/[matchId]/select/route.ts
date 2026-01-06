/**
 * POST /api/matches/[matchId]/select
 * Submit character selection for a match
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { broadcastMultipleToChannel } from "@/lib/supabase/broadcast";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import { isValidCharacterId, getCharacter } from "@/data/characters";
import type { ApiSuccessResponse } from "@/types/api";
import { getCharacterCombatStats } from "@/game/combat";

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
  // Added for reconnection scenarios - allows client to start match locally
  player1CharacterId?: string;
  player2CharacterId?: string;
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

    // Check match status - allow waiting, pending, character_select, or in_progress (for reconnection)
    console.log(`[Select API] Match ${matchId} status: ${match.status}, confirm: ${body.confirm}`);
    console.log(`[Select API] Player: ${body.playerAddress.slice(0, 12)}..., isPlayer1: ${isPlayer1}`);
    console.log(`[Select API] P1 char: ${match.player1_character_id}, P2 char: ${match.player2_character_id}`);

    if (match.status !== "character_select" && match.status !== "pending" && match.status !== "waiting" && match.status !== "in_progress") {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.CONFLICT,
          `Cannot select character in match status: ${match.status}`
        )
      );
    }

    // Check if player has already selected a character
    const existingCharacterId = isPlayer1
      ? match.player1_character_id
      : match.player2_character_id;

    // If player already has a character selected and is confirming, 
    // check if both players are ready and trigger match start
    if (existingCharacterId && body.confirm) {
      const opponentCharacterId = isPlayer1
        ? match.player2_character_id
        : match.player1_character_id;

      if (opponentCharacterId) {
        // Both players have already selected - trigger match start
        console.log("[Select API] Both players already have characters, triggering match start");

        // Update match status if not already in_progress
        // Use conditional update to prevent race conditions - only update if status is still character_select/waiting
        // Cast to string to avoid TypeScript narrowing issues
        const currentStatus = match.status as string;
        if (currentStatus !== "in_progress") {
          const { data: updateResult } = await supabase
            .from("matches")
            .update({
              status: "in_progress",
              started_at: new Date().toISOString(),
            })
            .eq("id", matchId)
            .neq("status", "in_progress") // Only update if not already in_progress
            .select("id")
            .single();

          // Only broadcast if we successfully updated (we won the race)
          if (!updateResult) {
            console.log("[Select API] Match already started by other player, skipping broadcast");
            console.log("[Select API] Returning matchReady=true for local match start fallback");

            const character = getCharacter(existingCharacterId);
            const response: ApiSuccessResponse<SelectionResponse> = {
              success: true,
              data: {
                matchId,
                playerAddress: body.playerAddress,
                characterId: existingCharacterId,
                characterName: character?.name || "Unknown",
                isConfirmed: true,
                opponentReady: true,
                matchReady: true,
                // Include both character IDs for local match start
                player1CharacterId: match.player1_character_id || undefined,
                player2CharacterId: match.player2_character_id || undefined,
              },
            };
            return NextResponse.json(response);
          }
        }

        // Broadcast match_starting and round_starting events using proper subscription
        const ROUND_COUNTDOWN_MS = 3000;
        const MOVE_TIMER_MS = 20000;
        const moveDeadlineAt = Date.now() + ROUND_COUNTDOWN_MS + MOVE_TIMER_MS;

        // Create initial round with server-side deadline
        await supabase
          .from("rounds")
          .upsert({
            match_id: matchId,
            round_number: 1,
            move_deadline_at: new Date(moveDeadlineAt).toISOString(),
          }, { onConflict: "match_id,round_number" });

        console.log("[Select API] Broadcasting match_starting and round_starting events");
        await broadcastMultipleToChannel(supabase, `game:${matchId}`, [
          {
            event: "match_starting",
            payload: {
              matchId,
              player1: {
                address: match.player1_address,
                characterId: match.player1_character_id,
              },
              player2: {
                address: match.player2_address,
                characterId: match.player2_character_id,
              },
              format: match.format || "best_of_3",
              startsAt: Date.now() + ROUND_COUNTDOWN_MS,
            },
          },
          {
            event: "round_starting",
            payload: {
              roundNumber: 1,
              turnNumber: 1,
              moveDeadlineAt,
              countdownSeconds: Math.floor(ROUND_COUNTDOWN_MS / 1000),
              // Use character-specific max values
              player1Health: getCharacterCombatStats(match.player1_character_id || "dag-warrior").maxHp,
              player2Health: getCharacterCombatStats(match.player2_character_id || "dag-warrior").maxHp,
              player1MaxHealth: getCharacterCombatStats(match.player1_character_id || "dag-warrior").maxHp,
              player2MaxHealth: getCharacterCombatStats(match.player2_character_id || "dag-warrior").maxHp,
              player1Energy: getCharacterCombatStats(match.player1_character_id || "dag-warrior").maxEnergy,
              player2Energy: getCharacterCombatStats(match.player2_character_id || "dag-warrior").maxEnergy,
              player1GuardMeter: 0,
              player2GuardMeter: 0,
              // Initial round - no stun
              player1IsStunned: false,
              player2IsStunned: false,
            },
          },
        ]);

        const character = getCharacter(existingCharacterId);
        const response: ApiSuccessResponse<SelectionResponse> = {
          success: true,
          data: {
            matchId,
            playerAddress: body.playerAddress,
            characterId: existingCharacterId,
            characterName: character?.name || "Unknown",
            isConfirmed: true,
            opponentReady: true,
            matchReady: true,
          },
        };

        return NextResponse.json(response);
      }
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
    let player1CharId: string | undefined = undefined;
    let player2CharId: string | undefined = undefined;

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

        // Store character IDs for response
        if (matchReady) {
          player1CharId = updatedMatch.player1_character_id || undefined;
          player2CharId = updatedMatch.player2_character_id || undefined;
          console.log("[Select API] Match is ready! p1:", player1CharId, "p2:", player2CharId);
        }

        // Broadcast character_selected event to opponent using proper subscription
        const { broadcastToChannel } = await import("@/lib/supabase/broadcast");
        await broadcastToChannel(supabase, `game:${matchId}`, "character_selected", {
          player: isPlayer1 ? "player1" : "player2",
          characterId: body.characterId,
          locked: true,
        });

        // If both ready, update match status to in_progress and broadcast match_starting
        if (matchReady) {
          const { error: startError } = await supabase
            .from("matches")
            .update({
              status: "in_progress",
              started_at: new Date().toISOString(),
            })
            .eq("id", matchId);

          if (startError) {
            console.error("[Select API] Failed to start match:", startError);
            return createErrorResponse(
              new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to start match")
            );
          }

          // Broadcast match_starting event to both players
          const ROUND_COUNTDOWN_MS = 3000;
          const MOVE_TIMER_MS = 20000;
          const moveDeadlineAt = Date.now() + ROUND_COUNTDOWN_MS + MOVE_TIMER_MS;

          // Create initial round with server-side deadline
          await supabase
            .from("rounds")
            .upsert({
              match_id: matchId,
              round_number: 1,
              move_deadline_at: new Date(moveDeadlineAt).toISOString(),
            }, { onConflict: "match_id,round_number" });

          console.log("[Select API] Broadcasting match_starting and round_starting events (normal flow)");
          console.log("[Select API] Broadcasting to channel: game:", matchId);
          await broadcastMultipleToChannel(supabase, `game:${matchId}`, [
            {
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
                startsAt: Date.now() + ROUND_COUNTDOWN_MS,
              },
            },
            {
              event: "round_starting",
              payload: {
                roundNumber: 1,
                turnNumber: 1,
                moveDeadlineAt,
                countdownSeconds: Math.floor(ROUND_COUNTDOWN_MS / 1000),
                // Use character-specific max values
                player1Health: getCharacterCombatStats(updatedMatch.player1_character_id || "dag-warrior").maxHp,
                player2Health: getCharacterCombatStats(updatedMatch.player2_character_id || "dag-warrior").maxHp,
                player1MaxHealth: getCharacterCombatStats(updatedMatch.player1_character_id || "dag-warrior").maxHp,
                player2MaxHealth: getCharacterCombatStats(updatedMatch.player2_character_id || "dag-warrior").maxHp,
                player1Energy: getCharacterCombatStats(updatedMatch.player1_character_id || "dag-warrior").maxEnergy,
                player2Energy: getCharacterCombatStats(updatedMatch.player2_character_id || "dag-warrior").maxEnergy,
                player1GuardMeter: 0,
                player2GuardMeter: 0,
                // Initial round - no stun
                player1IsStunned: false,
                player2IsStunned: false,
              },
            },
          ]);
          console.log("[Select API] Broadcast complete");
        }
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
        // Include character IDs for local match start when matchReady is true
        player1CharacterId: player1CharId,
        player2CharacterId: player2CharId,
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
