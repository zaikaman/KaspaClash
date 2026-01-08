"use client";

/**
 * Battle Pass Page
 * Main UI for viewing and tracking battle pass progression
 */

import React from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import { XPProgressBar } from "@/components/progression/XPProgressBar";
import { BattlePassTiers } from "@/components/progression/BattlePassTiers";
import { TierUnlockModal } from "@/components/progression/TierUnlockModal";
import { useProgressionStore } from "@/stores/progression-store";
import { useWalletStore, selectIsConnected } from "@/stores/wallet-store";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/progression/currency-utils";
import { calculateTierProgress } from "@/lib/progression/xp-calculator";
import { getTierRewards, calculateSeasonTotalRewards as getTotalRewards } from "@/lib/progression/tier-rewards";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Coins01Icon,
    ChampionIcon,
    Globe02Icon,
    Alert02Icon,
    Loading03Icon,
} from "@hugeicons/core-free-icons";
import type { TierReward } from "@/types/progression";

/**
 * Season Stats Card Component
 */
function SeasonStatsCard({
    label,
    value,
    icon,
    color = "kaspa",
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color?: "kaspa" | "purple" | "amber" | "blue";
}) {
    const colorStyles = {
        kaspa: "from-kaspa/20 to-emerald-500/10 border-kaspa/30 text-kaspa",
        purple: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400",
        amber: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400",
        blue: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400",
    };

    return (
        <div className={`relative p-4 rounded-xl bg-gradient-to-br ${colorStyles[color]} border backdrop-blur-sm shadow-md`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        {label}
                    </p>
                    <p className="text-2xl font-bold font-orbitron">{value}</p>
                </div>
                <div className="p-2 rounded-lg bg-background/30 backdrop-blur-md">
                    {icon}
                </div>
            </div>
        </div>
    );
}

export default function BattlePassPage() {
    const isConnected = useWalletStore(selectIsConnected);
    const {
        currentSeason,
        progression,
        fetchCurrentSeason,
        fetchPlayerProgression,
        isLoading,
        error
    } = useProgressionStore();

    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [showUnlockModal, setShowUnlockModal] = React.useState(false);
    const [unlockedTiers, setUnlockedTiers] = React.useState<{ tier: number; rewards: TierReward[] }[]>([]);

    // Initial data fetch
    React.useEffect(() => {
        fetchCurrentSeason();
    }, [fetchCurrentSeason]);

    // Fetch player progression when connected
    React.useEffect(() => {
        if (isConnected) {
            fetchPlayerProgression();
        }
    }, [isConnected, fetchPlayerProgression]);

    // Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchPlayerProgression();
        } finally {
            setIsRefreshing(false);
        }
    };

    // Calculate display values
    // Note: API returns snake_case (current_tier, current_xp, total_xp) from Supabase
    const displayProgression = React.useMemo(() => {
        if (isConnected && progression) {
            // Handle both camelCase and snake_case for compatibility
            const prog = progression as any;
            return {
                currentTier: prog.currentTier ?? prog.current_tier ?? 1,
                totalXP: prog.totalXP ?? prog.total_xp ?? 0,
                prestigeLevel: prog.prestigeLevel ?? prog.prestige_level ?? 0,
                currentXP: prog.currentXP ?? prog.current_xp ?? 0,
            };
        }
        // Demo/Guest data
        return {
            currentTier: 1,
            totalXP: 0,
            prestigeLevel: 0,
            currentXP: 0,
        };
    }, [isConnected, progression]);

    const displayTierProgress = React.useMemo(() => {
        return calculateTierProgress(displayProgression.totalXP, displayProgression.currentTier);
    }, [displayProgression.totalXP, displayProgression.currentTier]);

    // Calculate total rewards for the season
    const rewardsSummary = React.useMemo(() => {
        const { totalShards, totalCosmetics } = getTotalRewards(displayProgression.currentTier);
        return {
            totalShards,
            totalCosmetics,
        };
    }, [displayProgression.currentTier]);

    // Handle claiming rewards (mock function for now)
    const handleClaimRewards = () => {
        // In a real implementation, this would call an API
        console.log("Claiming rewards...");
    };

    // Handle tier click for info/unlock
    const handleTierClick = (tier: number) => {
        // If clicking on a newly unlocked tier that hasn't been claimed, show modal
        // For now, just show info
        console.log(`Clicked tier ${tier}`);

        // Demo unlock modal for testing
        if (tier === displayProgression.currentTier && process.env.NODE_ENV === "development") {
            const rewards = getTierRewards(tier, false);
            setUnlockedTiers([{ tier, rewards }]);
            setShowUnlockModal(true);
        }
    };

    return (
        <LandingLayout>
            <div className="relative w-full min-h-screen pt-24 sm:pt-32 pb-20">
                {/* Background Elements */}
                <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[800px] h-[500px] bg-cyber-gold/5 rounded-full blur-[150px] pointer-events-none"></div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 relative z-10 w-full max-w-7xl">
                    {/* Header */}
                    <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
                        <h1 className="text-3xl sm:text-4xl lg:text-[60px] font-bold leading-tight mb-4 font-orbitron text-white">
                            BATTLE <span className="text-cyber-gold">PASS</span>
                        </h1>
                        <p className="text-cyber-gray text-base sm:text-lg font-montserrat max-w-2xl mx-auto">
                            {currentSeason && currentSeason.name && currentSeason.version
                                ? `Season ${currentSeason.version}: ${currentSeason.name} is live! Earn XP and unlock exclusive rewards.`
                                : "Earn XP from matches to unlock rewards and climb the tiers."}
                        </p>
                    </div>

                    <DecorativeLine className="mb-24 sm:mb-32" variant="left-red-right-gold" />

                    {/* Connection Warning */}
                    {!isConnected && (
                        <div className="mb-12 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-3 max-w-2xl mx-auto backdrop-blur-md">
                            <HugeiconsIcon
                                icon={Alert02Icon}
                                className="h-5 w-5 text-red-400 flex-shrink-0"
                            />
                            <div className="text-center">
                                <p className="text-sm font-medium text-red-400">
                                    Connect your wallet to track your progress
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="mb-12 p-4 rounded-lg bg-red-500/10 border border-red-500/30 max-w-2xl mx-auto backdrop-blur-md">
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="space-y-12 relative z-20">
                        {/* XP Progress Section */}
                        <div className="p-6 sm:p-8 rounded-xl bg-card/10 border border-white/5 backdrop-blur-sm shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-orbitron font-bold text-white tracking-wide">YOUR PROGRESS</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing || !isConnected}
                                    className="gap-2 text-cyber-gray hover:text-cyber-gold"
                                >
                                    <HugeiconsIcon
                                        icon={Loading03Icon}
                                        className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                                    />
                                    Refresh
                                </Button>
                            </div>
                            <XPProgressBar
                                currentTier={displayProgression.currentTier}
                                currentXP={displayTierProgress.currentXP}
                                xpRequired={displayTierProgress.xpRequired}
                                totalXP={displayProgression.totalXP}
                                prestigeLevel={displayProgression.prestigeLevel}
                                animated={!isLoading}
                                showDetails={true}
                            />
                        </div>

                        {/* Season Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <SeasonStatsCard
                                label="Current Tier"
                                value={displayProgression.currentTier}
                                icon={<HugeiconsIcon icon={ChampionIcon} className="h-6 w-6 text-cyber-gold" />}
                                color="kaspa"
                            />
                            <SeasonStatsCard
                                label="Total XP"
                                value={formatCurrency(displayProgression.totalXP)}
                                icon={
                                    <span className="text-lg font-bold text-cyber-gold">XP</span>
                                }
                                color="kaspa"
                            />
                            <SeasonStatsCard
                                label="Shards Earned"
                                value={formatCurrency(rewardsSummary.totalShards)}
                                icon={<HugeiconsIcon icon={Coins01Icon} className="h-6 w-6 text-cyber-gold" />}
                                color="kaspa"
                            />
                            <SeasonStatsCard
                                label="Items Unlocked"
                                value={rewardsSummary.totalCosmetics}
                                icon={<HugeiconsIcon icon={Globe02Icon} className="h-6 w-6 text-cyber-gold" />}
                                color="kaspa"
                            />
                        </div>

                        {/* Battle Pass Tiers */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-orbitron font-bold text-white tracking-wide text-center">ALL TIERS</h2>
                            <BattlePassTiers
                                currentTier={displayProgression.currentTier}
                                isPremium={false}
                                onTierClick={handleTierClick}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Unlock Modal */}
            <TierUnlockModal
                isOpen={showUnlockModal}
                onClose={() => setShowUnlockModal(false)}
                unlockedTiers={unlockedTiers}
                onClaim={handleClaimRewards}
            />
        </LandingLayout>
    );
}
