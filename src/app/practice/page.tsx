"use client";

import React, { useState } from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import PracticeMenu from "@/components/practice/PracticeMenu";
import PracticeResults from "@/components/practice/PracticeResults";
import { Button } from "@/components/ui/button"; // For simulate button

export default function PracticePage() {
    const [gameState, setGameState] = useState<"menu" | "playing" | "results">("menu");
    const [result, setResult] = useState<"player" | "ai" | null>(null);

    const handleStart = (characterId: string, difficulty: string) => {
        console.log(`Starting practice with ${characterId} on ${difficulty}`);
        setGameState("playing");
    };

    const handleEndGame = (winner: "player" | "ai") => {
        setResult(winner);
        setGameState("results");
    };

    const handleRetry = () => {
        setGameState("menu");
        setResult(null);
    };

    return (
        <LandingLayout>
            <div className="min-h-screen pt-32 pb-20 relative">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-cyber-orange/10 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-cyber-gold/5 rounded-full blur-[120px]"></div>
                </div>

                <div className="container mx-auto px-6 lg:px-12 xl:px-24 relative z-10">
                    {gameState === "menu" && (
                        <PracticeMenu onStart={handleStart} />
                    )}

                    {gameState === "playing" && (
                        <div className="w-full h-[600px] bg-black/50 border border-cyber-gray/30 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm">
                            <h2 className="text-3xl font-orbitron text-white mb-4 animate-pulse">
                                GAME ENGINE LOADING...
                            </h2>
                            <p className="text-cyber-gray mb-8">
                                (This is where the Phaser canvas will mount)
                            </p>

                            {/* Dev Controls to simulate game end */}
                            <div className="flex gap-4 p-4 border border-white/10 rounded-lg bg-black/40">
                                <span className="text-xs text-cyber-gray uppercase font-bold tracking-widest block w-full text-center mb-2">Dev Controls</span>
                                <Button onClick={() => handleEndGame("player")} size="sm" className="bg-green-600 hover:bg-green-700">Win Match</Button>
                                <Button onClick={() => handleEndGame("ai")} size="sm" className="bg-red-600 hover:bg-red-700">Lose Match</Button>
                            </div>
                        </div>
                    )}

                    {gameState === "results" && result && (
                        <PracticeResults winner={result} onRetry={handleRetry} />
                    )}
                </div>
            </div>
        </LandingLayout>
    );
}
