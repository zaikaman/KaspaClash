-- 005_survival_schema.sql
-- Survival Mode tables and policies

-- =============================================================================
-- SURVIVAL RUNS TABLE
-- Track individual survival attempts
-- =============================================================================
CREATE TABLE public.survival_runs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  character_id text NOT NULL,
  waves_cleared integer NOT NULL DEFAULT 0 CHECK (waves_cleared >= 0 AND waves_cleared <= 20),
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  shards_earned integer NOT NULL DEFAULT 0 CHECK (shards_earned >= 0),
  final_health integer CHECK (final_health IS NULL OR (final_health >= 0 AND final_health <= 100)),
  is_victory boolean NOT NULL DEFAULT false,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  CONSTRAINT survival_runs_pkey PRIMARY KEY (id),
  CONSTRAINT survival_runs_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address),
  CONSTRAINT survival_runs_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id)
);

-- Index for leaderboard queries
CREATE INDEX survival_runs_player_id_idx ON public.survival_runs(player_id);
CREATE INDEX survival_runs_score_idx ON public.survival_runs(score DESC);
CREATE INDEX survival_runs_waves_idx ON public.survival_runs(waves_cleared DESC);
CREATE INDEX survival_runs_started_at_idx ON public.survival_runs(started_at);

-- =============================================================================
-- SURVIVAL DAILY PLAYS TABLE
-- Track daily play count per player (resets at midnight UTC)
-- =============================================================================
CREATE TABLE public.survival_daily_plays (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  play_date date NOT NULL DEFAULT CURRENT_DATE,
  plays_count integer NOT NULL DEFAULT 0 CHECK (plays_count >= 0 AND plays_count <= 3),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT survival_daily_plays_pkey PRIMARY KEY (id),
  CONSTRAINT survival_daily_plays_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address),
  CONSTRAINT survival_daily_plays_unique UNIQUE (player_id, play_date)
);

CREATE INDEX survival_daily_plays_player_date_idx ON public.survival_daily_plays(player_id, play_date);

-- =============================================================================
-- SURVIVAL LEADERBOARD VIEW
-- Aggregated best scores per player
-- =============================================================================
CREATE OR REPLACE VIEW public.survival_leaderboard AS
SELECT 
  p.address,
  p.display_name,
  p.avatar_url,
  COALESCE(stats.best_waves, 0) as best_waves,
  COALESCE(stats.best_score, 0) as best_score,
  COALESCE(stats.total_runs, 0) as total_runs,
  COALESCE(stats.total_shards_earned, 0) as total_shards_earned,
  COALESCE(stats.victories, 0) as victories,
  stats.last_run_at,
  RANK() OVER (ORDER BY stats.best_score DESC, stats.best_waves DESC) as rank
FROM public.players p
LEFT JOIN (
  SELECT 
    player_id,
    MAX(waves_cleared) as best_waves,
    MAX(score) as best_score,
    COUNT(*) as total_runs,
    SUM(shards_earned) as total_shards_earned,
    SUM(CASE WHEN is_victory THEN 1 ELSE 0 END) as victories,
    MAX(ended_at) as last_run_at
  FROM public.survival_runs
  WHERE ended_at IS NOT NULL
  GROUP BY player_id
) stats ON p.address = stats.player_id
WHERE stats.total_runs > 0
ORDER BY stats.best_score DESC, stats.best_waves DESC;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS on survival tables
ALTER TABLE public.survival_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survival_daily_plays ENABLE ROW LEVEL SECURITY;

-- Survival runs: Players can view all, but only insert their own
CREATE POLICY "Anyone can view survival runs"
  ON public.survival_runs FOR SELECT
  USING (true);

CREATE POLICY "Players can insert own survival runs"
  ON public.survival_runs FOR INSERT
  WITH CHECK (true); -- Server validates player_id matches authenticated user

CREATE POLICY "Players can update own survival runs"
  ON public.survival_runs FOR UPDATE
  USING (true); -- Server validates

-- Daily plays: Players can view and manage their own
CREATE POLICY "Anyone can view daily plays"
  ON public.survival_daily_plays FOR SELECT
  USING (true);

CREATE POLICY "Players can insert own daily plays"
  ON public.survival_daily_plays FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can update own daily plays"
  ON public.survival_daily_plays FOR UPDATE
  USING (true);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get or create daily plays record
CREATE OR REPLACE FUNCTION public.get_or_create_daily_plays(p_player_id text)
RETURNS public.survival_daily_plays
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result public.survival_daily_plays;
BEGIN
  -- Try to get existing record for today
  SELECT * INTO result
  FROM public.survival_daily_plays
  WHERE player_id = p_player_id AND play_date = CURRENT_DATE;
  
  -- If not found, create new record
  IF result IS NULL THEN
    INSERT INTO public.survival_daily_plays (player_id, play_date, plays_count)
    VALUES (p_player_id, CURRENT_DATE, 0)
    RETURNING * INTO result;
  END IF;
  
  RETURN result;
END;
$$;

-- Function to increment daily plays
CREATE OR REPLACE FUNCTION public.increment_survival_plays(p_player_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_plays integer;
BEGIN
  -- Get or create daily plays record
  PERFORM public.get_or_create_daily_plays(p_player_id);
  
  -- Increment and return new count
  UPDATE public.survival_daily_plays
  SET plays_count = plays_count + 1, updated_at = now()
  WHERE player_id = p_player_id AND play_date = CURRENT_DATE
  RETURNING plays_count INTO current_plays;
  
  RETURN current_plays;
END;
$$;

-- Function to check remaining plays
CREATE OR REPLACE FUNCTION public.get_survival_plays_remaining(p_player_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_plays integer;
BEGIN
  SELECT plays_count INTO current_plays
  FROM public.survival_daily_plays
  WHERE player_id = p_player_id AND play_date = CURRENT_DATE;
  
  IF current_plays IS NULL THEN
    RETURN 3; -- Max plays if no record exists
  END IF;
  
  RETURN GREATEST(0, 3 - current_plays);
END;
$$;
