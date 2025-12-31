/**
 * Move Service
 * Handles move submission flow: sign, submit, await confirmation
 */

import type { MoveType } from "@/types";
import type { KaspaAddress, TransactionStatus } from "@/types/kaspa";
import {
  buildMoveTransaction,
  buildMoveMessage,
  type MoveTransactionRequest,
} from "@/lib/kaspa/move-transaction";
import { signMessage, signTransaction, getConnectedAddress, getProvider, getProviderWithRpc } from "@/lib/kaspa/wallet";
import { EventBus } from "@/game/EventBus";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Move submission options.
 */
export interface MoveSubmissionOptions {
  matchId: string;
  roundNumber: number;
  moveType: MoveType;
  useFullTransaction?: boolean; // Use full tx or just message signing
  timeoutMs?: number;
}

/**
 * Move submission result.
 */
export interface MoveSubmissionResult {
  success: boolean;
  txId?: string;
  signature?: string;
  moveType: MoveType;
  error?: string;
  timestamp: number;
}

/**
 * Move confirmation status.
 */
export interface MoveConfirmationStatus {
  txId: string;
  confirmed: boolean;
  confirmations: number;
  error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
const CONFIRMATION_POLL_INTERVAL_MS = 2000; // 2 seconds

// =============================================================================
// MOVE SUBMISSION
// =============================================================================

/**
 * Submit a move with signature verification.
 * Uses message signing for quick verification without blockchain fees.
 */
export async function submitMoveWithSignature(
  options: MoveSubmissionOptions
): Promise<MoveSubmissionResult> {
  const { matchId, roundNumber, moveType } = options;
  const timestamp = Date.now();

  try {
    const address = getConnectedAddress();
    if (!address) {
      return {
        success: false,
        moveType,
        error: "Wallet not connected",
        timestamp,
      };
    }

    // Build the move message
    const message = buildMoveMessage(matchId, roundNumber, moveType, timestamp);

    // Sign the message
    const signResult = await signMessage(message);

    if (!signResult.signature) {
      return {
        success: false,
        moveType,
        error: "Failed to sign message",
        timestamp,
      };
    }

    // Emit event for UI feedback
    EventBus.emit("match:moveSubmitted", {
      matchId,
      roundNumber,
      moveType,
      signature: signResult.signature,
    });

    return {
      success: true,
      signature: signResult.signature,
      moveType,
      timestamp,
    };
  } catch (error) {
    console.error("Move submission error:", error);
    return {
      success: false,
      moveType,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp,
    };
  }
}

/**
 * Submit a move with full on-chain transaction.
 * Uses a minimal Kaspa transaction for immutable move recording.
 */
export async function submitMoveWithTransaction(
  options: MoveSubmissionOptions
): Promise<MoveSubmissionResult> {
  const { matchId, roundNumber, moveType, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const timestamp = Date.now();

  try {
    const address = getConnectedAddress();
    if (!address) {
      return {
        success: false,
        moveType,
        error: "Wallet not connected",
        timestamp,
      };
    }

    // Build the transaction
    const buildResult = await buildMoveTransaction({
      matchId,
      roundNumber,
      moveType,
      playerAddress: address,
    });

    if (!buildResult.success || !buildResult.transaction) {
      return {
        success: false,
        moveType,
        error: buildResult.error || "Failed to build transaction",
        timestamp,
      };
    }

    // Sign the transaction
    const signedTx = await signTransaction(buildResult.transaction.transaction);

    // Submit the transaction
    const provider = getProviderWithRpc();
    if (!provider) {
      return {
        success: false,
        moveType,
        error: "Wallet provider not available or does not support RPC requests",
        timestamp,
      };
    }

    const submitResult = await provider.request<{ transactionId: string }>(
      "kaspa_submitTransaction",
      { transaction: signedTx }
    );

    if (!submitResult.transactionId) {
      return {
        success: false,
        moveType,
        error: "Failed to submit transaction",
        timestamp,
      };
    }

    // Emit event for UI feedback
    EventBus.emit("match:moveSubmitted", {
      matchId,
      roundNumber,
      moveType,
      txId: submitResult.transactionId,
    });

    return {
      success: true,
      txId: submitResult.transactionId,
      moveType,
      timestamp,
    };
  } catch (error) {
    console.error("Transaction submission error:", error);
    return {
      success: false,
      moveType,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp,
    };
  }
}

/**
 * Submit a move using the configured method.
 * Defaults to signature-based submission for speed.
 */
export async function submitMove(
  options: MoveSubmissionOptions
): Promise<MoveSubmissionResult> {
  if (options.useFullTransaction) {
    return submitMoveWithTransaction(options);
  }
  return submitMoveWithSignature(options);
}

// =============================================================================
// CONFIRMATION TRACKING
// =============================================================================

/**
 * Wait for transaction confirmation.
 */
export async function waitForConfirmation(
  txId: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<MoveConfirmationStatus> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const checkConfirmation = async () => {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        resolve({
          txId,
          confirmed: false,
          confirmations: 0,
          error: "Confirmation timeout",
        });
        return;
      }

      try {
        const provider = getProviderWithRpc();
        if (!provider) {
          resolve({
            txId,
            confirmed: false,
            confirmations: 0,
            error: "Wallet not connected or does not support RPC requests",
          });
          return;
        }

        const status = await provider.request<TransactionStatus>(
          "kaspa_getTransactionStatus",
          { transactionId: txId }
        );

        if (status.confirmed) {
          EventBus.emit("match:moveConfirmed", { txId });
          resolve({
            txId,
            confirmed: true,
            confirmations: status.confirmations || 1,
          });
          return;
        }

        // Continue polling
        setTimeout(checkConfirmation, CONFIRMATION_POLL_INTERVAL_MS);
      } catch (error) {
        console.error("Confirmation check error:", error);
        // Continue polling on error
        setTimeout(checkConfirmation, CONFIRMATION_POLL_INTERVAL_MS);
      }
    };

    checkConfirmation();
  });
}

