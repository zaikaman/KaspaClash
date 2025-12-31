/**
 * FighterSprite - Character sprite with animations
 * Handles fighter display, animations, and health bar
 */

import Phaser from "phaser";
import type { MoveType } from "@/types";

/**
 * Fighter animation keys.
 */
export type FighterAnimation =
  | "idle"
  | "punch"
  | "kick"
  | "block"
  | "special"
  | "hurt"
  | "victory"
  | "defeat";

/**
 * Fighter sprite configuration.
 */
export interface FighterConfig {
  /** Character ID */
  characterId: string;
  /** Player position (left or right) */
  position: "left" | "right";
  /** Initial X position */
  x: number;
  /** Initial Y position */
  y: number;
  /** Sprite scale */
  scale?: number;
}

/**
 * Sprite sheet configuration per character.
 */
export interface SpriteConfig {
  sheet: string;
  frames: number;
  frameRate: number;
  hitFrame?: number;
}

/**
 * FighterSprite class - handles character display and animations.
 */
export class FighterSprite extends Phaser.GameObjects.Container {
  private config: FighterConfig;

  // Sprite components
  private sprite!: Phaser.GameObjects.Sprite;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private healthBarFill!: Phaser.GameObjects.Graphics;
  private nameText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  // State
  private currentHealth: number = 100;
  private maxHealth: number = 100;
  private currentAnimation: FighterAnimation = "idle";
  private isFlipped: boolean = false;

