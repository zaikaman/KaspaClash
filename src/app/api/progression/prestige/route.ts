/**
 * POST /api/progression/prestige
 * Execute prestige for a player at tier 50
 * Resets tier to 1, increments prestige level, grants exclusive rewards
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { executePrestige, validatePrestigeEligibility } from "@/lib/progression/prestige-handler";
import { getPrestigeTierInfo, getPrestigeBonusDisplay } from "@/lib/progression/prestige-calculator";
import type { PrestigeStatus } from "@/types/progression";

/**
 * Request body for prestige
 */
interface PrestigeRequest {
    playerId: string;
}

/**
 * Response for prestige
 */
interface PrestigeResponse {
    success: boolean;
    prestige: {
        previousLevel: number;
        newLevel: number;
        xpMultiplier: number;
        currencyMultiplier: number;
        xpBonusFormatted: string;
        currencyBonusFormatted: string;
        tier: {
            name: string;
            color: string;
            icon: string;
        };
    };
    rewards: {
        badge?: string;
        profileBorder?: string;
        aura?: string;
        title?: string;
        cosmetics?: string[];
    };
    message: string;
}

/**
 * Validate Kaspa address format
 */
function isValidKaspaAddress(address: string): boolean {
    return (
        typeof address === "string" &&
        (address.startsWith("kaspa:") || address.startsWith("kaspatest:")) &&
        address.length >= 40
    );
}

/**
 * POST /api/progression/prestige
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<PrestigeResponse | ApiErrorResponse>> {
    try {
        // Parse request body
        const body = await request.json() as PrestigeRequest;
        const { playerId } = body;

        // Validate required fields
        if (!playerId) {
            throw Errors.badRequest("playerId is required");
        }

        if (!isValidKaspaAddress(playerId)) {
            throw Errors.invalidAddress(playerId);
        }

        // Validate eligibility first
        const validation = await validatePrestigeEligibility(playerId);
        if (!validation.eligible) {
            throw Errors.badRequest(validation.error || "Not eligible for prestige");
        }

        // Execute prestige
        const result = await executePrestige(playerId);

        if (!result.success) {
            throw Errors.badRequest(result.error || "Failed to execute prestige");
        }

        // Get display info for new prestige level
        const tierInfo = getPrestigeTierInfo(result.newLevel);
        const bonusDisplay = getPrestigeBonusDisplay(result.newLevel);

        return NextResponse.json({
            success: true,
            prestige: {
                previousLevel: result.previousLevel,
                newLevel: result.newLevel,
                xpMultiplier: result.xpMultiplier,
                currencyMultiplier: result.currencyMultiplier,
                xpBonusFormatted: bonusDisplay.xpBonusFormatted,
                currencyBonusFormatted: bonusDisplay.currencyBonusFormatted,
                tier: {
                    name: tierInfo.tier,
                    color: tierInfo.color,
                    icon: tierInfo.icon,
                },
            },
            rewards: result.rewards,
            message: `Congratulations! You've reached Prestige ${result.newLevel} (${tierInfo.tier})!`,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
