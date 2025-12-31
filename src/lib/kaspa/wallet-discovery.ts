/**
 * Kaspa Wallet Discovery Service
 * Implements KIP-12 provider detection for browser wallet extensions
 * Also checks for direct global objects (window.kasware, window.kaspa)
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
 * Check for directly injected wallet providers on the window object.
 * Some wallets inject themselves directly without using KIP-12 events.
 */
function checkDirectInjectedProviders(): KaspaProvider | null {
  if (typeof window === "undefined") return null;

  // Cast window to allow access to potential wallet globals
  const win = window as unknown as {
    kasware?: KaspaProvider;
    kaspa?: KaspaProvider;
    kaspium?: KaspaProvider;
  };

  // Check for Kasware (most common)
  if (win.kasware && typeof win.kasware.connect === "function") {
    console.log("Found Kasware via window.kasware");
    return win.kasware;
  }

  // Check for generic kaspa provider
  if (win.kaspa && typeof win.kaspa.connect === "function") {
    console.log("Found Kaspa provider via window.kaspa");
    return win.kaspa;
  }

  // Check for Kaspium
  if (win.kaspium && typeof win.kaspium.connect === "function") {
    console.log("Found Kaspium via window.kaspium");
    return win.kaspium;
  }

  return null;
}

/**
 * Discover available Kaspa wallet providers using KIP-12 standard.
 * Also falls back to checking direct window objects.
 * Returns the first provider found or null if none available.
 */
export async function discoverWallet(): Promise<KaspaProvider | null> {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    console.warn("Wallet discovery requires browser environment");
    return null;
  }

  // First, try direct injection check (faster)
  const directProvider = checkDirectInjectedProviders();
  if (directProvider) {
    return directProvider;
  }

  // If no direct provider, try KIP-12 discovery
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log("Wallet discovery timed out, checking direct providers again...");
      // One more check for direct providers in case they loaded late
      const lateProvider = checkDirectInjectedProviders();
      resolve(lateProvider);
    }, DISCOVERY_TIMEOUT);

    // Listen for KIP-12 provider event
    const handleProvider = (event: Event) => {
      clearTimeout(timeout);
      const customEvent = event as CustomEvent<KaspaProvider>;
      console.log("Kaspa provider discovered via KIP-12:", customEvent.detail);
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
  const seenProviders = new Set<KaspaProvider>();

  // Check for directly injected providers first
  const win = window as unknown as {
    kasware?: KaspaProvider;
    kaspa?: KaspaProvider;
    kaspium?: KaspaProvider;
  };

  if (win.kasware && typeof win.kasware.connect === "function") {
    wallets.push({
      provider: win.kasware,
      name: "Kasware",
      icon: KNOWN_WALLETS.kasware.icon,
    });
    seenProviders.add(win.kasware);
  }

  if (win.kaspium && typeof win.kaspium.connect === "function" && !seenProviders.has(win.kaspium)) {
    wallets.push({
      provider: win.kaspium,
      name: "Kaspium",
      icon: KNOWN_WALLETS.kaspium.icon,
    });
    seenProviders.add(win.kaspium);
  }

  // Also try KIP-12 discovery for any additional wallets
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(wallets);
    }, DISCOVERY_TIMEOUT);

    const handleProvider = (event: Event) => {
      const customEvent = event as CustomEvent<KaspaProvider>;
      const provider = customEvent.detail;

      // Skip if already found via direct injection
      if (seenProviders.has(provider)) return;

      const name = provider.name || "Unknown Wallet";
      const walletInfo = KNOWN_WALLETS[name.toLowerCase()] || { name };

      wallets.push({
        provider,
        name: walletInfo.name,
        icon: walletInfo.icon,
      });
      seenProviders.add(provider);
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
  // Quick direct check first
  const directProvider = checkDirectInjectedProviders();
  if (directProvider) return true;

  // Fall back to full discovery
  const provider = await discoverWallet();
  return provider !== null;
}

/**
 * Get wallet info from provider name.
 */
export function getWalletInfo(providerName: string): { name: string; icon?: string } {
  return KNOWN_WALLETS[providerName.toLowerCase()] || { name: providerName };
}
