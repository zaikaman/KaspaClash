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

        // Create bot player profile first (required for foreign key constraint)
        const { error: profileError } = await supabase
            .from("players")
            .upsert({
                address: player2Address,
                display_name: player2Name,
                rating: 1000 + Math.floor(Math.random() * 500), // Random rating 1000-1500
            }, {
                onConflict: "address",
                ignoreDuplicates: true,
            });

        if (profileError) {
            console.error("[create-bot-match] Error creating bot profile:", profileError);
            return NextResponse.json(
                { error: "Failed to create bot profile" },
                { status: 500 }
            );
        }

        // Pick a random character for the bot
        const botCharacters = [
            "cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter",
            "gene-smasher", "neon-wraith", "sonic-striker", "heavy-loader",
            "technomancer", "prism-duelist", "nano-brawler", "scrap-goliath",
            "razor-bot-7", "viperblade", "void-reaper", "kitsune-09",
            "chrono-drifter", "cyber-paladin", "aeon-guard", "bastion-hulk"
        ];
        const botCharacterId = botCharacters[Math.floor(Math.random() * botCharacters.length)];

        // Create match entry with bot character already selected
        const { data: match, error: matchError } = await supabase
            .from("matches")
            .insert({
                player1_address: player1Address,
                player2_address: player2Address,
                player2_character_id: botCharacterId,
                format: "best_of_5",
                status: "character_select",
                selection_deadline_at: new Date(Date.now() + 30000).toISOString(), // 30 seconds
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
