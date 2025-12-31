/**
 * useMatchmakingQueue Hook
 * React hook for matchmaking queue with Supabase Realtime Presence
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
 * Presence state for a player in queue.
 */
interface QueuePresenceState {
  address: string;
  displayName: string | null;
  rating: number;
  joinedAt: number;
}

/**
 * Matchmaking event types from server.
 */
interface MatchFoundEvent {
  matchId: string;
  player1Address: string;
  player2Address: string;
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
 * React hook for matchmaking queue functionality.
 */
export function useMatchmakingQueue(): UseMatchmakingQueueReturn {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const store = useMatchmakingStore();
  const channelRef = useRef<RealtimeChannel | null>(null);
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
   * Handle presence sync event.
   */
  const handlePresenceSync = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const presenceState = channel.presenceState<QueuePresenceState>();
    const players: QueuedPlayer[] = [];

    // Convert presence state to player list
    Object.entries(presenceState).forEach(([key, presences]) => {
      presences.forEach((presence) => {
        players.push({
          address: presence.address,
          displayName: presence.displayName,
          rating: presence.rating,
          joinedAt: presence.joinedAt,
          presenceRef: key,
        });
      });
    });

    // Sort by join time
    players.sort((a, b) => a.joinedAt - b.joinedAt);
    store.setPlayersInQueue(players);
  }, [store]);

  /**
   * Handle match found broadcast event.
   */
  const handleMatchFound = useCallback((payload: { event: string; payload: MatchFoundEvent }) => {
    const { matchId, player1Address, player2Address } = payload.payload;

    // Check if this match involves the current player
    if (address && (player1Address === address || player2Address === address)) {
      store.setMatched({
        matchId,
        player1Address,
        player2Address,
        createdAt: new Date(),
      });

      // Navigate to match after a short delay
      setTimeout(() => {
        router.push(`/match/${matchId}`);
      }, 1500);
    }
  }, [address, store, router]);

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

      const supabase = getSupabaseClient();

      // Subscribe to queue channel with presence
      const channel = supabase.channel(QUEUE_CHANNEL, {
        config: {
          presence: {
            key: address,
          },
        },
      });

      channel
        .on("presence", { event: "sync" }, handlePresenceSync)
        .on("presence", { event: "join" }, ({ newPresences }) => {
          console.log("Player joined queue:", newPresences);
          handlePresenceSync();
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          console.log("Player left queue:", leftPresences);
          handlePresenceSync();
        })
        .on("broadcast", { event: "match_found" }, handleMatchFound)
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            // Track presence
            const presenceState: QueuePresenceState = {
              address,
              displayName: null, // TODO: Get from player profile
              rating: 1000, // TODO: Get from player profile
              joinedAt: Date.now(),
            };

            await channel.track(presenceState);
            channelRef.current = channel;
            store.setQueued(Date.now());
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            store.setQueueError("Connection lost. Please try again.");
          }
        });

    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join queue";
      store.setQueueError(message);
    }
  }, [address, isConnected, store, handlePresenceSync, handleMatchFound]);

  /**
   * Leave the matchmaking queue.
   */
  const leaveQueue = useCallback(async (): Promise<void> => {
    try {
      // Unsubscribe from channel
      const channel = channelRef.current;
      if (channel) {
        await channel.untrack();
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
      const channel = channelRef.current;
      if (channel) {
        channel.untrack();
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
