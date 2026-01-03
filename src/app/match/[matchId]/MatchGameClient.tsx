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
 * Determine which scene to start based on match status.
 */
function getInitialScene(match: MatchGameClientProps["match"]): "CharacterSelectScene" | "FightScene" {
  // If match is in_progress and both characters are selected, go directly to FightScene
  if (match.status === "in_progress" && match.player1CharacterId && match.player2CharacterId) {
    return "FightScene";
  }
  // Otherwise, start with character selection
  return "CharacterSelectScene";
}

/**
 * Match game client component.
 */
export function MatchGameClient({ match }: MatchGameClientProps) {
  // Debug log match data on mount - EXPLICIT deadline logging for debugging
  console.log("[MatchGameClient] Match data:", {
    id: match.id,
    status: match.status,
    selectionDeadlineAt: match.selectionDeadlineAt,
    player1CharacterId: match.player1CharacterId,
    player2CharacterId: match.player2CharacterId,
  });
  console.log("[MatchGameClient] DEADLINE VALUE:", match.selectionDeadlineAt ?? "UNDEFINED/NULL");


  const { address, connectionState } = useWalletStore();
  const matchStore = useMatchStore();
  const matchActions = useMatchActions();
  const [showResults, setShowResults] = useState(false);
  const [gameReady, setGameReady] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectState, setReconnectState] = useState<{
    gameState?: {
      status: string;
      currentRound: number;
      player1Health: number;
      player2Health: number;
      player1RoundsWon: number;
      player2RoundsWon: number;
      player1CharacterId: string | null;
      player2CharacterId: string | null;
      player1Energy: number;
      player2Energy: number;
      moveDeadlineAt: number | null;
      pendingMoves: { player1: boolean; player2: boolean };
    };
  } | null>(null);

  // Determine player role
  const playerRole: PlayerRole | null =
    address === match.player1Address
      ? "player1"
      : address === match.player2Address
        ? "player2"
        : null;

  // Determine which scene to start
  const initialScene = getInitialScene(match);

  // Set up game channel subscription
  const { state: channelState } = useGameChannel({
    matchId: match.id,
    playerAddress: address || "",
    playerRole: playerRole || "player1",
    onMatchEnded: () => {
      setShowResults(true);
    },
  });

  // Notify scene when channel is connected - this allows scene to wait before making API calls
  useEffect(() => {
    if (channelState.isSubscribed) {
      console.log("[MatchGameClient] Channel subscribed, notifying scene");
      EventBus.emit("channel_ready", { matchId: match.id });
    }
  }, [channelState.isSubscribed, match.id]);

  // Handle reconnection on mount
  useEffect(() => {
    if (!address || !playerRole || !match.id) return;

    // Check if we're reconnecting to an active match
    const handleReconnection = async () => {
      // Only handle reconnection for in_progress matches
      if (match.status !== "in_progress") return;

      setIsReconnecting(true);
      try {
        const response = await fetch(`/api/matches/${match.id}/disconnect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            action: "reconnect",
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("[MatchGameClient] Reconnection successful:", result);

          if (result.data?.gameState) {
            setReconnectState({ gameState: result.data.gameState });

            // Emit state sync event to Phaser
            EventBus.emit("game:stateSync", result.data.gameState);
          }
        }
      } catch (error) {
        console.error("[MatchGameClient] Reconnection error:", error);
      } finally {
        setIsReconnecting(false);
      }
    };

    handleReconnection();
  }, [address, playerRole, match.id, match.status]);

  // Handle page unload - notify disconnect
  useEffect(() => {
    if (!address || !match.id) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery on page close
      const data = JSON.stringify({ address, action: "disconnect" });
      navigator.sendBeacon(`/api/matches/${match.id}/disconnect`, data);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also notify disconnect when component unmounts
      fetch(`/api/matches/${match.id}/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, action: "disconnect" }),
        keepalive: true,
      }).catch(() => { });
    };
  }, [address, match.id]);

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

          // If matchReady is true, trigger match start locally
          // This handles the case where we lost the race and missed the broadcast
          if (result.data?.matchReady) {
            console.log("[MatchGameClient] Match is ready, triggering local match_starting");
            EventBus.emit("match_starting", {
              countdown: 3,
              player1CharacterId: result.data.player1CharacterId || match.player1CharacterId,
              player2CharacterId: result.data.player2CharacterId || match.player2CharacterId,
            });
          }
        }
      } catch (error) {
        console.error("Error confirming character selection:", error);
      }
    };

    // Helper to handle transaction rejection (rejection = forfeit round)
    const handleTransactionRejection = async (matchId: string, playerAddress: string) => {
      try {
        console.log("[MatchGameClient] Reporting transaction rejection (forfeit) to server");
        const rejectResponse = await fetch(`/api/matches/${matchId}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: playerAddress }),
        });

        if (rejectResponse.ok) {
          const rejectResult = await rejectResponse.json();
          console.log("[MatchGameClient] Rejection result:", rejectResult);

          if (rejectResult.status === "match_cancelled") {
            // Both players rejected - emit cancellation event
            EventBus.emit("game:matchCancelled", {
              matchId,
              reason: "both_rejected",
              message: rejectResult.message,
              redirectTo: rejectResult.redirectTo || "/matchmaking",
            });
          } else if (rejectResult.status === "opponent_wins") {
            // We forfeited by rejecting - opponent wins this round
            // The round_resolved event will be broadcast by the server
            console.log("[MatchGameClient] We forfeited - opponent wins this round");
          }
        } else {
          const errorText = await rejectResponse.text();
          console.error("[MatchGameClient] Failed to record rejection:", errorText);
        }
      } catch (error) {
        console.error("[MatchGameClient] Error recording rejection:", error);
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
          // Transaction failed - user likely rejected the wallet popup
          console.error("Transaction failed:", result.error);
          EventBus.emit("game:moveError", { error: result.error || "Failed to create transaction" });

          // Notify server that this player rejected the transaction
          await handleTransactionRejection(match.id, address);
        }
      } catch (error) {
        console.error("Error submitting move:", error);
        EventBus.emit("game:moveError", { error: "Transaction error" });

        // Also report rejection on error
        await handleTransactionRejection(match.id, address);
      }
    };

    // Handle timeout victory claim
    const handleClaimTimeoutVictory = async (data: unknown) => {
      const payload = data as { matchId: string };
      if (!address || !payload.matchId) return;

      try {
        const response = await fetch(`/api/matches/${payload.matchId}/timeout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("[MatchGameClient] Timeout claim result:", result);

          if (result.data?.result === "win") {
            // Victory! Show results
            setShowResults(true);
          } else if (result.data?.result === "cancelled") {
            // Both disconnected - redirect
            window.location.href = "/matchmaking";
          }
        } else {
          console.error("[MatchGameClient] Timeout claim failed:", await response.text());
        }
      } catch (error) {
        console.error("[MatchGameClient] Timeout claim error:", error);
      }
    };

    EventBus.on("scene:ready", handleSceneReady);
    EventBus.on("match:ended", handleMatchEnd);
    EventBus.on("selection_confirmed", handleSelectionConfirmed);
    EventBus.on("game:submitMove", handleMoveSubmitted);
    EventBus.on("game:claimTimeoutVictory", handleClaimTimeoutVictory);

    return () => {
      EventBus.off("scene:ready", handleSceneReady);
      EventBus.off("match:ended", handleMatchEnd);
      EventBus.off("selection_confirmed", handleSelectionConfirmed);
      EventBus.off("game:submitMove", handleMoveSubmitted);
      EventBus.off("game:claimTimeoutVictory", handleClaimTimeoutVictory);
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

  // Show loading state while reconnecting
  if (isReconnecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
        <div className="w-16 h-16 border-4 border-[#49eacb] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#49eacb] text-lg font-medium">Reconnecting to match...</p>
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
          currentScene={initialScene}
          sceneConfig={initialScene === "FightScene" ? {
            matchId: match.id,
            player1Address: match.player1Address,
            player2Address: match.player2Address || "",
            player1Character: match.player1CharacterId || "dag-warrior",
            player2Character: match.player2CharacterId || "dag-warrior",
            playerRole: playerRole,
            // Pass reconnect state if available
            isReconnect: !!reconnectState,
            reconnectState: reconnectState?.gameState,
          } as any : (() => {
            const config = {
              matchId: match.id,
              playerAddress: address,
              opponentAddress:
                playerRole === "player1"
                  ? match.player2Address || ""
                  : match.player1Address,
              isHost: playerRole === "player1",
              // Pass server-synced selection deadline for timer
              selectionDeadlineAt: match.selectionDeadlineAt,
              // Pass existing character selections for reconnection
              existingPlayerCharacter: playerRole === "player1"
                ? match.player1CharacterId
                : match.player2CharacterId,
              existingOpponentCharacter: playerRole === "player1"
                ? match.player2CharacterId
                : match.player1CharacterId,
            };
            console.log("[MatchGameClient] CharacterSelectScene config:", config);
            console.log("[MatchGameClient] Match data - p1Char:", match.player1CharacterId, "p2Char:", match.player2CharacterId);
            return config;
          })() as any}
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
