/**
 * GET /api/survival/leaderboard
 * Fetch survival mode leaderboard
 */

import { NextRequest, NextResponse } from "next/server";
import { getSurvivalLeaderboard } from "@/lib/survival/leaderboard-updater";
import type { NetworkType } from "@/types/constants";

const VALID_NETWORKS = ["mainnet", "testnet"] as const;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "100", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        // Validate parameters
        if (limit < 1 || limit > 100) {
            return NextResponse.json(
                { error: "Limit must be between 1 and 100" },
                { status: 400 }
            );
        }

        if (offset < 0) {
            return NextResponse.json(
                { error: "Offset must be non-negative" },
                { status: 400 }
            );
        }

        // Parse network parameter
        const networkParam = searchParams.get("network") as NetworkType | null;
        const network: NetworkType | undefined =
            networkParam && VALID_NETWORKS.includes(networkParam) ? networkParam : undefined;

        const { entries, total } = await getSurvivalLeaderboard(limit, offset, network);

        return NextResponse.json({
            entries,
            total,
            limit,
            offset,
            network,
            hasMore: offset + entries.length < total,
        });
    } catch (error) {
        console.error("Survival leaderboard error:", error);
        return NextResponse.json(
            { error: "Failed to fetch survival leaderboard" },
            { status: 500 }
        );
    }
}
