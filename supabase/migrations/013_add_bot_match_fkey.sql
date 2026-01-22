-- Add foreign key relationship between bot_betting_pools and bot_matches
-- This ensures referential integrity and enables Supabase's automatic joins

-- Add foreign key constraint
ALTER TABLE public.bot_betting_pools
ADD CONSTRAINT bot_betting_pools_bot_match_fkey 
FOREIGN KEY (bot_match_id) 
REFERENCES public.bot_matches(id) 
ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON CONSTRAINT bot_betting_pools_bot_match_fkey ON public.bot_betting_pools 
IS 'Links betting pools to their corresponding bot matches';
