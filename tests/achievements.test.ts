/**
 * Achievement System Unit Tests
 * 
 * Tests for achievement tracking and evaluation:
 * - Progress calculation
 * - Completion detection
 * - Category statistics
 * - Newly completed achievements
 */

import { describe, it, expect } from 'vitest';
import {
  calculateProgress,
  isComplete,
  getPlayerAchievements,
  findNewlyCompleted,
  getCategoryStats,
  DEFAULT_PLAYER_STATS,
  type PlayerStats,
} from '@/lib/achievements/achievement-tracker';
import {
  evaluateAchievement,
  evaluateAllAchievements,
  findEligibleUnlocks,
  calculateUnlockRewards,
} from '@/lib/achievements/achievement-evaluator';
import {
  ALL_ACHIEVEMENTS,
  COMBAT_ACHIEVEMENTS,
  getAchievementById,
  getAchievementsByCategory,
} from '@/lib/achievements/achievement-definitions';
import type { Achievement } from '@/types/achievement';

// =============================================================================
// TEST HELPERS
// =============================================================================

function createStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return { ...DEFAULT_PLAYER_STATS, ...overrides };
}

// =============================================================================
// DEFAULT STATS
// =============================================================================

describe('Achievement System - Default Stats', () => {
  it('should have all default stats initialized to 0', () => {
    const stats = DEFAULT_PLAYER_STATS;
    
    expect(stats.total_wins).toBe(0);
    expect(stats.total_losses).toBe(0);
    expect(stats.total_combos).toBe(0);
    expect(stats.total_damage_dealt).toBe(0);
    expect(stats.total_blocks).toBe(0);
    expect(stats.perfect_rounds).toBe(0);
    expect(stats.win_streak).toBe(0);
  });
});

// =============================================================================
// PROGRESS CALCULATION
// =============================================================================

describe('Achievement System - calculateProgress', () => {
  it('should return 0 for achievements with no progress', () => {
    const stats = createStats();
    const achievement = getAchievementById('c01')!; // First Blood (1 win)
    
    expect(calculateProgress(achievement, stats)).toBe(0);
  });

  it('should return correct progress for wins', () => {
    const stats = createStats({ total_wins: 5 });
    const achievement = getAchievementById('c01')!; // First Blood
    
    expect(calculateProgress(achievement, stats)).toBe(5);
  });

  it('should return correct progress for combos', () => {
    const stats = createStats({ total_combos: 25 });
    const achievement = getAchievementById('c02')!; // Combo Starter (10 combos)
    
    expect(calculateProgress(achievement, stats)).toBe(25);
  });

  it('should return correct progress for damage', () => {
    const stats = createStats({ total_damage_dealt: 5000 });
    const achievement = getAchievementById('c03')!; // Damage Dealer (1000 damage)
    
    expect(calculateProgress(achievement, stats)).toBe(5000);
  });

  it('should return correct progress for blocks', () => {
    const stats = createStats({ total_blocks: 15 });
    const achievement = getAchievementById('c04')!; // Block Master (25 blocks)
    
    expect(calculateProgress(achievement, stats)).toBe(15);
  });
});

// =============================================================================
// COMPLETION DETECTION
// =============================================================================

describe('Achievement System - isComplete', () => {
  it('should return false for incomplete achievements', () => {
    const stats = createStats({ total_wins: 0 });
    const achievement = getAchievementById('c01')!;
    
    expect(isComplete(achievement, stats)).toBe(false);
  });

  it('should return true when target is exactly met', () => {
    const stats = createStats({ total_wins: 1 });
    const achievement = getAchievementById('c01')!; // 1 win required
    
    expect(isComplete(achievement, stats)).toBe(true);
  });

  it('should return true when target is exceeded', () => {
    const stats = createStats({ total_wins: 100 });
    const achievement = getAchievementById('c01')!;
    
    expect(isComplete(achievement, stats)).toBe(true);
  });

  it('should return false when just below target', () => {
    const stats = createStats({ total_combos: 9 });
    const achievement = getAchievementById('c02')!; // 10 combos required
    
    expect(isComplete(achievement, stats)).toBe(false);
  });
});

