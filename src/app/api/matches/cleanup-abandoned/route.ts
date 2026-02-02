/**
 * POST /api/matches/cleanup-abandoned
 * Check for and complete abandoned bot matches where player has been disconnected for 30+ seconds
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateMatchRatings } from "@/lib/rating/elo";

interface AbandonedMatchCleanupRequest {
  address: string;
}

interface MatchWithDisconnect {
  id: string;
  player1_address: string;
  player2_address: string | null;
  player1_character_id: string | null;
  player2_character_id: string | null;
  status: string;
  is_bot: boolean | null;
  player1_rounds_won: number;
  player2_rounds_won: number;
  player1_disconnected_at: string | null;
  player2_disconnected_at: string | null;
  disconnect_timeout_seconds: number | null;
  room_code: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: AbandonedMatchCleanupRequest = await request.json();

    if (!body.address) {
      return NextResponse.json(
        { success: false, error: "Player address is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const now = Date.now();
    const DISCONNECT_TIMEOUT_MS = 30 * 1000; // 30 seconds

    // Find all in-progress bot matches where this player is disconnected
    const { data: matchesData, error } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "in_progress")
      .eq("is_bot", true)
      .or(`player1_address.eq.${body.address},player2_address.eq.${body.address}`);

    if (error) {
      console.error("[Cleanup] Error fetching matches:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch matches" },
        { status: 500 }
      );
    }

    const matches = matchesData as unknown as MatchWithDisconnect[] | null;

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        success: true,
        completedMatches: [],
        message: "No abandoned bot matches found",
      });
    }

    const completedMatches: string[] = [];

    // Check each match to see if player has been disconnected for 30+ seconds
    for (const match of matches) {
      const isPlayer1 = match.player1_address === body.address;
      const disconnectedAt = isPlayer1
        ? match.player1_disconnected_at
        : match.player2_disconnected_at;

      // Skip if player is not disconnected
      if (!disconnectedAt) continue;

      const disconnectedDuration = now - new Date(disconnectedAt).getTime();

      // Skip if not timed out yet
      if (disconnectedDuration < DISCONNECT_TIMEOUT_MS) continue;

      console.log(
        `[Cleanup] Auto-completing bot match ${match.id} - player ${body.address} was disconnected for ${Math.floor(disconnectedDuration / 1000)}s`
      );

      // Determine winner (the bot)
      const botAddress = isPlayer1 ? match.player2_address : match.player1_address;
      const botRole = isPlayer1 ? "player2" : "player1";

      // Update match as completed
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          status: "completed",
          winner_address: botAddress,
          completed_at: new Date().toISOString(),
          player1_disconnected_at: null,
          player2_disconnected_at: null,
        })
        .eq("id", match.id);

      if (updateError) {
        console.error(`[Cleanup] Failed to complete match ${match.id}:`, updateError);
        continue;
      }

      // Update ELO ratings (skip for private room matches)
      const isPrivateRoom = !!match.room_code;
      let ratingResult = null;
      if (botAddress && !isPrivateRoom) {
        try {
          ratingResult = await updateMatchRatings(botAddress, body.address);
          console.log(`[Cleanup] Ratings updated for match ${match.id}:`, ratingResult);
        } catch (error) {
          console.error(`[Cleanup] Failed to update ratings for match ${match.id}:`, error);
        }
      } else if (isPrivateRoom) {
        console.log(`[Cleanup] Skipping ELO update for private room match ${match.id}`);
      }

      // Broadcast match_ended event
      const gameChannel = supabase.channel(`game:${match.id}`);
      await gameChannel.send({
        type: "broadcast",
        event: "match_ended",
        payload: {
          matchId: match.id,
          winner: botRole,
          winnerAddress: botAddress,
          reason: "opponent_disconnected",
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
        },
      });
      await supabase.removeChannel(gameChannel);

      completedMatches.push(match.id);
    }

    return NextResponse.json({
      success: true,
      completedMatches,
      message: completedMatches.length > 0
        ? `Completed ${completedMatches.length} abandoned bot match(es)`
        : "No abandoned bot matches found",
    });
  } catch (error) {
    console.error("[Cleanup] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
