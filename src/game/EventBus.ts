/**
 * EventBus - Bridge between Phaser and React
 * Uses custom EventEmitter for SSR compatibility (no Phaser dependency)
 */

/**
 * Game event types for type safety.
 * Note: Scene types use 'unknown' as Phaser types aren't available during SSR
 */
export interface GameEvents {
  // Scene lifecycle events (scene is passed as unknown to avoid Phaser import)
  "scene:ready": unknown;
  "scene:change": unknown;

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

  // New Game Engine events
  "game:submitMove": { matchId: string; moveType: string; playerRole: string };
  "game:moveError": { error: string };
  "game:roundStarting": any;
  "game:moveSubmitted": any;
  "game:moveConfirmed": any;
  "game:roundResolved": any;
  "game:matchEnded": any;
  "game:characterSelected": any;
  "game:matchStarting": any;
}

/**
 * Event listener type for internal tracking.
 */
interface EventListener<T = unknown> {
  callback: (data: T) => void;
  context?: unknown;
  once: boolean;
}

/**
 * SSR-safe EventEmitter base class.
 * Provides the same API as Phaser.Events.EventEmitter without the Phaser dependency.
 */
class SSRSafeEventEmitter {
  private listeners: Map<string, EventListener[]> = new Map();

  /**
   * Add an event listener.
   */
  on(event: string, callback: (data: unknown) => void, context?: unknown): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push({ callback, context, once: false });
    return this;
  }

  /**
   * Add a one-time event listener.
   */
  once(event: string, callback: (data: unknown) => void, context?: unknown): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push({ callback, context, once: true });
    return this;
  }

  /**
   * Remove an event listener.
   */
  off(event: string, callback?: (data: unknown) => void, context?: unknown): this {
    if (!callback) {
      this.listeners.delete(event);
      return this;
    }

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const filtered = eventListeners.filter(
        (listener) =>
          listener.callback !== callback ||
          (context !== undefined && listener.context !== context)
      );
      if (filtered.length === 0) {
        this.listeners.delete(event);
      } else {
        this.listeners.set(event, filtered);
      }
    }
    return this;
  }

  /**
   * Emit an event with data.
   */
  emit(event: string, data?: unknown): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.length === 0) {
      return false;
    }

    const listenersCopy = [...eventListeners];

    listenersCopy.forEach((listener) => {
      if (listener.context) {
        listener.callback.call(listener.context, data);
      } else {
        listener.callback(data);
      }

      if (listener.once) {
        this.off(event, listener.callback, listener.context);
      }
    });

    return true;
  }

  /**
   * Remove all listeners.
   */
  removeAllListeners(): this {
    this.listeners.clear();
    return this;
  }
}

/**
 * Event bus for Phaser-React communication.
 * Extends SSRSafeEventEmitter for SSR compatibility.
 */
class GameEventBus extends SSRSafeEventEmitter {
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
    return this.on(event, callback as (data: unknown) => void, context);
  }

  /**
   * Subscribe to a typed event once.
   */
  onceEvent<K extends keyof GameEvents>(
    event: K,
    callback: (data: GameEvents[K]) => void,
    context?: unknown
  ): this {
    return this.once(event, callback as (data: unknown) => void, context);
  }

  /**
   * Unsubscribe from a typed event.
   */
  offEvent<K extends keyof GameEvents>(
    event: K,
    callback?: (data: GameEvents[K]) => void,
    context?: unknown
  ): this {
    return this.off(event, callback as (data: unknown) => void, context);
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
