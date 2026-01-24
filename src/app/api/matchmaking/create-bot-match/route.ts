/**
 * API Route: Create Bot Match
 * Creates a fake match entry with a bot opponent when queue timeout occurs
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { player1Address, player2Address, player2Name } = await request.json();

        if (!player1Address || !player2Address || !player2Name) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create match entry
        const { data: match, error: matchError } = await supabase
            .from("matches")
            .insert({
                player1_address: player1Address,
                player2_address: player2Address,
                format: "best_of_3",
                status: "character_selection",
                selection_deadline_at: new Date(Date.now() + 60000).toISOString(), // 60 seconds
            })
            .select()
            .single();

        if (matchError || !match) {
            console.error("[create-bot-match] Error creating match:", matchError);
            return NextResponse.json(
                { error: "Failed to create match" },
                { status: 500 }
            );
        }

        // Create fake player profile for bot if it doesn't exist
        const { error: profileError } = await supabase
            .from("players")
            .upsert({
                address: player2Address,
                display_name: player2Name,
                rating: 1000 + Math.floor(Math.random() * 500), // Random rating 1000-1500
                is_bot: true, // Mark as bot
            }, {
                onConflict: "address",
                ignoreDuplicates: true,
            });

        if (profileError) {
            console.error("[create-bot-match] Error creating bot profile:", profileError);
            // Not critical, continue anyway
        }

        return NextResponse.json({
            matchId: match.id,
            success: true,
        });
    } catch (error) {
        console.error("[create-bot-match] Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
