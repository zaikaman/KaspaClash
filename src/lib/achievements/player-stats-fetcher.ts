/**
 * Player Stats Fetcher
 * Fetches player statistics from all data sources for achievement tracking
 * This ensures achievements are calculated from actual game data, not just stored progress
 */

import type { PlayerStats } from './achievement-tracker';

/**
 * Fetch comprehensive player stats from all data sources
 * This queries the actual game data to calculate achievement progress
 */
export async function fetchPlayerStats(
    supabase: any,
    playerId: string
): Promise<PlayerStats> {
    const stats: PlayerStats = {
        total_wins: 0,
        total_losses: 0,
        total_combos: 0,
        total_damage_dealt: 0,
        total_blocks: 0,
        perfect_rounds: 0,
        perfect_matches: 0,
        perfect_rounds_in_match: 0,
        win_streak: 0,
        max_win_streak: 0,
        current_tier: 1,
        total_xp: 0,
        quests_completed: 0,
        quest_streak: 0,
        prestige_level: 0,
        matches_played: 0,
        unique_opponents: 0,
        shop_purchases: 0,
        cosmetics_owned: 0,
        total_shards_earned: 0,
        epic_or_legendary_owned: 0,
        legendary_owned: 0,
        max_survival_waves: 0,
        achievements_unlocked: 0,
        categories_completed: 0,
        combat_bronze_unlocked: 0,
    };

    try {
        // Fetch all stats in parallel for performance
        const [
            matchStats,
            survivalStats,
            questStats,
            currencyStats,
            inventoryStats,
            achievementStats,
            progressionStats,
        ] = await Promise.all([
            fetchMatchStats(supabase, playerId),
            fetchSurvivalStats(supabase, playerId),
            fetchQuestStats(supabase, playerId),
            fetchCurrencyStats(supabase, playerId),
            fetchInventoryStats(supabase, playerId),
            fetchAchievementStats(supabase, playerId),
            fetchProgressionStats(supabase, playerId),
        ]);

        // Merge all stats
        Object.assign(stats, matchStats, survivalStats, questStats, currencyStats, inventoryStats, achievementStats, progressionStats);
    } catch (error) {
        console.error('Error fetching player stats:', error);
    }

    return stats;
}

/**
 * Fetch match-related statistics
 */
