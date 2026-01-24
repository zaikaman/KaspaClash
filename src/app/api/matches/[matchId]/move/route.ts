/**
 * POST /api/matches/[matchId]/move
 * Submit a move with transaction ID
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import type { MoveType } from "@/types";

/**
 * Request body schema.
 */
interface MoveSubmitRequest {
  address: string;
  moveType: MoveType;
  txId: string;
}

/**
 * Validate move type.
 */
function isValidMoveType(move: unknown): move is MoveType {
  return (
    typeof move === "string" &&
    ["punch", "kick", "block", "special", "stunned"].includes(move)
  );
}

/**
 * POST handler - Submit move
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
    const body: MoveSubmitRequest = await request.json();

    // Validate required fields
    if (!body.address || !body.moveType || !body.txId) {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          "Missing required fields: address, moveType, txId"
        )
      );
    }

    // Validate move type
    if (!isValidMoveType(body.moveType)) {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          "Invalid move type. Must be: punch, kick, block, or special"
        )
      );
    }

    // Validate transaction ID format (64 hex characters)
    const txIdRegex = /^[a-f0-9]{64}$/i;
    if (!txIdRegex.test(body.txId)) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid transaction ID format")
      );
    }

    const supabase = await createSupabaseServerClient();

    // Fetch the match
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

    // Verify player is part of the match
    const isPlayer1 = match.player1_address === body.address;
    const isPlayer2 = match.player2_address === body.address;

    if (!isPlayer1 && !isPlayer2) {
      return createErrorResponse(
        new ApiError(ErrorCodes.FORBIDDEN, "Not a participant in this match")
      );
    }

    // Verify match is in progress
    if (match.status !== "in_progress") {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.CONFLICT,
          `Cannot submit move: match is ${match.status}`
        )
      );
    }

    // Get or create current round
    let { data: currentRound, error: roundError } = await supabase
      .from("rounds")
      .select("*")
      .eq("match_id", matchId)
      .order("round_number", { ascending: false })
      .limit(1)
      .single();

    // If no round exists or last round is complete, create new round
    if (roundError || !currentRound || (currentRound.player1_move && currentRound.player2_move)) {
      const nextRoundNumber = currentRound ? currentRound.round_number + 1 : 1;

      const { data: newRound, error: createError } = await supabase
        .from("rounds")
        .insert({
          match_id: matchId,
          round_number: nextRoundNumber,
        })
        .select()
        .single();

      if (createError) {
        // Handle race condition: if duplicate key error, another request already created the round
        if (createError.code === '23505') {
          console.log("Round already exists (race condition), fetching existing round");
          const { data: existingRound, error: fetchError } = await supabase
            .from("rounds")
            .select("*")
            .eq("match_id", matchId)
            .eq("round_number", nextRoundNumber)
            .single();

          if (fetchError || !existingRound) {
            console.error("Failed to fetch existing round after race condition:", fetchError);
            return createErrorResponse(
              new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to get round")
            );
          }
          currentRound = existingRound;
        } else {
          console.error("Round creation error:", createError);
          return createErrorResponse(
            new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to create round")
          );
        }
      } else {
        currentRound = newRound;
      }
    }

    // Check if player already submitted for this round
    const moveColumn = isPlayer1 ? "player1_move" : "player2_move";
    if (currentRound[moveColumn]) {
      return createErrorResponse(
        new ApiError(ErrorCodes.CONFLICT, "Move already submitted for this round")
      );
    }

    // Create the move record
    const { data: move, error: moveError } = await supabase
      .from("moves")
      .insert({
        round_id: currentRound.id,
        player_address: body.address,
        move_type: body.moveType,
        tx_id: body.txId,
      })
      .select()
      .single();

    if (moveError) {
      console.error("Move insert error:", moveError);
      return createErrorResponse(
        new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to record move")
      );
    }

    // Update round with the move
    const roundUpdate: Record<string, unknown> = {
      [moveColumn]: body.moveType,
    };

    const { error: updateError } = await supabase
      .from("rounds")
      .update(roundUpdate)
      .eq("id", currentRound.id);

    if (updateError) {
      console.error("Round update error:", updateError);
    }

    // Check if both players have submitted OR if opponent rejected
    const { data: updatedRound } = await supabase
      .from("rounds")
      .select("*")
      .eq("id", currentRound.id)
      .single();

    // Check opponent rejection status
    const roundData = updatedRound as Record<string, unknown> | null;
    const opponentRejectColumn = isPlayer1 ? "player2_rejected" : "player1_rejected";
    const opponentRejected = !!roundData?.[opponentRejectColumn];

    const awaitingOpponent = !(
      updatedRound?.player1_move && updatedRound?.player2_move
    );

    // Broadcast move_submitted event via Supabase Realtime REST API
    // Server-side sends without subscribing explicitly use HTTP/REST
    const gameChannel = supabase.channel(`game:${matchId}`);
    await gameChannel.send({
      type: "broadcast",
      event: "move_submitted",
      payload: {
        player: isPlayer1 ? "player1" : "player2",
        txId: body.txId,
        submittedAt: Date.now(),
      },
    });
    await supabase.removeChannel(gameChannel);

    // BOT AUTO-MOVE: If opponent is a bot and hasn't submitted yet, auto-submit their move
    const opponentAddress = isPlayer1 ? match.player2_address : match.player1_address;
    const isOpponentBot = opponentAddress?.startsWith("bot_");
    
    if (isOpponentBot && opponentAddress && awaitingOpponent) {
      console.log(`[Move Submit] Bot opponent detected, auto-submitting move for ${opponentAddress}`);
      
      // Get bot's smart move
      const { SmartBotOpponent } = await import("@/lib/game/smart-bot-opponent");
      const { CombatEngine } = await import("@/game/combat");
      
      // Create a temporary combat engine to get current state
      const engine = new CombatEngine(
        match.player1_character_id || "dag-warrior",
        match.player2_character_id || "dag-warrior",
        match.format as "best_of_1" | "best_of_3" | "best_of_5"
      );
      
      // Sync engine state with match state (simplified - just set HP/energy/rounds)
      const matchState = engine.getState();
      // Note: In production you'd want to fully sync all previous rounds/turns
      // For now, the bot will make a reasonable decision based on available info
      
      const botName = opponentAddress.replace("bot_", "Bot_");
      const bot = new SmartBotOpponent(botName);
      
      // Update bot context with current match state
      const botPlayer = isPlayer1 ? "player2" : "player1";
      const humanPlayer = isPlayer1 ? "player1" : "player2";
      bot.updateContext({
        botHealth: matchState[botPlayer].hp,
        botMaxHealth: matchState[botPlayer].maxHp,
        botEnergy: matchState[botPlayer].energy,
        botMaxEnergy: matchState[botPlayer].maxEnergy,
        botGuardMeter: matchState[botPlayer].guardMeter,
        botIsStunned: matchState[botPlayer].isStunned || false,
        botIsStaggered: matchState[botPlayer].isStaggered || false,
        opponentHealth: matchState[humanPlayer].hp,
        opponentMaxHealth: matchState[humanPlayer].maxHp,
        opponentEnergy: matchState[humanPlayer].energy,
        opponentMaxEnergy: matchState[humanPlayer].maxEnergy,
        opponentGuardMeter: matchState[humanPlayer].guardMeter,
        opponentIsStunned: matchState[humanPlayer].isStunned || false,
        opponentIsStaggered: matchState[humanPlayer].isStaggered || false,
        roundNumber: matchState.currentRound,
        turnNumber: matchState.currentTurn,
        botRoundsWon: matchState[botPlayer].roundsWon,
        opponentRoundsWon: matchState[humanPlayer].roundsWon,
      });
      
      const decision = bot.decide();
      const botMove = decision.move;
      
      console.log(`[Move Submit] Bot chose move: ${botMove} (${decision.reasoning})`);
      
      // Submit bot's move (fake transaction ID)
      const botTxId = `bot_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`.padEnd(64, '0').substring(0, 64);
      
      const botMoveColumn = isPlayer1 ? "player2_move" : "player1_move";
      const botTxColumn = isPlayer1 ? "player2_move_tx_id" : "player1_move_tx_id";
      
      const { data: botMoveData, error: botMoveError } = await supabase
        .from("moves")
        .insert({
          round_id: currentRound.id,
          player_address: opponentAddress,
          move_type: botMove,
          tx_id: botTxId,
        })
        .select()
        .single();
      
      if (!botMoveError && botMoveData) {
        await supabase
          .from("rounds")
          .update({
            [botMoveColumn]: botMove,
            [botTxColumn]: botTxId,
          })
          .eq("id", currentRound.id);
        
        // Broadcast bot move
        const botGameChannel = supabase.channel(`game:${matchId}`);
        await botGameChannel.send({
          type: "broadcast",
          event: "move_submitted",
          payload: {
            player: isPlayer1 ? "player2" : "player1",
            txId: botTxId,
            submittedAt: Date.now(),
          },
        });
        await supabase.removeChannel(botGameChannel);
        
        // Both moves submitted now, need to resolve
        // Update the local variable to trigger resolution below
        currentRound = {
          ...currentRound,
          [botMoveColumn]: botMove,
          [botTxColumn]: botTxId,
        };
      }
    }
    
    // Re-check if we're still awaiting opponent after bot auto-submit
    const finalOpponentMoveColumn = isPlayer1 ? "player2_move" : "player1_move";
    const finalAwaitingOpponent = !currentRound[finalOpponentMoveColumn];

    // If opponent already rejected, we win this round
    if (opponentRejected) {
      const { handleMoveRejection } = await import("@/lib/game/combat-resolver");
      const opponentPlayer = isPlayer1 ? "player2" : "player1";
      const resolution = await handleMoveRejection(matchId, currentRound.id, opponentPlayer);

      if (resolution.isMatchOver) {
        // Trigger payouts asynchronously (don't block response too long, or do block if critical)
        // We'll block to ensure it runs, but catch errors
        try {
          const { resolveMatchPayouts, resolveMatchStakePayout } = await import("@/lib/betting/payout-service");
          await resolveMatchPayouts(matchId);
          await resolveMatchStakePayout(matchId);
        } catch (e) {
          console.error("Failed to trigger payouts:", e);
        }
      }

      return NextResponse.json({
        moveId: move.id,
        roundId: currentRound.id,
        awaitingOpponent: false,
        opponentRejected: true,
        resolution: resolution.success ? {
          narrative: resolution.narrative,
          roundWinner: resolution.roundWinner,
          isMatchOver: resolution.isMatchOver,
          matchWinner: resolution.matchWinner,
        } : null,
      });
    }

    // If both players have submitted moves normally, trigger combat resolution
    let resolution = null;
    if (!finalAwaitingOpponent) {
      const { resolveRound } = await import("@/lib/game/combat-resolver");
      resolution = await resolveRound(matchId, currentRound.id);

      if (resolution.isMatchOver) {
        try {
          const { resolveMatchPayouts, resolveMatchStakePayout } = await import("@/lib/betting/payout-service");
          await resolveMatchPayouts(matchId);
          await resolveMatchStakePayout(matchId);
        } catch (e) {
          console.error("Failed to trigger payouts:", e);
        }
      }
    }

    return NextResponse.json({
      moveId: move.id,
      roundId: currentRound.id,
      awaitingOpponent: finalAwaitingOpponent,
      resolution: resolution?.success ? {
        narrative: resolution.narrative,
        roundWinner: resolution.roundWinner,
        isMatchOver: resolution.isMatchOver,
        matchWinner: resolution.matchWinner,
      } : null,
    });
  } catch (error) {
    console.error("Move submit error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Internal server error")
    );
  }
}
