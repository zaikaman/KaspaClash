/**
 * Payout Service
 * Handles sending winnings from the vault to betting winners
 */

import {
    calculatePayout,
    transformPoolFromDb,
    transformBetFromDb,
    sompiToKas,
    type BettingPool,
    type Bet,
} from "./betting-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    sendBatchFromVault,
    type PayoutTarget,
    type BatchTransferResult
} from "@/lib/kaspa/vault-service";
import { type NetworkType } from "@/types/constants";

// =============================================================================
// TYPES
// =============================================================================

export interface PayoutResult {
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

export interface PoolResolutionResult {
    success: boolean;
    poolId: string;
    winner: 'player1' | 'player2';
    totalPayouts: number;
    totalAmount: bigint;
    errors: string[];
}

// =============================================================================
// PAYOUT LOGIC
// =============================================================================

/**
 * Calculate all payouts for a resolved betting pool.
 * Returns the payout amounts for each winning bet.
 */
export function calculatePoolPayouts(
    pool: BettingPool,
    bets: Bet[]
): { bettorAddress: string; amount: bigint; betId: string }[] {
    if (!pool.winner) {
        return [];
    }

    const winningBets = bets.filter(
        bet => bet.betOn === pool.winner && bet.status === 'confirmed'
    );

    return winningBets.map(bet => ({
        bettorAddress: bet.bettorAddress,
        amount: calculatePayout(bet, pool),
        betId: bet.id,
    }));
}

/**
 * Process all payouts for a betting pool.
 * Called when a match ends.
 */
export async function processPoolPayouts(
    pool: BettingPool,
    bets: Bet[]
): Promise<PayoutResult> {
    const result: PayoutResult = {
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
    const payoutList = calculatePoolPayouts(pool, bets);

    if (payoutList.length === 0) {
        return result;
    }

    // Determine network
    const firstBettorAddress = payoutList[0].bettorAddress;
    const isTestnet = firstBettorAddress.startsWith("kaspatest:");
    const network: NetworkType = isTestnet ? "testnet" : "mainnet";

    // Build batch targets
    const targets: PayoutTarget[] = payoutList.map(p => ({
        toAddress: p.bettorAddress,
        amountSompi: p.amount,
        reason: `Bet Payout: Pool ${pool.id}`
    }));

    // Send batch
    const batchResult = await sendBatchFromVault(network, targets);

    // Process results
    for (let i = 0; i < batchResult.results.length; i++) {
        const txResult = batchResult.results[i];
        const originalPayout = payoutList[i]; // Corresponding payout based on index

        result.payouts.push({
            bettorAddress: originalPayout.bettorAddress,
            amount: originalPayout.amount,
            txId: txResult.txId,
            error: txResult.error,
        });

        if (txResult.success) {
            result.totalPaidOut += originalPayout.amount;
        } else {
            result.success = false;
            result.errors.push(`Failed to pay ${originalPayout.bettorAddress}: ${txResult.error}`);
        }
    }

    if (!batchResult.success && batchResult.failedCount > 0) {
        result.success = false;
    }

    return result;
}

/**
 * Helper: Resolve payouts for a match by ID.
 * Fetches pool/bets, calculates, pays, and updates DB.
 */
export async function resolveMatchPayouts(matchId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    // 1. Get Match & Winner
    const { data: match } = await supabase
        .from("matches")
        .select("status, winner_address, player1_address, player2_address")
        .eq("id", matchId)
        .single();

    if (!match || match.status !== 'completed' || !match.winner_address) {
        console.log(`[PayoutService] Match ${matchId} not ready for payout`);
        return;
    }

    // Determine winner role
    const winner = match.winner_address === match.player1_address ? 'player1' :
        match.winner_address === match.player2_address ? 'player2' : null;

    if (!winner) return;

    // 2. Get Pool
    const { data: poolData } = await (supabase
        .from("betting_pools" as any)
        .select("*")
        .eq("match_id", matchId)
        .single() as any);

    if (!poolData || poolData.status === 'resolved') return;

    // 3. Lock Pool
    await (supabase
        .from("betting_pools" as any)
        .update({ status: 'resolved', winner, resolved_at: new Date().toISOString() })
        .eq("id", poolData.id) as any);

    // 4. Get Bets
    const { data: betsData } = await (supabase
        .from("bets" as any)
        .select("*")
        .eq("pool_id", poolData.id)
        .eq("status", "confirmed") as any);

    if (!betsData || betsData.length === 0) return;

    const pool = transformPoolFromDb({ ...poolData, winner });
    const bets: Bet[] = betsData.map((row: any) => transformBetFromDb(row));

    // 5. Process Payouts
    const result = await processPoolPayouts(pool, bets);

    // 6. Update Bet Statuses
    for (const bet of bets) {
        const isWinner = bet.betOn === winner;
        const payoutInfo = result.payouts.find(p => p.bettorAddress === bet.bettorAddress);

        await (supabase
            .from("bets" as any)
            .update({
                status: isWinner ? 'won' : 'lost',
                payout_amount: isWinner && payoutInfo ? payoutInfo.amount.toString() : null,
                payout_tx_id: isWinner && payoutInfo?.txId ? payoutInfo.txId : null,
                paid_at: isWinner && payoutInfo?.txId ? new Date().toISOString() : null,
            })
            .eq("id", bet.id) as any);
    }

    console.log(`[PayoutService] Processed payouts for match ${matchId}: ${result.totalPaidOut} Sompi paid`);
}

/**
 * Resolve stake payout for a private room match with stakes.
 * Sends (2x stake - 0.1% fee) to the winner.
 */
export async function resolveMatchStakePayout(matchId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    // 1. Get Match with stake info
    const { data: match } = await supabase
        .from("matches")
        .select("status, winner_address, player1_address, player2_address, stake_amount, stakes_confirmed, player1_stake_tx_id, player2_stake_tx_id")
        .eq("id", matchId)
        .single() as {
            data: {
                status: string;
                winner_address: string | null;
                player1_address: string;
                player2_address: string;
                stake_amount: string | null;
                stakes_confirmed: boolean;
                player1_stake_tx_id: string | null;
                player2_stake_tx_id: string | null;
            } | null; error: any
        };

    if (!match || match.status !== 'completed' || !match.winner_address) {
        console.log(`[StakePayout] Match ${matchId} not ready for stake payout`);
        return;
    }

    // Check if match has stakes
    if (!match.stake_amount || BigInt(match.stake_amount) <= 0) {
        console.log(`[StakePayout] Match ${matchId} has no stakes`);
        return;
    }

    // Check if stakes were confirmed
    if (!match.stakes_confirmed) {
        console.log(`[StakePayout] Match ${matchId} stakes were not confirmed, skipping payout`);
        return;
    }

    // Only pay out if both players deposited
    if (!match.player1_stake_tx_id || !match.player2_stake_tx_id) {
        console.log(`[StakePayout] Match ${matchId} missing stake deposits, skipping payout`);
        return;
    }

    const stakePerPlayer = BigInt(match.stake_amount);
    const totalStake = stakePerPlayer * BigInt(2);

    // Calculate fee (0.1% = 1/1000)
    const FEE_BASIS_POINTS = BigInt(10); // 0.1% = 10 basis points
    const BASIS_POINTS_DIVISOR = BigInt(10000);
    const fee = (totalStake * FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR;
    const payoutAmount = totalStake - fee;

    console.log(`[StakePayout] Match ${matchId}: Total stake ${sompiToKas(totalStake)} KAS, fee ${sompiToKas(fee)} KAS, payout ${sompiToKas(payoutAmount)} KAS to ${match.winner_address.slice(-8)}`);

    // Determine network from winner address
    const isTestnet = match.winner_address.startsWith("kaspatest:");
    const network: NetworkType = isTestnet ? "testnet" : "mainnet";

    // Send payout to winner
    const batchResult = await sendBatchFromVault(network, [{
        toAddress: match.winner_address,
        amountSompi: payoutAmount,
        reason: `Match Stake Payout: ${matchId}`
    }]);

    const result = batchResult.results[0];

    if (result && result.success) {
        console.log(`[StakePayout] ✓ Sent ${sompiToKas(payoutAmount)} KAS to winner ${match.winner_address.slice(-8)}. TX: ${result.txId}`);
    } else {
        console.error(`[StakePayout] ✗ Failed to send stake payout:`, result?.error || "Unknown error");
    }
}


/**
 * Refund stakes for a match.
 * Called when a match is cancelled or expires.
 * Refunds any confirming deposits to the respective players.
 */
export async function refundMatchStakes(matchId: string): Promise<{ success: boolean; refundedCount: number; errors: string[] }> {
    const supabase = await createSupabaseServerClient();

    // 1. Get Match with stake info
    const { data: match } = await supabase
        .from("matches")
        .select("status, player1_address, player2_address, stake_amount, stakes_confirmed, player1_stake_tx_id, player2_stake_tx_id")
        .eq("id", matchId)
        .single() as any;

    const result = { success: true, refundedCount: 0, errors: [] as string[] };

    if (!match) {
        result.success = false;
        result.errors.push("Match not found");
        return result;
    }

    // Check if match has stakes
    if (!match.stake_amount || BigInt(match.stake_amount) <= BigInt(0)) {
        return result; // No stakes to refund
    }

    const stakeAmount = BigInt(match.stake_amount);

    // 5. Build refund targets
    const refunds: PayoutTarget[] = [];

    // Refund Player 1 if they deposited
    if (match.player1_stake_tx_id) {
        console.log(`[StakeRefund] Refunding P1 ${match.player1_address.slice(-8)}...`);
        refunds.push({
            toAddress: match.player1_address,
            amountSompi: stakeAmount,
            reason: `Match Stake Refund: ${matchId} (P1)`
        });
    }

    // Refund Player 2 if they deposited
    if (match.player2_stake_tx_id && match.player2_address) {
        console.log(`[StakeRefund] Refunding P2 ${match.player2_address.slice(-8)}...`);
        refunds.push({
            toAddress: match.player2_address,
            amountSompi: stakeAmount,
            reason: `Match Stake Refund: ${matchId} (P2)`
        });
    }

    if (refunds.length === 0) return result;

    const isTestnet = match.player1_address.startsWith("kaspatest:");
    const network: NetworkType = isTestnet ? "testnet" : "mainnet";

    const batchResult = await sendBatchFromVault(network, refunds);

    // Process results
    for (let i = 0; i < batchResult.results.length; i++) {
        const txResult = batchResult.results[i];
        const refund = refunds[i];

        if (txResult.success) {
            console.log(`[StakeRefund] ✓ Refunded ${sompiToKas(stakeAmount)} KAS to ${refund.toAddress.slice(-8)}. TX: ${txResult.txId}`);
            result.refundedCount++;
        } else {
            console.error(`[StakeRefund] Failed to refund ${refund.toAddress.slice(-8)}: ${txResult.error}`);
            result.errors.push(`Refund Failed for ${refund.toAddress.slice(-8)}: ${txResult.error}`);
            result.success = false;
        }
    }

    return result;
}

/**
 * Refund all bets for a match.
 * Called when a match is cancelled.
 */
export async function refundBettingPool(matchId: string): Promise<{ success: boolean; refundedCount: number; errors: string[] }> {
    const supabase = await createSupabaseServerClient();

    const result = { success: true, refundedCount: 0, errors: [] as string[] };

    // 1. Get Pool
    const { data: poolData } = await (supabase
        .from("betting_pools" as any)
        .select("*")
        .eq("match_id", matchId)
        .single() as any);

    if (!poolData) {
        // No pool found, nothing to refund
        return result;
    }

    if (poolData.status === 'refunded') {
        // Already refunded
        return result;
    }

    // 2. Lock Pool
    await (supabase
        .from("betting_pools" as any)
        .update({ status: 'refunded', resolved_at: new Date().toISOString() })
        .eq("id", poolData.id) as any);

    // 3. Get Confirmed Bets
    const { data: betsData } = await (supabase
        .from("bets" as any)
        .select("*")
        .eq("pool_id", poolData.id)
        .eq("status", "confirmed") as any);

    if (!betsData || betsData.length === 0) {
        return result;
    }

    const bets: Bet[] = betsData.map((row: any) => transformBetFromDb(row));
    console.log(`[BetRefund] Refunding ${bets.length} bets for match ${matchId}...`);

    // 4. Determine Network
    const firstBettorAddress = bets[0].bettorAddress;
    const isTestnet = firstBettorAddress.startsWith("kaspatest:");
    const network: NetworkType = isTestnet ? "testnet" : "mainnet";

    // 5. Build refund targets
    const refunds: PayoutTarget[] = bets.map(bet => ({
        toAddress: bet.bettorAddress,
        amountSompi: bet.amount,
        reason: `Bet Refund: Match ${matchId}`
    }));

    // 6. Send Batch
    const batchResult = await sendBatchFromVault(network, refunds);

    // 7. Process Results
    for (let i = 0; i < batchResult.results.length; i++) {
        const txResult = batchResult.results[i];
        const bet = bets[i];

        if (txResult.success) {
            await (supabase
                .from("bets" as any)
                .update({
                    status: 'refunded',
                    payout_amount: bet.amount.toString(),
                    payout_tx_id: txResult.txId,
                    paid_at: new Date().toISOString(),
                })
                .eq("id", bet.id) as any);

            result.refundedCount++;
        } else {
            console.error(`[BetRefund] Failed to refund bet ${bet.id}: ${txResult.error}`);
            result.errors.push(`Failed to refund bet ${bet.id}: ${txResult.error}`);
            result.success = false;
        }
    }

    return result;
}
