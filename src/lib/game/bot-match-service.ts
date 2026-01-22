/**
 * Bot Match Service
 * 
 * Pre-computes entire bot matches using CombatEngine (server-side).
 * Spectators replay pre-computed turn sequences - true 24/7 operation.
 */

import { CombatEngine } from "@/game/combat";
import { CHARACTER_ROSTER } from "@/data/characters";
import type { Character, MoveType } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Pre-computed turn data
 */
export interface BotTurnData {
    turnNumber: number;
    roundNumber: number;
    bot1Move: MoveType;
    bot2Move: MoveType;
    bot1Hp: number;
    bot2Hp: number;
    bot1Energy: number;
    bot2Energy: number;
    bot1GuardMeter: number;
    bot2GuardMeter: number;
    narrative: string;
    isRoundEnd: boolean;
    isMatchEnd: boolean;
    roundWinner: "player1" | "player2" | null;
    matchWinner: "player1" | "player2" | null;
}

/**
 * Bot match with pre-computed turns
 */
export interface BotMatch {
    id: string;
    bot1CharacterId: string;
    bot2CharacterId: string;
    bot1Name: string;
    bot2Name: string;
    seed: string;
    createdAt: number;
    status: "active" | "completed";
    // Pre-computed game data
    turns: BotTurnData[];
    totalTurns: number;
    matchWinner: "player1" | "player2" | null;
    bot1RoundsWon: number;
    bot2RoundsWon: number;
    turnDurationMs: number;
    // Initial stats
    bot1MaxHp: number;
    bot2MaxHp: number;
    bot1MaxEnergy: number;
    bot2MaxEnergy: number;
    // Betting fields
    bettingClosesAtTurn: number;
}

// Turn duration in milliseconds
const DEFAULT_TURN_DURATION_MS = 2500;

/**
 * Simple seeded random number generator (Mulberry32)
 */
