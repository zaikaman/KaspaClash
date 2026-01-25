/**
 * CharacterSelectScene - Pre-match character selection screen
 * Players select their fighter before entering the battle arena
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { GAME_DIMENSIONS } from "../config";
import { CharacterCard, SelectionTimer, OpponentStatus, StatsOverlay } from "../ui";
import { CHARACTER_ROSTER, getCharacter, getRandomCharacter } from "@/data/characters";
import { getCharacterCombatStats } from "@/game/combat/CharacterStats";
import { SmartBotOpponent } from "@/lib/game/smart-bot-opponent";
import type { Character } from "@/types";

/**
 * Scene configuration passed on initialization.
 */
export interface CharacterSelectSceneConfig {
  matchId: string;
  playerAddress: string;
  opponentAddress: string;
  isHost: boolean;
  selectionTimeLimit?: number; // Seconds, default 30
  selectionDeadlineAt?: string; // ISO timestamp from server for timer sync
  // For reconnection - existing character selections
  existingPlayerCharacter?: string | null;
  existingOpponentCharacter?: string | null;
  ownedCharacterIds?: string[]; // IDs of characters owned by the player
  isBot?: boolean;
}

/**
 * Character selection state events.
 */
export interface CharacterSelectEvents {
  character_selected: { characterId: string };
  selection_confirmed: { characterId: string };
  opponent_selected: { characterId: string };
  both_ready: { player: string; opponent: string };
}


/**
 * Selection Phases
 */
export type SelectionPhase = "BANNING" | "TRANSITION" | "PICKING" | "REVEAL";

/**
 * CharacterSelectScene - Fighter selection screen.
 */
export class CharacterSelectScene extends Phaser.Scene {
  // Configuration
  private config!: CharacterSelectSceneConfig;

  // UI Components
  private characterCards: CharacterCard[] = [];
  private selectionTimer!: SelectionTimer;
  private opponentStatus!: OpponentStatus;
  private titleText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private confirmButton!: Phaser.GameObjects.Container;
  private statsPanel!: Phaser.GameObjects.Container;
  private statsText!: Phaser.GameObjects.Text;
  private selectedNameText!: Phaser.GameObjects.Text;
  private selectedThemeText!: Phaser.GameObjects.Text;
  private statsOverlay!: StatsOverlay;

  // State
  // State
  private phase: SelectionPhase = "BANNING";
  private selectedCharacter: Character | null = null;
  private confirmedCharacter: Character | null = null;
  private opponentCharacter: Character | null = null;
  private isConfirmed: boolean = false;

  // Ban State
  private myBan: Character | null = null;
  private opponentBan: Character | null = null;

  // Bot Logic
  private bot?: SmartBotOpponent;
  private botBanTarget?: string;
  private botPickTarget?: string;

  private bannedCharacters: Set<string> = new Set();
  private hasLockedBan: boolean = false;
  private hasOpponentLockedBan: boolean = false;

  // Layout constants - optimized for compact 10x2 grid at bottom
  private readonly CARD_WIDTH = 110;
  private readonly CARD_HEIGHT = 140;
  private readonly CARD_SPACING = 10;
  private readonly GRID_COLS = 10;
  private readonly GRID_START_Y = 360; // Moved up slightly from 380

  constructor() {
    super({ key: "CharacterSelectScene" });
  }

  /**
   * Initialize scene with match data.
   */
  init(data: CharacterSelectSceneConfig): void {
    // Provide defaults if data is missing (e.g., if scene started without config)
    this.config = {
      matchId: data?.matchId || "unknown",
      playerAddress: data?.playerAddress || "",
      opponentAddress: data?.opponentAddress || "",
      isHost: data?.isHost ?? true,
      selectionTimeLimit: data?.selectionTimeLimit ?? 30,
      selectionDeadlineAt: data?.selectionDeadlineAt,
      existingPlayerCharacter: data?.existingPlayerCharacter,
      existingOpponentCharacter: data?.existingOpponentCharacter,
      ownedCharacterIds: data?.ownedCharacterIds || [
        "cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"
      ], // Default starters if missing
    };
    this.resetState();
  }

  /**
   * Reset scene state.
   */
  private resetState(): void {
    this.phase = "BANNING";
    this.selectedCharacter = null;
    this.confirmedCharacter = null;
    this.opponentCharacter = null;
    this.isConfirmed = false;
    this.characterCards = [];

    this.myBan = null;
    this.opponentBan = null;
    this.bannedCharacters.clear();
    this.hasLockedBan = false;
    this.hasOpponentLockedBan = false;
  }

  /**
   * Preload assets.
   */
  preload(): void {
    // Load character portraits
    for (const character of CHARACTER_ROSTER) {
      // 1. Try WebP first (best quality/size ratio)
      this.load.image(`portrait-${character.id}`, `/characters/${character.id}/portrait.webp`);

      // 2. Try SVG portraits
      this.load.svg(
        `portrait-${character.id}-svg`,
        `/characters/${character.id}/portrait.svg`,
        { width: 180, height: 180 }
      );

      // 3. Try PNG portraits
      this.load.image(`portrait-${character.id}-png`, `/characters/${character.id}/portrait.png`);

      // 4. Fallback to idle.png (for development/early testing)
      this.load.image(`portrait-${character.id}-fallback`, `/characters/${character.id}/idle.png`);
    }

    // Load background
    this.load.image("select-bg", "/assets/background_1.png");

    // Load UI assets
    this.load.image("lock-icon", "/assets/lock.png");

    // Load Audio
    this.load.audio("bgm_select", "/assets/audio/character-selection.mp3");
    this.load.audio("sfx_hover", "/assets/audio/hover.mp3");
    this.load.audio("sfx_click", "/assets/audio/click.mp3");
  }

