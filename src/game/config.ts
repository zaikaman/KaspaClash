/**
 * Phaser Game Configuration
 * Core configuration for the KaspaClash fighting game engine
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - WebGL with high-performance power preference
 * - Increased parallel downloads for faster asset loading
 * - Optimized render settings for weak devices
 * - Disabled unnecessary features
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

  // Physics disabled - not needed for turn-based game
  // Omitting physics config entirely improves performance
  // physics: { default: false },

  // Rendering options - optimized for performance
  render: {
    antialias: true, // Keep visual quality high
    antialiasGL: true, // Keep WebGL antialiasing for smooth edges
    pixelArt: false,
    roundPixels: true, // Prevents sub-pixel rendering issues
    transparent: false,
    clearBeforeRender: true,
    preserveDrawingBuffer: false, // Better performance
    powerPreference: "high-performance", // Request high-performance GPU
    batchSize: 4096, // Default batch size for sprite batching
    maxTextures: -1, // Auto-detect max textures
  },

  // Audio configuration
  audio: {
    disableWebAudio: false,
  },

  // Loader configuration - optimized for faster asset loading
  loader: {
    maxParallelDownloads: 32, // Increase parallel downloads (default is 4)
    crossOrigin: "anonymous",
    async: true,
    maxRetries: 2,
  },

  // Performance options
  fps: {
    target: 60,
    forceSetTimeOut: false,
    smoothStep: true, // Smooth frame time
    deltaHistory: 10, // Stabilize delta calculations
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
