/**
 * OfflinePowerSurgeCards - Simplified Power Surge UI for offline modes
 * 
 * Similar to PowerSurgeCards but without Kaspa transactions or database polling.
 * Used in PracticeScene and SurvivalScene where everything is local.
 * 
 * Key differences from online version:
 * - No transaction confirmation required
 * - No database polling for opponent status
 * - AI selection is immediate (precomputed)
 * - Simplified "click to select" flow
 */

import Phaser from "phaser";
import { GAME_DIMENSIONS } from "../config";
import type {
  PowerSurgeCard,
  PowerSurgeCardId,
} from "@/types/power-surge";
import {
  getPowerSurgeCard,
} from "@/types/power-surge";

// =============================================================================
// CONSTANTS
// =============================================================================

const CARD_WIDTH = 200;
const CARD_HEIGHT = 300;
const CARD_SPACING = 40;
const CENTER_CARD_SCALE = 1.1;
const SELECTION_TIMEOUT_MS = 10000; // 10 seconds for offline mode
const WARNING_TIME_MS = 3000;

// =============================================================================
// TYPES
// =============================================================================

export interface OfflinePowerSurgeCardsConfig {
  scene: Phaser.Scene;
  roundNumber: number;
  cardIds: PowerSurgeCardId[];
  aiSelectedCardId: PowerSurgeCardId; // Pre-computed AI selection
  deadline: number;
  onCardSelected: (cardId: PowerSurgeCardId) => void;
  onTimeout: () => void;
  onClose: (playerSelection: PowerSurgeCardId | null, aiSelection: PowerSurgeCardId) => void;
}

interface CardContainer {
  container: Phaser.GameObjects.Container;
  card: PowerSurgeCard;
  isHovered: boolean;
  originalX: number;
  originalY: number;
}

// =============================================================================
// OFFLINE POWER SURGE CARDS UI
// =============================================================================

export class OfflinePowerSurgeCards {
  private scene: Phaser.Scene;
  private config: OfflinePowerSurgeCardsConfig;
  private mainContainer: Phaser.GameObjects.Container;
  private backgroundBlocker: Phaser.GameObjects.Rectangle;
  private cardContainers: CardContainer[] = [];
  private timerText: Phaser.GameObjects.Text;
  private timerBar: Phaser.GameObjects.Graphics;
  private titleText: Phaser.GameObjects.Text;
  private instructionText: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;
  private isSelecting: boolean = false;
  private selectedCardId: PowerSurgeCardId | null = null;
  private isDestroyed: boolean = false;

  constructor(config: OfflinePowerSurgeCardsConfig) {
    this.scene = config.scene;
    this.config = config;

    // Create semi-transparent background blocker
    this.backgroundBlocker = this.scene.add.rectangle(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y,
      GAME_DIMENSIONS.WIDTH,
      GAME_DIMENSIONS.HEIGHT,
      0x000000,
      0.85
    );
    this.backgroundBlocker.setInteractive(); // Block clicks through
    this.backgroundBlocker.setDepth(4000);

    // Main container for all UI elements
    this.mainContainer = this.scene.add.container(
      GAME_DIMENSIONS.CENTER_X,
      GAME_DIMENSIONS.CENTER_Y
    );
    this.mainContainer.setDepth(4001);

    // Create UI elements
    this.titleText = this.createTitle();
    this.instructionText = this.createInstruction();
    this.timerText = this.createTimerText();
    this.timerBar = this.createTimerBar();

    // Create cards
    this.createCards();

    // Start animations
    this.animateEntry();

    // Start countdown timer
    this.startTimer();

    // Play sound (use click sound as fallback)
    this.playSFX("sfx_click");
  }

  // ===========================================================================
  // UI CREATION
  // ===========================================================================

