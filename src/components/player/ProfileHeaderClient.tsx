"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useWallet } from "@/hooks/useWallet";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChampionIcon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import ProfileEditModal from "./ProfileEditModal";
import { getPrestigeTierInfo, getPrestigeBonusDisplay } from "@/lib/progression/prestige-calculator";
import { cn } from "@/lib/utils";

interface ProfileHeaderClientProps {
    profile: {
        address: string;
        display_name: string | null;
        avatar_url: string | null;
        rating: number;
        wins: number;
        losses: number;
        created_at: string;
    };
    rank: number | null;
    prestige?: {
        level: number;
        xpMultiplier: number;
        currencyMultiplier: number;
    } | null;
}

function formatAddress(address: string): string {
    if (address.length > 20) {
        const prefix = address.substring(0, 12);
        const suffix = address.substring(address.length - 8);
        return `${prefix}...${suffix}`;
    }
    return address;
}

function calculateWinRate(wins: number, losses: number): string {
    const total = wins + losses;
    if (total === 0) return "0%";
    return `${Math.round((wins / total) * 100)}%`;
}

/**
 * Get prestige border style based on prestige level
 */
function getPrestigeBorderStyle(prestigeLevel: number): string {
    if (prestigeLevel >= 10) {
        return "border-cyan-400 shadow-[0_0_20px_rgba(0,212,255,0.5),0_0_40px_rgba(0,212,255,0.3)]";
    }
    if (prestigeLevel >= 7) {
        return "border-gray-200 shadow-[0_0_20px_rgba(229,228,226,0.5),0_0_40px_rgba(229,228,226,0.3)]";
    }
    if (prestigeLevel >= 5) {
        return "border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.5),0_0_40px_rgba(255,215,0,0.3)]";
    }
    if (prestigeLevel >= 3) {
        return "border-gray-400 shadow-[0_0_15px_rgba(192,192,192,0.4),0_0_30px_rgba(192,192,192,0.2)]";
    }
    if (prestigeLevel >= 1) {
        return "border-amber-600 shadow-[0_0_15px_rgba(205,127,50,0.4),0_0_30px_rgba(205,127,50,0.2)]";
    }
    return "border-cyber-gold";
}

/**
 * Get prestige aura animation class
 */
function getPrestigeAuraClass(prestigeLevel: number): string {
    if (prestigeLevel >= 10) {
        return "animate-pulse";
    }
    if (prestigeLevel >= 5) {
        return "animate-pulse";
    }
    return "";
}

