import React from "react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface MatchHistoryProps {
    playerAddress: string;
}

interface MatchRecord {
    id: string;
    player1_address: string;
    player2_address: string | null;
    player1_character_id: string | null;
    player2_character_id: string | null;
    winner_address: string | null;
    status: string;
    created_at: string;
}

async function getMatchHistory(playerAddress: string): Promise<MatchRecord[]> {
    try {
        const supabase = await createSupabaseServerClient();

        const { data, error } = await supabase
            .from("matches")
            .select("*")
            .or(`player1_address.eq.${playerAddress},player2_address.eq.${playerAddress}`)
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) {
            console.error("Error fetching match history:", error);
            return [];
        }

        return data || [];
    } catch {
        return [];
    }
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function formatAddress(address: string): string {
    if (address.length > 16) {
        const prefix = address.substring(0, 10);
        const suffix = address.substring(address.length - 6);
        return `${prefix}...${suffix}`;
    }
    return address;
}

const CHARACTER_NAMES: Record<string, string> = {
    "cyber-ninja": "Cyber Ninja",
    "dag-warrior": "DAG Warrior",
    "block-brawler": "Block Brawler",
    "hash-hunter": "Hash Hunter",
};

export default async function MatchHistory({ playerAddress }: MatchHistoryProps) {
    const matches = await getMatchHistory(playerAddress);

    if (matches.length === 0) {
        return (
            <div className="w-full space-y-4">
                <h3 className="text-xl font-orbitron text-white mb-6 border-l-4 border-cyber-gold pl-4">RECENT BATTLES</h3>
                <div className="text-center py-8 text-cyber-gray">
                    No matches found yet. Start playing to build your history!
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <h3 className="text-xl font-orbitron text-white mb-6 border-l-4 border-cyber-gold pl-4">RECENT BATTLES</h3>

            {matches.map((match) => {
                const isPlayer1 = match.player1_address === playerAddress;
                const opponentAddress = isPlayer1 ? match.player2_address : match.player1_address;
                const playerChar = isPlayer1 ? match.player1_character_id : match.player2_character_id;
                const opponentChar = isPlayer1 ? match.player2_character_id : match.player1_character_id;
                const isWinner = match.winner_address === playerAddress;

                return (
                    <div key={match.id} className="group bg-black/40 border-l-4 border-l-transparent hover:border-l-cyber-gold border-y border-r border-white/10 p-4 mb-2 flex items-center justify-between transition-all hover:bg-cyber-gold/5">
                        {/* Result Badge */}
                        <div className="w-16">
                            <span className={`
                                font-bold font-orbitron px-3 py-1 rounded text-sm
                                ${isWinner ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}
                            `}>
                                {isWinner ? "WIN" : "LOSS"}
                            </span>
                        </div>

                        {/* Match Details */}
                        <div className="flex-1 px-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium">
                                    {playerChar ? CHARACTER_NAMES[playerChar] || playerChar : "Unknown"}
                                </span>
                                <span className="text-cyber-gray text-xs">VS</span>
                                <span className="text-cyber-gray">
                                    {opponentChar ? CHARACTER_NAMES[opponentChar] || opponentChar : "Unknown"}
                                </span>
                            </div>
                            <div className="text-xs text-cyber-gray font-mono">
                                {formatTimeAgo(match.created_at)}
                            </div>
                        </div>

                        {/* Opponent Address */}
                        <div className="hidden sm:block text-right">
                            <span className="text-xs text-cyber-gray block">OPPONENT</span>
                            <span className="text-sm text-white font-mono">
                                {opponentAddress ? formatAddress(opponentAddress) : "Unknown"}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="ml-4 flex items-center gap-2">
                            {/* Match Details Link */}
                            <Link
                                href={`/m/${match.id}`}
                                className="text-cyber-gray hover:text-cyber-gold group-hover:translate-x-1 transition-all"
                            >
                                →
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
