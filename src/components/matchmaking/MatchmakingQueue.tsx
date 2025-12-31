import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface MatchmakingQueueProps {
    startTime?: number; // timestamp when queue started
    playerCount?: number;
    onCancel?: () => void;
}

export default function MatchmakingQueue({ playerCount = 12, onCancel }: MatchmakingQueueProps) {
    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto relative">
            {/* Radar/Pulse Effect Container */}
            <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
                {/* Outer Ring */}
                <div className="absolute w-full h-full rounded-full border border-cyber-gold/20 animate-pulse"></div>

                {/* Middle Ring */}
                <div className="absolute w-48 h-48 rounded-full border border-cyber-gold/40 animate-[spin_4s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-cyber-gold rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#F0B71F]"></div>
                </div>

                {/* Inner Ring */}
                <div className="absolute w-32 h-32 rounded-full border border-cyber-orange/50 animate-[spin_3s_linear_infinite_reverse]"></div>

                {/* Core */}
                <div className="absolute w-16 h-16 rounded-full bg-gradient-cyber flex items-center justify-center shadow-[0_0_30px_rgba(240,183,31,0.5)]">
                    <svg className="w-8 h-8 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Status Text */}
            <h2 className="text-2xl font-bold font-orbitron text-white mb-2 animate-pulse">
                SEARCHING FOR OPPONENT...
            </h2>
            <p className="text-cyber-gray font-montserrat mb-8">
                {playerCount} fighters in queue
            </p>

            {/* Tips Carousel (Static for now) */}
            <div className="bg-black/40 border border-cyber-gray/20 rounded-lg p-4 mb-8 text-center max-w-xs backdrop-blur-sm">
                <span className="text-cyber-gold text-xs font-bold uppercase block mb-1">Tip</span>
                <p className="text-xs text-cyber-gray">
                    Block high attacks by holding the BACK arrow.
                </p>
            </div>

            {/* Cancel Button */}
            <Link href="/matchmaking" className="w-full">
                <Button
                    variant="outline"
                    className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500 font-orbitron"
                    onClick={onCancel}
                >
                    CANCEL SEARCH
                </Button>
            </Link>
        </div>
    );
}
