/**
 * Treasury Distribution Service
 * 
 * Handles weekly distribution of treasury funds to top leaderboard players:
 * - 40% to top 10 ELO rating players
 * - 40% to top 10 Survival mode players
 * - 20% remains in treasury as reserve
 * 
 * Runs every Monday at 09:00 via cron job.
 */

import { createClient } from "@supabase/supabase-js";
import { getTopPlayers, type LeaderboardEntry } from "@/lib/leaderboard/service";
import { getSurvivalLeaderboard, type SurvivalLeaderboardEntry } from "@/lib/survival/leaderboard-updater";
import {
    getVaultBalance,
    sendFromVault,
    sompiToKas,
    getTxExplorerUrl,
    type VaultBalance,
    type VaultTransferResult,
} from "@/lib/kaspa/vault-service";
import { type NetworkType } from "@/types/constants";

// =============================================================================
// TYPES
// =============================================================================

export interface DistributionConfig {
    /** Percentage for ELO leaderboard (0-100) */
    eloPercentage: number;
    /** Percentage for Survival leaderboard (0-100) */
    survivalPercentage: number;
    /** Percentage for treasury reserve (0-100) */
    reservePercentage: number;
    /** Number of top players to distribute to */
    topPlayersCount: number;
    /** Minimum vault balance to trigger distribution (sompi) */
    minDistributionBalance: bigint;
}

export interface DistributionSplit {
    totalAmount: bigint;
    eloPoolAmount: bigint;
    survivalPoolAmount: bigint;
    reserveAmount: bigint;
    perEloPlayerAmount: bigint;
    perSurvivalPlayerAmount: bigint;
}

export interface PayoutRecord {
    playerAddress: string;
    amount: bigint;
    leaderboardType: "elo" | "survival";
    rank: number;
    displayName: string | null;
}

export interface DistributionResult {
    success: boolean;
    distributionId: string | null;
    totalDistributed: bigint;
    eloPayouts: PayoutRecord[];
    survivalPayouts: PayoutRecord[];
    failedPayouts: PayoutRecord[];
    error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Default distribution configuration */
export const DEFAULT_DISTRIBUTION_CONFIG: DistributionConfig = {
    eloPercentage: 40,
    survivalPercentage: 40,
    reservePercentage: 20,
    topPlayersCount: 10,
    minDistributionBalance: BigInt(10_00000000), // 10 KAS minimum
};

// Delay between individual payouts to avoid rate limiting (ms)
const PAYOUT_DELAY_MS = 1000;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate the distribution split amounts.
 */
export function calculateDistributionSplit(
    totalBalance: bigint,
    config: DistributionConfig
): DistributionSplit {
    // Calculate pool amounts
    const eloPoolAmount = (totalBalance * BigInt(config.eloPercentage)) / 100n;
    const survivalPoolAmount = (totalBalance * BigInt(config.survivalPercentage)) / 100n;
    const reserveAmount = totalBalance - eloPoolAmount - survivalPoolAmount;

    // Calculate per-player amounts (equal split among top N)
    const perEloPlayerAmount = eloPoolAmount / BigInt(config.topPlayersCount);
    const perSurvivalPlayerAmount = survivalPoolAmount / BigInt(config.topPlayersCount);

    // Total actually distributed (excluding reserve and rounding dust)
    const totalDistributed = (perEloPlayerAmount * BigInt(config.topPlayersCount)) +
        (perSurvivalPlayerAmount * BigInt(config.topPlayersCount));

    return {
        totalAmount: totalDistributed,
        eloPoolAmount,
        survivalPoolAmount,
        reserveAmount,
        perEloPlayerAmount,
        perSurvivalPlayerAmount,
    };
}

/**
 * Get top ELO players with their wallet addresses.
 */
export async function getTopEloPlayersForDistribution(
    limit: number
): Promise<Array<{ address: string; displayName: string | null; rank: number; rating: number }>> {
    const entries = await getTopPlayers(limit);

    return entries.map((entry, index) => ({
        address: entry.address,
        displayName: entry.displayName,
        rank: index + 1,
        rating: entry.rating,
    }));
}

/**
 * Get top Survival players with their wallet addresses.
 */
export async function getTopSurvivalPlayersForDistribution(
    limit: number
): Promise<Array<{ address: string; displayName: string | null; rank: number; score: number }>> {
    const { entries } = await getSurvivalLeaderboard(limit, 0);

    return entries.map((entry, index) => ({
        address: entry.address,
        displayName: entry.displayName,
        rank: index + 1,
        score: entry.bestScore,
    }));
}

/**
 * Get the start of the current week (Monday at 09:00).
 */
function getCurrentWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 1

    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - daysToSubtract);
    weekStart.setUTCHours(9, 0, 0, 0);

    return weekStart;
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Create a new distribution record.
 */
