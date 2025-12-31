/**
 * Kaspa Wallet Connection Service
 * High-level wallet operations: connect, disconnect, sign
 */

import type {
  KaspaProvider,
  WalletConnection,
  SignMessageResult,
  KaspaAddress,
} from "@/types/kaspa";
import { discoverWallet } from "./wallet-discovery";

/**
 * Currently connected wallet provider.
 */
let currentProvider: KaspaProvider | null = null;

/**
 * Current wallet address.
 */
let currentAddress: KaspaAddress | null = null;

/**
 * Connect to a Kaspa wallet.
 * Will discover available wallets if no provider is specified.
 */
export async function connectWallet(
  provider?: KaspaProvider
): Promise<WalletConnection> {
  try {
    // Use provided provider or discover one
    const walletProvider = provider || (await discoverWallet());

    if (!walletProvider) {
      throw new Error(
        "No Kaspa wallet found. Please install Kasware, Kaspium, or another compatible wallet."
      );
    }

    // Connect to the wallet
    const result = await walletProvider.connect();

    if (!result.address) {
      throw new Error("Wallet connection failed: No address returned");
    }

    // Store current connection
    currentProvider = walletProvider;
    currentAddress = result.address as KaspaAddress;

    // Set up event listeners
    setupProviderListeners(walletProvider);

    console.log("Wallet connected:", result.address);

    return {
      address: result.address,
      network: detectNetwork(result.address),
    };
  } catch (error) {
    console.error("Wallet connection error:", error);
    throw error;
  }
}

/**
 * Disconnect from the current wallet.
 */
export async function disconnectWallet(): Promise<void> {
  if (currentProvider?.disconnect) {
    await currentProvider.disconnect();
  }

  // Clean up listeners
  if (currentProvider?.off) {
    currentProvider.off("accountChange", handleAccountChange);
    currentProvider.off("disconnect", handleDisconnect);
  }

  currentProvider = null;
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
 * Get the current wallet provider.
 */
export function getProvider(): KaspaProvider | null {
  return currentProvider;
}

/**
 * Check if a wallet is currently connected.
 */
export function isWalletConnected(): boolean {
  return currentProvider !== null && currentAddress !== null;
}

/**
 * Sign a message with the connected wallet.
 */
export async function signMessage(message: string): Promise<SignMessageResult> {
  if (!currentProvider || !currentAddress) {
    throw new Error("No wallet connected");
  }

  try {
    const result = await currentProvider.request<SignMessageResult>(
      "kaspa_signMessage",
      {
        message,
        address: currentAddress,
      }
    );

    return result;
  } catch (error) {
    console.error("Sign message error:", error);
    throw new Error("Failed to sign message. User may have rejected the request.");
  }
}

/**
 * Sign a transaction with the connected wallet.
 */
export async function signTransaction(transaction: string): Promise<string> {
  if (!currentProvider || !currentAddress) {
    throw new Error("No wallet connected");
  }

  try {
    const result = await currentProvider.request<{ signedTransaction: string }>(
      "kaspa_signTransaction",
      {
        transaction,
      }
    );

    return result.signedTransaction;
  } catch (error) {
    console.error("Sign transaction error:", error);
    throw new Error("Failed to sign transaction. User may have rejected the request.");
  }
}

/**
 * Get wallet balance.
 */
export async function getBalance(): Promise<bigint> {
  if (!currentProvider || !currentAddress) {
    throw new Error("No wallet connected");
  }

  try {
    const result = await currentProvider.request<{ balance: string }>(
      "kaspa_getBalance",
      {
        address: currentAddress,
      }
    );

    return BigInt(result.balance);
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
 * Set up event listeners for provider events.
 */
function setupProviderListeners(provider: KaspaProvider): void {
  provider.on("accountChange", handleAccountChange);
  provider.on("disconnect", handleDisconnect);
}

/**
 * Handle account change event from wallet.
 */
function handleAccountChange(data: unknown): void {
  const { address } = data as { address: string };
  console.log("Wallet account changed:", address);
  currentAddress = address as KaspaAddress;

  // Dispatch custom event for React components to listen
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("kaspa:accountChange", { detail: { address } })
    );
  }
}

/**
 * Handle disconnect event from wallet.
 */
function handleDisconnect(): void {
  console.log("Wallet disconnected by extension");
  currentProvider = null;
  currentAddress = null;

  // Dispatch custom event for React components to listen
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("kaspa:disconnect"));
  }
}
