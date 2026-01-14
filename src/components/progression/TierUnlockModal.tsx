"use client";

/**
 * Tier Unlock Modal Component
 * Celebration modal displayed when unlocking battle pass tiers
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/progression/currency-utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Coins01Icon,
    ArrowRight02Icon,
    ChampionIcon,
    StarIcon,
    FlashIcon,
    PaintBrush01Icon,
    Award02Icon,
    GiftIcon,
    CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import type { TierReward } from "@/types/progression";

interface UnlockedTier {
    tier: number;
    rewards: TierReward[];
}

interface TierUnlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    unlockedTiers: UnlockedTier[];
    onClaim: () => void;
    isClaimingRewards?: boolean;
}

/**
 * Get tier celebration color scheme
 */
function getTierColorScheme(tier: number): {
    gradient: string;
    glow: string;
    accent: string;
    border: string;
    iconColor: string;
} {
    if (tier === 50) {
        return {
            gradient: "from-amber-500/20 via-yellow-400/20 to-amber-500/20",
            glow: "shadow-amber-500/20",
            accent: "text-amber-400",
            border: "border-amber-500/50",
            iconColor: "text-amber-400",
        };
    }
    if (tier === 25 || tier === 40) {
        return {
            gradient: "from-purple-500/20 via-pink-400/20 to-purple-500/20",
            glow: "shadow-purple-500/20",
            accent: "text-purple-400",
            border: "border-purple-500/50",
            iconColor: "text-purple-400",
        };
    }
    if (tier % 10 === 0) {
        return {
            gradient: "from-blue-500/20 via-cyan-400/20 to-blue-500/20",
            glow: "shadow-blue-500/20",
            accent: "text-blue-400",
            border: "border-blue-500/50",
            iconColor: "text-blue-400",
        };
    }
    return {
        gradient: "from-kaspa/20 via-emerald-400/20 to-kaspa/20",
        glow: "shadow-kaspa/20",
        accent: "text-kaspa",
        border: "border-kaspa/50",
        iconColor: "text-kaspa",
    };
}

/**
 * Reward display component
 */
function RewardDisplay({ reward }: { reward: TierReward }) {
    switch (reward.type) {
        case "currency":
            return (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/50 backdrop-blur-sm group hover:border-kaspa/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-kaspa/10 flex items-center justify-center border border-kaspa/20 group-hover:bg-kaspa/20 transition-colors">
                        <HugeiconsIcon icon={Coins01Icon} className="h-5 w-5 text-kaspa" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Clash Shards</span>
                        <span className="text-lg font-bold text-kaspa font-mono">
                            +{formatCurrency(reward.currencyAmount || 0)}
                        </span>
                    </div>
                </div>
            );

        case "cosmetic":
            return (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/50 backdrop-blur-sm group hover:border-purple-500/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                        <HugeiconsIcon icon={PaintBrush01Icon} className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cosmetic Item</span>
                        <span className="text-sm font-semibold text-purple-100">
                            {reward.itemId?.replace(/_/g, " ").replace(/tier \d+ /, "")}
                        </span>
                    </div>
                </div>
            );

        case "achievement_badge":
            return (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/50 backdrop-blur-sm group hover:border-amber-500/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                        <HugeiconsIcon icon={Award02Icon} className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Special Badge</span>
                        <span className="text-sm font-semibold text-amber-100">
                            {reward.itemId?.replace(/_/g, " ")}
                        </span>
                    </div>
                </div>
            );

        default:
            return null;
    }
}

/**
 * Confetti particle component
 */
function Confetti() {
    const particles = React.useMemo(() => {
        const colors = ["#49BD91", "#8B5CF6", "#F59E0B", "#EC4899", "#3B82F6"];
        return Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 2 + Math.random() * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 6,
        }));
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute animate-fall"
                    style={{
                        left: `${particle.x}%`,
                        animationDelay: `${particle.delay}s`,
                        animationDuration: `${particle.duration}s`,
                    }}
                >
                    <div
                        className="rounded-full"
                        style={{
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                        }}
                    />
                </div>
            ))}
            <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
        </div>
    );
}