async function createDistributionRecord(
    network: NetworkType,
    split: DistributionSplit
): Promise<string> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const weekStart = getCurrentWeekStart();

    const { data, error } = await supabase
        .from("treasury_distributions")
        .insert({
            distribution_week: weekStart.toISOString().split("T")[0],
            total_amount: split.totalAmount.toString(),
            elo_pool_amount: split.eloPoolAmount.toString(),
            survival_pool_amount: split.survivalPoolAmount.toString(),
            reserve_amount: split.reserveAmount.toString(),
            network,
            status: "processing",
            started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

    if (error) {
        throw new Error(`Failed to create distribution record: ${error.message}`);
    }

    return data.id;
}

/**
 * Record a payout attempt.
 */
async function recordPayout(
    distributionId: string,
    payout: PayoutRecord,
    result: VaultTransferResult
): Promise<void> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("distribution_payouts").insert({
        distribution_id: distributionId,
        player_address: payout.playerAddress,
        amount: payout.amount.toString(),
        leaderboard_type: payout.leaderboardType,
        rank: payout.rank,
        tx_id: result.txId || null,
        status: result.success ? "sent" : "failed",
        error_message: result.error || null,
        sent_at: result.success ? new Date().toISOString() : null,
    });
}

/**
 * Update distribution record with final status.
 */
async function finalizeDistribution(
    distributionId: string,
    success: boolean,
    eloCount: number,
    survivalCount: number,
    failedCount: number,
    errorMessage?: string
): Promise<void> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
        .from("treasury_distributions")
        .update({
            status: success ? "completed" : "failed",
            elo_payouts_count: eloCount,
            survival_payouts_count: survivalCount,
            failed_payouts_count: failedCount,
            error_message: errorMessage || null,
            completed_at: new Date().toISOString(),
        })
        .eq("id", distributionId);
}

/**
 * Record a balance snapshot.
 */
async function recordBalanceSnapshot(
    network: NetworkType,
    balance: bigint,
    snapshotType: "pre_distribution" | "post_distribution",
    distributionId?: string
): Promise<void> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("treasury_balance_snapshots").insert({
        balance: balance.toString(),
        network,
        snapshot_type: snapshotType,
        distribution_id: distributionId || null,
    });
}

/**
 * Check if distribution can run this week.
 */
export async function canRunDistribution(network: NetworkType): Promise<{
    canRun: boolean;
    reason?: string;
}> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const weekStart = getCurrentWeekStart();

    // Check if there's already a distribution for this week
    const { data: existing } = await supabase
        .from("treasury_distributions")
        .select("id, status")
        .eq("distribution_week", weekStart.toISOString().split("T")[0])
        .eq("network", network)
        .single();

    if (existing) {
        return {
            canRun: false,
            reason: `Distribution already exists for this week (status: ${existing.status})`,
        };
    }

    return { canRun: true };
}

// =============================================================================
// MAIN DISTRIBUTION FUNCTION
// =============================================================================

/**
 * Process the weekly treasury distribution.
 * 
 * @param network - Target network (mainnet or testnet)
 * @param config - Distribution configuration (defaults to 40/40/20 split)
 */
