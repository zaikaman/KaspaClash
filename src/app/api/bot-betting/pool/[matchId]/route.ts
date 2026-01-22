/**
 * Bot Betting Pool API - HOUSE MODEL
 * Returns fixed 2x odds for bot match betting
 * Players bet against the house, not each other
 */

import { NextResponse } from "next/server";
import {
    getBotMatch,
    getBettingStatus,
    getCurrentTurnIndex,
} from "@/lib/game/bot-match-service";

// House betting constants
const HOUSE_ODDS = 2.0; // Fixed 2x payout
const HOUSE_FEE_PERCENT = 1; // 1% fee

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ matchId: string }> }
) {
    try {
        const { matchId } = await params;

        // Get bot match from database
        const match = await getBotMatch(matchId);
        if (!match) {
            return NextResponse.json(
                { success: false, error: "Bot match not found" },
                { status: 404 }
            );
        }

        // Get betting status
        const bettingStatus = getBettingStatus(match);
        const currentTurnIndex = getCurrentTurnIndex(match);

        // Return fixed house odds - no database needed
        return NextResponse.json({
            success: true,
            matchId,
            bot1Name: match.bot1Name,
            bot2Name: match.bot2Name,
            bot1CharacterId: match.bot1CharacterId,
            bot2CharacterId: match.bot2CharacterId,
            bettingStatus,
            currentTurnIndex,
            // House betting model - fixed odds
            houseModel: true,
            feePercent: HOUSE_FEE_PERCENT,
            pool: {
                bot1Total: "0",
                bot2Total: "0",
                totalPool: "0",
                status: bettingStatus.isOpen ? "open" : "locked",
            },
            odds: {
                bot1Odds: HOUSE_ODDS,
                bot2Odds: HOUSE_ODDS,
                bot1Percentage: 50,
                bot2Percentage: 50,
            },
        });
    } catch (error) {
        console.error("Error in bot betting pool API:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
