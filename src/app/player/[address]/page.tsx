import React from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import MatchHistory from "@/components/player/MatchHistory";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface PlayerProfile {
    address: string;
    display_name: string | null;
    rating: number;
    wins: number;
    losses: number;
    created_at: string;
}

async function getPlayerData(address: string): Promise<{ profile: PlayerProfile | null; rank: number | null }> {
    try {
        const supabase = await createSupabaseServerClient();

        // Get player profile
        const { data: player, error } = await supabase
            .from("players")
            .select("*")
            .eq("address", address)
            .single();

        if (error || !player) {
            return { profile: null, rank: null };
        }

        // Get rank (count of players with higher rating)
        const { count } = await supabase
            .from("players")
            .select("*", { count: "exact", head: true })
            .gt("rating", player.rating);

        const rank = (count ?? 0) + 1;

        return {
            profile: player as PlayerProfile,
            rank
        };
    } catch {
        return { profile: null, rank: null };
    }
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

export default async function PlayerProfilePage({ params }: { params: Promise<{ address: string }> }) {
    const { address } = await params;
    const { profile, rank } = await getPlayerData(address);

    // If player not found, show error state
    if (!profile) {
        return (
            <LandingLayout>
                <div className="relative w-full min-h-screen pt-32 pb-20">
                    <div className="container mx-auto px-6 lg:px-12 xl:px-24 relative z-10">
                        <div className="text-center py-20">
                            <h1 className="text-4xl font-bold font-orbitron text-white mb-4">
                                PLAYER NOT FOUND
                            </h1>
                            <p className="text-cyber-gray font-montserrat">
                                The player with address {formatAddress(address)} does not exist.
                            </p>
                        </div>
                    </div>
                </div>
            </LandingLayout>
        );
    }

    const winRate = calculateWinRate(profile.wins, profile.losses);
    const displayRank = rank ? `#${rank}` : "Unranked";

    return (
        <LandingLayout>
            <div className="relative w-full min-h-screen pt-32 pb-20">
                <div className="container mx-auto px-6 lg:px-12 xl:px-24 relative z-10">

                    {/* Profile Header Card */}
                    <div className="bg-black/40 border border-cyber-gold/30 rounded-2xl p-8 backdrop-blur-md mb-12">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            {/* Avatar / Rank */}
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 border-cyber-gold bg-black flex items-center justify-center overflow-hidden">
                                    <span className="text-6xl">🥷</span>
                                </div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-cyber-gold text-black font-bold font-orbitron px-4 py-1 rounded-full text-sm whitespace-nowrap shadow-lg">
                                    RANK {displayRank}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <h1 className="text-2xl md:text-4xl font-bold text-white font-orbitron mb-2 break-all">
                                    {profile.display_name || formatAddress(profile.address)}
                                </h1>
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

                    <DecorativeLine className="mb-12" variant="left-gold-right-red" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Left Column: Stats */}
                        <div className="space-y-8">
                            <div className="p-6 bg-black/20 border border-cyber-gray/20 rounded-xl">
                                <h3 className="text-xl font-orbitron text-white mb-4">SEASON STATS</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-cyber-gray">Total Matches</span>
                                        <span className="text-white font-mono">{profile.wins + profile.losses}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-cyber-gray">Wins</span>
                                        <span className="text-green-500 font-mono">{profile.wins}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-cyber-gray">Losses</span>
                                        <span className="text-red-500 font-mono">{profile.losses}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Match History */}
                        <div className="lg:col-span-2">
                            <MatchHistory playerAddress={profile.address} />
                        </div>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
}
