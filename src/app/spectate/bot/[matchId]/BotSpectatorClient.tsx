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
import type { BotMatch, BotTurnData } from "@/lib/game/bot-match-service";

interface BotSpectatorClientProps {
    match: BotMatch & { currentTurnIndex: number };
}

export function BotSpectatorClient({ match }: BotSpectatorClientProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [gameReady, setGameReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentMatch, setCurrentMatch] = useState(match);
    const gameRef = useRef<Phaser.Game | null>(null);
    const isLoadingNewMatch = useRef(false);

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
                });

                setGameReady(true);
            } catch (err) {
                console.error("Failed to initialize bot battle:", err);
                setError("Failed to load game");
            }
        }

        initGame();

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
                        
                        // Update to new match
                        setCurrentMatch({
                            ...data.match,
                            currentTurnIndex: data.currentTurnIndex || 0,
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
            <div className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-4 p-4">
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
                    className="w-full lg:w-[380px] shrink-0"
                >
                    <BotBettingPanel
                        matchId={currentMatch.id}
                        bot1Name={currentMatch.bot1Name}
                        bot2Name={currentMatch.bot2Name}
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
                        <span className="text-orange-400">🤖</span> 24/7 Bot Battle Room • New match starts automatically •
                        You joined at turn {currentMatch.currentTurnIndex}
                    </p>
                    <p className="text-cyber-gray font-mono text-xs">
                        Match: {currentMatch.id.slice(0, 20)}...
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
