/**
 * Treasury Balance API Route
 * GET /api/treasury/balance
 * 
 * Returns the current treasury vault balance and next distribution info.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVaultBalance, getVaultAddress, sompiToKas } from "@/lib/kaspa/vault-service";
import { getNextDistributionDate, getDistributionHistory } from "@/lib/treasury/treasury-service";
import type { NetworkType } from "@/types/constants";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const networkParam = searchParams.get("network") as NetworkType | null;

        // Determine network from param or default to testnet
        const network: NetworkType = networkParam === "mainnet" ? "mainnet" : "testnet";

        // Get vault balance
        const balance = await getVaultBalance(network);

        // Get vault address (public)
        const vaultAddress = getVaultAddress(network);

        // Get next distribution date
        const nextDistribution = getNextDistributionDate();

        // Get last distribution info
        const { distributions } = await getDistributionHistory(network, 1, 0);
        const lastDistribution = distributions.length > 0 ? distributions[0] : null;

        return NextResponse.json({
            balance: balance.balance.toString(),
            balanceKAS: balance.balanceKAS,
            vaultAddress,
            network,
            nextDistribution: nextDistribution.toISOString(),
            lastDistribution: lastDistribution
                ? {
                    id: lastDistribution.id,
                    date: lastDistribution.distributionWeek,
                    totalDistributed: sompiToKas(lastDistribution.totalAmount),
                    status: lastDistribution.status,
                }
                : null,
        });
    } catch (error) {
        console.error("Treasury balance error:", error);
        return NextResponse.json(
            { error: "Failed to fetch treasury balance" },
            { status: 500 }
        );
    }
}
