/**
 * POST /api/matches/[matchId]/forfeit
 * Forfeit a match
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import { verifySignature } from "@/lib/api/middleware";
import { updateMatchRatings } from "@/lib/rating/elo";

/**
 * Request body schema.
 */
interface ForfeitRequest {
  address: string;
  signature: string;
  publicKey?: string;
}

/**
 * POST handler - Forfeit match
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
    const body: ForfeitRequest = await request.json();

    // Validate required fields
    if (!body.address || !body.signature) {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          "Missing required fields: address, signature"
        )
      );
    }

    // Verify signature
    const forfeitMessage = `Forfeit match: ${matchId}`;
    const isValid = await verifySignature(body.address, forfeitMessage, body.signature, body.publicKey);

    if (!isValid) {
      return createErrorResponse(
        new ApiError(ErrorCodes.UNAUTHORIZED, "Invalid signature")
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

    // Verify match is in valid state for forfeit
    if (match.status === "completed") {
      return createErrorResponse(
        new ApiError(ErrorCodes.CONFLICT, "Match is already completed")
      );
    }

    if (match.status === "waiting") {
      return createErrorResponse(
        new ApiError(ErrorCodes.CONFLICT, "Match has not started yet")
      );
    }

    // Determine winner (the player who did NOT forfeit)
    const winnerAddress = isPlayer1
      ? match.player2_address
      : match.player1_address;

    // Update match to completed with forfeit
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        status: "completed",
        winner_address: winnerAddress,
        completed_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (updateError) {
      console.error("Match update error:", updateError);
      return createErrorResponse(
        new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to forfeit match")
      );
    }

    // TODO: Update player stats when RPC functions are created
    // const forfeitingPlayer = body.address;
    // await supabase.rpc("increment_losses", { player_address: forfeitingPlayer });
    // if (winnerAddress) {
    //   await supabase.rpc("increment_wins", { player_address: winnerAddress });
    // }

    // Update player ratings (skip for private room matches)
    const loserAddress = body.address;
    const isPrivateRoom = !!match.room_code;
    let ratingResult = null;
    if (winnerAddress && loserAddress && !isPrivateRoom) {
      ratingResult = await updateMatchRatings(winnerAddress, loserAddress);
    } else if (isPrivateRoom) {
      console.log(`[Forfeit API] Skipping ELO update for private room match ${matchId}`);
    }

    // Broadcast match_ended event FIRST via Supabase Realtime REST API
    // so the opponent sees the result instantly before slow payout processing
    const gameChannel = supabase.channel(`game:${matchId}`);
    await gameChannel.send({
      type: "broadcast",
      event: "match_ended",
      payload: {
        matchId,
        winner: isPlayer1 ? "player2" : "player1",
        winnerAddress,
        finalScore: {
          player1RoundsWon: match.player1_rounds_won,
          player2RoundsWon: match.player2_rounds_won,
        },
        reason: "forfeit",
        stats: {
          totalRounds: match.player1_rounds_won + match.player2_rounds_won,
          player1TotalDamage: 0,
          player2TotalDamage: 0,
          player1MostUsedMove: "unknown",
          player2MostUsedMove: "unknown",
          matchDurationSeconds: 0,
        },
        ratingChanges: ratingResult ? {
          winner: {
            before: ratingResult.winner.ratingBefore,
            after: ratingResult.winner.ratingAfter,
            change: ratingResult.winner.change,
          },
          loser: {
            before: ratingResult.loser.ratingBefore,
            after: ratingResult.loser.ratingAfter,
            change: ratingResult.loser.change,
          },
        } : undefined,
        isPrivateRoom,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/match/${matchId}`,
        explorerUrl: "",
      },
    });
    await supabase.removeChannel(gameChannel);

    // Process betting payouts AFTER broadcast (fire-and-forget, don't block the response)
    // This runs after the response is prepared but we don't await it blocking the response
    const payoutPromise = (async () => {
      try {
        const { resolveMatchPayouts, resolveMatchStakePayout } = await import("@/lib/betting/payout-service");
        console.log(`[Forfeit API] Processing betting payouts for match ${matchId}`);
        await resolveMatchPayouts(matchId);
        await resolveMatchStakePayout(matchId);
        console.log(`[Forfeit API] Betting payouts processed successfully for match ${matchId}`);
      } catch (payoutError) {
        console.error(`[Forfeit API] Error processing betting payouts for match ${matchId}:`, payoutError);
      }
    })();
    // Don't await payoutPromise - let it run in the background
    // Edge runtime will keep the promise alive until it resolves
    void payoutPromise;

    // Return full match ended payload for client-side handling (especially bot matches)
    return NextResponse.json({
      winnerAddress,
      winner: isPlayer1 ? "player2" : "player1",
      reason: "forfeit",
      isPrivateRoom,
      finalScore: {
        player1RoundsWon: match.player1_rounds_won || 0,
        player2RoundsWon: match.player2_rounds_won || 0,
      },
      ratingChanges: ratingResult ? {
        winner: {
          before: ratingResult.winner.ratingBefore,
          after: ratingResult.winner.ratingAfter,
          change: ratingResult.winner.change,
        },
        loser: {
          before: ratingResult.loser.ratingBefore,
          after: ratingResult.loser.ratingAfter,
          change: ratingResult.loser.change,
        },
      } : undefined,
    });
  } catch (error) {
    console.error("Forfeit endpoint error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Internal server error")
    );
  }
}
