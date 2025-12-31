/**
 * EventBus - Bridge between Phaser and React
 * Uses native browser events for cross-framework communication
 */

import Phaser from "phaser";

/**
 * Game event types for type safety.
 */
export interface GameEvents {
  // Match events
  "match:start": { matchId: string };
  "match:end": { matchId: string; winnerId: string };
  "match:forfeit": { matchId: string; playerId: string };
  
  // Round events
  "round:start": { roundNumber: number };
  "round:end": { roundNumber: number; winner: "player1" | "player2" | "draw" };
  
  // Move events
  "move:selected": { moveType: "punch" | "kick" | "block" | "special" };
  "move:submitted": { moveType: string; txId?: string };
  "move:confirmed": { moveType: string; txId: string };
  "move:timeout": { playerId: string };
  
  // Health events
  "health:update": {
    player1Health: number;
    player2Health: number;
  };
  
  // Animation events
  "animation:attack": { playerId: string; moveType: string };
  "animation:hurt": { playerId: string; damage: number };
  "animation:block": { playerId: string };
  "animation:victory": { playerId: string };
  "animation:defeat": { playerId: string };
  "animation:complete": { animationType: string };
  
  // UI events
  "ui:showMoveSelect": void;
  "ui:hideMoveSelect": void;
  "ui:showResult": { winner: string; loser: string };
  "ui:countdown": { seconds: number };
  
  // Error events
  "error:game": { message: string; code?: string };
}

/**
 * Event bus for Phaser-React communication.
 * Extends Phaser's EventEmitter for compatibility with Phaser scenes.
 */
class GameEventBus extends Phaser.Events.EventEmitter {
  private static instance: GameEventBus | null = null;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance.
   */
  static getInstance(): GameEventBus {
    if (!GameEventBus.instance) {
      GameEventBus.instance = new GameEventBus();
    }
    return GameEventBus.instance;
  }

  /**
   * Emit a typed event.
   */
  emitEvent<K extends keyof GameEvents>(
    event: K,
    data?: GameEvents[K]
  ): boolean {
    return this.emit(event, data);
  }

  /**
   * Subscribe to a typed event.
   */
  onEvent<K extends keyof GameEvents>(
    event: K,
    callback: (data: GameEvents[K]) => void,
    context?: unknown
  ): this {
    return this.on(event, callback, context);
  }

  /**
   * Subscribe to a typed event once.
   */
  onceEvent<K extends keyof GameEvents>(
    event: K,
    callback: (data: GameEvents[K]) => void,
    context?: unknown
  ): this {
    return this.once(event, callback, context);
  }

  /**
   * Unsubscribe from a typed event.
   */
  offEvent<K extends keyof GameEvents>(
    event: K,
    callback?: (data: GameEvents[K]) => void,
    context?: unknown
  ): this {
    return this.off(event, callback, context);
  }

  /**
   * Remove all listeners.
   */
  removeAllGameListeners(): this {
    return this.removeAllListeners();
  }

  /**
   * Reset the event bus (useful for testing).
   */
  static reset(): void {
    if (GameEventBus.instance) {
      GameEventBus.instance.removeAllListeners();
      GameEventBus.instance = null;
    }
  }
}

/**
 * Export singleton instance.
 */
export const EventBus = GameEventBus.getInstance();

/**
 * Export type for callback functions.
 */
export type EventCallback<K extends keyof GameEvents> = (
  data: GameEvents[K]
) => void;
