// Tier Reward Distribution Logic
// Handles reward granting when players unlock battle pass tiers

import type { TierReward, BattlePassTier } from '@/types/progression';

/**
 * Get rewards for a specific tier
 */
export function getTierRewards(tier: number, isPremium: boolean = false): TierReward[] {
  const rewards: TierReward[] = [];

  // Every tier gives Clash Shards
  const shardAmount = calculateShardReward(tier);
  rewards.push({
    type: 'currency',
    currencyAmount: shardAmount,
    currencyType: 'clash_shards',
  });

  // Every 5 tiers: Common cosmetic
  if (tier % 5 === 0 && tier < 50) {
    rewards.push({
      type: 'cosmetic',
      itemId: `tier_${tier}_cosmetic_common`,
    });
  }

  // Every 10 tiers: Rare cosmetic
  if (tier % 10 === 0 && tier < 50) {
    rewards.push({
      type: 'cosmetic',
      itemId: `tier_${tier}_cosmetic_rare`,
    });
  }

  // Milestone tiers (25, 50): Epic cosmetic
  if (tier === 25 || tier === 50) {
    rewards.push({
      type: 'cosmetic',
      itemId: `tier_${tier}_cosmetic_epic`,
    });
  }

  // Tier 50: Legendary cosmetic + achievement badge
  if (tier === 50) {
    rewards.push({
      type: 'cosmetic',
      itemId: `tier_50_cosmetic_legendary`,
    });
    rewards.push({
      type: 'achievement_badge',
      itemId: `badge_season_complete`,
    });
  }

  // Premium rewards (if battle pass purchased)
  if (isPremium) {
    rewards.push(...getPremiumTierRewards(tier));
  }

  return rewards;
}

/**
 * Calculate Clash Shards reward for tier
 */
function calculateShardReward(tier: number): number {
  // Base: 50 shards per tier
  // Increases every 10 tiers
  const baseShard = 50;
  const tierBonus = Math.floor(tier / 10) * 25;
  return baseShard + tierBonus;
}

/**
 * Get premium-only rewards for tier
 */
function getPremiumTierRewards(tier: number): TierReward[] {
  const premiumRewards: TierReward[] = [];

  // Double Clash Shards for premium
  const shardAmount = calculateShardReward(tier);
  premiumRewards.push({
    type: 'currency',
    currencyAmount: shardAmount,
    currencyType: 'clash_shards',
  });

  // Premium cosmetics every 3 tiers
  if (tier % 3 === 0) {
    premiumRewards.push({
      type: 'cosmetic',
      itemId: `tier_${tier}_premium_cosmetic`,
    });
  }

  return premiumRewards;
}

/**
 * Distribute rewards to player inventory
 */
export async function distributeRewards(
  playerId: string,
  rewards: TierReward[]
): Promise<{
  success: boolean;
  currency: number;
  cosmetics: string[];
  badges: string[];
}> {
  let totalCurrency = 0;
  const cosmeticIds: string[] = [];
  const badgeIds: string[] = [];

  for (const reward of rewards) {
    switch (reward.type) {
      case 'currency':
        if (reward.currencyAmount) {
          totalCurrency += reward.currencyAmount;
        }
        break;
      case 'cosmetic':
        if (reward.itemId) {
          cosmeticIds.push(reward.itemId);
        }
        break;
      case 'achievement_badge':
        if (reward.itemId) {
          badgeIds.push(reward.itemId);
        }
        break;
    }
  }

  // Note: Actual database updates will be handled by API routes
  // This function provides the structured data for reward distribution

  return {
    success: true,
    currency: totalCurrency,
    cosmetics: cosmeticIds,
    badges: badgeIds,
  };
}

/**
 * Get all rewards for a tier range (used for visual display)
 */
export function getRewardsForTierRange(startTier: number, endTier: number, isPremium: boolean = false): {
  tier: number;
  rewards: TierReward[];
}[] {
  const tierRewards: { tier: number; rewards: TierReward[] }[] = [];

  for (let tier = startTier; tier <= endTier; tier++) {
    tierRewards.push({
      tier,
      rewards: getTierRewards(tier, isPremium),
    });
  }

  return tierRewards;
}

/**
 * Calculate total rewards for season completion
 */
export function calculateSeasonTotalRewards(maxTier: number = 50, isPremium: boolean = false): {
  totalShards: number;
  totalCosmetics: number;
  totalBadges: number;
} {
  let totalShards = 0;
  let totalCosmetics = 0;
  let totalBadges = 0;

  for (let tier = 1; tier <= maxTier; tier++) {
    const rewards = getTierRewards(tier, isPremium);
    for (const reward of rewards) {
      switch (reward.type) {
        case 'currency':
          totalShards += reward.currencyAmount || 0;
          break;
        case 'cosmetic':
          totalCosmetics++;
          break;
        case 'achievement_badge':
          totalBadges++;
          break;
      }
    }
  }

  return {
    totalShards,
    totalCosmetics,
    totalBadges,
  };
}

/**
 * Check if player has unlocked specific reward
 */
export function hasUnlockedReward(currentTier: number, rewardTier: number): boolean {
  return currentTier >= rewardTier;
}

/**
 * Get next milestone tier with significant reward
 */
export function getNextMilestone(currentTier: number): {
  tier: number;
  rewards: TierReward[];
} | null {
  const milestones = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  const nextMilestone = milestones.find((m) => m > currentTier);

  if (!nextMilestone) return null;

  return {
    tier: nextMilestone,
    rewards: getTierRewards(nextMilestone, false),
  };
}
