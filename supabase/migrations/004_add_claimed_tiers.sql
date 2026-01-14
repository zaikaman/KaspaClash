-- Add claimed_tiers array to player_progression table
ALTER TABLE public.player_progression 
ADD COLUMN IF NOT EXISTS claimed_tiers integer[] DEFAULT '{}'::integer[];

-- Add index for performance (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_player_progression_claimed_tiers ON public.player_progression USING GIN (claimed_tiers);
