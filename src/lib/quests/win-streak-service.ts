/**
 * Win Streak Service
 * Tracks player win streaks for quest progress
 */

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { trackWinStreak } from './quest-service';

/**
 * Get current win streak for a player
 */
export async function getPlayerWinStreak(playerId: string): Promise<number> {
    const supabase = createSupabaseAdminClient() as any;

    // Get the player's match history (most recent first)
    const { data: matches, error } = await supabase
        .from('matches')
        .select('winner_address, completed_at')
        .or(`player1_address.eq.${playerId},player2_address.eq.${playerId}`)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(20); // Check last 20 matches for streak

    if (error || !matches || matches.length === 0) {
        return 0;
    }

    // Count consecutive wins from most recent
    let streak = 0;
    for (const match of matches) {
        if (match.winner_address === playerId) {
            streak++;
        } else {
            break; // Streak broken
        }
    }

    return streak;
}

/**
 * Update win streak after a match
 * Call this after a player wins a match
 */
export async function updateWinStreakAfterMatch(
    playerId: string,
    matchId: string,
    isWin: boolean
): Promise<{ newStreak: number; updated: boolean }> {
    if (!isWin) {
        // Loss resets streak, no need to track for quests
        return { newStreak: 0, updated: false };
    }

    // Get new streak after this win
    const newStreak = await getPlayerWinStreak(playerId);

    if (newStreak >= 2) {
        // Only track win streaks of 2 or more for quest progress
        try {
            await trackWinStreak(playerId, matchId, newStreak);
            return { newStreak, updated: true };
        } catch (error) {
            console.error('Error tracking win streak for quest:', error);
            return { newStreak, updated: false };
        }
    }

    return { newStreak, updated: false };
}
