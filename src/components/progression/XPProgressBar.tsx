"use client";

/**
 * XP Progress Bar Component
 * Displays current tier progress with animated fill and prestige badge
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/progression/currency-utils";

interface XPProgressBarProps {
    currentTier: number;
    currentXP: number;
    xpRequired: number;
    totalXP?: number;
    prestigeLevel?: number;
    animated?: boolean;
    showDetails?: boolean;
    className?: string;
}

/**
 * Get prestige color based on level
 */
function getPrestigeColor(level: number): string {
    if (level >= 10) return "from-red-500 to-orange-500"; // Master
    if (level >= 7) return "from-purple-500 to-pink-500"; // Diamond
    if (level >= 5) return "from-amber-500 to-yellow-500"; // Gold
    if (level >= 3) return "from-cyan-500 to-blue-500"; // Platinum
    if (level >= 1) return "from-gray-400 to-gray-300"; // Silver
    return "from-kaspa to-kaspa"; // Default
}

/**
 * Get prestige icon based on level
 */
function getPrestigeIcon(level: number): string {
    if (level >= 10) return "👑";
    if (level >= 7) return "💎";
    if (level >= 5) return "🏆";
    if (level >= 3) return "⭐";
    if (level >= 1) return "🔱";
    return "";
}

export function XPProgressBar({
    currentTier,
    currentXP,
    xpRequired,
    totalXP = 0,
    prestigeLevel = 0,
    animated = true,
    showDetails = true,
    className,
}: XPProgressBarProps) {
    const progressPercentage = xpRequired > 0
        ? Math.min(100, (currentXP / xpRequired) * 100)
        : 0;

    const [displayedProgress, setDisplayedProgress] = React.useState(0);

    // Animate progress bar on mount or value change
    React.useEffect(() => {
        if (!animated) {
            setDisplayedProgress(progressPercentage);
            return;
        }

        // Start from 0 and animate to target
        setDisplayedProgress(0);
        const timer = setTimeout(() => {
            setDisplayedProgress(progressPercentage);
        }, 100);

        return () => clearTimeout(timer);
    }, [progressPercentage, animated]);

    return (
        <div className={cn("w-full space-y-2", className)}>
            {/* Header with tier and prestige info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Current Tier Badge */}
                    <div className="relative">
                        <div
                            className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-lg font-bold text-lg",
                                "bg-gradient-to-br shadow-lg",
                                prestigeLevel > 0
                                    ? getPrestigeColor(prestigeLevel)
                                    : "from-kaspa to-kaspa/80",
                                "text-white"
                            )}
                        >
                            {currentTier}
                        </div>
                        {/* Prestige indicator */}
                        {prestigeLevel > 0 && (
                            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-xs shadow-md border border-border">
                                {getPrestigeIcon(prestigeLevel)}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">
                            Tier {currentTier}
                            {currentTier === 50 && " (Max)"}
                        </span>
                        {prestigeLevel > 0 && (
                            <span className="text-xs text-muted-foreground">
                                Prestige {prestigeLevel} (+{prestigeLevel * 10}% XP)
                            </span>
                        )}
                    </div>
                </div>

                {/* Next tier indicator */}
                {currentTier < 50 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Next:</span>
                        <div
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-md font-semibold text-sm",
                                "bg-muted/50 text-muted-foreground border border-dashed border-muted-foreground/30"
                            )}
                        >
                            {currentTier + 1}
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted/50 border border-border/50">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="h-full w-full"
                        style={{
                            backgroundImage:
                                "repeating-linear-gradient(45deg, transparent, transparent 3px, currentColor 3px, currentColor 4px)",
                        }}
                    />
                </div>

                {/* Progress fill */}
                <div
                    className={cn(
                        "h-full rounded-full bg-gradient-to-r from-kaspa via-kaspa/90 to-kaspa/80",
                        "shadow-[0_0_10px_rgba(73,189,145,0.5)]",
                        animated && "transition-all duration-1000 ease-out"
                    )}
                    style={{ width: `${displayedProgress}%` }}
                >
                    {/* Shimmer effect */}
                    {animated && displayedProgress > 0 && (
                        <div className="absolute inset-0 overflow-hidden">
                            <div
                                className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                style={{ animation: "shimmer 2s infinite" }}
                            />
                        </div>
                    )}
                </div>

                {/* Percentage text overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-white drop-shadow-md mix-blend-difference">
                        {Math.floor(displayedProgress)}%
                    </span>
                </div>
            </div>

            {/* XP Details */}
            {showDetails && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        <span className="font-medium text-foreground">
                            {formatCurrency(currentXP)}
                        </span>{" "}
                        / {formatCurrency(xpRequired)} XP
                    </span>
                    {totalXP > 0 && (
                        <span>
                            Total: <span className="font-medium">{formatCurrency(totalXP)}</span> XP
                        </span>
                    )}
                </div>
            )}

            {/* Tier 50 celebration */}
            {currentTier === 50 && (
                <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30">
                    <span className="text-xl">🎉</span>
                    <span className="text-sm font-medium text-amber-500">
                        Maximum Tier Reached! Ready for Prestige?
                    </span>
                </div>
            )}
        </div>
    );
}

// Add shimmer animation to global styles or in the component
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }
`;

// Inject keyframes if not already present
if (typeof document !== "undefined") {
    const styleId = "xp-progress-bar-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = shimmerKeyframes;
        document.head.appendChild(style);
    }
}

export default XPProgressBar;
