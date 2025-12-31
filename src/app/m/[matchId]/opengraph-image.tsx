/**
 * Open Graph Image Generator for Match Pages
 * Generates dynamic OG images for social media sharing
 */

import { ImageResponse } from "next/og";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Image dimensions (Twitter/Facebook optimized)
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

/**
 * Character display data.
 */
const characterData: Record<string, { emoji: string; color: string }> = {
  "cyber-ninja": { emoji: "🥷", color: "#F0B71F" },
  "dag-warrior": { emoji: "⚔️", color: "#FF6B6B" },
  "block-brawler": { emoji: "🤖", color: "#4ECDC4" },
  "hash-hunter": { emoji: "🎯", color: "#A855F7" },
};

const CHARACTER_NAMES: Record<string, string> = {
  "cyber-ninja": "Cyber Ninja",
  "dag-warrior": "DAG Warrior",
  "block-brawler": "Block Brawler",
  "hash-hunter": "Hash Hunter",
};

interface MatchData {
  id: string;
  player1_address: string;
  player2_address: string | null;
  player1_character_id: string | null;
  player2_character_id: string | null;
  winner_address: string | null;
  player1_rounds_won: number;
  player2_rounds_won: number;
}

async function getMatchData(matchId: string): Promise<MatchData | null> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("matches")
      .select("id, player1_address, player2_address, player1_character_id, player2_character_id, winner_address, player1_rounds_won, player2_rounds_won")
      .eq("id", matchId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as MatchData;
  } catch {
    return null;
  }
}

function formatAddress(address: string): string {
  if (address.length > 16) {
    const prefix = address.substring(0, 10);
    const suffix = address.substring(address.length - 6);
    return `${prefix}...${suffix}`;
  }
  return address;
}

/**
 * Generate OG image for a match.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const match = await getMatchData(matchId);

  // Use match data or fallback to placeholder if not found
  const isPlayer1Winner = match?.winner_address === match?.player1_address;
  const winnerCharId = match ? (isPlayer1Winner ? match.player1_character_id : match.player2_character_id) : null;
  const loserCharId = match ? (isPlayer1Winner ? match.player2_character_id : match.player1_character_id) : null;
  const winnerAddress = match ? (isPlayer1Winner ? match.player1_address : match.player2_address || "Unknown") : "Unknown";
  const loserAddress = match ? (isPlayer1Winner ? match.player2_address : match.player1_address) : "Unknown";

  const matchDisplayData = {
    winnerName: formatAddress(winnerAddress),
    winnerCharacter: winnerCharId ? CHARACTER_NAMES[winnerCharId] || winnerCharId : "Unknown",
    loserName: loserAddress ? formatAddress(loserAddress) : "Unknown",
    loserCharacter: loserCharId ? CHARACTER_NAMES[loserCharId] || loserCharId : "Unknown",
    score: match ? `${match.player1_rounds_won}-${match.player2_rounds_won}` : "0-0",
  };

  const winnerInfo = characterData[winnerCharId || ""] || { emoji: "👤", color: "#F0B71F" };
  const loserInfo = characterData[loserCharId || ""] || { emoji: "👤", color: "#666666" };

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#0D0D0D",
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(240,183,31,0.15) 0%, transparent 50%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Logo / Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: "#F0B71F",
              letterSpacing: "-0.02em",
            }}
          >
            KASPACLASH
          </span>
        </div>

        {/* Match Result */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 60,
            marginBottom: 40,
          }}
        >
          {/* Winner */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                border: `4px solid ${winnerInfo.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
                boxShadow: `0 0 30px ${winnerInfo.color}40`,
                fontSize: 60,
              }}
            >
              {winnerInfo.emoji}
            </div>
            <div
              style={{
                marginTop: 16,
                padding: "4px 16px",
                backgroundColor: winnerInfo.color,
                borderRadius: 4,
                color: "#000",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              WINNER
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 20,
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              {matchDisplayData.winnerCharacter}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 14,
                color: "#888888",
              }}
            >
              {matchDisplayData.winnerName}
            </div>
          </div>

          {/* VS / Score */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: "#F0B71F",
                letterSpacing: "0.1em",
              }}
            >
              {matchDisplayData.score}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#666666",
                marginTop: 8,
              }}
            >
              VS
            </div>
          </div>

          {/* Loser */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: 0.7,
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                border: "2px solid #666666",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
                fontSize: 50,
                filter: "grayscale(50%)",
              }}
            >
              {loserInfo.emoji}
            </div>
            <div
              style={{
                marginTop: 20,
                fontSize: 18,
                fontWeight: 700,
                color: "#888888",
              }}
            >
              {matchDisplayData.loserCharacter}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 14,
                color: "#666666",
              }}
            >
              {matchDisplayData.loserName}
            </div>
          </div>
        </div>

        {/* Verified Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            backgroundColor: "rgba(240,183,31,0.1)",
            border: "1px solid rgba(240,183,31,0.3)",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#22C55E",
            }}
          />
          <span
            style={{
              fontSize: 14,
              color: "#F0B71F",
              fontWeight: 600,
            }}
          >
            Verified on Kaspa BlockDAG
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#666666",
            fontSize: 14,
          }}
        >
          <span>Match ID: {matchId.slice(0, 8)}...</span>
          <span>•</span>
          <span>kaspaclash.com</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
