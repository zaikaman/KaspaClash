/**
 * POST /api/matches/[matchId]/move-timeout
 * Server-side enforcement of move deadline
 * Called when client timer expires or as periodic fallback
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import { updateMatchRatings } from "@/lib/rating/elo";

/**
 * Extended round type with deadline tracking.
 */
interface RoundWithDeadline {
    id: string;
    match_id: string;
    round_number: number;
    player1_move: string | null;
    player2_move: string | null;
    player1_rejected: boolean;
    player2_rejected: boolean;
    player1_health_after: number | null;
    player2_health_after: number | null;
    winner_address: string | null;
    move_deadline_at: string | null;
}

/**
 * Request body schema.
 */
interface MoveTimeoutRequest {
    address: string;
}

/**
 * POST handler - Check and enforce move deadline
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
        const body: MoveTimeoutRequest = await request.json();

        if (!body.address) {
            return createErrorResponse(
                new ApiError(ErrorCodes.VALIDATION_ERROR, "Player address is required")
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
        const isPlayer1 = match.player1_address === body.address;
        const isPlayer2 = match.player2_address === body.address;

        if (!isPlayer1 && !isPlayer2) {
            return createErrorResponse(
                new ApiError(ErrorCodes.FORBIDDEN, "Player not in this match")
            );
        }

        // Check match status
        if (match.status !== "in_progress") {
            return NextResponse.json({
                success: true,
                data: {
                    result: "no_action",
                    reason: `Match is ${match.status}`,
                },
            });
        }

        // Get current ACTIVE round (no winner yet)
        const { data: currentRound, error: roundError } = await supabase
            .from("rounds")
            .select("*")
            .eq("match_id", matchId)
            .is("winner_address", null)
            .order("round_number", { ascending: false })
            .limit(1)
            .single();

        console.log(`[MoveTimeout] *** Fetched latest ACTIVE round from DB - round_number: ${currentRound?.round_number}, error: ${roundError?.message}`);

        if (roundError || !currentRound) {
            console.log(`[MoveTimeout] *** No active round found`);
            return NextResponse.json({
                success: true,
                data: {
                    result: "no_action",
                    reason: "No active round",
                },
            });
        }

        const round = currentRound as unknown as RoundWithDeadline;

        console.log(`[MoveTimeout] *** Checking round ${round.round_number} for match ${matchId}`);
        console.log(`[MoveTimeout] *** player1_move: ${round.player1_move}, player2_move: ${round.player2_move}, winner_address: ${round.winner_address}`);
        console.log(`[MoveTimeout] *** Has both moves: ${!!(round.player1_move && round.player2_move)}, Has winner: ${!!round.winner_address}`);

        // If round already has both moves or a winner, no action needed
        if ((round.player1_move && round.player2_move) || round.winner_address) {
            const reason = round.winner_address 
                ? `Round already has winner: ${round.winner_address}`
                : `Round already has both moves (p1: ${round.player1_move}, p2: ${round.player2_move})`;
            console.log(`[MoveTimeout] *** Round already resolved - ${reason}`);
            return NextResponse.json({
                success: true,
                data: {
                    result: "no_action",
                    reason: "Round already resolved",
                },
            });
        }

        // Check if deadline has passed
        const now = Date.now();
        const deadline = round.move_deadline_at
            ? new Date(round.move_deadline_at).getTime()
            : null;

        if (!deadline || now < deadline) {
            return NextResponse.json({
                success: true,
                data: {
                    result: "no_action",
                    reason: deadline
                        ? `Deadline not yet reached (${Math.ceil((deadline - now) / 1000)}s remaining)`
                        : "No deadline set for this round",
                },
            });
        }

        // Deadline has passed - determine consequence
        const p1HasMove = !!round.player1_move;
        const p2HasMove = !!round.player2_move;

        console.log(`[MoveTimeout] Match ${matchId}, Round ${round.round_number}`);
        console.log(`[MoveTimeout] Deadline: ${deadline}, Now: ${now}, Passed by: ${Math.floor((now - deadline) / 1000)}s`);
        console.log(`[MoveTimeout] P1 has move: ${p1HasMove} (${round.player1_move}), P2 has move: ${p2HasMove} (${round.player2_move})`);
        console.log(`[MoveTimeout] Request from address: ${body.address}`);

        // CASE 1: Neither player submitted - cancel match and refund
        if (!p1HasMove && !p2HasMove) {
            console.log(`[MoveTimeout] *** CASE 1: Neither player submitted - cancelling match and refunding`);
            await supabase
                .from("matches")
                .update({
                    status: "cancelled",
                    completed_at: new Date().toISOString(),
                })
                .eq("id", matchId);

            // Refund stakes and bets - WAIT for completion
            const [stakesResult, betsResult] = await Promise.all([
                import("@/lib/betting/payout-service").then(async ({ refundMatchStakes }) => {
                    try {
                        const result = await refundMatchStakes(matchId);
                        console.log(`[MoveTimeout] Stakes refund result:`, result);
                        return result;
                    } catch (err) {
                        console.error(`[MoveTimeout] Error refunding stakes for ${matchId}:`, err);
                        return { success: false, refundedCount: 0, errors: [String(err)] };
                    }
                }),
                import("@/lib/betting/payout-service").then(async ({ refundBettingPool }) => {
                    try {
                        const result = await refundBettingPool(matchId);
                        console.log(`[MoveTimeout] Betting pool refund result:`, result);
                        return result;
                    } catch (err) {
                        console.error(`[MoveTimeout] Error refunding betting pool for ${matchId}:`, err);
                        return { success: false, refundedCount: 0, errors: [String(err)] };
                    }
                }),
            ]);

            const totalRefunded = stakesResult.refundedCount + betsResult.refundedCount;
            const refundErrors = [...stakesResult.errors, ...betsResult.errors];

            console.log(`[MoveTimeout] Total refunds: ${totalRefunded}, Errors: ${refundErrors.length}`);

            // Broadcast match_cancelled with refund details
            const gameChannel = supabase.channel(`game:${matchId}`);
            await gameChannel.send({
                type: "broadcast",
                event: "match_cancelled",
                payload: {
                    matchId,
                    reason: "both_timeout",
                    message: "Both players failed to submit moves. Refunds processed.",
                    cancelledAt: Date.now(),
                    refundsProcessed: true,
                    refundStats: {
                        totalRefunded,
                        stakesRefunded: stakesResult.refundedCount,
                        betsRefunded: betsResult.refundedCount,
                        errors: refundErrors,
                    },
                    redirectTo: "/matchmaking",
                },
            });
            await supabase.removeChannel(gameChannel);

            return NextResponse.json({
                success: true,
                data: {
                    result: "match_cancelled",
                    reason: "Both players timed out",
                    redirectTo: "/matchmaking",
                },
            });
        }

        // CASE 2: One player submitted, other didn't - submitter wins round
        const winnerRole = p1HasMove ? "player1" : "player2";
        const loserRole = p1HasMove ? "player2" : "player1";
        const winnerAddress = p1HasMove ? match.player1_address : match.player2_address;
        const loserAddress = p1HasMove ? match.player2_address : match.player1_address;

        console.log(`[MoveTimeout] *** CASE 2: ${loserRole} timed out, ${winnerRole} wins round`);

        // Use handleMoveRejection to process the round win (treats timeout like rejection)
        const { handleMoveRejection } = await import("@/lib/game/combat-resolver");
        console.log(`[MoveTimeout] *** Calling handleMoveRejection for match ${matchId}, round ${round.id}, rejecting player: ${loserRole}`);
        const result = await handleMoveRejection(matchId, round.id, loserRole as "player1" | "player2");

        // If match is over, update ratings
        if (result.isMatchOver && result.matchWinner) {
            const matchWinnerAddress = result.matchWinner === "player1"
                ? match.player1_address
                : match.player2_address;
            const matchLoserAddress = result.matchWinner === "player1"
                ? match.player2_address
                : match.player1_address;

            if (matchWinnerAddress && matchLoserAddress) {
                await updateMatchRatings(matchWinnerAddress, matchLoserAddress);
            }

            // Trigger payouts
            try {
                const { resolveMatchPayouts } = await import("@/lib/betting/payout-service");
                await resolveMatchPayouts(matchId);
            } catch (e) {
                console.error("[MoveTimeout] Failed to trigger payouts:", e);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                result: "round_forfeited",
                roundWinner: winnerRole,
                winnerAddress,
                loserAddress,
                narrative: result.narrative,
                isMatchOver: result.isMatchOver,
                matchWinner: result.matchWinner,
            },
        });
    } catch (error) {
        console.error("[MoveTimeout] Error:", error);
        return createErrorResponse(
            new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to process move timeout")
        );
    }
}
