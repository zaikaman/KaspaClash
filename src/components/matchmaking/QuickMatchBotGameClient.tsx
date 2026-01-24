/**
 * QuickMatchBotGameClient - Client wrapper for bot matches from quick match queue
 * Similar to PracticeGameClient but with a different UI feel (looks like a real match)
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { EventBus } from "@/game/EventBus";
import type { Character } from "@/types";

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(
    () => import("@/game/PhaserGame").then((mod) => mod.PhaserGame),
    { ssr: false }
);

/**
 * Bot match configuration from matchmaking.
 */
export interface BotMatchConfig {
    botName: string;
    botAddress: string; // Fake address for display
    playerAddress: string;
    playerCharacterId: string;
    botCharacterId: string;
    matchFormat: "best_of_3" | "best_of_5";
}

/**
 * QuickMatchBotGameClient props.
 */
interface QuickMatchBotGameClientProps {
    config: BotMatchConfig;
    onMatchEnd: (result: { 
        playerWon: boolean; 
        playerRoundsWon: number; 
        botRoundsWon: number;
    }) => void;
    onExit: () => void;
}

/**
 * QuickMatchBotGameClient component.
 * Renders a bot match that looks like a real quick match.
 */
export function QuickMatchBotGameClient({
    config,
    onMatchEnd,
    onExit,
}: QuickMatchBotGameClientProps) {
    const [isReady, setIsReady] = useState(false);
    
    // Keep refs to avoid stale closures in event handlers
    const onMatchEndRef = useRef(onMatchEnd);
    const onExitRef = useRef(onExit);

    useEffect(() => {
        onMatchEndRef.current = onMatchEnd;
        onExitRef.current = onExit;
    }, [onMatchEnd, onExit]);

    // Listen for bot match events
    useEffect(() => {
        const handleSceneReady = () => {
            console.log("[QuickMatchBotGameClient] Scene ready");
            setIsReady(true);
        };

        const handleMatchEnded = (data: unknown) => {
            const payload = data as {
                playerWon: boolean;
                playerRoundsWon: number;
                botRoundsWon: number;
            };

            console.log("[QuickMatchBotGameClient] Match ended:", payload);

            // Notify parent
            onMatchEndRef.current({
                playerWon: payload.playerWon,
                playerRoundsWon: payload.playerRoundsWon,
                botRoundsWon: payload.botRoundsWon,
            });
        };

        const handleExit = () => {
            console.log("[QuickMatchBotGameClient] Exit requested");
            onExitRef.current();
        };

        // Register listeners
        EventBus.on("quickmatch_bot_scene_ready", handleSceneReady);
        EventBus.on("quickmatch_bot_match_ended", handleMatchEnded);
        EventBus.on("quickmatch_bot_exit", handleExit);

        return () => {
            EventBus.off("quickmatch_bot_scene_ready", handleSceneReady);
            EventBus.off("quickmatch_bot_match_ended", handleMatchEnded);
            EventBus.off("quickmatch_bot_exit", handleExit);
        };
    }, []);

    return (
        <div className="relative w-full h-full">
            {/* Phaser game container */}
            <PhaserGame
                currentScene="QuickMatchBotScene"
                sceneConfig={{
                    playerCharacterId: config.playerCharacterId,
                    botCharacterId: config.botCharacterId,
                    botName: config.botName,
                    botAddress: config.botAddress,
                    playerAddress: config.playerAddress,
                    matchFormat: config.matchFormat,
                } as any}
            />
        </div>
    );
}

export default QuickMatchBotGameClient;
