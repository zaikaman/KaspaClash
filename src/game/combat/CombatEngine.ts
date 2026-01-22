/**
 * Combat Engine for KaspaClash
 * Core game logic for turn-based fighting
 */

import type { MoveType } from "@/types";
import {
    type CombatState,
    type PlayerCombatState,
    type TurnResult,
    type PlayerTurnResult,
    type MoveOutcome,
    type TurnEffect,
    RESOLUTION_MATRIX,
    BASE_MOVE_STATS,
    COMBAT_CONSTANTS,
} from "./types";
import { getCharacterCombatStats } from "./CharacterStats";

// =============================================================================
// COMBAT ENGINE
// =============================================================================

/**
 * Main combat engine that handles all game logic.
 */
export class CombatEngine {
    private state: CombatState;

    constructor(
        player1CharacterId: string,
        player2CharacterId: string,
        matchFormat: "best_of_1" | "best_of_3" | "best_of_5" = "best_of_5"
    ) {
        const p1Stats = getCharacterCombatStats(player1CharacterId);
        const p2Stats = getCharacterCombatStats(player2CharacterId);

        this.state = {
            player1: {
                characterId: player1CharacterId,
                hp: p1Stats.maxHp,
                maxHp: p1Stats.maxHp,
                energy: p1Stats.maxEnergy,
                maxEnergy: p1Stats.maxEnergy,
                guardMeter: 0,
                isStunned: false,
                isStaggered: false,
                roundsWon: 0,
            },
            player2: {
                characterId: player2CharacterId,
                hp: p2Stats.maxHp,
                maxHp: p2Stats.maxHp,
                energy: p2Stats.maxEnergy,
                maxEnergy: p2Stats.maxEnergy,
                guardMeter: 0,
                isStunned: false,
                isStaggered: false,
                roundsWon: 0,
            },
            currentRound: 1,
            currentTurn: 1,
            matchFormat,
            roundsToWin: matchFormat === "best_of_5" ? 3 : matchFormat === "best_of_3" ? 2 : 1,
            isRoundOver: false,
            isMatchOver: false,
            roundWinner: null,
            matchWinner: null,
        };
    }

    // ===========================================================================
    // STATE ACCESSORS
    // ===========================================================================

    /**
     * Get current combat state (immutable copy).
     */
    /**
     * Get current combat state (immutable copy).
     * IMPORTANT: Must deep copy nested player objects to prevent reference mutations.
     */
    getState(): Readonly<CombatState> {
        return {
            ...this.state,
            player1: { ...this.state.player1 },
            player2: { ...this.state.player2 }
        };
    }

    /**
     * Get specific player state.
     */
    getPlayerState(player: "player1" | "player2"): Readonly<PlayerCombatState> {
        return { ...this.state[player] };
    }

    /**
     * Check if a move is affordable for a player.
     */
    canAffordMove(player: "player1" | "player2", move: MoveType): boolean {
        const playerState = this.state[player];
        const cost = this.getMoveCost(playerState.characterId, move);
        return playerState.energy >= cost;
    }

    /**
     * Get the energy cost of a move for a character.
     */
    getMoveCost(characterId: string, move: MoveType): number {
        const baseCost = BASE_MOVE_STATS[move].energyCost;
        if (move !== "special") return baseCost;

        const stats = getCharacterCombatStats(characterId);
        return Math.floor(baseCost * stats.specialCostModifier);
    }

    /**
     * Get available moves for a player based on energy.
     */
    getAvailableMoves(player: "player1" | "player2"): MoveType[] {
        const moves: MoveType[] = ["punch", "kick", "block", "special"];
        return moves.filter((move) => this.canAffordMove(player, move));
    }

    // ===========================================================================
    // TURN RESOLUTION
    // ===========================================================================

