/**
 * Leaderboard API Route
 * Endpoint: GET /api/leaderboard
 */

import { NextRequest, NextResponse } from "next/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { getLeaderboard, type LeaderboardResponse } from "@/lib/leaderboard/service";
import type { NetworkType } from "@/types/constants";

/**
 * Valid sort options.
 */
const VALID_SORT_OPTIONS = ["wins", "rating", "winRate"] as const;
type SortOption = (typeof VALID_SORT_OPTIONS)[number];

const VALID_NETWORKS = ["mainnet", "testnet"] as const;

/**
 * GET /api/leaderboard
 * Get the global leaderboard with optional pagination and sorting.
 *
 * Query parameters:
 * - limit: Number of entries (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 * - sortBy: Sort field - "wins" | "rating" | "winRate" (default: "wins")
 * - network: Network filter - "mainnet" | "testnet" (optional)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<LeaderboardResponse | ApiErrorResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate limit
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    if (isNaN(limit) || limit < 1) {
      throw Errors.badRequest("limit must be a positive integer");
    }

    // Parse and validate offset
    const offsetParam = searchParams.get("offset");
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    if (isNaN(offset) || offset < 0) {
      throw Errors.badRequest("offset must be a non-negative integer");
    }

    // Parse and validate sortBy
    const sortByParam = searchParams.get("sortBy") as SortOption | null;
    const sortBy: SortOption =
      sortByParam && VALID_SORT_OPTIONS.includes(sortByParam) ? sortByParam : "wins";

    // Parse network parameter
    const networkParam = searchParams.get("network") as NetworkType | null;
    const network: NetworkType | undefined =
      networkParam && VALID_NETWORKS.includes(networkParam) ? networkParam : undefined;

    // Fetch leaderboard
    const leaderboard = await getLeaderboard({
      limit,
      offset,
      sortBy,
      network,
    });

    return NextResponse.json(leaderboard, {
      headers: {
        // Cache for 10 seconds, stale-while-revalidate for 30 seconds
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    const apiError = handleError(error);
    return createErrorResponse(apiError);
  }
}
