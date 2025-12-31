/**
 * HealthBar - Visual health indicator for fighters
 * Displays current HP with smooth damage animations
 */

import Phaser from "phaser";
import { UI_POSITIONS } from "../config";
import { GAME_CONSTANTS } from "@/types/constants";

/**
 * Health bar configuration.
 */
export interface HealthBarConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  maxHealth?: number;
  isFlipped?: boolean; // For player 2 (right-aligned)
  showLabel?: boolean;
  playerName?: string;
}

/**
 * Health color thresholds.
 */
const HEALTH_COLORS = {
  FULL: 0x22c55e, // Green - healthy
  MEDIUM: 0xfbbf24, // Yellow - damaged
  LOW: 0xf97316, // Orange - critical
  CRITICAL: 0xef4444, // Red - near death
};

const HEALTH_THRESHOLDS = {
  MEDIUM: 0.6, // 60% health
  LOW: 0.35, // 35% health
  CRITICAL: 0.15, // 15% health
};

/**
 * HealthBar - Fighter health display.
 */
export class HealthBar extends Phaser.GameObjects.Container {
  // Configuration
  private barWidth: number;
  private barHeight: number;
  private maxHealth: number;
  private isFlipped: boolean;

  // Health state
  private currentHealth: number;
  private displayHealth: number; // For animation

  // UI elements
  private background!: Phaser.GameObjects.Graphics;
  private healthFill!: Phaser.GameObjects.Graphics;
  private damageOverlay!: Phaser.GameObjects.Graphics;
  private border!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private nameText?: Phaser.GameObjects.Text;

