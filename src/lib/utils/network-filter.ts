/**
 * Network Filter Utilities
 * Helper functions for filtering database queries by network
 */

import type { NetworkType } from "@/types/constants";
import { registerBotAddress } from "./bot-detection";

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
 * Generate a realistic-looking Kaspa address for a bot player.
 * The address follows the format but is deterministic based on the seed.
 * Format: kaspa:qr... or kaspatest:qr... followed by 61 characters
 */
export function generateBotAddress(network: NetworkType, seed?: string): string {
    const prefix = getNetworkAddressPrefix(network);
    
    // Generate a deterministic but random-looking address hash
    // Using a combination of timestamp and random values for uniqueness
    const seedValue = seed || `${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Create a base62-like character set (alphanumeric lowercase, excluding confusing chars)
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    
    // Generate 61 characters for the address (Kaspa addresses are typically ~63 chars after prefix)
    let hash = 'qr'; // Kaspa addresses typically start with 'q'
    
    // Use the seed to generate a pseudo-random but consistent hash
    let seedHash = 0;
    for (let i = 0; i < seedValue.length; i++) {
        seedHash = ((seedHash << 5) - seedHash) + seedValue.charCodeAt(i);
        seedHash = seedHash & seedHash; // Convert to 32bit integer
    }
    
    // Generate the rest of the address
    for (let i = 0; i < 59; i++) {
        // Use a combination of the seed hash and position for variety
        seedHash = (seedHash * 1103515245 + 12345) & 0x7fffffff; // Linear congruential generator
        hash += chars[seedHash % chars.length];
    }
    
    return `${prefix}${hash}`;
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
