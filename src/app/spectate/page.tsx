"use client";

import React, { useState, useEffect, useCallback } from "react";
import GameLayout from "@/components/layout/GameLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCharacter } from "@/data/characters";
import { motion } from "framer-motion";

interface LiveMatch {
    id: string;
    roomCode: string | null;
    player1Address: string;
    player2Address: string | null;
    player1CharacterId: string | null;
    player2CharacterId: string | null;
    format: string;
    status: string;
    player1RoundsWon: number;
    player2RoundsWon: number;
    createdAt: string;
    startedAt: string | null;
    player1: {
        address: string;
        displayName: string | null;
        rating: number;
        avatarUrl: string | null;
    } | null;
    player2: {
        address: string;
        displayName: string | null;
        rating: number;
        avatarUrl: string | null;
    } | null;
}

function truncateAddress(address: string): string {
    if (address.length <= 16) return address;
    return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

// Bot match interface
interface BotMatch {
    id: string;
    bot1CharacterId: string;
    bot2CharacterId: string;
    bot1Name: string;
    bot2Name: string;
    createdAt: number;
    status: string;
}

// Bot Match Card Component
function BotMatchCard({ match }: { match: BotMatch }) {
    const bot1Character = getCharacter(match.bot1CharacterId);
    const bot2Character = getCharacter(match.bot2CharacterId);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative rounded-[20px] bg-black/40 border border-orange-500/40 p-6 pt-14 hover:border-orange-500 transition-all hover:bg-black/60 overflow-hidden"
        >
            {/* Bot Match Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10 bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/40 backdrop-blur-sm">
                <span className="text-lg">🤖</span>
                <span className="text-xs text-orange-400 font-orbitron uppercase tracking-wider font-bold">Bot Match</span>
            </div>

            {/* Match Info */}
            <div className="flex items-center justify-between gap-4">
                {/* Bot 1 */}
                <div className="flex-1 text-center min-w-0">
                    <div className="relative w-20 h-20 mx-auto mb-3">
                        {bot1Character ? (
                            <img
                                src={bot1Character.portraitUrl}
                                alt={bot1Character.name}
                                className="w-full h-full object-cover rounded-lg border border-orange-500/30"
                            />
                        ) : (
                            <div className="w-full h-full rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                                <span className="text-orange-400 text-2xl">🤖</span>
                            </div>
                        )}
                    </div>
                    <p className="text-white font-orbitron text-sm truncate w-full px-2">{match.bot1Name}</p>
                    <p className="text-orange-400 text-xs mt-1">BOT</p>
                </div>

                {/* VS */}
                <div className="text-center px-2 shrink-0">
                    <div className="text-3xl font-bold font-orbitron text-orange-400">
                        VS
                    </div>
                    <p className="text-cyber-gray text-[10px] mt-2 uppercase tracking-wider bg-orange-500/10 px-2 py-1 rounded">
                        Best of 3
                    </p>
                </div>

                {/* Bot 2 */}
                <div className="flex-1 text-center min-w-0">
                    <div className="relative w-20 h-20 mx-auto mb-3">
                        {bot2Character ? (
                            <img
                                src={bot2Character.portraitUrl}
                                alt={bot2Character.name}
                                className="w-full h-full object-cover rounded-lg border border-orange-500/30"
                            />
                        ) : (
                            <div className="w-full h-full rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                                <span className="text-orange-400 text-2xl">🤖</span>
                            </div>
                        )}
                    </div>
                    <p className="text-white font-orbitron text-sm truncate w-full px-2">{match.bot2Name}</p>
                    <p className="text-orange-400 text-xs mt-1">BOT</p>
                </div>
            </div>

            {/* Watch Button */}
            <div className="mt-8">
                <Link href={`/spectate/bot/${match.id}`} className="block">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 font-orbitron hover:opacity-90 py-6 text-lg tracking-widest">
                        <span className="mr-3">🤖</span>
                        WATCH BOT BATTLE
                    </Button>
                </Link>
            </div>
        </motion.div>
    );
}

