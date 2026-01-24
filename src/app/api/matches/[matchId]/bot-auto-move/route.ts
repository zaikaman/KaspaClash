/**
 * POST /api/matches/[matchId]/bot-auto-move
 * Called after round countdown to auto-submit bot move when opponent is stunned
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitBotMoveForMatch } from "@/lib/game/bot-move-helper";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ matchId: string }> }
) {
    try {
        const { matchId } = await params;
        const supabase = await createSupabaseServerClient();

        // Fetch match
        const { data: match, error: matchError } = await supabase
            .from("matches")
            .select("*")
            .eq("id", matchId)
            .single();

        if (matchError || !match) {
            console.error("[BotAutoMove] Match not found:", matchError);
            return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
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
            console.error("[BotAutoMove] Round not found:", roundError);
            return NextResponse.json({ success: false, error: "Round not found" }, { status: 404 });
        }

        // Check if one player has a move (stunned) and the other doesn't (bot needs to move)
        const player1HasMove = !!currentRound.player1_move;
        const player2HasMove = !!currentRound.player2_move;

        // If both have moves or neither has moves, nothing to do
        if ((player1HasMove && player2HasMove) || (!player1HasMove && !player2HasMove)) {
            console.log("[BotAutoMove] No bot auto-move needed");
            return NextResponse.json({ success: true, action: "none" });
        }

        // Determine which player is the bot
        const player1IsBot = match.player1_address?.startsWith("bot_");
        const player2IsBot = match.player2_address?.startsWith("bot_");

        // If player 1 is stunned (has move) and player 2 is bot (needs to move)
        if (player1HasMove && !player2HasMove && player2IsBot) {
            console.log("[BotAutoMove] Player 1 stunned, scheduling bot (player 2) move in background");
            
            // Schedule bot move in background (don't await - let it run async)
            const thinkingDelay = 3000 + Math.random() * 2000;
            setTimeout(async () => {
                try {
                    console.log("[BotAutoMove] Bot finished thinking, submitting move");
                    await submitBotMoveForMatch(matchId, currentRound.id, "player2");
                    console.log("[BotAutoMove] Bot move submitted successfully");
                } catch (error) {
                    console.error("[BotAutoMove] Error submitting bot move:", error);
                }
            }, thinkingDelay);

            return NextResponse.json({ success: true, action: "bot_scheduled", player: "player2", thinkingDelay });
        }

        // If player 2 is stunned (has move) and player 1 is bot (needs to move)
        if (player2HasMove && !player1HasMove && player1IsBot) {
            console.log("[BotAutoMove] Player 2 stunned, scheduling bot (player 1) move in background");
            
            // Schedule bot move in background (don't await - let it run async)
            const thinkingDelay = 3000 + Math.random() * 2000;
            setTimeout(async () => {
                try {
                    console.log("[BotAutoMove] Bot finished thinking, submitting move");
                    await submitBotMoveForMatch(matchId, currentRound.id, "player1");
                    console.log("[BotAutoMove] Bot move submitted successfully");
                } catch (error) {
                    console.error("[BotAutoMove] Error submitting bot move:", error);
                }
            }, thinkingDelay);

            return NextResponse.json({ success: true, action: "bot_scheduled", player: "player1", thinkingDelay });
        }

        return NextResponse.json({ success: true, action: "none" });
    } catch (error) {
        console.error("[BotAutoMove] Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
