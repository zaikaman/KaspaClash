/**
 * Bot Match Auto-Payout Cron Job (FALLBACK)
 * POST /api/cron/bot-match-payout
 * 
 * IMPORTANT: This is now a FALLBACK mechanism only!
 * Primary payout happens client-side when match ends (same as player matches).
 * This cron catches edge cases where no clients were watching when match ended.
 * 
 * Automatically resolves bot match payouts when matches complete.
 * This ensures payouts happen even if no clients are watching.
 * 
 * Cron schedule: "* * * * *" (Every minute) via cron-job.org
 * 
 * Key insight: Matches are PRE-COMPUTED server-side, so we know exactly
 * when they finish based on: createdAt + (totalTurns * turnDurationMs) + bettingWindowMs
 * 
 * Uses the vault service to send actual KAS to winners, just like player match betting.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    isMatchFinished,
    markBotMatchCompleted,
    type BotMatch,
} from "@/lib/game/bot-match-service";
import { resolveBotMatchPayouts } from "@/lib/betting/bot-payout-service";
import { lockBettingPool } from "@/lib/game/bot-match-lifecycle";

export const runtime = "nodejs";
export const maxDuration = 60; // 1 minute max

// Betting window duration in milliseconds
const BETTING_WINDOW_MS = 30000;

/**
 * Verify the request is authorized
 */
function isCronAuthorized(request: NextRequest): boolean {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        return true;
    }

    // Vercel-specific signature header (if migrating back from cron-job.org)
    const vercelCronSignature = request.headers.get("x-vercel-signature");
    if (vercelCronSignature) {
        return true;
    }

    return false;
}

interface BotMatchRow {
    id: string;
    bot1_character_id: string;
    bot2_character_id: string;
    bot1_name: string;
    bot2_name: string;
    seed: string;
    created_at: string;
    status: string;
    turns: unknown[];
    total_turns: number;
    match_winner: string | null;
    bot1_rounds_won: number;
    bot2_rounds_won: number;
    turn_duration_ms: number;
    bot1_max_hp: number;
    bot2_max_hp: number;
    bot1_max_energy: number;
    bot2_max_energy: number;
    betting_closes_at_turn: number;
}

/**
 * Convert database row to BotMatch type
 */
function rowToBotMatch(row: BotMatchRow): BotMatch {
    return {
        id: row.id,
        bot1CharacterId: row.bot1_character_id,
        bot2CharacterId: row.bot2_character_id,
        bot1Name: row.bot1_name,
        bot2Name: row.bot2_name,
        seed: row.seed,
        createdAt: new Date(row.created_at).getTime(),
        status: row.status as "active" | "completed",
        turns: row.turns as BotMatch["turns"],
        totalTurns: row.total_turns,
        matchWinner: row.match_winner as "player1" | "player2" | null,
        bot1RoundsWon: row.bot1_rounds_won,
        bot2RoundsWon: row.bot2_rounds_won,
        turnDurationMs: row.turn_duration_ms,
        bot1MaxHp: row.bot1_max_hp,
        bot2MaxHp: row.bot2_max_hp,
        bot1MaxEnergy: row.bot1_max_energy,
        bot2MaxEnergy: row.bot2_max_energy,
        bettingClosesAtTurn: row.betting_closes_at_turn,
    };
}

/**
 * Process payout for a single match using the vault service
 */
async function processMatchPayout(
    matchId: string
): Promise<{
    success: boolean;
    matchId: string;
    winner?: string;
    payoutsCount?: number;
    totalAmount?: string;
    error?: string;
}> {
    try {
        const result = await resolveBotMatchPayouts(matchId);

        return {
            success: result.success,
            matchId: result.matchId,
            winner: result.winner,
            payoutsCount: result.totalPayouts,
            totalAmount: result.totalAmount.toString(),
        };
    } catch (error) {
        console.error(`[AutoPayout] Error processing match ${matchId}:`, error);
        return {
            success: false,
            matchId,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export async function GET(request: NextRequest) {
    console.log("[AutoPayout] Bot match auto-payout triggered");

    // Verify authorization
    if (!isCronAuthorized(request)) {
        console.error("[AutoPayout] Unauthorized request");
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const supabase = await createSupabaseServerClient();
        const db = supabase as any;

        // Find all active matches that should be finished based on time
        // A match is finished when: now >= createdAt + bettingWindow + (totalTurns * turnDurationMs)
        const { data: activeMatches, error: matchesError } = await db
            .from("bot_matches")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: true });

        if (matchesError) {
            console.error("[AutoPayout] Error fetching matches:", matchesError);
            return NextResponse.json(
                { success: false, error: "Failed to fetch matches" },
                { status: 500 }
            );
        }

        if (!activeMatches || activeMatches.length === 0) {
            console.log("[AutoPayout] No active matches to process");
            return NextResponse.json({
                success: true,
                message: "No active matches to process",
                processed: 0,
            });
        }

        console.log(`[AutoPayout] Found ${activeMatches.length} active matches to check`);

        const results: Array<{
            matchId: string;
            success: boolean;
            winner?: string;
            payoutsCount?: number;
            error?: string;
        }> = [];

        for (const row of activeMatches as BotMatchRow[]) {
            const match = rowToBotMatch(row);

            // Debug: Log match timing info
            const now = Date.now();
            const elapsed = now - match.createdAt;
            const maxDuration = match.totalTurns * match.turnDurationMs + 30000; // BETTING_WINDOW_MS
            const finished = isMatchFinished(match);
            console.log(`[AutoPayout] Match ${match.id.slice(0, 20)}... | elapsed: ${Math.floor(elapsed / 1000)}s | maxDuration: ${Math.floor(maxDuration / 1000)}s | finished: ${finished}`);

            // Check if match has finished based on elapsed time
            if (finished) {
                console.log(`[AutoPayout] Processing finished match: ${match.id}`);

                // Mark match as completed
                await markBotMatchCompleted(match.id);

                // Process payout using vault service
                const result = await processMatchPayout(match.id);
                results.push(result);

                if (result.success) {
                    console.log(`[AutoPayout] Match ${match.id} resolved - Winner: ${result.winner}, Payouts: ${result.payoutsCount}, Total: ${result.totalAmount} sompi`);
                } else {
                    console.error(`[AutoPayout] Match ${match.id} failed: ${result.error}`);
                }
            }
        }

        // Also check for pools that are still 'open' but their match has ended
        // This catches edge cases where the pool wasn't locked properly
        const { data: openPools, error: poolsError } = await db
            .from("bot_betting_pools")
            .select("id, bot_match_id, bot_matches!inner(*)")
            .eq("status", "open");

        if (!poolsError && openPools) {
            for (const pool of openPools) {
                const matchRow = pool.bot_matches as BotMatchRow;
                if (!matchRow) continue;

                const match = rowToBotMatch(matchRow);

                // Lock the pool if betting window has closed
                const elapsed = Date.now() - match.createdAt;
                if (elapsed >= BETTING_WINDOW_MS) {
                    console.log(`[AutoPayout] Locking orphan pool for match: ${match.id}`);
                    await lockBettingPool(pool.id);
                }
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        console.log(`[AutoPayout] Completed: ${results.length} matches processed (${successCount} succeeded, ${failCount} failed)`);

        return NextResponse.json({
            success: true,
            message: `Processed ${results.length} matches`,
            processed: results.length,
            succeeded: successCount,
            failed: failCount,
            results,
        });
    } catch (error) {
        console.error("[AutoPayout] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
    return GET(request);
}
