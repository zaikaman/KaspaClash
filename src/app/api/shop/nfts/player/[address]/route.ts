/**
 * Player NFTs API Route
 * Endpoint: GET /api/shop/nfts/player/[address]
 * Gets all NFTs owned by a player from the blockchain
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlayerNFTs } from '@/lib/kaspa/nft-minter-server';
import type { NetworkType } from '@/types/constants';

interface PlayerNFTsResponse {
    success: boolean;
    nfts?: any[];
    count?: number;
    playerAddress?: string;
    error?: string;
}

/**
 * GET /api/shop/nfts/player/[address]
 * Get all NFTs owned by a player
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
): Promise<NextResponse<PlayerNFTsResponse>> {
    try {
        const { address } = await params;
        const { searchParams } = new URL(request.url);
        const network = (searchParams.get('network') || 'testnet') as NetworkType;

        if (!address) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'address parameter is required' 
                },
                { status: 400 }
            );
        }

        console.log('[Player-NFTs] Fetching NFTs...');
        console.log('[Player-NFTs] Player:', address);
        console.log('[Player-NFTs] Network:', network);

        // Scan blockchain for NFTs
        const nfts = await getPlayerNFTs(address, network);

        return NextResponse.json({
            success: true,
            nfts,
            count: nfts.length,
            playerAddress: address,
        });

    } catch (error) {
        console.error('[Player-NFTs] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
