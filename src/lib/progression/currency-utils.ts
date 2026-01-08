// Clash Shards Currency Utilities
// Handles currency balance, transactions, and validation

import type { CurrencyTransaction, PlayerCurrency } from '@/types/cosmetic';

/**
 * Currency transaction sources
 */
export const CURRENCY_SOURCES = {
  // Earning sources
  MATCH_WIN: 'match_win',
  MATCH_LOSS: 'match_loss',
  TIER_UNLOCK: 'tier_unlock',
  QUEST_CLAIM: 'quest_claim',
  ACHIEVEMENT_UNLOCK: 'achievement_unlock',
  PRESTIGE_REWARD: 'prestige_reward',
  DAILY_BONUS: 'daily_bonus',

  // Spending sources
  SHOP_PURCHASE: 'shop_purchase',
  COSMETIC_PURCHASE: 'cosmetic_purchase',
  PREMIUM_UPGRADE: 'premium_upgrade',
} as const;

/**
 * Currency earning rates
 */
export const CURRENCY_EARN_RATES = {
  MATCH_WIN: 50,
  MATCH_LOSS: 25,
  TIER_UNLOCK_BASE: 50, // Increases with tier
  QUEST_EASY: 100,
  QUEST_MEDIUM: 200,
  QUEST_HARD: 300,
  ACHIEVEMENT_BASE: 100, // Varies by achievement tier
  FIRST_WIN_BONUS: 50,
} as const;

/**
 * Calculate currency award for match completion
 */
export function calculateMatchCurrency(won: boolean, roundsWon: number): number {
  const base = won ? CURRENCY_EARN_RATES.MATCH_WIN : CURRENCY_EARN_RATES.MATCH_LOSS;
  const roundBonus = roundsWon * 10;
  return base + roundBonus;
}

/**
 * Calculate currency award for quest completion
 */
export function calculateQuestCurrency(difficulty: 'easy' | 'medium' | 'hard'): number {
  switch (difficulty) {
    case 'easy':
      return CURRENCY_EARN_RATES.QUEST_EASY;
    case 'medium':
      return CURRENCY_EARN_RATES.QUEST_MEDIUM;
    case 'hard':
      return CURRENCY_EARN_RATES.QUEST_HARD;
    default:
      return 0;
  }
}

/**
 * Calculate currency award for achievement unlock
 */
export function calculateAchievementCurrency(tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'): number {
  const multipliers = {
    bronze: 1,
    silver: 2,
    gold: 3,
    platinum: 5,
    diamond: 10,
  };
  return CURRENCY_EARN_RATES.ACHIEVEMENT_BASE * multipliers[tier];
}

/**
 * Apply prestige multiplier to currency award
 */
export function applyPrestigeCurrencyMultiplier(baseCurrency: number, prestigeLevel: number): number {
  // +10% currency per prestige level (compounding)
  const multiplier = Math.pow(1.1, prestigeLevel);
  return Math.floor(baseCurrency * multiplier);
}

/**
 * Validate if player can afford purchase
 */
export function canAffordPurchase(currentBalance: number, price: number): boolean {
  return currentBalance >= price;
}

/**
 * Calculate new balance after transaction
 */
export function calculateNewBalance(
  currentBalance: number,
  amount: number,
  type: 'earn' | 'spend'
): number {
  if (type === 'earn') {
    return currentBalance + amount;
  } else {
    const newBalance = currentBalance - amount;
    if (newBalance < 0) {
      throw new Error('Insufficient funds');
    }
    return newBalance;
  }
}

/**
 * Create currency transaction record
 */
export function createTransaction(params: {
  playerId: string;
  amount: number;
  type: 'earn' | 'spend';
  source: string;
  balanceBefore: number;
  balanceAfter: number;
  metadata?: Record<string, any>;
}): Omit<CurrencyTransaction, 'id' | 'timestamp'> {
  return {
    playerId: params.playerId,
    amount: params.amount,
    type: params.type,
    source: params.source,
    balanceBefore: params.balanceBefore,
    balanceAfter: params.balanceAfter,
    metadata: params.metadata || {},
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) {
    return '0';
  }
  return amount.toLocaleString();
}

/**
 * Get currency change display (with +/- sign)
 */
export function formatCurrencyChange(amount: number, type: 'earn' | 'spend'): string {
  const prefix = type === 'earn' ? '+' : '-';
  return `${prefix}${formatCurrency(Math.abs(amount))}`;
}

/**
 * Calculate total earnings from source breakdown
 */
export function calculateTotalEarnings(breakdown: Record<string, number>): number {
  return Object.values(breakdown).reduce((sum, amount) => sum + amount, 0);
}

/**
 * Get currency earning statistics
 */
export function getCurrencyStats(params: {
  totalEarned: number;
  totalSpent: number;
  currentBalance: number;
}): {
  netEarnings: number;
  spendingRate: number; // Percentage of earnings spent
  averageBalance: number;
} {
  const { totalEarned, totalSpent, currentBalance } = params;
  const netEarnings = totalEarned - totalSpent;
  const spendingRate = totalEarned > 0 ? (totalSpent / totalEarned) * 100 : 0;
  const averageBalance = (currentBalance + totalSpent) / 2;

  return {
    netEarnings,
    spendingRate,
    averageBalance,
  };
}

/**
 * Estimate time to earn target amount
 */
export function estimateEarningTime(params: {
  targetAmount: number;
  currentBalance: number;
  averageEarningsPerHour: number;
}): {
  amountNeeded: number;
  hoursRequired: number;
  matchesRequired: number; // Assuming 50 shards per match average
} {
  const { targetAmount, currentBalance, averageEarningsPerHour } = params;
  const amountNeeded = Math.max(0, targetAmount - currentBalance);
  const hoursRequired = Math.ceil(amountNeeded / averageEarningsPerHour);
  const matchesRequired = Math.ceil(amountNeeded / 50);

  return {
    amountNeeded,
    hoursRequired,
    matchesRequired,
  };
}

/**
 * Validate transaction amount
 */
export function validateTransactionAmount(amount: number): boolean {
  return amount > 0 && Number.isInteger(amount) && amount < 1000000;
}

/**
 * Get currency source display name
 */
export function getCurrencySourceName(source: string): string {
  const sourceNames: Record<string, string> = {
    [CURRENCY_SOURCES.MATCH_WIN]: 'Match Victory',
    [CURRENCY_SOURCES.MATCH_LOSS]: 'Match Participation',
    [CURRENCY_SOURCES.TIER_UNLOCK]: 'Battle Pass Tier',
    [CURRENCY_SOURCES.QUEST_CLAIM]: 'Daily Quest',
    [CURRENCY_SOURCES.ACHIEVEMENT_UNLOCK]: 'Achievement',
    [CURRENCY_SOURCES.PRESTIGE_REWARD]: 'Prestige Bonus',
    [CURRENCY_SOURCES.DAILY_BONUS]: 'Daily Bonus',
    [CURRENCY_SOURCES.SHOP_PURCHASE]: 'Shop Purchase',
    [CURRENCY_SOURCES.COSMETIC_PURCHASE]: 'Cosmetic Purchase',
    [CURRENCY_SOURCES.PREMIUM_UPGRADE]: 'Premium Upgrade',
  };
  return sourceNames[source] || source;
}