  /**
   * Create scene elements.
   */
  create(): void {
    console.log("[CharacterSelectScene] create() called");
    console.log("[CharacterSelectScene] Config:", JSON.stringify({
      matchId: this.config.matchId,
      isHost: this.config.isHost,
      existingPlayerCharacter: this.config.existingPlayerCharacter,
      existingOpponentCharacter: this.config.existingOpponentCharacter,
    }));

    this.createBackground();
    this.createBackground();
    this.createTitle(); // Will set title based on "BANNING" phase
    this.createCharacterGrid();
    this.createSelectionTimer();
    this.createOpponentStatus();
    this.createConfirmButton();
    this.createSelectedNameDisplay(); // New: Central large name display
    this.createStatsDisplay(); // Add stats display (summary)
    this.createInstructions();

    // Stats Overlay (Detailed)
    this.statsOverlay = new StatsOverlay(this);

    this.setupEventListeners();

    // Restore existing selections UI (for reconnection scenarios)
    // This only restores the visual state - API calls are deferred until channel is ready
    this.restoreExistingSelectionsUI();

    // Listen for channel ready to trigger API calls
    this.setupChannelReadyHandler();

    // Start the selection timer
    this.selectionTimer.start();

    // Notify that scene is ready
    // Start background music - keep playing even when tab loses focus
    this.sound.pauseOnBlur = false;
    if (this.sound.get("bgm_select")) {
      if (!this.sound.get("bgm_select").isPlaying) {
        this.sound.play("bgm_select", { loop: true, volume: 0.3 });
      }
    } else {
      this.sound.play("bgm_select", { loop: true, volume: 0.3 });
    }

    EventBus.emit("character_select_ready", { matchId: this.config.matchId });
    EventBus.emit("character_select_ready", { matchId: this.config.matchId });
    console.log("[CharacterSelectScene] create() complete, scene ready");

    // Initialize Bot if applicable
    // Initialize Bot if applicable (or fallback if opponent address is empty)
    const isBotMatch = this.config.isBot || !this.config.opponentAddress || this.config.opponentAddress === "";

    if (isBotMatch) {
      console.log("[CharacterSelectScene] Initializing Smart Bot Opponent (Fallback/Explicit)");
      this.bot = new SmartBotOpponent("Smart Bot");
      this.config.isBot = true; // Ensure flag is set for other logic

      // Pre-calculate bot moves immediately
      const allCharIds = CHARACTER_ROSTER.map(c => c.id);
      const userOwnedIds = this.config.ownedCharacterIds || [];

      // 1. Decide Ban
      this.botBanTarget = this.bot.banCharacter(userOwnedIds, allCharIds);
      console.log(`[CharacterSelectScene] Bot pre-decided ban: ${this.botBanTarget}`);

      // 2. Decide Pick (preliminary, might change if ban changes, but good for robust fallback)
      const available = allCharIds.filter(id => id !== this.botBanTarget);
      this.botPickTarget = available[Math.floor(Math.random() * available.length)];
      console.log(`[CharacterSelectScene] Bot pre-decided pick: ${this.botPickTarget}`);

      // Schedule bot ban execution
      this.time.delayedCall(1000 + Math.random() * 2000, () => this.performBotBan());
    }
  }

  /**
   * Execute Bot Ban Logic.
   */
  private performBotBan(): void {
    if (!this.bot || this.hasOpponentLockedBan) return;

    // Use pre-decided ban or decide now
    let banId = this.botBanTarget;
    if (!banId) {
      const allCharIds = CHARACTER_ROSTER.map(c => c.id);
      const userOwnedIds = this.config.ownedCharacterIds || [];
      banId = this.bot.banCharacter(userOwnedIds, allCharIds);
      this.botBanTarget = banId;
    }

    // Determine Bot Role (Opposite of me)
    const botRole = this.config.isHost ? "player2" : "player1";

    console.log(`[CharacterSelectScene] Bot performing ban: ${banId} with role: ${botRole}`);
    console.log(`[CharacterSelectScene] My role is: ${this.config.isHost ? "player1" : "player2"}`);

    // Simulate opponent ban confirmation
    this.onOpponentBanConfirmed(banId, botRole);
  }

  /**
   * Execute Bot Pick Logic.
   */
  private performBotPick(): void {
    if (!this.bot || this.phase !== "PICKING" || this.opponentCharacter) return;

    // Pick from available
    const availableChars = CHARACTER_ROSTER
      .map(c => c.id)
      .filter(id => !this.bannedCharacters.has(id));

    if (availableChars.length === 0) return;

    // Use pre-decided pick if valid, else random
    let pickId = this.botPickTarget;
    if (!pickId || this.bannedCharacters.has(pickId)) {
      pickId = availableChars[Math.floor(Math.random() * availableChars.length)];
      this.botPickTarget = pickId;
    }

    console.log(`[CharacterSelectScene] Bot picking character: ${pickId}`);

    // Simulate opponent pick confirmation (Blind)
    this.onOpponentConfirmed(pickId);
  }

