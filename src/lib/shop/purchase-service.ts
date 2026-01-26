/**
 * Shop Purchase Service (Client-Side)
 * Handles purchase flow with client-side NFT minting
 * 
 * Flow: User spends Clash Shards → Client mints NFT to user's wallet → Complete purchase
 */

import { getConnectedAddress, isWalletConnected } from '@/lib/kaspa/wallet';
import { mintCosmeticNFTClient } from '@/lib/kaspa/nft-minter-client';
import { NETWORK_CONFIG, type NetworkType } from '@/types/constants';
import type { CosmeticItem } from '@/types/cosmetic';

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
    nftTxId?: string;    // NFT inscription transaction ID
    error?: string;
    errorCode?: 'INSUFFICIENT_FUNDS' | 'ALREADY_OWNED' | 'ITEM_NOT_FOUND' | 'WALLET_ERROR' | 'NFT_MINT_FAILED' | 'SYSTEM_ERROR';
}

// =============================================================================
// PURCHASE FUNCTIONS
// =============================================================================

/**
 * Process a shop purchase with client-side NFT minting
 * 
 * Flow:
 * 1. Verify wallet connection
 * 2. Mint NFT client-side (user pays gas, owns NFT)
 * 3. Call backend to deduct Clash Shards and record purchase
 */
export async function processPurchaseWithNFT(
    request: PurchaseRequest,
    cosmetic: CosmeticItem,
    onProgress?: (step: string) => void
): Promise<PurchaseResult> {
    const { playerId, cosmeticId } = request;

    try {
        // Step 1: Verify wallet connection
        onProgress?.("Verifying wallet...");
        if (!isWalletConnected()) {
            return {
                success: false,
                error: 'Wallet not connected. Please connect your wallet.',
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

        console.log(`[PurchaseService] Processing purchase: ${cosmetic.name}`);

        // Step 2: Mint NFT client-side
        onProgress?.("Minting NFT to your wallet...");
        console.log('[PurchaseService] Minting NFT client-side...');
        
        const nftResult = await mintCosmeticNFTClient(cosmetic);
        
        if (!nftResult.success || !nftResult.txId) {
            console.error('[PurchaseService] NFT minting failed:', nftResult.error);
            return {
                success: false,
                error: nftResult.error || 'Failed to mint NFT. Please try again.',
                errorCode: 'NFT_MINT_FAILED',
            };
        }

        console.log('[PurchaseService] NFT minted successfully! TX:', nftResult.txId);

        // Step 3: Call backend to complete purchase (deduct shards, record in DB)
        onProgress?.("Completing purchase...");
        console.log('[PurchaseService] Completing purchase on backend...');
        
        const response = await fetch('/api/shop/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId,
                cosmeticId,
                nftTxId: nftResult.txId, // Include NFT transaction ID for verification
                nftMetadata: nftResult.metadata,
            }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error('[PurchaseService] Backend purchase failed:', result.error);
            
            // NFT was minted but backend failed
            // User still owns the NFT on-chain, but didn't spend shards
            return {
                success: false,
                nftTxId: nftResult.txId, // Return NFT TX so user can verify they own it
                error: result.error || 'Purchase confirmation failed. You own the NFT but may need to contact support.',
                errorCode: result.errorCode || 'SYSTEM_ERROR',
            };
        }

        return {
            success: true,
            purchaseId: result.purchaseId,
            newBalance: result.newBalance,
            nftTxId: nftResult.txId,
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
 * Process a purchase without NFT minting (Clash Shards only)
 * Used when user doesn't want NFT or wallet not connected
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
