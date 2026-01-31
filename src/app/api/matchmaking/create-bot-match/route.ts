/**
 * API Route: Create Bot Match
 * Creates a fake match entry with a bot opponent when queue timeout occurs
 * 
 * Pre-computes:
 * - Bot's character selection
 * - Bot's character ban
 * - Power surge deck for all rounds
 * - Bot's power surge choices for each round
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRandomPowerSurgeCards, PowerSurgeCardId } from "@/types/power-surge";

/**
 * Generate pre-computed Power Surge deck for all 5 rounds.
 * Each round gets 3 random cards.
 */
function generatePowerSurgeDeck(): Record<string, PowerSurgeCardId[]> {
    const deck: Record<string, PowerSurgeCardId[]> = {};
    for (let round = 1; round <= 5; round++) {
        const cards = getRandomPowerSurgeCards(3);
        deck[round.toString()] = cards.map(c => c.id);
    }
    return deck;
}

/**
 * Generate bot's power surge choices from the pre-computed deck.
 * Bot will randomly pick one of the 3 offered cards for each round.
 */
function generateBotPowerSurgeChoices(
    deck: Record<string, PowerSurgeCardId[]>
): Record<string, PowerSurgeCardId> {
    const choices: Record<string, PowerSurgeCardId> = {};
    for (const [round, cards] of Object.entries(deck)) {
        // Bot randomly picks one of the 3 offered cards
        const randomIndex = Math.floor(Math.random() * cards.length);
        choices[round] = cards[randomIndex];
    }
    return choices;
}

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

        // Fetch player1's rating to match bot rating appropriately
        const { data: player1Data } = await supabase
            .from("players")
            .select("rating")
            .eq("address", player1Address)
            .single();

        const player1Rating = player1Data?.rating || 1000;
        
        // Assign bot a rating within ±100 of player's rating for realistic matchmaking
        const ratingVariation = Math.floor(Math.random() * 201) - 100; // -100 to +100
        const botRating = Math.max(100, Math.min(3000, player1Rating + ratingVariation));

        // Create bot player profile first (required for foreign key constraint)
        const { error: profileError } = await supabase
            .from("players")
            .upsert({
                address: player2Address,
                display_name: player2Name,
                rating: botRating,
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
        
        // Pick a random ban for the bot (different from picked character)
        const availableForBan = botCharacters.filter(c => c !== botCharacterId);
        const botBanId = availableForBan[Math.floor(Math.random() * availableForBan.length)];

        // Pre-compute Power Surge deck and bot's choices
        const powerSurgeDeck = generatePowerSurgeDeck();
        const botPowerSurgeChoices = generateBotPowerSurgeChoices(powerSurgeDeck);
        console.log("[create-bot-match] Generated Power Surge deck:", powerSurgeDeck);
        console.log("[create-bot-match] Bot's Power Surge choices:", botPowerSurgeChoices);

        // Create match entry with bot character, ban, and power surge already selected
        const { data: match, error: matchError } = await supabase
            .from("matches")
            .insert({
                player1_address: player1Address,
                player2_address: player2Address,
                player2_character_id: botCharacterId,
                player2_ban_id: botBanId, // Bot's pre-selected ban
                format: "best_of_5",
                status: "character_select",
                selection_deadline_at: new Date(Date.now() + 30000).toISOString(), // 30 seconds
                is_bot: true, // Mark as bot match
                power_surge_deck: powerSurgeDeck, // Pre-computed deck for all rounds
                bot_power_surge_choices: botPowerSurgeChoices, // Bot's pre-selected choices
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
