/**
 * Player Registration Service
 * Handles player registration on first wallet connection
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Player } from "@/types";

/**
 * Default values for new players.
 */
const DEFAULT_PLAYER_VALUES = {
  rating: 1000,
  wins: 0,
  losses: 0,
};

/**
 * Player registration result.
 */
export interface RegistrationResult {
  player: Player;
  isNewPlayer: boolean;
}

/**
 * Register a new player or get existing player data.
 * This is called on first wallet connection.
 */
export async function registerPlayer(
  address: string,
  displayName?: string | null
): Promise<RegistrationResult> {
  const supabase = await createSupabaseServerClient();

  // Check if player already exists
  const { data: existingPlayer, error: fetchError } = await supabase
    .from("players")
    .select("*")
    .eq("address", address)
    .single();

  if (existingPlayer && !fetchError) {
    // Player already exists
    return {
      player: mapDatabasePlayer(existingPlayer),
      isNewPlayer: false,
    };
  }

  // Create new player
  const { data: newPlayer, error: insertError } = await supabase
    .from("players")
    .insert({
      address,
      display_name: displayName ?? generateDefaultDisplayName(address),
      rating: DEFAULT_PLAYER_VALUES.rating,
      wins: DEFAULT_PLAYER_VALUES.wins,
      losses: DEFAULT_PLAYER_VALUES.losses,
    })
    .select("*")
    .single();

  if (insertError || !newPlayer) {
    // Handle unique constraint violation (race condition)
    if (insertError?.code === "23505") {
      const { data: existingPlayer } = await supabase
        .from("players")
        .select("*")
        .eq("address", address)
        .single();

      if (existingPlayer) {
        return {
          player: mapDatabasePlayer(existingPlayer),
          isNewPlayer: false,
        };
      }
    }

    console.error("Failed to register player:", insertError);
    throw new Error("Failed to register player");
  }

  console.log(`New player registered: ${address}`);
  return {
    player: mapDatabasePlayer(newPlayer),
    isNewPlayer: true,
  };
}

/**
 * Get player by address.
 */
export async function getPlayer(address: string): Promise<Player | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("address", address)
    .single();

  if (error || !data) {
    return null;
  }

  return mapDatabasePlayer(data);
}

/**
 * Update player display name.
 */
export async function updateDisplayName(
  address: string,
  displayName: string
): Promise<Player | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("players")
    .update({ display_name: displayName })
    .eq("address", address)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update display name:", error);
    return null;
  }

  return mapDatabasePlayer(data);
}

/**
 * Update player stats after a match.
 */
export async function updatePlayerStats(
  address: string,
  won: boolean,
  ratingChange: number
): Promise<Player | null> {
  const supabase = await createSupabaseServerClient();

  // Get current player data
  const { data: current, error: fetchError } = await supabase
    .from("players")
    .select("wins, losses, rating")
    .eq("address", address)
    .single();

  if (fetchError || !current) {
    console.error("Failed to fetch player for stats update:", fetchError);
    return null;
  }

  // Calculate new values
  const newRating = Math.max(100, Math.min(3000, current.rating + ratingChange));

  const { data, error } = await supabase
    .from("players")
    .update({
      wins: won ? current.wins + 1 : current.wins,
      losses: won ? current.losses : current.losses + 1,
      rating: newRating,
    })
    .eq("address", address)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update player stats:", error);
    return null;
  }

  return mapDatabasePlayer(data);
}

/**
 * Get leaderboard of top players.
 */
export async function getLeaderboard(
  limit: number = 50,
  offset: number = 0
): Promise<Player[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("rating", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    console.error("Failed to fetch leaderboard:", error);
    return [];
  }

  return data.map(mapDatabasePlayer);
}

/**
 * Get player rank.
 */
export async function getPlayerRank(address: string): Promise<number | null> {
  const supabase = await createSupabaseServerClient();

  // Get player's rating
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("rating")
    .eq("address", address)
    .single();

  if (playerError || !player) {
    return null;
  }

  // Count players with higher rating
  const { count, error: countError } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .gt("rating", player.rating);

  if (countError) {
    console.error("Failed to get player rank:", countError);
    return null;
  }

  return (count ?? 0) + 1;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Map database row to Player type.
 */
function mapDatabasePlayer(row: {
  address: string;
  display_name: string | null;
  wins: number;
  losses: number;
  rating: number;
  created_at: string;
  updated_at: string;
}): Player {
  return {
    address: row.address,
    displayName: row.display_name,
    wins: row.wins,
    losses: row.losses,
    rating: row.rating,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Generate default display name from address.
 */
function generateDefaultDisplayName(address: string): string {
  // Take the first 8 chars after "kaspa:" prefix
  const prefix = address.replace(/^kaspa(test)?:/, "");
  return `Fighter_${prefix.slice(0, 6)}`;
}
