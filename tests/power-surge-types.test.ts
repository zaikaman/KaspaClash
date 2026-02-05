/**
 * Power Surge Types Unit Tests
 * 
 * Tests for power surge card definitions and types:
 * - Card catalog completeness
 * - Card properties validation
 * - Effect type coverage
 * - getPowerSurgeCard function
 */

import { describe, it, expect } from 'vitest';
import {
  POWER_SURGE_CARDS,
  getPowerSurgeCard,
  type PowerSurgeCardId,
  type PowerSurgeCard,
  type PowerSurgeRarity,
  type PowerSurgeEffectType,
} from '@/types/power-surge';

// =============================================================================
// CARD CATALOG
// =============================================================================

describe('Power Surge Types - Card Catalog', () => {
  it('should have exactly 15 power surge cards', () => {
    expect(POWER_SURGE_CARDS.length).toBe(15);
  });

  const expectedCardIds: PowerSurgeCardId[] = [
    'dag-overclock',
    'block-fortress',
    'tx-storm',
    'mempool-congest',
    'blue-set-heal',
    'orphan-smasher',
    '10bps-barrage',
    'pruned-rage',
    'sompi-shield',
    'hash-hurricane',
    'ghost-dag',
    'finality-fist',
    'bps-blitz',
    'vaultbreaker',
    'chainbreaker',
  ];

  it('should contain all expected card IDs', () => {
    for (const expectedId of expectedCardIds) {
      const card = POWER_SURGE_CARDS.find(c => c.id === expectedId);
      expect(card).toBeDefined();
    }
  });

  it('should have unique IDs for all cards', () => {
    const ids = POWER_SURGE_CARDS.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have unique names for all cards', () => {
    const names = POWER_SURGE_CARDS.map(c => c.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

// =============================================================================
// CARD PROPERTIES
// =============================================================================

describe('Power Surge Types - Card Properties', () => {
  it('all cards should have required properties', () => {
    for (const card of POWER_SURGE_CARDS) {
      expect(card.id).toBeDefined();
      expect(card.name).toBeDefined();
      expect(card.description).toBeDefined();
      expect(card.glowColor).toBeDefined();
      expect(card.iconKey).toBeDefined();
      expect(card.effectType).toBeDefined();
      expect(card.effectParams).toBeDefined();
    }
  });

  it('all cards should have non-empty names', () => {
    for (const card of POWER_SURGE_CARDS) {
      expect(card.name.length).toBeGreaterThan(0);
    }
  });

  it('all cards should have non-empty descriptions', () => {
    for (const card of POWER_SURGE_CARDS) {
      expect(card.description.length).toBeGreaterThan(0);
    }
  });

  it('all cards should have valid glow colors (hex numbers)', () => {
    for (const card of POWER_SURGE_CARDS) {
      expect(typeof card.glowColor).toBe('number');
      expect(card.glowColor).toBeGreaterThanOrEqual(0);
      expect(card.glowColor).toBeLessThanOrEqual(0xFFFFFF);
    }
  });

  it('all cards should have icon keys matching ID pattern', () => {
    for (const card of POWER_SURGE_CARDS) {
      expect(card.iconKey).toMatch(/^surge_/);
    }
  });
});

// =============================================================================
// GET POWER SURGE CARD
// =============================================================================

describe('Power Surge Types - getPowerSurgeCard', () => {
  it('should return card for valid ID', () => {
    const card = getPowerSurgeCard('dag-overclock');
    expect(card).toBeDefined();
    expect(card!.id).toBe('dag-overclock');
  });

  it('should return undefined for invalid ID', () => {
    const card = getPowerSurgeCard('invalid-card-id' as PowerSurgeCardId);
    expect(card).toBeUndefined();
  });

  it('should return correct card for each ID', () => {
    const cardIds: PowerSurgeCardId[] = [
      'dag-overclock',
      'block-fortress',
      'tx-storm',
      'mempool-congest',
      'blue-set-heal',
    ];

    for (const id of cardIds) {
      const card = getPowerSurgeCard(id);
      expect(card).toBeDefined();
      expect(card!.id).toBe(id);
    }
  });
});

// =============================================================================
// EFFECT TYPES
// =============================================================================

describe('Power Surge Types - Effect Types', () => {
  const validEffectTypes: PowerSurgeEffectType[] = [
    'damage_multiplier',
    'damage_reduction',
    'hp_regen',
    'damage_reflect',
    'priority_boost',
    'energy_burn',
    'conditional_heal',
    'counter_multiplier',
    'double_hit',
    'fury_boost',
    'damage_immunity',
    'random_win',
    'invisible_move',
    'critical_special',
    'energy_regen',
    'energy_regen_with_cost',
    'energy_steal',
    'opponent_stun',
    'lifesteal',
    'energy_drain',
    'guard_break',
  ];

  it('all cards should have valid effect types', () => {
    for (const card of POWER_SURGE_CARDS) {
      expect(validEffectTypes).toContain(card.effectType);
    }
  });

  it('should cover multiple effect types', () => {
    const usedTypes = new Set(POWER_SURGE_CARDS.map(c => c.effectType));
    expect(usedTypes.size).toBeGreaterThan(10);
  });
});

// =============================================================================
// SPECIFIC CARD TESTS
// =============================================================================

describe('Power Surge Types - Specific Cards', () => {
  describe('DAG Overclock', () => {
    it('should have damage_multiplier effect', () => {
      const card = getPowerSurgeCard('dag-overclock');
      expect(card!.effectType).toBe('damage_multiplier');
    });

    it('should have 1.4x damage multiplier', () => {
      const card = getPowerSurgeCard('dag-overclock');
      expect(card!.effectParams.damageMultiplier).toBe(1.4);
    });
  });

  describe('Block Fortress', () => {
    it('should have damage_reflect effect', () => {
      const card = getPowerSurgeCard('block-fortress');
      expect(card!.effectType).toBe('damage_reflect');
    });

    it('should have 120% reflect', () => {
      const card = getPowerSurgeCard('block-fortress');
      expect(card!.effectParams.reflectPercent).toBe(1.2);
    });
  });

  describe('Tx Storm', () => {
    it('should have energy_regen_with_cost effect', () => {
      const card = getPowerSurgeCard('tx-storm');
      expect(card!.effectType).toBe('energy_regen_with_cost');
    });

    it('should have 25 energy regen and 4 HP cost', () => {
      const card = getPowerSurgeCard('tx-storm');
      expect(card!.effectParams.energyRegenBonus).toBe(25);
      expect(card!.effectParams.hpCost).toBe(4);
    });
  });

  describe('Mempool Congest', () => {
    it('should have opponent_stun effect', () => {
      const card = getPowerSurgeCard('mempool-congest');
      expect(card!.effectType).toBe('opponent_stun');
    });

    it('should have 6 HP cost', () => {
      const card = getPowerSurgeCard('mempool-congest');
      expect(card!.effectParams.hpCost).toBe(6);
    });
  });

  describe('Sompi Shield', () => {
    it('should have damage_reduction effect', () => {
      const card = getPowerSurgeCard('sompi-shield');
      expect(card!.effectType).toBe('damage_reduction');
    });

    it('should have 45% damage reduction', () => {
      const card = getPowerSurgeCard('sompi-shield');
      expect(card!.effectParams.incomingDamageReduction).toBe(0.45);
    });
  });

  describe('Hash Hurricane', () => {
    it('should have random_win effect', () => {
      const card = getPowerSurgeCard('hash-hurricane');
      expect(card!.effectType).toBe('random_win');
    });

    it('should have 35% dodge chance', () => {
      const card = getPowerSurgeCard('hash-hurricane');
      expect(card!.effectParams.randomWinChance).toBe(0.35);
    });
  });

  describe('Finality Fist', () => {
    it('should have critical_special effect', () => {
      const card = getPowerSurgeCard('finality-fist');
      expect(card!.effectType).toBe('critical_special');
    });

    it('should have 1.7x damage and 24 extra energy cost', () => {
      const card = getPowerSurgeCard('finality-fist');
      expect(card!.effectParams.damageMultiplier).toBe(1.7);
      expect(card!.effectParams.energyCostBonus).toBe(24);
    });
  });

  describe('Pruned Rage', () => {
    it('should have fury_boost effect', () => {
      const card = getPowerSurgeCard('pruned-rage');
      expect(card!.effectType).toBe('fury_boost');
    });

    it('should have 1.3x damage and disable opponent block', () => {
      const card = getPowerSurgeCard('pruned-rage');
      expect(card!.effectParams.damageMultiplier).toBe(1.3);
      expect(card!.effectParams.opponentBlockDisabled).toBe(true);
    });
  });

  describe('BPS Blitz', () => {
    it('should have lifesteal effect', () => {
      const card = getPowerSurgeCard('bps-blitz');
      expect(card!.effectType).toBe('lifesteal');
    });

    it('should have 35% lifesteal', () => {
      const card = getPowerSurgeCard('bps-blitz');
      expect(card!.effectParams.lifestealPercent).toBe(0.35);
    });
  });

  describe('Vaultbreaker', () => {
    it('should have energy_steal effect', () => {
      const card = getPowerSurgeCard('vaultbreaker');
      expect(card!.effectType).toBe('energy_steal');
    });

    it('should steal 50 energy', () => {
      const card = getPowerSurgeCard('vaultbreaker');
      expect(card!.effectParams.energySteal).toBe(50);
    });
  });

  describe('Chainbreaker', () => {
    it('should have guard_break effect', () => {
      const card = getPowerSurgeCard('chainbreaker');
      expect(card!.effectType).toBe('guard_break');
    });

    it('should have 1.15x damage multiplier', () => {
      const card = getPowerSurgeCard('chainbreaker');
      expect(card!.effectParams.damageMultiplier).toBe(1.15);
    });
  });
});

// =============================================================================
// EFFECT PARAMETERS VALIDATION
// =============================================================================

describe('Power Surge Types - Effect Parameters', () => {
  it('damage multipliers should be > 1 for offensive cards', () => {
    const offensiveCards = ['dag-overclock', 'finality-fist', 'pruned-rage', 'chainbreaker'];
    
    for (const id of offensiveCards) {
      const card = getPowerSurgeCard(id as PowerSurgeCardId);
      expect(card!.effectParams.damageMultiplier).toBeGreaterThan(1);
    }
  });

  it('damage reduction should be between 0 and 1', () => {
    const card = getPowerSurgeCard('sompi-shield');
    expect(card!.effectParams.incomingDamageReduction).toBeGreaterThan(0);
    expect(card!.effectParams.incomingDamageReduction).toBeLessThan(1);
  });

  it('random win chance should be between 0 and 1', () => {
    const card = getPowerSurgeCard('hash-hurricane');
    expect(card!.effectParams.randomWinChance).toBeGreaterThan(0);
    expect(card!.effectParams.randomWinChance).toBeLessThan(1);
  });

  it('lifesteal percentage should be between 0 and 1', () => {
    const card = getPowerSurgeCard('bps-blitz');
    expect(card!.effectParams.lifestealPercent).toBeGreaterThan(0);
    expect(card!.effectParams.lifestealPercent).toBeLessThan(1);
  });

  it('energy values should be positive', () => {
    const energyCards = ['ghost-dag', 'vaultbreaker', '10bps-barrage', 'tx-storm'];
    
    for (const id of energyCards) {
      const card = getPowerSurgeCard(id as PowerSurgeCardId);
      const hasPositiveEnergy = 
        (card!.effectParams.energyDrain && card!.effectParams.energyDrain > 0) ||
        (card!.effectParams.energySteal && card!.effectParams.energySteal > 0) ||
        (card!.effectParams.energyRegenBonus && card!.effectParams.energyRegenBonus > 0);
      expect(hasPositiveEnergy).toBe(true);
    }
  });

  it('HP regen should be positive where defined', () => {
    const card = getPowerSurgeCard('blue-set-heal');
    expect(card!.effectParams.hpRegen).toBeGreaterThan(0);
  });

  it('HP costs should be positive where defined', () => {
    const costCards = ['tx-storm', 'mempool-congest'];
    
    for (const id of costCards) {
      const card = getPowerSurgeCard(id as PowerSurgeCardId);
      expect(card!.effectParams.hpCost).toBeGreaterThan(0);
    }
  });
});
