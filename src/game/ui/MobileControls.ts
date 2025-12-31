/**
 * Mobile Controls - Touch-friendly move buttons for mobile devices
 * Larger hit areas and optimized layout for touch interaction
 */

import Phaser from "phaser";
import type { MoveType } from "@/types";
import { MOVE_PROPERTIES } from "@/types/constants";
import { isTouchDevice, getOrientation } from "../input/TouchInput";

/**
 * Mobile controls configuration.
 */
export interface MobileControlsConfig {
  /** Scene to add controls to */
  scene: Phaser.Scene;
  /** Callback when a move is selected */
  onMoveSelect: (move: MoveType) => void;
  /** X position (center) */
  x?: number;
  /** Y position (center) */
  y?: number;
}

/**
 * Button layout configuration.
 */
interface ButtonLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  move: MoveType;
}

/**
 * Button colors for each move type.
 */
const BUTTON_COLORS: Record<MoveType, { fill: number; stroke: number }> = {
  punch: { fill: 0xff6b6b, stroke: 0xee5a5a },
  kick: { fill: 0x4ecdc4, stroke: 0x3dbdb5 },
  block: { fill: 0x45b7d1, stroke: 0x35a7c1 },
  special: { fill: 0xf7dc6f, stroke: 0xe7cc5f },
};

/**
 * Move icons (emoji for now, could be replaced with sprites).
 */
const MOVE_ICONS: Record<MoveType, string> = {
  punch: "👊",
  kick: "🦶",
  block: "🛡️",
  special: "⚡",
};

/**
 * MobileControls - Touch-optimized move selection.
 */
export class MobileControls extends Phaser.GameObjects.Container {
  private config: MobileControlsConfig;
  private buttons: Map<MoveType, Phaser.GameObjects.Container> = new Map();
  private selectedMove: MoveType | null = null;
  private isDisabled: boolean = false;

  constructor(config: MobileControlsConfig) {
    super(config.scene, config.x ?? 0, config.y ?? 0);

    this.config = config;
    this.create();
    
    config.scene.add.existing(this);
  }

  /**
   * Create the control buttons.
   */
  private create(): void {
    const layout = this.calculateLayout();
    
    for (const buttonConfig of layout) {
      this.createButton(buttonConfig);
    }
  }

  /**
   * Calculate button layout based on screen size and orientation.
   */
  private calculateLayout(): ButtonLayout[] {
    const scene = this.config.scene;
    const width = scene.scale.width;
    const height = scene.scale.height;
    const orientation = getOrientation();
    const isMobile = isTouchDevice();

    // Button size - larger on mobile
    const buttonSize = isMobile ? 100 : 80;
    const padding = 15;

    if (orientation === "portrait") {
      // Portrait: 2x2 grid at bottom
      const startX = width / 2 - buttonSize - padding / 2;
      const startY = height - buttonSize * 2 - padding * 3;

      return [
        { x: startX, y: startY, width: buttonSize, height: buttonSize, move: "punch" },
        { x: startX + buttonSize + padding, y: startY, width: buttonSize, height: buttonSize, move: "kick" },
        { x: startX, y: startY + buttonSize + padding, width: buttonSize, height: buttonSize, move: "block" },
        { x: startX + buttonSize + padding, y: startY + buttonSize + padding, width: buttonSize, height: buttonSize, move: "special" },
      ];
    } else {
      // Landscape: horizontal row at bottom
      const totalWidth = buttonSize * 4 + padding * 3;
      const startX = width / 2 - totalWidth / 2;
      const startY = height - buttonSize - padding * 2;

      return [
        { x: startX, y: startY, width: buttonSize, height: buttonSize, move: "punch" },
        { x: startX + buttonSize + padding, y: startY, width: buttonSize, height: buttonSize, move: "kick" },
        { x: startX + (buttonSize + padding) * 2, y: startY, width: buttonSize, height: buttonSize, move: "block" },
        { x: startX + (buttonSize + padding) * 3, y: startY, width: buttonSize, height: buttonSize, move: "special" },
      ];
    }
  }

