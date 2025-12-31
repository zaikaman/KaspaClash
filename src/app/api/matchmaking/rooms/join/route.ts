/**
 * Join Room API Route
 * Endpoint: POST /api/matchmaking/rooms/join
 */

import { NextRequest, NextResponse } from "next/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { joinRoom } from "@/lib/matchmaking/matchmaker";

/**
 * Join room request body.
 */
interface JoinRoomRequest {
  address: string;
  roomCode: string;
}

/**
 * Join room response.
 */
interface JoinRoomResponse {
  success: boolean;
  matchId: string;
  hostAddress: string;
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
 * Validate room code format.
 */
function isValidRoomCode(code: string): boolean {
  return typeof code === "string" && /^[A-Z0-9]{6}$/i.test(code);
}

/**
 * POST /api/matchmaking/rooms/join
 * Join an existing private room by code.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<JoinRoomResponse | ApiErrorResponse>> {
  try {
    const body = (await request.json()) as JoinRoomRequest;
    const { address, roomCode } = body;

    // Validate request
    if (!address) {
      throw Errors.badRequest("Address is required");
    }

    if (!isValidKaspaAddress(address)) {
      throw Errors.invalidAddress(address);
    }

    if (!roomCode) {
      throw Errors.badRequest("Room code is required");
    }

    if (!isValidRoomCode(roomCode)) {
      throw Errors.badRequest("Invalid room code format. Must be 6 alphanumeric characters.");
    }

    // Join the room
    const result = await joinRoom(address, roomCode);

    if (!result) {
      throw Errors.notFound("Room not found or already full");
    }

    return NextResponse.json({
      success: true,
      matchId: result.id,
      hostAddress: result.hostAddress,
    });
  } catch (error) {
    const apiError = handleError(error);
    return createErrorResponse(apiError);
  }
}
