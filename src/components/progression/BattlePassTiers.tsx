"use client";

/**
 * Battle Pass Tiers Component
 * Displays all 50 battle pass tiers in a scrollable grid with rewards
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { getTierRewards, getNextMilestone } from "@/lib/progression/tier-rewards";
import { formatCurrency } from "@/lib/progression/currency-utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    LockKeyIcon,
    Tick02Icon,
    Coins01Icon,
    SparklesIcon,
    Gif01Icon,
    ChampionIcon,
} from "@hugeicons/core-free-icons";
import type { TierReward } from "@/types/progression";

interface BattlePassTiersProps {
    currentTier: number;
    tiers?: { tier: number; rewards: TierReward[] }[];
    isPremium?: boolean;
    onTierClick?: (tier: number) => void;
    className?: string;
}

/**
 * Get tier rarity styling (Unified Teal/Gold Theme)
 */
function getTierStyle(tier: number): {
    border: string;
    bg: string;
    glow: string;
    label: string | null;
    labelColor: string;
} {
    // Milestones (every 10 tiers)
    if (tier % 10 === 0) {
        return {
            border: "border-cyber-gold/50",
            bg: "bg-cyber-gold/5",
            glow: "shadow-cyber-gold/20",
            label: "Milestone",
            labelColor: "text-cyber-gold bg-cyber-gold/10",
        };
    }
    // Mini-milestones (every 5 tiers)
    if (tier % 5 === 0) {
        return {
            border: "border-kaspa/40",
            bg: "bg-kaspa/5",
            glow: "shadow-kaspa/10",
            label: null,
            labelColor: "",
        };
    }
    // Standard tiers
    return {
        border: "border-white/5",
        bg: "bg-card/20",
        glow: "",
        label: null,
        labelColor: "",
    };
}

/**
 * Reward type icon - using emoji/spans for icons not in the library
 */
function RewardIcon({ type }: { type: TierReward["type"] }) {
    switch (type) {
        case "currency":
            return <HugeiconsIcon icon={Coins01Icon} className="h-4 w-4 text-cyber-gold" />;
        case "cosmetic":
            return <HugeiconsIcon icon={SparklesIcon} className="h-4 w-4 text-kaspa" />;
        case "achievement_badge":
            return <HugeiconsIcon icon={Gif01Icon} className="h-4 w-4 text-cyber-gold" />;
        default:
            return null;
    }
}

/**
 * Single Tier Card
 */
function TierCard({
    tier,
    rewards,
    isUnlocked,
    isCurrent,
    onClick,
}: {
    tier: number;
    rewards: TierReward[];
    isUnlocked: boolean;
    isCurrent: boolean;
    onClick?: () => void;
}) {
    const style = getTierStyle(tier);
    const currencyReward = rewards.find((r) => r.type === "currency");
    const hasCosmetic = rewards.some((r) => r.type === "cosmetic");
    const hasBadge = rewards.some((r) => r.type === "achievement_badge");

    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={cn(
                "relative flex flex-col items-center justify-between p-3 rounded-lg border transition-all duration-300",
                "min-h-[120px] w-full",
                style.bg,
                style.border,
                // Unlocked state
                isUnlocked ? "opacity-100 backdrop-blur-sm" : "opacity-40 grayscale-[50%]",
                // Current tier highlight
                isCurrent && "ring-2 ring-kaspa ring-offset-2 ring-offset-background scale-105 z-10 opacity-100 shadow-[0_0_20px_rgba(112,255,255,0.3)]",
                // Hover state
                onClick && "hover:scale-105 hover:shadow-lg hover:border-kaspa/50 cursor-pointer hover:bg-kaspa/10",
                style.glow && isUnlocked && `shadow-lg ${style.glow}`
            )}
        >
            {/* Tier Number Badge */}
            <div
                className={cn(
                    "absolute -top-2 -left-2 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold font-orbitron",
                    "border shadow-sm",
                    isUnlocked
                        ? "bg-kaspa text-cyber-black border-kaspa"
                        : "bg-cyber-black/80 text-cyber-gray border-white/10"
                )}
            >
                {tier}
            </div>

            {/* Status Icon */}
            <div className="absolute -top-2 -right-2">
                {isUnlocked ? (
                    <div className="h-5 w-5 rounded-full bg-kaspa flex items-center justify-center shadow-md">
                        <HugeiconsIcon icon={Tick02Icon} className="h-3 w-3 text-cyber-black" />
                    </div>
                ) : (
                    <div className="h-5 w-5 rounded-full bg-cyber-black/80 flex items-center justify-center shadow-md border border-white/10">
                        <HugeiconsIcon icon={LockKeyIcon} className="h-3 w-3 text-cyber-gray" />
                    </div>
                )}
            </div>

            {/* Label */}
            {style.label && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-full flex justify-center">
                    <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                        style.labelColor
                    )}>
                        {style.label}
                    </span>
                </div>
            )}

            {/* Rewards Display */}
            <div className="flex flex-col items-center justify-center gap-2 mt-4 flex-grow">
                {/* Currency Reward */}
                {currencyReward && currencyReward.currencyAmount && (
                    <div className="flex items-center gap-1">
                        <HugeiconsIcon icon={Coins01Icon} className="h-3 w-3 text-cyber-gold" />
                        <span className="text-xs font-bold text-cyber-gold font-orbitron">
                            {formatCurrency(currencyReward.currencyAmount)}
                        </span>
                    </div>
                )}

                {/* Other Rewards Icons */}
                <div className="flex items-center gap-1">
                    {hasCosmetic && (
                        <div className="p-1 rounded bg-kaspa/10 border border-kaspa/20" title="Cosmetic Reward">
                            <HugeiconsIcon icon={SparklesIcon} className="h-3 w-3 text-kaspa" />
                        </div>
                    )}
                    {hasBadge && (
                        <div className="p-1 rounded bg-cyber-gold/10 border border-cyber-gold/20" title="Badge Reward">
                            <HugeiconsIcon icon={ChampionIcon} className="h-3 w-3 text-cyber-gold" />
                        </div>
                    )}
                </div>
            </div>

            {/* Current Tier Indicator */}
            {isCurrent && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-kaspa text-cyber-black text-[9px] font-bold rounded-full shadow-lg whitespace-nowrap font-orbitron tracking-wide">
                    CURRENT
                </div>
            )}
        </button>
    );
}

