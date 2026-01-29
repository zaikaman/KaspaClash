/**
 * Authentication Middleware
 * Authentication Middleware for protected API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse, Errors } from "./errors";
import { kaspaAddressSchema } from "./validators";

/**
 * Request handler type with typed params.
 */
export type ApiHandler<T = void> = (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse<T>>;

/**
 * Max age for timestamp validation (5 minutes in ms)
 */
const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000;

/**
 * Verify Kaspa wallet signature

 * 
 * @param address - Kaspa wallet address
 * @param message - Message that was signed
 * @param signature - Signature to verify
 * @returns Whether signature is valid
 */
export async function verifyWalletSignature(
    address: string,
    message: string,
    signature: string
): Promise<boolean> {
    try {
        // Validate inputs
        if (!address || !message || !signature) {
            console.error("[Auth] Missing required parameters");
            return false;
        }

        // Validate address format first
        const addressCheck = kaspaAddressSchema.safeParse(address);
        if (!addressCheck.success) {
            console.error("[Auth] Invalid address format:", address);
            return false;
        }

        // Dynamic import kaspa-wasm to avoid server bundle issues
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const kaspaWasm: any = await import("kaspa-wasm");

        // Use the signMessage verification if available
        // The API might vary between kaspa-wasm versions
        if (typeof kaspaWasm.verifyMessage === "function") {
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = Buffer.from(signature, "hex");
            return kaspaWasm.verifyMessage(address, messageBytes, signatureBytes);
        }

        // Alternative: Try to reconstruct public key from address and verify
        if (kaspaWasm.Address && kaspaWasm.PublicKey) {
            try {
                const addressObj = new kaspaWasm.Address(address);
                // Get the public key payload from address (version + pubkey)
                const payload = addressObj.payload;

                // Try XPublicKey if available
                if (kaspaWasm.XPublicKey && typeof kaspaWasm.XPublicKey.fromString === "function") {
                    const xPubKey = kaspaWasm.XPublicKey.fromString(payload);
                    const pubKey = new kaspaWasm.PublicKey(xPubKey);

                    const messageBytes = new TextEncoder().encode(message);
                    const signatureBytes = Buffer.from(signature, "hex");

                    if (typeof pubKey.verifyMessageSignature === "function") {
                        return pubKey.verifyMessageSignature(messageBytes, signatureBytes);
                    }
                }
            } catch (innerError) {
                console.error("[Auth] Public key extraction failed:", innerError);
            }
        }

        // If we reach here, kaspa-wasm doesn't have the expected API
        console.warn("[Auth] kaspa-wasm signature verification API not available");
        console.warn("[Auth] Please update kaspa-wasm or implement custom verification");

        // In development, we can bypass for testing
        if (process.env.NODE_ENV === "development" && process.env.BYPASS_AUTH === "true") {
            console.warn("[Auth] DEVELOPMENT: Bypassing signature check");
            return true;
        }

        return false;
    } catch (error) {
        console.error("[Auth] Signature verification error:", error);
        // In development, log more details
        if (process.env.NODE_ENV === "development") {
            console.error("[Auth] Address:", address);
            console.error("[Auth] Message:", message);
        }
        return false;
    }
}

/**
 * Simpler signature verification using secp256k1
 * For cases where kaspa-wasm doesn't work
 */
export async function verifySignatureSecp256k1(
    address: string,
    message: string,
    signature: string
): Promise<boolean> {
    try {
        const secp256k1 = await import("@noble/secp256k1");

        // Hash the message (Kaspa uses SHA-256)
        const encoder = new TextEncoder();
        const messageBuffer = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest("SHA-256", messageBuffer);
        const messageHash = new Uint8Array(hashBuffer);

        // Parse signature (64 bytes = r + s)
        const sigBytes = Buffer.from(signature, "hex");
        if (sigBytes.length !== 64) {
            console.error("[Auth] Invalid signature length:", sigBytes.length);
            return false;
        }

        // Extract public key from address (after prefix "kaspa:" or "kaspatest:")
        const addressParts = address.split(":");
        if (addressParts.length !== 2) {
            console.error("[Auth] Invalid address format");
            return false;
        }

        // The payload is bech32m encoded, we need to decode it
        // For now, we'll use a simplified check
        // TODO: Implement proper bech32m decoding

        // If we have the public key, verify
        // return secp256k1.verify(sigBytes, messageHash, pubKey);

        // Fallback: Check if address is valid format at minimum
        const isValidFormat = kaspaAddressSchema.safeParse(address).success;
        if (!isValidFormat) {
            return false;
        }

        // TODO: Complete implementation with proper bech32m decoding
        // For now, return false as we cannot verify without proper decoding
        console.warn("[Auth] Full signature verification not yet implemented");
        return false;

    } catch (error) {
        console.error("[Auth] secp256k1 verification error:", error);
        return false;
    }
}

/**
 * Extract auth headers from request

 */
interface AuthHeaders {
    signature: string | null;
    address: string | null;
    timestamp: string | null;
}

function extractAuthHeaders(request: NextRequest): AuthHeaders {
    return {
        signature: request.headers.get("X-Signature"),
        address: request.headers.get("X-Wallet-Address"),
        timestamp: request.headers.get("X-Timestamp"),
    };
}

/**
 * Wallet authentication middleware
 * Middleware requiring wallet authentication for sensitive endpoints
 */
export function withWalletAuth<T>(handler: ApiHandler<T>): ApiHandler<T> {
    return async (request, context) => {
        // Check for session token (Bearer)
        const authHeader = request.headers.get("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];

            // Allow bypassing DB check in development specific cases if needed, but safer to always check
            // We need to verify token against DB.
            // Since this is edge-compatible middleware, we use createSupabaseServerClient
            // However, depending on context, we might not be able to use server actions.
            // But this is an API handler wrapper, so we are in an API route context.
            try {
                const supabase = await createSupabaseServerClient();
                const { data: session } = await (supabase as any)
                    .from("session_tokens")
                    .select("player_address, expires_at")
                    .eq("token", token)
                    .single();

                if (session && new Date(session.expires_at) > new Date()) {
                    // Valid session
                    // Update last_used_at async (fire and forget)
                    void (supabase as any)
                        .from("session_tokens")
                        .update({ last_used_at: new Date().toISOString() })
                        .eq("token", token);

                    // Add authenticated address to request headers for downstream use
                    request.headers.set("X-Authenticated-Address", session.player_address);

                    return handler(request, context);
                }
            } catch (err) {
                console.error("[Auth] Session verification failed:", err);
            }
        }

        const { signature, address, timestamp } = extractAuthHeaders(request);

        // Check all required headers are present
        if (!signature || !address || !timestamp) {
            return createErrorResponse(
                Errors.unauthorized("Missing authentication headers. Please connect your wallet or login.")
            ) as NextResponse<T>;
        }

        // Validate address format
        const addressValidation = kaspaAddressSchema.safeParse(address);
        if (!addressValidation.success) {
            return createErrorResponse(
                Errors.invalidAddress(address)
            ) as NextResponse<T>;
        }

        // Validate timestamp is not too old
        const timestampMs = parseInt(timestamp, 10);
        if (isNaN(timestampMs)) {
            return createErrorResponse(
                Errors.badRequest("Invalid timestamp")
            ) as NextResponse<T>;
        }

        const timeDiff = Date.now() - timestampMs;
        if (timeDiff > MAX_TIMESTAMP_AGE_MS) {
            return createErrorResponse(
                Errors.unauthorized("Request expired. Please try again.")
            ) as NextResponse<T>;
        }

        // Prevent future timestamps (with 1 minute tolerance)
        if (timeDiff < -60000) {
            return createErrorResponse(
                Errors.badRequest("Invalid future timestamp")
            ) as NextResponse<T>;
        }

        // Construct the message that should have been signed
        const method = request.method;
        const url = new URL(request.url);
        const path = url.pathname;
        const message = `${method}:${path}:${timestamp}`;

        // Verify signature
        let isValid = false;
        try {
            // Try kaspa-wasm first
            isValid = await verifyWalletSignature(address, message, signature);
        } catch {
            // Fallback to secp256k1
            isValid = await verifySignatureSecp256k1(address, message, signature);
        }

        if (!isValid) {
            // In development mode, allow bypass for testing
            if (process.env.NODE_ENV === "development" && process.env.BYPASS_AUTH === "true") {
                console.warn("[Auth] Bypassing signature verification in development mode");
            } else {
                return createErrorResponse(
                    Errors.invalidSignature()
                ) as NextResponse<T>;
            }
        }

        // Add authenticated address to request headers for downstream use
        request.headers.set("X-Authenticated-Address", address);

        // Continue with the handler
        return handler(request, context);
    };
}


/**
 * Optional wallet auth - extracts address if provided but doesn't require it
 */
export function withOptionalWalletAuth<T>(handler: ApiHandler<T>): ApiHandler<T> {
    return async (request, context) => {
        // Check for session token (Bearer) - Optional
        const authHeader = request.headers.get("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const supabase = await createSupabaseServerClient();
                const { data: session } = await (supabase as any)
                    .from("session_tokens")
                    .select("player_address, expires_at")
                    .eq("token", token)
                    .single();

                if (session && new Date(session.expires_at) > new Date()) {
                    request.headers.set("X-Authenticated-Address", session.player_address);
                    return handler(request, context);
                }
            } catch { }
        }

        const { signature, address, timestamp } = extractAuthHeaders(request);

        // If no auth headers, just continue
        if (!signature || !address || !timestamp) {
            return handler(request, context);
        }

        // If headers present, validate them
        const addressValidation = kaspaAddressSchema.safeParse(address);
        if (!addressValidation.success) {
            return handler(request, context); // Invalid but optional, continue
        }

        const timestampMs = parseInt(timestamp, 10);
        if (isNaN(timestampMs) || Date.now() - timestampMs > MAX_TIMESTAMP_AGE_MS) {
            return handler(request, context); // Expired but optional, continue
        }

        // Try to verify signature
        const message = `${request.method}:${new URL(request.url).pathname}:${timestamp}`;
        let isValid = false;

        try {
            isValid = await verifyWalletSignature(address, message, signature);
        } catch {
            try {
                isValid = await verifySignatureSecp256k1(address, message, signature);
            } catch {
                // Verification failed, continue without auth
            }
        }

        if (isValid) {
            const modifiedHeaders = new Headers(request.headers);
            modifiedHeaders.set("X-Authenticated-Address", address);
        }

        return handler(request, context);
    };
}

