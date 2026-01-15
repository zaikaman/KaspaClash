"use client";

/**
 * Achievement Grid Component
 * Displays achievements organized by category with filtering support
 * Task: T107 [P] [US8]
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { AchievementCard } from "./AchievementCard";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    SwordIcon,
    ChartLineData01Icon,
    UserGroupIcon,
    ShoppingBag01Icon,
    StarIcon,
    FilterIcon,
    Tick02Icon,
    CancelCircleIcon,
} from "@hugeicons/core-free-icons";
import type { PlayerAchievement, AchievementCategory } from "@/types/achievement";

interface AchievementGridProps {
    achievements: PlayerAchievement[];
    selectedCategory: AchievementCategory | null;
    showUnlockedOnly: boolean;
    onCategoryChange: (category: AchievementCategory | null) => void;
    onShowUnlockedOnlyChange: (showUnlockedOnly: boolean) => void;
    onClaimAchievement?: (achievementId: string) => Promise<void>;
    isLoading?: boolean;
    className?: string;
}

/**
 * Category configuration with icons and colors
 */
const CATEGORY_CONFIG: Record<
    AchievementCategory,
    { icon: any; label: string; color: string; bgColor: string; borderColor: string }
> = {
    combat: {
        icon: SwordIcon,
        label: "Combat",
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
    },
    progression: {
        icon: ChartLineData01Icon,
        label: "Progression",
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
    },
    social: {
        icon: UserGroupIcon,
        label: "Social",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
    },
    collection: {
        icon: ShoppingBag01Icon,
        label: "Collection",
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
    },
    mastery: {
        icon: StarIcon,
        label: "Mastery",
        color: "text-kaspa",
        bgColor: "bg-kaspa/10",
        borderColor: "border-kaspa/30",
    },
};

const CATEGORIES: AchievementCategory[] = ["combat", "progression", "social", "collection", "mastery"];

/**
 * Category Tab Button
 */
function CategoryTab({
    category,
    isSelected,
    count,
    unlockedCount,
    onClick,
}: {
    category: AchievementCategory | null;
    isSelected: boolean;
    count: number;
    unlockedCount: number;
    onClick: () => void;
}) {
    const config = category ? CATEGORY_CONFIG[category] : null;
    const Icon = config?.icon || FilterIcon;
    const label = config?.label || "All";

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "border whitespace-nowrap",
                isSelected
                    ? cn(
                        config?.bgColor || "bg-kaspa/10",
                        config?.borderColor || "border-kaspa/30",
                        config?.color || "text-kaspa"
                    )
                    : "bg-card/30 border-white/5 text-muted-foreground hover:bg-card/50 hover:text-foreground"
            )}
        >
            <HugeiconsIcon icon={Icon} className="h-4 w-4" />
            <span>{label}</span>
            <span
                className={cn(
                    "px-1.5 py-0.5 rounded text-xs font-bold",
                    isSelected ? "bg-white/10" : "bg-card/50"
                )}
            >
                {unlockedCount}/{count}
            </span>
        </button>
    );
}

/**
 * Empty State Component
 */
