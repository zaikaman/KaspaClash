/**
 * Character Stats Unit Tests
 * 
 * Comprehensive tests for character combat stats:
 * - All 20 characters have valid stats
 * - Archetype system verification
 * - Stat modifier validation
 * - Fallback behavior
 */

import { describe, it, expect } from 'vitest';
import {
  getCharacterCombatStats,
  CHARACTER_COMBAT_STATS,
  CYBER_NINJA_STATS,
  DAG_WARRIOR_STATS,
  BLOCK_BRUISER_STATS,
  HASH_HUNTER_STATS,
  NEON_WRAITH_STATS,
  KITSUNE_09_STATS,
  VIPERBLADE_STATS,
  CHRONO_DRIFTER_STATS,
  HEAVY_LOADER_STATS,
  GENE_SMASHER_STATS,
  BASTION_HULK_STATS,
  SCRAP_GOLIATH_STATS,
  CYBER_PALADIN_STATS,
  NANO_BRAWLER_STATS,
  TECHNOMANCER_STATS,
  AEON_GUARD_STATS,
  RAZOR_BOT_7_STATS,
  SONIC_STRIKER_STATS,
  PRISM_DUELIST_STATS,
  VOID_REAPER_STATS,
} from '@/game/combat/CharacterStats';
import type { CharacterArchetype } from '@/game/combat/types';

// =============================================================================
// ALL CHARACTERS LIST
// =============================================================================

const ALL_CHARACTER_IDS = [
  // Legacy characters
  'cyber-ninja',
  'dag-warrior',
  'block-bruiser',
  'hash-hunter',
  // Speed archetype
  'neon-wraith',
  'kitsune-09',
  'viperblade',
  'chrono-drifter',
  // Tank archetype
  'heavy-loader',
  'gene-smasher',
  'bastion-hulk',
  'scrap-goliath',
  // Tech archetype
  'cyber-paladin',
  'nano-brawler',
  'technomancer',
  'aeon-guard',
  // Precision archetype
  'razor-bot-7',
  'sonic-striker',
  'prism-duelist',
  'void-reaper',
];

// =============================================================================
// CHARACTER LOOKUP
// =============================================================================

describe('Character Stats - Lookup', () => {
  it('should return stats for all known characters', () => {
    for (const charId of ALL_CHARACTER_IDS) {
      const stats = getCharacterCombatStats(charId);
      expect(stats).toBeDefined();
      expect(stats.maxHp).toBeGreaterThan(0);
    }
  });

  it('should fallback to DAG Warrior for unknown characters', () => {
    const unknownStats = getCharacterCombatStats('unknown-character');
    expect(unknownStats).toBe(DAG_WARRIOR_STATS);
  });

  it('should have all characters in CHARACTER_COMBAT_STATS', () => {
    for (const charId of ALL_CHARACTER_IDS) {
      expect(CHARACTER_COMBAT_STATS[charId]).toBeDefined();
    }
  });

  it('should have exactly 20 characters defined', () => {
    expect(Object.keys(CHARACTER_COMBAT_STATS).length).toBe(20);
  });
});

// =============================================================================
// STAT VALIDATION
// =============================================================================

describe('Character Stats - Validation', () => {
  for (const charId of ALL_CHARACTER_IDS) {
    describe(`${charId}`, () => {
      const stats = getCharacterCombatStats(charId);

      it('should have valid HP (80-140)', () => {
        expect(stats.maxHp).toBeGreaterThanOrEqual(80);
        expect(stats.maxHp).toBeLessThanOrEqual(140);
      });

      it('should have valid energy (60-130)', () => {
        expect(stats.maxEnergy).toBeGreaterThanOrEqual(60);
        expect(stats.maxEnergy).toBeLessThanOrEqual(130);
      });

      it('should have valid archetype', () => {
        const validArchetypes: CharacterArchetype[] = ['speed', 'tank', 'tech', 'precision'];
        expect(validArchetypes).toContain(stats.archetype);
      });

      it('should have all damage modifiers defined', () => {
        expect(stats.damageModifiers.punch).toBeDefined();
        expect(stats.damageModifiers.kick).toBeDefined();
        expect(stats.damageModifiers.block).toBeDefined();
        expect(stats.damageModifiers.special).toBeDefined();
        expect(stats.damageModifiers.stunned).toBeDefined();
      });

      it('should have reasonable damage modifiers (0.8-1.5)', () => {
        expect(stats.damageModifiers.punch).toBeGreaterThanOrEqual(0.8);
        expect(stats.damageModifiers.punch).toBeLessThanOrEqual(1.5);
        expect(stats.damageModifiers.kick).toBeGreaterThanOrEqual(0.8);
        expect(stats.damageModifiers.kick).toBeLessThanOrEqual(1.5);
        expect(stats.damageModifiers.special).toBeGreaterThanOrEqual(0.8);
        expect(stats.damageModifiers.special).toBeLessThanOrEqual(1.5);
      });

      it('should have block damage modifier of 1.0', () => {
        expect(stats.damageModifiers.block).toBe(1.0);
      });

      it('should have stunned damage modifier of 1.0', () => {
        expect(stats.damageModifiers.stunned).toBe(1.0);
      });

      it('should have valid block effectiveness (0.2-0.95)', () => {
        expect(stats.blockEffectiveness).toBeGreaterThanOrEqual(0.2);
        expect(stats.blockEffectiveness).toBeLessThanOrEqual(0.95);
      });

      it('should have valid special cost modifier (0.7-1.4)', () => {
        expect(stats.specialCostModifier).toBeGreaterThanOrEqual(0.7);
        expect(stats.specialCostModifier).toBeLessThanOrEqual(1.4);
      });

      it('should have valid energy regen (10-30)', () => {
        expect(stats.energyRegen).toBeGreaterThanOrEqual(10);
        expect(stats.energyRegen).toBeLessThanOrEqual(30);
      });
    });
  }
});

