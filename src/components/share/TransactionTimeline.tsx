"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { NETWORK_CONFIG, type NetworkType } from "@/types/constants";

export interface TransactionData {
    txId: string;
    moveType: string;
    playerAddress: string;
    roundNumber: number;
    confirmedAt: string | null;
    createdAt: string;
}

interface TransactionTimelineProps {
    transactions: TransactionData[];
    matchCreatedAt: string;
    matchCompletedAt: string | null;
    network?: "mainnet" | "testnet";
}

function detectNetwork(address: string): "mainnet" | "testnet" {
    if (address.startsWith("kaspatest:")) {
        return "testnet";
    }
    return "mainnet";
}

function formatTxId(txId: string): string {
    if (txId.length > 20) {
        return `${txId.substring(0, 10)}...${txId.substring(txId.length - 8)}`;
    }
    return txId;
}

function formatAddress(address: string): string {
    if (address.length > 16) {
        return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`;
    }
    return address;
}

function getMoveIcon(moveType: string): string {
    switch (moveType) {
        case "punch": return "👊";
        case "kick": return "🦵";
        case "block": return "🛡️";
        case "special": return "⚡";
        default: return "🎮";
    }
}

function getMoveColor(moveType: string): string {
    switch (moveType) {
        case "punch": return "text-red-500";
        case "kick": return "text-orange-500";
        case "block": return "text-blue-500";
        case "special": return "text-purple-500";
        default: return "text-gray-500";
    }
}

function getTimeDiff(startTime: string, endTime: string): string {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffMs = end - start;

    if (diffMs < 1000) {
        return `${diffMs}ms`;
    } else if (diffMs < 60000) {
        return `${(diffMs / 1000).toFixed(1)}s`;
    } else {
        const minutes = Math.floor(diffMs / 60000);
        const seconds = ((diffMs % 60000) / 1000).toFixed(0);
        return `${minutes}m ${seconds}s`;
    }
}

function calculateAverageConfirmationTime(transactions: TransactionData[]): string | null {
    const confirmedTxs = transactions.filter(tx => tx.confirmedAt);
    if (confirmedTxs.length === 0) return null;

    const totalMs = confirmedTxs.reduce((sum, tx) => {
        const created = new Date(tx.createdAt).getTime();
        const confirmed = new Date(tx.confirmedAt!).getTime();
        return sum + (confirmed - created);
    }, 0);

    const avgMs = totalMs / confirmedTxs.length;
    if (avgMs < 1000) {
        return `${Math.round(avgMs)}ms`;
    }
    return `${(avgMs / 1000).toFixed(2)}s`;
}

export default function TransactionTimeline({
    transactions,
    matchCreatedAt,
    matchCompletedAt,
    network: propNetwork
}: TransactionTimelineProps) {
    const [expanded, setExpanded] = useState(false);

    // Detect network from player addresses or use provided prop
    const detectedNetwork = propNetwork || (transactions.length > 0
        ? detectNetwork(transactions[0].playerAddress)
        : "mainnet");

    const sortedTxs = [...transactions].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const avgConfirmTime = calculateAverageConfirmationTime(transactions);
    const matchDuration = matchCompletedAt
        ? getTimeDiff(matchCreatedAt, matchCompletedAt)
        : null;

    const displayedTxs = expanded ? sortedTxs : sortedTxs.slice(0, 3);

    const getExplorerUrl = (txId: string) => {
        const network = detectedNetwork as NetworkType;
        return `${NETWORK_CONFIG[network].explorerUrl}/txs/${txId}`;
    };

    if (transactions.length === 0) {
        return (
            <div className="bg-black/40 border border-cyber-gold/20 rounded-xl p-6 backdrop-blur-md max-w-4xl mx-auto">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-cyber-gray">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-mono text-sm">No blockchain transactions recorded for this match</span>
                    </div>
                    <p className="text-cyber-gray/60 text-xs mt-2">
                        This match may have used message signing instead of on-chain transactions
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black/40 border border-cyber-gold/20 rounded-xl p-6 backdrop-blur-md max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyber-gold/10 flex items-center justify-center border border-cyber-gold/20">
                        <svg className="w-5 h-5 text-cyber-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold font-orbitron text-white">
                            BLOCKCHAIN TRANSACTIONS
                        </h3>
                        <p className="text-cyber-gray text-xs font-mono">
                            {transactions.length} moves recorded on Kaspa BlockDAG
                        </p>
                    </div>
                </div>

                {/* Speed Stats */}
                <div className="hidden md:flex items-center gap-4">
                    {avgConfirmTime && (
                        <div className="text-right">
                            <div className="text-xs text-cyber-gray uppercase">Avg Confirmation</div>
                            <div className="text-cyber-gold font-mono font-bold">{avgConfirmTime}</div>
                        </div>
                    )}
                    {matchDuration && (
                        <div className="text-right">
                            <div className="text-xs text-cyber-gray uppercase">Match Duration</div>
                            <div className="text-white font-mono font-bold">{matchDuration}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Kaspa Speed Highlight */}
            <div className="bg-gradient-to-r from-cyber-gold/10 to-transparent border-l-2 border-cyber-gold px-4 py-3 rounded-r mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-cyber-gold text-sm font-bold">⚡ Powered by Kaspa</span>
                    <span className="text-cyber-gray text-xs">
                        — Sub-second block times, instant confirmations, real-time gaming on PoW
                    </span>
                </div>
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
                {displayedTxs.map((tx, index) => (
                    <div
                        key={tx.txId}
                        className="group bg-black/30 border border-white/5 hover:border-cyber-gold/30 rounded-lg p-4 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Timeline Indicator */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm
                                        ${getMoveColor(tx.moveType)} border-current bg-black/50`}>
                                        {getMoveIcon(tx.moveType)}
                                    </div>
                                    {index < displayedTxs.length - 1 && (
                                        <div className="w-px h-6 bg-gradient-to-b from-cyber-gold/30 to-transparent mt-1" />
                                    )}
                                </div>

                                {/* Move Info */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold uppercase text-sm ${getMoveColor(tx.moveType)}`}>
                                            {tx.moveType}
                                        </span>
                                        <span className="text-cyber-gray text-xs">
                                            Round {tx.roundNumber}
                                        </span>
                                    </div>
                                    <div className="text-cyber-gray/60 text-xs font-mono mt-1">
                                        by {formatAddress(tx.playerAddress)}
                                    </div>
                                </div>
                            </div>

                            {/* TX Link */}
                            <div className="flex items-center gap-3">
                                {tx.confirmedAt && (
                                    <div className="hidden sm:flex items-center gap-1 text-green-500 text-xs">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>Confirmed</span>
                                    </div>
                                )}
                                <a
                                    href={getExplorerUrl(tx.txId)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyber-gold/10 hover:bg-cyber-gold/20 border border-cyber-gold/20 text-cyber-gold text-xs font-mono transition-all group-hover:border-cyber-gold/40"
                                >
                                    <span className="hidden sm:inline">{formatTxId(tx.txId)}</span>
                                    <span className="sm:hidden">View</span>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show More/Less Button */}
            {sortedTxs.length > 3 && (
                <div className="mt-4 text-center">
                    <Button
                        variant="ghost"
                        onClick={() => setExpanded(!expanded)}
                        className="text-cyber-gray hover:text-cyber-gold font-mono text-xs"
                    >
                        {expanded
                            ? `Show Less ↑`
                            : `Show All ${sortedTxs.length} Transactions ↓`
                        }
                    </Button>
                </div>
            )}

            {/* Mobile Stats */}
            <div className="md:hidden flex justify-center gap-6 mt-4 pt-4 border-t border-white/5">
                {avgConfirmTime && (
                    <div className="text-center">
                        <div className="text-xs text-cyber-gray uppercase">Avg Confirm</div>
                        <div className="text-cyber-gold font-mono font-bold text-sm">{avgConfirmTime}</div>
                    </div>
                )}
                {matchDuration && (
                    <div className="text-center">
                        <div className="text-xs text-cyber-gray uppercase">Duration</div>
                        <div className="text-white font-mono font-bold text-sm">{matchDuration}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
