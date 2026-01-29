"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from "@/components/ui/Pagination";
import type { LeaderboardEntry, LeaderboardResponse } from "@/lib/leaderboard/service";
import { useWalletStore } from "@/stores/wallet-store";

const PAGE_SIZE = 50;

import { formatAddress } from "@/lib/utils";

/**
 * Get prestige badge styling based on level.
 */
function getPrestigeBadge(prestigeLevel: number): { color: string; label: string; glow: string } | null {
    if (prestigeLevel === 0) return null;

    if (prestigeLevel >= 10) {
        return { color: "text-cyan-300", label: `P${prestigeLevel}`, glow: "drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]" };
    } else if (prestigeLevel >= 7) {
        return { color: "text-purple-400", label: `P${prestigeLevel}`, glow: "drop-shadow-[0_0_6px_rgba(192,132,252,0.7)]" };
    } else if (prestigeLevel >= 5) {
        return { color: "text-yellow-400", label: `P${prestigeLevel}`, glow: "drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]" };
    } else if (prestigeLevel >= 3) {
        return { color: "text-gray-300", label: `P${prestigeLevel}`, glow: "drop-shadow-[0_0_4px_rgba(209,213,219,0.6)]" };
    } else {
        return { color: "text-amber-600", label: `P${prestigeLevel}`, glow: "drop-shadow-[0_0_4px_rgba(217,119,6,0.5)]" };
    }
}

export default function LeaderboardTable() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const network = useWalletStore((state) => state.network);

    useEffect(() => {
        const abortController = new AbortController();

        async function fetchLeaderboard() {
            try {
                setLoading(true);
                setError(null);

                const offset = (currentPage - 1) * PAGE_SIZE;

                // Build URL with network parameter if available
                const params = new URLSearchParams({
                    limit: PAGE_SIZE.toString(),
                    offset: offset.toString(),
                    sortBy: "rating",
                });
                if (network) {
                    params.set("network", network);
                }
                const response = await fetch(`/api/leaderboard?${params.toString()}`, {
                    signal: abortController.signal
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch leaderboard");
                }
                const data: LeaderboardResponse = await response.json();
                setEntries(data.entries);
                setTotalEntries(data.total);
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                console.error("Leaderboard fetch error:", err);
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        }
        fetchLeaderboard();

        return () => {
            abortController.abort();
        };
    }, [network, currentPage]);

    // Reset page when network changes
    useEffect(() => {
        setCurrentPage(1);
    }, [network]);

    const scrollToTable = () => {
        // Optional: Scroll to top of table on page change if needed
        // document.getElementById('leaderboard-table')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        scrollToTable();
    };

    const totalPages = Math.ceil(totalEntries / PAGE_SIZE);

    if (loading && entries.length === 0) {
        return (
            <div className="w-full bg-black/40 border border-cyber-gold/20 rounded-2xl overflow-hidden backdrop-blur-md p-12">
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-4 border-cyber-gold/30 border-t-cyber-gold rounded-full animate-spin"></div>
                    <p className="text-cyber-gray font-orbitron">Loading leaderboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full bg-black/40 border border-red-500/20 rounded-2xl overflow-hidden backdrop-blur-md p-12">
                <div className="flex flex-col items-center justify-center gap-4">
                    <p className="text-red-400 font-orbitron">Error loading leaderboard</p>
                    <p className="text-cyber-gray text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="w-full bg-black/40 border border-cyber-gold/20 rounded-2xl overflow-hidden backdrop-blur-md p-12">
                <div className="flex flex-col items-center justify-center gap-4">
                    <p className="text-cyber-gray font-orbitron">No fighters yet</p>
                    <p className="text-cyber-gray/60 text-sm">Be the first to claim glory!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className={`w-full bg-black/40 border border-cyber-gold/20 rounded-2xl overflow-hidden backdrop-blur-md relative ${loading ? 'opacity-70 pointer-events-none' : ''}`}>

                {/* Overlay loading spinner when paginating */}
                {loading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="w-10 h-10 border-4 border-cyber-gold/30 border-t-cyber-gold rounded-full animate-spin"></div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-cyber-gold/10 border-b border-cyber-gold/20">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[80px] sm:w-[100px] text-cyber-gold font-orbitron font-bold text-xs sm:text-sm">RANK</TableHead>
                                <TableHead className="text-white font-orbitron text-xs sm:text-sm min-w-[150px]">PLAYER</TableHead>
                                <TableHead className="text-right text-white font-orbitron text-xs sm:text-sm">WINS</TableHead>
                                <TableHead className="text-right text-white font-orbitron text-xs sm:text-sm">LOSSES</TableHead>
                                <TableHead className="text-right text-cyber-orange font-orbitron font-bold text-xs sm:text-sm">RATING</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((player) => (
                                <TableRow
                                    key={player.address}
                                    className="border-b border-white/5 hover:bg-cyber-gold/5 transition-colors group"
                                >
                                    <TableCell className="font-bold font-orbitron text-base sm:text-lg">
                                        {player.rank === 1 && <span className="text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">#1</span>}
                                        {player.rank === 2 && <span className="text-[#C0C0C0] drop-shadow-[0_0_10px_rgba(192,192,192,0.5)]">#2</span>}
                                        {player.rank === 3 && <span className="text-[#CD7F32] drop-shadow-[0_0_10px_rgba(205,127,50,0.5)]">#3</span>}
                                        {player.rank > 3 && <span className="text-cyber-gray">#{player.rank}</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/player/${player.address}`}
                                            className="flex items-center gap-2 sm:gap-3 group/player hover:text-cyber-gold transition-colors"
                                        >
                                            {player.avatarUrl && (
                                                <Image
                                                    src={player.avatarUrl}
                                                    alt={`${player.displayName || 'Player'} avatar`}
                                                    width={36}
                                                    height={36}
                                                    className="rounded-full border-2 border-cyber-gold/30 group-hover/player:border-cyber-gold w-8 h-8 sm:w-9 sm:h-9"
                                                />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-white font-orbitron font-medium group-hover/player:text-cyber-gold transition-colors text-sm sm:text-base truncate">
                                                        {player.displayName || formatAddress(player.address)}
                                                    </p>
                                                    {(() => {
                                                        const badge = getPrestigeBadge(player.prestigeLevel);
                                                        if (!badge) return null;
                                                        return (
                                                            <span
                                                                className={`${badge.color} ${badge.glow} font-orbitron text-xs font-bold px-1.5 py-0.5 bg-black/50 rounded border border-current`}
                                                                title={`Prestige Level ${player.prestigeLevel}`}
                                                            >
                                                                {badge.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                {player.displayName && (
                                                    <p className="text-cyber-gray text-xs group-hover/player:text-cyber-gold/70 font-mono truncate">
                                                        {formatAddress(player.address)}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right font-orbitron text-emerald-400 font-medium text-sm sm:text-base">
                                        {player.wins}
                                    </TableCell>
                                    <TableCell className="text-right font-orbitron text-red-400 font-medium text-sm sm:text-base">
                                        {player.losses}
                                    </TableCell>
                                    <TableCell className="text-right font-orbitron font-bold text-cyber-orange text-base sm:text-lg">
                                        {Math.round(player.rating)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={loading}
            />
        </div>
    );
}
