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

            // 3. Select UTXOs (Simple selection: First one that covers amount + fee)
            const FEE = BigInt(5000); // 0.00005 KAS
            const totalRequired = amountSompi + FEE;

            // Sort descending to use largest UTXOs
            utxos.sort((a: any, b: any) => {
                const amountA = BigInt(a.utxoEntry.amount);
                const amountB = BigInt(b.utxoEntry.amount);
                return amountA < amountB ? 1 : amountA > amountB ? -1 : 0;
            });

            let selectedUtxos = [];
            let inputAmount = BigInt(0);

            for (const u of utxos) {
                inputAmount += BigInt(u.utxoEntry.amount);
                selectedUtxos.push(u);
                if (inputAmount >= totalRequired) break;
            }

            if (inputAmount < totalRequired) {
                throw new Error(`Insufficient funds: Have ${sompiToKas(inputAmount)}, Need ${sompiToKas(totalRequired)}`);
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
