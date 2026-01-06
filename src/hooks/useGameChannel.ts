/**
 * useGameChannel Hook
 * Manages Supabase Realtime subscription for game:${matchId} channel
 * Handles all game events: round_starting, move_submitted, move_confirmed, round_resolved, match_ended
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useMatchStore, useMatchActions } from "@/stores/match-store";
import { GameState } from "@/lib/game/state-machine";
import { EventBus } from "@/game/EventBus";
import type {
  RoundStartingPayload,
  MoveSubmittedPayload,
  MoveConfirmedPayload,
  RoundResolvedPayload,
  MatchEndedPayload,
  GamePlayerPresence,
  MatchStartingPayload,
  CharacterSelectedPayload,
} from "@/types/websocket";
import type { PlayerRole } from "@/types";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Game channel state.
 */
export interface GameChannelState {
  isConnected: boolean;
  isSubscribed: boolean;
  players: Map<string, GamePlayerPresence>;
  error: string | null;
}

/**
 * Game channel hook options.
 */
export interface UseGameChannelOptions {
  matchId: string;
  playerAddress: string;
  playerRole: PlayerRole;
  onRoundStarting?: (payload: RoundStartingPayload) => void;
  onMoveSubmitted?: (payload: MoveSubmittedPayload) => void;
  onMoveConfirmed?: (payload: MoveConfirmedPayload) => void;
  onRoundResolved?: (payload: RoundResolvedPayload) => void;
  onMatchEnded?: (payload: MatchEndedPayload) => void;
  onCharacterSelected?: (payload: CharacterSelectedPayload) => void;
  onMatchStarting?: (payload: MatchStartingPayload) => void;
  onPlayerJoin?: (presence: GamePlayerPresence) => void;
  onPlayerLeave?: (address: string) => void;
  onError?: (error: string) => void;
}

/**
 * Game channel hook return type.
 */
