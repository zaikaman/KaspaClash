/**
 * Shop Purchase API Route
 * Endpoint: POST /api/shop/purchase
 * Processes cosmetic purchases with input validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import { processPurchase } from '@/lib/shop/purchase-handler';
import { purchaseSchema, validateBody } from '@/lib/api/validators';

interface PurchaseResponse {
    success: boolean;
    purchaseId?: string;
    newBalance?: number;
    nftTxId?: string; // NFT transaction ID (client-minted)
    error?: string;
}

/**
 * POST /api/shop/purchase
 * Request body: { playerId: string, cosmeticId: string, nftTxId?: string, nftMetadata?: any }
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<PurchaseResponse | ApiErrorResponse>> {
    try {
        const body = await request.json();

        // Validate inputs using Zod schema
        const validation = validateBody(body, purchaseSchema);
        if (!validation.success) {
            throw Errors.badRequest(validation.error);
        }

        const { playerId, cosmeticId, nftTxId, nftMetadata } = validation.data;

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
