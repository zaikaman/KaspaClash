/**
 * Game State Machine
 * Manages game state transitions for match flow
 */

// =============================================================================
// STATE DEFINITIONS
// =============================================================================

/**
 * All possible game states.
 */
export const GameState = {
  // Pre-match states
  IDLE: "idle",
  WAITING: "waiting",
  CHARACTER_SELECT: "character_select",
  COUNTDOWN: "countdown",

  // In-match states
  AWAITING_MOVES: "awaiting_moves",
  MOVE_SUBMITTED: "move_submitted",
  RESOLVING_ROUND: "resolving_round",
  ROUND_RESOLVED: "round_resolved",

  // Post-match states
  MATCH_ENDED: "match_ended",
  RESULTS: "results",

  // Error states
  DISCONNECTED: "disconnected",
  ERROR: "error",
} as const;

export type GameStateType = (typeof GameState)[keyof typeof GameState];

// =============================================================================
// STATE TRANSITION DEFINITIONS
// =============================================================================

/**
 * Valid transitions from each state.
 */
const STATE_TRANSITIONS: Record<GameStateType, GameStateType[]> = {
  [GameState.IDLE]: [GameState.WAITING, GameState.CHARACTER_SELECT, GameState.ERROR],

  [GameState.WAITING]: [
    GameState.CHARACTER_SELECT,
    GameState.COUNTDOWN, // If characters are already selected
    GameState.DISCONNECTED,
    GameState.ERROR,
  ],

  [GameState.CHARACTER_SELECT]: [
    GameState.COUNTDOWN,
    GameState.DISCONNECTED,
    GameState.ERROR,
  ],

  [GameState.COUNTDOWN]: [
    GameState.AWAITING_MOVES,
    GameState.DISCONNECTED,
    GameState.ERROR,
  ],

  [GameState.AWAITING_MOVES]: [
    GameState.MOVE_SUBMITTED,
    GameState.RESOLVING_ROUND, // If opponent submits first and we already submitted
    GameState.MATCH_ENDED, // Timeout/forfeit
    GameState.DISCONNECTED,
    GameState.ERROR,
  ],

  [GameState.MOVE_SUBMITTED]: [
    GameState.RESOLVING_ROUND,
    GameState.MATCH_ENDED, // Timeout/forfeit
    GameState.DISCONNECTED,
    GameState.ERROR,
  ],

  [GameState.RESOLVING_ROUND]: [
    GameState.ROUND_RESOLVED,
    GameState.MATCH_ENDED,
    GameState.ERROR,
  ],

  [GameState.ROUND_RESOLVED]: [
    GameState.COUNTDOWN, // Next round countdown
    GameState.AWAITING_MOVES, // Skip countdown, go straight to moves
    GameState.MATCH_ENDED,
    GameState.ERROR,
  ],

  [GameState.MATCH_ENDED]: [
    GameState.RESULTS,
    GameState.IDLE, // Return to main menu
  ],

  [GameState.RESULTS]: [
    GameState.IDLE, // Play again / return to menu
    GameState.WAITING, // Rematch queue
  ],

  [GameState.DISCONNECTED]: [
    GameState.WAITING, // Reconnected
    GameState.IDLE, // Give up
    GameState.MATCH_ENDED, // Match ended while disconnected
  ],

  [GameState.ERROR]: [
    GameState.IDLE, // Reset
    GameState.WAITING, // Retry
  ],
};

// =============================================================================
// TRANSITION LOGIC
// =============================================================================

/**
 * Get valid transitions from a state.
 */
export function getValidTransitions(currentState: GameStateType): GameStateType[] {
  return STATE_TRANSITIONS[currentState] || [];
}

/**
 * Check if a transition is valid.
 */
export function isValidTransition(
  currentState: GameStateType,
  nextState: GameStateType
): boolean {
  const validTransitions = getValidTransitions(currentState);
  return validTransitions.includes(nextState);
}

/**
 * Transition to a new state if valid.
 * Returns the new state or null if transition is invalid.
 */
export function transition(
  currentState: GameStateType,
  nextState: GameStateType
): GameStateType | null {
  if (isValidTransition(currentState, nextState)) {
    return nextState;
  }

  console.warn(
    `Invalid state transition attempted: ${currentState} -> ${nextState}`
  );
  return null;
}

// =============================================================================
// STATE QUERIES
// =============================================================================

/**
 * Check if state is a pre-match state.
 */