  /**
   * Set up handler for when channel is ready.
   * This defers API calls until we're sure we can receive broadcasts.
   */
  private setupChannelReadyHandler(): void {
    // If we have existing selections that need to trigger match start, wait for channel
    const needsMatchStart = this.confirmedCharacter && this.opponentCharacter;
    const needsConfirmation = this.confirmedCharacter && !this.opponentCharacter;

    console.log("[CharacterSelectScene] setupChannelReadyHandler:", {
      hasConfirmedCharacter: !!this.confirmedCharacter,
      hasOpponentCharacter: !!this.opponentCharacter,
      needsMatchStart,
      needsConfirmation,
    });

    if (needsMatchStart || needsConfirmation) {
      console.log("[CharacterSelectScene] Waiting for channel ready before triggering API...");

      const handleChannelReady = () => {
        console.log("[CharacterSelectScene] channel_ready received! Triggering selection confirmation");
        console.log("[CharacterSelectScene] confirmedCharacter:", this.confirmedCharacter?.id);
        EventBus.off("channel_ready", handleChannelReady);

        // Now safe to emit selection_confirmed - channel is subscribed
        if (this.confirmedCharacter) {
          console.log("[CharacterSelectScene] Emitting selection_confirmed event");
          EventBus.emit("selection_confirmed", {
            characterId: this.confirmedCharacter.id,
          });
        }
      };

      EventBus.on("channel_ready", handleChannelReady);
      console.log("[CharacterSelectScene] Registered channel_ready listener");

      // Also set a timeout fallback in case channel_ready was already emitted
      this.time.delayedCall(500, () => {
        console.log("[CharacterSelectScene] Timeout fallback check - isActive FightScene:", this.scene.isActive("FightScene"));
        if (this.confirmedCharacter && !this.scene.isActive("FightScene")) {
          console.log("[CharacterSelectScene] Timeout fallback - triggering selection confirmation");
          EventBus.off("channel_ready", handleChannelReady);
          EventBus.emit("selection_confirmed", {
            characterId: this.confirmedCharacter.id,
          });
        }
      });
    } else {
      console.log("[CharacterSelectScene] No pending selections to confirm on channel ready");
    }
  }

  /**
   * Restore existing character selections on reconnection (UI only).
   * API calls are deferred until channel is ready.
   */
  private restoreExistingSelectionsUI(): void {
    console.log("[CharacterSelectScene] restoreExistingSelectionsUI called");
    console.log("[CharacterSelectScene] existingPlayerCharacter:", this.config.existingPlayerCharacter);
    console.log("[CharacterSelectScene] existingOpponentCharacter:", this.config.existingOpponentCharacter);

    // Restore player's existing selection
    if (this.config.existingPlayerCharacter) {
      const character = getCharacter(this.config.existingPlayerCharacter);
      console.log("[CharacterSelectScene] Restoring player character:", character?.name);
      if (character) {
        this.selectedCharacter = character;
        this.confirmedCharacter = character;
        this.isConfirmed = true;

        // Find and update the card
        const card = this.characterCards.find(
          (c) => c.getCharacter()?.id === character.id
        );
        if (card) {
          card.select();
          card.lock();
        }

        // Disable other cards
        this.characterCards.forEach((c) => {
          if (c.getCharacter()?.id !== character.id) {
            c.disable();
          }
        });

        // Update UI
        this.hideConfirmButton();
        this.selectionTimer.showLockedIn();
        this.instructionText.setText("Waiting for opponent...");
      }
    }

    // Restore opponent's existing selection
    // Note: If this is a Bot match, we IGNORE the existing selection to allow the bot
    // to "play out" the Ban Phase and Pick Phase dynamically.
    if (this.config.existingOpponentCharacter && !this.config.isBot) {
      const opponent = getCharacter(this.config.existingOpponentCharacter);
      console.log("[CharacterSelectScene] Restoring opponent character:", opponent?.name);
      if (opponent) {
        this.opponentCharacter = opponent;
        this.opponentStatus.showCharacterPreview(opponent.name, opponent.theme);
        // Implicitly mark opponent ban as complete since they have already picked
        this.hasOpponentLockedBan = true;
        console.log("[CharacterSelectScene] Opponent has pre-selected character. Implicitly locking their ban.");
      }
    }

    // Update UI text if both are ready (API call is deferred to setupChannelReadyHandler)
    if (this.confirmedCharacter && this.opponentCharacter) {
      console.log("[CharacterSelectScene] Both players have selections, showing ready message");
      this.instructionText.setText("Both players ready! Connecting...");
      this.instructionText.setColor("#22c55e");
    } else {
      console.log("[CharacterSelectScene] Missing selection - confirmedCharacter:", !!this.confirmedCharacter, "opponentCharacter:", !!this.opponentCharacter);
    }
    // Note: API calls (selection_confirmed events) are deferred to setupChannelReadyHandler
  }

  /**
   * Create background.
   */
  private createBackground(): void {
    // Fallback gradient if no image
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    graphics.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);