function MatchCard({ match }: { match: LiveMatch }) {
    const player1Name = match.player1?.displayName || truncateAddress(match.player1Address);
    const player2Name = match.player2?.displayName || (match.player2Address ? truncateAddress(match.player2Address) : "???");

    const player1Character = match.player1CharacterId ? getCharacter(match.player1CharacterId) : null;
    const player2Character = match.player2CharacterId ? getCharacter(match.player2CharacterId) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative rounded-[20px] bg-black/40 border border-cyber-gold/30 p-6 pt-14 hover:border-cyber-gold transition-all hover:bg-black/60 overflow-hidden"
        >
            {/* Live Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10 bg-black/40 px-3 py-1 rounded-full border border-red-500/30 backdrop-blur-sm">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs text-red-500 font-orbitron uppercase tracking-wider font-bold">Live</span>
            </div>

            {/* Match Info */}
            <div className="flex items-center justify-between gap-4">
                {/* Player 1 */}
                <div className="flex-1 text-center min-w-0">
                    <div className="relative w-20 h-20 mx-auto mb-3">
                        {player1Character ? (
                            <img
                                src={player1Character.portraitUrl}
                                alt={player1Character.name}
                                className="w-full h-full object-cover rounded-lg border border-cyber-gold/30"
                            />
                        ) : (
                            <div className="w-full h-full rounded-lg bg-cyber-gold/10 border border-cyber-gold/30 flex items-center justify-center">
                                <span className="text-cyber-gold text-2xl">?</span>
                            </div>
                        )}
                    </div>
                    <p className="text-white font-orbitron text-sm truncate w-full px-2" title={player1Name}>{player1Name}</p>
                    <p className="text-cyber-gray text-xs mt-1">{match.player1?.rating || 1000} ELO</p>
                </div>

                {/* Score */}
                <div className="text-center px-2 shrink-0">
                    <div className="text-4xl font-bold font-orbitron whitespace-nowrap">
                        <span className="text-cyber-gold">{match.player1RoundsWon}</span>
                        <span className="text-cyber-gray mx-2">-</span>
                        <span className="text-cyber-orange">{match.player2RoundsWon}</span>
                    </div>
                    <p className="text-cyber-gray text-[10px] mt-2 uppercase tracking-wider bg-white/5 px-2 py-1 rounded">
                        {match.format === "best_of_3" ? "Best of 3" : "Best of 5"}
                    </p>
                </div>

                {/* Player 2 */}
                <div className="flex-1 text-center min-w-0">
                    <div className="relative w-20 h-20 mx-auto mb-3">
                        {player2Character ? (
                            <img
                                src={player2Character.portraitUrl}
                                alt={player2Character.name}
                                className="w-full h-full object-cover rounded-lg border border-cyber-orange/30"
                            />
                        ) : (
                            <div className="w-full h-full rounded-lg bg-cyber-orange/10 border border-cyber-orange/30 flex items-center justify-center">
                                <span className="text-cyber-orange text-2xl">?</span>
                            </div>
                        )}
                    </div>
                    <p className="text-white font-orbitron text-sm truncate w-full px-2" title={player2Name}>{player2Name}</p>
                    <p className="text-cyber-gray text-xs mt-1">{match.player2?.rating || 1000} ELO</p>
                </div>
            </div>

            {/* Watch Button */}
            <div className="mt-8">
                <Link href={`/spectate/${match.id}`} className="block">
                    <Button className="w-full bg-gradient-cyber text-white border-0 font-orbitron hover:opacity-90 py-6 text-lg tracking-widest">
                        <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        WATCH LIVE
                    </Button>
                </Link>
            </div>
        </motion.div>
    );
}

