/**
 * FightScene - Main battle arena for KaspaClash
 * Core Phaser scene for 1v1 fighting matches with full combat logic
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { GAME_DIMENSIONS, CHARACTER_POSITIONS, UI_POSITIONS } from "../config";
import { CombatEngine, BASE_MOVE_STATS, getCharacterCombatStats } from "../combat";
import type { MoveType, PlayerRole } from "@/types";
import type { CombatState } from "../combat";

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
  // For reconnection
  isReconnect?: boolean;
  reconnectState?: {
    status: string;
    currentRound: number;
    player1Health: number;
    player2Health: number;
    player1RoundsWon: number;
    player2RoundsWon: number;
    player1Energy: number;
    player2Energy: number;
    moveDeadlineAt: number | null;
    pendingMoves: { player1: boolean; player2: boolean };
  };
}

/**
 * FightScene - The main battle arena with full combat logic.
 */
export class FightScene extends Phaser.Scene {
  // Scene configuration
  private config!: FightSceneConfig;

  // Combat Engine
  private combatEngine!: CombatEngine;

  // UI Elements
  private player1HealthBar!: Phaser.GameObjects.Graphics;
  private player2HealthBar!: Phaser.GameObjects.Graphics;
  private player1EnergyBar!: Phaser.GameObjects.Graphics;
  private player2EnergyBar!: Phaser.GameObjects.Graphics;
  private player1GuardMeter!: Phaser.GameObjects.Graphics;
  private player2GuardMeter!: Phaser.GameObjects.Graphics;
  private roundTimerText!: Phaser.GameObjects.Text;
  private roundScoreText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private narrativeText!: Phaser.GameObjects.Text;
  private turnIndicatorText!: Phaser.GameObjects.Text;

  // Character sprites
  private player1Sprite!: Phaser.GameObjects.Sprite;
  private player2Sprite!: Phaser.GameObjects.Sprite;

  // Move buttons
  private moveButtons: Map<MoveType, Phaser.GameObjects.Container> = new Map();
  private selectedMove: MoveType | null = null;

  // Timer
  private turnTimer: number = 15;
  private timerEvent?: Phaser.Time.TimerEvent;

  // State
  private phase: "countdown" | "selecting" | "resolving" | "round_end" | "match_end" = "countdown";
  private isWaitingForOpponent: boolean = false;
  private moveDeadlineAt: number = 0; // Server-synchronized move deadline timestamp

  // Disconnect handling
  private disconnectOverlay?: Phaser.GameObjects.Container;
  private disconnectTimerText?: Phaser.GameObjects.Text;
  private disconnectTimeoutAt: number = 0;
  private disconnectTimerEvent?: Phaser.Time.TimerEvent;
  private opponentDisconnected: boolean = false;

  // Server-synchronized state (production mode) - all game state comes from server
  private serverState: {
    player1Health: number;
    player1MaxHealth: number;
    player2Health: number;
    player2MaxHealth: number;
    player1Energy: number;
    player1MaxEnergy: number;
    player2Energy: number;
    player2MaxEnergy: number;
    player1GuardMeter: number;
    player2GuardMeter: number;
    player1RoundsWon: number;
    player2RoundsWon: number;
    currentRound: number;
  } | null = null;

  constructor() {
    super({ key: "FightScene" });
  }

  /**
   * Initialize scene with match data.
   */
  init(data: FightSceneConfig): void {
    this.config = { ...data };
    this.resetFullState();
  }

  /**
   * Reset all state for new match.
   */
  private resetFullState(): void {
    this.selectedMove = null;
    this.turnTimer = 15;
    this.phase = "countdown";
    this.opponentDisconnected = false;
    this.disconnectTimeoutAt = 0;
    this.isWaitingForOpponent = false;
    this.serverState = null;
  }

  /**
   * Preload assets.
   */
  preload(): void {
    // Load arena background
    this.load.image("arena-bg", "/assets/background_2.webp");

    // Load character assets
    const characters = ["cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"];
    characters.forEach((charId) => {
      // idle: block-bruiser 305x260, dag-warrior 301x253, hash-hunter 310x234, standard 232x450
      if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_idle`, `/characters/${charId}/idle.webp`, {
          frameWidth: 305,
          frameHeight: 260,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_idle`, `/characters/${charId}/idle.webp`, {
          frameWidth: 301,
          frameHeight: 253,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_idle`, `/characters/${charId}/idle.webp`, {
          frameWidth: 310,
          frameHeight: 234,
        });
      } else {
        this.load.spritesheet(`char_${charId}_idle`, `/characters/${charId}/idle.webp`, {
          frameWidth: 232,
          frameHeight: 450,
        });
      }

      // run: block-bruiser 291x298, dag-warrior 285x211, hash-hunter 275x214, standard 213x287
      if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_run`, `/characters/${charId}/run.webp`, {
          frameWidth: 291,
          frameHeight: 298,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_run`, `/characters/${charId}/run.webp`, {
          frameWidth: 285,
          frameHeight: 211,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_run`, `/characters/${charId}/run.webp`, {
          frameWidth: 275,
          frameHeight: 214,
        });
      } else {
        this.load.spritesheet(`char_${charId}_run`, `/characters/${charId}/run.webp`, {
          frameWidth: 213,
          frameHeight: 287,
        });
      }

      // punch: block-bruiser 318x263, dag-warrior 406x232, hash-hunter 416x233, standard 269x260
      if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_punch`, `/characters/${charId}/punch.webp`, {
          frameWidth: 318,
          frameHeight: 263,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_punch`, `/characters/${charId}/punch.webp`, {
          frameWidth: 406,
          frameHeight: 232,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_punch`, `/characters/${charId}/punch.webp`, {
          frameWidth: 416,
          frameHeight: 233,
        });
      } else {
        this.load.spritesheet(`char_${charId}_punch`, `/characters/${charId}/punch.webp`, {
          frameWidth: 269,
          frameHeight: 260,
        });
      }

      // kick: block-bruiser 477x329, dag-warrior 495x344, hash-hunter 425x295, standard 345x305
      if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_kick`, `/characters/${charId}/kick.webp`, {
          frameWidth: 477,
          frameHeight: 329,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_kick`, `/characters/${charId}/kick.webp`, {
          frameWidth: 495,
          frameHeight: 344,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_kick`, `/characters/${charId}/kick.webp`, {
          frameWidth: 425,
          frameHeight: 295,
        });
      } else {
        this.load.spritesheet(`char_${charId}_kick`, `/characters/${charId}/kick.webp`, {
          frameWidth: 345,
          frameHeight: 305,
        });
      }

      // block: cyber-ninja 391x350, block-bruiser 243x366, dag-warrior 389x277, hash-hunter 360x259
      if (charId === "cyber-ninja") {
        this.load.spritesheet(`char_${charId}_block`, `/characters/${charId}/block.webp`, {
          frameWidth: 391,
          frameHeight: 350,
        });
      } else if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_block`, `/characters/${charId}/block.webp`, {
          frameWidth: 243,
          frameHeight: 366,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_block`, `/characters/${charId}/block.webp`, {
          frameWidth: 389,
          frameHeight: 277,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_block`, `/characters/${charId}/block.webp`, {
          frameWidth: 360,
          frameHeight: 259,
        });
      }

      // special: cyber-ninja 525x426, block-bruiser 583x379, dag-warrior 584x228, hash-hunter 621x302
      if (charId === "cyber-ninja") {
        this.load.spritesheet(`char_${charId}_special`, `/characters/${charId}/special.webp`, {
          frameWidth: 525,
          frameHeight: 426,
        });
      } else if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_special`, `/characters/${charId}/special.webp`, {
          frameWidth: 583,
          frameHeight: 379,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_special`, `/characters/${charId}/special.webp`, {
          frameWidth: 584,
          frameHeight: 228,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_special`, `/characters/${charId}/special.webp`, {
          frameWidth: 621,
          frameHeight: 302,
        });
      }
    });
  }

  /**
   * Create scene elements.
   */
  create(): void {
    // Initialize combat engine
    this.combatEngine = new CombatEngine(
      this.config.player1Character || "dag-warrior",
      this.config.player2Character || "dag-warrior",
      "best_of_5"
    );

    // Create animations
    this.createAnimations();

    // Background
    this.createBackground();

    // Character sprites
    this.createCharacterSprites();

    // UI Elements
    this.createHealthBars();
    this.createEnergyBars();
    this.createGuardMeters();
    this.createRoundTimer();
    this.createRoundScore();
    this.createMoveButtons();
    this.createNarrativeDisplay();
    this.createTurnIndicator();
    this.createCountdownOverlay();

    // Setup event listeners
    this.setupEventListeners();

    // Check if we have reconnect state passed via config
    console.log("[FightScene] create() - checking reconnect config");
    console.log("[FightScene] config.isReconnect:", this.config.isReconnect);
    console.log("[FightScene] config.reconnectState:", this.config.reconnectState);

    if (this.config.isReconnect && this.config.reconnectState) {
      console.log("[FightScene] Reconnect mode - applying server state from config");
      this.handleStateSync(this.config.reconnectState);
    } else {
      // Update UI with initial state and start normally
      console.log("[FightScene] Normal mode - starting fresh");
      this.syncUIWithCombatState();
      this.startRound();
    }

    // Emit scene ready event
    EventBus.emit("scene:ready", this);
  }

