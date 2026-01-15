/**
 * GET /api/progression/prestige-status
 * Check player's prestige status and eligibility
 */

import { NextRequest, NextResponse } from "next/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { getPrestigeStatus, validatePrestigeEligibility } from "@/lib/progression/prestige-handler";
import {
    getPrestigeTierInfo,
    getPrestigeBonusDisplay,
    getAccumulatedPrestigeRewards,
    MAX_PRESTIGE_LEVEL,
    PRESTIGE_REQUIRED_TIER,
} from "@/lib/progression/prestige-calculator";
import type { PrestigeStatus } from "@/types/progression";

/**
 * Response for prestige status
 */
interface PrestigeStatusResponse {
    status: {
        level: number;
        maxLevel: number;
        xpMultiplier: number;
        currencyMultiplier: number;
        xpBonusFormatted: string;
        currencyBonusFormatted: string;
        totalResets: number;
        lastPrestigeDate: string | null;
    };
    eligibility: {
        eligible: boolean;
        reason?: string;
        requiredTier: number;
        currentTier?: number;
    };
    tier: {
        name: string;
        color: string;
        cssClass: string;
        icon: string;
    };
    nextTier: {
        name: string;
        color: string;
        cssClass: string;
        icon: string;
        xpBonus: number;
        currencyBonus: number;
    } | null;
    rewards: {
        badges: string[];
        profileBorders: string[];
        auras: string[];
        titles: string[];
        cosmetics: string[];
    };
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
 * GET /api/progression/prestige-status?playerId=kaspa:...
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<PrestigeStatusResponse | ApiErrorResponse>> {
    try {
        // Get playerId from query params
        const { searchParams } = new URL(request.url);
        const playerId = searchParams.get("playerId");

        // Validate required fields
        if (!playerId) {
            throw Errors.badRequest("playerId query parameter is required");
        }

        if (!isValidKaspaAddress(playerId)) {
            throw Errors.invalidAddress(playerId);
        }

        // Get prestige status
        const status = await getPrestigeStatus(playerId);

        // If no status found, return default for new player
        if (!status) {
            const defaultTier = getPrestigeTierInfo(0);
            const nextTier = getPrestigeTierInfo(1);
            const nextBonuses = getPrestigeBonusDisplay(1);

            return NextResponse.json({
                status: {
                    level: 0,
                    maxLevel: MAX_PRESTIGE_LEVEL,
                    xpMultiplier: 1,
                    currencyMultiplier: 1,
                    xpBonusFormatted: "0%",
                    currencyBonusFormatted: "0%",
                    totalResets: 0,
                    lastPrestigeDate: null,
                },
                eligibility: {
                    eligible: false,
                    reason: "Player progression not found. Play some matches first!",
                    requiredTier: PRESTIGE_REQUIRED_TIER,
                },
                tier: {
                    name: defaultTier.tier,
                    color: defaultTier.color,
                    cssClass: defaultTier.cssClass,
                    icon: defaultTier.icon,
                },
                nextTier: {
                    name: nextTier.tier,
                    color: nextTier.color,
                    cssClass: nextTier.cssClass,
                    icon: nextTier.icon,
                    xpBonus: nextBonuses.nextXpBonus,
                    currencyBonus: nextBonuses.nextCurrencyBonus,
                },
                rewards: {
                    badges: [],
                    profileBorders: [],
                    auras: [],
                    titles: [],
                    cosmetics: [],
                },
            });
        }

        // Get current tier info
        const tierInfo = getPrestigeTierInfo(status.level);
        const bonusDisplay = getPrestigeBonusDisplay(status.level);
        const accumulatedRewards = getAccumulatedPrestigeRewards(status.level);

        // Get eligibility
        const validation = await validatePrestigeEligibility(playerId);

        // Get next tier info (if not at max)
        let nextTier = null;
        if (status.level < MAX_PRESTIGE_LEVEL) {
            const nextTierInfo = getPrestigeTierInfo(status.level + 1);
            nextTier = {
                name: nextTierInfo.tier,
                color: nextTierInfo.color,
                cssClass: nextTierInfo.cssClass,
                icon: nextTierInfo.icon,
                xpBonus: bonusDisplay.nextXpBonus,
                currencyBonus: bonusDisplay.nextCurrencyBonus,
            };
        }

        return NextResponse.json({
            status: {
                level: status.level,
                maxLevel: MAX_PRESTIGE_LEVEL,
                xpMultiplier: status.xpMultiplier,
                currencyMultiplier: status.currencyMultiplier,
                xpBonusFormatted: bonusDisplay.xpBonusFormatted,
                currencyBonusFormatted: bonusDisplay.currencyBonusFormatted,
                totalResets: status.totalResets,
                lastPrestigeDate: status.lastPrestigeDate?.toISOString() || null,
            },
            eligibility: {
                eligible: validation.eligible,
                reason: validation.error,
                requiredTier: PRESTIGE_REQUIRED_TIER,
                currentTier: validation.currentTier,
            },
            tier: {
                name: tierInfo.tier,
                color: tierInfo.color,
                cssClass: tierInfo.cssClass,
                icon: tierInfo.icon,
            },
            nextTier,
            rewards: accumulatedRewards,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
