/**
 * Game constants for KaspaClash
 * Move properties, damage values, and game configuration
 */

import type { MoveType } from "./index";

// =============================================================================
// MOVE PROPERTIES
// =============================================================================

/**
 * Properties for each move type.
 */
export interface MoveProperties {
  /** Base damage dealt */
  damage: number;
  /** Moves this attack beats */
  beats: MoveType[];
  /** Animation duration in ms */
  animationDuration: number;
  /** Special effect description */
  effect?: string;
}

/**
 * Move properties lookup table.
 * Rock-Paper-Scissors-style with special as wild card.
 */
export const MOVE_PROPERTIES: Record<MoveType, MoveProperties> = {
  punch: {
    damage: 10,
    beats: ["kick"], // Fast punch beats slower kick
    animationDuration: 400,
    effect: "Quick strike",
  },
  kick: {
    damage: 15,
    beats: ["block"], // Powerful kick breaks through block
    animationDuration: 600,
    effect: "Power attack",
  },
  block: {
    damage: 0,
    beats: ["punch"], // Block deflects punch
    animationDuration: 300,
    effect: "Defensive stance, reduces incoming damage by 50%",
  },
  special: {
    damage: 25,
    beats: ["punch", "kick"], // Special beats normal attacks
    animationDuration: 800,
    effect: "High-risk, high-reward move",
  },
} as const;

// =============================================================================
// DAMAGE CALCULATION
// =============================================================================

/**
 * Damage multipliers for different outcomes.
 */
export const DAMAGE_MULTIPLIERS = {
  /** When your move beats opponent's move */
  WIN: 1.0,
  /** When moves tie (both deal damage) */
  TIE: 0.5,
  /** When opponent's move beats yours */
  LOSE: 0.0,
  /** Blocked damage reduction */
  BLOCKED: 0.5,
  /** Critical hit multiplier (special vs special) */
  CRITICAL: 1.5,
  /** Counter bonus (when your move beats their move) */
  COUNTER_BONUS: 1.0,
  /** Same move clash */
  SAME_MOVE: 0.5,
  /** Bonus damage at low health (< 30%) */
  LOW_HEALTH_BONUS: 1.2,
} as const;

// =============================================================================
// GAME CONSTANTS
// =============================================================================

/**
 * Core game configuration values.
 */
export const GAME_CONSTANTS = {
  /** Starting health for each player */
  STARTING_HEALTH: 100,

  /** Maximum health cap */
  MAX_HEALTH: 100,

  /** Time limit for move selection in seconds */
  MOVE_TIME_LIMIT: 15,

  /** Time limit for character selection in seconds */
  CHARACTER_SELECT_TIME_LIMIT: 30,

  /** Rounds needed to win in best_of_3 */
  ROUNDS_TO_WIN_BEST_OF_3: 2,

  /** Rounds needed to win in best_of_5 */
  ROUNDS_TO_WIN_BEST_OF_5: 3,

  /** Maximum rounds in best_of_3 */
  MAX_ROUNDS_BEST_OF_3: 3,

  /** Maximum rounds in best_of_5 */
  MAX_ROUNDS_BEST_OF_5: 5,

  /** Countdown before match starts in seconds */
  MATCH_START_COUNTDOWN: 3,

  /** Delay after round resolution for animations in ms */
  ROUND_RESOLUTION_DELAY: 2000,

  /** Reconnection timeout in seconds */
  RECONNECTION_TIMEOUT: 30,

  /** Transaction confirmation timeout in seconds */
  TX_CONFIRMATION_TIMEOUT: 60,

  /** Minimum transaction value for moves (sompi) */
  MIN_MOVE_TX_VALUE: 100000, // 0.001 KAS

  /** Room code length */
  ROOM_CODE_LENGTH: 6,

  /** Room code characters */
  ROOM_CODE_CHARS: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", // No confusing chars
} as const;

// =============================================================================
// UI CONSTANTS
// =============================================================================

/**
 * UI and display configuration.
 */