// =============================================================================
// FIND NEWLY COMPLETED
// =============================================================================

describe('Achievement System - findNewlyCompleted', () => {
  it('should return empty array when no achievements completed', () => {
    const stats = createStats();
    const unlocked = new Set<string>();
    
    const newly = findNewlyCompleted(stats, unlocked);
    
    expect(newly).toEqual([]);
  });

  it('should find newly completed achievements', () => {
    const stats = createStats({ total_wins: 1 });
    const unlocked = new Set<string>();
    
    const newly = findNewlyCompleted(stats, unlocked);
    
    expect(newly.length).toBeGreaterThan(0);
    expect(newly.some(a => a.id === 'c01')).toBe(true);
  });

  it('should not include already unlocked achievements', () => {
    const stats = createStats({ total_wins: 1 });
    const unlocked = new Set<string>(['c01']);
    
    const newly = findNewlyCompleted(stats, unlocked);
    
    expect(newly.some(a => a.id === 'c01')).toBe(false);
  });

  it('should find multiple newly completed achievements', () => {
    const stats = createStats({
      total_wins: 10,
      total_combos: 50,
      total_damage_dealt: 10000,
    });
    const unlocked = new Set<string>();
    
    const newly = findNewlyCompleted(stats, unlocked);
    
    expect(newly.length).toBeGreaterThan(1);
  });
});

// =============================================================================
// PLAYER ACHIEVEMENTS
// =============================================================================

describe('Achievement System - getPlayerAchievements', () => {
  it('should return all achievements with progress', () => {
    const stats = createStats();
    const unlocked = new Set<string>();
    
    const achievements = getPlayerAchievements('player1', stats, unlocked);
    
    expect(achievements.length).toBe(ALL_ACHIEVEMENTS.length);
  });

  it('should calculate progress percentage correctly', () => {
    const stats = createStats({ total_combos: 5 });
    const unlocked = new Set<string>();
    
    const achievements = getPlayerAchievements('player1', stats, unlocked);
    const comboAchievement = achievements.find(a => a.achievementId === 'c02');
    
    expect(comboAchievement).toBeDefined();
    expect(comboAchievement!.progressPercentage).toBe(50); // 5/10 * 100
  });

  it('should cap progress percentage at 100', () => {
    const stats = createStats({ total_wins: 100 });
    const unlocked = new Set<string>(['c01']);
    
    const achievements = getPlayerAchievements('player1', stats, unlocked);
    const winAchievement = achievements.find(a => a.achievementId === 'c01');
    
    expect(winAchievement!.progressPercentage).toBe(100);
  });

  it('should mark unlocked achievements correctly', () => {
    const stats = createStats({ total_wins: 1 });
    const unlocked = new Set<string>(['c01']);
    
    const achievements = getPlayerAchievements('player1', stats, unlocked);
    const winAchievement = achievements.find(a => a.achievementId === 'c01');
    
    expect(winAchievement!.isUnlocked).toBe(true);
  });

  it('should include player ID in results', () => {
    const achievements = getPlayerAchievements('test-player-123', createStats(), new Set());
    
    expect(achievements[0].playerId).toBe('test-player-123');
  });
});

// =============================================================================
// CATEGORY STATISTICS
// =============================================================================

