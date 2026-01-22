/**
 * Bot Betting Pool API
 * Returns pool odds and betting status for a bot match
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    getBotMatch,
    getBettingStatus,
    getCurrentTurnIndex,
} from "@/lib/game/bot-match-service";
import { calculateOdds } from "@/lib/betting/betting-service";

// Type for bot betting pool from database
interface BotBettingPoolRow {
    id: string;
    bot_match_id: string;
    bot1_total: number;
    bot2_total: number;
    total_pool: number;
    total_fees: number;
    status: string;
    winner?: string;
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ matchId: string }> }
) {
    try {
        const { matchId } = await params;

        // Get bot match from memory
        const match = getBotMatch(matchId);
        if (!match) {
            return NextResponse.json(
                { success: false, error: "Bot match not found" },
                { status: 404 }
            );
        }

        // Get betting status
        const bettingStatus = getBettingStatus(match);
        const currentTurnIndex = getCurrentTurnIndex(match);

        // Get pool from database
        const supabase = await createSupabaseServerClient();
        const { data: poolData, error } = await (supabase as any)
            .from("bot_betting_pools")
            .select("*")
            .eq("bot_match_id", matchId)
            .single();

        if (error && error.code !== "PGRST116") { // PGRST116 = not found
            console.error("Error fetching bot betting pool:", error);
            return NextResponse.json(
                { success: false, error: "Failed to fetch pool" },
                { status: 500 }
            );
        }

        // If no pool exists, return default values
        if (!poolData) {
            return NextResponse.json({
                success: true,
                matchId,
                bot1Name: match.bot1Name,
                bot2Name: match.bot2Name,
                bot1CharacterId: match.bot1CharacterId,
                bot2CharacterId: match.bot2CharacterId,
                bettingStatus,
                currentTurnIndex,
                pool: {
                    bot1Total: "0",
                    bot2Total: "0",
                    totalPool: "0",
                    status: bettingStatus.isOpen ? "open" : "locked",
                },
                odds: {
                    bot1Odds: 2.0,
                    bot2Odds: 2.0,
                    bot1Percentage: 50,
                    bot2Percentage: 50,
                },
            });
        }

        const pool = poolData as BotBettingPoolRow;

        // Calculate odds using existing betting service
        const oddsPool = {
            id: pool.id,
            matchId: pool.bot_match_id,
            player1Total: BigInt(pool.bot1_total || 0),
            player2Total: BigInt(pool.bot2_total || 0),
            totalPool: BigInt(pool.total_pool || 0),
            totalFees: BigInt(pool.total_fees || 0),
            status: pool.status as "open" | "locked" | "resolved" | "refunded",
            winner: pool.winner as "player1" | "player2" | undefined,
        };

        const odds = calculateOdds(oddsPool);

        return NextResponse.json({
            success: true,
            matchId,
            bot1Name: match.bot1Name,
            bot2Name: match.bot2Name,
            bot1CharacterId: match.bot1CharacterId,
            bot2CharacterId: match.bot2CharacterId,
            bettingStatus,
            currentTurnIndex,
            pool: {
                id: pool.id,
                bot1Total: pool.bot1_total.toString(),
                bot2Total: pool.bot2_total.toString(),
                totalPool: pool.total_pool.toString(),
                status: pool.status,
            },
            odds: {
                bot1Odds: odds.player1Odds,
                bot2Odds: odds.player2Odds,
                bot1Percentage: odds.player1Percentage,
                bot2Percentage: odds.player2Percentage,
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