export async function processWeeklyDistribution(
    network: NetworkType,
    config: DistributionConfig = DEFAULT_DISTRIBUTION_CONFIG
): Promise<DistributionResult> {
    console.log(`[TreasuryService] Starting weekly distribution for ${network}`);

    const eloPayouts: PayoutRecord[] = [];
    const survivalPayouts: PayoutRecord[] = [];
    const failedPayouts: PayoutRecord[] = [];
    let distributionId: string | null = null;

    try {
        // Step 1: Check if distribution can run
        const canRun = await canRunDistribution(network);
        if (!canRun.canRun) {
            return {
                success: false,
                distributionId: null,
                totalDistributed: 0n,
                eloPayouts: [],
                survivalPayouts: [],
                failedPayouts: [],
                error: canRun.reason,
            };
        }

        // Step 2: Get current vault balance
        const vaultBalance = await getVaultBalance(network);
        console.log(`[TreasuryService] Vault balance: ${sompiToKas(vaultBalance.balance)} KAS`);

        // Record pre-distribution balance
        await recordBalanceSnapshot(network, vaultBalance.balance, "pre_distribution");

        // Check minimum balance
        if (vaultBalance.balance < config.minDistributionBalance) {
            return {
                success: false,
                distributionId: null,
                totalDistributed: 0n,
                eloPayouts: [],
                survivalPayouts: [],
                failedPayouts: [],
                error: `Vault balance (${sompiToKas(vaultBalance.balance)} KAS) is below minimum (${sompiToKas(config.minDistributionBalance)} KAS)`,
            };
        }

        // Step 3: Calculate distribution split
        const split = calculateDistributionSplit(vaultBalance.balance, config);
        console.log(`[TreasuryService] Distribution split:`);
        console.log(`  - ELO pool: ${sompiToKas(split.eloPoolAmount)} KAS`);
        console.log(`  - Survival pool: ${sompiToKas(split.survivalPoolAmount)} KAS`);
        console.log(`  - Reserve: ${sompiToKas(split.reserveAmount)} KAS`);
        console.log(`  - Per ELO player: ${sompiToKas(split.perEloPlayerAmount)} KAS`);
        console.log(`  - Per Survival player: ${sompiToKas(split.perSurvivalPlayerAmount)} KAS`);

        // Step 4: Get top players
        const topEloPlayers = await getTopEloPlayersForDistribution(config.topPlayersCount);
        const topSurvivalPlayers = await getTopSurvivalPlayersForDistribution(config.topPlayersCount);

        console.log(`[TreasuryService] Top ELO players: ${topEloPlayers.length}`);
        console.log(`[TreasuryService] Top Survival players: ${topSurvivalPlayers.length}`);

        // Step 5: Create distribution record
        distributionId = await createDistributionRecord(network, split);
        console.log(`[TreasuryService] Distribution ID: ${distributionId}`);

        // Step 6: Process ELO payouts
        console.log(`[TreasuryService] Processing ELO payouts...`);
        for (const player of topEloPlayers) {
            if (split.perEloPlayerAmount <= 0n) continue;

            const payout: PayoutRecord = {
                playerAddress: player.address,
                amount: split.perEloPlayerAmount,
                leaderboardType: "elo",
                rank: player.rank,
                displayName: player.displayName,
            };

            const result = await sendFromVault(
                network,
                player.address,
                split.perEloPlayerAmount,
                `ELO Distribution Rank #${player.rank}`
            );

            await recordPayout(distributionId, payout, result);

            if (result.success) {
                eloPayouts.push(payout);
                console.log(`[TreasuryService] ELO payout #${player.rank}: ${sompiToKas(split.perEloPlayerAmount)} KAS to ${player.address} - TX: ${result.txId}`);
            } else {
                failedPayouts.push(payout);
                console.error(`[TreasuryService] ELO payout #${player.rank} FAILED: ${result.error}`);
            }

            // Delay between payouts
            await new Promise(resolve => setTimeout(resolve, PAYOUT_DELAY_MS));
        }

        // Step 7: Process Survival payouts
        console.log(`[TreasuryService] Processing Survival payouts...`);
        for (const player of topSurvivalPlayers) {
            if (split.perSurvivalPlayerAmount <= 0n) continue;

            const payout: PayoutRecord = {
                playerAddress: player.address,
                amount: split.perSurvivalPlayerAmount,
                leaderboardType: "survival",
                rank: player.rank,
                displayName: player.displayName,
            };

            const result = await sendFromVault(
                network,
                player.address,
                split.perSurvivalPlayerAmount,
                `Survival Distribution Rank #${player.rank}`
            );

            await recordPayout(distributionId, payout, result);

            if (result.success) {
                survivalPayouts.push(payout);
                console.log(`[TreasuryService] Survival payout #${player.rank}: ${sompiToKas(split.perSurvivalPlayerAmount)} KAS to ${player.address} - TX: ${result.txId}`);
            } else {
                failedPayouts.push(payout);
                console.error(`[TreasuryService] Survival payout #${player.rank} FAILED: ${result.error}`);
            }

            // Delay between payouts
            await new Promise(resolve => setTimeout(resolve, PAYOUT_DELAY_MS));
        }

        // Step 8: Finalize distribution
        const distributionSuccess = failedPayouts.length === 0;
        await finalizeDistribution(
            distributionId,
            distributionSuccess,
            eloPayouts.length,
            survivalPayouts.length,
            failedPayouts.length,
            distributionSuccess ? undefined : `${failedPayouts.length} payouts failed`
        );

        // Record post-distribution balance
        const postBalance = await getVaultBalance(network);
        await recordBalanceSnapshot(network, postBalance.balance, "post_distribution", distributionId);

        // Calculate total distributed
        const totalDistributed = eloPayouts.reduce((sum, p) => sum + p.amount, 0n) +
            survivalPayouts.reduce((sum, p) => sum + p.amount, 0n);

        console.log(`[TreasuryService] Distribution complete!`);
        console.log(`  - ELO payouts: ${eloPayouts.length}/${topEloPlayers.length}`);
        console.log(`  - Survival payouts: ${survivalPayouts.length}/${topSurvivalPlayers.length}`);
        console.log(`  - Failed: ${failedPayouts.length}`);
        console.log(`  - Total distributed: ${sompiToKas(totalDistributed)} KAS`);

        return {
            success: distributionSuccess,
            distributionId,
            totalDistributed,
            eloPayouts,
            survivalPayouts,
            failedPayouts,
        };
    } catch (error) {
        console.error("[TreasuryService] Distribution failed:", error);

        // Update distribution record if it was created
        if (distributionId) {
            await finalizeDistribution(
                distributionId,
                false,
                eloPayouts.length,
                survivalPayouts.length,
                failedPayouts.length,
                error instanceof Error ? error.message : "Unknown error"
            );
        }

        return {
            success: false,
            distributionId,
            totalDistributed: 0n,
            eloPayouts,
            survivalPayouts,
            failedPayouts,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get distribution history.
 */
export async function getDistributionHistory(
    network: NetworkType,
    limit: number = 10,
    offset: number = 0
): Promise<{
    distributions: Array<{
        id: string;
        distributionWeek: string;
        totalAmount: bigint;
        eloPoolAmount: bigint;
        survivalPoolAmount: bigint;
        reserveAmount: bigint;
        status: string;
        eloPayoutsCount: number;
        survivalPayoutsCount: number;
        failedPayoutsCount: number;
        createdAt: Date;
        completedAt: Date | null;
    }>;
    total: number;
}> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error, count } = await supabase
        .from("treasury_distributions")
        .select("*", { count: "exact" })
        .eq("network", network)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error(`Failed to fetch distribution history: ${error.message}`);
    }

    return {
        distributions: (data || []).map(row => ({
            id: row.id,
            distributionWeek: row.distribution_week,
            totalAmount: BigInt(row.total_amount),
            eloPoolAmount: BigInt(row.elo_pool_amount),
            survivalPoolAmount: BigInt(row.survival_pool_amount),
            reserveAmount: BigInt(row.reserve_amount),
            status: row.status,
            eloPayoutsCount: row.elo_payouts_count,
            survivalPayoutsCount: row.survival_payouts_count,
            failedPayoutsCount: row.failed_payouts_count,
            createdAt: new Date(row.created_at),
            completedAt: row.completed_at ? new Date(row.completed_at) : null,
        })),
        total: count || 0,
    };
}

