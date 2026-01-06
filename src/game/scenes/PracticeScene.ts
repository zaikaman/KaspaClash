/**
 * PracticeScene - Offline practice mode against AI
 * Mirrors FightScene UI/UX exactly, but with local AI instead of network play
 */

import Phaser from "phaser";
import { EventBus } from "@/game/EventBus";
import { GAME_DIMENSIONS, CHARACTER_POSITIONS, UI_POSITIONS } from "@/game/config";
import { CombatEngine, BASE_MOVE_STATS } from "@/game/combat";
import { AIOpponent, type AIDifficulty } from "@/lib/game/ai-opponent";
import { getAIThinkTime } from "@/lib/game/ai-difficulty";
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
 * PracticeScene - Mirrors FightScene UI/UX for offline AI battles.
 */
export class PracticeScene extends Phaser.Scene {
  // Configuration
  private config!: PracticeSceneConfig;
  private playerCharacter!: Character;
  private aiCharacter!: Character;
  private ai!: AIOpponent;

  // Combat Engine (same as FightScene)
  private combatEngine!: CombatEngine;

  // UI Elements (mirroring FightScene exactly)
  private player1HealthBar!: Phaser.GameObjects.Graphics;
  private player2HealthBar!: Phaser.GameObjects.Graphics;
  private player1EnergyBar!: Phaser.GameObjects.Graphics;
  private player2EnergyBar!: Phaser.GameObjects.Graphics;
  private player1GuardMeter!: Phaser.GameObjects.Graphics;
  private player2GuardMeter!: Phaser.GameObjects.Graphics;
  private roundTimerText!: Phaser.GameObjects.Text;
  private roundScoreText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private turnIndicatorText!: Phaser.GameObjects.Text;
  private narrativeText!: Phaser.GameObjects.Text;

  // Character sprites
  private player1Sprite!: Phaser.GameObjects.Sprite;
  private player2Sprite!: Phaser.GameObjects.Sprite;

  // Move buttons (same structure as FightScene)
  private moveButtons: Map<MoveType, Phaser.GameObjects.Container> = new Map();
  private selectedMove: MoveType | null = null;

  // Timer
  private turnTimer: number = 15;
  private timerEvent?: Phaser.Time.TimerEvent;

  // State (same phases as FightScene)
  private phase: "countdown" | "selecting" | "resolving" | "round_end" | "match_end" = "countdown";

  // Match result overlay
  private matchResultOverlay!: Phaser.GameObjects.Container;

  // Audio settings
  private bgmVolume: number = 0.3;
  private sfxVolume: number = 0.5;
  private bgmSlider?: Phaser.GameObjects.Container;
  private sfxSlider?: Phaser.GameObjects.Container;

  // Settings menu
  private settingsContainer!: Phaser.GameObjects.Container;
  private isSettingsOpen: boolean = false;

  constructor() {
    super({ key: "PracticeScene" });
  }

  /**
   * Initialize scene with configuration.
   */
  init(data: PracticeSceneConfig): void {
    this.config = data;
    this.resetFullState();
  }

  /**
   * Reset all state for new match.
   */
  private resetFullState(): void {
    // Get characters
    this.playerCharacter = getCharacter(this.config.playerCharacterId) ?? getRandomCharacter();
    this.aiCharacter = getRandomCharacter();

    // Ensure AI doesn't pick same character as player
    while (this.aiCharacter.id === this.playerCharacter.id) {
      this.aiCharacter = getRandomCharacter();
    }

    // Create AI opponent
    this.ai = new AIOpponent(this.config.aiDifficulty);

    // Reset state
    this.selectedMove = null;
    this.turnTimer = 15;
    this.phase = "countdown";
    this.moveButtons.clear();
  }

