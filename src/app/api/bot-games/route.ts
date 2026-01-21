/**
 * Bot Games API Route
 * Provides pre-computed bot matches with 24/7 operation
 */

import { NextResponse } from "next/server";
import {
    ensureActiveBotMatch,
    getActiveBotMatches,
    generateBotMatch,
    addBotMatch,
    cleanupOldMatches,
    getMatchSyncInfo,
    getCurrentTurnIndex,
} from "@/lib/game/bot-match-service";

/**
 * GET /api/bot-games
 * Returns active bot matches with sync info
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const matchId = searchParams.get("matchId");

        cleanupOldMatches();

        // Get specific match with sync info
        if (matchId) {
            const syncInfo = getMatchSyncInfo(matchId);
            if (syncInfo) {
                return NextResponse.json({
                    success: true,
                    match: syncInfo.match,
                    currentTurnIndex: syncInfo.currentTurnIndex,
                    elapsedMs: syncInfo.elapsedMs,
                    isFinished: syncInfo.isFinished,
                });
            }
            return NextResponse.json(
                { success: false, error: "Match not found" },
                { status: 404 }
            );
        }

        // Ensure there's an active match and get all
        ensureActiveBotMatch();
        const matches = getActiveBotMatches();

        // Add current turn info to each match
        const matchesWithSync = matches.map(m => ({
            ...m,
            currentTurnIndex: getCurrentTurnIndex(m),
        }));

        return NextResponse.json({
            success: true,
            matches: matchesWithSync,
            count: matchesWithSync.length,
        });
    } catch (error) {
        console.error("Error fetching bot games:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch bot games" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/bot-games
 * Creates a new bot match
 */
export async function POST() {
    try {
        const match = generateBotMatch();
        addBotMatch(match);

        return NextResponse.json({
            success: true,
            match,
        });
    } catch (error) {
        console.error("Error creating bot game:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create bot game" },
            { status: 500 }
        );
    }
}
