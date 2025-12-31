/**
 * useWallet Hook
 * React hook for wallet connection, disconnection, and signing operations
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useWalletStore, selectIsConnected, selectIsConnecting, selectFormattedBalance, selectTruncatedAddress } from "@/stores/wallet-store";
import { connectWallet, disconnectWallet, signMessage as signWalletMessage, getBalance, isWalletConnected } from "@/lib/kaspa/wallet";
import { discoverWallet, discoverAllWallets } from "@/lib/kaspa/wallet-discovery";
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

  /**
   * Discover available wallets.
   */
  const discoverWallets = useCallback(async (): Promise<WalletDiscoveryResult[]> => {
    const wallets = await discoverAllWallets();
    setAvailableWallets(wallets);
    return wallets;
  }, []);

  /**
   * Connect to a Kaspa wallet.
   */
  const connect = useCallback(async (provider?: KaspaProvider): Promise<void> => {
    try {
      store.setConnecting();

      const connection = await connectWallet(provider);
      store.setConnected(connection.address as KaspaAddress, connection.network || "mainnet");

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
   * Auto-reconnect on mount if previously connected.
   */
  useEffect(() => {
    const autoReconnect = async () => {
      // If we have a stored address but not connected, try to reconnect
      if (store.address && !isWalletConnected()) {
        try {
          const provider = await discoverWallet();
          if (provider) {
            await connect(provider);
          }
        } catch (error) {
          console.warn("Auto-reconnect failed:", error);
          store.setDisconnected();
        }
      }
    };

    // Only run on client
    if (typeof window !== "undefined") {
      autoReconnect();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    refreshBalance,
    discoverWallets,
  };
}

export default useWallet;
