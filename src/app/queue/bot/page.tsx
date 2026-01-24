"use client";

/**
 * Quick Match Bot Page
 * Bot match initiated from queue when no opponents are found after 30 seconds
 */

import React, { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import GameLayout from "@/components/layout/GameLayout";
import { getRandomCharacter, getCharacter } from "@/data/characters";
import { generateBotName } from "@/lib/game/smart-bot-opponent";
import type { BotMatchConfig } from "@/components/matchmaking/QuickMatchBotGameClient";

// Dynamically import the game client
const QuickMatchBotGameClient = dynamic(
    () => import("@/components/matchmaking/QuickMatchBotGameClient").then((mod) => mod.QuickMatchBotGameClient),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-cyber-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-cyber-gold font-orbitron tracking-widest uppercase text-sm">Loading Game...</p>
                </div>
            </div>
        )
    }
);

/**
 * Generate a fake wallet address that looks real
 */
function generateBotAddress(isTestnet: boolean): string {
    const prefix = isTestnet ? "kaspatest:" : "kaspa:";
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let suffix = "";
    for (let i = 0; i < 61; i++) { // Standard Kaspa address length
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + suffix;
}

interface MatchResult {
    playerWon: boolean;
    playerRoundsWon: number;
    botRoundsWon: number;
}

function QuickMatchBotPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [config, setConfig] = useState<BotMatchConfig | null>(null);
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
    const [gameState, setGameState] = useState<"loading" | "playing" | "results">("loading");

    // Initialize config from URL params
    useEffect(() => {
        const playerAddress = searchParams.get("playerAddress") || "";
        const playerCharacterId = searchParams.get("characterId") || "";
        
        // Determine if testnet based on player address
        const isTestnet = playerAddress.startsWith("kaspatest:");
        
        // Generate bot data
        const botName = generateBotName();
        const botAddress = generateBotAddress(isTestnet);
        
        // Pick a random character for the bot (different from player)
        let botCharacter = getRandomCharacter();
        while (botCharacter.id === playerCharacterId) {
            botCharacter = getRandomCharacter();
        }

        setConfig({
            botName,
            botAddress,
            playerAddress,
            playerCharacterId: playerCharacterId || getRandomCharacter().id,
            botCharacterId: botCharacter.id,
            matchFormat: "best_of_3",
        });
        
        setGameState("playing");
    }, [searchParams]);

    const handleMatchEnd = useCallback((result: MatchResult) => {
        setMatchResult(result);
        setGameState("results");
    }, []);

    const handleExit = useCallback(() => {
        router.push("/matchmaking");
    }, [router]);

    const handlePlayAgain = useCallback(() => {
        // Regenerate bot data for a new match
        if (!config) return;
        
        const isTestnet = config.playerAddress.startsWith("kaspatest:");
        const botName = generateBotName();
        const botAddress = generateBotAddress(isTestnet);
        
        let botCharacter = getRandomCharacter();
        while (botCharacter.id === config.playerCharacterId) {
            botCharacter = getRandomCharacter();
        }

        setConfig({
            ...config,
            botName,
            botAddress,
            botCharacterId: botCharacter.id,
        });
        
        setMatchResult(null);
        setGameState("playing");
    }, [config]);

    // Loading state
    if (gameState === "loading" || !config) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-cyber-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-cyber-gold font-orbitron tracking-widest uppercase text-lg">Finding Opponent...</p>
                </div>
            </div>
        );
    }

    // Results state
    if (gameState === "results" && matchResult) {
        return (
            <GameLayout>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-black/80 border border-cyber-gold/30 rounded-2xl p-8 max-w-md w-full text-center">
                        <h1 className={`text-4xl font-bold font-orbitron mb-4 ${matchResult.playerWon ? "text-green-500" : "text-red-500"}`}>
                            {matchResult.playerWon ? "VICTORY!" : "DEFEAT"}
                        </h1>
                        
                        <p className="text-2xl text-white font-mono mb-6">
                            {matchResult.playerRoundsWon} - {matchResult.botRoundsWon}
                        </p>
                        
                        <p className="text-cyber-gray mb-8">
                            {matchResult.playerWon 
                                ? "Great fight! You dominated the arena." 
                                : "Good effort! Practice makes perfect."}
                        </p>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handlePlayAgain}
                                className="w-full bg-gradient-cyber text-white py-3 px-6 rounded-lg font-orbitron hover:opacity-90 transition-opacity"
                            >
                                PLAY AGAIN
                            </button>
                            
                            <button
                                onClick={handleExit}
                                className="w-full bg-transparent border border-cyber-gray/50 text-cyber-gray py-3 px-6 rounded-lg font-orbitron hover:border-cyber-gray hover:text-white transition-all"
                            >
                                BACK TO MENU
                            </button>
                        </div>
                    </div>
                </div>
            </GameLayout>
        );
    }

    // Game state - fullscreen game
    return (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden">
            <QuickMatchBotGameClient
                config={config}
                onMatchEnd={handleMatchEnd}
                onExit={handleExit}
            />
        </div>
    );
}

export default function QuickMatchBotPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-cyber-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-cyber-gold font-orbitron tracking-widest uppercase text-lg">Loading...</p>
                </div>
            </div>
        }>
            <QuickMatchBotPageContent />
        </Suspense>
    );
}
