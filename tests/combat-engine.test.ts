/**
 * Combat Engine Unit Tests
 * 
 * Comprehensive tests for the CombatEngine class covering:
 * - State management and initialization
 * - Turn resolution logic
 * - Move interactions (Rock-Paper-Scissors mechanics)
 * - Round and match progression
 * - Energy and HP management
 * - Guard meter mechanics
 * - Stun and stagger effects
 */

import { describe, it, expect, beforeEach } from 'vitest';
import CombatEngine from '@/game/combat/CombatEngine';
import { RESOLUTION_MATRIX, BASE_MOVE_STATS, COMBAT_CONSTANTS } from '@/game/combat/types';
import type { MoveType } from '@/types';

// Test characters with known stats
const TEST_CHAR_1 = 'dag-warrior';
const TEST_CHAR_2 = 'cyber-ninja';

// =============================================================================
// STATE INITIALIZATION
// =============================================================================

describe('CombatEngine - Initialization', () => {
  it('should initialize with correct default state', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const state = engine.getState();

    expect(state.currentRound).toBe(1);
    expect(state.currentTurn).toBe(1);
    expect(state.isRoundOver).toBe(false);
    expect(state.isMatchOver).toBe(false);
    expect(state.roundWinner).toBeNull();
    expect(state.matchWinner).toBeNull();
  });

  it('should initialize players with character stats', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const state = engine.getState();

    expect(state.player1.characterId).toBe(TEST_CHAR_1);
    expect(state.player2.characterId).toBe(TEST_CHAR_2);
    expect(state.player1.hp).toBeGreaterThan(0);
    expect(state.player2.hp).toBeGreaterThan(0);
    expect(state.player1.energy).toBeGreaterThan(0);
    expect(state.player2.energy).toBeGreaterThan(0);
  });

  it('should initialize with correct match format', () => {
    const bo3Engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2, 'best_of_3');
    expect(bo3Engine.getState().matchFormat).toBe('best_of_3');
    expect(bo3Engine.getState().roundsToWin).toBe(2);

    const bo5Engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2, 'best_of_5');
    expect(bo5Engine.getState().matchFormat).toBe('best_of_5');
    expect(bo5Engine.getState().roundsToWin).toBe(3);

    const bo1Engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2, 'best_of_1');
    expect(bo1Engine.getState().matchFormat).toBe('best_of_1');
    expect(bo1Engine.getState().roundsToWin).toBe(1);
  });

  it('should initialize players with zero guard meter', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const state = engine.getState();

    expect(state.player1.guardMeter).toBe(0);
    expect(state.player2.guardMeter).toBe(0);
  });

  it('should initialize players as not stunned or staggered', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const state = engine.getState();

    expect(state.player1.isStunned).toBe(false);
    expect(state.player1.isStaggered).toBe(false);
    expect(state.player2.isStunned).toBe(false);
    expect(state.player2.isStaggered).toBe(false);
  });

  it('should initialize with zero rounds won', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const state = engine.getState();

    expect(state.player1.roundsWon).toBe(0);
    expect(state.player2.roundsWon).toBe(0);
  });
});

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

describe('CombatEngine - State Management', () => {
  it('getState should return immutable copy', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const state1 = engine.getState();
    const state2 = engine.getState();

    expect(state1).not.toBe(state2);
    expect(state1.player1).not.toBe(state2.player1);
    expect(state1.player2).not.toBe(state2.player2);
  });

  it('setState should restore state correctly', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    
    // Modify state through gameplay
    engine.resolveTurn('punch', 'punch', null, null);
    const modifiedState = engine.getState();

    // Create new engine and restore state
    const newEngine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    newEngine.setState(modifiedState);

    expect(newEngine.getState().currentTurn).toBe(modifiedState.currentTurn);
    expect(newEngine.getState().player1.hp).toBe(modifiedState.player1.hp);
  });

  it('getPlayerState should return correct player', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);

    const p1State = engine.getPlayerState('player1');
    const p2State = engine.getPlayerState('player2');

    expect(p1State.characterId).toBe(TEST_CHAR_1);
    expect(p2State.characterId).toBe(TEST_CHAR_2);
  });

  it('setPlayerStunned should update stun state', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);

    engine.setPlayerStunned('player1', true);
    expect(engine.getState().player1.isStunned).toBe(true);

    engine.setPlayerStunned('player1', false);
    expect(engine.getState().player1.isStunned).toBe(false);
  });
});

// =============================================================================
// MOVE AFFORDABILITY
// =============================================================================

