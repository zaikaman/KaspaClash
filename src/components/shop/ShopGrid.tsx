"use client";

/**
 * Shop Grid Component
 * Main grid layout displaying cosmetic items with filtering and sorting
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/progression/currency-utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Coins01Icon,
    Tick02Icon,
    SparklesIcon,
    SearchAreaIcon,
} from "@hugeicons/core-free-icons";
import type { CosmeticItem, CosmeticCategory } from "@/types/cosmetic";

interface ShopGridProps {
    items: CosmeticItem[];
    ownedItemIds: Set<string>;
    onItemClick: (item: CosmeticItem) => void;
    isLoading?: boolean;
    className?: string;
}

/**
 * Get rarity styling
 */
function getRarityStyle(rarity: string): {
    border: string;
    bg: string;
    text: string;
    line: string;
    glow: string;
} {
    switch (rarity) {
        case "common":
            return {
                border: "border-gray-500/20 hover:border-gray-500/40",
                bg: "from-gray-500/5 to-transparent",
                text: "text-gray-400",
                line: "bg-gray-400",
                glow: "",
            };
        case "rare":
            return {
                border: "border-blue-500/20 hover:border-blue-500/40",
                bg: "from-blue-500/5 to-transparent",
                text: "text-blue-400",
                line: "bg-blue-500",
                glow: "hover:shadow-blue-500/10",
            };
        case "epic":
            return {
                border: "border-purple-500/20 hover:border-purple-500/40",
                bg: "from-purple-500/5 to-transparent",
                text: "text-purple-400",
                line: "bg-purple-400",
                glow: "hover:shadow-purple-500/15",
            };
        case "legendary":
            return {
                border: "border-cyber-gold/30 hover:border-cyber-gold/50",
                bg: "from-cyber-gold/10 to-amber-500/5",
                text: "text-cyber-gold",
                line: "bg-cyber-gold",
                glow: "hover:shadow-cyber-gold/20",
            };
        case "prestige":
            return {
                border: "border-pink-500/30 hover:border-pink-500/50",
                bg: "from-pink-500/10 to-purple-500/5",
                text: "text-pink-400",
                line: "bg-pink-400",
                glow: "hover:shadow-pink-500/20",
            };
        default:
            return {
                border: "border-white/10 hover:border-white/20",
                bg: "from-white/5 to-transparent",
                text: "text-gray-400",
                line: "bg-gray-400",
                glow: "",
            };
    }
}

/**
 * Single cosmetic item card
 */
function CosmeticCard({
    item,
    isOwned,
    onClick,
}: {
    item: CosmeticItem;
    isOwned: boolean;
    onClick: () => void;
}) {
    const rarityStyle = getRarityStyle(item.rarity);

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative group text-left rounded-xl border transition-all duration-300",
                "bg-gradient-to-b backdrop-blur-sm",
                rarityStyle.bg,
                rarityStyle.border,
                rarityStyle.glow,
                "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1",
                isOwned && "opacity-75"
            )}
        >
            {/* Rarity indicator bar */}
            <div
                className={cn(
                    "absolute top-0 left-4 right-4 h-0.5 rounded-full",
                    rarityStyle.line
                )}
            />

            {/* Thumbnail */}
            <div className="relative aspect-square p-4">
                {item.thumbnailUrl ? (
                    <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="w-full h-full object-contain rounded-lg"
                    />
                ) : (
                    <div className="w-full h-full rounded-lg bg-card/50 flex items-center justify-center">
                        <HugeiconsIcon
                            icon={SparklesIcon}
                            className={cn("h-12 w-12 opacity-30", rarityStyle.text)}
                        />
                    </div>
                )}

                {/* Owned badge */}
                {isOwned && (
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        <HugeiconsIcon icon={Tick02Icon} className="h-4 w-4 text-emerald-400" />
                    </div>
                )}

                {/* Limited badge */}
                {item.isLimited && !isOwned && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-cyber-orange/20 border border-cyber-orange/30">
                        <span className="text-[10px] font-bold text-cyber-orange uppercase">Limited</span>
                    </div>
                )}

                {/* Legendary shimmer */}
                {(item.rarity === "legendary" || item.rarity === "prestige") && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity" />
                )}
            </div>

            {/* Info */}
            <div className="px-4 pb-4">
                <h3 className="font-bold text-foreground text-sm truncate mb-1">
                    {item.name}
                </h3>
                <p className={cn("text-xs font-medium capitalize mb-2", rarityStyle.text)}>
                    {item.rarity}
                </p>

                {/* Price */}
                {isOwned ? (
                    <div className="flex items-center gap-1">
                        <HugeiconsIcon icon={Tick02Icon} className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400">Owned</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <HugeiconsIcon icon={Coins01Icon} className="h-3.5 w-3.5 text-cyber-gold" />
                        <span className="text-sm font-bold font-orbitron text-cyber-gold">
                            {formatCurrency(item.price)}
                        </span>
                    </div>
                )}
            </div>
        </button>
    );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                    key={i}
                    className="rounded-xl border border-white/10 bg-card/30 animate-pulse"
                >
                    <div className="aspect-square p-4">
                        <div className="w-full h-full rounded-lg bg-white/5" />
                    </div>
                    <div className="px-4 pb-4 space-y-2">
                        <div className="h-4 bg-white/5 rounded w-3/4" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                        <div className="h-4 bg-white/5 rounded w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ShopGrid({
    items,
    ownedItemIds,
    onItemClick,
    isLoading = false,
    className,
}: ShopGridProps) {
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (items.length === 0) {
        return (
            <div
                className={cn(
                    "p-12 rounded-xl bg-card/10 border border-white/5 text-center",
                    className
                )}
            >
                <div className="p-4 rounded-full bg-card/30 inline-block mb-4">
                    <HugeiconsIcon
                        icon={SearchAreaIcon}
                        className="h-12 w-12 text-muted-foreground"
                    />
                </div>
                <h3 className="text-lg font-bold font-orbitron text-foreground mb-2">
                    No Items Found
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Try adjusting your filters or check back later for new items.
                </p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4",
                className
            )}
        >
            {items.map((item) => (
                <CosmeticCard
                    key={item.id}
                    item={item}
                    isOwned={ownedItemIds.has(item.id)}
                    onClick={() => onItemClick(item)}
                />
            ))}
        </div>
    );
}

export default ShopGrid;
