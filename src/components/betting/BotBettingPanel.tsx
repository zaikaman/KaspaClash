/**
 * BotBettingPanel Component
 * UI for placing bets on bot matches
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { sendKaspa } from "@/lib/kaspa/wallet";
import {
    kasToSompi,
    sompiToKas,
    formatOdds,
    MIN_BET_SOMPI,
} from "@/lib/betting/betting-service";
import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon, LockKeyIcon, Tick02Icon, Time03Icon } from "@hugeicons/core-free-icons";

// Quick bet amounts in KAS
const QUICK_BETS = [1, 5, 10, 25, 50];

interface BotBettingPanelProps {
    matchId: string;
    bot1Name: string;
    bot2Name: string;
}

interface BettingPoolState {
    isLoading: boolean;
    isOpen: boolean;
    turnsRemaining: number;
    secondsRemaining: number;
    closesAtTurn: number;
    currentTurn: number;
    bot1Odds: number;
    bot2Odds: number;
    bot1Percentage: number;
    bot2Percentage: number;
    totalPool: bigint;
    lockReason?: string;
}

export function BotBettingPanel({ matchId, bot1Name, bot2Name }: BotBettingPanelProps) {
    const { address, isConnected } = useWallet();

    const [poolState, setPoolState] = useState<BettingPoolState>({
        isLoading: true,
        isOpen: true,
        turnsRemaining: 3,
        secondsRemaining: 30,
        closesAtTurn: 3,
        currentTurn: 0,
        bot1Odds: 2.0,
        bot2Odds: 2.0,
        bot1Percentage: 50,
        bot2Percentage: 50,
        totalPool: BigInt(0),
    });

    const [selectedBot, setSelectedBot] = useState<'bot1' | 'bot2' | null>(null);
    const [betAmount, setBetAmount] = useState<string>("1");
    const [isPlacing, setIsPlacing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Fetch pool data
    const fetchPoolData = useCallback(async () => {
        try {
            const response = await fetch(`/api/bot-betting/pool/${encodeURIComponent(matchId)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setPoolState({
                        isLoading: false,
                        isOpen: data.bettingStatus.isOpen,
                        turnsRemaining: data.bettingStatus.turnsRemaining,
                        secondsRemaining: data.bettingStatus.secondsRemaining ?? 0,
                        closesAtTurn: data.bettingStatus.closesAtTurn,
                        currentTurn: data.bettingStatus.currentTurn,
                        bot1Odds: data.odds.bot1Odds,
                        bot2Odds: data.odds.bot2Odds,
                        bot1Percentage: data.odds.bot1Percentage,
                        bot2Percentage: data.odds.bot2Percentage,
                        totalPool: BigInt(data.pool.totalPool),
                        lockReason: data.bettingStatus.reason,
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch betting pool:", err);
            setPoolState(prev => ({ ...prev, isLoading: false }));
        }
    }, [matchId]);

    // Initial fetch and polling
    useEffect(() => {
        fetchPoolData();
        const interval = setInterval(fetchPoolData, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, [fetchPoolData]);

    // Calculate potential winnings
    const potentialPayout = selectedBot ? (() => {
        const amount = parseFloat(betAmount) || 0;
        const odds = selectedBot === 'bot1' ? poolState.bot1Odds : poolState.bot2Odds;
        return amount * odds;
    })() : 0;

    // Vault address
    const isTestnet = address?.startsWith("kaspatest:");
    const vaultAddress = isTestnet
        ? process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET
        : process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET || process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS;

    // Handle placing bet
    const handlePlaceBet = useCallback(async () => {
        if (!selectedBot || !betAmount || !isConnected || !address) {
            setError("Please select a bot and enter amount");
            return;
        }

        if (!vaultAddress) {
            setError("Vault address not configured");
            return;
        }

        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount < 1) {
            setError("Minimum bet is 1 KAS");
            return;
        }

        setIsPlacing(true);
        setError(null);
        setSuccess(null);

        try {
            // Send KAS to vault
            const sompiAmount = Number(kasToSompi(amount));
            const txId = await sendKaspa(
                vaultAddress,
                sompiAmount,
                `botbet:${matchId}:${selectedBot}`
            );

            // Record bet
            const response = await fetch('/api/bot-betting/place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    bettorAddress: address,
                    betOn: selectedBot,
                    amount: kasToSompi(amount).toString(),
                    txId,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setSuccess(`Bet placed! TX: ${txId.slice(0, 12)}...`);
                setBetAmount("1");
                setSelectedBot(null);
                fetchPoolData();
            } else {
                setError(result.error || "Failed to record bet");
            }
        } catch (err) {
            console.error("Error placing bet:", err);
            setError(err instanceof Error ? err.message : "Failed to place bet");
        } finally {
            setIsPlacing(false);
        }
    }, [selectedBot, betAmount, matchId, isConnected, address, vaultAddress, fetchPoolData]);

    // Loading state
    if (poolState.isLoading) {
        return (
            <div className="bg-black/60 backdrop-blur-sm rounded-xl border border-orange-500/30 p-4">
                <div className="text-center text-cyber-gray">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading betting pool...
                </div>
            </div>
        );
    }

    // Pool closed
    if (!poolState.isOpen) {
        return (
            <div className="bg-black/60 backdrop-blur-sm rounded-xl border border-red-500/30 p-4">
                <div className="text-center">
                    <div className="text-red-400 font-orbitron text-sm mb-2 flex items-center justify-center gap-2">
                        <HugeiconsIcon icon={LockKeyIcon} className="w-4 h-4" /> BETTING CLOSED
                    </div>
                    {poolState.lockReason && (
                        <div className="text-xs text-gray-400">{poolState.lockReason}</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 backdrop-blur-sm rounded-xl border border-orange-500/30 p-3 sm:p-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-orange-400 font-orbitron text-xs sm:text-sm font-bold tracking-wider flex items-center gap-2">
                    <HugeiconsIcon icon={Coins01Icon} className="w-4 h-4 sm:w-5 sm:h-5" /> BOT BETTING
                </h3>
                <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Time03Icon} className="w-4 h-4 text-orange-400" />
                    <span className={`text-xs font-mono ${poolState.secondsRemaining <= 5 ? 'text-red-400' : poolState.secondsRemaining <= 10 ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {poolState.secondsRemaining}s remaining
                    </span>
                </div>
            </div>

            {/* Odds Display */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                {/* Bot 1 Odds */}
                <button
                    onClick={() => setSelectedBot('bot1')}
                    className={`relative p-2 sm:p-3 rounded-lg border-2 transition-all ${selectedBot === 'bot1'
                        ? 'border-orange-400 bg-orange-500/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-orange-400/50'
                        }`}
                >
                    <div className="text-xs text-gray-400 mb-1 truncate">🤖 {bot1Name}</div>
                    <div className="text-lg sm:text-xl font-bold text-orange-400 font-orbitron">
                        {formatOdds(poolState.bot1Odds)}
                    </div>
                    <div className="text-xs text-gray-500">{poolState.bot1Percentage}%</div>
                </button>

                {/* Bot 2 Odds */}
                <button
                    onClick={() => setSelectedBot('bot2')}
                    className={`relative p-2 sm:p-3 rounded-lg border-2 transition-all ${selectedBot === 'bot2'
                        ? 'border-cyan-400 bg-cyan-500/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-cyan-400/50'
                        }`}
                >
                    <div className="text-xs text-gray-400 mb-1 truncate">🤖 {bot2Name}</div>
                    <div className="text-lg sm:text-xl font-bold text-cyan-400 font-orbitron">
                        {formatOdds(poolState.bot2Odds)}
                    </div>
                    <div className="text-xs text-gray-500">{poolState.bot2Percentage}%</div>
                </button>
            </div>

            {/* Pool Distribution Bar */}
            <div className="h-2 bg-gray-800 rounded-full mb-4 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-orange-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${poolState.bot1Percentage}%` }}
                />
            </div>

            {/* Bet Amount */}
            <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Bet Amount (KAS)</label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-orbitron focus:border-orange-500 focus:outline-none"
                    />
                </div>

                {/* Quick bets */}
                <div className="flex gap-1 flex-wrap">
                    {QUICK_BETS.map(amount => (
                        <button
                            key={amount}
                            onClick={() => setBetAmount(amount.toString())}
                            className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                        >
                            {amount} KAS
                        </button>
                    ))}
                </div>
            </div>

            {/* Potential Winnings */}
            {selectedBot && potentialPayout > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                    <div className="text-xs text-gray-400 mb-1">Potential Payout</div>
                    <div className="text-lg font-bold text-green-400 font-orbitron">
                        {potentialPayout.toFixed(2)} KAS
                    </div>
                </div>
            )}

            {/* Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-red-400 text-sm mb-3 p-2 bg-red-500/10 rounded"
                    >
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-green-400 text-sm mb-3 p-2 bg-green-500/10 rounded flex items-center gap-2"
                    >
                        <HugeiconsIcon icon={Tick02Icon} className="w-4 h-4" /> {success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Place Bet Button */}
            <Button
                onClick={handlePlaceBet}
                disabled={!isConnected || !selectedBot || isPlacing}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-orbitron hover:opacity-90 disabled:opacity-50"
            >
                {!isConnected ? (
                    "Connect Wallet"
                ) : isPlacing ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Placing Bet...
                    </>
                ) : !selectedBot ? (
                    "Select a Bot"
                ) : (
                    `Bet ${betAmount} KAS on ${selectedBot === 'bot1' ? bot1Name : bot2Name}`
                )}
            </Button>

            <div className="text-center text-xs text-gray-500 mt-2">
                0.1% fee applies
            </div>
        </motion.div>
    );
}
