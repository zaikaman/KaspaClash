"use client";

import React, { useState, useEffect } from "react";
import GameLayout from "@/components/layout/GameLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getCharacter } from "@/data/characters";
import { useWallet } from "@/hooks/useWallet";
import { NETWORK_CONFIG } from "@/types/constants";
import Link from "next/link";

interface UnifiedBetHistoryItem {
    id: string;
    matchId: string;
    matchType: 'player' | 'bot';
    player1Name: string;
    player2Name: string;
    player1CharacterId: string;
    player2CharacterId: string;
    betOn: 'player1' | 'player2';
    amount: string;
    feeAmount: string;
    netAmount: string;
    payoutAmount: string | null;
    status: string;
    winner: string | null;
    createdAt: string;
    paidAt: string | null;
    txId: string;
    payoutTxId: string | null;
}

interface BetStats {
    totalBets: number;
    wonBets: number;
    lostBets: number;
    pendingBets: number;
    totalWagered: string;
    totalWon: string;
}

function sompiToKas(sompi: string | bigint): number {
    return Number(BigInt(sompi)) / 100_000_000;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function truncateTxId(txId: string): string {
    if (txId.length <= 16) return txId;
    return `${txId.slice(0, 8)}...${txId.slice(-8)}`;
}

export default function BetHistoryPage() {
    const [history, setHistory] = useState<UnifiedBetHistoryItem[]>([]);
    const [stats, setStats] = useState<BetStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    
    const { address, isConnected, network } = useWallet();
    const ITEMS_PER_PAGE = 10;

    // Get explorer URL based on network
    const explorerUrl = network === "testnet" 
        ? NETWORK_CONFIG.testnet.explorerUrl 
        : NETWORK_CONFIG.mainnet.explorerUrl;

    useEffect(() => {
        if (!isConnected || !address) {
            setLoading(false);
            return;
        }

        fetchHistory();
    }, [address, isConnected, page]);

    async function fetchHistory() {
        if (!address) return;

        setLoading(true);
        setError(null);

        try {
            const offset = page * ITEMS_PER_PAGE;
            const response = await fetch(
                `/api/betting/history?address=${address}&limit=${ITEMS_PER_PAGE}&offset=${offset}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch bet history");
            }

            const data = await response.json();

            if (data.success) {
                setHistory(data.history);
                setStats(data.stats);
                setHasMore(data.pagination.hasMore);
            } else {
                throw new Error(data.error || "Failed to load history");
            }
        } catch (err) {
            console.error("Error fetching bet history:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case 'won':
                return 'text-green-400';
            case 'lost':
                return 'text-red-400';
            case 'confirmed':
                return 'text-yellow-400';
            case 'pending':
                return 'text-gray-400';
            default:
                return 'text-gray-400';
        }
    }

    function getStatusIcon(status: string): string {
        switch (status) {
            case 'won':
                return '✓';
            case 'lost':
                return '✗';
            case 'confirmed':
                return '⏳';
            case 'pending':
                return '⌛';
            default:
                return '?';
        }
    }

    if (!isConnected || !address) {
        return (
            <GameLayout>
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <h2 className="text-3xl font-orbitron text-orange-400 mb-4">
                                🔌 Wallet Not Connected
                            </h2>
                            <p className="text-cyber-gray mb-6">
                                Connect your wallet to view your betting history
                            </p>
                            <Link href="/spectate">
                                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-orbitron">
                                    Back to Spectate
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </GameLayout>
        );
    }

    return (
        <GameLayout>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/spectate">
                            <Button variant="outline" className="border-orange-500/40 text-orange-400 hover:bg-orange-500/20">
                                ← Back
                            </Button>
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-orange-400">
                            Betting History
                        </h1>
                    </div>
                    <DecorativeLine className="h-1" />
                </div>

                {/* Stats Section */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-black/40 border border-orange-500/40 rounded-lg p-4"
                        >
                            <p className="text-cyber-gray text-xs uppercase tracking-wider mb-1">Total Bets</p>
                            <p className="text-white font-orbitron text-2xl font-bold">{stats.totalBets}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-black/40 border border-green-500/40 rounded-lg p-4"
                        >
                            <p className="text-cyber-gray text-xs uppercase tracking-wider mb-1">Won</p>
                            <p className="text-green-400 font-orbitron text-2xl font-bold">{stats.wonBets}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-black/40 border border-red-500/40 rounded-lg p-4"
                        >
                            <p className="text-cyber-gray text-xs uppercase tracking-wider mb-1">Lost</p>
                            <p className="text-red-400 font-orbitron text-2xl font-bold">{stats.lostBets}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-black/40 border border-yellow-500/40 rounded-lg p-4"
                        >
                            <p className="text-cyber-gray text-xs uppercase tracking-wider mb-1">Pending</p>
                            <p className="text-yellow-400 font-orbitron text-2xl font-bold">{stats.pendingBets}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-black/40 border border-blue-500/40 rounded-lg p-4"
                        >
                            <p className="text-cyber-gray text-xs uppercase tracking-wider mb-1">Wagered</p>
                            <p className="text-blue-400 font-orbitron text-xl font-bold">{sompiToKas(stats.totalWagered).toFixed(2)} KAS</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-black/40 border border-green-500/40 rounded-lg p-4"
                        >
                            <p className="text-cyber-gray text-xs uppercase tracking-wider mb-1">Won</p>
                            <p className="text-green-400 font-orbitron text-xl font-bold">{sompiToKas(stats.totalWon).toFixed(2)} KAS</p>
                        </motion.div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-orange-400 font-orbitron">Loading history...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-6 text-center">
                        <p className="text-red-400 font-orbitron">⚠️ {error}</p>
                        <Button
                            onClick={fetchHistory}
                            className="mt-4 bg-red-500 hover:bg-red-600 text-white font-orbitron"
                        >
                            Retry
                        </Button>
                    </div>
                )}

                {/* History List */}
                {!loading && !error && history.length === 0 && (
                    <div className="bg-black/40 border border-orange-500/40 rounded-lg p-12 text-center">
                        <p className="text-2xl mb-2">🎲</p>
                        <p className="text-cyber-gray font-orbitron">No bets yet</p>
                        <p className="text-sm text-gray-500 mt-2">Place your first bet on a match!</p>
                        <Link href="/spectate">
                            <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-orbitron">
                                Watch Matches
                            </Button>
                        </Link>
                    </div>
                )}

                {!loading && !error && history.length > 0 && (
                    <>
                        <div className="space-y-4">
                            {history.map((bet, index) => {
                                const player1Character = getCharacter(bet.player1CharacterId);
                                const player2Character = getCharacter(bet.player2CharacterId);
                                const betOnPlayer1 = bet.betOn === 'player1';
                                const isWinner = bet.winner === bet.betOn;

                                return (
                                    <motion.div
                                        key={bet.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`bg-black/40 border rounded-lg p-6 ${
                                            bet.status === 'won'
                                                ? 'border-green-500/40 hover:border-green-500'
                                                : bet.status === 'lost'
                                                ? 'border-red-500/40 hover:border-red-500'
                                                : 'border-orange-500/40 hover:border-orange-500'
                                        } transition-all`}
                                    >
                                        {/* Match Type Badge */}
                                        <div className="mb-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-orbitron ${
                                                bet.matchType === 'bot' 
                                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                                                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                                            }`}>
                                                {bet.matchType === 'bot' ? 'BOT MATCH' : 'PLAYER MATCH'}
                                            </span>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Players/Bots */}
                                            <div className="flex items-center gap-4 flex-1">
                                                {/* Player/Bot 1 */}
                                                <div className={`flex-1 text-center ${betOnPlayer1 ? 'opacity-100' : 'opacity-50'}`}>
                                                    <div className="relative w-16 h-16 mx-auto mb-2">
                                                        {player1Character && (
                                                            <img
                                                                src={player1Character.portraitUrl}
                                                                alt={bet.player1Name}
                                                                className={`w-full h-full object-cover rounded-lg border ${
                                                                    betOnPlayer1 ? 'border-orange-500' : 'border-gray-500'
                                                                }`}
                                                            />
                                                        )}
                                                        {betOnPlayer1 && (
                                                            <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full w-6 h-6 flex items-center justify-center">
                                                                <span className="text-white text-xs">★</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-white font-orbitron text-sm">{bet.player1Name}</p>
                                                    {bet.winner === 'player1' && (
                                                        <p className="text-green-400 text-xs mt-1">Winner</p>
                                                    )}
                                                </div>

                                                {/* VS */}
                                                <div className="text-center px-2">
                                                    <div className="text-xl font-bold font-orbitron text-orange-400">VS</div>
                                                </div>

                                                {/* Player/Bot 2 */}
                                                <div className={`flex-1 text-center ${!betOnPlayer1 ? 'opacity-100' : 'opacity-50'}`}>
                                                    <div className="relative w-16 h-16 mx-auto mb-2">
                                                        {player2Character && (
                                                            <img
                                                                src={player2Character.portraitUrl}
                                                                alt={bet.player2Name}
                                                                className={`w-full h-full object-cover rounded-lg border ${
                                                                    !betOnPlayer1 ? 'border-orange-500' : 'border-gray-500'
                                                                }`}
                                                            />
                                                        )}
                                                        {!betOnPlayer1 && (
                                                            <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full w-6 h-6 flex items-center justify-center">
                                                                <span className="text-white text-xs">★</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-white font-orbitron text-sm">{bet.player2Name}</p>
                                                    {bet.winner === 'player2' && (
                                                        <p className="text-green-400 text-xs mt-1">Winner</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bet Details */}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-cyber-gray text-sm">Status:</span>
                                                    <span className={`font-orbitron font-bold ${getStatusColor(bet.status)}`}>
                                                        {getStatusIcon(bet.status)} {bet.status.toUpperCase()}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-cyber-gray text-sm">Bet Amount:</span>
                                                    <span className="text-white font-orbitron">{sompiToKas(bet.amount).toFixed(2)} KAS</span>
                                                </div>

                                                {bet.status === 'won' && bet.payoutAmount && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-cyber-gray text-sm">Payout:</span>
                                                        <span className="text-green-400 font-orbitron font-bold">
                                                            +{sompiToKas(bet.payoutAmount).toFixed(2)} KAS
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <span className="text-cyber-gray text-sm">Date:</span>
                                                    <span className="text-gray-400 text-xs">{formatDate(bet.createdAt)}</span>
                                                </div>

                                                {bet.txId && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-cyber-gray text-sm">TX:</span>
                                                        <a
                                                            href={`${explorerUrl}/txs/${bet.txId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:text-blue-300 text-xs font-mono"
                                                        >
                                                            {truncateTxId(bet.txId)}
                                                        </a>
                                                    </div>
                                                )}

                                                {bet.payoutTxId && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-cyber-gray text-sm">Payout TX:</span>
                                                        <a
                                                            href={`${explorerUrl}/txs/${bet.payoutTxId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-green-400 hover:text-green-300 text-xs font-mono"
                                                        >
                                                            {truncateTxId(bet.payoutTxId)}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <Button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-orbitron"
                            >
                                ← Previous
                            </Button>
                            <span className="text-cyber-gray font-orbitron">
                                Page {page + 1}
                            </span>
                            <Button
                                onClick={() => setPage(p => p + 1)}
                                disabled={!hasMore}
                                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-orbitron"
                            >
                                Next →
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </GameLayout>
    );
}
