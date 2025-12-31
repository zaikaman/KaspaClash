/**
 * MoveButton - Interactive button for move selection
 * Displays move type with damage info and handles selection state
 */

import Phaser from "phaser";
import type { MoveType } from "@/types";
import { MOVE_PROPERTIES } from "@/types/constants";

/**
 * Move button configuration.
 */
export interface MoveButtonConfig {
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Button width */
  width: number;
  /** Button height */
  height: number;
  /** Move type */
  moveType: MoveType;
  /** Callback when clicked */
  onClick?: (moveType: MoveType) => void;
}

/**
 * Move button colors.
 */
const BUTTON_COLORS = {
  punch: { primary: 0xff6b6b, secondary: 0xee5a5a },
  kick: { primary: 0x4ecdc4, secondary: 0x3dbdb5 },
  block: { primary: 0x45b7d1, secondary: 0x35a7c1 },
  special: { primary: 0xf7dc6f, secondary: 0xe7cc5f },
} as const;

/**
 * MoveButton class - Interactive move selection button.
 */
export class MoveButton extends Phaser.GameObjects.Container {
  private config: MoveButtonConfig;

  // UI Elements
  private background!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private damageText!: Phaser.GameObjects.Text;
  private icon!: Phaser.GameObjects.Graphics;

  // State
  private isSelected: boolean = false;
  private isDisabled: boolean = false;
  private isHovered: boolean = false;

  constructor(scene: Phaser.Scene, config: MoveButtonConfig) {
    super(scene, config.x, config.y);

    this.config = config;

    this.create();

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  /**
   * Create the button elements.
   */
  private create(): void {
    this.createBackground();
    this.createIcon();
    this.createLabels();
    this.setupInteractivity();
  }

  /**
   * Create the button background.
   */
  private createBackground(): void {
    this.background = this.scene.add.graphics();
    this.drawBackground("normal");
    this.add(this.background);
  }

  /**
   * Draw the background in different states.
   */
  private drawBackground(state: "normal" | "hover" | "selected" | "disabled"): void {
    const { width, height, moveType } = this.config;
    const colors = BUTTON_COLORS[moveType];

    this.background.clear();

    switch (state) {
      case "selected":
        // Selected state - bright with glow
        this.background.fillStyle(colors.primary, 0.4);
        this.background.fillRoundedRect(0, 0, width, height, 12);
        this.background.lineStyle(3, colors.primary, 1);
        this.background.strokeRoundedRect(0, 0, width, height, 12);
        break;

      case "hover":
        // Hover state - slight highlight
        this.background.fillStyle(0x2d2d44, 1);
        this.background.fillRoundedRect(0, 0, width, height, 12);
        this.background.lineStyle(2, colors.primary, 0.8);
        this.background.strokeRoundedRect(0, 0, width, height, 12);
        break;

      case "disabled":
        // Disabled state - grayed out
        this.background.fillStyle(0x1a1a2e, 0.5);
        this.background.fillRoundedRect(0, 0, width, height, 12);
        this.background.lineStyle(1, 0x444444, 0.5);
        this.background.strokeRoundedRect(0, 0, width, height, 12);
        break;

      case "normal":
      default:
        // Normal state
        this.background.fillStyle(0x2d2d44, 1);
        this.background.fillRoundedRect(0, 0, width, height, 12);
        this.background.lineStyle(2, 0x40e0d0, 0.5);
        this.background.strokeRoundedRect(0, 0, width, height, 12);
        break;
    }
  }

  /**
   * Create the move icon.
   */
  private createIcon(): void {
    const { width, moveType } = this.config;
    const iconSize = 24;
    const iconX = width / 2;
    const iconY = 25;

    this.icon = this.scene.add.graphics();
    const colors = BUTTON_COLORS[moveType];

    // Draw simple icon based on move type
    switch (moveType) {
      case "punch":
        // Fist icon
        this.icon.fillStyle(colors.primary, 1);
        this.icon.fillCircle(iconX, iconY, iconSize / 2);
        this.icon.fillRect(iconX - 5, iconY, 10, 15);
        break;

      case "kick":
        // Boot icon
        this.icon.fillStyle(colors.primary, 1);
        this.icon.fillTriangle(
          iconX - iconSize / 2, iconY + iconSize / 2,
          iconX + iconSize / 2, iconY + iconSize / 2,
          iconX, iconY - iconSize / 2
        );
        break;

      case "block":
        // Shield icon
        this.icon.fillStyle(colors.primary, 1);
        this.icon.fillRoundedRect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize, 4);
        this.icon.fillStyle(0x2d2d44, 1);
        this.icon.fillRoundedRect(iconX - iconSize / 4, iconY - iconSize / 4, iconSize / 2, iconSize / 2, 2);
        break;

      case "special":
        // Star icon
        this.icon.fillStyle(colors.primary, 1);
        this.drawStar(this.icon, iconX, iconY, 5, iconSize / 2, iconSize / 4);
        break;
    }

    this.add(this.icon);
  }

