/**
 * Stake Confirmation API Route
 * Endpoint: POST /api/matchmaking/rooms/stake
 *
 * Used by players to confirm their stake deposit before a staked match.
 * Both players must deposit their stake before the match can proceed.
 */

import { NextRequest, NextResponse } from "next/server";
import { Errors, handleError, createErrorResponse, type ApiErrorResponse } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { broadcastToChannel } from "@/lib/supabase/broadcast";

/**
 * Stake confirmation request body.
 */
interface ConfirmStakeRequest {
    matchId: string;
    playerAddress: string;
    txId: string; // Transaction ID of the stake deposit
}

/**
 * Stake confirmation response.
 */
interface ConfirmStakeResponse {
    success: boolean;
    bothConfirmed: boolean; // True if both players have now deposited
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
 * POST /api/matchmaking/rooms/stake
 * Confirm a player's stake deposit for a staked match.
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ConfirmStakeResponse | ApiErrorResponse>> {
    try {
        const body = (await request.json()) as ConfirmStakeRequest;
        const { matchId, playerAddress, txId } = body;

        // Validate request
        if (!matchId) {
            throw Errors.badRequest("Match ID is required");
        }

        if (!playerAddress) {
            throw Errors.badRequest("Player address is required");
        }

        if (!isValidKaspaAddress(playerAddress)) {
            throw Errors.invalidAddress(playerAddress);
        }

        if (!txId) {
            throw Errors.badRequest("Transaction ID is required");
        }

        const supabase = await createSupabaseServerClient();

        // Get the match
        const { data: match, error: fetchError } = await supabase
            .from("matches")
            .select("id, player1_address, player2_address, stake_amount, player1_stake_tx_id, player2_stake_tx_id, stakes_confirmed, status")
            .eq("id", matchId)
            .single() as {
                data: {
                    id: string;
                    player1_address: string;
                    player2_address: string;
                    stake_amount: string | null;
                    player1_stake_tx_id: string | null;
                    player2_stake_tx_id: string | null;
                    stakes_confirmed: boolean;
                    status: string;
                } | null; error: any
            };

        if (fetchError || !match) {
            throw Errors.notFound("Match not found");
        }

        // Validate match state
        if (!match.stake_amount || BigInt(match.stake_amount) <= 0) {
            throw Errors.badRequest("This match does not have stakes");
        }

        if (match.stakes_confirmed) {
            throw Errors.conflict("Stakes have already been confirmed");
        }

        if (match.status !== "character_select") {
            throw Errors.conflict("Match is not in the correct state for stake confirmation");
        }

        // Determine which player this is
        const isPlayer1 = match.player1_address === playerAddress;
        const isPlayer2 = match.player2_address === playerAddress;

        if (!isPlayer1 && !isPlayer2) {
            throw Errors.unauthorized("You are not a participant in this match");
        }

        // Check if already confirmed
        if (isPlayer1 && match.player1_stake_tx_id) {
            throw Errors.conflict("You have already confirmed your stake");
        }
        if (isPlayer2 && match.player2_stake_tx_id) {
            throw Errors.conflict("You have already confirmed your stake");
        }

        // Update the match with the stake transaction
        const updateData: Record<string, unknown> = {};
        if (isPlayer1) {
            updateData.player1_stake_tx_id = txId;
        } else {
            updateData.player2_stake_tx_id = txId;
        }

        // Check if both stakes will be confirmed after this update
        const otherPlayerConfirmed = isPlayer1
            ? !!match.player2_stake_tx_id
            : !!match.player1_stake_tx_id;

        const bothConfirmed = otherPlayerConfirmed;
        if (bothConfirmed) {
            updateData.stakes_confirmed = true;
            // Start the character selection timer now that stakes are confirmed
            const CHARACTER_SELECT_TIMEOUT_SECONDS = 30;
            updateData.selection_deadline_at = new Date(
                Date.now() + CHARACTER_SELECT_TIMEOUT_SECONDS * 1000
            ).toISOString();
        }

        const { error: updateError } = await supabase
            .from("matches")
            .update(updateData as any)
            .eq("id", matchId);

        if (updateError) {
            console.error("Failed to update stake confirmation:", updateError);
            throw Errors.badRequest("Failed to confirm stake");
        }

        console.log(`[StakeConfirm] Player ${playerAddress.slice(-8)} confirmed stake for match ${matchId.slice(0, 8)}, txId: ${txId.slice(0, 12)}...`);

        // Broadcast stake_confirmed event
        try {
            await broadcastToChannel(supabase, `match:${matchId}`, "stake_confirmed", {
                matchId,
                playerAddress,
                isPlayer1,
                txId,
                bothConfirmed,
            });

            if (bothConfirmed) {
                // Broadcast stakes_ready event when both players have deposited
                await broadcastToChannel(supabase, `match:${matchId}`, "stakes_ready", {
                    matchId,
                    player1TxId: isPlayer1 ? txId : match.player1_stake_tx_id,
                    player2TxId: isPlayer2 ? txId : match.player2_stake_tx_id,
                });
                console.log(`[StakeConfirm] Both stakes confirmed for match ${matchId.slice(0, 8)} - broadcasting stakes_ready`);
            }
        } catch (broadcastError) {
            console.error("[StakeConfirm] Failed to broadcast:", broadcastError);
            // Continue even if broadcast fails
        }

        return NextResponse.json({
            success: true,
            bothConfirmed,
        });
    } catch (error) {
        const apiError = handleError(error);
        return createErrorResponse(apiError);
    }
}
