import { NextRequest, NextResponse } from "next/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { joinRoom } from "@/lib/matchmaking/matchmaker";
import { withWalletAuth } from "@/lib/api/auth-middleware";
import { joinRoomSchema, validateBody } from "@/lib/api/validators";

/**
 * Join room response.
 */
interface JoinRoomResponse {
  success: boolean;
  matchId: string;
  hostAddress: string;
  stakeAmount?: string; // Stake per player in sompi (as string)
  stakeDeadlineAt?: string; // ISO timestamp deadline for stake deposits
}

/**
 * POST /api/matchmaking/rooms/join
 * Join an existing private room by code.
 * Returns stake info if the room has stakes enabled.
 */
export const POST = withWalletAuth(async (
  request: NextRequest
): Promise<NextResponse<JoinRoomResponse | ApiErrorResponse>> => {
  try {
    const body = await request.json();

    // Validate request using Zod
    const validation = validateBody(body, joinRoomSchema);
    if (!validation.success) {
      throw Errors.badRequest(validation.error);
    }

    const { address, roomCode } = validation.data;

    // Join the room
    const result = await joinRoom(address, roomCode);

    if (!result) {
      throw Errors.notFound("Room not found or already full");
    }

    return NextResponse.json({
      success: true,
      matchId: result.id,
      hostAddress: result.hostAddress,
      stakeAmount: result.stakeAmount,
      stakeDeadlineAt: result.stakeDeadlineAt,
    });
  } catch (error) {
    const apiError = handleError(error);
    return createErrorResponse(apiError);
  }
});

