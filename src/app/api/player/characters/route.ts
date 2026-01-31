/**
 * Player Characters API Route
 * Endpoint: GET /api/player/characters
 * Returns the list of character IDs owned by a player.
 * 
 * This is a lightweight, optimized endpoint specifically for character roster
 * lookups (e.g., in CharacterSelectScene). Unlike the full inventory endpoint,
 * this only returns character IDs for maximum performance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from '@/lib/api/errors';

/**
 * Default starter characters that all players have access to
 */
const DEFAULT_STARTER_CHARACTERS = [
    'cyber-ninja',
    'block-bruiser',
    'dag-warrior',
    'hash-hunter'
];

interface PlayerCharactersResponse {
    success: boolean;
    characterIds: string[];
    /** Whether this includes starters (always true) */
    includesStarters: boolean;
}

/**
 * GET /api/player/characters
 * Query params:
 *   - playerId: string (required) - The player's wallet address
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<PlayerCharactersResponse | ApiErrorResponse>> {
    try {
        const { searchParams } = new URL(request.url);
        const playerId = searchParams.get('playerId');

        if (!playerId) {
            throw Errors.badRequest('playerId is required');
        }

        const supabase = createSupabaseAdminClient() as any;

        // Optimized query: only fetch character cosmetics from player inventory
        // Join with cosmetic_items to filter by category and get characterId
        const { data: inventoryItems, error: inventoryError } = await supabase
            .from('player_inventory')
            .select(`
                cosmetic_id,
                cosmetic_items!inner (
                    id,
                    category,
                    character_id
                )
            `)
            .eq('player_id', playerId);

        if (inventoryError) {
            console.error('[API /player/characters] Error fetching inventory:', inventoryError);
            throw new Error('Failed to fetch player characters');
        }

        // Extract character IDs from items that are characters
        const ownedCharacterIds: string[] = [];
        
        if (inventoryItems && Array.isArray(inventoryItems)) {
            for (const item of inventoryItems) {
                const cosmetic = item.cosmetic_items;
                if (cosmetic?.category === 'character' && cosmetic?.character_id) {
                    ownedCharacterIds.push(cosmetic.character_id);
                }
            }
        }

        // Merge with default starters (always available)
        const allCharacterIds = [...new Set([...DEFAULT_STARTER_CHARACTERS, ...ownedCharacterIds])];

        return NextResponse.json({
            success: true,
            characterIds: allCharacterIds,
            includesStarters: true,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
