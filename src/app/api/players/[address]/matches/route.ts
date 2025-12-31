/**
 * Player Match History API Route
 * Endpoint: GET /api/players/[address]/matches
 */

import { NextRequest, NextResponse } from "next/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { getPlayerMatchHistory, type MatchHistoryResponse } from "@/lib/player/match-history";

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
 * GET /api/players/[address]/matches
 * Get player match history.
 *
 * Query parameters:
 * - limit: Number of matches (default: 20, max: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
): Promise<NextResponse<MatchHistoryResponse | ApiErrorResponse>> {
  try {
    const { address } = await context.params;

    // Validate address
    if (!address) {
      throw Errors.badRequest("Address is required");
    }

    if (!isValidKaspaAddress(address)) {
      throw Errors.invalidAddress(address);
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse and validate limit
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    if (isNaN(limit) || limit < 1) {
      throw Errors.badRequest("limit must be a positive integer");
    }

    // Parse and validate offset
    const offsetParam = searchParams.get("offset");
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    if (isNaN(offset) || offset < 0) {
      throw Errors.badRequest("offset must be a non-negative integer");
    }

    // Fetch match history
    const matchHistory = await getPlayerMatchHistory(address, {
      limit,
      offset,
    });

    return NextResponse.json(matchHistory, {
      headers: {
        // Cache for 30 seconds, stale-while-revalidate for 60 seconds
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const apiError = handleError(error);
    return createErrorResponse(apiError);
  }
}
