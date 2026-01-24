"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMatchmakingQueue } from "@/hooks/useMatchmakingQueue";
import { useWallet } from "@/hooks/useWallet";
import { useRouter } from "next/navigation";
import { generateBotName } from "@/lib/game/smart-bot-opponent";

/** Timeout in seconds before matching with bot */
const BOT_MATCH_TIMEOUT_SECONDS = 30;

export default function MatchmakingQueue() {
    const router = useRouter();
    const { isConnected, address } = useWallet();
    const {
        isInQueue,
        isJoining,
        isMatching,
        waitTimeSeconds,
        playerCount,
        error,
        matchResult,
        joinQueue,
        leaveQueue,
        formatWaitTime,
    } = useMatchmakingQueue();

    const [hasStarted, setHasStarted] = useState(false);
    const [isCreatingBotMatch, setIsCreatingBotMatch] = useState(false);

    // Automatically join queue when component mounts if wallet is connected
    useEffect(() => {
        if (isConnected && !isInQueue && !hasStarted && !isJoining) {
            setHasStarted(true);
            joinQueue();
        }
    }, [isConnected, isInQueue, hasStarted, isJoining, joinQueue]);

    // Navigate to match when matched with real player
    useEffect(() => {
        if (matchResult) {
            router.push(`/match/${matchResult.matchId}`);
        }
    }, [matchResult, router]);

    // Monitor wait time - after 30 seconds, create fake bot match
    useEffect(() => {
        if (isInQueue && waitTimeSeconds >= BOT_MATCH_TIMEOUT_SECONDS && !isCreatingBotMatch) {
            setIsCreatingBotMatch(true);
            
            const createBotMatch = async () => {
                try {
                    // Generate bot name and address
                    const botName = generateBotName();
                    const botAddress = `bot_${Math.random().toString(36).substring(2, 15)}`;
                    
                    // Create a fake match entry that looks real
                    const response = await fetch("/api/matchmaking/create-bot-match", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            player1Address: address,
                            player2Address: botAddress,
                            player2Name: botName,
                        }),
                    });
                    
                    if (response.ok) {
                        const { matchId } = await response.json();
                        // Leave queue
                        await leaveQueue();
                        // Navigate to match (same flow as real match)
                        router.push(`/match/${matchId}`);
                    } else {
                        console.error("Failed to create bot match");
                        setIsCreatingBotMatch(false);
                    }
                } catch (error) {
                    console.error("Error creating bot match:", error);
                    setIsCreatingBotMatch(false);
                }
            };
            
            createBotMatch();
        }
    }, [isInQueue, waitTimeSeconds, isCreatingBotMatch, address, leaveQueue, router]);





    // If wallet not connected, show connect message
    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto relative">
                <div className="text-center">
                    <h2 className="text-2xl font-bold font-orbitron text-white mb-4">
                        WALLET REQUIRED
                    </h2>
                    <p className="text-cyber-gray font-montserrat mb-8">
                        Connect your wallet to search for opponents.
                    </p>
                    <Link href="/">
                        <Button className="bg-gradient-cyber text-white border-0 font-orbitron">
                            GO TO HOME
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto relative">
                <div className="text-center">
                    <h2 className="text-2xl font-bold font-orbitron text-red-500 mb-4">
                        ERROR
                    </h2>
                    <p className="text-cyber-gray font-montserrat mb-8">
                        {error}
                    </p>
                    <Button
                        onClick={() => {
                            setHasStarted(false);
                            joinQueue();
                        }}
                        className="bg-gradient-cyber text-white border-0 font-orbitron"
                    >
                        TRY AGAIN
                    </Button>
                </div>
            </div>
        );
    }

    // Show matching state (real player found)
    if (isMatching) {
        return (
            <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto relative">
                <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
                    <div className="absolute w-full h-full rounded-full border-4 border-green-500 animate-ping"></div>
                    <div className="absolute w-32 h-32 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-2xl font-bold font-orbitron text-green-500 mb-2">
                    OPPONENT FOUND!
                </h2>
                <p className="text-cyber-gray font-montserrat">
                    Preparing match...
                </p>
            </div>
        );
    }



    // Default: Show searching state
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
                {isJoining ? "JOINING QUEUE..." : "SEARCHING FOR OPPONENT..."}
            </h2>
            <p className="text-cyber-gray font-montserrat mb-2">
                {playerCount} {playerCount === 1 ? "fighter" : "fighters"} in queue
            </p>
            {isInQueue && (
                <p className="text-cyber-gold font-mono text-lg mb-8">
                    {formatWaitTime(waitTimeSeconds)}
                </p>
            )}

            {/* Tips Carousel (Static for now) */}
            <div className="bg-black/40 border border-cyber-gray/20 rounded-lg p-4 mb-8 text-center max-w-xs backdrop-blur-sm">
                <span className="text-cyber-gold text-xs font-bold uppercase block mb-1">Tip</span>
                <p className="text-xs text-cyber-gray">
                    Block counters attacks! Use it wisely to turn the tide.
                </p>
            </div>

            {/* Cancel Button */}
            <Button
                variant="outline"
                className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500 font-orbitron"
                onClick={async () => {
                    await leaveQueue();
                    router.push("/matchmaking");
                }}
                disabled={isJoining}
            >
                CANCEL SEARCH
            </Button>
        </div>
    );
}
