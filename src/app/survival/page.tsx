"use client";

/**
 * Survival Mode Page
 * Fight through 20 waves of AI opponents with escalating difficulty
 */

import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import GameLayout from "@/components/layout/GameLayout";
import SurvivalMenu from "@/components/survival/SurvivalMenu";
import SurvivalResults from "@/components/survival/SurvivalResults";
import type { SurvivalResult } from "@/game/scenes/SurvivalScene";

// Dynamically import SurvivalGameClient to avoid SSR issues
const SurvivalGameClient = dynamic(
    () => import("@/components/survival/SurvivalGameClient").then((mod) => mod.SurvivalGameClient),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[600px] bg-black/50 border border-red-500/30 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-red-400 font-orbitron tracking-widest uppercase text-sm">Loading Survival Mode...</p>
                </div>
            </div>
        )
    }
);

interface SurvivalConfig {
    characterId: string;
}

interface ExtendedResult extends SurvivalResult {
    isNewHighScore?: boolean;
    newRank?: number | null;
}

export default function SurvivalPage() {
    const [gameState, setGameState] = useState<"menu" | "playing" | "results">("menu");
    const [survivalConfig, setSurvivalConfig] = useState<SurvivalConfig | null>(null);
    const [matchResult, setMatchResult] = useState<ExtendedResult | null>(null);

    const handleStart = useCallback((characterId: string) => {
        setSurvivalConfig({ characterId });
        setGameState("playing");
    }, []);

    const handleMatchEnd = useCallback((result: ExtendedResult) => {
        setMatchResult(result);
        setGameState("results");
    }, []);

    const handlePlayAgain = useCallback(() => {
        // Keep same config, start new run
        setMatchResult(null);
        setGameState("playing");
    }, []);

    const handleExit = useCallback(() => {
        setSurvivalConfig(null);
        setMatchResult(null);
        setGameState("menu");
    }, []);

    return (
        <GameLayout>
            <div className="min-h-screen pt-6 sm:pt-10 pb-20 relative">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px]"></div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 relative z-10">
                    {/* Page Header */}
                    {gameState === "menu" && (
                        <div className="text-center mb-8">
                            <h1 className="text-3xl sm:text-4xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-2">
                                ⚔️ SURVIVAL MODE ⚔️
                            </h1>
                            <p className="text-cyber-gray text-sm sm:text-base">
                                Fight through 20 waves. Claim the leaderboard. Earn massive rewards.
                            </p>
                        </div>
                    )}

                    {gameState === "menu" && (
                        <SurvivalMenu onStart={handleStart} />
                    )}

                    {gameState === "playing" && survivalConfig && (
                        <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] bg-black/50 border border-red-500/30 rounded-2xl overflow-hidden">
                            <SurvivalGameClient
                                characterId={survivalConfig.characterId}
                                onMatchEnd={handleMatchEnd}
                                onExit={handleExit}
                            />
                        </div>
                    )}

                    {gameState === "results" && matchResult && (
                        <SurvivalResults
                            result={matchResult}
                            onPlayAgain={handlePlayAgain}
                            onExit={handleExit}
                        />
                    )}
                </div>
            </div>
        </GameLayout>
    );
}
