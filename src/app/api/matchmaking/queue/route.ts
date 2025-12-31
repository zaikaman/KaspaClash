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
    if (isInQueue(address)) {
      return NextResponse.json({
        success: true,
        queueSize: getQueueSize(),
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
        queueSize: getQueueSize(),
        matchId: matchResult.matchId,
      });
    }

    return NextResponse.json({
      success: true,
      queueSize: getQueueSize(),
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
 * Get queue status (for debugging/admin).
 */
export async function GET(): Promise<NextResponse<{ queueSize: number }>> {
  return NextResponse.json({
    queueSize: getQueueSize(),
  });
}
