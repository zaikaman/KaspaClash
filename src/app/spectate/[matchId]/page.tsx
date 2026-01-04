/**
 * Spectate Match Page
 * Server component that loads match data and renders the spectator client
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SpectatorClient } from "./SpectatorClient";
import type { Match, MatchFormat, MatchStatus } from "@/types";

/**
 * Loading component for spectate page.
 */
function SpectateLoading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#F0B71F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-cyber-gold text-lg font-medium font-orbitron tracking-widest uppercase">
                    Loading match...
                </p>
            </div>
        </div>
    );
}

/**
 * Spectate page props.
 */
interface SpectatePageProps {
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
        player1: dbMatch.player1 || undefined,
        player2: dbMatch.player2 || undefined,
    };
}

/**
 * Spectate match page component.
 */
export default async function SpectateMatchPage({ params }: SpectatePageProps) {
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

    // Check if match is completed - redirect to replay instead
    if (dbMatch.status === "completed") {
        // Could redirect to replay page, but for now we'll show the results
    }

    // Transform to camelCase
    const match = transformMatchData(dbMatch);

    return (
        <Suspense fallback={<SpectateLoading />}>
            <SpectatorClient match={match} />
        </Suspense>
    );
}

/**
 * Generate metadata for the spectate page.
 */
export async function generateMetadata({ params }: SpectatePageProps) {
    const { matchId } = await params;

    return {
        title: `Spectating Match ${matchId.slice(0, 8)} | KaspaClash`,
        description: "Watch a live 1v1 fighting match on KaspaClash",
    };
}
