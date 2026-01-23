/**
 * Spectator Client Component
 * Read-only client for watching matches - no move submission or character selection
 */

"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSpectatorChannel } from "@/hooks/useSpectatorChannel";
import { useMatchStore, useMatchActions } from "@/stores/match-store";
import { EventBus } from "@/game/EventBus";
import { BettingPanel } from "@/components/betting/BettingPanel";
import { SpectatorChat } from "@/components/spectate/SpectatorChat";
import { WinningNotification } from "@/components/betting/WinningNotification";
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
            console.log("[SpectatorClient] Match ended:", payload);

            // Check if user won their bet
            if (address) {
                try {
                    // Fetch user's bet for this match
                    const response = await fetch(`/api/betting/pool/${match.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        const userBet = data.data?.bets?.find(
                            (b: any) => b.bettor_address === address
                        );

                        if (userBet) {
                            const winnerRole = payload.winnerAddress === match.player1Address ? "player1" : "player2";
                            
                            // Check if user's prediction matches the winner
                            if (userBet.bet_on === winnerRole) {
                                // User won! Show celebration immediately
                                const winnerName = winnerRole === "player1" 
                                    ? (match.player1?.display_name || "Player 1")
                                    : (match.player2?.display_name || "Player 2");
                                
                                // Calculate expected payout from pool data
                                const payoutAmount = userBet.payout_amount 
                                    ? BigInt(userBet.payout_amount)
                                    : BigInt(userBet.amount || 0); // Fallback to bet amount
                                
                                setWinningNotification({
                                    show: true,
                                    amount: sompiToKas(payoutAmount),
                                    prediction: userBet.bet_on as "player1" | "player2",
                                    winnerName,
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.error("[SpectatorClient] Error checking win status:", err);
                }
            }
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
                        } else {
                            console.log("[SpectatorClient] No bet found for user");
                        }
                    }
                }
            } catch (error) {
                console.error("[SpectatorClient] Error fetching bet info:", error);
            }

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

        return () => {
            EventBus.off("scene:ready", handleSceneReady);
        };
    }, []);

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
        <div className="relative min-h-screen bg-[#0a0a0a]">
            {/* Spectator header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <Link href="/spectate" className="text-cyber-gray hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
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
                <div className="text-cyber-gray text-xs font-orbitron tracking-widest opacity-80">
                    MATCH: <span className="text-cyber-gold">{match.id.slice(0, 8)}</span>
                </div>
            </div>

            {/* Main content */}
            <div className="flex h-screen">
                {/* Phaser game container */}
                <div className="flex-1 h-full">
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
                </div>

                {/* Betting panel sidebar */}
                <div className="w-80 h-full pt-20 p-4 bg-black/40 border-l border-cyber-gold/20 overflow-y-auto">
                    <BettingPanel
                        matchId={match.id}
                        player1Name={match.player1?.display_name || match.player1Address.slice(0, 12) + "..."}
                        player2Name={match.player2?.display_name || (match.player2Address?.slice(0, 12) + "...") || "Player 2"}
                    />

                    {/* Spectator Chat */}
                    <div className="mt-4">
                        <SpectatorChat
                            matchId={match.id}
                            matchStartTime={match.createdAt ? new Date(match.createdAt).getTime() : undefined}
                            isBotMatch={false}
                            player1Name={match.player1?.display_name || "Player 1"}
                            player2Name={match.player2?.display_name || "Player 2"}
                        />
                    </div>
                </div>
            </div>

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
        </div>
    );
}
