/**
 * API Validators
 * Zod schemas for validating API inputs
 * Zod schemas for validating API inputs

 */

import { z } from "zod";

// ============================================================================
// BASE VALIDATORS
// ============================================================================

/**
 * Kaspa address validation

 * Verify Kaspa address (mainnet, testnet, simnet)
 */
export const kaspaAddressSchema = z.string()
    .min(45, "Kaspa address must be at least 45 characters")
    .max(100, "Kaspa address is too long")
    .regex(
        /^(kaspa|kaspatest|kaspasim):[a-z0-9]{40,90}$/,
        "Invalid Kaspa address"
    );

/**
 * UUID validation

 * Validate UUID format
 */
export const uuidSchema = z.string().uuid("Invalid UUID");

/**
 * Transaction ID validation (64 hex characters)

 * Validate blockchain transaction ID
 */
export const txIdSchema = z.string()
    .length(64, "Transaction ID must be exactly 64 characters")
    .regex(/^[a-f0-9]{64}$/i, "Invalid transaction ID");

/**
 * Sompi amount validation (bigint as string)

 * Validate sompi amount
 */
export const sompiAmountSchema = z.string()
    .regex(/^\d+$/, "Amount must be a positive integer")
    .refine((val) => BigInt(val) > 0n, "Amount must be greater than 0");

// ============================================================================
// GAME VALIDATORS
// ============================================================================

/**
 * Move type validation

 * Validate game move type
 */
export const moveTypeSchema = z.enum(
    ["punch", "kick", "block", "special"] as const
);

/**
 * Match format validation

 * Validate match format
 */
export const matchFormatSchema = z.enum(
    ["best_of_1", "best_of_3", "best_of_5"] as const
);

/**
 * Bet position validation

 * Validate bet position
 */
export const betPositionSchema = z.enum(
    ["player1", "player2"] as const
);

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

/**
 * Submit move request schema

 * Schema for submit move request
 */
export const submitMoveSchema = z.object({
    address: kaspaAddressSchema,
    moveType: moveTypeSchema,
    txId: txIdSchema,
});
export type SubmitMoveRequest = z.infer<typeof submitMoveSchema>;

/**
 * Place bet request schema

 * Schema for place bet request
 */
export const placeBetSchema = z.object({
    matchId: uuidSchema,
    betOn: betPositionSchema,
    amount: sompiAmountSchema,
    txId: txIdSchema,
    bettorAddress: kaspaAddressSchema,
});
export type PlaceBetRequest = z.infer<typeof placeBetSchema>;

/**
 * Shop purchase request schema

 * Schema for shop purchase request
 */
export const purchaseSchema = z.object({
    playerId: kaspaAddressSchema,
    cosmeticId: uuidSchema,
    nftTxId: txIdSchema.optional(),
    nftMetadata: z.any().optional(),
});
export type PurchaseRequest = z.infer<typeof purchaseSchema>;

/**
 * Player registration/update schema

 * Schema for player registration/update
 */
export const playerUpdateSchema = z.object({
    address: kaspaAddressSchema,
    displayName: z.string()
        .min(2, "Display name must be at least 2 characters")
        .max(32, "Display name must be at most 32 characters")
        .regex(/^[a-zA-Z0-9_\- ]+$/, "Name can only contain letters, numbers, underscores, dashes, and spaces")
        .optional(),
});
export type PlayerUpdateRequest = z.infer<typeof playerUpdateSchema>;

/**
 * Quest claim request schema

 * Schema for quest claim request
 */
export const questClaimSchema = z.object({
    playerAddress: kaspaAddressSchema,
    questId: uuidSchema,
});
export type QuestClaimRequest = z.infer<typeof questClaimSchema>;

/**
 * Join private room request schema

 * Schema for join private room request
 */
export const joinRoomSchema = z.object({
    address: kaspaAddressSchema,
    roomCode: z.string().length(6),
});
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;

/**
 * Matchmaking join request schema

 * Schema for matchmaking join request
 */
export const matchmakingJoinSchema = z.object({
    address: kaspaAddressSchema,
    characterId: z.string().min(1, "Character ID cannot be empty"),
    format: matchFormatSchema.optional(),
    stakeTxId: txIdSchema.optional(),
    stakeAmount: sompiAmountSchema.optional(),
});
export type MatchmakingJoinRequest = z.infer<typeof matchmakingJoinSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate request body against a schema

 * Validate request body against schema
 */
export function validateBody<T>(
    body: unknown,
    schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(body);

    if (!result.success) {
        const issues = result.error.issues;
        if (issues && issues.length > 0) {
            const firstError = issues[0];
            const path = firstError.path.length > 0 ? `${firstError.path.join(".")}: ` : "";
            return { success: false, error: `${path}${firstError.message}` };
        }
        return { success: false, error: "Validation failed" };
    }

    return { success: true, data: result.data };
}

/**
 * Create validation error response
 * Create validation error response

 */
export function createValidationError(error: z.ZodError<unknown>): string {
    return error.issues
        .map((e) => {
            const path = e.path.length > 0 ? `${e.path.join(".")}: ` : "";
            return `${path}${e.message}`;
        })
        .join("; ");
}
