/**
 * GET /api/matches/live
 * Fetch all currently live (in_progress) matches for spectating
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";

/**
 * GET handler - Fetch live matches
 */
export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();

        // Clean up stale matches - if in_progress for over 15 minutes, mark as cancelled
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

        const { error: cleanupError } = await supabase
            .from("matches")
            .update({
                status: "completed",
                completed_at: new Date().toISOString(),
            })
            .eq("status", "in_progress")
            .lt("started_at", fifteenMinutesAgo);

        if (cleanupError) {
            console.error("Stale matches cleanup error:", cleanupError);
            // Continue anyway - don't fail the request due to cleanup
        }

        // Only show matches started in the last hour to avoid any edge cases
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        // Fetch all in_progress matches with player details
        const { data: matches, error } = await supabase
            .from("matches")
            .select(
                `
        id,
        room_code,
        player1_address,
        player2_address,
        player1_character_id,
        player2_character_id,
        format,
        status,
        player1_rounds_won,
        player2_rounds_won,
        created_at,
        started_at,
        player1:players!matches_player1_address_fkey(
          address,
          display_name,
          rating,
          avatar_url
        ),
        player2:players!matches_player2_address_fkey(
          address,
          display_name,
          rating,
          avatar_url
        )
      `
            )
            .eq("status", "in_progress")
            .gte("started_at", oneHourAgo)
            .order("started_at", { ascending: false });

        if (error) {
            console.error("Live matches fetch error:", error);
            return createErrorResponse(
                new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to fetch live matches")
            );
        }

        // Transform to camelCase response
        const response = matches.map((match) => {
            // Supabase returns joins as arrays or objects, handle both cases
            const player1Data = Array.isArray(match.player1) ? match.player1[0] : match.player1;
            const player2Data = Array.isArray(match.player2) ? match.player2[0] : match.player2;

            return {
                id: match.id,
                roomCode: match.room_code,
                player1Address: match.player1_address,
                player2Address: match.player2_address,
                player1CharacterId: match.player1_character_id,
                player2CharacterId: match.player2_character_id,
                format: match.format,
                status: match.status,
                player1RoundsWon: match.player1_rounds_won,
                player2RoundsWon: match.player2_rounds_won,
                createdAt: match.created_at,
                startedAt: match.started_at,
                player1: player1Data
                    ? {
                        address: player1Data.address,
                        displayName: player1Data.display_name,
                        rating: player1Data.rating,
                        avatarUrl: player1Data.avatar_url,
                    }
                    : null,
                player2: player2Data
                    ? {
                        address: player2Data.address,
                        displayName: player2Data.display_name,
                        rating: player2Data.rating,
                        avatarUrl: player2Data.avatar_url,
                    }
                    : null,
            };
        });

        return NextResponse.json({ matches: response });
    } catch (error) {
        console.error("Live matches endpoint error:", error);
        return createErrorResponse(
            new ApiError(ErrorCodes.INTERNAL_ERROR, "Internal server error")
        );
    }
}
