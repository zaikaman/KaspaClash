/**
 * QuickMatchBotScene - Bot match from quick match queue
 * Mirrors PracticeScene but uses SmartBotOpponent and looks like a real match
 * This scene is launched when a player waits 30+ seconds with no opponent
 */

import Phaser from "phaser";
import { EventBus } from "@/game/EventBus";
import { GAME_DIMENSIONS, CHARACTER_POSITIONS, UI_POSITIONS } from "@/game/config";
import { getCharacterScale, getAnimationScale, getCharacterYOffset, getSoundDelay, getSFXKey } from "@/game/config/sprite-config";
import { CombatEngine, BASE_MOVE_STATS, COMBAT_CONSTANTS } from "@/game/combat";
import { SmartBotOpponent } from "@/lib/game/smart-bot-opponent";
import { getCharacter, getRandomCharacter } from "@/data/characters";
import type { MoveType, Character } from "@/types";
import { isMobileDevice } from "@/utils/device";

/**
 * QuickMatchBot scene configuration.
 */
export interface QuickMatchBotSceneConfig {
  playerCharacterId: string;
  botCharacterId: string;
  botName: string;
  botAddress: string;
  playerAddress: string;
  matchFormat?: "best_of_3" | "best_of_5";
}

/**
 * QuickMatchBotScene - Bot match that looks like a real quick match.
 */
export class QuickMatchBotScene extends Phaser.Scene {
  // Configuration
  private config!: QuickMatchBotSceneConfig;
  private playerCharacter!: Character;
  private botCharacter!: Character;
  private bot!: SmartBotOpponent;

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
  private turnIndicatorText!: Phaser.GameObjects.Text;
  private narrativeText!: Phaser.GameObjects.Text;
  private player1NameText?: Phaser.GameObjects.Text;
  private player2NameText?: Phaser.GameObjects.Text;

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

  // Match result overlay
  private matchResultOverlay!: Phaser.GameObjects.Container;

  // Audio settings
  private bgmVolume: number = 0.3;
  private sfxVolume: number = 0.5;

  // Settings menu
  private settingsContainer!: Phaser.GameObjects.Container;
  private isSettingsOpen: boolean = false;

  // Visibility sync
  private visibilityChangeHandler: (() => void) | null = null;
  private wasPlayingBeforeHidden: boolean = false;

  constructor() {
    super({ key: "QuickMatchBotScene" });
  }

  /**
   * Initialize scene with configuration.
   */
  init(data: QuickMatchBotSceneConfig): void {
    this.config = data;
    this.resetFullState();
  }

  /**
   * Reset all state for new match.
   */
  private resetFullState(): void {
    // Get characters
    this.playerCharacter = getCharacter(this.config.playerCharacterId) ?? getRandomCharacter();
    this.botCharacter = getCharacter(this.config.botCharacterId) ?? getRandomCharacter();

    // Create SmartBotOpponent
    this.bot = new SmartBotOpponent(this.config.botName);

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
    const {
      loadBackground,
      loadUIAssets,
      loadCharacterSprites,
      loadCommonAudio,
      loadCharacterAudio,
    } = require("../utils/asset-loader");

    // Load arena background (same as regular matches)
    loadBackground(this, "arena-bg", "/assets/arena.webp");

    // Load UI assets
    loadUIAssets(this);

    // Load only the player and bot characters
    const playerChar = this.config?.playerCharacterId || "dag-warrior";
    const botChar = this.config?.botCharacterId || "dag-warrior";
    loadCharacterSprites(this, [playerChar, botChar]);

    // Load audio
    loadCommonAudio(this);
    loadCharacterAudio(this, [playerChar, botChar]);

    // Load arena BGM
    if (!this.cache.audio.exists("bgm_arena")) {
      this.load.audio("bgm_arena", "/assets/audio/arena.mp3");
    }
  }

  /**
   * Create scene elements.
   */
  create(): void {
    const { createCharacterAnimations } = require("../utils/asset-loader");

    // Load audio settings
    this.loadAudioSettings();

    // Initialize combat engine
    const matchFormat = this.config.matchFormat === "best_of_5" ? "best_of_5" : "best_of_3";
    this.combatEngine = new CombatEngine(
      this.playerCharacter.id,
      this.botCharacter.id,
      matchFormat
    );

    // Create animations
    createCharacterAnimations(this, [this.playerCharacter.id, this.botCharacter.id]);

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

    // Settings
    this.settingsContainer = this.add.container(0, 0);
    this.createSettingsButton();
    this.createSettingsMenu();

    // Setup event listeners
    this.setupEventListeners();

    // Sync UI
    this.syncUIWithCombatState();

    // Start the round
    this.startRound();

    EventBus.emit("quickmatch_bot_scene_ready");

    // Play BGM
    this.sound.pauseOnBlur = false;
    if (this.sound.get("bgm_arena")) {
      if (!this.sound.get("bgm_arena").isPlaying) {
        this.sound.play("bgm_arena", { loop: true, volume: this.bgmVolume });
      }
    } else {
      this.sound.play("bgm_arena", { loop: true, volume: this.bgmVolume });
    }

    // Handle shutdown
    this.events.once("shutdown", this.handleShutdown, this);
    this.events.once("destroy", this.handleShutdown, this);

    // Setup visibility handler
    this.setupVisibilityHandler();
  }

