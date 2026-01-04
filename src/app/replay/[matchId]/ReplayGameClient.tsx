"use client";

/**
 * Replay Game Client Component
 * Renders the Phaser game with ReplayScene for match playback
 */

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { EventBus } from "@/game/EventBus";
import type { ReplayConfig } from "./page";

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(
  () => import("@/game/PhaserGame").then((mod) => mod.PhaserGame),
  { ssr: false }
);

interface ReplayGameClientProps {
  config: ReplayConfig;
}

export function ReplayGameClient({ config }: ReplayGameClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Only register replay:complete listener here
    // scene:ready is handled via PhaserGame's onSceneReady prop to avoid conflicts
    const handleReplayComplete = () => {
      setIsComplete(true);
    };

    EventBus.on("replay:complete", handleReplayComplete);

    return () => {
      EventBus.off("replay:complete", handleReplayComplete);
    };
  }, []);

  const handleSceneReady = () => {
    setIsLoading(false);
  };

  const handleWatchAgain = () => {
    setIsComplete(false);
    // The PhaserGame will restart the scene with same config
    window.location.reload();
  };

  const handleGoBack = () => {
    window.location.href = `/m/${config.matchId}`;
  };

  // Build scene config matching ReplaySceneConfig interface
  const sceneConfig = {
    matchId: config.matchId,
    player1Address: config.player1Address,
    player2Address: config.player2Address,
    player1Character: config.player1Character,
    player2Character: config.player2Character,
    winnerAddress: config.winnerAddress,
    player1RoundsWon: config.player1RoundsWon,
    player2RoundsWon: config.player2RoundsWon,
    rounds: config.rounds,
  };

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyber-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cyber-gold font-orbitron text-xl">Loading Replay...</p>
          </div>
        </div>
      )}

      {/* Phaser Game */}
      <PhaserGame
        currentScene="ReplayScene"
        sceneConfig={sceneConfig as any}
        onSceneReady={handleSceneReady}
        className="w-full h-full"
      />

      {/* Replay complete overlay with actions */}
      {isComplete && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-20">
          <button
            onClick={handleWatchAgain}
            className="px-6 py-3 bg-cyber-gold text-black font-orbitron rounded-lg hover:bg-cyber-gold/80 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            WATCH AGAIN
          </button>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-transparent border-2 border-cyber-gold text-cyber-gold font-orbitron rounded-lg hover:bg-cyber-gold/10 transition-colors"
          >
            VIEW MATCH DETAILS
          </button>
        </div>
      )}
    </div>
  );
}
