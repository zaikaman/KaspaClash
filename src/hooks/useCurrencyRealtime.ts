/**
 * Supabase Realtime Hook for Currency Updates
 * Subscribes to real-time changes on player_currency table
 * Eliminates the need for polling
 */

import { useEffect, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { useShopStore } from '@/stores/shop-store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface UseCurrencyRealtimeOptions {
  /** Player address to subscribe to */
  playerId: string;
  /** Whether the subscription is enabled */
  enabled?: boolean;
  /** Callback when currency updates */
  onCurrencyUpdate?: (currency: {
    clash_shards: number;
    total_earned: number;
    total_spent: number;
  }) => void;
}

interface UseCurrencyRealtimeReturn {
  /** Whether the subscription is active */
  isSubscribed: boolean;
  /** Any subscription error */
  error: Error | null;
}

/**
 * Hook for subscribing to real-time currency updates
 * Automatically updates the shop store when currency changes
 */
export function useCurrencyRealtime({
  playerId,
  enabled = true,
  onCurrencyUpdate,
}: UseCurrencyRealtimeOptions): UseCurrencyRealtimeReturn {
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const isSubscribed = useRef(false);
  const errorRef = useRef<Error | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const { setCurrency } = useShopStore();

  // Use a ref to hold the callback to avoid dependency instability
  const onCurrencyUpdateRef = useRef(onCurrencyUpdate);
  onCurrencyUpdateRef.current = onCurrencyUpdate;

  useEffect(() => {
    if (!enabled || !playerId) {
      return;
    }

    let supabase: ReturnType<typeof createClient>;
    let mounted = true;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000; // 5 seconds

    const setupSubscription = () => {
      if (!mounted) return;

      // Clean up any existing subscription
      if (subscriptionRef.current && supabase) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      // Create new Supabase client
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });

      // Create channel for player's currency
      const channel = supabase
        .channel(`currency:${playerId}`, {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'player_currency',
            filter: `player_id=eq.${playerId}`,
          },
          (payload) => {
            console.log('[Currency Realtime] Update received:', payload);
            retryCountRef.current = 0; // Reset retry count on successful message

            // Handle different event types
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const newData = payload.new as {
                clash_shards: number;
                total_earned: number;
                total_spent: number;
              };

              // Update store
              setCurrency({
                playerId,
                clashShards: newData.clash_shards,
                totalEarned: newData.total_earned,
                totalSpent: newData.total_spent,
                lastUpdated: new Date(),
              });

              // Notify callback (using ref to avoid dependency issues)
              if (onCurrencyUpdateRef.current) {
                onCurrencyUpdateRef.current(newData);
              }
            } else if (payload.eventType === 'DELETE') {
              // Currency deleted - reset to 0
              setCurrency({
                playerId,
                clashShards: 0,
                totalEarned: 0,
                totalSpent: 0,
                lastUpdated: new Date(),
              });
            }
          }
        )
        .subscribe((status, err) => {
          if (!mounted) return;

          if (status === 'SUBSCRIBED') {
            console.log('[Currency Realtime] Subscribed for player:', playerId);
            isSubscribed.current = true;
            errorRef.current = null;
            retryCountRef.current = 0;
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('[Currency Realtime] Channel error:', err);
            isSubscribed.current = false;
            
            // Retry logic with exponential backoff
            if (retryCountRef.current < MAX_RETRIES) {
              retryCountRef.current++;
              const delay = RETRY_DELAY * retryCountRef.current;
              console.log(`[Currency Realtime] Retrying subscription in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
              
              if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
              }
              
              retryTimeoutRef.current = setTimeout(() => {
                setupSubscription();
              }, delay);
            } else {
              console.error('[Currency Realtime] Max retries reached. Subscription failed.');
              errorRef.current = new Error('Failed to subscribe to currency updates after retries');
            }
          } else if (status === 'TIMED_OUT') {
            console.warn('[Currency Realtime] Subscription timed out');
            isSubscribed.current = false;
            errorRef.current = new Error('Currency subscription timed out');
            
            // Retry on timeout
            if (retryCountRef.current < MAX_RETRIES) {
              retryCountRef.current++;
              console.log(`[Currency Realtime] Retrying after timeout (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
              setTimeout(() => setupSubscription(), RETRY_DELAY);
            }
          } else if (status === 'CLOSED') {
            console.log('[Currency Realtime] Channel closed');
            isSubscribed.current = false;
          }
        });

      subscriptionRef.current = channel;
    };

    // Initial setup
    setupSubscription();

    // Cleanup on unmount or when dependencies change
    return () => {
      mounted = false;
      console.log('[Currency Realtime] Cleaning up subscription for player:', playerId);
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      if (subscriptionRef.current && supabase) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      isSubscribed.current = false;
      retryCountRef.current = 0;
    };
  }, [playerId, enabled, setCurrency]);

  return {
    isSubscribed: isSubscribed.current,
    error: errorRef.current,
  };
}

// Cache for currency fetches to prevent redundant API calls
const currencyCache = new Map<string, {
  data: { clash_shards: number; total_earned: number; total_spent: number };
  timestamp: number;
}>();
const CACHE_TTL_MS = 5000; // Cache for 5 seconds
const pendingFetches = new Map<string, Promise<{ clash_shards: number; total_earned: number; total_spent: number } | null>>();

/**
 * Helper function to manually fetch current currency (for initial load)
 * Uses lightweight currency endpoint instead of heavy progression endpoint
 * Includes caching and request deduplication to prevent excessive API calls
 */
export async function fetchCurrentCurrency(playerId: string): Promise<{
  clash_shards: number;
  total_earned: number;
  total_spent: number;
} | null> {
  if (!playerId) return null;

  // Check cache first
  const cached = currencyCache.get(playerId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Check if there's already a pending fetch for this player
  const pending = pendingFetches.get(playerId);
  if (pending) {
    return pending;
  }

  // Create new fetch promise
  const fetchPromise = (async () => {
    try {
      const response = await fetch(`/api/currency/${encodeURIComponent(playerId)}`);
      if (!response.ok) return null;

      const data = await response.json();
      if (data) {
        // Store in cache
        currencyCache.set(playerId, { data, timestamp: Date.now() });
      }
      return data || null;
    } catch (error) {
      console.error('[Currency Realtime] Failed to fetch current currency:', error);
      return null;
    } finally {
      // Clean up pending fetch
      pendingFetches.delete(playerId);
    }
  })();

  pendingFetches.set(playerId, fetchPromise);
  return fetchPromise;
}