function createSeededRandom(seed: string): () => number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    let state = hash >>> 0;

    return function (): number {
        state = (state + 0x6D2B79F5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Generate a unique match ID
 */
export function generateBotMatchId(): string {
    return `bot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get a random character using seeded RNG
 */
function getSeededRandomCharacter(random: () => number, exclude?: string): Character {
    const available = exclude
        ? CHARACTER_ROSTER.filter(c => c.id !== exclude)
        : CHARACTER_ROSTER;
    const index = Math.floor(random() * available.length);
    return available[index];
}

/**
 * Get a random affordable move using seeded RNG
 */
function getRandomMove(
    random: () => number,
    engine: CombatEngine,
    player: "player1" | "player2"
): MoveType {
    const moves: MoveType[] = ["punch", "kick", "block", "special"];
    const affordable = moves.filter(m => engine.canAffordMove(player, m));

    if (affordable.length === 0) return "punch";

    const index = Math.floor(random() * affordable.length);
    return affordable[index];
}

/**
 * Simulate an entire bot match and return pre-computed turns.
 * This runs on the server - no Phaser required!
 */
export function simulateBotMatch(matchId: string, bot1Id?: string, bot2Id?: string): BotMatch {
    const random = createSeededRandom(matchId);

    // Pick characters
    const bot1 = bot1Id
        ? CHARACTER_ROSTER.find(c => c.id === bot1Id) || getSeededRandomCharacter(random)
        : getSeededRandomCharacter(random);

    const bot2 = bot2Id
        ? CHARACTER_ROSTER.find(c => c.id === bot2Id) || getSeededRandomCharacter(random, bot1.id)
        : getSeededRandomCharacter(random, bot1.id);

    // Initialize combat engine
    const engine = new CombatEngine(bot1.id, bot2.id, "best_of_3");
    const initialState = engine.getState();

    // Pre-compute all turns
    const turns: BotTurnData[] = [];
    let turnNumber = 0;
    let currentRound = 1;

    // Simulate until match ends (max 100 turns safety limit)
    while (!engine.getState().isMatchOver && turnNumber < 100) {
        turnNumber++;
        const state = engine.getState();

        // Get random moves (or handle stun)
        const bot1Move = state.player1.isStunned
            ? "punch" // Will be treated as stunned in engine
            : getRandomMove(random, engine, "player1");
        const bot2Move = state.player2.isStunned
            ? "punch"
            : getRandomMove(random, engine, "player2");

        // Resolve turn
        const result = engine.resolveTurn(bot1Move, bot2Move);
        const newState = engine.getState();

        // Store turn data
        turns.push({
            turnNumber,
            roundNumber: currentRound,
            bot1Move: state.player1.isStunned ? "stunned" as MoveType : bot1Move,
            bot2Move: state.player2.isStunned ? "stunned" as MoveType : bot2Move,
            bot1Hp: newState.player1.hp,
            bot2Hp: newState.player2.hp,
            bot1Energy: newState.player1.energy,
            bot2Energy: newState.player2.energy,
            bot1GuardMeter: newState.player1.guardMeter,
            bot2GuardMeter: newState.player2.guardMeter,
            narrative: result.narrative,
            isRoundEnd: newState.isRoundOver,
            isMatchEnd: newState.isMatchOver,
            roundWinner: newState.roundWinner,
            matchWinner: newState.matchWinner,
        });

        // Handle round end
        if (newState.isRoundOver && !newState.isMatchOver) {
            currentRound++;
            engine.startNewRound();
        }
    }

    const finalState = engine.getState();

    return {
        id: matchId,
        bot1CharacterId: bot1.id,
        bot2CharacterId: bot2.id,
        bot1Name: bot1.name,
        bot2Name: bot2.name,
        seed: matchId,
        createdAt: Date.now(),
        status: "active",
        turns,
        totalTurns: turns.length,
        matchWinner: finalState.matchWinner,
        bot1RoundsWon: finalState.player1.roundsWon,
        bot2RoundsWon: finalState.player2.roundsWon,
        turnDurationMs: DEFAULT_TURN_DURATION_MS,
        bot1MaxHp: initialState.player1.maxHp,
        bot2MaxHp: initialState.player2.maxHp,
        bot1MaxEnergy: initialState.player1.maxEnergy,
        bot2MaxEnergy: initialState.player2.maxEnergy,
        bettingClosesAtTurn: 3, // Betting closes after 3 turns
    };
}

/**
 * Generate and simulate a new bot match
 */
export function generateBotMatch(): BotMatch {
    const matchId = generateBotMatchId();
    return simulateBotMatch(matchId);
}

/**
 * Get current turn index based on elapsed time (24/7 operation)
 */
export function getCurrentTurnIndex(match: BotMatch): number {
    const BETTING_WINDOW_MS = 30000; // 30 seconds betting period
    const elapsed = Date.now() - match.createdAt;
    
    // Match doesn't start until after betting window
    if (elapsed < BETTING_WINDOW_MS) {
        return 0; // Still in betting phase, no turns have started yet
    }
    
    // Calculate turn index starting from after betting window
    const gameElapsed = elapsed - BETTING_WINDOW_MS;
    const turnIndex = Math.floor(gameElapsed / match.turnDurationMs);
    
    // Clamp to valid range
    const currentTurn = Math.min(turnIndex, match.totalTurns - 1);
    
    // If we've passed the last turn, the match is finished
    if (turnIndex >= match.totalTurns) {
        return match.totalTurns - 1; // Return last turn index
    }
    
    return Math.max(0, currentTurn);
}

/**
 * Check if a match has finished based on elapsed time
 */
export function isMatchFinished(match: BotMatch): boolean {
    const BETTING_WINDOW_MS = 30000; // 30 seconds
    const elapsed = Date.now() - match.createdAt;
    const maxDuration = match.totalTurns * match.turnDurationMs + BETTING_WINDOW_MS;
    return elapsed >= maxDuration || match.status === 'completed';
}

/**
 * Get all active bot matches from database
 */
export async function getActiveBotMatches(): Promise<BotMatch[]> {
    const supabase = await createSupabaseServerClient();
    
    // Type assertion needed until migration is applied and types regenerated
    const { data, error } = await (supabase as any)
        .from('bot_matches')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('[getActiveBotMatches] Database error:', error);
        return [];
    }

    return (data || []).map((dbMatch: any) => ({
        id: dbMatch.id,
        bot1CharacterId: dbMatch.bot1_character_id,
        bot2CharacterId: dbMatch.bot2_character_id,
        bot1Name: dbMatch.bot1_name,
        bot2Name: dbMatch.bot2_name,
        seed: dbMatch.seed,
        createdAt: new Date(dbMatch.created_at).getTime(),
        status: dbMatch.status as "active" | "completed",
        turns: dbMatch.turns as BotTurnData[],
        totalTurns: dbMatch.total_turns,
        matchWinner: dbMatch.match_winner as "player1" | "player2" | null,
        bot1RoundsWon: dbMatch.bot1_rounds_won,
        bot2RoundsWon: dbMatch.bot2_rounds_won,
        turnDurationMs: dbMatch.turn_duration_ms,
        bot1MaxHp: dbMatch.bot1_max_hp,
        bot2MaxHp: dbMatch.bot2_max_hp,
        bot1MaxEnergy: dbMatch.bot1_max_energy,
        bot2MaxEnergy: dbMatch.bot2_max_energy,
        bettingClosesAtTurn: dbMatch.betting_closes_at_turn,
    }));
}

/**
 * Get a specific bot match by ID from database
 */
export async function getBotMatch(matchId: string): Promise<BotMatch | null> {
    const supabase = await createSupabaseServerClient();
    
    // Type assertion needed until migration is applied and types regenerated
    const { data, error } = await (supabase as any)
        .from('bot_matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (error || !data) {
        return null;
    }

    const dbMatch: any = data;
    return {
        id: dbMatch.id,
        bot1CharacterId: dbMatch.bot1_character_id,
        bot2CharacterId: dbMatch.bot2_character_id,
        bot1Name: dbMatch.bot1_name,
        bot2Name: dbMatch.bot2_name,
        seed: dbMatch.seed,
        createdAt: new Date(dbMatch.created_at).getTime(),
        status: dbMatch.status as "active" | "completed",
        turns: dbMatch.turns as BotTurnData[],
        totalTurns: dbMatch.total_turns,
        matchWinner: dbMatch.match_winner as "player1" | "player2" | null,
        bot1RoundsWon: dbMatch.bot1_rounds_won,
        bot2RoundsWon: dbMatch.bot2_rounds_won,
        turnDurationMs: dbMatch.turn_duration_ms,
        bot1MaxHp: dbMatch.bot1_max_hp,
        bot2MaxHp: dbMatch.bot2_max_hp,
        bot1MaxEnergy: dbMatch.bot1_max_energy,
        bot2MaxEnergy: dbMatch.bot2_max_energy,
        bettingClosesAtTurn: dbMatch.betting_closes_at_turn,
    };
}

/**
 * Add a new bot match to database
 */
export async function addBotMatch(match: BotMatch): Promise<void> {
    const supabase = await createSupabaseServerClient();
    
    // Type assertion needed until migration is applied and types regenerated
    const { error } = await (supabase as any)
        .from('bot_matches')
        .insert({
            id: match.id,
            bot1_character_id: match.bot1CharacterId,
            bot2_character_id: match.bot2CharacterId,
            bot1_name: match.bot1Name,
            bot2_name: match.bot2Name,
            seed: match.seed,
            status: match.status,
            turns: match.turns,
            total_turns: match.totalTurns,
            match_winner: match.matchWinner,
            bot1_rounds_won: match.bot1RoundsWon,
            bot2_rounds_won: match.bot2RoundsWon,
            turn_duration_ms: match.turnDurationMs,
            bot1_max_hp: match.bot1MaxHp,
            bot2_max_hp: match.bot2MaxHp,
            bot1_max_energy: match.bot1MaxEnergy,
            bot2_max_energy: match.bot2MaxEnergy,
            betting_closes_at_turn: match.bettingClosesAtTurn,
        });

    if (error) {
        console.error('[addBotMatch] Database error:', error);
        throw new Error('Failed to add bot match to database');
    }
}

/**
 * Remove a bot match from database
 */
export async function removeBotMatch(matchId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    
    // Type assertion needed until migration is applied and types regenerated
    const { error } = await (supabase as any)
        .from('bot_matches')
        .delete()
        .eq('id', matchId);

    if (error) {
        console.error('[removeBotMatch] Database error:', error);
    }
}

/**
 * Mark a bot match as completed in database
 */
export async function markBotMatchCompleted(matchId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    
    // Type assertion needed until migration is applied and types regenerated
    const { error } = await (supabase as any)
        .from('bot_matches')
        .update({ status: 'completed' })
        .eq('id', matchId);

    if (error) {
        console.error('[markBotMatchCompleted] Database error:', error);
    }
}

/**
 * Ensure there's always exactly one active bot match (single room system).
 * Creates a new match only when the current one has finished playing.
 */
export async function ensureActiveBotMatch(): Promise<BotMatch> {
    const supabase = await createSupabaseServerClient();
    const now = Date.now();
    const BETTING_WINDOW_MS = 30000; // 30 seconds

    // Clean up old matches (older than 24 hours)
    await (supabase as any)
        .from('bot_matches')
        .delete()
        .lt('created_at', new Date(now - 24 * 60 * 60 * 1000).toISOString());

    // Find the most recent active match
    const { data: matches } = await (supabase as any)
        .from('bot_matches')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

    if (matches && matches.length > 0) {
        const dbMatch = matches[0];
        const createdAt = new Date(dbMatch.created_at).getTime();
        
        const match: BotMatch = {
            id: dbMatch.id,
            bot1CharacterId: dbMatch.bot1_character_id,
            bot2CharacterId: dbMatch.bot2_character_id,
            bot1Name: dbMatch.bot1_name,
            bot2Name: dbMatch.bot2_name,
            seed: dbMatch.seed,
            createdAt,
            status: dbMatch.status as "active" | "completed",
            turns: dbMatch.turns as BotTurnData[],
            totalTurns: dbMatch.total_turns,
            matchWinner: dbMatch.match_winner as "player1" | "player2" | null,
            bot1RoundsWon: dbMatch.bot1_rounds_won,
            bot2RoundsWon: dbMatch.bot2_rounds_won,
            turnDurationMs: dbMatch.turn_duration_ms,
            bot1MaxHp: dbMatch.bot1_max_hp,
            bot2MaxHp: dbMatch.bot2_max_hp,
            bot1MaxEnergy: dbMatch.bot1_max_energy,
            bot2MaxEnergy: dbMatch.bot2_max_energy,
            bettingClosesAtTurn: dbMatch.betting_closes_at_turn,
        };
        
        // If match has finished, mark it as completed and create a new one
        if (isMatchFinished(match)) {
            await markBotMatchCompleted(dbMatch.id);
            // Create new match immediately
            const newMatch = generateBotMatch();
            await addBotMatch(newMatch);
            return newMatch;
        }
        
        // Return the currently active match
        return match;
    }

    // No active matches exist, create the first one
    const newMatch = generateBotMatch();
    await addBotMatch(newMatch);
    return newMatch;
}
/**
 * Cleanup old matches from database
 */
export async function cleanupOldMatches(): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Type assertion needed until migration is applied and types regenerated
    await (supabase as any)
        .from('bot_matches')
        .delete()
        .lt('created_at', oneDayAgo);
}

/**
 * Get sync info for spectators joining mid-match
 */
export async function getMatchSyncInfo(matchId: string): Promise<{
    match: BotMatch;
    currentTurnIndex: number;
    elapsedMs: number;
    isFinished: boolean;
} | null> {
    const match = await getBotMatch(matchId);
    if (!match) return null;

    const now = Date.now();
    const elapsedMs = now - match.createdAt;
    const currentTurnIndex = getCurrentTurnIndex(match);
    const isFinished = isMatchFinished(match);

    // If match is finished but not marked as completed, mark it now
    if (isFinished && match.status === 'active') {
        await markBotMatchCompleted(matchId);
    }

    return {
        match,
        currentTurnIndex,
        elapsedMs,
        isFinished,
    };
}

// =============================================================================
// BETTING HELPERS
// =============================================================================

/**
 * Check if betting is still open for a match
 */
export function isBettingOpen(match: BotMatch): boolean {
    const currentTurn = getCurrentTurnIndex(match);

    // Betting window is 30 seconds from match creation
    const BETTING_WINDOW_MS = 30000; // 30 seconds
    const elapsed = Date.now() - match.createdAt;

    // Betting closes after 30 seconds
    if (elapsed >= BETTING_WINDOW_MS) {
        return false;
    }

    // Betting closes if match is finished
    const maxDuration = match.totalTurns * match.turnDurationMs + BETTING_WINDOW_MS;
    if (elapsed >= maxDuration) {
        return false;
    }

    return true;
}

/**
 * Get betting status info for UI
 */
export function getBettingStatus(match: BotMatch): {
    isOpen: boolean;
    currentTurn: number;
    closesAtTurn: number;
    turnsRemaining: number;
    secondsRemaining: number;
    reason?: string;
} {
    const BETTING_WINDOW_MS = 30000; // 30 seconds
    const currentTurn = getCurrentTurnIndex(match);
    const closesAtTurn = match.bettingClosesAtTurn;
    const turnsRemaining = Math.max(0, closesAtTurn - currentTurn);

    const elapsed = Date.now() - match.createdAt;
    let secondsRemaining = Math.max(0, Math.ceil((BETTING_WINDOW_MS - elapsed) / 1000));

    let isOpen = secondsRemaining > 0;
    let reason: string | undefined;

    // Check if match is finished
    if (elapsed >= match.totalTurns * match.turnDurationMs + BETTING_WINDOW_MS) {
        isOpen = false;
        secondsRemaining = 0;
        reason = "Match has ended";
    } 
    // Check if betting window has closed
    else if (secondsRemaining === 0) {
        isOpen = false;
        reason = "Betting period ended";
    }

    return {
        isOpen,
        currentTurn,
        closesAtTurn,
        turnsRemaining,
        secondsRemaining,
        reason,
    };
}
