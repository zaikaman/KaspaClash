/**
 * Kaspa Wallet Discovery Service
 * Implements KIP-12 provider detection for browser wallet extensions
 */

import type {
  KaspaProvider,
  WalletDiscoveryResult,
} from "@/types/kaspa";

/**
 * Discovery timeout in milliseconds.
 */
const DISCOVERY_TIMEOUT = 2000;

/**
 * Known wallet extension names and their icons.
 */
const KNOWN_WALLETS: Record<string, { name: string; icon?: string }> = {
  kasware: { name: "Kasware", icon: "/assets/wallets/kasware.png" },
  kaspium: { name: "Kaspium", icon: "/assets/wallets/kaspium.png" },
  kastle: { name: "Kastle", icon: "/assets/wallets/kastle.png" },
  onekey: { name: "OneKey", icon: "/assets/wallets/onekey.png" },
};

/**
 * Discover available Kaspa wallet providers using KIP-12 standard.
 * Returns the first provider found or null if none available.
 */
export async function discoverWallet(): Promise<KaspaProvider | null> {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    console.warn("Wallet discovery requires browser environment");
    return null;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log("Wallet discovery timed out");
      resolve(null);
    }, DISCOVERY_TIMEOUT);

    // Listen for KIP-12 provider event
    const handleProvider = (event: Event) => {
      clearTimeout(timeout);
      const customEvent = event as CustomEvent<KaspaProvider>;
      console.log("Kaspa provider discovered:", customEvent.detail);
      resolve(customEvent.detail);
    };

    window.addEventListener("kaspa:provider", handleProvider, { once: true });

    // Request provider from wallet extension
    window.dispatchEvent(new Event("kaspa:requestProvider"));
  });
}

/**
 * Discover all available Kaspa wallet providers.
 * Useful for showing a wallet selection modal.
 */
export async function discoverAllWallets(): Promise<WalletDiscoveryResult[]> {
  if (typeof window === "undefined") {
    return [];
  }

  const wallets: WalletDiscoveryResult[] = [];

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(wallets);
    }, DISCOVERY_TIMEOUT);

    const handleProvider = (event: Event) => {
      const customEvent = event as CustomEvent<KaspaProvider>;
      const provider = customEvent.detail;
      const name = provider.name || "Unknown Wallet";
      const walletInfo = KNOWN_WALLETS[name.toLowerCase()] || { name };

      wallets.push({
        provider,
        name: walletInfo.name,
        icon: walletInfo.icon,
      });
    };

    window.addEventListener("kaspa:provider", handleProvider);

    // Request providers
    window.dispatchEvent(new Event("kaspa:requestProvider"));

    // Allow time for multiple providers to respond
    setTimeout(() => {
      clearTimeout(timeout);
      window.removeEventListener("kaspa:provider", handleProvider);
      resolve(wallets);
    }, DISCOVERY_TIMEOUT);
  });
}

/**
 * Check if any Kaspa wallet extension is installed.
 * Quick check that doesn't require full discovery.
 */
export async function isWalletAvailable(): Promise<boolean> {
  const provider = await discoverWallet();
  return provider !== null;
}

/**
 * Get wallet info from provider name.
 */
export function getWalletInfo(providerName: string): { name: string; icon?: string } {
  return KNOWN_WALLETS[providerName.toLowerCase()] || { name: providerName };
}
