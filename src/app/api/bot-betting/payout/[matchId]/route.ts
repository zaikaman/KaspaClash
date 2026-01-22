/**
 * Bot Betting Payout API
 * Resolves payouts when a bot match ends
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    getBotMatch,
    getCurrentTurnIndex,
} from "@/lib/game/bot-match-service";

// Type for bot betting pool from database
interface BotBettingPoolRow {
    id: string;
    bot_match_id: string;
    bot1_total: number;
    bot2_total: number;
    total_pool: number;
    status: string;
    winner?: string;
}

// Type for bot bet from database
interface BotBetRow {
    id: string;
    pool_id: string;
    bettor_address: string;
    bet_on: string;
    net_amount: number;
}

export async function POST(
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

        // Check if match has finished
        const currentTurn = getCurrentTurnIndex(match);
        if (currentTurn < match.totalTurns - 1) {
            return NextResponse.json(
                { success: false, error: "Match not yet finished" },
                { status: 400 }
            );
        }

        // Get winner
        const winner = match.matchWinner;
        if (!winner) {
            return NextResponse.json(
                { success: false, error: "Match has no winner" },
                { status: 400 }
            );
        }

        // Convert to bot1/bot2 format
        const winnerBot = winner === "player1" ? "bot1" : "bot2";

        const supabase = await createSupabaseServerClient();
        const db = supabase as any; // Type assertion for new tables

        // Get pool
        const { data: poolData, error: poolError } = await db
            .from("bot_betting_pools")
            .select("*")
            .eq("bot_match_id", matchId)
            .single();

        if (poolError) {
            if (poolError.code === "PGRST116") {
                return NextResponse.json({
                    success: true,
                    message: "No betting pool for this match",
                });
            }
            console.error("Error fetching pool:", poolError);
            return NextResponse.json(
                { success: false, error: "Failed to fetch pool" },
                { status: 500 }
            );
        }

        const pool = poolData as BotBettingPoolRow;

        // Check if already resolved
        if (pool.status === "resolved") {
            return NextResponse.json({
                success: true,
                message: "Pool already resolved",
                winner: pool.winner,
            });
        }

        // Resolve pool
        const { error: updatePoolError } = await db
            .from("bot_betting_pools")
            .update({
                status: "resolved",
                winner: winnerBot,
                resolved_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", pool.id);

        if (updatePoolError) {
            console.error("Error updating pool:", updatePoolError);
            return NextResponse.json(
                { success: false, error: "Failed to resolve pool" },
                { status: 500 }
            );
        }

        // Calculate and update winning bets
        const winningPool = winnerBot === "bot1"
            ? BigInt(pool.bot1_total)
            : BigInt(pool.bot2_total);
        const totalPool = BigInt(pool.total_pool);

        // Get all confirmed winning bets
        const { data: winningBetsData, error: betsError } = await db
            .from("bot_bets")
            .select("*")
            .eq("pool_id", pool.id)
            .eq("bet_on", winnerBot)
            .eq("status", "confirmed");

        if (betsError) {
            console.error("Error fetching winning bets:", betsError);
            return NextResponse.json(
                { success: false, error: "Failed to fetch bets" },
                { status: 500 }
            );
        }

        const winningBets = (winningBetsData || []) as BotBetRow[];

        // Update losing bets
        const { error: losersError } = await db
            .from("bot_bets")
            .update({ status: "lost" })
            .eq("pool_id", pool.id)
            .neq("bet_on", winnerBot)
            .eq("status", "confirmed");

        if (losersError) {
            console.error("Error updating losing bets:", losersError);
        }

        // Calculate payouts for winners
        const payouts: { betId: string; address: string; amount: string }[] = [];

        if (winningBets.length > 0 && winningPool > BigInt(0)) {
            for (const bet of winningBets) {
                const netAmount = BigInt(bet.net_amount);
                const payoutAmount = (netAmount * totalPool) / winningPool;

                // Update bet with payout
                await db
                    .from("bot_bets")
                    .update({
                        status: "won",
                        payout_amount: Number(payoutAmount),
                    })
                    .eq("id", bet.id);

                payouts.push({
                    betId: bet.id,
                    address: bet.bettor_address,
                    amount: payoutAmount.toString(),
                });
            }
        }

        return NextResponse.json({
            success: true,
            matchId,
            winner: winnerBot,
            totalPool: pool.total_pool.toString(),
            winningPool: winningPool.toString(),
            payoutsCount: payouts.length,
            payouts,
        });
    } catch (error) {
        console.error("Error in bot betting payout API:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
