/**
 * Get Player Progression API Route
 * Endpoint: GET /api/progression/player/[address]
 * Returns the player's battle pass progression
 * 
 * Note: Uses type assertions for battle pass tables until Supabase types are regenerated
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { calculateTierProgress } from "@/lib/progression/xp-calculator";

// Type definitions for battle pass tables
interface BattlePassSeasonRow {
    id: string;
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
    last_prestige_date: string | null;
    created_at: string;
    updated_at: string;
    claimed_tiers?: number[];
}

interface PlayerCurrencyRow {
    clash_shards: number;
    total_earned: number;
    total_spent: number;
}

/**
 * Response for player progression.
 */
interface PlayerProgressionResponse {
    progression: (PlayerProgressionRow & {
        tier_progress: {
            currentXP: number;
            xpRequired: number;
            progressPercentage: number;
        };
    }) | null;
    currency: {
        clash_shards: number;
        total_earned: number;
        total_spent: number;
    } | null;
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
 * GET /api/progression/player/[address]
 * Get player's battle pass progression.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ address: string }> }
): Promise<NextResponse<PlayerProgressionResponse | ApiErrorResponse>> {
    try {
        const { address } = await context.params;

        // Validate address
        if (!address) {
            throw Errors.badRequest("Address is required");
        }

        if (!isValidKaspaAddress(address)) {
            throw Errors.invalidAddress(address);
        }

        // Use untyped client for tables not in generated types
        const supabase = createSupabaseAdminClient() as any;

        // Get current active season
        const { data: season, error: seasonError } = await supabase
            .from("battle_pass_seasons")
            .select("id")
            .eq("is_active", true)
            .single() as { data: BattlePassSeasonRow | null; error: any };

        if (seasonError || !season) {
            return NextResponse.json({ progression: null, currency: null });
        }

        // Get player progression
        const { data: progression, error: progressionError } = await supabase
            .from("player_progression")
            .select("*")
            .eq("player_id", address)
            .eq("season_id", season.id)
            .single() as { data: PlayerProgressionRow | null; error: any };

        // Get player currency
        const { data: currency } = await supabase
            .from("player_currency")
            .select("clash_shards, total_earned, total_spent")
            .eq("player_id", address)
            .single() as { data: PlayerCurrencyRow | null; error: any };

        if (progressionError || !progression) {
            // No progression exists yet - create default
            const { data: newProgression, error: createError } = await supabase
                .from("player_progression")
                .insert({
                    player_id: address,
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
                return NextResponse.json({ progression: null, currency: null });
            }

            return NextResponse.json({
                progression: {
                    ...newProgression,
                    tier_progress: {
                        currentXP: 0,
                        xpRequired: 1000,
                        progressPercentage: 0,
                    },
                },
                currency: currency || { clash_shards: 0, total_earned: 0, total_spent: 0 },
            });
        }

        // Calculate tier progress
        const tierProgress = calculateTierProgress(
            progression.total_xp,
            progression.current_tier
        );

        return NextResponse.json({
            progression: {
                ...progression,
                tier_progress: tierProgress,
            },
            currency: currency || { clash_shards: 0, total_earned: 0, total_spent: 0 },
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
