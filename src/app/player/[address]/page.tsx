import React from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import MatchHistory from "@/components/player/MatchHistory";
import ProfileHeaderClient from "@/components/player/ProfileHeaderClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface PlayerProfile {
    address: string;
    display_name: string | null;
    avatar_url: string | null;
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

        // Cast to unknown first since Supabase schema might not have avatar_url yet
        const playerData = player as unknown as Record<string, unknown>;

        return {
            profile: {
                address: player.address,
                display_name: player.display_name,
                avatar_url: (playerData.avatar_url as string | null) ?? null,
                rating: player.rating,
                wins: player.wins,
                losses: player.losses,
                created_at: player.created_at,
            },
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

export default async function PlayerProfilePage({ params }: { params: Promise<{ address: string }> }) {
    const { address: encodedAddress } = await params;
    const address = decodeURIComponent(encodedAddress);
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

    return (
        <LandingLayout>
            <div className="relative w-full min-h-screen pt-32 pb-20">
                <div className="container mx-auto px-6 lg:px-12 xl:px-24 relative z-10">

                    {/* Profile Header Card - Client Component for interactivity */}
                    <ProfileHeaderClient profile={profile} rank={rank} />

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

