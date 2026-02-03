/**
 * POST /api/matches/[matchId]/skip-stunned-turn
 * 
 * Called when both players are stunned (e.g., both picked Mempool Congest).
 * Automatically submits "punch" for both players and triggers round resolution
 * WITHOUT requiring transaction signatures since neither player can make a choice.
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

        console.log(`[SkipStunnedTurn] Called for match ${matchId} by ${playerRole}`);

        const supabase = await createSupabaseServerClient();

        // Fetch match
        const { data: match, error: matchError } = await supabase
            .from("matches")
            .select("*")
            .eq("id", matchId)
            .single() as { data: any; error: any };

        if (matchError || !match) {
            console.error("[SkipStunnedTurn] Match not found:", matchError);
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
            console.error("[SkipStunnedTurn] Round not found:", roundError);
            return NextResponse.json({ success: false, error: "Round not found" }, { status: 404 });
        }

        console.log(`[SkipStunnedTurn] Current round from DB: round_number=${currentRound.round_number}, id=${currentRound.id}`);

        // Check if both players have already submitted moves
        if (currentRound.player1_move && currentRound.player2_move) {
            console.log("[SkipStunnedTurn] Both moves already submitted, nothing to do");
            return NextResponse.json({ success: true, action: "already_resolved" });
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

        console.log("[SkipStunnedTurn] Power surge query result:", { 
            surgeData: surgeData ? { 
                round_number: surgeData.round_number, 
                player1_card_id: surgeData.player1_card_id,
                player2_card_id: surgeData.player2_card_id 
            } : null, 
            surgeError: surgeError ? { code: surgeError.code, message: surgeError.message } : null 
        });

        if (surgeError && surgeError.code !== "PGRST116") {
            console.error("[SkipStunnedTurn] Error fetching power surge data:", surgeError);
        }

        // Verify that both players are actually stunned
        const player1Surge = surgeData?.player1_card_id as PowerSurgeCardId | null;
        const player2Surge = surgeData?.player2_card_id as PowerSurgeCardId | null;

        const surgeResults = calculateSurgeEffects(player1Surge, player2Surge);
        const player1StunnsPlayer2 = shouldStunOpponent(surgeResults.player1Modifiers);
        const player2StunnsPlayer1 = shouldStunOpponent(surgeResults.player2Modifiers);

        const player1IsStunned = player2StunnsPlayer1;
        const player2IsStunned = player1StunnsPlayer2;

        if (!player1IsStunned || !player2IsStunned) {
            console.warn("[SkipStunnedTurn] Not both players are stunned:", {
                player1IsStunned,
                player2IsStunned,
                player1Surge,
                player2Surge
            });
            return NextResponse.json({ 
                success: false, 
                error: "Both players must be stunned to skip" 
            }, { status: 400 });
        }

        console.log("[SkipStunnedTurn] Verified both players are stunned, attempting to claim lock");

        // Use conditional UPDATE as a mutex - only succeeds if moves are still null
        // This ensures ONLY ONE request can successfully claim the lock
        const { data: updateResult, error: updateError } = await supabase
            .from("rounds")
            .update({
                player1_move: "stunned",
                player2_move: "stunned",
            })
            .eq("id", currentRound.id)
            .is("player1_move", null)
            .is("player2_move", null)
            .select("id");

        if (updateError) {
            console.error("[SkipStunnedTurn] Error updating round:", updateError);
            return NextResponse.json({ 
                success: false, 
                error: "Failed to update round" 
            }, { status: 500 });
        }

        // If no rows were updated, another request already claimed the lock
        if (!updateResult || updateResult.length === 0) {
            console.log("[SkipStunnedTurn] Lock already claimed by another request, skipping");
            return NextResponse.json({ 
                success: true, 
                action: "already_resolved",
                message: "Another request already processing" 
            });
        }

        console.log("[SkipStunnedTurn] Lock claimed, inserting moves and resolving");

        // Insert moves for both players into the moves table
        const { error: move1Error } = await supabase
            .from("moves")
            .insert({
                round_id: currentRound.id,
                player_address: match.player1_address,
                move_type: "stunned",
                tx_id: "stunned_skip",
            });

        if (move1Error) {
            console.error("[SkipStunnedTurn] Error inserting player1 move:", move1Error);
        }

        const { error: move2Error } = await supabase
            .from("moves")
            .insert({
                round_id: currentRound.id,
                player_address: match.player2_address,
                move_type: "stunned",
                tx_id: "stunned_skip",
            });

        if (move2Error) {
            console.error("[SkipStunnedTurn] Error inserting player2 move:", move2Error);
        }

        // Now resolve the round using the combat resolver
        // The resolution will broadcast the result to both players via realtime
        try {
            const { resolveRound } = await import("@/lib/game/combat-resolver");
            const resolution = await resolveRound(matchId, currentRound.id);
            console.log("[SkipStunnedTurn] Round resolved:", resolution);

            // If match is over, trigger payouts
            if (resolution.isMatchOver) {
                (async () => {
                    try {
                        const { resolveMatchPayouts, resolveMatchStakePayout } = await import("@/lib/betting/payout-service");
                        await resolveMatchPayouts(matchId);
                        await resolveMatchStakePayout(matchId);
                    } catch (e) {
                        console.error("[SkipStunnedTurn] Failed to trigger payouts:", e);
                    }
                })();
            }
        } catch (resolveError) {
            console.error("[SkipStunnedTurn] Error resolving round:", resolveError);
            // Even if resolution fails, the moves are submitted
            // The next move API call will trigger resolution
        }

        return NextResponse.json({ 
            success: true, 
            action: "skipped",
            message: "Both players stunned - turn skipped with stunned/stunned"
        });

    } catch (error) {
        console.error("[SkipStunnedTurn] Error:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Internal server error" 
        }, { status: 500 });
    }
}
