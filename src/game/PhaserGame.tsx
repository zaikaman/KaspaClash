"use client";

/**
 * PhaserGame Component
 * React wrapper for the Phaser game instance
 * Handles dynamic loading, lifecycle, and React-Phaser communication
 */

import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import { EventBus } from "./EventBus";
import type { GameEvents } from "./EventBus";
import type { FightSceneConfig } from "./scenes/FightScene";

/**
 * Props for the PhaserGame component.
 */
export interface PhaserGameProps {
  /** Current scene key to start with */
  currentScene?: string;
  /** Scene configuration for FightScene */
  sceneConfig?: FightSceneConfig;
  /** Callback when scene is ready */
  onSceneReady?: (scene: Phaser.Scene) => void;
  /** Callback when current scene changes */
  onSceneChange?: (scene: Phaser.Scene) => void;
  /** Additional CSS class for the container */
  className?: string;
  /** Custom width override */
  width?: number | string;
  /** Custom height override */
  height?: number | string;
}

/**
 * Ref interface for external control of the game.
 */
export interface PhaserGameRef {
  game: Phaser.Game | null;
  scene: Phaser.Scene | null;
  emit: <K extends keyof GameEvents>(event: K, data?: GameEvents[K]) => void;
}

/**
 * PhaserGame component that wraps the Phaser game instance.
 */
export const PhaserGame = forwardRef<PhaserGameRef, PhaserGameProps>(
  function PhaserGame(
    { currentScene, sceneConfig, onSceneReady, onSceneChange, className, width, height },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const [currentActiveScene, setCurrentActiveScene] =
      useState<Phaser.Scene | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Expose game instance and methods to parent
    useImperativeHandle(
      ref,
      () => ({
        game: gameRef.current,
        scene: currentActiveScene,
        emit: <K extends keyof GameEvents>(event: K, data?: GameEvents[K]) => {
          EventBus.emitEvent(event, data);
        },
      }),
      [currentActiveScene]
    );

    // Initialize Phaser game
    useEffect(() => {
      let isMounted = true;

      const initGame = async () => {
        if (!containerRef.current || gameRef.current) return;

        try {
          setIsLoading(true);

          // Dynamic import for Phaser (client-side only)
          const Phaser = (await import("phaser")).default;
          const { createGameConfig } = await import("./config");
          const { FightScene } = await import("./scenes/FightScene");
          
          // Register scenes - add FightScene
          const scenes: Phaser.Types.Scenes.SceneType[] = [FightScene];

          if (!isMounted) return;

          // Create game config
          const config = createGameConfig(scenes);

          // Override parent to use our container
          config.parent = containerRef.current;

          // Create the game instance
          gameRef.current = new Phaser.Game(config);

          // If we have scene config, start the FightScene with it
          if (sceneConfig) {
            gameRef.current.events.once("ready", () => {
              gameRef.current?.scene.start("FightScene", sceneConfig);
            });
          }

          // Listen for scene ready events
          EventBus.onEvent("scene:ready", (data) => {
            if (!isMounted) return;
            const scene = data as Phaser.Scene;
            setCurrentActiveScene(scene);
            onSceneReady?.(scene);
          });

          // Listen for scene change events
          EventBus.onEvent("scene:change", (data) => {
            if (!isMounted) return;
            const scene = data as Phaser.Scene;
            setCurrentActiveScene(scene);
            onSceneChange?.(scene);
          });

          setIsLoading(false);
        } catch (err) {
          console.error("Failed to initialize Phaser:", err);
          if (isMounted) {
            setError(err instanceof Error ? err.message : "Failed to load game");
            setIsLoading(false);
          }
        }
      };

      initGame();

      // Cleanup on unmount
      return () => {
        isMounted = false;
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
        EventBus.removeAllListeners();
      };
    }, [onSceneReady, onSceneChange]);

    // Handle scene changes
    useEffect(() => {
      if (!gameRef.current || !currentScene) return;

      const game = gameRef.current;
      if (game.scene.isActive(currentScene)) return;

      // Start the requested scene
      if (game.scene.getScene(currentScene)) {
        game.scene.start(currentScene);
      }
    }, [currentScene]);

    // Container styles
    const containerStyle: React.CSSProperties = {
      width: width ?? "100%",
      height: height ?? "100%",
      minHeight: 400,
      position: "relative",
      overflow: "hidden",
    };

    if (error) {
      return (
        <div
          className={className}
          style={{
            ...containerStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1a1a1a",
            color: "#ef4444",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p style={{ marginBottom: 8 }}>Failed to load game</p>
            <p style={{ fontSize: 14, opacity: 0.7 }}>{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={className}
        style={containerStyle}
        id="phaser-container"
      >
        {isLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0a0a0a",
            }}
          >
            <div style={{ textAlign: "center", color: "#40e0d0" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  border: "4px solid #40e0d0",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p>Loading game engine...</p>
              <style>
                {`@keyframes spin { to { transform: rotate(360deg); } }`}
              </style>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default PhaserGame;
