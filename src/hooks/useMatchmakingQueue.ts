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
  selectionDeadlineAt?: string; // ISO timestamp for timer sync
}

/**
 * Queue status response from API.
 */
interface QueueStatusResponse {
  inQueue: boolean;
  queueSize: number;
  matchPending?: boolean; // True when a match is being created for us
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
 * Polling interval in milliseconds (check for matches every 1 second for faster detection).
 */
const POLL_INTERVAL = 1000;

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

  // Guards against race conditions
  const matchHandledRef = useRef<string | null>(null); // Prevents duplicate handleMatchFound calls
  const navigationPendingRef = useRef(false); // Tracks if we're navigating
  const isInQueueRef = useRef(false); // Tracks if we're currently in queue for polling

  // Derived state
  const isInQueue = useMatchmakingStore(selectIsInQueue);
  const playerCount = useMatchmakingStore(selectPlayerCount);

  // Keep ref in sync with queue state
  useEffect(() => {
    isInQueueRef.current = isInQueue;
  }, [isInQueue]);

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
   * Includes guards against duplicate calls and race conditions.
   */
  const handleMatchFound = useCallback(async (matchData: MatchFoundEvent) => {
    const { matchId, player1Address, player2Address, selectionDeadlineAt } = matchData;

    // Check if this match involves the current player
    if (!address || (player1Address !== address && player2Address !== address)) {
      return;
    }

    // Guard against duplicate handleMatchFound calls for the same match
    if (matchHandledRef.current === matchId) {
      console.log("Match already handled, ignoring duplicate:", matchId);
      return;
    }

    // Guard against calling while navigation is pending
    if (navigationPendingRef.current) {
      console.log("Navigation already pending, ignoring:", matchId);
      return;
    }

    console.log("Match found!", matchData);

    // Mark as handling this match immediately to prevent duplicates
    matchHandledRef.current = matchId;
    navigationPendingRef.current = true;

    // Stop polling immediately
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Verify match exists before navigation
    try {
      const verifyResponse = await fetch(`/api/matches/${matchId}/verify`);
      if (!verifyResponse.ok) {
        console.warn("Match verification failed, will retry on next poll");
        // Reset guards to allow retry
        matchHandledRef.current = null;
        navigationPendingRef.current = false;
        return;
      }
    } catch (error) {
      console.warn("Match verification error:", error);
      // Reset guards to allow retry
      matchHandledRef.current = null;
      navigationPendingRef.current = false;
      return;
    }

    // Update store state
    store.setMatched({
      matchId,
      player1Address,
      player2Address,
      createdAt: new Date(),
      selectionDeadlineAt, // Server-managed deadline for timer sync
    });

    // Navigate to match after a short delay (just show the "matched" UI briefly)
    setTimeout(() => {
      router.push(`/match/${matchId}`);
    }, 500);
  }, [address, store, router]);

  /**
   * Poll for queue status and match results.
   * Continues polling until navigation is confirmed to prevent missed matches.
   */
  const pollQueueStatus = useCallback(async () => {
    // Skip if navigation is pending (we're about to leave this screen)
    if (navigationPendingRef.current) {
      console.log("Skipping poll - navigation pending");
      return;
    }

    // Skip if no address
    if (!address) return;

    // Skip if not in queue (prevents polling spam after leaving queue)
    if (!isInQueueRef.current) {
      console.log("Skipping poll - not in queue");
      return;
    }

    try {
      const response = await fetch(`/api/matchmaking/queue?address=${encodeURIComponent(address)}`);

      if (response.ok) {
        const data: QueueStatusResponse = await response.json();

        // Update player count (only if still in queue state)
        if (!navigationPendingRef.current) {
          store.setPlayersInQueue(
            Array(data.queueSize).fill(null).map((_, i) => ({
              address: `player-${i}`,
              displayName: null,
              rating: 1000,
              joinedAt: Date.now(),
            }))
          );
        }

        // If match is pending (we've been claimed), show matching state
        if (data.matchPending && !navigationPendingRef.current) {
          console.log("Match pending - showing matching state");
          store.setMatching();
        }

        // Check if match was found
        if (data.matchFound) {
          await handleMatchFound(data.matchFound);
        }
      }
    } catch (error) {
      console.warn("Queue poll failed:", error);
      // Don't set error - polling failures are expected occasionally
    }
  }, [address, store, handleMatchFound]);

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
    // Clear local state FIRST to stop polling immediately
    store.leaveQueue();
    
    // Stop polling immediately (synchronous)
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Reset match handling refs
    matchHandledRef.current = null;
    navigationPendingRef.current = false;

    try {
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
    } catch (error) {
      console.error("Error leaving queue:", error);
      // Local state already cleared above
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
