/**
 * Player Match History Service
 * Handles fetching and formatting player match history
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NETWORK_CONFIG, type NetworkType } from "@/types/constants";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Match result type.
 */
export type MatchResult = "win" | "loss" | "forfeit_win" | "forfeit_loss";

/**
 * Opponent information in a match summary.
 */
export interface MatchOpponent {
  address: string;
  displayName: string | null;
  characterId: string | null;
}

/**
 * Match summary for match history display.
 */
export interface MatchSummary {
  matchId: string;
  opponent: MatchOpponent;
  playerCharacterId: string | null;
  result: MatchResult;
  score: string;
  completedAt: Date;
  explorerUrl: string | null;
}

/**
 * Match history response.
 */
export interface MatchHistoryResponse {
  matches: MatchSummary[];
  total: number;
}

/**
 * Match history query options.
 */
export interface MatchHistoryOptions {
  /** Number of matches to return (default: 20, max: 50) */
  limit?: number;
  /** Offset for pagination (default: 0) */
  offset?: number;
}

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * Get match history for a player.
 */
export async function getPlayerMatchHistory(
  playerAddress: string,
  options: MatchHistoryOptions = {}
): Promise<MatchHistoryResponse> {
  const { limit = 20, offset = 0 } = options;

  // Clamp values
  const clampedLimit = Math.min(Math.max(1, limit), 50);
  const clampedOffset = Math.max(0, offset);

  const supabase = await createSupabaseServerClient();

  // Query completed matches where player participated
  // Include rounds with moves to get transaction IDs for verification
  const { data, error, count } = await supabase
    .from("matches")
    .select(
      `
      id,
      player1_address,
      player2_address,
      player1_character_id,
      player2_character_id,
      winner_address,
      player1_rounds_won,
      player2_rounds_won,
      completed_at,
      player1:players!matches_player1_address_fkey(address, display_name),
      player2:players!matches_player2_address_fkey(address, display_name),
      rounds(
        moves(tx_id)
      )
    `,
      { count: "exact" }
    )
    .eq("status", "completed")
    .or(`player1_address.eq.${playerAddress},player2_address.eq.${playerAddress}`)
    .order("completed_at", { ascending: false })
    .range(clampedOffset, clampedOffset + clampedLimit - 1);

  if (error) {
    console.error("Failed to fetch match history:", error);
    throw new Error("Failed to fetch match history");
  }

  // Transform matches to summaries
  const matches: MatchSummary[] = (data || []).map((match) => {
    const isPlayer1 = match.player1_address === playerAddress;

    // Type the joined player data
    const player1Data = match.player1 as { address: string; display_name: string | null } | null;
    const player2Data = match.player2 as { address: string; display_name: string | null } | null;

    const opponentData = isPlayer1 ? player2Data : player1Data;

    const opponent: MatchOpponent = {
      address: isPlayer1 ? (match.player2_address || "Unknown") : match.player1_address,
      displayName: opponentData?.display_name ?? null,
      characterId: isPlayer1 ? match.player2_character_id : match.player1_character_id,
    };

    const playerCharacterId = isPlayer1
      ? match.player1_character_id
      : match.player2_character_id;

    const playerWon = match.winner_address === playerAddress;
    const playerRoundsWon = isPlayer1
      ? match.player1_rounds_won
      : match.player2_rounds_won;
    const opponentRoundsWon = isPlayer1
      ? match.player2_rounds_won
      : match.player1_rounds_won;

    // Determine result (for now, simple win/loss - forfeit detection would need additional data)
    const result: MatchResult = playerWon ? "win" : "loss";

    // Format score as "playerRounds-opponentRounds"
    const score = `${playerRoundsWon}-${opponentRoundsWon}`;

    // Extract the first transaction ID from the match's moves for explorer verification
    // Detect network from player address for correct explorer URL
    const playerNetwork: NetworkType = playerAddress.startsWith("kaspatest:") ? "testnet" : "mainnet";
    let explorerUrl: string | null = null;
    const rounds = match.rounds as Array<{ moves: Array<{ tx_id: string | null }> }> | null;
    if (rounds) {
      for (const round of rounds) {
        if (round.moves) {
          for (const move of round.moves) {
            if (move.tx_id) {
              explorerUrl = `${NETWORK_CONFIG[playerNetwork].explorerUrl}/txs/${move.tx_id}`;
              break;
            }
          }
        }
        if (explorerUrl) break;
      }
    }

    return {
      matchId: match.id,
      opponent,
      playerCharacterId,
      result,
      score,
      completedAt: new Date(match.completed_at || Date.now()),
      explorerUrl,
    };
  });

  return {
    matches,
    total: count ?? 0,
  };
}

/**
 * Get recent matches for a player (quick display).
 */
export async function getRecentMatches(
  playerAddress: string,
  limit: number = 5
): Promise<MatchSummary[]> {
  const result = await getPlayerMatchHistory(playerAddress, { limit });
  return result.matches;
}

/**
 * Get player's win/loss record against a specific opponent.
 */
export async function getHeadToHeadRecord(
  playerAddress: string,
  opponentAddress: string
): Promise<{ wins: number; losses: number; total: number }> {
  const supabase = await createSupabaseServerClient();

  // Query completed matches between these two players
  const { data, error } = await supabase
    .from("matches")
    .select("winner_address")
    .eq("status", "completed")
    .or(
      `and(player1_address.eq.${playerAddress},player2_address.eq.${opponentAddress}),` +
      `and(player1_address.eq.${opponentAddress},player2_address.eq.${playerAddress})`
    );

  if (error) {
    console.error("Failed to fetch head-to-head record:", error);
    return { wins: 0, losses: 0, total: 0 };
  }

  let wins = 0;
  let losses = 0;

  for (const match of data || []) {
    if (match.winner_address === playerAddress) {
      wins++;
    } else if (match.winner_address === opponentAddress) {
      losses++;
    }
  }

  return {
    wins,
    losses,
    total: wins + losses,
  };
}
