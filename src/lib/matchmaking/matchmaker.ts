/**
 * Matchmaker Service
 * Handles player pairing by rating and match creation
 * Uses Supabase database for persistent queue storage (cross-instance support)
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getNetworkAddressFilter, detectNetworkFromAddress } from "@/lib/utils/network-filter";

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
  selectionDeadlineAt: string; // ISO timestamp for timer sync
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
 * Only matches players on the same network (mainnet or testnet).
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

  // Determine network from player address
  const network = detectNetworkFromAddress(playerAddress);
  const addressFilter = getNetworkAddressFilter(network);

  // Find players within rating range who are searching ON THE SAME NETWORK
  const { data, error } = await supabase
    .from("matchmaking_queue")
    .select("address, rating, joined_at")
    .eq("status", "searching")
    .neq("address", playerAddress)
    .like("address", addressFilter) // Only match same network
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
 * Uses a DETERMINISTIC TIE-BREAKER to prevent race conditions:
 * - Only the player with the lexicographically "lower" address initiates claims
 * - The "higher" address player waits to be claimed
 * This ensures only one player ever tries to create the match.
 * Returns match result if successful, null otherwise.
 */
export async function attemptMatch(
  address: string
): Promise<MatchResult | null> {
  const supabase = await createSupabaseServerClient();
  const shortAddr = address.slice(-8); // Short address for logging

  console.log(`[MATCHMAKING] ${shortAddr}: Starting attemptMatch`);

  // CRITICAL: First check if player already has an active match
  // This prevents duplicate matches from racing attemptMatch calls
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("id, player1_address, player2_address, selection_deadline_at, created_at, status")
    .or(`player1_address.eq.${address},player2_address.eq.${address}`)
    .in("status", ["character_select", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingMatch && existingMatch.player2_address) {
    const shortId = existingMatch.id.slice(0, 8);

    // If we're in character_select OR in_progress, abandon the old match
    // This assumes that if a user is back in the queue, they have "left" the previous game
    console.log(`[MATCHMAKING] ${shortAddr}: Abandoning stale/stuck match ${shortId} (status: ${existingMatch.status})`);

    await supabase
      .from("matches")
      .update({
        status: "cancelled",
        completed_at: new Date().toISOString(),
      })
      .eq("id", existingMatch.id);

    // Continue execution to create a NEW match
  }

  // Step 1: Get the current player from queue
  const { data: player, error: playerError } = await supabase
    .from("matchmaking_queue")
    .select("address, rating, joined_at, status, matched_with")
    .eq("address", address)
    .single();

  if (playerError) {
    console.log(`[MATCHMAKING] ${shortAddr}: Player not in queue - ${playerError.message}`);
    return null;
  }

  if (!player) {
    console.log(`[MATCHMAKING] ${shortAddr}: Player not found in queue`);
    return null;
  }

  // If we've been claimed by someone else, don't try to initiate - just wait
  if (player.status === "matched" && player.matched_with) {
    console.log(`[MATCHMAKING] ${shortAddr}: Already claimed by ${player.matched_with.slice(-8)}, waiting for match creation`);
    return null;
  }

  if (player.status !== "searching") {
    console.log(`[MATCHMAKING] ${shortAddr}: Player status is '${player.status}', not searching`);
    return null;
  }

  console.log(`[MATCHMAKING] ${shortAddr}: Player in queue with rating ${player.rating}`);

  const playerJoinedAt = new Date(player.joined_at);
  const ratingRange = calculateRatingRange(playerJoinedAt);
  const minRating = player.rating - ratingRange;
  const maxRating = player.rating + ratingRange;

  // Determine network from player address
  const network = detectNetworkFromAddress(address);
  const addressFilter = getNetworkAddressFilter(network);

  console.log(`[MATCHMAKING] ${shortAddr}: Looking for ${network} opponents with rating ${minRating}-${maxRating}`);

  // Step 2: Find potential opponents ON THE SAME NETWORK (just SELECT, no update yet)
  const { data: candidates, error: findError } = await supabase
    .from("matchmaking_queue")
    .select("address, rating, status")
    .eq("status", "searching")
    .neq("address", address)
    .like("address", addressFilter) // Only match same network
    .gte("rating", minRating)
    .lte("rating", maxRating)
    .order("joined_at", { ascending: true })
    .limit(5);

  if (findError) {
    console.log(`[MATCHMAKING] ${shortAddr}: Error finding opponents - ${findError.message}`);
    return null;
  }

  if (!candidates || candidates.length === 0) {
    console.log(`[MATCHMAKING] ${shortAddr}: No ${network} opponents found in rating range`);
    return null;
  }

  console.log(`[MATCHMAKING] ${shortAddr}: Found ${candidates.length} potential opponents: ${candidates.map(c => c.address.slice(-8)).join(', ')}`);

  // Step 3: DETERMINISTIC TIE-BREAKER
  // Only attempt to claim if we have the "lower" address (lexicographically)
  // This prevents both players from trying to claim each other simultaneously
  let claimedOpponent: { address: string; rating: number } | null = null;

  for (const candidate of candidates) {
    const candidateShort = candidate.address.slice(-8);

    // TIE-BREAKER: Only the lower address initiates the claim
    if (address > candidate.address) {
      console.log(`[MATCHMAKING] ${shortAddr}: Skipping ${candidateShort} - they should initiate (tie-breaker)`);
      continue;
    }

    console.log(`[MATCHMAKING] ${shortAddr}: Attempting to claim ${candidateShort} (we are initiator)...`);

    // Use 'matched' status (DB only allows 'searching' or 'matched')
    const { data: claimed, error: claimError } = await supabase
      .from("matchmaking_queue")
      .update({
        status: "matched",
        matched_with: address
      })
      .eq("address", candidate.address)
      .eq("status", "searching") // Critical: only claim if still searching
      .select("address, rating");

    if (claimError) {
      console.log(`[MATCHMAKING] ${shortAddr}: Claim error for ${candidateShort} - ${claimError.message}`);
      continue;
    }

    if (claimed && claimed.length > 0) {
      claimedOpponent = claimed[0];
      console.log(`[MATCHMAKING] ${shortAddr}: ✓ Successfully claimed ${candidateShort}`);
      break;
    } else {
      console.log(`[MATCHMAKING] ${shortAddr}: ✗ Failed to claim ${candidateShort} (already claimed or not searching)`);
    }
  }

  if (!claimedOpponent) {
    console.log(`[MATCHMAKING] ${shortAddr}: Could not claim any opponent (waiting to be claimed or no valid targets)`);
    return null;
  }

  // Step 4: Mark ourselves as matched too
  console.log(`[MATCHMAKING] ${shortAddr}: Marking self as matched with ${claimedOpponent.address.slice(-8)}`);
  const { data: selfUpdate, error: selfUpdateError } = await supabase
    .from("matchmaking_queue")
    .update({
      status: "matched",
      matched_with: claimedOpponent.address
    })
    .eq("address", address)
    .eq("status", "searching")
    .select("address");

  if (selfUpdateError) {
    console.log(`[MATCHMAKING] ${shortAddr}: Failed to update self - ${selfUpdateError.message}`);
    // Rollback: release the opponent
    await supabase
      .from("matchmaking_queue")
      .update({ status: "searching", matched_with: null })
      .eq("address", claimedOpponent.address);
    return null;
  }

  if (!selfUpdate || selfUpdate.length === 0) {
    console.log(`[MATCHMAKING] ${shortAddr}: Self update returned 0 rows (already matched by someone else?)`);
    // Rollback: release the opponent
    await supabase
      .from("matchmaking_queue")
      .update({ status: "searching", matched_with: null })
      .eq("address", claimedOpponent.address);
    return null;
  }

  // Step 5: Create the match
  console.log(`[MATCHMAKING] ${shortAddr}: Creating match...`);
  const match = await createMatch(address, claimedOpponent.address);
  if (!match) {
    console.log(`[MATCHMAKING] ${shortAddr}: Failed to create match, rolling back`);
    // Rollback: release both players back to searching
    await supabase
      .from("matchmaking_queue")
      .update({ status: "searching", matched_with: null })
      .in("address", [address, claimedOpponent.address]);
    return null;
  }

  // Step 6: Remove both players from the queue
  console.log(`[MATCHMAKING] ${shortAddr}: Match created! Removing players from queue`);
  const { error: deleteError } = await supabase
    .from("matchmaking_queue")
    .delete()
    .in("address", [address, claimedOpponent.address]);

  if (deleteError) {
    console.log(`[MATCHMAKING] ${shortAddr}: Warning - failed to remove from queue: ${deleteError.message}`);
  }

  console.log(`[MATCHMAKING] ✓✓✓ Match ${match.id} created: ${shortAddr} vs ${claimedOpponent.address.slice(-8)}`);

  return {
    matchId: match.id,
    player1Address: address,
    player2Address: claimedOpponent.address,
    selectionDeadlineAt: match.selectionDeadlineAt,
  };
}

/**
 * Character selection timeout in seconds.
 */
const CHARACTER_SELECT_TIMEOUT_SECONDS = 30;

/**
 * Create a new match in the database.
 * Sets a server-managed selection deadline for timer synchronization.
 * IMPORTANT: Checks for existing active matches to prevent duplicates.
 */
export async function createMatch(
  player1Address: string,
  player2Address: string
): Promise<{ id: string; selectionDeadlineAt: string } | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // CRITICAL: Check if either player already has an active match
    // This prevents duplicate matches when multiple attemptMatch calls race
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("id, player1_address, player2_address, selection_deadline_at, created_at, status")
      .or(`player1_address.eq.${player1Address},player2_address.eq.${player1Address},player1_address.eq.${player2Address},player2_address.eq.${player2Address}`)
      .in("status", ["character_select", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingMatch) {
      const shortId = existingMatch.id.slice(0, 8);

      // If we're in character_select OR in_progress, abandon the old match
      console.log(`[MATCHMAKING-CREATE] ${existingMatch.id}: Abandoning stale/stuck match ${shortId} (status: ${existingMatch.status})`);

      await supabase
        .from("matches")
        .update({
          status: "cancelled",
          completed_at: new Date().toISOString(),
        })
        .eq("id", existingMatch.id);

      // Continue execution to create a NEW match
    }

    // Calculate selection deadline (30 seconds from now)
    const selectionDeadlineAt = new Date(
      Date.now() + CHARACTER_SELECT_TIMEOUT_SECONDS * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("matches")
      .insert({
        player1_address: player1Address,
        player2_address: player2Address,
        status: "character_select",
        format: "best_of_5",
        selection_deadline_at: selectionDeadlineAt,
      })
      .select("id, selection_deadline_at")
      .single();

    if (error) {
      console.error("Failed to create match:", error);
      return null;
    }

    console.log(`Match created: ${data.id} (${player1Address} vs ${player2Address}), deadline: ${data.selection_deadline_at}`);
    return { id: data.id, selectionDeadlineAt: data.selection_deadline_at! };
  } catch (error) {
    console.error("Error creating match:", error);
    return null;
  }
}

/**
 * Create a private room with a room code.
 * @param hostAddress - The wallet address of the room creator
 * @param stakeAmountSompi - Optional stake amount per player in sompi (min 1 KAS = 100000000)
 */
export async function createRoom(
  hostAddress: string,
  stakeAmountSompi?: bigint
): Promise<{
  id: string;
  code: string;
  stakeAmount?: string; // Returned as string for JSON serialization
} | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // Generate a unique 6-character room code
    const code = generateRoomCode();

    // Build insert data - cast to any to support new stake columns not yet in types
    const insertData = {
      player1_address: hostAddress,
      room_code: code,
      status: "waiting",
      format: "best_of_5",
      ...(stakeAmountSompi && stakeAmountSompi > 0 ? { stake_amount: stakeAmountSompi.toString() } : {}),
    } as any;

    const { data, error } = await supabase
      .from("matches")
      .insert(insertData)
      .select("id, room_code, stake_amount")
      .single() as { data: { id: string; room_code: string; stake_amount?: string } | null; error: any };

    if (error) {
      console.error("Failed to create room:", error);
      return null;
    }

    if (!data) {
      console.error("No data returned from create room");
      return null;
    }

    console.log(`Room created: ${code} by ${hostAddress}${stakeAmountSompi ? ` with stake ${stakeAmountSompi}` : ''}`);
    return {
      id: data.id,
      code: data.room_code,
      stakeAmount: data.stake_amount || undefined,
    };
  } catch (error) {
    console.error("Error creating room:", error);
    return null;
  }
}


