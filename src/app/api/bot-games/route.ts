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
 * Returns the single active bot match with sync info
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const matchId = searchParams.get("matchId");

        await cleanupOldMatches();

        // Get specific match with sync info
        if (matchId) {
            const syncInfo = await getMatchSyncInfo(matchId);
            if (syncInfo) {
                // If match is finished, get the new active match instead
                if (syncInfo.isFinished) {
                    const activeMatch = await ensureActiveBotMatch();
                    return NextResponse.json({
                        success: true,
                        match: activeMatch,
                        currentTurnIndex: getCurrentTurnIndex(activeMatch),
                        elapsedMs: Date.now() - activeMatch.createdAt,
                        isFinished: false,
                    });
                }
                return NextResponse.json({
                    success: true,
                    match: syncInfo.match,
                    currentTurnIndex: syncInfo.currentTurnIndex,
                    elapsedMs: syncInfo.elapsedMs,
                    isFinished: syncInfo.isFinished,
                });
            }
            // Match not found, get current active match
            const activeMatch = await ensureActiveBotMatch();
            return NextResponse.json({
                success: true,
                match: activeMatch,
                currentTurnIndex: getCurrentTurnIndex(activeMatch),
                elapsedMs: Date.now() - activeMatch.createdAt,
                isFinished: false,
            });
        }

        // Get the single active match
        const match = await ensureActiveBotMatch();
        const currentTurnIndex = getCurrentTurnIndex(match);

        return NextResponse.json({
            success: true,
            match,
            currentTurnIndex,
            count: 1,
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
        await addBotMatch(match);

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
