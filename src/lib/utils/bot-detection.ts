/**
 * Bot Detection Utilities
 * Helper functions for identifying bot players
 */

import type { NetworkType } from "@/types/constants";

/**
 * Bot address registry - stores generated bot addresses
 * In production, this should be stored in a database or Redis cache
 */
const botAddressRegistry = new Set<string>();

/**
 * Register a bot address
 */
export function registerBotAddress(address: string): void {
    botAddressRegistry.add(address);
}

/**
 * Check if an address belongs to a bot
 * This checks both the legacy "bot_" prefix and the new registry
 */
export function isBotAddress(address: string | null | undefined): boolean {
    if (!address) return false;
    
    // Check legacy bot_ prefix for backward compatibility
    if (address.startsWith("bot_")) return true;
    
    // Check if registered as bot
    if (botAddressRegistry.has(address)) return true;
    
    // For bot addresses generated with our pattern, they all start with "qr"
    // after the network prefix and have exactly 61 characters after the prefix
    // This is a heuristic check for addresses we generate
    const kaspaMatch = address.match(/^(kaspa:|kaspatest:)(qr[a-z0-9]{59})$/);
    if (kaspaMatch) {
        // Additional check: Real Kaspa addresses use base58 which includes uppercase
        // Our bot addresses use only lowercase, so we can detect them this way
        const addressHash = kaspaMatch[2];
        const hasUppercase = /[A-Z]/.test(addressHash);
        
        // If it matches our pattern (starts with qr, all lowercase, 61 chars), it's likely a bot
        if (!hasUppercase && addressHash.length === 61) {
            // Auto-register detected bot addresses
            botAddressRegistry.add(address);
            return true;
        }
    }
    
    return false;
}

/**
 * Clear the bot address registry (useful for testing)
 */
export function clearBotRegistry(): void {
    botAddressRegistry.clear();
}

/**
 * Get all registered bot addresses
 */
export function getRegisteredBots(): string[] {
    return Array.from(botAddressRegistry);
}
