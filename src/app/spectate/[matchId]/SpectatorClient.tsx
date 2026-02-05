/**
 * Spectator Client Component
 * Read-only client for watching matches - no move submission or character selection
 */

"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSpectatorChannel } from "@/hooks/useSpectatorChannel";
import { useMatchStore, useMatchActions } from "@/stores/match-store";
import { EventBus } from "@/game/EventBus";
import { BettingPanel } from "@/components/betting/BettingPanel";
import { SpectatorChat } from "@/components/spectate/SpectatorChat";
import { WinningNotification } from "@/components/betting/WinningNotification";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { sompiToKas } from "@/lib/betting/betting-service";
import type { Match } from "@/types";

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(
    () => import("@/game/PhaserGame").then((mod) => mod.PhaserGame),
    { ssr: false }
);

/**
 * Spectator client props.
 */
interface SpectatorClientProps {
    match: Match & {
        player1?: {
            address: string;
            display_name: string | null;
            rating: number;
        };
        player2?: {
            address: string;
            display_name: string | null;
            rating: number;
        };
    };
}

/**
 * Determine which scene to start based on match status.
 */
function getInitialScene(match: SpectatorClientProps["match"]): "CharacterSelectScene" | "FightScene" | "ResultsScene" {
    if (match.status === "completed") {
        return "ResultsScene";
    }
    // If match is in_progress and both characters are selected, go directly to FightScene
    if (match.status === "in_progress" && match.player1CharacterId && match.player2CharacterId) {
        return "FightScene";
    }
    // Otherwise, start with character selection (spectate mode)
    return "CharacterSelectScene";
}

/**
 * Spectator client component.
 */
