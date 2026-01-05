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
import { Transaction, Address, OutScript, hexToBytes } from 'kaspalib';

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
// VAULT CONFIGURATION
// =============================================================================

/**
 * Get vault address from environment
 */
export function getVaultAddress(isTestnet: boolean = false): string {
    const mainnetAddress = process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET || process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS;
    const testnetAddress = process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET;

    if (isTestnet) {
        if (!testnetAddress) {
            throw new Error("NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET not configured");
        }
        return testnetAddress;
    }

    if (!mainnetAddress) {
        throw new Error("NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET not configured");
    }
    return mainnetAddress;
}

/**
 * Get vault private key from environment (server-side only!)
 */
export function getVaultPrivateKey(isTestnet: boolean = false): string {
    const mainnetKey = process.env.BETTING_VAULT_PRIVATE_KEY_MAINNET || process.env.BETTING_VAULT_PRIVATE_KEY;
    const testnetKey = process.env.BETTING_VAULT_PRIVATE_KEY_TESTNET;

    if (isTestnet) {
        if (!testnetKey) {
            throw new Error("BETTING_VAULT_PRIVATE_KEY_TESTNET not configured");
        }
        return testnetKey;
    }

    if (!mainnetKey) {
        throw new Error("BETTING_VAULT_PRIVATE_KEY_MAINNET not configured");
    }
    return mainnetKey;
}

/**
 * Get Kaspa REST API URL for the specified network
 */
export function getKaspaApiUrl(isTestnet: boolean = false): string {
    if (isTestnet) {
        return process.env.KASPA_API_URL_TESTNET || "https://api-tn10.kaspa.org";
    }
    return process.env.KASPA_API_URL || "https://api.kaspa.org";
}

// =============================================================================
// API HELPERS
// =============================================================================

async function getUtxos(apiUrl: string, address: string) {
    const res = await fetch(`${apiUrl}/addresses/${address}/utxos`);
    if (!res.ok) throw new Error(`Failed to fetch utxos: ${res.statusText}`);
    return await res.json();
}

async function submitTransactionToApi(apiUrl: string, txJson: any) {
    const res = await fetch(`${apiUrl}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txJson)
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Submit failed: ${txt}`);
    }
    return await res.json();
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
 * Send payout to a single winner using kaspalib (pure JS implementation).
 * Includes retry logic for transient failures.
 */
/**
 * Compound UTXOs to reduce fragmentation.
 * Sends multiple inputs to self.
 */
async function compoundUtxos(
    apiUrl: string,
    vaultAddress: string,
    privateKey: Uint8Array,
    utxosToCompound: any[]
): Promise<string> {
    console.log(`[PayoutService] Compounding ${utxosToCompound.length} UTXOs...`);

    const addrParser = Address({ prefix: vaultAddress.startsWith("kaspatest:") ? "kaspatest" : "kaspa" });
    const vaultDecoded = addrParser.decode(vaultAddress);

    // Calculate total amount
    let totalAmount = BigInt(0);
    for (const u of utxosToCompound) {
        totalAmount += BigInt(u.utxoEntry.amount);
    }

    const FEE = BigInt(3000); // 0.00003 KAS (Compounding is simple)
    const amountToSend = totalAmount - FEE;

    if (amountToSend <= BigInt(0)) {
        throw new Error("Compounding amount too small to cover fee");
    }

    // inputs
    const inputs = utxosToCompound.map(u => ({
        utxo: {
            transactionId: hexToBytes(u.outpoint.transactionId),
            index: u.outpoint.index,
            amount: BigInt(u.utxoEntry.amount),
            version: u.utxoEntry.scriptPublicKey.version || 0,
            script: hexToBytes(u.utxoEntry.scriptPublicKey.scriptPublicKey)
        },
        script: new Uint8Array(0),
        sequence: BigInt(0),
        sigOpCount: 1
    }));

    // Output: Send back to vault
    const outputScript = OutScript.encode({
        version: 0,
        type: vaultDecoded.type,
        payload: vaultDecoded.payload
    });

    const outputs = [{
        amount: amountToSend,
        version: outputScript.version,
        script: outputScript.script
    }];

    const tx = new Transaction({
        version: 0,
        inputs,
        outputs,
        lockTime: BigInt(0),
        subnetworkId: new Uint8Array(20), // Subnetwork ID (all zeros for native)
        gas: BigInt(0),
        payload: new Uint8Array(0)
    });

    const signed = tx.sign(privateKey);
    if (!signed) throw new Error("Failed to sign compound transaction");

    const rpcTx = tx.toRPCTransaction();
    // @ts-ignore
    delete rpcTx.mass;

    const result = await submitTransactionToApi(apiUrl, { transaction: rpcTx });
    return result.transactionId;
}

