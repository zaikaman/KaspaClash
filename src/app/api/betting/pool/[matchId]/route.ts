/**
 * GET /api/betting/pool/[matchId]
 * Get betting pool status and current odds for a match
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import {
    calculateOdds,
    transformPoolFromDb,
    sompiToKas,
    shouldLockBetting,
    getBettingLockReason,
} from "@/lib/betting/betting-service";

interface RouteParams {
    params: Promise<{ matchId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { matchId } = await params;
        const supabase = await createSupabaseServerClient();

        // Get match data first
        const { data: match, error: matchError } = await supabase
            .from("matches")
            .select("id, status, format, player1_rounds_won, player2_rounds_won")
            .eq("id", matchId)
            .single();

        if (matchError || !match) {
            return createErrorResponse(
                new ApiError(ErrorCodes.MATCH_NOT_FOUND, "Match not found")
            );
        }

        // Check if betting should be locked
        const format = match.format as 'best_of_3' | 'best_of_5';
        const isLocked = shouldLockBetting(
            match.status,
            match.player1_rounds_won,
            match.player2_rounds_won,
            format
        );
        const lockReason = getBettingLockReason(
            match.status,
            match.player1_rounds_won,
            match.player2_rounds_won,
            format
        );

        // Fetch or create betting pool for this match
        let { data: pool, error } = await (supabase
            .from("betting_pools" as any)
            .select("*")
            .eq("match_id", matchId)
            .single() as any);

        // If no pool exists, create one (if betting is allowed)
        if (error?.code === 'PGRST116') { // No rows returned
            if (match.status !== "in_progress" && match.status !== "character_select") {
                return createErrorResponse(
                    new ApiError(ErrorCodes.BAD_REQUEST, "Betting not available for this match")
                );
            }

            // Create new pool
            const { data: newPool, error: createError } = await (supabase
                .from("betting_pools" as any)
                .insert({
                    match_id: matchId,
                    status: isLocked ? "locked" : "open",
                })
                .select()
                .single() as any);

            if (createError) {
                console.error("Error creating betting pool:", createError);
                return createErrorResponse(
                    new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to create betting pool")
                );
            }

            pool = newPool;
        } else if (error) {
            console.error("Error fetching betting pool:", error);
            return createErrorResponse(
                new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to fetch betting pool")
            );
        }

        // If pool was open but should now be locked, update it
        if (pool.status === 'open' && isLocked) {
            await (supabase
                .from("betting_pools" as any)
                .update({ status: 'locked', locked_at: new Date().toISOString() })
                .eq("id", pool.id) as any);
            pool.status = 'locked';
        }

        // Transform and calculate odds
        const poolData = transformPoolFromDb(pool);
        const odds = calculateOdds(poolData);

        return NextResponse.json({
            pool: {
                id: pool.id,
                matchId: pool.match_id,
                status: pool.status,
                player1Total: pool.player1_total.toString(),
                player2Total: pool.player2_total.toString(),
                totalPool: pool.total_pool.toString(),
                player1TotalKas: sompiToKas(BigInt(pool.player1_total)),
                player2TotalKas: sompiToKas(BigInt(pool.player2_total)),
                totalPoolKas: sompiToKas(BigInt(pool.total_pool)),
            },
            odds: {
                player1: odds.player1Odds,
                player2: odds.player2Odds,
                player1Percentage: odds.player1Percentage,
                player2Percentage: odds.player2Percentage,
            },
            isOpen: pool.status === "open" && !isLocked,
            isLocked,
            lockReason,
            match: {
                status: match.status,
                player1RoundsWon: match.player1_rounds_won,
                player2RoundsWon: match.player2_rounds_won,
                format,
            },
        });
    } catch (error) {
        console.error("Betting pool endpoint error:", error);
        return createErrorResponse(
            new ApiError(ErrorCodes.INTERNAL_ERROR, "Internal server error")
        );
    }
}

