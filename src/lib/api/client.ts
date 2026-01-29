/**
 * Client-side API utilities
 * Provides authenticated fetch for protected API routes
 */

/**
 * Get the session token for a wallet address
 * @param address - Wallet address
 * @returns Token and expiry, or null if not found/expired
 */
export function getSessionToken(address: string): { token: string; expiry: string } | null {
    if (typeof window === 'undefined') return null;
    
    const SESSION_KEY = `kaspaclash_session_${address}`;
    const token = localStorage.getItem(SESSION_KEY);
    const expiry = localStorage.getItem(`${SESSION_KEY}_expiry`);
    
    if (!token || !expiry) return null;
    
    // Check if expired
    if (new Date(expiry) < new Date()) {
        // Clean up expired tokens
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(`${SESSION_KEY}_expiry`);
        return null;
    }
    
    return { token, expiry };
}

/**
 * Check if the user has a valid session
 * @param address - Wallet address
 * @returns Whether the session is valid
 */
export function hasValidSession(address: string): boolean {
    return getSessionToken(address) !== null;
}

/**
 * Authenticated fetch wrapper that includes session token
 * Uses the session token stored when connecting wallet
 * 
 * @param url - API endpoint URL
 * @param address - Wallet address (required for fetching session token)
 * @param options - Standard fetch options
 * @returns Fetch response
 * @throws Error if no valid session exists
 */
export async function authenticatedFetch(
    url: string,
    address: string,
    options: RequestInit = {}
): Promise<Response> {
    if (!address) {
        throw new Error("Wallet not connected");
    }
    
    const session = getSessionToken(address);
    
    if (!session) {
        throw new Error("Session expired - please disconnect and reconnect your wallet");
    }
    
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${session.token}`);
    
    // Ensure Content-Type is set for JSON requests
    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    
    return fetch(url, {
        ...options,
        headers,
    });
}

/**
 * Authenticated JSON POST request helper
 * Convenience wrapper for common POST pattern
 * 
 * @param url - API endpoint URL
 * @param address - Wallet address
 * @param body - Request body (will be JSON stringified)
 * @returns Parsed JSON response
 * @throws Error if request fails or no valid session
 */
export async function authenticatedPost<T = unknown>(
    url: string,
    address: string,
    body: Record<string, unknown>
): Promise<T> {
    const response = await authenticatedFetch(url, address, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }
    
    return data as T;
}