export function TierUnlockModal({
    isOpen,
    onClose,
    unlockedTiers,
    onClaim,
    isClaimingRewards = false,
}: TierUnlockModalProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [showConfetti, setShowConfetti] = React.useState(false);

    // Calculate total rewards summary - must be BEFORE any early returns (Rules of Hooks)
    const totalRewards = React.useMemo(() => {
        if (!unlockedTiers || unlockedTiers.length === 0) {
            return { currency: 0, cosmetics: 0, badges: 0 };
        }

        let currency = 0;
        let cosmetics = 0;
        let badges = 0;

        unlockedTiers.forEach((ut) => {
            ut.rewards.forEach((r) => {
                if (r.type === "currency" && r.currencyAmount) {
                    currency += r.currencyAmount;
                } else if (r.type === "cosmetic") {
                    cosmetics++;
                } else if (r.type === "achievement_badge") {
                    badges++;
                }
            });
        });

        return { currency, cosmetics, badges };
    }, [unlockedTiers]);

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setShowConfetti(true);
            // Hide confetti after animation
            const timer = setTimeout(() => setShowConfetti(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!unlockedTiers || unlockedTiers.length === 0) return null;

    const currentTier = unlockedTiers[currentIndex];
    const colorScheme = getTierColorScheme(currentTier.tier);
    const isMultipleTiers = unlockedTiers.length > 1;
    const isLastTier = currentIndex === unlockedTiers.length - 1;

    const handleNext = () => {
        if (currentIndex < unlockedTiers.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleClaim = () => {
        onClaim();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md overflow-hidden border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl">
                {/* Confetti Effect */}
                {showConfetti && <Confetti />}

                {/* Background Glow */}
                <div
                    className={cn(
                        "absolute inset-0 opacity-30 blur-3xl pointer-events-none",
                        `bg-gradient-to-br ${colorScheme.gradient}`
                    )}
                />

                <DialogHeader className="relative z-10 flex flex-col items-center gap-4 pt-6">
                    <div className={cn(
                        "h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg border border-white/10",
                        "bg-gradient-to-br from-background to-muted"
                    )}>
                        <HugeiconsIcon icon={ChampionIcon} className={cn("h-8 w-8", colorScheme.iconColor)} />
                    </div>

                    <div className="space-y-1 text-center">
                        <DialogTitle className="text-2xl font-bold tracking-tight">
                            {isMultipleTiers ? (
                                <span>{unlockedTiers.length} Tiers Unlocked!</span>
                            ) : (
                                <span>Tier Unlocked!</span>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground">
                            {isMultipleTiers
                                ? `Tier ${currentIndex + 1} of ${unlockedTiers.length}`
                                : "You've reached a new tier!"
                            }
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="relative z-10 space-y-8 py-6">
                    {/* Tier Number Display */}
                    <div className="flex justify-center">
                        <div
                            className={cn(
                                "relative w-32 h-32 rounded-[2rem] flex items-center justify-center",
                                "bg-gradient-to-br from-background to-muted shadow-xl border",
                                colorScheme.border
                            )}
                        >
                            {/* Inner glow */}
                            <div className={cn("absolute inset-2 rounded-[1.5rem] opacity-20", `bg-${colorScheme.iconColor.split('-')[1]}-500`)} />

                            <span className={cn(
                                "text-6xl font-black drop-shadow-sm tracking-tighter",
                                colorScheme.iconColor
                            )}>
                                {currentTier.tier}
                            </span>

                            {/* Decorative icons */}
                            <div className={cn(
                                "absolute -top-3 -right-3 h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center shadow-sm",
                                colorScheme.iconColor
                            )}>
                                <HugeiconsIcon icon={StarIcon} className="h-5 w-5 fill-current" />
                            </div>
                            <div className={cn(
                                "absolute -bottom-2 -left-2 h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm delay-150",
                                colorScheme.iconColor
                            )}>
                                <HugeiconsIcon icon={FlashIcon} className="h-4 w-4" />
                            </div>
                        </div>
                    </div>

                    {/* Rewards Grid */}
                    <div className="space-y-3 px-4">
                        <div className="flex items-center gap-2 justify-center pb-2">
                            <div className="h-px w-8 bg-border/50" />
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Rewards Included
                            </h4>
                            <div className="h-px w-8 bg-border/50" />
                        </div>
                        <div className="grid gap-2">
                            {currentTier.rewards.map((reward, idx) => (
                                <RewardDisplay key={idx} reward={reward} />
                            ))}
                        </div>
                    </div>

                    {/* Summary for multiple tiers */}
                    {isMultipleTiers && isLastTier && (
                        <div className="mx-4 p-4 rounded-xl bg-muted/40 border border-border/50 dashed-border">
                            <h4 className="text-xs font-semibold text-center mb-3 text-muted-foreground uppercase tracking-wider">
                                Total Summary
                            </h4>
                            <div className="flex items-center justify-center gap-6 text-sm">
                                {totalRewards.currency > 0 && (
                                    <div className="flex items-center gap-1.5 p-1.5 px-2 rounded-md bg-kaspa/10 text-kaspa">
                                        <HugeiconsIcon icon={Coins01Icon} className="h-4 w-4" />
                                        <span className="font-bold font-mono">
                                            +{formatCurrency(totalRewards.currency)}
                                        </span>
                                    </div>
                                )}
                                {totalRewards.cosmetics > 0 && (
                                    <div className="flex items-center gap-1.5 p-1.5 px-2 rounded-md bg-purple-500/10 text-purple-400">
                                        <HugeiconsIcon icon={PaintBrush01Icon} className="h-4 w-4" />
                                        <span className="font-bold">
                                            {totalRewards.cosmetics} items
                                        </span>
                                    </div>
                                )}
                                {totalRewards.badges > 0 && (
                                    <div className="flex items-center gap-1.5 p-1.5 px-2 rounded-md bg-amber-500/10 text-amber-400">
                                        <HugeiconsIcon icon={Award02Icon} className="h-4 w-4" />
                                        <span className="font-bold">
                                            {totalRewards.badges} badges
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="relative z-10 gap-3 sm:gap-0 sm:flex-row flex-col px-6 pb-6">
                    {isMultipleTiers && !isLastTier ? (
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" onClick={handleClaim} disabled={isClaimingRewards} className="flex-1">
                                Claim All
                            </Button>
                            <Button onClick={handleNext} className="flex-1 gap-2" variant="default">
                                Next Tier
                                <HugeiconsIcon icon={ArrowRight02Icon} className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleClaim}
                            disabled={isClaimingRewards}
                            className="w-full gap-2 h-11 text-base font-semibold shadow-lg shadow-kaspa/20"
                            variant="kaspa"
                        >
                            {isClaimingRewards ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Claiming Rewards...
                                </>
                            ) : (
                                <>
                                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-5 w-5" />
                                    Claim Rewards
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default TierUnlockModal;

