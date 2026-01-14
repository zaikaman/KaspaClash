/**
 * Shop Inventory API Route
 * Endpoint: GET /api/shop/inventory
 * Fetches available shop items with filtering, sorting, and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';
import { filterShopItems, sortShopItems, paginateItems, type SortOption } from '@/lib/shop/shop-inventory';
import { getOwnedCosmeticIds } from '@/lib/shop/purchase-handler';
import type { CosmeticItem, CosmeticCategory, CosmeticRarity } from '@/types/cosmetic';

interface ShopInventoryResponse {
    success: boolean;
    items: CosmeticItem[];
    ownedIds: string[];
    pagination: {
        currentPage: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
        totalItems: number;
    };
}

/**
 * Map database record to CosmeticItem
 */
function mapToCosmetic(row: any): CosmeticItem {
    return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        category: row.category,
        rarity: row.rarity,
        characterId: row.character_id,
        price: row.price,
        isPremium: row.is_premium,
        isLimited: row.is_limited,
        thumbnailUrl: row.thumbnail_url || '',
        previewUrl: row.preview_url || '',
        assetPath: row.asset_path || '',
        unlockRequirement: row.unlock_requirement,
        tags: row.tags || [],
        releaseDate: new Date(row.release_date),
    };
}

/**
 * GET /api/shop/inventory
 * Query params:
 *   - category: CosmeticCategory | 'all'
 *   - rarity: CosmeticRarity | 'all'
 *   - sort: SortOption
 *   - page: number (1-indexed)
 *   - pageSize: number (default 20)
 *   - playerId: string (optional, to get ownership status)
 *   - search: string (optional search query)
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<ShopInventoryResponse | ApiErrorResponse>> {
    try {
        const { searchParams } = new URL(request.url);

        const category = searchParams.get('category') as CosmeticCategory | 'all' | null;
        const rarity = searchParams.get('rarity') as CosmeticRarity | 'all' | null;
        const sort = (searchParams.get('sort') || 'newest') as SortOption;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') || '20', 10));
        const playerId = searchParams.get('playerId');
        const search = searchParams.get('search');

        const supabase = createSupabaseAdminClient() as any;

        // Fetch all available items
        const { data: rawItems, error: fetchError } = await supabase
            .from('cosmetic_items')
            .select('*')
            .order('release_date', { ascending: false });

        if (fetchError) {
            console.error('Error fetching shop items:', fetchError);
            throw Errors.badRequest('Failed to fetch shop inventory');
        }

        // Map to CosmeticItem type
        const allItems: CosmeticItem[] = (rawItems || []).map(mapToCosmetic);

        // Get owned item IDs if player ID provided
        let ownedIds = new Set<string>();
        if (playerId) {
            ownedIds = await getOwnedCosmeticIds(playerId);
        }

        // Apply filters
        const filtered = filterShopItems(allItems, {
            category: category || 'all',
            rarity: rarity || 'all',
            searchQuery: search || '',
        }, ownedIds);

        // Apply sorting
        const sorted = sortShopItems(filtered, sort);

        // Apply pagination
        const paginated = paginateItems(sorted, page, pageSize);

        return NextResponse.json({
            success: true,
            items: paginated.items,
            ownedIds: Array.from(ownedIds),
            pagination: {
                currentPage: paginated.currentPage,
                totalPages: paginated.totalPages,
                hasNext: paginated.hasNext,
                hasPrev: paginated.hasPrev,
                totalItems: sorted.length,
            },
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
