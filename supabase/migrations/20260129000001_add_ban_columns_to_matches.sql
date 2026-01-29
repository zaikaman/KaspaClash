-- Add ban columns to matches table for ban/pick phase
-- These store the character IDs that each player has banned

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS player1_ban_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS player2_ban_id TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.matches.player1_ban_id IS 'Character ID banned by player 1';
COMMENT ON COLUMN public.matches.player2_ban_id IS 'Character ID banned by player 2';