async function fetchMatchStats(supabase: any, playerId: string): Promise<Partial<PlayerStats>> {
    const stats: Partial<PlayerStats> = {
        total_wins: 0,
        total_losses: 0,
        matches_played: 0,
        unique_opponents: 0,
        win_streak: 0,
        max_win_streak: 0,
        perfect_rounds: 0,
        perfect_matches: 0,
        perfect_rounds_in_match: 0,
        total_combos: 0,
        total_damage_dealt: 0,
        total_blocks: 0,
    };

    try {
        // Get completed matches where player participated
        const { data: matches, error } = await supabase
            .from('matches')
            .select('id, player1_address, player2_address, winner_address, player1_rounds_won, player2_rounds_won')
            .eq('status', 'completed')
            .or(`player1_address.eq.${playerId},player2_address.eq.${playerId}`);

        if (error) {
            console.error('Error fetching match stats:', error);
            return stats;
        }

        if (!matches || matches.length === 0) {
            return stats;
        }

        stats.matches_played = matches.length;

        const opponents = new Set<string>();
        let currentStreak = 0;
        let maxStreak = 0;

        // Calculate wins, losses, and unique opponents
        for (const match of matches) {
            const isPlayer1 = match.player1_address === playerId;
            const opponentAddress = isPlayer1 ? match.player2_address : match.player1_address;
            
            if (opponentAddress) {
                opponents.add(opponentAddress);
            }

            const isWinner = match.winner_address === playerId;
            if (isWinner) {
                stats.total_wins = (stats.total_wins || 0) + 1;
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else if (match.winner_address) {
                stats.total_losses = (stats.total_losses || 0) + 1;
                currentStreak = 0;
            }

            // Check for perfect match (won without losing a round)
            const playerRoundsLost = isPlayer1 ? match.player2_rounds_won : match.player1_rounds_won;
            if (isWinner && playerRoundsLost === 0) {
                stats.perfect_matches = (stats.perfect_matches || 0) + 1;
            }
        }

        stats.unique_opponents = opponents.size;
        stats.win_streak = currentStreak;
        stats.max_win_streak = maxStreak;

        // Get round stats
        const matchIds = matches.map((m: any) => m.id);
        const { data: rounds, error: roundsError } = await supabase
            .from('rounds')
            .select('winner_address, player1_damage_dealt, player2_damage_dealt')
            .in('match_id', matchIds.slice(0, 100)); // Limit to last 100 matches for performance

        if (!roundsError && rounds) {
            let totalDamage = 0;
            let perfectRounds = 0;

            for (const round of rounds) {
                // Add damage dealt
                // Note: We'd need to know which player they were in each match
                // For now, just sum both damages as a rough estimate
                totalDamage += (round.player1_damage_dealt || 0) + (round.player2_damage_dealt || 0);
                
                // Perfect round: won without taking damage
                if (round.winner_address === playerId) {
                    // We'd need health data to determine perfect rounds
                    // For now, this is a placeholder
                }
            }

            stats.total_damage_dealt = Math.floor(totalDamage / 2); // Rough estimate
        }
    } catch (error) {
        console.error('Error in fetchMatchStats:', error);
    }

    return stats;
}

/**
 * Fetch survival mode statistics
 */
async function fetchSurvivalStats(supabase: any, playerId: string): Promise<Partial<PlayerStats>> {
    const stats: Partial<PlayerStats> = {
        max_survival_waves: 0,
    };

    try {
        // Get best survival performance from the view
        const { data, error } = await supabase
            .from('survival_leaderboard')
            .select('best_waves')
            .eq('address', playerId)
            .single();

        if (!error && data) {
            stats.max_survival_waves = data.best_waves || 0;
            console.log(`[fetchSurvivalStats] Found best_waves from leaderboard: ${stats.max_survival_waves}`);
        } else {
            console.log(`[fetchSurvivalStats] Leaderboard query failed or no data, trying survival_runs. Error: ${error?.message}`);
            // Fallback: query survival_runs directly
            const { data: runs, error: runsError } = await supabase
                .from('survival_runs')
                .select('waves_cleared')
                .eq('player_id', playerId)
                .order('waves_cleared', { ascending: false })
                .limit(1);

            if (!runsError && runs && runs.length > 0) {
                stats.max_survival_waves = runs[0].waves_cleared || 0;
                console.log(`[fetchSurvivalStats] Found waves_cleared from runs: ${stats.max_survival_waves}`);
            } else {
                console.log(`[fetchSurvivalStats] No survival runs found for player: ${playerId}. Error: ${runsError?.message}`);
            }
        }
    } catch (error) {
        console.error('Error in fetchSurvivalStats:', error);
    }

    return stats;
}

/**
 * Fetch quest-related statistics
 */
async function fetchQuestStats(supabase: any, playerId: string): Promise<Partial<PlayerStats>> {
    const stats: Partial<PlayerStats> = {
        quests_completed: 0,
        quest_streak: 0,
    };

    try {
        // Count completed quests
        const { count, error } = await supabase
            .from('daily_quests')
            .select('*', { count: 'exact', head: true })
            .eq('player_id', playerId)
            .eq('is_completed', true);

        if (!error) {
            stats.quests_completed = count || 0;
        }

        // Calculate quest streak (consecutive days with completed quests)
        const { data: recentQuests, error: streakError } = await supabase
            .from('daily_quests')
            .select('assigned_date, is_completed')
            .eq('player_id', playerId)
            .eq('is_completed', true)
            .order('assigned_date', { ascending: false })
            .limit(30);

        if (!streakError && recentQuests && recentQuests.length > 0) {
            let streak = 0;
            let lastDate: Date | null = null;

            for (const quest of recentQuests) {
                const questDate = new Date(quest.assigned_date);
                
                if (!lastDate) {
                    streak = 1;
                    lastDate = questDate;
                } else {
                    const dayDiff = Math.floor((lastDate.getTime() - questDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (dayDiff === 1) {
                        streak++;
                        lastDate = questDate;
                    } else {
                        break;
                    }
                }
            }

            stats.quest_streak = streak;
        }
    } catch (error) {
        console.error('Error in fetchQuestStats:', error);
    }

    return stats;
}

/**
 * Fetch currency-related statistics
 */
async function fetchCurrencyStats(supabase: any, playerId: string): Promise<Partial<PlayerStats>> {
    const stats: Partial<PlayerStats> = {
        total_shards_earned: 0,
    };

    try {
        const { data, error } = await supabase
            .from('player_currency')
            .select('total_earned')
            .eq('player_id', playerId)
            .single();

        if (!error && data) {
            stats.total_shards_earned = data.total_earned || 0;
        }
    } catch (error) {
        console.error('Error in fetchCurrencyStats:', error);
    }

    return stats;
}

/**
 * Fetch inventory-related statistics
 */
async function fetchInventoryStats(supabase: any, playerId: string): Promise<Partial<PlayerStats>> {
    const stats: Partial<PlayerStats> = {
        cosmetics_owned: 0,
        shop_purchases: 0,
        epic_or_legendary_owned: 0,
        legendary_owned: 0,
    };

    try {
        // Count cosmetics owned
        const { data: inventory, error } = await supabase
            .from('player_inventory')
            .select(`
                id,
                source,
                cosmetic:cosmetic_items(rarity)
            `)
            .eq('player_id', playerId);

        if (!error && inventory) {
            stats.cosmetics_owned = inventory.length;
            stats.shop_purchases = inventory.filter((i: any) => i.source === 'shop_purchase').length;
            
            for (const item of inventory) {
                const rarity = item.cosmetic?.rarity;
                if (rarity === 'legendary') {
                    stats.legendary_owned = (stats.legendary_owned || 0) + 1;
                    stats.epic_or_legendary_owned = (stats.epic_or_legendary_owned || 0) + 1;
                } else if (rarity === 'epic') {
                    stats.epic_or_legendary_owned = (stats.epic_or_legendary_owned || 0) + 1;
                }
            }
        }
    } catch (error) {
        console.error('Error in fetchInventoryStats:', error);
    }

    return stats;
}

/**
 * Fetch achievement-related statistics (meta-achievements)
 */
async function fetchAchievementStats(supabase: any, playerId: string): Promise<Partial<PlayerStats>> {
    const stats: Partial<PlayerStats> = {
        achievements_unlocked: 0,
        categories_completed: 0,
        combat_bronze_unlocked: 0,
    };

    try {
        const { data: achievements, error } = await supabase
            .from('player_achievements')
            .select('achievement_id, is_unlocked')
            .eq('player_id', playerId)
            .eq('is_unlocked', true);

        if (!error && achievements) {
            stats.achievements_unlocked = achievements.length;

            // Count combat bronze achievements (IDs c01-c04)
            const combatBronzeIds = ['c01', 'c02', 'c03', 'c04'];
            stats.combat_bronze_unlocked = achievements.filter((a: any) => 
                combatBronzeIds.includes(a.achievement_id)
            ).length;
        }

        // Categories completed would require checking if all achievements in a category are unlocked
        // This is complex and may need to be calculated differently
    } catch (error) {
        console.error('Error in fetchAchievementStats:', error);
    }

    return stats;
}

/**
 * Fetch progression-related statistics
 */
async function fetchProgressionStats(supabase: any, playerId: string): Promise<Partial<PlayerStats>> {
    const stats: Partial<PlayerStats> = {
        current_tier: 1,
        total_xp: 0,
        prestige_level: 0,
    };

    try {
        // Get player progression data
        const { data, error } = await supabase
            .from('player_progression')
            .select('current_tier, current_xp, prestige_level')
            .eq('player_id', playerId)
            .single();

        if (!error && data) {
            stats.current_tier = data.current_tier || 1;
            stats.total_xp = data.current_xp || 0;
            stats.prestige_level = data.prestige_level || 0;
        }
    } catch (error) {
        // Table may not exist or no data
        console.error('Error in fetchProgressionStats:', error);
    }

    return stats;
}
