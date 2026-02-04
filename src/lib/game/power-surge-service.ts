/**
 * Power Surge Service
 * Handles the client-side flow for selecting and claiming power surge cards
 * 
 * Optimized Flow (matches move-service for speed):
 * 1. Show power surge cards UI
 * 2. Player clicks a card
 * 3. Trigger Kaspa wallet transaction (1 KAS to self with payload)
 * 4. Submit selection to API immediately (don't wait for block confirmation)
 * 5. Apply effect locally - fire-and-forget background confirmation check
 * 
 * This mirrors the fast move submission pattern where wallet acceptance
 * is treated as sufficient proof of commitment.
 */

import { EventBus } from "@/game/EventBus";
import type { PowerSurgeCardId } from "@/types/power-surge";
import { encodeSurgePayload, getPowerSurgeCard } from "@/types/power-surge";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Amount to send (1 KAS = 100,000,000 sompi) */
const SURGE_TX_AMOUNT_SOMPI = 100_000_000;

// Kaspa has 10 BPS (100ms blocks) after Crescendo hardfork
// Transaction should be confirmed in ~1 second
const BLOCK_CONFIRMATION_CHECK_DELAY_MS = 100; // Wait 100ms between checks
const BLOCK_CONFIRMATION_MAX_RETRIES = 12; // Max 12 checks = ~1.2 seconds
const BLOCK_CONFIRMATION_TIMEOUT_MS = 3000; // 3 second absolute timeout

// Skip waiting for block confirmation - just fire and submit to API immediately
// Set to true for fastest possible experience (wallet accept = good enough)
const SKIP_BLOCK_CONFIRMATION = true;

// =============================================================================
// TYPES
// =============================================================================

export interface ClaimSurgeResult {
  success: boolean;
  cardId: PowerSurgeCardId;
  txId?: string;
  error?: string;
}

export interface SurgeSelectionState {
  isSelecting: boolean;
  selectedCardId: PowerSurgeCardId | null;
  txId: string | null;
  confirmed: boolean;
  error: string | null;
}

// =============================================================================
// POWER SURGE SERVICE
// =============================================================================

/**
 * Claim a power surge card by sending a Kaspa transaction.
 * Optimized for speed - submits to API immediately after wallet accepts tx.
 * 
 * @param matchId - Match ID
 * @param roundNumber - Current round number
 * @param cardId - Selected card ID
 * @param playerAddress - Player's Kaspa address
 * @param offeredCards - Array of card IDs offered this round (optional)
 * @returns Result with success status, txId, and any errors
 */
export async function claimPowerSurge(
  matchId: string,
  roundNumber: number,
  cardId: PowerSurgeCardId,
  playerAddress: string,
  offeredCards?: PowerSurgeCardId[]
): Promise<ClaimSurgeResult> {
  const startTime = Date.now();
  
  try {
    console.log(`[PowerSurgeService] ⚡ Claiming surge: ${cardId} for round ${roundNumber}`);

    // Step 1: Build the transaction payload
    const payload = encodeSurgePayload(cardId, matchId, roundNumber);
    console.log(`[PowerSurgeService] Payload: ${payload}`);

    // Step 2: Send Kaspa transaction to self
    const { sendKaspa, getConnectedAddress } = await import("@/lib/kaspa/wallet");

    const currentAddress = getConnectedAddress();
    if (!currentAddress || currentAddress !== playerAddress) {
      throw new Error("Wallet not connected or address mismatch");
    }

    console.log(`[PowerSurgeService] Sending ${SURGE_TX_AMOUNT_SOMPI} sompi to self with payload`);

    // Emit event for UI to show "Inscribing..." state
    EventBus.emit("surge:inscribing", { cardId });

    // Send transaction to self with payload
    const txId = await sendKaspa(playerAddress, SURGE_TX_AMOUNT_SOMPI, payload);
    const txAcceptedTime = Date.now();
    console.log(`[PowerSurgeService] ⚡ TX accepted by wallet in ${txAcceptedTime - startTime}ms, txId: ${txId}`);

    // Emit event for UI update - transaction accepted by wallet
    EventBus.emit("surge:txSent", { cardId, txId });

    // Step 3: Submit to API immediately (don't wait for block confirmation)
    // The txId proves the player committed to this choice
    console.log(`[PowerSurgeService] ⚡ Submitting to API immediately...`);
    const apiResult = await submitSurgeSelection(matchId, roundNumber, cardId, txId, playerAddress, offeredCards);
    const apiTime = Date.now();
    console.log(`[PowerSurgeService] ⚡ API response in ${apiTime - txAcceptedTime}ms`);
    
    if (!apiResult.success) {
      throw new Error(apiResult.error || "Failed to submit surge selection");
    }

    // Emit confirmed event
    EventBus.emit("surge:confirmed", { cardId, txId });
    console.log(`[PowerSurgeService] ⚡ Surge selection complete in ${Date.now() - startTime}ms`);

    // Step 4: Fire-and-forget block confirmation check (just for logging/analytics)
    if (!SKIP_BLOCK_CONFIRMATION) {
      waitForBlockConfirmation(txId, playerAddress).then(confirmed => {
        if (confirmed) {
          console.log(`[PowerSurgeService] ✓ Background: TX confirmed in block`);
        } else {
          console.log(`[PowerSurgeService] Background: TX not yet confirmed in block`);
        }
      }).catch(() => {});
    }

    return {
      success: true,
      cardId,
      txId,
    };
  } catch (error) {
    console.error(`[PowerSurgeService] Error claiming surge:`, error);
    EventBus.emit("surge:error", { cardId, error: error instanceof Error ? error.message : "Unknown error" });

    return {
      success: false,
      cardId,
      error: error instanceof Error ? error.message : "Failed to claim power surge",
    };
  }
}