function EmptyState({ category, showUnlockedOnly }: { category: AchievementCategory | null; showUnlockedOnly: boolean }) {
    const config = category ? CATEGORY_CONFIG[category] : null;

    return (
        <div className="p-12 text-center">
            <div className={cn(
                "p-4 rounded-full inline-block mb-4",
                config?.bgColor || "bg-card/30"
            )}>
                <HugeiconsIcon
                    icon={showUnlockedOnly ? CancelCircleIcon : (config?.icon || StarIcon)}
                    className={cn("h-12 w-12", config?.color || "text-muted-foreground")}
                />
            </div>
            <h3 className="text-lg font-bold font-orbitron text-foreground mb-2">
                {showUnlockedOnly ? "No Unlocked Achievements" : "No Achievements Found"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {showUnlockedOnly
                    ? `You haven't unlocked any ${category || ""} achievements yet. Keep playing to earn them!`
                    : "No achievements in this category."}
            </p>
        </div>
    );
}

/**
 * Loading Skeleton
 */
function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="p-5 rounded-xl border border-white/5 bg-card/20 animate-pulse"
                >
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg bg-white/5" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/5 rounded w-3/4" />
                            <div className="h-3 bg-white/5 rounded w-full" />
                            <div className="h-2 bg-white/5 rounded w-full mt-4" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function AchievementGrid({
    achievements,
    selectedCategory,
    showUnlockedOnly,
    onCategoryChange,
    onShowUnlockedOnlyChange,
    onClaimAchievement,
    isLoading = false,
    className,
}: AchievementGridProps) {
    // Filter achievements based on category and unlocked status
    const filteredAchievements = React.useMemo(() => {
        return achievements.filter((achievement) => {
            if (selectedCategory && achievement.achievement.category !== selectedCategory) {
                return false;
            }
            if (showUnlockedOnly && !achievement.isUnlocked) {
                return false;
            }
            return true;
        });
    }, [achievements, selectedCategory, showUnlockedOnly]);

    // Sort achievements: unlocked first, then by progress percentage
    const sortedAchievements = React.useMemo(() => {
        return [...filteredAchievements].sort((a, b) => {
            // Unlocked achievements first
            if (a.isUnlocked !== b.isUnlocked) {
                return a.isUnlocked ? -1 : 1;
            }
            // Then by progress percentage (closest to completion first)
            return b.progressPercentage - a.progressPercentage;
        });
    }, [filteredAchievements]);

    // Calculate counts per category
    const categoryCounts = React.useMemo(() => {
        const counts: Record<string, { total: number; unlocked: number }> = {
            all: { total: 0, unlocked: 0 },
        };
        CATEGORIES.forEach((cat) => {
            counts[cat] = { total: 0, unlocked: 0 };
        });

        achievements.forEach((achievement) => {
            const cat = achievement.achievement.category;
            counts.all.total++;
            counts[cat].total++;
            if (achievement.isUnlocked) {
                counts.all.unlocked++;
                counts[cat].unlocked++;
            }
        });

        return counts;
    }, [achievements]);

    return (
        <div className={cn("space-y-6", className)}>
            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                <CategoryTab
                    category={null}
                    isSelected={selectedCategory === null}
                    count={categoryCounts.all.total}
                    unlockedCount={categoryCounts.all.unlocked}
                    onClick={() => onCategoryChange(null)}
                />
                {CATEGORIES.map((category) => (
                    <CategoryTab
                        key={category}
                        category={category}
                        isSelected={selectedCategory === category}
                        count={categoryCounts[category].total}
                        unlockedCount={categoryCounts[category].unlocked}
                        onClick={() => onCategoryChange(category)}
                    />
                ))}
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {sortedAchievements.length} of {filteredAchievements.length} achievements
                </p>
                <button
                    onClick={() => onShowUnlockedOnlyChange(!showUnlockedOnly)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        "border",
                        showUnlockedOnly
                            ? "bg-kaspa/10 border-kaspa/30 text-kaspa"
                            : "bg-card/30 border-white/5 text-muted-foreground hover:bg-card/50"
                    )}
                >
                    <HugeiconsIcon icon={showUnlockedOnly ? Tick02Icon : CancelCircleIcon} className="h-4 w-4" />
                    <span>{showUnlockedOnly ? "Unlocked Only" : "Show All"}</span>
                </button>
            </div>

            {/* Achievement Grid */}
            {isLoading ? (
                <LoadingSkeleton />
            ) : sortedAchievements.length === 0 ? (
                <EmptyState category={selectedCategory} showUnlockedOnly={showUnlockedOnly} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedAchievements.map((achievement) => (
                        <AchievementCard
                            key={achievement.achievementId}
                            achievement={achievement}
                            onClaim={onClaimAchievement}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default AchievementGrid;
