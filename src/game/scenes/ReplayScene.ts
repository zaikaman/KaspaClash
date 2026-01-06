/**
 * ReplayScene - Replays a completed match from stored round data
 * Non-interactive playback of a full match for sharing
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { GAME_DIMENSIONS, CHARACTER_POSITIONS, UI_POSITIONS } from "../config";
import { CombatEngine, getCharacterCombatStats } from "../combat";
import type { MoveType } from "@/types";

/**
 * Round data for replay
 */
export interface ReplayRoundData {
  roundNumber: number;
  player1Move: MoveType;
  player2Move: MoveType;
  player1DamageDealt: number;
  player2DamageDealt: number;
  player1HealthAfter: number;
  player2HealthAfter: number;
  winnerAddress: string | null;
}

/**
 * Replay scene configuration
 */
export interface ReplaySceneConfig {
  matchId: string;
  player1Address: string;
  player2Address: string;
  player1Character: string;
  player2Character: string;
  winnerAddress: string | null;
  player1RoundsWon: number;
  player2RoundsWon: number;
  rounds: ReplayRoundData[];
}

/**
 * ReplayScene - Plays back a completed match
 */
export class ReplayScene extends Phaser.Scene {
  // Configuration
  private config!: ReplaySceneConfig;

  // UI Elements
  private player1HealthBar!: Phaser.GameObjects.Graphics;
  private player2HealthBar!: Phaser.GameObjects.Graphics;
  private player1EnergyBar!: Phaser.GameObjects.Graphics;
  private player2EnergyBar!: Phaser.GameObjects.Graphics;
  private player1GuardMeter!: Phaser.GameObjects.Graphics;
  private player2GuardMeter!: Phaser.GameObjects.Graphics;
  private roundScoreText!: Phaser.GameObjects.Text;
  private narrativeText!: Phaser.GameObjects.Text;
  private replayBadge!: Phaser.GameObjects.Container;

  // Character sprites
  private player1Sprite!: Phaser.GameObjects.Sprite;
  private player2Sprite!: Phaser.GameObjects.Sprite;

  // Replay state
  private currentRoundIndex: number = 0;
  private isPlaying: boolean = false;
  private player1Health: number = 100;
  private player2Health: number = 100;
  private player1MaxHealth: number = 100;
  private player2MaxHealth: number = 100;
  private player1Energy: number = 100;
  private player2Energy: number = 100;
  private player1MaxEnergy: number = 100;
  private player2MaxEnergy: number = 100;
  private player1GuardMeterValue: number = 0;
  private player2GuardMeterValue: number = 0;
  private player1RoundsWon: number = 0;
  private player2RoundsWon: number = 0;
  private currentGameRound: number = 1;

  // Combat engine for recalculating state
  private combatEngine!: CombatEngine;

  // Audio settings
  private bgmVolume: number = 0.3;
  private sfxVolume: number = 0.5;
  private bgmSlider?: Phaser.GameObjects.Container;
  private sfxSlider?: Phaser.GameObjects.Container;

  // Settings menu
  private settingsContainer!: Phaser.GameObjects.Container;
  private isSettingsOpen: boolean = false;

  constructor() {
    super({ key: "ReplayScene" });
  }

  init(data: ReplaySceneConfig): void {
    this.config = data;
    this.currentRoundIndex = 0;
    this.isPlaying = false;
    this.player1RoundsWon = 0;
    this.player2RoundsWon = 0;
    this.currentGameRound = 1;

    // Initialize combat engine with character stats
    this.combatEngine = new CombatEngine(
      data.player1Character || "dag-warrior",
      data.player2Character || "dag-warrior",
      "best_of_5"
    );

    // Get initial health from combat engine
    const state = this.combatEngine.getState();
    this.player1Health = state.player1.hp;
    this.player2Health = state.player2.hp;
    this.player1MaxHealth = state.player1.maxHp;
    this.player2MaxHealth = state.player2.maxHp;
    this.player1Energy = state.player1.energy;
    this.player2Energy = state.player2.energy;
    this.player1MaxEnergy = state.player1.maxEnergy;
    this.player2MaxEnergy = state.player2.maxEnergy;
    this.player1GuardMeterValue = 0;
    this.player2GuardMeterValue = 0;
  }

  // Audio helper
  private playSFX(key: string): void {
    if (this.game.sound.locked) return;

    try {
      this.sound.play(key, { volume: this.sfxVolume });
      // Stop after 5 seconds max
      this.time.delayedCall(5000, () => {
        const sound = this.sound.get(key);
        if (sound && sound.isPlaying) {
          sound.stop();
        }
      });
    } catch (e) {
      console.warn(`Failed to play SFX: ${key}`, e);
    }
  }

  /**
   * Load audio settings from localStorage.
   */
  private loadAudioSettings(): void {
    try {
      const savedBgm = localStorage.getItem("kaspaclash_bgm_volume");
      const savedSfx = localStorage.getItem("kaspaclash_sfx_volume");
      if (savedBgm !== null) this.bgmVolume = parseFloat(savedBgm);
      if (savedSfx !== null) this.sfxVolume = parseFloat(savedSfx);
    } catch (e) {
      console.warn("Failed to load audio settings", e);
    }
  }