  private createTitle(): Phaser.GameObjects.Text {
    const text = this.scene.add.text(0, -280, "⚡ POWER SURGE ⚡", {
      fontFamily: "monospace",
      fontSize: "36px",
      color: "#40e0d0",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    });
    text.setOrigin(0.5);
    this.mainContainer.add(text);

    // Pulsing glow effect
    this.scene.tweens.add({
      targets: text,
      alpha: { from: 1, to: 0.7 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    return text;
  }

  private createInstruction(): Phaser.GameObjects.Text {
    const text = this.scene.add.text(0, -240, "Choose a boost for this round!", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#9ca3af",
    });
    text.setOrigin(0.5);
    this.mainContainer.add(text);
    return text;
  }

  private createTimerText(): Phaser.GameObjects.Text {
    const remainingSeconds = Math.ceil((this.config.deadline - Date.now()) / 1000);
    const text = this.scene.add.text(0, 260, `${remainingSeconds}s`, {
      fontFamily: "monospace",
      fontSize: "32px",
      color: "#40e0d0",
      fontStyle: "bold",
    });
    text.setOrigin(0.5);
    this.mainContainer.add(text);
    return text;
  }

  private createTimerBar(): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    this.mainContainer.add(graphics);
    this.timerBar = graphics;
    this.updateTimerBar(1);
    return graphics;
  }

  private updateTimerBar(progress: number): void {
    const barWidth = 300;
    const barHeight = 8;
    const y = 290;

    this.timerBar.clear();

    // Background
    this.timerBar.fillStyle(0x333333, 1);
    this.timerBar.fillRoundedRect(-barWidth / 2, y, barWidth, barHeight, 4);

    // Progress fill
    const progressWidth = barWidth * progress;
    const color = progress > 0.3 ? 0x40e0d0 : 0xff4444;
    this.timerBar.fillStyle(color, 1);
    this.timerBar.fillRoundedRect(-barWidth / 2, y, progressWidth, barHeight, 4);
  }

  private createCards(): void {
    const cards = this.config.cardIds.map((id) => getPowerSurgeCard(id)!).filter(Boolean);
    const totalWidth = cards.length * CARD_WIDTH + (cards.length - 1) * CARD_SPACING;
    const startX = -totalWidth / 2 + CARD_WIDTH / 2;

    cards.forEach((card, index) => {
      const x = startX + index * (CARD_WIDTH + CARD_SPACING);
      const y = 40;
      const isCenter = index === Math.floor(cards.length / 2);
      const scale = isCenter ? CENTER_CARD_SCALE : 1;

      const container = this.createSingleCard(card, x, y, scale, index);
      this.cardContainers.push({
        container,
        card,
        isHovered: false,
        originalX: x,
        originalY: y,
      });
    });
  }

  private createSingleCard(
    card: PowerSurgeCard,
    x: number,
    y: number,
    scale: number,
    index: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setScale(0); // Start hidden for animation
    container.setData("cardId", card.id);
    container.setData("index", index);

    // Card background (image from public/cards)
    if (this.scene.textures.exists(card.iconKey)) {
      const cardImage = this.scene.add.image(0, 0, card.iconKey);
      cardImage.setDisplaySize(CARD_WIDTH, CARD_HEIGHT);
      cardImage.setOrigin(0.5, 0.5);
      container.add(cardImage);

      // Dark overlay for bottom half to make text readable
      const textOverlay = this.scene.add.graphics();
      textOverlay.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.9, 0.9);
      textOverlay.fillRect(-CARD_WIDTH / 2, 0, CARD_WIDTH, CARD_HEIGHT / 2);
      container.add(textOverlay);
    } else {
      // Fallback to glassmorphic background
      const bg = this.scene.add.graphics();
      this.drawCardBackground(bg, card);
      container.add(bg);
    }

    // Neon border glow effect
    const glowBorder = this.scene.add.graphics();
    this.drawGlowBorder(glowBorder, card.glowColor, 1.0);
    container.add(glowBorder);

    // Card title
    const title = this.scene.add.text(0, 5, card.name, {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      stroke: "#000000",
      strokeThickness: 3,
      wordWrap: { width: CARD_WIDTH - 30 },
    });
    title.setOrigin(0.5);
    container.add(title);

    // Effect description
    const description = this.scene.add.text(0, 45, card.description, {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#e2e8f0",
      align: "center",
      stroke: "#000000",
      strokeThickness: 2,
      wordWrap: { width: CARD_WIDTH - 40 },
    });
    description.setOrigin(0.5);
    container.add(description);

    // DAG graph decoration
    this.drawDAGGraph(container, card.glowColor);

    // Interactive hit area
    const hitArea = this.scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    // Hover effects
    hitArea.on("pointerover", () => this.onCardHover(container, card, true));
    hitArea.on("pointerout", () => this.onCardHover(container, card, false));
    hitArea.on("pointerdown", () => this.onCardClick(card));

    this.mainContainer.add(container);

    // Pulsing border animation
    this.scene.tweens.add({
      targets: glowBorder,
      alpha: { from: 1, to: 0.5 },
      duration: 800 + index * 100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    return container;
  }

  private drawCardBackground(graphics: Phaser.GameObjects.Graphics, card: PowerSurgeCard): void {
    // Dark glassmorphic background
    graphics.fillStyle(0x1a1a2e, 0.9);
    graphics.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 16);

    // Inner gradient overlay
    graphics.fillGradientStyle(card.glowColor, card.glowColor, 0x1a1a2e, 0x1a1a2e, 0.15, 0.15, 0, 0);
    graphics.fillRoundedRect(-CARD_WIDTH / 2 + 4, -CARD_HEIGHT / 2 + 4, CARD_WIDTH - 8, CARD_HEIGHT - 8, 14);
  }

  private drawGlowBorder(graphics: Phaser.GameObjects.Graphics, color: number, intensity: number): void {
    // Outer blooming glow
    for (let i = 1; i <= 3; i++) {
      graphics.lineStyle(2 + i * 2, color, (0.15 / i) * intensity);
      graphics.strokeRoundedRect(
        -CARD_WIDTH / 2 - i,
        -CARD_HEIGHT / 2 - i,
        CARD_WIDTH + i * 2,
        CARD_HEIGHT + i * 2,
        16 + i
      );
    }

    // Main sharp neon border
    graphics.lineStyle(3, color, 1.0 * intensity);
    graphics.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 16);

    // High-tech corner accents
    const cornerSize = 25;
    graphics.lineStyle(4, 0xffffff, 0.5 * intensity);

    graphics.beginPath();
    graphics.moveTo(-CARD_WIDTH / 2 + cornerSize, -CARD_HEIGHT / 2);
    graphics.lineTo(-CARD_WIDTH / 2, -CARD_HEIGHT / 2);
    graphics.lineTo(-CARD_WIDTH / 2, -CARD_HEIGHT / 2 + cornerSize);
    graphics.strokePath();

    graphics.beginPath();
    graphics.moveTo(CARD_WIDTH / 2 - cornerSize, CARD_HEIGHT / 2);
    graphics.lineTo(CARD_WIDTH / 2, CARD_HEIGHT / 2);
    graphics.lineTo(CARD_WIDTH / 2, CARD_HEIGHT / 2 - cornerSize);
    graphics.strokePath();
  }

