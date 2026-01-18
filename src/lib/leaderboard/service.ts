/**
 * Leaderboard Service
 * Handles leaderboard queries, sorting, and ranking
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NetworkType } from "@/types/constants";
import { getNetworkAddressFilter } from "@/lib/utils/network-filter";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Leaderboard entry returned to clients.
 */
export interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string | null;
  wins: number;
  losses: number;
  winRate: number;
  rating: number;
  avatarUrl: string | null;
  prestigeLevel: number;
}

/**
 * Leaderboard query options.
 */
export interface LeaderboardOptions {
  /** Number of entries to return (default: 50, max: 100) */
  limit?: number;
  /** Offset for pagination (default: 0) */
  offset?: number;
  /** Sort field (default: wins) */
  sortBy?: "wins" | "rating" | "winRate";
  /** Network to filter by (optional - shows all if not specified) */
  network?: NetworkType;
}

/**
 * Leaderboard response.
 */
export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  lastUpdated: Date;
}

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * Get the global leaderboard with pagination and sorting.
 */
export async function getLeaderboard(
  options: LeaderboardOptions = {}
): Promise<LeaderboardResponse> {
  const { limit = 50, offset = 0, sortBy = "wins", network } = options;

  // Clamp limit to max 100
  const clampedLimit = Math.min(Math.max(1, limit), 100);
  const clampedOffset = Math.max(0, offset);

  const supabase = await createSupabaseServerClient();

  // Determine order column
  const orderColumn = sortBy === "rating" ? "rating" : "wins";
  const secondaryOrder = sortBy === "rating" ? "wins" : "rating";

  // Build query with optional network filter
  let query = supabase
    .from("players")
    .select("*", { count: "exact" });

  // Filter by network if specified
  if (network) {
    const addressFilter = getNetworkAddressFilter(network);
    query = query.like("address", addressFilter);
  }

  // Apply ordering and pagination
  const { data, error, count } = await query
    .order(orderColumn, { ascending: false })
    .order(secondaryOrder, { ascending: false })
    .range(clampedOffset, clampedOffset + clampedLimit - 1);

  if (error) {
    console.error("Failed to fetch leaderboard:", error);
    throw new Error("Failed to fetch leaderboard");
  }

  // Fetch prestige levels for all players in this batch
  const playerAddresses = (data || []).map(row => row.address);
  const { data: prestigeData } = await supabase
    .from("player_progression" as never)
    .select("player_address, prestige_level")
    .in("player_address", playerAddresses);

  // Create a map of player address to prestige level
  const prestigeMap = new Map<string, number>();
  ((prestigeData || []) as Array<{ player_address: string; prestige_level: number }>).forEach(row => {
    prestigeMap.set(row.player_address, row.prestige_level || 0);
  });

  // Map to leaderboard entries
  const entries: LeaderboardEntry[] = (data || []).map((row, index) => ({
    rank: clampedOffset + index + 1,
    address: row.address,
    displayName: row.display_name,
    wins: row.wins,
    losses: row.losses,
    winRate: calculateWinRate(row.wins, row.losses),
    rating: row.rating,
    avatarUrl: (row as unknown as Record<string, any>).avatar_url || null,
    prestigeLevel: prestigeMap.get(row.address) || 0,
  }));

  // If sorting by win rate, re-sort the entries
  // (Since Supabase doesn't support computed column ordering)
  if (sortBy === "winRate") {
    entries.sort((a, b) => {
      const diff = b.winRate - a.winRate;
      if (Math.abs(diff) < 0.001) {
        return b.wins - a.wins; // Tie-breaker: more wins
      }
      return diff;
    });

    // Reassign ranks after sorting
    entries.forEach((entry, index) => {
      entry.rank = clampedOffset + index + 1;
    });
  }

  return {
    entries,
    total: count ?? 0,
    lastUpdated: new Date(),
  };
}

/**
 * Get a player's rank in the leaderboard.
 * Automatically filters by the player's network based on address prefix.
 */
export async function getPlayerLeaderboardRank(
  address: string,
  sortBy: "wins" | "rating" | "winRate" = "wins"
): Promise<number | null> {
  const supabase = await createSupabaseServerClient();

  // Detect network from address
  const network: NetworkType = address.startsWith("kaspatest:") ? "testnet" : "mainnet";
  const addressFilter = getNetworkAddressFilter(network);

  // Get the player's stats
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("address", address)
    .single();

  if (playerError || !player) {
    return null;
  }

  // Count players with better stats (on same network)
  let countQuery = supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .like("address", addressFilter);

  if (sortBy === "rating") {
    countQuery = countQuery.gt("rating", player.rating);
  } else {
    // For wins, also consider wins with tie-breaker on rating
    countQuery = countQuery.or(
      `wins.gt.${player.wins},and(wins.eq.${player.wins},rating.gt.${player.rating})`
    );
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error("Failed to get player rank:", countError);
    return null;
  }

  return (count ?? 0) + 1;
}

/**
 * Get top N players for quick display.
 */
export async function getTopPlayers(limit: number = 10, network?: NetworkType): Promise<LeaderboardEntry[]> {
  const result = await getLeaderboard({ limit, sortBy: "wins", network });
  return result.entries;
}

/**
 * Check if a player is in the top N.
 */
export async function isPlayerInTopN(address: string, n: number = 50): Promise<boolean> {
  const rank = await getPlayerLeaderboardRank(address, "wins");
  return rank !== null && rank <= n;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Calculate win rate percentage.
 */
function calculateWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 10000) / 100; // Round to 2 decimal places
}
