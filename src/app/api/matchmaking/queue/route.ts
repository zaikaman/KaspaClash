/**
 * Matchmaking Queue API Routes
 * Endpoints: POST /api/matchmaking/queue, DELETE /api/matchmaking/queue
 */

import { NextRequest, NextResponse } from "next/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import {
  addToQueue,
  removeFromQueue,
  isInQueue,
  attemptMatch,
  broadcastMatchFound,
  getQueueSize,
} from "@/lib/matchmaking/matchmaker";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Join queue request body.
 */
interface JoinQueueRequest {
  address: string;
}

/**
 * Join queue response.
 */
interface JoinQueueResponse {
  success: boolean;
  queueSize: number;
  matchId?: string;
}

/**
 * Validate Kaspa address format.
 */
function isValidKaspaAddress(address: string): boolean {
  return (
    typeof address === "string" &&
    (address.startsWith("kaspa:") || address.startsWith("kaspatest:")) &&
    address.length >= 40
  );
}

/**
 * POST /api/matchmaking/queue
 * Join the matchmaking queue.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<JoinQueueResponse | ApiErrorResponse>> {
  try {
    const body = (await request.json()) as JoinQueueRequest;
    const { address } = body;

    // Validate request
    if (!address) {
      throw Errors.badRequest("Address is required");
    }

    if (!isValidKaspaAddress(address)) {
      throw Errors.invalidAddress(address);
    }

    // Check if already in queue
    if (await isInQueue(address)) {
      return NextResponse.json({
        success: true,
        queueSize: await getQueueSize(),
      });
    }

    // Get player rating from database
    const supabase = await createSupabaseServerClient();
    const { data: player } = await supabase
      .from("players")
      .select("rating")
      .eq("address", address)
      .single();

    const rating = player?.rating ?? 1000; // Default rating for new players

    // Add to queue
    await addToQueue(address, rating);

    // Attempt immediate match
    const matchResult = await attemptMatch(address);

    if (matchResult) {
      // Broadcast match found to both players
      await broadcastMatchFound(
        matchResult.matchId,
        matchResult.player1Address,
        matchResult.player2Address
      );

      return NextResponse.json({
        success: true,
        queueSize: await getQueueSize(),
        matchId: matchResult.matchId,
      });
    }

    return NextResponse.json({
      success: true,
      queueSize: await getQueueSize(),
    });
  } catch (error) {
    const apiError = handleError(error);
    return createErrorResponse(apiError);
  }
}

/**
 * Leave queue request body.
 */
interface LeaveQueueRequest {
  address: string;
}

/**
 * Leave queue response.
 */
interface LeaveQueueResponse {
  success: boolean;
}

/**
 * DELETE /api/matchmaking/queue
 * Leave the matchmaking queue.
 */
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<LeaveQueueResponse | ApiErrorResponse>> {
  try {
    const body = (await request.json()) as LeaveQueueRequest;
    const { address } = body;

    // Validate request
    if (!address) {
      throw Errors.badRequest("Address is required");
    }

    if (!isValidKaspaAddress(address)) {
      throw Errors.invalidAddress(address);
    }

    // Remove from queue
    await removeFromQueue(address);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const apiError = handleError(error);
    return createErrorResponse(apiError);
  }
}

/**
 * GET /api/matchmaking/queue
 * Get queue status for a specific player.
 * Also checks for existing matches and attempts to find new ones.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<{ inQueue: boolean; queueSize: number; matchFound?: { matchId: string; player1Address: string; player2Address: string } }>> {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    const queueSize = await getQueueSize();

    // If no address provided, just return queue size
    if (!address) {
      return NextResponse.json({
        inQueue: false,
        queueSize,
      });
    }

    const supabase = await createSupabaseServerClient();

    // FIRST: Check if player has a pending/active match (they might have been matched by someone else)
    // Include character_select status as that's the initial match state
    const { data: pendingMatch } = await supabase
      .from("matches")
      .select("id, player1_address, player2_address, status")
      .or(`player1_address.eq.${address},player2_address.eq.${address}`)
      .in("status", ["waiting", "character_select", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (pendingMatch && pendingMatch.player2_address) {
      console.log("Found pending match for player:", address, pendingMatch);
      return NextResponse.json({
        inQueue: false,
        queueSize: await getQueueSize(),
        matchFound: {
          matchId: pendingMatch.id,
          player1Address: pendingMatch.player1_address,
          player2Address: pendingMatch.player2_address,
        },
      });
    }

    // SECOND: Check if another player has claimed us via matched_with
    const { data: queueEntry } = await supabase
      .from("matchmaking_queue")
      .select("status, matched_with")
      .eq("address", address)
      .single();

    const shortAddr = address.slice(-8);
    console.log(`[MATCHMAKING-GET] ${shortAddr}: Queue entry status = ${queueEntry?.status || 'not found'}, matched_with = ${queueEntry?.matched_with?.slice(-8) || 'null'}`);

    // If we've been claimed by someone else (status = 'matched' and matched_with is set)
    // Wait for them to create the match, then we'll find it
    if (queueEntry?.status === "matched" && queueEntry?.matched_with) {
      console.log(`[MATCHMAKING-GET] ${shortAddr}: We were claimed by ${queueEntry.matched_with.slice(-8)}, checking for created match...`);

      // Check if the match was already created by the other player
      const { data: matchFromOther } = await supabase
        .from("matches")
        .select("id, player1_address, player2_address")
        .or(`player1_address.eq.${address},player2_address.eq.${address}`)
        .in("status", ["character_select", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (matchFromOther && matchFromOther.player2_address) {
        console.log(`[MATCHMAKING-GET] ${shortAddr}: ✓ Found match created by other player: ${matchFromOther.id}`);
        return NextResponse.json({
          inQueue: false,
          queueSize: await getQueueSize(),
          matchFound: {
            matchId: matchFromOther.id,
            player1Address: matchFromOther.player1_address,
            player2Address: matchFromOther.player2_address,
          },
        });
      }

      // Match not created yet - wait for the other player to finish
      console.log(`[MATCHMAKING-GET] ${shortAddr}: Match not created yet, waiting...`);
      return NextResponse.json({
        inQueue: true,
        queueSize: await getQueueSize(),
      });
    }

    // Check if player is in queue with searching status
    if (!queueEntry || queueEntry.status !== "searching") {
      console.log(`[MATCHMAKING-GET] ${shortAddr}: Not in queue or not searching (status=${queueEntry?.status || 'none'})`);
      return NextResponse.json({
        inQueue: !!queueEntry,
        queueSize,
      });
    }

    // Try to find a match for this player
    console.log(`[MATCHMAKING-GET] ${shortAddr}: Attempting to find match...`);
    const matchResult = await attemptMatch(address);

    if (matchResult) {
      console.log(`[MATCHMAKING-GET] ${shortAddr}: ✓ Match found! ${matchResult.matchId}`);
      // Broadcast match found to both players
      await broadcastMatchFound(
        matchResult.matchId,
        matchResult.player1Address,
        matchResult.player2Address
      );

      return NextResponse.json({
        inQueue: false, // No longer in queue after match
        queueSize: await getQueueSize(),
        matchFound: {
          matchId: matchResult.matchId,
          player1Address: matchResult.player1Address,
          player2Address: matchResult.player2Address,
        },
      });
    }

    console.log(`[MATCHMAKING-GET] ${shortAddr}: No match found this poll`);
    return NextResponse.json({
      inQueue: true,
      queueSize,
    });
  } catch (error) {
    console.error("Queue status error:", error);
    return NextResponse.json({
      inQueue: false,
      queueSize: 0,
    });
  }
}