/**
 * Join an existing room by code.
 * Returns stake amount if the room has stakes enabled.
 */
export async function joinRoom(
  guestAddress: string,
  roomCode: string
): Promise<{
  id: string;
  hostAddress: string;
  selectionDeadlineAt?: string;
  stakeAmount?: string; // Stake per player in sompi (as string)
  stakeDeadlineAt?: string; // Deadline to confirm stake deposits
} | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // Find the room - include stake_amount
    const { data: room, error: findError } = await supabase
      .from("matches")
      .select("id, player1_address, player2_address, status, stake_amount")
      .eq("room_code", roomCode.toUpperCase())
      .eq("status", "waiting")
      .single() as { data: { id: string; player1_address: string; player2_address: string | null; status: string; stake_amount?: string } | null; error: any };

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

    const hasStake = room.stake_amount && BigInt(room.stake_amount) > 0;

    // Calculate selection deadline (30 seconds from now)
    // For staked matches, don't set this yet - it will be set when stakes are confirmed
    const selectionDeadlineAt = hasStake
      ? null
      : new Date(Date.now() + CHARACTER_SELECT_TIMEOUT_SECONDS * 1000).toISOString();

    // If stakes are enabled, set a stake deposit deadline (60 seconds)
    const STAKE_DEPOSIT_TIMEOUT_SECONDS = 60;
    const stakeDeadlineAt = hasStake
      ? new Date(Date.now() + STAKE_DEPOSIT_TIMEOUT_SECONDS * 1000).toISOString()
      : undefined;

    // Build update data
    const updateData: any = {
      player2_address: guestAddress,
      status: "character_select",
    };

    // Only set selection deadline for non-staked matches
    if (selectionDeadlineAt) {
      updateData.selection_deadline_at = selectionDeadlineAt;
    }

    if (stakeDeadlineAt) {
      updateData.stake_deadline_at = stakeDeadlineAt;
    }

    // Update match with second player and set selection deadline
    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update(updateData)
      .eq("id", room.id)
      .select("selection_deadline_at, stake_deadline_at")
      .single() as { data: { selection_deadline_at: string; stake_deadline_at?: string } | null; error: any };

    if (updateError) {
      console.error("Failed to join room:", updateError);
      return null;
    }

    console.log(`Player ${guestAddress} joined room ${roomCode}, deadline: ${updatedMatch?.selection_deadline_at}${hasStake ? `, stake: ${room.stake_amount}` : ''}`);

    // Broadcast player_joined event to notify room creator
    // This is more reliable than Postgres Changes for real-time notification
    try {
      const { broadcastToChannel } = await import("@/lib/supabase/broadcast");
      await broadcastToChannel(supabase, `room:${room.id}`, "player_joined", {
        matchId: room.id,
        guestAddress,
        hostAddress: room.player1_address,
        selectionDeadlineAt: updatedMatch?.selection_deadline_at || undefined,
        stakeAmount: room.stake_amount || undefined,
        stakeDeadlineAt: updatedMatch?.stake_deadline_at || undefined,
      });
      console.log(`[JoinRoom] Broadcast player_joined to room:${room.id}`);
    } catch (broadcastError) {
      console.error("[JoinRoom] Failed to broadcast player_joined:", broadcastError);
      // Continue even if broadcast fails - the Postgres change should still work as backup
    }

    return {
      id: room.id,
      hostAddress: room.player1_address,
      selectionDeadlineAt: updatedMatch?.selection_deadline_at || undefined,
      stakeAmount: room.stake_amount || undefined,
      stakeDeadlineAt: updatedMatch?.stake_deadline_at || undefined,
    };
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
 * Includes the selection deadline so both clients can sync their timers.
 */
export async function broadcastMatchFound(
  matchId: string,
  player1Address: string,
  player2Address: string,
  selectionDeadlineAt: string
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
        selectionDeadlineAt, // Server-managed deadline for timer sync
      },
    });

    // Clean up the channel after sending
    await supabase.removeChannel(channel);

    console.log(`Match found event broadcast for ${matchId}, deadline: ${selectionDeadlineAt}`);
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
