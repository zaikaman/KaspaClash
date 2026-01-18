/**
 * Treasury Distributions API Route
 * GET /api/treasury/distributions
 * 
 * Returns distribution history with pagination.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDistributionHistory, getDistributionPayouts } from "@/lib/treasury/treasury-service";
import { sompiToKas } from "@/lib/kaspa/vault-service";
import type { NetworkType } from "@/types/constants";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const networkParam = searchParams.get("network") as NetworkType | null;
        const limitParam = searchParams.get("limit");
        const offsetParam = searchParams.get("offset");
        const distributionId = searchParams.get("id"); // If provided, get specific distribution with payouts

        const network: NetworkType = networkParam === "mainnet" ? "mainnet" : "testnet";
        const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 50) : 10;
        const offset = offsetParam ? Math.max(parseInt(offsetParam, 10), 0) : 0;

        // If specific distribution ID requested, return that distribution with payouts
        if (distributionId) {
            const payouts = await getDistributionPayouts(distributionId);

            return NextResponse.json({
                payouts: payouts.map((p) => ({
                    id: p.id,
                    playerAddress: p.playerAddress,
                    amount: p.amount.toString(),
                    amountKAS: sompiToKas(p.amount),
                    leaderboardType: p.leaderboardType,
                    rank: p.rank,
                    txId: p.txId,
                    status: p.status,
                    createdAt: p.createdAt.toISOString(),
                })),
            });
        }

        // Otherwise return distribution history
        const { distributions, total } = await getDistributionHistory(network, limit, offset);

        return NextResponse.json({
            distributions: distributions.map((d) => ({
                id: d.id,
                distributionWeek: d.distributionWeek,
                totalAmount: d.totalAmount.toString(),
                totalAmountKAS: sompiToKas(d.totalAmount),
                eloPoolAmount: d.eloPoolAmount.toString(),
                eloPoolAmountKAS: sompiToKas(d.eloPoolAmount),
                survivalPoolAmount: d.survivalPoolAmount.toString(),
                survivalPoolAmountKAS: sompiToKas(d.survivalPoolAmount),
                reserveAmount: d.reserveAmount.toString(),
                reserveAmountKAS: sompiToKas(d.reserveAmount),
                status: d.status,
                eloPayoutsCount: d.eloPayoutsCount,
                survivalPayoutsCount: d.survivalPayoutsCount,
                failedPayoutsCount: d.failedPayoutsCount,
                createdAt: d.createdAt.toISOString(),
                completedAt: d.completedAt?.toISOString() || null,
            })),
            total,
            limit,
            offset,
            hasMore: offset + distributions.length < total,
        });
    } catch (error) {
        console.error("Treasury distributions error:", error);
        return NextResponse.json(
            { error: "Failed to fetch distribution history" },
            { status: 500 }
        );
    }
}
