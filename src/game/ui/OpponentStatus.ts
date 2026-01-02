/**
 * OpponentStatus - Displays opponent's selection state
 * Shows whether opponent has locked in their character
 */

import Phaser from "phaser";
import { GAME_DIMENSIONS } from "../config";

/**
 * Opponent status configuration.
 */
export interface OpponentStatusConfig {
  x?: number;
  y?: number;
  opponentAddress?: string;
  showAddress?: boolean;
}

/**
 * Selection status states.
 */
type SelectionStatus = "waiting" | "selecting" | "locked" | "disconnected";

/**
 * OpponentStatus - Shows opponent readiness indicator.
 */
export class OpponentStatus extends Phaser.GameObjects.Container {
  // Configuration
  private opponentAddress: string;
  private showAddress: boolean;

  // State
  private status: SelectionStatus = "waiting";

  // Visual elements
  private background!: Phaser.GameObjects.Graphics;
  private statusIcon!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private addressText!: Phaser.GameObjects.Text;
  private pulseEffect!: Phaser.Tweens.Tween;

  // Layout constants
  private readonly WIDTH = 200;
  private readonly HEIGHT = 60;

  constructor(scene: Phaser.Scene, config: OpponentStatusConfig = {}) {
    const x = config.x ?? GAME_DIMENSIONS.WIDTH - 120;
    const y = config.y ?? 80;

    super(scene, x, y);

    this.opponentAddress = config.opponentAddress ?? "";
    this.showAddress = config.showAddress ?? true;

    this.createElements();
    this.updateVisuals();

    // scene.add.existing(this);
  }

  /**
   * Create visual elements.
   */
  private createElements(): void {
    // Background
    this.background = this.scene.add.graphics();
    this.add(this.background);

    // Status icon
    this.statusIcon = this.scene.add.text(-this.WIDTH / 2 + 25, 0, "●", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "24px",
      color: "#888888",
    });
    this.statusIcon.setOrigin(0.5);
    this.add(this.statusIcon);

    // Status text
    this.statusText = this.scene.add.text(10, -8, "OPPONENT", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "14px",
      color: "#ffffff",
    });
    this.statusText.setOrigin(0, 0.5);
    this.add(this.statusText);

    // Address text (truncated)
    this.addressText = this.scene.add.text(10, 10, "", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#888888",
    });
    this.addressText.setOrigin(0, 0.5);
    this.add(this.addressText);

    // Update address display
    this.updateAddressDisplay();
  }

  /**
   * Update address display.
   */
  private updateAddressDisplay(): void {
    if (this.showAddress && this.opponentAddress) {
      const truncated = this.truncateAddress(this.opponentAddress);
      this.addressText.setText(truncated);
      this.addressText.setVisible(true);
    } else {
      this.addressText.setVisible(false);
    }
  }

  /**
   * Truncate address for display.
   */
  private truncateAddress(address: string): string {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }

  /**
   * Get status colors and text.
   */
  private getStatusDisplay(): { color: number; text: string; icon: string } {
    switch (this.status) {
      case "waiting":
        return { color: 0x888888, text: "WAITING...", icon: "○" };
      case "selecting":
        return { color: 0xfbbf24, text: "SELECTING...", icon: "●" };
      case "locked":
        return { color: 0x22c55e, text: "LOCKED IN!", icon: "✓" };
      case "disconnected":
        return { color: 0xef4444, text: "DISCONNECTED", icon: "✕" };
    }
  }

  /**
   * Update visual elements based on status.
   */
  private updateVisuals(): void {
    const display = this.getStatusDisplay();
    const colorHex = `#${display.color.toString(16).padStart(6, "0")}`;

    // Update background
    this.background.clear();
    this.background.fillStyle(0x000000, 0.6);
    this.background.fillRoundedRect(
      -this.WIDTH / 2,
      -this.HEIGHT / 2,
      this.WIDTH,
      this.HEIGHT,
      8
    );
    this.background.lineStyle(2, display.color, 0.5);
    this.background.strokeRoundedRect(
      -this.WIDTH / 2,
      -this.HEIGHT / 2,
      this.WIDTH,
      this.HEIGHT,
      8
    );

    // Update icon
    this.statusIcon.setText(display.icon);
    this.statusIcon.setColor(colorHex);

    // Update status text
    this.statusText.setText(display.text);

    // Handle pulse animation
    this.stopPulse();
    if (this.status === "selecting") {
      this.startPulse();
    }
  }

  /**
   * Start pulse animation for selecting state.
   */
  private startPulse(): void {
    this.pulseEffect = this.scene.tweens.add({
      targets: this.statusIcon,
      alpha: { from: 1, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Stop pulse animation.
   */
  private stopPulse(): void {
    this.pulseEffect?.destroy();
    this.statusIcon.setAlpha(1);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Set opponent's wallet address.
   */
  setOpponentAddress(address: string): void {
    this.opponentAddress = address;
    this.updateAddressDisplay();
  }

  /**
   * Set status to waiting.
   */
  setWaiting(): void {
    this.status = "waiting";
    this.updateVisuals();
  }

  /**
   * Set status to selecting.
   */
  setSelecting(): void {
    this.status = "selecting";
    this.updateVisuals();
  }

  /**
   * Set status to locked.
   */
  setLocked(): void {
    this.status = "locked";
    this.updateVisuals();
  }

  /**
   * Set status to disconnected.
   */
  setDisconnected(): void {
    this.status = "disconnected";
    this.updateVisuals();
  }

  /**
   * Get current status.
   */
  getStatus(): SelectionStatus {
    return this.status;
  }

  /**
   * Show character preview when opponent locks in.
   */
  showCharacterPreview(characterName: string, characterTheme: string): void {
    this.status = "locked";
    this.updateVisuals();
    this.statusText.setText(characterName.toUpperCase());
    this.addressText.setText(characterTheme);
    this.addressText.setVisible(true);
    this.addressText.setColor("#888888");
  }

  /**
   * Clean up on destroy.
   */
  destroy(fromScene?: boolean): void {
    this.stopPulse();
    super.destroy(fromScene);
  }
}
