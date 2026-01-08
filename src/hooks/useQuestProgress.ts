/**
 * useQuestProgress Hook
 * Real-time subscription for quest progress updates using Supabase Realtime
 */

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useQuestStore } from '@/stores/quest-store';
import { getQuestTemplateById } from '@/lib/quests/quest-templates';
import type { DailyQuest } from '@/types/quest';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface UseQuestProgressOptions {
    playerId: string | null;
    enabled?: boolean;
    onQuestCompleted?: (quest: DailyQuest) => void;
}

interface UseQuestProgressResult {
    isSubscribed: boolean;
    error: Error | null;
}

/**
 * Hook for subscribing to real-time quest progress updates
 */
export function useQuestProgress({
    playerId,
    enabled = true,
    onQuestCompleted,
}: UseQuestProgressOptions): UseQuestProgressResult {
    const subscriptionRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
    const { updateQuestProgress, markQuestCompleted, dailyQuests } = useQuestStore();

    const isSubscribed = useRef(false);
    const errorRef = useRef<Error | null>(null);

    // Handle quest update from realtime
    const handleQuestUpdate = useCallback(
        (payload: any) => {
            const { new: newRow, old: oldRow } = payload;

            if (!newRow) return;

            // Update progress in store
            if (newRow.current_progress !== oldRow?.current_progress) {
                updateQuestProgress(newRow.id, newRow.current_progress);
            }

            // Check if just completed
            if (newRow.is_completed && !oldRow?.is_completed) {
                markQuestCompleted(newRow.id);

                // Find the full quest and notify
                const quest = dailyQuests.find((q) => q.id === newRow.id);
                if (quest && onQuestCompleted) {
                    onQuestCompleted(quest);
                }
            }
        },
        [updateQuestProgress, markQuestCompleted, dailyQuests, onQuestCompleted]
    );

    useEffect(() => {
        if (!enabled || !playerId) {
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Create channel for player's quests
        const channel = supabase
            .channel(`quests:${playerId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'daily_quests',
                    filter: `player_id=eq.${playerId}`,
                },
                handleQuestUpdate
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    isSubscribed.current = true;
                } else if (status === 'CHANNEL_ERROR') {
                    errorRef.current = new Error('Failed to subscribe to quest updates');
                    isSubscribed.current = false;
                }
            });

        subscriptionRef.current = channel;

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
                subscriptionRef.current = null;
                isSubscribed.current = false;
            }
        };
    }, [playerId, enabled, handleQuestUpdate]);

    return {
        isSubscribed: isSubscribed.current,
        error: errorRef.current,
    };
}

/**
 * Update quest progress from game events
 */
export async function updateQuestProgressFromEvent(
    playerId: string,
    eventType: string,
    eventData: Record<string, unknown>
): Promise<{
    success: boolean;
    updatedQuests: { questId: string; newProgress: number; isCompleted: boolean }[];
    completedCount: number;
}> {
    try {
        const response = await fetch('/api/quests/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId,
                eventType,
                eventData,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update quest progress');
        }

        return {
            success: data.success,
            updatedQuests: data.updatedQuests.map((q: any) => ({
                questId: q.questId,
                newProgress: q.newProgress,
                isCompleted: q.isCompleted,
            })),
            completedCount: data.completedCount,
        };
    } catch (error) {
        console.error('Error updating quest progress:', error);
        return {
            success: false,
            updatedQuests: [],
            completedCount: 0,
        };
    }
}

export default useQuestProgress;
