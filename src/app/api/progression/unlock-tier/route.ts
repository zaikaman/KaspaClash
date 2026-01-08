/**
 * Unlock Tier API Route
 * Endpoint: POST /api/progression/unlock-tier
 * Manually unlocks a specific tier for a player (edge case handling)
 * 
 * Note: Uses type assertions for battle pass tables until Supabase types are regenerated
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { getTierRewards } from "@/lib/progression/tier-rewards";
import { CURRENCY_SOURCES } from "@/lib/progression/currency-utils";
import type { TierReward } from "@/types/progression";

/**
 * Request body for unlocking a tier.
 */
interface UnlockTierRequest {
    playerId: string;
    tier: number;
}

/**
 * Response for tier unlock.
 */
interface UnlockTierResponse {
    success: boolean;
    tier: number;
    rewards: TierReward[];
    currencyAwarded: number;
    cosmeticsAwarded: string[];
    badgesAwarded: string[];
}

/**
 * Validate Kaspa address format.
 */
function isValidKaspaAddress(address: string): boolean {
    return (
        typeof address === "string" &&
        (address.startsWith("kaspa:") || address.startsWith("kaspatest:")) &&
        address.length >= 40
    );
}

// Type definitions for battle pass tables
interface BattlePassSeasonRow {
    id: string;
    name: string;
    is_active: boolean;
}

interface PlayerProgressionRow {
    id: string;
    player_id: string;
    season_id: string;
    current_tier: number;
}

interface PlayerCurrencyRow {
    player_id: string;
    clash_shards: number;
    total_earned: number;
    total_spent: number;
}

/**
 * POST /api/progression/unlock-tier
 * Manually unlock a tier for a player.
 * Used for edge cases like missed tier rewards or admin corrections.
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<UnlockTierResponse | ApiErrorResponse>> {
    try {
        // Parse request body
        const body = await request.json() as UnlockTierRequest;
        const { playerId, tier } = body;

        // Validate required fields
        if (!playerId) {
            throw Errors.badRequest("playerId is required");
        }

        if (!isValidKaspaAddress(playerId)) {
            throw Errors.invalidAddress(playerId);
        }

        if (!tier || typeof tier !== "number" || tier < 1 || tier > 50) {
            throw Errors.badRequest("tier must be a number between 1 and 50");
        }

        // Use untyped client for tables not in generated types
        const supabase = createSupabaseAdminClient() as any;

        // Get current active season
        const { data: season, error: seasonError } = await supabase
            .from("battle_pass_seasons")
            .select("*")
            .eq("is_active", true)
            .single() as { data: BattlePassSeasonRow | null; error: any };

        if (seasonError || !season) {
            throw Errors.notFound("Active battle pass season");
        }

        // Get player's current progression
        const { data: progression, error: progressionError } = await supabase
            .from("player_progression")
            .select("*")
            .eq("player_id", playerId)
            .eq("season_id", season.id)
            .single() as { data: PlayerProgressionRow | null; error: any };

        if (progressionError || !progression) {
            throw Errors.notFound("Player progression");
        }

        // Validate tier is higher than current
        if (tier <= progression.current_tier) {
            throw Errors.badRequest(`Player is already at tier ${progression.current_tier}. Cannot unlock tier ${tier}.`);
        }

        // Get rewards for the specific tier
        const tierRewards = getTierRewards(tier, false); // isPremium = false

        // Process rewards
        let currencyAwarded = 0;
        const cosmeticsAwarded: string[] = [];
        const badgesAwarded: string[] = [];

        for (const reward of tierRewards) {
            if (reward.type === "currency" && reward.currencyAmount) {
                currencyAwarded += reward.currencyAmount;
            } else if (reward.type === "cosmetic" && reward.itemId) {
                cosmeticsAwarded.push(reward.itemId);
            } else if (reward.type === "achievement_badge" && reward.itemId) {
                badgesAwarded.push(reward.itemId);
            }
        }

        // Update player progression to the new tier
        const { error: updateError } = await supabase
            .from("player_progression")
            .update({
                current_tier: tier,
                updated_at: new Date().toISOString(),
            })
            .eq("id", progression.id);

        if (updateError) {
            throw Errors.badRequest("Failed to update player progression");
        }

        // Update player currency if currency was awarded
        if (currencyAwarded > 0) {
            const { data: currencyData } = await supabase
                .from("player_currency")
                .select("*")
                .eq("player_id", playerId)
                .single() as { data: PlayerCurrencyRow | null; error: any };

            const currentBalance = currencyData?.clash_shards || 0;
            const newBalance = currentBalance + currencyAwarded;

            if (currencyData) {
                await supabase
                    .from("player_currency")
                    .update({
                        clash_shards: newBalance,
                        total_earned: (currencyData.total_earned || 0) + currencyAwarded,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("player_id", playerId);
            } else {
                await supabase.from("player_currency").insert({
                    player_id: playerId,
                    clash_shards: currencyAwarded,
                    total_earned: currencyAwarded,
                    total_spent: 0,
                });
            }

            // Record currency transaction
            await supabase.from("currency_transactions").insert({
                player_id: playerId,
                amount: currencyAwarded,
                transaction_type: "earn",
                source: CURRENCY_SOURCES.TIER_UNLOCK,
                balance_before: currentBalance,
                balance_after: newBalance,
                metadata: { tier_unlocked: tier, source: "manual_unlock" },
            });
        }

        // Add cosmetics to player inventory
        for (const cosmeticId of cosmeticsAwarded) {
            const { data: cosmetic } = await supabase
                .from("cosmetic_items")
                .select("id")
                .eq("id", cosmeticId)
                .single();

            if (cosmetic) {
                const { data: existing } = await supabase
                    .from("player_inventory")
                    .select("id")
                    .eq("player_id", playerId)
                    .eq("cosmetic_id", cosmeticId)
                    .single();

                if (!existing) {
                    await supabase.from("player_inventory").insert({
                        player_id: playerId,
                        cosmetic_id: cosmeticId,
                        source: "battle_pass",
                        is_equipped: false,
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            tier,
            rewards: tierRewards,
            currencyAwarded,
            cosmeticsAwarded,
            badgesAwarded,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
