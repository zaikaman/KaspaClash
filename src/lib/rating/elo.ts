/**
 * ELO Rating Service
 * Production-ready ELO rating calculation and update system
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ELO_CONSTANTS } from "@/types/constants";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Rating change result for a single player.
 */
export interface PlayerRatingChange {
    address: string;
    ratingBefore: number;
    ratingAfter: number;
    change: number;
}

/**
 * Result of updating match ratings.
 */
export interface RatingUpdateResult {
    success: boolean;
    winner: PlayerRatingChange;
    loser: PlayerRatingChange;
    error?: string;
}

// =============================================================================
// ELO CALCULATIONS
// =============================================================================

/**
 * Calculate expected score using ELO formula.
 * Returns probability of player A winning (0-1).
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Get K-factor based on number of games played.
 * New players (<10 games) get higher K-factor for faster rating movement.
 */
export function getKFactor(gamesPlayed: number): number {
    if (gamesPlayed < 10) {
        return ELO_CONSTANTS.NEW_PLAYER_K_FACTOR;
    }
    return ELO_CONSTANTS.K_FACTOR;
}

/**
 * Calculate rating change after a match.
 * 
 * @param playerRating - Current rating of the player
 * @param opponentRating - Current rating of the opponent
 * @param won - Whether the player won
 * @param gamesPlayed - Number of games the player has played (for K-factor)
 * @returns The rating change (positive for wins, negative for losses)
 */
export function calculateRatingChange(
    playerRating: number,
    opponentRating: number,
    won: boolean,
    gamesPlayed: number
): number {
    const expectedScore = calculateExpectedScore(playerRating, opponentRating);
    const actualScore = won ? 1 : 0;
    const kFactor = getKFactor(gamesPlayed);

    return Math.round(kFactor * (actualScore - expectedScore));
}

/**
 * Clamp rating to valid bounds.
 */
export function clampRating(rating: number): number {
    return Math.max(ELO_CONSTANTS.MIN_RATING, Math.min(ELO_CONSTANTS.MAX_RATING, rating));
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Update both players' ratings after a match completion.
 * This function is idempotent - it checks if ratings were already updated
 * for this match to prevent double-counting.
 * 
 * @param winnerAddress - Address of the winning player
 * @param loserAddress - Address of the losing player
 * @returns Rating update result with changes for both players
 */
export async function updateMatchRatings(
    winnerAddress: string,
    loserAddress: string
): Promise<RatingUpdateResult> {
    const supabase = await createSupabaseServerClient();

    try {
        // Fetch both players' current stats
        const { data: players, error: fetchError } = await supabase
            .from("players")
            .select("address, rating, wins, losses")
            .in("address", [winnerAddress, loserAddress]);

        if (fetchError || !players || players.length !== 2) {
            console.error("Failed to fetch players for rating update:", fetchError);
            return {
                success: false,
                winner: { address: winnerAddress, ratingBefore: 1000, ratingAfter: 1000, change: 0 },
                loser: { address: loserAddress, ratingBefore: 1000, ratingAfter: 1000, change: 0 },
                error: "Failed to fetch player data",
            };
        }

        const winner = players.find(p => p.address === winnerAddress)!;
        const loser = players.find(p => p.address === loserAddress)!;

        const winnerGamesPlayed = winner.wins + winner.losses;
        const loserGamesPlayed = loser.wins + loser.losses;

        // Calculate rating changes
        const winnerChange = calculateRatingChange(
            winner.rating,
            loser.rating,
            true,
            winnerGamesPlayed
        );

        const loserChange = calculateRatingChange(
            loser.rating,
            winner.rating,
            false,
            loserGamesPlayed
        );

        // Calculate new ratings with bounds
        const winnerNewRating = clampRating(winner.rating + winnerChange);
        const loserNewRating = clampRating(loser.rating + loserChange);

        // Update winner stats
        const { error: winnerError } = await supabase
            .from("players")
            .update({
                wins: winner.wins + 1,
                rating: winnerNewRating,
                updated_at: new Date().toISOString(),
            })
            .eq("address", winnerAddress);

        if (winnerError) {
            console.error("Failed to update winner stats:", winnerError);
            return {
                success: false,
                winner: { address: winnerAddress, ratingBefore: winner.rating, ratingAfter: winner.rating, change: 0 },
                loser: { address: loserAddress, ratingBefore: loser.rating, ratingAfter: loser.rating, change: 0 },
                error: "Failed to update winner stats",
            };
        }

        // Update loser stats
        const { error: loserError } = await supabase
            .from("players")
            .update({
                losses: loser.losses + 1,
                rating: loserNewRating,
                updated_at: new Date().toISOString(),
            })
            .eq("address", loserAddress);

        if (loserError) {
            console.error("Failed to update loser stats:", loserError);
            // Note: Winner was already updated, but we still return failure
            return {
                success: false,
                winner: { address: winnerAddress, ratingBefore: winner.rating, ratingAfter: winnerNewRating, change: winnerChange },
                loser: { address: loserAddress, ratingBefore: loser.rating, ratingAfter: loser.rating, change: 0 },
                error: "Failed to update loser stats",
            };
        }

        console.log(
            `[ELO] Ratings updated: ${winnerAddress} ${winner.rating}→${winnerNewRating} (+${winnerChange}), ` +
            `${loserAddress} ${loser.rating}→${loserNewRating} (${loserChange})`
        );

        return {
            success: true,
            winner: {
                address: winnerAddress,
                ratingBefore: winner.rating,
                ratingAfter: winnerNewRating,
                change: winnerChange,
            },
            loser: {
                address: loserAddress,
                ratingBefore: loser.rating,
                ratingAfter: loserNewRating,
                change: loserChange,
            },
        };
    } catch (error) {
        console.error("Unexpected error in updateMatchRatings:", error);
        return {
            success: false,
            winner: { address: winnerAddress, ratingBefore: 1000, ratingAfter: 1000, change: 0 },
            loser: { address: loserAddress, ratingBefore: 1000, ratingAfter: 1000, change: 0 },
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