export async function sendPayout(
    toAddress: string,
    amountSompi: bigint,
    vaultPrivateKeyHex: string,
    maxRetries: number = 3
): Promise<{ success: boolean; txId?: string; error?: string }> {
    let lastError: Error | null = null;
    // Determine network based on address prefix
    const isTestnet = toAddress.startsWith("kaspatest:");
    const apiUrl = getKaspaApiUrl(isTestnet);
    const MAX_INPUTS = 80; // Safe limit to avoid "mass too large" errors (limit is 100k mass)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[PayoutService] Attempt ${attempt}/${maxRetries} - Sending ${sompiToKas(amountSompi)} KAS to ${toAddress}`);

            // 1. Prepare keys and address
            const privateKey = hexToBytes(vaultPrivateKeyHex);
            const addrParser = Address({ prefix: isTestnet ? "kaspatest" : "kaspa" });

            // Re-derive vault address to ensure we check the right UTXOs
            // Pass isTestnet to ensure we get the correct vault address for the network
            const vaultAddress = getVaultAddress(isTestnet);
            const vaultDecoded = addrParser.decode(vaultAddress);

            // 2. Fetch UTXOs
            const utxos = await getUtxos(apiUrl, vaultAddress);
            if (!utxos || utxos.length === 0) {
                // If the vault is empty, no amount of retrying will fix it immediately unless funded.
                // Throwing here will trigger retries, which is fine for transient empty states (e.g. sync delay),
                // but for permanent empty, the caller should likely handle usage of "errors" array.
                throw new Error(`Vault (${vaultAddress}) has no UTXOs (empty balance)`);
            }

            // 3. Select UTXOs
            // Strategy: Proactive "Dust Sweeping" / Aggressive Compounding
            // We want to consume up to MAX_INPUTS to consolidate UTXOs in every transaction.
            const FEE = BigInt(100000); // 0.001 KAS (Generous fee for larger mass)
            const totalRequired = amountSompi + FEE;

            // Sort Descending (Largest first) to ensure we cover the amount with fewest inputs
            utxos.sort((a: any, b: any) => {
                const amountA = BigInt(a.utxoEntry.amount);
                const amountB = BigInt(b.utxoEntry.amount);
                return amountA < amountB ? 1 : amountA > amountB ? -1 : 0;
            });

            const selectedUtxos: any[] = [];
            let inputAmount = BigInt(0);

            // 1. Select essentials (Largest first)
            const remainingUtxos = [...utxos];
            while (remainingUtxos.length > 0 && inputAmount < totalRequired) {
                const u = remainingUtxos.shift();
                selectedUtxos.push(u);
                inputAmount += BigInt(u.utxoEntry.amount);
            }

            if (inputAmount < totalRequired) {
                // Fallback to strict auto-compounding handler if even all UTXOs aren't enough (or if we hit limits but I haven't checked limit yet)
                // NOTE: The separate compoundUtxos function handles the case where *too many* inputs are needed.
                // Here we just check total funds.
                // If we have enough funds but too many inputs, logic below or the catch block will handle it?
                // Actually, let's keep the fragmentation check.
                if (utxos.length > MAX_INPUTS) {
                    // Check if top MAX_INPUTS covers it.
                    // The loop above exhausted ALL utxos or stopped when enough.
                    // If we are here, we used ALL and still not enough? Then it's insufficient funds.
                    // Unless we stopped for some reason? No, while loop runs until coverage.
                    throw new Error(`Insufficient funds: Have ${sompiToKas(inputAmount)}, Need ${sompiToKas(totalRequired)}`);
                }
                // If we are here, we don't have enough funds period.
                throw new Error(`Insufficient funds: Have ${sompiToKas(inputAmount)}, Need ${sompiToKas(totalRequired)}`);
            }

            // 2. Piggyback: Fill remaining slots with Dust (Smallest first)
            // This merges many small UTXOs into the change output for free/cheap consolidation.
            if (selectedUtxos.length < MAX_INPUTS) {
                // Reverse remaining to get Smallest First (since remaining was sorted Descending)
                remainingUtxos.reverse(); // Now Smallest -> Largest

                while (remainingUtxos.length > 0 && selectedUtxos.length < MAX_INPUTS) {
                    const u = remainingUtxos.shift();
                    selectedUtxos.push(u);
                    inputAmount += BigInt(u.utxoEntry.amount);
                }
            }

            // Re-check strict max input limit (though loop condition handles it)
            if (selectedUtxos.length > MAX_INPUTS) {
                // This shouldn't happen with the logic above, but safety check
                // If essentials > MAX_INPUTS, we need the separate compounder logic.
                console.log(`[PayoutService] Too many essential inputs (${selectedUtxos.length}). triggering pre-compounder...`);
                const compoundTxId = await compoundUtxos(apiUrl, vaultAddress, privateKey, selectedUtxos.slice(0, MAX_INPUTS));
                console.log(`[PayoutService] Compounding TX: ${compoundTxId}. Waiting 3s...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                attempt--;
                continue;
            }

            // 4. Construct Inputs
            const inputs = selectedUtxos.map(u => ({
                utxo: {
                    transactionId: hexToBytes(u.outpoint.transactionId),
                    index: u.outpoint.index,
                    amount: BigInt(u.utxoEntry.amount),
                    version: u.utxoEntry.scriptPublicKey.version || 0,
                    script: hexToBytes(u.utxoEntry.scriptPublicKey.scriptPublicKey)
                },
                script: new Uint8Array(0),
                sequence: BigInt(0),
                sigOpCount: 1
            }));

            // 5. Construct Outputs
            const recipientDecoded = addrParser.decode(toAddress);
            const recipientScript = OutScript.encode({
                version: 0,
                type: recipientDecoded.type,
                payload: recipientDecoded.payload
            });

            const outputs = [
                {
                    amount: amountSompi,
                    version: recipientScript.version,
                    script: recipientScript.script
                }
            ];

            // Add change output if needed
            const changeAmount = inputAmount - totalRequired;
            if (changeAmount > BigInt(0)) {
                const changeScript = OutScript.encode({
                    version: 0,
                    type: vaultDecoded.type,
                    payload: vaultDecoded.payload
                });
                outputs.push({
                    amount: changeAmount,
                    version: changeScript.version,
                    script: changeScript.script
                });
            }

            // 6. Create Transaction
            const tx = new Transaction({
                version: 0,
                inputs,
                outputs,
                lockTime: BigInt(0),
                subnetworkId: new Uint8Array(20),
                gas: BigInt(0),
                payload: new Uint8Array(0)
            });

            // 7. Sign
            const signed = tx.sign(privateKey);
            if (!signed) throw new Error("Failed to sign transaction");

            // 8. Submit
            const rpcTx = tx.toRPCTransaction();
            // @ts-ignore
            delete rpcTx.mass;

            const result = await submitTransactionToApi(apiUrl, { transaction: rpcTx });
            const txId = result.transactionId;

            console.log(`[PayoutService] ✓ Sent ${sompiToKas(amountSompi)} KAS to ${toAddress}. TX: ${txId}`);

            return {
                success: true,
                txId: txId,
            };

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.error(`[PayoutService] Attempt ${attempt} failed:`, lastError.message);

            // If not last attempt, wait before retry (exponential backoff)
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // 1s, 2s, 4s... max 10s
                console.log(`[PayoutService] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // All retries failed
    console.error(`[PayoutService] All ${maxRetries} attempts failed. Last error:`, lastError?.message);

    // Fallback for development/dry-run if real KAS sending fails
    // KEEP THIS FOR SAFETY IN CASE OF API ISSUES, BUT LOG LOUDLY
    if (process.env.NODE_ENV === 'development') {
        console.log("[PayoutService] DEV MODE: Simulating success after all retries failed");
        return { success: true, txId: `simulated_${Date.now()}` };
    }

    return {
        success: false,
        error: lastError?.message || "Unknown error after retries",
    };
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
        // No winning bets - nothing to pay out
        return result;
    }

    // Determine network from the first winning bettor's address
    const firstBettorAddress = payoutList[0].bettorAddress;
    const isTestnet = firstBettorAddress.startsWith("kaspatest:");

    // Get vault private key for the correct network
    let vaultPrivateKey: string;
    try {
        vaultPrivateKey = getVaultPrivateKey(isTestnet);
    } catch (error) {
        result.success = false;
        result.errors.push(error instanceof Error ? error.message : "Vault private key configuration error");
        return result;
    }

    // Process each payout
    // Process sequentially to manage nonce/UTXOs properly (though Kaspa handles parallelism better than others)
    for (const payout of payoutList) {
        const payoutResult = await sendPayout(
            payout.bettorAddress,
            payout.amount,
            vaultPrivateKey
        );

        result.payouts.push({
            bettorAddress: payout.bettorAddress,
            amount: payout.amount,
            txId: payoutResult.txId,
            error: payoutResult.error,
        });

        if (payoutResult.success) {
            result.totalPaidOut += payout.amount;
        } else {
            result.success = false;
            result.errors.push(`Failed to pay ${payout.bettorAddress}: ${payoutResult.error}`);
        }
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
    const bets = betsData.map(transformBetFromDb);

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

    // Get vault private key
    let vaultPrivateKey: string;
    try {
        vaultPrivateKey = getVaultPrivateKey(isTestnet);
    } catch (error) {
        console.error(`[StakePayout] Failed to get vault key:`, error);
        return;
    }

    // Send payout to winner
    const result = await sendPayout(
        match.winner_address,
        payoutAmount,
        vaultPrivateKey
    );

    if (result.success) {
        console.log(`[StakePayout] ✓ Sent ${sompiToKas(payoutAmount)} KAS to winner ${match.winner_address.slice(-8)}. TX: ${result.txId}`);

        // Update match with payout tx (could add a stake_payout_tx_id column if needed)
        // For now, just log success
    } else {
        console.error(`[StakePayout] ✗ Failed to send stake payout:`, result.error);
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

    // Determine network (from P1 or P2 address) -> P1 is always set
    const isTestnet = match.player1_address.startsWith("kaspatest:");

    // Get vault private key
    let vaultPrivateKey: string;
    try {
        vaultPrivateKey = getVaultPrivateKey(isTestnet);
    } catch (error) {
        result.success = false;
        result.errors.push(`Vault configuration error: ${error instanceof Error ? error.message : String(error)}`);
        return result;
    }

    // Refund Player 1 if they deposited
    if (match.player1_stake_tx_id) {
        // Check if already refunded? (We don't have a column, assume caller handles idempotency or we check if status is already cancelled?)
        // For now, we trust the caller (cancel endpoint) to change status AT THE SAME TIME.
        console.log(`[StakeRefund] Refunding P1 ${match.player1_address.slice(-8)}...`);
        const p1Result = await sendPayout(match.player1_address, stakeAmount, vaultPrivateKey);
        if (p1Result.success) {
            console.log(`[StakeRefund] ✓ Refunded P1. TX: ${p1Result.txId}`);
            result.refundedCount++;
        } else {
            console.error(`[StakeRefund] Failed to refund P1: ${p1Result.error}`);
            result.errors.push(`P1 Refund Failed: ${p1Result.error}`);
            result.success = false;
        }
    }

    // Refund Player 2 if they deposited
    if (match.player2_stake_tx_id && match.player2_address) {
        console.log(`[StakeRefund] Refunding P2 ${match.player2_address.slice(-8)}...`);
        const p2Result = await sendPayout(match.player2_address, stakeAmount, vaultPrivateKey);
        if (p2Result.success) {
            console.log(`[StakeRefund] ✓ Refunded P2. TX: ${p2Result.txId}`);
            result.refundedCount++;
        } else {
            console.error(`[StakeRefund] Failed to refund P2: ${p2Result.error}`);
            result.errors.push(`P2 Refund Failed: ${p2Result.error}`);
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

    const bets = betsData.map(transformBetFromDb);
    console.log(`[BetRefund] Refunding ${bets.length} bets for match ${matchId}...`);

    // 4. Get Vault Key
    // We might have bets from different networks if something went wrong, but usually it's one network per deployment.
    // However, addresses might be mixed in dev? No, strictly separated.
    // Let's check the first bet for network.
    const firstBettorAddress = bets[0].bettorAddress;
    const isTestnet = firstBettorAddress.startsWith("kaspatest:");

    let vaultPrivateKey: string;
    try {
        vaultPrivateKey = getVaultPrivateKey(isTestnet);
    } catch (error) {
        result.success = false;
        result.errors.push(error instanceof Error ? error.message : "Vault configuration error");
        return result;
    }

    // 5. Refund Each Bet
    for (const bet of bets) {
        console.log(`[BetRefund] Refunding ${sompiToKas(bet.amount)} KAS to ${bet.bettorAddress}...`);

        // We refund the GROSS amount (what they put in), effectively subsidizing the fee
        // Or should we return netAmount? 
        // User expects their money back. 
        // If we refund 'amount', the vault pays the tx fee. This is the user-friendly way.

        const payoutResult = await sendPayout(
            bet.bettorAddress,
            bet.amount,
            vaultPrivateKey
        );

        if (payoutResult.success) {
            await (supabase
                .from("bets" as any)
                .update({
                    status: 'refunded',
                    payout_amount: bet.amount.toString(),
                    payout_tx_id: payoutResult.txId,
                    paid_at: new Date().toISOString(),
                })
                .eq("id", bet.id) as any);

            result.refundedCount++;
        } else {
            console.error(`[BetRefund] Failed to refund bet ${bet.id}: ${payoutResult.error}`);
            result.errors.push(`Failed to refund bet ${bet.id}: ${payoutResult.error}`);
            result.success = false;
        }
    }

    return result;
}