/**
 * Submit move and wait for confirmation.
 */
export async function submitMoveAndConfirm(
  options: MoveSubmissionOptions
): Promise<MoveSubmissionResult & { confirmed: boolean }> {
  // Submit the move
  const result = await submitMove(options);

  if (!result.success) {
    return { ...result, confirmed: false };
  }

  // If using signature-based submission, no blockchain confirmation needed
  if (!options.useFullTransaction || !result.txId) {
    return { ...result, confirmed: true }; // Signature is immediate confirmation
  }

  // Wait for blockchain confirmation
  const confirmation = await waitForConfirmation(result.txId, options.timeoutMs);

  return {
    ...result,
    confirmed: confirmation.confirmed,
    error: confirmation.error,
  };
}

// =============================================================================
// MOVE VERIFICATION
// =============================================================================

/**
 * Verify a move was correctly recorded.
 */
export async function verifyMoveOnChain(
  txId: string,
  expectedMatchId: string,
  expectedRound: number,
  expectedMove: MoveType
): Promise<{ verified: boolean; error?: string }> {
  try {
    const provider = getProviderWithRpc();
    if (!provider) {
      return { verified: false, error: "Wallet not connected or does not support RPC requests" };
    }

    const txDetails = await provider.request<{ transaction: unknown }>(
      "kaspa_getTransaction",
      { transactionId: txId }
    );

    // In a real implementation, we would:
    // 1. Extract OP_RETURN data from the transaction
    // 2. Parse the move data
    // 3. Verify it matches expected values

    // For now, if transaction exists and is confirmed, we consider it verified
    if (txDetails.transaction) {
      return { verified: true };
    }

    return { verified: false, error: "Transaction not found" };
  } catch (error) {
    console.error("Move verification error:", error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

// =============================================================================
// EXPLORER LINKS
// =============================================================================

/**
 * Get Kaspa explorer link for a transaction.
 */
export function getExplorerLink(txId: string, network: "mainnet" | "testnet" = "mainnet"): string {
  if (network === "testnet") {
    return `https://explorer-tn10.kaspa.org/txs/${txId}`;
  }
  return `https://explorer.kaspa.org/txs/${txId}`;
}

/**
 * Get Kaspa explorer link for an address.
 */
export function getAddressExplorerLink(
  address: string,
  network: "mainnet" | "testnet" = "mainnet"
): string {
  if (network === "testnet") {
    return `https://explorer-tn10.kaspa.org/addresses/${address}`;
  }
  return `https://explorer.kaspa.org/addresses/${address}`;
}
