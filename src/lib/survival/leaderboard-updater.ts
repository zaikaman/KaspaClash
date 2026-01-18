/**
 * Leaderboard Updater for Survival Mode
 * Handles rank management and database updates
 */

import { createClient } from "@supabase/supabase-js";
import type { NetworkType } from "@/types/constants";
import { getNetworkAddressFilter } from "@/lib/utils/network-filter";

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
    prestigeLevel: number;
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
            // Manual update instead of RPC to ensure reliability
            const { data: currencyData } = await supabase
                .from('player_currency')
                .select('clash_shards, total_earned')
                .eq('player_id', record.player_id)
                .single();

            const currentShards = currencyData?.clash_shards || 0;
            const currentTotal = currencyData?.total_earned || 0;
            const newBalance = currentShards + record.shards_earned;

            // Update balance
            const { error: updateError } = await supabase
                .from('player_currency')
                .upsert({
                    player_id: record.player_id,
                    clash_shards: newBalance,
                    total_earned: currentTotal + record.shards_earned,
                }, { onConflict: 'player_id' });

            if (updateError) {
                console.error("Failed to award shards:", updateError);
            } else {
                // Log transaction
                await supabase.from('currency_transactions').insert({
                    player_id: record.player_id,
                    amount: record.shards_earned,
                    transaction_type: 'earn',
                    source: 'survival_mode',
                    balance_before: currentShards,
                    balance_after: newBalance,
                    metadata: {
                        runId: newRun.id,
                        waves: record.waves_cleared,
                        score: record.score
                    },
                });
            }
        }

        // NOTE: Play count is now deducted at start via /api/survival/start, not here

        // Get new rank if it's a high score (with network filtering)
        let newRank: number | null = null;
        if (isNewHighScore) {
            // Detect network from player address
            const network: NetworkType = record.player_id.startsWith("kaspatest:") ? "testnet" : "mainnet";
            const addressFilter = getNetworkAddressFilter(network);

            // Get player's updated stats
            const { data: updatedStats } = await supabase
                .from("survival_leaderboard")
                .select("best_score, best_waves")
                .eq("address", record.player_id)
                .single();

            if (updatedStats) {
                // Count players with better scores on the same network
                const { count } = await supabase
                    .from("survival_leaderboard")
                    .select("*", { count: "exact", head: true })
                    .like("address", addressFilter)
                    .or(`best_score.gt.${updatedStats.best_score},and(best_score.eq.${updatedStats.best_score},best_waves.gt.${updatedStats.best_waves})`);

                newRank = (count ?? 0) + 1;
            }
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
    offset: number = 0,
    network?: NetworkType
): Promise<{ entries: SurvivalLeaderboardEntry[]; total: number }> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query with optional network filter
    let query = supabase
        .from("survival_leaderboard")
        .select("*", { count: "exact" });

    // Filter by network if specified
    if (network) {
        const addressFilter = getNetworkAddressFilter(network);
        query = query.like("address", addressFilter);
    }

    const { data, error, count } = await query
        .order("best_score", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("Failed to fetch survival leaderboard:", error);
        return { entries: [], total: 0 };
    }

    // Fetch prestige levels for all players in this batch
    const playerAddresses = (data || []).map(row => row.address);
    const { data: prestigeData } = await supabase
        .from("player_progression")
        .select("player_address, prestige_level")
        .in("player_address", playerAddresses);

    // Create a map of player address to prestige level
    const prestigeMap = new Map<string, number>();
    (prestigeData || []).forEach(row => {
        prestigeMap.set(row.player_address, row.prestige_level || 0);
    });

    const entries: SurvivalLeaderboardEntry[] = (data || []).map((row, index) => ({
        address: row.address,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        bestWaves: row.best_waves,
        bestScore: row.best_score,
        totalRuns: row.total_runs,
        totalShardsEarned: row.total_shards_earned,
        victories: row.victories,
        lastRunAt: row.last_run_at,
        // When filtering by network, recalculate rank based on filtered results
        rank: offset + index + 1,
        prestigeLevel: prestigeMap.get(row.address) || 0,
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

    // Calculate network-specific rank if player has stats
    let rank: number | null = null;
    if (stats) {
        // Detect network from player address
        const network: NetworkType = playerId.startsWith("kaspatest:") ? "testnet" : "mainnet";
        const addressFilter = getNetworkAddressFilter(network);

        // Count players with better scores on the same network
        const { count } = await supabase
            .from("survival_leaderboard")
            .select("*", { count: "exact", head: true })
            .like("address", addressFilter)
            .or(`best_score.gt.${stats.best_score},and(best_score.eq.${stats.best_score},best_waves.gt.${stats.best_waves})`);

        rank = (count ?? 0) + 1;
    }

    return {
        bestWaves: stats?.best_waves || 0,
        bestScore: stats?.best_score || 0,
        totalRuns: stats?.total_runs || 0,
        totalShardsEarned: stats?.total_shards_earned || 0,
        victories: stats?.victories || 0,
        rank,
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
