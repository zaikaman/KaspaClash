/**
 * Bot Betting Payout Service
 * Handles sending winnings from the vault to bot betting winners
 * Mirrors the logic from betting/payout-service.ts for player matches
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    sendBatchFromVault,
    sompiToKas,
    type PayoutTarget,
    type BatchTransferResult
} from "@/lib/kaspa/vault-service";
import { type NetworkType } from "@/types/constants";

// =============================================================================
// TYPES
// =============================================================================

export interface BotBetPayoutResult {
    success: boolean;
    totalPaidOut: bigint;
    payouts: {
        bettorAddress: string;
        amount: bigint;
        txId?: string;
        error?: string;
    }[];
    errors: string[];
}

export interface BotPoolResolutionResult {
    success: boolean;
    poolId: string;
    matchId: string;
    winner: 'bot1' | 'bot2';
    totalPayouts: number;
    totalAmount: bigint;
    errors: string[];
}

interface BotBettingPoolRow {
    id: string;
    bot_match_id: string;
    bot1_total: number;
    bot2_total: number;
    total_pool: number;
    status: string;
    winner?: string;
}

interface BotBetRow {
    id: string;
    pool_id: string;
    bettor_address: string;
    bet_on: string;
    net_amount: number;
    status: string;
}

// =============================================================================
// PAYOUT CALCULATION
// =============================================================================

/**
 * Calculate payout for a winning bet (HOUSE MODEL - FIXED 2x ODDS)
 * Winners receive exactly 2x their net bet amount (bet minus 1% fee)
 */
function calculateBotBetPayout(
    bet: BotBetRow,
    _pool: BotBettingPoolRow // Pool not needed for fixed odds, kept for interface compatibility
): bigint {
    const netAmount = BigInt(bet.net_amount);

    if (netAmount <= 0n) return 0n;

    // Fixed 2x payout for house model
    return netAmount * 2n;
}

/**
 * Calculate all payouts for a resolved bot betting pool
 */
export function calculateBotPoolPayouts(
    pool: BotBettingPoolRow,
    bets: BotBetRow[]
): { bettorAddress: string; amount: bigint; betId: string }[] {
    if (!pool.winner) {
        return [];
    }

    const winningBets = bets.filter(
        bet => bet.bet_on === pool.winner && bet.status === 'confirmed'
    );

    return winningBets.map(bet => ({
        bettorAddress: bet.bettor_address,
        amount: calculateBotBetPayout(bet, pool),
        betId: bet.id,
    }));
}

// =============================================================================
// PAYOUT PROCESSING
// =============================================================================

/**
 * Process all payouts for a bot betting pool
 * Sends actual KAS from vault to winners
 */
export async function processBotPoolPayouts(
    pool: BotBettingPoolRow,
    bets: BotBetRow[]
): Promise<BotBetPayoutResult> {
    const result: BotBetPayoutResult = {
        success: true,
        totalPaidOut: BigInt(0),
        payouts: [],
        errors: [],
    };

    if (!pool.winner) {
        result.success = false;
        result.errors.push("Pool has no winner set");
        return result;
    }

    // Calculate payouts
    const payoutList = calculateBotPoolPayouts(pool, bets);

    if (payoutList.length === 0) {
        return result;
    }

    // Determine network from first bettor address
    const firstBettorAddress = payoutList[0].bettorAddress;
    const isTestnet = firstBettorAddress.startsWith("kaspatest:");
    const network: NetworkType = isTestnet ? "testnet" : "mainnet";

    console.log(`[BotPayoutService] Processing ${payoutList.length} payouts for pool ${pool.id} on ${network}`);

    // Build batch targets for vault service
    const targets: PayoutTarget[] = payoutList.map(p => ({
        toAddress: p.bettorAddress,
        amountSompi: p.amount,
        reason: `Bot Bet Payout: Match ${pool.bot_match_id}`
    }));

    // Send batch transfer from vault
    const batchResult = await sendBatchFromVault(network, targets);

    // Process results
    for (let i = 0; i < batchResult.results.length; i++) {
        const txResult = batchResult.results[i];
        const originalPayout = payoutList[i];

        result.payouts.push({
            bettorAddress: originalPayout.bettorAddress,
            amount: originalPayout.amount,
            txId: txResult.txId,
            error: txResult.error,
        });

        if (txResult.success) {
            result.totalPaidOut += originalPayout.amount;
            console.log(`[BotPayoutService] ✓ Paid ${sompiToKas(originalPayout.amount)} KAS to ${originalPayout.bettorAddress.slice(-8)} - TX: ${txResult.txId}`);
        } else {
            result.success = false;
            result.errors.push(`Failed to pay ${originalPayout.bettorAddress}: ${txResult.error}`);
            console.error(`[BotPayoutService] ✗ Failed to pay ${originalPayout.bettorAddress}:`, txResult.error);
        }
    }

    if (!batchResult.success && batchResult.failedCount > 0) {
        result.success = false;
    }

    return result;
}

