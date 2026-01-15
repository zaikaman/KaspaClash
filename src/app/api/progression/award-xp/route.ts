/**
 * Award XP API Route
 * Endpoint: POST /api/progression/award-xp
 * Awards XP to a player and handles tier unlocks
 * 
 * Note: Uses type assertions for battle pass tables until Supabase types are regenerated
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import {
    calculateTierFromXP,
    calculateTierProgress,
    applyPrestigeMultiplier,
} from "@/lib/progression/xp-calculator";
import { getTierRewards } from "@/lib/progression/tier-rewards";
import { CURRENCY_SOURCES } from "@/lib/progression/currency-utils";
import type { XPSource, TierReward } from "@/types/progression";

/**
 * Request body for awarding XP.
 */
interface AwardXPRequest {
    playerId: string;
    amount: number;
    source: XPSource;
    sourceId?: string;
}

/**
 * Response for XP award.
 */
interface AwardXPResponse {
    success: boolean;
    xpAwarded: number;
    prestigeMultiplier: number;
    finalXP: number;
    newTotalXP: number;
    previousTier: number;
    newTier: number;
    tiersUnlocked: number;
    rewards: TierReward[];
    currencyAwarded: number;
    cosmeticsAwarded: string[];
    currentProgress: {
        currentXP: number;
        xpRequired: number;
        progressPercentage: number;
    };
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

/**
 * Valid XP sources.
 */
const VALID_XP_SOURCES: XPSource[] = [
    "match_win",
    "match_loss",
    "match_draw",
    "daily_quest",
    "achievement",
    "survival_mode",
    "combo_challenge",
];

// Type definitions for battle pass tables (until Supabase types are regenerated)
interface BattlePassSeasonRow {
    id: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string;
    tier_count: number;
    is_active: boolean;
    version: number;
}

interface PlayerProgressionRow {
    id: string;
    player_id: string;
    season_id: string;
    current_tier: number;
    current_xp: number;
    total_xp: number;
    prestige_level: number;
    prestige_xp_multiplier: number;
    prestige_currency_multiplier: number;
}

interface PlayerCurrencyRow {
    player_id: string;
    clash_shards: number;
    total_earned: number;
    total_spent: number;
}

/**
 * POST /api/progression/award-xp
 * Award XP to a player and handle tier progression.
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<AwardXPResponse | ApiErrorResponse>> {
    try {
        // Parse request body
        const body = await request.json() as AwardXPRequest;
        const { playerId, amount, source, sourceId } = body;

        // Validate required fields
        if (!playerId) {
            throw Errors.badRequest("playerId is required");
        }

        if (!isValidKaspaAddress(playerId)) {
            throw Errors.invalidAddress(playerId);
        }

        if (!amount || typeof amount !== "number" || amount <= 0) {
            throw Errors.badRequest("amount must be a positive number");
        }

        if (amount > 10000) {
            throw Errors.badRequest("amount cannot exceed 10000 XP per award");
        }

        if (!source || !VALID_XP_SOURCES.includes(source)) {
            throw Errors.badRequest(`source must be one of: ${VALID_XP_SOURCES.join(", ")}`);
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
        let { data: progression, error: progressionError } = await supabase
            .from("player_progression")
            .select("*")
            .eq("player_id", playerId)
            .eq("season_id", season.id)
            .single() as { data: PlayerProgressionRow | null; error: any };

        // If no progression exists, create one
        if (progressionError || !progression) {
            const { data: newProgression, error: createError } = await supabase
                .from("player_progression")
                .insert({
                    player_id: playerId,
                    season_id: season.id,
                    current_tier: 1,
                    current_xp: 0,
                    total_xp: 0,
                    prestige_level: 0,
                    prestige_xp_multiplier: 1.0,
                    prestige_currency_multiplier: 1.0,
                })
                .select()
                .single() as { data: PlayerProgressionRow | null; error: any };

            if (createError || !newProgression) {
                throw Errors.badRequest("Failed to create player progression");
            }

            progression = newProgression;
        }

        // Calculate XP with prestige multiplier
        const prestigeLevel = progression.prestige_level || 0;
        const finalXP = applyPrestigeMultiplier(amount, prestigeLevel);
        const prestigeMultiplier = Math.pow(1.1, prestigeLevel);

        // Calculate new tier
        const previousTier = progression.current_tier;
        const newTotalXP = progression.total_xp + finalXP;
        const newTier = Math.min(50, calculateTierFromXP(newTotalXP));
        const tiersUnlocked = newTier - previousTier;

        // Collect rewards for unlocked tiers
        const allRewards: TierReward[] = [];
        let currencyAwarded = 0;
        const cosmeticsAwarded: string[] = [];

        for (let tier = previousTier + 1; tier <= newTier; tier++) {
            const tierRewards = getTierRewards(tier, false); // isPremium = false
            allRewards.push(...tierRewards);

            // Process rewards immediately
            for (const reward of tierRewards) {
                if (reward.type === "currency" && reward.currencyAmount) {
                    currencyAwarded += reward.currencyAmount;
                } else if (reward.type === "cosmetic" && reward.itemId) {
                    cosmeticsAwarded.push(reward.itemId);
                }
            }
        }

        // Update player progression
        const tierProgress = calculateTierProgress(newTotalXP, newTier);

        const { error: updateError } = await supabase
            .from("player_progression")
            .update({
                current_tier: newTier,
                current_xp: tierProgress.currentXP,
                total_xp: newTotalXP,
                updated_at: new Date().toISOString(),
            })
            .eq("id", progression.id);

        if (updateError) {
            throw Errors.badRequest("Failed to update player progression");
        }

        // Record XP award
        await supabase.from("xp_awards").insert({
            player_id: playerId,
            season_id: season.id,
            amount,
            source,
            source_id: sourceId || null,
            multiplier: prestigeMultiplier,
            final_amount: finalXP,
        });

        // Update player currency if currency was awarded
        if (currencyAwarded > 0) {
            // Apply prestige currency multiplier
            const prestigeCurrencyMultiplier = progression.prestige_currency_multiplier || Math.pow(1.1, prestigeLevel);
            const finalCurrencyAwarded = Math.floor(currencyAwarded * prestigeCurrencyMultiplier);

            // Get current currency
            const { data: currencyData } = await supabase
                .from("player_currency")
                .select("*")
                .eq("player_id", playerId)
                .single() as { data: PlayerCurrencyRow | null; error: any };

            const currentBalance = currencyData?.clash_shards || 0;
            const newBalance = currentBalance + finalCurrencyAwarded;

            if (currencyData) {
                await supabase
                    .from("player_currency")
                    .update({
                        clash_shards: newBalance,
                        total_earned: (currencyData.total_earned || 0) + finalCurrencyAwarded,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("player_id", playerId);
            } else {
                await supabase.from("player_currency").insert({
                    player_id: playerId,
                    clash_shards: finalCurrencyAwarded,
                    total_earned: finalCurrencyAwarded,
                    total_spent: 0,
                });
            }

            // Record currency transaction
            await supabase.from("currency_transactions").insert({
                player_id: playerId,
                amount: finalCurrencyAwarded,
                transaction_type: "earn",
                source: CURRENCY_SOURCES.TIER_UNLOCK,
                balance_before: currentBalance,
                balance_after: newBalance,
                metadata: { 
                    tiers_unlocked: tiersUnlocked, 
                    source: "battle_pass",
                    base_amount: currencyAwarded,
                    prestige_multiplier: prestigeCurrencyMultiplier,
                },
            });
        }

        // Add cosmetics to player inventory
        for (const cosmeticId of cosmeticsAwarded) {
            // Check if cosmetic exists in cosmetic_items table
            const { data: cosmetic } = await supabase
                .from("cosmetic_items")
                .select("id")
                .eq("id", cosmeticId)
                .single();

            if (cosmetic) {
                // Check if player already owns it
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
            xpAwarded: amount,
            prestigeMultiplier,
            finalXP,
            newTotalXP,
            previousTier,
            newTier,
            tiersUnlocked,
            rewards: allRewards,
            currencyAwarded,
            cosmeticsAwarded,
            currentProgress: {
                currentXP: tierProgress.currentXP,
                xpRequired: tierProgress.xpRequired,
                progressPercentage: tierProgress.progressPercentage,
            },
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
