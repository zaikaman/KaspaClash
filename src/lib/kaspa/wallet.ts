/**
 * Kaspa Wallet Connection Service
 * High-level wallet operations: connect, disconnect, sign
 * Compatible with Kasware wallet API
 */

import type {
  KaspaProvider,
  WalletConnection,
  SignMessageResult,
  KaspaAddress,
} from "@/types/kaspa";

/**
 * Kasware-specific wallet interface.
 * Kasware uses different method names than the generic KIP-12 spec.
 */
export interface KaswareWallet {
  requestAccounts(): Promise<string[]>;
  getAccounts(): Promise<string[]>;
  getNetwork(): Promise<string>;
  getBalance(): Promise<{ confirmed: number; unconfirmed: number; total: number }>;
  signMessage(message: string): Promise<string>;
  signPsbt?(psbtHex: string): Promise<string>;
  disconnect?(): Promise<void>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  off?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
  // Generic RPC request method for advanced operations
  request?<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
}

/**
 * Extended wallet interface that includes RPC support.
 * Use this type when you need to call request() method.
 */
export interface KaswareWalletWithRpc extends KaswareWallet {
  request<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
}

/**
 * Currently connected wallet.
 */
let currentWallet: KaswareWallet | null = null;

/**
 * Current wallet address.
 */
let currentAddress: KaspaAddress | null = null;

/**
 * Get Kasware wallet from window object.
 */
function getKaswareWallet(): KaswareWallet | null {
  if (typeof window === "undefined") return null;

  const win = window as unknown as { kasware?: KaswareWallet };

  if (win.kasware && typeof win.kasware.requestAccounts === "function") {
    return win.kasware;
  }

  return null;
}

/**
 * Connect to a Kaspa wallet.
 * Will use Kasware wallet if available.
 */
export async function connectWallet(
  provider?: KaspaProvider
): Promise<WalletConnection> {
  try {
    // Try Kasware first (most common)
    const kasware = getKaswareWallet();

    if (kasware) {
      console.log("Connecting via Kasware...");
      const accounts = await kasware.requestAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from Kasware");
      }

      const address = accounts[0];
      currentWallet = kasware;
      currentAddress = address as KaspaAddress;

      // Set up event listeners
      setupKaswareListeners(kasware);

      console.log("Wallet connected:", address);

      return {
        address,
        network: detectNetwork(address),
      };
    }

    // Fall back to generic KIP-12 provider if provided
    if (provider && typeof provider.connect === "function") {
      console.log("Connecting via KIP-12 provider...");
      const result = await provider.connect();

      if (!result.address) {
        throw new Error("Wallet connection failed: No address returned");
      }

      currentAddress = result.address as KaspaAddress;

      console.log("Wallet connected:", result.address);

      return {
        address: result.address,
        network: detectNetwork(result.address),
      };
    }

    throw new Error(
      "No Kaspa wallet found. Please install Kasware, Kaspium, or another compatible wallet."
    );
  } catch (error) {
    console.error("Wallet connection error:", error);
    throw error;
  }
}

/**
 * Disconnect from the current wallet.
 */
export async function disconnectWallet(): Promise<void> {
  if (currentWallet?.disconnect) {
    try {
      await currentWallet.disconnect();
    } catch (e) {
      console.warn("Disconnect method failed:", e);
    }
  }

  currentWallet = null;
  currentAddress = null;

  console.log("Wallet disconnected");
}

/**
 * Get the current connected address.
 */
export function getConnectedAddress(): KaspaAddress | null {
  return currentAddress;
}

/**
 * Check if a wallet is currently connected.
 */
export function isWalletConnected(): boolean {
  return currentWallet !== null && currentAddress !== null;
}

/**
 * Get the current wallet provider.
 * Returns the Kasware wallet object or null if not connected.
 */
export function getProvider(): KaswareWallet | null {
  return currentWallet;
}

/**
 * Get the current wallet provider with RPC support.
 * Returns null if wallet doesn't support RPC requests.
 */
export function getProviderWithRpc(): KaswareWalletWithRpc | null {
  if (currentWallet && currentWallet.request) {
    return currentWallet as KaswareWalletWithRpc;
  }
  return null;
}

/**
 * Sign a message with the connected wallet.
 */
export async function signMessage(message: string): Promise<SignMessageResult> {
  if (!currentWallet || !currentAddress) {
    throw new Error("No wallet connected");
  }

  try {
    const signature = await currentWallet.signMessage(message);

    return {
      signature,
      publicKey: "", // Kasware doesn't return public key separately
    };
  } catch (error) {
    console.error("Sign message error:", error);
    throw new Error("Failed to sign message. User may have rejected the request.");
  }
}

/**
 * Sign a transaction with the connected wallet.
 */
export async function signTransaction(transaction: string): Promise<string> {
  if (!currentWallet || !currentAddress) {
    throw new Error("No wallet connected");
  }

  try {
    // Kasware uses signPsbt for transaction signing
    if (currentWallet.signPsbt) {
      const signedTx = await currentWallet.signPsbt(transaction);
      return signedTx;
    }
    throw new Error("Transaction signing not supported by this wallet");
  } catch (error) {
    console.error("Sign transaction error:", error);
    throw new Error("Failed to sign transaction. User may have rejected the request.");
  }
}

/**
 * Get wallet balance.
 */
export async function getBalance(): Promise<bigint> {
  if (!currentWallet) {
    throw new Error("No wallet connected");
  }

  try {
    const balance = await currentWallet.getBalance();
    // Balance is in sompi, convert to bigint
    return BigInt(balance.total);
  } catch (error) {
    console.error("Get balance error:", error);
    throw new Error("Failed to get wallet balance");
  }
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Detect network from address prefix.
 */
function detectNetwork(address: string): "mainnet" | "testnet" {
  if (address.startsWith("kaspatest:")) {
    return "testnet";
  }
  return "mainnet";
}

/**
 * Set up event listeners for Kasware wallet.
 */
function setupKaswareListeners(wallet: KaswareWallet): void {
  if (!wallet.on) return;

  wallet.on("accountsChanged", (accounts: unknown) => {
    const accountList = accounts as string[];
    if (accountList && accountList.length > 0) {
      console.log("Wallet account changed:", accountList[0]);
      currentAddress = accountList[0] as KaspaAddress;

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("kaspa:accountChange", { detail: { address: accountList[0] } })
        );
      }
    }
  });

  wallet.on("networkChanged", (network: unknown) => {
    console.log("Wallet network changed:", network);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("kaspa:networkChange", { detail: { network } })
      );
    }
  });
}