export default function SpectatePage() {
    const [matches, setMatches] = useState<LiveMatch[]>([]);
    const [botMatches, setBotMatches] = useState<BotMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMatches = useCallback(async () => {
        try {
            // Fetch player matches
            const response = await fetch("/api/matches/live");
            if (!response.ok) {
                throw new Error("Failed to fetch live matches");
            }
            const data = await response.json();
            const playerMatches = data.matches || [];
            setMatches(playerMatches);

            // If no player matches, fetch bot matches
            if (playerMatches.length === 0) {
                try {
                    const botResponse = await fetch("/api/bot-games");
                    if (botResponse.ok) {
                        const botData = await botResponse.json();
                        setBotMatches(botData.matches || []);
                    }
                } catch (botErr) {
                    console.error("Error fetching bot matches:", botErr);
                }
            } else {
                setBotMatches([]); // Clear bot matches when player matches exist
            }

            setError(null);
        } catch (err) {
            console.error("Error fetching live matches:", err);
            setError("Failed to load live matches");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch and polling
    useEffect(() => {
        fetchMatches();

        // Poll for new matches every 5 seconds
        const interval = setInterval(fetchMatches, 5000);
        return () => clearInterval(interval);
    }, [fetchMatches]);

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    return (
        <GameLayout>
            <div className="relative w-full min-h-screen pt-6 sm:pt-10 pb-20">
                {/* Background Grid Lines */}
                <div className="absolute top-0 bottom-0 left-[70.5px] w-px bg-cyber-orange/10 hidden md:block pointer-events-none"></div>
                <div className="absolute top-0 bottom-0 right-[70.5px] w-px bg-cyber-gold/10 hidden md:block pointer-events-none"></div>

                <div className="container mx-auto px-6 lg:px-12 xl:px-24 relative z-10">
                    {/* Header */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="text-center max-w-4xl mx-auto mb-16"
                    >
                        <motion.h1
                            variants={fadeInUp}
                            className="text-4xl lg:text-[60px] font-bold leading-tight mb-4 font-orbitron text-white"
                        >
                            LIVE <span className="text-cyber-orange">BATTLES</span>
                        </motion.h1>
                        <motion.p variants={fadeInUp} className="text-cyber-gray text-lg font-montserrat">
                            Watch real-time matches powered by Kaspa's sub-second block times.
                        </motion.p>
                    </motion.div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-cyber-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-cyber-gold text-lg font-medium font-orbitron tracking-widest uppercase">
                                    Loading matches...
                                </p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-red-500 text-lg mb-4">{error}</p>
                            <Button onClick={fetchMatches} className="bg-gradient-cyber text-white border-0 font-orbitron">
                                Try Again
                            </Button>
                        </div>
                    ) : matches.length === 0 && botMatches.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-20"
                        >
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cyber-gold/10 border border-cyber-gold/30 flex items-center justify-center">
                                <svg className="w-12 h-12 text-cyber-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white font-orbitron mb-4">NO LIVE MATCHES</h2>
                            <p className="text-cyber-gray text-lg mb-8 max-w-md mx-auto">
                                No battles are happening right now. Check back soon or start your own fight!
                            </p>
                            <Link href="/matchmaking">
                                <Button className="bg-gradient-cyber text-white border-0 font-orbitron px-8 py-3 h-auto hover:opacity-90">
                                    START A MATCH
                                </Button>
                            </Link>
                        </motion.div>
                    ) : (
                        <>
                            {/* Player Matches */}
                            {matches.length > 0 && (
                                <motion.div
                                    variants={staggerContainer}
                                    initial="hidden"
                                    animate="visible"
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                >
                                    {matches.map((match) => (
                                        <MatchCard key={match.id} match={match} />
                                    ))}
                                </motion.div>
                            )}

                            {/* Bot Matches Section */}
                            {botMatches.length > 0 && (
                                <>
                                    {matches.length > 0 && (
                                        <div className="mt-12 mb-8 flex items-center gap-4">
                                            <div className="flex-1 h-px bg-orange-500/30" />
                                            <h2 className="text-lg font-orbitron text-orange-400 flex items-center gap-2">
                                                <span>🤖</span> BOT BATTLES
                                            </h2>
                                            <div className="flex-1 h-px bg-orange-500/30" />
                                        </div>
                                    )}
                                    {matches.length === 0 && (
                                        <div className="mb-8 text-center">
                                            <p className="text-cyber-gray mb-4">No player matches available. Watch our bots battle!</p>
                                        </div>
                                    )}
                                    <motion.div
                                        variants={staggerContainer}
                                        initial="hidden"
                                        animate="visible"
                                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                    >
                                        {botMatches.map((match) => (
                                            <BotMatchCard key={match.id} match={match} />
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </>
                    )}

                    <DecorativeLine className="mt-20" variant="left-gold-right-red" />
                </div>
            </div>
        </GameLayout>
    );
}
