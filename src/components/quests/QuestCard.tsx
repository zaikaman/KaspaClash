"use client";

/**
 * Quest Card Component
 * Displays individual quest with progress bar, rewards, and claim functionality
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { QuestClaimButton } from "./QuestClaimButton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Coins01Icon,
    Tick02Icon,
    Target01Icon,
    FlashIcon,
} from "@hugeicons/core-free-icons";
import type { DailyQuest, QuestDifficulty } from "@/types/quest";

interface QuestCardProps {
    quest: DailyQuest;
    onClaim: (questId: string) => Promise<void>;
    isClaimPending?: boolean;
    className?: string;
}

/**
 * Get difficulty styling
 */
function getDifficultyStyle(difficulty: QuestDifficulty): {
    badge: string;
    border: string;
    bg: string;
    glow: string;
    label: string;
} {
    switch (difficulty) {
        case "easy":
            return {
                badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                border: "border-emerald-500/20",
                bg: "from-emerald-500/5 to-transparent",
                glow: "shadow-emerald-500/10",
                label: "Easy",
            };
        case "medium":
            return {
                badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                border: "border-amber-500/20",
                bg: "from-amber-500/5 to-transparent",
                glow: "shadow-amber-500/10",
                label: "Medium",
            };
        case "hard":
            return {
                badge: "bg-red-500/20 text-red-400 border-red-500/30",
                border: "border-red-500/20",
                bg: "from-red-500/5 to-transparent",
                glow: "shadow-red-500/10",
                label: "Hard",
            };
        default:
            return {
                badge: "bg-gray-500/20 text-gray-400 border-gray-500/30",
                border: "border-gray-500/20",
                bg: "from-gray-500/5 to-transparent",
                glow: "",
                label: "Unknown",
            };
    }
}

/**
 * Progress Bar Component
 */
function QuestProgressBar({
    current,
    target,
    isCompleted,
    difficulty,
}: {
    current: number;
    target: number;
    isCompleted: boolean;
    difficulty: QuestDifficulty;
}) {
    const percentage = Math.min(100, (current / target) * 100);

    const progressColor = isCompleted
        ? "bg-kaspa"
        : difficulty === "easy"
            ? "bg-emerald-500"
            : difficulty === "medium"
                ? "bg-amber-500"
                : "bg-red-500";

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-muted-foreground font-medium">
                    Progress
                </span>
                <span className="text-xs font-bold text-foreground font-orbitron">
                    {current} / {target}
                </span>
            </div>
            <div className="relative h-2 rounded-full bg-background/50 overflow-hidden border border-white/5">
                <div
                    className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
                        progressColor
                    )}
                    style={{ width: `${percentage}%` }}
                />
                {isCompleted && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
            </div>
        </div>
    );
}

export function QuestCard({
    quest,
    onClaim,
    isClaimPending = false,
    className,
}: QuestCardProps) {
    const style = getDifficultyStyle(quest.template.difficulty);
    const isClaimable = quest.isCompleted && !quest.isClaimed;

    return (
        <div
            className={cn(
                "relative p-5 rounded-xl border transition-all duration-300",
                "bg-gradient-to-br backdrop-blur-sm",
                style.bg,
                style.border,
                isClaimable && "ring-1 ring-kaspa/50 shadow-lg shadow-kaspa/10",
                quest.isClaimed && "opacity-60",
                className
            )}
        >
            {/* Difficulty Badge */}
            <div className="absolute -top-2.5 left-4">
                <span
                    className={cn(
                        "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border",
                        style.badge
                    )}
                >
                    {style.label}
                </span>
            </div>

            {/* Claimed/Completed Indicator */}
            {quest.isClaimed && (
                <div className="absolute -top-2.5 right-4">
                    <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-kaspa/20 text-kaspa border-kaspa/30 flex items-center gap-1">
                        <HugeiconsIcon icon={Tick02Icon} className="h-3 w-3" />
                        Claimed
                    </span>
                </div>
            )}

            <div className="mt-3 space-y-4">
                {/* Quest Title & Description */}
                <div>
                    <h3 className="text-lg font-bold font-orbitron text-foreground mb-1">
                        {quest.template.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {quest.template.description}
                    </p>
                </div>

                {/* Progress Bar */}
                <QuestProgressBar
                    current={quest.currentProgress}
                    target={quest.targetProgress}
                    isCompleted={quest.isCompleted}
                    difficulty={quest.template.difficulty}
                />

                {/* Rewards & Claim */}
                <div className="flex items-center justify-between pt-2">
                    {/* Rewards Display */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <HugeiconsIcon
                                icon={FlashIcon}
                                className="h-4 w-4 text-purple-400"
                            />
                            <span className="text-sm font-bold text-purple-400 font-orbitron">
                                +{quest.template.xpReward} XP
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <HugeiconsIcon
                                icon={Coins01Icon}
                                className="h-4 w-4 text-cyber-gold"
                            />
                            <span className="text-sm font-bold text-cyber-gold font-orbitron">
                                +{quest.template.currencyReward}
                            </span>
                        </div>
                    </div>

                    {/* Claim Button */}
                    {!quest.isClaimed && (
                        <QuestClaimButton
                            questId={quest.id}
                            onClaim={onClaim}
                            disabled={!isClaimable}
                            isPending={isClaimPending}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuestCard;
