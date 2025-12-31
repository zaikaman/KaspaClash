/**
 * Open Graph Meta Generator
 * Generates OG metadata for match share pages
 */

import type { Metadata } from "next";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Match data for OG generation.
 */
export interface MatchOGData {
  /** Match ID */
  matchId: string;
  /** Winner's display name or address */
  winnerName: string;
  /** Winner's character name */
  winnerCharacter: string;
  /** Loser's display name or address */
  loserName: string;
  /** Loser's character name */
  loserCharacter: string;
  /** Final score (e.g., "2-1") */
  score: string;
  /** Match duration in seconds */
  durationSeconds?: number;
  /** Whether the match is verified on-chain */
  isVerified?: boolean;
}

/**
 * OG image generation parameters.
 */
export interface OGImageParams {
  winnerName: string;
  winnerCharacter: string;
  loserName: string;
  loserCharacter: string;
  score: string;
}

// =============================================================================
// META GENERATORS
// =============================================================================

/**
 * Generate Open Graph metadata for a match page.
 */
export function generateMatchMetadata(data: MatchOGData): Metadata {
  const { matchId, winnerName, winnerCharacter, loserName, loserCharacter, score } = data;
  
  const title = `${winnerName} defeats ${loserName} | KaspaClash`;
  const description = `${winnerCharacter} vs ${loserCharacter} - Final score: ${score}. Watch the blockchain-verified match on KaspaClash, the first real-time fighter on BlockDAG.`;
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kaspaclash.com";
  const matchUrl = `${baseUrl}/m/${matchId}`;
  const imageUrl = `${baseUrl}/m/${matchId}/opengraph-image`;
  
  return {
    title,
    description,
    
    // OpenGraph
    openGraph: {
      type: "website",
      url: matchUrl,
      title,
      description,
      siteName: "KaspaClash",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${winnerCharacter} vs ${loserCharacter}`,
        },
      ],
    },
    
    // Twitter
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@KaspaClash",
    },
    
    // Other meta
    other: {
      "og:locale": "en_US",
    },
  };
}

/**
 * Generate basic metadata when match data is not available.
 */
export function generateDefaultMatchMetadata(matchId: string): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kaspaclash.com";
  const matchUrl = `${baseUrl}/m/${matchId}`;
  
  return {
    title: "Match Summary | KaspaClash",
    description: "View this blockchain-verified match on KaspaClash, the first real-time fighter on BlockDAG.",
    
    openGraph: {
      type: "website",
      url: matchUrl,
      title: "Match Summary | KaspaClash",
      description: "View this blockchain-verified match on KaspaClash, the first real-time fighter on BlockDAG.",
      siteName: "KaspaClash",
    },
    
    twitter: {
      card: "summary_large_image",
      title: "Match Summary | KaspaClash",
      description: "View this blockchain-verified match on KaspaClash.",
    },
  };
}

// =============================================================================
// FORMATTERS
// =============================================================================

/**
 * Format duration for display.
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Truncate address for OG display.
 */
export function truncateAddress(address: string, chars: number = 8): string {
  if (address.length <= chars * 2 + 3) return address;
  
  // Remove kaspa: prefix for display
  const cleanAddress = address.replace(/^kaspa(test)?:/, "");
  return `${cleanAddress.slice(0, chars)}...${cleanAddress.slice(-chars)}`;
}

/**
 * Get character emoji for OG image.
 */
export function getCharacterEmoji(characterId: string): string {
  const emojiMap: Record<string, string> = {
    "cyber-ninja": "🥷",
    "dag-warrior": "⚔️",
    "block-bruiser": "🤖",
    "hash-hunter": "🎯",
    "chain-champion": "🏆",
    "node-knight": "🛡️",
  };
  
  return emojiMap[characterId] || "👤";
}

/**
 * Generate OG image search params from match data.
 */
export function buildOGImageParams(data: OGImageParams): URLSearchParams {
  const params = new URLSearchParams();
  
  params.set("winner", data.winnerName);
  params.set("winnerChar", data.winnerCharacter);
  params.set("loser", data.loserName);
  params.set("loserChar", data.loserCharacter);
  params.set("score", data.score);
  
  return params;
}
