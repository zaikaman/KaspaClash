/**
 * CharacterCard - Character portrait card for selection screen
 * Displays character portrait, name, theme, and selection state
 */

import Phaser from "phaser";
import { getCharacterColor } from "@/data/characters";
import type { Character } from "@/types";

/**
 * Character card configuration.
 */
export interface CharacterCardConfig {
  character: Character;
  x: number;
  y: number;
  width?: number;
  height?: number;
  isSelected?: boolean;
  isLocked?: boolean;
  isDisabled?: boolean;
  onSelect?: (character: Character) => void;
}

/**
 * Card visual states.
 */
type CardState = "default" | "hover" | "selected" | "locked" | "disabled";

/**
 * Animation configuration for smooth transitions.
 */
const ANIMATION_CONFIG = {
  HOVER_SCALE: 1.03,
  SELECTED_SCALE: 1.06,
  DEFAULT_SCALE: 1,
  HOVER_DURATION: 120,
  SELECT_DURATION: 180,
  DESELECT_DURATION: 150,
  EASE_IN: "Sine.easeOut",
  EASE_OUT: "Sine.easeIn",
  EASE_BOUNCE: "Back.easeOut",
};

/**
 * CharacterCard - Selectable character portrait.
 */
export class CharacterCard extends Phaser.GameObjects.Container {
  // Configuration
  private character: Character;
  private cardWidth: number;
  private cardHeight: number;
  private onSelect?: (character: Character) => void;

  // State
  private cardState: CardState = "default";
  private isInteractive: boolean = true;
  private isAnimating: boolean = false;

  // Visual elements
  private background!: Phaser.GameObjects.Graphics;
  private border!: Phaser.GameObjects.Graphics;
  private portrait!: Phaser.GameObjects.Image;
  private nameText!: Phaser.GameObjects.Text;
  private themeText!: Phaser.GameObjects.Text;
  private lockIcon?: Phaser.GameObjects.Image;
  private glowEffect!: Phaser.GameObjects.Graphics;

  // Colors
  private colors: { primary: number; secondary: number; glow: number };

