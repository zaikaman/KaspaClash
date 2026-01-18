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
const MAX_BROADCAST_RETRIES = 3;

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
 */
export async function getVaultBalance(network: NetworkType): Promise<VaultBalance> {
    const config = getVaultConfig(network);

    try {
        const apiUrl = `${getApiBaseUrl(network)}/addresses/${config.address}/balance`;

        const response = await fetch(apiUrl, {
            headers: { "Accept": "application/json" },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Balance API returned ${response.status}`);
        }

        const data = await response.json();
        const balance = BigInt(data.balance || 0);

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

            // If not last attempt, wait before retry
            if (attempt < MAX_BROADCAST_RETRIES) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
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
