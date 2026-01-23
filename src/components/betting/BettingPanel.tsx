/**
 * BettingPanel Component
 * UI for placing bets on matches during spectating
 */

"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useBettingPool } from "@/hooks/useBettingPool";
import { useWallet } from "@/hooks/useWallet";
import { sendKaspa } from "@/lib/kaspa/wallet";
import {
    kasToSompi,
    sompiToKas,
    formatOdds,
    calculatePotentialWinnings,
    MIN_BET_SOMPI,
} from "@/lib/betting/betting-service";
import { HugeiconsIcon } from "@hugeicons/react";
import { LockKeyIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { ClashShardsIcon } from "@/components/currency/ClashShardsIcon";

// =============================================================================
// CONSTANTS
// =============================================================================

// Vault address for holding bets (resolved dynamically based on network)

// Quick bet amounts in KAS
const QUICK_BETS = [1, 5, 10, 25, 50, 100];

// =============================================================================
// COMPONENT
// =============================================================================

interface BettingPanelProps {
    matchId: string;
    player1Name: string;
    player2Name: string;
}

export function BettingPanel({ matchId, player1Name, player2Name }: BettingPanelProps) {
    const { address, isConnected } = useWallet();
    const { state: poolState, placeBet, refresh } = useBettingPool(matchId, address || undefined);

    const [selectedPlayer, setSelectedPlayer] = useState<'player1' | 'player2' | null>(null);
    const [betAmount, setBetAmount] = useState<string>("1");
    const [isPlacing, setIsPlacing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Calculate potential winnings
    const potentialWinnings = selectedPlayer && poolState.pool ?
        calculatePotentialWinnings(
            {
                id: poolState.pool.id,
                matchId: poolState.pool.matchId,
                player1Total: BigInt(poolState.pool.player1Total),
                player2Total: BigInt(poolState.pool.player2Total),
                totalPool: BigInt(poolState.pool.totalPool),
                totalFees: BigInt(0),
                status: poolState.pool.status as any,
            },
            selectedPlayer,
            kasToSompi(parseFloat(betAmount) || 0)
        ) : null;

    // Determine vault address based on network
    const isTestnet = address?.startsWith("kaspatest:");
    const vaultAddress = isTestnet
        ? process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET
        : process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET || process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS;

    // Handle placing bet
    const handlePlaceBet = useCallback(async () => {
        if (!selectedPlayer || !betAmount || !isConnected || !address) {
            setError("Please select a player and enter amount");
            return;
        }

        if (!vaultAddress) {
            setError("Vault address not configured for this network");
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
                `bet:${matchId}:${selectedPlayer}`
            );

            console.log("[BettingPanel] Transaction sent:", txId);

            // Record bet in database
            const success = await placeBet(
                selectedPlayer,
                kasToSompi(amount).toString(),
                txId
            );

            if (success) {
                setSuccess(`Bet placed! TX: ${txId.slice(0, 12)}...`);
                setBetAmount("1");
                setSelectedPlayer(null);
            } else {
                setError("Failed to record bet");
            }
        } catch (err) {
            console.error("[BettingPanel] Error:", err);
            setError(err instanceof Error ? err.message : "Failed to place bet");
        } finally {
            setIsPlacing(false);
        }
    }, [selectedPlayer, betAmount, matchId, isConnected, address, placeBet, vaultAddress]);

    // Loading state
    if (poolState.isLoading) {
        return (
            <div className="bg-black/60 backdrop-blur-sm rounded-xl border border-cyber-gold/30 p-4">
                <div className="text-center text-cyber-gray">
                    <div className="w-6 h-6 border-2 border-cyber-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
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
                        <div className="text-xs text-gray-400">
                            {poolState.lockReason}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 backdrop-blur-sm rounded-xl border border-cyber-gold/30 p-3 sm:p-4"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-cyber-gold font-orbitron text-xs sm:text-sm font-bold tracking-wider flex items-center gap-2">
                    <ClashShardsIcon className="w-4 h-4 sm:w-5 sm:h-5" /> LIVE BETTING
                </h3>
                <span className="text-xs text-gray-400">
                    Pool: {poolState.pool?.totalPoolKas.toFixed(2)} KAS
                </span>
            </div>

            {/* Odds Display */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                {/* Player 1 Odds */}
                <button
                    onClick={() => setSelectedPlayer('player1')}
                    className={`relative p-2 sm:p-3 rounded-lg border-2 transition-all ${selectedPlayer === 'player1'
                        ? 'border-cyber-gold bg-cyber-gold/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-cyber-gold/50'
                        }`}
                >
                    <div className="text-xs text-gray-400 mb-1 truncate">{player1Name}</div>
                    <div className="text-lg sm:text-xl font-bold text-cyber-gold font-orbitron">
                        {formatOdds(poolState.odds.player1)}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                        {poolState.odds.player1Percentage}% of pool
                    </div>
                    {selectedPlayer === 'player1' && (
                        <motion.div
                            layoutId="selected"
                            className="absolute inset-0 border-2 border-cyber-gold rounded-lg"
                        />
                    )}
                </button>

                {/* Player 2 Odds */}
                <button
                    onClick={() => setSelectedPlayer('player2')}
                    className={`relative p-2 sm:p-3 rounded-lg border-2 transition-all ${selectedPlayer === 'player2'
                        ? 'border-cyber-orange bg-cyber-orange/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-cyber-orange/50'
                        }`}
                >
                    <div className="text-xs text-gray-400 mb-1 truncate">{player2Name}</div>
                    <div className="text-lg sm:text-xl font-bold text-cyber-orange font-orbitron">
                        {formatOdds(poolState.odds.player2)}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                        {poolState.odds.player2Percentage}% of pool
                    </div>
                    {selectedPlayer === 'player2' && (
                        <motion.div
                            layoutId="selected"
                            className="absolute inset-0 border-2 border-cyber-orange rounded-lg"
                        />
                    )}
                </button>
            </div>

            {/* Pool Distribution Bar */}
            <div className="h-2 bg-gray-800 rounded-full mb-4 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-cyber-gold to-cyber-orange transition-all duration-500"
                    style={{ width: `${poolState.odds.player1Percentage}%` }}
                />
            </div>

            {/* Bet Amount Input */}
            <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Bet Amount (KAS)</label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-orbitron focus:border-cyber-gold focus:outline-none"
                        placeholder="Amount in KAS"
                    />
                </div>

                {/* Quick bet buttons */}
                <div className="flex gap-1 flex-wrap">
                    {QUICK_BETS.map(amount => (
                        <button
                            key={amount}
                            onClick={() => setBetAmount(amount.toString())}
                            className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                        >
                            {amount} KAS
                        </button>
                    ))}
                </div>
            </div>

            {/* Potential Winnings */}
            {potentialWinnings && selectedPlayer && (
                <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                    <div className="text-xs text-gray-400 mb-1">Potential Payout</div>
                    <div className="text-lg font-bold text-green-400 font-orbitron">
                        {sompiToKas(potentialWinnings.payout).toFixed(2)} KAS
                    </div>
                    <div className="text-xs text-gray-500">
                        Profit: +{sompiToKas(potentialWinnings.profit).toFixed(2)} KAS ({formatOdds(potentialWinnings.odds)})
                    </div>
                </div>
            )}

            {/* Error/Success Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-400 text-sm mb-3 p-2 bg-red-500/10 rounded"
                    >
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-green-400 text-sm mb-3 p-2 bg-green-500/10 rounded flex items-center gap-2"
                    >
                        <HugeiconsIcon icon={Tick02Icon} className="w-4 h-4" /> {success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Place Bet Button */}
            <Button
                onClick={handlePlaceBet}
                disabled={!isConnected || !selectedPlayer || isPlacing}
                className="w-full bg-gradient-cyber text-white font-orbitron hover:opacity-90 disabled:opacity-50"
            >
                {!isConnected ? (
                    "Connect Wallet"
                ) : isPlacing ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Placing Bet...
                    </>
                ) : !selectedPlayer ? (
                    "Select a Player"
                ) : (
                    `Bet ${betAmount} KAS on ${selectedPlayer === 'player1' ? player1Name : player2Name}`
                )}
            </Button>

            {/* Fee Notice */}
            <div className="text-center text-xs text-gray-500 mt-2">
                0.1% fee applies to all bets
            </div>
        </motion.div>
    );
}
