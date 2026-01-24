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
  const { setCurrency } = useShopStore();

  useEffect(() => {
    if (!enabled || !playerId) {
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Create channel for player's currency
    const channel = supabase
      .channel(`currency:${playerId}`)
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

            // Notify callback
            if (onCurrencyUpdate) {
              onCurrencyUpdate(newData);
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Currency Realtime] Subscribed for player:', playerId);
          isSubscribed.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Currency Realtime] Subscription error');
          errorRef.current = new Error('Failed to subscribe to currency updates');
          isSubscribed.current = false;
        } else if (status === 'TIMED_OUT') {
          console.error('[Currency Realtime] Subscription timed out');
          errorRef.current = new Error('Currency subscription timed out');
          isSubscribed.current = false;
        }
      });

    subscriptionRef.current = channel;

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log('[Currency Realtime] Unsubscribing from player:', playerId);
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
        isSubscribed.current = false;
      }
    };
  }, [playerId, enabled, setCurrency, onCurrencyUpdate]);

  return {
    isSubscribed: isSubscribed.current,
    error: errorRef.current,
  };
}

/**
 * Helper function to manually fetch current currency (for initial load)
 * Uses lightweight currency endpoint instead of heavy progression endpoint
 */
export async function fetchCurrentCurrency(playerId: string): Promise<{
  clash_shards: number;
  total_earned: number;
  total_spent: number;
} | null> {
  try {
    const response = await fetch(`/api/currency/${encodeURIComponent(playerId)}`);
    if (!response.ok) return null;

    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error('[Currency Realtime] Failed to fetch current currency:', error);
    return null;
  }
}
