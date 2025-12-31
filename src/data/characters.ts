/**
 * Character Definitions
 * Static data for all playable characters in KaspaClash
 */

import type { Character, SpriteConfig, SpriteAnimation } from "@/types";

// =============================================================================
// SPRITE ANIMATION DEFAULTS
// =============================================================================

/**
 * Default animation configuration factory.
 */
function createDefaultAnimation(
  characterId: string,
  action: string,
  frames: number = 4,
  frameRate: number = 12,
  hitFrame?: number
): SpriteAnimation {
  return {
    sheet: `/characters/${characterId}/${action}.png`,
    frames,
    frameRate,
    hitFrame,
  };
}

/**
 * Create default sprite config for a character.
 */
function createDefaultSpriteConfig(characterId: string): SpriteConfig {
  return {
    idle: createDefaultAnimation(characterId, "idle", 4, 8),
    punch: createDefaultAnimation(characterId, "punch", 6, 12, 3),
    kick: createDefaultAnimation(characterId, "kick", 6, 12, 4),
    block: createDefaultAnimation(characterId, "block", 3, 10),
    special: createDefaultAnimation(characterId, "special", 8, 14, 5),
    hurt: createDefaultAnimation(characterId, "hurt", 4, 10),
    victory: createDefaultAnimation(characterId, "victory", 6, 10),
    defeat: createDefaultAnimation(characterId, "defeat", 4, 8),
  };
}

// =============================================================================
// CHARACTER DEFINITIONS
// =============================================================================

/**
 * Cyber Ninja - Fast and technical
 * Theme: Kaspa's speed and efficiency
 */
export const CYBER_NINJA: Character = {
  id: "cyber-ninja",
  name: "Cyber Ninja",
  theme: "Digital shadow warrior representing Kaspa's lightning-fast block times. Masters of precision strikes and tactical defense.",
  portraitUrl: "/characters/cyber-ninja/portrait.png",
  spriteConfig: createDefaultSpriteConfig("cyber-ninja"),
};

/**
 * DAG Warrior - Balanced and adaptable
 * Theme: Kaspa's DAG structure
 */
export const DAG_WARRIOR: Character = {
  id: "dag-warrior",
  name: "DAG Warrior",
  theme: "Parallel processing champion embodying Kaspa's BlockDAG architecture. Versatile fighter who can handle any situation.",
  portraitUrl: "/characters/dag-warrior/portrait.png",
  spriteConfig: createDefaultSpriteConfig("dag-warrior"),
};

/**
 * Block Bruiser - Heavy and powerful
 * Theme: Kaspa's block structure and security
 */
export const BLOCK_BRUISER: Character = {
  id: "block-bruiser",
  name: "Block Bruiser",
  theme: "Immovable force representing Kaspa's rock-solid security. Heavy hitter with devastating power moves.",
  portraitUrl: "/characters/block-bruiser/portrait.png",
  spriteConfig: createDefaultSpriteConfig("block-bruiser"),
};

/**
 * Hash Hunter - Aggressive and relentless
 * Theme: Kaspa's mining and proof-of-work
 */
export const HASH_HUNTER: Character = {
  id: "hash-hunter",
  name: "Hash Hunter",
  theme: "Relentless proof-of-work champion fueled by computational fire. Aggressive attacker who never stops pressing forward.",
  portraitUrl: "/characters/hash-hunter/portrait.png",
  spriteConfig: createDefaultSpriteConfig("hash-hunter"),
};

// =============================================================================
// CHARACTER ROSTER
// =============================================================================

/**
 * All available characters in order of selection screen position.
 */
export const CHARACTER_ROSTER: Character[] = [
  CYBER_NINJA,
  DAG_WARRIOR,
  BLOCK_BRUISER,
  HASH_HUNTER,
];

/**
 * Character lookup by ID.
 */
export const CHARACTERS_BY_ID: Record<string, Character> = {
  [CYBER_NINJA.id]: CYBER_NINJA,
  [DAG_WARRIOR.id]: DAG_WARRIOR,
  [BLOCK_BRUISER.id]: BLOCK_BRUISER,
  [HASH_HUNTER.id]: HASH_HUNTER,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get character by ID.
 */
export function getCharacter(id: string): Character | undefined {
  return CHARACTERS_BY_ID[id];
}

/**
 * Get character by ID with fallback.
 */
export function getCharacterOrDefault(id: string): Character {
  return CHARACTERS_BY_ID[id] ?? CYBER_NINJA;
}

/**
 * Validate if a character ID is valid.
 */
export function isValidCharacterId(id: string): boolean {
  return id in CHARACTERS_BY_ID;
}

/**
 * Get random character (for AI or random selection).
 */
export function getRandomCharacter(): Character {
  const index = Math.floor(Math.random() * CHARACTER_ROSTER.length);
  return CHARACTER_ROSTER[index];
}

/**
 * Get character selection grid layout.
 * Returns characters arranged for a 2x2 grid display.
 */
export function getCharacterGrid(): Character[][] {
  return [
    [CYBER_NINJA, DAG_WARRIOR],
    [BLOCK_BRUISER, HASH_HUNTER],
  ];
}

/**
 * Character colors for UI theming.
 */
export const CHARACTER_COLORS: Record<string, { primary: number; secondary: number; glow: number }> = {
  "cyber-ninja": {
    primary: 0x9333ea, // Purple
    secondary: 0x7c3aed,
    glow: 0xa855f7,
  },
  "dag-warrior": {
    primary: 0x3b82f6, // Blue
    secondary: 0x2563eb,
    glow: 0x60a5fa,
  },
  "block-bruiser": {
    primary: 0xf97316, // Orange
    secondary: 0xea580c,
    glow: 0xfb923c,
  },
  "hash-hunter": {
    primary: 0xef4444, // Red
    secondary: 0xdc2626,
    glow: 0xf87171,
  },
};

/**
 * Get character theme color.
 */
export function getCharacterColor(characterId: string): { primary: number; secondary: number; glow: number } {
  return CHARACTER_COLORS[characterId] ?? CHARACTER_COLORS["cyber-ninja"];
}
