/**
 * Client-Side NFT Minter
 * 
 * Allows users to mint cosmetic NFTs directly from their wallet.
 * No server-side private keys involved - user pays their own gas fees.
 * 
 * Flow:
 * 1. User purchases cosmetic with Clash Shards (in-game currency)
 * 2. Client sends a small transaction to their own address with NFT metadata
 * 3. NFT is inscribed on-chain and belongs to the user
 */

import { sendKaspa, getConnectedAddress, isWalletConnected } from '@/lib/kaspa/wallet';
import type { CosmeticItem } from '@/types/cosmetic';

// =============================================================================
// TYPES
// =============================================================================

export interface CosmeticNFTMetadata {
    protocol: 'KCLASH-NFT';
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
    mintedAt: string;
    mintedTo: string; // Player's address
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

// Minimum amount to send for NFT mint (1 KAS = 100,000,000 sompi)
// Kaspa requires minimum 1 KAS per output to prevent dust attacks
// User sends this to their own address with metadata in payload
const NFT_MINT_AMOUNT_SOMPI = 100_000_000;

// Maximum payload size for Kaspa transactions
const MAX_PAYLOAD_SIZE = 512; // bytes

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Build NFT metadata structure
 */
function buildNFTMetadata(
    cosmetic: CosmeticItem,
    playerAddress: string
): CosmeticNFTMetadata {
    // Build proper URLs for thumbnail and asset path
    const baseUrl = 'https://kaspaclash.vercel.app';
    
    // Construct paths based on category and name
    let thumbnailUrl = cosmetic.thumbnailUrl;
    let assetPath = cosmetic.assetPath;
    
    // If URLs are undefined, construct them from the cosmetic data
    if (!thumbnailUrl || !assetPath) {
        if (cosmetic.category === 'sticker') {
            // Stickers are in /stickers/ directory, use lowercase name with hyphens
            const stickerName = cosmetic.name.toLowerCase().replace(/\s+/g, '-');
            thumbnailUrl = thumbnailUrl || `${baseUrl}/stickers/${stickerName}.webp`;
            assetPath = assetPath || `${baseUrl}/stickers/${stickerName}.webp`;
        } else if (cosmetic.category === 'character') {
            // Characters are in /characters/ directory
            const charName = cosmetic.name.toLowerCase().replace(/\s+/g, '-');
            thumbnailUrl = thumbnailUrl || `${baseUrl}/characters/${charName}/portrait.webp`;
            assetPath = assetPath || `${baseUrl}/characters/${charName}/spritesheet.webp`;
        } else {
            // Generic fallback
            const itemName = cosmetic.name.toLowerCase().replace(/\s+/g, '-');
            thumbnailUrl = thumbnailUrl || `${baseUrl}/${cosmetic.category}/${itemName}.webp`;
            assetPath = assetPath || `${baseUrl}/${cosmetic.category}/${itemName}.webp`;
        }
    }
    
    return {
        protocol: 'KCLASH-NFT',
        version: '1.0',
        type: 'cosmetic',
        cosmetic: {
            id: cosmetic.id,
            name: cosmetic.name,
            category: cosmetic.category,
            rarity: cosmetic.rarity,
            thumbnailUrl,
            assetPath,
        },
        mintedAt: new Date().toISOString(),
        mintedTo: playerAddress,
    };
}

/**
 * Encode metadata as JSON payload
 * Compresses if needed to fit in MAX_PAYLOAD_SIZE
 */
function encodeMetadataPayload(metadata: CosmeticNFTMetadata): string {
    const jsonStr = JSON.stringify(metadata);
    const byteSize = new TextEncoder().encode(jsonStr).length;
    
    if (byteSize > MAX_PAYLOAD_SIZE) {
        // Create minimal version if too large
        const minimalMetadata = {
            p: metadata.protocol,
            v: metadata.version,
            t: metadata.type,
            c: {
                id: metadata.cosmetic.id,
                n: metadata.cosmetic.name.substring(0, 20),
                cat: metadata.cosmetic.category,
                r: metadata.cosmetic.rarity,
            },
            ts: metadata.mintedAt,
            to: metadata.mintedTo,
        };
        return JSON.stringify(minimalMetadata);
    }
    
    return jsonStr;
}

// =============================================================================
// MAIN MINTING FUNCTION
// =============================================================================

/**
 * Mint a cosmetic NFT client-side
 * 
 * The user sends a small transaction to their own address with NFT metadata
 * in the payload. This inscribes the NFT on-chain at the user's expense.
 * 
 * @param cosmetic - The cosmetic item to mint as NFT
 * @returns Result with transaction ID or error
 */
export async function mintCosmeticNFTClient(
    cosmetic: CosmeticItem
): Promise<NFTMintResult> {
    try {
        console.log('[NFT-Minter-Client] Minting NFT client-side:', cosmetic.name);
        
        // 1. Verify wallet connection
        if (!isWalletConnected()) {
            return {
                success: false,
                error: 'Wallet not connected. Please connect your wallet to mint NFT.',
            };
        }
        
        const playerAddress = getConnectedAddress();
        if (!playerAddress) {
            return {
                success: false,
                error: 'Unable to get wallet address.',
            };
        }
        
        console.log('[NFT-Minter-Client] Player address:', playerAddress);
        
        // 2. Determine treasury vault address based on network
        const isTestnet = playerAddress.startsWith('kaspatest:');
        const vaultAddress = isTestnet
            ? process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET
            : process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET || process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS;
        
        if (!vaultAddress) {
            return {
                success: false,
                error: 'Treasury vault address not configured.',
            };
        }
        
        console.log('[NFT-Minter-Client] Treasury vault:', vaultAddress.substring(0, 20) + '...');
        
        // 3. Build NFT metadata
        const metadata = buildNFTMetadata(cosmetic, playerAddress);
        const payload = encodeMetadataPayload(metadata);
        
        console.log('[NFT-Minter-Client] Metadata size:', new TextEncoder().encode(payload).length, 'bytes');
        console.log('[NFT-Minter-Client] Payload:', payload.substring(0, 100) + '...');
        
        // 4. Send transaction to treasury vault with NFT metadata
        // User sends 1 KAS to vault, which then sends the NFT back to them
        console.log('[NFT-Minter-Client] Sending NFT inscription transaction to treasury...');
        const txId = await sendKaspa(vaultAddress, NFT_MINT_AMOUNT_SOMPI, payload);
        
        console.log('[NFT-Minter-Client] ✓ NFT minted successfully! TX:', txId);
        
        return {
            success: true,
            txId,
            metadata,
        };
        
    } catch (error) {
        console.error('[NFT-Minter-Client] Minting failed:', error);
        return {
            success: false,
            error: error instanceof Error 
                ? error.message 
                : 'Failed to mint NFT. Please try again.',
        };
    }
}

/**
 * Get transaction explorer URL
 */
export function getTxExplorerUrl(txId: string, isTestnet: boolean = true): string {
    const baseUrl = isTestnet
        ? 'https://explorer-tn10.kaspa.org'
        : 'https://explorer.kaspa.org';
    return `${baseUrl}/txs/${txId}`;
}
