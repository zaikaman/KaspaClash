/**
 * Rotation Scheduler
 * Manages weekly featured items and discounts
 */

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { ShopRotation, CosmeticItem } from '@/types/cosmetic';

/**
 * Get current week's start date (Monday UTC)
 */
export function getWeekStartDate(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay();
    // Get to Monday (day 1), adjusting for Sunday (day 0)
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    d.setUTCDate(diff);
    return d;
}

/**
 * Get current week's end date (Sunday UTC 23:59:59)
 */
export function getWeekEndDate(date: Date = new Date()): Date {
    const start = getWeekStartDate(date);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);
    return end;
}

/**
 * Get time remaining until next rotation
 */
export function getTimeUntilNextRotation(): {
    totalMs: number;
    days: number;
    hours: number;
    minutes: number;
} {
    const now = new Date();
    const weekEnd = getWeekEndDate(now);
    const totalMs = Math.max(0, weekEnd.getTime() - now.getTime());

    const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

    return { totalMs, days, hours, minutes };
}

/**
 * Format rotation countdown
 */
export function formatRotationCountdown(): string {
    const { days, hours, minutes } = getTimeUntilNextRotation();

    if (days > 0) {
        return `${days}d ${hours}h`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

/**
 * Get current active rotation
 */
export async function getCurrentRotation(): Promise<ShopRotation | null> {
    const supabase = createSupabaseAdminClient() as any;
    const now = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('shop_rotations')
        .select('*')
        .lte('week_start_date', now)
        .gte('week_end_date', now)
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('Failed to fetch current rotation:', error);
        return null;
    }

    if (!data) return null;

    return {
        id: data.id,
        weekStartDate: new Date(data.week_start_date),
        weekEndDate: new Date(data.week_end_date),
        featuredItems: data.featured_items || [],
        discountedItems: data.discounted_items || [],
        isActive: data.is_active,
    };
}

/**
 * Get featured items for current rotation
 */
export async function getFeaturedItems(): Promise<{
    items: CosmeticItem[];
    rotation: ShopRotation | null;
    countdown: string;
}> {
    const supabase = createSupabaseAdminClient() as any;
    const rotation = await getCurrentRotation();

    if (!rotation || rotation.featuredItems.length === 0) {
        return {
            items: [],
            rotation: null,
            countdown: formatRotationCountdown(),
        };
    }

    const { data: items, error } = await supabase
        .from('cosmetic_items')
        .select('*')
        .in('id', rotation.featuredItems);

    if (error) {
        console.error('Failed to fetch featured items:', error);
        return {
            items: [],
            rotation,
            countdown: formatRotationCountdown(),
        };
    }

    // Map database records to CosmeticItem type
    const mappedItems: CosmeticItem[] = (items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        category: item.category,
        rarity: item.rarity,
        characterId: item.character_id,
        price: item.price,
        isPremium: item.is_premium,
        isLimited: item.is_limited,
        thumbnailUrl: item.thumbnail_url || '',
        previewUrl: item.preview_url || '',
        assetPath: item.asset_path || '',
        unlockRequirement: item.unlock_requirement,
        tags: item.tags || [],
        releaseDate: new Date(item.release_date),
    }));

    return {
        items: mappedItems,
        rotation,
        countdown: formatRotationCountdown(),
    };
}

/**
 * Check if an item is currently discounted
 */
export async function getItemDiscount(
    cosmeticId: string
): Promise<{ isDiscounted: boolean; discountPercent: number; originalPrice: number; discountedPrice: number } | null> {
    const rotation = await getCurrentRotation();

    if (!rotation || !rotation.discountedItems.includes(cosmeticId)) {
        return null;
    }

    // Default discount is 20%
    const discountPercent = 20;

    const supabase = createSupabaseAdminClient() as any;
    const { data: item } = await supabase
        .from('cosmetic_items')
        .select('price')
        .eq('id', cosmeticId)
        .single();

    if (!item) return null;

    const originalPrice = item.price;
    const discountedPrice = Math.floor(originalPrice * (1 - discountPercent / 100));

    return {
        isDiscounted: true,
        discountPercent,
        originalPrice,
        discountedPrice,
    };
}

/**
 * Create a new weekly rotation (admin function)
 */
export async function createWeeklyRotation(
    featuredItemIds: string[],
    discountedItemIds: string[] = []
): Promise<{ success: boolean; rotationId?: string; error?: string }> {
    const supabase = createSupabaseAdminClient() as any;

    const weekStart = getWeekStartDate();
    const weekEnd = getWeekEndDate();

    // Deactivate any existing active rotations
    await supabase
        .from('shop_rotations')
        .update({ is_active: false })
        .eq('is_active', true);

    // Create new rotation
    const { data, error } = await supabase
        .from('shop_rotations')
        .insert({
            week_start_date: weekStart.toISOString().split('T')[0],
            week_end_date: weekEnd.toISOString().split('T')[0],
            featured_items: featuredItemIds,
            discounted_items: discountedItemIds,
            is_active: true,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Failed to create rotation:', error);
        return { success: false, error: error.message };
    }

    return { success: true, rotationId: data.id };
}

/**
 * Get rotation history (admin function)
 */
export async function getRotationHistory(limit: number = 10): Promise<ShopRotation[]> {
    const supabase = createSupabaseAdminClient() as any;

    const { data, error } = await supabase
        .from('shop_rotations')
        .select('*')
        .order('week_start_date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Failed to fetch rotation history:', error);
        return [];
    }

    return (data || []).map((r: any) => ({
        id: r.id,
        weekStartDate: new Date(r.week_start_date),
        weekEndDate: new Date(r.week_end_date),
        featuredItems: r.featured_items || [],
        discountedItems: r.discounted_items || [],
        isActive: r.is_active,
    }));
}
