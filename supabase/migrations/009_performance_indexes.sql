-- Performance Indexes Migration
-- Adds composite indexes on frequently queried columns to improve query performance

-- Daily quests: queried by player_id + assigned_date + is_claimed
CREATE INDEX IF NOT EXISTS idx_daily_quests_player_date 
    ON daily_quests(player_id, assigned_date, is_claimed);

-- Matches: frequently filtered by status with player addresses
CREATE INDEX IF NOT EXISTS idx_matches_status_player1 
    ON matches(status, player1_address);
CREATE INDEX IF NOT EXISTS idx_matches_status_player2 
    ON matches(status, player2_address);

-- Player inventory: checked for ownership queries
CREATE INDEX IF NOT EXISTS idx_player_inventory_player_cosmetic 
    ON player_inventory(player_id, cosmetic_id);

-- Rounds: always queried by match_id
CREATE INDEX IF NOT EXISTS idx_rounds_match_id 
    ON rounds(match_id);

-- Bets: queried by pool with bettor filtering
CREATE INDEX IF NOT EXISTS idx_bets_pool_bettor 
    ON bets(pool_id, bettor_address);

-- Achievements: filtered by player and unlock status
CREATE INDEX IF NOT EXISTS idx_player_achievements_player_unlocked 
    ON player_achievements(player_id, is_unlocked);

-- Currency transactions: time-ordered by player
CREATE INDEX IF NOT EXISTS idx_currency_transactions_player_time 
    ON currency_transactions(player_id, created_at DESC);

-- Survival runs: leaderboard queries by waves
CREATE INDEX IF NOT EXISTS idx_survival_runs_player_waves 
    ON survival_runs(player_id, waves_cleared DESC);

-- Progression: season-based lookups
CREATE INDEX IF NOT EXISTS idx_player_progression_player_season 
    ON player_progression(player_id, season_id);

-- Shop purchases: history queries by player
CREATE INDEX IF NOT EXISTS idx_shop_purchases_player_date 
    ON shop_purchases(player_id, purchase_date DESC);

-- Betting pools: match lookup
CREATE INDEX IF NOT EXISTS idx_betting_pools_match 
    ON betting_pools(match_id);
