/**
 * AI Opponent - Decision engine for practice mode
 * Provides AI move selection with configurable difficulty
 */

import type { MoveType } from "@/types";

/**
 * AI difficulty levels.
 */
export type AIDifficulty = "easy" | "medium" | "hard";

/**
 * Move weights for decision making.
 * Higher values = more likely to be chosen.
 */
export interface MoveWeights {
  punch: number;
  kick: number;
  block: number;
  special: number;
  stunned: number;
}

/**
 * AI game state context for decision making.
 */
export interface AIContext {
  aiHealth: number;
  playerHealth: number;
  roundNumber: number;
  playerRoundsWon: number;
  aiRoundsWon: number;
  lastPlayerMove?: MoveType;
  lastAiMove?: MoveType;
  consecutivePlayerBlocks: number;
  consecutivePlayerAttacks: number;
  playerIsStunned: boolean;
  aiEnergy: number;
}

/**
 * AI decision result.
 */
export interface AIDecision {
  move: MoveType;
  confidence: number; // 0-1, how confident the AI is in this choice
  reasoning?: string; // For debugging/display
}

/**
 * Default move weights (balanced).
 */
const DEFAULT_WEIGHTS: MoveWeights = {
  punch: 30,
  kick: 30,
  block: 25,
  special: 15,
  stunned: 0,
};

/**
 * Move type array for iteration.
 */
const MOVE_TYPES: MoveType[] = ["punch", "kick", "block", "special"];

/**
 * Energy costs for moves.
 */
const ENERGY_COSTS: Record<MoveType, number> = {
  punch: 0,
  kick: 25,
  block: 0,
  special: 50,
  stunned: 0,
};

/**
 * Counter moves - what beats what.
 */
const COUNTER_MOVES: Record<MoveType, MoveType> = {
  punch: "block",
  kick: "block",
  block: "kick", // Kicks break blocks
  special: "block",
  stunned: "punch", // Punching a stunned opponent is effective
};

/**
 * AIOpponent - Handles AI move decision making.
 */
export class AIOpponent {
  private difficulty: AIDifficulty;
  private context: AIContext;
  private moveHistory: MoveType[] = [];

  constructor(difficulty: AIDifficulty = "medium") {
    this.difficulty = difficulty;
    this.context = this.createInitialContext();
  }

  /**
   * Create initial AI context.
   */
  private createInitialContext(): AIContext {
    return {
      aiHealth: 100,
      playerHealth: 100,
      roundNumber: 1,
      playerRoundsWon: 0,
      aiRoundsWon: 0,
      consecutivePlayerBlocks: 0,
      consecutivePlayerAttacks: 0,
      playerIsStunned: false,
      aiEnergy: 3,
    };
  }

  /**
   * Reset AI state for new match.
   */
  reset(): void {
    this.context = this.createInitialContext();
    this.moveHistory = [];
  }