// =============================================================================
// MATCH PAYOUT RESOLUTION
// =============================================================================

/**
 * Resolve payouts for a bot match by ID
 * Fetches pool/bets, calculates, pays, and updates DB
 * This is the main entry point for automatic payout processing
 */
export async function resolveBotMatchPayouts(matchId: string): Promise<BotPoolResolutionResult> {
    const supabase = await createSupabaseServerClient();
    const db = supabase as any;

    console.log(`[BotPayoutService] Resolving payouts for bot match ${matchId}`);

    // 1. Get bot match from database to verify it exists and is finished
    const { data: matchData, error: matchError } = await db
        .from("bot_matches")
        .select("id, match_winner, status")
        .eq("id", matchId)
        .single();

    if (matchError || !matchData || !matchData.match_winner) {
        console.log(`[BotPayoutService] Match ${matchId} not ready for payout`);
        throw new Error(`Match not found or has no winner`);
    }

    // Convert winner format
    const winner = matchData.match_winner === "player1" ? "bot1" : "bot2";

    // 2. Get betting pool
    const { data: poolData, error: poolError } = await db
        .from("bot_betting_pools")
        .select("*")
        .eq("bot_match_id", matchId)
        .single();

    if (poolError) {
        if (poolError.code === "PGRST116") {
            // No pool exists - that's fine
            console.log(`[BotPayoutService] No betting pool for match ${matchId}`);
            return {
                success: true,
                poolId: "",
                matchId,
                winner,
                totalPayouts: 0,
                totalAmount: 0n,
                errors: [],
            };
        }
        throw new Error(`Failed to fetch pool: ${poolError.message}`);
    }

    const pool = poolData as BotBettingPoolRow;

    // Check if already resolved
    if (pool.status === "resolved") {
        console.log(`[BotPayoutService] Pool ${pool.id} already resolved`);
        return {
            success: true,
            poolId: pool.id,
            matchId,
            winner: pool.winner as 'bot1' | 'bot2',
            totalPayouts: 0,
            totalAmount: 0n,
            errors: [],
        };
    }

    // 3. Lock pool (set status to resolved and winner)
    const { error: updatePoolError } = await db
        .from("bot_betting_pools")
        .update({
            status: "resolved",
            winner,
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", pool.id);

    if (updatePoolError) {
        throw new Error(`Failed to resolve pool: ${updatePoolError.message}`);
    }

    // 4. Get all confirmed bets for this pool
    const { data: betsData, error: betsError } = await db
        .from("bot_bets")
        .select("*")
        .eq("pool_id", pool.id)
        .eq("status", "confirmed");

    if (betsError) {
        throw new Error(`Failed to fetch bets: ${betsError.message}`);
    }

    const bets = (betsData || []) as BotBetRow[];

    if (bets.length === 0) {
        console.log(`[BotPayoutService] No confirmed bets for pool ${pool.id}`);
        return {
            success: true,
            poolId: pool.id,
            matchId,
            winner,
            totalPayouts: 0,
            totalAmount: 0n,
            errors: [],
        };
    }

    // 5. Process payouts (send actual KAS)
    const payoutResult = await processBotPoolPayouts(pool, bets);

    // 6. Update bet statuses in database
    for (const bet of bets) {
        const isWinner = bet.bet_on === winner;
        const payoutInfo = payoutResult.payouts.find(p => p.bettorAddress === bet.bettor_address);

        await db
            .from("bot_bets")
            .update({
                status: isWinner ? 'won' : 'lost',
                payout_amount: isWinner && payoutInfo ? Number(payoutInfo.amount) : null,
                payout_tx_id: isWinner && payoutInfo?.txId ? payoutInfo.txId : null,
                paid_at: isWinner && payoutInfo?.txId ? new Date().toISOString() : null,
            })
            .eq("id", bet.id);
    }

    // 7. Update losing bets
    await db
        .from("bot_bets")
        .update({ status: "lost" })
        .eq("pool_id", pool.id)
        .neq("bet_on", winner)
        .eq("status", "confirmed");

    console.log(`[BotPayoutService] ✓ Processed payouts for match ${matchId}: ${sompiToKas(payoutResult.totalPaidOut)} KAS paid to ${payoutResult.payouts.length} winners`);

    return {
        success: payoutResult.success,
        poolId: pool.id,
        matchId,
        winner,
        totalPayouts: payoutResult.payouts.length,
        totalAmount: payoutResult.totalPaidOut,
        errors: payoutResult.errors,
    };
}
