/**
 * API endpoint to fetch replay data for MP4 export
 * Returns match data with all rounds for client-side rendering
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MoveType } from "@/types";
import type { PowerSurgeCardId } from "@/types/power-surge";

export interface ReplayRoundData {
    roundNumber: number;
    player1Move: MoveType;
    player2Move: MoveType;
    player1DamageDealt: number;
    player2DamageDealt: number;
    player1HealthAfter: number;
    player2HealthAfter: number;
    winnerAddress: string | null;
    player1EnergyDrained?: number;
    player2EnergyDrained?: number;
    player1HpRegen?: number;
    player2HpRegen?: number;
    player1Lifesteal?: number;
    player2Lifesteal?: number;
    // Power surge data
    surgeCardIds?: PowerSurgeCardId[];
    player1SurgeSelection?: PowerSurgeCardId;
    player2SurgeSelection?: PowerSurgeCardId;
}

interface PowerSurgeData {
    round_number: number;
    offered_cards: string[];
    player1_card_id: string | null;
    player2_card_id: string | null;
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

        // Fetch power surge data for this match
        const { data: powerSurges, error: powerSurgesError } = await supabase
            .from("power_surges")
            .select("round_number, offered_cards, player1_card_id, player2_card_id")
            .eq("match_id", matchId)
            .order("round_number", { ascending: true });

        if (powerSurgesError) {
            console.error("Error fetching power surges:", powerSurgesError);
            // Continue without power surges - not critical
        }

        // Create a map of power surges by GAME round number for quick lookup
        // Note: power_surges.round_number is the GAME ROUND (1, 2, 3), not turn number
        const powerSurgeByGameRound = new Map<number, PowerSurgeData>();
        for (const ps of (powerSurges || []) as PowerSurgeData[]) {
            powerSurgeByGameRound.set(ps.round_number, ps);
        }

        // Filter and transform rounds with valid moves
        // Track game round - it increments after each turn with a winner
        const filteredRounds = (rounds || []).filter((r) => isValidMove(r.player1_move) && isValidMove(r.player2_move));
        let currentGameRound = 1;
        const validRounds: ReplayRoundData[] = [];
        
        for (let i = 0; i < filteredRounds.length; i++) {
            const r = filteredRounds[i];
            const isFirstTurnOfGameRound = i === 0 || (filteredRounds[i - 1]?.winner_address !== null);
            
            // Get power surge only for the first turn of each game round
            const powerSurge = isFirstTurnOfGameRound ? powerSurgeByGameRound.get(currentGameRound) : undefined;
            
            validRounds.push({
                roundNumber: r.round_number,
                player1Move: r.player1_move as MoveType,
                player2Move: r.player2_move as MoveType,
                player1DamageDealt: r.player1_damage_dealt ?? 0,
                player2DamageDealt: r.player2_damage_dealt ?? 0,
                player1HealthAfter: r.player1_health_after ?? 100,
                player2HealthAfter: r.player2_health_after ?? 100,
                winnerAddress: r.winner_address,
                player1EnergyDrained: r.player1_energy_drained ?? 0,
                player2EnergyDrained: r.player2_energy_drained ?? 0,
                player1HpRegen: r.player1_hp_regen ?? 0,
                player2HpRegen: r.player2_hp_regen ?? 0,
                player1Lifesteal: r.player1_lifesteal ?? 0,
                player2Lifesteal: r.player2_lifesteal ?? 0,
                // Include power surge data only for first turn of each game round
                surgeCardIds: powerSurge?.offered_cards as PowerSurgeCardId[] | undefined,
                player1SurgeSelection: powerSurge?.player1_card_id as PowerSurgeCardId | undefined,
                player2SurgeSelection: powerSurge?.player2_card_id as PowerSurgeCardId | undefined,
            });
            
            // If this turn ended a game round, increment for next turn
            if (r.winner_address !== null) {
                currentGameRound++;
            }
        }

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
