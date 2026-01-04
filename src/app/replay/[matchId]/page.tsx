import React from "react";
import { notFound } from "next/navigation";
import LandingLayout from "@/components/landing/LandingLayout";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReplayGameClient } from "./ReplayGameClient";
import type { MoveType } from "@/types";

// Types for replay data
export interface ReplayRoundData {
  roundNumber: number;
  player1Move: MoveType;
  player2Move: MoveType;
  player1DamageDealt: number;
  player2DamageDealt: number;
  player1HealthAfter: number;
  player2HealthAfter: number;
  winnerAddress: string | null;
}

export interface ReplayConfig {
  matchId: string;
  player1Address: string;
  player2Address: string;
  player1Character: string;
  player2Character: string;
  winnerAddress: string | null;
  player1RoundsWon: number;
  player2RoundsWon: number;
  rounds: ReplayRoundData[];
}

interface MatchData {
  id: string;
  player1_address: string;
  player2_address: string | null;
  player1_character_id: string | null;
  player2_character_id: string | null;
  winner_address: string | null;
  player1_rounds_won: number;
  player2_rounds_won: number;
  status: string;
}

interface RoundData {
  id: string;
  round_number: number;
  player1_move: string | null;
  player2_move: string | null;
  player1_damage_dealt: number | null;
  player2_damage_dealt: number | null;
  player1_health_after: number | null;
  player2_health_after: number | null;
  winner_address: string | null;
}

async function getMatchWithRounds(matchId: string): Promise<{ match: MatchData; rounds: RoundData[] } | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // Fetch match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      console.error("Error fetching match:", matchError);
      return null;
    }

    // Only allow replay for completed matches
    if (match.status !== "completed") {
      return null;
    }

    // Fetch all rounds for this match
    const { data: rounds, error: roundsError } = await supabase
      .from("rounds")
      .select("*")
      .eq("match_id", matchId)
      .order("round_number", { ascending: true });

    if (roundsError) {
      console.error("Error fetching rounds:", roundsError);
      return null;
    }

    return { match: match as MatchData, rounds: (rounds || []) as RoundData[] };
  } catch {
    return null;
  }
}

function isValidMove(move: string | null): move is MoveType {
  return move !== null && ["punch", "kick", "block", "special"].includes(move);
}

export default async function ReplayPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const data = await getMatchWithRounds(matchId);

  if (!data) {
    notFound();
  }

  const { match, rounds } = data;

  // Filter rounds with valid moves
  const validRounds: ReplayRoundData[] = rounds
    .filter((r) => isValidMove(r.player1_move) && isValidMove(r.player2_move))
    .map((r) => ({
      roundNumber: r.round_number,
      player1Move: r.player1_move as MoveType,
      player2Move: r.player2_move as MoveType,
      player1DamageDealt: r.player1_damage_dealt ?? 0,
      player2DamageDealt: r.player2_damage_dealt ?? 0,
      player1HealthAfter: r.player1_health_after ?? 100,
      player2HealthAfter: r.player2_health_after ?? 100,
      winnerAddress: r.winner_address,
    }));

  // Build replay config
  const replayConfig: ReplayConfig = {
    matchId: match.id,
    player1Address: match.player1_address,
    player2Address: match.player2_address || "",
    player1Character: match.player1_character_id || "dag-warrior",
    player2Character: match.player2_character_id || "dag-warrior",
    winnerAddress: match.winner_address,
    player1RoundsWon: match.player1_rounds_won,
    player2RoundsWon: match.player2_rounds_won,
    rounds: validRounds,
  };

  return (
    <LandingLayout>
      <div className="min-h-screen pt-20 pb-8 relative">
        {/* Header */}
        <div className="container mx-auto px-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-orbitron text-white flex items-center gap-3">
                <span className="text-cyber-gold">⏵</span> MATCH REPLAY
              </h1>
              <p className="text-cyber-gray text-sm font-mono mt-1">
                Match ID: {matchId.slice(0, 8)}...
              </p>
            </div>
            <a
              href={`/m/${matchId}`}
              className="text-cyber-gold hover:text-cyber-gold/80 font-orbitron text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Match
            </a>
          </div>
        </div>

        {/* Game Container */}
        <div className="container mx-auto px-4">
          <div className="relative bg-black rounded-xl overflow-hidden border border-cyber-gold/30 aspect-video max-w-5xl mx-auto">
            <ReplayGameClient config={replayConfig} />
          </div>
        </div>

        {/* Info */}
        <div className="container mx-auto px-4 mt-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-black/40 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-cyber-gray">Player 1:</span>
                  <span className="text-white font-mono">{match.player1_address.slice(0, 10)}...</span>
                  <span className="text-cyber-gold">({match.player1_character_id || "Unknown"})</span>
                </div>
                <div className="text-cyber-gray">vs</div>
                <div className="flex items-center gap-2">
                  <span className="text-cyber-gray">Player 2:</span>
                  <span className="text-white font-mono">{match.player2_address?.slice(0, 10) || "Unknown"}...</span>
                  <span className="text-cyber-gold">({match.player2_character_id || "Unknown"})</span>
                </div>
                <div className="ml-auto">
                  <span className="bg-cyber-gold/20 text-cyber-gold px-3 py-1 rounded font-mono text-xs">
                    {match.player1_rounds_won} - {match.player2_rounds_won}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
}