  /**
   * Draw a star shape.
   */
  private drawStar(
    graphics: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    points: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    const step = Math.PI / points;

    graphics.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * Create the label texts.
   */
  private createLabels(): void {
    const { width, height, moveType } = this.config;
    const moveProps = MOVE_PROPERTIES[moveType];

    // Move name
    this.label = this.scene.add.text(width / 2, height / 2 + 5, moveType.toUpperCase(), {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.add(this.label);

    // Damage/effect text
    const damageStr = moveType === "block" ? "GUARD" : `${moveProps.damage} DMG`;
    this.damageText = this.scene.add.text(width / 2, height - 12, damageStr, {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#888888",
    }).setOrigin(0.5);
    this.add(this.damageText);
  }

  /**
   * Setup interactivity.
   */
  private setupInteractivity(): void {
    const { width, height } = this.config;

    const hitArea = new Phaser.Geom.Rectangle(0, 0, width, height);
    this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    this.on("pointerover", this.onPointerOver, this);
    this.on("pointerout", this.onPointerOut, this);
    this.on("pointerdown", this.onPointerDown, this);
  }

  private onPointerOver(): void {
    if (this.isDisabled) return;

    this.isHovered = true;
    if (!this.isSelected) {
      this.drawBackground("hover");
    }

    // Scale up slightly
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100,
      ease: "Power2",
    });
  }

  private onPointerOut(): void {
    if (this.isDisabled) return;

    this.isHovered = false;
    if (!this.isSelected) {
      this.drawBackground("normal");
    }

    // Scale back
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: "Power2",
    });
  }

  private onPointerDown(): void {
    if (this.isDisabled) return;

    // Click animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 50,
      yoyo: true,
      ease: "Power2",
    });

    // Call onClick callback
    if (this.config.onClick) {
      this.config.onClick(this.config.moveType);
    }
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Set selected state.
   */
  public setSelected(selected: boolean): void {
    this.isSelected = selected;

    if (selected) {
      this.drawBackground("selected");
    } else if (this.isHovered) {
      this.drawBackground("hover");
    } else {
      this.drawBackground("normal");
    }
  }

  /**
   * Set disabled state.
   */
  public setDisabled(disabled: boolean): void {
    this.isDisabled = disabled;

    if (disabled) {
      this.drawBackground("disabled");
      this.disableInteractive();
      this.setAlpha(0.5);
    } else {
      this.drawBackground(this.isSelected ? "selected" : "normal");
      this.setInteractive();
      this.setAlpha(1);
    }
  }

  /**
   * Get the move type.
   */
  public getMoveType(): MoveType {
    return this.config.moveType;
  }

  /**
   * Check if selected.
   */
  public getSelected(): boolean {
    return this.isSelected;
  }

  /**
   * Check if disabled.
   */
  public getDisabled(): boolean {
    return this.isDisabled;
  }

  /**
   * Reset button state.
   */
  public reset(): void {
    this.isSelected = false;
    this.isDisabled = false;
    this.isHovered = false;
    this.drawBackground("normal");
    this.setInteractive();
    this.setAlpha(1);
    this.setScale(1);
  }
}

export default MoveButton;
