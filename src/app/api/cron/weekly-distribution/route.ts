/**
 * Weekly Distribution Cron Job
 * POST /api/cron/weekly-distribution
 * 
 * Vercel Cron endpoint that runs every Monday at 00:00 UTC.
 * Triggers the weekly treasury distribution to top leaderboard players.
 * 
 * Cron schedule: "0 0 * * 1" (Every Monday at 00:00 UTC)
 */

import { NextRequest, NextResponse } from "next/server";
import {
    processWeeklyDistribution,
    DEFAULT_DISTRIBUTION_CONFIG,
} from "@/lib/treasury/treasury-service";
import { sompiToKas } from "@/lib/kaspa/vault-service";
import type { NetworkType } from "@/types/constants";

// Vercel Cron requires this export to identify the function as a cron handler
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max for distribution processing

/**
 * Verify the request is authorized via Bearer token
 * Compatible with Vercel Cron, cron-job.org, or any service that can send a Bearer token
 */
function isCronAuthorized(request: NextRequest): boolean {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Check for Bearer token authorization
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        return true;
    }

    // Fallback for Vercel-specific signature header (if needed)
    const vercelCronSignature = request.headers.get("x-vercel-signature");
    if (vercelCronSignature) {
        return true;
    }

    return false;
}

export async function GET(request: NextRequest) {
    console.log("[Cron] Weekly distribution triggered");

    // Verify cron authorization
    if (!isCronAuthorized(request)) {
        console.error("[Cron] Unauthorized cron request");
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        // Process distributions for BOTH networks
        // Players on testnet get testnet distributions, mainnet players get mainnet
        const networks: NetworkType[] = ["mainnet", "testnet"];
        const results: {
            network: NetworkType;
            success: boolean;
            distributionId: string | null;
            totalDistributed: number;
            eloPayouts: number;
            survivalPayouts: number;
            failedPayouts: number;
            error?: string;
        }[] = [];

        for (const network of networks) {
            console.log(`[Cron] Running weekly distribution on ${network}...`);

            try {
                const result = await processWeeklyDistribution(network, DEFAULT_DISTRIBUTION_CONFIG);

                results.push({
                    network,
                    success: result.success,
                    distributionId: result.distributionId,
                    totalDistributed: sompiToKas(result.totalDistributed),
                    eloPayouts: result.eloPayouts.length,
                    survivalPayouts: result.survivalPayouts.length,
                    failedPayouts: result.failedPayouts.length,
                    error: result.error,
                });

                if (result.success) {
                    console.log(`[Cron] ${network} distribution successful!`);
                    console.log(`[Cron] ${network} - Total: ${sompiToKas(result.totalDistributed)} KAS`);
                } else {
                    console.log(`[Cron] ${network} distribution skipped/failed: ${result.error}`);
                }
            } catch (networkError) {
                console.error(`[Cron] ${network} distribution error:`, networkError);
                results.push({
                    network,
                    success: false,
                    distributionId: null,
                    totalDistributed: 0,
                    eloPayouts: 0,
                    survivalPayouts: 0,
                    failedPayouts: 0,
                    error: networkError instanceof Error ? networkError.message : "Unknown error",
                });
            }
        }

        // Overall success if at least one network succeeded
        const overallSuccess = results.some(r => r.success);

        return NextResponse.json({
            success: overallSuccess,
            results,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Cron] Weekly distribution error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

// POST method for manual triggers (same as GET)
export async function POST(request: NextRequest) {
    return GET(request);
}
