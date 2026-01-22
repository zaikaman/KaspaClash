/**
 * Bot Match Lifecycle Manager
 * 
 * Manages the complete lifecycle of bot matches server-side:
 * 1. Match creation (pre-computed, deterministic)
 * 2. Betting window management (30 seconds)
 * 3. Match "playback" timing (based on wall clock, not client state)
 * 4. Automatic payout resolution when matches complete
 * 
 * KEY INSIGHT: Matches are fully determined at creation time.
 * The "playback" is just visualization - the outcome is already known.
 * This means payouts can be calculated immediately when match time elapses,
 * regardless of whether any clients are watching.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    type BotMatch,
    isMatchFinished,
    getCurrentTurnIndex,
    isBettingOpen,
} from "./bot-match-service";

// Constants
const BETTING_WINDOW_MS = 30000; // 30 seconds

/**
 * Match lifecycle states
 */
export type MatchLifecycleState = 
    | "betting"      // 30-second betting window
    | "playing"      // Match is "playing" (turns being revealed)
    | "finished"     // Match has completed
    | "resolved";    // Payouts have been processed

/**
 * Get the current lifecycle state of a match
 */
export function getMatchLifecycleState(match: BotMatch): MatchLifecycleState {
    if (match.status === "completed") {
        return "resolved";
    }

    if (isMatchFinished(match)) {
        return "finished";
    }

    if (isBettingOpen(match)) {
        return "betting";
    }

    return "playing";
}

/**
 * Calculate when a match will finish (milliseconds since epoch)
 */
export function getMatchEndTime(match: BotMatch): number {
    const playbackDuration = match.totalTurns * match.turnDurationMs;
    return match.createdAt + BETTING_WINDOW_MS + playbackDuration;
}

/**
 * Calculate when betting closes for a match (milliseconds since epoch)
 */
export function getBettingCloseTime(match: BotMatch): number {
    return match.createdAt + BETTING_WINDOW_MS;
}

/**
 * Get time remaining until match finishes (in seconds)
 */
export function getTimeUntilMatchEnd(match: BotMatch): number {
    const endTime = getMatchEndTime(match);
    const remaining = endTime - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Get time remaining until betting closes (in seconds)
 */
export function getTimeUntilBettingClose(match: BotMatch): number {
    const closeTime = getBettingCloseTime(match);
    const remaining = closeTime - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Get all matches that have finished but haven't been resolved yet
 */
export async function getMatchesPendingResolution(): Promise<BotMatch[]> {
    const supabase = await createSupabaseServerClient();
    const db = supabase as any;

    // Get active matches
    const { data: activeMatches, error } = await db
        .from("bot_matches")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: true });

    if (error || !activeMatches) {
        console.error("[LifecycleManager] Error fetching matches:", error);
        return [];
    }

    // Filter to only finished matches
    const pendingResolution: BotMatch[] = [];

    for (const row of activeMatches) {
        const match: BotMatch = {
            id: row.id,
            bot1CharacterId: row.bot1_character_id,
            bot2CharacterId: row.bot2_character_id,
            bot1Name: row.bot1_name,
            bot2Name: row.bot2_name,
            seed: row.seed,
            createdAt: new Date(row.created_at).getTime(),
            status: row.status,
            turns: row.turns,
            totalTurns: row.total_turns,
            matchWinner: row.match_winner,
            bot1RoundsWon: row.bot1_rounds_won,
            bot2RoundsWon: row.bot2_rounds_won,
            turnDurationMs: row.turn_duration_ms,
            bot1MaxHp: row.bot1_max_hp,
            bot2MaxHp: row.bot2_max_hp,
            bot1MaxEnergy: row.bot1_max_energy,
            bot2MaxEnergy: row.bot2_max_energy,
            bettingClosesAtTurn: row.betting_closes_at_turn,
        };

        if (isMatchFinished(match)) {
            pendingResolution.push(match);
        }
    }

    return pendingResolution;
}

/**
 * Get pools that should be locked (betting window closed but pool still open)
 */
export async function getPoolsPendingLock(): Promise<Array<{
    poolId: string;
    matchId: string;
    match: BotMatch;
}>> {
    const supabase = await createSupabaseServerClient();
    const db = supabase as any;

    // Get open pools with their matches
    const { data: openPools, error } = await db
        .from("bot_betting_pools")
        .select(`
            id,
            bot_match_id,
            bot_matches!inner (*)
        `)
        .eq("status", "open");

    if (error || !openPools) {
        console.error("[LifecycleManager] Error fetching pools:", error);
        return [];
    }

    const pendingLock: Array<{
        poolId: string;
        matchId: string;
        match: BotMatch;
    }> = [];

    for (const pool of openPools) {
        const row = pool.bot_matches;
        if (!row) continue;

        const match: BotMatch = {
            id: row.id,
            bot1CharacterId: row.bot1_character_id,
            bot2CharacterId: row.bot2_character_id,
            bot1Name: row.bot1_name,
            bot2Name: row.bot2_name,
            seed: row.seed,
            createdAt: new Date(row.created_at).getTime(),
            status: row.status,
            turns: row.turns,
            totalTurns: row.total_turns,
            matchWinner: row.match_winner,
            bot1RoundsWon: row.bot1_rounds_won,
            bot2RoundsWon: row.bot2_rounds_won,
            turnDurationMs: row.turn_duration_ms,
            bot1MaxHp: row.bot1_max_hp,
            bot2MaxHp: row.bot2_max_hp,
            bot1MaxEnergy: row.bot1_max_energy,
            bot2MaxEnergy: row.bot2_max_energy,
            bettingClosesAtTurn: row.betting_closes_at_turn,
        };

        // Check if betting should be closed
        if (!isBettingOpen(match)) {
            pendingLock.push({
                poolId: pool.id,
                matchId: pool.bot_match_id,
                match,
            });
        }
    }

    return pendingLock;
}

/**
 * Lock a betting pool (prevent new bets)
 */
export async function lockBettingPool(poolId: string): Promise<boolean> {
    const supabase = await createSupabaseServerClient();
    const db = supabase as any;

    const { error } = await db
        .from("bot_betting_pools")
        .update({
            status: "locked",
            locked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", poolId)
        .eq("status", "open");

    if (error) {
        console.error(`[LifecycleManager] Error locking pool ${poolId}:`, error);
        return false;
    }

    return true;
}

/**
 * Get match status summary for debugging/monitoring
 */
export function getMatchStatusSummary(match: BotMatch): {
    matchId: string;
    state: MatchLifecycleState;
    currentTurn: number;
    totalTurns: number;
    bettingOpen: boolean;
    timeUntilBettingClose: number;
    timeUntilMatchEnd: number;
    winner: string | null;
} {
    return {
        matchId: match.id,
        state: getMatchLifecycleState(match),
        currentTurn: getCurrentTurnIndex(match),
        totalTurns: match.totalTurns,
        bettingOpen: isBettingOpen(match),
        timeUntilBettingClose: getTimeUntilBettingClose(match),
        timeUntilMatchEnd: getTimeUntilMatchEnd(match),
        winner: match.matchWinner,
    };
}
