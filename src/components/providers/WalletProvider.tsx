"use client";

/**
 * WalletProvider Component
 * Provides wallet connection context to the application
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useWalletStore, selectIsConnected, selectIsConnecting } from "@/stores/wallet-store";
import { connectWallet, disconnectWallet } from "@/lib/kaspa/wallet";
import { discoverAllWallets } from "@/lib/kaspa/wallet-discovery";
import type { WalletDiscoveryResult, KaspaAddress } from "@/types/kaspa";

/**
 * Wallet context value type.
 */
interface WalletContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: bigint | null;
  network: "mainnet" | "testnet" | null;
  providerName: string | null;
  error: string | null;
  connect: (providerId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  availableWallets: WalletDiscoveryResult[];
  isInitializing: boolean;
}

const WalletContext = createContext<WalletContextValue | null>(null);

/**
 * Hook to access wallet context.
 */
export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

/**
 * WalletProvider props.
 */
interface WalletProviderProps {
  children: ReactNode;
}

/**
 * WalletProvider component.
 * Wraps the application with wallet connection context.
 */
export function WalletProvider({ children }: WalletProviderProps) {
  const store = useWalletStore();
  const isConnected = selectIsConnected(store);
  const isConnecting = selectIsConnecting(store);
  
  const [providerName, setProviderName] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletDiscoveryResult[]>(
    []
  );
  const [isInitializing, setIsInitializing] = useState(true);

  // Discover available wallets on mount
  useEffect(() => {
    const discoverWallets = async () => {
      try {
        // Wait a bit for wallet extensions to initialize
        await new Promise((resolve) => setTimeout(resolve, 500));
        const wallets = await discoverAllWallets();
        setAvailableWallets(wallets);
      } catch (error) {
        console.warn("Failed to discover wallets:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    discoverWallets();
  }, []);

  // Connect to wallet
  const connect = useCallback(
    async (providerId?: string) => {
      try {
        store.setConnecting();

        // Find the provider by ID if specified
        let provider = undefined;
        if (providerId && availableWallets.length > 0) {
          const wallet = availableWallets.find(w => w.name.toLowerCase() === providerId.toLowerCase());
          provider = wallet?.provider;
        }

        const result = await connectWallet(provider);

        store.setConnected(result.address as KaspaAddress, result.network || "mainnet");
        setProviderName(provider?.name || "Unknown Wallet");

        // Fetch initial balance
        if (result.publicKey) {
          // Balance would be fetched separately
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to connect wallet";
        store.setError(message);
        throw error;
      }
    },
    [store]
  );

  // Disconnect from wallet
  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet();
      store.setDisconnected();
      setProviderName(null);
    } catch (error) {
      console.warn("Error during disconnect:", error);
      // Force disconnect even on error
      store.setDisconnected();
      setProviderName(null);
    }
  }, [store]);

  // Listen for account changes from wallet
  useEffect(() => {
    // This would be implemented per wallet provider
    // Most Kaspa wallets emit events when accounts change
    const handleAccountChange = (newAddress: string) => {
      if (newAddress) {
        store.setConnected(newAddress as KaspaAddress, store.network || "mainnet");
      } else {
        // Account disconnected
        store.setDisconnected();
      }
    };

    // Example: Listen to kasware account changes
    if (typeof window !== "undefined" && (window as unknown as { kasware?: { on?: (event: string, handler: (address: string) => void) => void } }).kasware?.on) {
      (window as unknown as { kasware: { on: (event: string, handler: (address: string) => void) => void } }).kasware.on("accountsChanged", handleAccountChange);
    }

    return () => {
      // Cleanup listeners
      if (typeof window !== "undefined" && (window as unknown as { kasware?: { removeListener?: (event: string, handler: (address: string) => void) => void } }).kasware?.removeListener) {
        (window as unknown as { kasware: { removeListener: (event: string, handler: (address: string) => void) => void } }).kasware.removeListener("accountsChanged", handleAccountChange);
      }
    };
  }, [store]);

  const contextValue: WalletContextValue = {
    isConnected,
    isConnecting,
    address: store.address,
    balance: store.balance,
    network: store.network,
    providerName,
    error: store.error,
    connect,
    disconnect,
    availableWallets,
    isInitializing,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export default WalletProvider;
