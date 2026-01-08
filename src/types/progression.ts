// Battle Pass & Progression System Types

/**
 * Battle Pass Season Configuration
 */
export interface BattlePassSeason {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  tierCount: number;
  isActive: boolean;
  version: number;
}

/**
 * Battle Pass Tier Configuration
 */
export interface BattlePassTier {
  id: string;
  seasonId: string;
  tierNumber: number;
  xpRequired: number;
  rewards: TierReward[];
  isPremium: boolean;
}

/**
 * Tier Reward (Cosmetic or Currency)
 */
export interface TierReward {
  type: 'cosmetic' | 'currency' | 'achievement_badge';
  itemId?: string;
  currencyAmount?: number;
  currencyType?: 'clash_shards';
}

/**
 * Player Progression State
 */
export interface PlayerProgression {
  playerId: string;
  seasonId: string;
  currentTier: number;
  currentXP: number;
  totalXP: number;
  prestigeLevel: number;
  lastUpdated: Date;
}

/**
 * XP Award Source
 */
export type XPSource =
  | 'match_win'
  | 'match_loss'
  | 'match_draw'
  | 'daily_quest'
  | 'achievement'
  | 'survival_mode'
  | 'combo_challenge';

/**
 * XP Award Transaction
 */
export interface XPAward {
  playerId: string;
  amount: number;
  source: XPSource;
  sourceId?: string;
  multiplier?: number;
  timestamp: Date;
}

/**
 * XP Calculation Result
 */
export interface XPCalculation {
  baseXP: number;
  prestigeMultiplier: number;
  finalXP: number;
  newTier: number;
  tierUpCount: number;
  rewards: TierReward[];
}

/**
 * Prestige Status
 */
export interface PrestigeStatus {
  playerId: string;
  level: number;
  xpMultiplier: number;
  currencyMultiplier: number;
  totalResets: number;
  lastPrestigeDate?: Date;
  eligibleForPrestige: boolean;
}

/**
 * Season Transition Result
 */
export interface SeasonTransition {
  oldSeasonId: string;
  newSeasonId: string;
  playersAffected: number;
  rewardsDistributed: number;
  transitionDate: Date;
}
