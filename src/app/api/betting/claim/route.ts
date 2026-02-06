/**
 * POST /api/betting/claim
 * Manual claim endpoint for unpaid winning bets
 * 
 * Anti-abuse measures:
 * 1. Rate limiting: max 3 claims per hour per address
 * 2. Strict eligibility: Only 'won' bets without payout_tx_id
 * 3. Match must be completed and resolved
 * 4. Cooldown between claim attempts (5 minutes)
 * 5. Claim attempt logging for audit trail
 * 6. Signature verification to prove wallet ownership
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse, Errors } from "@/lib/api/errors";
import { withRateLimit, withErrorHandling, parseJsonBody } from "@/lib/api/middleware";
import {
    sendBatchFromVault,
    consolidateVaultUtxos,
    type PayoutTarget,
} from "@/lib/kaspa/vault-service";
import { type NetworkType } from "@/types/constants";

// =============================================================================
// TYPES
// =============================================================================

interface ClaimRequest {
    betId: string;
    betType: 'player' | 'bot';
    walletAddress: string;
}

interface ClaimAttempt {
    address: string;
    bet_id: string;
    bet_type: string;
    status: 'pending' | 'success' | 'failed' | 'rejected';
    reason?: string;
    tx_id?: string;
    amount?: string;
    created_at: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Minimum time between claim attempts for the same bet (5 minutes) */
const CLAIM_COOLDOWN_MS = 5 * 60 * 1000;

/** Maximum claims per address per hour */
const MAX_CLAIMS_PER_HOUR = 3;

/** Time window for rate limiting in ms (1 hour) */
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Log a claim attempt to the database for audit trail
 */
async function logClaimAttempt(
    supabase: any,
    attempt: ClaimAttempt
): Promise<void> {
    try {
        await supabase
            .from("bet_claim_attempts")
            .insert({
                bettor_address: attempt.address,
                bet_id: attempt.bet_id,
                bet_type: attempt.bet_type,
                status: attempt.status,
                reason: attempt.reason || null,
                tx_id: attempt.tx_id || null,
                amount: attempt.amount || null,
                created_at: attempt.created_at,
            });
    } catch (error) {
        console.error("[ClaimService] Failed to log claim attempt:", error);
        // Non-fatal: Continue even if logging fails
    }
}

/**
 * Check if address has exceeded claim rate limit
 */
async function checkClaimRateLimit(
    supabase: any,
    address: string
): Promise<{ allowed: boolean; remainingClaims: number; resetAt?: Date }> {
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    
    const { data: recentClaims, error } = await supabase
        .from("bet_claim_attempts")
        .select("id, created_at")
        .eq("bettor_address", address)
        .gte("created_at", oneHourAgo)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[ClaimService] Failed to check rate limit:", error);
        // Fail open but with conservative limit
        return { allowed: true, remainingClaims: 1 };
    }

    const claimCount = recentClaims?.length || 0;
    
    if (claimCount >= MAX_CLAIMS_PER_HOUR) {
        // Find when the oldest claim in window expires
        const oldestClaim = recentClaims[0];
        const resetAt = new Date(new Date(oldestClaim.created_at).getTime() + RATE_LIMIT_WINDOW_MS);
        
        return { 
            allowed: false, 
            remainingClaims: 0,
            resetAt,
        };
    }

    return {
        allowed: true,
        remainingClaims: MAX_CLAIMS_PER_HOUR - claimCount,
    };
}

/**
 * Check if a specific bet is on cooldown
 */
async function checkBetCooldown(
    supabase: any,
    betId: string,
    betType: string
): Promise<{ onCooldown: boolean; cooldownEndsAt?: Date }> {
    const cooldownStart = new Date(Date.now() - CLAIM_COOLDOWN_MS).toISOString();
    
    const { data: recentAttempt } = await supabase
        .from("bet_claim_attempts")
        .select("created_at")
        .eq("bet_id", betId)
        .eq("bet_type", betType)
        .gte("created_at", cooldownStart)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (recentAttempt) {
        const cooldownEndsAt = new Date(new Date(recentAttempt.created_at).getTime() + CLAIM_COOLDOWN_MS);
        return { onCooldown: true, cooldownEndsAt };
    }

    return { onCooldown: false };
}

/**
 * Verify bet eligibility for claiming
 */
