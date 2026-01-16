/**
 * Purchase Handler
 * Transaction processing with validation and rollback support
 */

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { canAffordPurchase, createTransaction, CURRENCY_SOURCES } from '@/lib/progression/currency-utils';
import type { CosmeticItem, ShopPurchase, CurrencyTransaction } from '@/types/cosmetic';

/**
 * Purchase result
 */
export interface PurchaseResult {
    success: boolean;
    purchaseId?: string;
    newBalance?: number;
    error?: string;
    errorCode?: 'INSUFFICIENT_FUNDS' | 'ALREADY_OWNED' | 'ITEM_NOT_FOUND' | 'SYSTEM_ERROR';
}

/**
 * Validate purchase prerequisites
 * Uses parallel queries to minimize database round-trips
 */
export async function validatePurchase(
    playerId: string,
    cosmeticId: string
): Promise<{ valid: boolean; error?: string; errorCode?: string; item?: any; balance?: number }> {
    const supabase = createSupabaseAdminClient() as any;

    // Execute all validation queries in parallel for better performance
    const [itemResult, ownershipResult, currencyResult] = await Promise.all([
        // Check if item exists
        supabase
            .from('cosmetic_items')
            .select('*')
            .eq('id', cosmeticId)
            .single(),
        // Check if player already owns item (maybeSingle to avoid error on no match)
        supabase
            .from('player_inventory')
            .select('id')
            .eq('player_id', playerId)
            .eq('cosmetic_id', cosmeticId)
            .maybeSingle(),
        // Get player's current balance
        supabase
            .from('player_currency')
            .select('clash_shards')
            .eq('player_id', playerId)
            .maybeSingle(),
    ]);

    // Validate item exists
    if (itemResult.error || !itemResult.data) {
        return { valid: false, error: 'Item not found', errorCode: 'ITEM_NOT_FOUND' };
    }
    const item = itemResult.data;

    // Check ownership
    if (ownershipResult.data) {
        return { valid: false, error: 'You already own this item', errorCode: 'ALREADY_OWNED' };
    }

    // Check balance
    const currentBalance = currencyResult.data?.clash_shards || 0;
    if (!canAffordPurchase(currentBalance, item.price)) {
        return { valid: false, error: 'Insufficient Clash Shards', errorCode: 'INSUFFICIENT_FUNDS', balance: currentBalance };
    }

    return { valid: true, item, balance: currentBalance };
}

/**
 * Process a cosmetic purchase
 */
export async function processPurchase(
    playerId: string,
    cosmeticId: string,
    txId?: string
): Promise<PurchaseResult> {
    const supabase = createSupabaseAdminClient() as any;

    // Validate first
    const validation = await validatePurchase(playerId, cosmeticId);
    if (!validation.valid) {
        return {
            success: false,
            error: validation.error,
            errorCode: validation.errorCode as any,
        };
    }

    const { item, balance: currentBalance } = validation;
    const newBalance = currentBalance! - item.price;

    try {
        // Start transaction-like operation
        // 1. Get current total_spent value
        const { data: currentCurrency } = await supabase
            .from('player_currency')
            .select('total_spent')
            .eq('player_id', playerId)
            .single();

        const currentTotalSpent = currentCurrency?.total_spent || 0;
        const newTotalSpent = currentTotalSpent + item.price;

        // 2. Update player currency with new balance and total_spent
        const { error: currencyError } = await supabase
            .from('player_currency')
            .upsert({
                player_id: playerId,
                clash_shards: newBalance,
                total_spent: newTotalSpent,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'player_id',
            });

        if (currencyError) {
            console.error('Currency upsert error:', currencyError);
            // Fallback: use update instead
            const { error: updateError } = await supabase
                .from('player_currency')
                .update({
                    clash_shards: newBalance,
                    total_spent: newTotalSpent,
                    updated_at: new Date().toISOString(),
                })
                .eq('player_id', playerId);

            if (updateError) {
                console.error('Currency update error:', updateError);
                return { success: false, error: 'Failed to process payment', errorCode: 'SYSTEM_ERROR' };
            }
        }

        // 2. Add to player inventory
        const { error: inventoryError } = await supabase
            .from('player_inventory')
            .insert({
                player_id: playerId,
                cosmetic_id: cosmeticId,
                source: 'shop_purchase',
                acquired_date: new Date().toISOString(),
            });

        if (inventoryError) {
            console.error('Inventory insert error:', inventoryError);
            // Rollback currency change
            await supabase
                .from('player_currency')
                .update({ clash_shards: currentBalance })
                .eq('player_id', playerId);
            return { success: false, error: 'Failed to add item to inventory', errorCode: 'SYSTEM_ERROR' };
        }

        // 3. Record purchase history
        const { data: purchase, error: purchaseError } = await supabase
            .from('shop_purchases')
            .insert({
                player_id: playerId,
                cosmetic_id: cosmeticId,
                price: item.price,
                currency_type: 'clash_shards',
                success: true,
            })
            .select('id')
            .single();

        if (purchaseError) {
            console.error('Purchase record error:', purchaseError);
            // Non-critical, continue
        }

        // 4. Log currency transaction
        const { error: txError } = await supabase
            .from('currency_transactions')
            .insert({
                player_id: playerId,
                amount: item.price,
                transaction_type: 'spend',
                source: CURRENCY_SOURCES.SHOP_PURCHASE,
                balance_before: currentBalance,
                balance_after: newBalance,
                metadata: {
                    cosmetic_id: cosmeticId,
                    cosmetic_name: item.name,
                    purchase_id: purchase?.id,
                },
            });

        if (txError) {
            console.error('Transaction log error:', txError);
            // Non-critical, continue
        }

        return {
            success: true,
            purchaseId: purchase?.id,
            newBalance,
        };
    } catch (error) {
        console.error('Purchase processing error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred',
            errorCode: 'SYSTEM_ERROR',
        };
    }
}

/**
 * Get player's purchase history
 */
export async function getPurchaseHistory(
    playerId: string,
    limit: number = 50
): Promise<ShopPurchase[]> {
    const supabase = createSupabaseAdminClient() as any;

    const { data, error } = await supabase
        .from('shop_purchases')
        .select(`
            *,
            cosmetic:cosmetic_items(*)
        `)
        .eq('player_id', playerId)
        .order('purchase_date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Failed to fetch purchase history:', error);
        return [];
    }

    return data || [];
}

/**
 * Get player's owned cosmetic IDs
 */
export async function getOwnedCosmeticIds(playerId: string): Promise<Set<string>> {
    const supabase = createSupabaseAdminClient() as any;

    const { data, error } = await supabase
        .from('player_inventory')
        .select('cosmetic_id')
        .eq('player_id', playerId);

    if (error) {
        console.error('Failed to fetch owned cosmetics:', error);
        return new Set();
    }

    return new Set((data || []).map((item: any) => item.cosmetic_id));
}
