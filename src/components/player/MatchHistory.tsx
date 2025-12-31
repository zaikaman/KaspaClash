import React from "react";
import Link from "next/link";

interface MatchEvent {
    id: string;
    opponent: string;
    result: "WIN" | "LOSS";
    timestamp: string;
    character: string;
    opponentCharacter: string;
}

const SAMPLE_HISTORY: MatchEvent[] = [
    { id: "m1", opponent: "kaspa:qabc...wxyz", result: "WIN", timestamp: "2 mins ago", character: "Cyber Ninja", opponentCharacter: "DAG Warrior" },
    { id: "m2", opponent: "kaspa:q789...1234", result: "WIN", timestamp: "15 mins ago", character: "Cyber Ninja", opponentCharacter: "Block Bruiser" },
    { id: "m3", opponent: "kaspa:q456...7890", result: "LOSS", timestamp: "1 hour ago", character: "Cyber Ninja", opponentCharacter: "Cyber Ninja" },
    { id: "m4", opponent: "kaspa:q111...2222", result: "WIN", timestamp: "3 hours ago", character: "Cyber Ninja", opponentCharacter: "Hash Hunter" },
];

export default function MatchHistory() {
    return (
        <div className="w-full space-y-4">
            <h3 className="text-xl font-orbitron text-white mb-6 border-l-4 border-cyber-gold pl-4">RECENT BATTLES</h3>

            {SAMPLE_HISTORY.map((match) => (
                <Link key={match.id} href={`/m/${match.id}`}>
                    <div className="group bg-black/40 border-l-4 border-l-transparent hover:border-l-cyber-gold border-y border-r border-white/10 p-4 mb-2 flex items-center justify-between transition-all hover:bg-cyber-gold/5">
                        {/* Result Badge */}
                        <div className="w-16">
                            <span className={`
                                font-bold font-orbitron px-3 py-1 rounded text-sm
                                ${match.result === "WIN" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}
                            `}>
                                {match.result}
                            </span>
                        </div>

                        {/* Match Details */}
                        <div className="flex-1 px-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium">{match.character}</span>
                                <span className="text-cyber-gray text-xs">VS</span>
                                <span className="text-cyber-gray">{match.opponentCharacter}</span>
                            </div>
                            <div className="text-xs text-cyber-gray font-mono">
                                {match.timestamp}
                            </div>
                        </div>

                        {/* Opponent Address */}
                        <div className="hidden sm:block text-right">
                            <span className="text-xs text-cyber-gray block">OPPONENT</span>
                            <span className="text-sm text-white font-mono">{match.opponent}</span>
                        </div>

                        {/* Arrow */}
                        <div className="ml-4 text-cyber-gray group-hover:text-cyber-gold group-hover:translate-x-1 transition-all">
                            →
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
