/**
 * POST /api/matches/[matchId]/submit-stunned-move
 * 
 * Called when a player is stunned and cannot make a choice.
 * Automatically submits "stunned" for the stunned player WITHOUT requiring a transaction.
 * The opponent still needs to submit their move normally.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateSurgeEffects, shouldStunOpponent } from "@/game/combat/SurgeEffects";
import type { PowerSurgeCardId } from "@/types/power-surge";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ matchId: string }> }
) {
    try {
        const { matchId } = await params;
        const body = await request.json();
        const { playerRole } = body;

        console.log(`[SubmitStunnedMove] Called for match ${matchId} by ${playerRole}`);

        if (playerRole !== "player1" && playerRole !== "player2") {
            return NextResponse.json({ 
                success: false, 
                error: "Invalid playerRole" 
            }, { status: 400 });
        }

        const supabase = await createSupabaseServerClient();

        // Fetch match
        const { data: match, error: matchError } = await supabase
            .from("matches")
            .select("*")
            .eq("id", matchId)
            .single() as { data: any; error: any };

        if (matchError || !match) {
            console.error("[SubmitStunnedMove] Match not found:", matchError);
            return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
        }

        // Verify match is in progress
        if (match.status !== "in_progress") {
            return NextResponse.json({ 
                success: false, 
                error: `Match is ${match.status}` 
            }, { status: 400 });
        }

        // Get current round
        const { data: currentRound, error: roundError } = await supabase
            .from("rounds")
            .select("*")
            .eq("match_id", matchId)
            .order("round_number", { ascending: false })
            .limit(1)
            .single();

        if (roundError || !currentRound) {
            console.error("[SubmitStunnedMove] Round not found:", roundError);
            return NextResponse.json({ success: false, error: "Round not found" }, { status: 404 });
        }

        // Check if this player has already submitted
        const moveColumn = playerRole === "player1" ? "player1_move" : "player2_move";
        if (currentRound[moveColumn]) {
            console.log("[SubmitStunnedMove] Player already submitted move");
            return NextResponse.json({ success: true, action: "already_submitted" });
        }

        // Get the MOST RECENT Power Surge selection for this match
        // Note: The rounds table uses "turn numbers" (1,2,3,4,5...) but power_surges uses "game round" (1,2,3)
        // So we need to get the latest power_surges entry, not query by round_number
        const { data: surgeData, error: surgeError } = await supabase
            .from("power_surges")
            .select("*")
            .eq("match_id", matchId)
            .order("round_number", { ascending: false })
            .limit(1)
            .single();

        if (surgeError && surgeError.code !== "PGRST116") {
            console.error("[SubmitStunnedMove] Error fetching power surge data:", surgeError);
        }

        // Verify that this player is actually stunned
        const player1Surge = surgeData?.player1_card_id as PowerSurgeCardId | null;
        const player2Surge = surgeData?.player2_card_id as PowerSurgeCardId | null;

        const surgeResults = calculateSurgeEffects(player1Surge, player2Surge);
        const player1StunnsPlayer2 = shouldStunOpponent(surgeResults.player1Modifiers);
        const player2StunnsPlayer1 = shouldStunOpponent(surgeResults.player2Modifiers);

        const isPlayer1Stunned = player2StunnsPlayer1;
        const isPlayer2Stunned = player1StunnsPlayer2;

        const isThisPlayerStunned = playerRole === "player1" ? isPlayer1Stunned : isPlayer2Stunned;

        if (!isThisPlayerStunned) {
            console.warn("[SubmitStunnedMove] Player is not stunned:", {
                playerRole,
                isPlayer1Stunned,
                isPlayer2Stunned,
                player1Surge,
                player2Surge
            });
            return NextResponse.json({ 
                success: false, 
                error: "Player is not stunned - must submit move normally" 
            }, { status: 400 });
        }

        console.log(`[SubmitStunnedMove] Verified ${playerRole} is stunned, auto-submitting 'stunned' move`);

        // Get player address for the moves table
        const playerAddress = playerRole === "player1" 
            ? match.player1_address 
            : match.player2_address;

        // Insert move into moves table
        const { data: moveData, error: moveInsertError } = await supabase
            .from("moves")
            .insert({
                round_id: currentRound.id,
                player_address: playerAddress,
                move_type: "stunned",
                tx_id: "stunned_auto_submit",
            })
            .select()
            .single();

        if (moveInsertError) {
            console.error("[SubmitStunnedMove] Error inserting move:", moveInsertError);
            return NextResponse.json({ 
                success: false, 
                error: "Failed to insert move" 
            }, { status: 500 });
        }

        // Update round with the move
        const { error: updateError } = await supabase
            .from("rounds")
            .update({
                [moveColumn]: "stunned",
            })
            .eq("id", currentRound.id);

        if (updateError) {
            console.error("[SubmitStunnedMove] Error updating round:", updateError);
            return NextResponse.json({ 
                success: false, 
                error: "Failed to update round" 
            }, { status: 500 });
        }

        // Broadcast move_submitted event
        const gameChannel = supabase.channel(`game:${matchId}`);
        await gameChannel.send({
            type: "broadcast",
            event: "move_submitted",
            payload: {
                player: playerRole,
                txId: "stunned_auto_submit",
                submittedAt: Date.now(),
            },
        });
        await supabase.removeChannel(gameChannel);

        // Check if both players have now submitted
        const { data: updatedRound } = await supabase
            .from("rounds")
            .select("*")
            .eq("id", currentRound.id)
            .single();

        const bothSubmitted = updatedRound?.player1_move && updatedRound?.player2_move;

        // If both have submitted, trigger resolution
        if (bothSubmitted) {
            console.log("[SubmitStunnedMove] Both moves submitted, triggering resolution");
            try {
                const { resolveRound } = await import("@/lib/game/combat-resolver");
                const resolution = await resolveRound(matchId, currentRound.id);
                console.log("[SubmitStunnedMove] Round resolved:", resolution);

                // If match is over, trigger payouts
                if (resolution.isMatchOver) {
                    (async () => {
                        try {
                            const { resolveMatchPayouts, resolveMatchStakePayout } = await import("@/lib/betting/payout-service");
                            await resolveMatchPayouts(matchId);
                            await resolveMatchStakePayout(matchId);
                        } catch (e) {
                            console.error("[SubmitStunnedMove] Failed to trigger payouts:", e);
                        }
                    })();
                }
            } catch (resolveError) {
                console.error("[SubmitStunnedMove] Error resolving round:", resolveError);
            }
        }

        return NextResponse.json({ 
            success: true, 
            action: "submitted",
            moveId: moveData?.id,
            roundId: currentRound.id,
            awaitingOpponent: !bothSubmitted,
        });

    } catch (error) {
        console.error("[SubmitStunnedMove] Error:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Internal server error" 
        }, { status: 500 });
    }
}
