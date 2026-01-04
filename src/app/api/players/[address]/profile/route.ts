/**
 * Player Profile Update API Route
 * Endpoint: PATCH /api/players/[address]/profile
 * Handles avatar upload and display name changes
 */

import { NextRequest, NextResponse } from "next/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { updatePlayerProfile, getPlayer } from "@/lib/player/registration";
import { uploadAvatar } from "@/lib/cloudinary/upload";
import type { Player } from "@/types";

/**
 * Profile update response.
 */
interface ProfileUpdateResponse {
    player: Player;
    message: string;
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
 * Validate display name format.
 */
function isValidDisplayName(name: string): boolean {
    return (
        typeof name === "string" &&
        name.length >= 1 &&
        name.length <= 32 &&
        /^[a-zA-Z0-9_]+$/.test(name)
    );
}

/**
 * PATCH /api/players/[address]/profile
 * Update player profile (display name and/or avatar).
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ address: string }> }
): Promise<NextResponse<ProfileUpdateResponse | ApiErrorResponse>> {
    try {
        const { address } = await context.params;

        // Validate address
        if (!address) {
            throw Errors.badRequest("Address is required");
        }

        const decodedAddress = decodeURIComponent(address);

        if (!isValidKaspaAddress(decodedAddress)) {
            throw Errors.invalidAddress(decodedAddress);
        }

        // Check if player exists
        const existingPlayer = await getPlayer(decodedAddress);
        if (!existingPlayer) {
            throw Errors.notFound("Player");
        }

        // Parse request body
        const body = await request.json();
        const { displayName, avatarBase64 } = body;

        const updates: { displayName?: string; avatarUrl?: string } = {};

        // Validate and process display name
        if (displayName !== undefined) {
            if (!isValidDisplayName(displayName)) {
                throw Errors.badRequest(
                    "Display name must be 1-32 characters and contain only letters, numbers, and underscores"
                );
            }
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
}