  constructor(scene: Phaser.Scene, config: FighterConfig) {
    super(scene, config.x, config.y);

    this.config = config;
    this.isFlipped = config.position === "right";

    this.create();

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  /**
   * Create the fighter sprite and UI elements.
   */
  private create(): void {
    // Create placeholder sprite (will be replaced with actual character sprite)
    this.createPlaceholderSprite();

    // Create health bar above character
    this.createHealthBar();

    // Create name text
    this.createNameText();

    // Create status text (for showing move confirmations)
    this.createStatusText();
  }

  /**
   * Create a placeholder sprite for the fighter.
   */
  private createPlaceholderSprite(): void {
    // Create a simple rectangle placeholder
    const graphics = this.scene.add.graphics();
    const width = 80;
    const height = 120;

    // Body
    graphics.fillStyle(this.isFlipped ? 0xff6b6b : 0x4ecdc4, 1);
    graphics.fillRoundedRect(-width / 2, -height, width, height, 8);

    // Face area
    graphics.fillStyle(0xffeaa7, 1);
    graphics.fillCircle(0, -height + 25, 20);

    // Convert to sprite
    const key = `fighter-placeholder-${this.config.position}`;
    graphics.generateTexture(key, width, height + 10);
    graphics.destroy();

    this.sprite = this.scene.add.sprite(0, 0, key);
    this.sprite.setOrigin(0.5, 1);

    if (this.isFlipped) {
      this.sprite.setFlipX(true);
    }

    this.add(this.sprite);
  }

  /**
   * Create health bar above the character.
   */
  private createHealthBar(): void {
    const barWidth = 80;
    const barHeight = 8;
    const barY = -140;

    // Background
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.fillStyle(0x333333, 1);
    this.healthBarBg.fillRoundedRect(-barWidth / 2, barY, barWidth, barHeight, 2);
    this.healthBarBg.lineStyle(1, 0x40e0d0, 0.5);
    this.healthBarBg.strokeRoundedRect(-barWidth / 2, barY, barWidth, barHeight, 2);
    this.add(this.healthBarBg);

    // Fill
    this.healthBarFill = this.scene.add.graphics();
    this.updateHealthBar();
    this.add(this.healthBarFill);
  }

  /**
   * Update the health bar display.
   */
  private updateHealthBar(): void {
    const barWidth = 80;
    const barHeight = 8;
    const barY = -140;
    const innerPadding = 1;

    const healthPercent = this.currentHealth / this.maxHealth;
    const fillWidth = (barWidth - innerPadding * 2) * healthPercent;

    this.healthBarFill.clear();

    // Color based on health
    let color = 0x00ff88;
    if (healthPercent <= 0.25) {
      color = 0xff4444;
    } else if (healthPercent <= 0.5) {
      color = 0xffaa00;
    }

    this.healthBarFill.fillStyle(color, 1);
    this.healthBarFill.fillRoundedRect(
      -barWidth / 2 + innerPadding,
      barY + innerPadding,
      fillWidth,
      barHeight - innerPadding * 2,
      1
    );
  }

  /**
   * Create name text below the health bar.
   */
  private createNameText(): void {
    this.nameText = this.scene.add.text(0, -155, this.config.characterId, {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#40e0d0",
    }).setOrigin(0.5);
    this.add(this.nameText);
  }

  /**
   * Create status text for move confirmations.
   */
  private createStatusText(): void {
    this.statusText = this.scene.add.text(0, -170, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#000000aa",
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setAlpha(0);
    this.add(this.statusText);
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Set the fighter's health.
   */
  public setHealth(health: number): void {
    const previousHealth = this.currentHealth;
    this.currentHealth = Math.max(0, Math.min(health, this.maxHealth));
    this.updateHealthBar();

    // Flash red on damage
    if (health < previousHealth) {
      this.flashDamage();
    }
  }

  /**
   * Get the current health.
   */
  public getHealth(): number {
    return this.currentHealth;
  }

  /**
   * Play an animation.
   */
  public playAnimation(animation: FighterAnimation): void {
    this.currentAnimation = animation;

    // For now, use simple tweens as placeholders
    switch (animation) {
      case "punch":
        this.playPunchAnimation();
        break;
      case "kick":
        this.playKickAnimation();
        break;
      case "block":
        this.playBlockAnimation();
        break;
      case "special":
        this.playSpecialAnimation();
        break;
      case "hurt":
        this.playHurtAnimation();
        break;
      case "victory":
        this.playVictoryAnimation();
        break;
      case "defeat":
        this.playDefeatAnimation();
        break;
      case "idle":
      default:
        this.playIdleAnimation();
        break;
    }
  }

  /**
   * Play move animation based on move type.
   */
  public playMoveAnimation(move: MoveType): void {
    this.playAnimation(move as FighterAnimation);
  }

  /**
   * Show status text (e.g., "MOVE SUBMITTED", "CONFIRMED").
   */
  public showStatus(text: string, duration: number = 2000): void {
    this.statusText.setText(text);
    this.statusText.setAlpha(1);

    this.scene.time.delayedCall(duration, () => {
      this.scene.tweens.add({
        targets: this.statusText,
        alpha: 0,
        duration: 300,
      });
    });
  }

  /**
   * Set the character display name.
   */
  public setDisplayName(name: string): void {
    this.nameText.setText(name);
  }

  // ===========================================================================
  // ANIMATIONS
  // ===========================================================================

  private playIdleAnimation(): void {
    // Subtle breathing animation
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: { from: 1, to: 1.02 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private playPunchAnimation(): void {
    this.scene.tweens.killTweensOf(this.sprite);

    const direction = this.isFlipped ? -1 : 1;

    this.scene.tweens.add({
      targets: this,
      x: this.x + direction * 30,
      duration: 100,
      yoyo: true,
      ease: "Power2",
      onComplete: () => {
        this.playIdleAnimation();
      },
    });

    // Punch effect
    this.createHitEffect();
  }

  private playKickAnimation(): void {
    this.scene.tweens.killTweensOf(this.sprite);

    const direction = this.isFlipped ? -1 : 1;

    this.scene.tweens.add({
      targets: this,
      x: this.x + direction * 50,
      duration: 150,
      yoyo: true,
      ease: "Power3",
      onComplete: () => {
        this.playIdleAnimation();
      },
    });

    // Kick effect
    this.createHitEffect();
  }

  private playBlockAnimation(): void {
    this.scene.tweens.killTweensOf(this.sprite);

    // Flash teal for block
    this.sprite.setTint(0x40e0d0);

    this.scene.time.delayedCall(500, () => {
      this.sprite.clearTint();
      this.playIdleAnimation();
    });
  }

  private playSpecialAnimation(): void {
    this.scene.tweens.killTweensOf(this.sprite);

    const direction = this.isFlipped ? -1 : 1;

    // Glow effect
    this.sprite.setTint(0xffff00);

    this.scene.tweens.add({
      targets: this,
      x: this.x + direction * 80,
      duration: 200,
      yoyo: true,
      ease: "Power4",
      onComplete: () => {
        this.sprite.clearTint();
        this.playIdleAnimation();
      },
    });

    // Big hit effect
    this.createHitEffect(true);
  }

  private playHurtAnimation(): void {
    this.scene.tweens.killTweensOf(this.sprite);

    // Flash red
    this.sprite.setTint(0xff0000);

    // Shake
    this.scene.tweens.add({
      targets: this,
      x: this.x + (this.isFlipped ? 20 : -20),
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.sprite.clearTint();
        this.playIdleAnimation();
      },
    });
  }

  private playVictoryAnimation(): void {
    this.scene.tweens.killTweensOf(this.sprite);

    // Jump up
    this.scene.tweens.add({
      targets: this,
      y: this.y - 50,
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: "Power2",
    });

    // Show victory text
    this.showStatus("VICTORY!", 3000);
  }

  private playDefeatAnimation(): void {
    this.scene.tweens.killTweensOf(this.sprite);

    // Fall down
    this.scene.tweens.add({
      targets: this.sprite,
      angle: this.isFlipped ? -90 : 90,
      alpha: 0.5,
      duration: 500,
      ease: "Power2",
    });
  }

  private flashDamage(): void {
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      this.sprite.clearTint();
    });
  }

  private createHitEffect(isSpecial: boolean = false): void {
    const direction = this.isFlipped ? -1 : 1;
    const hitX = this.x + direction * 60;
    const hitY = this.y - 60;

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(isSpecial ? 0xffff00 : 0xffffff, 1);
    graphics.fillCircle(hitX, hitY, isSpecial ? 30 : 15);

    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      scale: isSpecial ? 2 : 1.5,
      duration: 200,
      onComplete: () => {
        graphics.destroy();
      },
    });
  }

  /**
   * Reset to initial state.
   */
  public reset(): void {
    this.currentHealth = this.maxHealth;
    this.updateHealthBar();
    this.sprite.clearTint();
    this.sprite.setAngle(0);
    this.sprite.setAlpha(1);
    this.statusText.setAlpha(0);
    this.playIdleAnimation();
  }

  /**
   * Destroy the fighter sprite.
   */
  public override destroy(): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.sprite);
    super.destroy();
  }
}

export default FighterSprite;
