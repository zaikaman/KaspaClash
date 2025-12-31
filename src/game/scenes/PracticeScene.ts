/**
 * PracticeScene - Offline practice mode against AI
 * No wallet required, no on-chain transactions, local state only
 */

import Phaser from "phaser";
import { EventBus } from "@/game/EventBus";
import { GAME_DIMENSIONS, CHARACTER_POSITIONS, UI_POSITIONS } from "@/game/config";
import { HealthBar, RoundTimer, RoundScore, MoveButton } from "@/game/ui";
import { AIOpponent, type AIDifficulty, type AIContext } from "@/lib/game/ai-opponent";
import { getAIThinkTime } from "@/lib/game/ai-difficulty";
import { resolveRound, type RoundResolutionResult } from "@/lib/game/round-resolver";
import { getCharacter, getRandomCharacter } from "@/data/characters";
import type { MoveType, Character } from "@/types";
import { GAME_CONSTANTS } from "@/types/constants";

/**
 * Practice scene configuration.
 */
export interface PracticeSceneConfig {
  playerCharacterId: string;
  aiDifficulty: AIDifficulty;
  matchFormat?: "best_of_3" | "best_of_5";
}

/**
 * Practice match state.
 */
interface PracticeMatchState {
  currentRound: number;
  playerHealth: number;
  aiHealth: number;
  playerRoundsWon: number;
  aiRoundsWon: number;
  isRoundActive: boolean;
  playerMove: MoveType | null;
  aiMove: MoveType | null;
  roundsToWin: number;
}

/**
 * PracticeScene - Offline AI battle arena.
 */
export class PracticeScene extends Phaser.Scene {
  // Configuration
  private config!: PracticeSceneConfig;
  private playerCharacter!: Character;
  private aiCharacter!: Character;
  private ai!: AIOpponent;

  // Match state
  private matchState!: PracticeMatchState;

  // UI Elements
  private playerHealthBar!: HealthBar;
  private aiHealthBar!: HealthBar;
  private roundTimer!: RoundTimer;
  private roundScore!: RoundScore;
  private moveButtons: Map<MoveType, MoveButton> = new Map();

  // Overlay elements
  private countdownText!: Phaser.GameObjects.Text;
  private roundResultText!: Phaser.GameObjects.Text;
  private matchResultOverlay!: Phaser.GameObjects.Container;

  // State flags
  private isProcessingRound: boolean = false;
  private moveSubmitted: boolean = false;

  constructor() {
    super({ key: "PracticeScene" });
  }

  /**
   * Initialize scene with configuration.
   */
  init(data: PracticeSceneConfig): void {
    this.config = data;
    this.initializeMatch();
  }

  /**
   * Initialize match state.
   */
  private initializeMatch(): void {
    // Get characters
    this.playerCharacter =
      getCharacter(this.config.playerCharacterId) ?? getRandomCharacter();
    this.aiCharacter = getRandomCharacter();

    // Create AI opponent
    this.ai = new AIOpponent(this.config.aiDifficulty);

    // Initialize match state
    const roundsToWin = this.config.matchFormat === "best_of_5" ? 3 : 2;
    this.matchState = {
      currentRound: 1,
      playerHealth: GAME_CONSTANTS.STARTING_HEALTH,
      aiHealth: GAME_CONSTANTS.STARTING_HEALTH,
      playerRoundsWon: 0,
      aiRoundsWon: 0,
      isRoundActive: false,
      playerMove: null,
      aiMove: null,
      roundsToWin,
    };

    // Reset flags
    this.isProcessingRound = false;
    this.moveSubmitted = false;
    this.moveButtons.clear();
  }

  /**
   * Preload assets.
   */
  preload(): void {
    // Assets should already be loaded from main game
  }

  /**
   * Create scene elements.
   */
  create(): void {
    this.createBackground();
    this.createHealthBars();
    this.createRoundInfo();
    this.createMoveButtons();
    this.createOverlays();
    this.setupEventListeners();

    // Start first round after brief delay
    this.time.delayedCall(500, () => {
      this.startRoundCountdown();
    });

    EventBus.emit("practice_scene_ready");
  }

  /**
   * Create background.
   */
  private createBackground(): void {
    // Gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    graphics.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);

    // Practice mode indicator
    const practiceLabel = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      30,
      "PRACTICE MODE",
      {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "16px",
        color: "#888888",
      }
    );
    practiceLabel.setOrigin(0.5);