    /**
     * Resolve a turn with both players' moves.
     * This is the core game logic.
     */
    resolveTurn(player1Move: MoveType, player2Move: MoveType): TurnResult {
        const p1State = this.state.player1;
        const p2State = this.state.player2;

        // Track if players were stunned at the START of this turn
        // If they were, they'll miss this turn and the stun should be cleared after
        const p1WasStunned = p1State.isStunned;
        const p2WasStunned = p2State.isStunned;

        // Handle stunned players (auto-miss)
        const effectiveP1Move = p1WasStunned ? null : player1Move;
        const effectiveP2Move = p2WasStunned ? null : player2Move;

        // Calculate outcomes
        const p1Result = this.resolvePlayerTurn(
            effectiveP1Move,
            effectiveP2Move,
            p1State,
            p2State,
            "player1"
        );
        const p2Result = this.resolvePlayerTurn(
            effectiveP2Move,
            effectiveP1Move,
            p2State,
            p1State,
            "player2"
        );

        // Apply damage
        // Handle normal damage + reflection (self-damage)
        const p1SelfDamage = (p1Result as any).selfDamage || 0;
        const p2SelfDamage = (p2Result as any).selfDamage || 0;

        this.state.player1.hp = Math.max(0, p1State.hp - p1Result.damageTaken - p1SelfDamage);
        this.state.player2.hp = Math.max(0, p2State.hp - p2Result.damageTaken - p2SelfDamage);

        // Apply energy costs
        this.state.player1.energy = Math.max(0, p1State.energy - p1Result.energySpent);
        this.state.player2.energy = Math.max(0, p2State.energy - p2Result.energySpent);

        // Apply guard buildup
        this.state.player1.guardMeter = Math.min(
            COMBAT_CONSTANTS.GUARD_BREAK_THRESHOLD,
            p1State.guardMeter + p1Result.guardBuildup
        );
        this.state.player2.guardMeter = Math.min(
            COMBAT_CONSTANTS.GUARD_BREAK_THRESHOLD,
            p2State.guardMeter + p2Result.guardBuildup
        );

        // Track if guard break happens THIS turn (before we modify isStunned)
        const p1GuardBreak = this.state.player1.guardMeter >= COMBAT_CONSTANTS.GUARD_BREAK_THRESHOLD;
        const p2GuardBreak = this.state.player2.guardMeter >= COMBAT_CONSTANTS.GUARD_BREAK_THRESHOLD;

        // Check for Guard Break (Meter >= 100)
        if (p1GuardBreak) {
            this.state.player1.guardMeter = 0;
            p1Result.effects.push("guard_break"); // Add effect for UI
        }

        if (p2GuardBreak) {
            this.state.player2.guardMeter = 0;
            p2Result.effects.push("guard_break"); // Add effect for UI
        }

        // Apply effects
        this.applyEffects(p1Result.effects, "player1");
        this.applyEffects(p2Result.effects, "player2");

        // Regenerate energy
        this.regenerateEnergy();

        // Handle stun state:
        // 1. If player WAS stunned at turn start, they missed this turn - CLEAR the stun
        // 2. If player got stunned THIS turn (by move outcome or guard break), SET the stun for next turn
        const p1StunnedByMove = p1Result.effects.includes("stun");
        const p2StunnedByMove = p2Result.effects.includes("stun");

        // Clear old stun (player paid the penalty), then apply new stun if applicable
        this.state.player1.isStunned = p1StunnedByMove || p1GuardBreak;
        this.state.player1.isStaggered = p1Result.effects.includes("stagger");

        this.state.player2.isStunned = p2StunnedByMove || p2GuardBreak;
        this.state.player2.isStaggered = p2Result.effects.includes("stagger");

        // Check for round end
        this.checkRoundEnd();

        // Increment turn
        this.state.currentTurn++;

        // Generate narrative
        const narrative = this.generateNarrative(
            effectiveP1Move,
            effectiveP2Move,
            p1Result,
            p2Result
        );

        return {
            player1: p1Result,
            player2: p2Result,
            narrative,
        };
    }

