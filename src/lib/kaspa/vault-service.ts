/**
 * Kaspa Vault Transaction Service (Server-Side ONLY)
 * 
 * ⚠️ CRITICAL: This service handles private keys and must NEVER be imported client-side.
 * All functions in this file are designed to run exclusively in API routes.
 * 
 * Uses kaspalib for transaction building/signing (same as payout-service.ts).
 */

import { NETWORK_CONFIG, type NetworkType, KASPA_CONSTANTS } from "@/types/constants";
import { Transaction, Address, OutScript, hexToBytes } from 'kaspalib';

// =============================================================================
// TYPES
// =============================================================================

export interface VaultConfig {
    address: string;
    privateKey: string;
    network: NetworkType;
}

export interface VaultBalance {
    balance: bigint;
    balanceKAS: number;
    address: string;
    network: NetworkType;
}

export interface VaultTransferResult {
    success: boolean;
    txId?: string;
    error?: string;
    amount: bigint;
    toAddress: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SOMPI_PER_KAS = BigInt(KASPA_CONSTANTS.SOMPI_PER_KAS);

// Default transaction fee in sompi (0.001 KAS)
const DEFAULT_TX_FEE = BigInt(100000);

// Maximum retries for transaction broadcast
// Increased to 5 to handle transient API/RPC failures
const MAX_BROADCAST_RETRIES = 5;

// Maximum inputs to avoid oversized transactions
const MAX_INPUTS = 80;

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Get vault configuration for the specified network.
 * Reads from environment variables.
 */
export function getVaultConfig(network: NetworkType): VaultConfig {
    const isMainnet = network === "mainnet";

    const address = isMainnet
        ? process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET
        : process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET;

    const privateKey = isMainnet
        ? process.env.BETTING_VAULT_PRIVATE_KEY_MAINNET
        : process.env.BETTING_VAULT_PRIVATE_KEY_TESTNET;

    if (!address) {
        throw new Error(`Vault address not configured for ${network}`);
    }

    if (!privateKey) {
        throw new Error(`Vault private key not configured for ${network}`);
    }

    return {
        address,
        privateKey,
        network,
    };
}

/**
 * Get the public vault address for the specified network.
 * Safe to call from anywhere as it only returns public info.
 */
export function getVaultAddress(network: NetworkType): string {
    const isMainnet = network === "mainnet";

    const address = isMainnet
        ? process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET
        : process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET;

    if (!address) {
        throw new Error(`Vault address not configured for ${network}`);
    }

    return address;
}

/**
 * Get API base URL for the specified network.
 */
function getApiBaseUrl(network: NetworkType): string {
    return network === "mainnet"
        ? "https://api.kaspa.org"
        : "https://api-tn10.kaspa.org";
}

// =============================================================================
// API HELPERS
// =============================================================================

async function getUtxos(apiUrl: string, address: string) {
    const res = await fetch(`${apiUrl}/addresses/${address}/utxos`, {
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed to fetch utxos: ${res.statusText}`);
    return await res.json();
}

async function submitTransactionToApi(apiUrl: string, txJson: unknown) {
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
// BALANCE OPERATIONS
// =============================================================================

/**
 * Get the current balance of the treasury vault.
 * Calculates balance from UTXOs (same approach as payout-service.ts).
 */
export async function getVaultBalance(network: NetworkType): Promise<VaultBalance> {
    const config = getVaultConfig(network);
    const apiUrl = getApiBaseUrl(network);

    try {
        // Get balance by summing UTXOs (same approach as payout-service.ts)
        const utxos = await getUtxos(apiUrl, config.address);

        // Sum up all UTXO amounts
        let balance = BigInt(0);
        for (const utxo of utxos) {
            balance += BigInt(utxo.utxoEntry.amount);
        }

        return {
            balance,
            balanceKAS: Number(balance) / Number(SOMPI_PER_KAS),
            address: config.address,
            network,
        };
    } catch (error) {
        console.error("[VaultService] Failed to get vault balance:", error);
        throw new Error(`Failed to get vault balance: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

// =============================================================================
// TRANSFER OPERATIONS  
// =============================================================================

/**
 * Send KAS from the vault to a recipient address.
 * Uses the same transaction building approach as payout-service.ts.
 */
export async function sendFromVault(
    network: NetworkType,
    toAddress: string,
    amountSompi: bigint,
    reason: string
): Promise<VaultTransferResult> {
    const config = getVaultConfig(network);
    const isTestnet = network === "testnet";
    const apiUrl = getApiBaseUrl(network);

    console.log(`[VaultService] Initiating transfer: ${amountSompi} sompi to ${toAddress}`);
    console.log(`[VaultService] Reason: ${reason}`);

    // Validate inputs
    if (amountSompi <= 0n) {
        return {
            success: false,
            error: "Amount must be positive",
            amount: amountSompi,
            toAddress,
        };
    }

    if (!toAddress.startsWith(NETWORK_CONFIG[network].prefix)) {
        return {
            success: false,
            error: `Invalid address prefix for ${network}`,
            amount: amountSompi,
            toAddress,
        };
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_BROADCAST_RETRIES; attempt++) {
        try {
            console.log(`[VaultService] Attempt ${attempt}/${MAX_BROADCAST_RETRIES}`);

            // 1. Prepare keys and address
            const privateKey = hexToBytes(config.privateKey);
            const addrParser = Address({ prefix: isTestnet ? "kaspatest" : "kaspa" });
            const vaultDecoded = addrParser.decode(config.address);

            // 2. Fetch UTXOs
            const utxos = await getUtxos(apiUrl, config.address);
            if (!utxos || utxos.length === 0) {
                throw new Error(`Vault has no UTXOs (empty balance)`);
            }

            // 3. Select UTXOs
            const totalRequired = amountSompi + DEFAULT_TX_FEE;

            // Sort descending by amount
            utxos.sort((a: { utxoEntry: { amount: string } }, b: { utxoEntry: { amount: string } }) => {
                const amountA = BigInt(a.utxoEntry.amount);
                const amountB = BigInt(b.utxoEntry.amount);
                return amountA < amountB ? 1 : amountA > amountB ? -1 : 0;
            });

            const selectedUtxos: typeof utxos = [];
            let inputAmount = BigInt(0);

            // Select essentials (largest first)
            for (const u of utxos) {
                if (inputAmount >= totalRequired) break;
                if (selectedUtxos.length >= MAX_INPUTS) break;
                selectedUtxos.push(u);
                inputAmount += BigInt(u.utxoEntry.amount);
            }

            if (inputAmount < totalRequired) {
                throw new Error(`Insufficient funds: Have ${sompiToKas(inputAmount)} KAS, Need ${sompiToKas(totalRequired)} KAS`);
            }

            // 4. Construct Inputs
            const inputs = selectedUtxos.map((u: {
                outpoint: { transactionId: string; index: number };
                utxoEntry: { amount: string; scriptPublicKey: { version?: number; scriptPublicKey: string } };
            }) => ({
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

            console.log(`[VaultService] ✓ Sent ${sompiToKas(amountSompi)} KAS to ${toAddress}. TX: ${txId}`);

            return {
                success: true,
                txId,
                amount: amountSompi,
                toAddress,
            };

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.error(`[VaultService] Attempt ${attempt} failed:`, lastError.message);

            // If not last attempt, wait before retry (with exponential backoff)
            // Start at 3s, then 6s, 9s, 12s, 15s to allow UTXOs to refresh
            if (attempt < MAX_BROADCAST_RETRIES) {
                const delay = Math.min(3000 * attempt, 15000);
                console.log(`[VaultService] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // All retries failed
    console.error(`[VaultService] All ${MAX_BROADCAST_RETRIES} attempts failed. Last error:`, lastError?.message);

    return {
        success: false,
        error: lastError?.message || "Unknown error after retries",
        amount: amountSompi,
        toAddress,
    };
}

/**
 * Payout target for batch transfers.
 */
export interface PayoutTarget {
    toAddress: string;
    amountSompi: bigint;
    reason: string;
}

/**
 * Result of a batch transfer.
 */
export interface BatchTransferResult {
    success: boolean;
    results: VaultTransferResult[];
    totalSent: bigint;
    failedCount: number;
}

/**
 * Send multiple payouts from the vault using chained transactions.
 * This uses the change output from each successful transaction as input for the next,
 * avoiding the orphan transaction issue caused by stale UTXO data from the API.
 */
export async function sendBatchFromVault(
    network: NetworkType,
    payouts: PayoutTarget[]
): Promise<BatchTransferResult> {
    const config = getVaultConfig(network);
    const isTestnet = network === "testnet";
    const apiUrl = getApiBaseUrl(network);
    const addrParser = Address({ prefix: isTestnet ? "kaspatest" : "kaspa" });

    const results: VaultTransferResult[] = [];
    let totalSent = BigInt(0);
    let failedCount = 0;

    console.log(`[VaultService] Starting batch transfer of ${payouts.length} payouts on ${network}`);

    // Filter valid payouts (correct network prefix)
    const validPayouts = payouts.filter(p => {
        if (!p.toAddress.startsWith(NETWORK_CONFIG[network].prefix)) {
            console.error(`[VaultService] Skipping invalid address prefix: ${p.toAddress}`);
            results.push({
                success: false,
                error: `Invalid address prefix for ${network}`,
                amount: p.amountSompi,
                toAddress: p.toAddress,
            });
            failedCount++;
            return false;
        }
        return true;
    });

    if (validPayouts.length === 0) {
        return { success: false, results, totalSent, failedCount };
    }

    try {
        // 1. Initial UTXO fetch
        const privateKey = hexToBytes(config.privateKey);
        const vaultDecoded = addrParser.decode(config.address);
        let utxos = await getUtxos(apiUrl, config.address);

        if (!utxos || utxos.length === 0) {
            throw new Error("Vault has no UTXOs (empty balance)");
        }

        // Track virtual UTXOs (change outputs from our transactions)
        // These represent unconfirmed change that we can spend immediately
        interface VirtualUtxo {
            transactionId: string;
            index: number;
            amount: bigint;
            script: Uint8Array;
            version: number;
        }
        let virtualChangeUtxo: VirtualUtxo | null = null;

        // Pre-calculate vault script for change outputs
        const vaultScript = OutScript.encode({
            version: 0,
            type: vaultDecoded.type,
            payload: vaultDecoded.payload
        });

        // Process each payout
        for (const payout of validPayouts) {
            console.log(`[VaultService] Processing: ${sompiToKas(payout.amountSompi)} KAS to ${payout.toAddress.slice(-12)}`);
            console.log(`[VaultService] Reason: ${payout.reason}`);

            let success = false;
            let lastError: Error | null = null;

            for (let attempt = 1; attempt <= MAX_BROADCAST_RETRIES && !success; attempt++) {
                try {
                    console.log(`[VaultService] Attempt ${attempt}/${MAX_BROADCAST_RETRIES}`);

                    // Calculate required amount
                    const totalRequired = payout.amountSompi + DEFAULT_TX_FEE;

                    // Build input list
                    // If we have a virtual change UTXO from a previous TX, use it first
                    const selectedUtxos: Array<{
                        transactionId: Uint8Array;
                        index: number;
                        amount: bigint;
                        script: Uint8Array;
                        version: number;
                    }> = [];
                    let inputAmount = BigInt(0);

                    // Add virtual change UTXO first if available
                    if (virtualChangeUtxo) {
                        selectedUtxos.push({
                            transactionId: hexToBytes(virtualChangeUtxo.transactionId),
                            index: virtualChangeUtxo.index,
                            amount: virtualChangeUtxo.amount,
                            script: virtualChangeUtxo.script,
                            version: virtualChangeUtxo.version,
                        });
                        inputAmount += virtualChangeUtxo.amount;
                        console.log(`[VaultService] Using virtual change UTXO: ${sompiToKas(virtualChangeUtxo.amount)} KAS`);
                    }

                    // Add confirmed UTXOs if needed (sort by amount descending)
                    if (inputAmount < totalRequired) {
                        utxos.sort((a: { utxoEntry: { amount: string } }, b: { utxoEntry: { amount: string } }) => {
                            const amountA = BigInt(a.utxoEntry.amount);
                            const amountB = BigInt(b.utxoEntry.amount);
                            return amountA < amountB ? 1 : amountA > amountB ? -1 : 0;
                        });

                        for (const u of utxos) {
                            if (inputAmount >= totalRequired) break;
                            if (selectedUtxos.length >= MAX_INPUTS) break;

                            // Skip UTXOs that we've already spent in previous transactions
                            // (they're still in the API but we know they're gone)
                            selectedUtxos.push({
                                transactionId: hexToBytes(u.outpoint.transactionId),
                                index: u.outpoint.index,
                                amount: BigInt(u.utxoEntry.amount),
                                script: hexToBytes(u.utxoEntry.scriptPublicKey.scriptPublicKey),
                                version: u.utxoEntry.scriptPublicKey.version || 0,
                            });
                            inputAmount += BigInt(u.utxoEntry.amount);
                        }
                    }

                    if (inputAmount < totalRequired) {
                        throw new Error(`Insufficient funds: Have ${sompiToKas(inputAmount)} KAS, Need ${sompiToKas(totalRequired)} KAS`);
                    }

                    // Build inputs
                    const inputs = selectedUtxos.map(u => ({
                        utxo: {
                            transactionId: u.transactionId,
                            index: u.index,
                            amount: u.amount,
                            version: u.version,
                            script: u.script
                        },
                        script: new Uint8Array(0),
                        sequence: BigInt(0),
                        sigOpCount: 1
                    }));

                    // Build outputs
                    const recipientDecoded = addrParser.decode(payout.toAddress);
                    const recipientScript = OutScript.encode({
                        version: 0,
                        type: recipientDecoded.type,
                        payload: recipientDecoded.payload
                    });

                    const outputs = [{
                        amount: payout.amountSompi,
                        version: recipientScript.version,
                        script: recipientScript.script
                    }];

                    // Calculate change
                    const changeAmount = inputAmount - totalRequired;
                    if (changeAmount > BigInt(0)) {
                        outputs.push({
                            amount: changeAmount,
                            version: vaultScript.version,
                            script: vaultScript.script
                        });
                    }

                    // Create and sign transaction
                    const tx = new Transaction({
                        version: 0,
                        inputs,
                        outputs,
                        lockTime: BigInt(0),
                        subnetworkId: new Uint8Array(20),
                        gas: BigInt(0),
                        payload: new Uint8Array(0)
                    });

                    const signed = tx.sign(privateKey);
                    if (!signed) throw new Error("Failed to sign transaction");

                    // Submit transaction
                    const rpcTx = tx.toRPCTransaction();
                    // @ts-ignore
                    delete rpcTx.mass;

                    const result = await submitTransactionToApi(apiUrl, { transaction: rpcTx });
                    const txId = result.transactionId;

                    console.log(`[VaultService] ✓ Sent ${sompiToKas(payout.amountSompi)} KAS to ${payout.toAddress}. TX: ${txId}`);

                    // SUCCESS! Update our virtual UTXO tracking
                    // The change output (if any) is at index 1 (recipient is index 0)
                    if (changeAmount > BigInt(0)) {
                        virtualChangeUtxo = {
                            transactionId: txId,
                            index: 1, // Change is always second output
                            amount: changeAmount,
                            script: vaultScript.script,
                            version: vaultScript.version,
                        };
                        console.log(`[VaultService] Tracking virtual change: ${sompiToKas(changeAmount)} KAS`);
                    } else {
                        virtualChangeUtxo = null;
                    }

                    // Mark used UTXOs as spent (remove from our local copy)
                    // We only need to do this for non-virtual UTXOs
                    const usedTxIds = new Set(selectedUtxos.slice(virtualChangeUtxo ? 1 : 0).map(u => {
                        // Convert Uint8Array back to hex for comparison
                        return Array.from(u.transactionId).map(b => b.toString(16).padStart(2, '0')).join('');
                    }));
                    utxos = utxos.filter((u: { outpoint: { transactionId: string } }) => !usedTxIds.has(u.outpoint.transactionId));

                    results.push({
                        success: true,
                        txId,
                        amount: payout.amountSompi,
                        toAddress: payout.toAddress,
                    });
                    totalSent += payout.amountSompi;
                    success = true;

                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    console.error(`[VaultService] Attempt ${attempt} failed:`, lastError.message);

                    // On orphan error, clear virtual UTXO and re-fetch from API
                    if (lastError.message.includes("orphan")) {
                        console.log(`[VaultService] Orphan detected, clearing virtual UTXO and re-fetching...`);
                        virtualChangeUtxo = null;
                        try {
                            utxos = await getUtxos(apiUrl, config.address);
                        } catch (e) {
                            console.error(`[VaultService] Failed to re-fetch UTXOs:`, e);
                        }
                    }

                    if (attempt < MAX_BROADCAST_RETRIES) {
                        const delay = Math.min(3000 * attempt, 15000);
                        console.log(`[VaultService] Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            if (!success) {
                console.error(`[VaultService] Failed payout to ${payout.toAddress}: ${lastError?.message}`);
                results.push({
                    success: false,
                    error: lastError?.message || "Unknown error",
                    amount: payout.amountSompi,
                    toAddress: payout.toAddress,
                });
                failedCount++;

                // Clear virtual UTXO on failure and re-fetch
                virtualChangeUtxo = null;
                try {
                    utxos = await getUtxos(apiUrl, config.address);
                } catch (e) {
                    console.error(`[VaultService] Failed to re-fetch UTXOs after failure:`, e);
                }
            }

            // Small delay between payouts for API rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

    } catch (error) {
        console.error(`[VaultService] Batch transfer failed:`, error);
        // Mark all remaining as failed
        for (const payout of validPayouts.slice(results.length)) {
            results.push({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                amount: payout.amountSompi,
                toAddress: payout.toAddress,
            });
            failedCount++;
        }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[VaultService] Batch complete: ${successCount}/${payouts.length} successful, ${sompiToKas(totalSent)} KAS sent`);

    return {
        success: failedCount === 0,
        results,
        totalSent,
        failedCount,
    };
}

// =============================================================================
// UTXO CONSOLIDATION
// =============================================================================

/**
 * Consolidate multiple small UTXOs into a single UTXO.
 * This helps prevent UTXO fragmentation in the vault wallet.
 * 
 * @param network - The network to operate on
 * @param minUtxosToConsolidate - Minimum number of UTXOs before consolidation (default: 2)
 * @returns Result of the consolidation operation
 */
export async function consolidateVaultUtxos(
    network: NetworkType,
    minUtxosToConsolidate: number = 2
): Promise<{
    success: boolean;
    consolidated: boolean;
    utxoCount: number;
    txId?: string;
    error?: string;
}> {
    const config = getVaultConfig(network);
    const isTestnet = network === "testnet";
    const apiUrl = getApiBaseUrl(network);

    console.log(`[VaultService] Checking UTXOs for consolidation on ${network}`);

    try {
        // 1. Fetch UTXOs
        const utxos = await getUtxos(apiUrl, config.address);

        if (!utxos || utxos.length === 0) {
            console.log(`[VaultService] No UTXOs to consolidate`);
            return {
                success: true,
                consolidated: false,
                utxoCount: 0,
            };
        }

        console.log(`[VaultService] Found ${utxos.length} UTXOs`);

        // 2. Check if consolidation is needed
        if (utxos.length < minUtxosToConsolidate) {
            console.log(`[VaultService] UTXO count (${utxos.length}) below threshold (${minUtxosToConsolidate}), skipping consolidation`);
            return {
                success: true,
                consolidated: false,
                utxoCount: utxos.length,
            };
        }

        console.log(`[VaultService] Consolidating ${utxos.length} UTXOs into one`);

        // 3. Prepare keys and address
        const privateKey = hexToBytes(config.privateKey);
        const addrParser = Address({ prefix: isTestnet ? "kaspatest" : "kaspa" });
        const vaultDecoded = addrParser.decode(config.address);

        // 4. Calculate total amount and select UTXOs (up to MAX_INPUTS)
        const selectedUtxos = utxos.slice(0, MAX_INPUTS);
        let totalAmount = BigInt(0);

        for (const u of selectedUtxos) {
            totalAmount += BigInt(u.utxoEntry.amount);
        }

        // 5. Subtract transaction fee
        const outputAmount = totalAmount - DEFAULT_TX_FEE;

        if (outputAmount <= BigInt(0)) {
            throw new Error(`Insufficient funds to cover transaction fee`);
        }

        // 6. Construct Inputs
        const inputs = selectedUtxos.map((u: {
            outpoint: { transactionId: string; index: number };
            utxoEntry: { amount: string; scriptPublicKey: { version?: number; scriptPublicKey: string } };
        }) => ({
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

        // 7. Construct Output (send consolidated amount back to vault)
        const vaultScript = OutScript.encode({
            version: 0,
            type: vaultDecoded.type,
            payload: vaultDecoded.payload
        });

        const outputs = [{
            amount: outputAmount,
            version: vaultScript.version,
            script: vaultScript.script
        }];

        // 8. Create Transaction
        const tx = new Transaction({
            version: 0,
            inputs,
            outputs,
            lockTime: BigInt(0),
            subnetworkId: new Uint8Array(20),
            gas: BigInt(0),
            payload: new Uint8Array(0)
        });

        // 9. Sign
        const signed = tx.sign(privateKey);
        if (!signed) throw new Error("Failed to sign consolidation transaction");

        // 10. Submit
        const rpcTx = tx.toRPCTransaction();
        // @ts-ignore
        delete rpcTx.mass;

        const result = await submitTransactionToApi(apiUrl, { transaction: rpcTx });
        const txId = result.transactionId;

        console.log(`[VaultService] ✓ Consolidated ${selectedUtxos.length} UTXOs into 1. Output: ${sompiToKas(outputAmount)} KAS. TX: ${txId}`);

        return {
            success: true,
            consolidated: true,
            utxoCount: utxos.length,
            txId,
        };

    } catch (error) {
        console.error(`[VaultService] Failed to consolidate UTXOs:`, error);
        return {
            success: false,
            consolidated: false,
            utxoCount: 0,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert KAS to sompi.
 */
export function kasToSompi(kas: number): bigint {
    return BigInt(Math.floor(kas * Number(SOMPI_PER_KAS)));
}

/**
 * Convert sompi to KAS.
 */
export function sompiToKas(sompi: bigint): number {
    return Number(sompi) / Number(SOMPI_PER_KAS);
}

/**
 * Get transaction explorer URL.
 */
export function getTxExplorerUrl(txId: string, network: NetworkType): string {
    return `${NETWORK_CONFIG[network].explorerUrl}/txs/${txId}`;
}

/**
 * Validate a Kaspa address format.
 */
export function isValidKaspaAddress(address: string, network: NetworkType): boolean {
    const prefix = NETWORK_CONFIG[network].prefix;
    return address.startsWith(prefix) && address.length > prefix.length + 10;
}
