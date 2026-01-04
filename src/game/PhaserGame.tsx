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
    // Use refs to store latest props to avoid stale closures in async callbacks
    const sceneConfigRef = useRef(sceneConfig);
    const currentSceneRef = useRef(currentScene);
    const [currentActiveScene, setCurrentActiveScene] =
      useState<Phaser.Scene | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Keep refs updated with latest prop values
    useEffect(() => {
      sceneConfigRef.current = sceneConfig;
      currentSceneRef.current = currentScene;
    }, [sceneConfig, currentScene]);


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
          const { BASE_GAME_CONFIG } = await import("./config");
          const { FightScene } = await import("./scenes/FightScene");
          const { CharacterSelectScene } = await import("./scenes/CharacterSelectScene");
          const { ResultsScene } = await import("./scenes/ResultsScene");
          const { PracticeScene } = await import("./scenes/PracticeScene");
          const { ReplayScene } = await import("./scenes/ReplayScene");

          if (!isMounted) return;

          // Create game config WITHOUT scenes to prevent auto-start
          // We'll add scenes manually and start the correct one with data
          const config: Phaser.Types.Core.GameConfig = {
            ...BASE_GAME_CONFIG,
            scene: [], // Empty - we'll add scenes manually
            parent: containerRef.current,
          };

          // Create the game instance
          gameRef.current = new Phaser.Game(config);

          // Add scenes manually (they won't auto-start)
          gameRef.current.scene.add("CharacterSelectScene", CharacterSelectScene, false);
          gameRef.current.scene.add("FightScene", FightScene, false);
          gameRef.current.scene.add("ResultsScene", ResultsScene, false);
          gameRef.current.scene.add("PracticeScene", PracticeScene, false);
          gameRef.current.scene.add("ReplayScene", ReplayScene, false);

          // Start the initial scene with data when game is ready
          // CRITICAL: Use refs to get the LATEST config values when "ready" fires
          gameRef.current.events.once("ready", () => {
            const latestScene = currentSceneRef.current;
            const latestConfig = sceneConfigRef.current;

            console.log("[PhaserGame] Ready event fired, starting scene:", latestScene);
            console.log("[PhaserGame] Scene config:", latestConfig);
            // Explicitly log deadline to debug
            const deadline = (latestConfig as any)?.selectionDeadlineAt;
            console.log("[PhaserGame] DEADLINE in config:", deadline ?? "UNDEFINED/NULL");

            if (latestScene && latestConfig) {
              // Start the scene with data - this is the FIRST time it runs
              gameRef.current?.scene.start(latestScene, latestConfig);
            } else if (latestConfig) {
              // Default to FightScene for backward compatibility if not specified
              gameRef.current?.scene.start("FightScene", latestConfig);
            }
          });

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
        // Only remove the specific listeners we registered
        // DO NOT call removeAllListeners() as it clears listeners from other components!
        EventBus.off("scene:ready");
        EventBus.off("scene:change");
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
        // Touch event handlers for mobile optimization
        onTouchStart={(e) => {
          // Prevent default only if touching the game canvas
          if ((e.target as HTMLElement).tagName === "CANVAS") {
            e.preventDefault();
          }
        }}
        onTouchMove={(e) => {
          // Prevent scroll while interacting with game
          if ((e.target as HTMLElement).tagName === "CANVAS") {
            e.preventDefault();
          }
        }}
        onContextMenu={(e) => {
          // Prevent context menu on long press
          e.preventDefault();
        }}
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
            <div style={{ textAlign: "center", color: "#F0B71F" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  border: "4px solid #F0B71F",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p className="font-orbitron tracking-widest text-cyber-gold uppercase text-sm">Loading game engine...</p>
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