/**
 * Check if a transaction is confirmed in a block using server-side API.
 * Uses the same fast verification endpoint as move-service.
 */
async function checkBlockConfirmation(
  txId: string, 
  network: 'mainnet' | 'testnet'
): Promise<{ confirmed: boolean; inMempool: boolean; elapsed: number }> {
  const start = Date.now();
  try {
    const response = await fetch('/api/verify-mempool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId, network }),
    });

    if (!response.ok) {
      return { confirmed: false, inMempool: false, elapsed: Date.now() - start };
    }

    const data = await response.json();
    return { 
      confirmed: data.confirmed === true,
      inMempool: data.inMempool === true, 
      elapsed: data.elapsed || Date.now() - start 
    };
  } catch (error) {
    console.warn('[PowerSurgeService] Block confirmation check error:', error);
    return { confirmed: false, inMempool: false, elapsed: Date.now() - start };
  }
}

/**
 * Wait for transaction to be confirmed in a block.
 * Kaspa has 10 BPS (100ms blocks) so tx should be confirmed in ~1 second.
 * Uses the same optimized approach as move-service.
 */
async function waitForBlockConfirmation(txId: string, address: string): Promise<boolean> {
  const startTime = Date.now();
  const network = address.startsWith("kaspatest:") ? "testnet" : "mainnet";

  console.log(`[PowerSurgeService] ⚡ Waiting for tx ${txId.substring(0, 16)}... to be confirmed in block`);

  // Brief delay to let transaction propagate
  await new Promise(resolve => setTimeout(resolve, BLOCK_CONFIRMATION_CHECK_DELAY_MS));

  // Check repeatedly until confirmed or timeout
  for (let i = 0; i < BLOCK_CONFIRMATION_MAX_RETRIES; i++) {
    // Check timeout
    if (Date.now() - startTime > BLOCK_CONFIRMATION_TIMEOUT_MS) {
      break;
    }

    const result = await checkBlockConfirmation(txId, network);
    
    if (result.confirmed) {
      const elapsed = Date.now() - startTime;
      console.log(`[PowerSurgeService] ⚡ ✓ TX CONFIRMED in block after ${elapsed}ms`);
      return true;
    }

    // Log if in mempool but not yet confirmed (first check only)
    if (result.inMempool && i === 0) {
      console.log(`[PowerSurgeService] TX in mempool, waiting for block confirmation...`);
    }

    // Wait before next check (unless it's the last retry)
    if (i < BLOCK_CONFIRMATION_MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, BLOCK_CONFIRMATION_CHECK_DELAY_MS));
    }
  }

  // Timeout reached
  const elapsed = Date.now() - startTime;
  console.warn(`[PowerSurgeService] TX not confirmed after ${elapsed}ms - proceeding optimistically`);
  return false;
}

/**
 * Submit surge selection to the API.
 */
async function submitSurgeSelection(
  matchId: string,
  roundNumber: number,
  cardId: PowerSurgeCardId,
  txId: string,
  playerAddress: string,
  offeredCards?: PowerSurgeCardId[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use txId as proof of payment - no additional signature needed
    const response = await fetch(`/api/matches/${matchId}/power-surge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardId,
        roundNumber,
        txId,
        playerAddress,
        offeredCards,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[PowerSurgeService] API error ${response.status}:`, errorData);
      return { success: false, error: errorData.message || errorData.error || `API request failed (${response.status})` };
    }

    return { success: true };
  } catch (error) {
    console.error(`[PowerSurgeService] API submission error:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Fetch available surge cards for a round.
 */
export async function fetchSurgeCards(
  matchId: string,
  roundNumber: number
): Promise<{ cards: PowerSurgeCardId[]; deadline: number } | null> {
  try {
    const response = await fetch(`/api/matches/${matchId}/power-surge?round=${roundNumber}`);
    if (!response.ok) {
      console.error(`[PowerSurgeService] Failed to fetch surge cards:`, response.status);
      return null;
    }

    const data = await response.json();
    return {
      cards: data.data?.offeredCards || [],
      deadline: Date.now() + 15000, // 15 second deadline from now
    };
  } catch (error) {
    console.error(`[PowerSurgeService] Error fetching surge cards:`, error);
    return null;
  }
}

/**
 * Get the active surge effects for a round.
 */
export async function getActiveSurges(
  matchId: string,
  roundNumber: number
): Promise<{
  player1: PowerSurgeCardId | null;
  player2: PowerSurgeCardId | null;
} | null> {
  try {
    const response = await fetch(`/api/matches/${matchId}/power-surge?round=${roundNumber}`);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      player1: data.data?.player1Selection?.cardId || null,
      player2: data.data?.player2Selection?.cardId || null,
    };
  } catch (error) {
    console.error(`[PowerSurgeService] Error getting active surges:`, error);
    return null;
  }
}
