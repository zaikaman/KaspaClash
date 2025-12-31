/**
 * Matchmaker Service
 * Handles player pairing by rating and match creation
 * Uses Supabase database for persistent queue storage (cross-instance support)
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

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
 * Add a player to the matchmaking queue.
 */
export async function addToQueue(address: string, rating: number): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("matchmaking_queue")
    .upsert({
      address,
      rating,
      joined_at: new Date().toISOString(),
      status: "searching",
    }, {
      onConflict: "address",
    });

  if (error) {
    console.error("Failed to add player to queue:", error);
    throw new Error("Failed to join queue");
  }

  console.log(`Player ${address} added to queue (rating: ${rating})`);
}

/**
 * Remove a player from the matchmaking queue.
 */
export async function removeFromQueue(address: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("matchmaking_queue")
    .delete()
    .eq("address", address);

  if (error) {
    console.error("Failed to remove player from queue:", error);
  }

  console.log(`Player ${address} removed from queue`);
}

/**
 * Check if a player is in the queue.
 */
export async function isInQueue(address: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("matchmaking_queue")
    .select("address")
    .eq("address", address)
    .eq("status", "searching")
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
    console.error("Failed to check queue status:", error);
  }

  return !!data;
}

/**
 * Get current queue size.
 */
export async function getQueueSize(): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { count, error } = await supabase
    .from("matchmaking_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "searching");

  if (error) {
    console.error("Failed to get queue size:", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Get all players in queue.
 */
export async function getQueuedPlayers(): Promise<QueuedPlayer[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("matchmaking_queue")
    .select("address, rating, joined_at")
    .eq("status", "searching")
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("Failed to get queued players:", error);
    return [];
  }

  return (data || []).map(row => ({
    address: row.address,
    rating: row.rating,
    joinedAt: new Date(row.joined_at),
  }));
}

/**
 * Calculate the allowed rating range based on wait time.
 */
function calculateRatingRange(joinedAt: Date): number {
  const waitTimeSeconds = (Date.now() - joinedAt.getTime()) / 1000;

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
export async function findOpponent(
  playerAddress: string,
  playerRating: number,
  playerJoinedAt: Date
): Promise<QueuedPlayer | null> {
  const supabase = await createSupabaseServerClient();

  const ratingRange = calculateRatingRange(playerJoinedAt);
  const minRating = playerRating - ratingRange;
  const maxRating = playerRating + ratingRange;

  // Find players within rating range who are searching
  const { data, error } = await supabase
    .from("matchmaking_queue")
    .select("address, rating, joined_at")
    .eq("status", "searching")
    .neq("address", playerAddress)
    .gte("rating", minRating)
    .lte("rating", maxRating)
    .order("joined_at", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Failed to find opponent:", error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Find the best match (closest rating who also has us in their range)
  let bestMatch: QueuedPlayer | null = null;
  let smallestRatingDiff = Infinity;

  for (const candidate of data) {
    const candidateJoinedAt = new Date(candidate.joined_at);
    const candidateRange = calculateRatingRange(candidateJoinedAt);
    const ratingDiff = Math.abs(candidate.rating - playerRating);

    // Check if we're within the candidate's acceptable range
    if (ratingDiff <= candidateRange && ratingDiff < smallestRatingDiff) {
      smallestRatingDiff = ratingDiff;
      bestMatch = {
        address: candidate.address,
        rating: candidate.rating,
        joinedAt: candidateJoinedAt,
      };
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
  const supabase = await createSupabaseServerClient();

  // Get player from queue
  const { data: player, error: playerError } = await supabase
    .from("matchmaking_queue")
    .select("address, rating, joined_at")
    .eq("address", address)
    .eq("status", "searching")
    .single();

  if (playerError || !player) {
    return null;
  }

  const opponent = await findOpponent(
    address,
    player.rating,
    new Date(player.joined_at)
  );

  if (!opponent) {
    return null;
  }

  // Mark both players as matched (to prevent race conditions)
  const { error: updateError } = await supabase
    .from("matchmaking_queue")
    .update({ status: "matched" })
    .in("address", [address, opponent.address])
    .eq("status", "searching");

  if (updateError) {
    console.error("Failed to mark players as matched:", updateError);
    return null;
  }

  // Create match in database
  const match = await createMatch(address, opponent.address);
  if (!match) {
    // Reset players back to searching if match creation fails
    await supabase
      .from("matchmaking_queue")
      .update({ status: "searching" })
      .in("address", [address, opponent.address]);
    return null;
  }

  // Remove both players from queue
  await supabase
    .from("matchmaking_queue")
    .delete()
    .in("address", [address, opponent.address]);

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
  const players = await getQueuedPlayers();

  for (const player of players) {
    if (processedAddresses.has(player.address)) continue;

    const result = await attemptMatch(player.address);
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
    const channel = supabase.channel("matchmaking:queue");

    // Send without subscribing - this explicitly uses HTTP/REST API
    // This is the recommended approach for server-side broadcasts
    await channel.send({
      type: "broadcast",
      event: "match_found",
      payload: {
        matchId,
        player1Address,
        player2Address,
      },
    });

    // Clean up the channel after sending
    await supabase.removeChannel(channel);

    console.log(`Match found event broadcast for ${matchId}`);
  } catch (error) {
    console.error("Failed to broadcast match found:", error);
  }
}

/**
 * Clean up stale queue entries (players who have been in queue too long).
 * Should be called periodically by a background job.
 */
export async function cleanupStaleQueueEntries(
  maxAgeMinutes: number = 30
): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("matchmaking_queue")
    .delete()
    .lt("joined_at", cutoffTime)
    .select("address");

  if (error) {
    console.error("Failed to clean up stale queue entries:", error);
    return 0;
  }

  const count = data?.length ?? 0;
  if (count > 0) {
    console.log(`Cleaned up ${count} stale queue entries`);
  }

  return count;
}
