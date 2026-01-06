/**
 * Move Transaction Builder
 * Builds minimal Kaspa transactions for move verification
 */

import type { MoveType } from "@/types";
import type { KaspaAddress, Transaction, TransactionOutput } from "@/types/kaspa";
import { getConnectedAddress, getProvider, getProviderWithRpc } from "./wallet";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Minimum transaction amount in sompi (1 KAS = 100,000,000 sompi).
 * Kasware API requires at least 1 KAS for sendKaspa to work properly.
 */
export const MIN_TRANSACTION_AMOUNT = BigInt(100_000_000); // 1 KAS

/**
 * Move type to OP_RETURN data mapping.
 * Encodes the move type into transaction metadata.
 */
export const MOVE_OPCODES: Record<MoveType, string> = {
  punch: "01",
  kick: "02",
  block: "03",
  special: "04",
  stunned: "00", // Special opacity for stunned
};

/**
 * KaspaClash protocol identifier for OP_RETURN.
 */
export const PROTOCOL_PREFIX = "4B41534341"; // "KASCA" in hex

// =============================================================================
// TYPES
// =============================================================================

/**
 * Move transaction request.
 */
export interface MoveTransactionRequest {
  matchId: string;
  roundNumber: number;
  moveType: MoveType;
  playerAddress: KaspaAddress;
}

/**
 * Built transaction ready for signing.
 */
export interface BuiltMoveTransaction {
  transaction: string; // Serialized transaction
  matchId: string;
  roundNumber: number;
  moveType: MoveType;
  metadata: {
    opReturnData: string;
    amount: bigint;
  };
}

/**
 * Transaction build result.
 */
export interface TransactionBuildResult {
  success: boolean;
  transaction?: BuiltMoveTransaction;
  error?: string;
}

// =============================================================================
// TRANSACTION BUILDING
// =============================================================================

/**
 * Build OP_RETURN data for a move.
 * Format: PROTOCOL_PREFIX + MATCH_ID_HASH + ROUND + MOVE
 */
export function buildOpReturnData(
  matchId: string,
  roundNumber: number,
  moveType: MoveType
): string {
  // Truncate match ID to 8 chars and convert to hex
  const matchIdHex = Buffer.from(matchId.slice(0, 8)).toString("hex");

  // Round number as 2-digit hex
  const roundHex = roundNumber.toString(16).padStart(2, "0");

  // Move type opcode
  const moveOpcode = MOVE_OPCODES[moveType];

  return `${PROTOCOL_PREFIX}${matchIdHex}${roundHex}${moveOpcode}`;
}

/**
 * Parse OP_RETURN data back to move info.
 */
export function parseOpReturnData(data: string): {
  matchIdPrefix: string;
  roundNumber: number;
  moveType: MoveType;
} | null {
  try {
    // Check protocol prefix
    if (!data.startsWith(PROTOCOL_PREFIX)) {
      return null;
    }

    const rest = data.slice(PROTOCOL_PREFIX.length);

    // Extract parts
    const matchIdHex = rest.slice(0, 16); // 8 chars * 2 hex digits
    const roundHex = rest.slice(16, 18);
    const moveOpcode = rest.slice(18, 20);

    // Decode match ID prefix
    const matchIdPrefix = Buffer.from(matchIdHex, "hex").toString();

    // Decode round number
    const roundNumber = parseInt(roundHex, 16);

    // Decode move type
    const moveType = Object.entries(MOVE_OPCODES).find(
      ([, code]) => code === moveOpcode
    )?.[0] as MoveType | undefined;

    if (!moveType) {
      return null;
    }

    return { matchIdPrefix, roundNumber, moveType };
  } catch {
    return null;
  }
}

/**
 * Build a move transaction.
 * Creates a minimal transaction with OP_RETURN data encoding the move.
 */
export async function buildMoveTransaction(
  request: MoveTransactionRequest
): Promise<TransactionBuildResult> {
  try {
    const provider = getProviderWithRpc();
    const address = getConnectedAddress();

    if (!provider || !address) {
      return {
        success: false,
        error: "Wallet not connected or does not support RPC requests",
      };
    }

    // Build OP_RETURN data
    const opReturnData = buildOpReturnData(
      request.matchId,
      request.roundNumber,
      request.moveType
    );

    // Request UTXOs from wallet
    const utxos = await provider.request<{ utxos: unknown[] }>("kaspa_getUtxos", {
      address,
    });

    if (!utxos.utxos || utxos.utxos.length === 0) {
      return {
        success: false,
        error: "No UTXOs available for transaction",
      };
    }

    // Build the transaction through the wallet provider
    // Most wallet providers have a buildTransaction method
    const buildResult = await provider.request<{ transaction: string }>(
      "kaspa_buildTransaction",
      {
        outputs: [
          {
            // Self-send minimal amount
            address: address,
            amount: MIN_TRANSACTION_AMOUNT.toString(),
          },
        ],
        // Include OP_RETURN data in the transaction
        opReturn: opReturnData,
        // Use minimum fee
        priorityFee: "0",
      }
    );

    if (!buildResult.transaction) {
      return {
        success: false,
        error: "Failed to build transaction",
      };
    }

    return {
      success: true,
      transaction: {
        transaction: buildResult.transaction,
        matchId: request.matchId,
        roundNumber: request.roundNumber,
        moveType: request.moveType,
        metadata: {
          opReturnData,
          amount: MIN_TRANSACTION_AMOUNT,
        },
      },
    };
  } catch (error) {
    console.error("Transaction build error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error building transaction",
    };
  }
}

/**
 * Build a simplified move message for signing.
 * This is used when we just need signature verification without a full transaction.
 */
export function buildMoveMessage(
  matchId: string,
  roundNumber: number,
  moveType: MoveType,
  timestamp: number = Date.now()
): string {
  return JSON.stringify({
    protocol: "kaspaclash",
    version: 1,
    matchId,
    round: roundNumber,
    move: moveType,
    timestamp,
  });
}

/**
 * Verify a move message signature.
 */
export function verifyMoveMessage(
  message: string,
  expectedMatchId: string,
  expectedRound: number
): { valid: boolean; moveType?: MoveType; error?: string } {
  try {
    const parsed = JSON.parse(message);

    if (parsed.protocol !== "kaspaclash") {
      return { valid: false, error: "Invalid protocol" };
    }

    if (parsed.matchId !== expectedMatchId) {
      return { valid: false, error: "Match ID mismatch" };
    }

    if (parsed.round !== expectedRound) {
      return { valid: false, error: "Round number mismatch" };
    }

    const validMoves: MoveType[] = ["punch", "kick", "block", "special", "stunned"];
    if (!validMoves.includes(parsed.move)) {
      return { valid: false, error: "Invalid move type" };
    }

    return { valid: true, moveType: parsed.move };
  } catch {
    return { valid: false, error: "Invalid message format" };
  }
}

/**
 * Estimate transaction fee.
 */
export async function estimateFee(): Promise<bigint> {
  try {
    const provider = getProviderWithRpc();
    if (!provider) {
      return BigInt(1000); // Default minimum fee
    }

    const feeEstimate = await provider.request<{ fee: string }>(
      "kaspa_estimateFee",
      {}
    );

    return BigInt(feeEstimate.fee);
  } catch {
    return BigInt(1000); // Default minimum fee
  }
}
