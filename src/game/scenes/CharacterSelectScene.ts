/**
 * CharacterSelectScene - Pre-match character selection screen
 * Players select their fighter before entering the battle arena
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { GAME_DIMENSIONS } from "../config";
import { CharacterCard, SelectionTimer, OpponentStatus } from "../ui";
import { CHARACTER_ROSTER, getCharacter, getRandomCharacter } from "@/data/characters";
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

  // State
  private selectedCharacter: Character | null = null;
  private confirmedCharacter: Character | null = null;
  private opponentCharacter: Character | null = null;
  private isConfirmed: boolean = false;

  // Layout constants
  private readonly CARD_WIDTH = 200;
  private readonly CARD_HEIGHT = 260;
  private readonly CARD_SPACING = 40;
  private readonly GRID_COLS = 4;
  private readonly GRID_START_Y = 280;

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
    };
    this.resetState();
  }

  /**
   * Reset scene state.
   */
  private resetState(): void {
    this.selectedCharacter = null;
    this.confirmedCharacter = null;
    this.opponentCharacter = null;
    this.isConfirmed = false;
    this.characterCards = [];
  }

  /**
   * Preload assets.
   */
  preload(): void {
    // Load character portraits
    for (const character of CHARACTER_ROSTER) {
      // 1. Try SVGs first (preferred)
      this.load.svg(
        `portrait-${character.id}`,
        `/characters/${character.id}/portrait.svg`,
        { width: 180, height: 180 }
      );

      // 2. Try PNG portraits
      this.load.image(`portrait-${character.id}-png`, `/characters/${character.id}/portrait.png`);

      // 3. Fallback to idle.png (for development/early testing)
      this.load.image(`portrait-${character.id}-fallback`, `/characters/${character.id}/idle.png`);
    }

    // Load background
    this.load.image("select-bg", "/assets/background_1.png");

    // Load UI assets
    this.load.image("lock-icon", "/assets/lock.png");
  }

  /**
   * Create scene elements.
   */
  create(): void {
    this.createBackground();
    this.createTitle();
    this.createCharacterGrid();
    this.createSelectionTimer();
    this.createOpponentStatus();
    this.createConfirmButton();
    this.createInstructions();
    this.setupEventListeners();

    // Start the selection timer
    this.selectionTimer.start();

    // Notify that scene is ready
    EventBus.emit("character_select_ready", { matchId: this.config.matchId });
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
      "CHOOSE YOUR FIGHTER",
      {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "36px",
        color: "#ffffff",
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

    CHARACTER_ROSTER.forEach((character, index) => {
      const col = index % this.GRID_COLS;
      const x = startX + col * (this.CARD_WIDTH + this.CARD_SPACING);
      const y = this.GRID_START_Y;

      const card = new CharacterCard(this, {
        x,
        y,
        character,
        width: this.CARD_WIDTH,
        height: this.CARD_HEIGHT,
        onSelect: (char) => this.onCharacterSelect(char),
      });

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
    const text = this.add.text(0, 0, "LOCK IN", {
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
      }
    });

    this.confirmButton.on("pointerout", () => {
      this.confirmButton.setScale(1);
    });

    this.confirmButton.on("pointerdown", () => {
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
   * Setup event listeners for WebSocket events.
   */
  private setupEventListeners(): void {
    // Opponent selected a character
    EventBus.on(
      "opponent_character_selected",
      (data: unknown) => {
        const payload = data as { characterId: string };
        this.onOpponentSelected(payload.characterId);
      }
    );

    // Opponent confirmed their selection
    EventBus.on(
      "opponent_character_confirmed",
      (data: unknown) => {
        const payload = data as { characterId: string };
        this.onOpponentConfirmed(payload.characterId);
      }
    );

    // Match starting (both players ready)
    EventBus.on("match_starting", (data: unknown) => {
      const payload = data as { countdown: number };
      this.onMatchStarting(payload.countdown);
    });

    // Opponent disconnected
    EventBus.on("opponent_disconnected", () => {
      this.opponentStatus.setDisconnected();
    });
  }

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Handle character card selection.
   */
  private onCharacterSelect(character: Character): void {
    if (this.isConfirmed) return;

    // Deselect previous
    if (this.selectedCharacter) {
      const prevCard = this.characterCards.find(
        (c) => c.getCharacter()?.id === this.selectedCharacter?.id
      );
      prevCard?.deselect();
    }

    // Select new
    this.selectedCharacter = character;
    const newCard = this.characterCards.find(
      (c) => c.getCharacter()?.id === character.id
    );
    newCard?.select();

    // Show confirm button
    this.showConfirmButton();

    // Emit selection event
    EventBus.emit("character_selected", { characterId: character.id });
  }

  /**
   * Confirm the character selection.
   */
  private confirmSelection(): void {
    if (this.isConfirmed || !this.selectedCharacter) return;

    this.isConfirmed = true;
    this.confirmedCharacter = this.selectedCharacter;

    // Lock the selected card
    const card = this.characterCards.find(
      (c) => c.getCharacter()?.id === this.selectedCharacter?.id
    );
    card?.lock();

    // Disable other cards
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
    EventBus.emit("selection_confirmed", {
      characterId: this.confirmedCharacter.id,
    });

    // Check if both players ready
    this.checkBothReady();
  }

  /**
   * Handle opponent selection preview.
   */
  private onOpponentSelected(characterId: string): void {
    this.opponentStatus.setSelecting();
  }

  /**
   * Handle opponent confirmation.
   */
  private onOpponentConfirmed(characterId: string): void {
    const character = getCharacter(characterId);
    if (character) {
      this.opponentCharacter = character;
      this.opponentStatus.showCharacterPreview(character.name, character.theme);
    }

    this.checkBothReady();
  }

  /**
   * Check if both players are ready to start.
   */
  private checkBothReady(): void {
    if (this.confirmedCharacter && this.opponentCharacter) {
      EventBus.emit("both_ready", {
        player: this.confirmedCharacter.id,
        opponent: this.opponentCharacter.id,
      });
    }
  }

  /**
   * Handle timer expiration.
   */
  private onTimeUp(): void {
    if (this.isConfirmed) return;

    // Auto-select random character if none selected
    if (!this.selectedCharacter) {
      this.selectedCharacter = getRandomCharacter();
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
  private onMatchStarting(countdown: number): void {
    this.instructionText.setText(`Match starting in ${countdown}...`);
    this.instructionText.setColor("#22c55e");

    // Transition to fight scene after countdown
    this.time.delayedCall(countdown * 1000, () => {
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
  }
}
