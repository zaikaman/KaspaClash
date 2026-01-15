/**
 * FightScene - Main battle arena for KaspaClash
 * Core Phaser scene for 1v1 fighting matches with full combat logic
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { GAME_DIMENSIONS, CHARACTER_POSITIONS, UI_POSITIONS } from "../config";
import { CHAR_SPRITE_CONFIG, TANK_CHARACTERS, getCharacterScale, getCharacterYOffset, getAnimationScale, getSoundDelay, getSFXKey } from "../config/sprite-config";
import { CombatEngine, BASE_MOVE_STATS, getCharacterCombatStats } from "../combat";
import { ChatPanel } from "../ui/ChatPanel";
import { StickerPicker, STICKER_LIST, type StickerId } from "../ui/StickerPicker";
import { useInventoryStore } from "@/stores/inventory-store";
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

  // Audio settings
  private bgmVolume: number = 0.3;
  private sfxVolume: number = 0.5;
  private bgmSlider?: Phaser.GameObjects.Container;
  private sfxSlider?: Phaser.GameObjects.Container;

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

  // Chat panel for in-game messaging
  private chatPanel?: ChatPanel;
  // Track processed chat messages to prevent duplicates
  private processedChatMessages: Set<string> = new Set();

  // Sticker picker for displaying stickers above character
  private stickerPicker?: StickerPicker;

  constructor() {
    super({ key: "FightScene" });
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
   * OPTIMIZED: Only loads the 2 characters needed for this match, not all 20!
   * This dramatically reduces loading time (from 140 spritesheets to just 14).
   */
  preload(): void {
    // Import optimized asset loader
    const {
      preloadFightSceneAssets,
    } = require("../utils/asset-loader");

    // Use optimized loading - only load the 2 characters in this match
    const player1Char = this.config?.player1Character || "dag-warrior";
    const player2Char = this.config?.player2Character || "dag-warrior";
    
    preloadFightSceneAssets(this, player1Char, player2Char);

    // Load stickers
    StickerPicker.preloadStickers(this);
  }

  /**
   * Create scene elements.
   */
  create(): void {
    // Import animation creator
    const { createCharacterAnimations } = require("../utils/asset-loader");

    // Initialize combat engine
    this.combatEngine = new CombatEngine(
      this.config.player1Character || "dag-warrior",
      this.config.player2Character || "dag-warrior",
      "best_of_5"
    );

    // Create animations only for the characters in this match
    const player1Char = this.config?.player1Character || "dag-warrior";
    const player2Char = this.config?.player2Character || "dag-warrior";
    createCharacterAnimations(this, [player1Char, player2Char]);

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

    // Create chat panel on the bottom right (only for non-spectators)
    if (!this.config.isSpectator) {
      this.chatPanel = new ChatPanel(this, {
        x: GAME_DIMENSIONS.WIDTH - 230,
        y: GAME_DIMENSIONS.HEIGHT - 340,
        width: 220,
        height: 320,
        playerRole: this.config.playerRole,
        onSendMessage: (message: string) => {
          // Display message locally for sender immediately
          this.chatPanel?.addMessage(this.config.playerRole, message, Date.now());
          // Emit event for React layer to send via channel
          EventBus.emit("game:sendChat", { message });
        },
      });

      // Create sticker picker (positioned left of chat)
      const playerSprite = this.config.playerRole === "player1" ? this.player1Sprite : this.player2Sprite;

      // Get owned stickers from inventory store (Zustand store accessed directly)
      const inventoryState = useInventoryStore.getState();
      const ownedStickerItems = inventoryState.getItemsByCategory("sticker");

      // Map cosmetic IDs to sticker IDs 
      // Sticker cosmetic names in DB match sticker filenames (e.g., "GG Glitch" -> "gg_glitch")
      const ownedStickerIds: StickerId[] = [];
      for (const item of ownedStickerItems) {
        // Match by checking if any sticker's ID appears in the cosmetic thumbnail URL
        const matchingSticker = STICKER_LIST.find(s =>
          item.cosmetic.thumbnailUrl?.includes(s.filename)
        );
        if (matchingSticker) {
          ownedStickerIds.push(matchingSticker.id);
        }
      }

      console.log("[FightScene] Owned stickers:", ownedStickerIds);

      this.stickerPicker = new StickerPicker(this, {
        x: GAME_DIMENSIONS.WIDTH - 290,
        y: GAME_DIMENSIONS.HEIGHT - 50,
        playerSprite: playerSprite,
        ownedStickers: ownedStickerIds,
        onStickerSelected: (stickerId) => {
          console.log("[FightScene] Sticker selected:", stickerId);
        },
      });
    }

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
   * Dynamically generates animations for all loaded character spritesheets.
   */
  private createAnimations(): void {
    // All 20 characters
    const allCharacters = [
      "aeon-guard", "bastion-hulk", "block-bruiser", "chrono-drifter",
      "cyber-ninja", "cyber-paladin", "dag-warrior", "gene-smasher",
      "hash-hunter", "heavy-loader", "kitsune-09", "nano-brawler",
      "neon-wraith", "prism-duelist", "razor-bot-7", "scrap-goliath",
      "sonic-striker", "technomancer", "viperblade", "void-reaper"
    ];
    const animationTypes = ["idle", "run", "punch", "kick", "block", "special", "dead"];

    allCharacters.forEach((charId) => {
      animationTypes.forEach((animType) => {
        const textureKey = `char_${charId}_${animType}`;
        const animKey = `${charId}_${animType}`;

        if (this.textures.exists(textureKey) && !this.anims.exists(animKey)) {
          // Get frame count from texture
          const frameCount = this.textures.get(textureKey).frameTotal - 1; // -1 for __BASE frame
          const endFrame = Math.max(0, frameCount - 1);

          this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: endFrame }),
            frameRate: 24,
            repeat: animType === "idle" || animType === "run" ? -1 : 0,
          });
        }
      });

      // Fallback animations (hurt, victory, defeat -> map to idle)
      const idleKey = `char_${charId}_idle`;
      ['hurt', 'victory', 'defeat'].forEach(key => {
        const fallbackAnimKey = `${charId}_${key}`;
        if (!this.anims.exists(fallbackAnimKey) && this.textures.exists(idleKey)) {
          const frameCount = this.textures.get(idleKey).frameTotal - 1;
          const endFrame = Math.max(0, frameCount - 1);

          this.anims.create({
            key: fallbackAnimKey,
            frames: this.anims.generateFrameNumbers(idleKey, { start: 0, end: endFrame }),
            frameRate: 24,
            repeat: 0,
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

    // Using getCharacterScale from sprite-config.ts which calculates:
    // scale = targetHeight / idleFrameHeight (280px regular, 336px tanks)

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

    // Player 2 sprite (right side, flipped)
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
    const width = 280;
    const height = 320;

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
    const title = this.add.text(0, -140, "SETTINGS", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#9ca3af",
      fontStyle: "bold"
    }).setOrigin(0.5);
    this.settingsContainer.add(title);

    // --- Audio Section ---
    const audioLabel = this.add.text(0, -110, "AUDIO", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#6b7280"
    }).setOrigin(0.5);
    this.settingsContainer.add(audioLabel);

    // BGM Volume Slider
    this.bgmSlider = this.createVolumeSlider(0, -75, "Music", this.bgmVolume, (value) => {
      this.bgmVolume = value;
      this.applyBgmVolume();
      this.saveAudioSettings();
    });
    this.settingsContainer.add(this.bgmSlider);

    // SFX Volume Slider
    this.sfxSlider = this.createVolumeSlider(0, -30, "SFX", this.sfxVolume, (value) => {
      this.sfxVolume = value;
      this.saveAudioSettings();
      // Play a test sound when adjusting
      this.playSFX("sfx_click");
    });
    this.settingsContainer.add(this.sfxSlider);

    // Separator line
    const separator = this.add.graphics();
    separator.lineStyle(1, 0x334155, 0.5);
    separator.lineBetween(-100, 10, 100, 10);
    this.settingsContainer.add(separator);

    // Cancel Match Button
    const cancelBtn = this.createMenuButton(0, 55, "CANCEL MATCH", 0x6b7280, () => {
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
    const surrenderBtn = this.createMenuButton(0, 110, "SURRENDER", 0xef4444, () => {
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

    // Track offset logic to center everything better
    // Previous: Label(-100), TrackOffset(+40), TextOffset(+50) was shifted right
    // New: Label(-120), TrackOffset(+10), TextOffset(+25)

    // Label
    const labelText = this.add.text(-120, 0, label, {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#9ca3af"
    }).setOrigin(0, 0.5);
    container.add(labelText);

    // Track start X
    // sliderWidth is 140. Half is 70.
    // -70 + 10 = -60. Track spans -60 to +80. Center is +10.
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
    // 70 + 25 = 95. Right of track end (80) by 15px.
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
    // Area covering label to text roughly: -120 to +120
    const hitArea = this.add.rectangle(0, 0, 240, 30, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    // Drag handling
    let isDragging = false;

    const calculateValue = (pointerX: number): number => {
      // Need to account for the container's world position and the track's local position
      // Local X inside container
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
        this.playSFX("sfx_hover");
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
        this.playSFX("sfx_click");
        this.selectMove(move);
      }
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

    // Update each move button based on affordability
    this.moveButtons.forEach((button, move) => {
      const isAffordable = this.combatEngine.canAffordMove("player1", move);

      // Apply visual feedback for unaffordable moves (same as stunned)
      if (!isAffordable) {
        button.setAlpha(0.3);
        button.disableInteractive();
        // Tint children to grayscale
        button.list.forEach((child: any) => {
          if (child.setTint) child.setTint(0x555555);
        });
      } else {
        button.setAlpha(1);
        button.setInteractive();
        // Clear tint
        button.list.forEach((child: any) => {
          if (child.clearTint) child.clearTint();
        });
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
    console.log(`[FightScene] *** onTimerExpired called - phase: ${this.phase}, Timestamp: ${Date.now()}`);
    if (this.phase !== "selecting") {
      console.warn(`[FightScene] *** Timer expired but phase is not 'selecting' (phase: ${this.phase}), returning early`);
      return;
    }

    // IMPORTANT: Stop the timer immediately to prevent multiple calls
    if (this.timerEvent) {
      console.log(`[FightScene] *** Destroying timer on expiration`);
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
    console.log(`[FightScene] *** Emitting game:timerExpired event`);
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

  private showMatchEnd(winner: "player1" | "player2"): void {
    this.phase = "match_end";

    const isLocalWinner = winner === this.config.playerRole;
    const winnerText = isLocalWinner ? "VICTORY!" : "DEFEAT";

    this.countdownText.setText(winnerText);
    this.countdownText.setFontSize(48);
    this.countdownText.setColor(isLocalWinner ? "#22c55e" : "#ef4444");
    this.countdownText.setAlpha(1);

    // Play SFX
    this.playSFX(isLocalWinner ? "sfx_victory" : "sfx_defeat");

    // Play victory/defeat animations
    const p1Char = this.config.player1Character || "dag-warrior";
    const p2Char = this.config.player2Character || "dag-warrior";

    if (winner === "player1") {
      if (this.anims.exists(`${p1Char}_victory`)) this.player1Sprite.play(`${p1Char}_victory`);
      if (this.anims.exists(`${p2Char}_defeat`)) this.player2Sprite.play(`${p2Char}_defeat`);
    } else {
      if (this.anims.exists(`${p1Char}_defeat`)) this.player1Sprite.play(`${p1Char}_defeat`);
      if (this.anims.exists(`${p2Char}_victory`)) this.player2Sprite.play(`${p2Char}_victory`);
    }
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

      // Use helper for SFX and Animations
      this.showMatchEnd(payload.winner);

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
      console.log(`[FightScene] *** game:roundStarting received - Round ${payload.roundNumber}, Turn ${payload.turnNumber}, Current Phase: ${this.phase}, Timestamp: ${Date.now()}`);
      console.log(`[FightScene] *** Deadline in payload: ${payload.moveDeadlineAt}, Time until deadline: ${Math.floor((payload.moveDeadlineAt - Date.now()) / 1000)}s`);
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

    // Listen for incoming chat messages from opponent only
    // (we display our own messages locally in onSendMessage)
    EventBus.on("game:chatMessage", (data: unknown) => {
      const payload = data as { sender: string; senderAddress: string; message: string; timestamp: number };

      // Skip messages from ourselves - we already displayed them locally
      if (payload.sender === this.config.playerRole) {
        return;
      }

      // Create unique key for deduplication
      const messageKey = `${payload.sender}-${payload.timestamp}-${payload.message}`;

      // Skip if we've already processed this message
      if (this.processedChatMessages.has(messageKey)) {
        console.log("[FightScene] Skipping duplicate chat message:", messageKey);
        return;
      }

      // Mark as processed
      this.processedChatMessages.add(messageKey);

      // Clean up old messages after 30 seconds to prevent memory leak
      setTimeout(() => {
        this.processedChatMessages.delete(messageKey);
      }, 30000);

      if (this.chatPanel) {
        this.chatPanel.addMessage(
          payload.sender as "player1" | "player2",
          payload.message,
          payload.timestamp
        );
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
    console.log(`[FightScene] *** startRoundFromServer called - Round ${payload.roundNumber}, Turn ${payload.turnNumber}`);
    console.log(`[FightScene] *** Current phase: ${this.phase}, skipCountdown: ${skipCountdown}, Timestamp: ${Date.now()}`);
    console.log(`[FightScene] *** Timer exists: ${!!this.timerEvent}, pendingRoundStart exists: ${!!this.pendingRoundStart}`);

    // If we're in resolving phase (playing attack animations) or round_end phase 
    // (playing death animation, showing text, countdown), queue this payload 
    // and process it after the sequence finishes.
    // The round_starting event arrives from server while we're still animating.
    if (this.phase === "resolving" || this.phase === "round_end") {
      console.log(`[FightScene] *** QUEUEING round start - currently in ${this.phase} phase`);
      this.pendingRoundStart = payload;
      return;
    }

    console.log(`[FightScene] *** PROCESSING round start immediately - phase allows it`);

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

    // Play SFX first (0.3s before "3" appears)
    this.playSFX("sfx_cd_fight");

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

    // Delay visual countdown by 0.3s so audio plays first
    this.time.delayedCall(300, () => {
      updateCountdown();
    });
  }

  /**
   * Start selection phase with synchronized timer from server deadline.
   */
  private startSynchronizedSelectionPhase(moveDeadlineAt: number): void {
    console.log(`[FightScene] *** startSynchronizedSelectionPhase called - deadline: ${moveDeadlineAt}, Timestamp: ${Date.now()}`);
    console.log(`[FightScene] *** Time until deadline: ${Math.floor((moveDeadlineAt - Date.now()) / 1000)}s`);

    // IMPORTANT: Always destroy existing timer before creating a new one
    if (this.timerEvent) {
      console.log(`[FightScene] *** Destroying existing timer in startSynchronizedSelectionPhase`);
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
    console.log(`[FightScene] *** Initial timer value: ${this.turnTimer}s`);
    console.log(`[FightScene] *** Initial timer value: ${this.turnTimer}s`);

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
    console.log(`[FightScene] *** handleServerRoundResolved - Setting phase to 'resolving', Timestamp: ${Date.now()}`);
    console.log(`[FightScene] *** pendingRoundStart before setting phase: ${!!this.pendingRoundStart}`);
    this.phase = "resolving";

    // Stop timer
    if (this.timerEvent) {
      console.log(`[FightScene] *** Stopping timer in handleServerRoundResolved`);
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }

    // Get max values from local engine for fallback (server should provide these)
    const localState = this.combatEngine.getState();

    // Store previous health for damage calculation
    const prevP1Health = this.serverState?.player1Health ?? payload.player1Health;
    const prevP2Health = this.serverState?.player2Health ?? payload.player2Health;

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

    // Using centralized getAnimationScale(charId, animType) from sprite-config.ts
    // All scale values are managed in MANUAL_SCALE_OVERRIDES or calculated dynamically

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
      const p1RunScale = getAnimationScale(p1Char, "run");
      this.player1Sprite.setScale(p1RunScale);
      this.player1Sprite.play(`${p1Char}_run`);
    }
    if (!p2IsStunned && this.anims.exists(`${p2Char}_run`)) {
      const p2RunScale = getAnimationScale(p2Char, "run");
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
        // Sequential Animation Logic using Promises
        const p1Move = payload.player1.move;
        const p2Move = payload.player2.move;

        // Calculate actual damage from HP difference (before animations)
        const p1ActualDamage = Math.max(0, prevP1Health - payload.player1Health);
        const p2ActualDamage = Math.max(0, prevP2Health - payload.player2Health);

        // Helper: P1 Attack
        const runP1Attack = () => {
          return new Promise<void>((resolve) => {
            if (p1IsStunned) {
              resolve(); // Skip if stunned
              return;
            }

            // Play P1 animation
            const animKey = `${p1Char}_${p1Move}`;
            if (this.anims.exists(animKey) || p1Move === "block") { // Allow Block even if anim missing? Ideally exists.
              const scale = getAnimationScale(p1Char, p1Move);

              this.player1Sprite.setScale(scale);

              // Play Animation immediately
              if (this.anims.exists(animKey)) this.player1Sprite.play(animKey);

              // SFX Logic with centralized delays and keys
              const sfxKey = getSFXKey(p1Char, p1Move);
              const delay = getSoundDelay(p1Char, p1Move);
              if (delay > 0) {
                this.time.delayedCall(delay, () => this.playSFX(sfxKey));
              } else {
                this.playSFX(sfxKey);
              }
            }

            // Show narrative for P1
            // this.turnIndicatorText.setText(p1Move.toUpperCase()); // Optional: show move name? 
            // Better to rely on the main narrative text at the end or floating text?
            // Existing logic shows summary at end. Let's keep summary but show floating text/damage per hit.

            // Show P2 damage delayed - use pre-calculated actual HP lost
            if (p2ActualDamage > 0) {
              this.time.delayedCall(300, () => { // Hit impact timing
                this.showFloatingText(`-${p2ActualDamage}`, p2TargetX, CHARACTER_POSITIONS.PLAYER2.Y - 130, "#ff4444");

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

            // Wait for anim to finish (approx 1s)
            this.time.delayedCall(1200, () => {
              resolve();
            });
          });
        };

        // Helper: P2 Attack
        const runP2Attack = () => {
          return new Promise<void>((resolve) => {
            if (p2IsStunned) {
              resolve();
              return;
            }

            // Play P2 animation
            const animKey = `${p2Char}_${p2Move}`;
            if (this.anims.exists(animKey) || p2Move === "block") {
              const scale = getAnimationScale(p2Char, p2Move);

              this.player2Sprite.setScale(scale);

              // Play Animation immediately
              if (this.anims.exists(animKey)) this.player2Sprite.play(animKey);

              // SFX Logic with centralized delays and keys
              const sfxKey = getSFXKey(p2Char, p2Move);
              const p2Delay = getSoundDelay(p2Char, p2Move);
              if (p2Delay > 0) {
                this.time.delayedCall(p2Delay, () => this.playSFX(sfxKey));
              } else {
                this.playSFX(sfxKey);
              }
            }

            // Show P1 damage - use pre-calculated actual HP lost
            if (p1ActualDamage > 0) {
              this.time.delayedCall(300, () => {
                this.showFloatingText(`-${p1ActualDamage}`, p1TargetX, CHARACTER_POSITIONS.PLAYER1.Y - 130, "#ff4444");
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
          // Check for block interaction (Scenario 1 & 2: Attack vs Block, Block vs Block)
          // Assumption: "Block" moves are identified by explicit "block" move type.
          const isConcurrent = p1Move === "block" || p2Move === "block";

          if (isConcurrent) {
            // Run both simultaneously
            await Promise.all([runP1Attack(), runP2Attack()]);
          } else {
            // Sequential (Attack vs Attack)
            // P1 goes first
            await runP1Attack();
            // Then P2
            await runP2Attack();
          }

          // Use server-provided narrative (authoritative)
          const narrative = payload.narrative || "Both attacks were blocked or missed!";
          this.narrativeText.setText(narrative);
          this.narrativeText.setAlpha(1);

          // Update UI/Health Bars
          this.syncUIWithCombatState();
          this.roundScoreText.setText(
            `Round ${this.serverState?.currentRound ?? 1}  •  ${payload.player1RoundsWon} - ${payload.player2RoundsWon}  (First to 3)`
          );

          // Run back animations
          if (!p1IsStunned && this.anims.exists(`${p1Char}_run`)) {
            const p1RunScale = getAnimationScale(p1Char, "run");
            this.player1Sprite.setScale(p1RunScale);
            this.player1Sprite.play(`${p1Char}_run`);
          }
          if (!p2IsStunned && this.anims.exists(`${p2Char}_run`)) {
            const p2RunScale = getAnimationScale(p2Char, "run");
            this.player2Sprite.setScale(p2RunScale);
            this.player2Sprite.play(`${p2Char}_run`);
            this.player2Sprite.setFlipX(true); // Ensure facing correct way
          }

          // Tween back
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
              // Phase 5: Return to idle
              if (this.anims.exists(`${p1Char}_idle`)) {
                const p1IdleScale = getAnimationScale(p1Char, "idle");
                this.player1Sprite.setScale(p1IdleScale);
                this.player1Sprite.play(`${p1Char}_idle`);
              }
              if (this.anims.exists(`${p2Char}_idle`)) {
                const p2IdleScale = getAnimationScale(p2Char, "idle");
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
                // Match end handled by event
              } else if (payload.isRoundOver) {
                this.showRoundEndFromServer(payload.roundWinner, payload.player1RoundsWon, payload.player2RoundsWon);
              } else {
                // Turn ended, round continues
                this.selectedMove = null;
                if (this.pendingRoundStart) {
                  console.log(`[FightScene] *** Processing queued pendingRoundStart after animations`);
                  const queuedPayload = this.pendingRoundStart;
                  this.pendingRoundStart = null;
                  this.phase = "countdown";
                  this.startRoundFromServer(queuedPayload, false);
                } else {
                  console.warn(`[FightScene] *** WARNING: No pendingRoundStart after animations! Setting phase to 'selecting' and waiting for round_starting event`);
                  console.warn(`[FightScene] *** This may indicate round_starting arrived before round_resolved or was lost`);
                  this.phase = "selecting";
                  this.turnIndicatorText.setText("Waiting for next turn...");
                  this.turnIndicatorText.setColor("#888888");
                }
              }
            }
          });
        })();
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

    // Play dead animation on the loser
    const loser = roundWinner === "player1" ? "player2" : "player1";
    const loserChar = loser === "player1" ? p1Char : p2Char;
    const loserSprite = loser === "player1" ? this.player1Sprite : this.player2Sprite;

    // Play dead animation on loser if it exists
    // Use centralized scale from sprite-config.ts
    if (this.anims.exists(`${loserChar}_dead`)) {
      loserSprite.setScale(getAnimationScale(loserChar, "dead"));
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

      // Play SFX
      if (isLocalWinner) {
        this.playSFX("sfx_victory");
      } else {
        this.playSFX("sfx_defeat");
      }
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
              // Use centralized scale from sprite-config.ts
              if (this.anims.exists(`${p1Char}_idle`)) {
                this.player1Sprite.setScale(getAnimationScale(p1Char, "idle"));
                this.player1Sprite.play(`${p1Char}_idle`);
              }
              if (this.anims.exists(`${p2Char}_idle`)) {
                this.player2Sprite.setScale(getAnimationScale(p2Char, "idle"));
                this.player2Sprite.play(`${p2Char}_idle`);
              }

              // Reset selected move for next round
              this.selectedMove = null;

              // Change phase to allow processing queued events
              this.phase = "selecting";

              // Process pending round start if we received one during the round_end sequence
              if (this.pendingRoundStart) {
                console.log("[FightScene] *** Processing queued round start after round end countdown");
                const payload = this.pendingRoundStart;
                this.pendingRoundStart = null;
                // Skip the 3-2-1 FIGHT countdown since we already showed our 5-second countdown
                this.startRoundFromServer(payload, true);
              } else {
                console.warn(`[FightScene] *** WARNING: No pendingRoundStart after round end countdown! Waiting for round_starting event`);
                console.warn(`[FightScene] *** This may indicate round_starting arrived before round_end phase or was lost`);
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
