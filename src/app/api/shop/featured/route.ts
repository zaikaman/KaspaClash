/**
 * Shop Featured API Route
 * Endpoint: GET /api/shop/featured
 * Returns current weekly featured items and rotation info
 */

import { NextRequest, NextResponse } from 'next/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import { getFeaturedItems, formatRotationCountdown, getTimeUntilNextRotation } from '@/lib/shop/rotation-scheduler';
import type { CosmeticItem } from '@/types/cosmetic';

interface FeaturedResponse {
    success: boolean;
    items: CosmeticItem[];
    countdown: string;
    nextRotation: {
        days: number;
        hours: number;
        minutes: number;
    };
    rotationActive: boolean;
}

/**
 * GET /api/shop/featured
 * Returns featured items for this week's rotation
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<FeaturedResponse | ApiErrorResponse>> {
    try {
        const { items, rotation, countdown } = await getFeaturedItems();
        const timeRemaining = getTimeUntilNextRotation();

        return NextResponse.json({
            success: true,
            items,
            countdown,
            nextRotation: {
                days: timeRemaining.days,
                hours: timeRemaining.hours,
                minutes: timeRemaining.minutes,
            },
            rotationActive: rotation !== null,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