  // Animation
  private animationTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, config: HealthBarConfig = {}) {
    const isPlayer1 = !config.isFlipped;
    const defaultPos = isPlayer1
      ? UI_POSITIONS.HEALTH_BAR.PLAYER1
      : UI_POSITIONS.HEALTH_BAR.PLAYER2;

    const x = config.x ?? defaultPos.X;
    const y = config.y ?? defaultPos.Y;

    super(scene, x, y);

    this.barWidth = config.width ?? 400;
    this.barHeight = config.height ?? 30;
    this.maxHealth = config.maxHealth ?? GAME_CONSTANTS.STARTING_HEALTH;
    this.isFlipped = config.isFlipped ?? false;
    this.currentHealth = this.maxHealth;
    this.displayHealth = this.maxHealth;

    this.createHealthBarElements(config.showLabel, config.playerName);

    scene.add.existing(this);
  }

  /**
   * Create health bar visual elements.
   */
  private createHealthBarElements(showLabel?: boolean, playerName?: string): void {
    // Player name label
    if (showLabel && playerName) {
      this.nameText = this.scene.add.text(
        this.isFlipped ? this.barWidth : 0,
        -25,
        this.truncateName(playerName),
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
          fontStyle: "bold",
          color: "#ffffff",
          align: this.isFlipped ? "right" : "left",
        }
      );
      this.nameText.setOrigin(this.isFlipped ? 1 : 0, 0.5);
      this.add(this.nameText);
    }

    // Background (dark)
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x1a1a1a, 0.9);
    this.background.fillRoundedRect(0, 0, this.barWidth, this.barHeight, 6);
    this.add(this.background);

    // Damage overlay (shows recent damage in different color)
    this.damageOverlay = this.scene.add.graphics();
    this.add(this.damageOverlay);

    // Health fill
    this.healthFill = this.scene.add.graphics();
    this.add(this.healthFill);

    // Border
    this.border = this.scene.add.graphics();
    this.border.lineStyle(2, 0x49eacb, 1);
    this.border.strokeRoundedRect(0, 0, this.barWidth, this.barHeight, 6);
    this.add(this.border);

    // Health text
    this.healthText = this.scene.add.text(
      this.barWidth / 2,
      this.barHeight / 2,
      `${this.currentHealth}/${this.maxHealth}`,
      {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
      }
    );
    this.healthText.setOrigin(0.5);
    this.add(this.healthText);

    // Initial render
    this.updateDisplay();
  }

  /**
   * Truncate player name for display.
   */
  private truncateName(name: string): string {
    if (name.length <= 15) return name;
    // For wallet addresses, show first and last parts
    if (name.startsWith("kaspa:")) {
      return `${name.slice(0, 12)}...${name.slice(-6)}`;
    }
    return `${name.slice(0, 12)}...`;
  }

  /**
   * Get color based on health percentage.
   */
  private getHealthColor(percentage: number): number {
    if (percentage <= HEALTH_THRESHOLDS.CRITICAL) {
      return HEALTH_COLORS.CRITICAL;
    }
    if (percentage <= HEALTH_THRESHOLDS.LOW) {
      return HEALTH_COLORS.LOW;
    }
    if (percentage <= HEALTH_THRESHOLDS.MEDIUM) {
      return HEALTH_COLORS.MEDIUM;
    }
    return HEALTH_COLORS.FULL;
  }

  /**
   * Update visual display.
   */
  private updateDisplay(): void {
    const healthPercentage = this.displayHealth / this.maxHealth;
    const fillWidth = Math.max(0, (this.barWidth - 4) * healthPercentage);

    // Clear and redraw health fill
    this.healthFill.clear();
    const color = this.getHealthColor(healthPercentage);
    this.healthFill.fillStyle(color, 1);

    // Draw from appropriate side based on flip
    if (this.isFlipped) {
      // Right-aligned: draw from right to left
      const startX = this.barWidth - 2 - fillWidth;
      this.healthFill.fillRoundedRect(startX, 2, fillWidth, this.barHeight - 4, {
        tl: fillWidth >= this.barWidth - 8 ? 4 : 0,
        tr: 4,
        bl: fillWidth >= this.barWidth - 8 ? 4 : 0,
        br: 4,
      });
    } else {
      // Left-aligned: draw from left to right
      this.healthFill.fillRoundedRect(2, 2, fillWidth, this.barHeight - 4, {
        tl: 4,
        tr: fillWidth >= this.barWidth - 8 ? 4 : 0,
        bl: 4,
        br: fillWidth >= this.barWidth - 8 ? 4 : 0,
      });
    }

    // Update text
    this.healthText.setText(`${Math.round(this.currentHealth)}/${this.maxHealth}`);
  }

  /**
   * Set health with animated transition.
   */
  setHealth(newHealth: number, animate: boolean = true): void {
    const previousHealth = this.currentHealth;
    this.currentHealth = Math.max(0, Math.min(newHealth, this.maxHealth));

    if (!animate || previousHealth === this.currentHealth) {
      this.displayHealth = this.currentHealth;
      this.updateDisplay();
      return;
    }

    // Show damage overlay
    if (this.currentHealth < previousHealth) {
      this.showDamageEffect(previousHealth);
    }

    // Cancel existing animation
    if (this.animationTween) {
      this.animationTween.stop();
    }

    // Animate health change
    this.animationTween = this.scene.tweens.add({
      targets: this,
      displayHealth: this.currentHealth,
      duration: 500,
      ease: "Power2",
      onUpdate: () => {
        this.updateDisplay();
      },
    });
  }

  /**
   * Show damage flash effect.
   */
  private showDamageEffect(previousHealth: number): void {
    const previousPercentage = previousHealth / this.maxHealth;
    const previousWidth = (this.barWidth - 4) * previousPercentage;
    const currentPercentage = this.currentHealth / this.maxHealth;
    const currentWidth = (this.barWidth - 4) * currentPercentage;

    // Draw damage overlay (red section showing lost health)
    this.damageOverlay.clear();
    this.damageOverlay.fillStyle(0xff0000, 0.8);

    if (this.isFlipped) {
      const startX = this.barWidth - 2 - previousWidth;
      const endX = this.barWidth - 2 - currentWidth;
      this.damageOverlay.fillRect(startX, 2, endX - startX, this.barHeight - 4);
    } else {
      this.damageOverlay.fillRect(currentWidth + 2, 2, previousWidth - currentWidth, this.barHeight - 4);
    }

    // Fade out damage overlay
    this.scene.tweens.add({
      targets: this.damageOverlay,
      alpha: 0,
      duration: 600,
      ease: "Power2",
      onComplete: () => {
        this.damageOverlay.clear();
        this.damageOverlay.alpha = 1;
      },
    });

    // Shake effect
    this.scene.tweens.add({
      targets: this,
      x: this.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
    });
  }

  /**
   * Apply damage to health.
   */
  damage(amount: number, animate: boolean = true): void {
    this.setHealth(this.currentHealth - amount, animate);
  }

  /**
   * Heal health.
   */
  heal(amount: number, animate: boolean = true): void {
    this.setHealth(this.currentHealth + amount, animate);
  }

  /**
   * Reset health to maximum.
   */
  reset(animate: boolean = false): void {
    this.setHealth(this.maxHealth, animate);
  }

  /**
   * Get current health.
   */
  getHealth(): number {
    return this.currentHealth;
  }

  /**
   * Get health percentage (0-1).
   */
  getHealthPercentage(): number {
    return this.currentHealth / this.maxHealth;
  }

  /**
   * Check if health is at zero.
   */
  isDead(): boolean {
    return this.currentHealth <= 0;
  }

  /**
   * Set player name.
   */
  setPlayerName(name: string): void {
    if (this.nameText) {
      this.nameText.setText(this.truncateName(name));
    }
  }

  /**
   * Flash the health bar (for round start, etc.).
   */
  flash(color: number = 0x49eacb): void {
    this.border.clear();
    this.border.lineStyle(3, color, 1);
    this.border.strokeRoundedRect(0, 0, this.barWidth, this.barHeight, 6);

    this.scene.time.delayedCall(200, () => {
      this.border.clear();
      this.border.lineStyle(2, 0x49eacb, 1);
      this.border.strokeRoundedRect(0, 0, this.barWidth, this.barHeight, 6);
    });
  }

  /**
   * Cleanup on destroy.
   */
  destroy(fromScene?: boolean): void {
    if (this.animationTween) {
      this.animationTween.stop();
    }
    super.destroy(fromScene);
  }
}
