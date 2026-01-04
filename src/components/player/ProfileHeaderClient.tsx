"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useWallet } from "@/hooks/useWallet";
import ProfileEditModal from "./ProfileEditModal";

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

export default function ProfileHeaderClient({ profile, rank }: ProfileHeaderClientProps) {
    const { address: connectedAddress } = useWallet();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();

    const isOwnProfile = connectedAddress === profile.address;
    const displayRank = rank ? `#${rank}` : "Unranked";
    const winRate = calculateWinRate(profile.wins, profile.losses);

    const handleProfileUpdated = () => {
        // Refresh the page to show updated data
        router.refresh();
    };

    return (
        <>
            {/* Profile Header Card */}
            <div className="bg-black/40 border border-cyber-gold/30 rounded-2xl p-8 backdrop-blur-md mb-12">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    {/* Avatar / Rank */}
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-cyber-gold bg-black flex items-center justify-center overflow-hidden">
                            {profile.avatar_url ? (
                                <Image
                                    src={profile.avatar_url}
                                    alt="Player avatar"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <span className="text-6xl">🥷</span>
                            )}
                        </div>
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-cyber-gold text-black font-bold font-orbitron px-4 py-1 rounded-full text-sm whitespace-nowrap shadow-lg">
                            RANK {displayRank}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-2xl md:text-4xl font-bold text-white font-orbitron break-all">
                                {profile.display_name || formatAddress(profile.address)}
                            </h1>
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