export function BattlePassTiers({
    currentTier,
    tiers,
    isPremium = false,
    onTierClick,
    className,
}: BattlePassTiersProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const currentTierRef = React.useRef<HTMLDivElement>(null);

    // Generate tiers if not provided
    const allTiers = React.useMemo(() => {
        if (tiers && tiers.length > 0) return tiers;

        return Array.from({ length: 50 }, (_, i) => ({
            tier: i + 1,
            rewards: getTierRewards(i + 1, isPremium),
        }));
    }, [tiers, isPremium]);

    // Scroll to current tier on mount
    React.useEffect(() => {
        if (currentTierRef.current) {
            currentTierRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
            });
        }
    }, [currentTier]);

    // Get next milestone
    const nextMilestone = getNextMilestone(currentTier);

    return (
        <div className={cn("w-full space-y-4", className)}>
            {/* Milestone Preview */}
            {nextMilestone && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-kaspa/10 to-cyber-gold/10 border border-kaspa/30">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-kaspa/20 flex items-center justify-center">
                            <span className="text-lg font-bold text-kaspa font-orbitron">
                                {nextMilestone.tier}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                                Next Milestone: Tier {nextMilestone.tier}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {nextMilestone.tier - currentTier} tiers away
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {nextMilestone.rewards.map((reward, idx) => (
                            <RewardIcon key={idx} type={reward.type} />
                        ))}
                    </div>
                </div>
            )}

            {/* Tiers Grid */}
            <div
                ref={containerRef}
                className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 p-4 rounded-xl bg-card/30 border border-border/50"
            >
                {allTiers.map(({ tier, rewards }) => (
                    <div
                        key={tier}
                        ref={tier === currentTier ? currentTierRef : undefined}
                    >
                        <TierCard
                            tier={tier}
                            rewards={rewards}
                            isUnlocked={tier <= currentTier}
                            isCurrent={tier === currentTier}
                            onClick={onTierClick ? () => onTierClick(tier) : undefined}
                        />
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-kaspa" />
                    <span>Unlocked</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-cyber-black border border-white/20" />
                    <span>Locked</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={Coins01Icon} className="h-3 w-3 text-cyber-gold" />
                    <span>Clash Shards</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={SparklesIcon} className="h-3 w-3 text-kaspa" />
                    <span>Cosmetic</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={ChampionIcon} className="h-3 w-3 text-cyber-gold" />
                    <span>Badge</span>
                </div>
            </div>
        </div>
    );
}

export default BattlePassTiers;
