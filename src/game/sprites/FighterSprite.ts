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
  | "move"
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
  private isBlocking: boolean = false;

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
    // Create sprite
    this.createSprite();

    // Create health bar above character
    this.createHealthBar();

    // Create name text
    this.createNameText();

    // Create status text (for showing move confirmations)
    this.createStatusText();
  }

  /**
   * Create the fighter sprite.
   * Looks for a loaded sprite/atlas first, falls back to placeholder if missing.
   */
  private createSprite(): void {
    const key = `char_${this.config.characterId}`;

    // Check if the texture exists
    if (this.scene.textures.exists(key)) {
      this.sprite = this.scene.add.sprite(0, 0, key);

      // Scale if needed
      if (this.config.scale) {
        this.sprite.setScale(this.config.scale);
      }
    } else {
      // Fallback to placeholder
      this.createPlaceholderSprite();
    }

    this.sprite.setOrigin(0.5, 1);

    if (this.isFlipped) {
      this.sprite.setFlipX(true);
    }

    this.add(this.sprite);

    // Start idle animation if it exists
    this.playAnimation("idle");
  }

  /**
   * Create a placeholder sprite for the fighter if no asset found.
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
      if (!this.isBlocking) {
        this.playAnimation("hurt");
      }
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
  public playAnimation(animation: FighterAnimation, force: boolean = false): void {
    if (this.currentAnimation === animation && !force) return;

    this.currentAnimation = animation;
    const animKey = `${this.config.characterId}_${animation}`;

    // Reset loop state
    this.isBlocking = (animation === 'block');

    // Check if real animation exists
    if (this.scene.anims.exists(animKey)) {
      this.sprite.play(animKey);

      // Return to idle after non-looping animations
      if (['punch', 'kick', 'special', 'hurt'].includes(animation)) {
        this.sprite.once('animationcomplete', () => {
          this.playAnimation('idle');
        });
      }
    } else {
      // Fallback to tween animations if no sprite animation
      this.playTweenAnimation(animation);
    }
  }

  /**
   * Play move animation based on move type.
   */
  public playMoveAnimation(move: MoveType): void {
    this.playAnimation(move as FighterAnimation, true);
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
  // FALLBACK TWEEN ANIMATIONS (Legacy Support)
  // ===========================================================================

  private playTweenAnimation(animation: FighterAnimation): void {
    // Stop existing tweens
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setAngle(0);

    switch (animation) {
      case "idle":
        this.playIdleTween();
        break;
      case "punch":
        this.playPunchTween();
        break;
      case "kick":
        this.playKickTween();
        break;
      case "block":
        this.playBlockTween();
        break;
      case "special":
        this.playSpecialTween();
        break;
      case "hurt":
        this.playHurtTween();
        break;
      case "victory":
        this.playVictoryTween();
        break;
      case "defeat":
        this.playDefeatTween();
        break;
    }
  }

  private playIdleTween(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: { from: 1, to: 1.02 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private playPunchTween(): void {
    const direction = this.isFlipped ? -1 : 1;
    this.scene.tweens.add({
      targets: this,
      x: this.x + direction * 30,
      duration: 100,
      yoyo: true,
      ease: "Power2",
      onComplete: () => {
        this.playIdleTween();
      },
    });
    this.createHitEffect();
  }

  private playKickTween(): void {
    const direction = this.isFlipped ? -1 : 1;
    this.scene.tweens.add({
      targets: this,
      x: this.x + direction * 50,
      duration: 150,
      yoyo: true,
      ease: "Power3",
      onComplete: () => {
        this.playIdleTween();
      },
    });
    this.createHitEffect();
  }

  private playBlockTween(): void {
    this.sprite.setTint(0x40e0d0);
    this.scene.time.delayedCall(500, () => {
      this.sprite.clearTint();
      this.playIdleTween();
    });
  }

  private playSpecialTween(): void {
    const direction = this.isFlipped ? -1 : 1;
    this.sprite.setTint(0xffff00);
    this.scene.tweens.add({
      targets: this,
      x: this.x + direction * 80,
      duration: 200,
      yoyo: true,
      ease: "Power4",
      onComplete: () => {
        this.sprite.clearTint();
        this.playIdleTween();
      },
    });
    this.createHitEffect(true);
  }

  private playHurtTween(): void {
    this.sprite.setTint(0xff0000);
    this.scene.tweens.add({
      targets: this,
      x: this.x + (this.isFlipped ? 20 : -20),
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.sprite.clearTint();
        this.playIdleTween();
      },
    });
  }

  private playVictoryTween(): void {
    this.scene.tweens.add({
      targets: this,
      y: this.y - 50,
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: "Power2",
    });
    this.showStatus("VICTORY!", 3000);
  }

  private playDefeatTween(): void {
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
    this.playAnimation("idle", true);
  }

  /**
   * Destroy the fighter sprite.
   */
  public override destroy(): void {
    this.scene.tweens.killTweensOf(this);
    if (this.sprite) {
      this.scene.tweens.killTweensOf(this.sprite);
    }
    super.destroy();
  }
}

export default FighterSprite;