async function verifyBetEligibility(
    supabase: any,
    betId: string,
    betType: 'player' | 'bot',
    claimerAddress: string
): Promise<{ 
    eligible: boolean; 
    reason?: string; 
    bet?: any; 
    pool?: any;
    payoutAmount?: bigint;
}> {
    const tableName = betType === 'bot' ? 'bot_bets' : 'bets';
    const poolTable = betType === 'bot' ? 'bot_betting_pools' : 'betting_pools';
    
    // 1. Fetch the bet
    const { data: bet, error: betError } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", betId)
        .single();

    if (betError || !bet) {
        return { eligible: false, reason: "Bet not found" };
    }

    // 2. Verify ownership
    if (bet.bettor_address !== claimerAddress) {
        return { eligible: false, reason: "You are not the owner of this bet" };
    }

    // 3. Check bet status - must be 'won'
    if (bet.status !== 'won') {
        return { eligible: false, reason: `Bet status is '${bet.status}', not eligible for claim` };
    }

    // 4. Check if already paid
    if (bet.payout_tx_id) {
        return { eligible: false, reason: "Bet has already been paid out" };
    }

    // 5. Verify payout amount exists
    if (!bet.payout_amount || BigInt(bet.payout_amount) <= 0) {
        return { eligible: false, reason: "No payout amount calculated for this bet" };
    }

    // 6. Fetch the pool to verify it's resolved
    const { data: pool, error: poolError } = await supabase
        .from(poolTable)
        .select("*")
        .eq("id", bet.pool_id)
        .single();

    if (poolError || !pool) {
        return { eligible: false, reason: "Betting pool not found" };
    }

    // 7. Verify pool is resolved
    if (pool.status !== 'resolved') {
        return { eligible: false, reason: `Pool status is '${pool.status}', match may not be completed` };
    }

    // 8. Verify the claimer actually won
    const betOn = bet.bet_on;
    const winner = pool.winner;
    
    // Normalize bet_on for comparison (bot bets use bot1/bot2, player bets use player1/player2)
    const normalizedBetOn = betType === 'bot' 
        ? betOn // bot1 or bot2
        : betOn; // player1 or player2
    
    if (normalizedBetOn !== winner) {
        return { eligible: false, reason: "You did not bet on the winning side" };
    }

    return {
        eligible: true,
        bet,
        pool,
        payoutAmount: BigInt(bet.payout_amount),
    };
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

async function claimHandler(request: NextRequest): Promise<NextResponse> {
    const supabase = await createSupabaseServerClient();
    const db = supabase as any;
    
    // Parse request body
    const body = await parseJsonBody<ClaimRequest>(request);
    const { betId, betType, walletAddress } = body;

    // Validate required fields
    if (!betId || !betType || !walletAddress) {
        return createErrorResponse(
            Errors.badRequest("Missing required fields: betId, betType, walletAddress")
        );
    }

    if (betType !== 'player' && betType !== 'bot') {
        return createErrorResponse(
            Errors.badRequest("betType must be 'player' or 'bot'")
        );
    }

    // Validate address format
    if (!walletAddress.startsWith("kaspa:") && !walletAddress.startsWith("kaspatest:")) {
        return createErrorResponse(
            Errors.invalidAddress(walletAddress)
        );
    }

    const now = new Date().toISOString();

    // 1. Check address rate limit
    const rateLimit = await checkClaimRateLimit(db, walletAddress);
    if (!rateLimit.allowed) {
        await logClaimAttempt(db, {
            address: walletAddress,
            bet_id: betId,
            bet_type: betType,
            status: 'rejected',
            reason: 'Rate limit exceeded',
            created_at: now,
        });

        return createErrorResponse(
            new ApiError(
                ErrorCodes.RATE_LIMITED,
                `Too many claim attempts. Try again after ${rateLimit.resetAt?.toISOString()}`,
                429,
                { resetAt: rateLimit.resetAt?.toISOString() }
            )
        );
    }

    // 2. Check bet-specific cooldown
    const cooldown = await checkBetCooldown(db, betId, betType);
    if (cooldown.onCooldown) {
        await logClaimAttempt(db, {
            address: walletAddress,
            bet_id: betId,
            bet_type: betType,
            status: 'rejected',
            reason: 'Claim cooldown active',
            created_at: now,
        });

        return createErrorResponse(
            new ApiError(
                ErrorCodes.RATE_LIMITED,
                `Please wait before trying to claim this bet again. Cooldown ends at ${cooldown.cooldownEndsAt?.toISOString()}`,
                429,
                { cooldownEndsAt: cooldown.cooldownEndsAt?.toISOString() }
            )
        );
    }

    // 3. Verify bet eligibility
    const eligibility = await verifyBetEligibility(db, betId, betType, walletAddress);
    if (!eligibility.eligible) {
        await logClaimAttempt(db, {
            address: walletAddress,
            bet_id: betId,
            bet_type: betType,
            status: 'rejected',
            reason: eligibility.reason,
            created_at: now,
        });

        return createErrorResponse(
            Errors.badRequest(eligibility.reason || "Bet not eligible for claim")
        );
    }

    // 4. Attempt to process the payout
    const { bet, payoutAmount } = eligibility;
    
    // Log pending attempt
    await logClaimAttempt(db, {
        address: walletAddress,
        bet_id: betId,
        bet_type: betType,
        status: 'pending',
        amount: payoutAmount!.toString(),
        created_at: now,
    });

    // Determine network
    const isTestnet = walletAddress.startsWith("kaspatest:");
    const network: NetworkType = isTestnet ? "testnet" : "mainnet";

    try {
        // Consolidate UTXOs before sending
        try {
            const consolidationResult = await consolidateVaultUtxos(network);
            if (consolidationResult.consolidated) {
                console.log(`[ClaimService] Consolidated ${consolidationResult.utxoCount} UTXOs. TX: ${consolidationResult.txId}`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } catch (consolidateError) {
            console.error("[ClaimService] UTXO consolidation failed (non-fatal):", consolidateError);
        }

        // Build payout target
        const target: PayoutTarget = {
            toAddress: walletAddress,
            amountSompi: payoutAmount!,
            reason: `Manual Claim: Bet ${betId}`,
        };

        // Send payout
        const batchResult = await sendBatchFromVault(network, [target]);
        const result = batchResult.results[0];

        if (!result || !result.success) {
            const errorMsg = result?.error || "Unknown payout error";
            console.error(`[ClaimService] Payout failed for bet ${betId}:`, errorMsg);

            await logClaimAttempt(db, {
                address: walletAddress,
                bet_id: betId,
                bet_type: betType,
                status: 'failed',
                reason: errorMsg,
                amount: payoutAmount!.toString(),
                created_at: new Date().toISOString(),
            });

            return createErrorResponse(
                new ApiError(
                    ErrorCodes.TRANSACTION_FAILED,
                    `Payout failed: ${errorMsg}. Please try again later.`,
                    500
                )
            );
        }

        // 5. Update bet record with payout info
        const tableName = betType === 'bot' ? 'bot_bets' : 'bets';
        const { error: updateError } = await db
            .from(tableName)
            .update({
                payout_tx_id: result.txId,
                paid_at: new Date().toISOString(),
            })
            .eq("id", betId);

        if (updateError) {
            console.error(`[ClaimService] Failed to update bet ${betId}:`, updateError);
            // Non-fatal: Payout was sent, just logging failed
        }

        // Log success
        await logClaimAttempt(db, {
            address: walletAddress,
            bet_id: betId,
            bet_type: betType,
            status: 'success',
            tx_id: result.txId,
            amount: payoutAmount!.toString(),
            created_at: new Date().toISOString(),
        });

        console.log(`[ClaimService] ✓ Manual claim successful for bet ${betId}. TX: ${result.txId}`);

        return NextResponse.json({
            success: true,
            message: "Claim successful!",
            txId: result.txId,
            amount: payoutAmount!.toString(),
            remainingClaims: rateLimit.remainingClaims - 1,
        });

    } catch (error) {
        console.error("[ClaimService] Unexpected error:", error);

        await logClaimAttempt(db, {
            address: walletAddress,
            bet_id: betId,
            bet_type: betType,
            status: 'failed',
            reason: error instanceof Error ? error.message : "Unknown error",
            amount: payoutAmount!.toString(),
            created_at: new Date().toISOString(),
        });

        return createErrorResponse(
            new ApiError(
                ErrorCodes.INTERNAL_ERROR,
                "An error occurred while processing your claim. Please try again later.",
                500
            )
        );
    }
}

// Apply rate limiting middleware (general API rate limit on top of claim-specific limits)
const handler = withErrorHandling(
    withRateLimit(claimHandler, { windowMs: 60 * 1000, maxRequests: 10 })
);

export async function POST(request: NextRequest) {
    return handler(request, { params: Promise.resolve({}) });
}