// =============================================================================
// ARCHETYPE GROUPING
// =============================================================================

describe('Character Stats - Archetypes', () => {
  const speedCharacters = ['cyber-ninja', 'neon-wraith', 'kitsune-09', 'viperblade', 'chrono-drifter'];
  const tankCharacters = ['block-bruiser', 'heavy-loader', 'gene-smasher', 'bastion-hulk', 'scrap-goliath'];
  const techCharacters = ['dag-warrior', 'cyber-paladin', 'nano-brawler', 'technomancer', 'aeon-guard'];
  const precisionCharacters = ['hash-hunter', 'razor-bot-7', 'sonic-striker', 'prism-duelist', 'void-reaper'];

  it('speed characters should have speed archetype', () => {
    for (const charId of speedCharacters) {
      expect(getCharacterCombatStats(charId).archetype).toBe('speed');
    }
  });

  it('tank characters should have tank archetype', () => {
    for (const charId of tankCharacters) {
      expect(getCharacterCombatStats(charId).archetype).toBe('tank');
    }
  });

  it('tech characters should have tech archetype', () => {
    for (const charId of techCharacters) {
      expect(getCharacterCombatStats(charId).archetype).toBe('tech');
    }
  });

  it('precision characters should have precision archetype', () => {
    for (const charId of precisionCharacters) {
      expect(getCharacterCombatStats(charId).archetype).toBe('precision');
    }
  });
});

// =============================================================================
// ARCHETYPE CHARACTERISTICS
// =============================================================================

describe('Character Stats - Archetype Characteristics', () => {
  describe('Speed Archetype', () => {
    const speedChars = ['neon-wraith', 'kitsune-09', 'viperblade', 'chrono-drifter'];

    it('should generally have higher energy', () => {
      for (const charId of speedChars) {
        const stats = getCharacterCombatStats(charId);
        expect(stats.maxEnergy).toBeGreaterThanOrEqual(100);
      }
    });

    it('should generally have good energy regen', () => {
      for (const charId of speedChars) {
        const stats = getCharacterCombatStats(charId);
        expect(stats.energyRegen).toBeGreaterThanOrEqual(20);
      }
    });
  });

  describe('Tank Archetype', () => {
    const tankChars = ['heavy-loader', 'gene-smasher', 'bastion-hulk', 'scrap-goliath'];

    it('should generally have higher HP', () => {
      for (const charId of tankChars) {
        const stats = getCharacterCombatStats(charId);
        expect(stats.maxHp).toBeGreaterThanOrEqual(110);
      }
    });
  });

  describe('Tech Archetype', () => {
    const techChars = ['cyber-paladin', 'nano-brawler', 'technomancer', 'aeon-guard'];

    it('should have balanced stats', () => {
      for (const charId of techChars) {
        const stats = getCharacterCombatStats(charId);
        expect(stats.maxHp).toBeGreaterThanOrEqual(90);
        expect(stats.maxEnergy).toBeGreaterThanOrEqual(90);
      }
    });
  });

  describe('Precision Archetype', () => {
    const precisionChars = ['razor-bot-7', 'sonic-striker', 'prism-duelist', 'void-reaper'];

    it('should generally have good special damage', () => {
      for (const charId of precisionChars) {
        const stats = getCharacterCombatStats(charId);
        expect(stats.damageModifiers.special).toBeGreaterThanOrEqual(1.0);
      }
    });
  });
});