export function SpectatorClient({ match }: SpectatorClientProps) {
    const { address, refreshBalance } = useWallet();
    const matchActions = useMatchActions();
    const [gameReady, setGameReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const matchIdRef = useRef(match.id);
    // Winning notification state
    const [winningNotification, setWinningNotification] = useState<{
        show: boolean;
        amount: number;
        prediction: "player1" | "player2";
        winnerName: string;
    } | null>(null);

    // Match cancelled notification state
    const [showCancelledNotification, setShowCancelledNotification] = useState(false);
    const [cancelledBetAmount, setCancelledBetAmount] = useState<number | null>(null);

    // Real-time balance polling
    useEffect(() => {
        if (address && refreshBalance) {
            // Initial fetch
            refreshBalance();
            // Poll every 10 seconds
            const interval = setInterval(refreshBalance, 10000);
            return () => clearInterval(interval);
        }
    }, [address, refreshBalance]);

    // Keep ref in sync
    useEffect(() => {
        matchIdRef.current = match.id;
    }, [match.id]);

    // Determine which scene to start
    const initialScene = getInitialScene(match);

    // Set up spectator channel subscription (read-only)
    const { state: channelState } = useSpectatorChannel({
        matchId: match.id,
        onMatchEnded: async (payload) => {
            console.log("[SpectatorClient] Match ended from channel:", payload);
            // We now handle the win check in game:matchEnded EventBus listener for better sync with the Phaser scene
        },
        onMatchCancelled: async (payload) => {
            console.log("[SpectatorClient] Match cancelled:", payload);

            // Fetch user's bet information to show personalized refund message
            let userBet = null;
            try {
                const walletStr = localStorage.getItem("kaspa_wallet");
                if (walletStr) {
                    const wallet = JSON.parse(walletStr);
                    console.log("[SpectatorClient] Fetching bet info for:", wallet.address);
                    const betResponse = await fetch(`/api/betting/pool/${match.id}`);
                    if (betResponse.ok) {
                        const betData = await betResponse.json();
                        console.log("[SpectatorClient] Bet data:", betData);
                        const foundBet = betData.data?.bets?.find(
                            (b: any) => b.bettor_address === wallet.address
                        );

                        if (foundBet) {
                            userBet = {
                                amount: foundBet.amount,
                                prediction: foundBet.predicted_winner,
                            };
                            console.log("[SpectatorClient] Found user bet:", userBet);
                            // Set bet amount for notification
                            setCancelledBetAmount(sompiToKas(BigInt(foundBet.amount)));
                        } else {
                            console.log("[SpectatorClient] No bet found for user");
                        }
                    }
                }
            } catch (error) {
                console.error("[SpectatorClient] Error fetching bet info:", error);
            }

            // Show cancellation notification
            setShowCancelledNotification(true);

            // Always emit with or without bet info
            const enhancedPayload = {
                ...payload,
                userBet,
            };
            console.log("[SpectatorClient] Emitting game:matchCancelled with:", enhancedPayload);
            EventBus.emit("game:matchCancelled", enhancedPayload);
        },
    });

    // Fetch current game state for reconnecting spectators
    useEffect(() => {
        const fetchGameState = async () => {
            if (match.status !== "in_progress") {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch current round state for spectators
                const response = await fetch(`/api/matches/${match.id}/rounds`);
                if (response.ok) {
                    const data = await response.json();
                    console.log("[SpectatorClient] Fetched game state:", data);

                    // Emit state sync to Phaser
                    if (data.gameState) {
                        EventBus.emit("game:stateSync", data.gameState);
                    }
                }
            } catch (error) {
                console.error("[SpectatorClient] Error fetching game state:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGameState();
    }, [match.id, match.status]);

    // Initialize match store (spectator mode - we observe both players)
    useEffect(() => {
        if (match) {
            // Initialize with player1 role for spectator (just for state tracking)
            matchActions.initMatch(match as Match, "player1");

            // If match is completed, show results
            if (match.status === "completed") {
                const winnerRole = match.winnerAddress === match.player1Address ? "player1" :
                    match.winnerAddress === match.player2Address ? "player2" : null;

                matchActions.endMatch({
                    winner: winnerRole,
                    reason: (match as any).endReason || "rounds_won",
                    player1FinalHealth: 0,
                    player2FinalHealth: 0,
                    player1RoundsWon: match.player1RoundsWon,
                    player2RoundsWon: match.player2RoundsWon,
                    txIds: [],
                });
            }
        }
    }, [match, matchActions]);

    // Listen for game events
    useEffect(() => {
        const handleSceneReady = () => {
            setGameReady(true);
        };

        EventBus.on("scene:ready", handleSceneReady);

        // Listen for match end to check if user won
        const handleMatchEnd = async (data: unknown) => {
            const eventData = data as { matchId: string; winner: "player1" | "player2"; winnerAddress: string | null };
            console.log("[SpectatorClient] Match ended event received:", eventData);
            console.log("[SpectatorClient] Current match ID:", match.id);
            console.log("[SpectatorClient] User address:", address);

            if (eventData.matchId === match.id && address) {
                console.log("[SpectatorClient] Match ended, checking if user won bet");

                try {
                    // Fetch user's bet for this match with address parameter
                    const url = `/api/betting/pool/${match.id}`;
                    console.log("[SpectatorClient] Fetching bet data from:", url);

                    const response = await fetch(url);
                    console.log("[SpectatorClient] Response status:", response.status);

                    if (response.ok) {
                        const data = await response.json();
                        console.log("[SpectatorClient] Bet data received:", data);

                        const userBet = data.data?.bets?.find(
                            (b: any) => b.bettor_address === address
                        );
                        console.log("[SpectatorClient] User bet found:", userBet);

                        if (userBet) {
                            const winnerRole = eventData.winnerAddress === match.player1Address ? "player1" : "player2";
                            console.log("[SpectatorClient] Winner role:", winnerRole);
                            console.log("[SpectatorClient] User bet on:", userBet.bet_on);

                            // Check if user's prediction matches the winner
                            if (userBet.bet_on === winnerRole) {
                                console.log("[SpectatorClient] USER WON! Showing notification");

                                // User won! Show celebration immediately
                                const winnerName = winnerRole === "player1"
                                    ? (match.player1?.display_name || "Player 1")
                                    : (match.player2?.display_name || "Player 2");

                                // Calculate payout: use payout_amount from bet or fallback to 2x bet amount
                                const betAmount = BigInt(userBet.amount);
                                const payoutAmount = userBet.payout_amount
                                    ? BigInt(userBet.payout_amount)
                                    : betAmount * 2n;

                                console.log("[SpectatorClient] Payout amount:", sompiToKas(payoutAmount), "KAS");

                                setWinningNotification({
                                    show: true,
                                    amount: sompiToKas(payoutAmount),
                                    prediction: userBet.bet_on as "player1" | "player2",
                                    winnerName,
                                });
                            } else {
                                console.log("[SpectatorClient] User lost - no notification");
                            }
                        } else {
                            console.log("[SpectatorClient] No bet found for this user");
                        }
                    } else {
                        console.error("[SpectatorClient] Failed to fetch bet data");
                    }
                } catch (err) {
                    console.error("[SpectatorClient] Error checking win status:", err);
                }
            } else {
                if (!address) console.log("[SpectatorClient] No wallet address");
                if (eventData.matchId !== match.id) {
                    console.log("[SpectatorClient] Match ID mismatch:", eventData.matchId, "vs", match.id);
                }
            }
        };
        EventBus.on("game:matchEnded", handleMatchEnd);

        return () => {
            EventBus.off("scene:ready", handleSceneReady);
            EventBus.off("game:matchEnded", handleMatchEnd);
        };
    }, [match.id, match.player1Address, match.player1, match.player2, address]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
                <div className="w-16 h-16 border-4 border-[#F0B71F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-cyber-gold text-lg font-medium font-orbitron tracking-widest uppercase">
                    Loading match...
                </p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 flex items-center justify-between bg-black/40 backdrop-blur-sm border-b border-cyber-gold/20"
            >
                <div className="flex items-center gap-4">
                    <Link href="/spectate">
                        <Button variant="ghost" className="text-cyber-gold hover:text-white font-orbitron">
                            ← Back
                        </Button>
                    </Link>

                    <span className="text-2xl font-bold font-orbitron text-white tracking-wider drop-shadow-[0_0_10px_rgba(240,183,31,0.5)]">
                        KASPA<span className="text-cyber-gold">CLASH</span>
                    </span>

                    {/* Spectating Badge */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/50">
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="text-purple-400 text-sm font-orbitron uppercase tracking-wider">Spectating</span>
                    </div>

                    {!channelState.isConnected && (
                        <span className="text-cyber-gold text-sm flex items-center gap-1 font-orbitron tracking-wide">
                            <span className="w-2 h-2 bg-cyber-gold rounded-full animate-pulse" />
                            CONNECTING...
                        </span>
                    )}
                </div>

                <div className="text-white font-orbitron text-sm">
                    <span className="text-purple-400">{match.player1?.display_name || "Player 1"}</span>
                    <span className="mx-2 text-gray-500">vs</span>
                    <span className="text-purple-400">{match.player2?.display_name || "Player 2"}</span>
                </div>
            </motion.div>

            {/* Main Content - Game + Betting Panel */}
            <div className="flex-1 w-full flex flex-col xl:flex-row items-stretch justify-center gap-4 p-4 min-h-0 overflow-y-auto xl:overflow-hidden">
                {/* Game Container */}
                <div className="flex-1 flex items-center justify-center w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-full max-w-[1280px] aspect-video bg-black rounded-lg overflow-hidden border-2 border-purple-500/30 shadow-lg shadow-purple-500/10 relative xl:h-full xl:max-h-full"
                    >
                        <PhaserGame
                            currentScene={initialScene}
                            sceneConfig={
                                initialScene === "FightScene" ? {
                                    matchId: match.id,
                                    player1Address: match.player1Address,
                                    player2Address: match.player2Address || "",
                                    player1Character: match.player1CharacterId || "dag-warrior",
                                    player2Character: match.player2CharacterId || "dag-warrior",
                                    playerRole: "player1", // Spectators view from player1's perspective
                                    isSpectator: true, // Key flag for spectator mode
                                    isReconnect: false,
                                    reconnectState: null,
                                } : initialScene === "ResultsScene" ? {
                                    result: {
                                        winner: match.winnerAddress === match.player1Address ? "player1" :
                                            match.winnerAddress === match.player2Address ? "player2" : null,
                                        reason: (match as any).endReason || "rounds_won",
                                        player1FinalHealth: 0,
                                        player2FinalHealth: 0,
                                        player1RoundsWon: match.player1RoundsWon,
                                        player2RoundsWon: match.player2RoundsWon,
                                        txIds: [],
                                    },
                                    playerRole: "player1",
                                    matchId: match.id,
                                    player1CharacterId: match.player1CharacterId || "dag-warrior",
                                    player2CharacterId: match.player2CharacterId || "dag-warrior",
                                    isSpectator: true,
                                } : {
                                    matchId: match.id,
                                    playerAddress: "", // Empty for spectators
                                    opponentAddress: "",
                                    isHost: false,
                                    isSpectator: true,
                                    selectionDeadlineAt: match.selectionDeadlineAt,
                                    existingPlayerCharacter: match.player1CharacterId,
                                    existingOpponentCharacter: match.player2CharacterId,
                                } as any
                            }
                        />
                    </motion.div>
                </div>

                {/* Betting Panel Sidebar */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full xl:w-[380px] shrink-0 flex flex-col gap-4 min-h-0 xl:h-full xl:overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent pr-1"
                >
                    <div className="shrink-0">
                        <BettingPanel
                            matchId={match.id}
                            player1Name={match.player1?.display_name || match.player1Address.slice(0, 12) + "..."}
                            player2Name={match.player2?.display_name || (match.player2Address?.slice(0, 12) + "...") || "Player 2"}
                        />
                    </div>

                    {/* Spectator Chat using flex-1 to fill remaining vertical space */}
                    <SpectatorChat
                        matchId={match.id}
                        matchStartTime={match.createdAt ? new Date(match.createdAt).getTime() : undefined}
                        isBotMatch={false}
                        player1Name={match.player1?.display_name || "Player 1"}
                        player2Name={match.player2?.display_name || "Player 2"}
                        className="flex-1 min-h-[250px]"
                    />
                </motion.div>
            </div>

            {/* Info Footer */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 bg-black/40 border-t border-cyber-gold/20"
            >
                <div className="max-w-4xl mx-auto flex items-center justify-between text-sm">
                    <p className="text-cyber-gray">
                        <span className="text-purple-400">●</span> Live Match • Spectator Mode
                    </p>
                    <p className="text-cyber-gray font-mono text-xs">
                        Match: {match.id.slice(0, 20)}...
                    </p>
                </div>
            </motion.div>

            {/* Winning Notification */}
            {winningNotification && (
                <WinningNotification
                    show={winningNotification.show}
                    amount={winningNotification.amount}
                    prediction={winningNotification.prediction}
                    winnerName={winningNotification.winnerName}
                    onClose={() => setWinningNotification(null)}
                />
            )}

            {/* Match Cancelled Notification */}
            <AnimatePresence>
                {showCancelledNotification && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="relative max-w-md w-full p-8 bg-gradient-to-br from-red-900/40 via-black to-black border-2 border-red-500/50 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden pointer-events-auto">
                                {/* Decorative elements */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />

                                {/* Warning Icon */}
                                <div className="flex justify-center mb-6">
                                    <motion.div
                                        initial={{ rotate: -10, scale: 0.8 }}
                                        animate={{ rotate: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200 }}
                                        className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                                    >
                                        <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </motion.div>
                                </div>

                                {/* Title */}
                                <h2 className="text-3xl font-bold font-orbitron text-center text-red-500 mb-4 tracking-wider uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                    Match Cancelled
                                </h2>

                                {/* Message */}
                                <p className="text-center text-gray-300 mb-6 font-orbitron text-lg">
                                    This match has been cancelled and finalized.
                                </p>

                                {/* Refund Information */}
                                {cancelledBetAmount !== null ? (
                                    <div className="my-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                                        <p className="relative text-center text-green-400 mb-2 font-orbitron text-sm uppercase tracking-wider">
                                            Your bet will be refunded
                                        </p>
                                        <div className="relative flex items-center justify-center gap-2">
                                            <span className="text-3xl font-bold text-cyber-gold font-orbitron">
                                                {cancelledBetAmount.toFixed(4)}
                                            </span>
                                            <span className="text-cyber-gold/70 font-orbitron">KAS</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-cyber-gray/60 mb-8 font-orbitron text-sm uppercase tracking-widest bg-white/5 py-4 rounded-xl border border-white/10">
                                        Any bets placed will be refunded
                                    </p>
                                )}

                                {/* Action Button */}
                                <Button
                                    onClick={() => {
                                        setShowCancelledNotification(false);
                                        window.location.href = "/spectate";
                                    }}
                                    className="w-full py-6 bg-gradient-to-r from-red-600 to-red-900 hover:from-red-500 hover:to-red-700 text-white font-bold font-orbitron text-lg rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(239,68,68,0.4)] hover:shadow-[0_4px_30px_rgba(239,68,68,0.6)] uppercase tracking-wider border border-red-400/30"
                                >
                                    Return to Spectate
                                </Button>

                                <button
                                    onClick={() => setShowCancelledNotification(false)}
                                    className="w-full mt-4 text-gray-500 hover:text-gray-300 font-orbitron text-xs uppercase tracking-widest transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
