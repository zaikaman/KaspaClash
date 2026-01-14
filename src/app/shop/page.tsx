"use client";

/**
 * Shop Page
 * Main cosmetic shop screen for browsing and purchasing items
 */

import React from "react";
import GameLayout from "@/components/layout/GameLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import { ShopGrid } from "@/components/shop/ShopGrid";
import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { CosmeticPreview } from "@/components/shop/CosmeticPreview";
import { PurchaseModal } from "@/components/shop/PurchaseModal";
import { useShopStore } from "@/stores/shop-store";
import { useWalletStore, selectIsConnected, selectPersistedAddress } from "@/stores/wallet-store";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Alert02Icon,
    Loading03Icon,
    RefreshIcon,
    Store01Icon,
    SparklesIcon,
    Clock01Icon,
} from "@hugeicons/core-free-icons";
import type { CosmeticItem, CosmeticCategory } from "@/types/cosmetic";
import { processPurchaseWithKaspa } from "@/lib/shop/purchase-service";

export default function ShopPage() {
    const isConnected = useWalletStore(selectIsConnected);
    const walletAddress = useWalletStore(selectPersistedAddress);

    const {
        items,
        currency,
        selectedCategory,
        isLoading,
        error,
        setItems,
        setCurrency,
        setSelectedCategory,
        setLoading,
        setError,
        updateCurrencyBalance,
    } = useShopStore();

    const [ownedIds, setOwnedIds] = React.useState<Set<string>>(new Set());
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [previewItem, setPreviewItem] = React.useState<CosmeticItem | null>(null);
    const [purchaseItem, setPurchaseItem] = React.useState<CosmeticItem | null>(null);
    const [featuredItems, setFeaturedItems] = React.useState<CosmeticItem[]>([]);
    const [rotationCountdown, setRotationCountdown] = React.useState<string>("");

    // Fetch shop inventory
    const fetchInventory = React.useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (selectedCategory && selectedCategory !== "all") {
                params.append("category", selectedCategory);
            }
            if (walletAddress) {
                params.append("playerId", walletAddress);
            }
            params.append("pageSize", "100");

            const response = await fetch(`/api/shop/inventory?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch inventory");
            }

            setItems(data.items);
            setOwnedIds(new Set(data.ownedIds || []));
        } catch (err) {
            console.error("Error fetching inventory:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch inventory");
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, walletAddress, setItems, setLoading, setError]);

    // Fetch player currency
    const fetchCurrency = React.useCallback(async () => {
        if (!walletAddress) return;

        try {
            // Fetch from player_currency table via progression endpoint
            const response = await fetch(`/api/progression/player?playerId=${encodeURIComponent(walletAddress)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.currency) {
                    setCurrency({
                        playerId: walletAddress,
                        clashShards: data.currency.clash_shards || 0,
                        totalEarned: data.currency.total_earned || 0,
                        totalSpent: data.currency.total_spent || 0,
                        lastUpdated: new Date(),
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching currency:", err);
        }
    }, [walletAddress, setCurrency]);

    // Fetch featured items
    const fetchFeatured = React.useCallback(async () => {
        try {
            const response = await fetch("/api/shop/featured");
            const data = await response.json();
            if (response.ok && data.items) {
                setFeaturedItems(data.items);
                setRotationCountdown(data.countdown || "");
            }
        } catch (err) {
            console.error("Error fetching featured items:", err);
        }
    }, []);

    // Initial fetch
    React.useEffect(() => {
        fetchInventory();
        fetchFeatured();
    }, [fetchInventory, fetchFeatured]);

    React.useEffect(() => {
        if (isConnected && walletAddress) {
            fetchCurrency();
        }
    }, [isConnected, walletAddress, fetchCurrency]);

    // Refetch when category changes
    React.useEffect(() => {
        fetchInventory();
    }, [selectedCategory, fetchInventory]);

    // Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([fetchInventory(), fetchCurrency(), fetchFeatured()]);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Handle category change
    const handleCategoryChange = (category: CosmeticCategory | "all") => {
        setSelectedCategory(category === "all" ? null : category);
    };

    // Handle item preview
    const handleItemClick = (item: CosmeticItem) => {
        setPreviewItem(item);
    };

    // Handle purchase initiation
    const handlePurchaseClick = () => {
        if (previewItem) {
            setPurchaseItem(previewItem);
            setPreviewItem(null);
        }
    };

    // Handle purchase confirmation with Kaspa transaction
    const handlePurchaseConfirm = async () => {
        if (!purchaseItem || !walletAddress) return;

        // Use the Kaspa transaction purchase flow
        // This will: 1) Send 1 KAS to user's own address, 2) Wait for confirmation, 3) Complete purchase
        const result = await processPurchaseWithKaspa({
            playerId: walletAddress,
            cosmeticId: purchaseItem.id,
            itemName: purchaseItem.name,
            price: purchaseItem.price,
        });

        if (!result.success) {
            throw new Error(result.error || "Purchase failed");
        }

        // Update local state
        if (result.newBalance !== undefined) {
            updateCurrencyBalance(result.newBalance);
        }
        setOwnedIds(prev => new Set([...prev, purchaseItem.id]));
    };

    // Filter items by category for display
    const displayItems = React.useMemo(() => {
        if (!selectedCategory || selectedCategory === "all") {
            return items;
        }
        return items.filter(item => item.category === selectedCategory);
    }, [items, selectedCategory]);

    const currentBalance = currency?.clashShards || 0;

    return (
        <GameLayout>
            <div className="relative w-full min-h-full pt-6 sm:pt-10 pb-20">
                {/* Background Elements */}
                <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[800px] h-[500px] bg-cyber-gold/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[400px] bg-cyber-orange/5 rounded-full blur-[150px] pointer-events-none" />

                <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 relative z-10 w-full max-w-7xl">
                    {/* Header */}
                    <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16 relative">
                        {/* Refresh Button - Desktop */}
                        {isConnected && (
                            <div className="absolute right-0 top-0 hidden sm:block">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing || isLoading}
                                    className="gap-2 text-cyber-gray hover:text-cyber-gold"
                                >
                                    <HugeiconsIcon
                                        icon={isRefreshing ? Loading03Icon : RefreshIcon}
                                        className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                                    />
                                    Refresh
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-cyber-gold/20 to-cyber-orange/20 border border-cyber-gold/30">
                                <HugeiconsIcon
                                    icon={Store01Icon}
                                    className="h-8 w-8 text-cyber-gold"
                                />
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-[60px] font-bold leading-tight mb-4 font-orbitron text-white">
                            COSMETIC <span className="text-cyber-gold">SHOP</span>
                        </h1>
                        <p className="text-cyber-gray text-base sm:text-lg font-montserrat max-w-2xl mx-auto">
                            Browse and collect exclusive characters and stickers. New items rotate weekly!
                        </p>

                        {/* Mobile Refresh Button */}
                        {isConnected && (
                            <div className="mt-4 sm:hidden flex justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing || isLoading}
                                    className="gap-2 text-cyber-gray hover:text-cyber-gold"
                                >
                                    <HugeiconsIcon
                                        icon={isRefreshing ? Loading03Icon : RefreshIcon}
                                        className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                                    />
                                    Refresh
                                </Button>
                            </div>
                        )}
                    </div>

                    <DecorativeLine className="mb-12 sm:mb-16" variant="left-red-right-gold" />

                    {/* Connection Warning */}
                    {!isConnected && (
                        <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-3 max-w-2xl mx-auto backdrop-blur-md">
                            <HugeiconsIcon
                                icon={Alert02Icon}
                                className="h-5 w-5 text-red-400 flex-shrink-0"
                            />
                            <div className="text-center">
                                <p className="text-sm font-medium text-red-400">
                                    Connect your wallet to purchase cosmetics
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/30 max-w-2xl mx-auto backdrop-blur-md">
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        </div>
                    )}

                    {/* Featured Section */}
                    {featuredItems.length > 0 && (
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <HugeiconsIcon icon={SparklesIcon} className="h-6 w-6 text-cyber-gold" />
                                    <h2 className="text-xl font-orbitron font-bold text-white">FEATURED THIS WEEK</h2>
                                </div>
                                {rotationCountdown && (
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <HugeiconsIcon icon={Clock01Icon} className="h-4 w-4" />
                                        <span>Rotates in {rotationCountdown}</span>
                                    </div>
                                )}
                            </div>
                            <ShopGrid
                                items={featuredItems}
                                ownedItemIds={ownedIds}
                                onItemClick={handleItemClick}
                                className="mb-8"
                            />
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                    )}

                    {/* Main Shop Content */}
                    <div className="space-y-8">
                        {/* Category Filter */}
                        <div className="flex justify-center mt-12 sm:mt-20">
                            <CategoryFilter
                                selectedCategory={(selectedCategory || "all") as CosmeticCategory | "all"}
                                onCategoryChange={handleCategoryChange}
                            />
                        </div>

                        {/* Shop Grid */}
                        <ShopGrid
                            items={displayItems}
                            ownedItemIds={ownedIds}
                            onItemClick={handleItemClick}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            <CosmeticPreview
                isOpen={previewItem !== null}
                onClose={() => setPreviewItem(null)}
                item={previewItem}
                isOwned={previewItem ? ownedIds.has(previewItem.id) : false}
                canAfford={previewItem ? currentBalance >= previewItem.price : false}
                onPurchase={handlePurchaseClick}
            />

            {/* Purchase Modal */}
            <PurchaseModal
                isOpen={purchaseItem !== null}
                onClose={() => setPurchaseItem(null)}
                item={purchaseItem}
                currentBalance={currentBalance}
                onConfirm={handlePurchaseConfirm}
            />
        </GameLayout>
    );
}
