"use client";

/**
 * BotSpectatorClient - Plays back pre-computed bot matches
 * Receives full match data including turns and syncs to current position
 */

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventBus } from "@/game/EventBus";
import { BotBettingPanel } from "@/components/betting/BotBettingPanel";
import { SpectatorChat } from "@/components/spectate/SpectatorChat";
import { WinningNotification } from "@/components/betting/WinningNotification";
import { useWallet } from "@/hooks/useWallet";
import { sompiToKas } from "@/lib/betting/betting-service";
import type { BotMatch, BotTurnData } from "@/lib/game/bot-match-service";

interface BotSpectatorClientProps {
    match: BotMatch & {
        currentTurnIndex: number;
        serverTime?: number;
        elapsedMs?: number;
        bettingStatus?: {
            isOpen: boolean;
            secondsRemaining: number;
            reason?: string;
        };
    };
}

export function BotSpectatorClient({ match }: BotSpectatorClientProps) {
    const { address, refreshBalance } = useWallet();
    const containerRef = useRef<HTMLDivElement>(null);
    const [gameReady, setGameReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentMatch, setCurrentMatch] = useState(match);
    const gameRef = useRef<Phaser.Game | null>(null);
    const isLoadingNewMatch = useRef(false);
    // Track betting open state for layout (default true to show panel initially)
    const [isBettingPanelVisible, setIsBettingPanelVisible] = useState(true);
    // Winning notification state
    const [winningNotification, setWinningNotification] = useState<{
        show: boolean;
        amount: number;
        prediction: "bot1" | "bot2";
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

    useEffect(() => {
        let isMounted = true;

        async function initGame() {
            try {
                const Phaser = (await import("phaser")).default;
                const { BotBattleScene } = await import("@/game/scenes/BotBattleScene");

                if (!isMounted || !containerRef.current) return;

                const config: Phaser.Types.Core.GameConfig = {
                    type: Phaser.AUTO,
                    width: 1280,
                    height: 720,
                    parent: containerRef.current,
                    backgroundColor: "#0a0a0a",
                    scale: {
                        mode: Phaser.Scale.FIT,
                        autoCenter: Phaser.Scale.CENTER_BOTH,
                    },
                    scene: [BotBattleScene],
                };

                gameRef.current = new Phaser.Game(config);

                // Start scene with pre-computed match data
                gameRef.current.scene.start("BotBattleScene", {
                    matchId: currentMatch.id,
                    bot1CharacterId: currentMatch.bot1CharacterId,
                    bot2CharacterId: currentMatch.bot2CharacterId,
                    bot1Name: currentMatch.bot1Name,
                    bot2Name: currentMatch.bot2Name,
                    turns: currentMatch.turns,
                    totalTurns: currentMatch.totalTurns,
                    startTurnIndex: currentMatch.currentTurnIndex,
                    turnDurationMs: currentMatch.turnDurationMs,
                    bot1MaxHp: currentMatch.bot1MaxHp,
                    bot2MaxHp: currentMatch.bot2MaxHp,
                    bot1MaxEnergy: currentMatch.bot1MaxEnergy,
                    bot2MaxEnergy: currentMatch.bot2MaxEnergy,
                    matchWinner: currentMatch.matchWinner,
                    bot1RoundsWon: currentMatch.bot1RoundsWon,
                    bot2RoundsWon: currentMatch.bot2RoundsWon,
                    matchCreatedAt: currentMatch.createdAt,
                    serverTime: currentMatch.serverTime,
                    elapsedMs: currentMatch.elapsedMs,
                    bettingStatus: currentMatch.bettingStatus,
                });

                setGameReady(true);
            } catch (err) {
                console.error("Failed to initialize bot battle:", err);
                setError("Failed to load game");
            }
        }

        initGame();

        // Listen for match end to check if user won
        const handleMatchEnd = async (data: unknown) => {
            const eventData = data as { matchId: string; winner: "player1" | "player2" };
            console.log("[BotSpectatorClient] Match ended event received:", eventData);
            console.log("[BotSpectatorClient] Current match ID:", currentMatch.id);
            console.log("[BotSpectatorClient] User address:", address);
            
            if (eventData.matchId === currentMatch.id && address) {
                console.log("[BotSpectatorClient] Match ended, checking if user won bet");

                try {
                    // Fetch user's bet for this match with address parameter
                    const url = `/api/bot-betting/pool/${currentMatch.id}?address=${encodeURIComponent(address)}`;
                    console.log("[BotSpectatorClient] Fetching bet data from:", url);
                    
                    const response = await fetch(url);
                    console.log("[BotSpectatorClient] Response status:", response.status);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log("[BotSpectatorClient] Bet data received:", data);
                        
                        const userBet = data.userBet; // Changed from data.data?.bets?.find
                        console.log("[BotSpectatorClient] User bet found:", userBet);

                        if (userBet) {
                            // Map winner from player1/player2 to bot1/bot2
                            const winnerBot = eventData.winner === "player1" ? "bot1" : "bot2";
                            console.log("[BotSpectatorClient] Winner bot:", winnerBot);
                            console.log("[BotSpectatorClient] User bet on:", userBet.bet_on);
                            
                            // Check if user's prediction matches the winner
                            if (userBet.bet_on === winnerBot) {
                                console.log("[BotSpectatorClient] USER WON! Showing notification");
                                
                                // User won! Show celebration immediately
                                const winnerName = eventData.winner === "player1" ? currentMatch.bot1Name : currentMatch.bot2Name;
                                // Calculate payout: 2x the net bet amount
                                const netAmount = BigInt(userBet.net_amount || userBet.amount);
                                const payoutAmount = netAmount * 2n;
                                
                                console.log("[BotSpectatorClient] Payout amount:", sompiToKas(payoutAmount), "KAS");
                                
                                setWinningNotification({
                                    show: true,
                                    amount: sompiToKas(payoutAmount),
                                    prediction: userBet.bet_on as "bot1" | "bot2",
                                    winnerName,
                                });
                            } else {
                                console.log("[BotSpectatorClient] User lost - no notification");
                            }
                        } else {
                            console.log("[BotSpectatorClient] No bet found for this user");
                        }
                    } else {
                        console.error("[BotSpectatorClient] Failed to fetch bet data");
                    }
                } catch (err) {
                    console.error("[BotSpectatorClient] Error checking win status:", err);
                }
            } else {
                if (!address) console.log("[BotSpectatorClient] No wallet address");
                if (eventData.matchId !== currentMatch.id) {
                    console.log("[BotSpectatorClient] Match ID mismatch:", eventData.matchId, "vs", currentMatch.id);
                }
            }
        };
        EventBus.on("bot_battle_match_end", handleMatchEnd);

        // Listen for match end and load next match in the same room
        const handleNewMatchRequest = async () => {
            if (isLoadingNewMatch.current) return;
            isLoadingNewMatch.current = true;

            try {
                // Fetch the new active match
                const response = await fetch("/api/bot-games");
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.match) {
                        // Destroy current game
                        if (gameRef.current) {
                            gameRef.current.destroy(true);
                            gameRef.current = null;
                        }

                        // Update to new match with server timing
                        setCurrentMatch({
                            ...data.match,
                            currentTurnIndex: data.currentTurnIndex || 0,
                            serverTime: data.serverTime,
                            elapsedMs: data.elapsedMs,
                            bettingStatus: data.bettingStatus,
                        });
                        setGameReady(false);

                        // Reinitialize game with new match
                        setTimeout(() => {
                            isLoadingNewMatch.current = false;
                            initGame();
                        }, 1000);
                    }
                }
            } catch (err) {
                console.error("Failed to load next match:", err);
                isLoadingNewMatch.current = false;
            }
        };
        EventBus.on("bot_battle_request_new_match", handleNewMatchRequest);

        return () => {
            isMounted = false;
            EventBus.off("bot_battle_match_end", handleMatchEnd);
            EventBus.off("bot_battle_request_new_match", handleNewMatchRequest);
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [currentMatch]);

    // Calculate progress for UI
    const progress = currentMatch.totalTurns > 0
        ? Math.min(100, (currentMatch.currentTurnIndex / currentMatch.totalTurns) * 100)
        : 0;

    return (
        <div className="relative w-full min-h-screen flex flex-col bg-[#0a0a0a]">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 flex items-center justify-between bg-black/40 backdrop-blur-sm border-b border-cyber-gold/20"
            >
                <Link href="/spectate">
                    <Button variant="ghost" className="text-cyber-gold hover:text-white font-orbitron">
                        ← Back
                    </Button>
                </Link>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/40">
                        <span className="text-orange-400 font-orbitron text-sm font-bold">LIVE BOT MATCH</span>
                    </div>

                    {/* Progress indicator */}
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-gray-400 text-xs font-mono">Turn {currentMatch.currentTurnIndex}/{currentMatch.totalTurns}</span>
                        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-orange-500 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="text-white font-orbitron text-sm">
                    <span className="text-orange-400">{currentMatch.bot1Name}</span>
                    <span className="mx-2 text-gray-500">vs</span>
                    <span className="text-orange-400">{currentMatch.bot2Name}</span>
                </div>
            </motion.div>

            {/* Main Content - Game + Betting Panel */}
            {/* Main Content - Game + Betting Panel */}
            <div className="flex-1 flex flex-col lg:flex-row items-stretch justify-center gap-4 p-4 min-h-0">
                {/* Game Container */}
                <div className="flex-1 flex items-center justify-center w-full">
                    {error ? (
                        <div className="text-center">
                            <p className="text-red-500 mb-4">{error}</p>
                            <Link href="/spectate">
                                <Button className="bg-gradient-cyber text-white border-0 font-orbitron">
                                    Back to Spectate
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            ref={containerRef}
                            className="w-full max-w-[1280px] aspect-video bg-black rounded-lg overflow-hidden border-2 border-orange-500/30 shadow-lg shadow-orange-500/10"
                        >
                            {!gameReady && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-orange-400 font-orbitron">
                                            {currentMatch.currentTurnIndex > 0
                                                ? `Catching up to turn ${currentMatch.currentTurnIndex}...`
                                                : "Loading bot battle..."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Betting Panel */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4 min-h-0"
                >
                    <div className={isBettingPanelVisible ? "block shrink-0" : "hidden"}>
                        <BotBettingPanel
                            matchId={currentMatch.id}
                            bot1Name={currentMatch.bot1Name}
                            bot2Name={currentMatch.bot2Name}
                            onBettingStatusChange={setIsBettingPanelVisible}
                        />
                    </div>

                    {/* Spectator Chat using flex-1 to fill remaining vertical space */}
                    <SpectatorChat
                        matchId={currentMatch.id}
                        matchStartTime={currentMatch.createdAt ? new Date(currentMatch.createdAt).getTime() : undefined}
                        turns={currentMatch.turns}
                        isBotMatch={true}
                        player1Name={currentMatch.bot1Name}
                        player2Name={currentMatch.bot2Name}
                        className={isBettingPanelVisible ? "h-[300px] shrink-0" : "h-[780px] shrink-0"}
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
                        <span className="text-orange-400"></span> 24/7 Bot Battle Room • New match starts automatically •
                        You joined at turn {currentMatch.currentTurnIndex}
                    </p>
                    <p className="text-cyber-gray font-mono text-xs">
                        Match: {currentMatch.id.slice(0, 20)}...
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
        </div>
    );
}
