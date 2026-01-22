/**
 * Bot Betting Place API
 * Place a bet on a bot match
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    getBotMatch,
    isBettingOpen,
    getBettingStatus,
} from "@/lib/game/bot-match-service";
import {
    calculateFee,
    calculateNetAmount,
    MIN_BET_SOMPI,
} from "@/lib/betting/betting-service";

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

        // Validate amount
        const amountBigInt = BigInt(amount);
        if (amountBigInt < MIN_BET_SOMPI) {
            return NextResponse.json(
                { success: false, error: "Bet amount too low (min 1 KAS)" },
                { status: 400 }
            );
        }

        // Get bot match
        const match = getBotMatch(matchId);
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

        // Calculate fee and net amount
        const feePaid = calculateFee(amountBigInt);
        const netAmount = calculateNetAmount(amountBigInt);

        const supabase = await createSupabaseServerClient();
        const db = supabase as any; // Type assertion for new tables

        // Ensure pool exists (create if not)
        let { data: poolData, error: poolError } = await db
            .from("bot_betting_pools")
            .select("id")
            .eq("bot_match_id", matchId)
            .single();

        if (poolError && poolError.code === "PGRST116") {
            // Create pool
            const { data: newPool, error: createError } = await db
                .from("bot_betting_pools")
                .insert({
                    bot_match_id: matchId,
                    bot1_character_id: match.bot1CharacterId,
                    bot2_character_id: match.bot2CharacterId,
                    betting_closes_at_turn: match.bettingClosesAtTurn,
                    match_created_at: new Date(match.createdAt).toISOString(),
                })
                .select("id")
                .single();

            if (createError) {
                console.error("Error creating bot betting pool:", createError);
                return NextResponse.json(
                    { success: false, error: "Failed to create betting pool" },
                    { status: 500 }
                );
            }
            poolData = newPool;
        } else if (poolError) {
            console.error("Error fetching bot betting pool:", poolError);
            return NextResponse.json(
                { success: false, error: "Failed to fetch pool" },
                { status: 500 }
            );
        }

        // Insert bet
        const { data: betData, error: betError } = await db
            .from("bot_bets")
            .insert({
                pool_id: poolData?.id,
                bettor_address: bettorAddress,
                bet_on: betOn,
                amount: Number(amountBigInt),
                fee_paid: Number(feePaid),
                net_amount: Number(netAmount),
                tx_id: txId,
                status: "pending",
            })
            .select("id")
            .single();

        if (betError) {
            if (betError.code === "23505") { // Unique violation
                return NextResponse.json(
                    { success: false, error: "Bet with this transaction already exists" },
                    { status: 400 }
                );
            }
            console.error("Error inserting bet:", betError);
            return NextResponse.json(
                { success: false, error: "Failed to place bet" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            betId: betData.id,
            matchId,
            betOn,
            amount: amount,
            feePaid: feePaid.toString(),
            netAmount: netAmount.toString(),
            status: "pending",
        });
    } catch (error) {
        console.error("Error in bot betting place API:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
