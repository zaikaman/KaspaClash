"use client";

/**
 * Battle Pass Page
 * Main UI for viewing and tracking battle pass progression
 */

import React from "react";
import GameLayout from "@/components/layout/GameLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import { XPProgressBar } from "@/components/progression/XPProgressBar";
import { BattlePassTiers } from "@/components/progression/BattlePassTiers";
import { TierUnlockModal } from "@/components/progression/TierUnlockModal";
import { PrestigeConfirmation } from "@/components/progression/PrestigeConfirmation";
import { useProgressionStore } from "@/stores/progression-store";
import { useShopStore } from "@/stores/shop-store";
import { useWalletStore, selectIsConnected } from "@/stores/wallet-store";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/progression/currency-utils";
import { calculateTierProgress } from "@/lib/progression/xp-calculator";
import { getTierRewards, calculateSeasonTotalRewards as getTotalRewards } from "@/lib/progression/tier-rewards";
import { getPrestigeTierInfo, getPrestigeBonusDisplay, PRESTIGE_REQUIRED_TIER, MAX_PRESTIGE_LEVEL } from "@/lib/progression/prestige-calculator";
import { HugeiconsIcon } from "@hugeicons/react";
import { ClashShardsIcon } from "@/components/currency/ClashShardsIcon";
import {
    ChampionIcon,
    Globe02Icon,
    Alert02Icon,
    Loading03Icon,
    ArrowUp01Icon,
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
    const { fetchCurrency } = useShopStore();
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
    const [unlockedTiers, setUnlockedTiers] = React.useState<{ tier: number; rewards: TierReward[]; isClaimed?: boolean }[]>([]);

    // Prestige state
    const [showPrestigeModal, setShowPrestigeModal] = React.useState(false);
    const [isPrestiging, setIsPrestiging] = React.useState(false);

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
    const displayProgression = React.useMemo(() => {
        if (isConnected && progression) {
            const prog = progression as any;
            return {
                currentTier: prog.currentTier ?? prog.current_tier ?? 1,
                totalXP: prog.totalXP ?? prog.total_xp ?? 0,
                prestigeLevel: prog.prestigeLevel ?? prog.prestige_level ?? 0,
                currentXP: prog.currentXP ?? prog.current_xp ?? 0,
                claimedTiers: prog.claimedTiers ?? prog.claimed_tiers ?? [],
            };
        }
        // Demo/Guest data
        return {
            currentTier: 1,
            totalXP: 0,
            prestigeLevel: 0,
            currentXP: 0,
            claimedTiers: [],
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

    // Handle claiming rewards
    const [isClaiming, setIsClaiming] = React.useState(false);
    const [lastClaimedTier, setLastClaimedTier] = React.useState<number | null>(null);

    const handleClaimRewards = async () => {
        if (!unlockedTiers.length || isClaiming || !isConnected) return;

        // Claim the first unlocked tier in the list (usually just one)
        const tierToClaim = unlockedTiers[0].tier;
        setIsClaiming(true);

        try {
            // Get address from wallet store directly just to be safe, though isConnected check covers it
            const address = useWalletStore.getState().address;
            if (!address) throw new Error("Wallet not connected");

            const response = await fetch("/api/battle-pass/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    playerId: address,
                    tier: tierToClaim,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || "Failed to claim rewards");
            }

            // Success!
            setLastClaimedTier(tierToClaim);

            // Refresh progression to update UI
            await fetchPlayerProgression();

            // Refresh global currency balance
            if (address) {
                await fetchCurrency(address);
            }

            // Close modal after short delay or let user close? 
            // Better to let user see "Claimed" state if we had one, but for now we just close or refresh.
            // But wait, the modal has success handling inside? No, it just calls onClaim.
            // actually we can keep modal open and change button state?
            // The modal will close if we call setShowUnlockModal(false).
            // Let's keep it open for a second then close? Or just update local state.

            // For now, simple finish:
            setShowUnlockModal(false);

        } catch (err: any) {
            console.error("Error claiming rewards:", err);
            // Optionally show toast error here
        } finally {
            setIsClaiming(false);
        }
    };

    // Handle tier click for info/unlock
    const handleTierClick = (tier: number) => {
        // Only show for unlocked tiers
        if (tier > displayProgression.currentTier) {
            return;
        }

        const isClaimed = displayProgression.claimedTiers?.includes(tier);
        const rewards = getTierRewards(tier, false);

        // Show modal if it's unlocked. 
        // We pass "isClaimed" status implicitly by checking if we should show claim button.
        // Actually TierUnlockModal needs to know if it's claimed to hide button?
        // Or we pass `onClaim` only if it's NOT claimed.

        setUnlockedTiers([{ tier, rewards, isClaimed }]);
        setShowUnlockModal(true);
    };

    // Check if eligible for prestige
    const isEligibleForPrestige = React.useMemo(() => {
        return displayProgression.currentTier >= PRESTIGE_REQUIRED_TIER &&
            displayProgression.prestigeLevel < MAX_PRESTIGE_LEVEL &&
            isConnected;
    }, [displayProgression.currentTier, displayProgression.prestigeLevel, isConnected]);

    // Get prestige display info
    const prestigeInfo = React.useMemo(() => {
        const tierInfo = getPrestigeTierInfo(displayProgression.prestigeLevel);
        const bonusDisplay = getPrestigeBonusDisplay(displayProgression.prestigeLevel);
        return { tierInfo, bonusDisplay };
    }, [displayProgression.prestigeLevel]);

    // Handle prestige confirmation
    const handlePrestige = async () => {
        if (!isConnected || isPrestiging) return;

        const address = useWalletStore.getState().address;
        if (!address) return;

        setIsPrestiging(true);
        try {
            const response = await fetch("/api/progression/prestige", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerId: address }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || "Failed to prestige");
            }

            // Refresh progression to show reset tier
            await fetchPlayerProgression();

            // Close modal
            setShowPrestigeModal(false);
        } catch (err) {
            console.error("Prestige error:", err);
        } finally {
            setIsPrestiging(false);
        }
    };

    return (
        <GameLayout>
            <div className="relative w-full min-h-screen pt-6 sm:pt-10 pb-20">
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
                                icon={<ClashShardsIcon className="h-6 w-6 text-cyber-gold" />}
                                color="kaspa"
                            />
                            <SeasonStatsCard
                                label="Items Unlocked"
                                value={rewardsSummary.totalCosmetics}
                                icon={<HugeiconsIcon icon={Globe02Icon} className="h-6 w-6 text-cyber-gold" />}
                                color="kaspa"
                            />
                        </div>

                        {/* Prestige Section - Show when at tier 50 or already prestiged */}
                        {isConnected && (displayProgression.prestigeLevel > 0 || displayProgression.currentTier >= PRESTIGE_REQUIRED_TIER) && (
                            <div className="p-6 sm:p-8 rounded-xl bg-gradient-to-r from-cyber-gold/10 via-amber-500/5 to-cyber-gold/10 border border-cyber-gold/30 backdrop-blur-sm shadow-xl">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyber-gold/30 to-amber-500/20 flex items-center justify-center border-2 border-cyber-gold/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                            <div className="relative">
                                                <HugeiconsIcon icon={ChampionIcon} className="h-8 w-8 text-cyber-gold" />
                                                {displayProgression.prestigeLevel > 0 && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyber-gold flex items-center justify-center text-black font-bold text-xs">
                                                        {displayProgression.prestigeLevel}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-orbitron font-bold text-white flex items-center gap-2">
                                                Prestige {displayProgression.prestigeLevel > 0 ? displayProgression.prestigeLevel : 'Available'}
                                                {displayProgression.prestigeLevel > 0 && (
                                                    <span className={`text-sm ${prestigeInfo.tierInfo.cssClass}`}>
                                                        {prestigeInfo.tierInfo.icon} {prestigeInfo.tierInfo.tier}
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-cyber-gray">
                                                {displayProgression.prestigeLevel > 0 ? (
                                                    <>
                                                        Current Bonuses: <span className="text-cyber-gold">{prestigeInfo.bonusDisplay.xpBonusFormatted} XP</span>,{' '}
                                                        <span className="text-cyber-gold">{prestigeInfo.bonusDisplay.currencyBonusFormatted} Shards</span>
                                                    </>
                                                ) : (
                                                    <>Reset your progress for permanent bonuses!</>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {isEligibleForPrestige && (
                                        <Button
                                            onClick={() => setShowPrestigeModal(true)}
                                            className="gap-2 font-orbitron font-bold bg-gradient-to-r from-cyber-gold to-amber-500 hover:from-amber-500 hover:to-cyber-gold text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all duration-300"
                                        >
                                            <HugeiconsIcon icon={ArrowUp01Icon} className="h-5 w-5" />
                                            Prestige Now
                                        </Button>
                                    )}

                                    {displayProgression.prestigeLevel >= MAX_PRESTIGE_LEVEL && (
                                        <div className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-orbitron font-bold text-sm">
                                            💎 MAX PRESTIGE
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Battle Pass Tiers */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-orbitron font-bold text-white tracking-wide text-center">ALL TIERS</h2>
                            <BattlePassTiers
                                currentTier={displayProgression.currentTier}
                                isPremium={false}
                                onTierClick={handleTierClick}
                                isLoading={isLoading}
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
                isClaimingRewards={isClaiming}
            />

            {/* Prestige Confirmation Modal */}
            <PrestigeConfirmation
                isOpen={showPrestigeModal}
                onClose={() => setShowPrestigeModal(false)}
                onConfirm={handlePrestige}
                currentPrestigeLevel={displayProgression.prestigeLevel}
                isLoading={isPrestiging}
            />
        </GameLayout>
    );
}
