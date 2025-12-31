/**
 * SceneManager - Manages Phaser scene transitions
 * Handles loading, transitions, and scene lifecycle
 */

import Phaser from "phaser";
import { EventBus } from "@/game/EventBus";
import type { CharacterSelectSceneConfig } from "@/game/scenes/CharacterSelectScene";
import type { FightSceneConfig } from "@/game/scenes/FightScene";

/**
 * Scene keys.
 */
export type SceneKey =
  | "BootScene"
  | "PreloadScene"
  | "MainMenuScene"
  | "CharacterSelectScene"
  | "FightScene"
  | "ResultsScene";

/**
 * Scene transition configuration.
 */
export interface TransitionConfig {
  duration?: number;
  fadeColor?: number;
  onComplete?: () => void;
}

/**
 * Scene manager state.
 */
interface SceneManagerState {
  currentScene: SceneKey | null;
  previousScene: SceneKey | null;
  isTransitioning: boolean;
}

/**
 * Default transition config.
 */
const DEFAULT_TRANSITION: TransitionConfig = {
  duration: 300,
  fadeColor: 0x000000,
};

/**
 * SceneManager - Centralized scene management.
 */
export class SceneManager {
  private game: Phaser.Game;
  private state: SceneManagerState = {
    currentScene: null,
    previousScene: null,
    isTransitioning: false,
  };

  constructor(game: Phaser.Game) {
    this.game = game;
    this.setupEventListeners();
  }

  /**
   * Setup EventBus listeners for scene transitions.
   */
  private setupEventListeners(): void {
    // Match found -> Character select
    EventBus.on(
      "match_found",
      (data: unknown) => {
        const payload = data as {
          matchId: string;
          playerAddress: string;
          opponentAddress: string;
          isHost: boolean;
        };
        this.startCharacterSelect(payload);
      }
    );

    // Both ready -> Fight scene
    EventBus.on(
      "both_ready",
      (_data: unknown) => {
        // Fight scene transition is handled by CharacterSelectScene
      }
    );

    // Match ended -> Results scene
    EventBus.on("match_ended", (data: unknown) => {
      const payload = data as { matchId: string };
      this.startResults(payload.matchId);
    });

    // Return to menu
    EventBus.on("return_to_menu", () => {
      this.startMainMenu();
    });
  }

  // ===========================================================================
  // SCENE TRANSITIONS
  // ===========================================================================

  /**
   * Start character selection scene.
   */
  startCharacterSelect(config: {
    matchId: string;
    playerAddress: string;
    opponentAddress: string;
    isHost: boolean;
    selectionTimeLimit?: number;
  }): void {
    if (this.state.isTransitioning) return;

    const sceneConfig: CharacterSelectSceneConfig = {
      matchId: config.matchId,
      playerAddress: config.playerAddress,
      opponentAddress: config.opponentAddress,
      isHost: config.isHost,
      selectionTimeLimit: config.selectionTimeLimit ?? 30,
    };

    this.transitionTo("CharacterSelectScene", sceneConfig);
  }

  /**
   * Start fight scene.
   */
  startFight(config: FightSceneConfig): void {
    if (this.state.isTransitioning) return;

    this.transitionTo("FightScene", config);
  }

  /**
   * Start results scene.
   */
  startResults(matchId: string): void {
    if (this.state.isTransitioning) return;

    this.transitionTo("ResultsScene", { matchId });
  }

  /**
   * Start main menu scene.
   */
  startMainMenu(): void {
    if (this.state.isTransitioning) return;

    this.transitionTo("MainMenuScene", {});
  }

  /**
   * Start practice mode.
   */
  startPractice(config: { characterId: string }): void {
    if (this.state.isTransitioning) return;

    // Practice uses the fight scene with AI opponent
    const fightConfig: FightSceneConfig = {
      matchId: "practice-mode",
      player1Address: "local-player",
      player2Address: "ai-opponent",
      player1Character: config.characterId,
      player2Character: config.characterId, // Mirror match
      playerRole: "player1",
    };

    this.transitionTo("FightScene", fightConfig);
  }

  // ===========================================================================
  // CORE TRANSITION LOGIC
  // ===========================================================================

