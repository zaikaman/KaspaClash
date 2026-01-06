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
  // For spectator mode
  isSpectator?: boolean;
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
  // Move selection
  private selectedMove: MoveType | null = null;

  // Timer
  private turnTimer: number = 15;
  private timerEvent?: Phaser.Time.TimerEvent;

  // State
  private phase: "waiting" | "countdown" | "selecting" | "resolving" | "round_end" | "match_end" = "waiting";
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
    // Stun state - if true, player cannot act this turn
    player1IsStunned?: boolean;
    player2IsStunned?: boolean;
  } | null = null;

  // Pending round start payload (queued if received during round_end phase)
  private pendingRoundStart: {
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
    player1IsStunned?: boolean;
    player2IsStunned?: boolean;
  } | null = null;

  // Visibility change handler reference for cleanup
  private visibilityChangeHandler: (() => void) | null = null;

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

    // Load move icons
    this.load.image("move_punch", "/assets/icons/punch.webp");
    this.load.image("move_kick", "/assets/icons/kick.webp");
    this.load.image("move_block", "/assets/icons/block.webp");
    this.load.image("move_special", "/assets/icons/special.webp");

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

      // dead: block-bruiser 551x380, cyber-ninja 408x305, dag-warrior 539x325, hash-hunter 513x248
      if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_dead`, `/characters/${charId}/dead.webp`, {
          frameWidth: 551,
          frameHeight: 380,
        });
      } else if (charId === "cyber-ninja") {
        this.load.spritesheet(`char_${charId}_dead`, `/characters/${charId}/dead.webp`, {
          frameWidth: 408,
          frameHeight: 305,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_dead`, `/characters/${charId}/dead.webp`, {
          frameWidth: 539,
          frameHeight: 325,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_dead`, `/characters/${charId}/dead.webp`, {
          frameWidth: 513,
          frameHeight: 248,
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

    // UI - Settings and Dialogs
    this.settingsContainer = this.add.container(0, 0);
    this.createSettingsButton();
    this.createSettingsMenu(); // Create hidden menu

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
      // Update UI with initial state
      console.log("[FightScene] Normal mode - waiting for server round_starting event");
      this.syncUIWithCombatState();

      // Don't start a client-side timer - wait for server's round_starting event
      // which includes moveDeadlineAt for synchronized timing across both players.
      // The server broadcasts round_starting when match_starting is sent.
      this.phase = "waiting";
      this.turnIndicatorText.setText("Waiting for round to start...");
      this.turnIndicatorText.setColor("#f97316");
      this.roundTimerText.setText("--");

      // Request round state from MatchGameClient in case we missed the broadcast
      // MatchGameClient will respond with game:roundStarting if the match is ready
      console.log("[FightScene] Requesting round state from MatchGameClient");
      EventBus.emit("fight:requestRoundState", { matchId: this.config.matchId });
    }

    // Set up visibility change handler to resync timer when tab becomes visible
    this.setupVisibilityHandler();

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
      // Idle animation (24fps, loops)
      const idleKey = `char_${charId}_idle`;
      if (this.textures.exists(idleKey)) {
        if (!this.anims.exists(`${charId}_idle`)) {
          this.anims.create({
            key: `${charId}_idle`,
            frames: this.anims.generateFrameNumbers(idleKey, { start: 0, end: 35 }),
            frameRate: 24,
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

      // Dead animation (24fps, plays once)
      const deadKey = `char_${charId}_dead`;
      if (this.textures.exists(deadKey)) {
        if (!this.anims.exists(`${charId}_dead`)) {
          this.anims.create({
            key: `${charId}_dead`,
            frames: this.anims.generateFrameNumbers(deadKey, { start: 0, end: 35 }),
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
            frameRate: 24,
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
  // VISIBILITY HANDLING - Keep game in sync when tab switches
  // ===========================================================================

  /**
   * Set up document visibility change handler.
   * This ensures the game state stays synchronized when the user switches tabs.
   */
  private setupVisibilityHandler(): void {
    // Only set up if we're in a browser environment
    if (typeof document === "undefined") return;

    this.visibilityChangeHandler = () => {
      if (document.visibilityState === "visible") {
        console.log("[FightScene] Tab became visible, resyncing state");
        this.handleVisibilityResync();
      }
    };

    document.addEventListener("visibilitychange", this.visibilityChangeHandler);

    // Also handle the scene shutdown to clean up
    this.events.once("shutdown", this.cleanupVisibilityHandler, this);
    this.events.once("destroy", this.cleanupVisibilityHandler, this);
  }

  /**
   * Clean up visibility change handler.
   */
  private cleanupVisibilityHandler(): void {
    if (this.visibilityChangeHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
  }

  /**
   * Handle resync when tab becomes visible.
   * Recalculates timer based on server deadline and updates UI.
   */
  private handleVisibilityResync(): void {
    // If we're in selecting phase and have a deadline, resync the timer
    if (this.phase === "selecting" && this.moveDeadlineAt > 0) {
      const nowRemainingMs = this.moveDeadlineAt - Date.now();
      const newTimer = Math.max(0, Math.floor(nowRemainingMs / 1000));

      console.log(`[FightScene] Resync timer: ${this.turnTimer}s -> ${newTimer}s (deadline: ${this.moveDeadlineAt})`);

      this.turnTimer = newTimer;

      // Update display immediately
      this.roundTimerText.setText(`${this.turnTimer}s`);
      if (this.turnTimer <= 5) {
        this.roundTimerText.setColor("#ff4444");
      } else {
        this.roundTimerText.setColor("#40e0d0");
      }

      // If timer has expired while tab was hidden, trigger expiration
      if (this.turnTimer <= 0 && !this.selectedMove) {
        console.log("[FightScene] Timer expired while tab was hidden, triggering expiration");
        this.onTimerExpired();
      }
    }

    // If in resolving or round_end phase, ensure UI reflects current state
    if (this.serverState) {
      this.syncUIWithCombatState();
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

    // Adjust Y position for specific characters
    // Move block-bruiser up a bit more (larger negative offset)
    const p1YOffset = p1Char === "block-bruiser" ? 70 : 50;

    this.player1Sprite = this.add.sprite(
      CHARACTER_POSITIONS.PLAYER1.X,
      CHARACTER_POSITIONS.PLAYER1.Y - p1YOffset,
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

    // Adjust Y position for specific characters
    const p2YOffset = p2Char === "block-bruiser" ? 70 : 50;

    this.player2Sprite = this.add.sprite(
      CHARACTER_POSITIONS.PLAYER2.X,
      CHARACTER_POSITIONS.PLAYER2.Y - p2YOffset,
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
    // Skip "YOU" indicator for spectators
    if (this.config.isSpectator) {
      return;
    }

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
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
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
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
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
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
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
      "20",
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
  // SETTINGS MENU & GAME CONTROLS
  // ===========================================================================

  private settingsContainer!: Phaser.GameObjects.Container;
  private isSettingsOpen: boolean = false;
  private hasRequestedCancel: boolean = false;
  private activeDialog?: Phaser.GameObjects.Container;
  private activeDialogBlocker?: Phaser.GameObjects.Rectangle;

  private createSettingsButton(): void {
    const radius = 24;
    // Bottom Left position
    const x = 50;
    const y = GAME_DIMENSIONS.HEIGHT - 50;

    const container = this.add.container(x, y);
    container.setDepth(2000); // Ensure it's above everything else

    const circle = this.add.graphics();
    circle.fillStyle(0x1a1a2e, 0.8);
    circle.fillCircle(0, 0, radius);
    circle.lineStyle(2, 0x4b5563, 1);
    circle.strokeCircle(0, 0, radius);

    // Gear Icon (Simplified geometry)
    const gear = this.add.graphics();
    gear.fillStyle(0x9ca3af, 1);
    gear.fillCircle(0, 0, 8);
    for (let i = 0; i < 8; i++) {
      const angle = Phaser.Math.DegToRad(i * 45);
      const bx = Math.cos(angle) * 12;
      const by = Math.sin(angle) * 12;
      gear.fillCircle(bx, by, 4);
    }
    gear.fillCircle(0, 0, 4); // Center hole (filled with bg color in next step)

    const centerHole = this.add.graphics();
    centerHole.fillStyle(0x1a1a2e, 1);
    centerHole.fillCircle(0, 0, 5);

    container.add([circle, gear, centerHole]);
    container.setSize(radius * 2, radius * 2);

    // Interactive
    // Interactive
    // User reported hitbox is too up-left. Shifting it MORE down-right.
    const hitArea = new Phaser.Geom.Circle(25, 25, radius);
    container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    // Add hand cursor manually since we used a custom hit area
    container.input!.cursor = 'pointer';

    container.on("pointerover", () => {
      circle.lineStyle(2, 0x3b82f6, 1);
      circle.strokeCircle(0, 0, radius);
      this.tweens.add({ targets: gear, angle: 90, duration: 500, ease: "Back.easeOut" });
    });

    container.on("pointerout", () => {
      circle.lineStyle(2, 0x4b5563, 1);
      circle.strokeCircle(0, 0, radius);
      this.tweens.add({ targets: gear, angle: 0, duration: 500, ease: "Back.easeOut" });
    });

    container.on("pointerdown", () => {
      this.toggleSettingsMenu();
    });
  }

  private createSettingsMenu(): void {
    const width = 240;
    const height = 180;

    // Position menu above the button (bottom-left area)
    const x = 50 + width / 2;
    const y = GAME_DIMENSIONS.HEIGHT - 50 - height / 2 - 20;

    this.settingsContainer = this.add.container(x, y);
    this.settingsContainer.setVisible(false);
    this.settingsContainer.setDepth(2001); // Higher than button

    // Menu Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.lineStyle(1, 0x334155, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    this.settingsContainer.add(bg);

    // Header
    const title = this.add.text(0, -60, "SETTINGS", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#9ca3af",
      fontStyle: "bold"
    }).setOrigin(0.5);
    this.settingsContainer.add(title);

    // Cancel Match Button
    const cancelBtn = this.createMenuButton(0, -10, "CANCEL MATCH", 0x6b7280, () => {
      this.toggleSettingsMenu();
      this.showConfirmationDialog(
        "REQUEST CANCEL?",
        "Ask opponent to cancel match. If they agree, funds are refunded.",
        "SEND REQUEST",
        0x3b82f6,
        () => {
          this.hasRequestedCancel = true;
          EventBus.emit("request-cancel");
        }
      );
    });

    // Surrender Button
    const surrenderBtn = this.createMenuButton(0, 45, "SURRENDER", 0xef4444, () => {
      this.toggleSettingsMenu();
      this.showConfirmationDialog(
        "SURRENDER MATCH?",
        "You will forfeit this match and lose rating.",
        "SURRENDER",
        0xef4444,
        () => EventBus.emit("request-surrender")
      );
    });

    this.settingsContainer.add([cancelBtn, surrenderBtn]);
  }

  private createMenuButton(x: number, y: number, text: string, color: number, callback: () => void): Phaser.GameObjects.Container {
    const width = 200;
    const height = 40;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 0.2);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.lineStyle(1, color, 0.5);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

    const label = this.add.text(0, 0, text, {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(color, 0.4);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    });
    container.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(color, 0.2);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    });
    container.on("pointerdown", callback);

    return container;
  }

  private toggleSettingsMenu(): void {
    this.isSettingsOpen = !this.isSettingsOpen;
    this.settingsContainer.setVisible(this.isSettingsOpen);

    if (this.isSettingsOpen) {
      this.settingsContainer.setScale(0.9);
      this.settingsContainer.setAlpha(0);
      this.tweens.add({
        targets: this.settingsContainer,
        scale: 1,
        alpha: 1,
        duration: 200,
        ease: "Back.easeOut"
      });
    }
  }

  private showCancelRequestDialog(): void {
    this.showConfirmationDialog(
      "OPPONENT WANTS TO CANCEL",
      "Your opponent requested to cancel the match. Funds will be refunded.",
      "AGREE & CANCEL",
      0x22c55e, // Green for agree
      () => {
        this.hasRequestedCancel = true;
        EventBus.emit("request-cancel");
      }
    );
  }

  // ===========================================================================
  // GAME CONTROL BUTTONS (REPLACED BY SETTINGS MENU)
  // ===========================================================================
  private createGameControlButtons(): void {
    // Deprecated - Logic moved to Settings Menu
  }

  private showConfirmationDialog(
    title: string,
    message: string,
    confirmText: string,
    confirmColor: number,
    onConfirm: () => void
  ): void {
    // Semi-transparent background blocker
    const blocker = this.add.rectangle(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y,
      GAME_DIMENSIONS.WIDTH,
      GAME_DIMENSIONS.HEIGHT,
      0x000000,
      0.7
    ).setInteractive(); // Block clicks

    const dialogWidth = 500;
    const dialogHeight = 300;
    const x = GAME_DIMENSIONS.CENTER_X;
    const y = GAME_DIMENSIONS.CENTER_Y;

    // Close existing dialog if any
    if (this.activeDialog) {
      this.activeDialog.destroy();
      this.activeDialog = undefined;
    }
    if (this.activeDialogBlocker) {
      this.activeDialogBlocker.destroy();
      this.activeDialogBlocker = undefined;
    }

    const container = this.add.container(x, y);
    this.activeDialog = container;
    this.activeDialogBlocker = blocker;

    // Dialog Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 16);
    bg.lineStyle(2, 0x3b82f6, 1);
    bg.strokeRoundedRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 16);

    // Title
    const titleText = this.add.text(0, -80, title, {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Message
    const msgText = this.add.text(0, -20, message, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#cccccc",
      align: "center",
      wordWrap: { width: 400 }
    }).setOrigin(0.5);

    // Confirm Button
    const confirmBtn = this.createDialogButton(
      100,
      80,
      180,
      50,
      confirmText,
      confirmColor,
      () => {
        container.destroy();
        this.activeDialog = undefined;
        blocker.destroy();
        this.activeDialogBlocker = undefined;
        onConfirm();
      }
    );

    // Cancel Button
    const cancelBtn = this.createDialogButton(
      -100,
      80,
      180,
      50,
      "BACK",
      0x6b7280,
      () => {
        container.destroy();
        this.activeDialog = undefined;
        blocker.destroy();
        this.activeDialogBlocker = undefined;
      }
    );

    container.add([bg, titleText, msgText, confirmBtn, cancelBtn]);

    // Pop-in animation
    container.setScale(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut"
    });
  }

  private createDialogButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    color: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);

    const label = this.add.text(0, 0, text, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerover", () => {
      container.setScale(1.05);
    });
    container.on("pointerout", () => {
      container.setScale(1);
    });
    container.on("pointerdown", callback);

    return container;
  }

  // ===========================================================================
  // MOVE BUTTONS
  // ===========================================================================

  private createMoveButtons(): void {
    // Skip move buttons entirely for spectators
    if (this.config.isSpectator) {
      // Show spectator indicator instead of move buttons
      this.add.text(
        GAME_DIMENSIONS.CENTER_X,
        GAME_DIMENSIONS.HEIGHT - 80,
        "👁 SPECTATOR MODE",
        { fontFamily: "monospace", fontSize: "18px", color: "#a855f7", fontStyle: "bold" }
      ).setOrigin(0.5);
      return;
    }

    const moves: MoveType[] = ["punch", "kick", "block", "special"];
    const buttonWidth = 140; // Narrower, taller card style
    const buttonHeight = 160;
    const spacing = 20;
    const totalWidth = moves.length * buttonWidth + (moves.length - 1) * spacing;
    const startX = (GAME_DIMENSIONS.WIDTH - totalWidth) / 2 + buttonWidth / 2;
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

    // Colors based on move type
    let color = 0xffffff;
    if (move === "punch") color = 0xef4444;      // Red
    if (move === "kick") color = 0x06b6d4;       // Cyan
    if (move === "block") color = 0x22c55e;      // Green
    if (move === "special") color = 0xa855f7;    // Purple

    // Background (Card style)
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.lineStyle(2, color, 0.8);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    container.add(bg);

    // Inner Glow (simulated with alpha rect)
    const glow = this.add.graphics();
    glow.fillStyle(color, 0.1);
    glow.fillRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, 8);
    container.add(glow);

    // Icon
    const iconKey = `move_${move}`;
    const icon = this.add.image(0, -20, iconKey);
    icon.setDisplaySize(64, 64);
    container.add(icon);

    // Move Name
    const nameText = this.add.text(0, 25, move.toUpperCase(), {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);
    container.add(nameText);

    // Energy Cost
    const cost = BASE_MOVE_STATS[move].energyCost;
    const costColor = cost === 0 ? "#22c55e" : "#3b82f6";
    const costText = this.add.text(0, 48, `${cost} Energy`, {
      fontFamily: "monospace",
      fontSize: "12px",
      color: costColor,
    }).setOrigin(0.5);
    container.add(costText);

    // Advantage Text
    let advantage = "";
    if (move === "punch") advantage = "Beats Special";
    if (move === "kick") advantage = "Beats Punch";
    if (move === "block") advantage = "Reflects Kick";
    if (move === "special") advantage = "Beats Block";

    const advText = this.add.text(0, 65, advantage, {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#aaaaaa",
      fontStyle: "italic"
    }).setOrigin(0.5);
    container.add(advText);

    // Interactive
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Hover effects
    container.on("pointerover", () => {
      if (this.phase === "selecting" && this.combatEngine.canAffordMove("player1", move)) {
        this.tweens.add({
          targets: container,
          y: y - 10,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 200,
          ease: "Back.easeOut",
        });
        bg.clear();
        bg.fillStyle(0x1a1a2e, 0.95);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
        bg.lineStyle(3, color, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
      }
    });

    container.on("pointerout", () => {
      if (this.selectedMove !== move) {
        this.tweens.add({
          targets: container,
          y: y,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: "Power2",
        });
        bg.clear();
        bg.fillStyle(0x1a1a2e, 0.9);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
        bg.lineStyle(2, color, 0.8);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
      }
    });

    container.on("pointerdown", () => {
      this.selectMove(move);
    });

    return container;
  }

  private selectMove(move: MoveType): void {
    // Spectators cannot select moves
    if (this.config.isSpectator) {
      return;
    }

    // Check if affordable
    if (!this.combatEngine.canAffordMove("player1", move)) {
      this.showFloatingText("Not enough energy!", GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.HEIGHT - 150, "#ff4444");
      return;
    }

    this.selectedMove = move;

    // Update button visuals
    this.updateButtonState(move, true);

    // Emit event to submit move via API
    this.isWaitingForOpponent = true;
    this.turnIndicatorText.setText("Submitting move...");
    this.turnIndicatorText.setColor("#f97316");

    EventBus.emit("game:submitMove", {
      matchId: this.config.matchId,
      moveType: move,
      playerRole: this.config.playerRole,
    });
  }

  private updateButtonState(selectedMove: MoveType | null, isSelected: boolean): void {
    const moves: MoveType[] = ["punch", "kick", "block", "special"];

    moves.forEach((move) => {
      const button = this.moveButtons.get(move);
      if (!button) return;

      if (move === selectedMove && isSelected) {
        // Selected state
        this.tweens.add({
          targets: button,
          alpha: 1,
          scaleX: 1.1,
          scaleY: 1.1,
          y: GAME_DIMENSIONS.HEIGHT - 110, // Move up slightly
          duration: 200,
          ease: "Back.easeOut",
        });

        // Highlight effect
        const bg = button.list[0] as Phaser.GameObjects.Graphics;
        bg.clear();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRoundedRect(-70, -80, 140, 160, 12);
        bg.lineStyle(4, 0xffffff, 1); // White border for selection
        bg.strokeRoundedRect(-70, -80, 140, 160, 12);

      } else {
        // Unselected state
        const isAffordable = this.combatEngine.canAffordMove("player1", move);

        this.tweens.add({
          targets: button,
          alpha: isAffordable ? (isSelected ? 0.5 : 1) : 0.3, // Dim others if one is selected
          scaleX: 1,
          scaleY: 1,
          y: GAME_DIMENSIONS.HEIGHT - 100,
          duration: 200,
          ease: "Power2",
        });

        // Reset style
        // Colors based on move type
        let color = 0xffffff;
        if (move === "punch") color = 0xef4444;
        if (move === "kick") color = 0x06b6d4;
        if (move === "block") color = 0x22c55e;
        if (move === "special") color = 0xa855f7;

        const bg = button.list[0] as Phaser.GameObjects.Graphics;
        bg.clear();
        bg.fillStyle(0x1a1a2e, 0.9);
        bg.fillRoundedRect(-70, -80, 140, 160, 12);
        bg.lineStyle(2, color, 0.8);
        bg.strokeRoundedRect(-70, -80, 140, 160, 12);
      }
    });
  }

  private updateMoveButtonAffordability(): void {
    if (this.config.isSpectator || !this.config.playerRole || !this.serverState) return;

    // Strict disable if stunned
    const role = this.config.playerRole;
    const isStunned = (role === "player1" && this.serverState.player1IsStunned) ||
      (role === "player2" && this.serverState.player2IsStunned);

    if (isStunned) {
      this.moveButtons.forEach((button) => {
        button.setAlpha(0.3);
        button.disableInteractive();
        // Tint children (Image, Text)
        button.list.forEach((child: any) => {
          if (child.setTint) child.setTint(0x555555);
        });
      });
      return;
    }

    this.moveButtons.forEach((button, move) => {
      // Clear tint
      button.list.forEach((child: any) => {
        if (child.clearTint) child.clearTint();
      });

      const isAffordable = this.combatEngine.canAffordMove("player1", move);

      // If a move is already selected, don't mess with alpha too much, 
      // but if we are in selection phase and nothing selected yet:
      if (!this.selectedMove) {
        button.setAlpha(isAffordable ? 1 : 0.3);

        // grayscale effect or just alpha? Alpha is easier.
        // We can also disable interactivity
        if (!isAffordable) {
          button.disableInteractive();
        } else {
          button.setInteractive();
        }
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
    this.turnTimer = 20;
    this.turnIndicatorText.setText("Select your move!");

    this.hasRequestedCancel = false;

    // Update button affordability and reset visuals
    this.resetButtonVisuals();
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
      repeat: 19,
    });

    // Sync UI
    this.syncUIWithCombatState();
  }

  private resetButtonVisuals(): void {
    const moves: MoveType[] = ["punch", "kick", "block", "special"];
    const y = GAME_DIMENSIONS.HEIGHT - 100;

    moves.forEach((move) => {
      const button = this.moveButtons.get(move);
      if (!button) return;

      // Reset transforms
      this.tweens.add({
        targets: button,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        y: y,
        duration: 200,
        ease: "Power2",
      });

      // Reset styling
      let color = 0xffffff;
      if (move === "punch") color = 0xef4444;
      if (move === "kick") color = 0x06b6d4;
      if (move === "block") color = 0x22c55e;
      if (move === "special") color = 0xa855f7;

      const bg = button.list[0] as Phaser.GameObjects.Graphics;
      bg.clear();
      bg.fillStyle(0x1a1a2e, 0.9);
      bg.fillRoundedRect(-70, -80, 140, 160, 12);
      bg.lineStyle(2, color, 0.8);
      bg.strokeRoundedRect(-70, -80, 140, 160, 12);
    });
  }

  private onTimerExpired(): void {
    if (this.phase !== "selecting") return;

    // IMPORTANT: Stop the timer immediately to prevent multiple calls
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    // Update UI to show timeout state
    this.turnIndicatorText.setText("Time's up! Checking server...");
    this.turnIndicatorText.setColor("#ff8800");

    // Disable buttons
    // Disable buttons - Handled by UI state
    // this.moveButtons.forEach(btn => btn.setAlpha(0.4).disableInteractive());

    // Emit timeout event for server-side enforcement
    // The MatchGameClient will call the move-timeout API to determine consequences:
    // - If we haven't submitted and opponent has: we forfeit the round
    // - If neither has submitted: match is cancelled
    // - If we've already submitted: no action (already handled)
    EventBus.emit("game:timerExpired", {
      matchId: this.config.matchId,
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

    // Update move button affordability - Removed
    // this.updateMoveButtonAffordability();

    // Emit UI update for React Overlay
    EventBus.emit("ui:update", {
      energy: (this.config.playerRole === "player1") ?
        ((this.serverState?.player1Energy ?? this.combatEngine.getState().player1.energy)) :
        ((this.serverState?.player2Energy ?? this.combatEngine.getState().player2.energy)),
      maxEnergy: (this.config.playerRole === "player1") ?
        ((this.serverState?.player1MaxEnergy ?? this.combatEngine.getState().player1.maxEnergy)) :
        ((this.serverState?.player2MaxEnergy ?? this.combatEngine.getState().player2.maxEnergy)),
      health: (this.config.playerRole === "player1") ?
        ((this.serverState?.player1Health ?? this.combatEngine.getState().player1.hp)) :
        ((this.serverState?.player2Health ?? this.combatEngine.getState().player2.hp)),
      maxHealth: (this.config.playerRole === "player1") ?
        ((this.serverState?.player1MaxHealth ?? this.combatEngine.getState().player1.maxHp)) :
        ((this.serverState?.player2MaxHealth ?? this.combatEngine.getState().player2.maxHp)),
    });
  }

  private updateHealthBarDisplay(player: "player1" | "player2", hp: number, maxHp: number): void {
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
    const barHeight = 25;
    // Clamp percentage to [0, 1] to prevent bar overflow
    const healthPercent = Math.min(1, Math.max(0, hp) / (maxHp || 1));
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
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
    const barHeight = 12;
    const yOffset = 30;
    // Clamp percentage to [0, 1] to prevent bar overflow
    const energyPercent = Math.min(1, Math.max(0, energy) / (maxEnergy || 1));
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
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
    const barHeight = 6;
    const yOffset = 45;
    // Clamp percentage to [0, 1] to prevent bar overflow
    const guardPercent = Math.min(1, Math.max(0, guardMeter) / 100);
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

    // Listen for cancel events
    EventBus.onEvent("game:rejectionWaiting", ({ message }) => {
      this.showFloatingText(message, GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y - 100, "#f97316");
      this.turnIndicatorText.setText(message);
    });

    EventBus.onEvent("game:opponentRejected", () => {
      // Deprecated - handled by game:moveRejected now
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

    // Listen for move confirmation (when player signs transaction)
    EventBus.on("game:moveConfirmed", (data: unknown) => {
      const payload = data as { player: string };

      // If we confirmed our move, stop the local timer
      if (payload.player === this.config.playerRole && this.phase === "selecting") {
        if (this.timerEvent) {
          this.timerEvent.destroy();
          this.timerEvent = undefined;
        }
        this.turnIndicatorText.setText("Move locked in!");
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
        ratingChanges?: {
          winner: { before: number; after: number; change: number };
          loser: { before: number; after: number; change: number };
        };
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
          ratingChanges: payload.ratingChanges,
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
      // AND we haven't already requested cancel (avoids circular dialog when opponent agrees)
      if (payload.player !== this.config.playerRole && !this.hasRequestedCancel) {
        // Show the Cancel Request Dialog instead of just a message
        this.showCancelRequestDialog();
      }
    });

    // Listen for match cancellation (both players rejected)
    EventBus.on("game:matchCancelled", (data: unknown) => {
      const payload = data as { matchId: string; reason: string; message: string; redirectTo: string };

      this.phase = "match_end";

      // Close any active dialogs (e.g., "Opponent Wants to Cancel")
      if (this.activeDialog) {
        this.activeDialog.destroy();
        this.activeDialog = undefined;
      }
      if (this.activeDialogBlocker) {
        this.activeDialogBlocker.destroy();
        this.activeDialogBlocker = undefined;
      }

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
      // Disable all buttons - Not needed, UI handles this
      // this.moveButtons.forEach(btn => btn.setAlpha(0.3).disableInteractive());
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

    // Listen for local rejection waiting (we rejected, waiting for opponent)
    EventBus.on("game:rejectionWaiting", (data: unknown) => {
      const payload = data as { message: string };
      this.isWaitingForOpponent = true;
      this.turnIndicatorText.setText("Waiting for opponent...");
      this.turnIndicatorText.setColor("#f97316");
      // this.moveButtons.forEach(btn => btn.setAlpha(0.4).disableInteractive());
    });

    // Listen for move error (e.g. wallet rejected but failed to record rejection)
    // This allows the user to try again if the rejection recording failed
    EventBus.on("game:moveError", (data: unknown) => {
      const payload = data as { error: string };
      console.log("[FightScene] Move error:", payload.error);

      // If we are "waiting for opponent" due to submitting, but it failed locally
      // We should reset the UI to allow retry
      // BUT if we successfully recorded rejection (which emits game:rejectionWaiting), we shouldn't reset.
      // So only reset if we are NOT in the confirmed waiting state

      // If we are "waiting for opponent" due to submitting, but it failed locally
      // We should reset the UI to allow retry
      // BUT if we successfully recorded rejection (which emits game:rejectionWaiting), we shouldn't reset.
      // So only reset if we are NOT in the confirmed waiting state
      if (this.turnIndicatorText.text === "Submitting move...") {
        this.isWaitingForOpponent = false;
        this.turnIndicatorText.setText("Select your move!");
        this.turnIndicatorText.setColor("#40e0d0");

        // React UI handles enablement based on state reset
        this.selectedMove = null;

        // Update local buttons
        this.updateMoveButtonAffordability();
      }
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
      // Store the deadline for visibility resync
      this.moveDeadlineAt = state.moveDeadlineAt;

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

        // Notify UI
        EventBus.emit("ui:update", { isWaitingForOpponent: true });
      } else {
        // We need to make a move - start synchronized selection with server deadline
        console.log("[FightScene] Decision: Need to make move, starting synchronized selection phase");
        this.startSynchronizedSelectionPhase(state.moveDeadlineAt);
      }
    } else {
      // No active deadline - wait for server's round_starting event
      console.log("[FightScene] Decision: No active deadline, waiting for server round_starting event");
      this.phase = "waiting";
      this.turnIndicatorText.setText("Waiting for round to start...");
      this.turnIndicatorText.setColor("#f97316");
      this.roundTimerText.setText("--");
    }
  }

  /**
   * Start round from server broadcast (production mode - synchronized timing).
   * @param payload - Server round start data
   * @param skipCountdown - If true, skip the 3-2-1 FIGHT countdown (used when processing queued events after our own countdown)
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
    player1IsStunned?: boolean;
    player2IsStunned?: boolean;
  }, skipCountdown: boolean = false): void {
    // If we're in resolving phase (playing attack animations) or round_end phase 
    // (playing death animation, showing text, countdown), queue this payload 
    // and process it after the sequence finishes.
    // The round_starting event arrives from server while we're still animating.
    if (this.phase === "resolving" || this.phase === "round_end") {
      console.log(`[FightScene] Queueing round start - currently in ${this.phase} phase`);
      this.pendingRoundStart = payload;
      return;
    }

    // Stop any existing timer
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    // Store the deadline for synchronized timing
    this.moveDeadlineAt = payload.moveDeadlineAt;

    // Get max values from local engine initially (server should provide these)
    const localState = this.combatEngine.getState();

    // Determine max values (prefer server, fallback to local)
    const p1MaxHealth = payload.player1MaxHealth ?? localState.player1.maxHp;
    const p2MaxHealth = payload.player2MaxHealth ?? localState.player2.maxHp;
    const p1MaxEnergy = payload.player1MaxEnergy ?? localState.player1.maxEnergy;
    const p2MaxEnergy = payload.player2MaxEnergy ?? localState.player2.maxEnergy;

    // At turn 1 (start of round), health and energy should always be at max
    // The server might send incorrect default values (e.g., 100 instead of character-specific max)
    const isRoundStart = payload.turnNumber === 1;
    const p1Health = isRoundStart ? p1MaxHealth : payload.player1Health;
    const p2Health = isRoundStart ? p2MaxHealth : payload.player2Health;
    const p1Energy = isRoundStart ? p1MaxEnergy : payload.player1Energy;
    const p2Energy = isRoundStart ? p2MaxEnergy : payload.player2Energy;

    // Store server state (authoritative)
    this.serverState = {
      player1Health: p1Health,
      player1MaxHealth: p1MaxHealth,
      player2Health: p2Health,
      player2MaxHealth: p2MaxHealth,
      player1Energy: p1Energy,
      player1MaxEnergy: p1MaxEnergy,
      player2Energy: p2Energy,
      player2MaxEnergy: p2MaxEnergy,
      player1GuardMeter: payload.player1GuardMeter,
      player2GuardMeter: payload.player2GuardMeter,
      player1RoundsWon: this.serverState?.player1RoundsWon ?? 0,
      player2RoundsWon: this.serverState?.player2RoundsWon ?? 0,
      currentRound: payload.roundNumber,
      // Stun state from server
      player1IsStunned: payload.player1IsStunned ?? false,
      player2IsStunned: payload.player2IsStunned ?? false,
    };

    // Sync UI with server state (updates HP bars, round info, etc.)
    this.syncUIWithCombatState();

    if (skipCountdown) {
      // Skip the 3-2-1 FIGHT countdown - go directly to selection phase
      // This is used when we already showed our own 5-second countdown
      console.log("[FightScene] Skipping countdown - going straight to selection phase");
      this.startSynchronizedSelectionPhase(payload.moveDeadlineAt);
    } else {
      // Show the 3-2-1 FIGHT countdown
      this.phase = "countdown";
      this.showCountdownThenSync(payload.countdownSeconds, payload.moveDeadlineAt);
    }
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

    // React UI handles button state and affordability

    // Calculate initial remaining time from server deadline
    const remainingMs = moveDeadlineAt - Date.now();
    this.turnTimer = Math.max(1, Math.floor(remainingMs / 1000));

    // Reset button visuals and affordability (default state)
    this.resetButtonVisuals();
    this.updateMoveButtonAffordability();

    // Check if we are stunned
    const isPlayer1 = this.config.playerRole === "player1";
    const amIStunned = isPlayer1
      ? this.serverState?.player1IsStunned
      : this.serverState?.player2IsStunned;

    if (amIStunned) {
      // Player is stunned - show message and disable buttons
      this.turnIndicatorText.setText("YOU ARE STUNNED!");
      this.turnIndicatorText.setColor("#ff4444");
      this.roundTimerText.setColor("#ff4444");

      // Flash the stun message
      this.tweens.add({
        targets: this.turnIndicatorText,
        alpha: { from: 1, to: 0.5 },
        duration: 300,
        yoyo: true,
        repeat: 2,
      });

      // Disable all buttons visually and interactively
      this.moveButtons.forEach(btn => {
        btn.setAlpha(0.3);
        btn.disableInteractive();
      });
    } else {
      // Normal state
      this.turnIndicatorText.setText("Select your move!");
      this.turnIndicatorText.setColor("#40e0d0");
    }

    // Start synchronized timer that updates every second based on deadline
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        // Guard: only run if still in selecting phase
        if (this.phase !== "selecting") return;

        const nowRemainingMs = moveDeadlineAt - Date.now();
        this.turnTimer = Math.max(0, Math.floor(nowRemainingMs / 1000));

        this.roundTimerText.setText(`${this.turnTimer}s`);
        if (this.turnTimer <= 5 || amIStunned) {
          this.roundTimerText.setColor("#ff4444");
        } else {
          this.roundTimerText.setColor("#40e0d0");
        }

        // Only trigger expiry logic if NOT stunned
        if (this.turnTimer <= 0 && !this.selectedMove && !amIStunned) {
          this.onTimerExpired();
        }
      },
      loop: true,
    });

    this.roundTimerText.setText(`${this.turnTimer}s`);
    this.roundTimerText.setColor("#40e0d0");


  }

  /**
   * Handle server-resolved round (production mode).
   */
  private handleServerRoundResolved(payload: {
    player1: { move: MoveType; damageDealt: number; damageTaken: number; outcome?: string };
    player2: { move: MoveType; damageDealt: number; damageTaken: number; outcome?: string };
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

    // Check stun state from outcomes
    const p1IsStunned = payload.player1.outcome === "stunned";
    const p2IsStunned = payload.player2.outcome === "stunned";

    // Prepare targets
    let p1TargetX = meetingPointX - 50;
    let p2TargetX = meetingPointX + 50;

    if (p1IsStunned) {
      p1TargetX = p1OriginalX;
      p2TargetX = p1OriginalX + 150; // Run to P1
    } else if (p2IsStunned) {
      p2TargetX = p2OriginalX;
      p1TargetX = p2OriginalX - 150; // Run to P2
    }

    // Phase 1: Both characters run toward target with run scale (only if not stunned)
    if (!p1IsStunned && this.anims.exists(`${p1Char}_run`)) {
      const p1RunScale = p1Char === "block-bruiser" ? BB_RUN_SCALE : p1Char === "dag-warrior" ? DW_RUN_SCALE : p1Char === "hash-hunter" ? HH_RUN_SCALE : RUN_SCALE;
      this.player1Sprite.setScale(p1RunScale);
      this.player1Sprite.play(`${p1Char}_run`);
    }
    if (!p2IsStunned && this.anims.exists(`${p2Char}_run`)) {
      const p2RunScale = p2Char === "block-bruiser" ? BB_RUN_SCALE : p2Char === "dag-warrior" ? DW_RUN_SCALE : p2Char === "hash-hunter" ? HH_RUN_SCALE : RUN_SCALE;
      this.player2Sprite.setScale(p2RunScale);
      this.player2Sprite.play(`${p2Char}_run`);
    }

    // Tween both characters toward targets
    this.tweens.add({
      targets: this.player1Sprite,
      x: p1TargetX,
      duration: p1IsStunned ? 0 : 600,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: this.player2Sprite,
      x: p2TargetX,
      duration: p2IsStunned ? 0 : 600,
      ease: 'Power2',
      onComplete: () => {
        // Phase 2: Both characters attack with their selected move
        const p1Move = payload.player1.move;
        const p2Move = payload.player2.move;

        // Player 1 attack animation (if not stunned)
        if (!p1IsStunned) {
          console.log("[DEBUG P1] move:", p1Move, "char:", p1Char);

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
            this.player1Sprite.setScale(blockScale);
            this.player1Sprite.play(`${p1Char}_block`);
          } else if (p1Move === "special" && this.anims.exists(`${p1Char}_special`)) {
            const specialScale = p1Char === "block-bruiser" ? BB_SPECIAL_SCALE : p1Char === "dag-warrior" ? DW_SPECIAL_SCALE : p1Char === "hash-hunter" ? HH_SPECIAL_SCALE : SPECIAL_SCALE;
            this.player1Sprite.setScale(specialScale);
            this.player1Sprite.play(`${p1Char}_special`);
          } else if (this.anims.exists(`${p1Char}_${p1Move}`)) {
            this.player1Sprite.play(`${p1Char}_${p1Move}`);
          }
        }

        // Player 2 attack animation (if not stunned)
        if (!p2IsStunned) {
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
        }

        // Show narrative
        let narrative = "";

        // Narrative logic for stun
        if (p1IsStunned && p2IsStunned) {
          narrative = "Both players are stunned!";
        } else if (p1IsStunned) {
          narrative = `Player 1 is STUNNED! Player 2 uses ${p2Move}!`;
        } else if (p2IsStunned) {
          narrative = `Player 2 is STUNNED! Player 1 uses ${p1Move}!`;
        } else if (payload.player1.damageDealt > 0 && payload.player2.damageDealt > 0) {
          narrative = "Both players trade heavy blows!";
        } else if (payload.player1.damageDealt > 0) {
          narrative = `Player 1 hits for ${payload.player1.damageDealt} damage!`;
        } else if (payload.player2.damageDealt > 0) {
          narrative = `Player 2 hits for ${payload.player2.damageDealt} damage!`;
        } else {
          narrative = "Both attacks were blocked or missed!";
        }

        this.narrativeText.setText(narrative);
        this.narrativeText.setAlpha(1);

        // Delay damage effects until attack animation lands
        this.time.delayedCall(1000, () => {
          // Show damage numbers at correct positions (target position of victim)
          if (payload.player2.damageTaken > 0) {
            this.showFloatingText(`-${payload.player2.damageTaken}`, p2TargetX, CHARACTER_POSITIONS.PLAYER2.Y - 130, "#ff4444");
          }
          if (payload.player1.damageTaken > 0) {
            this.showFloatingText(`-${payload.player1.damageTaken}`, p1TargetX, CHARACTER_POSITIONS.PLAYER1.Y - 130, "#ff4444");
          }

          // Update health bars when the attack lands
          this.syncUIWithCombatState();
          this.roundScoreText.setText(
            `Round ${this.serverState?.currentRound ?? 1}  •  ${payload.player1RoundsWon} - ${payload.player2RoundsWon}  (First to 3)`
          );
        });

        // Phase 3: After attack animation completes, run back to original positions
        this.time.delayedCall(1600, () => {
          if (!p1IsStunned && this.anims.exists(`${p1Char}_run`)) {
            const p1RunScale = p1Char === "block-bruiser" ? BB_RUN_SCALE : p1Char === "dag-warrior" ? DW_RUN_SCALE : p1Char === "hash-hunter" ? HH_RUN_SCALE : RUN_SCALE;
            this.player1Sprite.setScale(p1RunScale);
            this.player1Sprite.play(`${p1Char}_run`);
          }
          if (!p2IsStunned && this.anims.exists(`${p2Char}_run`)) {
            const p2RunScale = p2Char === "block-bruiser" ? BB_RUN_SCALE : p2Char === "dag-warrior" ? DW_RUN_SCALE : p2Char === "hash-hunter" ? HH_RUN_SCALE : RUN_SCALE;
            this.player2Sprite.setScale(p2RunScale);
            this.player2Sprite.play(`${p2Char}_run`);
          }

          // Tween back to original positions
          this.tweens.add({
            targets: this.player1Sprite,
            x: p1OriginalX,
            duration: p1IsStunned ? 0 : 600,
            ease: 'Power2',
          });

          this.tweens.add({
            targets: this.player2Sprite,
            x: p2OriginalX,
            duration: p2IsStunned ? 0 : 600,
            ease: 'Power2',
            onComplete: () => {
              // Phase 4: Return to idle animations
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
                // Turn ended but round continues - process any pending round start
                this.selectedMove = null;

                // Process pending round start if we received one during the resolving phase
                if (this.pendingRoundStart) {
                  console.log("[FightScene] Processing queued round start after turn resolution");
                  const queuedPayload = this.pendingRoundStart;
                  this.pendingRoundStart = null;
                  // IMPORTANT: Change phase BEFORE calling startRoundFromServer to prevent re-queueing
                  this.phase = "countdown";
                  // For normal turns (not round over), show the 3-2-1 FIGHT countdown
                  this.startRoundFromServer(queuedPayload, false);
                } else {
                  // Wait for server's round_starting event - change phase to allow receiving it
                  this.phase = "selecting";
                  this.turnIndicatorText.setText("Waiting for next turn...");
                  this.turnIndicatorText.setColor("#888888");
                }
              }
            },
          });
        });
      },
    });
  }

  /**
   * Show round end from server data (production mode).
   * Plays death animation on loser, shows result text, countdown, then resets for next round.
   */
  private showRoundEndFromServer(
    roundWinner: "player1" | "player2" | null,
    p1Wins: number,
    p2Wins: number
  ): void {
    this.phase = "round_end";

    const p1Char = this.config.player1Character || "dag-warrior";
    const p2Char = this.config.player2Character || "dag-warrior";
    const isLocalWinner = roundWinner === this.config.playerRole;

    // Dead animation scale constants
    // cyber-ninja: 408x305, block-bruiser: 551x380, dag-warrior: 539x325, hash-hunter: 513x248
    const DEAD_SCALE = 0.70;  // cyber-ninja base scale
    const BB_DEAD_SCALE = 0.65;  // block-bruiser (larger frame)
    const DW_DEAD_SCALE = 0.62;  // dag-warrior
    const HH_DEAD_SCALE = 0.99;  // hash-hunter (smaller frame)

    // Idle scale constants (same as in handleServerRoundResolved)
    const IDLE_SCALE = 0.45;
    const BB_IDLE_SCALE = 0.95;
    const DW_IDLE_SCALE = 0.90;
    const HH_IDLE_SCALE = 0.90;

    // Play dead animation on the loser
    const loser = roundWinner === "player1" ? "player2" : "player1";
    const loserChar = loser === "player1" ? p1Char : p2Char;
    const loserSprite = loser === "player1" ? this.player1Sprite : this.player2Sprite;

    // Get the correct dead scale for the loser's character
    const getDeadScale = (charId: string) => {
      if (charId === "block-bruiser") return BB_DEAD_SCALE;
      if (charId === "dag-warrior") return DW_DEAD_SCALE;
      if (charId === "hash-hunter") return HH_DEAD_SCALE;
      return DEAD_SCALE;
    };

    const getIdleScale = (charId: string) => {
      if (charId === "block-bruiser") return BB_IDLE_SCALE;
      if (charId === "dag-warrior") return DW_IDLE_SCALE;
      if (charId === "hash-hunter") return HH_IDLE_SCALE;
      return IDLE_SCALE;
    };

    // Play dead animation on loser if it exists
    if (this.anims.exists(`${loserChar}_dead`)) {
      loserSprite.setScale(getDeadScale(loserChar));
      loserSprite.play(`${loserChar}_dead`);
    }

    // Wait for death animation to complete (36 frames at 24fps = 1.5s)
    this.time.delayedCall(1500, () => {
      // Show round result text for this player
      const resultText = isLocalWinner ? "YOU WON THIS ROUND!" : "YOU LOST THIS ROUND";
      this.countdownText.setText(resultText);
      this.countdownText.setFontSize(42);
      this.countdownText.setColor(isLocalWinner ? "#22c55e" : "#ef4444");
      this.countdownText.setAlpha(1);

      // After showing result text for 1.5s, start the countdown
      this.time.delayedCall(1500, () => {
        let countdown = 5;

        const updateRoundCountdown = () => {
          this.countdownText.setText(`Next round starting in ${countdown}`);
          this.countdownText.setFontSize(32);
          this.countdownText.setColor("#40e0d0");

          // Pulse effect on the countdown text
          this.tweens.add({
            targets: this.countdownText,
            scale: { from: 1.1, to: 1 },
            duration: 400,
            ease: 'Power2',
          });

          if (countdown > 1) {
            countdown--;
            this.time.delayedCall(1000, updateRoundCountdown);
          } else {
            // Countdown finished - reset for next round
            this.time.delayedCall(1000, () => {
              // Hide countdown text
              this.countdownText.setAlpha(0);
              this.countdownText.setFontSize(72);

              // Reset both sprites to idle animations with proper scales
              if (this.anims.exists(`${p1Char}_idle`)) {
                this.player1Sprite.setScale(getIdleScale(p1Char));
                this.player1Sprite.play(`${p1Char}_idle`);
              }
              if (this.anims.exists(`${p2Char}_idle`)) {
                this.player2Sprite.setScale(getIdleScale(p2Char));
                this.player2Sprite.play(`${p2Char}_idle`);
              }

              // Reset selected move for next round
              this.selectedMove = null;

              // Change phase to allow processing queued events
              this.phase = "selecting";

              // Process pending round start if we received one during the round_end sequence
              if (this.pendingRoundStart) {
                console.log("[FightScene] Processing queued round start");
                const payload = this.pendingRoundStart;
                this.pendingRoundStart = null;
                // Skip the 3-2-1 FIGHT countdown since we already showed our 5-second countdown
                this.startRoundFromServer(payload, true);
              } else {
                // No pending event, just wait
                this.turnIndicatorText.setText("Starting next round...");
                this.turnIndicatorText.setColor("#888888");
              }
            });
          }
        };

        updateRoundCountdown();
      });
    });
  }
}

export default FightScene;
