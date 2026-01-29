import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import { verifyWalletSignature, verifySignatureSecp256k1 } from "@/lib/api/auth-middleware";
import { kaspaAddressSchema } from "@/lib/api/validators";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { address, signature, timestamp } = body;

        // Basic validation
        if (!address || !signature || !timestamp) {
            return createErrorResponse(
                new ApiError(ErrorCodes.BAD_REQUEST, "Missing required fields")
            );
        }

        // Validate timestamp (5 mins expiry)
        const timestampMs = parseInt(timestamp, 10);
        if (Date.now() - timestampMs > 5 * 60 * 1000) {
            return createErrorResponse(
                new ApiError(ErrorCodes.UNAUTHORIZED, "Request expired")
            );
        }

        // Verify signature
        // Message format must match what the client signs: "POST:/api/auth/login:<timestamp>"
        // Ideally we should use a consistent message format or just "Login to KaspaClash:<timestamp>"
        // But for consistency with auth-middleware, let's use the path.
        // However, generic "Login" message is better for UX.
        // Let's standardise on: "Login to KaspaClash: <timestamp>" for this specific endpoint
        const message = `Login to KaspaClash:${timestamp}`;
        // OR reuse the middleware standard: "POST:/api/auth/login:<timestamp>"
        // Let's use the middleware standard to avoid confusion in client code?
        // Actually, explicit login usually needs a clearer message.
        // Let's support "Login to KaspaClash:${timestamp}" as it's friendlier.

        let isValid = false;
        try {
            isValid = await verifyWalletSignature(address, message, signature);
        } catch {
            isValid = await verifySignatureSecp256k1(address, message, signature);
        }

        if (!isValid) {
            // Fallback: try the middleware standard format just in case client used that
            const altMessage = `POST:/api/auth/login:${timestamp}`;
            try {
                isValid = await verifyWalletSignature(address, altMessage, signature);
            } catch {
                try {
                    isValid = await verifySignatureSecp256k1(address, altMessage, signature);
                } catch { }
            }
        }

        if (!isValid) {
            return createErrorResponse(
                new ApiError(ErrorCodes.UNAUTHORIZED, "Invalid signature")
            );
        }

        // Generate token
        const token = crypto.randomUUID();
        // Set expiry (7 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const supabase = await createSupabaseServerClient();

        // Ensure user exists in players table to satisfy FK constraint
        const { error: playerError } = await (supabase as any)
            .from("players")
            .upsert(
                { address: address },
                { onConflict: "address", ignoreDuplicates: true }
            );

        if (playerError) {
            console.error("Auto-registration error:", playerError);
            // We continue, as it might be a permissions issue and the user might already exist
        }

        // Save session
        const { error } = await (supabase as any)
            .from("session_tokens")
            .insert({
                player_address: address,
                token: token,
                expires_at: expiresAt.toISOString()
            });

        if (error) {
            console.error("Login session error:", error);
            return createErrorResponse(
                new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to create session")
            );
        }

        return NextResponse.json({
            success: true,
            token,
            expiresAt: expiresAt.toISOString()
        });

    } catch (error) {
        console.error("Login error:", error);
        return createErrorResponse(
            new ApiError(ErrorCodes.INTERNAL_ERROR, "Login failed")
        );
    }
}
