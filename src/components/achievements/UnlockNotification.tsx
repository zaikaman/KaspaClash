"use client";

/**
 * Achievement Unlock Notification Component
 * Toast notification for achievement unlocks with celebration animation
 * Task: T110 [P] [US8]
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Tick02Icon,
    SparklesIcon,
    Coins01Icon,
    Medal01Icon,
    Cancel01Icon,
} from "@hugeicons/core-free-icons";
import type { Achievement, AchievementTier } from "@/types/achievement";

interface UnlockNotificationProps {
    achievement: Achievement;
    xpAwarded: number;
    currencyAwarded: number;
    badgeAwarded?: string;
    onDismiss: () => void;
    autoDismissMs?: number;
    className?: string;
}

/**
 * Tier styling configuration
 */
const TIER_CONFIG: Record<
    AchievementTier,
    { color: string; bgColor: string; borderColor: string; glowColor: string }
> = {
    bronze: {
        color: "text-amber-600",
        bgColor: "from-amber-900/30 to-amber-900/10",
        borderColor: "border-amber-700/50",
        glowColor: "shadow-amber-700/30",
    },
    silver: {
        color: "text-gray-300",
        bgColor: "from-gray-500/30 to-gray-500/10",
        borderColor: "border-gray-400/50",
        glowColor: "shadow-gray-400/30",
    },
    gold: {
        color: "text-yellow-400",
        bgColor: "from-yellow-500/30 to-yellow-500/10",
        borderColor: "border-yellow-500/50",
        glowColor: "shadow-yellow-500/30",
    },
    platinum: {
        color: "text-cyan-400",
        bgColor: "from-cyan-500/30 to-cyan-500/10",
        borderColor: "border-cyan-500/50",
        glowColor: "shadow-cyan-500/30",
    },
    diamond: {
        color: "text-purple-400",
        bgColor: "from-purple-500/30 to-purple-500/10",
        borderColor: "border-purple-500/50",
        glowColor: "shadow-purple-500/30",
    },
};

export function UnlockNotification({
    achievement,
    xpAwarded,
    currencyAwarded,
    badgeAwarded,
    onDismiss,
    autoDismissMs = 8000,
    className,
}: UnlockNotificationProps) {
    const tierConfig = TIER_CONFIG[achievement.tier];

    // Auto-dismiss timer
    React.useEffect(() => {
        if (autoDismissMs > 0) {
            const timer = setTimeout(onDismiss, autoDismissMs);
            return () => clearTimeout(timer);
        }
    }, [autoDismissMs, onDismiss]);

    return (
        <div
            className={cn(
                "fixed top-24 right-4 z-50",
                "animate-in fade-in slide-in-from-right-8 duration-500",
                className
            )}
        >
            <div
                className={cn(
                    "relative overflow-hidden",
                    "bg-gradient-to-br backdrop-blur-md",
                    "border rounded-xl shadow-2xl",
                    "min-w-[350px] max-w-[400px]",
                    tierConfig.bgColor,
                    tierConfig.borderColor,
                    tierConfig.glowColor
                )}
            >
                {/* Celebration Effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-300" />
                </div>

                {/* Close Button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors z-10"
                >
                    <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 text-muted-foreground" />
                </button>

                <div className="relative p-5">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className={cn(
                            "p-2 rounded-full",
                            achievement.tier === "diamond" ? "bg-purple-500/30" :
                                achievement.tier === "platinum" ? "bg-cyan-500/30" :
                                    achievement.tier === "gold" ? "bg-yellow-500/30" :
                                        "bg-kaspa/30"
                        )}>
                            <HugeiconsIcon icon={Tick02Icon} className="h-5 w-5 text-kaspa" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-kaspa uppercase tracking-wider">
                                Achievement Unlocked!
                            </h4>
                            <p className={cn("text-xs uppercase font-medium", tierConfig.color)}>
                                {achievement.tier} Tier
                            </p>
                        </div>
                    </div>

                    {/* Achievement Info */}
                    <div className="flex gap-4 mb-4">
                        {/* Icon */}
                        <div
                            className={cn(
                                "w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0",
                                "border",
                                tierConfig.borderColor,
                                "bg-black/20"
                            )}
                        >
                            {achievement.iconUrl ? (
                                <img
                                    src={achievement.iconUrl}
                                    alt={achievement.name}
                                    className="w-10 h-10 object-contain"
                                />
                            ) : (
                                <HugeiconsIcon
                                    icon={Medal01Icon}
                                    className={cn("h-8 w-8", tierConfig.color)}
                                />
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold font-orbitron text-foreground line-clamp-1">
                                {achievement.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {achievement.description}
                            </p>
                        </div>
                    </div>

                    {/* Rewards */}
                    <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                        <span className="text-xs text-muted-foreground uppercase font-medium">
                            Rewards:
                        </span>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <HugeiconsIcon icon={SparklesIcon} className="h-4 w-4 text-purple-400" />
                                <span className="text-sm font-bold text-purple-400 font-orbitron">
                                    +{xpAwarded} XP
                                </span>
                            </div>
                            {currencyAwarded > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <HugeiconsIcon icon={Coins01Icon} className="h-4 w-4 text-cyber-gold" />
                                    <span className="text-sm font-bold text-cyber-gold font-orbitron">
                                        +{currencyAwarded}
                                    </span>
                                </div>
                            )}
                            {badgeAwarded && (
                                <div className="flex items-center gap-1.5">
                                    <HugeiconsIcon icon={Medal01Icon} className="h-4 w-4 text-kaspa" />
                                    <span className="text-sm font-bold text-kaspa">+Badge</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progress Bar Timer */}
                {autoDismissMs > 0 && (
                    <div className="h-1 bg-black/20">
                        <div
                            className="h-full bg-kaspa/50 origin-left"
                            style={{
                                animation: `shrink ${autoDismissMs}ms linear forwards`,
                            }}
                        />
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes shrink {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
            `}</style>
        </div>
    );
}

export default UnlockNotification;
