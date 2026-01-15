/**
 * POST /api/survival/end
 * Record survival run completion and award rewards
 */

import { NextRequest, NextResponse } from "next/server";
import { recordSurvivalRun } from "@/lib/survival/leaderboard-updater";
import { calculateSurvivalScore } from "@/lib/survival/score-calculator";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface EndSurvivalRequest {
    playerAddress: string;
    characterId: string;
    wavesCleared: number;
    finalHealth: number;
    isVictory: boolean;
    waveDetails?: {
        healthAfter: number;
        roundsWon: number;
        totalRounds: number;
    }[];
}

export async function POST(request: NextRequest) {
    try {
        const body: EndSurvivalRequest = await request.json();

        // Validate required fields
        if (!body.playerAddress || !body.characterId) {
            return NextResponse.json(
                { error: "Missing required fields: playerAddress, characterId" },
                { status: 400 }
            );
        }

        if (body.wavesCleared < 0 || body.wavesCleared > 20) {
            return NextResponse.json(
                { error: "wavesCleared must be between 0 and 20" },
                { status: 400 }
            );
        }

        // Verify the player exists
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: player } = await supabase
            .from("players")
            .select("address")
            .eq("address", body.playerAddress)
            .single();

        if (!player) {
            return NextResponse.json(
                { error: "Player not found" },
                { status: 404 }
            );
        }

        // Calculate score and rewards
        const scoreResult = calculateSurvivalScore(
            body.wavesCleared,
            body.finalHealth,
            body.isVictory,
            body.waveDetails
        );

        // Record the survival run
        const result = await recordSurvivalRun({
            player_id: body.playerAddress,
            character_id: body.characterId,
            waves_cleared: body.wavesCleared,
            score: scoreResult.totalScore,
            shards_earned: scoreResult.shardsEarned,
            final_health: body.finalHealth,
            is_victory: body.isVictory,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to record survival run" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            runId: result.runId,
            score: scoreResult.totalScore,
            shardsEarned: scoreResult.shardsEarned,
            isNewHighScore: result.isNewHighScore,
            previousBestScore: result.previousBestScore,
            newRank: result.newRank,
            breakdown: {
                waveScore: scoreResult.waveScore,
                healthBonus: scoreResult.healthBonus,
                victoryBonus: scoreResult.victoryBonus,
            },
        });
    } catch (error) {
        console.error("End survival error:", error);
        return NextResponse.json(
            { error: "Failed to end survival run" },
            { status: 500 }
        );
    }
}
