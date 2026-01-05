/**
 * POST /api/betting/payout/[matchId]
 * Process payouts for a completed match
 * Called when match ends to distribute winnings to bettors
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import {
    transformPoolFromDb,
    transformBetFromDb,
} from "@/lib/betting/betting-service";
import { processPoolPayouts } from "@/lib/betting/payout-service";

interface RouteParams {
    params: Promise<{ matchId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { matchId } = await params;
        const supabase = await createSupabaseServerClient();

        // Get the match to verify it exists
        const { data: match, error: matchError } = await supabase
            .from("matches")
            .select("id, status")
            .eq("id", matchId)
            .single();

        if (matchError || !match) {
            return createErrorResponse(
                new ApiError(ErrorCodes.MATCH_NOT_FOUND, "Match not found")
            );
        }

        // We allow Calling this even if already resolved (helper handles idempotency),
        // but it must be completed.
        if (match.status !== "completed") {
            return createErrorResponse(
                new ApiError(ErrorCodes.BAD_REQUEST, "Match is not completed yet")
            );
        }

        const { resolveMatchPayouts } = await import("@/lib/betting/payout-service");
        await resolveMatchPayouts(matchId);

        return NextResponse.json({
            success: true,
            message: "Payout process triggered",
            matchId
        });
    } catch (error) {
        console.error("Payout endpoint error:", error);
        return createErrorResponse(
            new ApiError(ErrorCodes.INTERNAL_ERROR, "Internal server error")
        );
    }
}
