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
            .single() as { data: any; error: any };

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

        // Determine which player is the bot (if match has bot)
        if (!match.is_bot) {
            return NextResponse.json({ success: true, action: "none" });
        }

        // For bot matches, determine which player is the bot by checking which profile has bot-like name
        const { data: player1Profile } = await supabase
            .from("players")
            .select("display_name")
            .eq("address", match.player1_address)
            .single();
        
        const { data: player2Profile } = await supabase
            .from("players")
            .select("display_name")
            .eq("address", match.player2_address)
            .single();

        // Typically player2 is the bot in our system
        const player1IsBot = player1Profile?.display_name?.includes("Bot") || false;
        const player2IsBot = player2Profile?.display_name?.includes("Bot") || !player1IsBot;

        // If player 1 is stunned (has move) and player 2 is bot (needs to move)
        if (player1HasMove && !player2HasMove && player2IsBot) {
            console.log("[BotAutoMove] Player 1 stunned, submitting bot (player 2) move immediately");
            
            // Submit bot move immediately in background (no delay)
            setTimeout(async () => {
                try {
                    await submitBotMoveForMatch(matchId, currentRound.id, "player2");
                    console.log("[BotAutoMove] Bot move submitted successfully");
                } catch (error) {
                    console.error("[BotAutoMove] Error submitting bot move:", error);
                }
            }, 0);

            return NextResponse.json({ success: true, action: "bot_scheduled", player: "player2" });
        }

        // If player 2 is stunned (has move) and player 1 is bot (needs to move)
        if (player2HasMove && !player1HasMove && player1IsBot) {
            console.log("[BotAutoMove] Player 2 stunned, submitting bot (player 1) move immediately");
            
            // Submit bot move immediately in background (no delay)
            setTimeout(async () => {
                try {
                    await submitBotMoveForMatch(matchId, currentRound.id, "player1");
                    console.log("[BotAutoMove] Bot move submitted successfully");
                } catch (error) {
                    console.error("[BotAutoMove] Error submitting bot move:", error);
                }
            }, 0);

            return NextResponse.json({ success: true, action: "bot_scheduled", player: "player1" });
        }

        return NextResponse.json({ success: true, action: "none" });
    } catch (error) {
        console.error("[BotAutoMove] Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
