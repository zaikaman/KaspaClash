/**
 * Matchmaker Service
 * Handles player pairing by rating and match creation
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Player in queue representation.
 */
export interface QueuedPlayer {
  address: string;
  rating: number;
  joinedAt: Date;
}

/**
 * Match result from matchmaking.
 */
export interface MatchResult {
  matchId: string;
  player1Address: string;
  player2Address: string;
}

/**
 * Matchmaking configuration.
 */
const MATCHMAKING_CONFIG = {
  /** Maximum rating difference for immediate match */
  INITIAL_RATING_RANGE: 100,
  /** Rating range expansion per second of waiting */
  RATING_EXPANSION_RATE: 5,
  /** Maximum rating difference allowed */
  MAX_RATING_RANGE: 500,
  /** Minimum wait time before expanding range (seconds) */
  MIN_WAIT_BEFORE_EXPANSION: 10,
};

/**
 * In-memory queue for active matchmaking.
 * In production, this should be replaced with Redis or similar.
 */
const matchmakingQueue = new Map<string, QueuedPlayer>();

/**
 * Add a player to the matchmaking queue.
 */
export async function addToQueue(address: string, rating: number): Promise<void> {
  const player: QueuedPlayer = {
    address,
    rating,
    joinedAt: new Date(),
  };

  matchmakingQueue.set(address, player);
  console.log(`Player ${address} added to queue (rating: ${rating})`);
}

/**
 * Remove a player from the matchmaking queue.
 */
export async function removeFromQueue(address: string): Promise<void> {
  matchmakingQueue.delete(address);
  console.log(`Player ${address} removed from queue`);
}

/**
 * Check if a player is in the queue.
 */
export function isInQueue(address: string): boolean {
  return matchmakingQueue.has(address);
}

/**
 * Get current queue size.
 */
export function getQueueSize(): number {
  return matchmakingQueue.size;
}

/**
 * Get all players in queue.
 */
export function getQueuedPlayers(): QueuedPlayer[] {
  return Array.from(matchmakingQueue.values());
}

/**
 * Calculate the allowed rating range based on wait time.
 */
function calculateRatingRange(player: QueuedPlayer): number {
  const waitTimeSeconds = (Date.now() - player.joinedAt.getTime()) / 1000;

  if (waitTimeSeconds < MATCHMAKING_CONFIG.MIN_WAIT_BEFORE_EXPANSION) {
    return MATCHMAKING_CONFIG.INITIAL_RATING_RANGE;
  }

  const expansion =
    (waitTimeSeconds - MATCHMAKING_CONFIG.MIN_WAIT_BEFORE_EXPANSION) *
    MATCHMAKING_CONFIG.RATING_EXPANSION_RATE;

  return Math.min(
    MATCHMAKING_CONFIG.INITIAL_RATING_RANGE + expansion,
    MATCHMAKING_CONFIG.MAX_RATING_RANGE
  );
}

/**
 * Find a suitable opponent for a player.
 */
export function findOpponent(
  playerAddress: string,
  playerRating: number,
  playerJoinedAt: Date
): QueuedPlayer | null {
  const player: QueuedPlayer = {
    address: playerAddress,
    rating: playerRating,
    joinedAt: playerJoinedAt,
  };

  const ratingRange = calculateRatingRange(player);
  let bestMatch: QueuedPlayer | null = null;
  let smallestRatingDiff = Infinity;

  for (const [address, candidate] of matchmakingQueue) {
    // Skip self
    if (address === playerAddress) continue;

    const ratingDiff = Math.abs(candidate.rating - playerRating);
    const candidateRange = calculateRatingRange(candidate);

    // Check if both players are within each other's acceptable range
    if (ratingDiff <= ratingRange && ratingDiff <= candidateRange) {
      // Prefer closer rating matches
      if (ratingDiff < smallestRatingDiff) {
        smallestRatingDiff = ratingDiff;
        bestMatch = candidate;
      }
    }
  }

  return bestMatch;
}

/**
 * Attempt to match a player with someone in the queue.
 * Returns match result if successful, null otherwise.
 */
