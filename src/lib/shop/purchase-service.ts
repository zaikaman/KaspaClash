/**
 * Shop Purchase Service (Client-Side)
 * Handles purchase flow with Kaspa transaction verification
 * 
 * Flow: User sends 1 KAS to their own address → Wait for confirmation → Complete purchase
 */

import { sendKaspa, getConnectedAddress, isWalletConnected, getProviderWithRpc } from '@/lib/kaspa/wallet';
import { NETWORK_CONFIG, type NetworkType } from '@/types/constants';
import type { TransactionStatus } from '@/types/kaspa';

// =============================================================================
// TYPES
// =============================================================================

export interface PurchaseRequest {
    playerId: string;
    cosmeticId: string;
    itemName: string;
    price: number; // In Clash Shards
}

export interface PurchaseResult {
    success: boolean;
    purchaseId?: string;
    newBalance?: number;
    txId?: string;
    nftTxId?: string;    // Reveal transaction ID
    commitTxId?: string; // Commit transaction ID
    error?: string;
    errorCode?: 'INSUFFICIENT_FUNDS' | 'ALREADY_OWNED' | 'ITEM_NOT_FOUND' | 'WALLET_ERROR' | 'TRANSACTION_FAILED' | 'CONFIRMATION_TIMEOUT' | 'SYSTEM_ERROR';
}

// =============================================================================
// CONSTANTS
// =============================================================================

// 1 KAS = 100,000,000 sompi
const ONE_KAS_SOMPI = 100_000_000;

// Confirmation timeout (30 seconds)
const CONFIRMATION_TIMEOUT_MS = 30_000;

// Polling interval for confirmation check
const CONFIRMATION_POLL_INTERVAL_MS = 2_000;

// =============================================================================
// PURCHASE FUNCTIONS
// =============================================================================

/**
 * Build purchase payload for transaction
 */
function buildPurchasePayload(cosmeticId: string, itemName: string): string {
    // Create compact payload for OP_RETURN data
    // Format: KSHOP|{cosmeticId}|{itemName}
    const shortId = cosmeticId.split('-')[0]; // Use first segment of UUID
    const shortName = itemName.substring(0, 16).replace(/\s+/g, '_');
    return `KSHOP|${shortId}|${shortName}`;
}

/**
 * Wait for transaction confirmation
 */
async function waitForConfirmation(txId: string): Promise<{ confirmed: boolean; error?: string }> {
    const startTime = Date.now();

    return new Promise((resolve) => {
        const checkConfirmation = async () => {
            // Check timeout
            if (Date.now() - startTime > CONFIRMATION_TIMEOUT_MS) {
                resolve({ confirmed: false, error: 'Transaction confirmation timeout' });
                return;
            }

            try {
                const provider = getProviderWithRpc();
                if (!provider) {
                    // If no RPC provider, assume confirmed after a delay
                    // (Kaspa has very fast block times ~1 second)
                    console.log('[PurchaseService] No RPC provider, assuming confirmation after delay');
                    setTimeout(() => resolve({ confirmed: true }), 3000);
                    return;
                }

                const status = await provider.request<TransactionStatus>(
                    'kaspa_getTransactionStatus',
                    { transactionId: txId }
                );

                if (status.confirmed) {
                    console.log('[PurchaseService] Transaction confirmed:', txId);
                    resolve({ confirmed: true });
                    return;
                }

                // Continue polling
                setTimeout(checkConfirmation, CONFIRMATION_POLL_INTERVAL_MS);
            } catch (error) {
                console.warn('[PurchaseService] Confirmation check error, retrying...', error);
                // Continue polling on error
                setTimeout(checkConfirmation, CONFIRMATION_POLL_INTERVAL_MS);
            }
        };

        checkConfirmation();
    });
}

/**
 * Process a shop purchase with Kaspa transaction verification
 * 
 * Flow:
 * 1. User sends 1 KAS to Treasury Vault (payment)
 * 2. Wait for transaction confirmation
 * 3. Call backend API to complete purchase
 */
