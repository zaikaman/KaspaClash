// Cosmetic Shop & Item Types

/**
 * Cosmetic Item Categories
 */
export type CosmeticCategory = 'character' | 'sticker' | 'victory_pose' | 'profile_badge' | 'profile_frame';

/**
 * Cosmetic Rarity Tiers
 */
export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'prestige';

/**
 * Cosmetic Item Definition
 */
export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  category: CosmeticCategory;
  rarity: CosmeticRarity;
  characterId?: string; // For skins, emotes, poses (character-specific)
  price: number; // Clash Shards
  isPremium: boolean; // Battle pass exclusive
  isLimited: boolean; // Weekly rotation
  thumbnailUrl: string;
  previewUrl: string;
  assetPath: string; // Path to spritesheet or animation asset
  unlockRequirement?: string; // Achievement or tier requirement
  tags: string[];
  releaseDate: Date;
}

/**
 * Player Inventory Entry
 */
export interface PlayerInventoryItem {
  playerId: string;
  cosmeticId: string;
  cosmetic: CosmeticItem;
  acquiredDate: Date;
  source: 'battle_pass' | 'shop_purchase' | 'achievement' | 'prestige' | 'event';
  isEquipped: boolean;
}

/**
 * Player Loadout (Equipped Cosmetics per Character)
 */
export interface PlayerLoadout {
  playerId: string;
  characterId: string;
  equippedSkin?: string;
  equippedSticker?: string;
  equippedVictoryPose?: string;
  equippedBadge?: string;
  equippedFrame?: string;
  lastUpdated: Date;
}

/**
 * Shop Purchase Transaction
 */
export interface ShopPurchase {
  id: string;
  playerId: string;
  cosmeticId: string;
  price: number;
  currencyType: 'clash_shards';
  purchaseDate: Date;
  success: boolean;
  errorMessage?: string;
}

/**
 * Weekly Shop Rotation
 */
export interface ShopRotation {
  id: string;
  weekStartDate: Date;
  weekEndDate: Date;
  featuredItems: string[]; // Cosmetic IDs
  discountedItems: string[];
  isActive: boolean;
}

/**
 * Currency Transaction Log
 */
export interface CurrencyTransaction {
  id: string;
  playerId: string;
  amount: number;
  type: 'earn' | 'spend';
  source: string; // 'match_win', 'quest_claim', 'shop_purchase', etc.
  balanceBefore: number;
  balanceAfter: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Player Currency Balance
 */
export interface PlayerCurrency {
  playerId: string;
  clashShards: number;
  totalEarned: number;
  totalSpent: number;
  lastUpdated: Date;
}

/**
 * Cosmetic NFT Record
 * Tracks NFTs minted for cosmetics on Kaspa blockchain
 */
export interface CosmeticNFT {
  id: string;
  playerId: string;
  cosmeticId: string;
  mintTxId: string; // Kaspa transaction ID
  network: 'mainnet' | 'testnet';
  metadata: {
    protocol: string;
    version: string;
    type: string;
    cosmetic: {
      id: string;
      name: string;
      category: string;
      rarity: string;
      thumbnailUrl: string;
      assetPath: string;
    };
    mintedAt: string;
    mintedBy: string;
  };
  mintedAt: Date;
}