  /**
   * Create global animations for characters.
   * idle.png: 36 frames, 232x450 | run.png: 36 frames, 213x287 | punch.png: 36 frames, 269x260
   */
  private createAnimations(): void {
    const characters = ["cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"];

    characters.forEach((charId) => {
      // Idle animation (12fps, loops)
      const idleKey = `char_${charId}_idle`;
      if (this.textures.exists(idleKey)) {
        if (!this.anims.exists(`${charId}_idle`)) {
          this.anims.create({
            key: `${charId}_idle`,
            frames: this.anims.generateFrameNumbers(idleKey, { start: 0, end: 35 }),
            frameRate: 12,
            repeat: -1,
          });
        }
      }

      // Run animation (24fps = 2x speed, loops)
      const runKey = `char_${charId}_run`;
      if (this.textures.exists(runKey)) {
        if (!this.anims.exists(`${charId}_run`)) {
          this.anims.create({
            key: `${charId}_run`,
            frames: this.anims.generateFrameNumbers(runKey, { start: 0, end: 35 }),
            frameRate: 24,
            repeat: -1,
          });
        }
      }

      // Punch animation (24fps = 2x speed, plays once)
      const punchKey = `char_${charId}_punch`;
      if (this.textures.exists(punchKey)) {
        if (!this.anims.exists(`${charId}_punch`)) {
          this.anims.create({
            key: `${charId}_punch`,
            frames: this.anims.generateFrameNumbers(punchKey, { start: 0, end: 35 }),
            frameRate: 24,
            repeat: 0,
          });
        }
      }

      // Kick animation (24fps = 2x speed, plays once)
      const kickKey = `char_${charId}_kick`;
      if (this.textures.exists(kickKey)) {
        if (!this.anims.exists(`${charId}_kick`)) {
          this.anims.create({
            key: `${charId}_kick`,
            frames: this.anims.generateFrameNumbers(kickKey, { start: 0, end: 35 }),
            frameRate: 24,
            repeat: 0,
          });
        }
      }

      // Block animation (specific for cyber-ninja or others with assets)
      const blockKey = `char_${charId}_block`;
      if (this.textures.exists(blockKey)) {
        if (!this.anims.exists(`${charId}_block`)) {
          this.anims.create({
            key: `${charId}_block`,
            frames: this.anims.generateFrameNumbers(blockKey, { start: 0, end: 35 }),
            frameRate: 24,
            repeat: 0,
          });
        }
      }

      // Special animation (specific for cyber-ninja or others with assets)
      const specialKey = `char_${charId}_special`;
      if (this.textures.exists(specialKey)) {
        if (!this.anims.exists(`${charId}_special`)) {
          this.anims.create({
            key: `${charId}_special`,
            frames: this.anims.generateFrameNumbers(specialKey, { start: 0, end: 35 }),
            frameRate: 24,
            repeat: 0,
          });
        }
      }

      // Fallback animations map to idle
      ['block', 'special', 'hurt', 'victory', 'defeat'].forEach(key => {
        // If we already created a real animation (like block above), skip fallback
        if (this.anims.exists(`${charId}_${key}`)) return;

        const fallbackKey = `${charId}_${key}`;
        if (!this.anims.exists(fallbackKey) && this.textures.exists(idleKey)) {
          this.anims.create({
            key: fallbackKey,
            frames: this.anims.generateFrameNumbers(idleKey, { start: 0, end: 35 }),
            frameRate: 12,
            repeat: key === 'block' ? -1 : 0,
          });
        }
      });
    });
  }

  /**
   * Update loop.
   */
  update(_time: number, _delta: number): void {
    if (this.phase === "selecting" && this.roundTimerText) {
      this.roundTimerText.setText(`${Math.ceil(this.turnTimer)}`);
    }
  }

  // ===========================================================================
  // BACKGROUND
  // ===========================================================================

  private createBackground(): void {
    // Use the background image
    if (this.textures.exists("arena-bg")) {
      const bg = this.add.image(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y, "arena-bg");
      // Scale to fit the game dimensions
      bg.setDisplaySize(GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
    } else {
      // Fallback gradient if image not loaded
      const graphics = this.add.graphics();
      graphics.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a1a2e, 0x1a1a2e, 1);
      graphics.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
    }
  }

  // ===========================================================================
  // CHARACTER SPRITES
  // ===========================================================================

  private createCharacterSprites(): void {
    const p1Char = this.config.player1Character || "dag-warrior";
    const p2Char = this.config.player2Character || "dag-warrior";

    // Player 1 sprite (left side)
    // Only use the idle spritesheet we loaded
    const p1TextureKey = `char_${p1Char}_idle`;

    this.player1Sprite = this.add.sprite(
      CHARACTER_POSITIONS.PLAYER1.X,
      CHARACTER_POSITIONS.PLAYER1.Y - 50,  // Raise up a bit from floor
      p1TextureKey
    );

    // Scale down to fit: Standard is 450px -> 0.45 = 202.5px.
    // block-bruiser 0.95, dag-warrior 0.80, hash-hunter 0.90
    const p1Scale = p1Char === "block-bruiser" ? 0.95 : p1Char === "dag-warrior" ? 0.80 : p1Char === "hash-hunter" ? 0.90 : 0.45;
    this.player1Sprite.setScale(p1Scale);  // Scale down to fit
    // Use center origin to prevent bouncing during animation
    this.player1Sprite.setOrigin(0.5, 0.5);
    if (this.anims.exists(`${p1Char}_idle`)) {
      this.player1Sprite.play(`${p1Char}_idle`);
    }

    // Player 2 sprite (right side, flipped)
    // Only use the idle spritesheet we loaded
    const p2TextureKey = `char_${p2Char}_idle`;

    this.player2Sprite = this.add.sprite(
      CHARACTER_POSITIONS.PLAYER2.X,
      CHARACTER_POSITIONS.PLAYER2.Y - 50,  // Raise up a bit from floor
      p2TextureKey
    );

    // Scale down to fit: Standard is 450px -> 0.45 = 202.5px.
    // block-bruiser 0.95, dag-warrior 0.80, hash-hunter 0.90
    const p2Scale = p2Char === "block-bruiser" ? 0.95 : p2Char === "dag-warrior" ? 0.80 : p2Char === "hash-hunter" ? 0.90 : 0.45;
    this.player2Sprite.setScale(p2Scale);  // Scale down to fit
    // Use center origin to prevent bouncing during animation
    this.player2Sprite.setOrigin(0.5, 0.5);
    this.player2Sprite.setFlipX(true);
    if (this.anims.exists(`${p2Char}_idle`)) {
      this.player2Sprite.play(`${p2Char}_idle`);
    }

    // Add identifier above the local player
    this.createPlayerIndicator();
  }

  private createPlayerIndicator(): void {
    const isP1You = this.config.playerRole === "player1";
    const targetSprite = isP1You ? this.player1Sprite : this.player2Sprite;

    // Position above the character
    // Characters are approx 200-250px tall after scaling (450 * 0.45 = ~200)
    const x = targetSprite.x;
    const y = targetSprite.y - 120; // Adjust height based on scaling

    // Create container for the indicator
    const container = this.add.container(x, y);

    // "YOU" text
    const text = this.add.text(0, 0, "YOU", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#22c55e",
      fontStyle: "bold",
      backgroundColor: "#00000080",
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);

    // Arrow pointing down
    const arrow = this.add.text(0, 20, "▼", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#22c55e",
    }).setOrigin(0.5);

    container.add([text, arrow]);