export function isPreMatchState(state: GameStateType): boolean {
  return ([
    GameState.IDLE,
    GameState.WAITING,
    GameState.CHARACTER_SELECT,
    GameState.COUNTDOWN,
  ] as GameStateType[]).includes(state);
}

/**
 * Check if state is an active match state.
 */
export function isActiveMatchState(state: GameStateType): boolean {
  return ([
    GameState.AWAITING_MOVES,
    GameState.MOVE_SUBMITTED,
    GameState.RESOLVING_ROUND,
    GameState.ROUND_RESOLVED,
  ] as GameStateType[]).includes(state);
}

/**
 * Check if state is a post-match state.
 */
export function isPostMatchState(state: GameStateType): boolean {
  return ([GameState.MATCH_ENDED, GameState.RESULTS] as GameStateType[]).includes(state);
}

/**
 * Check if state is an error/disconnected state.
 */
export function isErrorState(state: GameStateType): boolean {
  return ([GameState.DISCONNECTED, GameState.ERROR] as GameStateType[]).includes(state);
}

/**
 * Check if player can submit a move in this state.
 */
export function canSubmitMove(state: GameStateType): boolean {
  return state === GameState.AWAITING_MOVES;
}

/**
 * Check if the game is currently playable.
 */
export function isPlayableState(state: GameStateType): boolean {
  return isActiveMatchState(state) && !isErrorState(state);
}

// =============================================================================
// STATE MACHINE CLASS
// =============================================================================

/**
 * Event handler type for state changes.
 */
export type StateChangeHandler = (
  previousState: GameStateType,
  newState: GameStateType
) => void;

/**
 * Game State Machine class for more complex state management.
 */
export class GameStateMachine {
  private currentState: GameStateType;
  private handlers: Map<GameStateType, StateChangeHandler[]> = new Map();
  private globalHandlers: StateChangeHandler[] = [];

  constructor(initialState: GameStateType = GameState.IDLE) {
    this.currentState = initialState;
  }

  /**
   * Get current state.
   */
  getState(): GameStateType {
    return this.currentState;
  }

  /**
   * Attempt to transition to a new state.
   */
  transitionTo(newState: GameStateType): boolean {
    if (!isValidTransition(this.currentState, newState)) {
      console.warn(
        `Invalid transition: ${this.currentState} -> ${newState}`
      );
      return false;
    }

    const previousState = this.currentState;
    this.currentState = newState;

    // Notify handlers
    this.notifyHandlers(previousState, newState);

    return true;
  }

  /**
   * Force a state change (bypasses validation).
   * Use with caution - only for error recovery.
   */
  forceState(newState: GameStateType): void {
    const previousState = this.currentState;
    this.currentState = newState;
    this.notifyHandlers(previousState, newState);
  }

  /**
   * Register a handler for a specific state.
   */
  onEnter(state: GameStateType, handler: StateChangeHandler): () => void {
    if (!this.handlers.has(state)) {
      this.handlers.set(state, []);
    }
    this.handlers.get(state)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(state);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index >= 0) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Register a global handler for all state changes.
   */
  onAnyChange(handler: StateChangeHandler): () => void {
    this.globalHandlers.push(handler);

    return () => {
      const index = this.globalHandlers.indexOf(handler);
      if (index >= 0) {
        this.globalHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all relevant handlers of a state change.
   */
  private notifyHandlers(
    previousState: GameStateType,
    newState: GameStateType
  ): void {
    // Notify global handlers
    for (const handler of this.globalHandlers) {
      try {
        handler(previousState, newState);
      } catch (error) {
        console.error("Error in global state handler:", error);
      }
    }

    // Notify state-specific handlers
    const stateHandlers = this.handlers.get(newState);
    if (stateHandlers) {
      for (const handler of stateHandlers) {
        try {
          handler(previousState, newState);
        } catch (error) {
          console.error(`Error in ${newState} handler:`, error);
        }
      }
    }
  }

  /**
   * Check if a transition is possible.
   */
  canTransitionTo(state: GameStateType): boolean {
    return isValidTransition(this.currentState, state);
  }

  /**
   * Get all valid transitions from current state.
   */
  getAvailableTransitions(): GameStateType[] {
    return getValidTransitions(this.currentState);
  }

  /**
   * Reset to initial state.
   */
  reset(): void {
    this.forceState(GameState.IDLE);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Shared game state machine instance.
 * For simple use cases where a single state machine is sufficient.
 */
export const gameStateMachine = new GameStateMachine();
