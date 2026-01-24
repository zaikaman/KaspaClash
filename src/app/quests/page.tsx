"use client";

/**
 * Daily Quests Page
 * Main UI for viewing and tracking daily quest progression
 */

import React from "react";
import GameLayout from "@/components/layout/GameLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import { DailyQuestList } from "@/components/quests/DailyQuestList";
import { useQuestStore } from "@/stores/quest-store";
import { useWalletStore, selectIsConnected, selectPersistedAddress } from "@/stores/wallet-store";
import { useShopStore } from "@/stores/shop-store";
import { useCurrencyRealtime, fetchCurrentCurrency } from "@/hooks/useCurrencyRealtime";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Alert02Icon,
    Loading03Icon,
    RefreshIcon,
    Target01Icon,
    Tick02Icon,
    SparklesIcon,
} from "@hugeicons/core-free-icons";
import { ClashShardsIcon } from "@/components/currency/ClashShardsIcon";
import type { DailyQuest } from "@/types/quest";

export default function QuestsPage() {
    const isConnected = useWalletStore(selectIsConnected);
    const walletAddress = useWalletStore(selectPersistedAddress);

    const {
        dailyQuests,
        statistics,
        isLoading,
        error,
        setDailyQuests,
        setStatistics,
        setLoading,
        setError,
        markQuestClaimed,
    } = useQuestStore();

    // Use shop store for currency updates (to sync with header)
    const { setCurrency: setShopCurrency } = useShopStore();

    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [claimSuccess, setClaimSuccess] = React.useState<{ xp: number; shards: number } | null>(null);

    // Real-time currency subscription
    useCurrencyRealtime({
        playerId: walletAddress || '',
        enabled: isConnected && !!walletAddress,
    });

    // Fetch quests on mount and when wallet connects
    const fetchQuests = React.useCallback(async () => {
        if (!walletAddress) return;

        setLoading(true);
        setError(null);

        try {
            // Fetch quests and currency in parallel
            const [questsResponse, currencyData] = await Promise.all([
                fetch(`/api/quests/daily?playerId=${encodeURIComponent(walletAddress)}`),
                fetchCurrentCurrency(walletAddress)
            ]);

            const data = await questsResponse.json();

            if (!questsResponse.ok) {
                throw new Error(data.error || "Failed to fetch quests");
            }

            setDailyQuests(data.quests);
            setStatistics({
                playerId: walletAddress,
                totalQuestsCompleted: data.statistics.totalCompleted,
                totalQuestsClaimed: data.statistics.totalClaimed,
                totalXPEarned: 0, // Not returned from API
                totalCurrencyEarned: 0, // Not returned from API
                currentStreak: data.statistics.currentStreak,
                longestStreak: 0, // Not returned from API
            });

            // Update currency if fetched
            if (currencyData) {
                setShopCurrency({
                    playerId: walletAddress,
                    clashShards: currencyData.clash_shards || 0,
                    totalEarned: currencyData.total_earned || 0,
                    totalSpent: currencyData.total_spent || 0,
                    lastUpdated: new Date(),
                });
            }
        } catch (err) {
            console.error("Error fetching quests:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch quests");
        } finally {
            setLoading(false);
        }
    }, [walletAddress, setDailyQuests, setStatistics, setLoading, setError, setShopCurrency]);

    React.useEffect(() => {
        if (isConnected && walletAddress) {
            fetchQuests();
        }
    }, [isConnected, walletAddress, fetchQuests]);

    // Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchQuests();
        } finally {
            setIsRefreshing(false);
        }
    };

    // Handle quest claim
    const handleClaimQuest = async (questId: string) => {
        if (!walletAddress) return;

        try {
            const response = await fetch("/api/quests/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    playerId: walletAddress,
                    questId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to claim quest");
            }

            // Update local state
            markQuestClaimed(questId);

            // Show success toast with rewards
            if (data.rewards) {
                setClaimSuccess({
                    xp: data.rewards.xp || 0,
                    shards: data.rewards.currency || 0,
                });

                // Currency will update automatically via Realtime subscription!
                // No need to manually fetch or update

                console.log(`[QuestClaim] Claimed! XP: ${data.rewards.xp}, Shards: ${data.rewards.currency}, New Balance: ${data.newBalance}`);

                // Auto-hide after 5 seconds
                setTimeout(() => setClaimSuccess(null), 5000);
            }

            // Refresh quests to get updated statistics
            await fetchQuests();
        } catch (err) {
            console.error("Error claiming quest:", err);
            throw err;
        }
    };

    // Map store quests to display format
    const displayQuests: DailyQuest[] = dailyQuests.map((q) => ({
        ...q,
        assignedDate: typeof q.assignedDate === "string" ? new Date(q.assignedDate) : q.assignedDate,
        expiresAt: typeof q.expiresAt === "string" ? new Date(q.expiresAt) : q.expiresAt,
        claimedAt: q.claimedAt
            ? typeof q.claimedAt === "string"
                ? new Date(q.claimedAt)
                : q.claimedAt
            : undefined,
    }));

    return (
        <GameLayout>
            <div className="relative w-full min-h-full pt-6 sm:pt-10 pb-20">
                {/* Background Elements */}
                <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[800px] h-[500px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[400px] bg-kaspa/5 rounded-full blur-[150px] pointer-events-none" />

                <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 relative z-10 w-full max-w-4xl">
                    {/* Header */}
                    <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16 relative">
                        {/* Refresh Button - Desktop */}
                        {isConnected && (
                            <div className="absolute right-0 top-0 hidden sm:block">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing || isLoading}
                                    className="gap-2 text-cyber-gray hover:text-kaspa"
                                >
                                    <HugeiconsIcon
                                        icon={isRefreshing ? Loading03Icon : RefreshIcon}
                                        className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                                    />
                                    Refresh
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-kaspa/20 border border-purple-500/30">
                                <HugeiconsIcon
                                    icon={Target01Icon}
                                    className="h-8 w-8 text-purple-400"
                                />
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-[60px] font-bold leading-tight mb-4 font-orbitron text-white">
                            DAILY <span className="text-kaspa">QUESTS</span>
                        </h1>
                        <p className="text-cyber-gray text-base sm:text-lg font-montserrat max-w-2xl mx-auto">
                            Complete quests to earn XP and Clash Shards. New quests available every day at midnight UTC.
                        </p>

                        {/* Mobile Refresh Button */}
                        {isConnected && (
                            <div className="mt-4 sm:hidden flex justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing || isLoading}
                                    className="gap-2 text-cyber-gray hover:text-kaspa"
                                >
                                    <HugeiconsIcon
                                        icon={isRefreshing ? Loading03Icon : RefreshIcon}
                                        className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                                    />
                                    Refresh
                                </Button>
                            </div>
                        )}
                    </div>

                    <DecorativeLine className="mb-20 sm:mb-24" variant="left-red-right-gold" />

                    {/* Success Toast */}
                    {claimSuccess && (
                        <div className="fixed top-24 right-4 z-50 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="bg-card/90 backdrop-blur-md border border-kaspa/50 rounded-lg shadow-lg p-4 flex items-center gap-4 min-w-[300px]">
                                <div className="p-2 rounded-full bg-kaspa/20 border border-kaspa/30">
                                    <HugeiconsIcon icon={Tick02Icon} className="h-6 w-6 text-kaspa" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-kaspa font-orbitron mb-1">Quest Claimed!</h4>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="flex items-center gap-1 text-purple-400">
                                            <HugeiconsIcon icon={SparklesIcon} className="h-3 w-3" />
                                            <span>+{claimSuccess.xp} XP</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-cyber-gold">
                                            <ClashShardsIcon className="h-3 w-3" />
                                            <span>+{claimSuccess.shards} Shards</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Connection Warning */}
                    {!isConnected && (
                        <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-3 max-w-2xl mx-auto backdrop-blur-md">
                            <HugeiconsIcon
                                icon={Alert02Icon}
                                className="h-5 w-5 text-red-400 flex-shrink-0"
                            />
                            <div className="text-center">
                                <p className="text-sm font-medium text-red-400">
                                    Connect your wallet to view your daily quests
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/30 max-w-2xl mx-auto backdrop-blur-md">
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        </div>
                    )}

                    {/* Main Content */}
                    {isConnected && (
                        <div className="space-y-6">
                            {/* Quest List */}
                            <div className="p-6 sm:p-8 rounded-xl bg-card/10 border border-white/5 backdrop-blur-sm shadow-xl">
                                <DailyQuestList
                                    quests={displayQuests}
                                    onClaimQuest={handleClaimQuest}
                                    isLoading={isLoading}
                                    statistics={
                                        statistics
                                            ? {
                                                totalCompleted: statistics.totalQuestsCompleted,
                                                totalClaimed: statistics.totalQuestsClaimed,
                                                currentStreak: statistics.currentStreak,
                                            }
                                            : undefined
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {/* Not Connected State */}
                    {!isConnected && (
                        <div className="p-12 rounded-xl bg-card/10 border border-white/5 backdrop-blur-sm text-center">
                            <div className="p-4 rounded-full bg-card/30 inline-block mb-4">
                                <HugeiconsIcon
                                    icon={Target01Icon}
                                    className="h-12 w-12 text-muted-foreground"
                                />
                            </div>
                            <h2 className="text-xl font-bold font-orbitron text-foreground mb-2">
                                Connect Wallet
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Connect your Kaspa wallet to view and complete daily quests.
                                Earn XP and Clash Shards by playing matches!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </GameLayout>
    );
}
