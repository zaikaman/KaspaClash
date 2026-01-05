/**
 * Private Rooms API Routes
 * Endpoint: POST /api/matchmaking/rooms
 */

import { NextRequest, NextResponse } from "next/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { createRoom } from "@/lib/matchmaking/matchmaker";
import { kasToSompi, MIN_BET_SOMPI } from "@/lib/betting/betting-service";

/**
 * Create room request body.
 */
interface CreateRoomRequest {
  address: string;
  stakeAmount?: number; // Optional stake per player in KAS
}

/**
 * Create room response.
 */
interface CreateRoomResponse {
  success: boolean;
  matchId: string;
  roomCode: string;
  stakeAmount?: string; // Stake in sompi (as string)
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
 * POST /api/matchmaking/rooms
 * Create a new private room with a room code.
 * Optionally set a stake amount (in KAS) for betting.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateRoomResponse | ApiErrorResponse>> {
  try {
    const body = (await request.json()) as CreateRoomRequest;
    const { address, stakeAmount } = body;

    // Validate request
    if (!address) {
      throw Errors.badRequest("Address is required");
    }

    if (!isValidKaspaAddress(address)) {
      throw Errors.invalidAddress(address);
    }

    // Validate stake amount if provided
    let stakeAmountSompi: bigint | undefined;
    if (stakeAmount !== undefined && stakeAmount !== null) {
      if (typeof stakeAmount !== "number" || stakeAmount < 0) {
        throw Errors.badRequest("Stake amount must be a non-negative number");
      }
      if (stakeAmount > 0) {
        stakeAmountSompi = kasToSompi(stakeAmount);
        if (stakeAmountSompi < MIN_BET_SOMPI) {
          throw Errors.badRequest("Minimum stake is 1 KAS");
        }
      }
    }

    // Create the room
    const room = await createRoom(address, stakeAmountSompi);

    if (!room) {
      throw Errors.badRequest("Failed to create room");
    }

    return NextResponse.json({
      success: true,
      matchId: room.id,
      roomCode: room.code,
      stakeAmount: room.stakeAmount,
    });
  } catch (error) {
    const apiError = handleError(error);
    return createErrorResponse(apiError);
  }
}