  // ===========================================================================
  // VISIBILITY SYNC
  // ===========================================================================

  private setupVisibilityHandler(): void {
    if (typeof document === "undefined") return;

    this.visibilityChangeHandler = () => {
      if (document.visibilityState === "hidden") {
        this.wasPlayingBeforeHidden = this.phase === "selecting";
        if (this.timerEvent && !this.timerEvent.paused) {
          this.timerEvent.paused = true;
        }
      } else if (document.visibilityState === "visible") {
        if (this.timerEvent && this.timerEvent.paused && this.wasPlayingBeforeHidden) {
          this.timerEvent.paused = false;
        }
      }
    };

    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
    this.events.once("shutdown", this.cleanupVisibilityHandler, this);
    this.events.once("destroy", this.cleanupVisibilityHandler, this);
  }

  private cleanupVisibilityHandler(): void {
    if (this.visibilityChangeHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
  }

  private playSFX(key: string): void {
    if (this.game.sound.locked) return;
    try {
      this.sound.play(key, { volume: this.sfxVolume });
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

  private saveAudioSettings(): void {
    try {
      localStorage.setItem("kaspaclash_bgm_volume", this.bgmVolume.toString());
      localStorage.setItem("kaspaclash_sfx_volume", this.sfxVolume.toString());
    } catch (e) {
      console.warn("Failed to save audio settings", e);
    }
  }

  private applyBgmVolume(): void {
    const bgm = this.sound.get("bgm_arena");
    if (bgm && "setVolume" in bgm) {
      (bgm as Phaser.Sound.WebAudioSound).setVolume(this.bgmVolume);
    }
  }

  private handleShutdown(): void {
    const bgm = this.sound.get("bgm_arena");
    if (bgm && bgm.isPlaying) {
      bgm.stop();
    }
  }

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
  }

  // ===========================================================================
  // CHARACTER SPRITES
  // ===========================================================================

  private createCharacterSprites(): void {
    const p1Char = this.playerCharacter.id;
    const p2Char = this.botCharacter.id;

    // Player 1 sprite (left side)
    const p1TextureKey = `char_${p1Char}_idle`;
    const p1BaseYOffset = 50;
    const p1ConfigOffset = getCharacterYOffset(p1Char, "idle");

    this.player1Sprite = this.add.sprite(
      CHARACTER_POSITIONS.PLAYER1.X,
      CHARACTER_POSITIONS.PLAYER1.Y - p1BaseYOffset + p1ConfigOffset,
      p1TextureKey
    );

    const p1Scale = getCharacterScale(p1Char);
    this.player1Sprite.setScale(p1Scale);
    this.player1Sprite.setOrigin(0.5, 0.5);
    if (this.anims.exists(`${p1Char}_idle`)) {
      this.player1Sprite.play(`${p1Char}_idle`);
    }

    // Player 2 sprite (right side - bot)
    const p2TextureKey = `char_${p2Char}_idle`;
    const p2BaseYOffset = 50;
    const p2ConfigOffset = getCharacterYOffset(p2Char, "idle");

    this.player2Sprite = this.add.sprite(
      CHARACTER_POSITIONS.PLAYER2.X,
      CHARACTER_POSITIONS.PLAYER2.Y - p2BaseYOffset + p2ConfigOffset,
      p2TextureKey
    );

    const p2Scale = getCharacterScale(p2Char);
    this.player2Sprite.setScale(p2Scale);
    this.player2Sprite.setOrigin(0.5, 0.5);
    this.player2Sprite.setFlipX(true);
    if (this.anims.exists(`${p2Char}_idle`)) {
      this.player2Sprite.play(`${p2Char}_idle`);
    }

    // Add player indicator
    this.createPlayerIndicator();
  }

  private createPlayerIndicator(): void {
    const x = this.player1Sprite.x;
    const y = this.player1Sprite.y - 160;

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
  // HEALTH BARS
  // ===========================================================================

  private createHealthBars(): void {
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
    const barHeight = 25;

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

    // Player labels - show "YOU" vs bot name
    const state = this.combatEngine.getState();

    this.player1NameText = this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y - 18,
      `YOU (${state.player1.maxHp} HP)`,
      { fontFamily: "monospace", fontSize: "12px", color: "#22c55e", fontStyle: "bold" }
    );

    // Bot name looks like a real player
    this.player2NameText = this.add.text(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X + barWidth,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y - 18,
      `${this.config.botName} (${state.player2.maxHp} HP)`,
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
  // ENERGY BARS
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
  // GUARD METERS
  // ===========================================================================

  private createGuardMeters(): void {
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
    const barHeight = 6;
    const yOffset = 45;

    this.createGuardMeter(
      UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + yOffset,
      barWidth,
      barHeight,
      "player1"
    );

    this.createGuardMeter(
      UI_POSITIONS.HEALTH_BAR.PLAYER2.X,
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + yOffset,
      barWidth,
      barHeight,
      "player2"
    );
  }

  private createGuardMeter(
    x: number, y: number, width: number, height: number, player: "player1" | "player2"
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
    const roundsToWin = this.config.matchFormat === "best_of_5" ? 3 : 2;
    this.roundScoreText = this.add.text(
      UI_POSITIONS.ROUND_INDICATOR.X,
      UI_POSITIONS.ROUND_INDICATOR.Y,
      `Round 1  •  0 - 0  (First to ${roundsToWin})`,
      { fontFamily: "monospace", fontSize: "16px", color: "#ffffff" }
    ).setOrigin(0.5);
  }

  // ===========================================================================
  // MOVE BUTTONS
  // ===========================================================================

  private createMoveButtons(): void {
    const moves: MoveType[] = ["punch", "kick", "block", "special"];
    const buttonWidth = 140;
    const buttonHeight = 160;
    const spacing = 20;
    const totalWidth = moves.length * buttonWidth + (moves.length - 1) * spacing;
    const startX = (GAME_DIMENSIONS.WIDTH - totalWidth) / 2 + buttonWidth / 2;
    const y = GAME_DIMENSIONS.HEIGHT - 100;

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

    let color = 0xffffff;
    if (move === "punch") color = 0xef4444;
    if (move === "kick") color = 0x06b6d4;
    if (move === "block") color = 0x22c55e;
    if (move === "special") color = 0xa855f7;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.lineStyle(2, color, 0.8);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    container.add(bg);

    const glow = this.add.graphics();
    glow.fillStyle(color, 0.1);
    glow.fillRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, 8);
    container.add(glow);

    const iconKey = `move_${move}`;
    const icon = this.add.image(0, -20, iconKey);
    icon.setDisplaySize(64, 64);
    container.add(icon);

    const nameText = this.add.text(0, 25, move.toUpperCase(), {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);
    container.add(nameText);

    const cost = BASE_MOVE_STATS[move].energyCost;
    const costColor = cost === 0 ? "#22c55e" : "#3b82f6";
    const costText = this.add.text(0, 48, `${cost} Energy`, {
      fontFamily: "monospace",
      fontSize: "12px",
      color: costColor,
    }).setOrigin(0.5);
    container.add(costText);

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

    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

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

  // ===========================================================================
  // TURN FLOW
  // ===========================================================================

  private selectMove(move: MoveType): void {
    if (!this.combatEngine.canAffordMove("player1", move)) {
      this.showFloatingText("Not enough energy!", GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.HEIGHT - 150, "#ff4444");
      return;
    }

    if (this.selectedMove) {
      this.updateButtonState(this.selectedMove, false);
    }

    this.selectedMove = move;
    this.updateButtonState(move, true);

    this.turnIndicatorText.setText(`${this.config.botName} is thinking...`);
    this.turnIndicatorText.setColor("#f97316");

    this.moveButtons.forEach(btn => btn.setAlpha(0.4).disableInteractive());

    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    // Bot "thinks" for a realistic delay (1-3 seconds)
    const thinkTime = 1000 + Math.random() * 2000;
    this.time.delayedCall(thinkTime, () => {
      this.botMakeDecision();
    });
  }

  private updateButtonState(selectedMove: MoveType | null, isSelected: boolean): void {
    const moves: MoveType[] = ["punch", "kick", "block", "special"];

    moves.forEach((move) => {
      const button = this.moveButtons.get(move);
      if (!button) return;

      if (move === selectedMove && isSelected) {
        this.tweens.add({
          targets: button,
          alpha: 1,
          scaleX: 1.1,
          scaleY: 1.1,
          y: GAME_DIMENSIONS.HEIGHT - 110,
          duration: 200,
          ease: "Back.easeOut",
        });

        const bg = button.list[0] as Phaser.GameObjects.Graphics;
        bg.clear();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRoundedRect(-70, -80, 140, 160, 12);
        bg.lineStyle(4, 0xffffff, 1);
        bg.strokeRoundedRect(-70, -80, 140, 160, 12);

      } else {
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

      this.tweens.add({
        targets: button,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        y: y,
        duration: 200,
        ease: "Power2",
      });

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
        if (!canAfford) {
          container.setAlpha(0.3);
          container.disableInteractive();
          container.list.forEach((child: any) => {
            if (child.setTint) child.setTint(0x555555);
          });
        } else {
          container.setAlpha(1);
          container.setInteractive();
          container.list.forEach((child: any) => {
            if (child.clearTint) child.clearTint();
          });
        }
      }
    });
  }

  // ===========================================================================
  // UI HELPERS
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

  private createCountdownOverlay(): void {
    this.countdownText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y,
      "",
      { fontFamily: "monospace", fontSize: "72px", color: "#40e0d0", fontStyle: "bold" }
    ).setOrigin(0.5).setAlpha(0);
  }

  private showFloatingText(text: string, x: number, y: number, color: string): void {
    const floatText = this.add.text(x, y, text, {
      fontFamily: "monospace",
      fontSize: "24px",
      color: color,
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floatText,
      y: y - 50,
      alpha: 0,
      duration: 1500,
      ease: "Power2",
      onComplete: () => floatText.destroy(),
    });
  }

  // ===========================================================================
  // GAME FLOW
  // ===========================================================================

  private startRound(): void {
    this.phase = "countdown";
    this.playSFX("sfx_cd_fight");

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
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    this.phase = "selecting";
    this.selectedMove = null;
    this.turnTimer = 15;

    const state = this.combatEngine.getState();

    // Check if player is stunned
    if (state.player1.isStunned) {
      this.turnIndicatorText.setText("YOU ARE STUNNED!");
      this.turnIndicatorText.setColor("#ff4444");
      this.roundTimerText.setColor("#ff4444");

      this.moveButtons.forEach(btn => {
        btn.setAlpha(0.3);
        btn.disableInteractive();
      });

      this.tweens.add({
        targets: this.turnIndicatorText,
        alpha: { from: 1, to: 0.5 },
        duration: 300,
        yoyo: true,
        repeat: 2,
      });

      // Bot makes decision immediately
      const thinkTime = 1000 + Math.random() * 1500;
      this.time.delayedCall(thinkTime, () => {
        this.updateBotContext();
        const decision = this.bot.decide();
        this.resolveRound("punch", decision.move);
      });
      return;
    }

    this.turnIndicatorText.setText("Select your move!");
    this.turnIndicatorText.setColor("#888888");
    this.roundTimerText.setColor("#40e0d0");

    this.resetButtonVisuals();
    this.updateMoveButtonAffordability();

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

    // Update bot context
    this.updateBotContext();
  }

  private updateBotContext(): void {
    const state = this.combatEngine.getState();
    this.bot.updateContext({
      botHealth: state.player2.hp,
      botMaxHealth: state.player2.maxHp,
      botEnergy: state.player2.energy,
      botMaxEnergy: state.player2.maxEnergy,
      botGuardMeter: state.player2.guardMeter,
      botIsStunned: state.player2.isStunned,
      botIsStaggered: state.player2.isStaggered,
      opponentHealth: state.player1.hp,
      opponentMaxHealth: state.player1.maxHp,
      opponentEnergy: state.player1.energy,
      opponentMaxEnergy: state.player1.maxEnergy,
      opponentGuardMeter: state.player1.guardMeter,
      opponentIsStunned: state.player1.isStunned,
      opponentIsStaggered: state.player1.isStaggered,
      roundNumber: state.currentRound,
      turnNumber: state.currentTurn,
      botRoundsWon: state.player2.roundsWon,
      opponentRoundsWon: state.player1.roundsWon,
    });
  }

  private onTimerExpired(): void {
    if (this.phase !== "selecting") return;

    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    if (!this.selectedMove) {
      this.selectedMove = "punch";
    }

    this.turnIndicatorText.setText("Time's up! Auto-selecting...");
    this.turnIndicatorText.setColor("#ff8800");

    this.moveButtons.forEach(btn => btn.setAlpha(0.4).disableInteractive());

    const thinkTime = 1000 + Math.random() * 1500;
    this.time.delayedCall(thinkTime, () => {
      this.botMakeDecision();
    });
  }

  private botMakeDecision(): void {
    this.updateBotContext();

    const decision = this.bot.decide();
    const botMove = decision.move;

    // Record player's move
    this.bot.recordOpponentMove(this.selectedMove!);
    this.bot.recordBotMove(botMove);

    this.resolveRound(this.selectedMove!, botMove);
  }

  private resolveRound(playerMove: MoveType, botMove: MoveType): void {
    this.phase = "resolving";

    const prevState = this.combatEngine.getState();
    const prevP1Health = prevState.player1.hp;
    const prevP2Health = prevState.player2.hp;

    const turnResult = this.combatEngine.resolveTurn(playerMove, botMove);
    const state = this.combatEngine.getState();

    const p1Char = this.playerCharacter.id;
    const p2Char = this.botCharacter.id;

    const p1OriginalX = CHARACTER_POSITIONS.PLAYER1.X;
    const p2OriginalX = CHARACTER_POSITIONS.PLAYER2.X;
    const meetingPointX = GAME_DIMENSIONS.CENTER_X;

    const p1WasStunned = turnResult.player1.outcome === "stunned";
    const p2WasStunned = turnResult.player2.outcome === "stunned";

    let p1TargetX: number;
    let p2TargetX: number;

    if (p1WasStunned && !p2WasStunned) {
      p1TargetX = p1OriginalX;
      p2TargetX = p1OriginalX + 100;
    } else if (p2WasStunned && !p1WasStunned) {
      p1TargetX = p2OriginalX - 100;
      p2TargetX = p2OriginalX;
    } else {
      p1TargetX = meetingPointX - 50;
      p2TargetX = meetingPointX + 50;
    }

    // Phase 1: Run animations
    if (!p1WasStunned && this.anims.exists(`${p1Char}_run`)) {
      const p1RunScale = getAnimationScale(p1Char, 'run');
      this.player1Sprite.setScale(p1RunScale);
      this.player1Sprite.play(`${p1Char}_run`);
    } else if (p1WasStunned) {
      if (this.anims.exists(`${p1Char}_idle`)) {
        const p1IdleScale = getAnimationScale(p1Char, 'idle');
        this.player1Sprite.setScale(p1IdleScale);
        this.player1Sprite.play(`${p1Char}_idle`);
      }
      this.tweens.add({
        targets: this.player1Sprite,
        tint: 0xff6666,
        yoyo: true,
        repeat: 3,
        duration: 200,
        onComplete: () => this.player1Sprite.clearTint()
      });
    }

    if (!p2WasStunned && this.anims.exists(`${p2Char}_run`)) {
      const p2RunScale = getAnimationScale(p2Char, 'run');
      this.player2Sprite.setScale(p2RunScale);
      this.player2Sprite.play(`${p2Char}_run`);
    } else if (p2WasStunned) {
      if (this.anims.exists(`${p2Char}_idle`)) {
        const p2IdleScale = getAnimationScale(p2Char, 'idle');
        this.player2Sprite.setScale(p2IdleScale);
        this.player2Sprite.play(`${p2Char}_idle`);
      }
      this.tweens.add({
        targets: this.player2Sprite,
        tint: 0xff6666,
        yoyo: true,
        repeat: 3,
        duration: 200,
        onComplete: () => this.player2Sprite.clearTint()
      });
    }

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
        const p1ActualDamage = Math.max(0, prevP1Health - this.combatEngine.getState().player1.hp);
        const p2ActualDamage = Math.max(0, prevP2Health - this.combatEngine.getState().player2.hp);

        const runP1Attack = () => {
          return new Promise<void>((resolve) => {
            if (p1WasStunned) {
              resolve();
              return;
            }

            const animKey = `${p1Char}_${playerMove}`;
            if (this.anims.exists(animKey)) {
              const scale = getAnimationScale(p1Char, playerMove);
              this.player1Sprite.setScale(scale);
              this.player1Sprite.play(animKey);

              const sfxKey = getSFXKey(p1Char, playerMove);
              const delay = getSoundDelay(p1Char, playerMove);
              if (delay > 0) {
                this.time.delayedCall(delay, () => this.playSFX(sfxKey));
              } else {
                this.playSFX(sfxKey);
              }
            }

            this.turnIndicatorText.setText(playerMove.toUpperCase());
            this.turnIndicatorText.setColor("#22c55e");

            if (p2ActualDamage > 0) {
              this.time.delayedCall(300, () => {
                this.showFloatingText(`-${p2ActualDamage}`, p2OriginalX - 50, CHARACTER_POSITIONS.PLAYER2.Y - 130, "#ff4444");
                this.tweens.add({
                  targets: this.player2Sprite,
                  alpha: 0.5,
                  yoyo: true,
                  duration: 50,
                  repeat: 3
                });
              });
            }

            this.time.delayedCall(1200, () => resolve());
          });
        };

        const runP2Attack = () => {
          return new Promise<void>((resolve) => {
            if (p2WasStunned) {
              resolve();
              return;
            }

            const animKey = `${p2Char}_${botMove}`;
            if (this.anims.exists(animKey)) {
              const scale = getAnimationScale(p2Char, botMove);
              this.player2Sprite.setScale(scale);
              this.player2Sprite.play(animKey);

              const sfxKey = getSFXKey(p2Char, botMove);
              const p2Delay = getSoundDelay(p2Char, botMove);
              if (p2Delay > 0) {
                this.time.delayedCall(p2Delay, () => this.playSFX(sfxKey));
              } else {
                this.playSFX(sfxKey);
              }
            }

            this.turnIndicatorText.setText(botMove.toUpperCase());
            this.turnIndicatorText.setColor("#ef4444");

            if (p1ActualDamage > 0) {
              this.time.delayedCall(300, () => {
                this.showFloatingText(`-${p1ActualDamage}`, p1OriginalX + 50, CHARACTER_POSITIONS.PLAYER1.Y - 130, "#ff4444");
                this.tweens.add({
                  targets: this.player1Sprite,
                  alpha: 0.5,
                  yoyo: true,
                  duration: 50,
                  repeat: 3
                });
              });
            }

            this.time.delayedCall(1200, () => resolve());
          });
        };

        (async () => {
          const isConcurrent = playerMove === "block" || botMove === "block";

          if (isConcurrent) {
            await Promise.all([runP1Attack(), runP2Attack()]);
          } else {
            await runP1Attack();
            await runP2Attack();
          }

          let narrative = "";
          if (p1WasStunned && p2WasStunned) {
            narrative = "Both players are stunned!";
          } else if (p1WasStunned) {
            narrative = `You are STUNNED! ${this.config.botName} uses ${botMove}!`;
          } else if (p2WasStunned) {
            narrative = `${this.config.botName} is STUNNED! You use ${playerMove}!`;
          } else if (p1ActualDamage > 0 && p2ActualDamage > 0) {
            if (p2ActualDamage > p1ActualDamage) {
              narrative = `Brutal exchange! You ${playerMove} for ${p2ActualDamage} dmg, but take ${p1ActualDamage}!`;
            } else if (p1ActualDamage > p2ActualDamage) {
              narrative = `Fierce clash! ${this.config.botName} ${botMove} for ${p1ActualDamage} dmg, but takes ${p2ActualDamage}!`;
            } else {
              narrative = `Devastating trade! Both deal ${p1ActualDamage} damage!`;
            }
          } else if (p2ActualDamage > 0) {
            narrative = `You hit for ${p2ActualDamage} damage!`;
          } else if (p1ActualDamage > 0) {
            narrative = `${this.config.botName} hits for ${p1ActualDamage} damage!`;
          } else {
            narrative = "Both attacks were blocked or missed!";
          }
          this.narrativeText.setText(narrative);
          this.narrativeText.setAlpha(1);

          this.syncUIWithCombatState();

          if (this.anims.exists(`${p1Char}_run`)) {
            const p1RunScale = getAnimationScale(p1Char, 'run');
            this.player1Sprite.setScale(p1RunScale);
            this.player1Sprite.play(`${p1Char}_run`);
          }
          if (this.anims.exists(`${p2Char}_run`)) {
            const p2RunScale = getAnimationScale(p2Char, 'run');
            this.player2Sprite.setScale(p2RunScale);
            this.player2Sprite.play(`${p2Char}_run`);
            this.player2Sprite.setFlipX(true);
          }

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
              if (this.anims.exists(`${p1Char}_idle`)) {
                const p1IdleScale = getAnimationScale(p1Char, 'idle');
                this.player1Sprite.setScale(p1IdleScale);
                this.player1Sprite.play(`${p1Char}_idle`);
              }
              if (this.anims.exists(`${p2Char}_idle`)) {
                const p2IdleScale = getAnimationScale(p2Char, 'idle');
                this.player2Sprite.setScale(p2IdleScale);
                this.player2Sprite.play(`${p2Char}_idle`);
              }

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

  // ===========================================================================
  // ROUND/MATCH END
  // ===========================================================================

  private showRoundEnd(): void {
    this.phase = "round_end";
    const state = this.combatEngine.getState();
    const playerWonRound = state.roundWinner === "player1";

    const text = playerWonRound ? "ROUND WIN!" : "ROUND LOST";
    const color = playerWonRound ? "#22c55e" : "#ef4444";

    this.playSFX(playerWonRound ? "sfx_round_win" : "sfx_round_lose");

    this.countdownText.setText(text);
    this.countdownText.setColor(color);
    this.countdownText.setAlpha(1);

    this.tweens.add({
      targets: this.countdownText,
      scale: { from: 0.5, to: 1.2 },
      duration: 500,
      ease: "Back.easeOut",
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.countdownText.setAlpha(0);
          this.combatEngine.startNewRound();
          this.bot.resetRound();
          this.syncUIWithCombatState();
          this.updateRoundScore();
          this.startRound();
        });
      }
    });
  }

  private showMatchEnd(): void {
    this.phase = "match_end";
    const state = this.combatEngine.getState();
    const playerWon = state.matchWinner === "player1";

    this.playSFX(playerWon ? "sfx_victory" : "sfx_defeat");

    // Create overlay
    this.matchResultOverlay = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
    this.matchResultOverlay.add(bg);

    const resultText = playerWon ? "VICTORY!" : "DEFEAT";
    const resultColor = playerWon ? "#22c55e" : "#ef4444";

    const title = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y - 80,
      resultText,
      {
        fontFamily: "monospace",
        fontSize: "64px",
        color: resultColor,
        fontStyle: "bold",
      }
    ).setOrigin(0.5);
    this.matchResultOverlay.add(title);

    const score = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y - 20,
      `${state.player1.roundsWon} - ${state.player2.roundsWon}`,
      {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#ffffff",
      }
    ).setOrigin(0.5);
    this.matchResultOverlay.add(score);

    // Exit button
    const exitBtn = this.add.container(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y + 80);
    
    const exitBg = this.add.graphics();
    exitBg.fillStyle(0x333333, 1);
    exitBg.fillRoundedRect(-80, -25, 160, 50, 8);
    exitBg.lineStyle(2, 0x40e0d0, 1);
    exitBg.strokeRoundedRect(-80, -25, 160, 50, 8);
    exitBtn.add(exitBg);

    const exitText = this.add.text(0, 0, "EXIT", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#40e0d0",
      fontStyle: "bold",
    }).setOrigin(0.5);
    exitBtn.add(exitText);

    exitBtn.setInteractive(new Phaser.Geom.Rectangle(-80, -25, 160, 50), Phaser.Geom.Rectangle.Contains);
    exitBtn.on("pointerdown", () => {
      this.sound.play("sfx_click", { volume: 0.5 });
      
      // Emit match ended event
      EventBus.emit("quickmatch_bot_match_ended", {
        playerWon,
        playerRoundsWon: state.player1.roundsWon,
        botRoundsWon: state.player2.roundsWon,
      });
    });

    this.matchResultOverlay.add(exitBtn);

    // Animate in
    this.matchResultOverlay.setAlpha(0);
    this.tweens.add({
      targets: this.matchResultOverlay,
      alpha: 1,
      duration: 500,
    });
  }

  // ===========================================================================
  // UI SYNC
  // ===========================================================================

  private syncUIWithCombatState(): void {
    const state = this.combatEngine.getState();

    this.updateHealthBar("player1", state.player1.hp, state.player1.maxHp);
    this.updateHealthBar("player2", state.player2.hp, state.player2.maxHp);
    this.updateEnergyBar("player1", state.player1.energy, state.player1.maxEnergy);
    this.updateEnergyBar("player2", state.player2.energy, state.player2.maxEnergy);
    this.updateGuardMeter("player1", state.player1.guardMeter);
    this.updateGuardMeter("player2", state.player2.guardMeter);
    this.updateRoundScore();
  }

  private updateHealthBar(player: "player1" | "player2", hp: number, maxHp: number): void {
    const bar = player === "player1" ? this.player1HealthBar : this.player2HealthBar;
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
    const barHeight = 25;
    const x = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.X : UI_POSITIONS.HEALTH_BAR.PLAYER2.X;
    const y = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.Y : UI_POSITIONS.HEALTH_BAR.PLAYER2.Y;

    const healthPercent = Math.max(0, hp / maxHp);
    const fillWidth = barWidth * healthPercent;

    let color = 0x22c55e;
    if (healthPercent <= 0.25) color = 0xef4444;
    else if (healthPercent <= 0.5) color = 0xf97316;

    bar.clear();
    bar.fillStyle(color, 1);
    bar.fillRoundedRect(x + 2, y + 2, Math.max(0, fillWidth - 4), barHeight - 4, 2);
  }

  private updateEnergyBar(player: "player1" | "player2", energy: number, maxEnergy: number): void {
    const bar = player === "player1" ? this.player1EnergyBar : this.player2EnergyBar;
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
    const barHeight = 12;
    const x = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.X : UI_POSITIONS.HEALTH_BAR.PLAYER2.X;
    const y = (player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.Y : UI_POSITIONS.HEALTH_BAR.PLAYER2.Y) + 30;

    const energyPercent = Math.max(0, energy / maxEnergy);
    const fillWidth = barWidth * energyPercent;

    bar.clear();
    bar.fillStyle(0x3b82f6, 1);
    bar.fillRoundedRect(x + 1, y + 1, Math.max(0, fillWidth - 2), barHeight - 2, 1);
  }

  private updateGuardMeter(player: "player1" | "player2", guardMeter: number): void {
    const bar = player === "player1" ? this.player1GuardMeter : this.player2GuardMeter;
    const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
    const barHeight = 6;
    const x = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.X : UI_POSITIONS.HEALTH_BAR.PLAYER2.X;
    const y = (player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.Y : UI_POSITIONS.HEALTH_BAR.PLAYER2.Y) + 45;

    const guardPercent = guardMeter / COMBAT_CONSTANTS.GUARD_BREAK_THRESHOLD;
    const fillWidth = barWidth * guardPercent;

    let color = 0xf97316;
    if (guardPercent >= 0.75) color = 0xef4444;

    bar.clear();
    bar.fillStyle(color, 1);
    bar.fillRect(x, y, fillWidth, barHeight);
  }

  private updateRoundScore(): void {
    const state = this.combatEngine.getState();
    const roundsToWin = this.config.matchFormat === "best_of_5" ? 3 : 2;
    this.roundScoreText.setText(
      `Round ${state.currentRound}  •  ${state.player1.roundsWon} - ${state.player2.roundsWon}  (First to ${roundsToWin})`
    );
  }

  // ===========================================================================
  // SETTINGS
  // ===========================================================================

  private setupEventListeners(): void {
    // Listen for exit event
    EventBus.on("quickmatch_bot_exit", () => {
      this.scene.stop();
    });
  }

  private createSettingsButton(): void {
    const btn = this.add.container(GAME_DIMENSIONS.WIDTH - 50, 50);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.8);
    bg.fillCircle(0, 0, 25);
    bg.lineStyle(2, 0x40e0d0, 0.8);
    bg.strokeCircle(0, 0, 25);
    btn.add(bg);

    const icon = this.add.text(0, 0, "⚙", {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#40e0d0",
    }).setOrigin(0.5);
    btn.add(icon);

    btn.setInteractive(new Phaser.Geom.Circle(0, 0, 25), Phaser.Geom.Circle.Contains);
    btn.on("pointerdown", () => {
      this.sound.play("sfx_click", { volume: 0.5 });
      this.toggleSettings();
    });
  }

