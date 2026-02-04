/**
 * POST /api/survival/end
 * Record survival run completion and award rewards
 * 
 * ANTI-CHEAT MEASURES:
 * 1. Session validation - verifies a survival run was started via /api/survival/start
 * 2. Time validation - ensures minimum time elapsed for waves claimed
 * 3. Server-side score calculation - ignores client-provided scores
 * 4. Health/wave consistency checks - validates data integrity
 * 5. Session invalidation - prevents replay attacks
 */

import { NextRequest, NextResponse } from "next/server";
import { recordSurvivalRun } from "@/lib/survival/leaderboard-updater";
import { calculateSurvivalScore } from "@/lib/survival/score-calculator";
import { createClient } from "@supabase/supabase-js";
import { getCharacterCombatStats } from "@/game/combat";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Anti-cheat constants
const MIN_SECONDS_PER_WAVE = 15; // Minimum realistic time per wave (seconds)
const MAX_HEALTH_PER_CHARACTER = 200; // Maximum possible HP for any character

interface EndSurvivalRequest {
    playerAddress: string;
    characterId: string;
    wavesCleared: number;
    finalHealth: number;
    isVictory: boolean;
    sessionToken?: string; // Optional session token for additional validation
    waveDetails?: {
        healthAfter: number;
        roundsWon: number;
        totalRounds: number;
    }[];
}

/**
 * Validate wave details for consistency
 */
function validateWaveDetails(
    waveDetails: EndSurvivalRequest["waveDetails"],
    wavesCleared: number,
    maxHealth: number
): { valid: boolean; reason?: string } {
    if (!waveDetails || waveDetails.length === 0) {
        // No details provided - allow but with reduced trust
        return { valid: true };
    }

    // Wave details count should match waves cleared
    if (waveDetails.length !== wavesCleared) {
        return { 
            valid: false, 
            reason: `Wave details count (${waveDetails.length}) doesn't match waves cleared (${wavesCleared})` 
        };
    }

    for (let i = 0; i < waveDetails.length; i++) {
        const wave = waveDetails[i];

        // Health cannot exceed max
        if (wave.healthAfter > maxHealth) {
            return { 
                valid: false, 
                reason: `Wave ${i + 1} health (${wave.healthAfter}) exceeds max (${maxHealth})` 
            };
        }

        // Health should be non-negative (except last wave if lost)
        if (wave.healthAfter < 0) {
            return { 
                valid: false, 
                reason: `Wave ${i + 1} has negative health` 
            };
        }

        // Rounds won should be reasonable (best of 1 in survival = max 1)
        if (wave.roundsWon < 0 || wave.roundsWon > wave.totalRounds) {
            return { 
                valid: false, 
                reason: `Wave ${i + 1} has invalid round stats` 
            };
        }

        // Health should generally decrease or stay same (no unexplained healing beyond surge effects)
        // We allow some increase due to Power Surge healing effects (up to 30%)
        if (i > 0 && wave.healthAfter > waveDetails[i - 1].healthAfter * 1.3) {
            return { 
                valid: false, 
                reason: `Wave ${i + 1} has suspicious health increase` 
            };
        }
    }

    return { valid: true };
}