export const UI_CONSTANTS = {
  /** Game canvas width */
  GAME_WIDTH: 800,

  /** Game canvas height */
  GAME_HEIGHT: 600,

  /** Health bar width */
  HEALTH_BAR_WIDTH: 300,

  /** Health bar height */
  HEALTH_BAR_HEIGHT: 30,

  /** Animation frame rate */
  ANIMATION_FPS: 60,

  /** Toast notification duration in ms */
  TOAST_DURATION: 3000,

  /** Address truncation length (e.g., kaspa:qz0s...abc) */
  ADDRESS_TRUNCATE_LENGTH: 8,
} as const;

// =============================================================================
// NETWORK CONFIGURATION
// =============================================================================

/**
 * Network type definition.
 */
export type NetworkType = "mainnet" | "testnet";

/**
 * Network-specific configuration for mainnet and testnet.
 */
export const NETWORK_CONFIG = {
  mainnet: {
    /** Address prefix */
    prefix: "kaspa:",
    /** Block explorer URL */
    explorerUrl: "https://explorer.kaspa.org",
    /** RPC endpoint */
    rpcUrl: "wss://mainnet.kaspathon.com/wrpc",
    /** Display name */
    displayName: "Mainnet",
    /** Badge color class */
    badgeClass: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  testnet: {
    /** Address prefix */
    prefix: "kaspatest:",
    /** Block explorer URL (TN10) */
    explorerUrl: "https://explorer-tn10.kaspa.org",
    /** RPC endpoint */
    rpcUrl: "wss://testnet.kaspathon.com/wrpc",
    /** Display name */
    displayName: "Testnet",
    /** Badge color class */
    badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
} as const;

// =============================================================================
// KASPA CONSTANTS (Legacy - use NETWORK_CONFIG for new code)
// =============================================================================

/**
 * Kaspa blockchain configuration.
 * @deprecated Use NETWORK_CONFIG for network-specific values
 */
export const KASPA_CONSTANTS = {
  /** Address prefix for mainnet */
  MAINNET_PREFIX: "kaspa:",

  /** Address prefix for testnet */
  TESTNET_PREFIX: "kaspatest:",

  /** Default RPC endpoint for testnet */
  TESTNET_RPC: "wss://testnet.kaspathon.com/wrpc",

  /** Default RPC endpoint for mainnet */
  MAINNET_RPC: "wss://mainnet.kaspathon.com/wrpc",

  /** Kaspa explorer base URL */
  EXPLORER_URL: "https://explorer.kaspa.org",

  /** Testnet explorer base URL (TN10) */
  TESTNET_EXPLORER_URL: "https://explorer-tn10.kaspa.org",

  /** Sompi per KAS */
  SOMPI_PER_KAS: 100000000,

  /** Minimum fee for transactions (sompi) */
  MIN_FEE: 10000,
} as const;

// =============================================================================
// MATCHMAKING CONSTANTS
// =============================================================================

/**
 * Matchmaking configuration.
 */
export const MATCHMAKING_CONSTANTS = {
  /** Maximum rating difference for initial matching */
  INITIAL_RATING_RANGE: 100,

  /** Rating range expansion per second waiting */
  RATING_RANGE_EXPANSION: 10,

  /** Maximum rating range for matching */
  MAX_RATING_RANGE: 500,

  /** Queue timeout in seconds */
  QUEUE_TIMEOUT: 120,

  /** Minimum time between queue joins in seconds */
  QUEUE_COOLDOWN: 5,
} as const;

// =============================================================================
// ELO RATING CONSTANTS
// =============================================================================

/**
 * ELO rating calculation constants.
 */
export const ELO_CONSTANTS = {
  /** Default starting rating */
  DEFAULT_RATING: 1000,

  /** Minimum rating */
  MIN_RATING: 100,

  /** Maximum rating */
  MAX_RATING: 3000,

  /** K-factor for rating changes */
  K_FACTOR: 32,

  /** K-factor for new players (< 10 games) */
  NEW_PLAYER_K_FACTOR: 40,
} as const;