    // AI difficulty indicator
    const difficultyLabel = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      50,
      `AI: ${this.config.aiDifficulty.toUpperCase()}`,
      {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "14px",
        color: "#666666",
      }
    );
    difficultyLabel.setOrigin(0.5);
  }

  /**
   * Create health bars.
   */
  private createHealthBars(): void {
    this.playerHealthBar = new HealthBar(this, {
      x: UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      y: UI_POSITIONS.HEALTH_BAR.PLAYER1.Y,
      showLabel: true,
      playerName: this.playerCharacter.name,
    });

    this.aiHealthBar = new HealthBar(this, {
      x: UI_POSITIONS.HEALTH_BAR.PLAYER2.X,
      y: UI_POSITIONS.HEALTH_BAR.PLAYER2.Y,
      isFlipped: true,
      showLabel: true,
      playerName: `AI: ${this.aiCharacter.name}`,
    });
  }

  /**
   * Create round information display.
   */
  private createRoundInfo(): void {
    this.roundTimer = new RoundTimer(this, {
      x: GAME_DIMENSIONS.CENTER_X,
      y: UI_POSITIONS.TIMER.Y,
      duration: GAME_CONSTANTS.MOVE_TIME_LIMIT,
      onComplete: () => this.handleTimeUp(),
    });

    this.roundScore = new RoundScore(this, {
      x: GAME_DIMENSIONS.CENTER_X,
      y: UI_POSITIONS.ROUND_INDICATOR.Y,
      roundsToWin: this.matchState.roundsToWin,
    });
  }

  /**
   * Create move selection buttons.
   */
  private createMoveButtons(): void {
    const moves: MoveType[] = ["punch", "kick", "block", "special"];
    const buttonWidth = 140;
    const buttonSpacing = 20;
    const totalWidth = moves.length * buttonWidth + (moves.length - 1) * buttonSpacing;
    const startX = (GAME_DIMENSIONS.WIDTH - totalWidth) / 2 + buttonWidth / 2;
    const y = GAME_DIMENSIONS.HEIGHT - 100;

    moves.forEach((move, index) => {
      const x = startX + index * (buttonWidth + buttonSpacing);
      const button = new MoveButton(this, {
        x,
        y,
        moveType: move,
        width: buttonWidth,
        height: 80,
        onClick: (selectedMove) => this.handleMoveSelect(selectedMove),
      });
      this.moveButtons.set(move, button);
    });
  }

  /**
   * Create overlay elements.
   */
  private createOverlays(): void {
    // Countdown text
    this.countdownText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y,
      "",
      {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "72px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    );
    this.countdownText.setOrigin(0.5);
    this.countdownText.setVisible(false);

    // Round result text
    this.roundResultText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y,
      "",
      {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "48px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    );
    this.roundResultText.setOrigin(0.5);
    this.roundResultText.setVisible(false);

    // Match result overlay (hidden initially)
    this.createMatchResultOverlay();
  }

  /**
   * Create match result overlay.
   */
  private createMatchResultOverlay(): void {
    this.matchResultOverlay = this.add.container(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y
    );

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRect(
      -GAME_DIMENSIONS.WIDTH / 2,
      -GAME_DIMENSIONS.HEIGHT / 2,
      GAME_DIMENSIONS.WIDTH,
      GAME_DIMENSIONS.HEIGHT
    );
    this.matchResultOverlay.add(bg);

    this.matchResultOverlay.setVisible(false);
    this.matchResultOverlay.setDepth(100);
  }

  /**
   * Setup event listeners.
   */
  private setupEventListeners(): void {
    // Exit practice mode
    EventBus.on("practice_exit", () => {
      this.exitPractice();
    });

    // Restart practice
    EventBus.on("practice_restart", () => {
      this.restartMatch();
    });
  }

  // ===========================================================================
  // ROUND FLOW
  // ===========================================================================

  /**
   * Start round countdown.
   */
  private startRoundCountdown(): void {
    this.disableMoveButtons();

    let count = 3;
    this.countdownText.setVisible(true);
    this.countdownText.setText(count.toString());

    const countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          this.countdownText.setText(count.toString());
        } else {
          this.countdownText.setText("FIGHT!");
          this.time.delayedCall(500, () => {
            this.countdownText.setVisible(false);
            this.startRound();
          });
        }
      },
    });
  }

  /**
   * Start active round.
   */
  private startRound(): void {
    this.matchState.isRoundActive = true;
    this.matchState.playerMove = null;
    this.matchState.aiMove = null;
    this.moveSubmitted = false;

    this.enableMoveButtons();
    this.roundTimer.start();

    // Update AI context
    this.ai.updateContext({
      aiHealth: this.matchState.aiHealth,
      playerHealth: this.matchState.playerHealth,
      roundNumber: this.matchState.currentRound,
      playerRoundsWon: this.matchState.playerRoundsWon,
      aiRoundsWon: this.matchState.aiRoundsWon,
    });
  }

  /**
   * Handle player move selection.
   */
  private handleMoveSelect(move: MoveType): void {
    if (!this.matchState.isRoundActive || this.moveSubmitted) return;

    this.moveSubmitted = true;
    this.matchState.playerMove = move;

    // Highlight selected move
    this.moveButtons.forEach((button, type) => {
      if (type === move) {
        button.setSelected(true);
      } else {
        button.setDisabled(true);
      }
    });

    // AI makes decision after "thinking"
    const thinkTime = getAIThinkTime(this.config.aiDifficulty);
    this.time.delayedCall(thinkTime, () => {
      this.aiMakeDecision();
    });
  }

  /**
   * AI makes move decision.
   */
  private aiMakeDecision(): void {
    const decision = this.ai.decide();
    this.matchState.aiMove = decision.move;
    this.ai.recordPlayerMove(this.matchState.playerMove!);

    // Resolve round
    this.resolveRound();
  }

  /**
   * Handle timer expiration.
   */
  private handleTimeUp(): void {
    if (!this.matchState.isRoundActive || this.isProcessingRound) return;

    // Auto-select random move if player didn't choose
    if (!this.moveSubmitted) {
      const moves: MoveType[] = ["punch", "kick", "block", "special"];
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      this.handleMoveSelect(randomMove);
    }
  }

  /**
   * Resolve round with both moves.
   */
  private resolveRound(): void {
    if (this.isProcessingRound) return;
    this.isProcessingRound = true;

    this.roundTimer.stop();
    this.matchState.isRoundActive = false;

    // Calculate round result
    const result = resolveRound({
      player1Move: this.matchState.playerMove!,
      player2Move: this.matchState.aiMove!,
      player1Health: this.matchState.playerHealth,
      player2Health: this.matchState.aiHealth,
    });

    // Apply damage - player is player1, AI is player2
    this.matchState.playerHealth = result.player1HealthAfter;
    this.matchState.aiHealth = result.player2HealthAfter;

    // Update health bars
    this.playerHealthBar.setHealth(this.matchState.playerHealth);
    this.aiHealthBar.setHealth(this.matchState.aiHealth);

    // Show round result
    this.showRoundResult(result);
  }

  /**
   * Show round result animation.
   */
  private showRoundResult(result: RoundResolutionResult): void {
    // Display moves
    const resultText = `${this.matchState.playerMove!.toUpperCase()} vs ${this.matchState.aiMove!.toUpperCase()}`;
    this.roundResultText.setText(resultText);
    this.roundResultText.setVisible(true);

    this.time.delayedCall(1500, () => {
      this.roundResultText.setVisible(false);
      this.checkRoundEnd();
    });
  }

  /**
   * Check if round is over (health depleted).
   */
  private checkRoundEnd(): void {
    const playerWins = this.matchState.aiHealth <= 0;
    const aiWins = this.matchState.playerHealth <= 0;

    if (playerWins || aiWins) {
      if (playerWins) {
        this.matchState.playerRoundsWon++;
      }
      if (aiWins) {
        this.matchState.aiRoundsWon++;
      }

      // Update round score
      this.roundScore.setPlayer1Score(this.matchState.playerRoundsWon);
      this.roundScore.setPlayer2Score(this.matchState.aiRoundsWon);

      // Check for match end
      if (
        this.matchState.playerRoundsWon >= this.matchState.roundsToWin ||
        this.matchState.aiRoundsWon >= this.matchState.roundsToWin
      ) {
        this.endMatch();
      } else {
        // Start next round
        this.startNextRound();
      }
    } else {
      // Continue current round
      this.isProcessingRound = false;
      this.moveSubmitted = false;
      this.resetMoveButtons();
      this.roundTimer.start();
      this.matchState.isRoundActive = true;
    }
  }

  /**
   * Start next round.
   */
  private startNextRound(): void {
    this.matchState.currentRound++;
    this.matchState.playerHealth = GAME_CONSTANTS.STARTING_HEALTH;
    this.matchState.aiHealth = GAME_CONSTANTS.STARTING_HEALTH;

    this.playerHealthBar.setHealth(GAME_CONSTANTS.STARTING_HEALTH);
    this.aiHealthBar.setHealth(GAME_CONSTANTS.STARTING_HEALTH);

    this.isProcessingRound = false;

    this.time.delayedCall(1000, () => {
      this.startRoundCountdown();
    });
  }

  /**
   * End match.
   */
  private endMatch(): void {
    const playerWon =
      this.matchState.playerRoundsWon >= this.matchState.roundsToWin;

    this.showMatchResult(playerWon);

    EventBus.emit("practice_match_ended", {
      playerWon,
      playerRoundsWon: this.matchState.playerRoundsWon,
      aiRoundsWon: this.matchState.aiRoundsWon,
      difficulty: this.config.aiDifficulty,
    });
  }

  /**
   * Show match result overlay.
   */
  private showMatchResult(playerWon: boolean): void {
    // Clear existing children except background
    const bg = this.matchResultOverlay.list[0];
    this.matchResultOverlay.removeAll(true);
    this.matchResultOverlay.add(bg);

    // Result title
    const title = this.add.text(
      0,
      -100,
      playerWon ? "VICTORY!" : "DEFEAT",
      {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "64px",
        color: playerWon ? "#22c55e" : "#ef4444",
        fontStyle: "bold",
      }
    );
    title.setOrigin(0.5);
    this.matchResultOverlay.add(title);

    // Score
    const score = this.add.text(
      0,
      -20,
      `${this.matchState.playerRoundsWon} - ${this.matchState.aiRoundsWon}`,
      {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "36px",
        color: "#ffffff",
      }
    );
    score.setOrigin(0.5);
    this.matchResultOverlay.add(score);

    // Buttons
    this.createResultButtons();

    this.matchResultOverlay.setVisible(true);
  }

  /**
   * Create result screen buttons.
   */
  private createResultButtons(): void {
    // Retry button
    const retryBtn = this.createButton(0, 80, "PLAY AGAIN", () => {
      this.restartMatch();
    });
    this.matchResultOverlay.add(retryBtn);

    // Exit button
    const exitBtn = this.createButton(0, 150, "EXIT", () => {
      this.exitPractice();
    });
    this.matchResultOverlay.add(exitBtn);
  }

  /**
   * Create a button.
   */
  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const width = 200;
    const height = 50;

    const bg = this.add.graphics();
    bg.fillStyle(0x49eacb, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);

    const text = this.add.text(0, 0, label, {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "18px",
      color: "#000000",
      fontStyle: "bold",
    });
    text.setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerover", () => container.setScale(1.05));
    container.on("pointerout", () => container.setScale(1));
    container.on("pointerdown", onClick);

    return container;
  }

  // ===========================================================================
  // BUTTON MANAGEMENT
  // ===========================================================================

  /**
   * Enable all move buttons.
   */
  private enableMoveButtons(): void {
    this.moveButtons.forEach((button) => {
      button.setDisabled(false);
      button.setSelected(false);
    });
  }

  /**
   * Disable all move buttons.
   */
  private disableMoveButtons(): void {
    this.moveButtons.forEach((button) => {
      button.setDisabled(true);
    });
  }

  /**
   * Reset move buttons to default state.
   */
  private resetMoveButtons(): void {
    this.moveButtons.forEach((button) => {
      button.setDisabled(false);
      button.setSelected(false);
    });
  }

  // ===========================================================================
  // MATCH MANAGEMENT
  // ===========================================================================

  /**
   * Restart match.
   */
  private restartMatch(): void {
    this.scene.restart(this.config);
  }

  /**
   * Exit practice mode.
   */
  private exitPractice(): void {
    EventBus.off("practice_exit");
    EventBus.off("practice_restart");
    this.scene.start("MainMenuScene");
  }

  /**
   * Scene update loop.
   */
  update(_time: number, _delta: number): void {
    // Update any animated elements
  }
}
