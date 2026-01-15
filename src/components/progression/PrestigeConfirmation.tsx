"use client";

/**
 * Prestige Confirmation Modal
 * Displays prestige explanation and confirmation dialog for players at tier 50
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    SparklesIcon,
    ArrowUp01Icon,
    RefreshIcon,
    Tick02Icon,
    Alert02Icon,
    ChampionIcon,
} from "@hugeicons/core-free-icons";

interface PrestigeConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    currentPrestigeLevel: number;
    isLoading?: boolean;
}

/**
 * Prestige benefit item
 */
function PrestigeBenefit({
    icon,
    title,
    description,
    highlight,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    highlight?: string;
}) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-cyber-gold/5 border border-cyber-gold/20">
            <div className="p-2 rounded-lg bg-cyber-gold/10">
                {icon}
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-semibold text-white font-orbitron">
                    {title}
                </h4>
                <p className="text-xs text-cyber-gray mt-0.5">
                    {description}
                </p>
                {highlight && (
                    <p className="text-xs text-cyber-gold font-semibold mt-1">
                        {highlight}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * Prestige warning item
 */
function PrestigeWarning({
    text,
}: {
    text: string;
}) {
    return (
        <div className="flex items-center gap-2 text-amber-400">
            <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs">{text}</span>
        </div>
    );
}

export function PrestigeConfirmation({
    isOpen,
    onClose,
    onConfirm,
    currentPrestigeLevel,
    isLoading = false,
}: PrestigeConfirmationProps) {
    const [isConfirming, setIsConfirming] = React.useState(false);
    
    const nextPrestigeLevel = currentPrestigeLevel + 1;
    const currentXPBonus = Math.round((Math.pow(1.1, currentPrestigeLevel) - 1) * 100);
    const nextXPBonus = Math.round((Math.pow(1.1, nextPrestigeLevel) - 1) * 100);
    const currentCurrencyBonus = currentXPBonus; // Same formula
    const nextCurrencyBonus = nextXPBonus;

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm();
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg bg-gradient-to-b from-black/95 to-black/90 border-cyber-gold/30 backdrop-blur-xl">
                <DialogHeader className="text-center space-y-3">
                    {/* Prestige Icon */}
                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-cyber-gold/30 to-amber-500/20 flex items-center justify-center border-2 border-cyber-gold/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                        <div className="relative">
                            <HugeiconsIcon 
                                icon={ChampionIcon} 
                                className="h-10 w-10 text-cyber-gold" 
                            />
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyber-gold flex items-center justify-center text-black font-bold text-xs">
                                {nextPrestigeLevel}
                            </div>
                        </div>
                    </div>

                    <DialogTitle className="text-2xl font-orbitron font-bold text-white">
                        PRESTIGE <span className="text-cyber-gold">{nextPrestigeLevel}</span>
                    </DialogTitle>
                    
                    <DialogDescription className="text-cyber-gray text-sm">
                        You&apos;ve reached <span className="text-cyber-gold font-semibold">Tier 50</span>! 
                        Prestige to reset your battle pass progress in exchange for permanent bonuses.
                    </DialogDescription>
                </DialogHeader>

                {/* Benefits Section */}
                <div className="space-y-3 py-4">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                        <HugeiconsIcon icon={Tick02Icon} className="h-4 w-4 text-green-400" />
                        What You&apos;ll Gain
                    </h3>
                    
                    <div className="space-y-2">
                        <PrestigeBenefit
                            icon={<HugeiconsIcon icon={ArrowUp01Icon} className="h-5 w-5 text-cyber-gold" />}
                            title="Permanent XP Bonus"
                            description="All future XP gains are increased"
                            highlight={`+${nextXPBonus}% XP (was +${currentXPBonus}%)`}
                        />
                        
                        <PrestigeBenefit
                            icon={<HugeiconsIcon icon={SparklesIcon} className="h-5 w-5 text-cyber-gold" />}
                            title="Permanent Currency Bonus"
                            description="All Clash Shards earnings are increased"
                            highlight={`+${nextCurrencyBonus}% Shards (was +${currentCurrencyBonus}%)`}
                        />
                        
                        <PrestigeBenefit
                            icon={<HugeiconsIcon icon={ChampionIcon} className="h-5 w-5 text-cyber-gold" />}
                            title="Exclusive Prestige Badge"
                            description="Show off your dedication with a special profile border and badge"
                            highlight={`Prestige ${nextPrestigeLevel} Badge`}
                        />
                    </div>
                </div>

                {/* Warnings Section */}
                <div className="space-y-2 py-3 border-t border-white/10">
                    <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4" />
                        What Will Reset
                    </h3>
                    
                    <div className="space-y-1.5 pl-1">
                        <PrestigeWarning text="Battle Pass tier resets to Tier 1" />
                        <PrestigeWarning text="Current season XP progress resets to 0" />
                        <PrestigeWarning text="You'll need to unlock all 50 tiers again" />
                    </div>
                </div>

                {/* Keep Section */}
                <div className="space-y-2 py-3 border-t border-white/10">
                    <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider flex items-center gap-2">
                        <HugeiconsIcon icon={Tick02Icon} className="h-4 w-4" />
                        What You Keep
                    </h3>
                    
                    <div className="space-y-1.5 pl-1 text-xs text-cyber-gray">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            <span>All unlocked cosmetics and items</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            <span>All Clash Shards currency</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            <span>All achievements and badges</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            <span>Match history and statistics</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t border-white/10">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isConfirming || isLoading}
                        className="flex-1 text-cyber-gray hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isConfirming || isLoading}
                        className={cn(
                            "flex-1 gap-2 font-orbitron font-bold",
                            "bg-gradient-to-r from-cyber-gold to-amber-500",
                            "hover:from-amber-500 hover:to-cyber-gold",
                            "text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]",
                            "transition-all duration-300"
                        )}
                    >
                        {isConfirming || isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <HugeiconsIcon icon={ChampionIcon} className="h-5 w-5" />
                                Confirm Prestige
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default PrestigeConfirmation;
