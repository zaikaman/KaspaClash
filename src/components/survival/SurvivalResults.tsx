"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { SurvivalResult } from "@/game/scenes/SurvivalScene";
import { TOTAL_WAVES } from "@/lib/survival/wave-generator";
import { getSurvivalRank } from "@/lib/survival/score-calculator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ChampionIcon,
    StarIcon,
} from "@hugeicons/core-free-icons";

interface SurvivalResultsProps {
    result: SurvivalResult & {
        isNewHighScore?: boolean;
        newRank?: number | null;
    };
    onPlayAgain: () => void;
    onExit: () => void;
}

export default function SurvivalResults({ result, onPlayAgain, onExit }: SurvivalResultsProps) {
    const rank = getSurvivalRank(result.wavesCleared);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
            <div className="w-full max-w-lg bg-black/60 border border-red-500/30 rounded-2xl p-8 backdrop-blur-md">
                {/* Title */}
                <h1 className={`text-2xl sm:text-4xl font-bold font-orbitron text-center mb-6 flex items-center justify-center gap-3 ${result.isVictory ? "text-yellow-400" : "text-red-400"}`}>
                    {result.isVictory ? (
                        <>
                            <HugeiconsIcon icon={ChampionIcon} className="w-8 h-8" />
                            <span>CHAMPION!</span>
                            <HugeiconsIcon icon={ChampionIcon} className="w-8 h-8" />
                        </>
                    ) : (
                        "GAME OVER"
                    )}
                </h1>

                {/* Rank Badge */}
                <div className="flex justify-center mb-6">
                    <span className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white font-orbitron font-bold text-lg rounded-full shadow-lg">
                        {rank}
                    </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/40 p-4 rounded-xl border border-cyber-gray/20 text-center">
                        <p className="text-cyber-gray text-sm mb-1">Waves Cleared</p>
                        <p className="text-2xl font-orbitron font-bold text-white">
                            {result.wavesCleared}<span className="text-sm text-cyber-gray">/{TOTAL_WAVES}</span>
                        </p>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-cyber-gray/20 text-center">
                        <p className="text-cyber-gray text-sm mb-1">Final Score</p>
                        <p className="text-2xl font-orbitron font-bold text-cyan-400">
                            {result.totalScore.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-cyber-gray/20 text-center">
                        <p className="text-cyber-gray text-sm mb-1">Shards Earned</p>
                        <p className="text-2xl font-orbitron font-bold text-yellow-400">
                            +{result.shardsEarned}
                        </p>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-cyber-gray/20 text-center">
                        <p className="text-cyber-gray text-sm mb-1">Final Health</p>
                        <p className="text-2xl font-orbitron font-bold text-green-400">
                            {result.finalHealth}%
                        </p>
                    </div>
                </div>

                {/* New High Score Badge */}
                {result.isNewHighScore && (
                    <div className="flex justify-center mb-6">
                        <div className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-orbitron font-bold text-sm rounded-lg animate-pulse flex items-center gap-2">
                            <HugeiconsIcon icon={StarIcon} className="w-4 h-4 fill-current" />
                            <span>NEW HIGH SCORE!</span>
                            <HugeiconsIcon icon={StarIcon} className="w-4 h-4 fill-current" />
                        </div>
                    </div>
                )}

                {/* Leaderboard Rank */}
                {result.newRank && (
                    <p className="text-center text-cyber-gray mb-6">
                        Leaderboard Position: <span className="text-yellow-400 font-bold">#{result.newRank}</span>
                    </p>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={onPlayAgain}
                        className="w-full h-12 bg-gradient-to-r from-red-600 to-red-500 text-white font-orbitron font-bold hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
                    >
                        PLAY AGAIN
                    </Button>
                    <Button
                        onClick={onExit}
                        variant="outline"
                        className="w-full h-12 border-cyber-gray/30 text-cyber-gray hover:text-white hover:border-white font-orbitron"
                    >
                        EXIT
                    </Button>
                </div>
            </div>
        </div>
    );
}
