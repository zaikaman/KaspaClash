/**
 * Match Game Client Component
 * Client-side wrapper for Phaser game with match data
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/stores/wallet-store";
import { useMatchStore, useMatchActions } from "@/stores/match-store";
import { useGameChannel } from "@/hooks/useGameChannel";
import { useWallet } from "@/hooks/useWallet";
import { EventBus } from "@/game/EventBus";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import StakeDeposit from "@/components/matchmaking/StakeDeposit";

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
function getInitialScene(match: MatchGameClientProps["match"]): "CharacterSelectScene" | "FightScene" | "ResultsScene" {
  if (match.status === "completed") {
    return "ResultsScene";
  }
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


  const { signMessage } = useWallet();
  const { address, connectionState } = useWalletStore();
  const matchStore = useMatchStore();
  const matchActions = useMatchActions();
  const [gameReady, setGameReady] = useState(false);
  // Start with isReconnecting=true for in_progress matches to prevent rendering game before state is fetched
  const needsReconnect = !!(match.status === "in_progress" && match.player1CharacterId && match.player2CharacterId);
  const [isReconnecting, setIsReconnecting] = useState(needsReconnect);
  // Stake deposit tracking
  const [stakesReady, setStakesReady] = useState(match.stakesConfirmed ?? false);
  const [ownedCharacterIds, setOwnedCharacterIds] = useState<string[]>([]);
  const router = useRouter();
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

  // Use refs to track latest values for stable event handlers
  const addressRef = useRef(address);
  const matchIdRef = useRef(match.id);
  const moveSubmittedRef = useRef(false); // Track if move was already submitted this round

  // Keep refs in sync with latest values
  useEffect(() => {
    addressRef.current = address;
    matchIdRef.current = match.id;
  }, [address, match.id]);

  // Sync stakesReady with props (handle updates from router.refresh)
  useEffect(() => {
    if (match.stakesConfirmed) {
      setStakesReady(true);
    }
  }, [match.stakesConfirmed]);

  // Fetch owned characters
  useEffect(() => {
    const fetchInventory = async () => {
      if (!address) return;
      try {
        const response = await fetch(`/api/shop/inventory?playerId=${encodeURIComponent(address)}&pageSize=100&category=character`);
        if (response.ok) {
          const data = await response.json();
          const items = data.items as any[];
          const ownedIds = new Set(data.ownedIds as string[]);

          const characters = items
            .filter(item => item.category === 'character' && ownedIds.has(item.id))
            .map(item => item.characterId)
            .filter(Boolean) as string[];

          setOwnedCharacterIds(characters);
        }
      } catch (err) {
        console.error("Error fetching inventory:", err);
      }
    };

    fetchInventory();
  }, [address]);


  // Determine player role
  const playerRole: PlayerRole | null =
    address === match.player1Address
      ? "player1"
      : address === match.player2Address
        ? "player2"
        : null;

  // Check if this is a bot match
  const isOpponentBot = match.isBot ?? false;

  // Determine which scene to start
  const initialScene = getInitialScene(match);

  // Set up game channel subscription
  const { state: channelState, sendChatMessage, sendSticker } = useGameChannel({
    matchId: match.id,
    playerAddress: address || "",
    playerRole: playerRole || "player1",
  });

  // Notify scene when channel is connected - this allows scene to wait before making API calls
  useEffect(() => {
    if (channelState.isSubscribed) {
      console.log("[MatchGameClient] Channel subscribed at:", Date.now());
      console.log("[MatchGameClient] Emitting channel_ready event now");
      EventBus.emit("channel_ready", { matchId: match.id });
    }
  }, [channelState.isSubscribed, match.id]);

  // Listen for chat messages from Phaser and forward to channel
  useEffect(() => {
    const handleSendChat = (data: unknown) => {
      const payload = data as { message: string };
      if (payload.message) {
        sendChatMessage(payload.message);
      }
    };

    EventBus.on("game:sendChat", handleSendChat);

    return () => {
      EventBus.off("game:sendChat", handleSendChat);
    };
  }, [sendChatMessage]);

  // Listen for sticker events from Phaser and forward to channel
  useEffect(() => {
    const handleSendSticker = (data: unknown) => {
      const payload = data as { stickerId: string };
      if (payload.stickerId) {
        sendSticker(payload.stickerId);
      }
    };

    EventBus.on("game:sendSticker", handleSendSticker);

    return () => {
      EventBus.off("game:sendSticker", handleSendSticker);
    };
  }, [sendSticker]);

  // Handle reconnection on mount
  useEffect(() => {
    console.log("[MatchGameClient] Reconnection useEffect triggered");
    console.log("[MatchGameClient] address:", address ? address.substring(0, 20) + "..." : "NULL");
    console.log("[MatchGameClient] playerRole:", playerRole);
    console.log("[MatchGameClient] match.status:", match.status);
    console.log("[MatchGameClient] needsReconnect (from initial):", needsReconnect);

    if (!address || !playerRole || !match.id) {
      console.log("[MatchGameClient] Skipping reconnection - missing dependencies");
      return;
    }

    // Check if we're reconnecting to an active match
    const handleReconnection = async () => {
      // Only handle reconnection for in_progress matches
      if (match.status !== "in_progress") {
        console.log("[MatchGameClient] Skipping reconnection - not in_progress");
        setIsReconnecting(false);
        return;
      }

      console.log("[MatchGameClient] Starting reconnection fetch...");
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
          console.log("[MatchGameClient] Reconnection API response:", result);

          if (result.data?.gameState) {
            console.log("[MatchGameClient] Setting reconnectState with gameState:", result.data.gameState);
            setReconnectState({ gameState: result.data.gameState });

            // Emit state sync event to Phaser
            EventBus.emit("game:stateSync", result.data.gameState);
          } else {
            console.log("[MatchGameClient] No gameState in response!");
          }
        } else {
          console.error("[MatchGameClient] Reconnection API failed:", response.status);
        }
      } catch (error) {
        console.error("[MatchGameClient] Reconnection error:", error);
      } finally {
        console.log("[MatchGameClient] Reconnection complete, setting isReconnecting=false");
        setIsReconnecting(false);
      }
    };

    handleReconnection();
  }, [address, playerRole, match.id, match.status, needsReconnect]);


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

      // If match is completed, hydrate the result
      if (match.status === "completed") {
        // We might not have full health data here if we just loaded the page
        // But we have rounds won and winner
        const winnerRole = match.winnerAddress === match.player1Address ? "player1" :
          match.winnerAddress === match.player2Address ? "player2" : null;

        matchActions.endMatch({
          winner: winnerRole,
          reason: (match as any).endReason || "rounds_won",
          player1FinalHealth: 0, // Not available in basic match data, would need fetch or optional
          player2FinalHealth: 0,
          player1RoundsWon: match.player1RoundsWon,
          player2RoundsWon: match.player2RoundsWon,
          txIds: [],
          stakeAmount: match.stakeAmount || undefined, // Pass stake amount for UI
          winnerAddress: match.winnerAddress || undefined,
        });
      }
    }
  }, [match, playerRole, matchActions]);

  // Listen for game events
  useEffect(() => {
    const handleSceneReady = () => {
      setGameReady(true);
    };

    // Handle character selection confirmation from Phaser scene
    const handleSelectionConfirmed = async (data: unknown) => {
      const payload = data as { characterId: string };
      console.log("[MatchGameClient] handleSelectionConfirmed called with:", payload);

      const currentAddress = addressRef.current;
      const currentMatchId = matchIdRef.current;

      if (!currentAddress || !currentMatchId) {
        console.log("[MatchGameClient] Missing address or match.id, aborting", { currentAddress, currentMatchId });
        return;
      }

      try {
        console.log("[MatchGameClient] Calling /api/matches/" + currentMatchId + "/select...");
        const response = await fetch(`/api/matches/${currentMatchId}/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerAddress: currentAddress,
            characterId: payload.characterId,
            confirm: true,
          }),
        });

        if (!response.ok) {
          console.error("Failed to confirm character selection:", await response.text());
        } else {
          const result = await response.json();
          console.log("[MatchGameClient] Character selection API response:", JSON.stringify(result));

          // If matchReady is true, trigger match start locally
          // This handles the case where we lost the race and missed the broadcast
          if (result.data?.matchReady) {
            console.log("[MatchGameClient] matchReady=true, emitting local match_starting event");
            console.log("[MatchGameClient] player1CharacterId:", result.data.player1CharacterId || match.player1CharacterId);
            console.log("[MatchGameClient] player2CharacterId:", result.data.player2CharacterId || match.player2CharacterId);

            // Calculate synchronized deadline (3s countdown + 20s timer)
            const ROUND_COUNTDOWN_MS = 3000;
            const MOVE_TIMER_MS = 20000;
            const moveDeadlineAt = Date.now() + ROUND_COUNTDOWN_MS + MOVE_TIMER_MS;

            EventBus.emit("match_starting", {
              countdown: 3,
              player1CharacterId: result.data.player1CharacterId || match.player1CharacterId,
              player2CharacterId: result.data.player2CharacterId || match.player2CharacterId,
            });

            // Also emit round_starting for FightScene to start synchronized timer
            // This ensures the FightScene doesn't get stuck waiting for a broadcast it missed
            setTimeout(() => {
              EventBus.emit("game:roundStarting", {
                roundNumber: 1,
                turnNumber: 1,
                moveDeadlineAt,
                countdownSeconds: Math.floor(ROUND_COUNTDOWN_MS / 1000),
                player1Health: 100,
                player2Health: 100,
                player1Energy: 100,
                player2Energy: 100,
                player1GuardMeter: 0,
                player2GuardMeter: 0,
              });
            }, 100); // Small delay to ensure FightScene is created first
          } else {
            console.log("[MatchGameClient] matchReady=false, waiting for broadcast");
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
          } else if (rejectResult.status === "waiting") {
            // Show loading state when waiting for opponent
            console.log("[MatchGameClient] Rejection waiting for opponent");
            EventBus.emit("game:rejectionWaiting", { message: rejectResult.message });
          }
        } else {
          const errorText = await rejectResponse.text();
          console.error("[MatchGameClient] Failed to record rejection:", errorText);
          EventBus.emit("game:moveError", { error: "Failed to record rejection" });
        }
      } catch (error) {
        console.error("[MatchGameClient] Error recording rejection:", error);
      }
    };

    // Handle Surrender request from Phaser
    const handleSurrender = async () => {
      const currentAddress = addressRef.current;
      const currentMatchId = matchIdRef.current;

      if (!currentAddress || !currentMatchId) {
        console.error("[MatchGameClient] Missing info for surrender");
        return;
      }

      try {
        console.log("[MatchGameClient] Processing surrender request...");

        // 1. Sign message
        const message = `Forfeit match: ${currentMatchId}`;
        const signature = await signMessage(message);

        // 2. Call forfeit API
        const response = await fetch(`/api/matches/${currentMatchId}/forfeit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: currentAddress,
            signature
          }),
        });

        if (response.ok) {
          console.log("[MatchGameClient] Surrender successful");
          // For bot matches, we might need to redirect manually
          if (isOpponentBot) {
            // Wait a moment for the backend to process, then redirect
            setTimeout(() => {
              router.push("/matchmaking");
            }, 1000);
          }
          // Backend broadcasts 'match_ended' which handles the rest for human matches
        } else {
          console.error("Surrender failed:", await response.text());
          EventBus.emit("game:moveError", { error: "Surrender failed" });
        }
      } catch (error) {
        console.error("Surrender error:", error);
        // User likely rejected signature
        EventBus.emit("game:moveError", { error: "Surrender cancelled or failed" });
      }
    };

    // Handle Cancel Match request from Phaser (Wait/Cancel)
    const handleCancelRequest = async () => {
      const currentAddress = addressRef.current;
      const currentMatchId = matchIdRef.current;
      
      // If opponent is a bot, they automatically refuse the cancellation
      if (isOpponentBot) {
        console.log("[MatchGameClient] Bot opponent refuses match cancellation");
        EventBus.emit("game:moveError", { 
          error: "Your opponent has declined the cancellation request" 
        });
        return;
      }
      
      if (currentAddress && currentMatchId) {
        await handleTransactionRejection(currentMatchId, currentAddress);
      }
    };

    // Handle move submission from Phaser - uses REAL Kaspa transactions
    const handleMoveSubmitted = async (data: unknown) => {
      const payload = data as { moveType: string; matchId: string };

      // Use refs for latest values (avoids stale closure after page refresh)
      const currentAddress = addressRef.current;
      const currentMatchId = matchIdRef.current;

      console.log("[MatchGameClient] handleMoveSubmitted() called at:", Date.now());
      console.log("[MatchGameClient] payload:", payload);
      console.log("[MatchGameClient] currentAddress from ref:", currentAddress ? currentAddress.substring(0, 20) + "..." : "NULL");
      console.log("[MatchGameClient] React connectionState:", useWalletStore.getState().connectionState);

      if (!currentAddress || !currentMatchId) {
        console.error("[MatchGameClient] Missing address or match.id!", { currentAddress, currentMatchId });
        return;
      }

      console.log("[MatchGameClient] Submitting move with real transaction:", payload.moveType);

      try {
        // Use real Kaspa transaction for immutable move recording
        const { submitMoveWithTransaction } = await import("@/lib/game/move-service");

        const result = await submitMoveWithTransaction({
          matchId: currentMatchId,
          roundNumber: matchStore.currentRound.roundNumber,
          moveType: payload.moveType as any,
          useFullTransaction: true,
        });

        if (result.success && result.txId) {
          console.log("[MatchGameClient] Transaction submitted:", result.txId);

          // Submit to API with real txId
          const response = await fetch(`/api/matches/${currentMatchId}/move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: currentAddress,
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
            // Mark move as submitted to prevent double-submission
            moveSubmittedRef.current = true;
          }
        } else {
          // Transaction failed - user likely rejected the wallet popup
          console.error("Transaction failed:", result.error);
          EventBus.emit("game:moveError", { error: result.error || "Failed to create transaction" });

          // Only notify server of rejection if we haven't already submitted a move
          if (!moveSubmittedRef.current) {
            await handleTransactionRejection(currentMatchId, currentAddress);
          } else {
            console.log("[MatchGameClient] Move already submitted, skipping rejection notification");
          }
        }
      } catch (error) {
        console.error("Error submitting move:", error);
        EventBus.emit("game:moveError", { error: "Transaction error" });

        // Also report rejection on error
        if (currentMatchId && currentAddress) {
          await handleTransactionRejection(currentMatchId, currentAddress);
        }
      }
    };

    // Handle timeout victory claim
    const handleClaimTimeoutVictory = async (data: unknown) => {
      const payload = data as { matchId: string };
      const currentAddress = addressRef.current;

      if (!currentAddress || !payload.matchId) return;

      try {
        const response = await fetch(`/api/matches/${payload.matchId}/timeout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: currentAddress }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("[MatchGameClient] Timeout claim result:", result);

          if (result.data?.result === "win") {
            // Victory! Reload to show results scene
            window.location.reload();
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
    // Handle FightScene requesting round state (in case it missed the broadcast)
    const handleRequestRoundState = (data: unknown) => {
      const payload = data as { matchId: string };
      console.log("[MatchGameClient] FightScene requested round state for match:", payload.matchId);

      // Only respond if this is for our match and we're in a state where the match should be starting
      if (payload.matchId === matchIdRef.current) {
        // Calculate synchronized deadline (3s countdown + 20s timer)
        const ROUND_COUNTDOWN_MS = 3000;
        const MOVE_TIMER_MS = 20000;
        const moveDeadlineAt = Date.now() + ROUND_COUNTDOWN_MS + MOVE_TIMER_MS;

        console.log("[MatchGameClient] Responding with game:roundStarting, deadline:", moveDeadlineAt);
        EventBus.emit("game:roundStarting", {
          roundNumber: 1,
          turnNumber: 1,
          moveDeadlineAt,
          countdownSeconds: Math.floor(ROUND_COUNTDOWN_MS / 1000),
          player1Health: 100,
          player2Health: 100,
          player1Energy: 100,
          player2Energy: 100,
          player1GuardMeter: 0,
          player2GuardMeter: 0,
        });
      }
    };
    // Reset move submission tracking when a new turn starts
    const handleRoundStarting = (data: unknown) => {
      const payload = data as { roundNumber: number; turnNumber: number; moveDeadlineAt: number };
      console.log(`[MatchGameClient] *** game:roundStarting received - Round ${payload.roundNumber}, Turn ${payload.turnNumber}, Timestamp: ${Date.now()}`);
      console.log(`[MatchGameClient] *** Resetting moveSubmittedRef from ${moveSubmittedRef.current} to false`);
      console.log(`[MatchGameClient] *** Deadline: ${payload.moveDeadlineAt}, Time until deadline: ${Math.floor((payload.moveDeadlineAt - Date.now()) / 1000)}s`);
      moveSubmittedRef.current = false;
    };

    // Handle server-side timeout enforcement when local timer expires
    const handleTimerExpired = async () => {
      console.log(`[MatchGameClient] *** game:timerExpired received - Timestamp: ${Date.now()}`);
      const currentAddress = addressRef.current;
      const currentMatchId = matchIdRef.current;

      // Skip if move was already submitted
      if (moveSubmittedRef.current) {
        console.log("[MatchGameClient] *** Timer expired but move already submitted (moveSubmittedRef=true), skipping timeout check");
        return;
      }

      if (!currentAddress || !currentMatchId) {
        console.error("[MatchGameClient] *** Missing address or matchId for timeout check");
        return;
      }

      console.log(`[MatchGameClient] *** Timer expired, calling move-timeout API for match ${currentMatchId}`);

      try {
        const response = await fetch(`/api/matches/${currentMatchId}/move-timeout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: currentAddress }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("[MatchGameClient] Move timeout result:", result);

          if (result.data?.result === "match_cancelled") {
            // Both players timed out - emit cancellation event
            EventBus.emit("game:matchCancelled", {
              matchId: currentMatchId,
              reason: "both_timeout",
              message: result.data.reason || "Both players failed to submit moves in time.",
              redirectTo: result.data.redirectTo || "/matchmaking",
            });
          } else if (result.data?.result === "round_forfeited") {
            // One player timed out - the round_resolved event will be broadcast by the server
            console.log("[MatchGameClient] Round forfeited due to timeout, winner:", result.data.roundWinner);
          }
          // For "no_action" results, do nothing - may have already been resolved
        } else {
          console.error("[MatchGameClient] Move timeout API error:", await response.text());
        }
      } catch (error) {
        console.error("[MatchGameClient] Error calling move-timeout API:", error);
      }
    };

    console.log("[MatchGameClient] Registering EventBus listeners for selection_confirmed, etc.");
    EventBus.on("scene:ready", handleSceneReady);
    EventBus.on("selection_confirmed", handleSelectionConfirmed);
    EventBus.on("game:submitMove", handleMoveSubmitted);
    EventBus.on("game:claimTimeoutVictory", handleClaimTimeoutVictory);
    EventBus.on("fight:requestRoundState", handleRequestRoundState);
    EventBus.on("game:roundStarting", handleRoundStarting);
    EventBus.on("game:timerExpired", handleTimerExpired);
    EventBus.on("request-surrender", handleSurrender);
    EventBus.on("request-cancel", handleCancelRequest);
    console.log("[MatchGameClient] EventBus listeners registered at:", Date.now());

    return () => {
      console.log("[MatchGameClient] UNREGISTERING EventBus listeners (cleanup)");
      EventBus.off("scene:ready", handleSceneReady);
      EventBus.off("selection_confirmed", handleSelectionConfirmed);
      EventBus.off("game:submitMove", handleMoveSubmitted);
      EventBus.off("game:claimTimeoutVictory", handleClaimTimeoutVictory);
      EventBus.off("fight:requestRoundState", handleRequestRoundState);
      EventBus.off("game:roundStarting", handleRoundStarting);
      EventBus.off("game:timerExpired", handleTimerExpired);
      EventBus.off("request-surrender", handleSurrender);
      EventBus.off("request-cancel", handleCancelRequest);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - register once, use refs for latest values

  // Handle closing results
  // const handleCloseResults = useCallback(() => {
  //   setShowResults(false);
  // }, []);

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
        <div className="w-16 h-16 border-4 border-[#F0B71F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cyber-gold text-lg font-medium font-orbitron tracking-widest uppercase">Reconnecting to match...</p>
      </div>
    );
  }

  // Check if stakes are pending (staked match where stakes not yet confirmed)
  const hasStakePending = match.stakeAmount &&
    BigInt(match.stakeAmount) > 0 &&
    !stakesReady &&
    match.status === "character_select";

  // Show stake deposit screen if stakes are pending
  if (hasStakePending && playerRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
        <StakeDeposit
          matchId={match.id}
          stakeAmountSompi={match.stakeAmount!}
          expiresAt={match.stakeDeadlineAt || undefined}
          isHost={playerRole === "player1"}
          onDeposited={() => {
            // Only refresh - let the useEffect sync state when prop updates
            // This ensures we have the fresh selectionDeadlineAt before starting Phaser
            router.refresh();
          }}
          onCancel={async () => {
            try {
              // Call cancel endpoint to trigger refunds
              await fetch("/api/matchmaking/rooms/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matchId: match.id }),
              });
            } catch (err) {
              console.error("Failed to cancel match:", err);
            }
            router.push("/matchmaking");
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a]">
      {/* Match info header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold font-orbitron text-white tracking-wider drop-shadow-[0_0_10px_rgba(240,183,31,0.5)]">
            KASPA<span className="text-cyber-gold">CLASH</span>
          </span>
          {!channelState.isConnected && (
            <span className="text-cyber-gold text-sm flex items-center gap-1 font-orbitron tracking-wide">
              <span className="w-2 h-2 bg-cyber-gold rounded-full animate-pulse" />
              CONNECTING...
            </span>
          )}
        </div>
        <div className="text-cyber-gray text-xs font-orbitron tracking-widest opacity-80">
          MATCH: <span className="text-cyber-gold">{match.id.slice(0, 8)}</span>
        </div>
      </div>

      {/* Phaser game container */}
      <div className="w-full h-screen">
        {(() => {
          console.log("[MatchGameClient] Rendering PhaserGame with:");
          console.log("[MatchGameClient]   initialScene:", initialScene);
          console.log("[MatchGameClient]   reconnectState:", reconnectState);
          console.log("[MatchGameClient]   isReconnect:", !!reconnectState);
          return null;
        })()}
        <PhaserGame
          currentScene={initialScene}
          sceneConfig={
            initialScene === "FightScene" ? {
              matchId: match.id,
              player1Address: match.player1Address,
              player2Address: match.player2Address || "",
              player1Character: match.player1CharacterId || "dag-warrior",
              player2Character: match.player2CharacterId || "dag-warrior",
              playerRole: playerRole,
              isBot: match.isBot,
              // Pass reconnect state if available
              isReconnect: !!reconnectState,
              reconnectState: reconnectState?.gameState,
            } : initialScene === "CharacterSelectScene" ? {
              matchId: match.id,
              playerAddress: match.player1Address,
              opponentAddress: match.player2Address || "",
              isHost: playerRole === "player1",
              selectionTimeLimit: 30,
              selectionDeadlineAt: match.selectionDeadlineAt,
              existingPlayerCharacter: match.player1CharacterId,
              existingOpponentCharacter: match.player2CharacterId,
              ownedCharacterIds: ownedCharacterIds,
            } : initialScene === "ResultsScene" ? {
              result: {
                winner: match.winnerAddress === match.player1Address ? "player1" :
                  match.winnerAddress === match.player2Address ? "player2" : null,
                reason: (match as any).endReason || "rounds_won",
                player1FinalHealth: 0, // Fallback as basic match data lacks this
                player2FinalHealth: 0,
                player1RoundsWon: match.player1RoundsWon,
                player2RoundsWon: match.player2RoundsWon,
                txIds: [],
              },
              playerRole: playerRole,
              matchId: match.id,
              player1CharacterId: match.player1CharacterId || "dag-warrior",
              player2CharacterId: match.player2CharacterId || "dag-warrior",
            } : {
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
            } as any
          }
        />


      </div>

    </div>
  );
}
