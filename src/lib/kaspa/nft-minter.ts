/**
 * Kaspa NFT Minter Service
 * Mints cosmetic NFTs by sending transactions with metadata in payload
 * 
 * Uses Kaspa's transaction payload (OP_RETURN style) to inscribe NFT metadata
 * directly on the blockchain. Each cosmetic purchase triggers an NFT mint
 * transaction to the player's wallet.
 */

import { sendKaspa } from './wallet';
import type { CosmeticItem } from '@/types/cosmetic';

// =============================================================================
// TYPES
// =============================================================================

/**
 * NFT Metadata Structure
 * This metadata is encoded in the transaction payload
 */
export interface CosmeticNFTMetadata {
    protocol: 'KCLASH-NFT'; // Protocol identifier
    version: '1.0';
    type: 'cosmetic';
    cosmetic: {
        id: string;
        name: string;
        category: string;
        rarity: string;
        thumbnailUrl: string;
        assetPath: string;
    };
    mintedAt: string; // ISO timestamp
    mintedBy: string; // Treasury/system identifier
}

export interface NFTMintResult {
    success: boolean;
    txId?: string;
    metadata?: CosmeticNFTMetadata;
    error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Minimal amount to send for NFT mint (1 sompi = 0.00000001 KAS)
// This ensures the transaction is valid while being essentially free
const NFT_MINT_AMOUNT_SOMPI = 1000; // 0.00001 KAS

// Maximum payload size for Kaspa transactions
const MAX_PAYLOAD_SIZE = 512; // bytes

// =============================================================================
// NFT MINTING FUNCTIONS
// =============================================================================

/**
 * Build NFT metadata payload
 */
function buildNFTMetadata(
    cosmetic: CosmeticItem,
    playerAddress: string
): CosmeticNFTMetadata {
    return {
        protocol: 'KCLASH-NFT',
        version: '1.0',
        type: 'cosmetic',
        cosmetic: {
            id: cosmetic.id,
            name: cosmetic.name,
            category: cosmetic.category,
            rarity: cosmetic.rarity,
            thumbnailUrl: cosmetic.thumbnailUrl,
            assetPath: cosmetic.assetPath,
        },
        mintedAt: new Date().toISOString(),
        mintedBy: 'KaspaClash-Treasury',
    };
}

/**
 * Encode metadata as compact JSON string for transaction payload
 * Ensures the payload fits within Kaspa's size limits
 */
function encodeMetadataPayload(metadata: CosmeticNFTMetadata): string {
    // Compact JSON encoding (no extra whitespace)
    const jsonStr = JSON.stringify(metadata);
    
    // Check size limit
    const byteSize = new TextEncoder().encode(jsonStr).length;
    if (byteSize > MAX_PAYLOAD_SIZE) {
        // If too large, create a minimal version
        const minimalMetadata = {
            protocol: metadata.protocol,
            v: metadata.version,
            type: metadata.type,
            cosmetic: {
                id: metadata.cosmetic.id,
                name: metadata.cosmetic.name.substring(0, 20),
                cat: metadata.cosmetic.category,
                rar: metadata.cosmetic.rarity,
            },
            ts: metadata.mintedAt,
        };
        return JSON.stringify(minimalMetadata);
    }
    
    return jsonStr;
}

/**
 * Mint a cosmetic NFT to a player's wallet
 * 
 * This sends a minimal transaction (0.00001 KAS) to the player's address
 * with the NFT metadata embedded in the payload. The transaction serves
 * as the NFT "mint" - proving ownership on-chain.
 * 
 * @param playerAddress - The player's Kaspa wallet address
 * @param cosmetic - The cosmetic item being minted as an NFT
 * @param fromWallet - The wallet to mint from (typically treasury/system wallet)
 * @returns Mint result with transaction ID
 */
export async function mintCosmeticNFT(
    playerAddress: string,
    cosmetic: CosmeticItem,
    fromWallet?: any // Optional: use specific wallet connection
): Promise<NFTMintResult> {
    try {
        console.log(`[NFT-Minter] Minting NFT for cosmetic: ${cosmetic.name}`);
        console.log(`[NFT-Minter] Recipient: ${playerAddress}`);

        // Build NFT metadata
        const metadata = buildNFTMetadata(cosmetic, playerAddress);
        
        // Encode as compact payload
        const payload = encodeMetadataPayload(metadata);
        
        console.log(`[NFT-Minter] Payload size: ${new TextEncoder().encode(payload).length} bytes`);
        console.log(`[NFT-Minter] Metadata:`, metadata);

        // Send NFT mint transaction
        // Sends minimal amount (0.00001 KAS) with metadata in payload
        const txId = await sendKaspa(
            playerAddress,
            NFT_MINT_AMOUNT_SOMPI,
            payload
        );

        console.log(`[NFT-Minter] NFT minted successfully! TX: ${txId}`);

        return {
            success: true,
            txId,
            metadata,
        };
    } catch (error) {
        console.error('[NFT-Minter] Minting failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error during NFT mint',
        };
    }
}

/**
 * Batch mint multiple NFTs (for future use)
 */
export async function mintMultipleNFTs(
    playerAddress: string,
    cosmetics: CosmeticItem[]
): Promise<NFTMintResult[]> {
    const results: NFTMintResult[] = [];
    
    for (const cosmetic of cosmetics) {
        const result = await mintCosmeticNFT(playerAddress, cosmetic);
        results.push(result);
        
        // Add small delay between mints to avoid overwhelming the network
        if (results.length < cosmetics.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    return results;
}

/**
 * Verify NFT ownership by checking transaction on-chain
 * (This would require integration with Kaspa explorer API or RPC node)
 */
export async function verifyNFTOwnership(
    playerAddress: string,
    cosmeticId: string
): Promise<boolean> {
    // TODO: Implement verification logic
    // Would query Kaspa explorer/node for transactions to playerAddress
    // and check if any contain the KCLASH-NFT protocol with matching cosmeticId
    console.warn('[NFT-Minter] Verification not yet implemented');
    return false;
}
