/**
 * useBettingPool Hook
 * Subscribe to betting pool updates and manage betting state
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// =============================================================================
// TYPES
// =============================================================================

export interface BettingPoolState {
    pool: {
        id: string;
        matchId: string;
        status: string;
        player1Total: string;
        player2Total: string;
        totalPool: string;
        player1TotalKas: number;
        player2TotalKas: number;
        totalPoolKas: number;
    } | null;
    odds: {
        player1: number;
        player2: number;
        player1Percentage: number;
        player2Percentage: number;
    };
    isOpen: boolean;
    isLocked: boolean;
    lockReason: string | null;
    isLoading: boolean;
    error: string | null;
}

export interface UseBettingPoolReturn {
    state: BettingPoolState;
    refresh: () => Promise<void>;
    placeBet: (betOn: 'player1' | 'player2', amountSompi: string, txId: string) => Promise<boolean>;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useBettingPool(matchId: string, bettorAddress?: string): UseBettingPoolReturn {
    const [state, setState] = useState<BettingPoolState>({
        pool: null,
        odds: { player1: 2, player2: 2, player1Percentage: 50, player2Percentage: 50 },
        isOpen: false,
        isLocked: false,
        lockReason: null,
        isLoading: true,
        error: null,
    });

    // Fetch pool data
    const refresh = useCallback(async () => {
        try {
            const response = await fetch(`/api/betting/pool/${matchId}`);

            if (!response.ok) {
                throw new Error("Failed to fetch betting pool");
            }

            const data = await response.json();

            setState({
                pool: data.pool,
                odds: data.odds,
                isOpen: data.isOpen,
                isLocked: data.isLocked,
                lockReason: data.lockReason,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            console.error("[useBettingPool] Error:", error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }));
        }
    }, [matchId]);

    // Place a bet
    const placeBet = useCallback(async (
        betOn: 'player1' | 'player2',
        amountSompi: string,
        txId: string
    ): Promise<boolean> => {
        if (!bettorAddress) {
            console.error("[useBettingPool] No bettor address");
            return false;
        }

        try {
            const response = await fetch('/api/betting/place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    betOn,
                    amount: amountSompi,
                    txId,
                    bettorAddress,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to place bet");
            }

            // Refresh pool after bet
            await refresh();
            return true;
        } catch (error) {
            console.error("[useBettingPool] Place bet error:", error);
            return false;
        }
    }, [matchId, bettorAddress, refresh]);

    // Initial fetch
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Subscribe to realtime updates
    useEffect(() => {
        const supabase = getSupabaseClient();
        let channel: RealtimeChannel | null = null;

        const setupRealtimeSubscription = async () => {
            // Subscribe to betting pool changes
            channel = supabase
                .channel(`betting:${matchId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'betting_pools',
                        filter: `match_id=eq.${matchId}`,
                    },
                    (payload) => {
                        console.log("[useBettingPool] Pool update:", payload);
                        refresh();
                    }
                )
                .subscribe();
        };

        setupRealtimeSubscription();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [matchId, refresh]);

    // Poll for updates every 5 seconds as backup
    useEffect(() => {
        const interval = setInterval(refresh, 5000);
        return () => clearInterval(interval);
    }, [refresh]);

    return {
        state,
        refresh,
        placeBet,
    };
}
