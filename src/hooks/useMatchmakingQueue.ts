/**
 * useMatchmakingQueue Hook
 * React hook for matchmaking queue with polling fallback
 * Uses API polling for reliability, with optional Realtime for live updates
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  useMatchmakingStore,
  selectIsInQueue,
  selectQueueWaitTime,
  selectPlayerCount,
  type QueuedPlayer,
  type MatchmakingResult,
} from "@/stores/matchmaking-store";
import { useWallet } from "./useWallet";

/**
 * Matchmaking event types from server.
 */
interface MatchFoundEvent {
  matchId: string;
  player1Address: string;
  player2Address: string;
}

/**
 * Queue status response from API.
 */
interface QueueStatusResponse {
  inQueue: boolean;
  queueSize: number;
  matchFound?: MatchFoundEvent;
}

/**
 * Hook return type.
 */
export interface UseMatchmakingQueueReturn {
  // State
  isInQueue: boolean;
  isJoining: boolean;
  isMatching: boolean;
  waitTimeSeconds: number;
  playerCount: number;
  playersInQueue: QueuedPlayer[];
  error: string | null;
  matchResult: MatchmakingResult | null;

  // Actions
  joinQueue: () => Promise<void>;
  leaveQueue: () => Promise<void>;

  // Utilities
  formatWaitTime: (seconds: number) => string;
}

/**
 * Channel name for matchmaking queue.
 */
const QUEUE_CHANNEL = "matchmaking:queue";

/**
 * Polling interval in milliseconds (check for matches every 2 seconds).
 */
const POLL_INTERVAL = 2000;

/**
 * React hook for matchmaking queue functionality.
 * Uses polling for reliability with optional Realtime enhancement.
 */
export function useMatchmakingQueue(): UseMatchmakingQueueReturn {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const store = useMatchmakingStore();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [waitTimeSeconds, setWaitTimeSeconds] = useState(0);

  // Derived state
  const isInQueue = useMatchmakingStore(selectIsInQueue);
  const playerCount = useMatchmakingStore(selectPlayerCount);

  // Timer for wait time
  useEffect(() => {
    if (!isInQueue || !store.queuedAt) {
      setWaitTimeSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setWaitTimeSeconds(selectQueueWaitTime(store));
    }, 1000);

    return () => clearInterval(interval);
  }, [isInQueue, store.queuedAt, store]);

  /**
   * Handle match found - navigate to match.
   */
  const handleMatchFound = useCallback((matchData: MatchFoundEvent) => {
    const { matchId, player1Address, player2Address } = matchData;

    // Check if this match involves the current player
    if (address && (player1Address === address || player2Address === address)) {
      console.log("Match found!", matchData);

      store.setMatched({
        matchId,
        player1Address,
        player2Address,
        createdAt: new Date(),
      });

      // Stop polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      // Navigate to match after a short delay
      setTimeout(() => {
        router.push(`/match/${matchId}`);
      }, 1500);
    }
  }, [address, store, router]);

  /**
   * Poll for queue status and match results.
   */
  const pollQueueStatus = useCallback(async () => {
    if (!address || !isInQueue) return;

    try {
      const response = await fetch(`/api/matchmaking/queue?address=${encodeURIComponent(address)}`);

      if (response.ok) {
        const data: QueueStatusResponse = await response.json();

        // Update player count
        store.setPlayersInQueue(
          Array(data.queueSize).fill(null).map((_, i) => ({
            address: `player-${i}`,
            displayName: null,
            rating: 1000,
            joinedAt: Date.now(),
          }))
        );

        // Check if match was found
        if (data.matchFound) {
          handleMatchFound(data.matchFound);
        }
      }
    } catch (error) {
      console.warn("Queue poll failed:", error);
      // Don't set error - polling failures are expected occasionally
    }
  }, [address, isInQueue, store, handleMatchFound]);

  /**
   * Set up Realtime subscription for instant match notifications.
   */
  const setupRealtime = useCallback(() => {
    if (!address) return;

    try {
      const supabase = getSupabaseClient();

      const channel = supabase.channel(QUEUE_CHANNEL)
        .on("broadcast", { event: "match_found" }, (payload) => {
          console.log("Realtime match_found event:", payload);
          if (payload.payload) {
            handleMatchFound(payload.payload as MatchFoundEvent);
          }
        })
        .subscribe((status) => {
          console.log("Realtime subscription status:", status);
          if (status === "SUBSCRIBED") {
            channelRef.current = channel;
          }
        });

      return channel;
    } catch (error) {
      console.warn("Failed to set up realtime:", error);
      // Not critical - polling will handle it
      return null;
    }
  }, [address, handleMatchFound]);

  /**
   * Join the matchmaking queue.
   */
  const joinQueue = useCallback(async (): Promise<void> => {
    if (!isConnected || !address) {
      store.setQueueError("Wallet not connected");
      return;
    }

    try {
      store.joinQueue();

      // Call API to join queue
      const response = await fetch("/api/matchmaking/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to join queue");
      }

      const result = await response.json();

      // Check if immediately matched
      if (result.matched && result.match) {
        handleMatchFound({
          matchId: result.match.id,
          player1Address: result.match.player1Address,
          player2Address: result.match.player2Address,
        });
        return;
      }

      // Mark as queued
      store.setQueued(Date.now());

      // Set up Realtime for instant notifications
      setupRealtime();

      // Start polling as backup (more reliable)
      pollIntervalRef.current = setInterval(pollQueueStatus, POLL_INTERVAL);

      // Initial poll
      pollQueueStatus();

    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join queue";
      store.setQueueError(message);
    }
  }, [address, isConnected, store, handleMatchFound, setupRealtime, pollQueueStatus]);

  /**
   * Leave the matchmaking queue.
   */
  const leaveQueue = useCallback(async (): Promise<void> => {
    try {
      // Stop polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      // Unsubscribe from channel
      const channel = channelRef.current;
      if (channel) {
        await channel.unsubscribe();
        channelRef.current = null;
      }

      // Call API to leave queue
      if (address) {
        await fetch("/api/matchmaking/queue", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
      }

      store.leaveQueue();
    } catch (error) {
      console.error("Error leaving queue:", error);
      // Still clear local state
      store.leaveQueue();
    }
  }, [address, store]);

  /**
   * Format wait time for display.
   */
  const formatWaitTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      const channel = channelRef.current;
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  /**
   * Leave queue if wallet disconnects.
   */
  useEffect(() => {
    if (!isConnected && isInQueue) {
      leaveQueue();
    }
  }, [isConnected, isInQueue, leaveQueue]);

  return {
    // State
    isInQueue,
    isJoining: store.queueStatus === "joining",
    isMatching: store.queueStatus === "matching",
    waitTimeSeconds,
    playerCount,
    playersInQueue: store.playersInQueue,
    error: store.error,
    matchResult: store.matchResult,

    // Actions
    joinQueue,
    leaveQueue,

    // Utilities
    formatWaitTime,
  };
}

export default useMatchmakingQueue;
