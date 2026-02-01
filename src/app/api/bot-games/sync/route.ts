/**
 * Bot Games Sync API Route
 * Provides lightweight state synchronization for spectators returning from tab switch
 * 
 * This endpoint is optimized for fast resync - returns only essential timing data
 * without the full match data (which the client already has)
 */

import { NextResponse } from "next/server";
import {
    getBotMatch,
    getCurrentTurnIndex,
    isMatchFinished,
    getBettingStatus,
    ensureActiveBotMatch,
} from "@/lib/game/bot-match-service";

export interface BotGamesSyncResponse {
    success: boolean;
    matchId: string;
    serverTime: number;
    /** Time elapsed since match was created (ms) */
    elapsedMs: number;
    /** Current turn index based on server time */
    currentTurnIndex: number;
    /** Whether the match has finished */
    isFinished: boolean;
    /** Betting status calculated server-side */
    bettingStatus: {
        isOpen: boolean;
        secondsRemaining: number;
        reason?: string;
    };
    /** If match is finished, the ID of the new active match */
    newMatchId?: string;
    /** If a new match exists, include minimal info for seamless transition */
    newMatch?: {
        id: string;
        bot1CharacterId: string;
        bot2CharacterId: string;
        bot1Name: string;
        bot2Name: string;
        createdAt: number;
        totalTurns: number;
    };
}

/**
 * GET /api/bot-games/sync?matchId=xxx
 * Returns current server state for synchronization
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const matchId = searchParams.get("matchId");

        if (!matchId) {
            return NextResponse.json(
                { success: false, error: "matchId parameter is required" },
                { status: 400 }
            );
        }

        const serverTime = Date.now();
        const match = await getBotMatch(matchId);

        // If match doesn't exist, get current active match
        if (!match) {
            const activeMatch = await ensureActiveBotMatch();
            const activeBettingStatus = getBettingStatus(activeMatch);
            
            return NextResponse.json<BotGamesSyncResponse>({
                success: true,
                matchId: matchId,
                serverTime,
                elapsedMs: 0,
                currentTurnIndex: 0,
                isFinished: true,
                bettingStatus: {
                    isOpen: false,
                    secondsRemaining: 0,
                    reason: "Match not found",
                },
                newMatchId: activeMatch.id,
                newMatch: {
                    id: activeMatch.id,
                    bot1CharacterId: activeMatch.bot1CharacterId,
                    bot2CharacterId: activeMatch.bot2CharacterId,
                    bot1Name: activeMatch.bot1Name,
                    bot2Name: activeMatch.bot2Name,
                    createdAt: activeMatch.createdAt,
                    totalTurns: activeMatch.totalTurns,
                },
            });
        }

        const elapsedMs = serverTime - match.createdAt;
        const currentTurnIndex = getCurrentTurnIndex(match);
        const isFinished = isMatchFinished(match);
        const bettingStatus = getBettingStatus(match);

        const response: BotGamesSyncResponse = {
            success: true,
            matchId,
            serverTime,
            elapsedMs,
            currentTurnIndex,
            isFinished,
            bettingStatus: {
                isOpen: bettingStatus.isOpen,
                secondsRemaining: bettingStatus.secondsRemaining,
                reason: bettingStatus.reason,
            },
        };

        // If match is finished, include info about the new active match
        if (isFinished) {
            const activeMatch = await ensureActiveBotMatch();
            if (activeMatch.id !== matchId) {
                response.newMatchId = activeMatch.id;
                response.newMatch = {
                    id: activeMatch.id,
                    bot1CharacterId: activeMatch.bot1CharacterId,
                    bot2CharacterId: activeMatch.bot2CharacterId,
                    bot1Name: activeMatch.bot1Name,
                    bot2Name: activeMatch.bot2Name,
                    createdAt: activeMatch.createdAt,
                    totalTurns: activeMatch.totalTurns,
                };
            }
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error in bot-games sync:", error);
        return NextResponse.json(
            { success: false, error: "Failed to sync bot game state" },
            { status: 500 }
        );
    }
}
