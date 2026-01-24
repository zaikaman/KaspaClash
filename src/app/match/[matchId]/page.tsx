/**
 * Match Page
 * Main game page that loads match data and renders the Phaser game
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import GameLayout from "@/components/layout/GameLayout";
import { MatchGameClient } from "./MatchGameClient";
import type { Match, MatchFormat, MatchStatus } from "@/types";

/**
 * Loading component for match page.
 */
function MatchLoading() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#F0B71F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#F0B71F] text-lg font-medium font-orbitron tracking-widest uppercase">Loading match...</p>
      </div>
    </div>
  );
}

/**
 * Match page props.
 */
interface MatchPageProps {
  params: Promise<{
    matchId: string;
  }>;
}

/**
 * Transform snake_case Supabase data to camelCase Match type.
 */
function transformMatchData(
  dbMatch: {
    id: string;
    room_code: string | null;
    player1_address: string;
    player2_address: string | null;
    player1_character_id: string | null;
    player2_character_id: string | null;
    format: string;
    status: string;
    selection_deadline_at: string | null;
    winner_address: string | null;
    player1_rounds_won: number;
    player2_rounds_won: number;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    is_bot?: boolean;
    stake_amount?: string | null;
    player1_stake_tx_id?: string | null;
    player2_stake_tx_id?: string | null;
    stakes_confirmed?: boolean;
    stake_deadline_at?: string | null;
    player1?: { address: string; display_name: string | null; rating: number } | null;
    player2?: { address: string; display_name: string | null; rating: number } | null;
  }
): Match & {
  player1?: { address: string; display_name: string | null; rating: number };
  player2?: { address: string; display_name: string | null; rating: number };
} {
  return {
    id: dbMatch.id,
    roomCode: dbMatch.room_code,
    player1Address: dbMatch.player1_address,
    player2Address: dbMatch.player2_address,
    player1CharacterId: dbMatch.player1_character_id,
    player2CharacterId: dbMatch.player2_character_id,
    format: dbMatch.format as MatchFormat,
    status: dbMatch.status as MatchStatus,
    selectionDeadlineAt: dbMatch.selection_deadline_at,
    winnerAddress: dbMatch.winner_address,
    player1RoundsWon: dbMatch.player1_rounds_won,
    player2RoundsWon: dbMatch.player2_rounds_won,
    createdAt: new Date(dbMatch.created_at),
    startedAt: dbMatch.started_at ? new Date(dbMatch.started_at) : null,
    completedAt: dbMatch.completed_at ? new Date(dbMatch.completed_at) : null,
    // Bot flag
    isBot: dbMatch.is_bot ?? false,
    // Stake fields
    stakeAmount: dbMatch.stake_amount,
    player1StakeTxId: dbMatch.player1_stake_tx_id,
    player2StakeTxId: dbMatch.player2_stake_tx_id,
    stakesConfirmed: dbMatch.stakes_confirmed ?? false,
    stakeDeadlineAt: dbMatch.stake_deadline_at,
    player1: dbMatch.player1 || undefined,
    player2: dbMatch.player2 || undefined,
  };
}

/**
 * Match page component.
 */
export default async function MatchPage({ params }: MatchPageProps) {
  const { matchId } = await params;

  // Validate match ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(matchId)) {
    notFound();
  }

  // Fetch match data from Supabase
  const supabase = await createSupabaseServerClient();

  const { data: dbMatch, error } = await supabase
    .from("matches")
    .select(
      `
      *,
      player1:players!matches_player1_address_fkey(address, display_name, rating),
      player2:players!matches_player2_address_fkey(address, display_name, rating)
    `
    )
    .eq("id", matchId)
    .single();

  if (error || !dbMatch) {
    console.error("Match fetch error:", error);
    notFound();
  }

  // Debug: Log raw database value for selection_deadline_at
  console.log("[MatchPage] Raw DB selection_deadline_at:", dbMatch.selection_deadline_at);

  // Transform to camelCase
  const match = transformMatchData(dbMatch);

  console.log("[MatchPage] Transformed selectionDeadlineAt:", match.selectionDeadlineAt);


  // Check if match is in a valid state
  if (match.status === "completed") {
    // Could redirect to results page or show completed state
  }

  return (
    <Suspense fallback={<MatchLoading />}>
      <MatchGameClient match={match} />
    </Suspense>
  );
}

/**
 * Generate metadata for the match page.
 */
export async function generateMetadata({ params }: MatchPageProps) {
  const { matchId } = await params;

  return {
    title: `Match ${matchId.slice(0, 8)} | KaspaClash`,
    description: "1v1 fighting match on KaspaClash with on-chain move verification",
  };
}
