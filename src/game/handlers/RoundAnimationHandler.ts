/**
 * Round Animation Handler
 * Manages combat animations and visual effects during round resolution
 */

import Phaser from "phaser";
import type { MoveType, RoundWinner } from "@/types";
import type { RoundResolutionResult } from "@/lib/game/round-resolver";
import { EventBus } from "@/game/EventBus";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Animation configuration.
 */
export interface AnimationConfig {
  scene: Phaser.Scene;
  player1Sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;
  player2Sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;
  player1HealthBar?: Phaser.GameObjects.Container;
  player2HealthBar?: Phaser.GameObjects.Container;
}

/**
 * Animation step in the sequence.
 */
interface AnimationStep {
  name: string;
  duration: number;
  execute: () => void | Promise<void>;
}

// =============================================================================
// ANIMATION TIMING
// =============================================================================

const TIMING = {
  MOVE_REVEAL_DELAY: 500,
  // Increased to allow full 36-frame animations (36 frames / 24fps = 1.5s) plus movement
  MOVE_ANIMATION_DURATION: 1800,
  HIT_PAUSE: 300,
  DAMAGE_NUMBER_DURATION: 800,
  HEALTH_BAR_ANIMATION: 600,
  RESULT_DISPLAY: 1500,
  ROUND_END_PAUSE: 800,
};

// =============================================================================
// ROUND ANIMATION HANDLER CLASS
// =============================================================================

export class RoundAnimationHandler {
  private scene: Phaser.Scene;
  private player1Sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;
  private player2Sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;
  private player1HealthBar?: Phaser.GameObjects.Container;
  private player2HealthBar?: Phaser.GameObjects.Container;
  private isAnimating: boolean = false;
  private damageNumbers: Phaser.GameObjects.Text[] = [];

  constructor(config: AnimationConfig) {
    this.scene = config.scene;
    this.player1Sprite = config.player1Sprite;
    this.player2Sprite = config.player2Sprite;
    this.player1HealthBar = config.player1HealthBar;
    this.player2HealthBar = config.player2HealthBar;
  }

  /**
   * Check if currently animating.
   */
  getIsAnimating(): boolean {
    return this.isAnimating;
  }

