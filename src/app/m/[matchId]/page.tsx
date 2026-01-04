import React from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import MatchSummary from "@/components/share/MatchSummary";
import ShareMatchButton from "@/components/share/ShareMatchButton";
import TransactionTimeline, { type TransactionData } from "@/components/share/TransactionTimeline";
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

interface MoveData {
    id: string;
    round_id: string;
    player_address: string;
    move_type: string;
    tx_id: string | null;
    tx_confirmed_at: string | null;
    created_at: string;
}

interface RoundData {
    id: string;
    round_number: number;
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

async function getMatchTransactions(matchId: string): Promise<TransactionData[]> {
    try {
        const supabase = await createSupabaseServerClient();

        // First get all rounds for this match
        const { data: rounds, error: roundsError } = await supabase
            .from("rounds")
            .select("id, round_number")
            .eq("match_id", matchId)
            .order("round_number", { ascending: true });

        if (roundsError || !rounds || rounds.length === 0) {
            return [];
        }

        const roundIds = rounds.map(r => r.id);
        const roundNumberMap: Record<string, number> = {};
        rounds.forEach((r: RoundData) => {
            roundNumberMap[r.id] = r.round_number;
        });

        // Get all moves with tx_id for these rounds
        const { data: moves, error: movesError } = await supabase
            .from("moves")
            .select("id, round_id, player_address, move_type, tx_id, tx_confirmed_at, created_at")
            .in("round_id", roundIds)
            .not("tx_id", "is", null)
            .order("created_at", { ascending: true });

        if (movesError || !moves) {
            console.error("Error fetching moves:", movesError);
            return [];
        }

        // Transform to TransactionData format
        return moves.map((move: MoveData) => ({
            txId: move.tx_id!,
            moveType: move.move_type,
            playerAddress: move.player_address,
            roundNumber: roundNumberMap[move.round_id] || 1,
            confirmedAt: move.tx_confirmed_at,
            createdAt: move.created_at,
        }));
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return [];
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
    const [match, transactions] = await Promise.all([
        getMatchData(matchId),
        getMatchTransactions(matchId)
    ]);

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

    const isCompleted = match.status === "completed";

    return (
        <LandingLayout>
            <div className="min-h-screen pt-32 pb-20 relative">
                {/* Background Elements */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyber-gold/10 to-transparent pointer-events-none"></div>

                <div className="container mx-auto px-6 lg:px-12 xl:px-24 relative z-10">
                    <MatchSummary matchData={matchData} />

                    {/* Watch Replay Button - Only for completed matches */}
                    {isCompleted && (
                        <div className="max-w-md mx-auto mt-6">
                            <a
                                href={`/replay/${matchData.id}`}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-orbitron rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                WATCH FULL REPLAY
                            </a>
                        </div>
                    )}

                    <div className="max-w-md mx-auto mt-4">
                        <ShareMatchButton matchId={matchData.id} winnerCharacter={matchData.winner.name} />
                    </div>

                    {/* Transaction Timeline - Shows Kaspa's speed */}
                    <div className="mt-8">
                        <TransactionTimeline 
                            transactions={transactions}
                            matchCreatedAt={match.created_at}
                            matchCompletedAt={match.completed_at}
                        />
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
