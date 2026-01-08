// Achievement System Types

/**
 * Achievement Categories
 */
export type AchievementCategory =
  | 'combat'
  | 'progression'
  | 'social'
  | 'collection'
  | 'mastery';

/**
 * Achievement Tier
 */
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

/**
 * Achievement Definition
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  iconUrl: string;
  xpReward: number;
  currencyReward: number;
  badgeReward?: string; // Cosmetic badge ID
  requirement: AchievementRequirement;
  isSecret: boolean; // Hidden until unlocked
  displayOrder: number;
}

/**
 * Achievement Requirement Specification
 */
export interface AchievementRequirement {
  type: 'counter' | 'milestone' | 'collection' | 'conditional';
  targetValue?: number;
  conditions?: Record<string, any>;
  trackingKey: string; // Database field to track (e.g., 'total_wins', 'damage_dealt')
}

/**
 * Player Achievement Progress
 */
export interface PlayerAchievement {
  playerId: string;
  achievementId: string;
  achievement: Achievement;
  currentProgress: number;
  targetProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progressPercentage: number;
}

/**
 * Achievement Unlock Event
 */
export interface AchievementUnlock {
  playerId: string;
  achievementId: string;
  unlockedAt: Date;
  xpAwarded: number;
  currencyAwarded: number;
  badgeAwarded?: string;
}

/**
 * Achievement Category Statistics
 */
export interface AchievementCategoryStats {
  category: AchievementCategory;
  totalAchievements: number;
  unlockedAchievements: number;
  progressPercentage: number;
  xpEarned: number;
  currencyEarned: number;
}

/**
 * Player Achievement Summary
 */
export interface PlayerAchievementSummary {
  playerId: string;
  totalAchievements: number;
  unlockedAchievements: number;
  totalXPEarned: number;
  totalCurrencyEarned: number;
  categoryStats: AchievementCategoryStats[];
  recentUnlocks: PlayerAchievement[];
  nextMilestones: PlayerAchievement[];
}
