/**
 * POST /api/matches/[matchId]/reject
 * Handle transaction rejection during a fight
 * Called when a player's wallet rejects the move transaction
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";

/**
 * Request body schema.
 */
interface RejectRequest {
    address: string;
}

/**
 * POST handler - Record transaction rejection
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
        const body: RejectRequest = await request.json();

        // Validate required fields
        if (!body.address) {
            return createErrorResponse(
                new ApiError(ErrorCodes.VALIDATION_ERROR, "Missing required field: address")
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
                    `Cannot reject: match is ${match.status}`
                )
            );
        }

        // Get current round, or create one if none exists
        let { data: currentRound, error: roundError } = await supabase
            .from("rounds")
            .select("*")
            .eq("match_id", matchId)
            .order("round_number", { ascending: false })
            .limit(1)
            .single();

        // If no round exists, create the first round
        if (roundError || !currentRound) {
            const { data: newRound, error: createError } = await supabase
                .from("rounds")
                .insert({
                    match_id: matchId,
                    round_number: 1,
                })
                .select()
                .single();

            if (createError || !newRound) {
                // Handle race condition - another request may have created it
                if (createError?.code === '23505') {
                    const { data: existingRound } = await supabase
                        .from("rounds")
                        .select("*")
                        .eq("match_id", matchId)
                        .eq("round_number", 1)
                        .single();
                    currentRound = existingRound;
                } else {
                    console.error("Failed to create round for rejection:", createError);
                    return createErrorResponse(
                        new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to create round")
                    );
                }
            } else {
                currentRound = newRound;
            }
        }

        if (!currentRound) {
            return createErrorResponse(
                new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to get or create round")
            );
        }

        const rejectingPlayer = isPlayer1 ? "player1" : "player2";
        const opponentPlayer = isPlayer1 ? "player2" : "player1";

        // Check if rejecting player already has a move or has already rejected
        const rejectColumn = isPlayer1 ? "player1_rejected" : "player2_rejected";
        const moveColumn = isPlayer1 ? "player1_move" : "player2_move";

        if (currentRound[moveColumn]) {
            return createErrorResponse(
                new ApiError(ErrorCodes.CONFLICT, "You already submitted a move")
            );
        }

        // Mark this player as having rejected
        await supabase
            .from("rounds")
            .update({ [rejectColumn]: true })
            .eq("id", currentRound.id);

        // Broadcast move_rejected event
        const gameChannel = supabase.channel(`game:${matchId}`);
        await gameChannel.send({
            type: "broadcast",
            event: "move_rejected",
            payload: {
                player: rejectingPlayer,
                rejectedAt: Date.now(),
            },
        });
        await supabase.removeChannel(gameChannel);

        // Refetch round to check opponent status
        const { data: updatedRound } = await supabase
            .from("rounds")
            .select("*")
            .eq("id", currentRound.id)
            .single();

        const opponentMoveColumn = isPlayer1 ? "player2_move" : "player1_move";
        const opponentRejectColumn = isPlayer1 ? "player2_rejected" : "player1_rejected";

        // Cast to any since the rejection columns may not be in TypeScript types yet
        // The columns are added via migration 005_add_rejection_tracking.sql
        const roundData = updatedRound as Record<string, unknown> | null;
        const opponentSubmitted = !!roundData?.[opponentMoveColumn];
        const opponentRejected = !!roundData?.[opponentRejectColumn];

        // Case 1: Opponent already SUBMITTED a move -> opponent wins (we forfeited)
        if (opponentSubmitted) {
            const { handleMoveRejection } = await import("@/lib/game/combat-resolver");
            const result = await handleMoveRejection(matchId, currentRound.id, rejectingPlayer);

            return NextResponse.json({
                status: "opponent_wins",
                message: "Opponent wins this round because you rejected the transaction",
                result,
            });
        }

        // Case 2: Opponent ALSO rejected -> cancel the match
        if (opponentRejected) {
            // Update match to cancelled status
            await supabase
                .from("matches")
                .update({
                    status: "cancelled",
                    completed_at: new Date().toISOString(),
                })
                .eq("id", matchId);

            // Broadcast match_cancelled event
            const cancelChannel = supabase.channel(`game:${matchId}`);
            await cancelChannel.send({
                type: "broadcast",
                event: "match_cancelled",
                payload: {
                    matchId,
                    reason: "both_rejected",
                    message: "Both players rejected transactions. Match cancelled.",
                    redirectTo: "/matchmaking",
                },
            });
            await supabase.removeChannel(cancelChannel);

            return NextResponse.json({
                status: "match_cancelled",
                message: "Both players rejected. Match cancelled.",
                redirectTo: "/matchmaking",
            });
        }

        // Case 3: We rejected first, opponent hasn't acted yet -> wait for opponent
        return NextResponse.json({
            status: "waiting",
            message: "Rejection recorded. Waiting for opponent to submit or reject.",
        });

    } catch (error) {
        console.error("Reject endpoint error:", error);
        return createErrorResponse(
            new ApiError(ErrorCodes.INTERNAL_ERROR, "Internal server error")
        );
    }
}
