/**
 * Kaspa NFT Minter Service (Server-Side)
 * 
 * ⚠️ SERVER-SIDE ONLY: Uses vault private keys for NFT minting
 * 
 * This service now uses kaspa-wasm for proper payload transaction signing,
 * creating real on-chain NFTs with metadata embedded in the blockchain.
 */

import type { NetworkType } from '@/types/constants';
import type { CosmeticItem } from '@/types/cosmetic';

// Re-export the kaspa-wasm implementation
export { 
    mintCosmeticNFT, 
    type NFTMintResult, 
    type CosmeticNFTMetadata 
} from './nft-minter-wasm';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get transaction explorer URL
 */
export function getTxExplorerUrl(txId: string, network: NetworkType): string {
    const baseUrl = network === 'mainnet'
        ? 'https://explorer.kaspa.org'
        : 'https://explorer-tn10.kaspa.org';
    return `${baseUrl}/txs/${txId}`;
}

/**
 * Batch mint multiple NFTs (for future use)
 * Mints NFTs sequentially with delays to avoid overwhelming the network
 */
export async function mintMultipleNFTs(
    playerAddress: string,
    cosmetics: CosmeticItem[],
    network: NetworkType
): Promise<any[]> {
    const { mintCosmeticNFT } = await import('./nft-minter-wasm');
    const results: any[] = [];
    
    for (const cosmetic of cosmetics) {
        const result = await mintCosmeticNFT(playerAddress, cosmetic, network);
        results.push(result);
        
        // Add small delay between mints to avoid overwhelming the network
        if (results.length < cosmetics.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    return results;
}

/**
 * Verify NFT ownership by checking transaction on-chain
 * Queries the Kaspa blockchain for transactions to the player's address
 * and checks if any contain the KCLASH-NFT protocol with matching cosmetic
 */
export async function verifyNFTOwnership(
    playerAddress: string,
    cosmeticId: string,
    network: NetworkType
): Promise<boolean> {
    try {
        const apiUrl = network === "mainnet"
            ? "https://api.kaspa.org"
            : "https://api-tn10.kaspa.org";

        console.log('[NFT-Verify] Checking ownership for:', cosmeticId);
        console.log('[NFT-Verify] Address:', playerAddress);

        // Fetch all transactions for the address
        const res = await fetch(`${apiUrl}/addresses/${playerAddress}/full-transactions?limit=100`, {
            cache: "no-store",
        });

        if (!res.ok) {
            console.error('[NFT-Verify] Failed to fetch transactions:', res.statusText);
            return false;
        }

        const transactions = await res.json();

        if (!Array.isArray(transactions) || transactions.length === 0) {
            console.log('[NFT-Verify] No transactions found for address');
            return false;
        }

        // Check each transaction for KCLASH-NFT payload with matching cosmetic ID
        for (const tx of transactions) {
            // Check if transaction has a payload
            if (!tx.payload || tx.payload.length === 0) {
                continue;
            }

            try {
                // Decode payload from hex to string
                const payloadHex = tx.payload;
                const payloadBytes = new Uint8Array(
                    payloadHex.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
                );
                const payloadStr = new TextDecoder().decode(payloadBytes);

                // Parse JSON metadata
                const metadata = JSON.parse(payloadStr);

                // Check if this is a KCLASH-NFT transaction
                if (metadata.protocol === 'KCLASH-NFT' || metadata.protocol === 'KCLASH-NFT') {
                    // Check if the cosmetic ID matches
                    const nftCosmeticId = metadata.cosmetic?.id || metadata.cosmetic?.id;
                    
                    if (nftCosmeticId === cosmeticId) {
                        // Verify the transaction has an output to the player's address
                        const hasOutputToPlayer = tx.outputs?.some((output: any) => {
                            return output.scriptPublicKey?.address === playerAddress;
                        });

                        if (hasOutputToPlayer) {
                            console.log('[NFT-Verify] ✓ NFT ownership verified! TX:', tx.transactionId);
                            return true;
                        }
                    }
                }
            } catch (parseError) {
                // Invalid JSON or non-text payload, skip
                continue;
            }
        }

        console.log('[NFT-Verify] NFT not found in transaction history');
        return false;

    } catch (error) {
        console.error('[NFT-Verify] Verification failed:', error);
        return false;
    }
}

/**
 * Get all NFTs owned by a player
 * Scans the blockchain for all KCLASH-NFT transactions to the player's address
 */
export async function getPlayerNFTs(
    playerAddress: string,
    network: NetworkType
): Promise<any[]> {
    try {
        const apiUrl = network === "mainnet"
            ? "https://api.kaspa.org"
            : "https://api-tn10.kaspa.org";

        console.log('[NFT-Scanner] Scanning NFTs for:', playerAddress);

        // Fetch all transactions for the address
        const res = await fetch(`${apiUrl}/addresses/${playerAddress}/full-transactions?limit=100`, {
            cache: "no-store",
        });

        if (!res.ok) {
            console.error('[NFT-Scanner] Failed to fetch transactions:', res.statusText);
            return [];
        }

        const transactions = await res.json();

        if (!Array.isArray(transactions) || transactions.length === 0) {
            return [];
        }

        const nfts: any[] = [];

        // Check each transaction for KCLASH-NFT payload
        for (const tx of transactions) {
            if (!tx.payload || tx.payload.length === 0) {
                continue;
            }

            try {
                // Decode payload from hex to string
                const payloadHex = tx.payload;
                const payloadBytes = new Uint8Array(
                    payloadHex.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
                );
                const payloadStr = new TextDecoder().decode(payloadBytes);

                // Parse JSON metadata
                const metadata = JSON.parse(payloadStr);

                // Check if this is a KCLASH-NFT transaction
                if (metadata.protocol === 'KCLASH-NFT' || metadata.protocol === 'KCLASH-NFT') {
                    // Verify the transaction has an output to the player's address
                    const playerOutput = tx.outputs?.find((output: any) => {
                        return output.scriptPublicKey?.address === playerAddress;
                    });

                    if (playerOutput) {
                        nfts.push({
                            txId: tx.transactionId,
                            metadata: metadata,
                            amount: playerOutput.value,
                            blockTime: tx.blockTime,
                            isAccepted: tx.isAccepted,
                        });
                    }
                }
            } catch (parseError) {
                // Invalid JSON or non-text payload, skip
                continue;
            }
        }

        console.log('[NFT-Scanner] Found', nfts.length, 'NFTs');
        return nfts;

    } catch (error) {
        console.error('[NFT-Scanner] Scan failed:', error);
        return [];
    }
}
