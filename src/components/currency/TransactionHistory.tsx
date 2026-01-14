"use client";

/**
 * Transaction History Component
 * Paginated list of currency transactions with source labels
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, getCurrencySourceName } from "@/lib/progression/currency-utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowUp02Icon,
    ArrowDown02Icon,
    Clock01Icon,
} from "@hugeicons/core-free-icons";
import type { CurrencyTransaction } from "@/types/cosmetic";

interface TransactionHistoryProps {
    transactions: CurrencyTransaction[];
    isLoading?: boolean;
    className?: string;
}

/**
 * Format time relative to now
 */
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

/**
 * Single transaction row
 */
function TransactionRow({ transaction }: { transaction: CurrencyTransaction }) {
    const isEarn = transaction.type === "earn";
    const timestamp = transaction.timestamp instanceof Date
        ? transaction.timestamp
        : new Date(transaction.timestamp);

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "p-2 rounded-lg",
                        isEarn
                            ? "bg-emerald-500/10 border border-emerald-500/20"
                            : "bg-red-500/10 border border-red-500/20"
                    )}
                >
                    <HugeiconsIcon
                        icon={isEarn ? ArrowUp02Icon : ArrowDown02Icon}
                        className={cn(
                            "h-4 w-4",
                            isEarn ? "text-emerald-400" : "text-red-400"
                        )}
                    />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">
                        {getCurrencySourceName(transaction.source)}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <HugeiconsIcon icon={Clock01Icon} className="h-3 w-3" />
                        <span>{formatRelativeTime(timestamp)}</span>
                    </div>
                </div>
            </div>

            <div className="text-right">
                <p
                    className={cn(
                        "text-sm font-bold font-orbitron",
                        isEarn ? "text-emerald-400" : "text-red-400"
                    )}
                >
                    {isEarn ? "+" : "-"}{formatCurrency(transaction.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                    Balance: {formatCurrency(transaction.balanceAfter)}
                </p>
            </div>
        </div>
    );
}

export function TransactionHistory({
    transactions,
    isLoading = false,
    className,
}: TransactionHistoryProps) {
    if (isLoading) {
        return (
            <div className={cn("space-y-3", className)}>
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-16 rounded-lg bg-card/30 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div
                className={cn(
                    "p-8 rounded-xl bg-card/10 border border-white/5 text-center",
                    className
                )}
            >
                <p className="text-muted-foreground text-sm">
                    No transactions yet. Play matches and complete quests to earn Clash Shards!
                </p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-2", className)}>
            {transactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
            ))}
        </div>
    );
}

export default TransactionHistory;