    /**
     * Resolve a single player's turn.
     */
    private resolvePlayerTurn(
        myMove: MoveType | null,
        opponentMove: MoveType | null,
        myState: PlayerCombatState,
        opponentState: PlayerCombatState,
        player: "player1" | "player2"
    ): PlayerTurnResult {
        // Handle stunned player - they can't act but still take damage
        if (myMove === null) {
            // Calculate damage taken from opponent's attack (we're defenseless)
            let damageTaken = 0;
            if (opponentMove) {
                const opponentStats = getCharacterCombatStats(opponentState.characterId);
                const baseDamage = BASE_MOVE_STATS[opponentMove].damage;
                const modifier = opponentStats.damageModifiers[opponentMove];
                damageTaken = Math.floor(baseDamage * modifier);
            }

            return {
                move: "punch", // placeholder
                outcome: "stunned",
                damageDealt: 0,
                damageTaken,  // Now properly calculates damage from opponent
                energySpent: 0,
                guardBuildup: 0,
                effects: [],
            };
        }

        const myStats = getCharacterCombatStats(myState.characterId);
        const opponentStats = getCharacterCombatStats(opponentState.characterId);

        // Get outcome from resolution matrix
        const outcome = opponentMove
            ? RESOLUTION_MATRIX[myMove][opponentMove]
            : "hit"; // If opponent is stunned, we hit

        // Calculate damage dealt
        let damageDealt = 0;
        if (outcome === "hit") {
            const baseDamage = BASE_MOVE_STATS[myMove].damage;
            const modifier = myStats.damageModifiers[myMove];
            damageDealt = Math.floor(baseDamage * modifier);

            // Apply stagger penalty
            if (myState.isStaggered) {
                damageDealt = Math.floor(damageDealt * COMBAT_CONSTANTS.STAGGER_DAMAGE_REDUCTION);
            }
        } else if (outcome === "reflected" && myMove === "kick") {
            // Kick was reflected, we take reflected damage
            const baseDamage = BASE_MOVE_STATS.kick.damage;
            damageDealt = -Math.floor(baseDamage * COMBAT_CONSTANTS.KICK_REFLECT_PERCENT);
        }

        // Calculate damage taken
        let damageTaken = 0;
        if (opponentMove && outcome !== "guarding") {
            const opponentOutcome = RESOLUTION_MATRIX[opponentMove][myMove];
            if (opponentOutcome === "hit") {
                const baseDamage = BASE_MOVE_STATS[opponentMove].damage;
                const modifier = opponentStats.damageModifiers[opponentMove];
                damageTaken = Math.floor(baseDamage * modifier);

                // Apply block damage reduction
                if (myMove === "block" && outcome === "shattered") {
                    // Block was shattered, take extra damage
                    damageTaken = Math.floor(damageTaken * COMBAT_CONSTANTS.SHATTER_DAMAGE_MULTIPLIER);
                }
            }
        } else if (outcome === "guarding" && opponentMove) {
            // We're blocking, take reduced damage
            const baseDamage = BASE_MOVE_STATS[opponentMove].damage;
            const modifier = opponentStats.damageModifiers[opponentMove];
            const fullDamage = baseDamage * modifier;
            damageTaken = Math.floor(fullDamage * myStats.blockEffectiveness);
        }

        // Calculate energy spent
        const energySpent = this.getMoveCost(myState.characterId, myMove);

        // Calculate guard buildup
        let guardBuildup = 0;
        if (myMove === "block") {
            if (outcome === "guarding") {
                guardBuildup = COMBAT_CONSTANTS.GUARD_BUILDUP_ON_BLOCK;
                if (opponentMove && opponentMove !== "block") {
                    guardBuildup += COMBAT_CONSTANTS.GUARD_BUILDUP_ON_HIT;
                }
            } else if (outcome === "shattered") {
                // Guard was broken
                guardBuildup = -myState.guardMeter; // Reset to 0
            }
        }

        // Determine effects
        const effects: TurnEffect[] = [];
        if (outcome === "stunned" || outcome === "missed") {
            effects.push("stun");
        }
        if (outcome === "staggered") {
            effects.push("stagger");
        }
        if (outcome === "shattered") {
            effects.push("guard_break");
        }
        if (outcome === "guarding") {
            effects.push("guard_up");
        }

        return {
            move: myMove,
            outcome,
            damageDealt: Math.max(0, damageDealt), // damageDealt should always be positive for narrative
            damageTaken: Math.max(0, damageTaken),
            energySpent,
            guardBuildup,
            effects,
            // Internal field to track self-damage (reflection)
            // @ts-ignore - Adding internal property safely
            selfDamage: damageDealt < 0 ? Math.abs(damageDealt) : 0
        } as PlayerTurnResult & { selfDamage: number };
    }

    /**
     * Apply effects to a player.
     */
    private applyEffects(effects: TurnEffect[], player: "player1" | "player2"): void {
        const state = this.state[player];

        for (const effect of effects) {
            switch (effect) {
                case "guard_break":
                    state.guardMeter = 0;
                    break;
                // stun and stagger are handled in the main resolution
            }
        }
    }

    /**
     * Regenerate energy for both players.
     */
    private regenerateEnergy(): void {
        const p1Stats = getCharacterCombatStats(this.state.player1.characterId);
        const p2Stats = getCharacterCombatStats(this.state.player2.characterId);

        this.state.player1.energy = Math.min(
            this.state.player1.maxEnergy,
            this.state.player1.energy + p1Stats.energyRegen
        );
        this.state.player2.energy = Math.min(
            this.state.player2.maxEnergy,
            this.state.player2.energy + p2Stats.energyRegen
        );
    }

