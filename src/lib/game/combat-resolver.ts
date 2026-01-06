/**
 * Combat Resolver - Server-side turn resolution
 * Resolves rounds when both players have submitted moves
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    CombatEngine,
    getCharacterCombatStats,
} from "@/game/combat";
import { updateMatchRatings, type RatingUpdateResult } from "@/lib/rating/elo";
import type { MoveType } from "@/types";

/**
 * Round resolution result.
 */
export interface RoundResolutionResult {
    success: boolean;
    roundNumber: number;
    player1Move: MoveType;
    player2Move: MoveType;
    player1DamageDealt: number;
    player2DamageDealt: number;
    player1HealthAfter: number;
    player2HealthAfter: number;
    player1EnergyAfter: number;
    player2EnergyAfter: number;
    roundWinner: "player1" | "player2" | null;
    isMatchOver: boolean;
    matchWinner: "player1" | "player2" | null;
    narrative: string;
    error?: string;
}

/**
 * Validate move type
 */
function isValidMove(move: string | null): move is MoveType {
    return move !== null && ["punch", "kick", "block", "special"].includes(move);
}

/**
 * Resolve a round - called when both players have submitted moves.
 * Creates a fresh CombatEngine and replays all previous rounds to get current state.
 */
export async function resolveRound(
    matchId: string,
    roundId: string
): Promise<RoundResolutionResult> {
    const supabase = await createSupabaseServerClient();

    // Fetch the current round with moves
    const { data: currentRound, error: roundError } = await supabase
        .from("rounds")
        .select("*")
        .eq("id", roundId)
        .single();

    if (roundError || !currentRound) {
        return createErrorResult("Round not found");
    }

    // Validate moves exist
    if (!isValidMove(currentRound.player1_move) || !isValidMove(currentRound.player2_move)) {
        return createErrorResult("Invalid moves");
    }

    // Fetch match for character info
    const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

    if (matchError || !match) {
        return createErrorResult("Match not found");
    }

    const player1CharId = match.player1_character_id || "dag-warrior";
    const player2CharId = match.player2_character_id || "dag-warrior";

    // Create combat engine and initialize with character stats
    const engine = new CombatEngine(player1CharId, player2CharId, "best_of_5");

    // Fetch all previous resolved rounds to rebuild state
    const { data: previousRounds } = await supabase
        .from("rounds")
        .select("*")
        .eq("match_id", matchId)
        .lt("round_number", currentRound.round_number)
        .order("round_number", { ascending: true });

    // Replay previous rounds (if any) to get current health/energy state
    // For now, we're using a simplified model where each "round" is actually a "turn"
    // within the same health pool until someone is KO'd
    if (previousRounds) {
        for (const prevRound of previousRounds) {
            if (isValidMove(prevRound.player1_move) && isValidMove(prevRound.player2_move)) {
                engine.resolveTurn(prevRound.player1_move, prevRound.player2_move);

                // If a round ended, start new round
                const prevState = engine.getState();
                if (prevState.isRoundOver && !prevState.isMatchOver) {
                    engine.startNewRound();
                }
            }
        }
    }

    // Now resolve the current turn
    const result = engine.resolveTurn(
        currentRound.player1_move,
        currentRound.player2_move
    );

    const state = engine.getState();

    // Update round with results
    const { error: updateError } = await supabase
        .from("rounds")
        .update({
            player1_damage_dealt: result.player1.damageDealt,
            player2_damage_dealt: result.player2.damageDealt,
            // Clamp health values to 0 to respect DB constraints
            player1_health_after: Math.max(0, state.player1.hp),
            player2_health_after: Math.max(0, state.player2.hp),
            winner_address: state.roundWinner === "player1"
                ? match.player1_address
                : state.roundWinner === "player2"
                    ? match.player2_address
                    : null,
        })
        .eq("id", roundId);

    if (updateError) {
        console.error("Round update error:", updateError);
    }

    // Update match round scores
    if (state.isRoundOver || state.isMatchOver) {
        const matchUpdate: Record<string, unknown> = {
            player1_rounds_won: state.player1.roundsWon,
            player2_rounds_won: state.player2.roundsWon,
        };

        if (state.isMatchOver) {
            matchUpdate.status = "completed";
            matchUpdate.winner_address = state.matchWinner === "player1"
                ? match.player1_address
                : match.player2_address;
            matchUpdate.completed_at = new Date().toISOString();
        }

        await supabase
            .from("matches")
            .update(matchUpdate)
            .eq("id", matchId);
    }

    // Update player ratings if match is over
    let ratingResult: RatingUpdateResult | null = null;
    if (state.isMatchOver) {
        const winnerAddress = state.matchWinner === "player1"
            ? match.player1_address
            : match.player2_address!; // player2_address is guaranteed non-null for in-progress matches
        const loserAddress = state.matchWinner === "player1"
            ? match.player2_address!
            : match.player1_address;
        ratingResult = await updateMatchRatings(winnerAddress, loserAddress);
    }

    // Broadcast round_resolved event
    const gameChannel = supabase.channel(`game:${matchId}`);
    await gameChannel.send({
        type: "broadcast",
        event: "round_resolved",
        payload: {
            roundNumber: currentRound.round_number,
            turnNumber: state.currentTurn - 1, // Turn that just resolved
            player1: {
                move: currentRound.player1_move,
                damageDealt: result.player1.damageDealt,
                damageTaken: result.player1.damageTaken,
                outcome: result.player1.outcome,
                effects: result.player1.effects,
            },
            player2: {
                move: currentRound.player2_move,
                damageDealt: result.player2.damageDealt,
                damageTaken: result.player2.damageTaken,
                outcome: result.player2.outcome,
                effects: result.player2.effects,
            },
            player1Health: state.player1.hp,
            player2Health: state.player2.hp,
            player1MaxHealth: state.player1.maxHp,
            player2MaxHealth: state.player2.maxHp,
            player1Energy: state.player1.energy,
            player2Energy: state.player2.energy,
            player1GuardMeter: state.player1.guardMeter,
            player2GuardMeter: state.player2.guardMeter,
            roundWinner: state.roundWinner,
            player1RoundsWon: state.player1.roundsWon,
            player2RoundsWon: state.player2.roundsWon,
            isRoundOver: state.isRoundOver,
            isMatchOver: state.isMatchOver,
            matchWinner: state.matchWinner,
            narrative: result.narrative,
        },
    });
    await supabase.removeChannel(gameChannel);

    // If match is over, broadcast match_ended
    if (state.isMatchOver) {
        const endChannel = supabase.channel(`game:${matchId}`);
        await endChannel.send({
            type: "broadcast",
            event: "match_ended",
            payload: {
                winner: state.matchWinner,
                winnerAddress: state.matchWinner === "player1"
                    ? match.player1_address
                    : match.player2_address,
                reason: "rounds_won",
                finalScore: {
                    player1RoundsWon: state.player1.roundsWon,
                    player2RoundsWon: state.player2.roundsWon,
                },
                ratingChanges: ratingResult ? {
                    winner: {
                        before: ratingResult.winner.ratingBefore,
                        after: ratingResult.winner.ratingAfter,
                        change: ratingResult.winner.change,
                    },
                    loser: {
                        before: ratingResult.loser.ratingBefore,
                        after: ratingResult.loser.ratingAfter,
                        change: ratingResult.loser.change,
                    },
                } : undefined,
            },
        });
        await supabase.removeChannel(endChannel);
    } else {
        // Broadcast round_starting for next turn with synchronized deadline
        // When a round ends (someone KO'd), add extra time for client death animation sequence:
        // - Death animation: 1.5s
        // - Result text display: 1.5s
        // - 5-second countdown: 5s
        // - Buffer: 1s
        // Total: 9 seconds extra when round is over
        const ROUND_END_ANIMATION_MS = 9000; // Extra time for death animation + text + countdown
        const ROUND_COUNTDOWN_MS = 3000;
        const MOVE_TIMER_MS = 20000;
        const animationTime = state.isRoundOver ? ROUND_END_ANIMATION_MS : 0;
        const moveDeadlineAt = Date.now() + animationTime + ROUND_COUNTDOWN_MS + MOVE_TIMER_MS;

        // If round is over (someone KO'd), start new round in engine
        if (state.isRoundOver) {
            engine.startNewRound();
        }
        const newState = engine.getState();

        const nextChannel = supabase.channel(`game:${matchId}`);

        // Create/update next round with server-side deadline
        const nextRoundNumber = state.isRoundOver ? newState.currentRound : currentRound.round_number + 1;
        const { data: roundData, error: roundUpsertError } = await supabase
            .from("rounds")
            .upsert({
                match_id: matchId,
                round_number: nextRoundNumber,
                move_deadline_at: new Date(moveDeadlineAt).toISOString(),
            }, { onConflict: "match_id,round_number" })
            .select() // Select to get ID
            .single();

        if (roundUpsertError) {
            console.error("Failed to upsert round:", roundUpsertError);
        } else if (roundData) {
            // Check for stunned players and pre-fill moves
            const movesToInsert: any[] = [];
            const roundUpdates: any = {};

            if (newState.player1.isStunned) {
                console.log(`[CombatResolver] Pre-filling stunned move for Player 1 (Round ${nextRoundNumber})`);
                movesToInsert.push({
                    round_id: roundData.id,
                    player_address: match.player1_address,
                    move_type: "block", // Use 'block' as dummy move (DB constraint safe)
                    tx_id: "stunned-skip",
                });
                roundUpdates.player1_move = "block";
            }

            if (newState.player2.isStunned) {
                console.log(`[CombatResolver] Pre-filling stunned move for Player 2 (Round ${nextRoundNumber})`);
                movesToInsert.push({
                    round_id: roundData.id,
                    // Handle nullable player2 address (shouldn't happen in-progress)
                    player_address: match.player2_address || "",
                    move_type: "block", // Use 'block' as dummy move (DB constraint safe)
                    tx_id: "stunned-skip",
                });
                roundUpdates.player2_move = "block";
            }

            if (movesToInsert.length > 0) {
                await supabase.from("moves").insert(movesToInsert);
                await supabase.from("rounds").update(roundUpdates).eq("id", roundData.id);
            }
        }

        await nextChannel.send({
            type: "broadcast",
            event: "round_starting",
            payload: {
                roundNumber: newState.currentRound,
                turnNumber: newState.currentTurn,
                moveDeadlineAt,
                countdownSeconds: Math.floor(ROUND_COUNTDOWN_MS / 1000),
                player1Health: newState.player1.hp,
                player2Health: newState.player2.hp,
                player1MaxHealth: newState.player1.maxHp,
                player2MaxHealth: newState.player2.maxHp,
                player1Energy: newState.player1.energy,
                player2Energy: newState.player2.energy,
                player1GuardMeter: newState.player1.guardMeter,
                player2GuardMeter: newState.player2.guardMeter,
                // Stun state - if true, player cannot act this turn
                player1IsStunned: newState.player1.isStunned,
                player2IsStunned: newState.player2.isStunned,
            },
        });
        await supabase.removeChannel(nextChannel);
    }

    return {
        success: true,
        roundNumber: currentRound.round_number,
        player1Move: currentRound.player1_move,
        player2Move: currentRound.player2_move,
        player1DamageDealt: result.player1.damageDealt,
        player2DamageDealt: result.player2.damageDealt,
        player1HealthAfter: state.player1.hp,
        player2HealthAfter: state.player2.hp,
        player1EnergyAfter: state.player1.energy,
        player2EnergyAfter: state.player2.energy,
        roundWinner: state.roundWinner,
        isMatchOver: state.isMatchOver,
        matchWinner: state.matchWinner,
        narrative: result.narrative,
    };
}

