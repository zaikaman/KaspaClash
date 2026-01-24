/**
 * NFT Ownership Verification API Route
 * Endpoint: POST /api/shop/nfts/verify
 * Verifies if a player owns a specific NFT on-chain
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyNFTOwnership } from '@/lib/kaspa/nft-minter-server';
import type { NetworkType } from '@/types/constants';

interface VerifyRequest {
    playerAddress: string;
    cosmeticId: string;
    network?: NetworkType;
}

interface VerifyResponse {
    success: boolean;
    owned: boolean;
    cosmeticId?: string;
    playerAddress?: string;
    error?: string;
}

/**
 * POST /api/shop/nfts/verify
 * Verify NFT ownership on-chain
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<VerifyResponse>> {
    try {
        const body: VerifyRequest = await request.json();
        const { playerAddress, cosmeticId, network = 'testnet' } = body;

        if (!playerAddress || !cosmeticId) {
            return NextResponse.json(
                { 
                    success: false, 
                    owned: false,
                    error: 'playerAddress and cosmeticId are required' 
                },
                { status: 400 }
            );
        }

        console.log('[Verify-NFT] Checking ownership...');
        console.log('[Verify-NFT] Player:', playerAddress);
        console.log('[Verify-NFT] Cosmetic:', cosmeticId);
        console.log('[Verify-NFT] Network:', network);

        // Verify ownership on-chain
        const owned = await verifyNFTOwnership(playerAddress, cosmeticId, network);

        return NextResponse.json({
            success: true,
            owned,
            cosmeticId,
            playerAddress,
        });

    } catch (error) {
        console.error('[Verify-NFT] Error:', error);
        return NextResponse.json(
            {
                success: false,
                owned: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
