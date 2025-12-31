/**
 * Kaspa blockchain types for KaspaClash
 * Wallet provider interface and transaction types
 */

// =============================================================================
// WALLET PROVIDER (KIP-12)
// =============================================================================

/**
 * Kaspa wallet provider interface following KIP-12 standard.
 * Implemented by browser extensions like Kasware, Kaspium, Kastle.
 */
export interface KaspaProvider {
  /** Provider name (e.g., "Kasware", "Kaspium") */
  name?: string;

  /** Connect to wallet and get address */
  connect(): Promise<{ address: string }>;

  /** Disconnect from wallet */
  disconnect?(): Promise<void>;

  /** Generic RPC request method */
  request<T = unknown>(method: string, params?: unknown): Promise<T>;

  /** Subscribe to events */
  on(event: string, handler: (...args: unknown[]) => void): void;

  /** Unsubscribe from events */
  off?(event: string, handler: (...args: unknown[]) => void): void;

  /** Check if connected */
  isConnected?(): boolean;
}

/**
 * Wallet connection result.
 */
export interface WalletConnection {
  address: string;
  publicKey?: string;
  network?: "mainnet" | "testnet";
}

/**
 * Wallet discovery result.
 */
export interface WalletDiscoveryResult {
  provider: KaspaProvider;
  name: string;
  icon?: string;
}

// =============================================================================
// ADDRESSES
// =============================================================================

/**
 * Kaspa address type (mainnet or testnet).
 */
export type KaspaAddress = `kaspa:${string}` | `kaspatest:${string}`;

/**
 * Address validation result.
 */
export interface AddressValidation {
  isValid: boolean;
  network?: "mainnet" | "testnet";
  error?: string;
}

// =============================================================================
// TRANSACTIONS
// =============================================================================

/**
 * Transaction input (UTXO being spent).
 */
export interface TransactionInput {
  previousOutpoint: {
    transactionId: string;
    index: number;
  };
  signatureScript?: string;
  sequence?: number;
}

/**
 * Transaction output.
 */
export interface TransactionOutput {
  value: bigint | number;
  scriptPublicKey: {
    script: string;
    version: number;
  };
}

/**
 * Kaspa transaction structure.
 */
export interface Transaction {
  /** Transaction ID (hash) */
  id: string;
  /** Transaction version */
  version: number;
  /** Transaction inputs */
  inputs: TransactionInput[];
  /** Transaction outputs */
  outputs: TransactionOutput[];
  /** Lock time */
  lockTime: number;
  /** Subnetwork ID */
  subnetworkId: string;
  /** Transaction payload (for coinbase) */
  payload?: string;
}

/**
 * Signed transaction ready for submission.
 */
export interface SignedTransaction {
  transaction: Transaction;
  signatures: string[];
}

/**
 * Transaction submission result.
 */
export interface TransactionSubmitResult {
  transactionId: string;
}

/**
 * Transaction confirmation status.
 */
export interface TransactionStatus {
  txId: string;
  confirmed: boolean;
  blockHeight?: number;
  confirmations?: number;
  timestamp?: number;
}

// =============================================================================
// UTXO
// =============================================================================

/**
 * Unspent Transaction Output.
 */
export interface UTXO {
  outpoint: {
    transactionId: string;
    index: number;
  };
  utxoEntry: {
    amount: bigint | number;
    scriptPublicKey: {
      script: string;
      version: number;
    };
    blockDaaScore: number;
    isCoinbase: boolean;
  };
}

/**
 * UTXO set for an address.
 */
export interface UTXOSet {
  address: string;
  utxos: UTXO[];
  balance: bigint;
}

// =============================================================================
// RPC RESPONSES
// =============================================================================

/**
 * Balance info from RPC.
 */
export interface BalanceInfo {
  address: string;
  balance: bigint;
}

/**
 * Block info from RPC.
 */
export interface BlockInfo {
  hash: string;
  header: {
    version: number;
    timestamp: number;
    bits: number;
    nonce: number;
    daaScore: number;
    blueScore: number;
  };
  transactions: Transaction[];
}

// =============================================================================
// WALLET STATE
// =============================================================================

/**
 * Wallet connection state.
 */
export type WalletConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/**
 * Wallet state for UI.
 */
export interface WalletState {
  connectionState: WalletConnectionState;
  address: KaspaAddress | null;
  balance: bigint | null;
  network: "mainnet" | "testnet" | null;
  provider: KaspaProvider | null;
  error: string | null;
}

// =============================================================================
// SIGNATURE
// =============================================================================

/**
 * Message signature request.
 */
export interface SignMessageRequest {
  message: string;
  address: string;
}

/**
 * Message signature result.
 */
export interface SignMessageResult {
  signature: string;
  publicKey: string;
}

// =============================================================================
// PROVIDER EVENTS
// =============================================================================

/**
 * Kaspa provider event types.
 */
export type KaspaProviderEvent =
  | "connect"
  | "disconnect"
  | "accountChange"
  | "networkChange";

/**
 * Event handler types for each event.
 */
export interface KaspaProviderEventMap {
  connect: { address: string };
  disconnect: void;
  accountChange: { address: string };
  networkChange: { network: "mainnet" | "testnet" };
}
