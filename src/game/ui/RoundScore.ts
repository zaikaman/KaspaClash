/**
 * RoundScore - Visual round score tracker
 * Displays best-of-3 round wins with visual indicators
 */

import Phaser from "phaser";
import { UI_POSITIONS, GAME_DIMENSIONS } from "../config";
import { GAME_CONSTANTS } from "@/types/constants";

/**
 * Round score configuration.
 */
export interface RoundScoreConfig {
  x?: number;
  y?: number;
  roundsToWin?: number;
}

/**
 * Round indicator colors.
 */
const ROUND_COLORS = {
  WON: 0x49eacb, // Kaspa teal - won
  LOST: 0xef4444, // Red - lost
  PENDING: 0x333333, // Gray - not yet played
};

/**
 * RoundScore - Best-of-3 round tracker.
 */
export class RoundScore extends Phaser.GameObjects.Container {
  // Configuration
  private roundsToWin: number;

  // Score state
  private player1Score: number = 0;
  private player2Score: number = 0;
  private currentRound: number = 1;

  // UI elements
  private player1Indicators: Phaser.GameObjects.Arc[] = [];
  private player2Indicators: Phaser.GameObjects.Arc[] = [];
  private roundText!: Phaser.GameObjects.Text;
  private vsText!: Phaser.GameObjects.Text;
  private matchStatusText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, config: RoundScoreConfig = {}) {
    const x = config.x ?? GAME_DIMENSIONS.CENTER_X;
    const y = config.y ?? UI_POSITIONS.ROUND_INDICATOR.Y;

    super(scene, x, y);

    this.roundsToWin = config.roundsToWin ?? GAME_CONSTANTS.ROUNDS_TO_WIN_BEST_OF_3;

    this.createScoreElements();

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  /**
   * Create score display elements.
   */
  private createScoreElements(): void {
    // VS text in center
    this.vsText = this.scene.add.text(0, 0, "VS", {
      fontFamily: "Arial, sans-serif",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#49eacb",
      align: "center",
    });
    this.vsText.setOrigin(0.5);
    this.add(this.vsText);

    // Player 1 round indicators (left side)
    const indicatorSpacing = 25;
    const indicatorSize = 10;

    for (let i = 0; i < this.roundsToWin; i++) {
      const indicator = this.scene.add.circle(
        -50 - i * indicatorSpacing, // Stack to the left
        0,
        indicatorSize,
        ROUND_COLORS.PENDING
      );
      indicator.setStrokeStyle(2, 0x49eacb);
      this.player1Indicators.push(indicator);
      this.add(indicator);
    }

    // Player 2 round indicators (right side)
    for (let i = 0; i < this.roundsToWin; i++) {
      const indicator = this.scene.add.circle(
        50 + i * indicatorSpacing, // Stack to the right
        0,
        indicatorSize,
        ROUND_COLORS.PENDING
      );
      indicator.setStrokeStyle(2, 0x49eacb);
      this.player2Indicators.push(indicator);
      this.add(indicator);
    }

    // Round text (below VS)
    this.roundText = this.scene.add.text(0, 35, "ROUND 1", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#888888",
      align: "center",
    });
    this.roundText.setOrigin(0.5);
    this.add(this.roundText);

    // Score text (above VS)
    this.matchStatusText = this.scene.add.text(0, -35, "0 - 0", {
      fontFamily: "Arial, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffffff",
      align: "center",
    });
    this.matchStatusText.setOrigin(0.5);
    this.add(this.matchStatusText);
  }

  /**
   * Update indicator display.
   */
  private updateIndicators(): void {
    // Update player 1 indicators
    for (let i = 0; i < this.roundsToWin; i++) {
      const indicator = this.player1Indicators[i];
      if (i < this.player1Score) {
        indicator.setFillStyle(ROUND_COLORS.WON);
      } else {
        indicator.setFillStyle(ROUND_COLORS.PENDING);
      }
    }

    // Update player 2 indicators
    for (let i = 0; i < this.roundsToWin; i++) {
      const indicator = this.player2Indicators[i];
      if (i < this.player2Score) {
        indicator.setFillStyle(ROUND_COLORS.WON);
      } else {
        indicator.setFillStyle(ROUND_COLORS.PENDING);
      }
    }

    // Update status text
    if (this.matchStatusText) {
      this.matchStatusText.setText(`${this.player1Score} - ${this.player2Score}`);
    }
  }

  /**
   * Set player 1 round wins.
   */
  setPlayer1Score(score: number): void {
    this.player1Score = Math.max(0, Math.min(score, this.roundsToWin));
    this.updateIndicators();
    this.animateScoreChange(true);
  }

  /**
   * Set player 2 round wins.
   */
  setPlayer2Score(score: number): void {
    this.player2Score = Math.max(0, Math.min(score, this.roundsToWin));
    this.updateIndicators();
    this.animateScoreChange(false);
  }

  /**
   * Increment player 1 score.
   */
  player1Win(): void {
    this.setPlayer1Score(this.player1Score + 1);
  }

  /**
   * Increment player 2 score.
   */
  player2Win(): void {
    this.setPlayer2Score(this.player2Score + 1);
  }

  /**
   * Set current round number.
   */
  setRound(round: number): void {
    this.currentRound = round;
    this.roundText.setText(`ROUND ${round}`);
  }

  /**
   * Animate score change.
   */
  private animateScoreChange(isPlayer1: boolean): void {
    const indicators = isPlayer1 ? this.player1Indicators : this.player2Indicators;
    const score = isPlayer1 ? this.player1Score : this.player2Score;

    if (score > 0 && score <= indicators.length) {
      const indicator = indicators[score - 1];

      // Pop animation
      this.scene.tweens.add({
        targets: indicator,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 200,
        yoyo: true,
        ease: "Back.easeOut",
      });

      // Glow effect
      indicator.setStrokeStyle(3, ROUND_COLORS.WON);
      this.scene.time.delayedCall(500, () => {
        indicator.setStrokeStyle(2, 0x49eacb);
      });
    }

    // Pulse status text
    if (this.matchStatusText) {
      this.scene.tweens.add({
        targets: this.matchStatusText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 150,
        yoyo: true,
        ease: "Power2",
      });
    }
  }

  /**
   * Reset all scores.
   */
  reset(): void {
    this.player1Score = 0;
    this.player2Score = 0;
    this.currentRound = 1;
    this.updateIndicators();
    this.roundText.setText("ROUND 1");
  }

  /**
   * Get player 1 score.
   */
  getPlayer1Score(): number {
    return this.player1Score;
  }

  /**
   * Get player 2 score.
   */
  getPlayer2Score(): number {
    return this.player2Score;
  }

  /**
   * Check if match is over.
   */
  isMatchOver(): boolean {
    return this.player1Score >= this.roundsToWin || this.player2Score >= this.roundsToWin;
  }

  /**
   * Get winner (null if match not over).
   */
  getWinner(): "player1" | "player2" | null {
    if (this.player1Score >= this.roundsToWin) return "player1";
    if (this.player2Score >= this.roundsToWin) return "player2";
    return null;
  }

  /**
   * Show "FINAL ROUND" text for deciding round.
   */
  showFinalRound(): void {
    this.roundText.setText("FINAL ROUND!");
    this.roundText.setColor("#fbbf24");

    this.scene.tweens.add({
      targets: this.roundText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      yoyo: true,
      repeat: 2,
    });
  }

  /**
   * Show match winner.
   */
  showMatchWinner(winner: "player1" | "player2"): void {
    const winText = winner === "player1" ? "PLAYER 1 WINS!" : "PLAYER 2 WINS!";

    this.vsText.setText("🏆");
    this.vsText.setFontSize(36);

    this.roundText.setText(winText);
    this.roundText.setColor("#49eacb");
    this.roundText.setFontSize(24);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      ease: "Back.easeOut",
    });
  }

  /**
   * Destroy cleanup.
   */
  destroy(fromScene?: boolean): void {
    this.player1Indicators = [];
    this.player2Indicators = [];
    super.destroy(fromScene);
  }
}
