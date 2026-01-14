"use client";

/**
 * Cosmetic Preview Component
 * Modal for previewing items before purchase with detailed info
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/progression/currency-utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Coins01Icon,
    Cancel01Icon,
    Tick02Icon,
    SparklesIcon,
} from "@hugeicons/core-free-icons";
import type { CosmeticItem } from "@/types/cosmetic";

interface CosmeticPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    item: CosmeticItem | null;
    isOwned: boolean;
    canAfford: boolean;
    onPurchase: () => void;
}

/**
 * Get rarity styling
 */
function getRarityStyle(rarity: string): {
    border: string;
    bg: string;
    text: string;
    glow: string;
} {
    switch (rarity) {
        case "common":
            return {
                border: "border-gray-500/30",
                bg: "from-gray-500/10 to-gray-600/5",
                text: "text-gray-400",
                glow: "",
            };
        case "rare":
            return {
                border: "border-blue-500/30",
                bg: "from-blue-500/10 to-blue-600/5",
                text: "text-blue-400",
                glow: "shadow-blue-500/20",
            };
        case "epic":
            return {
                border: "border-purple-500/30",
                bg: "from-purple-500/10 to-purple-600/5",
                text: "text-purple-400",
                glow: "shadow-purple-500/20",
            };
        case "legendary":
            return {
                border: "border-cyber-gold/30",
                bg: "from-cyber-gold/10 to-amber-600/5",
                text: "text-cyber-gold",
                glow: "shadow-cyber-gold/30",
            };
        case "prestige":
            return {
                border: "border-pink-500/30",
                bg: "from-pink-500/10 to-pink-600/5",
                text: "text-pink-400",
                glow: "shadow-pink-500/30",
            };
        default:
            return {
                border: "border-gray-500/30",
                bg: "from-gray-500/10 to-gray-600/5",
                text: "text-gray-400",
                glow: "",
            };
    }
}

/**
 * Get category display name
 */
function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        character: "Character",
        sticker: "Sticker",
    };
    return labels[category] || category;
}

export function CosmeticPreview({
    isOpen,
    onClose,
    item,
    isOwned,
    canAfford,
    onPurchase,
}: CosmeticPreviewProps) {
    if (!isOpen || !item) return null;

    const rarityStyle = getRarityStyle(item.rarity);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative w-full max-w-lg rounded-2xl border backdrop-blur-md",
                    "bg-gradient-to-b from-card/95 to-background/95",
                    rarityStyle.border,
                    rarityStyle.glow && `shadow-xl ${rarityStyle.glow}`,
                    "animate-in fade-in-0 zoom-in-95 duration-200"
                )}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                    <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
                </button>

                {/* Rarity badge */}
                <div className="absolute top-4 left-4 z-10">
                    <span
                        className={cn(
                            "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border",
                            `bg-gradient-to-r ${rarityStyle.bg}`,
                            rarityStyle.border,
                            rarityStyle.text
                        )}
                    >
                        {item.rarity}
                    </span>
                </div>

                {/* Preview Image */}
                <div
                    className={cn(
                        "relative h-64 rounded-t-2xl overflow-hidden",
                        `bg-gradient-to-b ${rarityStyle.bg}`
                    )}
                >
                    {item.previewUrl || item.thumbnailUrl ? (
                        <img
                            src={item.previewUrl || item.thumbnailUrl}
                            alt={item.name}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <HugeiconsIcon
                                icon={SparklesIcon}
                                className={cn("h-24 w-24 opacity-30", rarityStyle.text)}
                            />
                        </div>
                    )}

                    {/* Legendary glow effect */}
                    {(item.rarity === "legendary" || item.rarity === "prestige") && (
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 animate-pulse" />
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Title & Category */}
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold font-orbitron text-foreground mb-1">
                            {item.name}
                        </h2>
                        <p className={cn("text-sm font-medium", rarityStyle.text)}>
                            {getCategoryLabel(item.category)}
                            {item.characterId && ` • ${item.characterId.replace("-", " ")}`}
                        </p>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm mb-6">
                        {item.description || "A unique cosmetic item to customize your experience."}
                    </p>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {item.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 text-xs rounded-md bg-white/5 text-muted-foreground border border-white/10"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        {/* Price */}
                        {!isOwned && (
                            <div className="flex items-center gap-2">
                                <HugeiconsIcon icon={Coins01Icon} className="h-5 w-5 text-cyber-gold" />
                                <span className="text-xl font-bold font-orbitron text-cyber-gold">
                                    {formatCurrency(item.price)}
                                </span>
                            </div>
                        )}

                        {isOwned && (
                            <div className="flex items-center gap-2">
                                <HugeiconsIcon icon={Tick02Icon} className="h-5 w-5 text-emerald-400" />
                                <span className="text-lg font-bold text-emerald-400">
                                    Owned
                                </span>
                            </div>
                        )}

                        {/* Action Button */}
                        {isOwned ? (
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        ) : (
                            <Button
                                onClick={onPurchase}
                                disabled={!canAfford}
                                className={cn(
                                    "gap-2",
                                    "bg-gradient-to-r from-cyber-gold to-cyber-orange",
                                    "hover:from-cyber-gold/90 hover:to-cyber-orange/90",
                                    "text-cyber-black font-bold"
                                )}
                            >
                                <HugeiconsIcon icon={Coins01Icon} className="h-4 w-4" />
                                {canAfford ? "Purchase" : "Insufficient Shards"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CosmeticPreview;
