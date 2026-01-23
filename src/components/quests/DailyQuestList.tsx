"use client";

/**
 * Daily Quest List Component
 * Container displaying all 3 daily quests with reset timer and statistics
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { QuestCard } from "./QuestCard";
import { useQuestStore } from "@/stores/quest-store";
import { getTimeUntilReset } from "@/lib/quests/quest-generator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Calendar01Icon,
    FlashIcon,
    FireIcon,
    SparklesIcon,
    Tick02Icon,
} from "@hugeicons/core-free-icons";
import { QuestCardSkeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import type { DailyQuest } from "@/types/quest";

interface DailyQuestListProps {
    quests: DailyQuest[];
    onClaimQuest: (questId: string) => Promise<void>;
    isLoading?: boolean;
    statistics?: {
        totalCompleted: number;
        totalClaimed: number;
        currentStreak: number;
    };
    className?: string;
}

/**
 * Reset Timer Component
 */
function ResetTimer() {
    const [timeLeft, setTimeLeft] = React.useState(getTimeUntilReset());

    React.useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(getTimeUntilReset());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (h: number, m: number, s: number) => {
        return `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/30 border border-white/5">
            <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-cyber-gold" />
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Resets In
                </span>
                <span className="text-sm font-bold font-orbitron text-foreground">
                    {formatTime(timeLeft.hours, timeLeft.minutes, timeLeft.seconds)}
                </span>
            </div>
        </div>
    );
}

/**
 * Statistics Card
 */
function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: string;
}) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/20 border border-white/5">
            <div className={cn("p-1.5 rounded-md", color)}>{icon}</div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
                <span className="text-sm font-bold font-orbitron text-foreground">
                    {value}
                </span>
            </div>
        </div>
    );
}

export function DailyQuestList({
    quests,
    onClaimQuest,
    isLoading = false,
    statistics,
    className,
}: DailyQuestListProps) {
    const [claimingQuestId, setClaimingQuestId] = React.useState<string | null>(null);

    const handleClaim = async (questId: string) => {
        setClaimingQuestId(questId);
        try {
            await onClaimQuest(questId);
        } finally {
            setClaimingQuestId(null);
        }
    };

    // Calculate summary
    const completedCount = quests.filter((q) => q.isCompleted).length;
    const claimedCount = quests.filter((q) => q.isClaimed).length;
    const allCompleted = completedCount === quests.length;
    const allClaimed = claimedCount === quests.length;

    if (isLoading) {
        return (
            <div className={cn("space-y-6", className)}>
                {/* Header Skeleton */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <StatCardSkeleton />
                    <div className="flex items-center gap-3">
                        <StatCardSkeleton />
                    </div>
                </div>

                {/* Quest Card Skeletons */}
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <QuestCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (quests.length === 0) {
        return (
            <div className={cn("flex flex-col items-center justify-center py-12", className)}>
                <div className="p-4 rounded-full bg-card/30 mb-4">
                    <HugeiconsIcon icon={Calendar01Icon} className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                    No quests available. Check back soon!
                </p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header with Timer and Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Timer */}
                <ResetTimer />

                {/* Quick Stats */}
                <div className="flex items-center gap-3">
                    <StatCard
                        icon={<HugeiconsIcon icon={FlashIcon} className="h-4 w-4 text-purple-400" />}
                        label="Completed"
                        value={`${completedCount}/${quests.length}`}
                        color="bg-purple-500/20"
                    />
                    {statistics?.currentStreak !== undefined && statistics.currentStreak > 0 && (
                        <StatCard
                            icon={<HugeiconsIcon icon={FireIcon} className="h-4 w-4 text-orange-400" />}
                            label="Streak"
                            value={`${statistics.currentStreak} days`}
                            color="bg-orange-500/20"
                        />
                    )}
                </div>
            </div>

            {/* All Completed Banner */}
            {allCompleted && !allClaimed && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-kaspa/20 to-emerald-500/20 border border-kaspa/30 text-center flex items-center justify-center gap-2">
                    <HugeiconsIcon icon={SparklesIcon} className="w-5 h-5 text-kaspa" />
                    <p className="text-sm font-semibold text-kaspa">
                        All quests completed! Claim your rewards!
                    </p>
                </div>
            )}

            {allClaimed && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-kaspa/10 to-emerald-500/10 border border-kaspa/20 text-center flex items-center justify-center gap-2">
                    <HugeiconsIcon icon={Tick02Icon} className="w-5 h-5 text-kaspa" />
                    <p className="text-sm font-medium text-muted-foreground">
                        All rewards claimed for today. Come back tomorrow!
                    </p>
                </div>
            )}

            {/* Quest Cards */}
            <div className="grid gap-4">
                {quests.map((quest) => (
                    <QuestCard
                        key={quest.id}
                        quest={quest}
                        onClaim={handleClaim}
                        isClaimPending={claimingQuestId === quest.id}
                    />
                ))}
            </div>

            {/* Lifetime Statistics */}
            {statistics && (
                <div className="mt-8 p-4 rounded-xl bg-card/20 border border-white/5">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Quest Statistics
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold font-orbitron text-foreground">
                                {statistics.totalCompleted}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Completed</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold font-orbitron text-foreground">
                                {statistics.totalClaimed}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Claimed</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold font-orbitron text-kaspa">
                                {statistics.currentStreak}
                            </p>
                            <p className="text-xs text-muted-foreground">Day Streak</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DailyQuestList;