/**
 * Admin/Cron authorization middleware
 * Authentication middleware for admin and cron jobs
 */
export function withCronAuth<T>(handler: ApiHandler<T>): ApiHandler<T> {
    return async (request, context) => {
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        // Reject if no secret configured
        if (!cronSecret) {
            console.error("[Cron] CRON_SECRET not configured");
            return createErrorResponse(
                new ApiError(ErrorCodes.INTERNAL_ERROR, "Invalid server configuration", 500)
            ) as NextResponse<T>;
        }

        // Check Bearer token
        if (authHeader === `Bearer ${cronSecret}`) {
            return handler(request, context);
        }

        // Check Vercel cron signature (properly verify HMAC)
        const vercelSignature = request.headers.get("x-vercel-signature");
        if (vercelSignature) {
            try {
                // Import crypto for HMAC
                const crypto = await import("crypto");
                const hmac = crypto.createHmac("sha256", cronSecret);
                hmac.update(request.url);
                const expectedSignature = hmac.digest("hex");

                if (vercelSignature === expectedSignature) {
                    return handler(request, context);
                }
            } catch (error) {
                console.error("[Cron] HMAC verification error:", error);
            }
        }

        return createErrorResponse(
            Errors.unauthorized("Unauthorized cron request")
        ) as NextResponse<T>;
    };
}

/**
 * Get authenticated address from request
 
 */
export function getAuthenticatedAddress(request: NextRequest): string | null {
    return request.headers.get("X-Authenticated-Address");
}