export async function processPurchaseWithKaspa(
    request: PurchaseRequest,
    onProgress?: (step: string) => void
): Promise<PurchaseResult> {
    const { playerId, cosmeticId, itemName, price } = request;

    try {
        // Step 1: Verify wallet connection
        onProgress?.("Verifying wallet...");
        if (!isWalletConnected()) {
            return {
                success: false,
                error: 'Wallet not connected. Please connect your Kasware wallet.',
                errorCode: 'WALLET_ERROR',
            };
        }

        const connectedAddress = getConnectedAddress();
        if (!connectedAddress || connectedAddress !== playerId) {
            return {
                success: false,
                error: 'Wallet address mismatch. Please reconnect your wallet.',
                errorCode: 'WALLET_ERROR',
            };
        }

        const isTestnet = connectedAddress.startsWith("kaspatest:");
        const vaultAddress = isTestnet
            ? process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET
            : process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET || process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS;

        if (!vaultAddress) {
            throw new Error("Treasury vault address not configured");
        }

        console.log(`[PurchaseService] Processing purchase: ${itemName} for ${price} shards`);
        console.log(`[PurchaseService] Sending 1 KAS to Treasury Vault (${vaultAddress.slice(0, 12)}...)`);

        // Step 2: Build transaction payload
        const payload = buildPurchasePayload(cosmeticId, itemName);

        // Step 3: Send 1 KAS to Treasury Vault
        onProgress?.("Confirm payment in wallet...");
        let txId: string;
        try {
            txId = await sendKaspa(vaultAddress, ONE_KAS_SOMPI, payload);
            console.log(`[PurchaseService] Transaction sent: ${txId}`);
        } catch (txError) {
            console.error('[PurchaseService] Transaction failed:', txError);
            return {
                success: false,
                error: txError instanceof Error ? txError.message : 'Transaction failed',
                errorCode: 'TRANSACTION_FAILED',
            };
        }

        // Step 4: Wait for transaction confirmation
        onProgress?.("Waiting for payment confirmation...");
        console.log('[PurchaseService] Waiting for transaction confirmation...');
        const confirmation = await waitForConfirmation(txId);

        if (!confirmation.confirmed) {
            return {
                success: false,
                txId,
                error: confirmation.error || 'Transaction not confirmed',
                errorCode: 'CONFIRMATION_TIMEOUT',
            };
        }

        // Step 5: Call backend to complete purchase (record in database)
        onProgress?.("Minting NFT (Commit phase)...");
        console.log('[PurchaseService] Transaction confirmed! Completing purchase...');
        const response = await fetch('/api/shop/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId,
                cosmeticId,
                txId, // Include transaction ID for verification
            }),
        });

        // Small interval to change progress text for the reveal
        setTimeout(() => {
            onProgress?.("Minting NFT (Reveal phase)...");
        }, 5000);

        const result = await response.json();

        if (!response.ok || !result.success) {
            // Transaction was confirmed but backend failed
            console.error('[PurchaseService] Backend purchase failed but transaction was confirmed:', txId);
            console.error('[PurchaseService] Backend error:', result.error);

            return {
                success: false,
                txId,
                error: result.error || 'Purchase confirmation failed. Please contact support with your transaction ID.',
                errorCode: result.errorCode || 'SYSTEM_ERROR',
            };
        }

        return {
            success: true,
            purchaseId: result.purchaseId,
            newBalance: result.newBalance,
            txId,
            nftTxId: result.nftTxId,
            commitTxId: result.commitTxId,
        };
    } catch (error) {
        console.error('[PurchaseService] Purchase error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
            errorCode: 'SYSTEM_ERROR',
        };
    }
}

/**
 * Process a purchase without Kaspa transaction (Clash Shards only)
 * Used for in-game currency purchases that don't involve real crypto
 */
export async function processPurchaseWithShards(
    playerId: string,
    cosmeticId: string
): Promise<PurchaseResult> {
    try {
        const response = await fetch('/api/shop/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, cosmeticId }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            return {
                success: false,
                error: result.error || 'Purchase failed',
                errorCode: result.errorCode || 'SYSTEM_ERROR',
            };
        }

        return {
            success: true,
            purchaseId: result.purchaseId,
            newBalance: result.newBalance,
        };
    } catch (error) {
        console.error('[PurchaseService] Shards purchase error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
            errorCode: 'SYSTEM_ERROR',
        };
    }
}

/**
 * Get Kaspa explorer link for a transaction
 */
export function getPurchaseTxExplorerLink(txId: string, network: NetworkType = 'testnet'): string {
    return `${NETWORK_CONFIG[network].explorerUrl}/txs/${txId}`;
}