  private createSettingsMenu(): void {
    // Settings menu container (hidden by default)
    const menu = this.add.container(GAME_DIMENSIONS.WIDTH - 200, 100);
    menu.setVisible(false);
    menu.setName("settingsMenu");
    this.settingsContainer.add(menu);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-10, -10, 180, 150, 8);
    bg.lineStyle(2, 0x40e0d0, 0.8);
    bg.strokeRoundedRect(-10, -10, 180, 150, 8);
    menu.add(bg);

    // BGM Volume
    const bgmLabel = this.add.text(0, 10, "Music", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#888888",
    });
    menu.add(bgmLabel);

    this.createVolumeSlider(menu, 0, 35, this.bgmVolume, (val) => {
      this.bgmVolume = val;
      this.applyBgmVolume();
      this.saveAudioSettings();
    });

    // SFX Volume
    const sfxLabel = this.add.text(0, 70, "SFX", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#888888",
    });
    menu.add(sfxLabel);

    this.createVolumeSlider(menu, 0, 95, this.sfxVolume, (val) => {
      this.sfxVolume = val;
      this.saveAudioSettings();
    });
  }

  private createVolumeSlider(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    initialValue: number,
    onChange: (value: number) => void
  ): void {
    const sliderWidth = 140;
    const sliderHeight = 8;

    const track = this.add.graphics();
    track.fillStyle(0x333333, 1);
    track.fillRoundedRect(x, y, sliderWidth, sliderHeight, 4);
    parent.add(track);

    const fill = this.add.graphics();
    const fillWidth = sliderWidth * initialValue;
    fill.fillStyle(0x40e0d0, 1);
    fill.fillRoundedRect(x, y, fillWidth, sliderHeight, 4);
    parent.add(fill);

    const knob = this.add.circle(x + fillWidth, y + sliderHeight / 2, 10, 0x40e0d0);
    parent.add(knob);

    const hitArea = this.add.rectangle(x + sliderWidth / 2, y + sliderHeight / 2, sliderWidth + 20, 30, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    parent.add(hitArea);

    hitArea.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - (GAME_DIMENSIONS.WIDTH - 200 + x);
      const percent = Phaser.Math.Clamp(localX / sliderWidth, 0, 1);

      fill.clear();
      fill.fillStyle(0x40e0d0, 1);
      fill.fillRoundedRect(x, y, sliderWidth * percent, sliderHeight, 4);
      knob.setPosition(x + sliderWidth * percent, y + sliderHeight / 2);

      onChange(percent);
    });
  }

  private toggleSettings(): void {
    this.isSettingsOpen = !this.isSettingsOpen;
    const menu = this.settingsContainer.getByName("settingsMenu") as Phaser.GameObjects.Container;
    if (menu) {
      menu.setVisible(this.isSettingsOpen);
    }
  }
}

export default QuickMatchBotScene;
