"use client";

/**
 * SurvivalGameClient - React wrapper for Survival Mode Phaser game
 * Handles survival-specific events, API calls for recording results, and game lifecycle
 */

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { EventBus } from "@/game/EventBus";
import { useWalletStore, selectPersistedAddress } from "@/stores/wallet-store";
import { sendKaspa } from "@/lib/kaspa/wallet";
import type { SurvivalResult } from "@/game/scenes/SurvivalScene";

import { HugeiconsIcon } from "@hugeicons/react";
import { Sword01Icon } from "@hugeicons/core-free-icons";

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(
    () => import("@/game/PhaserGame").then((mod) => mod.PhaserGame),
    { ssr: false }
);

interface SurvivalGameClientProps {
    characterId: string;
    onMatchEnd: (result: SurvivalResult & { isNewHighScore?: boolean; newRank?: number | null }) => void;
    onExit: () => void;
}

export function SurvivalGameClient({
    characterId,
    onMatchEnd,
    onExit,
}: SurvivalGameClientProps) {
    const address = useWalletStore(selectPersistedAddress);
    const [isReady, setIsReady] = useState(false);
    const [recordingStatus, setRecordingStatus] = useState<string | null>(null);

    const onMatchEndRef = useRef(onMatchEnd);
    const onExitRef = useRef(onExit);
    const addressRef = useRef(address);

    useEffect(() => {
        onMatchEndRef.current = onMatchEnd;
        onExitRef.current = onExit;
        addressRef.current = address;
    }, [onMatchEnd, onExit, address]);

    // Deduct play count when starting a survival run
    useEffect(() => {
        const deductPlay = async () => {
            if (!address) return;

            try {
                const response = await fetch("/api/survival/start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ playerAddress: address }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    console.error("Failed to deduct survival play:", data.error);
                }
            } catch (error) {
                console.error("Error calling survival start API:", error);
            }
        };

        deductPlay();
    }, [address, characterId]); // Run once when component mounts with valid address

    // Listen for survival events
    useEffect(() => {
        const handleSceneReady = () => {
            setIsReady(true);
        };

        const handleSurvivalEnded = async (data: unknown) => {
            const result = data as SurvivalResult;

            // If player is connected, require on-chain confirmation
            if (addressRef.current) {
                setRecordingStatus("Confirming Score (1 KAS)...");
                try {
                    // 1. Send 1 KAS to self to verify on-chain
                    // 1 KAS = 100,000,000 sompi
                    await sendKaspa(
                        addressRef.current,
                        100000000,
                        "Survival Score Recording"
                    );

                    // 2. Record to backend
                    setRecordingStatus("Recording score...");

                    // Small delay to let UI update and simulate "waiting for confirmation" 
                    // (since kaspa blocks are 1s, this effectively waits for 1 block)
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const response = await fetch("/api/survival/end", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            playerAddress: addressRef.current,
                            characterId,
                            wavesCleared: result.wavesCleared,
                            finalHealth: result.finalHealth,
                            isVictory: result.isVictory,
                            waveDetails: result.waveDetails,
                        }),
                    });

                    if (response.ok) {
                        const apiData = await response.json();
                        onMatchEndRef.current({
                            ...result,
                            totalScore: apiData.score,
                            shardsEarned: apiData.shardsEarned,
                            isNewHighScore: apiData.isNewHighScore,
                            newRank: apiData.newRank,
                        });
                    } else {
                        // Still call onMatchEnd even if API fails
                        console.error("API Error");
                        onMatchEndRef.current(result);
                    }
                } catch (error) {
                    console.error("Failed to record survival result:", error);
                    // If user rejected transaction or other error, still end match but maybe don't record?
                    // For now, allow proceeding to end screen but logged error implies score might not be saved properly
                    onMatchEndRef.current(result);
                } finally {
                    setRecordingStatus(null);
                }
            } else {
                onMatchEndRef.current(result);
            }
        };

        const handleExit = () => {
            onExitRef.current();
        };

        EventBus.on("survival_scene_ready", handleSceneReady);
        EventBus.on("survival_ended", handleSurvivalEnded);
        EventBus.on("survival_exit_complete", handleExit);

        return () => {
            EventBus.off("survival_scene_ready", handleSceneReady);
            EventBus.off("survival_ended", handleSurvivalEnded);
            EventBus.off("survival_exit_complete", handleExit);
        };
    }, [characterId]);

    return (
        <div className="relative w-full h-full min-h-[600px]">
            {/* Survival mode header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold font-orbitron text-white tracking-wider drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        KASPA<span className="text-red-500">CLASH</span>
                    </span>
                    <span className="text-red-400 text-sm font-orbitron tracking-wide px-3 py-1 bg-red-950/60 rounded-full border border-red-500/30 flex items-center gap-2">
                        <HugeiconsIcon icon={Sword01Icon} className="w-4 h-4" />
                        <span>SURVIVAL MODE</span>
                    </span>
                </div>
            </div>

            {/* Recording indicator */}
            {recordingStatus && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-black/80 px-4 py-2 rounded-lg border border-cyan-500/30">
                    <span className="text-cyan-400 text-sm font-orbitron animate-pulse">
                        {recordingStatus}
                    </span>
                </div>
            )}

            {/* Phaser game container */}
            <PhaserGame
                currentScene="SurvivalScene"
                sceneConfig={{
                    playerCharacterId: characterId,
                    playerAddress: address || "",
                } as any}
            />
        </div>
    );
}

export default SurvivalGameClient;
