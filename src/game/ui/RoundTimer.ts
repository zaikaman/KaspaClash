/**
 * RoundTimer - Visual countdown timer for move selection
 * Displays remaining time with visual urgency cues
 */

import Phaser from "phaser";
import { UI_POSITIONS } from "../config";

/**
 * Round timer configuration.
 */
export interface RoundTimerConfig {
  x?: number;
  y?: number;
  duration?: number; // Duration in seconds
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}

/**
 * Default timer duration.
 */
const DEFAULT_DURATION = 15;

/**
 * Color thresholds for urgency indication.
 */
const TIMER_COLORS = {
  SAFE: 0x49eacb, // Kaspa teal - plenty of time
  WARNING: 0xfbbf24, // Yellow - getting low
  DANGER: 0xef4444, // Red - urgent
};

const TIMER_THRESHOLDS = {
  WARNING: 10, // Show warning color at 10 seconds
  DANGER: 5, // Show danger color at 5 seconds
};

/**
 * RoundTimer - Countdown timer display.
 */
export class RoundTimer extends Phaser.GameObjects.Container {
  // Timer state
  private duration: number;
  private remaining: number;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // UI elements
  private timerText!: Phaser.GameObjects.Text;
  private timerBackground!: Phaser.GameObjects.Graphics;
  private timerCircle!: Phaser.GameObjects.Graphics;

  // Timer event
  private timerEvent?: Phaser.Time.TimerEvent;

  // Callbacks
  private onComplete?: () => void;
  private onTick?: (remaining: number) => void;

  constructor(scene: Phaser.Scene, config: RoundTimerConfig = {}) {
    const x = config.x ?? UI_POSITIONS.TIMER.X;
    const y = config.y ?? UI_POSITIONS.TIMER.Y;

    super(scene, x, y);

    this.duration = config.duration ?? DEFAULT_DURATION;
    this.remaining = this.duration;
    this.onComplete = config.onComplete;
    this.onTick = config.onTick;

    this.createTimerElements();

    scene.add.existing(this);
  }

  /**
   * Create timer visual elements.
   */
  private createTimerElements(): void {
    // Background circle
    this.timerBackground = this.scene.add.graphics();
    this.timerBackground.fillStyle(0x1a1a1a, 0.9);
    this.timerBackground.fillCircle(0, 0, 45);
    this.timerBackground.lineStyle(3, 0x333333);
    this.timerBackground.strokeCircle(0, 0, 45);
    this.add(this.timerBackground);

    // Progress circle (drawn as arc)
    this.timerCircle = this.scene.add.graphics();
    this.add(this.timerCircle);

    // Timer text
    this.timerText = this.scene.add.text(0, 0, this.formatTime(this.remaining), {
      fontFamily: "Arial, sans-serif",
      fontSize: "32px",
      fontStyle: "bold",
      color: "#49eacb",
      align: "center",
    });
    this.timerText.setOrigin(0.5);
    this.add(this.timerText);

    // Update display
    this.updateDisplay();
  }

  /**
   * Format time as MM:SS or just seconds.
   */
  private formatTime(seconds: number): string {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return seconds.toString();
  }

  /**
   * Get color based on remaining time.
   */
  private getTimerColor(): number {
    if (this.remaining <= TIMER_THRESHOLDS.DANGER) {
      return TIMER_COLORS.DANGER;
    }
    if (this.remaining <= TIMER_THRESHOLDS.WARNING) {
      return TIMER_COLORS.WARNING;
    }
    return TIMER_COLORS.SAFE;
  }

  /**
   * Update visual display.
   */
  private updateDisplay(): void {
    const color = this.getTimerColor();

    // Update text
    this.timerText.setText(this.formatTime(this.remaining));
    this.timerText.setColor("#" + color.toString(16).padStart(6, "0"));

    // Update progress arc
    this.timerCircle.clear();
    const progress = this.remaining / this.duration;
    const startAngle = -Math.PI / 2; // Start from top
    const endAngle = startAngle + progress * Math.PI * 2;

    this.timerCircle.lineStyle(4, color);
    this.timerCircle.beginPath();
    this.timerCircle.arc(0, 0, 40, startAngle, endAngle, false);
    this.timerCircle.strokePath();

    // Add pulsing effect when in danger zone
    if (this.remaining <= TIMER_THRESHOLDS.DANGER && this.remaining > 0) {
      this.addPulseEffect();
    }
  }

  /**
   * Add pulsing animation for urgency.
   */
  private addPulseEffect(): void {
    this.scene.tweens.add({
      targets: this.timerText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      yoyo: true,
      ease: "Power2",
    });
  }

  /**
   * Start the countdown timer.
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;

    this.timerEvent = this.scene.time.addEvent({
      delay: 1000,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Handle timer tick.
   */
  private tick(): void {
    if (this.isPaused) return;

    this.remaining--;
    this.updateDisplay();
    this.onTick?.(this.remaining);

    if (this.remaining <= 0) {
      this.stop();
      this.onComplete?.();
    }
  }

  /**
   * Pause the timer.
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume the timer.
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * Stop the timer.
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;

    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }
  }

  /**
   * Reset timer to initial state.
   */
  reset(newDuration?: number): void {
    this.stop();
    this.duration = newDuration ?? this.duration;
    this.remaining = this.duration;
    this.updateDisplay();
  }

  /**
   * Get remaining time.
   */
  getRemaining(): number {
    return this.remaining;
  }

  /**
   * Check if timer is running.
   */
  getIsRunning(): boolean {
    return this.isRunning && !this.isPaused;
  }

  /**
   * Set remaining time directly.
   */
  setRemaining(seconds: number): void {
    this.remaining = Math.max(0, Math.min(seconds, this.duration));
    this.updateDisplay();
  }

  /**
   * Add time to the timer.
   */
  addTime(seconds: number): void {
    this.remaining = Math.min(this.remaining + seconds, this.duration);
    this.updateDisplay();
  }

  /**
   * Show "TIME!" text when timer expires.
   */
  showTimeUp(): void {
    this.timerText.setText("TIME!");
    this.timerText.setColor("#ef4444");
    this.timerText.setFontSize(24);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      repeat: 2,
    });
  }

  /**
   * Cleanup on destroy.
   */
  destroy(fromScene?: boolean): void {
    this.stop();
    super.destroy(fromScene);
  }
}