  private drawDAGGraph(container: Phaser.GameObjects.Container, color: number): void {
    const graphics = this.scene.add.graphics();
    const baseY = CARD_HEIGHT / 2 - 25;

    graphics.lineStyle(1.5, color, 0.6);

    const nodes = [
      { x: -60, y: baseY + 10 },
      { x: -30, y: baseY - 5 },
      { x: 0, y: baseY + 5 },
      { x: 30, y: baseY - 5 },
      { x: 60, y: baseY + 10 },
    ];

    graphics.beginPath();
    graphics.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      graphics.lineTo(nodes[i].x, nodes[i].y);
    }
    graphics.strokePath();

    nodes.forEach((node) => {
      graphics.fillStyle(color, 0.8);
      graphics.fillRect(node.x - 3, node.y - 3, 6, 6);
      graphics.lineStyle(1, 0xffffff, 0.5);
      graphics.strokeRect(node.x - 4, node.y - 4, 8, 8);
    });

    container.add(graphics);
  }

  // ===========================================================================
  // ANIMATIONS
  // ===========================================================================

  private animateEntry(): void {
    this.cardContainers.forEach((cc, index) => {
      const delay = 100 + index * 150;
      const isCenter = index === Math.floor(this.cardContainers.length / 2);
      const targetScale = isCenter ? CENTER_CARD_SCALE : 1;

      cc.container.setY(cc.originalY + 100);

      this.scene.tweens.add({
        targets: cc.container,
        y: cc.originalY,
        scaleX: targetScale,
        scaleY: targetScale,
        duration: 500,
        delay,
        ease: "Back.easeOut",
      });
    });

    this.titleText.setY(-350);
    this.scene.tweens.add({
      targets: this.titleText,
      y: -280,
      duration: 600,
      ease: "Back.easeOut",
    });
  }

  private onCardHover(
    container: Phaser.GameObjects.Container,
    card: PowerSurgeCard,
    isHover: boolean
  ): void {
    if (this.isSelecting || this.isDestroyed) return;

    const cc = this.cardContainers.find((c) => c.container === container);
    if (!cc) return;

    cc.isHovered = isHover;

    if (isHover) {
      this.playSFX("sfx_hover");
      this.scene.tweens.add({
        targets: container,
        y: cc.originalY - 30,
        scaleX: container.scaleX * 1.08,
        scaleY: container.scaleY * 1.08,
        duration: 200,
        ease: "Back.easeOut",
      });
    } else {
      const index = container.getData("index");
      const isCenter = index === Math.floor(this.cardContainers.length / 2);
      const targetScale = isCenter ? CENTER_CARD_SCALE : 1;

      this.scene.tweens.add({
        targets: container,
        y: cc.originalY,
        scaleX: targetScale,
        scaleY: targetScale,
        duration: 200,
        ease: "Quad.easeOut",
      });
    }
  }

  private onCardClick(card: PowerSurgeCard): void {
    if (this.isSelecting || this.isDestroyed) return;

    this.isSelecting = true;
    this.selectedCardId = card.id;

    this.playSFX("sfx_click");

    // Highlight selected card
    const selectedCC = this.cardContainers.find((cc) => cc.card.id === card.id);
    if (selectedCC) {
      this.scene.tweens.add({
        targets: selectedCC.container,
        scaleX: selectedCC.container.scaleX * 1.15,
        scaleY: selectedCC.container.scaleY * 1.15,
        duration: 200,
        yoyo: true,
        repeat: 1,
      });
    }

    // Dim other cards
    this.cardContainers.forEach((cc) => {
      if (cc.card.id !== card.id) {
        this.scene.tweens.add({
          targets: cc.container,
          alpha: 0.3,
          duration: 200,
        });
      }
    });

    // Show confirmation immediately (no transaction needed)
    this.instructionText.setText("BOOST SELECTED!");
    this.instructionText.setColor("#22c55e");
    this.instructionText.setFontSize(20);

    // Flash effect
    const flash = this.scene.add.rectangle(
      0,
      0,
      GAME_DIMENSIONS.WIDTH,
      GAME_DIMENSIONS.HEIGHT,
      card.glowColor,
      0.3
    );
    this.mainContainer.add(flash);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    });

    // Particle explosion
    this.createParticleExplosion(selectedCC!.container.x, selectedCC!.container.y, card.glowColor);

    // Call selection handler
    this.config.onCardSelected(card.id);

    // Close after brief delay
    this.scene.time.delayedCall(1000, () => {
      if (!this.isDestroyed) {
        this.animateExit();
      }
    });
  }

  private createParticleExplosion(x: number, y: number, color: number): void {
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 4 + Math.random() * 4);
      particle.setPosition(x, y);
      this.mainContainer.add(particle);

      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      const targetX = x + Math.cos(angle) * speed;
      const targetY = y + Math.sin(angle) * speed;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0,
        duration: 600 + Math.random() * 400,
        ease: "Quad.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }

  // ===========================================================================
  // TIMER
  // ===========================================================================

  private startTimer(): void {
    const updateTimer = () => {
      if (this.isDestroyed) return;

      const now = Date.now();
      const remaining = Math.max(0, this.config.deadline - now);
      const progress = remaining / SELECTION_TIMEOUT_MS;
      const seconds = Math.ceil(remaining / 1000);

      this.timerText.setText(`${seconds}s`);
      this.updateTimerBar(progress);

      if (remaining <= WARNING_TIME_MS && remaining > 0) {
        this.timerText.setColor("#ff4444");
        if (!this.timerText.getData("isPulsing")) {
          this.timerText.setData("isPulsing", true);
          this.scene.tweens.add({
            targets: this.timerText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            repeat: -1,
          });
        }
      }

      if (remaining <= 0 && !this.isSelecting) {
        this.handleTimeout();
        return;
      }

      if (remaining > 0) {
        this.timerEvent = this.scene.time.delayedCall(100, updateTimer);
      }
    };

    updateTimer();
  }

  private handleTimeout(): void {
    if (this.isDestroyed) return;

    this.instructionText.setText("Time's up! No boost selected.");
    this.instructionText.setColor("#ef4444");

    this.cardContainers.forEach((cc) => {
      this.scene.tweens.add({
        targets: cc.container,
        alpha: 0.2,
        duration: 300,
      });
    });

    this.config.onTimeout();

    this.scene.time.delayedCall(1000, () => {
      if (!this.isDestroyed) {
        this.animateExit();
      }
    });
  }

  // ===========================================================================
  // EXIT
  // ===========================================================================

  private animateExit(): void {
    this.cardContainers.forEach((cc, index) => {
      this.scene.tweens.add({
        targets: cc.container,
        y: cc.originalY + 100,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 300,
        delay: index * 50,
        ease: "Quad.easeIn",
      });
    });

    this.scene.tweens.add({
      targets: [this.titleText, this.instructionText, this.timerText, this.timerBar],
      alpha: 0,
      duration: 300,
    });

    this.scene.tweens.add({
      targets: this.backgroundBlocker,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  private playSFX(key: string): void {
    if (this.scene.game.sound.locked) return;
    try {
      this.scene.sound.play(key, { volume: 0.5 });
    } catch (e) {
      console.warn(`Failed to play SFX: ${key}`, e);
    }
  }

  public forceClose(): void {
    this.destroy();
  }

  public getSelectedCard(): PowerSurgeCardId | null {
    return this.selectedCardId;
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    this.cardContainers.forEach((cc) => {
      cc.container.destroy();
    });
    this.cardContainers = [];

    this.mainContainer.destroy();
    this.backgroundBlocker.destroy();

    this.config.onClose(this.selectedCardId, this.config.aiSelectedCardId);
  }
}
