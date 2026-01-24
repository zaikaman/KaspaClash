/**
 * Player NFTs API Route
 * Endpoint: GET /api/shop/nfts?playerId=<address>&source=<blockchain|database|both>
 * Returns NFTs minted for a player's cosmetics
 * 
 * Query Parameters:
 * - playerId: Player's wallet address (required)
 * - source: Data source - 'blockchain' (on-chain only), 'database' (DB only), 'both' (default)
 * - network: 'mainnet' or 'testnet' (default: 'testnet')
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getPlayerNFTs } from '@/lib/kaspa/nft-minter-server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import type { NetworkType } from '@/types/constants';

interface NFTResponse {
    success: boolean;
    nfts?: Array<{
        id: string;
        cosmeticId: string;
        cosmeticName: string;
        mintTxId: string;
        network: string;
        mintedAt: string;
        explorerUrl: string;
        source: 'blockchain' | 'database' | 'both';
        verified?: boolean;
    }>;
    source?: string;
    error?: string;
}

/**
 * GET /api/shop/nfts?playerId=<address>&source=<blockchain|database|both>
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<NFTResponse | ApiErrorResponse>> {
    try {
        const { searchParams } = new URL(request.url);
        const playerId = searchParams.get('playerId');
        const source = searchParams.get('source') || 'both';
        const network = (searchParams.get('network') || 'testnet') as NetworkType;

        if (!playerId) {
            throw Errors.badRequest('playerId is required');
        }

        if (!['blockchain', 'database', 'both'].includes(source)) {
            throw Errors.badRequest('source must be "blockchain", "database", or "both"');
        }

        const supabase = createSupabaseAdminClient() as any;
        let allNfts: any[] = [];

        // Fetch from database if requested
        if (source === 'database' || source === 'both') {
            const { data: dbNfts, error } = await supabase
                .from('cosmetic_nfts')
                .select(`
                    id,
                    cosmetic_id,
                    mint_tx_id,
                    network,
                    minted_at,
                    metadata,
                    cosmetic_items!cosmetic_nfts_cosmetic_id_fkey (
                        name
                    )
                `)
                .eq('player_id', playerId)
                .order('minted_at', { ascending: false });

            if (error) {
                console.error('[NFT-API] Failed to fetch from database:', error);
            } else {
                const formattedDbNfts = (dbNfts || []).map((nft: any) => {
                    const explorerBaseUrl = nft.network === 'mainnet'
                        ? 'https://explorer.kaspa.org'
                        : 'https://explorer-tn10.kaspa.org';

                    return {
                        id: nft.id,
                        cosmeticId: nft.cosmetic_id,
                        cosmeticName: nft.cosmetic_items?.name || 'Unknown',
                        mintTxId: nft.mint_tx_id,
                        network: nft.network,
                        mintedAt: nft.minted_at,
                        explorerUrl: `${explorerBaseUrl}/txs/${nft.mint_tx_id}`,
                        source: 'database' as const,
                    };
                });

                allNfts.push(...formattedDbNfts);
            }
        }

        // Fetch from blockchain if requested
        if (source === 'blockchain' || source === 'both') {
            const blockchainNfts = await getPlayerNFTs(playerId, network);
            
            const formattedBlockchainNfts = blockchainNfts.map((nft: any) => {
                const explorerBaseUrl = network === 'mainnet'
                    ? 'https://explorer.kaspa.org'
                    : 'https://explorer-tn10.kaspa.org';

                return {
                    id: nft.txId,
                    cosmeticId: nft.metadata.cosmetic?.id || 'unknown',
                    cosmeticName: nft.metadata.cosmetic?.name || 'Unknown',
                    mintTxId: nft.txId,
                    network,
                    mintedAt: nft.metadata.mintedAt || nft.blockTime,
                    explorerUrl: `${explorerBaseUrl}/txs/${nft.txId}`,
                    source: 'blockchain' as const,
                    verified: nft.isAccepted,
                };
            });

            allNfts.push(...formattedBlockchainNfts);
        }

        // If 'both', merge and deduplicate by txId
        if (source === 'both') {
            const nftMap = new Map<string, any>();
            
            for (const nft of allNfts) {
                const existing = nftMap.get(nft.mintTxId);
                if (existing) {
                    // If exists in both, mark as verified
                    existing.source = 'both';
                    existing.verified = true;
                } else {
                    nftMap.set(nft.mintTxId, { ...nft });
                }
            }

            allNfts = Array.from(nftMap.values());
        }

        // Sort by minted date (newest first)
        allNfts.sort((a, b) => {
            const dateA = new Date(a.mintedAt).getTime();
            const dateB = new Date(b.mintedAt).getTime();
            return dateB - dateA;
        });

        return NextResponse.json({
            success: true,
            nfts: allNfts,
            source,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