export default function ProfileHeaderClient({ profile, rank, prestige }: ProfileHeaderClientProps) {
    const { address: connectedAddress } = useWallet();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();

    const isOwnProfile = connectedAddress === profile.address;
    const displayRank = rank ? `#${rank}` : "Unranked";
    const winRate = calculateWinRate(profile.wins, profile.losses);
    
    // Prestige display info
    const prestigeLevel = prestige?.level || 0;
    const prestigeTierInfo = getPrestigeTierInfo(prestigeLevel);
    const prestigeBonuses = getPrestigeBonusDisplay(prestigeLevel);
    const prestigeBorderStyle = getPrestigeBorderStyle(prestigeLevel);
    const prestigeAuraClass = getPrestigeAuraClass(prestigeLevel);

    const handleProfileUpdated = () => {
        // Refresh the page to show updated data
        router.refresh();
    };

    return (
        <>
            {/* Profile Header Card */}
            <div className={cn(
                "bg-black/40 border rounded-2xl p-8 backdrop-blur-md mb-12",
                prestigeLevel > 0 ? "border-opacity-50" : "border-cyber-gold/30",
                prestigeLevel >= 5 && "bg-gradient-to-r from-black/40 via-yellow-900/10 to-black/40",
                prestigeLevel >= 10 && "bg-gradient-to-r from-black/40 via-cyan-900/10 to-black/40"
            )}>
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    {/* Avatar / Rank with Prestige Border */}
                    <div className="relative">
                        {/* Prestige Aura Effect */}
                        {prestigeLevel >= 5 && (
                            <div className={cn(
                                "absolute inset-0 rounded-full blur-xl opacity-30",
                                prestigeLevel >= 10 ? "bg-cyan-400" : "bg-yellow-400",
                                prestigeAuraClass
                            )} style={{ transform: "scale(1.3)" }} />
                        )}
                        
                        <div className={cn(
                            "w-32 h-32 rounded-full border-4 bg-black flex items-center justify-center overflow-hidden relative",
                            prestigeBorderStyle
                        )}>
                            {profile.avatar_url ? (
                                <Image
                                    src={profile.avatar_url}
                                    alt="Player avatar"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <HugeiconsIcon icon={ChampionIcon} className="w-16 h-16 text-cyber-gold/50" />
                            )}
                        </div>
                        
                        {/* Rank Badge */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-cyber-gold text-black font-bold font-orbitron px-4 py-1 rounded-full text-sm whitespace-nowrap shadow-lg">
                            RANK {displayRank}
                        </div>
                        
                        {/* Prestige Badge */}
                        {prestigeLevel > 0 && (
                            <div className={cn(
                                "absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg",
                                prestigeLevel >= 10 ? "bg-cyan-400 text-black" :
                                prestigeLevel >= 7 ? "bg-gray-200 text-black" :
                                prestigeLevel >= 5 ? "bg-yellow-400 text-black" :
                                prestigeLevel >= 3 ? "bg-gray-400 text-black" :
                                "bg-amber-600 text-white"
                            )}>
                                {prestigeTierInfo.icon || prestigeLevel}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-2xl md:text-4xl font-bold text-white font-orbitron break-all">
                                {profile.display_name || formatAddress(profile.address)}
                            </h1>
                            {/* Prestige Title Badge */}
                            {prestigeLevel > 0 && (
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold font-orbitron",
                                    prestigeLevel >= 10 ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/30" :
                                    prestigeLevel >= 7 ? "bg-gray-200/20 text-gray-200 border border-gray-200/30" :
                                    prestigeLevel >= 5 ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30" :
                                    prestigeLevel >= 3 ? "bg-gray-400/20 text-gray-400 border border-gray-400/30" :
                                    "bg-amber-600/20 text-amber-500 border border-amber-600/30"
                                )}>
                                    {prestigeTierInfo.icon} P{prestigeLevel}
                                </span>
                            )}
                            {isOwnProfile && (
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="p-2 rounded-lg bg-cyber-gold/10 border border-cyber-gold/30 text-cyber-gold hover:bg-cyber-gold/20 transition-colors"
                                    title="Edit Profile"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                            )}
                        </div>
                        <p className="text-cyber-gray font-mono text-sm">
                            {profile.address}
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-4">
                            <span className="bg-cyber-gray/10 px-4 py-2 rounded text-cyber-gray font-mono text-sm border border-cyber-gray/20">
                                Joined: {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            </span>
                            {/* Prestige Bonuses Display */}
                            {prestigeLevel > 0 && (
                                <span className={cn(
                                    "px-4 py-2 rounded font-mono text-sm flex items-center gap-2 border",
                                    prestigeLevel >= 10 ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/30" :
                                    prestigeLevel >= 5 ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/30" :
                                    "bg-amber-600/10 text-amber-500 border-amber-600/30"
                                )}>
                                    <HugeiconsIcon icon={ArrowUp01Icon} className="h-4 w-4" />
                                    {prestigeBonuses.xpBonusFormatted} XP • {prestigeBonuses.currencyBonusFormatted} Shards
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 w-full md:w-auto">
                        <div className="text-center">
                            <div className="text-3xl font-bold font-orbitron text-cyber-orange">{profile.rating}</div>
                            <div className="text-xs text-cyber-gray uppercase tracking-wider">Rating</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold font-orbitron text-white">{profile.wins}</div>
                            <div className="text-xs text-cyber-gray uppercase tracking-wider">Wins</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold font-orbitron text-green-500">{winRate}</div>
                            <div className="text-xs text-cyber-gray uppercase tracking-wider">Win Rate</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <ProfileEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                playerAddress={profile.address}
                currentDisplayName={profile.display_name}
                currentAvatarUrl={profile.avatar_url}
                onProfileUpdated={handleProfileUpdated}
            />
        </>
    );
}
