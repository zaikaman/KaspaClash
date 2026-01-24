/**
 * Request Deduplication Utility
 * Prevents duplicate API requests from being made simultaneously
 * Useful for preventing request spam during rapid re-renders
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest<any>>();
const REQUEST_TIMEOUT = 5000; // Clear stale requests after 5 seconds

/**
 * Deduplicate fetch requests by key
 * If a request with the same key is already in progress, return the existing promise
 * Otherwise, start a new request
 */
export async function deduplicatedFetch<T = any>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();

  // Check if there's already a pending request
  const pending = pendingRequests.get(key);
  
  if (pending) {
    // If the request is still fresh (not timed out), reuse it
    if (now - pending.timestamp < REQUEST_TIMEOUT) {
      return pending.promise;
    } else {
      // Request timed out, remove it
      pendingRequests.delete(key);
    }
  }

  // Create new request
  const promise = fetchFn()
    .finally(() => {
      // Clean up after request completes
      pendingRequests.delete(key);
    });

  // Store the pending request
  pendingRequests.set(key, {
    promise,
    timestamp: now,
  });

  return promise;
}

/**
 * Clear all pending requests (useful for cleanup on unmount)
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
}

/**
 * Clear a specific pending request
 */
export function clearPendingRequest(key: string): void {
  pendingRequests.delete(key);
}
