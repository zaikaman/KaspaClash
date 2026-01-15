"use client";

import React, { useState } from "react";
import GameLayout from "@/components/layout/GameLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import SurvivalLeaderboardTable from "@/components/leaderboard/SurvivalLeaderboardTable";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sword01Icon, Target02Icon } from "@hugeicons/core-free-icons";

type LeaderboardMode = "pvp" | "survival";

export default function LeaderboardPage() {
    const [mode, setMode] = useState<LeaderboardMode>("pvp");

    return (
        <GameLayout>
            <div className="relative w-full min-h-screen pt-6 sm:pt-10 pb-20">
                {/* Background Elements */}
                <div className={`absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[150px] pointer-events-none transition-colors duration-500 ${mode === "pvp" ? "bg-cyber-gold/5" : "bg-red-500/5"
                    }`}></div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 relative z-10">
                    <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
                        <h1 className="text-3xl sm:text-4xl lg:text-[60px] font-bold leading-tight mb-4 font-orbitron text-white">
                            HALL OF <span className={mode === "pvp" ? "text-cyber-gold" : "text-red-400"}>FAME</span>
                        </h1>
                        <p className="text-cyber-gray text-base sm:text-lg font-montserrat">
                            {mode === "pvp"
                                ? "The top fighters of the Kaspa BlockDAG, recorded eternally on-chain."
                                : "Survival champions who conquered the 20-wave gauntlet."
                            }
                        </p>
                    </div>

                    <DecorativeLine className="mb-8 sm:mb-12" variant={mode === "pvp" ? "left-red-right-gold" : "left-gold-right-red" as any} />

                    {/* Mode Tabs */}
                    <div className="mb-6 sm:mb-8 flex justify-center">
                        <div className="inline-flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => setMode("pvp")}
                                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-orbitron text-sm sm:text-base font-bold transition-all ${mode === "pvp"
                                        ? "bg-cyber-gold/20 text-cyber-gold border border-cyber-gold/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                        : "text-cyber-gray hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <HugeiconsIcon icon={Sword01Icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>PvP</span>
                            </button>
                            <button
                                onClick={() => setMode("survival")}
                                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-orbitron text-sm sm:text-base font-bold transition-all ${mode === "survival"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                        : "text-cyber-gray hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <HugeiconsIcon icon={Target02Icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Survival</span>
                            </button>
                        </div>
                    </div>

                    <div className="mb-6 sm:mb-8 flex justify-center sm:justify-end sm:pr-28">
                        <div className="flex gap-4">
                            <span className="text-cyber-gray text-xs sm:text-sm uppercase font-bold self-center">Season 1</span>
                        </div>
                    </div>

                    {mode === "pvp" ? <LeaderboardTable /> : <SurvivalLeaderboardTable />}

                    <div className="mt-8 sm:mt-12 text-center">
                        <p className="text-cyber-gray text-xs sm:text-sm">
                            Rankings update every block (~1 second).
                        </p>
                    </div>
                </div>
            </div>
        </GameLayout>
    );
}
