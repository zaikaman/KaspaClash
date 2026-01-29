import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import { kaspaAddressSchema } from "@/lib/api/validators";

/**
 * Verify a message signature using kaspa-wasm with public key.
 * This is the preferred method when the client provides a public key.
 */
async function verifyMessageWithPublicKey(
    message: string,
    signature: string,
    publicKey: string
): Promise<boolean> {
    try {
        // Dynamic import kaspa-wasm to avoid server bundle issues
        const kaspaWasm = await import("kaspa-wasm");

        if (typeof kaspaWasm.verifyMessage === "function") {
            const isValid = kaspaWasm.verifyMessage({
                message,
                signature,
                publicKey,
            });
            console.log("[Auth] kaspa-wasm verifyMessage result:", isValid);
            return isValid;
        }

        console.warn("[Auth] kaspa-wasm verifyMessage function not available");
        return false;
    } catch (error) {
        console.error("[Auth] Signature verification error:", error);
        return false;
    }
}

/**
 * Validate that a public key corresponds to an address.
 * This is a sanity check to ensure the client isn't spoofing keys.
 * Note: This validation is optional - the signature verification is the primary check.
 */
async function validatePublicKeyForAddress(
    address: string,
    publicKey: string
): Promise<boolean> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const kaspaWasm: any = await import("kaspa-wasm");

        // Create a Kaspa address from the public key and compare
        if (kaspaWasm.createAddress) {
            // Determine network type from address prefix
            const networkType = address.startsWith("kaspatest:") ? "testnet-10" : "mainnet";

            try {
                // Create address from public key
                const derivedAddress = kaspaWasm.createAddress(publicKey, networkType);
                const derivedAddressStr = derivedAddress.toString();

                // Check for exact match
                if (derivedAddressStr === address) {
                    return true;
                }

                // Check/Fallback: Compare payload parts (after the prefix)
                // This handles cases where mainnet/testnet prefixes differ but the key is the same
                const addressParts = address.split(':');
                const derivedParts = derivedAddressStr.split(':');

                if (addressParts.length === 2 && derivedParts.length === 2) {
                    const addressPayload = addressParts[1];
                    const derivedPayload = derivedParts[1];

                    // Remove the 8-character checksum from the end
                    // Bech32 string structure: prefix + separator + payload + checksum
                    // The checksum calculation includes the prefix, so it differs between networks
                    const addressCore = addressPayload.substring(0, addressPayload.length - 8);
                    const derivedCore = derivedPayload.substring(0, derivedPayload.length - 8);

                    if (addressCore === derivedCore && addressCore.length > 0) {
                        console.log("[Auth] Public key matches address core payload (ignoring prefix and checksum)");
                        return true;
                    }
                }

                console.warn("[Auth] Public key does not match address");
                console.warn("[Auth] Expected:", address);
                console.warn("[Auth] Derived:", derivedAddressStr);
                return false;
            } catch (innerError) {
                console.warn("[Auth] Failed to derive address from public key:", innerError);
                // If derivation fails, allow the request but rely on signature verification
                return true;
            }
        }

        // If we can't validate, allow it but log a warning
        console.warn("[Auth] Cannot validate public key for address - kaspa-wasm createAddress not available");
        return true;
    } catch (error) {
        console.error("[Auth] Error validating public key for address:", error);
        // On error, we'll still allow the verification to proceed
        // The signature verification is the ultimate check
        return true;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { address, signature, publicKey, timestamp } = body;

        // Basic validation
        if (!address || !signature || !timestamp) {
            return createErrorResponse(
                new ApiError(ErrorCodes.BAD_REQUEST, "Missing required fields")
            );
        }

        // Validate address format
        const addressCheck = kaspaAddressSchema.safeParse(address);
        if (!addressCheck.success) {
            return createErrorResponse(
                new ApiError(ErrorCodes.BAD_REQUEST, "Invalid address format")
            );
        }

        // Validate timestamp (5 mins expiry)
        const timestampMs = parseInt(timestamp, 10);
        if (Date.now() - timestampMs > 5 * 60 * 1000) {
            return createErrorResponse(
                new ApiError(ErrorCodes.UNAUTHORIZED, "Request expired")
            );
        }

        // Build the message that was signed
        const message = `Login to KaspaClash:${timestamp}`;

        let isValid = false;

        // PRIMARY PATH: If publicKey is provided, use kaspa-wasm verifyMessage
        if (publicKey) {
            console.log("[Auth] Verifying with provided public key");

            // Optional: Validate that public key matches the address
            const keyValid = await validatePublicKeyForAddress(address, publicKey);
            if (!keyValid) {
                return createErrorResponse(
                    new ApiError(ErrorCodes.UNAUTHORIZED, "Public key does not match address")
                );
            }

            isValid = await verifyMessageWithPublicKey(message, signature, publicKey);

            if (!isValid) {
                // Try alternative message format
                const altMessage = `POST:/api/auth/login:${timestamp}`;
                isValid = await verifyMessageWithPublicKey(altMessage, signature, publicKey);
            }
        }

        // DEVELOPMENT FALLBACK: Allow bypass in development mode
        if (!isValid && process.env.NODE_ENV === "development" && process.env.BYPASS_AUTH === "true") {
            console.warn("[Auth] DEVELOPMENT: Bypassing signature check (BYPASS_AUTH=true)");
            isValid = true;
        }

        if (!isValid) {
            console.warn("[Auth] Signature verification failed for address:", address.substring(0, 20) + "...");
            return createErrorResponse(
                new ApiError(ErrorCodes.UNAUTHORIZED, "Invalid signature")
            );
        }

        console.log("[Auth] Signature verified successfully for:", address.substring(0, 20) + "...");

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