  /**
   * Create a single button.
   */
  private createButton(layout: ButtonLayout): void {
    const { x, y, width, height, move } = layout;
    const colors = BUTTON_COLORS[move];
    const moveProps = MOVE_PROPERTIES[move];

    const container = this.config.scene.add.container(x + width / 2, y + height / 2);

    // Background
    const bg = this.config.scene.add.graphics();
    bg.fillStyle(colors.fill, 0.3);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(3, colors.stroke, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
    container.add(bg);

    // Icon
    const icon = this.config.scene.add.text(0, -10, MOVE_ICONS[move], {
      fontSize: "32px",
    }).setOrigin(0.5);
    container.add(icon);

    // Label
    const label = this.config.scene.add.text(0, 25, move.toUpperCase(), {
      fontSize: "12px",
      fontFamily: "Orbitron, sans-serif",
      color: "#ffffff",
    }).setOrigin(0.5);
    container.add(label);

    // Damage text
    const damageText = this.config.scene.add.text(0, 40, `${moveProps.damage} DMG`, {
      fontSize: "10px",
      fontFamily: "monospace",
      color: "#888888",
    }).setOrigin(0.5);
    container.add(damageText);

    // Hit area for touch
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Touch handlers
    container.on("pointerdown", () => this.onButtonDown(move, container, bg, width, height, colors));
    container.on("pointerup", () => this.onButtonUp(move, container, bg, width, height, colors));
    container.on("pointerout", () => this.onButtonOut(move, container, bg, width, height, colors));

    this.add(container);
    this.buttons.set(move, container);
  }

  /**
   * Handle button press.
   */
  private onButtonDown(
    move: MoveType,
    container: Phaser.GameObjects.Container,
    bg: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    colors: { fill: number; stroke: number }
  ): void {
    if (this.isDisabled) return;

    // Visual feedback - pressed state
    bg.clear();
    bg.fillStyle(colors.fill, 0.6);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(4, colors.stroke, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

    // Scale down slightly
    container.setScale(0.95);
  }

  /**
   * Handle button release.
   */
  private onButtonUp(
    move: MoveType,
    container: Phaser.GameObjects.Container,
    bg: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    colors: { fill: number; stroke: number }
  ): void {
    if (this.isDisabled) return;

    // Reset visual state
    this.resetButtonVisual(bg, width, height, colors);
    container.setScale(1);

    // Select the move
    this.selectMove(move);
  }

  /**
   * Handle pointer out (cancel press).
   */
  private onButtonOut(
    move: MoveType,
    container: Phaser.GameObjects.Container,
    bg: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    colors: { fill: number; stroke: number }
  ): void {
    this.resetButtonVisual(bg, width, height, colors);
    container.setScale(1);
  }

  /**
   * Reset button to normal visual state.
   */
  private resetButtonVisual(
    bg: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    colors: { fill: number; stroke: number }
  ): void {
    bg.clear();
    bg.fillStyle(colors.fill, 0.3);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(3, colors.stroke, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
  }

  /**
   * Select a move.
   */
  private selectMove(move: MoveType): void {
    if (this.isDisabled || this.selectedMove === move) return;

    this.selectedMove = move;
    this.config.onMoveSelect(move);

    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  /**
   * Enable controls.
   */
  enable(): void {
    this.isDisabled = false;
    this.setAlpha(1);
  }

  /**
   * Disable controls.
   */
  disable(): void {
    this.isDisabled = true;
    this.setAlpha(0.5);
  }

  /**
   * Reset selection.
   */
  reset(): void {
    this.selectedMove = null;
  }

  /**
   * Get the currently selected move.
   */
  getSelectedMove(): MoveType | null {
    return this.selectedMove;
  }

  /**
   * Update layout on resize.
   */
  updateLayout(): void {
    // Remove existing buttons
    this.buttons.forEach((button) => button.destroy());
    this.buttons.clear();

    // Recreate with new layout
    this.create();
  }

  /**
   * Clean up.
   */
  destroy(): void {
    this.buttons.forEach((button) => button.destroy());
    this.buttons.clear();
    super.destroy();
  }
}

/**
 * Create mobile controls for a scene.
 */
export function createMobileControls(
  scene: Phaser.Scene,
  onMoveSelect: (move: MoveType) => void
): MobileControls | null {
  // Only create on touch devices
  if (!isTouchDevice()) {
    return null;
  }

  return new MobileControls({
    scene,
    onMoveSelect,
  });
}
