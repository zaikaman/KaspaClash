"use client";

/**
 * Clash Shards Display Component
 * Currency balance display widget with animated updates
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/progression/currency-utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon } from "@hugeicons/core-free-icons";

interface ClashShardsDisplayProps {
    balance: number;
    previousBalance?: number;
    variant?: "compact" | "full";
    showChange?: boolean;
    className?: string;
}

export function ClashShardsDisplay({
    balance,
    previousBalance,
    variant = "compact",
    showChange = false,
    className,
}: ClashShardsDisplayProps) {
    const [displayedChange, setDisplayedChange] = React.useState<number | null>(null);
    const [isAnimating, setIsAnimating] = React.useState(false);

    // Animate balance changes
    React.useEffect(() => {
        if (showChange && previousBalance !== undefined && previousBalance !== balance) {
            const change = balance - previousBalance;
            setDisplayedChange(change);
            setIsAnimating(true);

            const timer = setTimeout(() => {
                setDisplayedChange(null);
                setIsAnimating(false);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [balance, previousBalance, showChange]);

    if (variant === "compact") {
        return (
            <div
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                    "bg-gradient-to-r from-cyber-gold/10 to-amber-500/5",
                    "border border-cyber-gold/20",
                    className
                )}
            >
                <HugeiconsIcon
                    icon={Coins01Icon}
                    className={cn(
                        "h-4 w-4 text-cyber-gold",
                        isAnimating && "animate-bounce"
                    )}
                />
                <span className="font-orbitron font-bold text-cyber-gold text-sm">
                    {formatCurrency(balance)}
                </span>

                {/* Change indicator */}
                {displayedChange !== null && (
                    <span
                        className={cn(
                            "text-xs font-bold animate-fade-in-up",
                            displayedChange > 0 ? "text-emerald-400" : "text-red-400"
                        )}
                    >
                        {displayedChange > 0 ? "+" : ""}
                        {formatCurrency(displayedChange)}
                    </span>
                )}
            </div>
        );
    }

    // Full variant
    return (
        <div
            className={cn(
                "relative p-4 rounded-xl",
                "bg-gradient-to-br from-cyber-gold/10 to-amber-500/5",
                "border border-cyber-gold/20",
                "backdrop-blur-sm",
                className
            )}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Clash Shards
                    </p>
                    <p className="text-2xl font-bold font-orbitron text-cyber-gold">
                        {formatCurrency(balance)}
                    </p>
                </div>
                <div
                    className={cn(
                        "p-3 rounded-lg bg-cyber-gold/10 border border-cyber-gold/20",
                        isAnimating && "animate-pulse"
                    )}
                >
                    <HugeiconsIcon
                        icon={Coins01Icon}
                        className="h-6 w-6 text-cyber-gold"
                    />
                </div>
            </div>

            {/* Change indicator */}
            {displayedChange !== null && (
                <div
                    className={cn(
                        "absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold",
                        "animate-bounce",
                        displayedChange > 0
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                    )}
                >
                    {displayedChange > 0 ? "+" : ""}
                    {formatCurrency(displayedChange)}
                </div>
            )}
        </div>
    );
}

export default ClashShardsDisplay;
