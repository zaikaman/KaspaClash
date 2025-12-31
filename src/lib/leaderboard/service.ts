/**
 * Leaderboard Service
 * Handles leaderboard queries, sorting, and ranking
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const { limit = 50, offset = 0, sortBy = "wins" } = options;

  // Clamp limit to max 100
  const clampedLimit = Math.min(Math.max(1, limit), 100);
  const clampedOffset = Math.max(0, offset);

  const supabase = await createSupabaseServerClient();

  // Determine order column
  const orderColumn = sortBy === "rating" ? "rating" : "wins";
  const secondaryOrder = sortBy === "rating" ? "wins" : "rating";

  // Query players with ordering
  const { data, error, count } = await supabase
    .from("players")
    .select("*", { count: "exact" })
    .order(orderColumn, { ascending: false })
    .order(secondaryOrder, { ascending: false })
    .range(clampedOffset, clampedOffset + clampedLimit - 1);

  if (error) {
    console.error("Failed to fetch leaderboard:", error);
    throw new Error("Failed to fetch leaderboard");
  }

  // Map to leaderboard entries
  const entries: LeaderboardEntry[] = (data || []).map((row, index) => ({
    rank: clampedOffset + index + 1,
    address: row.address,
    displayName: row.display_name,
    wins: row.wins,
    losses: row.losses,
    winRate: calculateWinRate(row.wins, row.losses),
    rating: row.rating,
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
 */
export async function getPlayerLeaderboardRank(
  address: string,
  sortBy: "wins" | "rating" | "winRate" = "wins"
): Promise<number | null> {
  const supabase = await createSupabaseServerClient();

  // Get the player's stats
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("address", address)
    .single();

  if (playerError || !player) {
    return null;
  }

  // Count players with better stats
  let countQuery = supabase.from("players").select("*", { count: "exact", head: true });

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
export async function getTopPlayers(limit: number = 10): Promise<LeaderboardEntry[]> {
  const result = await getLeaderboard({ limit, sortBy: "wins" });
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