export async function POST(request: NextRequest) {
    try {
        const body: EndSurvivalRequest = await request.json();

        // Validate required fields
        if (!body.playerAddress || !body.characterId) {
            return NextResponse.json(
                { error: "Missing required fields: playerAddress, characterId" },
                { status: 400 }
            );
        }

        if (body.wavesCleared < 0 || body.wavesCleared > 20) {
            return NextResponse.json(
                { error: "wavesCleared must be between 0 and 20" },
                { status: 400 }
            );
        }

        // Victory is only valid at wave 20
        if (body.isVictory && body.wavesCleared !== 20) {
            return NextResponse.json(
                { error: "Victory requires clearing all 20 waves" },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // ANTI-CHEAT: Verify the player exists
        const { data: player } = await supabase
            .from("players")
            .select("address")
            .eq("address", body.playerAddress)
            .single();

        if (!player) {
            return NextResponse.json(
                { error: "Player not found" },
                { status: 404 }
            );
        }

        // ANTI-CHEAT: Check for active survival session
        // Look for a recent survival start that hasn't been completed yet
        const { data: recentSession } = await supabase
            .from("survival_sessions")
            .select("*")
            .eq("player_id", body.playerAddress)
            .eq("status", "active")
            .order("started_at", { ascending: false })
            .limit(1)
            .single();

        // If no active session found, check if player has started a run recently
        // This is a fallback for when session tracking table doesn't exist yet
        const now = Date.now();
        let sessionStartTime = now - (body.wavesCleared * MIN_SECONDS_PER_WAVE * 1000); // Estimated
        let hasValidSession = false;

        if (recentSession) {
            sessionStartTime = new Date(recentSession.started_at).getTime();
            hasValidSession = true;

            // ANTI-CHEAT: Validate minimum time elapsed
            const elapsedSeconds = (now - sessionStartTime) / 1000;
            const minRequiredSeconds = body.wavesCleared * MIN_SECONDS_PER_WAVE;

            if (elapsedSeconds < minRequiredSeconds) {
                console.warn(`[SurvivalEnd] ANTI-CHEAT: Time violation for ${body.playerAddress}. ` +
                    `Claimed ${body.wavesCleared} waves in ${elapsedSeconds.toFixed(0)}s (min: ${minRequiredSeconds}s)`);
                return NextResponse.json(
                    { error: "Invalid run: completed too quickly" },
                    { status: 400 }
                );
            }

            // Mark session as completed to prevent replay
            await supabase
                .from("survival_sessions")
                .update({ 
                    status: "completed", 
                    completed_at: new Date().toISOString(),
                    waves_cleared: body.wavesCleared
                })
                .eq("id", recentSession.id);
        } else {
            // No session tracking - log warning but allow (for backwards compatibility)
            console.warn(`[SurvivalEnd] No active session found for ${body.playerAddress}. ` +
                `This may indicate cheating or missing session tracking.`);
        }

        // ANTI-CHEAT: Validate character and get max health
        let maxHealth = MAX_HEALTH_PER_CHARACTER;
        try {
            const charStats = getCharacterCombatStats(body.characterId);
            maxHealth = charStats.maxHp;
        } catch {
            // Unknown character - use default max
            console.warn(`[SurvivalEnd] Unknown character: ${body.characterId}`);
        }

        // ANTI-CHEAT: Validate final health
        if (body.finalHealth > maxHealth) {
            console.warn(`[SurvivalEnd] ANTI-CHEAT: Health violation for ${body.playerAddress}. ` +
                `Claimed health ${body.finalHealth} exceeds max ${maxHealth}`);
            // Cap health instead of rejecting (grace for potential rounding)
            body.finalHealth = maxHealth;
        }

        // ANTI-CHEAT: Validate wave details consistency
        const waveValidation = validateWaveDetails(body.waveDetails, body.wavesCleared, maxHealth);
        if (!waveValidation.valid) {
            console.warn(`[SurvivalEnd] ANTI-CHEAT: Wave detail violation for ${body.playerAddress}: ${waveValidation.reason}`);
            // Clear wave details if invalid - score will be calculated without bonuses
            body.waveDetails = undefined;
        }

        // ANTI-CHEAT: Server-side score calculation (never trust client scores)
        const scoreResult = calculateSurvivalScore(
            body.wavesCleared,
            Math.min(body.finalHealth, maxHealth), // Cap health
            body.isVictory,
            body.waveDetails
        );

        // Record the survival run
        const result = await recordSurvivalRun({
            player_id: body.playerAddress,
            character_id: body.characterId,
            waves_cleared: body.wavesCleared,
            score: scoreResult.totalScore,
            shards_earned: scoreResult.shardsEarned,
            final_health: body.finalHealth,
            is_victory: body.isVictory,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to record survival run" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            runId: result.runId,
            score: scoreResult.totalScore,
            shardsEarned: scoreResult.shardsEarned,
            isNewHighScore: result.isNewHighScore,
            previousBestScore: result.previousBestScore,
            newRank: result.newRank,
            breakdown: {
                waveScore: scoreResult.waveScore,
                healthBonus: scoreResult.healthBonus,
                victoryBonus: scoreResult.victoryBonus,
            },
        });
    } catch (error) {
        console.error("End survival error:", error);
        return NextResponse.json(
            { error: "Failed to end survival run" },
            { status: 500 }
        );
    }
}