describe('CombatEngine - Move Affordability', () => {
  it('punch should always be affordable (0 energy cost)', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    expect(engine.canAffordMove('player1', 'punch')).toBe(true);
  });

  it('block should always be affordable (0 energy cost)', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    expect(engine.canAffordMove('player1', 'block')).toBe(true);
  });

  it('kick should require energy', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    // With full energy, kick should be affordable
    expect(engine.canAffordMove('player1', 'kick')).toBe(true);
  });

  it('special should require significant energy', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    // With full energy, special should be affordable
    expect(engine.canAffordMove('player1', 'special')).toBe(true);
  });

  it('getAvailableMoves should return moves player can afford', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const moves = engine.getAvailableMoves('player1');

    expect(moves).toContain('punch');
    expect(moves).toContain('block');
    expect(Array.isArray(moves)).toBe(true);
  });

  it('getMoveCost should return correct costs', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);

    expect(engine.getMoveCost(TEST_CHAR_1, 'punch')).toBe(BASE_MOVE_STATS.punch.energyCost);
    expect(engine.getMoveCost(TEST_CHAR_1, 'block')).toBe(BASE_MOVE_STATS.block.energyCost);
    expect(engine.getMoveCost(TEST_CHAR_1, 'kick')).toBe(BASE_MOVE_STATS.kick.energyCost);
    // Special cost may be modified by character stats
    expect(engine.getMoveCost(TEST_CHAR_1, 'special')).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// TURN RESOLUTION - BASIC MOVES
// =============================================================================

describe('CombatEngine - Turn Resolution', () => {
  it('should resolve a turn and return result', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('punch', 'punch', null, null);

    expect(result).toBeDefined();
    expect(result.player1).toBeDefined();
    expect(result.player2).toBeDefined();
    expect(result.narrative).toBeDefined();
  });

  it('should increment turn counter after resolution', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    expect(engine.getState().currentTurn).toBe(1);

    engine.resolveTurn('punch', 'punch', null, null);
    expect(engine.getState().currentTurn).toBe(2);
  });

  it('punch vs punch - both should hit', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('punch', 'punch', null, null);

    expect(result.player1.outcome).toBe('hit');
    expect(result.player2.outcome).toBe('hit');
    expect(result.player1.damageDealt).toBeGreaterThan(0);
    expect(result.player2.damageDealt).toBeGreaterThan(0);
  });

  it('kick vs kick - both should hit', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('kick', 'kick', null, null);

    expect(result.player1.outcome).toBe('hit');
    expect(result.player2.outcome).toBe('hit');
  });

  it('block vs block - both guarding', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('block', 'block', null, null);

    expect(result.player1.outcome).toBe('guarding');
    expect(result.player2.outcome).toBe('guarding');
    expect(result.player1.damageDealt).toBe(0);
    expect(result.player2.damageDealt).toBe(0);
  });
});

// =============================================================================
// ROCK-PAPER-SCISSORS MECHANICS
// =============================================================================

describe('CombatEngine - RPS Mechanics', () => {
  it('punch beats special (stuns special user)', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('punch', 'special', null, null);

    expect(result.player1.outcome).toBe('hit');
    expect(result.player2.outcome).toBe('missed');
  });

  it('kick beats punch (staggers punch user)', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('kick', 'punch', null, null);

    expect(result.player1.outcome).toBe('hit');
    expect(result.player2.outcome).toBe('staggered');
  });

  it('block beats kick (reflects kick)', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('block', 'kick', null, null);

    expect(result.player1.outcome).toBe('guarding');
    expect(result.player2.outcome).toBe('reflected');
  });

  it('special beats block (shatters block)', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('special', 'block', null, null);

    expect(result.player1.outcome).toBe('hit');
    expect(result.player2.outcome).toBe('shattered');
  });

  it('punch vs block - punch is blocked', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('punch', 'block', null, null);

    expect(result.player1.outcome).toBe('blocked');
    expect(result.player2.outcome).toBe('guarding');
  });

  it('special vs kick - special hits', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('special', 'kick', null, null);

    expect(result.player1.outcome).toBe('hit');
    expect(result.player2.outcome).toBe('hit');
  });
});

// =============================================================================
// HP AND DAMAGE
// =============================================================================