    // ===========================================================================
    // ROUND/MATCH MANAGEMENT
    // ===========================================================================

    /**
     * Check if round has ended.
     */
    private checkRoundEnd(): void {
        if (this.state.player1.hp <= 0 || this.state.player2.hp <= 0) {
            this.state.isRoundOver = true;

            if (this.state.player1.hp <= 0 && this.state.player2.hp <= 0) {
                // Double KO - DRAW! No one wins this round
                // roundWinner stays null to indicate a draw
                this.state.roundWinner = null;
                // Don't award any rounds - the match will continue
            } else if (this.state.player1.hp <= 0) {
                this.state.roundWinner = "player2";
                this.state.player2.roundsWon++;
            } else {
                this.state.roundWinner = "player1";
                this.state.player1.roundsWon++;
            }

            // Check match end
            this.checkMatchEnd();
        }
    }

    /**
     * Check if match has ended.
     */
    private checkMatchEnd(): void {
        if (this.state.player1.roundsWon >= this.state.roundsToWin) {
            this.state.isMatchOver = true;
            this.state.matchWinner = "player1";
        } else if (this.state.player2.roundsWon >= this.state.roundsToWin) {
            this.state.isMatchOver = true;
            this.state.matchWinner = "player2";
        }
    }

    /**
     * Start a new round.
     */
    startNewRound(): void {
        if (this.state.isMatchOver) return;

        const p1Stats = getCharacterCombatStats(this.state.player1.characterId);
        const p2Stats = getCharacterCombatStats(this.state.player2.characterId);

        // Reset HP and energy
        this.state.player1.hp = p1Stats.maxHp;
        this.state.player1.energy = p1Stats.maxEnergy;
        this.state.player1.guardMeter = 0;
        this.state.player1.isStunned = false;
        this.state.player1.isStaggered = false;

        this.state.player2.hp = p2Stats.maxHp;
        this.state.player2.energy = p2Stats.maxEnergy;
        this.state.player2.guardMeter = 0;
        this.state.player2.isStunned = false;
        this.state.player2.isStaggered = false;

        // Reset round state
        this.state.currentRound++;
        this.state.currentTurn = 1;
        this.state.isRoundOver = false;
        this.state.roundWinner = null;
    }

    // ===========================================================================
    // NARRATIVE GENERATION
    // ===========================================================================

    /**
     * Generate a narrative description of the turn.
     */
    private generateNarrative(
        p1Move: MoveType | null,
        p2Move: MoveType | null,
        p1Result: PlayerTurnResult,
        p2Result: PlayerTurnResult
    ): string {
        if (!p1Move && !p2Move) {
            return "Both fighters are stunned!";
        }

        if (!p1Move) {
            return `Player 1 is stunned! Player 2 ${p2Move}s for ${p2Result.damageDealt} damage!`;
        }

        if (!p2Move) {
            return `Player 2 is stunned! Player 1 ${p1Move}s for ${p1Result.damageDealt} damage!`;
        }

        const parts: string[] = [];

        // Describe the interaction
        if (p1Move === p2Move) {
            parts.push(`Both fighters ${p1Move}!`);
        } else {
            parts.push(`${p1Move.toUpperCase()} vs ${p2Move.toUpperCase()}!`);
        }

        // Describe outcomes
        if (p1Result.damageDealt > 0) {
            parts.push(`P1 deals ${p1Result.damageDealt} damage!`);
        }
        if (p2Result.damageDealt > 0) {
            parts.push(`P2 deals ${p2Result.damageDealt} damage!`);
        }

        if (p1Result.outcome === "blocked" || p1Result.outcome === "guarding") {
            parts.push("P2 blocks!");
        }
        if (p2Result.outcome === "blocked" || p2Result.outcome === "guarding") {
            parts.push("P1 blocks!");
        }

        if (p1Result.effects.includes("stun")) {
            parts.push("P1 is stunned!");
        }
        if (p2Result.effects.includes("stun")) {
            parts.push("P2 is stunned!");
        }

        if (p1Result.effects.includes("guard_break")) {
            parts.push("P1's guard is shattered!");
        }
        if (p2Result.effects.includes("guard_break")) {
            parts.push("P2's guard is shattered!");
        }

        return parts.join(" ");
    }
}

export default CombatEngine;
