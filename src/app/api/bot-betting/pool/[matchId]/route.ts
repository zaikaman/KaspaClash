/**
 * Bot Betting Pool API - HOUSE MODEL
 * Returns fixed 2x odds for bot match betting
 * Players bet against the house, not each other
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    getBotMatch,
    getBettingStatus,
    getCurrentTurnIndex,
} from "@/lib/game/bot-match-service";

// House betting constants
const HOUSE_ODDS = 2.0; // Fixed 2x payout
const HOUSE_FEE_PERCENT = 1; // 1% fee

export async function GET(
    request: Request,
    { params }: { params: Promise<{ matchId: string }> }
) {
    try {
        const { matchId } = await params;
        const { searchParams } = new URL(request.url);
        const address = searchParams.get("address");

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

        // If address provided, fetch user's bet
        let userBet = null;
        if (address) {
            const supabase = await createSupabaseServerClient();
            // Use any to access bot betting tables not in main schema
            const db = supabase as any;
            
            // First get the pool
            const { data: pool } = await db
                .from("bot_betting_pools")
                .select("id")
                .eq("bot_match_id", matchId)
                .single();

            if (pool) {
                // Then get user's bet for this pool
                const { data: bet } = await db
                    .from("bot_bets")
                    .select("*")
                    .eq("pool_id", pool.id)
                    .eq("bettor_address", address)
                    .single();

                if (bet) {
                    userBet = {
                        id: bet.id,
                        bet_on: bet.bet_on,
                        amount: bet.amount,
                        net_amount: bet.net_amount,
                        fee_paid: bet.fee_paid,
                        status: bet.status,
                        payout_amount: bet.payout_amount,
                        tx_id: bet.tx_id,
                        payout_tx_id: bet.payout_tx_id,
                        created_at: bet.created_at,
                        paid_at: bet.paid_at,
                    };
                }
            }
        }

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
            userBet, // Include user's bet if found
        });
    } catch (error) {
        console.error("Error in bot betting pool API:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