    // Add a simple bobbing animation
    this.tweens.add({
      targets: container,
      y: y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  // ===========================================================================
  // HEALTH BARS
  // ===========================================================================

  private createHealthBars(): void {
    const barWidth = 350;
    const barHeight = 25;

    // Player 1 Health Bar
    this.createHealthBar(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y,
      barWidth,
      barHeight,
      "player1"
    );

    // Player 2 Health Bar
    this.createHealthBar(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y,
      barWidth,
      barHeight,
      "player2"
    );

    // Player labels with character names
    const state = this.combatEngine.getState();

    // Identify local player
    const isP1You = this.config.playerRole === "player1";
    const isP2You = this.config.playerRole === "player2";

    // Highlight local player
    const p1Color = isP1You ? "#22c55e" : "#40e0d0";
    const p2Color = isP2You ? "#22c55e" : "#40e0d0";

    const p1LabelStyle = { fontFamily: "monospace", fontSize: "12px", color: p1Color, fontStyle: isP1You ? "bold" : "normal" };
    const p2LabelStyle = { fontFamily: "monospace", fontSize: "12px", color: p2Color, fontStyle: isP2You ? "bold" : "normal" };

    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y - 18,
      `P1${isP1You ? " (YOU)" : ""}: ${state.player1.characterId.toUpperCase()} (${state.player1.maxHp} HP)`,
      p1LabelStyle
    );

    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X + barWidth,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y - 18,
      `P2${isP2You ? " (YOU)" : ""}: ${state.player2.characterId.toUpperCase()} (${state.player2.maxHp} HP)`,
      { ...p2LabelStyle, align: "right" }
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
    graphics.fillStyle(0x333333, 1);
    graphics.fillRoundedRect(x, y, width, height, 4);
    graphics.lineStyle(2, 0x40e0d0, 1);
    graphics.strokeRoundedRect(x, y, width, height, 4);

    const healthGraphics = this.add.graphics();
    if (player === "player1") {
      this.player1HealthBar = healthGraphics;
    } else {
      this.player2HealthBar = healthGraphics;
    }
  }

  // ===========================================================================
  // ENERGY BARS
  // ===========================================================================

  private createEnergyBars(): void {
    const barWidth = 350;
    const barHeight = 12;
    const yOffset = 30; // Below health bar

    // Player 1 Energy Bar
    this.createEnergyBar(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + yOffset,
      barWidth,
      barHeight,
      "player1"
    );

    // Player 2 Energy Bar
    this.createEnergyBar(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + yOffset,
      barWidth,
      barHeight,
      "player2"
    );

    // Energy labels
    const labelStyle = { fontFamily: "monospace", fontSize: "10px", color: "#3b82f6" };
    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X + barWidth + 5,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + yOffset,
      "EN",
      labelStyle
    );
    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X - 20,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + yOffset,
      "EN",
      labelStyle
    );
  }

  private createEnergyBar(
    x: number,
    y: number,
    width: number,
    height: number,
    player: "player1" | "player2"
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x222222, 1);
    bg.fillRoundedRect(x, y, width, height, 2);
    bg.lineStyle(1, 0x3b82f6, 0.5);
    bg.strokeRoundedRect(x, y, width, height, 2);

    const energyGraphics = this.add.graphics();
    if (player === "player1") {
      this.player1EnergyBar = energyGraphics;
    } else {
      this.player2EnergyBar = energyGraphics;
    }
  }

  // ===========================================================================
  // GUARD METERS
  // ===========================================================================

  private createGuardMeters(): void {
    const barWidth = 350;
    const barHeight = 6;
    const yOffset = 45;

    // Player 1 Guard Meter
    this.createGuardMeter(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + yOffset,
      barWidth,
      barHeight,
      "player1"
    );

    // Player 2 Guard Meter
    this.createGuardMeter(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + yOffset,
      barWidth,
      barHeight,
      "player2"
    );
  }

  private createGuardMeter(
    x: number,
    y: number,
    width: number,
    height: number,
    player: "player1" | "player2"
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x111111, 1);
    bg.fillRect(x, y, width, height);

    const guardGraphics = this.add.graphics();
    if (player === "player1") {
      this.player1GuardMeter = guardGraphics;
    } else {
      this.player2GuardMeter = guardGraphics;
    }
  }

  // ===========================================================================
  // ROUND TIMER
  // ===========================================================================

  private createRoundTimer(): void {
    const timerBg = this.add.graphics();
    timerBg.fillStyle(0x1a1a2e, 0.9);
    timerBg.fillCircle(UI_POSITIONS.TIMER.X, UI_POSITIONS.TIMER.Y, 35);
    timerBg.lineStyle(3, 0x40e0d0, 1);
    timerBg.strokeCircle(UI_POSITIONS.TIMER.X, UI_POSITIONS.TIMER.Y, 35);

    this.roundTimerText = this.add.text(
      UI_POSITIONS.TIMER.X,
      UI_POSITIONS.TIMER.Y,
      "15",
      { fontFamily: "monospace", fontSize: "24px", color: "#40e0d0", fontStyle: "bold" }
    ).setOrigin(0.5);
  }

  // ===========================================================================
  // ROUND SCORE
  // ===========================================================================

  private createRoundScore(): void {
    this.roundScoreText = this.add.text(
      UI_POSITIONS.ROUND_INDICATOR.X,
      UI_POSITIONS.ROUND_INDICATOR.Y,
      "Round 1  •  0 - 0  (First to 3)",
      { fontFamily: "monospace", fontSize: "16px", color: "#ffffff" }
    ).setOrigin(0.5);
  }

  // ===========================================================================
  // MOVE BUTTONS
  // ===========================================================================

  private createMoveButtons(): void {
    const moves: MoveType[] = ["punch", "kick", "block", "special"];
    const buttonWidth = 220;
    const buttonHeight = 120;
    const spacing = 15;
    const totalWidth = moves.length * buttonWidth + (moves.length - 1) * spacing;
    const startX = (GAME_DIMENSIONS.WIDTH - totalWidth) / 2;
    const y = GAME_DIMENSIONS.HEIGHT - 125;

    // Label for player buttons
    this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      y - 30,
      "YOUR MOVE",
      { fontFamily: "monospace", fontSize: "14px", color: "#40e0d0" }
    ).setOrigin(0.5);

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

    const bg = this.add.graphics();
    const baseColor = 0x2d2d44;
    const highlightColor = 0x40e0d0;

    bg.fillStyle(baseColor, 1);
    bg.fillRoundedRect(0, 0, width, height, 8);
    bg.lineStyle(2, highlightColor, 0.5);
    bg.strokeRoundedRect(0, 0, width, height, 8);

    // Move name
    const label = this.add.text(width / 2, 20, move.toUpperCase(), {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#40e0d0",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Damage/info
    const infoText = this.getMoveInfoText(move);
    const info = this.add.text(width / 2, 58, infoText, {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#888888",
      align: "center",
      wordWrap: { width: width - 20 }
    }).setOrigin(0.5);

    // Energy cost
    const cost = BASE_MOVE_STATS[move].energyCost;
    const costText = cost > 0 ? `${cost} EN` : "FREE";
    const costLabel = this.add.text(width / 2, 95, costText, {
      fontFamily: "monospace",
      fontSize: "10px",
      color: cost > 0 ? "#3b82f6" : "#22c55e",
    }).setOrigin(0.5);

    container.add([bg, label, info, costLabel]);

    const hitArea = new Phaser.Geom.Rectangle(0, 0, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on("pointerover", () => {
      if (this.phase === "selecting") {
        bg.clear();
        bg.fillStyle(highlightColor, 0.2);
        bg.fillRoundedRect(0, 0, width, height, 8);
        bg.lineStyle(2, highlightColor, 1);
        bg.strokeRoundedRect(0, 0, width, height, 8);
      }
    });

    container.on("pointerout", () => {
      const selected = this.selectedMove;
      if (selected !== move) {
        bg.clear();
        bg.fillStyle(baseColor, 1);
        bg.fillRoundedRect(0, 0, width, height, 8);
        bg.lineStyle(2, highlightColor, 0.5);
        bg.strokeRoundedRect(0, 0, width, height, 8);
      }
    });

    container.on("pointerdown", () => {
      if (this.phase === "selecting") {
        this.selectMove(move);
      }
    });

    return container;
  }

  private getMoveInfoText(move: MoveType): string {
    const infos: Record<MoveType, string> = {
      punch: "10 DMG • Fast • Beats Special",
      kick: "15 DMG • Medium • Beats Punch",
      block: "Guard • Reflects Kick",
      special: "30 DMG • Slow • Beats Block",
    };
    return infos[move];
  }

  private selectMove(move: MoveType): void {
    // Check if affordable
    if (!this.combatEngine.canAffordMove("player1", move)) {
      this.showFloatingText("Not enough energy!", GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.HEIGHT - 150, "#ff4444");
      return;
    }

    // Deselect previous
    if (this.selectedMove) {
      this.updateButtonState(this.selectedMove, false);
    }

    this.selectedMove = move;
    this.updateButtonState(move, true);

    // Emit event to submit move via API
    this.isWaitingForOpponent = true;
    this.turnIndicatorText.setText("Submitting move...");
    this.turnIndicatorText.setColor("#f97316");

    // Disable buttons while submitting
    this.moveButtons.forEach(btn => btn.setAlpha(0.4).disableInteractive());

    EventBus.emit("game:submitMove", {
      matchId: this.config.matchId,
      moveType: move,
      playerRole: this.config.playerRole,
    });

    // Stop timer - server will send round_resolved when both players submit
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }
  }

  private updateButtonState(move: MoveType, selected: boolean): void {
    const container = this.moveButtons.get(move);
    if (!container) return;

    const bg = container.getAt(0) as Phaser.GameObjects.Graphics;
    const width = 220;
    const height = 120;
    const baseColor = 0x2d2d44;
    const highlightColor = 0x40e0d0;

    bg.clear();
    if (selected) {
      bg.fillStyle(highlightColor, 0.3);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(3, highlightColor, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
    } else {
      bg.fillStyle(baseColor, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(2, highlightColor, 0.5);
      bg.strokeRoundedRect(0, 0, width, height, 8);
    }
  }

  private updateMoveButtonAffordability(): void {
    const moves: MoveType[] = ["punch", "kick", "block", "special"];

    moves.forEach((move) => {
      let canAfford: boolean;

      // Use server state for energy check if available
      if (this.serverState) {
        // Check affordability based on server-provided energy
        // Get player's energy based on their role
        const playerEnergy = this.config.playerRole === "player1"
          ? this.serverState.player1Energy
          : this.serverState.player2Energy;
        const moveCost = BASE_MOVE_STATS[move].energyCost;
        canAfford = playerEnergy >= moveCost;
      } else {
        // Fallback to local engine
        canAfford = this.combatEngine.canAffordMove("player1", move);
      }

      const container = this.moveButtons.get(move);
      if (container) {
        container.setAlpha(canAfford ? 1 : 0.4);
      }
    });
  }

  // ===========================================================================
  // NARRATIVE DISPLAY
  // ===========================================================================

  private createNarrativeDisplay(): void {
    this.narrativeText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y - 80,
      "",
      {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 600 },
      }
    ).setOrigin(0.5).setAlpha(0);
  }

  private createTurnIndicator(): void {
    this.turnIndicatorText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      130,
      "Select your move!",
      { fontFamily: "monospace", fontSize: "14px", color: "#888888" }
    ).setOrigin(0.5);
  }

  // ===========================================================================
  // COUNTDOWN OVERLAY
  // ===========================================================================

  private createCountdownOverlay(): void {
    this.countdownText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y,
      "",
      { fontFamily: "monospace", fontSize: "72px", color: "#40e0d0", fontStyle: "bold" }
    ).setOrigin(0.5).setAlpha(0);
  }

  // ===========================================================================
  // GAME FLOW
  // ===========================================================================

  private startRound(): void {
    this.phase = "countdown";
    this.showCountdown(3);
  }

  private showCountdown(seconds: number): void {
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
                onComplete: () => {
                  this.startSelectionPhase();
                },
              });
            }
          },
        });
      }
    };

    updateCountdown();
  }

  private startSelectionPhase(): void {
    // IMPORTANT: Always destroy existing timer before creating a new one
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    this.phase = "selecting";
    this.selectedMove = null;
    this.turnTimer = 15;
    this.turnIndicatorText.setText("Select your move!");

    // Update button affordability
    this.updateMoveButtonAffordability();

    // Start timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        // Guard: only run if still in selecting phase
        if (this.phase !== "selecting") return;

        this.turnTimer--;
        if (this.turnTimer <= 5) {
          this.roundTimerText.setColor("#ff4444");
        }
        if (this.turnTimer <= 0) {
          this.onTimerExpired();
        }
      },
      repeat: 14,
    });

    // Sync UI
    this.syncUIWithCombatState();
  }

  private onTimerExpired(): void {
    if (this.phase !== "selecting") return;

    // IMPORTANT: Stop the timer immediately to prevent multiple calls
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    // Auto-select punch if no move selected
    if (!this.selectedMove) {
      this.selectedMove = "punch";
    }

    // Submit the auto-selected move to the server
    this.turnIndicatorText.setText("Time's up! Auto-submitting...");
    this.turnIndicatorText.setColor("#ff8800");

    // Disable buttons
    this.moveButtons.forEach(btn => btn.setAlpha(0.4).disableInteractive());

    // Emit the move to the API
    EventBus.emit("game:submitMove", {
      matchId: this.config.matchId,
      moveType: this.selectedMove,
      playerRole: this.config.playerRole,
    });
  }

  private showRoundEnd(state: CombatState): void {
    this.phase = "round_end";

    const winnerText = state.roundWinner === "player1" ? "PLAYER 1 WINS ROUND!" : "PLAYER 2 WINS ROUND!";
    this.countdownText.setText(winnerText);
    this.countdownText.setFontSize(36);
    this.countdownText.setAlpha(1);

    // Update round score
    this.roundScoreText.setText(
      `Round ${state.currentRound}  •  ${state.player1.roundsWon} - ${state.player2.roundsWon}  (First to 3)`
    );

    this.time.delayedCall(2000, () => {
      this.countdownText.setAlpha(0);
      this.countdownText.setFontSize(72);

      // Start new round
      this.combatEngine.startNewRound();
      this.syncUIWithCombatState();
      this.roundScoreText.setText(
        `Round ${this.combatEngine.getState().currentRound}  •  ${state.player1.roundsWon} - ${state.player2.roundsWon}  (First to 3)`
      );
      this.startRound();
    });
  }

  private showMatchEnd(state: CombatState): void {
    this.phase = "match_end";

    const winnerText = state.matchWinner === "player1" ? "PLAYER 1 WINS THE MATCH!" : "PLAYER 2 WINS THE MATCH!";
    this.countdownText.setText(winnerText);
    this.countdownText.setFontSize(32);
    this.countdownText.setColor("#22c55e");
    this.countdownText.setAlpha(1);

    // Play victory/defeat animations
    const p1Char = this.config.player1Character || "dag-warrior";
    const p2Char = this.config.player2Character || "dag-warrior";

    if (state.matchWinner === "player1") {
      if (this.anims.exists(`${p1Char}_victory`)) this.player1Sprite.play(`${p1Char}_victory`);
      if (this.anims.exists(`${p2Char}_defeat`)) this.player2Sprite.play(`${p2Char}_defeat`);
    } else {
      if (this.anims.exists(`${p1Char}_defeat`)) this.player1Sprite.play(`${p1Char}_defeat`);
      if (this.anims.exists(`${p2Char}_victory`)) this.player2Sprite.play(`${p2Char}_victory`);
    }

    // Show rematch button after delay
    this.time.delayedCall(3000, () => {
      this.showRematchButton();
    });
  }

  private showRematchButton(): void {
    const buttonWidth = 200;
    const buttonHeight = 50;
    const x = GAME_DIMENSIONS.CENTER_X;
    const y = GAME_DIMENSIONS.HEIGHT - 200;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x22c55e, 1);
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);

    const text = this.add.text(0, 0, "REMATCH", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(buttonWidth, buttonHeight);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerdown", () => {
      // Restart the scene
      this.scene.restart(this.config);
    });
  }

  // ===========================================================================
  // UI SYNC
  // ===========================================================================

  private syncUIWithCombatState(): void {
    // Prefer server state if available
    if (this.serverState) {
      // Use server-provided state (authoritative)
      this.updateHealthBarDisplay("player1", this.serverState.player1Health, this.serverState.player1MaxHealth);
      this.updateHealthBarDisplay("player2", this.serverState.player2Health, this.serverState.player2MaxHealth);
      this.updateEnergyBarDisplay("player1", this.serverState.player1Energy, this.serverState.player1MaxEnergy);
      this.updateEnergyBarDisplay("player2", this.serverState.player2Energy, this.serverState.player2MaxEnergy);
      this.updateGuardMeterDisplay("player1", this.serverState.player1GuardMeter);
      this.updateGuardMeterDisplay("player2", this.serverState.player2GuardMeter);
    } else {
      // Fallback to local combat engine state
      const state = this.combatEngine.getState();
      this.updateHealthBarDisplay("player1", state.player1.hp, state.player1.maxHp);
      this.updateHealthBarDisplay("player2", state.player2.hp, state.player2.maxHp);
      this.updateEnergyBarDisplay("player1", state.player1.energy, state.player1.maxEnergy);
      this.updateEnergyBarDisplay("player2", state.player2.energy, state.player2.maxEnergy);
      this.updateGuardMeterDisplay("player1", state.player1.guardMeter);
      this.updateGuardMeterDisplay("player2", state.player2.guardMeter);
    }

    // Update timer color
    this.roundTimerText.setColor("#40e0d0");

    // Update move button affordability
    this.updateMoveButtonAffordability();
  }

  private updateHealthBarDisplay(player: "player1" | "player2", hp: number, maxHp: number): void {
    const barWidth = 350;
    const barHeight = 25;
    const healthPercent = Math.max(0, hp) / maxHp;
    const innerWidth = (barWidth - 4) * healthPercent;

    const graphics = player === "player1" ? this.player1HealthBar : this.player2HealthBar;
    const x = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.X : UI_POSITIONS.HEALTH_BAR.PLAYER2.X;
    const y = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.Y : UI_POSITIONS.HEALTH_BAR.PLAYER2.Y;

    graphics.clear();

    let color = 0x00ff88;
    if (healthPercent <= 0.25) color = 0xff4444;
    else if (healthPercent <= 0.5) color = 0xffaa00;

    graphics.fillStyle(color, 1);
    if (player === "player2") {
      graphics.fillRoundedRect(x + 2 + (barWidth - 4 - innerWidth), y + 2, innerWidth, barHeight - 4, 3);
    } else {
      graphics.fillRoundedRect(x + 2, y + 2, innerWidth, barHeight - 4, 3);
    }
  }

  private updateEnergyBarDisplay(player: "player1" | "player2", energy: number, maxEnergy: number): void {
    const barWidth = 350;
    const barHeight = 12;
    const yOffset = 30;
    const energyPercent = Math.max(0, energy) / maxEnergy;
    const innerWidth = (barWidth - 2) * energyPercent;

    const graphics = player === "player1" ? this.player1EnergyBar : this.player2EnergyBar;
    const x = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.X : UI_POSITIONS.HEALTH_BAR.PLAYER2.X;
    const y = (player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.Y : UI_POSITIONS.HEALTH_BAR.PLAYER2.Y) + yOffset;

    graphics.clear();
    graphics.fillStyle(0x3b82f6, 1);

    if (player === "player2") {
      graphics.fillRoundedRect(x + 1 + (barWidth - 2 - innerWidth), y + 1, innerWidth, barHeight - 2, 2);
    } else {
      graphics.fillRoundedRect(x + 1, y + 1, innerWidth, barHeight - 2, 2);
    }
  }

  private updateGuardMeterDisplay(player: "player1" | "player2", guardMeter: number): void {
    const barWidth = 350;
    const barHeight = 6;
    const yOffset = 45;
    const guardPercent = guardMeter / 100;
    const innerWidth = barWidth * guardPercent;

    const graphics = player === "player1" ? this.player1GuardMeter : this.player2GuardMeter;
    const x = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.X : UI_POSITIONS.HEALTH_BAR.PLAYER2.X;
    const y = (player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.Y : UI_POSITIONS.HEALTH_BAR.PLAYER2.Y) + yOffset;

    graphics.clear();

    // Color based on guard level (orange = danger of breaking)
    let color = 0xf97316;
    if (guardPercent >= 0.75) color = 0xef4444;

    graphics.fillStyle(color, 1);
    if (player === "player2") {
      graphics.fillRect(x + (barWidth - innerWidth), y, innerWidth, barHeight);
    } else {
      graphics.fillRect(x, y, innerWidth, barHeight);
    }
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private showFloatingText(text: string, x: number, y: number, color: string): void {
    const floatingText = this.add.text(x, y, text, {
      fontFamily: "monospace",
      fontSize: "24px",
      color: color,
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => floatingText.destroy(),
    });
  }

  private setupEventListeners(): void {
    // Listen for round start (triggered by React wrapper)
    EventBus.onEvent("round:start", ({ roundNumber }) => {
      this.startRound();
    });

    // ========================================
    // PRODUCTION MODE EVENTS (from realtime channel)
    // ========================================

    // Listen for opponent's move submission (show "opponent ready" indicator)
    EventBus.on("game:moveSubmitted", (data: unknown) => {
      const payload = data as { player: string };
      const isOpponentMove =
        (this.config.playerRole === "player1" && payload.player === "player2") ||
        (this.config.playerRole === "player2" && payload.player === "player1");

      if (isOpponentMove) {
        this.isWaitingForOpponent = false;
        this.turnIndicatorText.setText("Opponent locked in!");
        this.turnIndicatorText.setColor("#22c55e");
      }
    });

    // Listen for round resolution (from server combat resolver)
    EventBus.on("game:roundResolved", (data: unknown) => {
      const payload = data as {
        player1: { move: MoveType; damageDealt: number; damageTaken: number };
        player2: { move: MoveType; damageDealt: number; damageTaken: number };
        player1Health: number;
        player2Health: number;
        player1Energy: number;
        player2Energy: number;
        player1GuardMeter: number;
        player2GuardMeter: number;
        roundWinner: "player1" | "player2" | null;
        isRoundOver: boolean;
        isMatchOver: boolean;
        matchWinner: "player1" | "player2" | null;
        narrative: string;
        player1RoundsWon: number;
        player2RoundsWon: number;
      };
      // Update local state from server resolution
      this.handleServerRoundResolved(payload);
    });

    // Listen for match ended (from server)
    EventBus.on("game:matchEnded", (data: unknown) => {
      const payload = data as {
        winner: "player1" | "player2";
        winnerAddress: string;
        reason: string;
      };
      this.phase = "match_end";
      const isWinner =
        (this.config.playerRole === payload.winner);

      this.countdownText.setText(isWinner ? "YOU WIN!" : "YOU LOSE");
      this.countdownText.setFontSize(48);
      this.countdownText.setColor(isWinner ? "#22c55e" : "#ef4444");
      this.countdownText.setAlpha(1);

      this.time.delayedCall(3000, () => {
        // Construct detailed result from server state + payload
        const result = {
          winner: payload.winner,
          reason: (payload.reason as any),
          player1FinalHealth: this.serverState?.player1Health ?? 0,
          player2FinalHealth: this.serverState?.player2Health ?? 0,
          player1RoundsWon: this.serverState?.player1RoundsWon ?? 0,
          player2RoundsWon: this.serverState?.player2RoundsWon ?? 0,
          txIds: [],
        };

        // Emit for React components (optional)
        EventBus.emit("match:ended", { result });

        // Transition to ResultsScene
        this.scene.start("ResultsScene", {
          result,
          playerRole: this.config.playerRole,
          matchId: this.config.matchId,
          player1CharacterId: this.config.player1Character,
          player2CharacterId: this.config.player2Character,
        });
      });
    });

    // Listen for round starting (synchronized timing from server)
    EventBus.on("game:roundStarting", (data: unknown) => {
      const payload = data as {
        roundNumber: number;
        turnNumber: number;
        moveDeadlineAt: number;
        countdownSeconds: number;
        player1Health: number;
        player2Health: number;
        player1Energy: number;
        player2Energy: number;
        player1GuardMeter: number;
        player2GuardMeter: number;
      };
      this.startRoundFromServer(payload);
    });

    // Listen for opponent move rejection
    EventBus.on("game:moveRejected", (data: unknown) => {
      const payload = data as { player: "player1" | "player2"; rejectedAt: number };

      // Only show message if opponent rejected (not us)
      if (payload.player !== this.config.playerRole) {
        this.turnIndicatorText.setText("Opponent rejected transaction!");
        this.turnIndicatorText.setColor("#f97316");
        this.showFloatingText("OPPONENT REJECTED!", GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y - 50, "#f97316");
      }
    });

    // Listen for match cancellation (both players rejected)
    EventBus.on("game:matchCancelled", (data: unknown) => {
      const payload = data as { matchId: string; reason: string; message: string; redirectTo: string };

      this.phase = "match_end";

      // Stop any running timer
      if (this.timerEvent) {
        this.timerEvent.destroy();
        this.timerEvent = undefined;
      }

      // Show cancellation message
      this.countdownText.setText("MATCH CANCELLED");
      this.countdownText.setFontSize(36);
      this.countdownText.setColor("#f97316");
      this.countdownText.setAlpha(1);

      this.narrativeText.setText("Both players rejected transactions.\nRedirecting to matchmaking...");
      this.narrativeText.setAlpha(1);

      // Disable all buttons
      this.moveButtons.forEach(btn => btn.setAlpha(0.3).disableInteractive());
    });

    // Listen for opponent disconnect
    EventBus.on("game:playerDisconnected", (data: unknown) => {
      const payload = data as {
        player: "player1" | "player2";
        address: string;
        disconnectedAt: number;
        timeoutSeconds: number;
      };

      // Only show overlay if opponent disconnected
      if (payload.player !== this.config.playerRole) {
        this.showDisconnectOverlay(payload.timeoutSeconds);
      }
    });

    // Listen for opponent reconnect
    EventBus.on("game:playerReconnected", (data: unknown) => {
      const payload = data as {
        player: "player1" | "player2";
        address: string;
        reconnectedAt: number;
      };

      // Only hide overlay if it was the opponent who reconnected
      if (payload.player !== this.config.playerRole) {
        this.hideDisconnectOverlay();
      }
    });

    // Listen for state sync (reconnection)
    EventBus.on("game:stateSync", (data: unknown) => {
      const state = data as {
        status: string;
        currentRound: number;
        player1Health: number;
        player2Health: number;
        player1RoundsWon: number;
        player2RoundsWon: number;
        player1Energy: number;
        player2Energy: number;
        moveDeadlineAt: number | null;
        pendingMoves: { player1: boolean; player2: boolean };
      };
      this.handleStateSync(state);
    });
  }

  /**
   * Show disconnect overlay with countdown.
   */
  private showDisconnectOverlay(timeoutSeconds: number): void {
    this.opponentDisconnected = true;
    this.disconnectTimeoutAt = Date.now() + timeoutSeconds * 1000;

    // Create overlay if it doesn't exist
    if (!this.disconnectOverlay) {
      this.disconnectOverlay = this.add.container(0, 0);
      this.disconnectOverlay.setDepth(1000);

      // Semi-transparent background
      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0.7);
      bg.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
      this.disconnectOverlay.add(bg);

      // Title
      const title = this.add.text(
        GAME_DIMENSIONS.CENTER_X,
        GAME_DIMENSIONS.CENTER_Y - 80,
        "OPPONENT DISCONNECTED",
        {
          fontFamily: "Orbitron, sans-serif",
          fontSize: "32px",
          color: "#f97316",
          fontStyle: "bold",
        }
      ).setOrigin(0.5);
      this.disconnectOverlay.add(title);

      // Timer text
      this.disconnectTimerText = this.add.text(
        GAME_DIMENSIONS.CENTER_X,
        GAME_DIMENSIONS.CENTER_Y,
        `Waiting for reconnection: ${timeoutSeconds}s`,
        {
          fontFamily: "Orbitron, sans-serif",
          fontSize: "24px",
          color: "#ffffff",
        }
      ).setOrigin(0.5);
      this.disconnectOverlay.add(this.disconnectTimerText);

      // Info text
      const info = this.add.text(
        GAME_DIMENSIONS.CENTER_X,
        GAME_DIMENSIONS.CENTER_Y + 60,
        "If opponent doesn't return, you win!",
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#888888",
        }
      ).setOrigin(0.5);
      this.disconnectOverlay.add(info);
    }

    this.disconnectOverlay.setVisible(true);

    // Start countdown timer
    if (this.disconnectTimerEvent) {
      this.disconnectTimerEvent.destroy();
    }

    this.disconnectTimerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        const remaining = Math.max(0, Math.ceil((this.disconnectTimeoutAt - Date.now()) / 1000));

        if (this.disconnectTimerText) {
          this.disconnectTimerText.setText(`Waiting for reconnection: ${remaining}s`);
        }

        if (remaining <= 0) {
          // Timeout expired - claim victory
          this.handleDisconnectTimeout();
        }
      },
      loop: true,
    });
  }

  /**
   * Hide disconnect overlay (opponent reconnected).
   */
  private hideDisconnectOverlay(): void {
    this.opponentDisconnected = false;

    if (this.disconnectTimerEvent) {
      this.disconnectTimerEvent.destroy();
      this.disconnectTimerEvent = undefined;
    }

    if (this.disconnectOverlay) {
      this.disconnectOverlay.setVisible(false);
    }

    // Show reconnection message
    this.showFloatingText("Opponent reconnected!", GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y - 50, "#22c55e");
  }

  /**
   * Handle disconnect timeout - claim victory.
   */
  private handleDisconnectTimeout(): void {
    if (this.disconnectTimerEvent) {
      this.disconnectTimerEvent.destroy();
      this.disconnectTimerEvent = undefined;
    }

    // Update overlay to show claiming victory
    if (this.disconnectTimerText) {
      this.disconnectTimerText.setText("Claiming victory...");
    }

    // Call timeout API to claim victory
    EventBus.emit("game:claimTimeoutVictory", {
      matchId: this.config.matchId,
    });
  }

  /**
   * Handle state sync for reconnection.
   */
  private handleStateSync(state: {
    status: string;
    currentRound: number;
    player1Health: number;
    player2Health: number;
    player1RoundsWon: number;
    player2RoundsWon: number;
    player1Energy: number;
    player2Energy: number;
    moveDeadlineAt: number | null;
    pendingMoves: { player1: boolean; player2: boolean };
  }): void {
    console.log("[FightScene] Restoring state from sync:", state);

    // Get max values from local engine for defaults
    const localState = this.combatEngine.getState();

    // Update server state
    this.serverState = {
      player1Health: state.player1Health,
      player1MaxHealth: localState.player1.maxHp,
      player2Health: state.player2Health,
      player2MaxHealth: localState.player2.maxHp,
      player1Energy: state.player1Energy,
      player1MaxEnergy: localState.player1.maxEnergy,
      player2Energy: state.player2Energy,
      player2MaxEnergy: localState.player2.maxEnergy,
      player1GuardMeter: 0,
      player2GuardMeter: 0,
      player1RoundsWon: state.player1RoundsWon,
      player2RoundsWon: state.player2RoundsWon,
      currentRound: state.currentRound,
    };

    // Update UI
    this.syncUIWithCombatState();
    this.roundScoreText.setText(
      `Round ${state.currentRound}  •  ${state.player1RoundsWon} - ${state.player2RoundsWon}  (First to 3)`
    );

    // If there's an active move deadline, start/continue the selection phase
    console.log("[FightScene] handleStateSync - checking deadline:");
    console.log("[FightScene]   moveDeadlineAt:", state.moveDeadlineAt);
    console.log("[FightScene]   Date.now():", Date.now());
    console.log("[FightScene]   deadline > now?:", state.moveDeadlineAt ? state.moveDeadlineAt > Date.now() : false);
    console.log("[FightScene]   pendingMoves:", state.pendingMoves);
    console.log("[FightScene]   playerRole:", this.config.playerRole);

    if (state.moveDeadlineAt && state.moveDeadlineAt > Date.now()) {
      const myRole = this.config.playerRole;
      const hasPendingMove = myRole === "player1" ? state.pendingMoves.player1 : state.pendingMoves.player2;

      console.log("[FightScene]   hasPendingMove:", hasPendingMove);

      if (hasPendingMove) {
        // We already submitted a move - wait for opponent
        console.log("[FightScene] Decision: Already submitted move, waiting for opponent");
        this.phase = "selecting";
        this.isWaitingForOpponent = true;
        this.turnIndicatorText.setText("Waiting for opponent...");
        this.turnIndicatorText.setColor("#f97316");
        this.moveButtons.forEach(btn => btn.setAlpha(0.4).disableInteractive());
      } else {
        // We need to make a move - start synchronized selection with server deadline
        console.log("[FightScene] Decision: Need to make move, starting synchronized selection phase");
        this.startSynchronizedSelectionPhase(state.moveDeadlineAt);
      }
    } else {
      // No active deadline - start a fresh round countdown
      console.log("[FightScene] Decision: No active deadline, starting fresh round");
      this.startRound();
    }
  }

  /**
   * Start round from server broadcast (production mode - synchronized timing).
   */
  private startRoundFromServer(payload: {
    roundNumber: number;
    turnNumber: number;
    moveDeadlineAt: number;
    countdownSeconds: number;
    player1Health: number;
    player2Health: number;
    player1MaxHealth?: number;
    player2MaxHealth?: number;
    player1Energy: number;
    player2Energy: number;
    player1MaxEnergy?: number;
    player2MaxEnergy?: number;
    player1GuardMeter: number;
    player2GuardMeter: number;
  }): void {
    // Stop any existing timer
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    // Store the deadline for synchronized timing
    this.moveDeadlineAt = payload.moveDeadlineAt;

    // Get max values from local engine initially (server should provide these)
    const localState = this.combatEngine.getState();

    // Store server state (authoritative)
    this.serverState = {
      player1Health: payload.player1Health,
      player1MaxHealth: payload.player1MaxHealth ?? localState.player1.maxHp,
      player2Health: payload.player2Health,
      player2MaxHealth: payload.player2MaxHealth ?? localState.player2.maxHp,
      player1Energy: payload.player1Energy,
      player1MaxEnergy: payload.player1MaxEnergy ?? localState.player1.maxEnergy,
      player2Energy: payload.player2Energy,
      player2MaxEnergy: payload.player2MaxEnergy ?? localState.player2.maxEnergy,
      player1GuardMeter: payload.player1GuardMeter,
      player2GuardMeter: payload.player2GuardMeter,
      player1RoundsWon: this.serverState?.player1RoundsWon ?? 0,
      player2RoundsWon: this.serverState?.player2RoundsWon ?? 0,
      currentRound: payload.roundNumber,
    };

    // Update UI with server state
    this.syncUIWithCombatState();

    // Show countdown then start selection with synchronized timer
    this.phase = "countdown";
    this.showCountdownThenSync(payload.countdownSeconds, payload.moveDeadlineAt);
  }

  /**
   * Show countdown then start synchronized selection phase.
   */
  private showCountdownThenSync(countdownSeconds: number, moveDeadlineAt: number): void {
    let count = countdownSeconds;

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
                onComplete: () => {
                  this.startSynchronizedSelectionPhase(moveDeadlineAt);
                },
              });
            }
          },
        });
      } else {
        // No countdown, start immediately
        this.startSynchronizedSelectionPhase(moveDeadlineAt);
      }
    };

    updateCountdown();
  }

  /**
   * Start selection phase with synchronized timer from server deadline.
   */
  private startSynchronizedSelectionPhase(moveDeadlineAt: number): void {
    // IMPORTANT: Always destroy existing timer before creating a new one
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    this.phase = "selecting";
    this.selectedMove = null;
    this.isWaitingForOpponent = false;
    this.turnIndicatorText.setText("Select your move!");
    this.turnIndicatorText.setColor("#40e0d0");

    // Update button affordability
    this.updateMoveButtonAffordability();

    // Re-enable move buttons and reset their visual state
    this.moveButtons.forEach((btn, move) => {
      btn.setAlpha(1).setInteractive();
      // Reset visual state to unselected/unhovered
      this.updateButtonState(move, false);
    });

    // Calculate initial remaining time from server deadline
    const remainingMs = moveDeadlineAt - Date.now();
    this.turnTimer = Math.max(1, Math.floor(remainingMs / 1000));

    // Start synchronized timer that updates every second based on deadline
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        // Guard: only run if still in selecting phase
        if (this.phase !== "selecting") return;

        const nowRemainingMs = moveDeadlineAt - Date.now();
        this.turnTimer = Math.max(0, Math.floor(nowRemainingMs / 1000));

        this.roundTimerText.setText(`${this.turnTimer}s`);
        if (this.turnTimer <= 5) {
          this.roundTimerText.setColor("#ff4444");
        } else {
          this.roundTimerText.setColor("#40e0d0");
        }

        if (this.turnTimer <= 0 && !this.selectedMove) {
          this.onTimerExpired();
        }
      },
      loop: true,
    });

    // Update initial display
    this.roundTimerText.setText(`${this.turnTimer}s`);
    this.roundTimerText.setColor("#40e0d0");
  }

  /**
   * Handle server-resolved round (production mode).
   */
  private handleServerRoundResolved(payload: {
    player1: { move: MoveType; damageDealt: number; damageTaken: number };
    player2: { move: MoveType; damageDealt: number; damageTaken: number };
    player1Health: number;
    player2Health: number;
    player1MaxHealth?: number;
    player2MaxHealth?: number;
    player1Energy: number;
    player2Energy: number;
    player1MaxEnergy?: number;
    player2MaxEnergy?: number;
    player1GuardMeter: number;
    player2GuardMeter: number;
    roundWinner: "player1" | "player2" | null;
    isRoundOver: boolean;
    isMatchOver: boolean;
    matchWinner: "player1" | "player2" | null;
    narrative: string;
    player1RoundsWon: number;
    player2RoundsWon: number;
  }): void {
    this.phase = "resolving";

    // Stop timer
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    // Get max values from local engine for fallback (server should provide these)
    const localState = this.combatEngine.getState();

    // Store server state (authoritative)
    this.serverState = {
      player1Health: payload.player1Health,
      player1MaxHealth: payload.player1MaxHealth ?? localState.player1.maxHp,
      player2Health: payload.player2Health,
      player2MaxHealth: payload.player2MaxHealth ?? localState.player2.maxHp,
      player1Energy: payload.player1Energy,
      player1MaxEnergy: payload.player1MaxEnergy ?? localState.player1.maxEnergy,
      player2Energy: payload.player2Energy,
      player2MaxEnergy: payload.player2MaxEnergy ?? localState.player2.maxEnergy,
      player1GuardMeter: payload.player1GuardMeter,
      player2GuardMeter: payload.player2GuardMeter,
      player1RoundsWon: payload.player1RoundsWon,
      player2RoundsWon: payload.player2RoundsWon,
      currentRound: this.serverState?.currentRound ?? 1,
    };

    const p1Char = this.config.player1Character || "dag-warrior";
    const p2Char = this.config.player2Character || "dag-warrior";

    // Scale constants to maintain consistent visual size
    // Base: idle is 232x450, we use 0.45 scale
    // Each animation has different frame sizes AND the character fills different amounts of each frame
    // These values need visual tuning to match the idle character size
    const IDLE_SCALE = 0.45;
    const RUN_SCALE = 0.71;      // run is 213x287
    const PUNCH_SCALE = 0.78;    // punch is 269x260
    const KICK_SCALE = 0.75;    // kick is 345x305
    const BLOCK_SCALE = 0.80;    // block is 391x350 - increased for visual match
    const SPECIAL_SCALE = 0.80;  // special is 384x309 - increased for visual match

    // Block Bruiser specific scales (idle is 260px height at 0.95 scale = 247px displayed)
    // All scales calculated to match: targetHeight / frameHeight = scale
    const BB_IDLE_SCALE = 0.95;     // 260px * 0.95 = 247px
    const BB_RUN_SCALE = 0.90;      // 298px * 0.90 = 269px
    const BB_PUNCH_SCALE = 0.94;    // 263px * 0.94 = 247px
    const BB_KICK_SCALE = 0.90;     // 329px * 0.75 = 247px
    const BB_BLOCK_SCALE = 0.90;   // 366px * 0.80 = 247px
    const BB_SPECIAL_SCALE = 0.90;  // 379px * 0.80 = 247px

    // DAG Warrior specific scales (idle is 253px height at 0.80 scale = 202px displayed)
    const DW_IDLE_SCALE = 0.90;     // 253px * 0.80 = 202px
    const DW_RUN_SCALE = 0.96;      // 211px * 0.96 = 202px
    const DW_PUNCH_SCALE = 0.90;    // 232px * 0.87 = 202px
    const DW_KICK_SCALE = 0.90;     // 344px * 0.59 = 203px
    const DW_BLOCK_SCALE = 0.90;    // 277px * 0.73 = 202px
    const DW_SPECIAL_SCALE = 0.90;  // 228px * 0.89 = 203px

    // Hash Hunter specific scales (all 0.90 for consistent sizing)
    const HH_IDLE_SCALE = 0.90;
    const HH_RUN_SCALE = 0.90;
    const HH_PUNCH_SCALE = 0.90;
    const HH_KICK_SCALE = 0.90;
    const HH_BLOCK_SCALE = 0.90;
    const HH_SPECIAL_SCALE = 0.90;

    // Store original positions
    const p1OriginalX = CHARACTER_POSITIONS.PLAYER1.X;
    const p2OriginalX = CHARACTER_POSITIONS.PLAYER2.X;
    const meetingPointX = GAME_DIMENSIONS.CENTER_X;

    // Phase 1: Both characters run toward center with run scale
    if (this.anims.exists(`${p1Char}_run`)) {
      const p1RunScale = p1Char === "block-bruiser" ? BB_RUN_SCALE : p1Char === "dag-warrior" ? DW_RUN_SCALE : p1Char === "hash-hunter" ? HH_RUN_SCALE : RUN_SCALE;
      this.player1Sprite.setScale(p1RunScale);
      this.player1Sprite.play(`${p1Char}_run`);
    }
    if (this.anims.exists(`${p2Char}_run`)) {
      const p2RunScale = p2Char === "block-bruiser" ? BB_RUN_SCALE : p2Char === "dag-warrior" ? DW_RUN_SCALE : p2Char === "hash-hunter" ? HH_RUN_SCALE : RUN_SCALE;
      this.player2Sprite.setScale(p2RunScale);
      this.player2Sprite.play(`${p2Char}_run`);
    }

    // Tween both characters toward center
    this.tweens.add({
      targets: this.player1Sprite,
      x: meetingPointX - 50,
      duration: 600,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: this.player2Sprite,
      x: meetingPointX + 50,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        // Phase 2: Both characters attack with their selected move
        const p1Move = payload.player1.move;
        const p2Move = payload.player2.move;

        // Player 1 attack animation
        console.log("[DEBUG P1] move:", p1Move, "char:", p1Char,
          "block exists:", this.anims.exists(`${p1Char}_block`),
          "special exists:", this.anims.exists(`${p1Char}_special`));

        if (p1Move === "kick" && this.anims.exists(`${p1Char}_kick`)) {
          const kickScale = p1Char === "block-bruiser" ? BB_KICK_SCALE : p1Char === "dag-warrior" ? DW_KICK_SCALE : p1Char === "hash-hunter" ? HH_KICK_SCALE : KICK_SCALE;
          this.player1Sprite.setScale(kickScale);
          this.player1Sprite.play(`${p1Char}_kick`);
        } else if (p1Move === "punch" && this.anims.exists(`${p1Char}_punch`)) {
          const punchScale = p1Char === "block-bruiser" ? BB_PUNCH_SCALE : p1Char === "dag-warrior" ? DW_PUNCH_SCALE : p1Char === "hash-hunter" ? HH_PUNCH_SCALE : PUNCH_SCALE;
          this.player1Sprite.setScale(punchScale);
          this.player1Sprite.play(`${p1Char}_punch`);
        } else if (p1Move === "block" && this.anims.exists(`${p1Char}_block`)) {
          const blockScale = p1Char === "block-bruiser" ? BB_BLOCK_SCALE : p1Char === "dag-warrior" ? DW_BLOCK_SCALE : p1Char === "hash-hunter" ? HH_BLOCK_SCALE : BLOCK_SCALE;
          console.log("[DEBUG P1] Playing BLOCK with scale:", blockScale);
          this.player1Sprite.setScale(blockScale);
          this.player1Sprite.play(`${p1Char}_block`);
        } else if (p1Move === "special" && this.anims.exists(`${p1Char}_special`)) {
          const specialScale = p1Char === "block-bruiser" ? BB_SPECIAL_SCALE : p1Char === "dag-warrior" ? DW_SPECIAL_SCALE : p1Char === "hash-hunter" ? HH_SPECIAL_SCALE : SPECIAL_SCALE;
          console.log("[DEBUG P1] Playing SPECIAL with scale:", specialScale);
          this.player1Sprite.setScale(specialScale);
          this.player1Sprite.play(`${p1Char}_special`);
        } else if (this.anims.exists(`${p1Char}_${p1Move}`)) {
          console.log("[DEBUG P1] Playing FALLBACK:", `${p1Char}_${p1Move}`);
          this.player1Sprite.play(`${p1Char}_${p1Move}`);
        }

        // Player 2 attack animation
        if (p2Move === "kick" && this.anims.exists(`${p2Char}_kick`)) {
          const kickScale = p2Char === "block-bruiser" ? BB_KICK_SCALE : p2Char === "dag-warrior" ? DW_KICK_SCALE : p2Char === "hash-hunter" ? HH_KICK_SCALE : KICK_SCALE;
          this.player2Sprite.setScale(kickScale);
          this.player2Sprite.play(`${p2Char}_kick`);
        } else if (p2Move === "punch" && this.anims.exists(`${p2Char}_punch`)) {
          const punchScale = p2Char === "block-bruiser" ? BB_PUNCH_SCALE : p2Char === "dag-warrior" ? DW_PUNCH_SCALE : p2Char === "hash-hunter" ? HH_PUNCH_SCALE : PUNCH_SCALE;
          this.player2Sprite.setScale(punchScale);
          this.player2Sprite.play(`${p2Char}_punch`);
        } else if (p2Move === "block" && this.anims.exists(`${p2Char}_block`)) {
          const blockScale = p2Char === "block-bruiser" ? BB_BLOCK_SCALE : p2Char === "dag-warrior" ? DW_BLOCK_SCALE : p2Char === "hash-hunter" ? HH_BLOCK_SCALE : BLOCK_SCALE;
          this.player2Sprite.setScale(blockScale);
          this.player2Sprite.play(`${p2Char}_block`);
        } else if (p2Move === "special" && this.anims.exists(`${p2Char}_special`)) {
          const specialScale = p2Char === "block-bruiser" ? BB_SPECIAL_SCALE : p2Char === "dag-warrior" ? DW_SPECIAL_SCALE : p2Char === "hash-hunter" ? HH_SPECIAL_SCALE : SPECIAL_SCALE;
          this.player2Sprite.setScale(specialScale);
          this.player2Sprite.play(`${p2Char}_special`);
        } else if (this.anims.exists(`${p2Char}_${p2Move}`)) {
          this.player2Sprite.play(`${p2Char}_${p2Move}`);
        }

        // Show narrative
        this.narrativeText.setText(payload.narrative);
        this.narrativeText.setAlpha(1);

        // Delay damage effects until attack animation lands
        // 36 frames at 24fps = 1.5s, show damage around 1s into the animation
        this.time.delayedCall(1000, () => {
          // Show damage numbers
          if (payload.player2.damageTaken > 0) {
            this.showFloatingText(`-${payload.player2.damageTaken}`, meetingPointX + 50, CHARACTER_POSITIONS.PLAYER2.Y - 130, "#ff4444");
          }
          if (payload.player1.damageTaken > 0) {
            this.showFloatingText(`-${payload.player1.damageTaken}`, meetingPointX - 50, CHARACTER_POSITIONS.PLAYER1.Y - 130, "#ff4444");
          }

          // Update health bars when the attack lands
          this.syncUIWithCombatState();
          this.roundScoreText.setText(
            `Round ${this.serverState?.currentRound ?? 1}  •  ${payload.player1RoundsWon} - ${payload.player2RoundsWon}  (First to 3)`
          );
        });

        // Phase 3: After attack animation completes (1.5s), run back to original positions
        this.time.delayedCall(1600, () => {
          if (this.anims.exists(`${p1Char}_run`)) {
            const p1RunScale = p1Char === "block-bruiser" ? BB_RUN_SCALE : p1Char === "dag-warrior" ? DW_RUN_SCALE : p1Char === "hash-hunter" ? HH_RUN_SCALE : RUN_SCALE;
            this.player1Sprite.setScale(p1RunScale);
            this.player1Sprite.play(`${p1Char}_run`);
          }
          if (this.anims.exists(`${p2Char}_run`)) {
            const p2RunScale = p2Char === "block-bruiser" ? BB_RUN_SCALE : p2Char === "dag-warrior" ? DW_RUN_SCALE : p2Char === "hash-hunter" ? HH_RUN_SCALE : RUN_SCALE;
            this.player2Sprite.setScale(p2RunScale);
            this.player2Sprite.play(`${p2Char}_run`);
          }

          // Tween back to original positions
          this.tweens.add({
            targets: this.player1Sprite,
            x: p1OriginalX,
            duration: 600,
            ease: 'Power2',
          });

          this.tweens.add({
            targets: this.player2Sprite,
            x: p2OriginalX,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
              // Phase 4: Return to idle animations with idle scale
              if (this.anims.exists(`${p1Char}_idle`)) {
                const p1IdleScale = p1Char === "block-bruiser" ? BB_IDLE_SCALE : p1Char === "dag-warrior" ? DW_IDLE_SCALE : p1Char === "hash-hunter" ? HH_IDLE_SCALE : IDLE_SCALE;
                this.player1Sprite.setScale(p1IdleScale);
                this.player1Sprite.play(`${p1Char}_idle`);
              }
              if (this.anims.exists(`${p2Char}_idle`)) {
                const p2IdleScale = p2Char === "block-bruiser" ? BB_IDLE_SCALE : p2Char === "dag-warrior" ? DW_IDLE_SCALE : p2Char === "hash-hunter" ? HH_IDLE_SCALE : IDLE_SCALE;
                this.player2Sprite.setScale(p2IdleScale);
                this.player2Sprite.play(`${p2Char}_idle`);
              }

              // Fade out narrative
              this.tweens.add({
                targets: this.narrativeText,
                alpha: 0,
                duration: 300,
              });

              // Handle round/match end
              if (payload.isMatchOver) {
                // Match end will be handled by game:matchEnded event
              } else if (payload.isRoundOver) {
                this.showRoundEndFromServer(payload.roundWinner, payload.player1RoundsWon, payload.player2RoundsWon);
              } else {
                // Wait for server's round_starting event
                this.selectedMove = null;
                this.turnIndicatorText.setText("Waiting for next turn...");
                this.turnIndicatorText.setColor("#888888");
              }
            },
          });
        });
      },
    });
  }

  /**
   * Show round end from server data (production mode).
   */
  private showRoundEndFromServer(
    roundWinner: "player1" | "player2" | null,
    p1Wins: number,
    p2Wins: number
  ): void {
    this.phase = "round_end";

    const isLocalWinner = roundWinner === this.config.playerRole;
    const winnerText = isLocalWinner ? "YOU WIN ROUND!" : "YOU LOSE ROUND";

    this.countdownText.setText(winnerText);
    this.countdownText.setFontSize(36);
    this.countdownText.setColor(isLocalWinner ? "#22c55e" : "#ef4444");
    this.countdownText.setAlpha(1);

    this.time.delayedCall(2000, () => {
      this.countdownText.setAlpha(0);
      this.countdownText.setFontSize(72);

      // In production mode, DON'T call local startRound() - wait for server's round_starting event
      // The server broadcasts round_starting with synchronized deadline after round_resolved
      // We just need to show "waiting" state until that event arrives
      this.turnIndicatorText.setText("Starting next round...");
      this.turnIndicatorText.setColor("#888888");

      // Reset selected move for next round
      this.selectedMove = null;
    });
  }
}

export default FightScene;
