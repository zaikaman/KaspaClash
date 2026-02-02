/**
 * Treasury Distribution Service
 * 
 * Handles weekly distribution of treasury funds to top leaderboard players:
 * - 40% to top 10 ELO rating players (weighted by rank)
 * - 40% to top 10 Survival mode players (weighted by rank)
 * - 20% to designated project wallet (network-specific)
 * - Always keep at least 10 KAS in treasury for fees
 * 
 * Distribution uses weighted shares based on rank:
 * Rank 1: 20%, Rank 2: 16%, Rank 3: 14%, Rank 4: 12%, Rank 5: 10%,
 * Rank 6: 9%, Rank 7: 7%, Rank 8: 6%, Rank 9: 4%, Rank 10: 2%
 * 
 * Runs every Monday at 09:00 via cron job.
 */

import { createClient } from "@supabase/supabase-js";
import { getTopPlayers, type LeaderboardEntry } from "@/lib/leaderboard/service";
import { getSurvivalLeaderboard, type SurvivalLeaderboardEntry } from "@/lib/survival/leaderboard-updater";
import {
    getVaultBalance,
    sendBatchFromVault,
    sompiToKas,
    getTxExplorerUrl,
    type VaultBalance,
    type VaultTransferResult,
    type PayoutTarget,
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
    /** Percentage for project wallet (0-100) */
    projectWalletPercentage: number;
    /** Number of top players to distribute to */
    topPlayersCount: number;
    /** Minimum vault balance to trigger distribution (sompi) */
    minDistributionBalance: bigint;
    /** Minimum balance to keep in treasury for fees (sompi) */
    minTreasuryReserve: bigint;
    /** Share weights for each rank (higher rank = more shares) */
    rankShareWeights: number[];
}

export interface DistributionSplit {
    totalAmount: bigint;
    eloPoolAmount: bigint;
    survivalPoolAmount: bigint;
    projectWalletAmount: bigint;
    treasuryReserveAmount: bigint;
    /** Total shares for calculating weighted distribution */
    totalShares: bigint;
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
    projectWalletPercentage: 20,
    topPlayersCount: 10,
    minDistributionBalance: BigInt(10_00000000), // 10 KAS minimum
    minTreasuryReserve: BigInt(10_00000000), // Keep 10 KAS for fees
    // Weighted distribution: Rank 1 gets 20 shares, Rank 2 gets 16, etc. (Total: 100 shares)
    rankShareWeights: [20, 16, 14, 12, 10, 9, 7, 6, 4, 2],
};

