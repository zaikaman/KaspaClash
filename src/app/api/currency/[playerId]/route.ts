/**
 * Get Player Currency API Route
 * Endpoint: GET /api/currency/[playerId]
 * Lightweight endpoint to fetch only currency data (no progression)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ playerId: string }> }
): Promise<NextResponse> {
    try {
        const { playerId } = await context.params;

        if (!playerId) {
            return NextResponse.json(
                { error: "Player ID is required" },
                { status: 400 }
            );
        }

        const supabase = createSupabaseAdminClient() as any; // Type assertion for player_currency table

        // Fetch only currency data
        const { data: currency, error } = await supabase
            .from("player_currency")
            .select("clash_shards, total_earned, total_spent")
            .eq("player_id", playerId)
            .single();

        if (error) {
            // If no currency record exists, return default values
            if (error.code === 'PGRST116') {
                return NextResponse.json({
                    clash_shards: 0,
                    total_earned: 0,
                    total_spent: 0,
                });
            }
            throw error;
        }

        const response = NextResponse.json(currency || {
            clash_shards: 0,
            total_earned: 0,
            total_spent: 0,
        });

        // Cache for 10 seconds (short cache since Realtime handles updates)
        response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');

        return response;
    } catch (error) {
        console.error("[Currency API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch currency" },
            { status: 500 }
        );
    }
}