/**
 * Get payouts for a specific distribution.
 */
export async function getDistributionPayouts(
    distributionId: string
): Promise<Array<{
    id: string;
    playerAddress: string;
    amount: bigint;
    leaderboardType: "elo" | "survival";
    rank: number;
    txId: string | null;
    status: string;
    createdAt: Date;
}>> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
        .from("distribution_payouts")
        .select("*")
        .eq("distribution_id", distributionId)
        .order("leaderboard_type", { ascending: true })
        .order("rank", { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch payouts: ${error.message}`);
    }

    return (data || []).map(row => ({
        id: row.id,
        playerAddress: row.player_address,
        amount: BigInt(row.amount),
        leaderboardType: row.leaderboard_type as "elo" | "survival",
        rank: row.rank,
        txId: row.tx_id,
        status: row.status,
        createdAt: new Date(row.created_at),
    }));
}

/**
 * Get player's earnings from distributions.
 */
export async function getPlayerEarnings(
    playerAddress: string
): Promise<{
    totalEarned: bigint;
    eloEarnings: bigint;
    survivalEarnings: bigint;
    payoutCount: number;
}> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.rpc("get_player_distribution_earnings", {
        p_player_address: playerAddress,
    });

    if (error) {
        console.error("Failed to get player earnings:", error);
        return {
            totalEarned: 0n,
            eloEarnings: 0n,
            survivalEarnings: 0n,
            payoutCount: 0,
        };
    }

    return {
        totalEarned: BigInt(data.total_earned || 0),
        eloEarnings: BigInt(data.elo_earnings || 0),
        survivalEarnings: BigInt(data.survival_earnings || 0),
        payoutCount: data.payout_count || 0,
    };
}

/**
 * Get next distribution date (next Monday at 09:00).
 */
export function getNextDistributionDate(): Date {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();

    // Calculate days until next Monday
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
    nextMonday.setUTCHours(9, 0, 0, 0);

    return nextMonday;
}
