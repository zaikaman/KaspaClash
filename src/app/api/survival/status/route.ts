/**
 * GET /api/survival/status
 * Check player's daily plays remaining and stats
 */

import { NextRequest, NextResponse } from "next/server";
import { canStartSurvivalRun, getPlayerSurvivalStats } from "@/lib/survival/leaderboard-updater";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const playerAddress = searchParams.get("playerAddress");

        if (!playerAddress) {
            return NextResponse.json(
                { error: "Missing playerAddress parameter" },
                { status: 400 }
            );
        }

        // Get play status
        const playStatus = await canStartSurvivalRun(playerAddress);

        // Get player stats
        const stats = await getPlayerSurvivalStats(playerAddress);

        return NextResponse.json({
            canPlay: playStatus.canPlay,
            playsRemaining: playStatus.playsRemaining,
            playsTotal: 3,
            resetsAt: playStatus.resetsAt,
            stats: {
                bestWaves: stats.bestWaves,
                bestScore: stats.bestScore,
                totalRuns: stats.totalRuns,
                totalShardsEarned: stats.totalShardsEarned,
                victories: stats.victories,
                rank: stats.rank,
            },
        });
    } catch (error) {
        console.error("Survival status error:", error);
        return NextResponse.json(
            { error: "Failed to fetch survival status" },
            { status: 500 }
        );
    }
}
