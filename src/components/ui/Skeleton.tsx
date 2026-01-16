"use client";

/**
 * Skeleton UI Components
 * Reusable loading skeleton primitives with pulse animation
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

/**
 * Base skeleton block with pulse animation
 */
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-white/5",
                className
            )}
        />
    );
}

/**
 * Skeleton for quest cards - matches QuestCard layout
 */
export function QuestCardSkeleton() {
    return (
        <div className="relative p-5 rounded-xl border border-white/10 bg-card/20">
            {/* Difficulty Badge Skeleton */}
            <div className="absolute -top-2.5 left-4">
                <Skeleton className="h-5 w-14 rounded-full" />
            </div>

            <div className="mt-3 space-y-4">
                {/* Title & Description */}
                <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>

                {/* Rewards & Button */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-14" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton for battle pass tier cards - matches TierCard layout
 */
export function TierCardSkeleton() {
    return (
        <div className="relative p-4 rounded-xl border border-white/10 bg-card/20">
            {/* Tier number */}
            <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-4 rounded" />
            </div>

            {/* Rewards */}
            <div className="space-y-2">
                <Skeleton className="h-6 w-full rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
            </div>
        </div>
    );
}

/**
 * Skeleton for statistics cards
 */
export function StatCardSkeleton() {
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/20 border border-white/5">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex flex-col gap-1">
                <Skeleton className="h-2 w-12" />
                <Skeleton className="h-4 w-10" />
            </div>
        </div>
    );
}

export default Skeleton;
