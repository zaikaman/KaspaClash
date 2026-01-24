-- Add indexes for player progression queries
-- These indexes will dramatically speed up the /api/progression/player/[address] endpoint

-- Index on player_progression for faster lookups by player_id and season_id
CREATE INDEX IF NOT EXISTS idx_player_progression_player_season 
ON player_progression(player_id, season_id);

-- Index on player_currency for faster lookups by player_id
CREATE INDEX IF NOT EXISTS idx_player_currency_player_id 
ON player_currency(player_id);

-- Index on battle_pass_seasons for active season queries
CREATE INDEX IF NOT EXISTS idx_battle_pass_seasons_active 
ON battle_pass_seasons(is_active) 
WHERE is_active = true;

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_player_progression_season_tier 
ON player_progression(season_id, current_tier) 
INCLUDE (current_xp, total_xp);

COMMENT ON INDEX idx_player_progression_player_season IS 'Speeds up player progression lookups by player and season';
COMMENT ON INDEX idx_player_currency_player_id IS 'Speeds up currency balance lookups';
COMMENT ON INDEX idx_battle_pass_seasons_active IS 'Speeds up active season queries';
COMMENT ON INDEX idx_player_progression_season_tier IS 'Optimizes leaderboard and tier-based queries';
