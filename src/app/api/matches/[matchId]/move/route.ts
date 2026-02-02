import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import { withWalletAuth } from "@/lib/api/auth-middleware";
import { submitMoveSchema, validateBody } from "@/lib/api/validators";

/**
 * POST handler - Submit move
 */
export const POST = withWalletAuth(async (
  request: NextRequest,
  { params }: { params: Promise<any> }
): Promise<NextResponse<any>> => {
  const apiStartTime = Date.now();
  
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
    const body = await request.json();
    console.log(`[Move API] ⚡ Request parsed in ${Date.now() - apiStartTime}ms`);

    // Validate request using Zod
    const validation = validateBody(body, submitMoveSchema);
    if (!validation.success) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, validation.error)
      );
    }

    const { address, moveType, txId } = validation.data;

    const dbStartTime = Date.now();
    const supabase = await createSupabaseServerClient();

    // Fetch the match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single() as { data: any; error: any };
    
    console.log(`[Move API] ⚡ Match fetch in ${Date.now() - dbStartTime}ms`);

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
    let { data: updatedRound } = await supabase
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

    // Update fight state snapshot with move submission
    try {
      const { updateMoveSubmission } = await import("@/lib/game/fight-state-service");
      await updateMoveSubmission(
        supabase,
        matchId,
        isPlayer1 ? "player1" : "player2",
        true
      );
    } catch (fightStateError) {
      console.error("[Move Submit] Failed to update fight state:", fightStateError);
      // Don't throw - fight state is supplementary
    }

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
    const isOpponentBot = match.is_bot || false;

    if (isOpponentBot && opponentAddress && awaitingOpponent) {
      console.log(`[Move Submit] Bot opponent detected, auto-submitting move for ${opponentAddress}`);
      console.log(`[Move Submit] Current round ID: ${currentRound.id}, round_number: ${currentRound.round_number}`);
      console.log(`[Move Submit] Current round state before bot: P1=${currentRound.player1_move}, P2=${currentRound.player2_move}`);

      // Get bot's smart move
      const { SmartBotOpponent } = await import("@/lib/game/smart-bot-opponent");
      const { CombatEngine } = await import("@/game/combat");

      // Create a combat engine and replay previous rounds to get accurate state
      const engine = new CombatEngine(
        match.player1_character_id || "dag-warrior",
        match.player2_character_id || "dag-warrior",
        match.format as "best_of_1" | "best_of_3" | "best_of_5"
      );

      // Fetch Power Surge cards for all rounds to apply their effects
      const { data: powerSurges } = await supabase
        .from("power_surges")
        .select("*")
        .eq("match_id", matchId);

      // Map surges by round number for quick lookup
      const surgeMap = new Map<number, { player1_card_id: string | null; player2_card_id: string | null }>();
      powerSurges?.forEach((ps: { round_number: number; player1_card_id: string | null; player2_card_id: string | null }) => {
        surgeMap.set(ps.round_number, ps);
      });

      // Fetch all previous resolved rounds to rebuild state (CRITICAL for accurate energy tracking)
      const { data: previousRounds } = await supabase
        .from("rounds")
        .select("*")
        .eq("match_id", matchId)
        .lt("round_number", currentRound.round_number)
        .order("round_number", { ascending: true });

      // Replay previous rounds to get current health/energy state
      const validMoves = ["punch", "kick", "block", "special"];
      if (previousRounds) {
        for (const prevRound of previousRounds) {
          const p1Move = prevRound.player1_move;
          const p2Move = prevRound.player2_move;
          if (p1Move && p2Move && validMoves.includes(p1Move) && validMoves.includes(p2Move)) {
            const combatRound = engine.getState().currentRound;
            const surge = surgeMap.get(combatRound);

            engine.resolveTurn(
              p1Move as "punch" | "kick" | "block" | "special",
              p2Move as "punch" | "kick" | "block" | "special",
              (surge?.player1_card_id || null) as any,
              (surge?.player2_card_id || null) as any
            );

            // If a round ended, start new round
            const prevState = engine.getState();
            if (prevState.isRoundOver && !prevState.isMatchOver) {
              engine.startNewRound();
            }
          }
        }
      }

      // Now matchState has accurate HP/energy/guard values
      const matchState = engine.getState();
      console.log(`[Move Submit] Bot state after replay - Energy: ${matchState.player2.energy}, HP: ${matchState.player2.hp}`);

      // Check if bot is stunned by the current round's Power Surge (Mempool Congest)
      // This is critical: the stun effect is applied at turn 1, so we need to check BEFORE deciding a move
      const currentCombatRound = matchState.currentRound;
      const currentSurge = surgeMap.get(currentCombatRound);
      const humanPlayerSurgeCardId = isPlayer1 ? currentSurge?.player1_card_id : currentSurge?.player2_card_id;
      
      // Import surge effect utilities to check for stun
      const { calculateSurgeEffects, shouldStunOpponent } = await import("@/game/combat/SurgeEffects");
      
      // Check if human player's surge card has opponent_stun effect (which would stun the bot)
      let botIsStunnedBySurge = false;
      if (humanPlayerSurgeCardId && matchState.currentTurn === 1) {
        const surgeResults = calculateSurgeEffects(
          isPlayer1 ? humanPlayerSurgeCardId as any : null,
          isPlayer1 ? null : humanPlayerSurgeCardId as any
        );
        const humanPlayerMods = isPlayer1 ? surgeResults.player1Modifiers : surgeResults.player2Modifiers;
        botIsStunnedBySurge = shouldStunOpponent(humanPlayerMods);
        if (botIsStunnedBySurge) {
          console.log(`[Move Submit] Bot is stunned by opponent's Power Surge (${humanPlayerSurgeCardId}) - skipping move decision`);
        }
      }

      // Extract bot name from player profile or use default
      const { data: botProfile } = await supabase
        .from("players")
        .select("display_name")
        .eq("address", opponentAddress)
        .single();
      const botName = botProfile?.display_name || "Bot Opponent";
      const bot = new SmartBotOpponent(botName);

      // Update bot context with current match state (now accurate after replay)
      // Include the surge-based stun state so the bot knows it's stunned
      const botPlayer = isPlayer1 ? "player2" : "player1";
      const humanPlayer = isPlayer1 ? "player1" : "player2";
      bot.updateContext({
        botHealth: matchState[botPlayer].hp,
        botMaxHealth: matchState[botPlayer].maxHp,
        botEnergy: matchState[botPlayer].energy,
        botMaxEnergy: matchState[botPlayer].maxEnergy,
        botGuardMeter: matchState[botPlayer].guardMeter,
        botIsStunned: matchState[botPlayer].isStunned || botIsStunnedBySurge,
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

      // If bot is stunned by surge, use placeholder move instead of making a decision
      // The combat engine will still treat this as stunned (null effective move)
      const botMove = botIsStunnedBySurge ? "block" : bot.decide().move;
      const moveReason = botIsStunnedBySurge ? "STUNNED by Mempool Congest" : bot.decide().reasoning;

      console.log(`[Move Submit] Bot chose move: ${botMove} (${moveReason})`);

      // Submit bot's move (use special tx_id to indicate stunned if applicable)
      const botTxId = botIsStunnedBySurge 
        ? "stunned-skip"
        : `bot_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`.padEnd(64, '0').substring(0, 64);

      const botMoveColumn = isPlayer1 ? "player2_move" : "player1_move";

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

      if (botMoveError) {
        console.error("[Move Submit] Failed to insert bot move:", botMoveError);
      }

      if (!botMoveError && botMoveData) {
        // Only update the move column (rounds table doesn't have tx_id columns)
        const { error: botRoundUpdateError } = await supabase
          .from("rounds")
          .update({
            [botMoveColumn]: botMove,
          })
          .eq("id", currentRound.id);

        if (botRoundUpdateError) {
          console.error("[Move Submit] Failed to update round with bot move:", botRoundUpdateError);
        } else {
          console.log(`[Move Submit] Bot move successfully saved to database - Round ${currentRound.id}, Move: ${botMove}`);
        }

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
        // Update the updatedRound variable with bot's move (updatedRound already has player's move from DB)
        if (updatedRound) {
          updatedRound = {
            ...updatedRound,
            [botMoveColumn]: botMove,
          };
          console.log(`[Move Submit] Bot move submitted. Both moves now ready - P1: ${updatedRound.player1_move}, P2: ${updatedRound.player2_move}`);
        }
      }
    }

    // Re-check if we're still awaiting opponent after bot auto-submit
    // Use updatedRound since it has the latest state from database
    const finalAwaitingOpponent = !(updatedRound?.player1_move && updatedRound?.player2_move);
    console.log(`[Move Submit] Final check - awaiting opponent: ${finalAwaitingOpponent}, will resolve: ${!finalAwaitingOpponent}`);

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
      const resolveStartTime = Date.now();
      console.log(`[Move API] ⚡ Triggering combat resolution for match ${matchId}`);

      const { resolveRound } = await import("@/lib/game/combat-resolver");
      resolution = await resolveRound(matchId, currentRound.id);

      console.log(`[Move API] ⚡ Combat resolution complete in ${Date.now() - resolveStartTime}ms`);

      if (resolution.isMatchOver) {
        // Fire-and-forget payouts to avoid blocking response
        (async () => {
          try {
            const { resolveMatchPayouts, resolveMatchStakePayout } = await import("@/lib/betting/payout-service");
            await resolveMatchPayouts(matchId);
            await resolveMatchStakePayout(matchId);
          } catch (e) {
            console.error("Failed to trigger payouts:", e);
          }
        })();
      }
    } else {
      console.log(`[Move API] Awaiting opponent move`);
    }

    console.log(`[Move API] ⚡ TOTAL API time: ${Date.now() - apiStartTime}ms`);

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
});
