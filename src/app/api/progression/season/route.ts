/**
 * Get Current Season API Route
 * Endpoint: GET /api/progression/season
 * Returns the currently active battle pass season
 * 
 * Note: Uses type assertions for battle pass tables until Supabase types are regenerated
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";

// Type definition for battle pass season
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

/**
 * Response for season info.
 */
interface SeasonResponse {
    season: {
        id: string;
        name: string;
        description: string | null;
        startDate: string;
        endDate: string;
        tierCount: number;
        isActive: boolean;
        version: number;
    } | null;
}

/**
 * GET /api/progression/season
 * Get the current active battle pass season.
 */
export async function GET(
    _request: NextRequest
): Promise<NextResponse<SeasonResponse | ApiErrorResponse>> {
    try {
        // Use untyped client for tables not in generated types
        const supabase = createSupabaseAdminClient() as any;

        // Get current active season
        const { data: season, error: seasonError } = await supabase
            .from("battle_pass_seasons")
            .select("*")
            .eq("is_active", true)
            .single() as { data: BattlePassSeasonRow | null; error: any };

        if (seasonError) {
            // No active season is not an error, just return null
            if (seasonError.code === "PGRST116") {
                return NextResponse.json({ season: null });
            }
            throw Errors.badRequest("Failed to fetch season data");
        }

        return NextResponse.json({
            season: season ? {
                id: season.id,
                name: season.name,
                description: season.description,
                startDate: season.start_date,
                endDate: season.end_date,
                tierCount: season.tier_count,
                isActive: season.is_active,
                version: season.version,
            } : null,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