describe('CombatEngine - HP and Damage', () => {
  it('should reduce HP when taking damage', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const initialHp = engine.getState().player2.hp;

    engine.resolveTurn('punch', 'block', null, null);

    expect(engine.getState().player2.hp).toBeLessThan(initialHp);
  });

  it('HP should not go below zero', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);

    // Keep attacking until player is defeated
    for (let i = 0; i < 50; i++) {
      if (engine.getState().isRoundOver) break;
      engine.resolveTurn('special', 'stunned', null, null);
    }

    expect(engine.getState().player2.hp).toBeGreaterThanOrEqual(0);
  });

  it('blocked attacks should deal reduced damage', () => {
    const engine1 = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    engine1.resolveTurn('punch', 'block', null, null);
    const blockedDamage = engine1.getState().player2.maxHp - engine1.getState().player2.hp;

    const engine2 = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    // Make P2 stunned so they don't block
    engine2.setPlayerStunned('player2', true);
    engine2.resolveTurn('punch', 'stunned', null, null);
    const fullDamage = engine2.getState().player2.maxHp - engine2.getState().player2.hp;

    expect(blockedDamage).toBeLessThanOrEqual(fullDamage);
  });

  it('special attack should deal more damage than punch', () => {
    const engine1 = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    engine1.setPlayerStunned('player2', true);
    engine1.resolveTurn('punch', 'stunned', null, null);
    const punchDamage = engine1.getState().player2.maxHp - engine1.getState().player2.hp;

    const engine2 = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    engine2.setPlayerStunned('player2', true);
    engine2.resolveTurn('special', 'stunned', null, null);
    const specialDamage = engine2.getState().player2.maxHp - engine2.getState().player2.hp;

    expect(specialDamage).toBeGreaterThan(punchDamage);
  });
});

// =============================================================================
// ENERGY MANAGEMENT
// =============================================================================

describe('CombatEngine - Energy Management', () => {
  it('using kick should cost energy', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const initialEnergy = engine.getState().player1.energy;

    engine.resolveTurn('kick', 'block', null, null);

    // Energy spent minus regen
    const energyAfter = engine.getState().player1.energy;
    // Should have spent some energy (accounting for regen)
    expect(energyAfter).toBeLessThanOrEqual(initialEnergy);
  });

  it('using special should cost significant energy', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const initialEnergy = engine.getState().player1.energy;

    engine.resolveTurn('special', 'block', null, null);

    // Even with regen, special should cost more than gained
    const energyAfter = engine.getState().player1.energy;
    expect(energyAfter).toBeLessThan(initialEnergy);
  });

  it('punch should not cost energy', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('punch', 'block', null, null);

    expect(result.player1.energySpent).toBe(0);
  });

  it('block should not cost energy', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('block', 'punch', null, null);

    expect(result.player1.energySpent).toBe(0);
  });

  it('energy should regenerate each turn', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);

    // Spend energy with special
    engine.resolveTurn('special', 'block', null, null);
    const energyAfterSpecial = engine.getState().player1.energy;

    // Use punch (no cost) to allow regen
    engine.resolveTurn('punch', 'block', null, null);
    const energyAfterPunch = engine.getState().player1.energy;

    expect(energyAfterPunch).toBeGreaterThan(energyAfterSpecial);
  });

  it('energy should not exceed maximum', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const maxEnergy = engine.getState().player1.maxEnergy;

    // Many turns of just punching (no cost, lots of regen)
    for (let i = 0; i < 10; i++) {
      engine.resolveTurn('punch', 'punch', null, null);
    }

    expect(engine.getState().player1.energy).toBeLessThanOrEqual(maxEnergy);
  });
});

// =============================================================================
// STUN MECHANICS
// =============================================================================

describe('CombatEngine - Stun Mechanics', () => {
  it('stunned player should not be able to act', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    engine.setPlayerStunned('player2', true);

    const result = engine.resolveTurn('punch', 'punch', null, null);

    expect(result.player2.outcome).toBe('stunned');
    expect(result.player2.damageDealt).toBe(0);
  });

  it('stun should be cleared after being hit', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    engine.setPlayerStunned('player2', true);

    engine.resolveTurn('punch', 'punch', null, null);

    // Stun should be cleared after taking the hit
    expect(engine.getState().player2.isStunned).toBe(false);
  });

  it('stunned move type should be treated as miss', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);
    const result = engine.resolveTurn('punch', 'stunned', null, null);

    expect(result.player2.move).toBe('stunned');
    expect(result.player1.outcome).toBe('hit');
  });
});

// =============================================================================
// ROUND PROGRESSION
// =============================================================================

