import React from "react";
import { notFound } from "next/navigation";
import LandingLayout from "@/components/landing/LandingLayout";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReplayGameClient } from "./ReplayGameClient";
import type { MoveType } from "@/types";
import type { PowerSurgeCardId } from "@/types/power-surge";

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
  // Power surge effects
  player1EnergyDrained?: number;
  player2EnergyDrained?: number;
  player1HpRegen?: number;
  player2HpRegen?: number;
  player1Lifesteal?: number;
  player2Lifesteal?: number;
  player1Outcome?: "hit" | "blocked" | "stunned" | "staggered" | "reflected" | "shattered" | "missed" | "guarding" | null;
  player2Outcome?: "hit" | "blocked" | "stunned" | "staggered" | "reflected" | "shattered" | "missed" | "guarding" | null;
  // Power surge data
  surgeCardIds?: PowerSurgeCardId[];
  player1SurgeSelection?: PowerSurgeCardId;
  player2SurgeSelection?: PowerSurgeCardId;
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
  player1_energy_drained: number | null;
  player2_energy_drained: number | null;
  player1_hp_regen: number | null;
  player2_hp_regen: number | null;
  player1_lifesteal: number | null;
  player2_lifesteal: number | null;
  player1_outcome: string | null;
  player2_outcome: string | null;
  winner_address: string | null;
}

interface PowerSurgeData {
  round_number: number;
  offered_cards: string[];
  player1_card_id: string | null;
  player2_card_id: string | null;
}

async function getMatchWithRounds(matchId: string): Promise<{ match: MatchData; rounds: RoundData[]; powerSurges: PowerSurgeData[] } | null> {
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

    // Fetch power surge data for this match
    const { data: powerSurges, error: powerSurgesError } = await supabase
      .from("power_surges")
      .select("round_number, offered_cards, player1_card_id, player2_card_id")
      .eq("match_id", matchId)
      .order("round_number", { ascending: true });

    if (powerSurgesError) {
      console.error("Error fetching power surges:", powerSurgesError);
      // Continue without power surges - not critical
    }

    return { 
      match: match as MatchData, 
      rounds: (rounds || []) as RoundData[],
      powerSurges: (powerSurges || []) as PowerSurgeData[]
    };
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

  const { match, rounds, powerSurges } = data;

  // Create a map of power surges by game round number for quick lookup
  // Note: power_surges.round_number is the GAME ROUND (1, 2, 3), not turn number
  const powerSurgeByGameRound = new Map<number, PowerSurgeData>();
  for (const ps of powerSurges) {
    powerSurgeByGameRound.set(ps.round_number, ps);
  }

  // Filter and transform rounds with valid moves
  // Track game round - it increments after each turn with a winner
  let currentGameRound = 1;
  const validRounds: ReplayRoundData[] = [];
  
  const filteredRounds = rounds.filter((r) => isValidMove(r.player1_move) && isValidMove(r.player2_move));
  
  for (let i = 0; i < filteredRounds.length; i++) {
    const r = filteredRounds[i];
    const isFirstTurnOfGameRound = i === 0 || (filteredRounds[i - 1]?.winner_address !== null);
    
    // Get power surge only for the first turn of each game round
    const powerSurge = isFirstTurnOfGameRound ? powerSurgeByGameRound.get(currentGameRound) : undefined;
    
    validRounds.push({
      roundNumber: r.round_number,
      player1Move: r.player1_move as MoveType,
      player2Move: r.player2_move as MoveType,
      player1DamageDealt: r.player1_damage_dealt ?? 0,
      player2DamageDealt: r.player2_damage_dealt ?? 0,
      player1HealthAfter: r.player1_health_after ?? 100,
      player2HealthAfter: r.player2_health_after ?? 100,
      player1EnergyDrained: r.player1_energy_drained ?? 0,
      player2EnergyDrained: r.player2_energy_drained ?? 0,
      player1HpRegen: r.player1_hp_regen ?? 0,
      player2HpRegen: r.player2_hp_regen ?? 0,
      player1Lifesteal: r.player1_lifesteal ?? 0,
      player2Lifesteal: r.player2_lifesteal ?? 0,
      player1Outcome: r.player1_outcome as "hit" | "blocked" | "stunned" | "staggered" | "reflected" | "shattered" | "missed" | "guarding" | null,
      player2Outcome: r.player2_outcome as "hit" | "blocked" | "stunned" | "staggered" | "reflected" | "shattered" | "missed" | "guarding" | null,
      winnerAddress: r.winner_address,
      // Include power surge data only for first turn of each game round
      surgeCardIds: powerSurge?.offered_cards as PowerSurgeCardId[] | undefined,
      player1SurgeSelection: powerSurge?.player1_card_id as PowerSurgeCardId | undefined,
      player2SurgeSelection: powerSurge?.player2_card_id as PowerSurgeCardId | undefined,
    });
    
    // If this turn ended a game round, increment for next turn
    if (r.winner_address !== null) {
      currentGameRound++;
    }
  }

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