  /**
   * Preload assets.
   */
  preload(): void {
    // Load arena background
    this.load.image("arena-bg", "/assets/dojo.webp");

    // Load move icons
    this.load.image("move_punch", "/assets/icons/punch.webp");
    this.load.image("move_kick", "/assets/icons/kick.webp");
    this.load.image("move_block", "/assets/icons/block.webp");
    this.load.image("move_special", "/assets/icons/special.webp");

    // Load Audio
    this.load.audio("bgm_dojo", "/assets/audio/dojo.mp3");
    this.load.audio("sfx_victory", "/assets/audio/victory.mp3");
    this.load.audio("sfx_defeat", "/assets/audio/defeat.mp3");

    // UI SFX
    this.load.audio("sfx_hover", "/assets/audio/hover.mp3");
    this.load.audio("sfx_click", "/assets/audio/click.mp3");
    this.load.audio("sfx_cd_fight", "/assets/audio/3-2-1-fight.mp3");

    // Character SFX
    const audioChars = ["cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"];
    audioChars.forEach(charId => {
      this.load.audio(`sfx_${charId}_punch`, `/assets/audio/${charId}-punch.mp3`);
      this.load.audio(`sfx_${charId}_kick`, `/assets/audio/${charId}-kick.mp3`);
      this.load.audio(`sfx_${charId}_block`, `/assets/audio/${charId}-block.mp3`);
      this.load.audio(`sfx_${charId}_special`, `/assets/audio/${charId}-special.mp3`);
    });

    // Load character spritesheets for all characters
    const characters = ["cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"];
    characters.forEach((charId) => {
      // idle: block-bruiser 305x260, dag-warrior 301x253, hash-hunter 310x234, standard 232x450
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
      if (charId === "block-bruiser") {
        this.load.spritesheet(`char_${charId}_dead`, `/characters/${charId}/dead.webp`, {
          frameWidth: 551, frameHeight: 380,
        });
      } else if (charId === "cyber-ninja") {
        this.load.spritesheet(`char_${charId}_dead`, `/characters/${charId}/dead.webp`, {
          frameWidth: 408, frameHeight: 305,
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
  }

  /**
   * Create scene elements.
   */
  create(): void {
    // Load audio settings from localStorage
    this.loadAudioSettings();

    // Initialize combat engine (same as FightScene)
    const matchFormat = this.config.matchFormat === "best_of_5" ? "best_of_5" : "best_of_3";
    this.combatEngine = new CombatEngine(
      this.playerCharacter.id,
      this.aiCharacter.id,
      matchFormat
    );

    // Create animations
    this.createAnimations();

    // Background
    this.createBackground();

    // Character sprites
    this.createCharacterSprites();

    // UI Elements (mirroring FightScene)
    this.createHealthBars();
    this.createEnergyBars();
    this.createGuardMeters();
    this.createRoundTimer();
    this.createRoundScore();
    this.createMoveButtons();
    this.createNarrativeDisplay();
    this.createTurnIndicator();
    this.createCountdownOverlay();

    // UI - Settings
    this.settingsContainer = this.add.container(0, 0);
    this.createSettingsButton();
    this.createSettingsMenu();

    // Setup event listeners
    this.setupEventListeners();

    // Sync UI with initial state
    this.syncUIWithCombatState();

    // Start the round
    this.startRound();

    EventBus.emit("practice_scene_ready");

    // Play BGM - keep playing even when tab loses focus
    this.sound.pauseOnBlur = false;
    if (this.sound.get("bgm_dojo")) {
      if (!this.sound.get("bgm_dojo").isPlaying) {
        this.sound.play("bgm_dojo", { loop: true, volume: this.bgmVolume });
      }
    } else {
      this.sound.play("bgm_dojo", { loop: true, volume: this.bgmVolume });
    }

    // Handle scene shutdown - stop BGM
    this.events.once("shutdown", this.handleShutdown, this);
    this.events.once("destroy", this.handleShutdown, this);
  }

  /**
   * Helper to play SFX with duration cap (5s max) and configurable volume
   */
  private playSFX(key: string): void {
    if (this.game.sound.locked) {
      // Audio might be locked by browser policies, can't force it
      return;
    }

    try {
      this.sound.play(key, { volume: this.sfxVolume });
      // Stop after 5 seconds max (enough for countdown)
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
    const bgm = this.sound.get("bgm_dojo");
    if (bgm && "setVolume" in bgm) {
      (bgm as Phaser.Sound.WebAudioSound).setVolume(this.bgmVolume);
    }
  }

  /**
   * Handle scene shutdown - stop BGM.
   */
  private handleShutdown(): void {
    const bgm = this.sound.get("bgm_dojo");
    if (bgm && bgm.isPlaying) {
      bgm.stop();
    }
  }

  /**
   * Create character animations.
   */
  private createAnimations(): void {
    const characters = ["cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"];

    characters.forEach((charId) => {
      const animations = ["idle", "punch", "kick", "block", "special", "dead"];

      animations.forEach((anim) => {
        const key = `char_${charId}_${anim}`;
        const animKey = `${charId}_${anim}`;

        if (this.textures.exists(key) && !this.anims.exists(animKey)) {
          this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(key, { start: 0, end: 35 }),
            frameRate: 24,
            repeat: anim === "idle" ? -1 : 0,
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
    if (this.textures.exists("arena-bg")) {
      const bg = this.add.image(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y, "arena-bg");
      bg.setDisplaySize(GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
    } else {
      const graphics = this.add.graphics();
      graphics.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a1a2e, 0x1a1a2e, 1);
      graphics.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
    }

    // Practice mode indicator
    this.add.text(GAME_DIMENSIONS.CENTER_X, 20, "PRACTICE MODE", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#888888",
    }).setOrigin(0.5);

    // AI difficulty indicator
    this.add.text(GAME_DIMENSIONS.CENTER_X, 38, `AI: ${this.config.aiDifficulty.toUpperCase()}`, {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#666666",
    }).setOrigin(0.5);
  }

  // ===========================================================================
  // CHARACTER SPRITES
  // ===========================================================================

  private createCharacterSprites(): void {
    const p1Char = this.playerCharacter.id;
    const p2Char = this.aiCharacter.id;

    // Scale constants (mirroring FightScene)
    // Base: idle is 232x450, we use 0.45 scale (approx 200px height)
    const IDLE_SCALE = 0.45;
    const BB_IDLE_SCALE = 0.95;     // 260px * 0.95 = 247px
    const DW_IDLE_SCALE = 0.90;     // 253px * 0.80 -> adjusted to 0.90
    const HH_IDLE_SCALE = 0.90;

    // Player 1 sprite (left side)
    const p1TextureKey = `char_${p1Char}_idle`;
    const p1YOffset = p1Char === "block-bruiser" ? 70 : 50;

    // Calculate P1 scale
    let p1Scale = IDLE_SCALE;
    if (p1Char === "block-bruiser") p1Scale = BB_IDLE_SCALE;
    else if (p1Char === "dag-warrior") p1Scale = DW_IDLE_SCALE;
    else if (p1Char === "hash-hunter") p1Scale = HH_IDLE_SCALE;

    this.player1Sprite = this.add.sprite(
      CHARACTER_POSITIONS.PLAYER1.X,
      CHARACTER_POSITIONS.PLAYER1.Y - p1YOffset,
      p1TextureKey
    );
    this.player1Sprite.setScale(p1Scale);
    this.player1Sprite.setOrigin(0.5, 0.5);
    if (this.anims.exists(`${p1Char}_idle`)) {
      this.player1Sprite.play(`${p1Char}_idle`);
    }

    // Player 2 sprite (right side, flipped)
    const p2TextureKey = `char_${p2Char}_idle`;
    const p2YOffset = p2Char === "block-bruiser" ? 70 : 50;

    // Calculate P2 scale
    let p2Scale = IDLE_SCALE;
    if (p2Char === "block-bruiser") p2Scale = BB_IDLE_SCALE;
    else if (p2Char === "dag-warrior") p2Scale = DW_IDLE_SCALE;
    else if (p2Char === "hash-hunter") p2Scale = HH_IDLE_SCALE;

    this.player2Sprite = this.add.sprite(
      CHARACTER_POSITIONS.PLAYER2.X,
      CHARACTER_POSITIONS.PLAYER2.Y - p2YOffset,
      p2TextureKey
    );
    this.player2Sprite.setScale(p2Scale);
    this.player2Sprite.setOrigin(0.5, 0.5);
    this.player2Sprite.setFlipX(true);
    if (this.anims.exists(`${p2Char}_idle`)) {
      this.player2Sprite.play(`${p2Char}_idle`);
    }

    // Add identifier above the local player
    this.createPlayerIndicator();
  }

  private createPlayerIndicator(): void {
    const x = this.player1Sprite.x;
    const y = this.player1Sprite.y - 120;

    const container = this.add.container(x, y);

    const text = this.add.text(0, 0, "YOU", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#22c55e",
      fontStyle: "bold",
      backgroundColor: "#00000080",
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);

    const arrow = this.add.text(0, 20, "▼", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#22c55e",
    }).setOrigin(0.5);

    container.add([text, arrow]);

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
  // HEALTH BARS (same as FightScene)
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

    // Player labels
    const state = this.combatEngine.getState();

    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y - 18,
      `YOU: ${state.player1.characterId.toUpperCase()} (${state.player1.maxHp} HP)`,
      { fontFamily: "monospace", fontSize: "12px", color: "#22c55e", fontStyle: "bold" }
    );

    this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X + barWidth,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y - 18,
      `AI: ${state.player2.characterId.toUpperCase()} (${state.player2.maxHp} HP)`,
      { fontFamily: "monospace", fontSize: "12px", color: "#40e0d0" }
    ).setOrigin(1, 0);
  }

  private createHealthBar(
    x: number, y: number, width: number, height: number, player: "player1" | "player2"
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
  // ENERGY BARS (same as FightScene)
  // ===========================================================================

  private createEnergyBars(): void {
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
    const barHeight = 12;
    const yOffset = 30;

    this.createEnergyBar(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + yOffset,
      barWidth,
      barHeight,
      "player1"
    );

    this.createEnergyBar(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + yOffset,
      barWidth,
      barHeight,
      "player2"
    );
  }

  private createEnergyBar(
    x: number, y: number, width: number, height: number, player: "player1" | "player2"
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
  // GUARD METERS (same as FightScene)
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
  // ROUND TIMER (same as FightScene)
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
  // ROUND SCORE (same as FightScene)
  // ===========================================================================

  private createRoundScore(): void {
    const roundsToWin = this.config.matchFormat === "best_of_5" ? 3 : 2;
    this.roundScoreText = this.add.text(
      UI_POSITIONS.ROUND_INDICATOR.X,
      UI_POSITIONS.ROUND_INDICATOR.Y,
      `Round 1  •  0 - 0  (First to ${roundsToWin})`,
      { fontFamily: "monospace", fontSize: "16px", color: "#ffffff" }
    ).setOrigin(0.5);
  }

  // ===========================================================================
  // MOVE BUTTONS (same as FightScene)
  // ===========================================================================

  private createMoveButtons(): void {
    const moves: MoveType[] = ["punch", "kick", "block", "special"];
    const buttonWidth = 140; // Narrower, taller card style
    const buttonHeight = 160;
    const spacing = 20;
    const totalWidth = moves.length * buttonWidth + (moves.length - 1) * spacing;
    const startX = (GAME_DIMENSIONS.WIDTH - totalWidth) / 2 + buttonWidth / 2;
    const y = GAME_DIMENSIONS.HEIGHT - 100;

    // Label
    this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      y - 95,
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
    x: number, y: number, width: number, height: number, move: MoveType
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
        this.sound.play("sfx_hover", { volume: 0.5 });
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
      if (this.phase === "selecting") {
        this.sound.play("sfx_click", { volume: 0.5 });
        this.selectMove(move);
      }
    });

    return container;
  }

  /* getMoveInfoText removed */

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

    // Update turn indicator
    this.turnIndicatorText.setText("AI is thinking...");
    this.turnIndicatorText.setColor("#f97316");

    // Disable buttons while AI thinks
    this.moveButtons.forEach(btn => btn.setAlpha(0.4).disableInteractive());

    // Stop timer
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    // AI makes decision after "thinking" delay
    const thinkTime = getAIThinkTime(this.config.aiDifficulty);
    this.time.delayedCall(thinkTime, () => {
      this.aiMakeDecision();
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
          y: GAME_DIMENSIONS.HEIGHT - 110,
          duration: 200,
          ease: "Back.easeOut",
        });

        // Highlight effect
        const bg = button.list[0] as Phaser.GameObjects.Graphics;
        bg.clear();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRoundedRect(-70, -80, 140, 160, 12);
        bg.lineStyle(4, 0xffffff, 1);
        bg.strokeRoundedRect(-70, -80, 140, 160, 12);

      } else {
        // Unselected state
        const isAffordable = this.combatEngine.canAffordMove("player1", move);

        this.tweens.add({
          targets: button,
          alpha: isAffordable ? (isSelected ? 0.5 : 1) : 0.3,
          scaleX: 1,
          scaleY: 1,
          y: GAME_DIMENSIONS.HEIGHT - 100,
          duration: 200,
          ease: "Power2",
        });

        // Reset style
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

  private updateMoveButtonAffordability(): void {
    const moves: MoveType[] = ["punch", "kick", "block", "special"];

    moves.forEach((move) => {
      const canAfford = this.combatEngine.canAffordMove("player1", move);
      const container = this.moveButtons.get(move);
      if (container) {
        container.setAlpha(canAfford ? 1 : 0.4);
        if (canAfford) {
          container.setInteractive();
        } else {
          container.disableInteractive();
        }
      }
    });
  }

  // ===========================================================================
  // TURN INDICATOR
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
  // GAME FLOW (same as FightScene)
  // ===========================================================================

  private startRound(): void {
    this.phase = "countdown";

    // Play SFX first (full "3-2-1 Fight" sequence)
    this.playSFX("sfx_cd_fight");

    // Delay visual countdown slightly to match audio timing (approx 0.3s before "3" appears)
    this.time.delayedCall(300, () => {
      this.showCountdown(3);
    });
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
              // SFX already played at start
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
    // Destroy existing timer
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    this.phase = "selecting";
    this.selectedMove = null;
    this.turnTimer = 15;

    // Get current state to check if player is stunned
    const state = this.combatEngine.getState();

    // Check if player is stunned
    if (state.player1.isStunned) {
      // Player is stunned - show message and disable buttons
      this.turnIndicatorText.setText("YOU ARE STUNNED!");
      this.turnIndicatorText.setColor("#ff4444");
      this.roundTimerText.setColor("#ff4444");

      // Disable all buttons visually
      this.moveButtons.forEach(btn => {
        btn.setAlpha(0.3);
        btn.disableInteractive();
      });

      // Flash the stun message
      this.tweens.add({
        targets: this.turnIndicatorText,
        alpha: { from: 1, to: 0.5 },
        duration: 300,
        yoyo: true,
        repeat: 2,
      });

      // AI makes its decision immediately (player can't act)
      const thinkTime = getAIThinkTime(this.config.aiDifficulty);
      this.time.delayedCall(thinkTime, () => {
        // Update AI context with stunned state before deciding
        this.ai.updateContext({
          aiHealth: state.player2.hp,
          playerHealth: state.player1.hp,
          roundNumber: state.currentRound,
          playerRoundsWon: state.player1.roundsWon,
          aiRoundsWon: state.player2.roundsWon,
          playerIsStunned: true,
          aiEnergy: state.player2.energy,
        });
        const decision = this.ai.decide();
        const aiMove = decision.move;
        // Player's move doesn't matter when stunned - use punch as placeholder
        this.resolveRound("punch", aiMove);
      });
      return;
    }

    // Normal selection phase (player not stunned)
    this.turnIndicatorText.setText("Select your move!");
    this.turnIndicatorText.setColor("#888888");
    this.roundTimerText.setColor("#40e0d0");

    // Reset button visuals and affordability
    this.resetButtonVisuals();
    this.updateMoveButtonAffordability();

    // Start timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
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

    // Update AI context
    this.ai.updateContext({
      aiHealth: state.player2.hp,
      playerHealth: state.player1.hp,
      roundNumber: state.currentRound,
      playerRoundsWon: state.player1.roundsWon,
      aiRoundsWon: state.player2.roundsWon,
    });
  }

  private onTimerExpired(): void {
    if (this.phase !== "selecting") return;

    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    // Auto-select punch if no move selected
    if (!this.selectedMove) {
      this.selectedMove = "punch";
    }

    this.turnIndicatorText.setText("Time's up! Auto-selecting...");
    this.turnIndicatorText.setColor("#ff8800");

    this.moveButtons.forEach(btn => btn.setAlpha(0.4).disableInteractive());

    // AI makes its decision
    const thinkTime = getAIThinkTime(this.config.aiDifficulty);
    this.time.delayedCall(thinkTime, () => {
      this.aiMakeDecision();
    });
  }

  private aiMakeDecision(): void {
    // Update AI context with current state
    const state = this.combatEngine.getState();
    this.ai.updateContext({
      aiHealth: state.player2.hp,
      playerHealth: state.player1.hp,
      roundNumber: state.currentRound,
      playerRoundsWon: state.player1.roundsWon,
      aiRoundsWon: state.player2.roundsWon,
      playerIsStunned: state.player1.isStunned || false,
      aiEnergy: state.player2.energy,
    });

    const decision = this.ai.decide();
    const aiMove = decision.move;

    // Record player's move to AI memory
    this.ai.recordPlayerMove(this.selectedMove!);

    // Resolve the turn
    this.resolveRound(this.selectedMove!, aiMove);
  }

  private resolveRound(playerMove: MoveType, aiMove: MoveType): void {
    this.phase = "resolving";

    // Execute moves in combat engine - returns TurnResult
    const turnResult = this.combatEngine.resolveTurn(playerMove, aiMove);

    // Get updated state
    const state = this.combatEngine.getState();

    const p1Char = this.playerCharacter.id;
    const p2Char = this.aiCharacter.id;

    // Scale constants (mirroring FightScene)
    const IDLE_SCALE = 0.45;
    const RUN_SCALE = 0.71;
    const PUNCH_SCALE = 0.78;
    const KICK_SCALE = 0.75;
    const BLOCK_SCALE = 0.80;
    const SPECIAL_SCALE = 0.80;

    const BB_IDLE_SCALE = 0.95;
    const BB_RUN_SCALE = 0.90;
    const BB_PUNCH_SCALE = 0.94;
    const BB_KICK_SCALE = 0.90;
    const BB_BLOCK_SCALE = 0.90;
    const BB_SPECIAL_SCALE = 0.90;

    const DW_IDLE_SCALE = 0.90;
    const DW_RUN_SCALE = 0.96;
    const DW_PUNCH_SCALE = 0.90;
    const DW_KICK_SCALE = 0.90;
    const DW_BLOCK_SCALE = 0.90;
    const DW_SPECIAL_SCALE = 0.90;

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

    // Check if either player was stunned (outcome "stunned" means they missed this turn)
    const p1WasStunned = turnResult.player1.outcome === "stunned";
    const p2WasStunned = turnResult.player2.outcome === "stunned";

    // Determine movement targets based on stun state
    let p1TargetX: number;
    let p2TargetX: number;

    if (p1WasStunned && !p2WasStunned) {
      // Player 1 is stunned - AI runs to player 1's position
      p1TargetX = p1OriginalX; // Player stays in place
      p2TargetX = p1OriginalX + 100; // AI runs to player's position
    } else if (p2WasStunned && !p1WasStunned) {
      // Player 2 (AI) is stunned - Player runs to AI's position
      p1TargetX = p2OriginalX - 100; // Player runs to AI's position
      p2TargetX = p2OriginalX; // AI stays in place
    } else {
      // Normal case - both meet in the middle
      p1TargetX = meetingPointX - 50;
      p2TargetX = meetingPointX + 50;
    }

    // Phase 1: Run animations (only for non-stunned characters)
    if (!p1WasStunned && this.anims.exists(`${p1Char}_run`)) {
      const p1RunScale = p1Char === "block-bruiser" ? BB_RUN_SCALE : p1Char === "dag-warrior" ? DW_RUN_SCALE : p1Char === "hash-hunter" ? HH_RUN_SCALE : RUN_SCALE;
      this.player1Sprite.setScale(p1RunScale);
      this.player1Sprite.play(`${p1Char}_run`);
    }
    if (!p2WasStunned && this.anims.exists(`${p2Char}_run`)) {
      const p2RunScale = p2Char === "block-bruiser" ? BB_RUN_SCALE : p2Char === "dag-warrior" ? DW_RUN_SCALE : p2Char === "hash-hunter" ? HH_RUN_SCALE : RUN_SCALE;
      this.player2Sprite.setScale(p2RunScale);
      this.player2Sprite.play(`${p2Char}_run`);
    }

    // Tween to target positions
    this.tweens.add({
      targets: this.player1Sprite,
      x: p1TargetX,
      duration: 600,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: this.player2Sprite,
      x: p2TargetX,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        // Phase 2: Player 1 Attack (Sequential)
        const runP1Attack = () => {
          return new Promise<void>((resolve) => {
            if (p1WasStunned) {
              resolve(); // Skip if stunned
              return;
            }

            // Play P1 animation
            const animKey = `${p1Char}_${playerMove}`;
            if (this.anims.exists(animKey)) {
              // Scale Logic (simplified from original for brevity, relies on helper vars)
              // We'll reuse the scale logic blocks or simplify access
              let scale = 0.45; // Default fallback
              if (playerMove === "kick") scale = p1Char === "block-bruiser" ? BB_KICK_SCALE : p1Char === "dag-warrior" ? DW_KICK_SCALE : p1Char === "hash-hunter" ? HH_KICK_SCALE : KICK_SCALE;
              else if (playerMove === "punch") scale = p1Char === "block-bruiser" ? BB_PUNCH_SCALE : p1Char === "dag-warrior" ? DW_PUNCH_SCALE : p1Char === "hash-hunter" ? HH_PUNCH_SCALE : PUNCH_SCALE;
              else if (playerMove === "block") scale = p1Char === "block-bruiser" ? BB_BLOCK_SCALE : p1Char === "dag-warrior" ? DW_BLOCK_SCALE : p1Char === "hash-hunter" ? HH_BLOCK_SCALE : BLOCK_SCALE;
              else if (playerMove === "special") scale = p1Char === "block-bruiser" ? BB_SPECIAL_SCALE : p1Char === "dag-warrior" ? DW_SPECIAL_SCALE : p1Char === "hash-hunter" ? HH_SPECIAL_SCALE : SPECIAL_SCALE;

              this.player1Sprite.setScale(scale);

              // Play Animation & SFX Logic
              // Animation plays immediately, but audio timing varies:
              // - Block Bruiser Special: Audio delayed 1s (to sync with impact)
              // - Cyber Ninja Special: Audio delayed 0.5s (to sync with impact)
              this.player1Sprite.play(animKey);

              // SFX Logic with character-specific delays
              const sfxKey = `sfx_${p1Char}_${playerMove}`;
              if (p1Char === "block-bruiser" && playerMove === "special") {
                this.time.delayedCall(1000, () => this.playSFX(sfxKey));
              } else if ((p1Char === "cyber-ninja" || p1Char === "hash-hunter") && playerMove === "special") {
                this.time.delayedCall(500, () => this.playSFX(sfxKey));
              } else {
                this.playSFX(sfxKey);
              }
            }

            // Show narrative for P1
            this.turnIndicatorText.setText(playerMove.toUpperCase());
            this.turnIndicatorText.setColor("#22c55e"); // Player color

            // Show P2 damage delayed
            if (turnResult.player2.damageTaken > 0) {
              this.time.delayedCall(300, () => { // Hit impact timing
                this.showFloatingText(`-${turnResult.player2.damageTaken}`, p2OriginalX - 50, CHARACTER_POSITIONS.PLAYER2.Y - 130, "#ff4444");

                // Play P2 Hurt anim if not blocking/special-ing? 
                // For now just keep it simple as sound only or flash
                this.tweens.add({
                  targets: this.player2Sprite,
                  alpha: 0.5,
                  yoyo: true,
                  duration: 50,
                  repeat: 3
                });
              });
            }

            // Wait for anim to finish (approx 1s)
            this.time.delayedCall(1200, () => {
              resolve();
            });
          });
        };

        // Phase 3: Player 2 Attack (Sequential)
        const runP2Attack = () => {
          return new Promise<void>((resolve) => {
            if (p2WasStunned) {
              resolve();
              return;
            }

            // Play AI animation
            const animKey = `${p2Char}_${aiMove}`;
            if (this.anims.exists(animKey)) {
              let scale = 0.45;
              if (aiMove === "kick") scale = p2Char === "block-bruiser" ? BB_KICK_SCALE : p2Char === "dag-warrior" ? DW_KICK_SCALE : p2Char === "hash-hunter" ? HH_KICK_SCALE : KICK_SCALE;
              else if (aiMove === "punch") scale = p2Char === "block-bruiser" ? BB_PUNCH_SCALE : p2Char === "dag-warrior" ? DW_PUNCH_SCALE : p2Char === "hash-hunter" ? HH_PUNCH_SCALE : PUNCH_SCALE;
              else if (aiMove === "block") scale = p2Char === "block-bruiser" ? BB_BLOCK_SCALE : p2Char === "dag-warrior" ? DW_BLOCK_SCALE : p2Char === "hash-hunter" ? HH_BLOCK_SCALE : BLOCK_SCALE;
              else if (aiMove === "special") scale = p2Char === "block-bruiser" ? BB_SPECIAL_SCALE : p2Char === "dag-warrior" ? DW_SPECIAL_SCALE : p2Char === "hash-hunter" ? HH_SPECIAL_SCALE : SPECIAL_SCALE;

              this.player2Sprite.setScale(scale);

              // Play Animation & SFX Logic
              // Animation plays immediately, audio timing varies by character
              this.player2Sprite.play(animKey);

              // SFX Logic with character-specific delays
              const sfxKey = `sfx_${p2Char}_${aiMove}`;
              if (p2Char === "block-bruiser" && aiMove === "special") {
                this.time.delayedCall(1000, () => this.playSFX(sfxKey));
              } else if ((p2Char === "cyber-ninja" || p2Char === "hash-hunter") && aiMove === "special") {
                this.time.delayedCall(500, () => this.playSFX(sfxKey));
              } else {
                this.playSFX(sfxKey);
              }
            }

            // Narrative
            this.turnIndicatorText.setText(aiMove.toUpperCase());
            this.turnIndicatorText.setColor("#ef4444"); // AI color

            // Show P1 damage
            if (turnResult.player1.damageTaken > 0) {
              this.time.delayedCall(300, () => {
                this.showFloatingText(`-${turnResult.player1.damageTaken}`, p1OriginalX + 50, CHARACTER_POSITIONS.PLAYER1.Y - 130, "#ff4444");
                this.tweens.add({
                  targets: this.player1Sprite,
                  alpha: 0.5,
                  yoyo: true,
                  duration: 50,
                  repeat: 3
                });
              });
            }

            // Wait for anim to finish (approx 1s)
            this.time.delayedCall(1200, () => {
              resolve();
            });
          });
        };

        // Execute Sequence
        (async () => {
          // Check for block interaction
          const isConcurrent = playerMove === "block" || aiMove === "block";

          if (isConcurrent) {
            await Promise.all([runP1Attack(), runP2Attack()]);
          } else {
            // P1 goes first
            await runP1Attack();
            // Then P2
            await runP2Attack();
          }

          // Show overall narrative
          let narrative = "";
          if (p1WasStunned && p2WasStunned) {
            narrative = "Both players are stunned!";
          } else if (p1WasStunned) {
            narrative = `You are STUNNED! AI uses ${aiMove}!`;
          } else if (p2WasStunned) {
            narrative = `AI is STUNNED! You use ${playerMove}!`;
          } else if (turnResult.player1.damageTaken > 0 && turnResult.player2.damageTaken > 0) {
            narrative = "Both players trade heavy blows!";
          } else if (turnResult.player2.damageTaken > 0) {
            narrative = `You hit for ${turnResult.player2.damageTaken} damage!`;
          } else if (turnResult.player1.damageTaken > 0) {
            narrative = `AI hits for ${turnResult.player1.damageTaken} damage!`;
          } else {
            narrative = "Both attacks were blocked or missed!";
          }
          this.narrativeText.setText(narrative);
          this.narrativeText.setAlpha(1);

          // Phase 4: Sync UI & Return
          this.syncUIWithCombatState();

          // Run back animations
          if (this.anims.exists(`${p1Char}_run`)) {
            const p1RunScale = p1Char === "block-bruiser" ? BB_RUN_SCALE : p1Char === "dag-warrior" ? DW_RUN_SCALE : p1Char === "hash-hunter" ? HH_RUN_SCALE : RUN_SCALE;
            this.player1Sprite.setScale(p1RunScale);
            this.player1Sprite.play(`${p1Char}_run`);
          }
          if (this.anims.exists(`${p2Char}_run`)) {
            const p2RunScale = p2Char === "block-bruiser" ? BB_RUN_SCALE : p2Char === "dag-warrior" ? DW_RUN_SCALE : p2Char === "hash-hunter" ? HH_RUN_SCALE : RUN_SCALE;
            this.player2Sprite.setScale(p2RunScale);
            this.player2Sprite.play(`${p2Char}_run`);
            this.player2Sprite.setFlipX(true); // Ensure facing correct way
          }

          // Tween back
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
              // Phase 5: Return to idle
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

              // Check result
              if (state.isMatchOver) {
                this.showMatchEnd();
              } else if (state.isRoundOver) {
                this.showRoundEnd();
              } else {
                this.startSelectionPhase();
              }
            }
          });
        })();
      }
    });
  }

  private showDamageNumbers(turnResult: { player1: { damageTaken: number }, player2: { damageTaken: number } }, centerX: number): void {
    // Show damage taken by player (if any)
    if (turnResult.player1.damageTaken > 0) {
      this.showFloatingText(
        `-${turnResult.player1.damageTaken}`,
        centerX - 50,
        CHARACTER_POSITIONS.PLAYER1.Y - 130,
        "#ff4444"
      );
    }

    // Show damage taken by AI (if any)
    if (turnResult.player2.damageTaken > 0) {
      this.showFloatingText(
        `-${turnResult.player2.damageTaken}`,
        centerX + 50,
        CHARACTER_POSITIONS.PLAYER2.Y - 130,
        "#ff4444"
      );
    }
  }

  private showFloatingText(text: string, x: number, y: number, color: string): void {
    const floatText = this.add.text(x, y, text, {
      fontFamily: "monospace",
      fontSize: "28px",
      color: color,
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floatText,
      y: y - 60,
      alpha: 0,
      duration: 1000,
      ease: "Power2",
      onComplete: () => floatText.destroy(),
    });
  }

  private showRoundEnd(): void {
    this.phase = "round_end";
    const state = this.combatEngine.getState();
    const roundsToWin = this.config.matchFormat === "best_of_5" ? 3 : 2;

    // Dead animation logic
    // Scales for dead animation
    const DEAD_SCALE = 0.70;
    const BB_DEAD_SCALE = 0.65;
    const DW_DEAD_SCALE = 0.85;
    const HH_DEAD_SCALE = 0.85;

    const loser = state.roundWinner === "player1" ? "player2" : "player1";
    const loserChar = loser === "player1" ? this.playerCharacter.id : this.aiCharacter.id;
    const loserSprite = loser === "player1" ? this.player1Sprite : this.player2Sprite;

    // Determine dead scale
    let deadScale = DEAD_SCALE;
    if (loserChar === "block-bruiser") deadScale = BB_DEAD_SCALE;
    else if (loserChar === "dag-warrior") deadScale = DW_DEAD_SCALE;
    else if (loserChar === "hash-hunter") deadScale = HH_DEAD_SCALE;

    // Play dead animation
    if (this.anims.exists(`${loserChar}_dead`)) {
      loserSprite.setScale(deadScale);
      loserSprite.play(`${loserChar}_dead`);
    }

    // Play Round End SFX
    const isWin = state.roundWinner === "player1";
    this.playSFX(isWin ? "sfx_victory" : "sfx_defeat");

    // Show result text
    const winnerText = state.roundWinner === "player1" ? "YOU WIN ROUND!" : "AI WINS ROUND!";
    const winnerColor = state.roundWinner === "player1" ? "#22c55e" : "#ff4444";

    this.countdownText.setText(winnerText);
    this.countdownText.setColor(winnerColor);
    this.countdownText.setAlpha(1);

    // Update round score
    this.roundScoreText.setText(
      `Round ${state.currentRound}  •  ${state.player1.roundsWon} - ${state.player2.roundsWon}  (First to ${roundsToWin})`
    );

    // Start new round after delay
    this.time.delayedCall(3000, () => {
      this.countdownText.setAlpha(0);
      this.countdownText.setColor("#40e0d0");

      // Reset loser sprite to idle/scale before next round
      // (Will be handled by createCharacterSprites or reset in startNewRound, 
      // but we need to reset scale/anim here or rely on startRound setting it)
      // Actually startRound doesn't reset sprites, only state.
      // We should probably reset sprites in startRound or here.

      // Reset for new round
      this.combatEngine.startNewRound();
      this.syncUIWithCombatState();

      // Reset sprites to idle scales
      this.resetCharacterSprites();

      this.startRound();
    });
  }

  private resetCharacterSprites(): void {
    const p1Char = this.playerCharacter.id;
    const p2Char = this.aiCharacter.id;

    const IDLE_SCALE = 0.45;
    const BB_IDLE_SCALE = 0.95;
    const DW_IDLE_SCALE = 0.90;
    const HH_IDLE_SCALE = 0.90;

    let p1Scale = IDLE_SCALE;
    if (p1Char === "block-bruiser") p1Scale = BB_IDLE_SCALE;
    else if (p1Char === "dag-warrior") p1Scale = DW_IDLE_SCALE;
    else if (p1Char === "hash-hunter") p1Scale = HH_IDLE_SCALE;

    let p2Scale = IDLE_SCALE;
    if (p2Char === "block-bruiser") p2Scale = BB_IDLE_SCALE;
    else if (p2Char === "dag-warrior") p2Scale = DW_IDLE_SCALE;
    else if (p2Char === "hash-hunter") p2Scale = HH_IDLE_SCALE;

    this.player1Sprite.setScale(p1Scale);
    if (this.anims.exists(`${p1Char}_idle`)) this.player1Sprite.play(`${p1Char}_idle`);

    this.player2Sprite.setScale(p2Scale);
    if (this.anims.exists(`${p2Char}_idle`)) this.player2Sprite.play(`${p2Char}_idle`);
  }

  private showMatchEnd(): void {
    this.phase = "match_end";

    const state = this.combatEngine.getState();
    const playerWon = state.matchWinner === "player1";

    // Emit match ended event
    EventBus.emit("practice_match_ended", {
      playerWon,
      playerRoundsWon: state.player1.roundsWon,
      aiRoundsWon: state.player2.roundsWon,
      difficulty: this.config.aiDifficulty,
    });

    // Show result overlay
    const isWin = playerWon;
    this.playSFX(isWin ? "sfx_victory" : "sfx_defeat"); // victory.mp3 covers both for now, or use defeat if added
    this.createMatchResultOverlay(playerWon);
  }

  private createMatchResultOverlay(playerWon: boolean): void {
    this.matchResultOverlay = this.add.container(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRect(-GAME_DIMENSIONS.WIDTH / 2, -GAME_DIMENSIONS.HEIGHT / 2, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
    this.matchResultOverlay.add(bg);

    // Result title
    const title = this.add.text(0, -100, playerWon ? "VICTORY!" : "DEFEAT", {
      fontFamily: "monospace",
      fontSize: "64px",
      color: playerWon ? "#22c55e" : "#ef4444",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.matchResultOverlay.add(title);

    // Score
    const state = this.combatEngine.getState();
    const score = this.add.text(0, -20, `${state.player1.roundsWon} - ${state.player2.roundsWon}`, {
      fontFamily: "monospace",
      fontSize: "36px",
      color: "#ffffff",
    }).setOrigin(0.5);
    this.matchResultOverlay.add(score);

    // Buttons
    const retryBtn = this.createResultButton(0, 80, "PLAY AGAIN", () => this.restartMatch());
    const exitBtn = this.createResultButton(0, 150, "EXIT", () => this.exitPractice());
    this.matchResultOverlay.add([retryBtn, exitBtn]);

    this.matchResultOverlay.setDepth(100);
  }

  private createResultButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const width = 200;
    const height = 50;

    const bg = this.add.graphics();
    bg.fillStyle(0x40e0d0, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);

    const text = this.add.text(0, 0, label, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#000000",
      fontStyle: "bold",
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerover", () => container.setScale(1.05));
    container.on("pointerout", () => container.setScale(1));
    container.on("pointerdown", onClick);

    return container;
  }

  // ===========================================================================
  // UI SYNC
  // ===========================================================================

  private syncUIWithCombatState(): void {
    const state = this.combatEngine.getState();
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
    const barHeight = 25;
    const energyHeight = 12;
    const yOffset = 30;

    // DEBUG: Log UI sync
    console.log("[PracticeScene] syncUIWithCombatState:", {
      p1HP: state.player1.hp,
      p2HP: state.player2.hp,
      p1MaxHP: state.player1.maxHp,
      p2MaxHP: state.player2.maxHp,
      p1HealthPercent: state.player1.hp / state.player1.maxHp,
      p2HealthPercent: state.player2.hp / state.player2.maxHp,
    });

    // Player 1 health bar (fills left to right)
    this.player1HealthBar.clear();
    const p1HealthPercent = Math.min(1, Math.max(0, state.player1.hp) / (state.player1.maxHp || 1));
    const p1HealthWidth = (barWidth - 4) * p1HealthPercent;
    this.player1HealthBar.fillStyle(this.getHealthColor(p1HealthPercent), 1);
    this.player1HealthBar.fillRoundedRect(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X + 2,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + 2,
      p1HealthWidth,
      barHeight - 4,
      3
    );

    // Player 2 health bar (fills right to left - mirroring FightScene)
    this.player2HealthBar.clear();
    const p2HealthPercent = Math.min(1, Math.max(0, state.player2.hp) / (state.player2.maxHp || 1));
    const p2HealthWidth = (barWidth - 4) * p2HealthPercent;
    this.player2HealthBar.fillStyle(this.getHealthColor(p2HealthPercent), 1);
    this.player2HealthBar.fillRoundedRect(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X + 2 + (barWidth - 4 - p2HealthWidth),
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + 2,
      p2HealthWidth,
      barHeight - 4,
      3
    );

    // Player 1 energy bar (fills left to right)
    this.player1EnergyBar.clear();
    const p1EnergyPercent = Math.min(1, Math.max(0, state.player1.energy) / (state.player1.maxEnergy || 1));
    const p1EnergyWidth = (barWidth - 2) * p1EnergyPercent;
    this.player1EnergyBar.fillStyle(0x3b82f6, 1);
    this.player1EnergyBar.fillRoundedRect(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X + 1,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + yOffset,
      p1EnergyWidth,
      energyHeight - 2,
      2
    );

    // Player 2 energy bar (fills right to left - mirroring FightScene)
    this.player2EnergyBar.clear();
    const p2EnergyPercent = Math.min(1, Math.max(0, state.player2.energy) / (state.player2.maxEnergy || 1));
    const p2EnergyWidth = (barWidth - 2) * p2EnergyPercent;
    this.player2EnergyBar.fillStyle(0x3b82f6, 1);
    this.player2EnergyBar.fillRoundedRect(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X + 1 + (barWidth - 2 - p2EnergyWidth),
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + yOffset,
      p2EnergyWidth,
      energyHeight - 2,
      2
    );

    // Guard meters
    this.updateGuardMeterDisplay("player1", state.player1.guardMeter);
    this.updateGuardMeterDisplay("player2", state.player2.guardMeter);

    // Round score
    const roundsToWin = this.config.matchFormat === "best_of_5" ? 3 : 2;
    this.roundScoreText.setText(
      `Round ${state.currentRound}  •  ${state.player1.roundsWon} - ${state.player2.roundsWon}  (First to ${roundsToWin})`
    );
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

  private getHealthColor(percent: number): number {
    if (percent > 0.5) return 0x22c55e; // Green
    if (percent > 0.25) return 0xf59e0b; // Yellow
    return 0xef4444; // Red
  }

  // ===========================================================================
  // EVENT LISTENERS
  // ===========================================================================

  private setupEventListeners(): void {
    EventBus.on("practice_restart", () => this.restartMatch());
    EventBus.on("practice_exit", () => this.exitPractice());
  }

  // ===========================================================================
  // MATCH MANAGEMENT
  // ===========================================================================

  private restartMatch(): void {
    this.scene.restart(this.config);
  }

  private exitPractice(): void {
    EventBus.off("practice_restart");
    EventBus.off("practice_exit");
    EventBus.emit("practice_exit_complete");
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
