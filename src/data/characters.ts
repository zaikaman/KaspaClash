/**
 * Character Definitions
 * Static data for all playable characters in KaspaClash
 */

import type { Character, SpriteConfig, SpriteAnimation } from "@/types";

// =============================================================================
// SPRITE ANIMATION DEFAULTS
// =============================================================================

function createDefaultAnimation(
  characterId: string,
  action: string,
  frames: number = 4,
  frameRate: number = 12,
  hitFrame?: number
): SpriteAnimation {
  return {
    sheet: `/characters/${characterId}/${action}.webp`,
    frames,
    frameRate,
    hitFrame,
  };
}

function createSpriteConfig(characterId: string): SpriteConfig {
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
// CHARACTER DEFINITIONS (16 Unique Fighters)
// =============================================================================

// --- Speed Fighters (Base: cyber-ninja) ---
// --- Speed Fighters (Base: cyber-ninja) ---
export const CYBER_NINJA: Character = {
  id: "cyber-ninja",
  name: "Cyber Ninja",
  theme: "A digital assassin composed of glitching light. High risk, high reward.",
  portraitUrl: "/characters/cyber-ninja/portrait.webp",
  spriteConfig: createSpriteConfig("cyber-ninja"),
};
export const NEON_WRAITH: Character = {
  id: "neon-wraith",
  name: "Neon Wraith",
  theme: "The stealthy variant of the cyber ninja, focused on speed.",
  portraitUrl: "/characters/neon-wraith/portrait.webp",
  spriteConfig: createSpriteConfig("neon-wraith"),
};
export const KITSUNE_09: Character = {
  id: "kitsune-09",
  name: "Kitsune-09",
  theme: "Bio-augmented cyborg with holographic tails. Elusive and tricky.",
  portraitUrl: "/characters/kitsune-09/portrait.webp",
  spriteConfig: createSpriteConfig("kitsune-09"),
};
export const VIPERBLADE: Character = {
  id: "viperblade",
  name: "Viperblade",
  theme: "Toxic biomech with mantis-style blades. Balanced speed and offense.",
  portraitUrl: "/characters/viperblade/portrait.webp",
  spriteConfig: createSpriteConfig("viperblade"),
};
export const CHRONO_DRIFTER: Character = {
  id: "chrono-drifter",
  name: "Chrono-Drifter",
  theme: "Time-displaced ronin. Slower but more resilient than other speedsters.",
  portraitUrl: "/characters/chrono-drifter/portrait.webp",
  spriteConfig: createSpriteConfig("chrono-drifter"),
};

// --- Tank Fighters (Base: block-bruiser) ---
export const BLOCK_BRUISER: Character = {
  id: "block-bruiser",
  name: "Block Bruiser",
  theme: "The original tank, built to withstand anything.",
  portraitUrl: "/characters/block-bruiser/portrait.webp",
  spriteConfig: createSpriteConfig("block-bruiser"),
};
export const HEAVY_LOADER: Character = {
  id: "heavy-loader",
  name: "Heavy-Loader",
  theme: "Industrial mech with hydraulic crushing claws. Massive health pool.",
  portraitUrl: "/characters/heavy-loader/portrait.webp",
  spriteConfig: createSpriteConfig("heavy-loader"),
};
export const GENE_SMASHER: Character = {
  id: "gene-smasher",
  name: "Gene-Smasher",
  theme: "Experimental super-soldier using raw brute force. Devastating clicks.",
  portraitUrl: "/characters/gene-smasher/portrait.webp",
  spriteConfig: createSpriteConfig("gene-smasher"),
};
export const BASTION_HULK: Character = {
  id: "bastion-hulk",
  name: "Bastion Hulk",
  theme: "Geometric golem with floating fists. specialized in defense and energy.",
  portraitUrl: "/characters/bastion-hulk/portrait.webp",
  spriteConfig: createSpriteConfig("bastion-hulk"),
};
export const SCRAP_GOLIATH: Character = {
  id: "scrap-goliath",
  name: "Scrap-Goliath",
  theme: "A massive golem animated from urban debris. Regenerates energy quickly.",
  portraitUrl: "/characters/scrap-goliath/portrait.webp",
  spriteConfig: createSpriteConfig("scrap-goliath"),
};

// --- Tech Fighters (Base: dag-warrior) ---
export const DAG_WARRIOR: Character = {
  id: "dag-warrior",
  name: "Dag Warrior",
  theme: "Futuristic knight with a hard-light hammer. Defensive but versatile.",
  portraitUrl: "/characters/dag-warrior/portrait.webp",
  spriteConfig: createSpriteConfig("dag-warrior"),
};
export const CYBER_PALADIN: Character = {
  id: "cyber-paladin",
  name: "Cyber-Paladin",
  theme: "An upgraded paladin model with enhanced shielding.",
  portraitUrl: "/characters/cyber-paladin/portrait.webp",
  spriteConfig: createSpriteConfig("cyber-paladin"),
};
export const NANO_BRAWLER: Character = {
  id: "nano-brawler",
  name: "Nano-Brawler",
  theme: "Street fighter utilizing nanobot-enhanced punches. Aggressive combo user.",
  portraitUrl: "/characters/nano-brawler/portrait.webp",
  spriteConfig: createSpriteConfig("nano-brawler"),
};
export const TECHNOMANCER: Character = {
  id: "technomancer",
  name: "Technomancer",
  theme: "Sorcerer manipulating high-voltage cables. Specializes in ability usage.",
  portraitUrl: "/characters/technomancer/portrait.webp",
  spriteConfig: createSpriteConfig("technomancer"),
};
export const AEON_GUARD: Character = {
  id: "aeon-guard",
  name: "Aeon Guard",
  theme: "Cosmic guardian wielding a gravity staff. Elite all-rounder.",
  portraitUrl: "/characters/aeon-guard/portrait.webp",
  spriteConfig: createSpriteConfig("aeon-guard"),
};

// --- Precision Fighters (Base: hash-hunter) ---
export const HASH_HUNTER: Character = {
  id: "hash-hunter",
  name: "Hash Hunter",
  theme: "Robot duelist with laser whips. High critical strike potential.",
  portraitUrl: "/characters/hash-hunter/portrait.webp",
  spriteConfig: createSpriteConfig("hash-hunter"),
};
export const RAZOR_BOT_7: Character = {
  id: "razor-bot-7",
  name: "Razor-Bot 7",
  theme: "A newer model of the Hunter series, faster but more fragile.",
  portraitUrl: "/characters/razor-bot-7/portrait.webp",
  spriteConfig: createSpriteConfig("razor-bot-7"),
};
export const SONIC_STRIKER: Character = {
  id: "sonic-striker",
  name: "Sonic-Striker",
  theme: "Fighter using massive subwoofer-gauntlets. Heavy impact damage.",
  portraitUrl: "/characters/sonic-striker/portrait.webp",
  spriteConfig: createSpriteConfig("sonic-striker"),
};
export const PRISM_DUELIST: Character = {
  id: "prism-duelist",
  name: "Prism-Duelist",
  theme: "Fencer with a rapier of focused light. Excellent counter-attacker.",
  portraitUrl: "/characters/prism-duelist/portrait.webp",
  spriteConfig: createSpriteConfig("prism-duelist"),
};
export const VOID_REAPER: Character = {
  id: "void-reaper",
  name: "Void-Reaper",
  theme: "Alien predator wielding dark matter scythes. High damage, low health.",
  portraitUrl: "/characters/void-reaper/portrait.webp",
  spriteConfig: createSpriteConfig("void-reaper"),
};

// =============================================================================
// CHARACTER ROSTER
// =============================================================================

export const CHARACTER_ROSTER: Character[] = [
  // Speed Group
  CYBER_NINJA, NEON_WRAITH, KITSUNE_09, VIPERBLADE, CHRONO_DRIFTER,
  // Tech Group
  DAG_WARRIOR, CYBER_PALADIN, NANO_BRAWLER, TECHNOMANCER, AEON_GUARD,
  // Tank Group
  BLOCK_BRUISER, HEAVY_LOADER, GENE_SMASHER, BASTION_HULK, SCRAP_GOLIATH,
  // Precision Group
  HASH_HUNTER, RAZOR_BOT_7, SONIC_STRIKER, PRISM_DUELIST, VOID_REAPER
];

export const CHARACTERS_BY_ID: Record<string, Character> = {};
CHARACTER_ROSTER.forEach(char => {
  CHARACTERS_BY_ID[char.id] = char;
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getCharacter(id: string): Character | undefined {
  return CHARACTERS_BY_ID[id];
}

export function getCharacterOrDefault(id: string): Character {
  return CHARACTERS_BY_ID[id] ?? CYBER_NINJA;
}

export function isValidCharacterId(id: string): boolean {
  return id in CHARACTERS_BY_ID;
}

export function getRandomCharacter(): Character {
  const index = Math.floor(Math.random() * CHARACTER_ROSTER.length);
  return CHARACTER_ROSTER[index];
}

/**
 * Character colors for UI theming.
 */
export const CHARACTER_COLORS: Record<string, { primary: number; secondary: number; glow: number }> = {
  // Speed (Purple theme)
  "cyber-ninja": { primary: 0x9333ea, secondary: 0x7c3aed, glow: 0xa855f7 },
  "neon-wraith": { primary: 0x9333ea, secondary: 0x7c3aed, glow: 0xa855f7 },
  "kitsune-09": { primary: 0x9333ea, secondary: 0x7c3aed, glow: 0xa855f7 },
  "viperblade": { primary: 0x9333ea, secondary: 0x7c3aed, glow: 0xa855f7 },
  "chrono-drifter": { primary: 0x9333ea, secondary: 0x7c3aed, glow: 0xa855f7 },

  // Tech (Blue theme)
  "dag-warrior": { primary: 0x3b82f6, secondary: 0x2563eb, glow: 0x60a5fa },
  "cyber-paladin": { primary: 0x3b82f6, secondary: 0x2563eb, glow: 0x60a5fa },
  "nano-brawler": { primary: 0x3b82f6, secondary: 0x2563eb, glow: 0x60a5fa },
  "technomancer": { primary: 0x3b82f6, secondary: 0x2563eb, glow: 0x60a5fa },
  "aeon-guard": { primary: 0x3b82f6, secondary: 0x2563eb, glow: 0x60a5fa },

  // Tank (Orange theme)
  "block-bruiser": { primary: 0xf97316, secondary: 0xea580c, glow: 0xfb923c },
  "heavy-loader": { primary: 0xf97316, secondary: 0xea580c, glow: 0xfb923c },
  "gene-smasher": { primary: 0xf97316, secondary: 0xea580c, glow: 0xfb923c },
  "bastion-hulk": { primary: 0xf97316, secondary: 0xea580c, glow: 0xfb923c },
  "scrap-goliath": { primary: 0xf97316, secondary: 0xea580c, glow: 0xfb923c },

  // Precision (Red theme)
  "hash-hunter": { primary: 0xef4444, secondary: 0xdc2626, glow: 0xf87171 },
  "razor-bot-7": { primary: 0xef4444, secondary: 0xdc2626, glow: 0xf87171 },
  "sonic-striker": { primary: 0xef4444, secondary: 0xdc2626, glow: 0xf87171 },
  "prism-duelist": { primary: 0xef4444, secondary: 0xdc2626, glow: 0xf87171 },
  "void-reaper": { primary: 0xef4444, secondary: 0xdc2626, glow: 0xf87171 },
};

export function getCharacterColor(characterId: string): { primary: number; secondary: number; glow: number } {
  return CHARACTER_COLORS[characterId] ?? { primary: 0x999999, secondary: 0x666666, glow: 0xcccccc };
}
