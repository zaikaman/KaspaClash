/**
 * FightScene - Main battle arena for KaspaClash
 * Core Phaser scene for 1v1 fighting matches
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { GAME_DIMENSIONS, CHARACTER_POSITIONS, UI_POSITIONS } from "../config";
import type { MoveType, PlayerRole } from "@/types";

/**
 * Fight scene configuration.
 */
export interface FightSceneConfig {
  matchId: string;
  player1Address: string;
  player2Address: string;
  player1Character: string;
  player2Character: string;
  playerRole: PlayerRole; // Which player is the local user
}

/**
 * FightScene - The main battle arena.
 */
export class FightScene extends Phaser.Scene {
  // Scene configuration
  private config!: FightSceneConfig;

  // UI Elements
  private player1HealthBar!: Phaser.GameObjects.Graphics;
  private player2HealthBar!: Phaser.GameObjects.Graphics;
  private roundTimerText!: Phaser.GameObjects.Text;
  private roundScoreText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;

  // Health tracking
  private player1Health: number = 100;
  private player2Health: number = 100;

  // Round tracking
  private player1RoundsWon: number = 0;
  private player2RoundsWon: number = 0;
  private currentRound: number = 1;

  // Timer
  private roundTimer: number = 15;
  private timerEvent?: Phaser.Time.TimerEvent;

  // Move buttons
  private moveButtons: Map<MoveType, Phaser.GameObjects.Container> = new Map();
  private selectedMove: MoveType | null = null;
  private moveSubmitted: boolean = false;

  // State
  private isRoundActive: boolean = false;

  constructor() {
    super({ key: "FightScene" });
  }

  /**
   * Initialize scene with match data.
   */
  init(data: FightSceneConfig): void {
    this.config = data;
    this.resetRoundState();
  }

  /**
   * Preload assets.
   */
  preload(): void {
    // Load arena background
    this.load.image("arena-bg", "/assets/arena/background.png");

    // Load UI elements
    this.load.image("health-bar-bg", "/assets/ui/health-bar-bg.png");
    this.load.image("health-bar-fill", "/assets/ui/health-bar-fill.png");

    // Load move button icons
    this.load.image("icon-punch", "/assets/ui/icon-punch.png");
    this.load.image("icon-kick", "/assets/ui/icon-kick.png");
    this.load.image("icon-block", "/assets/ui/icon-block.png");
    this.load.image("icon-special", "/assets/ui/icon-special.png");
  }

  /**
   * Create scene elements.
   */
  create(): void {
    // Background
    this.createBackground();

    // UI Elements
    this.createHealthBars();
    this.createRoundTimer();
    this.createRoundScore();
    this.createMoveButtons();
    this.createCountdownOverlay();

    // Setup event listeners
    this.setupEventListeners();

    // Emit scene ready event
    EventBus.emit("scene:ready", this);
  }

  /**
   * Update loop.
   */
  update(_time: number, _delta: number): void {
    // Update timer display
    if (this.isRoundActive && this.roundTimerText) {
      this.roundTimerText.setText(`${Math.ceil(this.roundTimer)}`);
    }
  }

  // ===========================================================================
  // BACKGROUND
  // ===========================================================================