  /**
   * Play complete round resolution animation sequence.
   */
  async playRoundResolution(result: RoundResolutionResult): Promise<void> {
    if (this.isAnimating) {
      console.warn("Animation already in progress");
      return;
    }

    this.isAnimating = true;

    try {
      // Build animation sequence
      const steps = this.buildAnimationSequence(result);

      // Execute each step
      for (const step of steps) {
        await this.executeStep(step);
      }

      // Emit completion event
      EventBus.emit("animation:roundComplete", { result });
    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Build the animation sequence for a round.
   */
  private buildAnimationSequence(result: RoundResolutionResult): AnimationStep[] {
    const steps: AnimationStep[] = [];

    // Step 1: Reveal moves
    steps.push({
      name: "reveal_moves",
      duration: TIMING.MOVE_REVEAL_DELAY,
      execute: () => this.showMoveReveal(result.player1.move, result.player2.move),
    });

    // Step 2: Play attack animations
    steps.push({
      name: "attack_animations",
      duration: TIMING.MOVE_ANIMATION_DURATION,
      execute: () => this.playAttackAnimations(result.player1.move, result.player2.move),
    });

    // Step 3: Hit pause and effects
    if (result.player1.damageDealt > 0 || result.player2.damageDealt > 0) {
      steps.push({
        name: "hit_effects",
        duration: TIMING.HIT_PAUSE,
        execute: () => this.playHitEffects(result),
      });
    }

    // Step 4: Show damage numbers
    steps.push({
      name: "damage_numbers",
      duration: TIMING.DAMAGE_NUMBER_DURATION,
      execute: () => this.showDamageNumbers(result),
    });

    // Step 5: Update health bars
    steps.push({
      name: "health_update",
      duration: TIMING.HEALTH_BAR_ANIMATION,
      execute: () => this.updateHealthBars(result),
    });

    // Step 6: Show round result
    steps.push({
      name: "round_result",
      duration: TIMING.RESULT_DISPLAY,
      execute: () => this.showRoundResult(result.winner, result.isKnockout),
    });

    // Step 7: End pause before next round
    steps.push({
      name: "round_end_pause",
      duration: TIMING.ROUND_END_PAUSE,
      execute: () => this.resetToIdle(),
    });

    return steps;
  }

  /**
   * Execute a single animation step.
   */
  private executeStep(step: AnimationStep): Promise<void> {
    return new Promise((resolve) => {
      step.execute();
      this.scene.time.delayedCall(step.duration, resolve);
    });
  }

  // ===========================================================================
  // ANIMATION IMPLEMENTATIONS
  // ===========================================================================

  /**
   * Show move reveal with text indicators.
   */
  private showMoveReveal(player1Move: MoveType, player2Move: MoveType): void {
    // Player 1 move reveal
    this.showMoveText(
      this.player1Sprite.x,
      this.player1Sprite.y - 100,
      player1Move.toUpperCase(),
      this.getMoveColor(player1Move)
    );

    // Player 2 move reveal
    this.showMoveText(
      this.player2Sprite.x,
      this.player2Sprite.y - 100,
      player2Move.toUpperCase(),
      this.getMoveColor(player2Move)
    );

    // Emit event
    EventBus.emit("animation:movesRevealed", { player1Move, player2Move });
  }

  /**
   * Play attack animations for both players.
   */
  private playAttackAnimations(player1Move: MoveType, player2Move: MoveType): void {
    // Trigger move animations on sprites
    // These would call animation methods on FighterSprite
    this.triggerMoveAnimation(this.player1Sprite, player1Move, "player1");
    this.triggerMoveAnimation(this.player2Sprite, player2Move, "player2");
  }

  /**
   * Play hit effects when damage is dealt.
   */
  private playHitEffects(result: RoundResolutionResult): void {
    // Player 1 takes hit
    if (result.player1.damageTaken > 0) {
      this.playHitEffect(this.player1Sprite);
    }

    // Player 2 takes hit
    if (result.player2.damageTaken > 0) {
      this.playHitEffect(this.player2Sprite);
    }
  }

  /**
   * Show floating damage numbers.
   */
  private showDamageNumbers(result: RoundResolutionResult): void {
    // Clear any existing damage numbers
    this.clearDamageNumbers();

    // Player 1 damage dealt
    if (result.player1.damageDealt > 0) {
      this.showDamageNumber(
        this.player2Sprite.x,
        this.player2Sprite.y - 50,
        result.player1.damageDealt,
        0xef4444 // Red for damage
      );
    }

    // Player 2 damage dealt
    if (result.player2.damageDealt > 0) {
      this.showDamageNumber(
        this.player1Sprite.x,
        this.player1Sprite.y - 50,
        result.player2.damageDealt,
        0xef4444 // Red for damage
      );
    }

    // Show "BLOCKED!" text if move was blocked
    if (result.player1.move === "block" && result.player1.damageTaken === 0) {
      this.showDamageNumber(
        this.player1Sprite.x,
        this.player1Sprite.y - 50,
        0,
        0x49eacb,
        "BLOCKED!"
      );
    }

    if (result.player2.move === "block" && result.player2.damageTaken === 0) {
      this.showDamageNumber(
        this.player2Sprite.x,
        this.player2Sprite.y - 50,
        0,
        0x49eacb,
        "BLOCKED!"
      );
    }
  }

  /**
   * Update health bars with animation.
   */
  private updateHealthBars(result: RoundResolutionResult): void {
    // Emit events for health bar updates (handled by UI components)
    EventBus.emit("animation:healthUpdate", {
      player1Health: result.player1HealthAfter,
      player2Health: result.player2HealthAfter,
    });
  }

  /**
   * Show round result announcement.
   */
  private showRoundResult(winner: RoundWinner, isKnockout: boolean): void {
    let text: string;
    let color: number;

    if (isKnockout) {
      if (winner === "draw") {
        text = "DOUBLE K.O.!";
        color = 0xfbbf24;
      } else {
        text = "K.O.!";
        color = 0xef4444;
      }
    } else {
      switch (winner) {
        case "player1":
          text = "PLAYER 1 WINS ROUND!";
          color = 0x49eacb;
          break;
        case "player2":
          text = "PLAYER 2 WINS ROUND!";
          color = 0x49eacb;
          break;
        case "draw":
          text = "DRAW!";
          color = 0xfbbf24;
          break;
      }
    }

    this.showCenterAnnouncement(text, color);
  }

  /**
   * Reset sprites to idle state.
   */
  private resetToIdle(): void {
    // Clear any remaining effects
    this.clearDamageNumbers();

    // Emit event for components to reset
    EventBus.emit("animation:roundReset");
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Get color for a move type.
   */
  private getMoveColor(move: MoveType): number {
    switch (move) {
      case "punch":
        return 0xef4444; // Red
      case "kick":
        return 0xf97316; // Orange
      case "block":
        return 0x3b82f6; // Blue
      case "special":
        return 0xa855f7; // Purple
    }
  }

  /**
   * Show move text above a position.
   */
  private showMoveText(x: number, y: number, text: string, color: number): void {
    const moveText = this.scene.add.text(x, y, text, {
      fontFamily: "Arial, sans-serif",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#" + color.toString(16).padStart(6, "0"),
      stroke: "#000000",
      strokeThickness: 4,
    });
    moveText.setOrigin(0.5);

    // Animate in
    moveText.setAlpha(0);
    moveText.setScale(0.5);

    this.scene.tweens.add({
      targets: moveText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      y: y - 20,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        // Fade out after delay
        this.scene.time.delayedCall(500, () => {
          this.scene.tweens.add({
            targets: moveText,
            alpha: 0,
            y: y - 40,
            duration: 300,
            onComplete: () => moveText.destroy(),
          });
        });
      },
    });
  }

  /**
   * Trigger move animation on a sprite.
   */
  private triggerMoveAnimation(
    sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container,
    move: MoveType,
    player: "player1" | "player2"
  ): void {
    // If sprite has animation methods (FighterSprite), call them
    // @ts-expect-error - Dynamic method call on sprite
    if (typeof sprite.playMove === "function") {
      // @ts-expect-error - Dynamic method call
      sprite.playMove(move);
      return;
    }

    // Try to identify character from texture key
    let charId = "unknown";
    if (sprite instanceof Phaser.GameObjects.Sprite) {
      // Expected format: char_<id>_<anim>
      const parts = sprite.texture.key.split('_');
      if (parts.length >= 2) {
        // Handle names with hyphens (e.g., cyber-ninja)
        // char, cyber-ninja, idle -> parts[0]=char, parts[1..N-1]=id, parts[N]=anim
        // actually existing keys are char_cyber-ninja_idle
        // so parts: ["char", "cyber-ninja", "idle"]
        if (parts.length === 3) {
          charId = parts[1];
        } else if (parts.length > 3) {
          charId = parts.slice(1, parts.length - 1).join("-");
        }
      }
    }

    // Special sequence: Cyber Ninja Block
    if (move === "block" && charId === "cyber-ninja") {
      if (sprite instanceof Phaser.GameObjects.Sprite) {
        const runKey = `${charId}_run`;
        const blockKey = `${charId}_block`;

        // Sequence: Run -> Block
        if (this.scene.anims.exists(runKey) && this.scene.anims.exists(blockKey)) {
          // Store original scale to restore later
          const originalScaleX = sprite.scaleX;
          const originalScaleY = sprite.scaleY;

          // Scale compensation: idle frame is 450px tall, block is 350px tall
          // To maintain same visual height: scale * (450/350) ≈ 1.286x
          const blockScaleMultiplier = 450 / 350;

          // Play run
          sprite.play(runKey);

          // Move forward slightly
          const direction = player === "player1" ? 1 : -1;
          const originalX = sprite.x;

          this.scene.tweens.add({
            targets: sprite,
            x: originalX + 50 * direction,
            duration: 200,
            yoyo: true, // Go back after
            hold: 400, // Hold while blocking
            ease: "Power1",
          });

          // Switch to block after short delay
          this.scene.time.delayedCall(200, () => {
            // Apply scale compensation for block animation
            sprite.setScale(originalScaleX * blockScaleMultiplier, originalScaleY * blockScaleMultiplier);
            sprite.play(blockKey);

            // Restore original scale after animation completes
            sprite.once("animationcomplete", () => {
              sprite.setScale(originalScaleX, originalScaleY);
            });
          });

          return;
        }
      }
    }

    // Special sequence: Cyber Ninja Special
    if (move === "special" && charId === "cyber-ninja") {
      if (sprite instanceof Phaser.GameObjects.Sprite) {
        const runKey = `${charId}_run`;
        const specialKey = `${charId}_special`;

        console.log("[DEBUG] Special animation check:", {
          charId,
          runKey,
          specialKey,
          runExists: this.scene.anims.exists(runKey),
          specialExists: this.scene.anims.exists(specialKey),
        });

        // Sequence: Run -> Special
        if (this.scene.anims.exists(runKey) && this.scene.anims.exists(specialKey)) {
          // Store original scale to restore later
          const originalScaleX = sprite.scaleX;
          const originalScaleY = sprite.scaleY;

          // Scale compensation: idle frame is 450px tall, special is 309px tall
          // To maintain same visual height: scale * (450/309) ≈ 1.456x
          // Using 1.6x to ensure character appears same size as idle
          const specialScaleMultiplier = 1.6;

          console.log("[DEBUG] Playing special sequence, scale compensation:", {
            originalScaleX,
            originalScaleY,
            multiplier: specialScaleMultiplier,
            newScale: originalScaleX * specialScaleMultiplier,
          });

          // Play run
          sprite.play(runKey);

          // Move forward more aggressively for a special attack
          const direction = player === "player1" ? 1 : -1;
          const originalX = sprite.x;

          this.scene.tweens.add({
            targets: sprite,
            x: originalX + 80 * direction,
            duration: 250,
            yoyo: true, // Go back after
            hold: 500, // Hold while performing special
            ease: "Power2",
          });

          // Switch to special after short delay
          this.scene.time.delayedCall(250, () => {
            // Apply scale compensation for special animation
            console.log("[DEBUG] Applying special scale:", originalScaleX * specialScaleMultiplier);
            sprite.setScale(originalScaleX * specialScaleMultiplier, originalScaleY * specialScaleMultiplier);
            sprite.play(specialKey);

            // Restore original scale after animation completes
            sprite.once("animationcomplete", () => {
              console.log("[DEBUG] Restoring original scale:", originalScaleX);
              sprite.setScale(originalScaleX, originalScaleY);
            });
          });

          return;
        }
      }
    }

    // Generic Animation Playback
    // Check if animation exists in Phaser registry
    if (sprite instanceof Phaser.GameObjects.Sprite) {
      // Try calling the move animation directly
      const animKey = `${charId}_${move}`;

      if (this.scene.anims.exists(animKey)) {
        sprite.play(animKey);

        // For non-looping moves, return to idle after complete? 
        // FightScene sets them to not loop (except generic block fallback), 
        // but let's ensure we go back to idle if needed or let RoundReset handle it.
        // RoundReset calls resetToIdle() eventually.
        return;
      }
    }

    // Fallback: simple lunge animation
    const direction = player === "player1" ? 1 : -1;
    const originalX = sprite.x;

    this.scene.tweens.add({
      targets: sprite,
      x: originalX + 30 * direction,
      duration: 150,
      yoyo: true,
      ease: "Power2",
    });
  }

  /**
   * Play hit effect on a sprite.
   */
  private playHitEffect(sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container): void {
    // Flash white
    // @ts-expect-error - May have setTint method
    if (typeof sprite.setTint === "function") {
      // @ts-expect-error
      sprite.setTint(0xffffff);
      this.scene.time.delayedCall(100, () => {
        // @ts-expect-error
        sprite.clearTint?.();
      });
    }

    // Screen shake
    this.scene.cameras.main.shake(100, 0.005);

    // Knockback
    const direction = sprite === this.player1Sprite ? -1 : 1;
    const originalX = sprite.x;

    this.scene.tweens.add({
      targets: sprite,
      x: originalX + 20 * direction,
      duration: 100,
      yoyo: true,
      ease: "Power2",
    });
  }

  /**
   * Show floating damage number.
   */
  private showDamageNumber(
    x: number,
    y: number,
    damage: number,
    color: number,
    customText?: string
  ): void {
    const text = customText || `-${damage}`;
    const damageText = this.scene.add.text(x, y, text, {
      fontFamily: "Arial, sans-serif",
      fontSize: damage > 20 ? "36px" : "28px",
      fontStyle: "bold",
      color: "#" + color.toString(16).padStart(6, "0"),
      stroke: "#000000",
      strokeThickness: 4,
    });
    damageText.setOrigin(0.5);

    this.damageNumbers.push(damageText);

    // Float up and fade animation
    this.scene.tweens.add({
      targets: damageText,
      y: y - 60,
      alpha: 0,
      duration: TIMING.DAMAGE_NUMBER_DURATION,
      ease: "Power2",
      onComplete: () => {
        const index = this.damageNumbers.indexOf(damageText);
        if (index > -1) {
          this.damageNumbers.splice(index, 1);
        }
        damageText.destroy();
      },
    });
  }

  /**
   * Clear all damage numbers.
   */
  private clearDamageNumbers(): void {
    for (const text of this.damageNumbers) {
      text.destroy();
    }
    this.damageNumbers = [];
  }

  /**
   * Show center announcement text.
   */
  private showCenterAnnouncement(text: string, color: number): void {
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    const announcement = this.scene.add.text(centerX, centerY, text, {
      fontFamily: "Arial, sans-serif",
      fontSize: "48px",
      fontStyle: "bold",
      color: "#" + color.toString(16).padStart(6, "0"),
      stroke: "#000000",
      strokeThickness: 6,
    });
    announcement.setOrigin(0.5);
    announcement.setDepth(1000);

    // Animate in with scale
    announcement.setScale(0);
    announcement.setAlpha(0);

    this.scene.tweens.add({
      targets: announcement,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 400,
      ease: "Back.easeOut",
      onComplete: () => {
        // Hold then fade
        this.scene.time.delayedCall(800, () => {
          this.scene.tweens.add({
            targets: announcement,
            alpha: 0,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            onComplete: () => announcement.destroy(),
          });
        });
      },
    });
  }

  /**
   * Play victory animation for the match winner.
   */
  playVictoryAnimation(winner: "player1" | "player2"): void {
    const winnerSprite = winner === "player1" ? this.player1Sprite : this.player2Sprite;
    const loserSprite = winner === "player1" ? this.player2Sprite : this.player1Sprite;

    // Winner celebration
    this.scene.tweens.add({
      targets: winnerSprite,
      y: winnerSprite.y - 20,
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: "Power2",
    });

    // Loser defeat pose
    this.scene.tweens.add({
      targets: loserSprite,
      alpha: 0.5,
      angle: winner === "player1" ? 10 : -10,
      duration: 500,
    });

    // Show winner announcement
    this.showCenterAnnouncement(`${winner === "player1" ? "PLAYER 1" : "PLAYER 2"} WINS!`, 0x49eacb);
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    this.clearDamageNumbers();
  }
}
