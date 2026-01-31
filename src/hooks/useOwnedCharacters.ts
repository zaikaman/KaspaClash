/**
 * useOwnedCharacters Hook
 * 
 * Robust hook for fetching player's owned character IDs with:
 * - Automatic retry with exponential backoff
 * - In-memory caching to prevent redundant fetches
 * - Default starter characters fallback
 * - Loading and error states
 * 
 * This hook ensures the CharacterSelectScene always has access to
 * the player's owned characters without falling back to defaults.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Default starter characters - always available to all players
 */
const DEFAULT_STARTERS = ['cyber-ninja', 'block-bruiser', 'dag-warrior', 'hash-hunter'] as const;

/**
 * Cache for owned characters by player address
 * Persists across component remounts within the same session
 */
const characterCache = new Map<string, {
    characterIds: string[];
    fetchedAt: number;
}>();

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Max retry attempts
 */
const MAX_RETRIES = 3;

/**
 * Base delay for exponential backoff (ms)
 */
const BASE_DELAY = 1000;

interface UseOwnedCharactersResult {
    /** List of owned character IDs (always includes starters) */
    ownedCharacterIds: string[];
    /** Whether the initial fetch is in progress */
    isLoading: boolean;
    /** Error message if fetch failed */
    error: string | null;
    /** Whether all retries have been exhausted */
    hasFailed: boolean;
    /** Manually trigger a refetch (bypasses cache) */
    refetch: () => Promise<void>;
    /** Whether data came from cache */
    fromCache: boolean;
}

interface UseOwnedCharactersOptions {
    /** Skip fetching (useful when address is not yet available) */
    skip?: boolean;
    /** Custom cache TTL in milliseconds */
    cacheTtl?: number;
}

/**
 * Fetch owned characters with retry logic
 */
async function fetchOwnedCharacters(
    playerId: string,
    retryCount: number = 0
): Promise<string[]> {
    try {
        const response = await fetch(
            `/api/player/characters?playerId=${encodeURIComponent(playerId)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add cache control to prevent stale responses
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.characterIds)) {
            throw new Error('Invalid response format');
        }

        return data.characterIds;
    } catch (error) {
        // Check if we should retry
        if (retryCount < MAX_RETRIES) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = BASE_DELAY * Math.pow(2, retryCount);
            console.warn(
                `[useOwnedCharacters] Fetch attempt ${retryCount + 1} failed, retrying in ${delay}ms:`,
                error
            );
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchOwnedCharacters(playerId, retryCount + 1);
        }

        // All retries exhausted
        throw error;
    }
}

/**
 * Hook to fetch and cache player's owned character IDs
 * 
 * @param playerId - The player's wallet address
 * @param options - Optional configuration
 * @returns Owned character IDs, loading state, and error info
 * 
 * @example
 * ```tsx
 * const { ownedCharacterIds, isLoading, error } = useOwnedCharacters(address);
 * ```
 */
export function useOwnedCharacters(
    playerId: string | null | undefined,
    options: UseOwnedCharactersOptions = {}
): UseOwnedCharactersResult {
    const { skip = false, cacheTtl = CACHE_TTL } = options;

    // State
    const [ownedCharacterIds, setOwnedCharacterIds] = useState<string[]>([...DEFAULT_STARTERS]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFailed, setHasFailed] = useState(false);
    const [fromCache, setFromCache] = useState(false);

    // Track if fetch is in progress to prevent duplicate calls
    const fetchInProgressRef = useRef(false);
    // Track mounted state to prevent state updates after unmount
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    /**
     * Core fetch function
     */
    const doFetch = useCallback(async (bypassCache: boolean = false) => {
        // Validate playerId
        if (!playerId || skip) {
            setOwnedCharacterIds([...DEFAULT_STARTERS]);
            setIsLoading(false);
            return;
        }

        // Prevent duplicate fetches
        if (fetchInProgressRef.current) {
            console.log('[useOwnedCharacters] Fetch already in progress, skipping');
            return;
        }

        // Check cache first (unless bypassing)
        if (!bypassCache) {
            const cached = characterCache.get(playerId);
            if (cached && Date.now() - cached.fetchedAt < cacheTtl) {
                console.log('[useOwnedCharacters] Using cached characters for', playerId);
                if (isMountedRef.current) {
                    setOwnedCharacterIds(cached.characterIds);
                    setFromCache(true);
                    setIsLoading(false);
                    setError(null);
                    setHasFailed(false);
                }
                return;
            }
        }

        // Start fetch
        fetchInProgressRef.current = true;
        if (isMountedRef.current) {
            setIsLoading(true);
            setError(null);
            setFromCache(false);
        }

        try {
            console.log('[useOwnedCharacters] Fetching characters for', playerId);
            const characterIds = await fetchOwnedCharacters(playerId);

            // Update cache
            characterCache.set(playerId, {
                characterIds,
                fetchedAt: Date.now(),
            });

            if (isMountedRef.current) {
                setOwnedCharacterIds(characterIds);
                setHasFailed(false);
                setError(null);
            }

            console.log('[useOwnedCharacters] Successfully fetched', characterIds.length, 'characters');
        } catch (err) {
            console.error('[useOwnedCharacters] All retry attempts failed:', err);
            
            if (isMountedRef.current) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch characters';
                setError(errorMessage);
                setHasFailed(true);
                
                // Even on failure, try to use cached data if available (even if stale)
                const staleCache = characterCache.get(playerId);
                if (staleCache) {
                    console.log('[useOwnedCharacters] Using stale cache as fallback');
                    setOwnedCharacterIds(staleCache.characterIds);
                } else {
                    // Last resort: use starters
                    console.log('[useOwnedCharacters] No cache available, using starters');
                    setOwnedCharacterIds([...DEFAULT_STARTERS]);
                }
            }
        } finally {
            fetchInProgressRef.current = false;
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [playerId, skip, cacheTtl]);

    /**
     * Manual refetch (bypasses cache)
     */
    const refetch = useCallback(async () => {
        await doFetch(true);
    }, [doFetch]);

    // Initial fetch on mount or when playerId changes
    useEffect(() => {
        doFetch(false);
    }, [doFetch]);

    return {
        ownedCharacterIds,
        isLoading,
        error,
        hasFailed,
        refetch,
        fromCache,
    };
}

/**
 * Utility to prefetch characters into cache
 * Call this early (e.g., on matchmaking page) to warm the cache
 */
export async function prefetchOwnedCharacters(playerId: string): Promise<string[]> {
    if (!playerId) {
        return [...DEFAULT_STARTERS];
    }

    // Check cache first
    const cached = characterCache.get(playerId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        return cached.characterIds;
    }

    try {
        const characterIds = await fetchOwnedCharacters(playerId);
        characterCache.set(playerId, {
            characterIds,
            fetchedAt: Date.now(),
        });
        return characterIds;
    } catch (error) {
        console.error('[prefetchOwnedCharacters] Failed:', error);
        // Return starters on failure
        return [...DEFAULT_STARTERS];
    }
}

/**
 * Clear the character cache for a specific player or all players
 */
export function clearCharacterCache(playerId?: string): void {
    if (playerId) {
        characterCache.delete(playerId);
    } else {
        characterCache.clear();
    }
}

/**
 * Get default starter characters
 */
export function getDefaultStarters(): readonly string[] {
    return DEFAULT_STARTERS;
}
