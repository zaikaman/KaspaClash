import React from "react";
import GameLayout from "@/components/layout/GameLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

export default function LeaderboardPage() {
    return (
        <GameLayout>
            <div className="relative w-full min-h-screen pt-6 sm:pt-10 pb-20">
                {/* Background Elements */}
                <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[800px] h-[500px] bg-cyber-gold/5 rounded-full blur-[150px] pointer-events-none"></div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 relative z-10">
                    <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
                        <h1 className="text-3xl sm:text-4xl lg:text-[60px] font-bold leading-tight mb-4 font-orbitron text-white">
                            HALL OF <span className="text-cyber-gold">FAME</span>
                        </h1>
                        <p className="text-cyber-gray text-base sm:text-lg font-montserrat">
                            The top fighters of the Kaspa BlockDAG, recorded eternally on-chain.
                        </p>
                    </div>

                    <DecorativeLine className="mb-8 sm:mb-12" variant="left-red-right-gold" />

                    <div className="mb-6 sm:mb-8 flex justify-center sm:justify-end sm:pr-28">
                        {/* Filter/Sort Controls Placeholder */}
                        <div className="flex gap-4">
                            <span className="text-cyber-gray text-xs sm:text-sm uppercase font-bold self-center">Season 1</span>
                        </div>
                    </div>

                    <LeaderboardTable />

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
