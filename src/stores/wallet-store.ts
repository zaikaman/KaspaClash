/**
 * Wallet Store
 * Zustand store for wallet connection state
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { KaspaAddress, WalletConnectionState } from "@/types/kaspa";

/**
 * Wallet store state interface.
 */
interface WalletStore {
  // State
  connectionState: WalletConnectionState;
  address: KaspaAddress | null;
  balance: bigint | null;
  network: "mainnet" | "testnet" | null;
  error: string | null;

  // Actions
  setConnecting: () => void;
  setConnected: (address: KaspaAddress, network: "mainnet" | "testnet") => void;
  setDisconnected: () => void;
  setError: (error: string) => void;
  setBalance: (balance: bigint) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Initial wallet state.
 */
const initialState = {
  connectionState: "disconnected" as WalletConnectionState,
  address: null,
  balance: null,
  network: null,
  error: null,
};

/**
 * Custom serializer for BigInt values in persisted state.
 */
const bigIntSerializer = {
  serialize: (state: WalletStore) => {
    return JSON.stringify({
      ...state,
      balance: state.balance?.toString() ?? null,
    });
  },
  deserialize: (str: string) => {
    const parsed = JSON.parse(str);
    return {
      ...parsed,
      balance: parsed.balance ? BigInt(parsed.balance) : null,
    };
  },
};

/**
 * Wallet store with Zustand.
 * Manages wallet connection state across the application.
 */
export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      // Initial state
      ...initialState,

      // Actions
      setConnecting: () =>
        set({
          connectionState: "connecting",
          error: null,
        }),

      setConnected: (address, network) =>
        set({
          connectionState: "connected",
          address,
          network,
          error: null,
        }),

      setDisconnected: () =>
        set({
          connectionState: "disconnected",
          address: null,
          balance: null,
          network: null,
          error: null,
        }),

      setError: (error) =>
        set({
          connectionState: "error",
          error,
        }),

      setBalance: (balance) =>
        set({
          balance,
        }),

      clearError: () =>
        set({
          error: null,
          connectionState:
            initialState.connectionState,
        }),

      reset: () => set(initialState),
    }),
    {
      name: "kaspaclash-wallet",
      // Only persist address and network, not connection state
      partialize: (state) => ({
        address: state.address,
        network: state.network,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return bigIntSerializer.deserialize(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, bigIntSerializer.serialize(value as unknown as WalletStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Check if wallet is connected.
 */
export const selectIsConnected = (state: WalletStore): boolean =>
  state.connectionState === "connected" && state.address !== null;

/**
 * Check if wallet is connecting.
 */
export const selectIsConnecting = (state: WalletStore): boolean =>
  state.connectionState === "connecting";

/**
 * Get formatted balance in KAS.
 */
export const selectFormattedBalance = (state: WalletStore): string | null => {
  if (state.balance === null) return null;
  const kas = Number(state.balance) / 100000000; // SOMPI_PER_KAS
  return kas.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
};

/**
 * Get truncated address for display.
 */
export const selectTruncatedAddress = (state: WalletStore): string | null => {
  if (!state.address) return null;
  const addr = state.address;
  // kaspa:qz0s...abc
  const prefix = addr.substring(0, 10);
  const suffix = addr.substring(addr.length - 4);
  return `${prefix}...${suffix}`;
};
