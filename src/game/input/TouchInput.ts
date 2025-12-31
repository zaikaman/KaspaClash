/**
 * Touch Input Handler
 * Provides touch and swipe gesture support for mobile devices
 */

import Phaser from "phaser";
import type { MoveType } from "@/types";

/**
 * Swipe direction.
 */
export type SwipeDirection = "up" | "down" | "left" | "right";

/**
 * Touch input event callback types.
 */
export interface TouchInputEvents {
  onSwipe?: (direction: SwipeDirection) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onLongPress?: (x: number, y: number) => void;
}

/**
 * Touch input configuration.
 */
export interface TouchInputConfig {
  /** Minimum swipe distance in pixels */
  swipeThreshold?: number;
  /** Maximum tap duration in milliseconds */
  tapDuration?: number;
  /** Double tap window in milliseconds */
  doubleTapWindow?: number;
  /** Long press duration in milliseconds */
  longPressDuration?: number;
}

/**
 * Default touch configuration.
 */
const DEFAULT_CONFIG: Required<TouchInputConfig> = {
  swipeThreshold: 50,
  tapDuration: 200,
  doubleTapWindow: 300,
  longPressDuration: 500,
};

/**
 * Map swipe directions to move types.
 */
export const SWIPE_TO_MOVE: Record<SwipeDirection, MoveType> = {
  up: "special",    // Swipe up for special
  down: "block",    // Swipe down to block
  left: "punch",    // Swipe left for punch
  right: "kick",    // Swipe right for kick
};

/**
 * TouchInput - Handles touch gestures in Phaser scenes.
 */
export class TouchInput {
  private scene: Phaser.Scene;
  private config: Required<TouchInputConfig>;
  private events: TouchInputEvents;

  // Touch tracking
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private lastTapTime: number = 0;
  private longPressTimer?: Phaser.Time.TimerEvent;
  private isLongPress: boolean = false;

  constructor(
    scene: Phaser.Scene,
    events: TouchInputEvents,
    config: TouchInputConfig = {}
  ) {
    this.scene = scene;
    this.events = events;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.setupInputHandlers();
  }

  /**
   * Set up Phaser input handlers.
   */
  private setupInputHandlers(): void {
    const input = this.scene.input;

    // Touch/pointer down
    input.on("pointerdown", this.handlePointerDown, this);

    // Touch/pointer up
    input.on("pointerup", this.handlePointerUp, this);

    // Touch/pointer move (for swipe detection)
    input.on("pointermove", this.handlePointerMove, this);
  }

  /**
   * Handle pointer down event.
   */
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.touchStartX = pointer.x;
    this.touchStartY = pointer.y;
    this.touchStartTime = Date.now();
    this.isLongPress = false;

    // Start long press timer
    this.longPressTimer = this.scene.time.delayedCall(
      this.config.longPressDuration,
      () => {
        this.isLongPress = true;
        this.events.onLongPress?.(this.touchStartX, this.touchStartY);
      }
    );
  }

  /**
   * Handle pointer up event.
   */
  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    // Cancel long press timer
    if (this.longPressTimer) {
      this.longPressTimer.destroy();
      this.longPressTimer = undefined;
    }

    // Don't process if it was a long press
    if (this.isLongPress) {
      return;
    }

    const deltaX = pointer.x - this.touchStartX;
    const deltaY = pointer.y - this.touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - this.touchStartTime;

    // Check for swipe
    if (distance >= this.config.swipeThreshold) {
      const direction = this.getSwipeDirection(deltaX, deltaY);
      this.events.onSwipe?.(direction);
      return;
    }

    // Check for tap
    if (duration < this.config.tapDuration) {
      const now = Date.now();
      
      // Check for double tap
      if (now - this.lastTapTime < this.config.doubleTapWindow) {
        this.events.onDoubleTap?.(pointer.x, pointer.y);
        this.lastTapTime = 0; // Reset to prevent triple-tap
      } else {
        this.events.onTap?.(pointer.x, pointer.y);
        this.lastTapTime = now;
      }
    }
  }

  /**
   * Handle pointer move event (for tracking during swipe).
   */
  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    // Cancel long press if moved significantly
    if (this.longPressTimer && pointer.isDown) {
      const deltaX = Math.abs(pointer.x - this.touchStartX);
      const deltaY = Math.abs(pointer.y - this.touchStartY);
      
      if (deltaX > 10 || deltaY > 10) {
        this.longPressTimer.destroy();
        this.longPressTimer = undefined;
      }
    }
  }

  /**
   * Determine swipe direction from delta values.
   */
  private getSwipeDirection(deltaX: number, deltaY: number): SwipeDirection {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      return deltaX > 0 ? "right" : "left";
    } else {
      return deltaY > 0 ? "down" : "up";
    }
  }

  /**
   * Clean up input handlers.
   */
  destroy(): void {
    this.scene.input.off("pointerdown", this.handlePointerDown, this);
    this.scene.input.off("pointerup", this.handlePointerUp, this);
    this.scene.input.off("pointermove", this.handlePointerMove, this);

    if (this.longPressTimer) {
      this.longPressTimer.destroy();
    }
  }
}

/**
 * Check if the device supports touch.
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Get viewport orientation.
 */
export function getOrientation(): "portrait" | "landscape" {
  if (typeof window === "undefined") return "landscape";
  return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
}