  // Tween references for cleanup
  private currentTween?: Phaser.Tweens.Tween;
  private glowTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, config: CharacterCardConfig) {
    super(scene, config.x, config.y);

    this.character = config.character;
    this.cardWidth = config.width ?? 200;
    this.cardHeight = config.height ?? 280;
    this.onSelect = config.onSelect;
    this.colors = getCharacterColor(config.character.id);

    // Determine initial state
    if (config.isDisabled) {
      this.cardState = "disabled";
      this.isInteractive = false;
    } else if (config.isLocked) {
      this.cardState = "locked";
      this.isInteractive = false;
    } else if (config.isSelected) {
      this.cardState = "selected";
    }

    this.createCardElements();
    this.setupInteraction();
    this.updateVisuals();

    scene.add.existing(this);
  }

  /**
   * Create card visual elements.
   */
  private createCardElements(): void {
    // Glow effect (behind everything)
    this.glowEffect = this.scene.add.graphics();
    this.add(this.glowEffect);

    // Background
    this.background = this.scene.add.graphics();
    this.add(this.background);

    // Border
    this.border = this.scene.add.graphics();
    this.add(this.border);

    // Portrait placeholder (we'll use a colored rectangle if image not loaded)
    const charId = this.character.id;
    let portraitKey = `portrait-${charId}`;

    // Check specifically for fallback keys if main one doesn't exist
    if (!this.scene.textures.exists(portraitKey)) {
      if (this.scene.textures.exists(`portrait-${charId}-png`)) {
        portraitKey = `portrait-${charId}-png`;
      } else if (this.scene.textures.exists(`portrait-${charId}-fallback`)) {
        portraitKey = `portrait-${charId}-fallback`;
      }
    }

    if (this.scene.textures.exists(portraitKey)) {
      this.portrait = this.scene.add.image(
        this.cardWidth / 2,
        100,
        portraitKey
      );

      // Auto-fit logic: Scale to fit within 160x160 while maintaining aspect ratio
      const startScale = 160 / Math.max(this.portrait.width, this.portrait.height);
      this.portrait.setScale(startScale);

      // Add portrait to container so it renders relative to card position
      this.add(this.portrait);
    } else {
      // Placeholder
      const placeholder = this.scene.add.graphics();
      placeholder.fillStyle(this.colors.secondary, 1);
      placeholder.fillRoundedRect(20, 20, 160, 160, 8);
      placeholder.lineStyle(2, this.colors.primary);
      placeholder.strokeRoundedRect(20, 20, 160, 160, 8);
      this.add(placeholder);

      // Character initial
      const initial = this.scene.add.text(
        this.cardWidth / 2,
        100,
        this.character.name.charAt(0).toUpperCase(),
        {
          fontFamily: "Orbitron, sans-serif",
          fontSize: "64px",
          color: "#ffffff",
        }
      );
      initial.setOrigin(0.5);
      this.add(initial);
    }

    // Character name
    this.nameText = this.scene.add.text(
      this.cardWidth / 2,
      200,
      this.character.name.toUpperCase(),
      {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    );
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    // Theme description (truncated)
    const themePreview = this.character.theme.slice(0, 50) + "...";
    this.themeText = this.scene.add.text(
      this.cardWidth / 2,
      230,
      themePreview,
      {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#888888",
        wordWrap: { width: this.cardWidth - 20 },
        align: "center",
      }
    );
    this.themeText.setOrigin(0.5, 0);
    this.add(this.themeText);
  }

  /**
   * Set up interactive behavior.
   */
  private setupInteraction(): void {
    // Create hit area with offset to align with scaled/centered canvas rendering
    // The offset compensates for coordinate transformation with Phaser's Scale.FIT mode
    const hitArea = new Phaser.Geom.Rectangle(
      this.cardWidth * 0.5,   // Offset right by half card width
      this.cardHeight * 0.45, // Offset down by 45% of card height
      this.cardWidth,
      this.cardHeight
    );

    this.setSize(this.cardWidth, this.cardHeight);
    this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Event handlers
    this.on("pointerover", this.handlePointerOver, this);
    this.on("pointerout", this.handlePointerOut, this);
    this.on("pointerdown", this.handlePointerDown, this);
  }

  /**
   * Handle pointer over.
   */
  private handlePointerOver(): void {
    if (!this.isInteractive || this.isAnimating) return;
    if (this.cardState === "default") {
      this.cardState = "hover";
      this.animateToState();
    }
  }

  /**
   * Handle pointer out.
   */
  private handlePointerOut(): void {
    if (!this.isInteractive) return;
    if (this.cardState === "hover") {
      this.cardState = "default";
      this.animateToState();
    }
  }

  /**
   * Handle pointer down (selection).
   */
  private handlePointerDown(): void {
    if (!this.isInteractive || this.isAnimating) return;
    this.onSelect?.(this.character);
  }

  /**
   * Animate to current state with smooth transitions.
   */
  private animateToState(): void {
    // Stop any existing animation
    this.currentTween?.stop();

    let targetScale = ANIMATION_CONFIG.DEFAULT_SCALE;
    let duration = ANIMATION_CONFIG.DESELECT_DURATION;
    let ease = ANIMATION_CONFIG.EASE_OUT;

    switch (this.cardState) {
      case "hover":
        targetScale = ANIMATION_CONFIG.HOVER_SCALE;
        duration = ANIMATION_CONFIG.HOVER_DURATION;
        ease = ANIMATION_CONFIG.EASE_IN;
        break;
      case "selected":
      case "locked":
        targetScale = ANIMATION_CONFIG.SELECTED_SCALE;
        duration = ANIMATION_CONFIG.SELECT_DURATION;
        ease = ANIMATION_CONFIG.EASE_BOUNCE;
        break;
      case "default":
      case "disabled":
      default:
        targetScale = ANIMATION_CONFIG.DEFAULT_SCALE;
        duration = ANIMATION_CONFIG.DESELECT_DURATION;
        ease = ANIMATION_CONFIG.EASE_OUT;
        break;
    }

    this.currentTween = this.scene.tweens.add({
      targets: this,
      scaleX: targetScale,
      scaleY: targetScale,
      duration,
      ease,
      onStart: () => {
        this.isAnimating = true;
      },
      onComplete: () => {
        this.isAnimating = false;
      },
    });

    // Update graphics immediately (they don't need tweening)
    this.updateVisuals();
  }

  /**
   * Update visuals based on current state.
   */
  private updateVisuals(): void {
    this.background.clear();
    this.border.clear();
    this.glowEffect.clear();

    // Remove lock icon if exists
    this.lockIcon?.destroy();
    this.lockIcon = undefined;

    const borderRadius = 12;

    switch (this.cardState) {
      case "default":
        this.drawDefaultState(borderRadius);
        break;
      case "hover":
        this.drawHoverState(borderRadius);
        break;
      case "selected":
        this.drawSelectedState(borderRadius);
        break;
      case "locked":
        this.drawLockedState(borderRadius);
        break;
      case "disabled":
        this.drawDisabledState(borderRadius);
        break;
    }
  }

  /**
   * Draw default state.
   */
  private drawDefaultState(radius: number): void {
    // Background
    this.background.fillStyle(0x1a1a2e, 0.9);
    this.background.fillRoundedRect(0, 0, this.cardWidth, this.cardHeight, radius);

    // Border
    this.border.lineStyle(2, 0x333333);
    this.border.strokeRoundedRect(0, 0, this.cardWidth, this.cardHeight, radius);
  }

  /**
   * Draw hover state.
   */
  private drawHoverState(radius: number): void {
    // Glow effect
    this.glowEffect.fillStyle(this.colors.glow, 0.25);
    this.glowEffect.fillRoundedRect(-6, -6, this.cardWidth + 12, this.cardHeight + 12, radius + 6);

    // Background
    this.background.fillStyle(0x1a1a2e, 0.95);
    this.background.fillRoundedRect(0, 0, this.cardWidth, this.cardHeight, radius);

    // Border (slightly thicker for emphasis)
    this.border.lineStyle(3, this.colors.primary);
    this.border.strokeRoundedRect(0, 0, this.cardWidth, this.cardHeight, radius);

    // Scale is handled by animateToState()
  }

  /**
   * Draw selected state.
   */
  private drawSelectedState(radius: number): void {
    // Strong glow
    this.glowEffect.fillStyle(this.colors.glow, 0.45);
    this.glowEffect.fillRoundedRect(-10, -10, this.cardWidth + 20, this.cardHeight + 20, radius + 10);

    // Background with tint
    this.background.fillStyle(this.colors.secondary, 0.35);
    this.background.fillRoundedRect(0, 0, this.cardWidth, this.cardHeight, radius);

    // Bold border
    this.border.lineStyle(4, this.colors.primary);
    this.border.strokeRoundedRect(0, 0, this.cardWidth, this.cardHeight, radius);

    // Scale is handled by animateToState()
  }

  /**
   * Draw locked state.
   */
  private drawLockedState(radius: number): void {
    // Same as selected but add lock icon
    this.drawSelectedState(radius);

    // Add lock icon image
    this.lockIcon = this.scene.add.image(
      this.cardWidth / 2,
      130, // Positioned slightly differently for visual balance
      "lock-icon"
    );

    // Scale the lock icon appropriately (e.g., 64x64 or 80x80)
    const lockSize = 80;
    this.lockIcon.setDisplaySize(lockSize, lockSize);

    this.add(this.lockIcon);
  }

  /**
   * Draw disabled state.
   */
  private drawDisabledState(radius: number): void {
    // Dark background
    this.background.fillStyle(0x0a0a0a, 0.9);
    this.background.fillRoundedRect(0, 0, this.cardWidth, this.cardHeight, radius);

    // Dim border
    this.border.lineStyle(2, 0x222222);
    this.border.strokeRoundedRect(0, 0, this.cardWidth, this.cardHeight, radius);

    // Dim alpha
    this.setAlpha(0.5);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Select this card.
   */
  select(): void {
    if (this.cardState === "disabled" || this.cardState === "locked") return;
    this.cardState = "selected";
    this.animateToState();
  }

  /**
   * Deselect this card.
   */
  deselect(): void {
    if (this.cardState === "locked" || this.cardState === "disabled") return;
    this.cardState = "default";
    this.animateToState();
  }

  /**
   * Lock this card (confirmed selection).
   */
  lock(): void {
    this.cardState = "locked";
    this.isInteractive = false;
    this.animateToState();
  }

  /**
   * Disable this card.
   */
  disable(): void {
    this.cardState = "disabled";
    this.isInteractive = false;
    this.animateToState();
  }

  /**
   * Get the character this card represents.
   */
  getCharacter(): Character {
    return this.character;
  }

  /**
   * Check if this card is selected.
   */
  isSelected(): boolean {
    return this.cardState === "selected";
  }

  /**
   * Check if this card is locked.
   */
  isLocked(): boolean {
    return this.cardState === "locked";
  }
}