/**
 * Helper to create error result
 */
function createErrorResult(error: string): RoundResolutionResult {
    return {
        success: false,
        roundNumber: 0,
        player1Move: "punch",
        player2Move: "punch",
        player1DamageDealt: 0,
        player2DamageDealt: 0,
        player1HealthAfter: 0,
        player2HealthAfter: 0,
        player1EnergyAfter: 0,
        player2EnergyAfter: 0,
        roundWinner: null,
        isMatchOver: false,
        matchWinner: null,
        narrative: "",
        error,
    };
}

/**
 * Handle move rejection result.
 */
export interface MoveRejectionResult {
    success: boolean;
    roundWinner: "player1" | "player2";
    isMatchOver: boolean;
    matchWinner: "player1" | "player2" | null;
    narrative: string;
    error?: string;
}

/**
 * Handle when a player rejects their move transaction.
 * Called when one player has submitted and the other has rejected.
 * Awards the round to the player who submitted.
 */
export async function handleMoveRejection(
    matchId: string,
    roundId: string,
    rejectingPlayer: "player1" | "player2"
): Promise<MoveRejectionResult> {
    const supabase = await createSupabaseServerClient();

    // The winner is the opponent
    const roundWinner = rejectingPlayer === "player1" ? "player2" : "player1";

    // Fetch match
    const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

    if (matchError || !match) {
        return {
            success: false,
            roundWinner,
            isMatchOver: false,
            matchWinner: null,
            narrative: "",
            error: "Match not found",
        };
    }

    // Update round scores
    const player1RoundsWon = match.player1_rounds_won || 0;
    const player2RoundsWon = match.player2_rounds_won || 0;

    const newPlayer1RoundsWon = roundWinner === "player1" ? player1RoundsWon + 1 : player1RoundsWon;
    const newPlayer2RoundsWon = roundWinner === "player2" ? player2RoundsWon + 1 : player2RoundsWon;

    // Check if match is over (first to 3)
    const isMatchOver = newPlayer1RoundsWon >= 3 || newPlayer2RoundsWon >= 3;
    const matchWinner = isMatchOver
        ? (newPlayer1RoundsWon >= 3 ? "player1" : "player2")
        : null;

    const winnerAddress = roundWinner === "player1" ? match.player1_address : match.player2_address;
    const loserPlayer = rejectingPlayer;
    const narrative = `${loserPlayer === "player1" ? "Player 1" : "Player 2"} rejected the transaction. ${roundWinner === "player1" ? "Player 1" : "Player 2"} wins this round!`;

    // Update round with winner
    await supabase
        .from("rounds")
        .update({
            winner_address: winnerAddress,
        })
        .eq("id", roundId);

    // Update match
    const matchUpdate: Record<string, unknown> = {
        player1_rounds_won: newPlayer1RoundsWon,
        player2_rounds_won: newPlayer2RoundsWon,
    };

    if (isMatchOver) {
        matchUpdate.status = "completed";
        matchUpdate.winner_address = matchWinner === "player1"
            ? match.player1_address
            : match.player2_address;
        matchUpdate.completed_at = new Date().toISOString();
    }

    await supabase
        .from("matches")
        .update(matchUpdate)
        .eq("id", matchId);

    // Update player ratings if match is over
    let ratingResult: RatingUpdateResult | null = null;
    if (isMatchOver && match.player2_address) {
        const winnerAddr = matchWinner === "player1"
            ? match.player1_address
            : match.player2_address;
        const loserAddr = matchWinner === "player1"
            ? match.player2_address
            : match.player1_address;
        ratingResult = await updateMatchRatings(winnerAddr, loserAddr);
    }

    // Broadcast round_resolved with rejection info
    const gameChannel = supabase.channel(`game:${matchId}`);
    await gameChannel.send({
        type: "broadcast",
        event: "round_resolved",
        payload: {
            roundWinner,
            player1RoundsWon: newPlayer1RoundsWon,
            player2RoundsWon: newPlayer2RoundsWon,
            isRoundOver: true,
            isMatchOver,
            matchWinner,
            narrative,
            reason: "opponent_rejected",
            // Stub values for players - no combat occurred
            player1: { move: null, damageDealt: 0, damageTaken: 0 },
            player2: { move: null, damageDealt: 0, damageTaken: 0 },
            player1Health: 100,
            player2Health: 100,
            player1Energy: 100,
            player2Energy: 100,
            player1GuardMeter: 0,
            player2GuardMeter: 0,
        },
    });
    await supabase.removeChannel(gameChannel);

    // If match is over, broadcast match_ended
    if (isMatchOver) {
        const endChannel = supabase.channel(`game:${matchId}`);
        await endChannel.send({
            type: "broadcast",
            event: "match_ended",
            payload: {
                winner: matchWinner,
                winnerAddress: matchWinner === "player1"
                    ? match.player1_address
                    : match.player2_address,
                reason: "opponent_rejected",
                finalScore: {
                    player1RoundsWon: newPlayer1RoundsWon,
                    player2RoundsWon: newPlayer2RoundsWon,
                },
                ratingChanges: ratingResult ? {
                    winner: {
                        before: ratingResult.winner.ratingBefore,
                        after: ratingResult.winner.ratingAfter,
                        change: ratingResult.winner.change,
                    },
                    loser: {
                        before: ratingResult.loser.ratingBefore,
                        after: ratingResult.loser.ratingAfter,
                        change: ratingResult.loser.change,
                    },
                } : undefined,
            },
        });
        await supabase.removeChannel(endChannel);
    } else {
        // Start next round
        // Add extra time for client death animation sequence (9 seconds)
        const ROUND_END_ANIMATION_MS = 9000;
        const ROUND_COUNTDOWN_MS = 3000;
        const MOVE_TIMER_MS = 20000;
        const moveDeadlineAt = Date.now() + ROUND_END_ANIMATION_MS + ROUND_COUNTDOWN_MS + MOVE_TIMER_MS;

        const nextChannel = supabase.channel(`game:${matchId}`);

        // Create next round with server-side deadline
        const nextRoundNumber = (match.player1_rounds_won || 0) + (match.player2_rounds_won || 0) + 2;
        await supabase
            .from("rounds")
            .upsert({
                match_id: matchId,
                round_number: nextRoundNumber,
                move_deadline_at: new Date(moveDeadlineAt).toISOString(),
            }, { onConflict: "match_id,round_number" });

        // Get character stats for proper max values
        const p1CharId = match.player1_character_id || "dag-warrior";
        const p2CharId = match.player2_character_id || "dag-warrior";
        const p1Stats = getCharacterCombatStats(p1CharId);
        const p2Stats = getCharacterCombatStats(p2CharId);

        await nextChannel.send({
            type: "broadcast",
            event: "round_starting",
            payload: {
                roundNumber: (match.player1_rounds_won || 0) + (match.player2_rounds_won || 0) + 2,
                turnNumber: 1,
                moveDeadlineAt,
                countdownSeconds: Math.floor(ROUND_COUNTDOWN_MS / 1000),
                // Use character-specific max values
                player1Health: p1Stats.maxHp,
                player2Health: p2Stats.maxHp,
                player1MaxHealth: p1Stats.maxHp,
                player2MaxHealth: p2Stats.maxHp,
                player1Energy: p1Stats.maxEnergy,
                player2Energy: p2Stats.maxEnergy,
                player1GuardMeter: 0,
                player2GuardMeter: 0,
                // New round - no stun state
                player1IsStunned: false,
                player2IsStunned: false,
            },
        });
        await supabase.removeChannel(nextChannel);
    }

    return {
        success: true,
        roundWinner,
        isMatchOver,
        matchWinner,
        narrative,
    };
}
