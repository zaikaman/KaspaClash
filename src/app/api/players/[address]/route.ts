/**
 * Player Profile API Route
 * Endpoint: GET /api/players/[address]
 */

import { NextRequest, NextResponse } from "next/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { getPlayer, registerPlayer, getPlayerRank } from "@/lib/player/registration";
import type { Player } from "@/types";

/**
 * Player profile response.
 */
interface PlayerProfileResponse {
  player: Player;
  rank: number | null;
  isNewPlayer?: boolean;
}

/**
 * Validate Kaspa address format.
 */
function isValidKaspaAddress(address: string): boolean {
  return (
    typeof address === "string" &&
    (address.startsWith("kaspa:") || address.startsWith("kaspatest:")) &&
    address.length >= 40
  );
}

/**
 * GET /api/players/[address]
 * Get player profile by Kaspa address.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
): Promise<NextResponse<PlayerProfileResponse | ApiErrorResponse>> {
  try {
    const { address } = await context.params;

    // Validate address
    if (!address) {
      throw Errors.badRequest("Address is required");
    }

    if (!isValidKaspaAddress(address)) {
      throw Errors.invalidAddress(address);
    }

    // Get player profile
    const player = await getPlayer(address);

    if (!player) {
      throw Errors.notFound("Player");
    }

    // Get player rank
    const rank = await getPlayerRank(address);

    return NextResponse.json({
      player,
      rank,
    });
  } catch (error) {
    const apiError = handleError(error);
    return createErrorResponse(apiError);
  }
}

/**
 * POST /api/players/[address]
 * Register a new player or update existing.
 * Used when a wallet first connects.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
): Promise<NextResponse<PlayerProfileResponse | ApiErrorResponse>> {
  try {
    const { address } = await context.params;

    // Validate address
    if (!address) {
      throw Errors.badRequest("Address is required");
    }

    if (!isValidKaspaAddress(address)) {
      throw Errors.invalidAddress(address);
    }

    // Parse optional display name from body
    let displayName: string | null = null;
    try {
      const body = await request.json();
      displayName = body.displayName || null;
    } catch {
      // No body or invalid JSON is fine
    }

    // Register or get existing player
    const result = await registerPlayer(address, displayName);

    // Get player rank
    const rank = await getPlayerRank(address);

    return NextResponse.json({
      player: result.player,
      rank,
      isNewPlayer: result.isNewPlayer,
    });
  } catch (error) {
    const apiError = handleError(error);
    return createErrorResponse(apiError);
  }
}
