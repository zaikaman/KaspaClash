import React from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import MatchSummary from "@/components/share/MatchSummary";
import ShareMatchButton from "@/components/share/ShareMatchButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface MatchData {
    id: string;
    player1_address: string;
    player2_address: string | null;
    player1_character_id: string | null;
    player2_character_id: string | null;
    winner_address: string | null;
    player1_rounds_won: number;
    player2_rounds_won: number;
    status: string;
    created_at: string;
    completed_at: string | null;
}

const CHARACTER_NAMES: Record<string, string> = {
    "cyber-ninja": "Cyber Ninja",
    "dag-warrior": "DAG Warrior",
    "block-brawler": "Block Brawler",
    "hash-hunter": "Hash Hunter",
};

async function getMatchData(matchId: string): Promise<MatchData | null> {
    try {
        const supabase = await createSupabaseServerClient();

        const { data, error } = await supabase
            .from("matches")
            .select("*")
            .eq("id", matchId)
            .single();

        if (error || !data) {
            console.error("Error fetching match:", error);
            return null;
        }

        return data as MatchData;
    } catch {
        return null;
    }
}

function formatAddress(address: string): string {
    if (address.length > 16) {
        const prefix = address.substring(0, 10);
        const suffix = address.substring(address.length - 6);
        return `${prefix}...${suffix}`;
    }
    return address;
}

export default async function MatchPublicPage({ params }: { params: Promise<{ matchId: string }> }) {
    const { matchId } = await params;
    const match = await getMatchData(matchId);

    // If match not found, show error state
    if (!match) {
        return (
            <LandingLayout>
                <div className="min-h-screen pt-32 pb-20 relative">
                    <div className="container mx-auto px-6 lg:px-12 xl:px-24 relative z-10">
                        <div className="text-center py-20">
                            <h1 className="text-4xl font-bold font-orbitron text-white mb-4">
                                MATCH NOT FOUND
                            </h1>
                            <p className="text-cyber-gray font-montserrat">
                                The match you&apos;re looking for doesn&apos;t exist.
                            </p>
                        </div>
                    </div>
                </div>
            </LandingLayout>
        );
    }

    // Determine winner and loser
    const isPlayer1Winner = match.winner_address === match.player1_address;
    const winnerAddress = match.winner_address || match.player1_address;
    const loserAddress = isPlayer1Winner ? match.player2_address : match.player1_address;
    const winnerCharId = isPlayer1Winner ? match.player1_character_id : match.player2_character_id;
    const loserCharId = isPlayer1Winner ? match.player2_character_id : match.player1_character_id;

    const matchData = {
        id: match.id,
        winner: {
            name: winnerCharId ? CHARACTER_NAMES[winnerCharId] || winnerCharId : "Unknown",
            address: formatAddress(winnerAddress),
        },
        loser: {
            name: loserCharId ? CHARACTER_NAMES[loserCharId] || loserCharId : "Unknown",
            address: loserAddress ? formatAddress(loserAddress) : "Unknown",
        },
        score: `${match.player1_rounds_won}-${match.player2_rounds_won}`,
        status: match.status,
        completedAt: match.completed_at,
    };

    return (
        <LandingLayout>
            <div className="min-h-screen pt-32 pb-20 relative">
                {/* Background Elements */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyber-gold/10 to-transparent pointer-events-none"></div>

                <div className="container mx-auto px-6 lg:px-12 xl:px-24 relative z-10">
                    <MatchSummary matchData={matchData} />

                    <div className="max-w-md mx-auto mt-8">
                        <ShareMatchButton matchId={matchData.id} winnerCharacter={matchData.winner.name} />
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-cyber-gray text-sm mb-4">
                            Want to prove your skills?
                        </p>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
}
