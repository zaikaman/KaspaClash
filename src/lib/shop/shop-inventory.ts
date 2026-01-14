/**
 * Shop Inventory Manager
 * Handles item catalog management, filtering, and sorting
 */

import type { CosmeticItem, CosmeticCategory, CosmeticRarity } from '@/types/cosmetic';

/**
 * Rarity sort order (ascending)
 */
const RARITY_ORDER: Record<CosmeticRarity, number> = {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    prestige: 5,
};

/**
 * Sort options for shop items
 */
export type SortOption = 'newest' | 'price-low' | 'price-high' | 'rarity' | 'rarity-desc' | 'name';

/**
 * Filter options for shop items
 */
export interface ShopFilterOptions {
    category?: CosmeticCategory | 'all';
    rarity?: CosmeticRarity | 'all';
    characterId?: string | 'all';
    searchQuery?: string;
    showOwned?: boolean;
    showAffordable?: boolean;
    currentBalance?: number;
}

/**
 * Filter and sort shop items
 */
export function filterShopItems(
    items: CosmeticItem[],
    options: ShopFilterOptions,
    ownedItemIds: Set<string> = new Set()
): CosmeticItem[] {
    let filtered = [...items];

    // Filter by category
    if (options.category && options.category !== 'all') {
        filtered = filtered.filter(item => item.category === options.category);
    }

    // Filter by rarity
    if (options.rarity && options.rarity !== 'all') {
        filtered = filtered.filter(item => item.rarity === options.rarity);
    }

    // Filter by character
    if (options.characterId && options.characterId !== 'all') {
        filtered = filtered.filter(item =>
            item.characterId === options.characterId || !item.characterId
        );
    }

    // Filter by search query
    if (options.searchQuery && options.searchQuery.trim()) {
        const query = options.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.tags.some(tag => tag.toLowerCase().includes(query))
        );
    }

    // Filter owned items
    if (options.showOwned === false) {
        filtered = filtered.filter(item => !ownedItemIds.has(item.id));
    }

    // Filter by affordability
    if (options.showAffordable && options.currentBalance !== undefined) {
        filtered = filtered.filter(item => item.price <= options.currentBalance!);
    }

    return filtered;
}

/**
 * Sort shop items
 */
export function sortShopItems(items: CosmeticItem[], sortBy: SortOption): CosmeticItem[] {
    const sorted = [...items];

    switch (sortBy) {
        case 'newest':
            return sorted.sort((a, b) =>
                new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
            );
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);
        case 'rarity':
            return sorted.sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);
        case 'rarity-desc':
            return sorted.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        default:
            return sorted;
    }
}

/**
 * Get items grouped by category
 */
export function groupByCategory(items: CosmeticItem[]): Record<CosmeticCategory, CosmeticItem[]> {
    const groups: Record<CosmeticCategory, CosmeticItem[]> = {
        character: [],
        sticker: [],
        victory_pose: [],
        profile_badge: [],
        profile_frame: [],
    };

    for (const item of items) {
        groups[item.category].push(item);
    }

    return groups;
}

/**
 * Get category counts
 */
export function getCategoryCounts(items: CosmeticItem[]): Record<CosmeticCategory | 'all', number> {
    const counts: Record<CosmeticCategory | 'all', number> = {
        all: items.length,
        character: 0,
        sticker: 0,
        victory_pose: 0,
        profile_badge: 0,
        profile_frame: 0,
    };

    for (const item of items) {
        counts[item.category]++;
    }

    return counts;
}

/**
 * Get featured items (limited-time or highlighted)
 */
export function getFeaturedItems(items: CosmeticItem[], featuredIds: string[]): CosmeticItem[] {
    const featuredSet = new Set(featuredIds);
    return items.filter(item => featuredSet.has(item.id) || item.isLimited);
}

/**
 * Calculate shop statistics
 */
export function getShopStatistics(
    items: CosmeticItem[],
    ownedItemIds: Set<string>
): {
    totalItems: number;
    ownedCount: number;
    totalValue: number;
    ownedValue: number;
    completionPercentage: number;
} {
    let ownedCount = 0;
    let totalValue = 0;
    let ownedValue = 0;

    for (const item of items) {
        totalValue += item.price;
        if (ownedItemIds.has(item.id)) {
            ownedCount++;
            ownedValue += item.price;
        }
    }

    return {
        totalItems: items.length,
        ownedCount,
        totalValue,
        ownedValue,
        completionPercentage: items.length > 0 ? (ownedCount / items.length) * 100 : 0,
    };
}

/**
 * Paginate items
 */
export function paginateItems<T>(
    items: T[],
    page: number,
    pageSize: number
): {
    items: T[];
    totalPages: number;
    currentPage: number;
    hasNext: boolean;
    hasPrev: boolean;
} {
    const totalPages = Math.ceil(items.length / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
        items: items.slice(startIndex, endIndex),
        totalPages,
        currentPage,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
    };
}