  /**
   * Transition to a new scene with fade effect.
   */
  private transitionTo(
    targetScene: SceneKey,
    data: unknown,
    config: TransitionConfig = {}
  ): void {
    const transitionConfig = { ...DEFAULT_TRANSITION, ...config };
    const fadeColor = transitionConfig.fadeColor ?? 0x000000;
    this.state.isTransitioning = true;

    const currentScene = this.getCurrentSceneInstance();
    if (currentScene) {
      // Fade out current scene
      currentScene.cameras.main.fadeOut(
        transitionConfig.duration,
        (fadeColor >> 16) & 0xff,
        (fadeColor >> 8) & 0xff,
        fadeColor & 0xff
      );

      currentScene.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.doSceneSwitch(targetScene, data, transitionConfig);
        }
      );
    } else {
      // No current scene, just switch
      this.doSceneSwitch(targetScene, data, transitionConfig);
    }
  }

  /**
   * Perform the actual scene switch.
   */
  private doSceneSwitch(
    targetScene: SceneKey,
    data: unknown,
    config: TransitionConfig
  ): void {
    // Update state
    this.state.previousScene = this.state.currentScene;
    this.state.currentScene = targetScene;

    // Stop current scene if running
    if (this.state.previousScene) {
      const scene = this.game.scene.getScene(this.state.previousScene);
      if (scene) {
        this.game.scene.stop(this.state.previousScene);
      }
    }

    // Start new scene
    this.game.scene.start(targetScene, data as object);

    // Fade in new scene
    const fadeColor = config.fadeColor ?? 0x000000;
    const newScene = this.game.scene.getScene(targetScene);
    if (newScene) {
      newScene.cameras.main.fadeIn(
        config.duration,
        (fadeColor >> 16) & 0xff,
        (fadeColor >> 8) & 0xff,
        fadeColor & 0xff
      );

      newScene.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
        () => {
          this.state.isTransitioning = false;
          config.onComplete?.();
          EventBus.emit("scene_ready", { scene: targetScene });
        }
      );
    } else {
      this.state.isTransitioning = false;
    }
  }

  /**
   * Get current running scene instance.
   */
  private getCurrentSceneInstance(): Phaser.Scene | null {
    if (!this.state.currentScene) return null;
    const scene = this.game.scene.getScene(this.state.currentScene);
    return scene && this.game.scene.isActive(this.state.currentScene)
      ? scene
      : null;
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Get current scene key.
   */
  getCurrentScene(): SceneKey | null {
    return this.state.currentScene;
  }

  /**
   * Get previous scene key.
   */
  getPreviousScene(): SceneKey | null {
    return this.state.previousScene;
  }

  /**
   * Check if currently transitioning.
   */
  isTransitioning(): boolean {
    return this.state.isTransitioning;
  }

  /**
   * Check if a scene is currently active.
   */
  isSceneActive(sceneKey: SceneKey): boolean {
    return this.game.scene.isActive(sceneKey);
  }

  /**
   * Pause current scene.
   */
  pauseCurrentScene(): void {
    if (this.state.currentScene) {
      this.game.scene.pause(this.state.currentScene);
    }
  }

  /**
   * Resume current scene.
   */
  resumeCurrentScene(): void {
    if (this.state.currentScene) {
      this.game.scene.resume(this.state.currentScene);
    }
  }

  /**
   * Restart current scene.
   */
  restartCurrentScene(): void {
    if (this.state.currentScene) {
      const scene = this.game.scene.getScene(this.state.currentScene);
      if (scene) {
        scene.scene.restart();
      }
    }
  }

  /**
   * Clean up.
   */
  destroy(): void {
    EventBus.off("match_found");
    EventBus.off("both_ready");
    EventBus.off("match_ended");
    EventBus.off("return_to_menu");
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let sceneManagerInstance: SceneManager | null = null;

/**
 * Initialize scene manager with game instance.
 */
export function initSceneManager(game: Phaser.Game): SceneManager {
  if (sceneManagerInstance) {
    sceneManagerInstance.destroy();
  }
  sceneManagerInstance = new SceneManager(game);
  return sceneManagerInstance;
}

/**
 * Get scene manager instance.
 */
export function getSceneManager(): SceneManager | null {
  return sceneManagerInstance;
}
