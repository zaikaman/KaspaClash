/**
 * Match Game Client Component
 * Client-side wrapper for Phaser game with match data
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useWalletStore } from "@/stores/wallet-store";
import { useMatchStore, useMatchActions } from "@/stores/match-store";
import { useGameChannel } from "@/hooks/useGameChannel";
import { EventBus } from "@/game/EventBus";
import { MatchResults } from "@/components/game/MatchResults";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import type { Match, PlayerRole } from "@/types";

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(
  () => import("@/game/PhaserGame").then((mod) => mod.PhaserGame),
  { ssr: false }
);

/**
 * Match game client props.
 */
interface MatchGameClientProps {
  match: Match & {
    player1?: {
      address: string;
      display_name: string | null;
      rating: number;
    };
    player2?: {
      address: string;
      display_name: string | null;
      rating: number;
    };
  };
}

/**
 * Match game client component.
 */
export function MatchGameClient({ match }: MatchGameClientProps) {
  const { address, connectionState } = useWalletStore();
  const matchStore = useMatchStore();
  const matchActions = useMatchActions();
  const [showResults, setShowResults] = useState(false);
  const [gameReady, setGameReady] = useState(false);

  // Determine player role
  const playerRole: PlayerRole | null =
    address === match.player1Address
      ? "player1"
      : address === match.player2Address
        ? "player2"
        : null;

  // Set up game channel subscription
  const { state: channelState } = useGameChannel({
    matchId: match.id,
    playerAddress: address || "",
    playerRole: playerRole || "player1",
    onMatchEnded: () => {
      setShowResults(true);
    },
  });

  // Initialize match store
  useEffect(() => {
    if (playerRole && match) {
      matchActions.initMatch(match as Match, playerRole);
    }
  }, [match, playerRole, matchActions]);

  // Listen for game events
  useEffect(() => {
    const handleSceneReady = () => {
      setGameReady(true);
    };

    const handleMatchEnd = () => {
      setShowResults(true);
    };

    // Handle character selection confirmation from Phaser scene
    const handleSelectionConfirmed = async (data: unknown) => {
      const payload = data as { characterId: string };
      if (!address || !match.id) return;

      try {
        const response = await fetch(`/api/matches/${match.id}/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerAddress: address,
            characterId: payload.characterId,
            confirm: true,
          }),
        });

        if (!response.ok) {
          console.error("Failed to confirm character selection:", await response.text());
        } else {
          const result = await response.json();
          console.log("[MatchGameClient] Character selection confirmed:", result);
        }
      } catch (error) {
        console.error("Error confirming character selection:", error);
      }
    };

    // Handle move submission from Phaser - uses REAL Kaspa transactions
    const handleMoveSubmitted = async (data: unknown) => {
      const payload = data as { moveType: string; matchId: string };
      if (!address || !match.id) return;

      console.log("[MatchGameClient] Submitting move with real transaction:", payload.moveType);

      try {
        // Use real Kaspa transaction for immutable move recording
        const { submitMoveWithTransaction } = await import("@/lib/game/move-service");

        const result = await submitMoveWithTransaction({
          matchId: match.id,
          roundNumber: matchStore.currentRound.roundNumber,
          moveType: payload.moveType as any,
          useFullTransaction: true,
        });

        if (result.success && result.txId) {
          console.log("[MatchGameClient] Transaction submitted:", result.txId);

          // Submit to API with real txId
          const response = await fetch(`/api/matches/${match.id}/move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: address,
              moveType: payload.moveType,
              txId: result.txId,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to submit move:", errorText);
            EventBus.emit("game:moveError", { error: "Failed to submit move to server" });
          } else {
            console.log("[MatchGameClient] Move recorded on server");
          }
        } else {
          console.error("Transaction failed:", result.error);
          EventBus.emit("game:moveError", { error: result.error || "Failed to create transaction" });
        }
      } catch (error) {
        console.error("Error submitting move:", error);
        EventBus.emit("game:moveError", { error: "Transaction error" });
      }
    };

    EventBus.on("scene:ready", handleSceneReady);
    EventBus.on("match:ended", handleMatchEnd);
    EventBus.on("selection_confirmed", handleSelectionConfirmed);
    EventBus.on("game:submitMove", handleMoveSubmitted);

    return () => {
      EventBus.off("scene:ready", handleSceneReady);
      EventBus.off("match:ended", handleMatchEnd);
      EventBus.off("selection_confirmed", handleSelectionConfirmed);
      EventBus.off("game:submitMove", handleMoveSubmitted);
    };
  }, [address, match.id]);

  // Handle closing results
  const handleCloseResults = useCallback(() => {
    setShowResults(false);
  }, []);

  // Check if wallet is connected
  if (connectionState !== "connected" || !address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
        <h1 className="text-3xl font-bold text-[#49eacb] mb-8">KaspaClash</h1>
        <p className="text-gray-400 mb-6 text-center">
          Connect your Kaspa wallet to join the match
        </p>
        <ConnectWalletButton />
      </div>
    );
  }

  // Check if player is part of this match
  if (!playerRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
        <h1 className="text-3xl font-bold text-[#49eacb] mb-8">KaspaClash</h1>
        <p className="text-red-400 mb-4">You are not a participant in this match.</p>
        <p className="text-gray-400 text-sm">
          Your wallet: {address.slice(0, 12)}...{address.slice(-6)}
        </p>
        <a
          href="/"
          className="mt-6 px-6 py-2 bg-[#49eacb] text-black font-semibold rounded-lg hover:bg-[#3dd4b8] transition-colors"
        >
          Return to Home
        </a>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a]">
      {/* Match info header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-4">
          <span className="text-[#49eacb] font-bold">KaspaClash</span>
          {!channelState.isConnected && (
            <span className="text-yellow-400 text-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              Connecting...
            </span>
          )}
        </div>
        <div className="text-gray-400 text-sm">
          Match: {match.id.slice(0, 8)}
        </div>
      </div>

      {/* Phaser game container */}
      <div className="w-full h-screen">
        <PhaserGame
          currentScene="CharacterSelectScene"
          sceneConfig={{
            matchId: match.id,
            playerAddress: address,
            opponentAddress:
              playerRole === "player1"
                ? match.player2Address || ""
                : match.player1Address,
            isHost: playerRole === "player1",
            // Legacy/FightScene props just in case or for when we transition (though transition creates new scene config usually internal to scene flow)
            // But CharacterSelectScene config is: matchId, playerAddress, opponentAddress, isHost
          } as any}
        />
      </div>

      {/* Match results overlay */}
      {showResults && matchStore.result && (
        <MatchResults
          matchId={match.id}
          result={matchStore.result}
          playerRole={playerRole}
          onClose={handleCloseResults}
        />
      )}
    </div>
  );
}
