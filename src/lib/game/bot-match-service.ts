/**
 * Bot Match Service
 * 
 * Pre-computes entire bot matches using CombatEngine (server-side).
 * Spectators replay pre-computed turn sequences - true 24/7 operation.
 */

import { CombatEngine } from "@/game/combat";
import { CHARACTER_ROSTER } from "@/data/characters";
import type { Character, MoveType } from "@/types";

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
    };
}

/**
 * Generate and simulate a new bot match
 */
export function generateBotMatch(): BotMatch {
    const matchId = generateBotMatchId();
    return simulateBotMatch(matchId);
}

// In-memory store for active bot matches
let activeBotMatches: BotMatch[] = [];

/**
 * Get current turn index based on elapsed time (24/7 operation)
 */
export function getCurrentTurnIndex(match: BotMatch): number {
    const elapsed = Date.now() - match.createdAt;
    const turnIndex = Math.floor(elapsed / match.turnDurationMs);
    return Math.min(turnIndex, match.totalTurns - 1);
}

/**
 * Get all active bot matches
 */
export function getActiveBotMatches(): BotMatch[] {
    return activeBotMatches;
}

/**
 * Get a specific bot match by ID
 */
export function getBotMatch(matchId: string): BotMatch | undefined {
    return activeBotMatches.find(m => m.id === matchId);
}

/**
 * Add a new bot match
 */
export function addBotMatch(match: BotMatch): void {
    activeBotMatches.push(match);

    // Keep only last 10 matches
    if (activeBotMatches.length > 10) {
        activeBotMatches = activeBotMatches.slice(-10);
    }
}

/**
 * Remove a bot match
 */
export function removeBotMatch(matchId: string): void {
    activeBotMatches = activeBotMatches.filter(m => m.id !== matchId);
}

/**
 * Ensure there's always at least one active bot match.
 * Creates a new match if the current one has finished playing.
 */
export function ensureActiveBotMatch(): BotMatch {
    // Clean up finished matches
    const now = Date.now();
    activeBotMatches = activeBotMatches.filter(m => {
        const maxDuration = m.totalTurns * m.turnDurationMs;
        const elapsed = now - m.createdAt;
        // Keep matches that haven't finished playing yet, plus a 10s buffer
        return elapsed < maxDuration + 10000;
    });

    // Check for a match that's still playing
    const playingMatch = activeBotMatches.find(m => {
        const elapsed = now - m.createdAt;
        const maxDuration = m.totalTurns * m.turnDurationMs;
        return elapsed < maxDuration;
    });

    if (playingMatch) {
        return playingMatch;
    }

    // Generate new match
    const newMatch = generateBotMatch();
    addBotMatch(newMatch);
    return newMatch;
}

/**
 * Cleanup old matches
 */
export function cleanupOldMatches(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    activeBotMatches = activeBotMatches.filter(m => m.createdAt > oneHourAgo);
}

/**
 * Get sync info for spectators joining mid-match
 */
export function getMatchSyncInfo(matchId: string): {
    match: BotMatch;
    currentTurnIndex: number;
    elapsedMs: number;
    isFinished: boolean;
} | null {
    const match = getBotMatch(matchId);
    if (!match) return null;

    const now = Date.now();
    const elapsedMs = now - match.createdAt;
    const currentTurnIndex = getCurrentTurnIndex(match);
    const maxDuration = match.totalTurns * match.turnDurationMs;
    const isFinished = elapsedMs >= maxDuration;

    return {
        match,
        currentTurnIndex,
        elapsedMs,
        isFinished,
    };
}
