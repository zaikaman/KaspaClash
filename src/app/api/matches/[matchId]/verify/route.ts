/**
 * Match Verification API Route
 * GET /api/matches/[matchId]/verify
 * Quick endpoint to verify a match exists before navigation
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface VerifyResponse {
    exists: boolean;
    status?: string;
}

/**
 * GET /api/matches/[matchId]/verify
 * Verify that a match exists and is in a valid state.
 * Used by frontend to confirm match before navigation.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ matchId: string }> }
): Promise<NextResponse<VerifyResponse>> {
    try {
        const { matchId } = await params;

        if (!matchId) {
            return NextResponse.json({ exists: false }, { status: 400 });
        }

        const supabase = await createSupabaseServerClient();

        const { data: match, error } = await supabase
            .from("matches")
            .select("id, status")
            .eq("id", matchId)
            .single();

        if (error || !match) {
            return NextResponse.json({ exists: false }, { status: 404 });
        }

        return NextResponse.json({
            exists: true,
            status: match.status
        });
    } catch (error) {
        console.error("Match verification error:", error);
        return NextResponse.json({ exists: false }, { status: 500 });
    }
}
