/**
 * Kaspa WASM SDK Loader
 * Dynamic import pattern for Next.js SSR compatibility
 */

// Store the kaspa module reference
let kaspaModule: typeof import("kaspa-wasm") | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the Kaspa WASM SDK.
 * Safe to call multiple times - will only initialize once.
 */
export async function initKaspa(): Promise<void> {
  // Return immediately if already initialized
  if (initialized) return;

  // Return existing promise if initialization is in progress
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === "undefined") {
        console.warn("Kaspa WASM SDK requires browser environment");
        return;
      }

      // Dynamically import the WASM module
      kaspaModule = await import("kaspa-wasm");

      // Enable console panic hooks for debugging
      if (kaspaModule.initConsolePanicHook) {
        kaspaModule.initConsolePanicHook();
      }

      initialized = true;
      console.log("Kaspa WASM SDK initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Kaspa WASM SDK:", error);
      initPromise = null; // Allow retry on failure
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Check if Kaspa WASM SDK is initialized.
 */
export function isKaspaInitialized(): boolean {
  return initialized;
}

/**
 * Ensure Kaspa WASM SDK is initialized before using.
 * Throws if not initialized.
 */
export function requireKaspaInitialized(): void {
  if (!initialized) {
    throw new Error(
      "Kaspa WASM SDK not initialized. Call initKaspa() first."
    );
  }
}

/**
 * Get the Kaspa WASM module (lazy loaded).
 * Automatically initializes if not already done.
 */
export async function getKaspaModule() {
  await initKaspa();
  if (!kaspaModule) {
    throw new Error("Kaspa WASM SDK failed to initialize");
  }
  return kaspaModule;
}
