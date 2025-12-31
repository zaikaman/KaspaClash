/**
 * SelectionTimer - Countdown timer for character lock-in
 * Displays remaining time to make selection before auto-lock
 */

import Phaser from "phaser";
import { GAME_DIMENSIONS } from "../config";

/**
 * Selection timer configuration.
 */
export interface SelectionTimerConfig {
  x?: number;
  y?: number;
  duration?: number; // Total time in seconds
  warningThreshold?: number; // Seconds remaining to show warning
  criticalThreshold?: number; // Seconds remaining to show critical
  onTimeUp?: () => void;
}

/**
 * Timer visual states.
 */
type TimerState = "normal" | "warning" | "critical" | "stopped";

/**
 * SelectionTimer - Lock-in countdown display.
 */
export class SelectionTimer extends Phaser.GameObjects.Container {
  // Configuration
  private duration: number;
  private warningThreshold: number;
  private criticalThreshold: number;
  private onTimeUp?: () => void;

  // State
  private timeRemaining: number;
  private timerState: TimerState = "normal";
  private isRunning: boolean = false;

  // Timer event
  private timerEvent?: Phaser.Time.TimerEvent;

  // Visual elements
  private background!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private labelText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressFill!: Phaser.GameObjects.Graphics;

  // Layout constants
  private readonly BAR_WIDTH = 300;
  private readonly BAR_HEIGHT = 8;

  constructor(scene: Phaser.Scene, config: SelectionTimerConfig = {}) {
    const x = config.x ?? GAME_DIMENSIONS.CENTER_X;
    const y = config.y ?? 80;

    super(scene, x, y);

    this.duration = config.duration ?? 30;
    this.warningThreshold = config.warningThreshold ?? 10;
    this.criticalThreshold = config.criticalThreshold ?? 5;
    this.onTimeUp = config.onTimeUp;
    this.timeRemaining = this.duration;

    this.createElements();
    this.updateVisuals();

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  /**
   * Create visual elements.
   */
  private createElements(): void {
    // Background container
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.6);
    this.background.fillRoundedRect(
      -this.BAR_WIDTH / 2 - 20,
      -30,
      this.BAR_WIDTH + 40,
      80,
      10
    );
    this.add(this.background);

    // Label
    this.labelText = this.scene.add.text(0, -20, "SELECT YOUR FIGHTER", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "14px",
      color: "#888888",
    });
    this.labelText.setOrigin(0.5);
    this.add(this.labelText);

    // Timer text
    this.timerText = this.scene.add.text(0, 5, this.formatTime(this.duration), {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "28px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    this.timerText.setOrigin(0.5);
    this.add(this.timerText);

    // Progress bar background
    this.progressBar = this.scene.add.graphics();
    this.progressBar.fillStyle(0x333333, 1);
    this.progressBar.fillRoundedRect(
      -this.BAR_WIDTH / 2,
      30,
      this.BAR_WIDTH,
      this.BAR_HEIGHT,
      4
    );
    this.add(this.progressBar);

    // Progress bar fill
    this.progressFill = this.scene.add.graphics();
    this.add(this.progressFill);
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
    return `${seconds}`;
  }

  /**
   * Get color based on current state.
   */
  private getColor(): number {
    switch (this.timerState) {
      case "critical":
        return 0xef4444; // Red
      case "warning":
        return 0xfbbf24; // Yellow
      default:
        return 0x22c55e; // Green
    }
  }

  /**
   * Update timer state based on remaining time.
   */
  private updateState(): void {
    if (!this.isRunning) {
      this.timerState = "stopped";
    } else if (this.timeRemaining <= this.criticalThreshold) {
      this.timerState = "critical";
    } else if (this.timeRemaining <= this.warningThreshold) {
      this.timerState = "warning";
    } else {
      this.timerState = "normal";
    }
  }

  /**
   * Update visual elements.
   */
  private updateVisuals(): void {
    this.updateState();

    const color = this.getColor();
    const colorHex = `#${color.toString(16).padStart(6, "0")}`;

    // Update timer text
    this.timerText.setText(this.formatTime(this.timeRemaining));
    this.timerText.setColor(colorHex);

    // Update progress bar
    this.progressFill.clear();
    const progress = this.timeRemaining / this.duration;
    const fillWidth = this.BAR_WIDTH * progress;

    this.progressFill.fillStyle(color, 1);
    this.progressFill.fillRoundedRect(
      -this.BAR_WIDTH / 2,
      30,
      fillWidth,
      this.BAR_HEIGHT,
      4
    );

    // Pulse effect on critical
    if (this.timerState === "critical" && this.timeRemaining > 0) {
      const pulse = Math.sin(Date.now() / 100) * 0.1 + 1;
      this.timerText.setScale(pulse);
    } else {
      this.timerText.setScale(1);
    }
  }

  /**
   * Timer tick handler.
   */
  private tick(): void {
    if (!this.isRunning) return;

    this.timeRemaining--;
    this.updateVisuals();

    if (this.timeRemaining <= 0) {
      this.stop();
      this.onTimeUp?.();
    }
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Start the countdown timer.
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.timeRemaining = this.duration;
    this.updateVisuals();

    this.timerEvent = this.scene.time.addEvent({
      delay: 1000,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Stop the countdown timer.
   */
  stop(): void {
    this.isRunning = false;
    this.timerEvent?.destroy();
    this.timerEvent = undefined;
    this.updateVisuals();
  }

  /**
   * Pause the countdown timer.
   */
  pause(): void {
    this.isRunning = false;
    if (this.timerEvent) {
      this.timerEvent.paused = true;
    }
    this.updateVisuals();
  }

  /**
   * Resume the countdown timer.
   */
  resume(): void {
    if (this.timerEvent) {
      this.isRunning = true;
      this.timerEvent.paused = false;
    }
  }

  /**
   * Reset the countdown timer.
   */
  reset(newDuration?: number): void {
    this.stop();
    if (newDuration !== undefined) {
      this.duration = newDuration;
    }
    this.timeRemaining = this.duration;
    this.timerState = "normal";
    this.updateVisuals();
  }

  /**
   * Get remaining time in seconds.
   */
  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  /**
   * Check if timer is running.
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Set the label text.
   */
  setLabel(text: string): void {
    this.labelText.setText(text);
  }

  /**
   * Show "LOCKED IN!" state.
   */
  showLockedIn(): void {
    this.stop();
    this.labelText.setText("LOCKED IN!");
    this.labelText.setColor("#22c55e");
    this.timerText.setText("✓");
    this.timerText.setColor("#22c55e");
    this.timerText.setScale(1);

    // Green progress bar
    this.progressFill.clear();
    this.progressFill.fillStyle(0x22c55e, 1);
    this.progressFill.fillRoundedRect(
      -this.BAR_WIDTH / 2,
      30,
      this.BAR_WIDTH,
      this.BAR_HEIGHT,
      4
    );
  }

  /**
   * Clean up on destroy.
   */
  destroy(fromScene?: boolean): void {
    this.timerEvent?.destroy();
    super.destroy(fromScene);
  }
}
