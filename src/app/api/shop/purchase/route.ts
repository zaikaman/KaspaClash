/**
 * Shop Purchase API Route
 * Endpoint: POST /api/shop/purchase
 * Processes cosmetic purchases
 */

import { NextRequest, NextResponse } from 'next/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import { processPurchase } from '@/lib/shop/purchase-handler';

interface PurchaseRequest {
    playerId: string;
    cosmeticId: string;
    nftTxId?: string; // Optional NFT transaction ID (client-minted)
    nftMetadata?: any; // Optional NFT metadata (client-minted)
}

interface PurchaseResponse {
    success: boolean;
    purchaseId?: string;
    newBalance?: number;
    nftTxId?: string; // NFT transaction ID (client-minted)
    error?: string;
}

/**
 * Validate Kaspa address format
 */
function isValidKaspaAddress(address: string): boolean {
    return (
        typeof address === 'string' &&
        (address.startsWith('kaspa:') || address.startsWith('kaspatest:')) &&
        address.length >= 40
    );
}

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}

/**
 * POST /api/shop/purchase
 * Request body: { playerId: string, cosmeticId: string, nftTxId?: string, nftMetadata?: any }
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<PurchaseResponse | ApiErrorResponse>> {
    try {
        const body: PurchaseRequest = await request.json();
        const { playerId, cosmeticId, nftTxId, nftMetadata } = body;
        // Validate inputs
        if (!playerId) {
            throw Errors.badRequest('playerId is required');
        }

        if (!isValidKaspaAddress(playerId)) {
            throw Errors.invalidAddress(playerId);
        }

        if (!cosmeticId) {
            throw Errors.badRequest('cosmeticId is required');
        }

        if (!isValidUUID(cosmeticId)) {
            throw Errors.badRequest('Invalid cosmeticId format');
        }

        // Process the purchase
        const result = await processPurchase(playerId, cosmeticId, nftTxId, nftMetadata);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Purchase failed',
                },
                {
                    status: result.errorCode === 'INSUFFICIENT_FUNDS' ? 400 :
                        result.errorCode === 'ALREADY_OWNED' ? 409 :
                            result.errorCode === 'ITEM_NOT_FOUND' ? 404 : 500
                }
            );
        }

        return NextResponse.json({
            success: true,
            purchaseId: result.purchaseId,
            newBalance: result.newBalance,
            nftTxId: result.nftTxId,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