    // Try to add background image
    if (this.textures.exists("select-bg")) {
      const bg = this.add.image(
        GAME_DIMENSIONS.CENTER_X,
        GAME_DIMENSIONS.CENTER_Y,
        "select-bg"
      );
      bg.setDisplaySize(GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
    }

    // Overlay for readability
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.3);
    overlay.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
  }

  /**
   * Create title text.
   */
  private createTitle(): void {
    this.titleText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      50,
      "BAN PHASE - BAN 1 CHARACTER",
      {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "36px",
        color: "#ef4444", // Red for Ban
        fontStyle: "bold",
      }
    );
    this.titleText.setOrigin(0.5);

    // Subtitle with match info
    const matchText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      90,
      `Match: ${this.config.matchId.slice(0, 8)}`,
      {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#888888",
      }
    );
    matchText.setOrigin(0.5);
  }

  /**
   * Create character selection grid.
   */
  private createCharacterGrid(): void {
    const totalWidth =
      this.CARD_WIDTH * this.GRID_COLS +
      this.CARD_SPACING * (this.GRID_COLS - 1);
    // Cards are drawn from (0,0) top-left, so no need for center offset
    const startX = (GAME_DIMENSIONS.WIDTH - totalWidth) / 2;

    // Default starter characters (always unlocked)
    const STARTERS = ["cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"];

    CHARACTER_ROSTER.forEach((character, index) => {
      const col = index % this.GRID_COLS;
      const row = Math.floor(index / this.GRID_COLS);

      const x = startX + col * (this.CARD_WIDTH + this.CARD_SPACING);
      const y = this.GRID_START_Y + row * (this.CARD_HEIGHT + 20); // Add row spacing

      // Check ownership
      const isStarter = STARTERS.includes(character.id);
      const isOwned = this.config.ownedCharacterIds?.includes(character.id);
      const isUnlocked = isStarter || isOwned;

      const card = new CharacterCard(this, {
        x,
        y,
        character,
        width: this.CARD_WIDTH,
        height: this.CARD_HEIGHT,
        onSelect: (char) => {
          // Allow selection if owned OR if in banning phase
          if (isUnlocked || this.phase === "BANNING") {
            this.onCharacterSelect(char);
          } else {
            this.sound.play("sfx_click", { volume: 0.2, detune: -500 }); // Error sound
          }
        },
        onHover: (char) => {
          this.updateSelectedNameDisplay(char);
        },
        onInfo: (char) => this.statsOverlay.show(char),
      });

      // Visual indication for unowned characters (optional, maybe distinct style?)
      // For now, keep them fully visible during ban phase
      // If we want to show they are unowned, we can maybe tint them slightly?
      if (!isUnlocked) {
        // card.setTint(0xcccccc); // Light gray tint
      }

      this.characterCards.push(card);
    });
  }

  /**
   * Create selection countdown timer.
   * Uses server-provided deadline timestamp for synchronized countdown.
   */
  private createSelectionTimer(): void {
    // Convert ISO timestamp to milliseconds for timer sync
    const deadlineTimestamp = this.config.selectionDeadlineAt
      ? new Date(this.config.selectionDeadlineAt).getTime()
      : undefined;

    console.log("[CharacterSelectScene] selectionDeadlineAt:", this.config.selectionDeadlineAt);
    console.log("[CharacterSelectScene] deadlineTimestamp:", deadlineTimestamp);
    console.log("[CharacterSelectScene] Current time:", Date.now());
    if (deadlineTimestamp) {
      console.log("[CharacterSelectScene] Time remaining (seconds):", Math.ceil((deadlineTimestamp - Date.now()) / 1000));
    }

    this.selectionTimer = new SelectionTimer(this, {
      x: GAME_DIMENSIONS.CENTER_X,
      y: 150,
      duration: this.config.selectionTimeLimit ?? 30,
      deadlineTimestamp, // Server-synced deadline
      warningThreshold: 10,
      criticalThreshold: 5,
      onTimeUp: () => this.onTimeUp(),
    });
  }

  /**
   * Create opponent status indicator.
   */
  private createOpponentStatus(): void {
    this.opponentStatus = new OpponentStatus(this, {
      x: GAME_DIMENSIONS.WIDTH - 120,
      y: 150,
      opponentAddress: this.config.opponentAddress,
    });
    this.opponentStatus.setWaiting();
  }

  /**
   * Create central selected character name display.
   */
  private createSelectedNameDisplay(): void {
    const centerX = GAME_DIMENSIONS.CENTER_X;
    // Position comfortably in the middle space (moved down from 200)
    const centerY = 280;

    this.selectedNameText = this.add.text(centerX, centerY, "", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    this.selectedNameText.setOrigin(0.5);
    this.selectedNameText.setAlpha(0); // Hidden initially

    this.selectedThemeText = this.add.text(centerX, centerY + 50, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "20px",
      color: "#aaa",
      fontStyle: "italic",
    });
    this.selectedThemeText.setOrigin(0.5);
    this.selectedThemeText.setAlpha(0);
  }

  /**
   * Update the central name display on hover.
   */
  private updateSelectedNameDisplay(character: Character): void {
    if (!character) return;

    this.selectedNameText.setText(character.name.toUpperCase());
    this.selectedNameText.setAlpha(1);

    // Tint text based on character color if available
    // const colors = getCharacterColor(character.id);
    // this.selectedNameText.setTint(colors.primary);

    this.selectedThemeText.setText(character.theme);
    this.selectedThemeText.setAlpha(1);

    // Simple pulse animation
    this.tweens.add({
      targets: [this.selectedNameText],
      scale: { from: 1.1, to: 1 },
      duration: 200,
      ease: "Back.out"
    });
  }

  /**
   * Create confirm button.
   */
  private createConfirmButton(): void {
    const buttonWidth = 200;
    const buttonHeight = 50;
    const x = GAME_DIMENSIONS.CENTER_X;
    const y = GAME_DIMENSIONS.HEIGHT - 80;

    this.confirmButton = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(0x22c55e, 1);
    bg.fillRoundedRect(
      -buttonWidth / 2,
      -buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      8
    );

    // Button text
    const text = this.add.text(0, 0, "BAN CHARACTER", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    text.setOrigin(0.5);

    this.confirmButton.add([bg, text]);
    this.confirmButton.setSize(buttonWidth, buttonHeight);
    this.confirmButton.setInteractive({ useHandCursor: true });

    // Button interactions
    this.confirmButton.on("pointerover", () => {
      if (!this.isConfirmed && this.selectedCharacter) {
        this.confirmButton.setScale(1.05);
        this.sound.play("sfx_hover", { volume: 0.5 });
      }
    });

    this.confirmButton.on("pointerout", () => {
      this.confirmButton.setScale(1);
    });

    this.confirmButton.on("pointerdown", () => {
      this.sound.play("sfx_click", { volume: 0.5 });
      this.confirmSelection();
    });

    // Initially hidden
    this.confirmButton.setVisible(false);
    this.confirmButton.setAlpha(0);
  }

  /**
   * Create instruction text.
   */
  private createInstructions(): void {
    this.instructionText = this.add.text(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.HEIGHT - 30,
      "Click a character to preview, then Lock In your choice",
      {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "14px",
        color: "#888888",
      }
    );
    this.instructionText.setOrigin(0.5);
  }

  /**
   * Create stats display.
   */
  private createStatsDisplay(): void {
    this.statsPanel = this.add.container(GAME_DIMENSIONS.CENTER_X, 230);

    // Initial text
    this.statsText = this.add.text(0, 0, "", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "16px",
      color: "#4ade80", // Greenish tint
      align: "center",
      stroke: "#000000",
      strokeThickness: 3,
    });
    this.statsText.setOrigin(0.5);

    // Add shadow/glow effect
    const fx = this.statsText.postFX.addGlow(0x4ade80, 0.5, 0, false, 0.1, 10);

    this.statsPanel.add(this.statsText);
    this.statsPanel.setVisible(false); // Hidden until selection
  }

  /**
   * Update stats display for selected character.
   */
  private updateStatsDisplay(character: Character): void {
    const stats = getCharacterCombatStats(character.id);
    let archetype = "Balanced";
    if (character.id === "block-bruiser") archetype = "Tank / Heavy Hitter";
    if (character.id === "cyber-ninja") archetype = "Glass Cannon / Fast";
    if (character.id === "hash-hunter") archetype = "Aggressive Specialist";

    // Format text
    // "CYBER NINJA"
    // "HP: 96 | Energy: 105"
    // "Glass Cannon / Fast"
    const text = `${character.name.toUpperCase()}\nHP: ${stats.maxHp}  |  Energy: ${stats.maxEnergy}\n${archetype}`;

    this.statsText.setText(text);

    // Color coding based on archetype
    let color = "#4ade80"; // Default green
    if (character.id === "block-bruiser") color = "#f97316"; // Orange
    if (character.id === "hash-hunter") color = "#ef4444"; // Red
    if (character.id === "cyber-ninja") color = "#a855f7"; // Purple
    if (character.id === "dag-warrior") color = "#3b82f6"; // Blue

    this.statsText.setColor(color);
    // Update glow color if possible, or clear and re-add
    // Phaser FX are tricky to update dynamically sometimes, simpler to recreate or just accept static glow color
    // We'll leave the static green glow for now or use the text color primarily.

    this.statsPanel.setVisible(true);
  }

  /**
   * Setup event listeners for WebSocket events.
   */
  private setupEventListeners(): void {
    console.log("[CharacterSelectScene] Setting up event listeners");

    // Opponent selected a character
    EventBus.on(
      "opponent_character_selected",
      (data: unknown) => {
        console.log("[CharacterSelectScene] Received opponent_character_selected:", data);
        const payload = data as { characterId: string };
        this.onOpponentSelected(payload.characterId);
      }
    );

    // Opponent confirmed their selection
    EventBus.on(
      "opponent_character_confirmed",
      (data: unknown) => {
        console.log("[CharacterSelectScene] Received opponent_character_confirmed:", data);
        const payload = data as { characterId: string };
        this.onOpponentConfirmed(payload.characterId);
      }
    );

    // Match starting (both players ready)
    EventBus.on("match_starting", (data: unknown) => {
      console.log("[CharacterSelectScene] Received match_starting event:", data);
      const payload = data as {
        countdown: number;
        player1CharacterId?: string;
        player2CharacterId?: string;
      };
      this.onMatchStarting(payload);
    });

    // Opponent disconnected
    EventBus.on("opponent_disconnected", () => {
      console.log("[CharacterSelectScene] Received opponent_disconnected");
      this.opponentStatus.setDisconnected();
    });

    // Ban Events
    EventBus.on("game:banConfirmed", (data: unknown) => {
      const payload = data as { characterId: string; player: string };
      console.log("Ban Confirmed Event Received:", payload);
      this.onOpponentBanConfirmed(payload.characterId, payload.player);
    });

    console.log("[CharacterSelectScene] Event listeners set up complete");
  }

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Handle character card selection.
   */
  private onCharacterSelect(character: Character): void {
    if (this.isConfirmed) return;
    if (this.phase === "PICKING" && this.bannedCharacters.has(character.id)) {
      this.sound.play("sfx_click", { volume: 0.2, detune: -500 }); // Error sound
      return;
    }

    // Deselect previous
    if (this.selectedCharacter) {
      const prevCard = this.characterCards.find(
        (c) => c.getCharacter()?.id === this.selectedCharacter?.id
      );
      prevCard?.deselect();
    }

    // Play click sound
    this.sound.play("sfx_click", { volume: 0.5 });

    // Select new
    this.selectedCharacter = character;
    const newCard = this.characterCards.find(
      (c) => c.getCharacter()?.id === character.id
    );
    newCard?.select();

    // Show confirm button
    this.showConfirmButton();

    // Update stats display
    this.updateStatsDisplay(character);

    // Emit selection event based on phase
    if (this.phase === "BANNING") {
      EventBus.emit("game:sendBanSelected", { characterId: character.id });
    } else {
      EventBus.emit("character_selected", { characterId: character.id });
    }
  }

  /**
   * Confirm the character selection.
   */
  private confirmSelection(): void {
    console.log("[CharacterSelectScene] confirmSelection() called");
    console.log("[CharacterSelectScene] isConfirmed:", this.isConfirmed, "selectedCharacter:", this.selectedCharacter?.id);

    if (this.isConfirmed || !this.selectedCharacter) {
      console.log("[CharacterSelectScene] Aborting - already confirmed or no selection");
      return;
    }

    this.isConfirmed = true;

    if (this.phase === "BANNING") {
      this.myBan = this.selectedCharacter;
      this.hasLockedBan = true;
      this.bannedCharacters.add(this.selectedCharacter.id);

      // Visuals for Ban
      // Visuals for Ban
      const card = this.characterCards.find(
        (c) => c.getCharacter()?.id === this.selectedCharacter?.id
      );

      if (card) {
        // Manually disable interaction
        // Don't use lock() which shows green tick
        card.disable();

        // Add visual "BANNED" indicator
        const bannedText = this.add.text(
          this.CARD_WIDTH / 2,
          this.CARD_HEIGHT / 2,
          "BANNED",
          {
            fontFamily: "Orbitron, sans-serif",
            fontSize: '24px',
            color: '#ff0000',
            backgroundColor: '#000000cc',
            padding: { x: 8, y: 4 },
            fontStyle: 'bold'
          }
        ).setOrigin(0.5);
        bannedText.setRotation(-0.2);
        card.add(bannedText);

        // Ensure alpha isn't too low if we want to see it clearly (disable sets to 0.5)
        // card.setAlpha(0.5); // already set by disable()
      }

      EventBus.emit("game:sendBanConfirmed", { characterId: this.selectedCharacter.id });

      this.hideConfirmButton();
      this.instructionText.setText("Waiting for opponent to ban...");

      this.checkBanPhaseComplete();
      return;
    }

    this.confirmedCharacter = this.selectedCharacter;

    // Lock the selected card
    const card = this.characterCards.find(
      (c) => c.getCharacter()?.id === this.selectedCharacter?.id
    );
    card?.lock();

    // Disable all other cards
    this.characterCards.forEach((c) => {
      if (c.getCharacter()?.id !== this.selectedCharacter?.id) {
        c.disable();
      }
    });

    // Update UI
    this.hideConfirmButton();
    this.selectionTimer.showLockedIn();
    this.instructionText.setText("Waiting for opponent...");

    // Emit confirmation event
    console.log("[CharacterSelectScene] EMITTING selection_confirmed event with characterId:", this.confirmedCharacter.id);
    EventBus.emit("selection_confirmed", {
      characterId: this.confirmedCharacter.id,
    });
    console.log("[CharacterSelectScene] selection_confirmed event emitted");

    // Check if both players ready
    this.checkBothReady();
  }

  /**
   * Handle opponent selection preview.
   */
  private onOpponentSelected(characterId: string): void {
    if (this.phase === "BANNING") {
      // Maybe show they are highlighting something?
      this.opponentStatus.setSelecting();
    } else {
      this.opponentStatus.setSelecting();
    }
  }

  // ===========================================================================
  // BAN & BLIND PICK LOGIC
  // ===========================================================================

  private onOpponentBanConfirmed(characterId: string, playerRole?: string): void {
    const myRole = this.config.isHost ? "player1" : "player2";
    console.log(`[CharacterSelectScene] onOpponentBanConfirmed called. Char: ${characterId}, Role: ${playerRole}, MyRole: ${myRole}`);

    // If role is provided, check if it's us
    if (playerRole && playerRole === myRole) {
      console.log("Ignoring own ban confirmation echo");
      return;
    }

    // If we already recorded this ban, skip (unless it was us, which is handled above)
    if (this.opponentBan?.id === characterId) {
      console.log("[CharacterSelectScene] Opponent ban already recorded. Skipping.");
      return;
    }

    const char = getCharacter(characterId);
    if (char) {
      this.opponentBan = char;
      this.bannedCharacters.add(characterId);

      // Mark card as banned visually
      const card = this.characterCards.find(c => c.getCharacter()?.id === characterId);
      if (card) {
        // Add visual "BANNED" indicator
        const bannedText = this.add.text(
          this.CARD_WIDTH / 2,
          this.CARD_HEIGHT / 2,
          "BANNED",
          {
            fontFamily: "Orbitron, sans-serif",
            fontSize: '24px',
            color: '#ff0000',
            backgroundColor: '#000000cc', // Slightly transparent background
            padding: { x: 8, y: 4 },
            fontStyle: 'bold'
          }
        ).setOrigin(0.5);

        // Add a slight rotation for style
        bannedText.setRotation(-0.2);

        card.add(bannedText);
        card.setAlpha(0.5);
      }
    }
    this.hasOpponentLockedBan = true;
    this.checkBanPhaseComplete();
  }

  private checkBanPhaseComplete(): void {
    if (this.phase !== "BANNING") return;

    console.log(`[CharacterSelectScene] checkBanPhaseComplete checking... Me: ${this.hasLockedBan}, Opp: ${this.hasOpponentLockedBan}`);

    // If opponent has already picked (e.g. pre-selected bot), we can consider their ban phase done
    const oppReady = this.hasOpponentLockedBan || !!this.opponentCharacter;

    if (this.hasLockedBan && oppReady) {
      console.log("[CharacterSelectScene] Ban Phase Complete! Starting Pick Phase in 2-4s...");

      // Prevent multiple triggers
      this.phase = "TRANSITION"; // Temporary internal state
      this.instructionText.setText("Ban Phase Complete. Prepare to Pick...");

      const delay = Phaser.Math.Between(2000, 4000);
      this.time.delayedCall(delay, () => {
        this.startPickPhase();
      });
    }
  }

  private startPickPhase(): void {
    this.phase = "PICKING";
    this.isConfirmed = false;
    this.selectedCharacter = null;

    // Reset UI for Pick Phase
    this.titleText.setText("CHOOSE YOUR FIGHTER");
    this.titleText.setColor("#ffffff");

    // Update instruction
    this.instructionText.setText("Bans Locked! Choose your fighter (Blind Pick)");

    // Enable non-banned cards, disable banned cards
    const STARTERS = ["cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"];

    this.characterCards.forEach(card => {
      const charId = card.getCharacter()?.id;
      const isStarter = STARTERS.includes(charId);
      const isOwned = this.config.ownedCharacterIds?.includes(charId);
      const isUnlocked = isStarter || isOwned;

      if (charId && (this.bannedCharacters.has(charId) || !isUnlocked)) {
        card.disable();
        card.setAlpha(0.3);
      } else {
        card.enable();
        if (card['deselect']) card.deselect();
      }
    });

    // Update Button Text (access internal text object if possible, or recreate container content)
    // Assuming button structure is [Background, Text]
    const buttonText = this.confirmButton.getAt(1) as Phaser.GameObjects.Text;
    if (buttonText) buttonText.setText("LOCK IN");

    this.hideConfirmButton();

    // Reset timer for Pick Phase
    this.selectionTimer.reset(this.config.selectionTimeLimit || 30);
    this.selectionTimer.start();

    // Trigger Bot Pick Logic if bot match
    if (this.config.isBot) {
      this.time.delayedCall(3000 + Math.random() * 3000, () => this.performBotPick());
    }
  }

  /**
   * Handle opponent confirmation (Blind Pick).
   */
  private onOpponentConfirmed(characterId: string): void {
    const character = getCharacter(characterId);
    if (character) {
      this.opponentCharacter = character;
      // BLIND PICK: Do NOT show character yet!
      this.opponentStatus.setLockedHidden();
    }

    this.checkBothReady();
  }

  /**
   * Check if both players are ready to start.
   */
  private checkBothReady(): void {
    if (this.confirmedCharacter && this.opponentCharacter) {
      // Both ready -> Phase REVEAL
      this.phase = "REVEAL";
      this.revealOpponentSelection();
    }
  }

  private revealOpponentSelection(): void {
    if (!this.opponentCharacter) return;

    // Play reveal animation or just show it
    this.opponentStatus.showCharacterPreview(
      this.opponentCharacter.name,
      this.opponentCharacter.theme
    );

    // Optional: Delay before emitting "both_ready" to allow players to see the match-up
    this.time.delayedCall(1500, () => {
      EventBus.emit("both_ready", {
        player: this.confirmedCharacter!.id,
        opponent: this.opponentCharacter!.id,
      });
    });
  }

  /**
   * Handle timer expiration.
   */
  private onTimeUp(): void {
    if (this.isConfirmed) return;

    // Auto-select random character if none selected
    if (!this.selectedCharacter) {
      // Filter for unlocked characters
      const STARTERS = ["cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"];
      const unlockedCharacters = CHARACTER_ROSTER.filter(c =>
        STARTERS.includes(c.id) || this.config.ownedCharacterIds?.includes(c.id)
      );

      // Pick random from unlocked
      if (unlockedCharacters.length > 0) {
        const randomIndex = Math.floor(Math.random() * unlockedCharacters.length);
        this.selectedCharacter = unlockedCharacters[randomIndex];
      } else {
        // Fallback to purely random if somehow no characters are unlocked (shouldn't happen)
        this.selectedCharacter = getRandomCharacter();
      }

      const card = this.characterCards.find(
        (c) => c.getCharacter()?.id === this.selectedCharacter?.id
      );
      card?.select();
    }

    // Auto-confirm
    this.confirmSelection();
  }

  /**
   * Handle match starting countdown.
   */
  private onMatchStarting(payload: {
    countdown: number;
    player1CharacterId?: string;
    player2CharacterId?: string;
  }): void {
    const { countdown, player1CharacterId, player2CharacterId } = payload;

    console.log("[CharacterSelectScene] onMatchStarting called with:", {
      countdown,
      player1CharacterId,
      player2CharacterId,
      isHost: this.config.isHost,
      currentConfirmedCharacter: this.confirmedCharacter?.id,
      currentOpponentCharacter: this.opponentCharacter?.id,
    });

    // If we received character IDs from the server, use them to set opponent character
    // This ensures we have the opponent's character even if we missed the earlier event
    if (player1CharacterId && player2CharacterId) {
      const opponentCharacterId = this.config.isHost ? player2CharacterId : player1CharacterId;
      const playerCharacterId = this.config.isHost ? player1CharacterId : player2CharacterId;

      console.log("[CharacterSelectScene] Derived character IDs:", {
        opponentCharacterId,
        playerCharacterId,
      });

      if (!this.opponentCharacter) {
        const opponent = getCharacter(opponentCharacterId);
        console.log("[CharacterSelectScene] Setting opponent character:", opponent?.name);
        if (opponent) {
          this.opponentCharacter = opponent;
          this.opponentStatus.showCharacterPreview(opponent.name, opponent.theme);
        }
      }

      if (!this.confirmedCharacter) {
        const player = getCharacter(playerCharacterId);
        console.log("[CharacterSelectScene] Setting player character:", player?.name);
        if (player) {
          this.confirmedCharacter = player;
        }
      }
    }

    this.instructionText.setText(`Match starting in ${countdown}...`);
    this.instructionText.setColor("#22c55e");

    console.log("[CharacterSelectScene] Scheduling transition to FightScene in", countdown, "seconds");

    // Transition to fight scene after countdown
    this.time.delayedCall(countdown * 1000, () => {
      console.log("[CharacterSelectScene] Countdown complete, calling transitionToFight()");
      this.transitionToFight();
    });
  }

  /**
   * Transition to the fight scene.
   */
  private transitionToFight(): void {
    // Clean up event listeners
    EventBus.off("opponent_character_selected");
    EventBus.off("opponent_character_confirmed");
    EventBus.off("match_starting");
    EventBus.off("opponent_disconnected");
    EventBus.off("game:banConfirmed");

    // Stop music
    if (this.sound.get("bgm_select")) {
      this.sound.stopByKey("bgm_select");
    }

    // Start fight scene
    this.scene.start("FightScene", {
      matchId: this.config.matchId,
      player1Address: this.config.isHost
        ? this.config.playerAddress
        : this.config.opponentAddress,
      player2Address: this.config.isHost
        ? this.config.opponentAddress
        : this.config.playerAddress,
      player1Character: this.config.isHost
        ? this.confirmedCharacter?.id
        : this.opponentCharacter?.id,
      player2Character: this.config.isHost
        ? this.opponentCharacter?.id
        : this.confirmedCharacter?.id,
      playerRole: this.config.isHost ? "player1" : "player2",
    });
  }

  // ===========================================================================
  // UI HELPERS
  // ===========================================================================

  /**
   * Show the confirm button with animation.
   */
  private showConfirmButton(): void {
    this.confirmButton.setVisible(true);
    this.tweens.add({
      targets: this.confirmButton,
      alpha: 1,
      y: GAME_DIMENSIONS.HEIGHT - 80,
      duration: 200,
      ease: "Power2",
    });
  }

  /**
   * Hide the confirm button.
   */
  private hideConfirmButton(): void {
    this.tweens.add({
      targets: this.confirmButton,
      alpha: 0,
      duration: 200,
      ease: "Power2",
      onComplete: () => {
        this.confirmButton.setVisible(false);
      },
    });
  }

  /**
   * Scene update loop.
   */
  update(_time: number, _delta: number): void {
    // Update any animated elements if needed
  }

  /**
   * Clean up on scene shutdown.
   */
  shutdown(): void {
    EventBus.off("opponent_character_selected");
    EventBus.off("opponent_character_confirmed");
    EventBus.off("match_starting");
    EventBus.off("opponent_disconnected");
    EventBus.off("channel_ready");
    EventBus.off("game:banConfirmed");
  }
}
