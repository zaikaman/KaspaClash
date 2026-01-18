/**
 * Treasury Distribution Trigger API Route
 * POST /api/treasury/distribute
 * 
 * Manually trigger a distribution (for admin use or testing).
 * Protected by authorization header.
 */

import { NextRequest, NextResponse } from "next/server";
import {
    processWeeklyDistribution,
    canRunDistribution,
    DEFAULT_DISTRIBUTION_CONFIG,
} from "@/lib/treasury/treasury-service";
import { sompiToKas } from "@/lib/kaspa/vault-service";
import type { NetworkType } from "@/types/constants";

// Authorization check
function isAuthorized(request: NextRequest): boolean {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If no CRON_SECRET is set, reject all requests
    if (!cronSecret) {
        console.error("[Treasury] CRON_SECRET not configured");
        return false;
    }

    // Check Bearer token
    if (authHeader === `Bearer ${cronSecret}`) {
        return true;
    }

    return false;
}

export async function POST(request: NextRequest) {
    try {
        // Authorization check
        if (!isAuthorized(request)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse request body
        let network: NetworkType = "testnet";
        let forceRun = false;

        try {
            const body = await request.json();
            if (body.network === "mainnet") network = "mainnet";
            if (body.force === true) forceRun = true;
        } catch {
            // Body parsing failed, use defaults
        }

        console.log(`[Treasury] Distribution trigger received for ${network}, force=${forceRun}`);

        // Check if distribution can run (unless forced)
        if (!forceRun) {
            const canRun = await canRunDistribution(network);
            if (!canRun.canRun) {
                return NextResponse.json({
                    success: false,
                    error: canRun.reason,
                    message: "Distribution already completed this week. Use force=true to override.",
                });
            }
        }

        // Run distribution
        const result = await processWeeklyDistribution(network, DEFAULT_DISTRIBUTION_CONFIG);

        return NextResponse.json({
            success: result.success,
            distributionId: result.distributionId,
            totalDistributed: result.totalDistributed.toString(),
            totalDistributedKAS: sompiToKas(result.totalDistributed),
            eloPayouts: result.eloPayouts.length,
            survivalPayouts: result.survivalPayouts.length,
            failedPayouts: result.failedPayouts.length,
            error: result.error,
        });
    } catch (error) {
        console.error("Distribution trigger error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Distribution failed"
            },
            { status: 500 }
        );
    }
}

// GET for checking status without triggering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const networkParam = searchParams.get("network") as NetworkType | null;
        const network: NetworkType = networkParam === "mainnet" ? "mainnet" : "testnet";

        const canRun = await canRunDistribution(network);

        return NextResponse.json({
            network,
            canRun: canRun.canRun,
            reason: canRun.reason,
        });
    } catch (error) {
        console.error("Distribution status error:", error);
        return NextResponse.json(
            { error: "Failed to check distribution status" },
            { status: 500 }
        );
    }
}