describe('Achievement System - getCategoryStats', () => {
  it('should return stats for all 5 categories', () => {
    const stats = createStats();
    const unlocked = new Set<string>();
    
    const categoryStats = getCategoryStats(stats, unlocked);
    
    expect(categoryStats.length).toBe(5);
    expect(categoryStats.map(c => c.category)).toContain('combat');
    expect(categoryStats.map(c => c.category)).toContain('progression');
    expect(categoryStats.map(c => c.category)).toContain('social');
    expect(categoryStats.map(c => c.category)).toContain('collection');
    expect(categoryStats.map(c => c.category)).toContain('mastery');
  });

  it('should show 0% progress when nothing unlocked', () => {
    const stats = createStats();
    const unlocked = new Set<string>();
    
    const categoryStats = getCategoryStats(stats, unlocked);
    
    categoryStats.forEach(cat => {
      expect(cat.unlockedAchievements).toBe(0);
      expect(cat.progressPercentage).toBe(0);
    });
  });

  it('should calculate XP earned correctly', () => {
    const stats = createStats({ total_wins: 1 });
    const unlocked = new Set<string>(['c01']); // First Blood
    
    const categoryStats = getCategoryStats(stats, unlocked);
    const combatStats = categoryStats.find(c => c.category === 'combat');
    
    expect(combatStats!.xpEarned).toBeGreaterThan(0);
    expect(combatStats!.unlockedAchievements).toBe(1);
  });

  it('should calculate progress percentage correctly', () => {
    const combatAchievements = getAchievementsByCategory('combat');
    const halfUnlocked = combatAchievements.slice(0, Math.floor(combatAchievements.length / 2));
    const unlocked = new Set<string>(halfUnlocked.map(a => a.id));
    
    const categoryStats = getCategoryStats(createStats(), unlocked);
    const combatStats = categoryStats.find(c => c.category === 'combat');
    
    expect(combatStats!.progressPercentage).toBeCloseTo(50, -1);
  });
});

// =============================================================================
// ACHIEVEMENT EVALUATION
// =============================================================================

describe('Achievement System - evaluateAchievement', () => {
  it('should return null for invalid achievement ID', () => {
    const result = evaluateAchievement('invalid-id', createStats(), new Set());
    expect(result).toBeNull();
  });

  it('should evaluate eligible achievement correctly', () => {
    const stats = createStats({ total_wins: 1 });
    const result = evaluateAchievement('c01', stats, new Set());
    
    expect(result).not.toBeNull();
    expect(result!.isEligible).toBe(true);
    expect(result!.currentProgress).toBe(1);
    expect(result!.targetProgress).toBe(1);
    expect(result!.progressPercentage).toBe(100);
  });

  it('should not be eligible if already unlocked', () => {
    const stats = createStats({ total_wins: 1 });
    const result = evaluateAchievement('c01', stats, new Set(['c01']));
    
    expect(result!.isEligible).toBe(false);
  });

  it('should not be eligible if progress insufficient', () => {
    const stats = createStats({ total_wins: 0 });
    const result = evaluateAchievement('c01', stats, new Set());
    
    expect(result!.isEligible).toBe(false);
    expect(result!.progressPercentage).toBe(0);
  });
});

describe('Achievement System - evaluateAllAchievements', () => {
  it('should evaluate all achievements', () => {
    const stats = createStats();
    const results = evaluateAllAchievements(stats, new Set());
    
    expect(results.length).toBe(ALL_ACHIEVEMENTS.length);
  });

  it('should mark eligible achievements correctly', () => {
    const stats = createStats({
      total_wins: 100,
      total_combos: 500,
      total_damage_dealt: 100000,
    });
    const results = evaluateAllAchievements(stats, new Set());
    const eligible = results.filter(r => r.isEligible);
    
    expect(eligible.length).toBeGreaterThan(0);
  });
});

describe('Achievement System - findEligibleUnlocks', () => {
  it('should find all eligible achievements', () => {
    const stats = createStats({
      total_wins: 1,
      total_combos: 10,
    });
    const eligible = findEligibleUnlocks(stats, new Set());
    
    expect(eligible.some(a => a.id === 'c01')).toBe(true);
    expect(eligible.some(a => a.id === 'c02')).toBe(true);
  });

  it('should exclude already unlocked', () => {
    const stats = createStats({ total_wins: 1 });
    const eligible = findEligibleUnlocks(stats, new Set(['c01']));
    
    expect(eligible.some(a => a.id === 'c01')).toBe(false);
  });
});