export async function attemptMatch(
  address: string
): Promise<MatchResult | null> {
  const player = matchmakingQueue.get(address);
  if (!player) return null;

  const opponent = findOpponent(address, player.rating, player.joinedAt);
  if (!opponent) return null;

  // Remove both players from queue
  removeFromQueue(address);
  removeFromQueue(opponent.address);

  // Create match in database
  const match = await createMatch(address, opponent.address);
  if (!match) {
    // Re-add players to queue if match creation fails
    await addToQueue(address, player.rating);
    await addToQueue(opponent.address, opponent.rating);
    return null;
  }

  return {
    matchId: match.id,
    player1Address: address,
    player2Address: opponent.address,
  };
}

/**
 * Create a new match in the database.
 */
export async function createMatch(
  player1Address: string,
  player2Address: string
): Promise<{ id: string } | null> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("matches")
      .insert({
        player1_address: player1Address,
        player2_address: player2Address,
        status: "character_select",
        format: "best_of_3",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create match:", error);
      return null;
    }

    console.log(`Match created: ${data.id} (${player1Address} vs ${player2Address})`);
    return data;
  } catch (error) {
    console.error("Error creating match:", error);
    return null;
  }
}

/**
 * Create a private room with a room code.
 */
export async function createRoom(hostAddress: string): Promise<{
  id: string;
  code: string;
} | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // Generate a unique 6-character room code
    const code = generateRoomCode();

    const { data, error } = await supabase
      .from("matches")
      .insert({
        player1_address: hostAddress,
        room_code: code,
        status: "waiting",
        format: "best_of_3",
      })
      .select("id, room_code")
      .single();

    if (error) {
      console.error("Failed to create room:", error);
      return null;
    }

    console.log(`Room created: ${code} by ${hostAddress}`);
    return { id: data.id, code: data.room_code! };
  } catch (error) {
    console.error("Error creating room:", error);
    return null;
  }
}

/**
 * Join an existing room by code.
 */
export async function joinRoom(
  guestAddress: string,
  roomCode: string
): Promise<{ id: string; hostAddress: string } | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // Find the room
    const { data: room, error: findError } = await supabase
      .from("matches")
      .select("id, player1_address, player2_address, status")
      .eq("room_code", roomCode.toUpperCase())
      .eq("status", "waiting")
      .single();

    if (findError || !room) {
      console.error("Room not found:", roomCode);
      return null;
    }

    // Check if room is already full
    if (room.player2_address) {
      console.error("Room is full:", roomCode);
      return null;
    }

    // Check if trying to join own room
    if (room.player1_address === guestAddress) {
      console.error("Cannot join own room");
      return null;
    }

    // Update match with second player
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        player2_address: guestAddress,
        status: "character_select",
      })
      .eq("id", room.id);

    if (updateError) {
      console.error("Failed to join room:", updateError);
      return null;
    }

    console.log(`Player ${guestAddress} joined room ${roomCode}`);
    return { id: room.id, hostAddress: room.player1_address };
  } catch (error) {
    console.error("Error joining room:", error);
    return null;
  }
}

/**
 * Generate a random 6-character room code.
 */
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Run matchmaking cycle for all players in queue.
 * This would typically be called by a background job.
 */
export async function runMatchmakingCycle(): Promise<MatchResult[]> {
  const results: MatchResult[] = [];
  const processedAddresses = new Set<string>();

  for (const [address] of matchmakingQueue) {
    if (processedAddresses.has(address)) continue;

    const result = await attemptMatch(address);
    if (result) {
      results.push(result);
      processedAddresses.add(result.player1Address);
      processedAddresses.add(result.player2Address);
    }
  }

  return results;
}

/**
 * Broadcast match found event via Supabase Realtime.
 */
export async function broadcastMatchFound(
  matchId: string,
  player1Address: string,
  player2Address: string
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    await supabase.channel("matchmaking:queue").send({
      type: "broadcast",
      event: "match_found",
      payload: {
        matchId,
        player1Address,
        player2Address,
      },
    });

    console.log(`Match found event broadcast for ${matchId}`);
  } catch (error) {
    console.error("Failed to broadcast match found:", error);
  }
}
