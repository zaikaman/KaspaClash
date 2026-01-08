"use client";

/**
 * Quest Claim Button Component
 * Animated button for claiming quest rewards
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Tick02Icon,
    Loading03Icon,
    Coins01Icon,
} from "@hugeicons/core-free-icons";

interface QuestClaimButtonProps {
    questId: string;
    onClaim: (questId: string) => Promise<void>;
    disabled?: boolean;
    isPending?: boolean;
    className?: string;
}

export function QuestClaimButton({
    questId,
    onClaim,
    disabled = false,
    isPending = false,
    className,
}: QuestClaimButtonProps) {
    const [isClaiming, setIsClaiming] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);

    const handleClick = async () => {
        if (disabled || isClaiming || isPending) return;

        setIsClaiming(true);
        try {
            await onClaim(questId);
            setShowSuccess(true);

            // Reset success state after animation
            setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
        } catch (error) {
            console.error("Failed to claim quest:", error);
        } finally {
            setIsClaiming(false);
        }
    };

    const isLoading = isClaiming || isPending;

    return (
        <Button
            onClick={handleClick}
            disabled={disabled || isLoading}
            size="sm"
            className={cn(
                "relative overflow-hidden transition-all duration-300",
                disabled
                    ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                    : showSuccess
                        ? "bg-kaspa text-cyber-black hover:bg-kaspa"
                        : "bg-gradient-to-r from-kaspa to-emerald-500 text-cyber-black hover:from-kaspa/90 hover:to-emerald-400 shadow-lg shadow-kaspa/20",
                className
            )}
        >
            {/* Loading State */}
            {isLoading && (
                <span className="flex items-center gap-1.5">
                    <HugeiconsIcon
                        icon={Loading03Icon}
                        className="h-4 w-4 animate-spin"
                    />
                    <span className="font-semibold">Claiming...</span>
                </span>
            )}

            {/* Success State */}
            {showSuccess && !isLoading && (
                <span className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={Tick02Icon} className="h-4 w-4" />
                    <span className="font-semibold">Claimed!</span>
                </span>
            )}

            {/* Default State */}
            {!isLoading && !showSuccess && (
                <span className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={Coins01Icon} className="h-4 w-4" />
                    <span className="font-semibold">
                        {disabled ? "Complete First" : "Claim"}
                    </span>
                </span>
            )}

            {/* Shimmer Effect on Claimable */}
            {!disabled && !isLoading && !showSuccess && (
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}
        </Button>
    );
}

export default QuestClaimButton;
