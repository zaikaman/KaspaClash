-- Bot Matches Table Migration
-- Stores pre-computed bot matches for 24/7 betting

-- =============================================================================
-- BOT MATCHES TABLE
-- =============================================================================

CREATE TABLE public.bot_matches (
  id text NOT NULL PRIMARY KEY,
  bot1_character_id text NOT NULL,
  bot2_character_id text NOT NULL,
  bot1_name text NOT NULL,
  bot2_name text NOT NULL,
  seed text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  
  -- Pre-computed game data stored as JSONB
  turns jsonb NOT NULL,
  total_turns integer NOT NULL CHECK (total_turns > 0),
  match_winner text CHECK (match_winner IS NULL OR match_winner IN ('player1', 'player2')),
  bot1_rounds_won integer NOT NULL DEFAULT 0,
  bot2_rounds_won integer NOT NULL DEFAULT 0,
  turn_duration_ms integer NOT NULL DEFAULT 2500,
  
  -- Initial stats
  bot1_max_hp integer NOT NULL,
  bot2_max_hp integer NOT NULL,
  bot1_max_energy integer NOT NULL,
  bot2_max_energy integer NOT NULL,
  
  -- Betting fields
  betting_closes_at_turn integer NOT NULL DEFAULT 3,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_bot_matches_status ON public.bot_matches(status);
CREATE INDEX idx_bot_matches_created_at ON public.bot_matches(created_at DESC);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.bot_matches ENABLE ROW LEVEL SECURITY;

-- Anyone can read bot matches
CREATE POLICY "bot_matches_read_all" ON public.bot_matches
  FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "bot_matches_service_insert" ON public.bot_matches
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "bot_matches_service_update" ON public.bot_matches
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "bot_matches_service_delete" ON public.bot_matches
  FOR DELETE USING (auth.role() = 'service_role');

-- =============================================================================
-- CLEANUP FUNCTION
-- =============================================================================

-- Function to clean up old bot matches (keep last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_bot_matches()
RETURNS void AS $$
BEGIN
  DELETE FROM public.bot_matches
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_bot_matches() TO service_role;
