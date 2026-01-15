/**
 * Leaderboard Updater for Survival Mode
 * Handles rank management and database updates
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Survival run record to insert
 */
export interface SurvivalRunRecord {
    player_id: string;
    character_id: string;
    waves_cleared: number;
    score: number;
    shards_earned: number;
    final_health: number | null;
    is_victory: boolean;
}

/**
 * Leaderboard entry structure
 */
export interface SurvivalLeaderboardEntry {
    address: string;
    displayName: string | null;
    avatarUrl: string | null;
    bestWaves: number;
    bestScore: number;
    totalRuns: number;
    totalShardsEarned: number;
    victories: number;
    lastRunAt: string | null;
    rank: number;
}

/**
 * Result of recording a survival run
 */
export interface RecordRunResult {
    success: boolean;
    runId: string | null;
    isNewHighScore: boolean;
    previousBestScore: number;
    newRank: number | null;
    shardsAwarded: number;
    error?: string;
}

/**
 * Record a completed survival run
 */
export async function recordSurvivalRun(
    record: SurvivalRunRecord
): Promise<RecordRunResult> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Get player's previous best score
        const { data: previousRuns } = await supabase
            .from("survival_runs")
            .select("score")
            .eq("player_id", record.player_id)
            .order("score", { ascending: false })
            .limit(1);

        const previousBestScore = previousRuns?.[0]?.score || 0;
        const isNewHighScore = record.score > previousBestScore;

        // Insert the new run
        const { data: newRun, error: insertError } = await supabase
            .from("survival_runs")
            .insert({
                ...record,
                ended_at: new Date().toISOString(),
            })
            .select("id")
            .single();

        if (insertError) {
            throw insertError;
        }

        // Award shards to player
        if (record.shards_earned > 0) {
            const { error: currencyError } = await supabase.rpc("add_clash_shards", {
                p_player_id: record.player_id,
                p_amount: record.shards_earned,
                p_source: "survival_mode",
            });

            if (currencyError) {
                console.error("Failed to award shards:", currencyError);
                // Don't fail the whole operation, just log it
            }
        }

        // Increment daily plays
        await supabase.rpc("increment_survival_plays", {
            p_player_id: record.player_id,
        });

        // Get new rank if it's a high score
        let newRank: number | null = null;
        if (isNewHighScore) {
            const { data: leaderboard } = await supabase
                .from("survival_leaderboard")
                .select("address, rank")
                .eq("address", record.player_id)
                .single();

            newRank = leaderboard?.rank || null;
        }

        return {
            success: true,
            runId: newRun.id,
            isNewHighScore,
            previousBestScore,
            newRank,
            shardsAwarded: record.shards_earned,
        };
    } catch (error) {
        console.error("Failed to record survival run:", error);
        return {
            success: false,
            runId: null,
            isNewHighScore: false,
            previousBestScore: 0,
            newRank: null,
            shardsAwarded: 0,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get survival leaderboard
 */
export async function getSurvivalLeaderboard(
    limit: number = 100,
    offset: number = 0
): Promise<{ entries: SurvivalLeaderboardEntry[]; total: number }> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error, count } = await supabase
        .from("survival_leaderboard")
        .select("*", { count: "exact" })
        .order("best_score", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("Failed to fetch survival leaderboard:", error);
        return { entries: [], total: 0 };
    }

    const entries: SurvivalLeaderboardEntry[] = (data || []).map((row) => ({
        address: row.address,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        bestWaves: row.best_waves,
        bestScore: row.best_score,
        totalRuns: row.total_runs,
        totalShardsEarned: row.total_shards_earned,
        victories: row.victories,
        lastRunAt: row.last_run_at,
        rank: row.rank,
    }));

    return { entries, total: count || 0 };
}

/**
 * Get player's survival stats
 */
export async function getPlayerSurvivalStats(playerId: string): Promise<{
    bestWaves: number;
    bestScore: number;
    totalRuns: number;
    totalShardsEarned: number;
    victories: number;
    rank: number | null;
    playsRemaining: number;
}> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get stats from leaderboard view
    const { data: stats } = await supabase
        .from("survival_leaderboard")
        .select("*")
        .eq("address", playerId)
        .single();

    // Get remaining plays
    const { data: playsRemaining } = await supabase.rpc("get_survival_plays_remaining", {
        p_player_id: playerId,
    });

    return {
        bestWaves: stats?.best_waves || 0,
        bestScore: stats?.best_score || 0,
        totalRuns: stats?.total_runs || 0,
        totalShardsEarned: stats?.total_shards_earned || 0,
        victories: stats?.victories || 0,
        rank: stats?.rank || null,
        playsRemaining: playsRemaining ?? 3,
    };
}

/**
 * Check if player can start a survival run
 */
export async function canStartSurvivalRun(playerId: string): Promise<{
    canPlay: boolean;
    playsRemaining: number;
    resetsAt: string;
}> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: playsRemaining } = await supabase.rpc("get_survival_plays_remaining", {
        p_player_id: playerId,
    });

    // Calculate when the daily reset happens (next midnight UTC)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return {
        canPlay: (playsRemaining ?? 3) > 0,
        playsRemaining: playsRemaining ?? 3,
        resetsAt: tomorrow.toISOString(),
    };
}
