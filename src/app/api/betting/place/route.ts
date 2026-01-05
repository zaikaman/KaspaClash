/**
 * POST /api/betting/place
 * Place a bet on a match
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import {
    calculateFee,
    calculateNetAmount,
    MIN_BET_SOMPI,
} from "@/lib/betting/betting-service";

interface PlaceBetRequest {
    matchId: string;
    betOn: 'player1' | 'player2';
    amount: string; // sompi as string (bigint)
    txId: string;
    bettorAddress: string;
}

export async function POST(request: Request) {
    try {
        const body: PlaceBetRequest = await request.json();
        const { matchId, betOn, amount, txId, bettorAddress } = body;

        // Validate input
        if (!matchId || !betOn || !amount || !txId || !bettorAddress) {
            return createErrorResponse(
                new ApiError(ErrorCodes.BAD_REQUEST, "Missing required fields")
            );
        }

        if (betOn !== 'player1' && betOn !== 'player2') {
            return createErrorResponse(
                new ApiError(ErrorCodes.BAD_REQUEST, "betOn must be 'player1' or 'player2'")
            );
        }

        const amountBigInt = BigInt(amount);
        if (amountBigInt < MIN_BET_SOMPI) {
            return createErrorResponse(
                new ApiError(ErrorCodes.BAD_REQUEST, "Minimum bet is 1 KAS")
            );
        }

        const supabase = await createSupabaseServerClient();

        // Get or create betting pool
        let { data: pool, error: poolError } = await (supabase
            .from("betting_pools" as any)
            .select("*")
            .eq("match_id", matchId)
            .single() as any);

        if (poolError?.code === 'PGRST116') {
            // Create pool if doesn't exist
            const { data: newPool, error: createError } = await (supabase
                .from("betting_pools" as any)
                .insert({ match_id: matchId, status: "open" })
                .select()
                .single() as any);

            if (createError) {
                return createErrorResponse(
                    new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to create betting pool")
                );
            }
            pool = newPool;
        } else if (poolError) {
            return createErrorResponse(
                new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to fetch betting pool")
            );
        }

        // Check if pool is open
        if (pool.status !== 'open') {
            return createErrorResponse(
                new ApiError(ErrorCodes.BAD_REQUEST, "Betting is closed for this match")
            );
        }

        // Check if tx already used
        const { data: existingBet } = await (supabase
            .from("bets" as any)
            .select("id")
            .eq("tx_id", txId)
            .single() as any);

        if (existingBet) {
            return createErrorResponse(
                new ApiError(ErrorCodes.BAD_REQUEST, "This transaction has already been used")
            );
        }

        // Calculate fee and net amount
        const fee = calculateFee(amountBigInt);
        const netAmount = calculateNetAmount(amountBigInt);

        // Insert the bet
        const { data: bet, error: betError } = await (supabase
            .from("bets" as any)
            .insert({
                pool_id: pool.id,
                bettor_address: bettorAddress,
                bet_on: betOn,
                amount: amount,
                fee_paid: fee.toString(),
                net_amount: netAmount.toString(),
                tx_id: txId,
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
            })
            .select()
            .single() as any);

        if (betError) {
            console.error("Error placing bet:", betError);
            return createErrorResponse(
                new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to place bet")
            );
        }

        // Update pool totals
        const updateField = betOn === 'player1' ? 'player1_total' : 'player2_total';
        const { error: updateError } = await (supabase as any).rpc('increment_pool_totals', {
            p_pool_id: pool.id,
            p_player1_add: betOn === 'player1' ? netAmount.toString() : '0',
            p_player2_add: betOn === 'player2' ? netAmount.toString() : '0',
            p_fee_add: fee.toString(),
        });

        // Fallback: direct update if RPC doesn't exist
        if (updateError) {
            const newPlayer1Total = betOn === 'player1'
                ? BigInt(pool.player1_total) + netAmount
                : BigInt(pool.player1_total);
            const newPlayer2Total = betOn === 'player2'
                ? BigInt(pool.player2_total) + netAmount
                : BigInt(pool.player2_total);

            await (supabase
                .from("betting_pools" as any)
                .update({
                    player1_total: newPlayer1Total.toString(),
                    player2_total: newPlayer2Total.toString(),
                    total_pool: (newPlayer1Total + newPlayer2Total).toString(),
                    total_fees: (BigInt(pool.total_fees) + fee).toString(),
                })
                .eq("id", pool.id) as any);
        }

        return NextResponse.json({
            success: true,
            bet: {
                id: bet.id,
                betOn: bet.bet_on,
                amount: bet.amount,
                feePaid: bet.fee_paid,
                netAmount: bet.net_amount,
                status: bet.status,
            },
        });
    } catch (error) {
        console.error("Place bet endpoint error:", error);
        return createErrorResponse(
            new ApiError(ErrorCodes.INTERNAL_ERROR, "Internal server error")
        );
    }
}