// =============================================================================
// SPECIFIC CHARACTER STATS
// =============================================================================

describe('Character Stats - Specific Characters', () => {
  it('Neon Wraith should be a glass cannon', () => {
    expect(NEON_WRAITH_STATS.maxHp).toBeLessThanOrEqual(95);
    expect(NEON_WRAITH_STATS.maxEnergy).toBeGreaterThanOrEqual(115);
    expect(NEON_WRAITH_STATS.damageModifiers.special).toBeGreaterThanOrEqual(1.1);
  });

  it('Heavy Loader should be a super tank', () => {
    expect(HEAVY_LOADER_STATS.maxHp).toBeGreaterThanOrEqual(130);
    expect(HEAVY_LOADER_STATS.maxEnergy).toBeLessThanOrEqual(75);
  });

  it('Technomancer should specialize in specials', () => {
    expect(TECHNOMANCER_STATS.damageModifiers.special).toBeGreaterThanOrEqual(1.2);
    expect(TECHNOMANCER_STATS.specialCostModifier).toBeLessThanOrEqual(0.9);
    expect(TECHNOMANCER_STATS.maxEnergy).toBeGreaterThanOrEqual(115);
  });

  it('Bastion Hulk should have excellent block', () => {
    expect(BASTION_HULK_STATS.blockEffectiveness).toBeGreaterThanOrEqual(0.8);
  });

  it('Gene Smasher should have terrible block (berserker)', () => {
    expect(GENE_SMASHER_STATS.blockEffectiveness).toBeLessThanOrEqual(0.3);
    expect(GENE_SMASHER_STATS.damageModifiers.punch).toBeGreaterThanOrEqual(1.2);
    expect(GENE_SMASHER_STATS.damageModifiers.kick).toBeGreaterThanOrEqual(1.2);
  });

  it('Void Reaper should be a glass cannon precision', () => {
    expect(VOID_REAPER_STATS.damageModifiers.punch).toBeGreaterThanOrEqual(1.2);
    expect(VOID_REAPER_STATS.damageModifiers.kick).toBeGreaterThanOrEqual(1.2);
    expect(VOID_REAPER_STATS.damageModifiers.special).toBeGreaterThanOrEqual(1.2);
    expect(VOID_REAPER_STATS.blockEffectiveness).toBeLessThanOrEqual(0.4);
  });
});

// =============================================================================
// BALANCE CHECKS
// =============================================================================

describe('Character Stats - Balance', () => {
  it('no character should have max HP and max energy', () => {
    for (const charId of ALL_CHARACTER_IDS) {
      const stats = getCharacterCombatStats(charId);
      // Characters with high HP should have lower energy and vice versa
      const combinedTotal = stats.maxHp + stats.maxEnergy;
      expect(combinedTotal).toBeLessThanOrEqual(240); // Reasonable cap
    }
  });

  it('high damage characters should have lower HP', () => {
    // Characters with high damage multipliers should be compensated
    for (const charId of ALL_CHARACTER_IDS) {
      const stats = getCharacterCombatStats(charId);
      const avgDamage = (
        stats.damageModifiers.punch +
        stats.damageModifiers.kick +
        stats.damageModifiers.special
      ) / 3;

      if (avgDamage >= 1.2) {
        expect(stats.maxHp).toBeLessThanOrEqual(120);
      }
    }
  });

  it('low block effectiveness characters should have compensation', () => {
    for (const charId of ALL_CHARACTER_IDS) {
      const stats = getCharacterCombatStats(charId);
      
      if (stats.blockEffectiveness <= 0.35) {
        // Either high HP, high damage, or high energy
        const hasCompensation =
          stats.maxHp >= 110 ||
          stats.damageModifiers.punch >= 1.2 ||
          stats.maxEnergy >= 110;
        expect(hasCompensation).toBe(true);
      }
    }
  });
});

// =============================================================================
// LEGACY CHARACTER COMPATIBILITY
// =============================================================================

describe('Character Stats - Legacy Compatibility', () => {
  it('legacy characters should exist', () => {
    expect(CYBER_NINJA_STATS).toBeDefined();
    expect(DAG_WARRIOR_STATS).toBeDefined();
    expect(BLOCK_BRUISER_STATS).toBeDefined();
    expect(HASH_HUNTER_STATS).toBeDefined();
  });

  it('legacy characters should have correct archetypes', () => {
    expect(CYBER_NINJA_STATS.archetype).toBe('speed');
    expect(DAG_WARRIOR_STATS.archetype).toBe('tech');
    expect(BLOCK_BRUISER_STATS.archetype).toBe('tank');
    expect(HASH_HUNTER_STATS.archetype).toBe('precision');
  });
});
