/**
 * Private Rooms API Routes
 * Endpoint: POST /api/matchmaking/rooms
 */

import { NextRequest, NextResponse } from "next/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { createRoom } from "@/lib/matchmaking/matchmaker";

/**
 * Create room request body.
 */
interface CreateRoomRequest {
  address: string;
}

/**
 * Create room response.
 */
interface CreateRoomResponse {
  success: boolean;
  matchId: string;
  roomCode: string;
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
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateRoomResponse | ApiErrorResponse>> {
  try {
    const body = (await request.json()) as CreateRoomRequest;
    const { address } = body;

    // Validate request
    if (!address) {
      throw Errors.badRequest("Address is required");
    }

    if (!isValidKaspaAddress(address)) {
      throw Errors.invalidAddress(address);
    }

    // Create the room
    const room = await createRoom(address);

    if (!room) {
      throw Errors.badRequest("Failed to create room");
    }

    return NextResponse.json({
      success: true,
      matchId: room.id,
      roomCode: room.code,
    });
  } catch (error) {
    const apiError = handleError(error);
    return createErrorResponse(apiError);
  }
}
