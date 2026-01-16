"use client";

/**
 * Achievement Card Component
 * Displays individual achievement with tier styling, progress, and rewards
 * Task: T108 [P] [US8]
 * 
 * Updated: Added claim button for completed but unclaimed achievements
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { AchievementProgressBar } from "./ProgressBar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Tick02Icon,
    LockKeyIcon,
    Fire02Icon,
    Bitcoin01Icon,
    Award01Icon,
    EyeIcon,
    Loading03Icon,
    Gif02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { PlayerAchievement, AchievementTier } from "@/types/achievement";

interface AchievementCardProps {
    achievement: PlayerAchievement;
    onViewDetails?: (achievementId: string) => void;
    onClaim?: (achievementId: string) => Promise<void>;
    className?: string;
}

/**
 * Tier styling configuration
 */
const TIER_CONFIG: Record<
    AchievementTier,
    { label: string; color: string; bgColor: string; borderColor: string; glowColor: string }
> = {
    bronze: {
        label: "Bronze",
        color: "text-amber-600",
        bgColor: "bg-amber-900/20",
        borderColor: "border-amber-700/30",
        glowColor: "shadow-amber-700/20",
    },
    silver: {
        label: "Silver",
        color: "text-gray-300",
        bgColor: "bg-gray-500/20",
        borderColor: "border-gray-400/30",
        glowColor: "shadow-gray-400/20",
    },
    gold: {
        label: "Gold",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500/30",
        glowColor: "shadow-yellow-500/20",
    },
    platinum: {
        label: "Platinum",
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/20",
        borderColor: "border-cyan-500/30",
        glowColor: "shadow-cyan-500/20",
    },
    diamond: {
        label: "Diamond",
        color: "text-purple-400",
        bgColor: "bg-purple-500/20",
        borderColor: "border-purple-500/30",
        glowColor: "shadow-purple-500/20",
    },
};

/**
 * Secret Achievement Placeholder
 */
function SecretAchievementCard({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "relative p-5 rounded-xl border transition-all duration-300",
                "bg-card/10 border-white/5 backdrop-blur-sm",
                "opacity-60",
                className
            )}
        >
            <div className="flex gap-4">
                {/* Icon */}
                <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-card/50 border border-white/10 flex items-center justify-center">
                        <HugeiconsIcon icon={EyeIcon} className="h-8 w-8 text-muted-foreground" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold font-orbitron text-muted-foreground mb-1">
                        Secret Achievement
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        This achievement will be revealed once you unlock it. Keep playing to discover it!
                    </p>
                </div>
            </div>
        </div>
    );
}

