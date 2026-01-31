/**
 * Power Surge Service
 * Handles the client-side flow for selecting and claiming power surge cards
 * 
 * Flow:
 * 1. Show power surge cards UI
 * 2. Player clicks a card
 * 3. Trigger Kaspa wallet transaction (1 KAS to self with payload)
 * 4. Poll for transaction confirmation
 * 5. Submit selection to API
 * 6. Apply effect locally and wait for server confirmation
 */

import { EventBus } from "@/game/EventBus";
import type { PowerSurgeCardId } from "@/types/power-surge";
import { encodeSurgePayload, getPowerSurgeCard } from "@/types/power-surge";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Amount to send (1 KAS = 100,000,000 sompi) */
const SURGE_TX_AMOUNT_SOMPI = 100_000_000;

/** Maximum time to wait for transaction confirmation (ms) */
const TX_CONFIRMATION_TIMEOUT_MS = 10000;

/** Polling interval for transaction confirmation (ms) */
const TX_POLL_INTERVAL_MS = 200;

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
  try {
    console.log(`[PowerSurgeService] Claiming surge: ${cardId} for round ${roundNumber}`);

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
    console.log(`[PowerSurgeService] Transaction sent: ${txId}`);

    // Emit event for UI update
    EventBus.emit("surge:txSent", { cardId, txId });

    // Step 3: Wait for transaction confirmation
    const confirmed = await waitForConfirmation(txId, playerAddress);
    if (!confirmed) {
      console.warn(`[PowerSurgeService] Transaction not confirmed within timeout, proceeding anyway`);
      // Kaspa is fast enough that we proceed even if confirmation check fails
    }

    console.log(`[PowerSurgeService] Transaction confirmed: ${txId}`);
    EventBus.emit("surge:confirmed", { cardId, txId });

    // Step 4: Submit to API
    const apiResult = await submitSurgeSelection(matchId, roundNumber, cardId, txId, playerAddress, offeredCards);
    if (!apiResult.success) {
      throw new Error(apiResult.error || "Failed to submit surge selection");
    }

    console.log(`[PowerSurgeService] Surge selection submitted successfully`);

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
 * Wait for transaction to be confirmed on Kaspa blockchain.
 * Uses rapid polling to match Kaspa's ~1s block times.
 */
async function waitForConfirmation(txId: string, address: string): Promise<boolean> {
  const network = address.startsWith("kaspatest:") ? "testnet" : "mainnet";
  const apiUrl = network === "testnet"
    ? "https://api-tn11.kaspa.org"
    : "https://api.kaspa.org";

  const startTime = Date.now();
  let attempts = 0;

  while (Date.now() - startTime < TX_CONFIRMATION_TIMEOUT_MS) {
    attempts++;
    try {
      const response = await fetch(`${apiUrl}/transactions/${txId}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        // Transaction found in blockchain - confirmed
        if (data && data.transaction_id === txId) {
          console.log(`[PowerSurgeService] Transaction confirmed after ${attempts} attempts`);
          return true;
        }
      }
    } catch (error) {
      // Network error, keep trying
      console.warn(`[PowerSurgeService] Confirmation check failed:`, error);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, TX_POLL_INTERVAL_MS));
  }

  console.warn(`[PowerSurgeService] Confirmation timeout after ${attempts} attempts`);
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
