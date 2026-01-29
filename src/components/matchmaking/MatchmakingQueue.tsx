"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import MatchmakingHUD from "./MatchmakingHUD";
import { useMatchmakingQueue } from "@/hooks/useMatchmakingQueue";
import { useWallet } from "@/hooks/useWallet";
import { useRouter } from "next/navigation";
import { generateBotName } from "@/lib/game/smart-bot-opponent";
import { generateBotAddress } from "@/lib/utils/network-filter";

/** Timeout in seconds before matching with bot */
const BOT_MATCH_TIMEOUT_SECONDS = 30;

export default function MatchmakingQueue() {
    const router = useRouter();
    const { isConnected, address, network } = useWallet();
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
                    // Generate bot name and realistic address for current network
                    const botName = generateBotName();
                    const botAddress = generateBotAddress(network || 'testnet');

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
    }, [isInQueue, waitTimeSeconds, isCreatingBotMatch, address, network, leaveQueue, router]);





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



    // Default: Show searching state (New HUD)
    return (
        <div className="w-full h-full relative">
            <MatchmakingHUD
                waitTimeSeconds={waitTimeSeconds}
                playerCount={playerCount}
                onCancel={async () => {
                    await leaveQueue();
                    router.push("/matchmaking");
                }}
            />
        </div>
    );
}
