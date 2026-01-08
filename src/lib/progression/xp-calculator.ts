// XP Calculator - Hybrid Exponential-Linear Curve
// Implements the battle pass XP progression formula from research.md

import type { XPSource, XPAward, XPCalculation } from '@/types/progression';

/**
 * Calculate XP required for a specific tier
 * Uses hybrid exponential-linear curve for balanced progression
 */
export function calculateXPForTier(tier: number): number {
  if (tier <= 0) return 0;
  if (tier === 1) return 0; // Tier 1 requires 0 XP (starting tier)

  if (tier <= 20) {
    // Early tiers: exponential for quick wins
    // Base: 1000 XP, Growth: 1.08 per tier
    return Math.floor(1000 * Math.pow(1.08, tier - 1));
  } else if (tier <= 40) {
    // Mid tiers: linear for consistent feel
    // Start at tier 20 value + 500 XP per tier
    const tier20XP = Math.floor(1000 * Math.pow(1.08, 19));
    return tier20XP + (tier - 20) * 500;
  } else {
    // Final tiers: slight exponential for endgame challenge
    const tier40XP = Math.floor(1000 * Math.pow(1.08, 19)) + 20 * 500;
    return tier40XP + Math.floor((tier - 40) * 800 * Math.pow(1.05, tier - 40));
  }
}

/**
 * Calculate cumulative XP required to reach a tier from tier 1
 */
export function calculateCumulativeXP(tier: number): number {
  let totalXP = 0;
  for (let t = 2; t <= tier; t++) {
    totalXP += calculateXPForTier(t);
  }
  return totalXP;
}

/**
 * Calculate which tier a player should be at given their total XP
 */
export function calculateTierFromXP(totalXP: number): number {
  if (totalXP <= 0) return 1;

  let tier = 1;
  let xpAccumulated = 0;

  for (let t = 2; t <= 50; t++) {
    const xpNeeded = calculateXPForTier(t);
    if (xpAccumulated + xpNeeded > totalXP) {
      break;
    }
    xpAccumulated += xpNeeded;
    tier = t;
  }

  return tier;
}

/**
 * Calculate XP progress within current tier
 */
export function calculateTierProgress(totalXP: number, currentTier: number): {
  currentXP: number;
  xpRequired: number;
  progressPercentage: number;
} {
  // Guard against invalid inputs
  const safeTotalXP = totalXP || 0;
  const safeTier = currentTier || 1;

  const cumulativeForCurrentTier = calculateCumulativeXP(safeTier);
  const currentXP = Math.max(0, safeTotalXP - cumulativeForCurrentTier);
  const xpRequired = calculateXPForTier(safeTier + 1) || 100;
  const progressPercentage = xpRequired > 0 ? Math.min(100, (currentXP / xpRequired) * 100) : 0;

  return {
    currentXP,
    xpRequired,
    progressPercentage,
  };
}

/**
 * Calculate base XP award for match completion
 */
export function calculateMatchXP(params: {
  won: boolean;
  roundsWon: number;
  roundsLost: number;
  perfectRounds: number;
  averageComboLength: number;
}): number {
  const { won, roundsWon, perfectRounds, averageComboLength } = params;

  // Base XP
  let baseXP = won ? 150 : 75;

  // Scale by rounds won (3-0 = max multiplier, 3-2 = lower multiplier)
  if (won) {
    const roundMultiplier = 1 + (roundsWon - 1) * 0.5; // 3 rounds = 2x, 4 rounds = 2.5x, 5 rounds = 3x
    baseXP *= roundMultiplier;
  } else {
    // Losing with rounds won still gives bonus
    baseXP += roundsWon * 25;
  }

  // Perfect round bonuses
  baseXP += perfectRounds * 50;

  // Combo efficiency bonus (0-50 XP based on average combo length)
  const comboBonus = Math.min(50, Math.floor(averageComboLength * 10));
  baseXP += comboBonus;

  return Math.floor(baseXP);
}

/**
 * Calculate XP award for quest completion
 */
export function calculateQuestXP(difficulty: 'easy' | 'medium' | 'hard'): number {
  switch (difficulty) {
    case 'easy':
      return 500;
    case 'medium':
      return 1000;
    case 'hard':
      return 1500;
    default:
      return 0;
  }
}

/**
 * Apply prestige multiplier to XP award
 */
export function applyPrestigeMultiplier(baseXP: number, prestigeLevel: number): number {
  // +10% XP per prestige level (compounding)
  const multiplier = Math.pow(1.1, prestigeLevel);
  return Math.floor(baseXP * multiplier);
}

/**
 * Calculate full XP award with multipliers and tier unlocks
 */
export function calculateXPAward(params: {
  baseXP: number;
  prestigeLevel: number;
  currentTotalXP: number;
  currentTier: number;
}): XPCalculation {
  const { baseXP, prestigeLevel, currentTotalXP, currentTier } = params;

  // Apply prestige multiplier
  const prestigeMultiplier = Math.pow(1.1, prestigeLevel);
  const finalXP = Math.floor(baseXP * prestigeMultiplier);

  // Calculate new total XP and tier
  const newTotalXP = currentTotalXP + finalXP;
  const newTier = calculateTierFromXP(newTotalXP);
  const tierUpCount = newTier - currentTier;

  // Collect rewards for each tier unlocked
  const rewards: any[] = []; // Will be populated by tier-rewards.ts

  return {
    baseXP,
    prestigeMultiplier,
    finalXP,
    newTier,
    tierUpCount,
    rewards,
  };
}

/**
 * Calculate XP for first win of day bonus
 */
export function calculateFirstWinBonus(): number {
  return 100;
}

/**
 * Get estimated playtime to reach target tier
 */
export function estimatePlaytime(currentTier: number, targetTier: number, averageXPPerHour: number = 2000): {
  xpRequired: number;
  hoursRequired: number;
  matchesRequired: number; // Assuming 200 XP per match average
} {
  const currentCumulativeXP = calculateCumulativeXP(currentTier);
  const targetCumulativeXP = calculateCumulativeXP(targetTier);
  const xpRequired = targetCumulativeXP - currentCumulativeXP;

  const hoursRequired = Math.ceil(xpRequired / averageXPPerHour);
  const matchesRequired = Math.ceil(xpRequired / 200);

  return {
    xpRequired,
    hoursRequired,
    matchesRequired,
  };
}

/**
 * Get XP breakdown statistics for season
 */
export function getSeasonXPStats() {
  return {
    tier1XP: calculateXPForTier(1),
    tier20XP: calculateXPForTier(20),
    tier40XP: calculateXPForTier(40),
    tier50XP: calculateXPForTier(50),
    totalXPForTier50: calculateCumulativeXP(50),
  };
}
