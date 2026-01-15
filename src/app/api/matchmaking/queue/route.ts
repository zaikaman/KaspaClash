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

    // If we didn't find a match (e.g., we're the "waiter" due to tie-breaker),
    // trigger match attempts for OTHER players in the queue.
    // This ensures the "initiator" player gets a chance to claim us immediately.
    if (!matchResult) {
      console.log(`[MATCHMAKING-POST] ${address.slice(-8)}: No match found, triggering cycle for other players`);

      // Get all other searching players and try to match them
      const { data: otherPlayers } = await supabase
        .from("matchmaking_queue")
        .select("address")
        .eq("status", "searching")
        .neq("address", address)
        .limit(5);

      if (otherPlayers && otherPlayers.length > 0) {
        for (const otherPlayer of otherPlayers) {
          const otherResult = await attemptMatch(otherPlayer.address);
          if (otherResult) {
            // A match was found by another player - broadcast it
            await broadcastMatchFound(
              otherResult.matchId,
              otherResult.player1Address,
              otherResult.player2Address,
              otherResult.selectionDeadlineAt
            );

            // If the match involves us, return it
            if (otherResult.player1Address === address || otherResult.player2Address === address) {
              return NextResponse.json({
                success: true,
                queueSize: await getQueueSize(),
                matchId: otherResult.matchId,
              });
            }
            break; // One match per cycle is enough
          }
        }
      }
    }

    if (matchResult) {
      // Broadcast match found to both players
      await broadcastMatchFound(
        matchResult.matchId,
        matchResult.player1Address,
        matchResult.player2Address,
        matchResult.selectionDeadlineAt
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
): Promise<NextResponse<{ inQueue: boolean; queueSize: number; matchPending?: boolean; matchFound?: { matchId: string; player1Address: string; player2Address: string; selectionDeadlineAt?: string } }>> {
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
      .select("id, player1_address, player2_address, status, selection_deadline_at, created_at")
      .or(`player1_address.eq.${address},player2_address.eq.${address}`)
      .in("status", ["waiting", "character_select"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (pendingMatch && pendingMatch.player2_address) {
      // Check if the match is stale and should be cleaned up
      const now = new Date();
      let isStale = false;
      let staleReason = "";

      // Check 1: character_select deadline has passed
      if (pendingMatch.status === "character_select" && pendingMatch.selection_deadline_at) {
        const deadline = new Date(pendingMatch.selection_deadline_at);
        // Add 30 second grace period after deadline
        if (now.getTime() > deadline.getTime() + 30000) {
          isStale = true;
          staleReason = "selection_deadline_passed";
        }
      }

      // Check 2: Match has been in any active state for too long (30 minutes max match duration)
      if (!isStale && pendingMatch.created_at) {
        const createdAt = new Date(pendingMatch.created_at);
        const matchAgeMs = now.getTime() - createdAt.getTime();
        const maxMatchDurationMs = 30 * 60 * 1000; // 30 minutes
        if (matchAgeMs > maxMatchDurationMs) {
          isStale = true;
          staleReason = "match_timeout";
        }
      }

      // If match is stale, mark it as abandoned and allow new matchmaking
      if (isStale) {
        console.log(`[MATCHMAKING-GET] Cleaning up stale match ${pendingMatch.id} (reason: ${staleReason})`);

        await supabase
          .from("matches")
          .update({
            status: "abandoned",
            completed_at: now.toISOString(),
          })
          .eq("id", pendingMatch.id);

        // Don't return the stale match - continue with normal queue logic
      } else {
        console.log("Found pending match for player:", address, pendingMatch);
        return NextResponse.json({
          inQueue: false,
          queueSize: await getQueueSize(),
          matchFound: {
            matchId: pendingMatch.id,
            player1Address: pendingMatch.player1_address,
            player2Address: pendingMatch.player2_address,
            selectionDeadlineAt: pendingMatch.selection_deadline_at ?? undefined,
          },
        });
      }
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
    // Aggressively poll for the created match with retries
    if (queueEntry?.status === "matched" && queueEntry?.matched_with) {
      console.log(`[MATCHMAKING-GET] ${shortAddr}: We were claimed by ${queueEntry.matched_with.slice(-8)}, checking for created match...`);

      // Try up to 3 times with small delays to find the match
      for (let retry = 0; retry < 3; retry++) {
        // Check if the match was already created by the other player
        const { data: matchFromOther } = await supabase
          .from("matches")
          .select("id, player1_address, player2_address, selection_deadline_at")
          .or(`player1_address.eq.${address},player2_address.eq.${address}`)
          .in("status", ["character_select"])
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
              selectionDeadlineAt: matchFromOther.selection_deadline_at ?? undefined,
            },
          });
        }

        // If not found and not last retry, wait a bit
        if (retry < 2) {
          console.log(`[MATCHMAKING-GET] ${shortAddr}: Match not found (attempt ${retry + 1}/3), waiting 200ms...`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Check for stale matched status (older than 10 seconds without match created)
      const { data: queueEntryWithTime } = await supabase
        .from("matchmaking_queue")
        .select("joined_at")
        .eq("address", address)
        .single();

      if (queueEntryWithTime) {
        const joinedAt = new Date(queueEntryWithTime.joined_at).getTime();
        const staleDuration = Date.now() - joinedAt;

        // If we've been in queue for over 15 seconds with 'matched' status but no match created,
        // something went wrong - reset to searching
        if (staleDuration > 15000) {
          console.log(`[MATCHMAKING-GET] ${shortAddr}: Stale matched status detected (${Math.round(staleDuration / 1000)}s), resetting to searching`);
          await supabase
            .from("matchmaking_queue")
            .update({ status: "searching", matched_with: null })
            .eq("address", address);

          return NextResponse.json({
            inQueue: true,
            queueSize: await getQueueSize(),
          });
        }
      }

      // Match not created yet - tell client we're pending match creation
      console.log(`[MATCHMAKING-GET] ${shortAddr}: Match not created yet, waiting for initiator...`);
      return NextResponse.json({
        inQueue: true,
        queueSize: await getQueueSize(),
        matchPending: true, // Signal to client to show "matching" state
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
        matchResult.player2Address,
        matchResult.selectionDeadlineAt
      );

      return NextResponse.json({
        inQueue: false, // No longer in queue after match
        queueSize: await getQueueSize(),
        matchFound: {
          matchId: matchResult.matchId,
          player1Address: matchResult.player1Address,
          player2Address: matchResult.player2Address,
          selectionDeadlineAt: matchResult.selectionDeadlineAt,
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
