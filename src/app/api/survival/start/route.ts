/**
 * POST /api/survival/start
 * Deduct a play when starting a survival run
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface StartSurvivalRequest {
    playerAddress: string;
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

        // Get updated plays remaining
        const { data: newPlaysRemaining } = await supabase.rpc("get_survival_plays_remaining", {
            p_player_id: body.playerAddress,
        });

        return NextResponse.json({
            success: true,
            playsRemaining: newPlaysRemaining ?? 0,
        });
    } catch (error) {
        console.error("Start survival error:", error);
        return NextResponse.json(
            { error: "Failed to start survival run" },
            { status: 500 }
        );
    }
}
