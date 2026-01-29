/**
 * useWallet Hook
 * React hook for wallet connection, disconnection, and signing operations
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useWalletStore, selectIsConnected, selectIsConnecting, selectFormattedBalance, selectTruncatedAddress, selectHasHydrated } from "@/stores/wallet-store";
import { connectWallet, disconnectWallet, signMessage as signWalletMessage, getBalance, isWalletConnected, tryReconnect, getPublicKey as getWalletPublicKey } from "@/lib/kaspa/wallet";
import { discoverAllWallets } from "@/lib/kaspa/wallet-discovery";
import type { KaspaAddress, KaspaProvider, WalletDiscoveryResult } from "@/types/kaspa";

/**
 * Hook return type for useWallet.
 */
export interface UseWalletReturn {
  // State
  address: KaspaAddress | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | null;
  truncatedAddress: string | null;
  network: "mainnet" | "testnet" | null;
  error: string | null;
  availableWallets: WalletDiscoveryResult[];

  // Actions
  connect: (provider?: KaspaProvider) => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signMessageWithPublicKey: (message: string) => Promise<{ signature: string; publicKey: string }>;
  getPublicKey: () => Promise<string | null>;
  refreshBalance: () => Promise<void>;
  discoverWallets: () => Promise<WalletDiscoveryResult[]>;
}

/**
 * React hook for Kaspa wallet interactions.
 * Provides wallet connection, disconnection, and signing functionality.
 */
