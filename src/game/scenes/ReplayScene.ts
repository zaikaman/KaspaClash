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
  private player1RoundsWon: number = 0;
  private player2RoundsWon: number = 0;
  private currentGameRound: number = 1;

  // Combat engine for recalculating state
  private combatEngine!: CombatEngine;

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
          frameWidth: 550, frameHeight: 300,
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
  }

  create(): void {
    this.createBackground();
    this.createAnimations();
    this.createUI();
    this.createCharacters();
    this.createReplayBadge();

    // Start playback after a short delay
    this.time.delayedCall(1500, () => {
      this.startReplay();
    });

    // Emit ready event
    EventBus.emit("scene:ready", this);
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
    const barWidth = 350;
    const barHeight = 25;

    // Health bars
    this.player1HealthBar = this.add.graphics();
    this.player2HealthBar = this.add.graphics();

    // Energy bars
    this.player1EnergyBar = this.add.graphics();
    this.player2EnergyBar = this.add.graphics();

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
      UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + barHeight + 4,
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
      UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + barHeight + 4,
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

    // Player 1 sprite (left side)
    this.player1Sprite = this.add.sprite(
      CHARACTER_POSITIONS.PLAYER1.X,
      CHARACTER_POSITIONS.PLAYER1.Y,
      `char_${p1Char}_idle`
    );
    this.player1Sprite.setScale(idleScale);
    if (this.anims.exists(`${p1Char}_idle`)) {
      this.player1Sprite.play(`${p1Char}_idle`);
    }

    // Player 2 sprite (right side, flipped)
    this.player2Sprite = this.add.sprite(
      CHARACTER_POSITIONS.PLAYER2.X,
      CHARACTER_POSITIONS.PLAYER2.Y,
      `char_${p2Char}_idle`
    );
    this.player2Sprite.setScale(p2IdleScale);
    this.player2Sprite.setFlipX(true);
    if (this.anims.exists(`${p2Char}_idle`)) {
      this.player2Sprite.play(`${p2Char}_idle`);
    }
  }

  private getIdleScale(charId: string): number {
    switch (charId) {
      case "block-bruiser": return 0.95;
      case "dag-warrior": return 0.90;
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
    const barWidth = 350;
    const barHeight = 25;
    const p1X = UI_POSITIONS.HEALTH_BAR.PLAYER1.X;
    const p1Y = UI_POSITIONS.HEALTH_BAR.PLAYER1.Y;
    const p2X = UI_POSITIONS.HEALTH_BAR.PLAYER2.X;
    const p2Y = UI_POSITIONS.HEALTH_BAR.PLAYER2.Y;

    // Clear previous
    this.player1HealthBar.clear();
    this.player2HealthBar.clear();

    // Player 1 health bar background
    this.player1HealthBar.fillStyle(0x333333, 1);
    this.player1HealthBar.fillRoundedRect(p1X, p1Y, barWidth, barHeight, 4);

    // Player 1 health bar fill
    const p1Percent = Math.max(0, this.player1Health / this.player1MaxHealth);
    this.player1HealthBar.fillStyle(0x22c55e, 1);
    this.player1HealthBar.fillRoundedRect(p1X, p1Y, barWidth * p1Percent, barHeight, 4);

    // Player 1 health bar border
    this.player1HealthBar.lineStyle(2, 0x40e0d0, 1);
    this.player1HealthBar.strokeRoundedRect(p1X, p1Y, barWidth, barHeight, 4);

    // Player 2 health bar background
    this.player2HealthBar.fillStyle(0x333333, 1);
    this.player2HealthBar.fillRoundedRect(p2X, p2Y, barWidth, barHeight, 4);

    // Player 2 health bar fill (grows from right to left)
    const p2Percent = Math.max(0, this.player2Health / this.player2MaxHealth);
    const p2FillWidth = barWidth * p2Percent;
    this.player2HealthBar.fillStyle(0x22c55e, 1);
    this.player2HealthBar.fillRoundedRect(p2X + barWidth - p2FillWidth, p2Y, p2FillWidth, barHeight, 4);

    // Player 2 health bar border
    this.player2HealthBar.lineStyle(2, 0x40e0d0, 1);
    this.player2HealthBar.strokeRoundedRect(p2X, p2Y, barWidth, barHeight, 4);
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
        // Phase 2: Play attack animations
        const p1Move = round.player1Move;
        const p2Move = round.player2Move;

        // Player 1 attack
        if (this.anims.exists(`${p1Char}_${p1Move}`)) {
          this.player1Sprite.setScale(this.getMoveScale(p1Char, p1Move));
          this.player1Sprite.play(`${p1Char}_${p1Move}`);
        }

        // Player 2 attack
        if (this.anims.exists(`${p2Char}_${p2Move}`)) {
          this.player2Sprite.setScale(this.getMoveScale(p2Char, p2Move));
          this.player2Sprite.play(`${p2Char}_${p2Move}`);
        }

        // Show narrative - create fresh text object with explicit large size
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

        console.log("[ReplayScene] Created new narrative text with fontSize:", this.narrativeText.style.fontSize);

        this.tweens.add({
          targets: this.narrativeText,
          alpha: 1,
          duration: 300,
        });

        // Delay damage effects - wait for 36 frame animations at 24fps = 1500ms
        this.time.delayedCall(1600, () => {
          // Show damage numbers
          if (round.player1DamageDealt > 0) {
            this.showFloatingText(
              `-${round.player1DamageDealt}`,
              meetingPointX + 50,
              CHARACTER_POSITIONS.PLAYER2.Y - 130,
              "#ff4444"
            );
          }
          if (round.player2DamageDealt > 0) {
            this.showFloatingText(
              `-${round.player2DamageDealt}`,
              meetingPointX - 50,
              CHARACTER_POSITIONS.PLAYER1.Y - 130,
              "#ff4444"
            );
          }

          // Update health
          this.player1Health = round.player1HealthAfter;
          this.player2Health = round.player2HealthAfter;
          this.updateHealthBars();
        });

        // Phase 3: Run back - wait longer for attack animations to complete
        this.time.delayedCall(2200, () => {
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
    this.updateHealthBars();

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
}