export interface UseGameChannelReturn {
  state: GameChannelState;
  subscribe: () => Promise<void>;
  unsubscribe: () => void;
  trackPresence: (isReady: boolean) => Promise<void>;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useGameChannel(options: UseGameChannelOptions): UseGameChannelReturn {
  const {
    matchId,
    playerAddress,
    playerRole,
    onRoundStarting,
    onMoveSubmitted,
    onMoveConfirmed,
    onRoundResolved,
    onMatchEnded,
    onCharacterSelected,
    onMatchStarting,
    onPlayerJoin,
    onPlayerLeave,
    onError,
  } = options;

  const matchActions = useMatchActions();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [state, setState] = useState<GameChannelState>({
    isConnected: false,
    isSubscribed: false,
    players: new Map(),
    error: null,
  });

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Handle round_starting event.
   */
  const handleRoundStarting = useCallback(
    (payload: RoundStartingPayload) => {
      console.log(`[GameChannel] *** round_starting broadcast received - Round ${payload.roundNumber}, Turn ${payload.turnNumber}, Timestamp: ${Date.now()}`);
      console.log("[GameChannel] *** Full payload:", payload);

      // Update match store
      matchActions.startRound(payload.roundNumber);
      matchActions.setPlayerHealth("player1", payload.player1Health);
      matchActions.setPlayerHealth("player2", payload.player2Health);

      // Emit to Phaser
      console.log(`[GameChannel] *** Emitting game:roundStarting to EventBus`);
      EventBus.emit("game:roundStarting", payload);

      // Call user callback
      onRoundStarting?.(payload);
    },
    [matchActions, onRoundStarting]
  );

  /**
   * Handle move_submitted event.
   */
  const handleMoveSubmitted = useCallback(
    (payload: MoveSubmittedPayload) => {
      console.log("[GameChannel] move_submitted:", payload);

      // Emit to Phaser for UI update (show opponent pending)
      EventBus.emit("game:moveSubmitted", payload);

      // Call user callback
      onMoveSubmitted?.(payload);
    },
    [onMoveSubmitted]
  );

  /**
   * Handle move_confirmed event.
   */
  const handleMoveConfirmed = useCallback(
    (payload: MoveConfirmedPayload) => {
      console.log("[GameChannel] move_confirmed:", payload);

      // Update match store
      matchActions.confirmMove(payload.player);

      // Emit to Phaser (show confirmed icon)
      EventBus.emit("game:moveConfirmed", payload);

      // Call user callback
      onMoveConfirmed?.(payload);
    },
    [matchActions, onMoveConfirmed]
  );

  /**
   * Handle round_resolved event.
   */
  const handleRoundResolved = useCallback(
    (payload: RoundResolvedPayload) => {
      console.log(`[GameChannel] *** round_resolved broadcast received - Timestamp: ${Date.now()}`);
      console.log("[GameChannel] *** isRoundOver:", payload.isRoundOver, "isMatchOver:", payload.isMatchOver);

      // Update match store with resolution
      matchActions.resolveRound(
        payload.player1.move,
        payload.player2.move,
        payload.player1.damageDealt,
        payload.player2.damageDealt
      );

      // Update round winner
      matchActions.setRoundWinner(payload.roundWinner);

      // Emit to Phaser (trigger animations, update scores)
      console.log(`[GameChannel] *** Emitting game:roundResolved to EventBus`);
      EventBus.emit("game:roundResolved", payload);

      // Call user callback
      onRoundResolved?.(payload);
    },
    [matchActions, onRoundResolved]
  );

  /**
   * Handle match_ended event.
   */
  const handleMatchEnded = useCallback(
    (payload: MatchEndedPayload) => {
      console.log("[GameChannel] match_ended:", payload);

      // Get final health from current state
      const { player1Health, player2Health } = useMatchStore.getState().currentRound;

      // Update match store
      matchActions.endMatch({
        winner: payload.winner,
        reason: payload.reason,
        player1FinalHealth: player1Health,
        player2FinalHealth: player2Health,
        player1RoundsWon: payload.finalScore.player1RoundsWon,
        player2RoundsWon: payload.finalScore.player2RoundsWon,
        txIds: [], // Collect from rounds
        ratingChanges: payload.ratingChanges,
      });

      // Emit to Phaser (show results, explorer link)
      EventBus.emit("game:matchEnded", payload);

      // Call user callback
      onMatchEnded?.(payload);
    },
    [matchActions, onMatchEnded]
  );

  /**
   * Handle character_selected event.
   */
  const handleCharacterSelected = useCallback(
    (payload: CharacterSelectedPayload) => {
      console.log("[GameChannel] character_selected:", payload);

      // Only process opponent's selection, not our own
      // Broadcasts go to all subscribers including the sender, so we must filter
      if (payload.player === playerRole) {
        console.log("[GameChannel] Ignoring own character_selected event");
        return;
      }

      // Emit to Phaser - use event name that CharacterSelectScene expects
      // The scene listens for "opponent_character_confirmed" when opponent locks in
      if (payload.locked && payload.characterId) {
        EventBus.emit("opponent_character_confirmed", {
          characterId: payload.characterId,
        });
      } else {
        EventBus.emit("opponent_character_selected", {
          characterId: payload.characterId,
        });
      }

      // Also emit the generic event for other listeners
      EventBus.emit("game:characterSelected", payload);

      // Call user callback
      onCharacterSelected?.(payload);
    },
    [playerRole, onCharacterSelected]
  );

  /**
   * Handle match_starting event.
   */
  const handleMatchStarting = useCallback(
    (payload: MatchStartingPayload) => {
      console.log("[GameChannel] match_starting received at:", Date.now());
      console.log("[GameChannel] match_starting payload:", JSON.stringify(payload));

      // Transition game state
      matchActions.transitionTo(GameState.COUNTDOWN);

      // Emit to Phaser - use event name that CharacterSelectScene expects
      // Calculate countdown in seconds from startsAt timestamp
      const countdown = Math.max(1, Math.ceil((payload.startsAt - Date.now()) / 1000));
      EventBus.emit("match_starting", {
        countdown,
        player1CharacterId: payload.player1.characterId,
        player2CharacterId: payload.player2.characterId,
      });

      // Also emit the generic event for other listeners
      EventBus.emit("game:matchStarting", payload);

      // Call user callback
      onMatchStarting?.(payload);
    },
    [matchActions, onMatchStarting]
  );

  /**
   * Handle move_rejected event.
   * Called when opponent rejects their wallet transaction.
   */
  const handleMoveRejected = useCallback(
    (payload: { player: "player1" | "player2"; rejectedAt: number }) => {
      console.log("[GameChannel] move_rejected:", payload);

      // Emit to Phaser to show opponent rejected message
      EventBus.emit("game:moveRejected", payload);
    },
    []
  );

  /**
   * Handle match_cancelled event.
   * Called when both players reject transactions.
   */
  const handleMatchCancelled = useCallback(
    (payload: { matchId: string; reason: string; message: string; redirectTo: string }) => {
      console.log("[GameChannel] match_cancelled:", payload);

      // Emit to Phaser to show cancellation message
      EventBus.emit("game:matchCancelled", payload);

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = payload.redirectTo;
      }, 2000);
    },
    []
  );

  /**
   * Handle player_disconnected event.
   * Called when opponent disconnects from the match.
   */
  const handlePlayerDisconnected = useCallback(
    (payload: { player: "player1" | "player2"; address: string; disconnectedAt: number; timeoutSeconds: number }) => {
      console.log("[GameChannel] player_disconnected:", payload);

      // Emit to Phaser to show disconnect overlay
      EventBus.emit("game:playerDisconnected", payload);
    },
    []
  );

  /**
   * Handle player_reconnected event.
   * Called when a disconnected player returns.
   */
  const handlePlayerReconnected = useCallback(
    (payload: { player: "player1" | "player2"; address: string; reconnectedAt: number }) => {
      console.log("[GameChannel] player_reconnected:", payload);

      // Emit to Phaser to hide disconnect overlay
      EventBus.emit("game:playerReconnected", payload);
    },
    []
  );

  /**
   * Handle presence sync.
   */
  const handlePresenceSync = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const presenceState = channel.presenceState<GamePlayerPresence>();
    const newPlayers = new Map<string, GamePlayerPresence>();

    for (const [, presences] of Object.entries(presenceState)) {
      for (const presence of presences) {
        newPlayers.set(presence.address, presence);
      }
    }

    // Only update state if players have actually changed to avoid infinite loops
    setState((prev) => {
      // Compare players maps - check if they have the same keys and values
      if (prev.players.size === newPlayers.size) {
        let isSame = true;
        for (const [address, presence] of newPlayers) {
          const prevPresence = prev.players.get(address);
          if (!prevPresence ||
            prevPresence.role !== presence.role ||
            prevPresence.isReady !== presence.isReady) {
            isSame = false;
            break;
          }
        }
        if (isSame) {
          return prev; // Return same reference to avoid re-render
        }
      }
      return { ...prev, players: newPlayers };
    });
  }, []);

  /**
   * Handle presence join.
   */
  const handlePresenceJoin = useCallback(
    (
      _key: string,
      currentPresences: GamePlayerPresence[],
      newPresences: GamePlayerPresence[]
    ) => {
      for (const presence of newPresences) {
        console.log("[GameChannel] Player joined:", presence.address);

        setState((prev) => {
          const players = new Map(prev.players);
          players.set(presence.address, presence);
          return { ...prev, players };
        });

        onPlayerJoin?.(presence);
      }
    },
    [onPlayerJoin]
  );

  /**
   * Handle presence leave.
   */
  const handlePresenceLeave = useCallback(
    (_key: string, currentPresences: GamePlayerPresence[], leftPresences: GamePlayerPresence[]) => {
      for (const presence of leftPresences) {
        console.log("[GameChannel] Player left:", presence.address);

        setState((prev) => {
          const players = new Map(prev.players);
          players.delete(presence.address);
          return { ...prev, players };
        });

        onPlayerLeave?.(presence.address);
      }
    },
    [onPlayerLeave]
  );

  // ===========================================================================
  // CHANNEL MANAGEMENT
  // ===========================================================================

  /**
   * Subscribe to the game channel.
   */
  const subscribe = useCallback(async () => {
    if (channelRef.current) {
      console.log("[GameChannel] Already subscribed");
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const channelName = `game:${matchId}`;

      console.log("[GameChannel] Subscribing to:", channelName);

      const channel = supabase.channel(channelName, {
        config: {
          presence: { key: playerAddress },
        },
      });

      // Set up broadcast event listeners
      channel
        .on("broadcast", { event: "round_starting" }, ({ payload }) => {
          handleRoundStarting(payload as RoundStartingPayload);
        })
        .on("broadcast", { event: "move_submitted" }, ({ payload }) => {
          handleMoveSubmitted(payload as MoveSubmittedPayload);
        })
        .on("broadcast", { event: "move_confirmed" }, ({ payload }) => {
          handleMoveConfirmed(payload as MoveConfirmedPayload);
        })
        .on("broadcast", { event: "round_resolved" }, ({ payload }) => {
          handleRoundResolved(payload as RoundResolvedPayload);
        })
        .on("broadcast", { event: "match_ended" }, ({ payload }) => {
          handleMatchEnded(payload as MatchEndedPayload);
        })
        .on("broadcast", { event: "character_selected" }, ({ payload }) => {
          handleCharacterSelected(payload as CharacterSelectedPayload);
        })
        .on("broadcast", { event: "match_starting" }, ({ payload }) => {
          handleMatchStarting(payload as MatchStartingPayload);
        })
        .on("broadcast", { event: "move_rejected" }, ({ payload }) => {
          handleMoveRejected(payload as { player: "player1" | "player2"; rejectedAt: number });
        })
        .on("broadcast", { event: "match_cancelled" }, ({ payload }) => {
          handleMatchCancelled(payload as { matchId: string; reason: string; message: string; redirectTo: string });
        })
        .on("broadcast", { event: "player_disconnected" }, ({ payload }) => {
          handlePlayerDisconnected(payload as { player: "player1" | "player2"; address: string; disconnectedAt: number; timeoutSeconds: number });
        })
        .on("broadcast", { event: "player_reconnected" }, ({ payload }) => {
          handlePlayerReconnected(payload as { player: "player1" | "player2"; address: string; reconnectedAt: number });
        });

      // Set up presence listeners
      channel
        .on("presence", { event: "sync" }, handlePresenceSync)
        .on("presence", { event: "join" }, ({ key, currentPresences, newPresences }) => {
          handlePresenceJoin(
            key,
            currentPresences as unknown as GamePlayerPresence[],
            newPresences as unknown as GamePlayerPresence[]
          );
        })
        .on("presence", { event: "leave" }, ({ key, currentPresences, leftPresences }) => {
          handlePresenceLeave(
            key,
            currentPresences as unknown as GamePlayerPresence[],
            leftPresences as unknown as GamePlayerPresence[]
          );
        });

      // Subscribe to the channel
      await channel.subscribe((status) => {
        console.log("[GameChannel] Subscription status:", status);

        if (status === "SUBSCRIBED") {
          setState((prev) => ({
            ...prev,
            isConnected: true,
            isSubscribed: true,
            error: null,
          }));

          // Track own presence
          channel.track({
            address: playerAddress,
            role: playerRole,
            isReady: false,
          });
        } else if (status === "CHANNEL_ERROR") {
          const error = "Failed to connect to game channel";
          setState((prev) => ({ ...prev, error }));
          onError?.(error);
        } else if (status === "CLOSED") {
          setState((prev) => ({
            ...prev,
            isConnected: false,
            isSubscribed: false,
          }));
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error("[GameChannel] Subscription error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [
    matchId,
    playerAddress,
    playerRole,
    handleRoundStarting,
    handleMoveSubmitted,
    handleMoveConfirmed,
    handleRoundResolved,
    handleMatchEnded,
    handleCharacterSelected,
    handleMatchStarting,
    handleMoveRejected,
    handleMatchCancelled,
    handlePlayerDisconnected,
    handlePlayerReconnected,
    handlePresenceSync,
    handlePresenceJoin,
    handlePresenceLeave,
    onError,
  ]);

  /**
   * Unsubscribe from the game channel.
   */
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      console.log("[GameChannel] Unsubscribing");
      channelRef.current.unsubscribe();
      channelRef.current = null;

      setState({
        isConnected: false,
        isSubscribed: false,
        players: new Map(),
        error: null,
      });
    }
  }, []);

  /**
   * Update presence with ready state.
   */
  const trackPresence = useCallback(
    async (isReady: boolean) => {
      if (channelRef.current) {
        await channelRef.current.track({
          address: playerAddress,
          role: playerRole,
          isReady,
        });
      }
    },
    [playerAddress, playerRole]
  );

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  // Auto-subscribe on mount if matchId is provided
  useEffect(() => {
    // Only subscribe if we have a matchId and haven't already subscribed
    if (matchId && !channelRef.current) {
      subscribe();
    }

    return () => {
      // Clean up on unmount
      if (channelRef.current) {
        console.log("[GameChannel] Cleanup: Unsubscribing");
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
    // Intentionally exclude subscribe from deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  return {
    state,
    subscribe,
    unsubscribe,
    trackPresence,
  };
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to check if opponent is connected.
 */
export function useOpponentConnected(
  players: Map<string, GamePlayerPresence>,
  playerRole: PlayerRole
): boolean {
  const opponentRole = playerRole === "player1" ? "player2" : "player1";

  for (const presence of players.values()) {
    if (presence.role === opponentRole) {
      return true;
    }
  }

  return false;
}

/**
 * Hook to check if both players are ready.
 */
export function useBothPlayersReady(players: Map<string, GamePlayerPresence>): boolean {
  let player1Ready = false;
  let player2Ready = false;

  for (const presence of players.values()) {
    if (presence.role === "player1" && presence.isReady) {
      player1Ready = true;
    }
    if (presence.role === "player2" && presence.isReady) {
      player2Ready = true;
    }
  }

  return player1Ready && player2Ready;
}
