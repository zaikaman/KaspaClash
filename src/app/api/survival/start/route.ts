/**
 * POST /api/survival/start
 * Deduct a play when starting a survival run
 * 
 * ANTI-CHEAT MEASURES:
 * 1. Creates a session record to track the run start time
 * 2. Invalidates any previous incomplete sessions
 * 3. Rate limiting via play count
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface StartSurvivalRequest {
    playerAddress: string;
    characterId?: string; // Optional character selection for tracking
}

export async function POST(request: NextRequest) {
    try {
        const body: StartSurvivalRequest = await request.json();

        if (!body.playerAddress) {
            return NextResponse.json(
                { error: "Missing playerAddress" },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check if player can start a run
        const { data: playsRemaining } = await supabase.rpc("get_survival_plays_remaining", {
            p_player_id: body.playerAddress,
        });

        if ((playsRemaining ?? 0) <= 0) {
            return NextResponse.json(
                { error: "No plays remaining", canPlay: false, playsRemaining: 0 },
                { status: 403 }
            );
        }

        // Deduct a play
        await supabase.rpc("increment_survival_plays", {
            p_player_id: body.playerAddress,
        });

        // ANTI-CHEAT: Invalidate any previous incomplete sessions
        // This prevents players from starting multiple runs and submitting the best one
        await supabase
            .from("survival_sessions")
            .update({ 
                status: "abandoned",
                completed_at: new Date().toISOString()
            })
            .eq("player_id", body.playerAddress)
            .eq("status", "active");

        // ANTI-CHEAT: Create new session record for tracking
        const sessionData: Record<string, unknown> = {
            player_id: body.playerAddress,
            started_at: new Date().toISOString(),
            status: "active",
        };
        
        if (body.characterId) {
            sessionData.character_id = body.characterId;
        }

        const { data: session, error: sessionError } = await supabase
            .from("survival_sessions")
            .insert(sessionData)
            .select("id")
            .single();

        if (sessionError) {
            // If table doesn't exist yet, log and continue (backwards compatible)
            console.warn("[SurvivalStart] Failed to create session (table may not exist):", sessionError.message);
        }

        // Get updated plays remaining
        const { data: newPlaysRemaining } = await supabase.rpc("get_survival_plays_remaining", {
            p_player_id: body.playerAddress,
        });

        return NextResponse.json({
            success: true,
            playsRemaining: newPlaysRemaining ?? 0,
            sessionId: session?.id || null, // Return session ID for client reference
        });
    } catch (error) {
        console.error("Start survival error:", error);
        return NextResponse.json(
            { error: "Failed to start survival run" },
            { status: 500 }
        );
    }
}
