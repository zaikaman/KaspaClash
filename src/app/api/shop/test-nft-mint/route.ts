/**
 * Test NFT Minting API Route
 * Endpoint: POST /api/shop/test-nft-mint
 * Tests the NFT minting system without requiring a purchase
 */

import { NextRequest, NextResponse } from 'next/server';
import { mintCosmeticNFT } from '@/lib/kaspa/nft-minter-server';
import { getVaultBalance } from '@/lib/kaspa/vault-service';
import type { NetworkType } from '@/types/constants';

interface TestMintRequest {
    playerAddress: string;
    network?: NetworkType;
}

interface TestMintResponse {
    success: boolean;
    vaultBalance?: string;
    vaultAddress?: string;
    mintTxId?: string;
    error?: string;
}

/**
 * POST /api/shop/test-nft-mint
 * Test NFT minting with a dummy cosmetic
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<TestMintResponse>> {
    try {
        const body: TestMintRequest = await request.json();
        const { playerAddress, network = 'testnet' } = body;

        if (!playerAddress) {
            return NextResponse.json(
                { success: false, error: 'playerAddress is required' },
                { status: 400 }
            );
        }

        console.log('[Test-NFT] Testing NFT mint...');
        console.log('[Test-NFT] Player:', playerAddress);
        console.log('[Test-NFT] Network:', network);

        // Check vault balance first
        try {
            const balance = await getVaultBalance(network);
            console.log('[Test-NFT] Vault balance:', balance.balanceKAS, 'KAS');
            console.log('[Test-NFT] Vault address:', balance.address);

            if (balance.balance < BigInt(1000000)) {
                return NextResponse.json(
                    {
                        success: false,
                        vaultBalance: `${balance.balanceKAS} KAS`,
                        vaultAddress: balance.address,
                        error: 'Vault balance too low for NFT minting'
                    },
                    { status: 500 }
                );
            }
        } catch (balanceError) {
            console.error('[Test-NFT] Failed to check vault balance:', balanceError);
            return NextResponse.json(
                {
                    success: false,
                    error: `Vault balance check failed: ${balanceError instanceof Error ? balanceError.message : 'Unknown error'}`
                },
                { status: 500 }
            );
        }

        // Create test cosmetic
        const testCosmetic = {
            id: 'test-' + Date.now(),
            name: 'Test NFT',
            category: 'sticker' as const,
            rarity: 'common' as const,
            description: 'Test NFT for minting',
            price: 0,
            isPremium: false,
            isLimited: false,
            thumbnailUrl: 'https://example.com/test.png',
            previewUrl: 'https://example.com/test.png',
            assetPath: '/test',
            tags: ['test'],
            releaseDate: new Date(),
        };

        // Attempt to mint
        const result = await mintCosmeticNFT(playerAddress, testCosmetic, network);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'NFT minting failed'
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            mintTxId: result.txId,
        });

    } catch (error) {
        console.error('[Test-NFT] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
