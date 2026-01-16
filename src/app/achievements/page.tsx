"use client";

/**
 * Achievements Page
 * Main UI for viewing achievement collection and progress
 * Task: T111 [US8]
 */

import React from "react";
import GameLayout from "@/components/layout/GameLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import { AchievementGrid } from "@/components/achievements/AchievementGrid";
import { UnlockNotification } from "@/components/achievements/UnlockNotification";
import { useAchievementStore } from "@/stores/achievement-store";
import { useWalletStore, selectIsConnected, selectPersistedAddress } from "@/stores/wallet-store";
import { useShopStore } from "@/stores/shop-store";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Alert02Icon,
    Loading03Icon,
    RefreshIcon,
    Award02Icon,
    Fire02Icon,
    Bitcoin01Icon,
    Award01Icon,
} from "@hugeicons/core-free-icons";
import type { PlayerAchievement, AchievementCategory, Achievement } from "@/types/achievement";

/**
 * Statistics Card Component
 */
function StatCard({
    icon,
    label,
    value,
    subValue,
    color,
}: {
    icon: any;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
}) {
    return (
        <div className="p-4 rounded-xl bg-card/20 border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${color}`}>
                    <HugeiconsIcon icon={icon} className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {label}
                    </p>
                    <p className="text-xl font-bold font-orbitron text-foreground">
                        {value}
                    </p>
                    {subValue && (
                        <p className="text-xs text-muted-foreground">{subValue}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AchievementsPage() {
    const isConnected = useWalletStore(selectIsConnected);
    const walletAddress = useWalletStore(selectPersistedAddress);
    const { updateCurrencyBalance } = useShopStore();

    const {
        achievements,
        playerAchievements,
        summary,
        selectedCategory,
        showUnlockedOnly,
        isLoading,
        error,
        setAchievements,
        setPlayerAchievements,
        setSummary,
        setSelectedCategory,
        setShowUnlockedOnly,
        setLoading,
        setError,
    } = useAchievementStore();

    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [pendingUnlock, setPendingUnlock] = React.useState<{
        achievement: Achievement;
        xpAwarded: number;
        currencyAwarded: number;
        badgeAwarded?: string;
    } | null>(null);

    // Fetch achievements on mount and when wallet connects
    const fetchAchievements = React.useCallback(async () => {
        if (!walletAddress) return;

        setLoading(true);
        setError(null);

        try {
            const [listResponse, progressResponse] = await Promise.all([
                fetch(`/api/achievements/list?playerId=${encodeURIComponent(walletAddress)}`),
                fetch(`/api/achievements/progress?playerId=${encodeURIComponent(walletAddress)}`),
            ]);

            const listData = await listResponse.json();
            const progressData = await progressResponse.json();

            if (!listResponse.ok) {
                throw new Error(listData.error || "Failed to fetch achievements");
            }

            if (listData.achievements) {
                setPlayerAchievements(listData.achievements);

                // Extract achievement definitions from player achievements
                const defs = listData.achievements.map((pa: PlayerAchievement) => pa.achievement);
                setAchievements(defs);
            }

            if (progressResponse.ok && progressData.summary) {
                setSummary(progressData.summary);
            }
        } catch (err) {
            console.error("Error fetching achievements:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch achievements");
        } finally {
            setLoading(false);
        }
    }, [walletAddress, setAchievements, setPlayerAchievements, setSummary, setLoading, setError]);

    React.useEffect(() => {
        if (isConnected && walletAddress) {
            fetchAchievements();
        }
    }, [isConnected, walletAddress, fetchAchievements]);

    // Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchAchievements();
        } finally {
            setIsRefreshing(false);
        }
    };

    // Handle claiming an achievement
    const handleClaimAchievement = async (achievementId: string) => {
        if (!walletAddress) return;

        // Clear any previous error before attempting claim
        setError(null);

        try {
            console.log(`[AchievementsPage] Attempting to claim achievement: ${achievementId} for player: ${walletAddress}`);
            
            const response = await fetch('/api/achievements/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: walletAddress, achievementId }),
            });

            const data = await response.json();
            
            console.log(`[AchievementsPage] Unlock response:`, { status: response.status, data });

            if (!response.ok) {
                // Handle API error response structure { error: { code, message, details } }
                let errorMessage = 'Failed to claim achievement';
                if (typeof data.error === 'object' && data.error !== null) {
                    // Include error code and message for better debugging
                    const code = data.error.code || 'UNKNOWN';
                    const msg = data.error.message || 'Unknown error';
                    const details = data.error.details ? ` (${JSON.stringify(data.error.details)})` : '';
                    errorMessage = `[${code}] ${msg}${details}`;
                    console.error(`[AchievementsPage] Claim failed:`, data.error);
                } else if (data.error) {
                    errorMessage = String(data.error);
                }
                throw new Error(errorMessage);
            }

            // Show unlock notification
            const achievementDef = achievements.find((a) => a.id === achievementId);
            if (achievementDef) {
                setPendingUnlock({
                    achievement: achievementDef,
                    xpAwarded: data.xpAwarded,
                    currencyAwarded: data.currencyAwarded,
                    badgeAwarded: data.badgeAwarded,
                });
            }

            // Immediately update the currency balance in the header
            if (data.newBalance !== undefined) {
                updateCurrencyBalance(data.newBalance);
            }

            // Refresh achievements to update the UI
            await fetchAchievements();
        } catch (err) {
            console.error('Error claiming achievement:', err);
            setError(err instanceof Error ? err.message : 'Failed to claim achievement');
        }
    };

    // Calculate statistics
    const stats = React.useMemo(() => {
        const total = playerAchievements.length;
        const unlocked = playerAchievements.filter((a) => a.isUnlocked).length;
        const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

        const totalXP = playerAchievements
            .filter((a) => a.isUnlocked)
            .reduce((sum, a) => sum + a.achievement.xpReward, 0);

        const totalCurrency = playerAchievements
            .filter((a) => a.isUnlocked)
            .reduce((sum, a) => sum + a.achievement.currencyReward, 0);

        return { total, unlocked, percentage, totalXP, totalCurrency };
    }, [playerAchievements]);

    return (
        <GameLayout>
            <div className="relative w-full min-h-full pt-6 sm:pt-10 pb-20">
                {/* Background Elements */}
                <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[800px] h-[500px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[400px] bg-kaspa/5 rounded-full blur-[150px] pointer-events-none" />

                <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 relative z-10 w-full max-w-6xl">
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
                            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-kaspa/20 border border-amber-500/30">
                                <HugeiconsIcon
                                    icon={Award02Icon}
                                    className="h-8 w-8 text-amber-400"
                                />
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-[60px] font-bold leading-tight mb-4 font-orbitron text-white">
                            <span className="text-kaspa">ACHIEVEMENTS</span>
                        </h1>
                        <p className="text-cyber-gray text-base sm:text-lg font-montserrat max-w-2xl mx-auto">
                            Track your accomplishments and earn rewards. Complete achievements to unlock XP, Clash Shards, and exclusive badges.
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

                    <DecorativeLine className="mb-24 sm:mb-32" variant="left-red-right-gold" />

                    {/* Unlock Notification */}
                    {pendingUnlock && (
                        <UnlockNotification
                            achievement={pendingUnlock.achievement}
                            xpAwarded={pendingUnlock.xpAwarded}
                            currencyAwarded={pendingUnlock.currencyAwarded}
                            badgeAwarded={pendingUnlock.badgeAwarded}
                            onDismiss={() => setPendingUnlock(null)}
                        />
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
                                    Connect your wallet to view your achievements
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/30 max-w-2xl mx-auto backdrop-blur-md flex items-start gap-3">
                            <HugeiconsIcon
                                icon={Alert02Icon}
                                className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-400 mb-1">Failed to claim achievement</p>
                                <p className="text-xs text-red-400/80">{error}</p>
                            </div>
                            <button 
                                onClick={() => setError(null)} 
                                className="text-red-400/60 hover:text-red-400 transition-colors"
                                aria-label="Dismiss error"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Main Content */}
                    {isConnected && (
                        <div className="space-y-8">
                            {/* Statistics */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    icon={Award02Icon}
                                    label="Unlocked"
                                    value={`${stats.unlocked}/${stats.total}`}
                                    subValue={`${stats.percentage}% Complete`}
                                    color="bg-amber-500/20 text-amber-400"
                                />
                                <StatCard
                                    icon={Fire02Icon}
                                    label="XP Earned"
                                    value={stats.totalXP.toLocaleString()}
                                    color="bg-purple-500/20 text-purple-400"
                                />
                                <StatCard
                                    icon={Bitcoin01Icon}
                                    label="Shards Earned"
                                    value={stats.totalCurrency.toLocaleString()}
                                    color="bg-cyber-gold/20 text-cyber-gold"
                                />
                                <StatCard
                                    icon={Award01Icon}
                                    label="Categories"
                                    value="5"
                                    subValue="Combat, Progression, Social..."
                                    color="bg-kaspa/20 text-kaspa"
                                />
                            </div>

                            {/* Achievement Grid */}
                            <div className="p-6 sm:p-8 rounded-xl bg-card/10 border border-white/5 backdrop-blur-sm shadow-xl">
                                <AchievementGrid
                                    achievements={playerAchievements}
                                    selectedCategory={selectedCategory as AchievementCategory | null}
                                    showUnlockedOnly={showUnlockedOnly}
                                    onCategoryChange={(cat) => setSelectedCategory(cat)}
                                    onShowUnlockedOnlyChange={setShowUnlockedOnly}
                                    onClaimAchievement={handleClaimAchievement}
                                    isLoading={isLoading}
                                />
                            </div>
                        </div>
                    )}

                    {/* Not Connected State */}
                    {!isConnected && (
                        <div className="p-12 rounded-xl bg-card/10 border border-white/5 backdrop-blur-sm text-center">
                            <div className="p-4 rounded-full bg-card/30 inline-block mb-4">
                                <HugeiconsIcon
                                    icon={Award02Icon}
                                    className="h-12 w-12 text-muted-foreground"
                                />
                            </div>
                            <h2 className="text-xl font-bold font-orbitron text-foreground mb-2">
                                Connect Wallet
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Connect your Kaspa wallet to view your achievement progress and earn rewards!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </GameLayout>
    );
}
