/**
 * Network Store
 * Manages the selected network mode (mainnet/testnet) with persistence
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NETWORK_CONFIG, type NetworkType } from "@/types/constants";

/**
 * Network store state interface.
 */
interface NetworkStore {
    // State
    selectedNetwork: NetworkType;
    _hasHydrated: boolean;

    // Actions
    setNetwork: (network: NetworkType) => void;
    setHasHydrated: (state: boolean) => void;

    // Selectors (computed)
    getExplorerUrl: () => string;
    getTxExplorerUrl: (txId: string) => string;
    getAddressExplorerUrl: (address: string) => string;
}

/**
 * Get default network fallback.
 * Since the app now detects network from the connected wallet,
 * this is only used for the initial state before connection.
 */
function getDefaultNetwork(): NetworkType {
    return "testnet";
}

/**
 * Network store with Zustand.
 * Manages network mode selection across the application.
 */
export const useNetworkStore = create<NetworkStore>()(
    persist(
        (set, get) => ({
            // Initial state
            selectedNetwork: getDefaultNetwork(),
            _hasHydrated: false,

            // Actions
            setNetwork: (network) =>
                set({
                    selectedNetwork: network,
                }),

            setHasHydrated: (state) => set({ _hasHydrated: state }),

            // Computed selectors
            getExplorerUrl: () => {
                const network = get().selectedNetwork;
                return NETWORK_CONFIG[network].explorerUrl;
            },

            getTxExplorerUrl: (txId: string) => {
                const network = get().selectedNetwork;
                return `${NETWORK_CONFIG[network].explorerUrl}/txs/${txId}`;
            },

            getAddressExplorerUrl: (address: string) => {
                const network = get().selectedNetwork;
                return `${NETWORK_CONFIG[network].explorerUrl}/addresses/${address}`;
            },
        }),
        {
            name: "kaspaclash-network",
            partialize: (state) => ({
                selectedNetwork: state.selectedNetwork,
            }),
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Detect network from address prefix.
 */
export function detectNetworkFromAddress(address: string | null | undefined): NetworkType {
    if (!address || typeof address !== 'string') {
        return "testnet"; // Default to testnet when no address
    }
    if (address.startsWith("kaspatest:")) {
        return "testnet";
    }
    return "mainnet";
}

/**
 * Check if wallet address matches the selected network.
 */
export function isNetworkMismatch(
    walletAddress: string | null,
    selectedNetwork: NetworkType
): boolean {
    if (!walletAddress) return false;
    const walletNetwork = detectNetworkFromAddress(walletAddress);
    return walletNetwork !== selectedNetwork;
}

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Check if store has finished hydrating from localStorage.
 */
export const selectHasHydrated = (state: NetworkStore): boolean =>
    state._hasHydrated;

/**
 * Get current network mode.
 */
export const selectNetwork = (state: NetworkStore): NetworkType =>
    state.selectedNetwork;
