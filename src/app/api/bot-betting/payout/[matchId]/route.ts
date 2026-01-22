/**
 * Bot Betting Payout API
 * Resolves payouts when a bot match ends - EXACTLY like player matches
 * Called client-side when match finishes (mirrors player match payout flow)
 */

import { NextResponse } from "next/server";
import { resolveBotMatchPayouts } from "@/lib/betting/bot-payout-service";

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ matchId: string }> }
) {
    try {
        const { matchId } = await params;

        console.log(`[BotPayoutAPI] Processing payout for match ${matchId}`);

        // Use the same service that processes bot match payouts (mirrors player match flow)
        const result = await resolveBotMatchPayouts(matchId);

        if (result.success) {
            console.log(`[BotPayoutAPI] ✓ Match ${matchId} payouts completed - ${result.totalPayouts} payouts, ${result.totalAmount} sompi total`);
            return NextResponse.json({
                success: true,
                matchId: result.matchId,
                winner: result.winner,
                totalPayouts: result.totalPayouts,
                totalAmount: result.totalAmount.toString(),
            });
        } else {
            console.error(`[BotPayoutAPI] ✗ Match ${matchId} payout failed:`, result.errors);
            return NextResponse.json(
                { 
                    success: false, 
                    error: result.errors.join(', ') || "Failed to process payouts" 
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("[BotPayoutAPI] Error:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : "Internal server error" 
            },
            { status: 500 }
        );
    }
}