export function useWallet(): UseWalletReturn {
  const store = useWalletStore();
  const [availableWallets, setAvailableWallets] = useState<WalletDiscoveryResult[]>([]);

  // Derived state from store
  const isConnected = useWalletStore(selectIsConnected);
  const isConnecting = useWalletStore(selectIsConnecting);
  const formattedBalance = useWalletStore(selectFormattedBalance);
  const truncatedAddress = useWalletStore(selectTruncatedAddress);
  const hasHydrated = useWalletStore(selectHasHydrated);

  /**
   * Discover available wallets.
   */
  const discoverWallets = useCallback(async (): Promise<WalletDiscoveryResult[]> => {
    const wallets = await discoverAllWallets();
    setAvailableWallets(wallets);
    return wallets;
  }, []);

  /**
   * Connect to a Kaspa wallet and authenticate with signature.
   * This is a "Sign-In With Kaspa" (SIWK) flow.
   */
  const connect = useCallback(async (provider?: KaspaProvider): Promise<void> => {
    try {
      store.setConnecting();

      const connection = await connectWallet(provider);

      // Immediately authenticate with signature after wallet connection
      console.log("[Auth] Wallet connected, requesting signature for authentication...");
      const timestamp = Date.now().toString();
      const message = `Login to KaspaClash:${timestamp}`;

      // Sign the message and get public key for verification
      const signResult = await signWalletMessage(message);

      // Get public key for server-side verification
      let publicKey = signResult.publicKey || "";
      if (!publicKey) {
        // Try to get public key separately if not returned with signature
        publicKey = await getWalletPublicKey() || "";
      }

      // Send to server for verification and session creation
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: connection.address,
          signature: signResult.signature,
          publicKey,
          timestamp,
        }),
      });

      if (!loginRes.ok) {
        const errorData = await loginRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Authentication failed");
      }

      const loginData = await loginRes.json();

      // Store session token
      const SESSION_KEY = `kaspaclash_session_${connection.address}`;
      if (loginData.token && loginData.expiresAt) {
        localStorage.setItem(SESSION_KEY, loginData.token);
        localStorage.setItem(`${SESSION_KEY}_expiry`, loginData.expiresAt);
        console.log("[Auth] Session token stored, expires:", loginData.expiresAt);
      }

      // Now set as connected (after successful auth)
      store.setConnected(connection.address as KaspaAddress, connection.network || "mainnet");
      console.log("[Auth] Wallet authenticated successfully:", connection.address.substring(0, 20) + "...");

      // Auto-register player in database (creates new or returns existing)
      try {
        const response = await fetch(`/api/players/${encodeURIComponent(connection.address)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.isNewPlayer) {
            console.log("New player registered:", connection.address);
          } else {
            console.log("Player already exists:", connection.address);
          }
        }
      } catch (registerError) {
        console.warn("Failed to register player:", registerError);
        // Non-fatal - player may already exist
      }

      // Fetch initial balance
      try {
        const balance = await getBalance();
        store.setBalance(balance);
      } catch (balanceError) {
        console.warn("Failed to fetch initial balance:", balanceError);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to connect wallet";
      store.setError(message);
      store.setDisconnected(); // Reset state on auth failure
      throw error;
    }
  }, [store]);

  /**
   * Disconnect from the current wallet.
   */
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await disconnectWallet();
      store.setDisconnected();
    } catch (error) {
      console.error("Disconnect error:", error);
      // Still reset state even if disconnect fails
      store.setDisconnected();
    }
  }, [store]);

  /**
   * Sign a message with the connected wallet.
   */
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    const result = await signWalletMessage(message);
    return result.signature;
  }, [isConnected]);

  /**
   * Sign a message with the connected wallet and return both signature and public key.
   * This is needed for server-side signature verification.
   */
  const signMessageWithPublicKey = useCallback(async (message: string): Promise<{ signature: string; publicKey: string }> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    const result = await signWalletMessage(message);
    return {
      signature: result.signature,
      publicKey: result.publicKey || "",
    };
  }, [isConnected]);

  /**
   * Get the public key from the connected wallet.
   */
  const getPublicKey = useCallback(async (): Promise<string | null> => {
    if (!isConnected) {
      return null;
    }
    return await getWalletPublicKey();
  }, [isConnected]);

  /**
   * Refresh the wallet balance.
   */
  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!isConnected) {
      return;
    }

    try {
      const balance = await getBalance();
      store.setBalance(balance);
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    }
  }, [isConnected, store]);

  /**
   * Handle wallet account change events.
   */
  useEffect(() => {
    const handleAccountChange = (event: CustomEvent<{ address: string }>) => {
      store.setConnected(event.detail.address as KaspaAddress, store.network || "mainnet");
      refreshBalance();
    };

    const handleDisconnect = () => {
      store.setDisconnected();
    };

    window.addEventListener("kaspa:accountChange", handleAccountChange as EventListener);
    window.addEventListener("kaspa:disconnect", handleDisconnect);

    return () => {
      window.removeEventListener("kaspa:accountChange", handleAccountChange as EventListener);
      window.removeEventListener("kaspa:disconnect", handleDisconnect);
    };
  }, [store, refreshBalance]);

  /**
   * Auto-reconnect after store hydration if previously connected.
   * Only reconnects if there's a valid session token - otherwise user must re-authenticate.
   */
  useEffect(() => {
    // Wait for store to hydrate from localStorage
    if (!hasHydrated) return;

    const autoReconnect = async () => {
      // If we have a stored address but wallet not connected, try to silently reconnect
      if (store.address && !isWalletConnected()) {
        try {
          console.log("[useWallet] Auto-reconnecting wallet at:", Date.now());
          console.log("[useWallet] Stored address:", store.address?.substring(0, 20) + "...");

          // Check if we have a valid session token
          const SESSION_KEY = `kaspaclash_session_${store.address}`;
          const token = localStorage.getItem(SESSION_KEY);
          const expiry = localStorage.getItem(`${SESSION_KEY}_expiry`);

          const hasValidSession = token && expiry && new Date(expiry) > new Date();

          if (!hasValidSession) {
            console.log("[useWallet] No valid session found - user must re-authenticate");
            store.setDisconnected();
            return;
          }

          // tryReconnect uses getAccounts() which doesn't prompt user
          const result = await tryReconnect();
          if (result) {
            store.setConnected(result.address as KaspaAddress, result.network || "mainnet");

            // Fetch balance
            try {
              const balance = await getBalance();
              store.setBalance(balance);
            } catch (e) {
              console.warn("Failed to fetch balance after reconnect:", e);
            }
            console.log("[useWallet] Wallet auto-reconnected with valid session at:", Date.now());
          } else {
            console.log("[useWallet] Silent reconnect failed - wallet may require new authorization");
            store.setDisconnected();
          }
        } catch (error) {
          console.warn("[useWallet] Auto-reconnect failed:", error);
          store.setDisconnected();
        }
      } else {
        console.log("[useWallet] Auto-reconnect skipped - no stored address or already connected");
        console.log("[useWallet] store.address:", store.address ? store.address.substring(0, 20) + "..." : "NULL");
        console.log("[useWallet] isWalletConnected():", isWalletConnected());
      }
    };

    // Small delay to let wallet extension initialize
    console.log("[useWallet] Scheduling auto-reconnect in 300ms at:", Date.now());
    const timer = setTimeout(autoReconnect, 300);
    return () => clearTimeout(timer);
  }, [hasHydrated]); // Dependency loop fixed: removed 'store'

  /**
   * Discover wallets on mount.
   */
  useEffect(() => {
    if (typeof window !== "undefined") {
      discoverWallets();
    }
  }, [discoverWallets]);

  return {
    // State
    address: store.address,
    isConnected,
    isConnecting,
    balance: formattedBalance,
    truncatedAddress,
    network: store.network,
    error: store.error,
    availableWallets,

    // Actions
    connect,
    disconnect,
    signMessage,
    signMessageWithPublicKey,
    getPublicKey,
    refreshBalance,
    discoverWallets,
  };
}

export default useWallet;