  /**
   * Save audio settings to localStorage.
   */
  private saveAudioSettings(): void {
    try {
      localStorage.setItem("kaspaclash_bgm_volume", this.bgmVolume.toString());
      localStorage.setItem("kaspaclash_sfx_volume", this.sfxVolume.toString());
    } catch (e) {
      console.warn("Failed to save audio settings", e);
    }
  }

  /**
   * Apply BGM volume to currently playing background music.
   */
  private applyBgmVolume(): void {
    const bgm = this.sound.get("bgm_fight");
    if (bgm && "setVolume" in bgm) {
      (bgm as Phaser.Sound.WebAudioSound).setVolume(this.bgmVolume);
    }
  }

  preload(): void {
    // Load arena background
    this.load.image("arena-bg", "/assets/background_2.webp");

    // Load character spritesheets for all characters
    const characters = ["cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"];
    characters.forEach((charId) => {
      // idle
      if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_idle`, `/characters/${charId}/idle.webp`, {
          frameWidth: 305, frameHeight: 260,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_idle`, `/characters/${charId}/idle.webp`, {
          frameWidth: 301, frameHeight: 253,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_idle`, `/characters/${charId}/idle.webp`, {
          frameWidth: 310, frameHeight: 234,
        });
      } else {
        this.load.spritesheet(`char_${charId}_idle`, `/characters/${charId}/idle.webp`, {
          frameWidth: 232, frameHeight: 450,
        });
      }

      // run
      if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_run`, `/characters/${charId}/run.webp`, {
          frameWidth: 291, frameHeight: 298,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_run`, `/characters/${charId}/run.webp`, {
          frameWidth: 285, frameHeight: 211,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_run`, `/characters/${charId}/run.webp`, {
          frameWidth: 275, frameHeight: 214,
        });
      } else {
        this.load.spritesheet(`char_${charId}_run`, `/characters/${charId}/run.webp`, {
          frameWidth: 213, frameHeight: 287,
        });
      }

      // punch
      if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_punch`, `/characters/${charId}/punch.webp`, {
          frameWidth: 318, frameHeight: 263,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_punch`, `/characters/${charId}/punch.webp`, {
          frameWidth: 406, frameHeight: 232,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_punch`, `/characters/${charId}/punch.webp`, {
          frameWidth: 416, frameHeight: 233,
        });
      } else {
        this.load.spritesheet(`char_${charId}_punch`, `/characters/${charId}/punch.webp`, {
          frameWidth: 269, frameHeight: 260,
        });
      }

      // kick
      if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_kick`, `/characters/${charId}/kick.webp`, {
          frameWidth: 477, frameHeight: 329,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_kick`, `/characters/${charId}/kick.webp`, {
          frameWidth: 495, frameHeight: 344,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_kick`, `/characters/${charId}/kick.webp`, {
          frameWidth: 425, frameHeight: 295,
        });
      } else {
        this.load.spritesheet(`char_${charId}_kick`, `/characters/${charId}/kick.webp`, {
          frameWidth: 345, frameHeight: 305,
        });
      }

      // block
      if (charId === "cyber-ninja") {
        this.load.spritesheet(`char_${charId}_block`, `/characters/${charId}/block.webp`, {
          frameWidth: 391, frameHeight: 350,
        });
      } else if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_block`, `/characters/${charId}/block.webp`, {
          frameWidth: 243, frameHeight: 366,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_block`, `/characters/${charId}/block.webp`, {
          frameWidth: 389, frameHeight: 277,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_block`, `/characters/${charId}/block.webp`, {
          frameWidth: 360, frameHeight: 259,
        });
      }

      // special
      if (charId === "cyber-ninja") {
        this.load.spritesheet(`char_${charId}_special`, `/characters/${charId}/special.webp`, {
          frameWidth: 525, frameHeight: 426,
        });
      } else if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_special`, `/characters/${charId}/special.webp`, {
          frameWidth: 583, frameHeight: 379,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_special`, `/characters/${charId}/special.webp`, {
          frameWidth: 584, frameHeight: 228,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_special`, `/characters/${charId}/special.webp`, {
          frameWidth: 621, frameHeight: 302,
        });
      }

      // dead
      if (charId === "cyber-ninja") {
        this.load.spritesheet(`char_${charId}_dead`, `/characters/${charId}/dead.webp`, {
          frameWidth: 408, frameHeight: 305,
        });
      } else if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_dead`, `/characters/${charId}/dead.webp`, {
          frameWidth: 551, frameHeight: 380,
        });
      } else if (charId === "dag-warrior") {
        this.load.spritesheet(`char_${charId}_dead`, `/characters/${charId}/dead.webp`, {
          frameWidth: 539, frameHeight: 325,
        });
      } else if (charId === "hash-hunter") {
        this.load.spritesheet(`char_${charId}_dead`, `/characters/${charId}/dead.webp`, {
          frameWidth: 513, frameHeight: 248,
        });
      }
    });

    // Audio Loading
    // Background Music
    this.load.audio("bgm_fight", "/assets/audio/fight.mp3");
    this.load.audio("sfx_victory", "/assets/audio/victory.mp3");
    this.load.audio("sfx_defeat", "/assets/audio/defeat.mp3");

    // UI SFX
    this.load.audio("sfx_hover", "/assets/audio/hover.mp3");
    this.load.audio("sfx_click", "/assets/audio/click.mp3");

    // Character SFX
    characters.forEach(charId => {
      this.load.audio(`sfx_${charId}_punch`, `/assets/audio/${charId}-punch.mp3`);
      this.load.audio(`sfx_${charId}_kick`, `/assets/audio/${charId}-kick.mp3`);
      this.load.audio(`sfx_${charId}_block`, `/assets/audio/${charId}-block.mp3`);
      this.load.audio(`sfx_${charId}_special`, `/assets/audio/${charId}-special.mp3`);
    });
  }

  create(): void {
    // Load audio settings from localStorage
    this.loadAudioSettings();

    // Play BGM - keep playing even when tab loses focus
    this.sound.pauseOnBlur = false;
    if (this.sound.get("bgm_fight")) {
      if (!this.sound.get("bgm_fight").isPlaying) {
        this.sound.play("bgm_fight", { loop: true, volume: this.bgmVolume });
      }
    } else {
      this.sound.play("bgm_fight", { loop: true, volume: this.bgmVolume });
    }

    this.createBackground();
    this.createAnimations();
    this.createUI();
    this.createCharacters();
    this.createReplayBadge();

    // UI - Settings
    this.settingsContainer = this.add.container(0, 0);
    this.createSettingsButton();
    this.createSettingsMenu();

    // Handle scene shutdown - stop BGM
    this.events.once("shutdown", this.handleShutdown, this);
    this.events.once("destroy", this.handleShutdown, this);

    // Start playback after a short delay
    this.time.delayedCall(1500, () => {
      this.startReplay();
    });

    // Emit ready event
    EventBus.emit("scene:ready", this);
  }

  /**
   * Handle scene shutdown - stop BGM.
   */
  private handleShutdown(): void {
    const bgm = this.sound.get("bgm_fight");
    if (bgm && bgm.isPlaying) {
      bgm.stop();
    }
  }

  private createBackground(): void {
    // Arena background
    const bg = this.add.image(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y, "arena-bg");
    bg.setDisplaySize(GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);

    // Dark overlay for better visibility
    const overlay = this.add.rectangle(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y,
      GAME_DIMENSIONS.WIDTH,
      GAME_DIMENSIONS.HEIGHT,
      0x000000,
      0.3
    );
  }

  private createAnimations(): void {
    const characters = ["cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"];

    characters.forEach((charId) => {
      // Idle animation (36 frames, 24fps, loops)
      if (!this.anims.exists(`${charId}_idle`)) {
        this.anims.create({
          key: `${charId}_idle`,
          frames: this.anims.generateFrameNumbers(`char_${charId}_idle`, { start: 0, end: 35 }),
          frameRate: 24,
          repeat: -1,
        });
      }

      // Run animation (36 frames, 24fps, loops)
      if (!this.anims.exists(`${charId}_run`)) {
        this.anims.create({
          key: `${charId}_run`,
          frames: this.anims.generateFrameNumbers(`char_${charId}_run`, { start: 0, end: 35 }),
          frameRate: 24,
          repeat: -1,
        });
      }

      // Attack animations (36 frames, 24fps)
      if (!this.anims.exists(`${charId}_punch`)) {
        this.anims.create({
          key: `${charId}_punch`,
          frames: this.anims.generateFrameNumbers(`char_${charId}_punch`, { start: 0, end: 35 }),
          frameRate: 24,
          repeat: 0,
        });
      }

      if (!this.anims.exists(`${charId}_kick`)) {
        this.anims.create({
          key: `${charId}_kick`,
          frames: this.anims.generateFrameNumbers(`char_${charId}_kick`, { start: 0, end: 35 }),
          frameRate: 24,
          repeat: 0,
        });
      }

      if (!this.anims.exists(`${charId}_block`)) {
        this.anims.create({
          key: `${charId}_block`,
          frames: this.anims.generateFrameNumbers(`char_${charId}_block`, { start: 0, end: 35 }),
          frameRate: 24,
          repeat: 0,
        });
      }

      if (!this.anims.exists(`${charId}_special`)) {
        this.anims.create({
          key: `${charId}_special`,
          frames: this.anims.generateFrameNumbers(`char_${charId}_special`, { start: 0, end: 35 }),
          frameRate: 24,
          repeat: 0,
        });
      }

      if (!this.anims.exists(`${charId}_dead`)) {
        this.anims.create({
          key: `${charId}_dead`,
          frames: this.anims.generateFrameNumbers(`char_${charId}_dead`, { start: 0, end: 35 }),
          frameRate: 24,
          repeat: 0,
        });
      }
    });
  }

  private createUI(): void {
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
    const barHeight = 25;

    // Create health bar backgrounds
    this.createHealthBar(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y,
      barWidth,
      barHeight,
      "player1"
    );
    this.createHealthBar(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y,
      barWidth,
      barHeight,
      "player2"
    );

    // Create energy bars
    this.createEnergyBar(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + 30,
      barWidth,
      12,
      "player1"
    );
    this.createEnergyBar(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + 30,
      barWidth,
      12,
      "player2"
    );

    // Create guard meters
    this.createGuardMeter(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + 45,
      barWidth,
      6,
      "player1"
    );
    this.createGuardMeter(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + 45,
      barWidth,
      6,
      "player2"
    );

    // Energy labels
    const labelStyle = { fontFamily: "monospace", fontSize: "10px", color: "#3b82f6" };
    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X + barWidth + 5,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + 30,
      "EN",
      labelStyle
    );
    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X - 20,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + 30,
      "EN",
      labelStyle
    );

    // Player labels with character names and addresses
    const p1Char = this.config.player1Character || "dag-warrior";
    const p2Char = this.config.player2Character || "dag-warrior";
    const p1Address = this.config.player1Address.slice(0, 10) + "...";
    const p2Address = this.config.player2Address.slice(0, 10) + "...";

    // Player 1 label (left side)
    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y - 18,
      `P1: ${p1Char.toUpperCase()} (${this.player1MaxHealth} HP)`,
      {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#40e0d0",
        fontStyle: "bold"
      }
    );

    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + barHeight + 30,
      p1Address,
      {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#888888"
      }
    );

    // Player 2 label (right side)
    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X + barWidth,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y - 18,
      `P2: ${p2Char.toUpperCase()} (${this.player2MaxHealth} HP)`,
      {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#40e0d0",
        fontStyle: "bold",
        align: "right"
      }
    ).setOrigin(1, 0);

    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X + barWidth,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + barHeight + 30,
      p2Address,
      {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#888888",
        align: "right"
      }
    ).setOrigin(1, 0);

    // Round score text
    this.roundScoreText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      60,
      `Round ${this.currentGameRound}  •  ${this.player1RoundsWon} - ${this.player2RoundsWon}  (First to 3)`,
      {
        fontFamily: "Orbitron",
        fontSize: "24px",
        color: "#ffffff",
      }
    ).setOrigin(0.5);

    // Narrative text
    this.narrativeText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.HEIGHT - 100,
      "",
      {
        fontFamily: "Exo 2",
        fontSize: "140px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 1400 },
        stroke: "#000000",
        strokeThickness: 4,
      }
    ).setOrigin(0.5).setAlpha(0);

    // Draw initial health bars
    this.updateHealthBars();
    this.updateEnergyBars();
    this.updateGuardMeters();
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

  private createReplayBadge(): void {
    this.replayBadge = this.add.container(GAME_DIMENSIONS.CENTER_X, 120);

    const badgeBg = this.add.rectangle(0, 0, 200, 40, 0x000000, 0.8)
      .setStrokeStyle(2, 0x49eacb);

    const badgeText = this.add.text(0, 0, "⏵ REPLAY", {
      fontFamily: "Orbitron",
      fontSize: "20px",
      color: "#49eacb",
    }).setOrigin(0.5);

    this.replayBadge.add([badgeBg, badgeText]);

    // Pulse animation
    this.tweens.add({
      targets: this.replayBadge,
      alpha: 0.7,
      yoyo: true,
      repeat: -1,
      duration: 1000,
      ease: "Sine.easeInOut",
    });
  }

  private createCharacters(): void {
    const p1Char = this.config.player1Character || "dag-warrior";
    const p2Char = this.config.player2Character || "dag-warrior";

    const idleScale = this.getIdleScale(p1Char);
    const p2IdleScale = this.getIdleScale(p2Char);

    // Adjust Y position for specific characters (matching FightScene)
    const p1YOffset = p1Char === "block-bruiser" ? 70 : 50;
    const p2YOffset = p2Char === "block-bruiser" ? 70 : 50;

    // Player 1 sprite (left side)
    this.player1Sprite = this.add.sprite(
      CHARACTER_POSITIONS.PLAYER1.X,
      CHARACTER_POSITIONS.PLAYER1.Y - p1YOffset,
      `char_${p1Char}_idle`
    );
    this.player1Sprite.setScale(idleScale);
    this.player1Sprite.setOrigin(0.5, 0.5);
    if (this.anims.exists(`${p1Char}_idle`)) {
      this.player1Sprite.play(`${p1Char}_idle`);
    }

    // Player 2 sprite (right side, flipped)
    this.player2Sprite = this.add.sprite(
      CHARACTER_POSITIONS.PLAYER2.X,
      CHARACTER_POSITIONS.PLAYER2.Y - p2YOffset,
      `char_${p2Char}_idle`
    );
    this.player2Sprite.setScale(p2IdleScale);
    this.player2Sprite.setOrigin(0.5, 0.5);
    this.player2Sprite.setFlipX(true);
    if (this.anims.exists(`${p2Char}_idle`)) {
      this.player2Sprite.play(`${p2Char}_idle`);
    }
  }

  private getIdleScale(charId: string): number {
    switch (charId) {
      case "block-bruiser": return 0.95;
      case "dag-warrior": return 0.80;
      case "hash-hunter": return 0.90;
      default: return 0.45;
    }
  }

  private getRunScale(charId: string): number {
    switch (charId) {
      case "block-bruiser": return 0.90;
      case "dag-warrior": return 0.96;
      case "hash-hunter": return 0.90;
      default: return 0.71;
    }
  }

  private getMoveScale(charId: string, move: MoveType): number {
    const scales: Record<string, Record<MoveType, number>> = {
      "block-bruiser": { punch: 0.94, kick: 0.90, block: 0.90, special: 0.90, stunned: 0.90 },
      "dag-warrior": { punch: 0.90, kick: 0.90, block: 0.90, special: 0.90, stunned: 0.90 },
      "hash-hunter": { punch: 0.90, kick: 0.90, block: 0.90, special: 0.90, stunned: 0.90 },
      "cyber-ninja": { punch: 0.78, kick: 0.75, block: 0.80, special: 0.80, stunned: 0.80 },
    };
    return scales[charId]?.[move] ?? 0.75;
  }

  private getDeadScale(charId: string): number {
    switch (charId) {
      case "block-bruiser": return 0.65;
      case "dag-warrior": return 0.62;
      case "hash-hunter": return 0.85;
      default: return 0.70;
    }
  }

  private updateHealthBars(): void {
    this.updateHealthBarDisplay("player1", this.player1Health, this.player1MaxHealth);
    this.updateHealthBarDisplay("player2", this.player2Health, this.player2MaxHealth);
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

    // Color based on health percentage
    let color = 0x00ff88;
    if (healthPercent <= 0.25) color = 0xff4444;
    else if (healthPercent <= 0.5) color = 0xffaa00;

    graphics.fillStyle(color, 1);
    if (player === "player2") {
      // P2 fills from right to left
      graphics.fillRoundedRect(x + 2 + (barWidth - 4 - innerWidth), y + 2, innerWidth, barHeight - 4, 3);
    } else {
      graphics.fillRoundedRect(x + 2, y + 2, innerWidth, barHeight - 4, 3);
    }
  }

  private updateEnergyBars(): void {
    this.updateEnergyBarDisplay("player1", this.player1Energy, this.player1MaxEnergy);
    this.updateEnergyBarDisplay("player2", this.player2Energy, this.player2MaxEnergy);
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

  private updateGuardMeters(): void {
    this.updateGuardMeterDisplay("player1", this.player1GuardMeterValue);
    this.updateGuardMeterDisplay("player2", this.player2GuardMeterValue);
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

  private startReplay(): void {
    if (this.config.rounds.length === 0) {
      this.showReplayComplete();
      return;
    }

    this.isPlaying = true;
    this.playNextRound();
  }

  private playNextRound(): void {
    if (this.currentRoundIndex >= this.config.rounds.length) {
      this.showReplayComplete();
      return;
    }

    const round = this.config.rounds[this.currentRoundIndex];
    this.animateRound(round);
  }

  private animateRound(round: ReplayRoundData): void {
    const p1Char = this.config.player1Character || "dag-warrior";
    const p2Char = this.config.player2Character || "dag-warrior";

    const p1OriginalX = CHARACTER_POSITIONS.PLAYER1.X;
    const p2OriginalX = CHARACTER_POSITIONS.PLAYER2.X;
    const meetingPointX = GAME_DIMENSIONS.CENTER_X;

    // Phase 1: Run toward center
    if (this.anims.exists(`${p1Char}_run`)) {
      this.player1Sprite.setScale(this.getRunScale(p1Char));
      this.player1Sprite.play(`${p1Char}_run`);
    }
    if (this.anims.exists(`${p2Char}_run`)) {
      this.player2Sprite.setScale(this.getRunScale(p2Char));
      this.player2Sprite.play(`${p2Char}_run`);
    }

    this.tweens.add({
      targets: this.player1Sprite,
      x: meetingPointX - 50,
      duration: 600,
      ease: "Power2",
    });

    this.tweens.add({
      targets: this.player2Sprite,
      x: meetingPointX + 50,
      duration: 600,
      ease: "Power2",
      onComplete: () => {
        // Phase 2: Play attack animations SEQUENTIALLY (like FightScene)
        const p1Move = round.player1Move;
        const p2Move = round.player2Move;

        // Sequential Animation Logic using Promises (matching FightScene)
        const runP1Attack = () => {
          return new Promise<void>((resolve) => {
            // Play P1 animation
            const animKey = `${p1Char}_${p1Move}`;
            if (this.anims.exists(animKey)) {
              this.player1Sprite.setScale(this.getMoveScale(p1Char, p1Move));
              this.player1Sprite.play(animKey);

              // SFX Logic with character-specific delays
              const sfxKey = `sfx_${p1Char}_${p1Move}`;
              if (p1Char === "block-bruiser" && p1Move === "special") {
                this.time.delayedCall(1000, () => this.playSFX(sfxKey));
              } else if ((p1Char === "cyber-ninja" || p1Char === "hash-hunter") && p1Move === "special") {
                this.time.delayedCall(500, () => this.playSFX(sfxKey));
              } else {
                this.playSFX(sfxKey);
              }
            }

            // Show P2 damage delayed
            if (round.player1DamageDealt > 0) {
              this.time.delayedCall(300, () => {
                this.showFloatingText(
                  `-${round.player1DamageDealt}`,
                  meetingPointX + 50,
                  CHARACTER_POSITIONS.PLAYER2.Y - 130,
                  "#ff4444"
                );

                // Flash P2
                this.tweens.add({
                  targets: this.player2Sprite,
                  alpha: 0.5,
                  yoyo: true,
                  duration: 50,
                  repeat: 3
                });
              });
            }

            // Wait for anim to finish (approx 1.2s)
            this.time.delayedCall(1200, () => {
              resolve();
            });
          });
        };

        const runP2Attack = () => {
          return new Promise<void>((resolve) => {
            // Play P2 animation
            const animKey = `${p2Char}_${p2Move}`;
            if (this.anims.exists(animKey)) {
              this.player2Sprite.setScale(this.getMoveScale(p2Char, p2Move));
              this.player2Sprite.play(animKey);

              // SFX Logic with character-specific delays
              const sfxKey = `sfx_${p2Char}_${p2Move}`;
              if (p2Char === "block-bruiser" && p2Move === "special") {
                this.time.delayedCall(1000, () => this.playSFX(sfxKey));
              } else if ((p2Char === "cyber-ninja" || p2Char === "hash-hunter") && p2Move === "special") {
                this.time.delayedCall(500, () => this.playSFX(sfxKey));
              } else {
                this.playSFX(sfxKey);
              }
            }

            // Show P1 damage
            if (round.player2DamageDealt > 0) {
              this.time.delayedCall(300, () => {
                this.showFloatingText(
                  `-${round.player2DamageDealt}`,
                  meetingPointX - 50,
                  CHARACTER_POSITIONS.PLAYER1.Y - 130,
                  "#ff4444"
                );

                // Flash P1
                this.tweens.add({
                  targets: this.player1Sprite,
                  alpha: 0.5,
                  yoyo: true,
                  duration: 50,
                  repeat: 3
                });
              });
            }

            this.time.delayedCall(1200, () => {
              resolve();
            });
          });
        };

        // Execute Sequence
        (async () => {
          // Check for block interaction - if either is blocking, run concurrently
          const isConcurrent = p1Move === "block" || p2Move === "block";

          if (isConcurrent) {
            // Run both simultaneously
            await Promise.all([runP1Attack(), runP2Attack()]);
          } else {
            // Sequential (Attack vs Attack) - P1 goes first
            await runP1Attack();
            await runP2Attack();
          }

          // Show narrative
          const narrative = this.generateNarrative(p1Move, p2Move, round);

          // Destroy old narrative text if it exists
          if (this.narrativeText) {
            this.narrativeText.destroy();
          }

          // Create new text with large font
          this.narrativeText = this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            GAME_DIMENSIONS.HEIGHT - 100,
            narrative,
            {
              fontFamily: "Orbitron",
              fontSize: 14,
              color: "#ffffff",
              align: "center",
              stroke: "#000000",
              strokeThickness: 6,
            }
          ).setOrigin(0.5).setAlpha(0);

          this.tweens.add({
            targets: this.narrativeText,
            alpha: 1,
            duration: 300,
          });

          // Update health
          this.player1Health = round.player1HealthAfter;
          this.player2Health = round.player2HealthAfter;
          this.updateHealthBars();

          // Phase 3: Run back
          this.time.delayedCall(500, () => {
            if (this.anims.exists(`${p1Char}_run`)) {
              this.player1Sprite.setScale(this.getRunScale(p1Char));
              this.player1Sprite.play(`${p1Char}_run`);
            }
            if (this.anims.exists(`${p2Char}_run`)) {
              this.player2Sprite.setScale(this.getRunScale(p2Char));
              this.player2Sprite.play(`${p2Char}_run`);
              this.player2Sprite.setFlipX(true);
            }

            this.tweens.add({
              targets: this.player1Sprite,
              x: p1OriginalX,
              duration: 600,
              ease: "Power2",
            });

            this.tweens.add({
              targets: this.player2Sprite,
              x: p2OriginalX,
              duration: 600,
              ease: "Power2",
              onComplete: () => {
                // Phase 4: Return to idle
                if (this.anims.exists(`${p1Char}_idle`)) {
                  this.player1Sprite.setScale(this.getIdleScale(p1Char));
                  this.player1Sprite.play(`${p1Char}_idle`);
                }
                if (this.anims.exists(`${p2Char}_idle`)) {
                  this.player2Sprite.setScale(this.getIdleScale(p2Char));
                  this.player2Sprite.play(`${p2Char}_idle`);
                }

                // Fade out narrative
                this.tweens.add({
                  targets: this.narrativeText,
                  alpha: 0,
                  duration: 300,
                });

                // Check for round/match end
                if (round.winnerAddress !== null) {
                  // Someone won this round (health reached 0)
                  this.handleRoundEnd(round);
                } else {
                  // Continue to next turn - increased delay to see results
                  this.currentRoundIndex++;
                  this.time.delayedCall(800, () => {
                    this.playNextRound();
                  });
                }
              },
            });
          });
        })();
      },
    });
  }

  private handleRoundEnd(round: ReplayRoundData): void {
    const p1Char = this.config.player1Character || "dag-warrior";
    const p2Char = this.config.player2Character || "dag-warrior";

    // Determine who lost based on health
    const p1Lost = round.player1HealthAfter <= 0;
    const p2Lost = round.player2HealthAfter <= 0;

    // Update round scores
    if (p1Lost) {
      this.player2RoundsWon++;
    } else if (p2Lost) {
      this.player1RoundsWon++;
    }

    // Play death animation on loser
    if (p1Lost && this.anims.exists(`${p1Char}_dead`)) {
      this.player1Sprite.setScale(this.getDeadScale(p1Char));
      this.player1Sprite.play(`${p1Char}_dead`);
    }
    if (p2Lost && this.anims.exists(`${p2Char}_dead`)) {
      this.player2Sprite.setScale(this.getDeadScale(p2Char));
      this.player2Sprite.play(`${p2Char}_dead`);
    }

    // Show round result - create fresh text object
    const roundWinnerText = p1Lost ? "PLAYER 2 WINS ROUND!" : "PLAYER 1 WINS ROUND!";

    // Destroy old narrative text if it exists
    if (this.narrativeText) {
      this.narrativeText.destroy();
    }

    // Create new text with large font
    this.narrativeText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.HEIGHT - 100,
      roundWinnerText,
      {
        fontFamily: "Orbitron",
        fontSize: 14,
        color: "#49eacb",
        align: "center",
        stroke: "#000000",
        strokeThickness: 6,
      }
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.narrativeText,
      alpha: 1,
      duration: 300,
    });

    // Update score text
    this.roundScoreText.setText(
      `Round ${this.currentGameRound}  •  ${this.player1RoundsWon} - ${this.player2RoundsWon}  (First to 3)`
    );

    // Check for match end
    const matchOver = this.player1RoundsWon >= 3 || this.player2RoundsWon >= 3;

    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: this.narrativeText,
        alpha: 0,
        duration: 300,
      });

      if (matchOver) {
        this.showReplayComplete();
      } else {
        // Reset for next round
        this.currentGameRound++;
        this.resetForNextRound();
        this.currentRoundIndex++;
        this.time.delayedCall(1000, () => {
          this.playNextRound();
        });
      }
    });
  }

  private resetForNextRound(): void {
    const p1Char = this.config.player1Character || "dag-warrior";
    const p2Char = this.config.player2Character || "dag-warrior";

    // Reset health
    const p1Stats = getCharacterCombatStats(p1Char);
    const p2Stats = getCharacterCombatStats(p2Char);
    this.player1Health = p1Stats.maxHp;
    this.player2Health = p2Stats.maxHp;
    this.player1MaxHealth = p1Stats.maxHp;
    this.player2MaxHealth = p2Stats.maxHp;

    // Reset energy
    this.player1Energy = p1Stats.maxEnergy;
    this.player2Energy = p2Stats.maxEnergy;
    this.player1MaxEnergy = p1Stats.maxEnergy;
    this.player2MaxEnergy = p2Stats.maxEnergy;

    // Reset guard meters
    this.player1GuardMeterValue = 0;
    this.player2GuardMeterValue = 0;

    // Update UI
    this.updateHealthBars();
    this.updateEnergyBars();
    this.updateGuardMeters();

    // Reset sprites to idle
    if (this.anims.exists(`${p1Char}_idle`)) {
      this.player1Sprite.setScale(this.getIdleScale(p1Char));
      this.player1Sprite.play(`${p1Char}_idle`);
    }
    if (this.anims.exists(`${p2Char}_idle`)) {
      this.player2Sprite.setScale(this.getIdleScale(p2Char));
      this.player2Sprite.play(`${p2Char}_idle`);
    }

    // Update round score text
    this.roundScoreText.setText(
      `Round ${this.currentGameRound}  •  ${this.player1RoundsWon} - ${this.player2RoundsWon}  (First to 3)`
    );
  }

  private showReplayComplete(): void {
    this.isPlaying = false;

    // Play victory SFX
    this.playSFX("sfx_victory");

    // Determine winner
    const winnerIsP1 = this.config.winnerAddress === this.config.player1Address;
    const winnerText = winnerIsP1 ? "PLAYER 1 WINS!" : "PLAYER 2 WINS!";

    // Create overlay
    const overlay = this.add.rectangle(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y,
      GAME_DIMENSIONS.WIDTH,
      GAME_DIMENSIONS.HEIGHT,
      0x000000,
      0.7
    );

    // Victory text
    const victoryText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y - 50,
      winnerText,
      {
        fontFamily: "Orbitron",
        fontSize: "72px",
        color: "#49eacb",
        stroke: "#000000",
        strokeThickness: 6,
      }
    ).setOrigin(0.5);

    // Final score
    const scoreText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y + 40,
      `Final Score: ${this.config.player1RoundsWon} - ${this.config.player2RoundsWon}`,
      {
        fontFamily: "Exo 2",
        fontSize: "32px",
        color: "#ffffff",
      }
    ).setOrigin(0.5);

    // Replay ended badge
    const endBadge = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y + 120,
      "REPLAY COMPLETE",
      {
        fontFamily: "Orbitron",
        fontSize: "24px",
        color: "#888888",
      }
    ).setOrigin(0.5);

    // Animate in
    overlay.setAlpha(0);
    victoryText.setAlpha(0).setScale(0.5);
    scoreText.setAlpha(0);
    endBadge.setAlpha(0);

    this.tweens.add({
      targets: overlay,
      alpha: 0.7,
      duration: 500,
    });

    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      scale: 1,
      duration: 800,
      ease: "Back.out",
      delay: 300,
    });

    this.tweens.add({
      targets: [scoreText, endBadge],
      alpha: 1,
      duration: 500,
      delay: 600,
    });

    // Emit replay complete event
    EventBus.emit("replay:complete", {
      matchId: this.config.matchId,
      winner: this.config.winnerAddress,
    });
  }

  private generateNarrative(p1Move: MoveType, p2Move: MoveType, round: ReplayRoundData): string {
    const moveNames: Record<MoveType, string> = {
      punch: "punches",
      kick: "kicks",
      block: "blocks",
      special: "unleashes special attack",
      stunned: "is stunned",
    };

    const p1Action = moveNames[p1Move];
    const p2Action = moveNames[p2Move];

    if (round.player1DamageDealt > 0 && round.player2DamageDealt > 0) {
      return `Both fighters connect! Player 1 ${p1Action}, Player 2 ${p2Action}!`;
    } else if (round.player1DamageDealt > 0) {
      return `Player 1 ${p1Action} and lands a hit for ${round.player1DamageDealt} damage!`;
    } else if (round.player2DamageDealt > 0) {
      return `Player 2 ${p2Action} and lands a hit for ${round.player2DamageDealt} damage!`;
    } else {
      return `Player 1 ${p1Action}, Player 2 ${p2Action}. No damage dealt!`;
    }
  }

  private showFloatingText(text: string, x: number, y: number, color: string): void {
    const floatText = this.add.text(x, y, text, {
      fontFamily: "Orbitron",
      fontSize: "32px",
      color: color,
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floatText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: "Power2",
      onComplete: () => {
        floatText.destroy();
      },
    });
  }

  // ===========================================================================
  // SETTINGS MENU
  // ===========================================================================

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
    const hitArea = new Phaser.Geom.Circle(25, 25, radius);
    container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
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
    const width = 280;
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
    const title = this.add.text(0, -70, "AUDIO SETTINGS", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#9ca3af",
      fontStyle: "bold"
    }).setOrigin(0.5);
    this.settingsContainer.add(title);

    // BGM Volume Slider
    this.bgmSlider = this.createVolumeSlider(0, -30, "Music", this.bgmVolume, (value) => {
      this.bgmVolume = value;
      this.applyBgmVolume();
      this.saveAudioSettings();
    });
    this.settingsContainer.add(this.bgmSlider);

    // SFX Volume Slider
    this.sfxSlider = this.createVolumeSlider(0, 15, "SFX", this.sfxVolume, (value) => {
      this.sfxVolume = value;
      this.saveAudioSettings();
      // Play a test sound when adjusting
      this.playSFX("sfx_click");
    });
    this.settingsContainer.add(this.sfxSlider);

    // Close button
    const closeBtn = this.add.text(0, 60, "CLOSE", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#6b7280"
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on("pointerover", () => closeBtn.setColor("#ffffff"));
    closeBtn.on("pointerout", () => closeBtn.setColor("#6b7280"));
    closeBtn.on("pointerdown", () => this.toggleSettingsMenu());
    this.settingsContainer.add(closeBtn);
  }

  /**
   * Create a volume slider control.
   */
  private createVolumeSlider(
    x: number,
    y: number,
    label: string,
    initialValue: number,
    onChange: (value: number) => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const sliderWidth = 140;
    const sliderHeight = 8;
    const knobRadius = 10;

    // Label
    const labelText = this.add.text(-120, 0, label, {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#9ca3af"
    }).setOrigin(0, 0.5);
    container.add(labelText);

    // Track start X
    const trackOffsetX = 10;
    const trackStartX = -sliderWidth / 2 + trackOffsetX;

    // Track background
    const trackBg = this.add.graphics();
    trackBg.fillStyle(0x1e293b, 1);
    trackBg.fillRoundedRect(trackStartX, -sliderHeight / 2, sliderWidth, sliderHeight, 4);
    container.add(trackBg);

    // Track fill (progress)
    const trackFill = this.add.graphics();
    container.add(trackFill);

    // Knob
    const knob = this.add.graphics();
    container.add(knob);

    // Percentage text
    const percentText = this.add.text(sliderWidth / 2 + 25, 0, `${Math.round(initialValue * 100)}%`, {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#6b7280"
    }).setOrigin(0, 0.5);
    container.add(percentText);

    // Update visual based on value
    const updateSliderVisual = (value: number) => {
      const fillWidth = sliderWidth * value;
      const knobX = trackStartX + fillWidth;

      trackFill.clear();
      trackFill.fillStyle(0x3b82f6, 1);
      trackFill.fillRoundedRect(trackStartX, -sliderHeight / 2, fillWidth, sliderHeight, 4);

      knob.clear();
      knob.fillStyle(0x3b82f6, 1);
      knob.fillCircle(knobX, 0, knobRadius);
      knob.fillStyle(0x1e40af, 1);
      knob.fillCircle(knobX, 0, knobRadius - 3);

      percentText.setText(`${Math.round(value * 100)}%`);
    };

    updateSliderVisual(initialValue);

    // Make the entire track area interactive
    const hitArea = this.add.rectangle(0, 0, 240, 30, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    // Drag handling
    let isDragging = false;

    const calculateValue = (pointerX: number): number => {
      const localX = pointerX - container.x - this.settingsContainer.x;
      const trackEndX = trackStartX + sliderWidth;
      const clampedX = Phaser.Math.Clamp(localX, trackStartX, trackEndX);
      return (clampedX - trackStartX) / sliderWidth;
    };

    hitArea.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      const newValue = calculateValue(pointer.x);
      updateSliderVisual(newValue);
      onChange(newValue);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        const newValue = calculateValue(pointer.x);
        updateSliderVisual(newValue);
        onChange(newValue);
      }
    });

    this.input.on("pointerup", () => {
      isDragging = false;
    });

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
}
