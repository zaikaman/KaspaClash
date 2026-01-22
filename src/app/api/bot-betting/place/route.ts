/**
 * Bot Betting Place API - HOUSE MODEL
 * Place a bet on a bot match with fixed 2x odds
 * 1% fee charged on bet amount
 * 
 * IMPORTANT: Bets are stored in the database so payouts can be processed
 * automatically by the cron job, even if the user closes their browser.
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    getBotMatch,
    isBettingOpen,
    getBettingStatus,
} from "@/lib/game/bot-match-service";

// House betting constants
const HOUSE_FEE_PERCENT = 1; // 1% fee
const MIN_BET_KAS = 1; // Minimum 1 KAS

interface PlaceBetRequest {
    matchId: string;
    bettorAddress: string;
    betOn: "bot1" | "bot2";
    amount: string;
    txId: string;
}

export async function POST(request: Request) {
    try {
        const body: PlaceBetRequest = await request.json();
        const { matchId, bettorAddress, betOn, amount, txId } = body;

        // Validate required fields
        if (!matchId || !bettorAddress || !betOn || !amount || !txId) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate bet side
        if (betOn !== "bot1" && betOn !== "bot2") {
            return NextResponse.json(
                { success: false, error: "Invalid bet side" },
                { status: 400 }
            );
        }

        // Validate amount (in sompi, 1 KAS = 100000000 sompi)
        const amountBigInt = BigInt(amount);
        const minBetSompi = BigInt(MIN_BET_KAS * 100000000);
        if (amountBigInt < minBetSompi) {
            return NextResponse.json(
                { success: false, error: `Minimum bet is ${MIN_BET_KAS} KAS` },
                { status: 400 }
            );
        }

        // Get bot match from database
        const match = await getBotMatch(matchId);
        if (!match) {
            return NextResponse.json(
                { success: false, error: "Bot match not found" },
                { status: 404 }
            );
        }

        // Check if betting is open
        if (!isBettingOpen(match)) {
            const status = getBettingStatus(match);
            return NextResponse.json(
                {
                    success: false,
                    error: status.reason || "Betting is closed",
                    bettingStatus: status,
                },
                { status: 400 }
            );
        }

        // Calculate fee (1%)
        const feePaid = amountBigInt * BigInt(HOUSE_FEE_PERCENT) / BigInt(100);
        const netAmount = amountBigInt - feePaid;

        // Store the bet in the database
        const supabase = await createSupabaseServerClient();
        const db = supabase as any;

        // Get or create betting pool for this match
        let poolId: string;
        const { data: existingPool, error: poolFetchError } = await db
            .from("bot_betting_pools")
            .select("id, status")
            .eq("bot_match_id", matchId)
            .single();

        if (poolFetchError && poolFetchError.code !== "PGRST116") {
            console.error("Error fetching pool:", poolFetchError);
            return NextResponse.json(
                { success: false, error: "Failed to fetch betting pool" },
                { status: 500 }
            );
        }

        if (existingPool) {
            // Check if pool is still open
            if (existingPool.status !== "open") {
                return NextResponse.json(
                    { success: false, error: "Betting pool is closed" },
                    { status: 400 }
                );
            }
            poolId = existingPool.id;
        } else {
            // Create new pool
            const { data: newPool, error: poolCreateError } = await db
                .from("bot_betting_pools")
                .insert({
                    bot_match_id: matchId,
                    bot1_character_id: match.bot1CharacterId,
                    bot2_character_id: match.bot2CharacterId,
                    bot1_total: 0,
                    bot2_total: 0,
                    total_pool: 0,
                    total_fees: 0,
                    status: "open",
                    betting_closes_at_turn: match.bettingClosesAtTurn,
                    match_created_at: new Date(match.createdAt).toISOString(),
                })
                .select("id")
                .single();

            if (poolCreateError) {
                // Another request might have created the pool - try fetching again
                const { data: retryPool } = await db
                    .from("bot_betting_pools")
                    .select("id, status")
                    .eq("bot_match_id", matchId)
                    .single();

                if (!retryPool) {
                    console.error("Error creating pool:", poolCreateError);
                    return NextResponse.json(
                        { success: false, error: "Failed to create betting pool" },
                        { status: 500 }
                    );
                }
                
                if (retryPool.status !== "open") {
                    return NextResponse.json(
                        { success: false, error: "Betting pool is closed" },
                        { status: 400 }
                    );
                }
                poolId = retryPool.id;
            } else {
                poolId = newPool.id;
            }
        }

        // Insert the bet (triggers will auto-update pool totals)
        const { data: bet, error: betError } = await db
            .from("bot_bets")
            .insert({
                pool_id: poolId,
                bettor_address: bettorAddress,
                bet_on: betOn,
                amount: Number(amountBigInt),
                fee_paid: Number(feePaid),
                net_amount: Number(netAmount),
                tx_id: txId,
                status: "confirmed",
            })
            .select("id")
            .single();

        if (betError) {
            // Check for duplicate tx_id
            if (betError.code === "23505") {
                return NextResponse.json(
                    { success: false, error: "This transaction has already been used for a bet" },
                    { status: 400 }
                );
            }
            console.error("Error inserting bet:", betError);
            return NextResponse.json(
                { success: false, error: "Failed to place bet" },
                { status: 500 }
            );
        }

        // Note: Pool totals are updated automatically via database triggers
        // (see migration 011_bot_betting_schema.sql)

        console.log(`[Bot Betting] Bet stored in database:`, {
            betId: bet.id,
            poolId,
            matchId,
            bettorAddress,
            betOn,
            amount: amountBigInt.toString(),
            fee: feePaid.toString(),
            netAmount: netAmount.toString(),
            txId,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            matchId,
            betOn,
            amount: amount,
            feePaid: feePaid.toString(),
            netAmount: netAmount.toString(),
            potentialPayout: (netAmount * BigInt(2)).toString(), // 2x payout
            status: "confirmed",
            message: "Bet placed successfully! If you win, you'll receive 2x your bet.",
        });
    } catch (error) {
        console.error("Error in bot betting place API:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
