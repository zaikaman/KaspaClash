import React from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import MatchHistory from "@/components/player/MatchHistory";

// In a real app, this would be a server component fetching data based on params.address
export default function PlayerProfilePage({ params }: { params: { address: string } }) {
    // Mock data based on what a profile would look like
    const mockProfile = {
        address: params.address || "kaspa:qxyz...abcd",
        rating: 2450,
        wins: 142,
        losses: 12,
        winRate: "92%",
        rank: "#1",
        mainCharacter: "Cyber Ninja"
    };

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
                                    RANK {mockProfile.rank}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <h1 className="text-2xl md:text-4xl font-bold text-white font-orbitron mb-2 break-all">
                                    {mockProfile.address}
                                </h1>
                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                    <span className="bg-cyber-gray/10 px-4 py-2 rounded text-cyber-gray font-mono text-sm border border-cyber-gray/20">
                                        Main: <span className="text-white font-bold">{mockProfile.mainCharacter}</span>
                                    </span>
                                    <span className="bg-cyber-gray/10 px-4 py-2 rounded text-cyber-gray font-mono text-sm border border-cyber-gray/20">
                                        Joined: Dec 2024
                                    </span>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 w-full md:w-auto">
                                <div className="text-center">
                                    <div className="text-3xl font-bold font-orbitron text-cyber-orange">{mockProfile.rating}</div>
                                    <div className="text-xs text-cyber-gray uppercase tracking-wider">Rating</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold font-orbitron text-white">{mockProfile.wins}</div>
                                    <div className="text-xs text-cyber-gray uppercase tracking-wider">Wins</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold font-orbitron text-green-500">{mockProfile.winRate}</div>
                                    <div className="text-xs text-cyber-gray uppercase tracking-wider">Win Rate</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DecorativeLine className="mb-12" variant="left-gold-right-red" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Left Column: Stats & Achievements (Placeholder) */}
                        <div className="space-y-8">
                            <div className="p-6 bg-black/20 border border-cyber-gray/20 rounded-xl">
                                <h3 className="text-xl font-orbitron text-white mb-4">SEASON STATS</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-cyber-gray">Total Damage Dealt</span>
                                        <span className="text-white font-mono">1,240,500</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-cyber-gray">Perfect Rounds</span>
                                        <span className="text-white font-mono">14</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-cyber-gray">Longest Streak</span>
                                        <span className="text-white font-mono">12 Wins</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Match History */}
                        <div className="lg:col-span-2">
                            <MatchHistory />
                        </div>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
}