describe('CombatEngine - Round Progression', () => {
  it('round should end when a player reaches 0 HP', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);

    // Keep attacking until round ends
    for (let i = 0; i < 50; i++) {
      if (engine.getState().isRoundOver) break;
      engine.setPlayerStunned('player2', true);
      engine.resolveTurn('special', 'stunned', null, null);
    }

    expect(engine.getState().isRoundOver).toBe(true);
    expect(engine.getState().roundWinner).toBe('player1');
  });

  it('winning a round should increment roundsWon', () => {
    const engine = new CombatEngine(TEST_CHAR_1, TEST_CHAR_2);

    // Win first round
    for (let i = 0; i < 50; i++) {
      if (engine.getState().isRoundOver) break;
      engine.setPlayerStunned('player2', true);
      engine.resolveTurn('special', 'stunned', null, null);
    }

    expect(engine.getState().player1.roundsWon).toBe(1);
    expect(engine.getState().player2.roundsWon).toBe(0);
  });
});

// =============================================================================
// RESOLUTION MATRIX VERIFICATION
// =============================================================================

describe('Resolution Matrix - Verification', () => {
  const moves: MoveType[] = ['punch', 'kick', 'block', 'special', 'stunned'];

  it('should have all move combinations defined', () => {
    for (const attackerMove of moves) {
      for (const defenderMove of moves) {
        expect(RESOLUTION_MATRIX[attackerMove][defenderMove]).toBeDefined();
      }
    }
  });

  it('punch should stagger against kick', () => {
    expect(RESOLUTION_MATRIX.punch.kick).toBe('staggered');
  });

  it('kick should be reflected against block', () => {
    expect(RESOLUTION_MATRIX.kick.block).toBe('reflected');
  });

  it('block should be shattered against special', () => {
    expect(RESOLUTION_MATRIX.block.special).toBe('shattered');
  });

  it('special should miss against punch', () => {
    expect(RESOLUTION_MATRIX.special.punch).toBe('missed');
  });
});

// =============================================================================
// BASE MOVE STATS VERIFICATION
// =============================================================================

describe('Base Move Stats - Verification', () => {
  it('punch should have correct stats', () => {
    expect(BASE_MOVE_STATS.punch.damage).toBe(10);
    expect(BASE_MOVE_STATS.punch.energyCost).toBe(0);
    expect(BASE_MOVE_STATS.punch.priority).toBe(3);
  });

  it('kick should have correct stats', () => {
    expect(BASE_MOVE_STATS.kick.damage).toBe(15);
    expect(BASE_MOVE_STATS.kick.energyCost).toBe(25);
    expect(BASE_MOVE_STATS.kick.priority).toBe(2);
  });

  it('block should have correct stats', () => {
    expect(BASE_MOVE_STATS.block.damage).toBe(0);
    expect(BASE_MOVE_STATS.block.energyCost).toBe(0);
    expect(BASE_MOVE_STATS.block.priority).toBe(4);
  });

  it('special should have correct stats', () => {
    expect(BASE_MOVE_STATS.special.damage).toBe(25);
    expect(BASE_MOVE_STATS.special.energyCost).toBe(50);
    expect(BASE_MOVE_STATS.special.priority).toBe(1);
  });

  it('stunned should have zero stats', () => {
    expect(BASE_MOVE_STATS.stunned.damage).toBe(0);
    expect(BASE_MOVE_STATS.stunned.energyCost).toBe(0);
    expect(BASE_MOVE_STATS.stunned.priority).toBe(0);
  });
});

// =============================================================================
// COMBAT CONSTANTS VERIFICATION
// =============================================================================

describe('Combat Constants - Verification', () => {
  it('should have valid energy regen', () => {
    expect(COMBAT_CONSTANTS.BASE_ENERGY_REGEN).toBeGreaterThan(0);
  });

  it('should have valid guard buildup values', () => {
    expect(COMBAT_CONSTANTS.GUARD_BUILDUP_ON_BLOCK).toBeGreaterThan(0);
    expect(COMBAT_CONSTANTS.GUARD_BUILDUP_ON_HIT).toBeGreaterThan(0);
  });

  it('should have valid guard break threshold', () => {
    expect(COMBAT_CONSTANTS.GUARD_BREAK_THRESHOLD).toBe(100);
  });

  it('should have valid damage modifiers', () => {
    expect(COMBAT_CONSTANTS.SHATTER_DAMAGE_MULTIPLIER).toBeGreaterThan(1);
    expect(COMBAT_CONSTANTS.BLOCK_DAMAGE_REDUCTION).toBeLessThan(1);
    expect(COMBAT_CONSTANTS.KICK_REFLECT_PERCENT).toBeGreaterThan(0);
    expect(COMBAT_CONSTANTS.KICK_REFLECT_PERCENT).toBeLessThan(1);
  });
});
