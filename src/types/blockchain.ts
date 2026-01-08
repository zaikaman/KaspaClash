// Blockchain Anchor & Verification Types

/**
 * Blockchain Anchor Types
 */
export type AnchorType =
  | 'leaderboard_rank'
  | 'prestige_level'
  | 'achievement_unlock'
  | 'season_completion';

/**
 * Blockchain Anchor Status
 */
export type AnchorStatus = 'pending' | 'broadcasting' | 'confirmed' | 'failed';

/**
 * Blockchain Anchor Record
 */
export interface BlockchainAnchor {
  id: string;
  playerId: string;
  anchorType: AnchorType;
  dataHash: string; // SHA-256 hash of anchored data
  dataPayload: Record<string, any>; // Original data (for verification)
  transactionId?: string; // Kaspa transaction hash
  blockHash?: string;
  blockHeight?: number;
  status: AnchorStatus;
  createdAt: Date;
  confirmedAt?: Date;
  errorMessage?: string;
}

/**
 * Leaderboard Rank Anchor Data
 */
export interface LeaderboardRankAnchor {
  playerId: string;
  walletAddress: string;
  rank: number;
  score: number;
  seasonId: string;
  timestamp: Date;
}

/**
 * Prestige Level Anchor Data
 */
export interface PrestigeLevelAnchor {
  playerId: string;
  walletAddress: string;
  prestigeLevel: number;
  totalXP: number;
  seasonId: string;
  timestamp: Date;
}

/**
 * Achievement Unlock Anchor Data
 */
export interface AchievementAnchor {
  playerId: string;
  walletAddress: string;
  achievementId: string;
  achievementName: string;
  unlockedAt: Date;
}

/**
 * Verification Badge
 */
export interface VerificationBadge {
  playerId: string;
  anchorId: string;
  badgeType: AnchorType;
  transactionId: string;
  blockHeight: number;
  verifiedAt: Date;
  explorerUrl: string; // Link to block explorer
}

/**
 * Wallet Connection State
 */
export interface WalletConnection {
  address: string;
  isConnected: boolean;
  network: 'mainnet' | 'testnet';
  balance?: number;
  provider: 'kasware' | 'other';
}

/**
 * Blockchain Verification Request
 */
export interface VerificationRequest {
  playerId: string;
  walletAddress: string;
  anchorType: AnchorType;
  dataPayload: Record<string, any>;
  requestedAt: Date;
}

/**
 * Blockchain Verification Result
 */
export interface VerificationResult {
  success: boolean;
  transactionId?: string;
  blockHeight?: number;
  explorerUrl?: string;
  errorMessage?: string;
  anchorRecord: BlockchainAnchor;
}

/**
 * Kaspa Transaction Fee Estimate
 */
export interface FeeEstimate {
  estimatedFee: number; // In sompi (smallest Kaspa unit)
  estimatedFeeKAS: number; // In KAS
  priority: 'low' | 'medium' | 'high';
}