// =============================================================================
// REWARD CALCULATION
// =============================================================================

describe('Achievement System - calculateUnlockRewards', () => {
  it('should return correct rewards for bronze tier', () => {
    const achievement = COMBAT_ACHIEVEMENTS.find(a => a.tier === 'bronze')!;
    const rewards = calculateUnlockRewards(achievement);
    
    expect(rewards.xp).toBe(250);
    expect(rewards.currency).toBe(25);
  });

  it('should return correct rewards for silver tier', () => {
    const achievement = COMBAT_ACHIEVEMENTS.find(a => a.tier === 'silver')!;
    const rewards = calculateUnlockRewards(achievement);
    
    expect(rewards.xp).toBe(500);
    expect(rewards.currency).toBe(50);
  });

  it('should return correct rewards for gold tier', () => {
    const achievement = COMBAT_ACHIEVEMENTS.find(a => a.tier === 'gold')!;
    const rewards = calculateUnlockRewards(achievement);
    
    expect(rewards.xp).toBe(1000);
    expect(rewards.currency).toBe(100);
  });

  it('should include badge if achievement has one', () => {
    const achievement: Achievement = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      category: 'combat',
      tier: 'bronze',
      iconUrl: '',
      xpReward: 100,
      currencyReward: 10,
      badgeReward: 'special-badge',
      requirement: { type: 'counter', targetValue: 1, trackingKey: 'total_wins' },
      isSecret: false,
      displayOrder: 1,
    };
    
    const rewards = calculateUnlockRewards(achievement);
    expect(rewards.badge).toBe('special-badge');
  });
});

// =============================================================================
// ACHIEVEMENT DEFINITIONS
// =============================================================================

describe('Achievement Definitions', () => {
  it('should have unique IDs for all achievements', () => {
    const ids = ALL_ACHIEVEMENTS.map(a => a.id);
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have valid categories for all achievements', () => {
    const validCategories = ['combat', 'progression', 'social', 'collection', 'mastery'];
    
    ALL_ACHIEVEMENTS.forEach(achievement => {
      expect(validCategories).toContain(achievement.category);
    });
  });

  it('should have valid tiers for all achievements', () => {
    const validTiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    
    ALL_ACHIEVEMENTS.forEach(achievement => {
      expect(validTiers).toContain(achievement.tier);
    });
  });

  it('should have positive rewards for all achievements', () => {
    ALL_ACHIEVEMENTS.forEach(achievement => {
      expect(achievement.xpReward).toBeGreaterThan(0);
      expect(achievement.currencyReward).toBeGreaterThan(0);
    });
  });

  it('should have required fields for all achievements', () => {
    ALL_ACHIEVEMENTS.forEach(achievement => {
      expect(achievement.id).toBeDefined();
      expect(achievement.name).toBeDefined();
      expect(achievement.description).toBeDefined();
      expect(achievement.requirement).toBeDefined();
      expect(achievement.requirement.trackingKey).toBeDefined();
    });
  });

  it('getAchievementById should return correct achievement', () => {
    const achievement = getAchievementById('c01');
    
    expect(achievement).toBeDefined();
    expect(achievement!.name).toBe('First Blood');
  });

  it('getAchievementById should return undefined for invalid ID', () => {
    const achievement = getAchievementById('invalid-id');
    expect(achievement).toBeUndefined();
  });

  it('getAchievementsByCategory should return correct achievements', () => {
    const combatAchievements = getAchievementsByCategory('combat');
    
    expect(combatAchievements.length).toBeGreaterThan(0);
    combatAchievements.forEach(a => {
      expect(a.category).toBe('combat');
    });
  });
});
