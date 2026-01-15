/**
 * API endpoint to fetch replay data for MP4 export
 * Returns match data with all rounds for client-side rendering
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MoveType } from "@/types";

export interface ReplayRoundData {
    roundNumber: number;
    player1Move: MoveType;
    player2Move: MoveType;
    player1DamageDealt: number;
    player2DamageDealt: number;
    player1HealthAfter: number;
    player2HealthAfter: number;
    winnerAddress: string | null;
}

export interface ReplayData {
    matchId: string;
    player1Address: string;
    player2Address: string;
    player1Character: string;
    player2Character: string;
    winnerAddress: string | null;
    player1RoundsWon: number;
    player2RoundsWon: number;
    rounds: ReplayRoundData[];
}

function isValidMove(move: string | null): move is MoveType {
    return move !== null && ["punch", "kick", "block", "special"].includes(move);
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
        return NextResponse.json({ error: "matchId is required" }, { status: 400 });
    }

    try {
        const supabase = await createSupabaseServerClient();

        // Fetch match
        const { data: match, error: matchError } = await supabase
            .from("matches")
            .select("*")
            .eq("id", matchId)
            .single();

        if (matchError || !match) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        // Only allow export for completed matches
        if (match.status !== "completed") {
            return NextResponse.json(
                { error: "Match is not completed yet" },
                { status: 400 }
            );
        }

        // Fetch all rounds for this match
        const { data: rounds, error: roundsError } = await supabase
            .from("rounds")
            .select("*")
            .eq("match_id", matchId)
            .order("round_number", { ascending: true });

        if (roundsError) {
            return NextResponse.json(
                { error: "Failed to fetch rounds" },
                { status: 500 }
            );
        }

        // Filter and transform rounds with valid moves
         
        const validRounds: ReplayRoundData[] = (rounds || [])
            .filter((r) => isValidMove(r.player1_move) && isValidMove(r.player2_move))
            .map((r) => ({
                roundNumber: r.round_number,
                player1Move: r.player1_move as MoveType,
                player2Move: r.player2_move as MoveType,
                player1DamageDealt: r.player1_damage_dealt ?? 0,
                player2DamageDealt: r.player2_damage_dealt ?? 0,
                player1HealthAfter: r.player1_health_after ?? 100,
                player2HealthAfter: r.player2_health_after ?? 100,
                winnerAddress: r.winner_address,
            }));

        const replayData: ReplayData = {
            matchId: match.id,
            player1Address: match.player1_address,
            player2Address: match.player2_address || "",
            player1Character: match.player1_character_id || "dag-warrior",
            player2Character: match.player2_character_id || "dag-warrior",
            winnerAddress: match.winner_address,
            player1RoundsWon: match.player1_rounds_won,
            player2RoundsWon: match.player2_rounds_won,
            rounds: validRounds,
        };

        return NextResponse.json(replayData);
    } catch (error) {
        console.error("Error fetching replay data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
