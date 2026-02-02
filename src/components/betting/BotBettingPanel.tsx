/**
 * BotBettingPanel Component - HOUSE MODEL
 * Simplified betting with fixed 2x odds and 1% fee
 * Players bet against the house, not each other
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { sendKaspa } from "@/lib/kaspa/wallet";
import { kasToSompi } from "@/lib/betting/betting-service";
import { HugeiconsIcon } from "@hugeicons/react";
import { LockKeyIcon, Tick02Icon, Time03Icon, RoboticIcon, BankIcon, AlertCircleIcon } from "@hugeicons/core-free-icons";
import { ClashShardsIcon } from "@/components/currency/ClashShardsIcon";
import { EventBus } from "@/game/EventBus";

// House betting constants
const HOUSE_ODDS = 2.0; // Fixed 2x payout
const HOUSE_FEE_PERCENT = 1; // 1% fee

// Quick bet amounts in KAS
const QUICK_BETS = [1, 5, 10, 25, 50];

// Vault balance interface
interface VaultBalanceInfo {
    balanceKAS: number;
    network: "mainnet" | "testnet";
    isLoading: boolean;
    error: string | null;
}

interface BotBettingPanelProps {
    matchId: string;
    bot1Name: string;
    bot2Name: string;
    onBettingStatusChange?: (isOpen: boolean) => void;
}

interface BettingStatus {
    isOpen: boolean;
    secondsRemaining: number;
    reason?: string;
}

export function BotBettingPanel({ matchId, bot1Name, bot2Name, onBettingStatusChange }: BotBettingPanelProps) {
    const { address, isConnected, balance, network } = useWallet();

    const [bettingStatus, setBettingStatus] = useState<BettingStatus>({
        isOpen: true,
        secondsRemaining: 30,
    });
    const [isLoading, setIsLoading] = useState(true);

    const [selectedBot, setSelectedBot] = useState<'bot1' | 'bot2' | null>(null);
    const [betAmount, setBetAmount] = useState<string>("1");
    const [isPlacing, setIsPlacing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Vault balance state
    const [vaultBalance, setVaultBalance] = useState<VaultBalanceInfo>({
        balanceKAS: 0,
        network: "testnet",
        isLoading: true,
        error: null,
    });

    // Fetch vault balance
    const fetchVaultBalance = useCallback(async () => {
        // Determine network from address or wallet
        const isTestnet = address?.startsWith("kaspatest:");
        const networkType = isTestnet ? "testnet" : (network || "testnet");
        
        try {
            const response = await fetch(`/api/treasury/balance?network=${networkType}`);
            if (response.ok) {
                const data = await response.json();
                setVaultBalance({
                    balanceKAS: data.balanceKAS || 0,
                    network: data.network || networkType,
                    isLoading: false,
                    error: null,
                });
            } else {
                setVaultBalance(prev => ({
                    ...prev,
                    isLoading: false,
                    error: "Failed to fetch vault balance",
                }));
            }
        } catch (err) {
            console.error("Failed to fetch vault balance:", err);
            setVaultBalance(prev => ({
                ...prev,
                isLoading: false,
                error: "Failed to fetch vault balance",
            }));
        }
    }, [address, network]);

    // Fetch vault balance on mount and periodically
    useEffect(() => {
        fetchVaultBalance();
        // Refresh every 30 seconds
        const interval = setInterval(fetchVaultBalance, 30000);
        return () => clearInterval(interval);
    }, [fetchVaultBalance]);

    // Fetch betting status
    const fetchBettingStatus = useCallback(async () => {
        try {
            const response = await fetch(`/api/bot-betting/pool/${encodeURIComponent(matchId)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setBettingStatus({
                        isOpen: data.bettingStatus.isOpen,
                        secondsRemaining: data.bettingStatus.secondsRemaining ?? 0,
                        reason: data.bettingStatus.reason,
                    });

                    if (onBettingStatusChange) {
                        onBettingStatusChange(data.bettingStatus.isOpen && (data.bettingStatus.secondsRemaining ?? 0) > 0);
                    }

                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Failed to fetch betting status:", err);
            setIsLoading(false);
        }
    }, [matchId]);

    // Initial fetch and polling
    useEffect(() => {
        fetchBettingStatus();
        const interval = setInterval(fetchBettingStatus, 1000); // Poll every 1s for countdown
        return () => clearInterval(interval);
    }, [fetchBettingStatus]);

    // Listen for match end to trigger payout
    useEffect(() => {
        const handleMatchEnd = async (data: unknown) => {
            const eventData = data as { matchId: string; winner: "player1" | "player2" };
            if (eventData.matchId === matchId) {
                console.log("[BotBettingPanel] Match ended, processing payouts for match:", matchId);

                // Add small delay to ensure database operations complete
                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    // Trigger payout - same as player matches do it
                    const response = await fetch(`/api/bot-betting/payout/${matchId}`, {
                        method: 'POST',
                    });
                    const result = await response.json();
                    if (result.success) {
                        console.log("[BotBettingPanel] Payouts processed successfully:", result);
                    } else {
                        console.error("[BotBettingPanel] Payout failed:", result.error);
                    }
                } catch (err) {
                    console.error("[BotBettingPanel] Error processing payout:", err);
                }
            }
        };

        EventBus.on("bot_battle_match_end", handleMatchEnd);
        return () => {
            EventBus.off("bot_battle_match_end", handleMatchEnd);
        };
    }, [matchId]);

    // Calculate fee and total to send
    // Fee is 1% ON TOP of the bet, payout is 2x the bet amount
    const betAmountNum = parseFloat(betAmount) || 0;
    const fee = betAmountNum * (HOUSE_FEE_PERCENT / 100);
    const totalToSend = betAmountNum + fee;
    const potentialPayout = betAmountNum * HOUSE_ODDS; // 2x the bet, not the fee

    // Check if house can afford the payout
    const canHouseAfford = vaultBalance.balanceKAS >= potentialPayout;
    const maxAffordableBet = vaultBalance.balanceKAS / HOUSE_ODDS; // Maximum bet the house can cover

    // Vault address
    const isTestnet = address?.startsWith("kaspatest:");
    const vaultAddress = isTestnet
        ? process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET
        : process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET || process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS;

    // Handle placing bet
    const handlePlaceBet = useCallback(async () => {
        // Check if betting is still open
        if (!bettingStatus.isOpen || bettingStatus.secondsRemaining <= 0) {
            setError("Betting is closed for this match");
            return;
        }

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

        // Check if house can afford the potential payout
        const payout = amount * HOUSE_ODDS;
        if (!vaultBalance.isLoading && payout > vaultBalance.balanceKAS) {
            setError(`Bet too large! House can only cover ${maxAffordableBet.toFixed(2)} KAS max bet`);
            return;
        }

        // Calculate total to send (bet + 1% fee)
        const feeAmount = amount * (HOUSE_FEE_PERCENT / 100);
        const totalAmount = amount + feeAmount;

        setIsPlacing(true);
        setError(null);
        setSuccess(null);

        try {
            // Send bet + fee to vault
            const sompiAmount = Number(kasToSompi(totalAmount));
            const txId = await sendKaspa(
                vaultAddress,
                sompiAmount,
                `botbet:${matchId}:${selectedBot}:${amount}`
            );

            console.log("[BotBettingPanel] Transaction ID received:", txId);
            console.log("[BotBettingPanel] Transaction ID type:", typeof txId);

            // Record bet
            const response = await fetch('/api/bot-betting/place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    bettorAddress: address,
                    betOn: selectedBot,
                    amount: kasToSompi(amount).toString(),
                    txId: String(txId), // Ensure it's a string
                }),
            });

            const result = await response.json();

            if (result.success) {
                setSuccess(`Bet placed! TX: ${txId.slice(0, 12)}...`);
                setBetAmount("1");
                setSelectedBot(null);
            } else {
                // Better error messages
                if (result.error === "Bot match not found") {
                    setError("This match is no longer accepting bets");
                } else {
                    setError(result.error || "Failed to record bet");
                }
            }
        } catch (err) {
            console.error("Error placing bet:", err);
            setError(err instanceof Error ? err.message : "Failed to place bet");
        } finally {
            setIsPlacing(false);
        }
    }, [selectedBot, betAmount, matchId, isConnected, address, vaultAddress, bettingStatus, vaultBalance, maxAffordableBet]);

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-black/60 backdrop-blur-sm rounded-xl border border-orange-500/30 p-4">
                <div className="text-center text-cyber-gray">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading...
                </div>
            </div>
        );
    }

    // Betting closed - check both isOpen AND secondsRemaining as safeguard
    if (!bettingStatus.isOpen || bettingStatus.secondsRemaining <= 0) {
        return (
            <div className="bg-black/60 backdrop-blur-sm rounded-xl border border-gray-600/30 p-4">
                <div className="text-center">
                    <div className="text-red-400 font-orbitron text-sm mb-2 flex items-center justify-center gap-2">
                        <HugeiconsIcon icon={LockKeyIcon} className="w-4 h-4" /> BETTING CLOSED
                    </div>
                    {bettingStatus.reason && (
                        <div className="text-xs text-gray-400">{bettingStatus.reason}</div>
                    )}
                    <div className="mt-3 text-xs text-gray-500">
                        Wait for the next match to place bets
                    </div>
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
                    <ClashShardsIcon className="w-4 h-4 sm:w-5 sm:h-5" /> BOT BETTING
                </h3>
                <div className="flex items-center gap-2">
                    {isConnected && balance && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyber-gold/10 border border-cyber-gold/30">
                            <svg className="w-3 h-3 text-cyber-gold" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                            </svg>
                            <span className="text-cyber-gold font-orbitron text-xs font-bold">{balance}</span>
                        </div>
                    )}
                    <HugeiconsIcon icon={Time03Icon} className="w-4 h-4 text-orange-400" />
                    <span className={`text-xs font-mono font-bold ${bettingStatus.secondsRemaining <= 5 ? 'text-red-400' : bettingStatus.secondsRemaining <= 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {bettingStatus.secondsRemaining}s
                    </span>
                </div>
            </div>

            {/* House Model Badge */}
            <div className="mb-4 p-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/30">
                <div className="text-center">
                    <div className="text-yellow-400 font-orbitron text-lg font-bold">2x PAYOUT</div>
                    <div className="text-xs text-gray-400">Fixed odds • 1% fee • Win double your bet!</div>
                </div>
            </div>

            {/* House Vault Balance Display */}
            <div className="mb-4 p-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg border border-purple-500/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={BankIcon} className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-400">House Balance</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {vaultBalance.isLoading ? (
                            <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        ) : vaultBalance.error ? (
                            <span className="text-xs text-red-400">Error</span>
                        ) : (
                            <>
                                <span className="text-purple-400 font-orbitron text-sm font-bold">
                                    {vaultBalance.balanceKAS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KAS
                                </span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${vaultBalance.network === "mainnet" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                                    {vaultBalance.network === "mainnet" ? "Mainnet" : "Testnet"}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="mt-1 text-center">
                    <span className="text-xs text-gray-500">
                        Max bet: <span className="text-purple-300 font-mono">{maxAffordableBet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KAS</span>
                    </span>
                </div>
            </div>

            {/* Bet exceeds vault warning */}
            <AnimatePresence>
                {selectedBot && betAmountNum > 0 && !canHouseAfford && !vaultBalance.isLoading && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-2 bg-red-500/10 rounded-lg border border-red-500/40 overflow-hidden"
                    >
                        <div className="flex items-start gap-2">
                            <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <div className="text-red-400 text-xs font-bold">Bet Too Large!</div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                    The house can&apos;t afford to pay {potentialPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KAS. 
                                    Max bet: <span className="text-red-300 font-mono">{maxAffordableBet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KAS</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bot Selection */}
            <div className="grid grid-cols-2 xs:grid-cols-2 gap-2 sm:gap-3 mb-4">
                {/* Bot 1 */}
                <button
                    onClick={() => setSelectedBot('bot1')}
                    className={`relative p-2 sm:p-3 rounded-lg border-2 transition-all ${selectedBot === 'bot1'
                        ? 'border-orange-400 bg-orange-500/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-orange-400/50'
                        }`}
                >
                    <div className="text-xs text-gray-400 mb-1 truncate flex items-center justify-center gap-1">
                        <HugeiconsIcon icon={RoboticIcon} className="w-3 h-3" /> {bot1Name}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-orange-400 font-orbitron">
                        2.00x
                    </div>
                    <div className="text-xs text-gray-500">Win double!</div>
                </button>

                {/* Bot 2 */}
                <button
                    onClick={() => setSelectedBot('bot2')}
                    className={`relative p-2 sm:p-3 rounded-lg border-2 transition-all ${selectedBot === 'bot2'
                        ? 'border-cyan-400 bg-cyan-500/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-cyan-400/50'
                        }`}
                >
                    <div className="text-xs text-gray-400 mb-1 truncate flex items-center justify-center gap-1">
                        <HugeiconsIcon icon={RoboticIcon} className="w-3 h-3" /> {bot2Name}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-cyan-400 font-orbitron">
                        2.00x
                    </div>
                    <div className="text-xs text-gray-500">Win double!</div>
                </button>
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
            {selectedBot && betAmountNum > 0 && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-3 mb-4 border border-green-500/30">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-xs text-gray-400 mb-1">If you win</div>
                            <div className="text-xl font-bold text-green-400 font-orbitron">
                                {potentialPayout.toFixed(2)} KAS
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500">You send</div>
                            <div className="text-xs text-orange-400 font-mono">
                                {totalToSend.toFixed(2)} KAS
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                ({betAmountNum} + {fee.toFixed(2)} fee)
                            </div>
                        </div>
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
                disabled={!isConnected || !selectedBot || isPlacing || (!vaultBalance.isLoading && !canHouseAfford && betAmountNum > 0)}
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
                ) : !canHouseAfford && betAmountNum > 0 && !vaultBalance.isLoading ? (
                    "Bet Exceeds House Limit"
                ) : (
                    `Bet ${betAmount} KAS on ${selectedBot === 'bot1' ? bot1Name : bot2Name}`
                )}
            </Button>

            <div className="text-center text-xs text-gray-500 mt-2">
                House betting • Fixed 2x payout • 1% fee
            </div>
        </motion.div>
    );
}