  /**
   * Update context with game state.
   */
  updateContext(updates: Partial<AIContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Record player's last move for pattern recognition.
   */
  recordPlayerMove(move: MoveType): void {
    this.context.lastPlayerMove = move;

    // Track consecutive patterns
    if (move === "block") {
      this.context.consecutivePlayerBlocks++;
      this.context.consecutivePlayerAttacks = 0;
    } else if (move === "punch" || move === "kick" || move === "special") {
      this.context.consecutivePlayerAttacks++;
      this.context.consecutivePlayerBlocks = 0;
    }
  }

  /**
   * Get the AI's next move decision.
   */
  decide(): AIDecision {
    // CRITICAL: Always punish stunned opponent with maximum damage
    if (this.context.playerIsStunned) {
      if (this.context.aiEnergy >= ENERGY_COSTS.special) {
        return {
          move: "special",
          confidence: 1.0,
          reasoning: "OPPONENT STUNNED: FINISH THEM!",
        };
      } else if (this.context.aiEnergy >= ENERGY_COSTS.kick) {
        return {
          move: "kick",
          confidence: 0.9,
          reasoning: "OPPONENT STUNNED: Heavy hit (no energy for special)",
        };
      } else {
        return {
          move: "punch",
          confidence: 0.85,
          reasoning: "OPPONENT STUNNED: Punish (no energy for heavy moves)",
        };
      }
    }

    switch (this.difficulty) {
      case "easy":
        return this.decideEasy();
      case "medium":
        return this.decideMedium();
      case "hard":
        return this.decideHard();
    }
  }

  /**
   * Easy difficulty - Mostly random with slight bias.
   */
  private decideEasy(): AIDecision {
    // 80% random, 20% slightly weighted
    if (Math.random() < 0.8) {
      return this.randomMove();
    }

    // Slightly favor attacks
    const weights: MoveWeights = {
      punch: 35,
      kick: 35,
      block: 20,
      special: 10,
      stunned: 0,
    };

    return this.weightedMove(weights, 0.3, "Easy: Slightly aggressive");
  }

  /**
   * Medium difficulty - Basic pattern recognition.
   */
  private decideMedium(): AIDecision {
    // 40% random to add unpredictability
    if (Math.random() < 0.4) {
      return this.randomMove();
    }

    // React to player patterns
    if (this.context.consecutivePlayerBlocks >= 2) {
      // Player is defensive, use kick to break blocks (if we can afford it)
      if (this.canAffordMove("kick")) {
        return {
          move: "kick",
          confidence: 0.7,
          reasoning: "Medium: Breaking block pattern",
        };
      }
    }

    if (this.context.consecutivePlayerAttacks >= 2) {
      // Player is aggressive, block more
      return {
        move: "block",
        confidence: 0.7,
        reasoning: "Medium: Defending against aggression",
      };
    }

    // Counter last player move
    if (this.context.lastPlayerMove) {
      const counter = COUNTER_MOVES[this.context.lastPlayerMove];
      if (Math.random() < 0.5 && this.canAffordMove(counter)) {
        return {
          move: counter,
          confidence: 0.6,
          reasoning: `Medium: Countering ${this.context.lastPlayerMove}`,
        };
      }
    }

    // Default weighted selection
    return this.weightedMove(DEFAULT_WEIGHTS, 0.5, "Medium: Balanced play");
  }

  /**
   * Hard difficulty - Advanced pattern recognition and strategy.
   */
  private decideHard(): AIDecision {
    // Only 20% random to maintain strategic play
    if (Math.random() < 0.2) {
      return this.randomMove();
    }

    // Low health - be more defensive
    if (this.context.aiHealth <= 30) {
      const defensiveWeights: MoveWeights = {
        punch: 20,
        kick: 20,
        block: 50,
        special: 10,
        stunned: 0,
      };
      return this.weightedMove(defensiveWeights, 0.7, "Hard: Low health defense");
    }

    // Player low health - be aggressive
    if (this.context.playerHealth <= 30) {
      const aggressiveWeights: MoveWeights = {
        punch: 35,
        kick: 35,
        block: 10,
        special: 20,
        stunned: 0,
      };
      return this.weightedMove(aggressiveWeights, 0.8, "Hard: Finishing player");
    }

    // React to consecutive patterns
    if (this.context.consecutivePlayerBlocks >= 2 && this.canAffordMove("kick")) {
      return {
        move: "kick",
        confidence: 0.85,
        reasoning: "Hard: Punishing block spam",
      };
    }

    if (this.context.consecutivePlayerAttacks >= 3) {
      // Player is very aggressive, block and counter
      return {
        move: "block",
        confidence: 0.85,
        reasoning: "Hard: Blocking attack spam",
      };
    }

    // Predict and counter
    if (this.context.lastPlayerMove) {
      // Players often repeat moves - counter with high probability
      const counter = COUNTER_MOVES[this.context.lastPlayerMove];
      if (Math.random() < 0.6 && this.canAffordMove(counter)) {
        return {
          move: counter,
          confidence: 0.75,
          reasoning: `Hard: Predicting repeat of ${this.context.lastPlayerMove}`,
        };
      }
    }

    // Mix in special moves occasionally when advantageous
    if (this.context.aiHealth > 50 && Math.random() < 0.25 && this.canAffordMove("special")) {
      return {
        move: "special",
        confidence: 0.65,
        reasoning: "Hard: Strategic special attack",
      };
    }

    // Avoid being predictable - vary moves
    const avoidMove = this.context.lastAiMove;
    const weights = { ...DEFAULT_WEIGHTS };
    if (avoidMove) {
      weights[avoidMove] = Math.max(5, weights[avoidMove] - 20);
    }

    return this.weightedMove(weights, 0.7, "Hard: Varied play");
  }

  /**
   * Check if AI can afford a move based on energy.
   */
  private canAffordMove(move: MoveType): boolean {
    return this.context.aiEnergy >= ENERGY_COSTS[move];
  }

  /**
   * Select a completely random move (that can be afforded).
   */
  private randomMove(): AIDecision {
    const affordableMoves = MOVE_TYPES.filter(move => this.canAffordMove(move));
    if (affordableMoves.length === 0) {
      // Fallback to punch if no moves affordable (shouldn't happen)
      return {
        move: "punch",
        confidence: 0.25,
        reasoning: "Random selection (forced punch)",
      };
    }
    const move = affordableMoves[Math.floor(Math.random() * affordableMoves.length)];
    return {
      move,
      confidence: 0.25,
      reasoning: "Random selection",
    };
  }

  /**
   * Select move based on weights (only considering affordable moves).
   */
  private weightedMove(
    weights: MoveWeights,
    confidence: number,
    reasoning: string
  ): AIDecision {
    // Filter out moves that can't be afforded
    const affordableWeights: Partial<MoveWeights> = {};
    let totalWeight = 0;
    
    for (const move of MOVE_TYPES) {
      if (this.canAffordMove(move)) {
        affordableWeights[move] = weights[move];
        totalWeight += weights[move];
      }
    }

    // If no moves are affordable, fallback to punch (free move)
    if (totalWeight === 0) {
      return {
        move: "punch",
        confidence,
        reasoning: "Fallback to punch (no energy)",
      };
    }

    let random = Math.random() * totalWeight;

    for (const move of MOVE_TYPES) {
      if (affordableWeights[move]) {
        random -= affordableWeights[move];
        if (random <= 0) {
          return { move, confidence, reasoning };
        }
      }
    }

    // Fallback
    return {
      move: "punch",
      confidence,
      reasoning,
    };
  }

  /**
   * Get current difficulty.
   */
  getDifficulty(): AIDifficulty {
    return this.difficulty;
  }

  /**
   * Set difficulty level.
   */
  setDifficulty(difficulty: AIDifficulty): void {
    this.difficulty = difficulty;
  }

  /**
   * Get current context.
   */
  getContext(): AIContext {
    return { ...this.context };
  }
}

/**
 * Create AI opponent with specified difficulty.
 */
export function createAIOpponent(difficulty: AIDifficulty = "medium"): AIOpponent {
  return new AIOpponent(difficulty);
}

/**
 * Quick function to get an AI move without managing state.
 */
export function getAIMove(difficulty: AIDifficulty = "medium"): MoveType {
  const ai = new AIOpponent(difficulty);
  return ai.decide().move;
}
