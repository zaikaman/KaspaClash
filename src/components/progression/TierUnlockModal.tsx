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
} {
    if (tier === 50) {
        return {
            gradient: "from-amber-500 via-yellow-400 to-amber-500",
            glow: "shadow-amber-500/50",
            accent: "text-amber-400",
        };
    }
    if (tier === 25 || tier === 40) {
        return {
            gradient: "from-purple-500 via-pink-400 to-purple-500",
            glow: "shadow-purple-500/50",
            accent: "text-purple-400",
        };
    }
    if (tier % 10 === 0) {
        return {
            gradient: "from-blue-500 via-cyan-400 to-blue-500",
            glow: "shadow-blue-500/50",
            accent: "text-blue-400",
        };
    }
    return {
        gradient: "from-kaspa via-emerald-400 to-kaspa",
        glow: "shadow-kaspa/50",
        accent: "text-kaspa",
    };
}

/**
 * Reward display component
 */
function RewardDisplay({ reward }: { reward: TierReward }) {
    switch (reward.type) {
        case "currency":
            return (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-kaspa/10 border border-kaspa/30">
                    <div className="h-10 w-10 rounded-lg bg-kaspa/20 flex items-center justify-center">
                        <HugeiconsIcon icon={Coins01Icon} className="h-5 w-5 text-kaspa" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Clash Shards</span>
                        <span className="text-lg font-bold text-kaspa">
                            +{formatCurrency(reward.currencyAmount || 0)}
                        </span>
                    </div>
                </div>
            );

        case "cosmetic":
            return (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <span className="text-lg">✨</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Cosmetic Item</span>
                        <span className="text-sm font-semibold text-purple-400">
                            {reward.itemId?.replace(/_/g, " ").replace(/tier \d+ /, "")}
                        </span>
                    </div>
                </div>
            );

        case "achievement_badge":
            return (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <span className="text-lg">🎁</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Special Badge</span>
                        <span className="text-sm font-semibold text-amber-400">
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

    // Calculate total rewards summary
    const totalRewards = React.useMemo(() => {
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
            <DialogContent className="sm:max-w-md overflow-hidden">
                {/* Confetti Effect */}
                {showConfetti && <Confetti />}

                {/* Background Glow */}
                <div
                    className={cn(
                        "absolute inset-0 opacity-20 blur-3xl",
                        `bg-gradient-to-br ${colorScheme.gradient}`
                    )}
                />

                <DialogHeader className="relative z-10">
                    <DialogTitle className="text-center">
                        <span className="text-3xl">🎉</span>
                    </DialogTitle>
                    <DialogDescription className="text-center space-y-2">
                        {isMultipleTiers ? (
                            <>
                                <span className="block text-lg font-semibold text-foreground">
                                    {unlockedTiers.length} Tiers Unlocked!
                                </span>
                                <span className="block text-sm">
                                    Tier {currentIndex + 1} of {unlockedTiers.length}
                                </span>
                            </>
                        ) : (
                            <span className="block text-lg font-semibold text-foreground">
                                Tier Unlocked!
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative z-10 space-y-6 py-4">
                    {/* Tier Number Display */}
                    <div className="flex justify-center">
                        <div
                            className={cn(
                                "relative h-24 w-24 rounded-2xl flex items-center justify-center",
                                "bg-gradient-to-br shadow-2xl",
                                colorScheme.gradient,
                                colorScheme.glow
                            )}
                        >
                            <span className="text-4xl font-black text-white drop-shadow-lg">
                                {currentTier.tier}
                            </span>
                            {/* Sparkle decorations */}
                            <div className="absolute -top-2 -right-2 text-xl animate-bounce">
                                ✨
                            </div>
                            <div className="absolute -bottom-2 -left-2 text-lg animate-bounce delay-150">
                                ⭐
                            </div>
                        </div>
                    </div>

                    {/* Rewards Grid */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-center text-muted-foreground uppercase tracking-wider">
                            Rewards
                        </h4>
                        <div className="grid gap-2">
                            {currentTier.rewards.map((reward, idx) => (
                                <RewardDisplay key={idx} reward={reward} />
                            ))}
                        </div>
                    </div>

                    {/* Summary for multiple tiers */}
                    {isMultipleTiers && isLastTier && (
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <h4 className="text-sm font-semibold text-center mb-3">
                                Total Rewards Summary
                            </h4>
                            <div className="flex items-center justify-center gap-6 text-sm">
                                {totalRewards.currency > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <HugeiconsIcon icon={Coins01Icon} className="h-4 w-4 text-kaspa" />
                                        <span className="font-semibold text-kaspa">
                                            +{formatCurrency(totalRewards.currency)}
                                        </span>
                                    </div>
                                )}
                                {totalRewards.cosmetics > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">✨</span>
                                        <span className="font-semibold text-purple-400">
                                            {totalRewards.cosmetics} items
                                        </span>
                                    </div>
                                )}
                                {totalRewards.badges > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">🎁</span>
                                        <span className="font-semibold text-amber-400">
                                            {totalRewards.badges} badges
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="relative z-10 gap-2">
                    {isMultipleTiers && !isLastTier ? (
                        <>
                            <Button variant="outline" onClick={handleClaim} disabled={isClaimingRewards}>
                                Claim All
                            </Button>
                            <Button onClick={handleNext} className="gap-2">
                                Next Tier
                                <HugeiconsIcon icon={ArrowRight02Icon} className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleClaim}
                            disabled={isClaimingRewards}
                            className="w-full gap-2"
                            variant="kaspa"
                        >
                            {isClaimingRewards ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Claiming...
                                </>
                            ) : (
                                <>
                                    <span className="text-sm">🎁</span>
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
