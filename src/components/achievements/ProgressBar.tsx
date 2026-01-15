"use client";

/**
 * Achievement Progress Bar Component
 * Displays progress towards achievement completion with tier-based styling
 * Task: T109 [P] [US8]
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import type { AchievementTier } from "@/types/achievement";

interface AchievementProgressBarProps {
    current: number;
    target: number;
    tier?: AchievementTier;
    showLabel?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

/**
 * Tier-based progress bar colors
 */
const TIER_COLORS: Record<AchievementTier, string> = {
    bronze: "bg-amber-600",
    silver: "bg-gray-400",
    gold: "bg-yellow-400",
    platinum: "bg-cyan-400",
    diamond: "bg-purple-400",
};

/**
 * Size variants
 */
const SIZE_VARIANTS = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
};

export function AchievementProgressBar({
    current,
    target,
    tier = "bronze",
    showLabel = true,
    size = "md",
    className,
}: AchievementProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (current / target) * 100));
    const isComplete = current >= target;

    const progressColor = isComplete ? "bg-kaspa" : TIER_COLORS[tier];

    return (
        <div className={cn("w-full", className)}>
            {showLabel && (
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-muted-foreground font-medium">
                        Progress
                    </span>
                    <span className="text-xs font-bold text-foreground font-orbitron">
                        {current.toLocaleString()} / {target.toLocaleString()}
                    </span>
                </div>
            )}
            <div
                className={cn(
                    "relative rounded-full bg-background/50 overflow-hidden border border-white/5",
                    SIZE_VARIANTS[size]
                )}
            >
                <div
                    className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
                        progressColor
                    )}
                    style={{ width: `${percentage}%` }}
                />
                {isComplete && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
            </div>
            {showLabel && (
                <div className="flex justify-end mt-1">
                    <span className="text-xs text-muted-foreground">
                        {percentage.toFixed(0)}%
                    </span>
                </div>
            )}
        </div>
    );
}

export default AchievementProgressBar;