/** Project wallet addresses by network */
export const PROJECT_WALLET_ADDRESSES = {
    testnet: "kaspatest:qpxxrel67ydhnyfw6juel06xq83ymvxru8fdu9sguht6t7xennvt5fuanuugp",
    mainnet: "kaspa:qpxxrel67ydhnyfw6juel06xq83ymvxru8fdu9sguht6t7xennvt5g6mgnze9",
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate the distribution split amounts.
 * Ensures minimum treasury reserve is maintained.
 */
export function calculateDistributionSplit(
    totalBalance: bigint,
    config: DistributionConfig
): DistributionSplit {
    // Calculate distributable amount (total balance - minimum reserve)
    const distributableAmount = totalBalance > config.minTreasuryReserve 
        ? totalBalance - config.minTreasuryReserve 
        : 0n;

    // Calculate pool amounts from distributable amount
    const eloPoolAmount = (distributableAmount * BigInt(config.eloPercentage)) / 100n;
    const survivalPoolAmount = (distributableAmount * BigInt(config.survivalPercentage)) / 100n;
    const projectWalletAmount = (distributableAmount * BigInt(config.projectWalletPercentage)) / 100n;

    // Calculate total shares for weighted distribution
    const totalShares = BigInt(config.rankShareWeights.reduce((sum, weight) => sum + weight, 0));

    // Total actually distributed will be calculated from actual payouts
    // to account for weighted distribution
    const totalDistributed = eloPoolAmount + survivalPoolAmount + projectWalletAmount;

    // Treasury reserve is what remains after distribution
    const treasuryReserveAmount = totalBalance - totalDistributed;

    return {
        totalAmount: totalDistributed,
        eloPoolAmount,
        survivalPoolAmount,
        projectWalletAmount,
        treasuryReserveAmount,
        totalShares,
    };
}

/**
 * Calculate payout amount for a specific rank using weighted shares.
 * Dynamically calculates total shares based on actual number of players,
 * so if there are only 2 players, the pool is still fully distributed.
 */
export function calculateRankPayout(
    poolAmount: bigint,
    rank: number,
    playerCount: number,
    config: DistributionConfig
): bigint {
    const rankIndex = rank - 1; // Convert to 0-based index
    if (rankIndex < 0 || rankIndex >= config.rankShareWeights.length || rankIndex >= playerCount) {
        return 0n;
    }

    const shares = BigInt(config.rankShareWeights[rankIndex]);
    // Only sum shares for the actual number of players present
    const totalShares = BigInt(
        config.rankShareWeights
            .slice(0, playerCount)
            .reduce((sum, weight) => sum + weight, 0)
    );
    
    return (poolAmount * shares) / totalShares;
}

/**
 * Get top ELO players with their wallet addresses.
 * Filters by network to only return players on the specified network.
 */
export async function getTopEloPlayersForDistribution(
    limit: number,
    network: NetworkType
): Promise<Array<{ address: string; displayName: string | null; rank: number; rating: number }>> {
    // Pass network to filter by address prefix
    const entries = await getTopPlayers(limit, network);

    return entries.map((entry, index) => ({
        address: entry.address,
        displayName: entry.displayName,
        rank: index + 1,
        rating: entry.rating,
    }));
}

/**
 * Get top Survival players with their wallet addresses.
 * Filters by network to only return players on the specified network.
 */
export async function getTopSurvivalPlayersForDistribution(
    limit: number,
    network: NetworkType
): Promise<Array<{ address: string; displayName: string | null; rank: number; score: number }>> {
    // Pass network to filter by address prefix
    const { entries } = await getSurvivalLeaderboard(limit, 0, network);

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
    split: DistributionSplit,
    projectWalletAddress: string
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
            reserve_amount: split.treasuryReserveAmount.toString(),
            project_wallet_amount: split.projectWalletAmount.toString(),
            project_wallet_address: projectWalletAddress,
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
        const projectWalletAddress = PROJECT_WALLET_ADDRESSES[network];
        console.log(`[TreasuryService] Distribution split:`);
        console.log(`  - ELO pool: ${sompiToKas(split.eloPoolAmount)} KAS`);
        console.log(`  - Survival pool: ${sompiToKas(split.survivalPoolAmount)} KAS`);
        console.log(`  - Project wallet: ${sompiToKas(split.projectWalletAmount)} KAS`);
        console.log(`  - Treasury reserve: ${sompiToKas(split.treasuryReserveAmount)} KAS`);
        console.log(`  - Weighted distribution (shares for 10 players):`);
        console.log(`    Rank 1: ${sompiToKas(calculateRankPayout(split.eloPoolAmount, 1, 10, config))} KAS (${config.rankShareWeights[0]} shares)`);
        console.log(`    Rank 10: ${sompiToKas(calculateRankPayout(split.eloPoolAmount, 10, 10, config))} KAS (${config.rankShareWeights[9]} shares)`);

        // Step 4: Get top players (filtered by network)
        const topEloPlayers = await getTopEloPlayersForDistribution(config.topPlayersCount, network);
        const topSurvivalPlayers = await getTopSurvivalPlayersForDistribution(config.topPlayersCount, network);

        console.log(`[TreasuryService] Top ELO players: ${topEloPlayers.length}`);
        console.log(`[TreasuryService] Top Survival players: ${topSurvivalPlayers.length}`);

        // Step 5: Create distribution record
        distributionId = await createDistributionRecord(network, split, projectWalletAddress);
        console.log(`[TreasuryService] Distribution ID: ${distributionId}`);

        // Step 6: Build payout targets for batch transfer
        // Combine ELO and Survival payouts into a single batch to use chained transactions
        const allPayoutTargets: PayoutTarget[] = [];
        const payoutRecordMap = new Map<string, PayoutRecord>(); // Map address to PayoutRecord for tracking

        // Add ELO payouts
        console.log(`[TreasuryService] Preparing ELO payouts...`);
        for (const player of topEloPlayers) {
            const payoutAmount = calculateRankPayout(split.eloPoolAmount, player.rank, topEloPlayers.length, config);
            if (payoutAmount <= 0n) continue;

            const payoutRecord: PayoutRecord = {
                playerAddress: player.address,
                amount: payoutAmount,
                leaderboardType: "elo",
                rank: player.rank,
                displayName: player.displayName,
            };
            payoutRecordMap.set(`elo:${player.address}`, payoutRecord);

            allPayoutTargets.push({
                toAddress: player.address,
                amountSompi: payoutAmount,
                reason: `ELO Distribution Rank #${player.rank}`,
            });
        }

        // Add Survival payouts
        console.log(`[TreasuryService] Preparing Survival payouts...`);
        for (const player of topSurvivalPlayers) {
            const payoutAmount = calculateRankPayout(split.survivalPoolAmount, player.rank, topSurvivalPlayers.length, config);
            if (payoutAmount <= 0n) continue;

            const payoutRecord: PayoutRecord = {
                playerAddress: player.address,
                amount: payoutAmount,
                leaderboardType: "survival",
                rank: player.rank,
                displayName: player.displayName,
            };
            payoutRecordMap.set(`survival:${player.address}`, payoutRecord);

            allPayoutTargets.push({
                toAddress: player.address,
                amountSompi: payoutAmount,
                reason: `Survival Distribution Rank #${player.rank}`,
            });
        }

        // Add Project Wallet payout (20%)
        if (split.projectWalletAmount > 0n) {
            console.log(`[TreasuryService] Preparing Project Wallet payout: ${sompiToKas(split.projectWalletAmount)} KAS to ${projectWalletAddress}`);
            allPayoutTargets.push({
                toAddress: projectWalletAddress,
                amountSompi: split.projectWalletAmount,
                reason: `Weekly Project Allocation (20%)`,
            });
        }

        console.log(`[TreasuryService] Processing ${allPayoutTargets.length} payouts via batch transfer...`);

        // Step 7: Execute batch transfer with chained transactions
        const batchResult = await sendBatchFromVault(network, allPayoutTargets);

        // Step 8: Process results and record each payout
        const projectWalletPayoutIndex = topEloPlayers.length + topSurvivalPlayers.length;
        let projectWalletSuccess = false;
        let projectWalletTxId: string | null = null;

        for (let i = 0; i < batchResult.results.length; i++) {
            const result = batchResult.results[i];
            const target = allPayoutTargets[i];

            // Check if this is the project wallet payout (last in the batch)
            if (i === projectWalletPayoutIndex) {
                projectWalletSuccess = result.success;
                projectWalletTxId = result.txId || null;
                if (result.success) {
                    console.log(`[TreasuryService] Project Wallet payout: ${sompiToKas(split.projectWalletAmount)} KAS to ${projectWalletAddress} - TX: ${result.txId}`);
                } else {
                    console.error(`[TreasuryService] Project Wallet payout FAILED: ${result.error}`);
                }
                continue;
            }

            // Determine if this is ELO or Survival payout based on position
            const isEloPayout = i < topEloPlayers.length;
            const mapKey = isEloPayout
                ? `elo:${target.toAddress}`
                : `survival:${target.toAddress}`;

            const payoutRecord = payoutRecordMap.get(mapKey);
            if (!payoutRecord) continue;

            await recordPayout(distributionId, payoutRecord, result);

            if (result.success) {
                if (isEloPayout) {
                    eloPayouts.push(payoutRecord);
                    console.log(`[TreasuryService] ELO payout #${payoutRecord.rank}: ${sompiToKas(payoutRecord.amount)} KAS to ${payoutRecord.playerAddress} - TX: ${result.txId}`);
                } else {
                    survivalPayouts.push(payoutRecord);
                    console.log(`[TreasuryService] Survival payout #${payoutRecord.rank}: ${sompiToKas(payoutRecord.amount)} KAS to ${payoutRecord.playerAddress} - TX: ${result.txId}`);
                }
            } else {
                failedPayouts.push(payoutRecord);
                if (isEloPayout) {
                    console.error(`[TreasuryService] ELO payout #${payoutRecord.rank} FAILED: ${result.error}`);
                } else {
                    console.error(`[TreasuryService] Survival payout #${payoutRecord.rank} FAILED: ${result.error}`);
                }
            }
        }


        // Step 9: Finalize distribution
        const distributionSuccess = failedPayouts.length === 0 && projectWalletSuccess;
        await finalizeDistribution(
            distributionId,
            distributionSuccess,
            eloPayouts.length,
            survivalPayouts.length,
            failedPayouts.length,
            distributionSuccess ? undefined : `${failedPayouts.length} payouts failed${!projectWalletSuccess ? ', project wallet payout failed' : ''}`
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
        console.log(`  - Project wallet: ${projectWalletSuccess ? 'SUCCESS' : 'FAILED'}`);
        console.log(`  - Failed: ${failedPayouts.length}`);
        console.log(`  - Total distributed: ${sompiToKas(totalDistributed)} KAS`);
        console.log(`  - Treasury reserve remaining: ${sompiToKas(split.treasuryReserveAmount)} KAS`);

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
        projectWalletAmount?: bigint;
        projectWalletAddress?: string;
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
            projectWalletAmount: row.project_wallet_amount ? BigInt(row.project_wallet_amount) : undefined,
            projectWalletAddress: row.project_wallet_address || undefined,
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