  private createBackground(): void {
    // Create gradient background
    const graphics = this.add.graphics();
    
    // Dark arena gradient
    graphics.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a1a2e, 0x1a1a2e, 1);
    graphics.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);

    // Arena floor
    graphics.fillStyle(0x2d2d44, 1);
    graphics.fillRect(0, GAME_DIMENSIONS.HEIGHT - 150, GAME_DIMENSIONS.WIDTH, 150);

    // Arena floor line
    graphics.lineStyle(2, 0x40e0d0, 0.5);
    graphics.lineBetween(0, GAME_DIMENSIONS.HEIGHT - 150, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT - 150);

    // Center line
    graphics.lineStyle(1, 0x40e0d0, 0.3);
    graphics.lineBetween(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.HEIGHT - 150, GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.HEIGHT);
  }

  // ===========================================================================
  // HEALTH BARS
  // ===========================================================================

  private createHealthBars(): void {
    const barWidth = 400;
    const barHeight = 30;

    // Player 1 Health Bar (left side)
    this.createHealthBar(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y,
      barWidth,
      barHeight,
      "player1"
    );

    // Player 2 Health Bar (right side, reversed)
    this.createHealthBar(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y,
      barWidth,
      barHeight,
      "player2"
    );

    // Player labels
    const labelStyle = {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#40e0d0",
    };

    // Player 1 label
    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y - 20,
      this.formatAddress(this.config?.player1Address || "Player 1"),
      labelStyle
    );

    // Player 2 label
    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X + barWidth,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y - 20,
      this.formatAddress(this.config?.player2Address || "Player 2"),
      { ...labelStyle, align: "right" }
    ).setOrigin(1, 0);
  }

  private createHealthBar(
    x: number,
    y: number,
    width: number,
    height: number,
    player: "player1" | "player2"
  ): void {
    const graphics = this.add.graphics();

    // Background
    graphics.fillStyle(0x333333, 1);
    graphics.fillRoundedRect(x, y, width, height, 4);

    // Border
    graphics.lineStyle(2, 0x40e0d0, 1);
    graphics.strokeRoundedRect(x, y, width, height, 4);

    // Health fill (will be updated)
    const healthGraphics = this.add.graphics();
    healthGraphics.fillStyle(0x00ff88, 1);
    healthGraphics.fillRoundedRect(x + 2, y + 2, width - 4, height - 4, 3);

    if (player === "player1") {
      this.player1HealthBar = healthGraphics;
    } else {
      this.player2HealthBar = healthGraphics;
    }
  }

  /**
   * Update health bar display.
   */
  public updateHealthBar(player: "player1" | "player2", health: number): void {
    const maxHealth = 100;
    const healthPercent = Math.max(0, Math.min(health, maxHealth)) / maxHealth;

    const barWidth = 400;
    const barHeight = 30;
    const innerWidth = (barWidth - 4) * healthPercent;

    const graphics = player === "player1" ? this.player1HealthBar : this.player2HealthBar;
    const x = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.X : UI_POSITIONS.HEALTH_BAR.PLAYER2.X;
    const y = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.Y : UI_POSITIONS.HEALTH_BAR.PLAYER2.Y;

    graphics.clear();

    // Color based on health
    let color = 0x00ff88; // Green
    if (healthPercent <= 0.25) {
      color = 0xff4444; // Red
    } else if (healthPercent <= 0.5) {
      color = 0xffaa00; // Orange
    }

    graphics.fillStyle(color, 1);

    if (player === "player2") {
      // Right-aligned for player 2
      graphics.fillRoundedRect(x + 2 + (barWidth - 4 - innerWidth), y + 2, innerWidth, barHeight - 4, 3);
    } else {
      graphics.fillRoundedRect(x + 2, y + 2, innerWidth, barHeight - 4, 3);
    }

    // Store health
    if (player === "player1") {
      this.player1Health = health;
    } else {
      this.player2Health = health;
    }
  }

  // ===========================================================================
  // ROUND TIMER
  // ===========================================================================

  private createRoundTimer(): void {
    // Timer background
    const timerBg = this.add.graphics();
    timerBg.fillStyle(0x1a1a2e, 0.9);
    timerBg.fillCircle(UI_POSITIONS.TIMER.X, UI_POSITIONS.TIMER.Y, 40);
    timerBg.lineStyle(3, 0x40e0d0, 1);
    timerBg.strokeCircle(UI_POSITIONS.TIMER.X, UI_POSITIONS.TIMER.Y, 40);

    // Timer text
    this.roundTimerText = this.add.text(
      UI_POSITIONS.TIMER.X,
      UI_POSITIONS.TIMER.Y,
      "15",
      {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#40e0d0",
        fontStyle: "bold",
      }
    ).setOrigin(0.5);
  }

  /**
   * Start the round timer.
   */
  public startRoundTimer(): void {
    this.roundTimer = 15;
    this.isRoundActive = true;

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.roundTimer--;

        if (this.roundTimer <= 5) {
          this.roundTimerText.setColor("#ff4444");
        }

        if (this.roundTimer <= 0) {
          this.onTimerExpired();
        }
      },
      repeat: 14,
    });
  }

  /**
   * Stop the round timer.
   */
  public stopRoundTimer(): void {
    this.isRoundActive = false;
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }
  }

  private onTimerExpired(): void {
    this.stopRoundTimer();

    // If no move submitted, emit timeout
    if (!this.moveSubmitted) {
      EventBus.emitEvent("move:timeout", { playerId: this.config?.player1Address || "" });
    }
  }

  // ===========================================================================
  // ROUND SCORE
  // ===========================================================================

  private createRoundScore(): void {
    this.roundScoreText = this.add.text(
      UI_POSITIONS.ROUND_INDICATOR.X,
      UI_POSITIONS.ROUND_INDICATOR.Y,
      "Round 1  •  0 - 0",
      {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffffff",
      }
    ).setOrigin(0.5);
  }

  /**
   * Update round score display.
   */
  public updateRoundScore(round: number, p1Wins: number, p2Wins: number): void {
    this.currentRound = round;
    this.player1RoundsWon = p1Wins;
    this.player2RoundsWon = p2Wins;
    this.roundScoreText.setText(`Round ${round}  •  ${p1Wins} - ${p2Wins}`);
  }

  // ===========================================================================
  // MOVE BUTTONS
  // ===========================================================================

  private createMoveButtons(): void {
    const moves: MoveType[] = ["punch", "kick", "block", "special"];
    const buttonWidth = 120;
    const buttonHeight = 80;
    const spacing = 20;
    const totalWidth = moves.length * buttonWidth + (moves.length - 1) * spacing;
    const startX = (GAME_DIMENSIONS.WIDTH - totalWidth) / 2;
    const y = GAME_DIMENSIONS.HEIGHT - 100;

    moves.forEach((move, index) => {
      const x = startX + index * (buttonWidth + spacing);
      const button = this.createMoveButton(x, y, buttonWidth, buttonHeight, move);
      this.moveButtons.set(move, button);
    });
  }

  private createMoveButton(
    x: number,
    y: number,
    width: number,
    height: number,
    move: MoveType
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(0x2d2d44, 1);
    bg.fillRoundedRect(0, 0, width, height, 8);
    bg.lineStyle(2, 0x40e0d0, 0.5);
    bg.strokeRoundedRect(0, 0, width, height, 8);

    // Move label
    const label = this.add.text(width / 2, height / 2, move.toUpperCase(), {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#40e0d0",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Damage label
    const damageText = this.getDamageText(move);
    const damage = this.add.text(width / 2, height - 10, damageText, {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#888888",
    }).setOrigin(0.5);

    container.add([bg, label, damage]);

    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(0, 0, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on("pointerover", () => {
      if (!this.moveSubmitted) {
        bg.clear();
        bg.fillStyle(0x40e0d0, 0.2);
        bg.fillRoundedRect(0, 0, width, height, 8);
        bg.lineStyle(2, 0x40e0d0, 1);
        bg.strokeRoundedRect(0, 0, width, height, 8);
      }
    });

    container.on("pointerout", () => {
      if (!this.moveSubmitted && this.selectedMove !== move) {
        bg.clear();
        bg.fillStyle(0x2d2d44, 1);
        bg.fillRoundedRect(0, 0, width, height, 8);
        bg.lineStyle(2, 0x40e0d0, 0.5);
        bg.strokeRoundedRect(0, 0, width, height, 8);
      }
    });

    container.on("pointerdown", () => {
      if (!this.moveSubmitted && this.isRoundActive) {
        this.selectMove(move);
      }
    });

    return container;
  }

  private getDamageText(move: MoveType): string {
    const damages: Record<MoveType, string> = {
      punch: "10 DMG",
      kick: "15 DMG",
      block: "GUARD",
      special: "25 DMG",
    };
    return damages[move];
  }

  private selectMove(move: MoveType): void {
    // Deselect previous
    if (this.selectedMove) {
      this.updateButtonState(this.selectedMove, false);
    }

    // Select new
    this.selectedMove = move;
    this.updateButtonState(move, true);

    // Emit move selected event
    EventBus.emitEvent("move:selected", { moveType: move });
  }

  private updateButtonState(move: MoveType, selected: boolean): void {
    const container = this.moveButtons.get(move);
    if (!container) return;

    const bg = container.getAt(0) as Phaser.GameObjects.Graphics;
    const width = 120;
    const height = 80;

    bg.clear();
    if (selected) {
      bg.fillStyle(0x40e0d0, 0.3);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(3, 0x40e0d0, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
    } else {
      bg.fillStyle(0x2d2d44, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(2, 0x40e0d0, 0.5);
      bg.strokeRoundedRect(0, 0, width, height, 8);
    }
  }

  /**
   * Lock in the selected move.
   */
  public lockMove(): void {
    if (this.selectedMove) {
      this.moveSubmitted = true;
      this.disableAllMoveButtons();
    }
  }

  /**
   * Disable all move buttons.
   */
  private disableAllMoveButtons(): void {
    this.moveButtons.forEach((container) => {
      container.disableInteractive();
      container.setAlpha(0.5);
    });
  }

  /**
   * Enable all move buttons.
   */
  private enableAllMoveButtons(): void {
    this.moveButtons.forEach((container) => {
      container.setInteractive();
      container.setAlpha(1);
    });
  }

  // ===========================================================================
  // COUNTDOWN OVERLAY
  // ===========================================================================

  private createCountdownOverlay(): void {
    this.countdownText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y,
      "",
      {
        fontFamily: "monospace",
        fontSize: "72px",
        color: "#40e0d0",
        fontStyle: "bold",
      }
    ).setOrigin(0.5).setAlpha(0);
  }

  /**
   * Show countdown before round.
   */
  public showCountdown(seconds: number): void {
    let count = seconds;

    const updateCountdown = () => {
      if (count > 0) {
        this.countdownText.setText(count.toString());
        this.countdownText.setAlpha(1);

        this.tweens.add({
          targets: this.countdownText,
          scale: { from: 1.5, to: 1 },
          alpha: { from: 1, to: 0.5 },
          duration: 800,
          onComplete: () => {
            count--;
            if (count > 0) {
              updateCountdown();
            } else {
              this.countdownText.setText("FIGHT!");
              this.countdownText.setAlpha(1);
              this.tweens.add({
                targets: this.countdownText,
                alpha: 0,
                duration: 500,
                delay: 500,
              });
            }
          },
        });
      }
    };

    updateCountdown();
  }

  // ===========================================================================
  // EVENT LISTENERS
  // ===========================================================================

  private setupEventListeners(): void {
    // Listen for round start
    EventBus.onEvent("round:start", ({ roundNumber }) => {
      this.resetRoundState();
      this.updateRoundScore(roundNumber, this.player1RoundsWon, this.player2RoundsWon);
      this.showCountdown(3);
      this.time.delayedCall(3500, () => {
        this.startRoundTimer();
        this.enableAllMoveButtons();
      });
    });

    // Listen for health updates
    EventBus.onEvent("health:update", ({ player1Health, player2Health }) => {
      this.updateHealthBar("player1", player1Health);
      this.updateHealthBar("player2", player2Health);
    });

    // Listen for round end
    EventBus.onEvent("round:end", ({ roundNumber, winner }) => {
      this.stopRoundTimer();
      this.disableAllMoveButtons();

      // Update round wins
      if (winner === "player1") {
        this.player1RoundsWon++;
      } else if (winner === "player2") {
        this.player2RoundsWon++;
      }

      this.updateRoundScore(roundNumber, this.player1RoundsWon, this.player2RoundsWon);
    });
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private resetRoundState(): void {
    this.selectedMove = null;
    this.moveSubmitted = false;
    this.roundTimer = 15;
    this.roundTimerText?.setColor("#40e0d0");
  }

  private formatAddress(address: string): string {
    if (!address || address.length < 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-6)}`;
  }

  /**
   * Get the currently selected move.
   */
  public getSelectedMove(): MoveType | null {
    return this.selectedMove;
  }

  /**
   * Check if move has been submitted.
   */
  public isMoveSubmitted(): boolean {
    return this.moveSubmitted;
  }
}

export default FightScene;
