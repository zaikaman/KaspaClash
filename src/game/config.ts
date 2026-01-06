/**
 * Phaser Game Configuration
 * Core configuration for the KaspaClash fighting game engine
 */

import Phaser from "phaser";

/**
 * Base game configuration without scene initialization.
 * Scenes should be added dynamically.
 */
export const BASE_GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL with Canvas fallback
  parent: undefined, // Will be set dynamically by PhaserGame component
  backgroundColor: "#0a0a0a", // Dark background matching Kaspa theme

  // Game dimensions - optimized for web fighting game
  width: 1280,
  height: 720,

  // Scale manager for responsive design
  scale: {
    mode: Phaser.Scale.FIT, // Fit to container while maintaining aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH, // Center in container
    width: 1280,
    height: 720,
    min: {
      width: 640,
      height: 360,
    },
    max: {
      width: 1920,
      height: 1080,
    },
  },

  // Physics configuration - not needed for turn-based game
  // but included for potential animation effects
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: process.env.NODE_ENV === "development",
    },
  },

  // Rendering options
  render: {
    antialias: true,
    pixelArt: false, // Set to true if using pixel art
    roundPixels: true,
    transparent: false,
  },

  // Audio configuration
  audio: {
    disableWebAudio: false,
  },

  // Performance options
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },

  // Disable banner in production
  banner: process.env.NODE_ENV === "development",

  // Scene will be added dynamically
  scene: [],
};

/**
 * Create game configuration with scenes.
 */
export function createGameConfig(
  scenes: Phaser.Types.Scenes.SceneType[]
): Phaser.Types.Core.GameConfig {
  return {
    ...BASE_GAME_CONFIG,
    scene: scenes,
  };
}

/**
 * Game dimensions constants.
 */
export const GAME_DIMENSIONS = {
  WIDTH: 1280,
  HEIGHT: 720,
  CENTER_X: 640,
  CENTER_Y: 360,
};

/**
 * Character positioning constants.
 */
export const CHARACTER_POSITIONS = {
  PLAYER1: {
    X: 320,
    Y: 500,
  },
  PLAYER2: {
    X: 960,
    Y: 500,
  },
};

/**
 * UI positioning constants.
 */
export const UI_POSITIONS = {
  HEALTH_BAR: {
    PLAYER1: { X: 50, Y: 50, WIDTH: 400 },
    PLAYER2: { X: 830, Y: 50, WIDTH: 400 },
  },
  TIMER: {
    X: 640,
    Y: 50,
  },
  ROUND_INDICATOR: {
    X: 640,
    Y: 100,
  },
};
