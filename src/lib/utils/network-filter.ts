/**
 * Network Filter Utilities
 * Helper functions for filtering database queries by network
 */

import type { NetworkType } from "@/types/constants";

/**
 * Get the address prefix for a network.
 */
export function getNetworkAddressPrefix(network: NetworkType): string {
    return network === "mainnet" ? "kaspa:" : "kaspatest:";
}

/**
 * Get a SQL LIKE pattern for filtering addresses by network.
 * @example "kaspa:%" for mainnet, "kaspatest:%" for testnet
 */
export function getNetworkAddressFilter(network: NetworkType): string {
    return `${getNetworkAddressPrefix(network)}%`;
}

/**
 * Check if an address belongs to a specific network.
 */
export function isAddressOnNetwork(address: string, network: NetworkType): boolean {
    const prefix = getNetworkAddressPrefix(network);
    return address.startsWith(prefix);
}

/**
 * Detect network from an address.
 */
export function detectNetworkFromAddress(address: string | null | undefined): NetworkType {
    if (!address || typeof address !== "string") {
        return "testnet"; // Default to testnet when no address
    }
    if (address.startsWith("kaspatest:")) {
        return "testnet";
    }
    return "mainnet";
}
