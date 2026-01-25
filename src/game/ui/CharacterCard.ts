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
  onInfo?: (character: Character) => void;
  onHover?: (character: Character) => void;
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
  private onInfo?: (character: Character) => void;
  private onHover?: (character: Character) => void;

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
  private checkmarkGraphics?: Phaser.GameObjects.Graphics;
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
    this.onInfo = config.onInfo;
    this.onHover = config.onHover;
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
        this.cardHeight * 0.4, // Responsive Y position (40% down)
        portraitKey
      );

      // Auto-fit logic: Scale to fit within available space (leaving room for text)
      // Target about 60-70% of card width/height
      const targetSize = Math.min(this.cardWidth * 0.8, this.cardHeight * 0.6);
      const startScale = targetSize / Math.max(this.portrait.width, this.portrait.height);
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
    // Scale font size based on card width
    const nameFontSize = Math.max(12, Math.floor(this.cardWidth / 12));
    this.nameText = this.scene.add.text(
      this.cardWidth / 2,
      this.cardHeight * 0.75, // Position near bottom
      this.character.name.toUpperCase(),
      {
        fontFamily: "Orbitron, sans-serif",
        fontSize: `${nameFontSize}px`,
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: this.cardWidth - 10 }
      }
    );
    this.nameText.setOrigin(0.5, 0); // Top-center origin relative to Y position
    this.add(this.nameText);

    // Theme description (only if card height allows)
    if (this.cardHeight > 180) {
      const themePreview = this.character.theme.slice(0, 50) + "...";
      this.themeText = this.scene.add.text(
        this.cardWidth / 2,
        this.cardHeight * 0.85,
        themePreview,
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "10px",
          color: "#888888",
          wordWrap: { width: this.cardWidth - 20 },
          align: "center",
        }
      );
      this.themeText.setOrigin(0.5); // Center origin for theme text
      this.add(this.themeText);
    } else {
      // Init placeholder for type safety even if not shown
      this.themeText = this.scene.add.text(0, 0, "");
      this.themeText.setVisible(false);
      this.add(this.themeText);
    }

    // Info Icon
    this.createInfoIcon();
  }

  private createInfoIcon(): void {
    if (!this.onInfo) return;

    // Info Icon Container
    const iconContainer = this.scene.add.container(this.cardWidth - 20, 20);
    const circle = this.scene.add.graphics();
    circle.fillStyle(0x000000, 0.6);
    circle.fillCircle(0, 0, 12);
    circle.lineStyle(1, 0xffffff);
    circle.strokeCircle(0, 0, 12);

    const text = this.scene.add.text(0, 0, "i", {
      fontSize: "14px",
      fontFamily: "monospace",
      fontStyle: "bold",
      color: "#ffffff"
    }).setOrigin(0.5);

    iconContainer.add([circle, text]);

    // Interactive
    // Important: Use a larger hit area for ease of clicking
    const hitArea = new Phaser.Geom.Circle(0, 0, 15);
    iconContainer.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

    iconContainer.on("pointerover", () => {
      circle.fillStyle(this.colors.primary, 1);
      this.scene.game.canvas.style.cursor = 'pointer';
    });

    iconContainer.on("pointerout", () => {
      circle.fillStyle(0x000000, 0.6);
      this.scene.game.canvas.style.cursor = 'default';
    });

    iconContainer.on("pointerdown", (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
      // Stop propagation so it doesn't trigger card selection
      event.stopPropagation();
      this.onInfo?.(this.character);
    });

    this.add(iconContainer);
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

      // Notify listener
      this.onHover?.(this.character);
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

    // Remove checkmark if exists
    this.checkmarkGraphics?.destroy();
    this.checkmarkGraphics = undefined;

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
   * Draw locked state (confirmed selection).
   */
  private drawLockedState(radius: number): void {
    // Keep selected state background/border
    this.drawSelectedState(radius);

    // Draw green tick (checkmark)
    this.checkmarkGraphics = this.scene.add.graphics();
    this.add(this.checkmarkGraphics);

    // Circle background for tick
    const centerX = this.cardWidth / 2;
    const centerY = this.cardHeight / 2;
    // Scale tick based on card size
    const circleRadius = Math.min(this.cardWidth, this.cardHeight) * 0.15;

    this.checkmarkGraphics.fillStyle(0x22c55e, 1); // Green
    this.checkmarkGraphics.fillCircle(centerX, centerY, circleRadius);

    // Checkmark
    this.checkmarkGraphics.lineStyle(3, 0xffffff, 1);
    this.checkmarkGraphics.beginPath();
    // Simple checkmark shape
    this.checkmarkGraphics.moveTo(centerX - 10, centerY);
    this.checkmarkGraphics.lineTo(centerX - 2, centerY + 8);
    this.checkmarkGraphics.lineTo(centerX + 12, centerY - 8);
    this.checkmarkGraphics.strokePath();

    // Store reference for cleanup (though we clear everything in updateVisuals)
    // We can assign it to a property if needed, but since we clear() everything in updateVisuals, 
    // simply adding it to the container is enough. 
    // However, to be cleaner with types, we can repurpose lockIcon or add a new property if we needed strict type safety.
    // Given the current structure, adding to container works because updateVisuals() calls this.lockIcon?.destroy()
    // but doesn't explicitly destroy graphics other than clearing the main ones.
    // Actually, updateVisuals only clears specific graphics instances.
    // To ensure this tick graphic is cleared, we should assign it to a class property 
    // or create it inside createCardElements and toggle visibility.
    // 
    // Better approach: Let's use a class property for the status icon graphics.
    // Since we don't have that yet, let's just create it here but ensure we track it.
    // For now, let's reuse lockIcon property but as a Graphics object? No, TypeScript would complain.
    // 
    // Let's modify the class to have a checkmarkGraphics property.
    // Wait, I can't modify the class definition easily with replace_file_content if I'm only targeting this method.
    // 
    // Alternative: Create the graphics in createCardElements and just toggle visibility here.
    // But createCardElements is far away.
    //
    // Let's just create it and assign to a new property `this.statusIcon` if I could add it.
    // 
    // Simplest fix without changing class structure too much:
    // Cast it to any or reuse lockIcon (if type allows, likely Image).
    // lockIcon is Phaser.GameObjects.Image.
    // 
    // Let's create `this.tickGraphics` in `createCardElements` if possible, or just add it here and destroy it in `updateVisuals`.
    // I need to look at updateVisuals again.
    // It calls `this.lockIcon?.destroy()`.
    //
    // I will use `this.lockIcon` as a container for the checkmark if I can create an Texture for it on the fly?
    // Or simpler: I will assume I can modify the class property type if I need to, but I'd rather not.
    // 
    // Let's try to draw the checkmark using a texture generated on the fly?
    // 
    // Actually, `updateVisuals` clears `this.background`, `this.border`, `this.glowEffect`.
    // It effectively redraws everything.
    // But it doesn't destroy random children added to the container.
    // So if I add `tickGraphics` here, it will persist and duplicate if `drawLockedState` is called multiple times?
    // No, `updateVisuals` calls clear() on standard graphics, but `drawLockedState` is called BY `updateVisuals`.
    // So every time `updateVisuals` runs, if stats is locked, it runs this.
    // If I switch away from locked, these graphics remain unless destroyed!
    // 
    // I MUST track this graphic object to destroy it.
    // 
    // I'll check if I can modify `lockIcon` definition to be `Phaser.GameObjects.Image | Phaser.GameObjects.Graphics`.
    // 
    // Or I can just remove `this.lockIcon` usage entirely and manage a `statusOverlay` container or graphics.
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
   * Enable this card.
   */
  enable(): void {
    // Only enable if previously disabled
    if (this.cardState !== "disabled") return;

    this.cardState = "default";
    this.isInteractive = true;
    this.setAlpha(1);
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
