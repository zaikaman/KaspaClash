// Daily Quest System Types

/**
 * Quest Difficulty Levels
 */
export type QuestDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Quest Objective Types
 */
export type QuestObjectiveType =
  | 'win_matches'
  | 'play_matches'
  | 'deal_damage'
  | 'defeat_opponents'
  | 'use_character'
  | 'use_ability'
  | 'execute_combo'
  | 'win_streak'
  | 'survival_waves'
  | 'combo_challenge_stars';

/**
 * Quest Template Definition
 */
export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  objectiveType: QuestObjectiveType;
  targetValue: number;
  difficulty: QuestDifficulty;
  xpReward: number;
  currencyReward: number;
  isActive: boolean;
}

/**
 * Daily Quest Instance (Assigned to Player)
 */
export interface DailyQuest {
  id: string;
  playerId: string;
  templateId: string;
  template: QuestTemplate;
  assignedDate: Date;
  expiresAt: Date;
  currentProgress: number;
  targetProgress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  claimedAt?: Date;
}

/**
 * Quest Progress Update
 */
export interface QuestProgress {
  questId: string;
  playerId: string;
  increment: number;
  currentValue: number;
  isCompleted: boolean;
  timestamp: Date;
}

/**
 * Quest Claim Result
 */
export interface QuestClaimResult {
  questId: string;
  success: boolean;
  xpAwarded: number;
  currencyAwarded: number;
  newQuestAssigned?: DailyQuest;
}

/**
 * Quest Daily Set (3 Quests: Easy, Medium, Hard)
 */
export interface DailyQuestSet {
  playerId: string;
  date: Date;
  quests: DailyQuest[];
  allCompleted: boolean;
  allClaimed: boolean;
}

/**
 * Quest Statistics
 */
export interface QuestStatistics {
  playerId: string;
  totalQuestsCompleted: number;
  totalQuestsClaimed: number;
  totalXPEarned: number;
  totalCurrencyEarned: number;
  currentStreak: number;
  longestStreak: number;
}
