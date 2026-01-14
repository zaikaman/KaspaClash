"use client";

/**
 * Purchase Modal Component
 * Confirmation dialog for cosmetic purchases with success/error states
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/progression/currency-utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Coins01Icon,
    Tick02Icon,
    Cancel01Icon,
    Loading03Icon,
    Alert02Icon,
} from "@hugeicons/core-free-icons";
import type { CosmeticItem } from "@/types/cosmetic";

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: CosmeticItem | null;
    currentBalance: number;
    onConfirm: () => Promise<void>;
}

type PurchaseState = "confirm" | "processing" | "success" | "error";

/**
 * Get rarity color styling
 */
function getRarityColor(rarity: string): string {
    switch (rarity) {
        case "common": return "text-gray-400";
        case "rare": return "text-blue-400";
        case "epic": return "text-purple-400";
        case "legendary": return "text-cyber-gold";
        case "prestige": return "text-pink-400";
        default: return "text-gray-400";
    }
}

export function PurchaseModal({
    isOpen,
    onClose,
    item,
    currentBalance,
    onConfirm,
}: PurchaseModalProps) {
    const [state, setState] = React.useState<PurchaseState>("confirm");
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setState("confirm");
            setErrorMessage(null);
        }
    }, [isOpen]);

    if (!isOpen || !item) return null;

    const canAfford = currentBalance >= item.price;
    const newBalance = currentBalance - item.price;

    const handleConfirm = async () => {
        setState("processing");
        try {
            await onConfirm();
            setState("success");
            // Auto-close after success
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            setState("error");
            setErrorMessage(err instanceof Error ? err.message : "Purchase failed");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={state === "confirm" ? onClose : undefined}
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative w-full max-w-md rounded-2xl border backdrop-blur-md",
                    "bg-gradient-to-b from-card/95 to-background/95",
                    "border-white/10 shadow-2xl",
                    "animate-in fade-in-0 zoom-in-95 duration-200"
                )}
            >
                {/* Close button */}
                {state === "confirm" && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                    >
                        <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
                    </button>
                )}

                <div className="p-6">
                    {/* Confirm State */}
                    {state === "confirm" && (
                        <>
                            <h2 className="text-xl font-bold font-orbitron text-foreground mb-6 text-center">
                                CONFIRM PURCHASE
                            </h2>

                            {/* Item Preview */}
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/30 border border-white/5 mb-6">
                                <div className="w-20 h-20 rounded-lg bg-card/50 border border-white/10 overflow-hidden flex items-center justify-center">
                                    {item.thumbnailUrl ? (
                                        <img
                                            src={item.thumbnailUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-cyber-gold/20 to-cyber-orange/10" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-foreground">{item.name}</h3>
                                    <p className={cn("text-sm font-medium capitalize", getRarityColor(item.rarity))}>
                                        {item.rarity} {item.category.replace("_", " ")}
                                    </p>
                                </div>
                            </div>

                            {/* Price & Balance */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Price</span>
                                    <div className="flex items-center gap-1.5">
                                        <HugeiconsIcon icon={Coins01Icon} className="h-4 w-4 text-cyber-gold" />
                                        <span className="font-bold font-orbitron text-cyber-gold">
                                            {formatCurrency(item.price)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Your Balance</span>
                                    <span className={cn(
                                        "font-bold font-orbitron",
                                        canAfford ? "text-foreground" : "text-red-400"
                                    )}>
                                        {formatCurrency(currentBalance)}
                                    </span>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">After Purchase</span>
                                    <span className={cn(
                                        "font-bold font-orbitron",
                                        canAfford ? "text-emerald-400" : "text-red-400"
                                    )}>
                                        {formatCurrency(newBalance)}
                                    </span>
                                </div>
                            </div>

                            {/* Insufficient funds warning */}
                            {!canAfford && (
                                <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                                    <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4 text-red-400 flex-shrink-0" />
                                    <p className="text-sm text-red-400">
                                        Insufficient Clash Shards. Earn more by playing matches and completing quests!
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    disabled={!canAfford}
                                    className={cn(
                                        "flex-1 gap-2",
                                        "bg-gradient-to-r from-cyber-gold to-cyber-orange",
                                        "hover:from-cyber-gold/90 hover:to-cyber-orange/90",
                                        "text-cyber-black font-bold"
                                    )}
                                >
                                    <HugeiconsIcon icon={Coins01Icon} className="h-4 w-4" />
                                    Purchase
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Processing State */}
                    {state === "processing" && (
                        <div className="py-12 text-center">
                            <HugeiconsIcon
                                icon={Loading03Icon}
                                className="h-12 w-12 text-cyber-gold animate-spin mx-auto mb-4"
                            />
                            <p className="text-lg font-medium text-foreground">Processing purchase...</p>
                        </div>
                    )}

                    {/* Success State */}
                    {state === "success" && (
                        <div className="py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <HugeiconsIcon icon={Tick02Icon} className="h-8 w-8 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold font-orbitron text-emerald-400 mb-2">
                                PURCHASE SUCCESSFUL!
                            </h3>
                            <p className="text-muted-foreground">
                                {item.name} has been added to your inventory.
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {state === "error" && (
                        <div className="py-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                                <HugeiconsIcon icon={Cancel01Icon} className="h-8 w-8 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold font-orbitron text-red-400 mb-2">
                                PURCHASE FAILED
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {errorMessage || "Something went wrong. Please try again."}
                            </p>
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PurchaseModal;
