-- 006_fix_achievement_ids.sql
-- Fix achievement IDs to use strings instead of UUIDs
-- This allows the code to use simple string IDs like 'c01', 'm01', etc.

-- First, drop all policies that depend on achievement_id
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
DROP POLICY IF EXISTS "Players can view secret achievements they unlocked" ON public.achievements;
DROP POLICY IF EXISTS "Anyone can view player achievements" ON public.player_achievements;
DROP POLICY IF EXISTS "Players can view own achievements" ON public.player_achievements;
DROP POLICY IF EXISTS "Players can insert own achievements" ON public.player_achievements;
DROP POLICY IF EXISTS "Players can update own achievements" ON public.player_achievements;

-- Drop the foreign key constraint from player_achievements
ALTER TABLE public.player_achievements 
  DROP CONSTRAINT IF EXISTS player_achievements_achievement_id_fkey;

-- Change achievement_id in player_achievements to text
ALTER TABLE public.player_achievements 
  ALTER COLUMN achievement_id TYPE text;

-- Drop and recreate the achievements table with text ID
DROP TABLE IF EXISTS public.achievements CASCADE;

CREATE TABLE public.achievements (
  id text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['combat'::text, 'progression'::text, 'social'::text, 'collection'::text, 'mastery'::text])),
  tier text NOT NULL CHECK (tier = ANY (ARRAY['bronze'::text, 'silver'::text, 'gold'::text, 'platinum'::text, 'diamond'::text])),
  icon_url text,
  xp_reward integer NOT NULL CHECK (xp_reward >= 0),
  currency_reward integer NOT NULL CHECK (currency_reward >= 0),
  badge_reward uuid,
  requirement jsonb NOT NULL,
  is_secret boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id),
  CONSTRAINT achievements_badge_reward_fkey FOREIGN KEY (badge_reward) REFERENCES public.cosmetic_items(id)
);

-- Recreate the foreign key with text type
ALTER TABLE public.player_achievements 
  ADD CONSTRAINT player_achievements_achievement_id_fkey 
  FOREIGN KEY (achievement_id) REFERENCES public.achievements(id);

-- Recreate the unique constraint for player_id and achievement_id
ALTER TABLE public.player_achievements
  DROP CONSTRAINT IF EXISTS player_achievements_player_id_achievement_id_key;
  
ALTER TABLE public.player_achievements
  ADD CONSTRAINT player_achievements_player_id_achievement_id_key 
  UNIQUE (player_id, achievement_id);

-- Enable RLS on achievements table
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view achievements
CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

-- Enable RLS on player_achievements table
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view player achievements
CREATE POLICY "Anyone can view player achievements"
  ON public.player_achievements FOR SELECT
  USING (true);

-- Server can insert player achievements (via service role)
CREATE POLICY "Server can manage player achievements"
  ON public.player_achievements FOR ALL
  USING (true)
  WITH CHECK (true);