export function AchievementCard({
    achievement,
    onViewDetails,
    onClaim,
    className,
}: AchievementCardProps) {
    const { achievement: achievementDef, isUnlocked, progressPercentage, currentProgress, targetProgress } = achievement;
    const [isClaiming, setIsClaiming] = React.useState(false);

    // Check if achievement is ready to claim (100% progress but not unlocked)
    const isReadyToClaim = !isUnlocked && progressPercentage >= 100;

    // Handle claim action
    const handleClaim = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onClaim || isClaiming) return;
        
        setIsClaiming(true);
        try {
            await onClaim(achievement.achievementId);
        } catch (error) {
            // Error is handled by the parent component (setError in page)
            // Just log here for debugging
            console.error('[AchievementCard] Claim error:', error);
        } finally {
            setIsClaiming(false);
        }
    };

    // Handle secret achievements
    if (achievementDef.isSecret && !isUnlocked) {
        return <SecretAchievementCard className={className} />;
    }

    const tierConfig = TIER_CONFIG[achievementDef.tier];

    return (
        <div
            className={cn(
                "relative p-5 rounded-xl border transition-all duration-300",
                "bg-gradient-to-br backdrop-blur-sm group",
                isUnlocked
                    ? cn(tierConfig.bgColor, tierConfig.borderColor, "shadow-lg", tierConfig.glowColor)
                    : "bg-card/10 border-white/5",
                !isUnlocked && "opacity-70 hover:opacity-100",
                onViewDetails && "cursor-pointer hover:scale-[1.02]",
                className
            )}
            onClick={() => onViewDetails?.(achievement.achievementId)}
        >
            {/* Tier Badge */}
            <div className="absolute -top-2.5 left-4">
                <span
                    className={cn(
                        "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border",
                        tierConfig.bgColor,
                        tierConfig.borderColor,
                        tierConfig.color
                    )}
                >
                    {tierConfig.label}
                </span>
            </div>

            {/* Unlocked Indicator */}
            {isUnlocked && (
                <div className="absolute -top-2.5 right-4">
                    <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-kaspa/20 text-kaspa border-kaspa/30 flex items-center gap-1">
                        <HugeiconsIcon icon={Tick02Icon} className="h-3 w-3" />
                        Unlocked
                    </span>
                </div>
            )}

            <div className="flex gap-4 mt-3">
                {/* Achievement Icon */}
                <div className="relative flex-shrink-0">
                    <div
                        className={cn(
                            "w-16 h-16 rounded-lg flex items-center justify-center",
                            isUnlocked
                                ? cn(tierConfig.bgColor, "border", tierConfig.borderColor)
                                : "bg-card/50 border border-white/10"
                        )}
                    >
                        <HugeiconsIcon
                            icon={isUnlocked ? Award01Icon : LockKeyIcon}
                            className={cn(
                                "h-8 w-8",
                                isUnlocked ? tierConfig.color : "text-muted-foreground"
                            )}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Title & Description */}
                    <div>
                        <h3
                            className={cn(
                                "text-lg font-bold font-orbitron mb-1 line-clamp-1",
                                isUnlocked ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {achievementDef.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {achievementDef.description}
                        </p>
                    </div>

                    {/* Progress Bar - Only show for incomplete achievements */}
                    {!isUnlocked && (
                        <AchievementProgressBar
                            current={currentProgress}
                            target={targetProgress}
                            tier={achievementDef.tier}
                        />
                    )}

                    {/* Rewards */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={Fire02Icon} className="h-4 w-4 text-purple-400" />
                            <span className="text-sm font-bold text-purple-400 font-orbitron">
                                +{achievementDef.xpReward} XP
                            </span>
                        </div>
                        {achievementDef.currencyReward > 0 && (
                            <div className="flex items-center gap-1.5">
                                <HugeiconsIcon icon={Bitcoin01Icon} className="h-4 w-4 text-cyber-gold" />
                                <span className="text-sm font-bold text-cyber-gold font-orbitron">
                                    +{achievementDef.currencyReward}
                                </span>
                            </div>
                        )}
                        {achievementDef.badgeReward && (
                            <div className="flex items-center gap-1.5">
                                <HugeiconsIcon icon={Award01Icon} className="h-4 w-4 text-kaspa" />
                                <span className="text-sm font-bold text-kaspa">Badge</span>
                            </div>
                        )}
                    </div>

                    {/* Claim Button - Show when achievement is ready to claim */}
                    {isReadyToClaim && onClaim && (
                        <Button
                            onClick={handleClaim}
                            disabled={isClaiming}
                            className={cn(
                                "w-full mt-2",
                                "bg-gradient-to-r from-kaspa to-kaspa-dark hover:from-kaspa-light hover:to-kaspa",
                                "text-black font-bold font-orbitron"
                            )}
                            size="sm"
                        >
                            {isClaiming ? (
                                <>
                                    <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 mr-2 animate-spin" />
                                    Claiming...
                                </>
                            ) : (
                                <>
                                    <HugeiconsIcon icon={Gif02Icon} className="h-4 w-4 mr-2" />
                                    Claim Reward
                                </>
                            )}
                        </Button>
                    )}

                    {/* Unlock Date */}
                    {isUnlocked && achievement.unlockedAt && (
                        <p className="text-xs text-muted-foreground">
                            Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AchievementCard;
