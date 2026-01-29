import { NextRequest, NextResponse } from "next/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { updatePlayerProfile, getPlayer } from "@/lib/player/registration";
import { uploadAvatar } from "@/lib/cloudinary/upload";
import { withWalletAuth } from "@/lib/api/auth-middleware";
import { playerUpdateSchema, validateBody } from "@/lib/api/validators";
import type { Player } from "@/types";

/**
 * Profile update response.
 */
interface ProfileUpdateResponse {
    player: Player;
    message: string;
}

/**
 * PATCH /api/players/[address]/profile
 * Update player profile (display name and/or avatar).
 */
export const PATCH = withWalletAuth(async (
    request: NextRequest,
    context: { params: Promise<any> }
): Promise<NextResponse<any>> => {
    try {
        const { address } = await context.params;

        // Validate address
        if (!address) {
            throw Errors.badRequest("Address is required");
        }

        const decodedAddress = decodeURIComponent(address);

        // Ensure authentication address matches the address in the URL
        const authAddress = request.headers.get("X-Authenticated-Address");
        if (authAddress && authAddress !== decodedAddress) {
            throw Errors.forbidden("You can only update your own profile");
        }

        // Check if player exists
        const existingPlayer = await getPlayer(decodedAddress);
        if (!existingPlayer) {
            throw Errors.notFound("Player");
        }

        // Parse request body
        const body = await request.json();

        // Validate inputs using Zod
        const validation = validateBody(body, playerUpdateSchema);
        if (!validation.success) {
            throw Errors.badRequest(validation.error);
        }

        const { displayName } = validation.data;
        // avatarBase64 is passed separately as it's not in the shared schema yet
        const { avatarBase64 } = body;

        const updates: { displayName?: string; avatarUrl?: string } = {};

        // Process display name from validated data
        if (displayName) {
            updates.displayName = displayName;
        }

        // Process avatar upload if provided
        if (avatarBase64) {
            if (typeof avatarBase64 !== "string") {
                throw Errors.badRequest("Avatar must be a base64 encoded string");
            }

            // Upload to Cloudinary
            const avatarUrl = await uploadAvatar(avatarBase64, decodedAddress);
            updates.avatarUrl = avatarUrl;
        }

        // Check if there's anything to update
        if (Object.keys(updates).length === 0) {
            throw Errors.badRequest("No updates provided");
        }

        // Update player profile
        const updatedPlayer = await updatePlayerProfile(decodedAddress, updates);

        if (!updatedPlayer) {
            throw new Error("Failed to update player profile");
        }

        return NextResponse.json({
            player: updatedPlayer,
            message: "Profile updated successfully",
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
});
