-- Add is_bot field to matches table
-- This allows us to identify bot matches without relying on address prefixes

-- Add is_bot column to matches table
ALTER TABLE public.matches
ADD COLUMN is_bot boolean NOT NULL DEFAULT false;

-- Create index for fast bot match lookups
CREATE INDEX idx_matches_is_bot ON public.matches(is_bot) WHERE is_bot = true;

-- Update existing bot matches (addresses starting with bot_)
UPDATE public.matches
SET is_bot = true
WHERE player1_address LIKE 'bot_%' OR player2_address LIKE 'bot_%';

-- Add comment
COMMENT ON COLUMN public.matches.is_bot IS 'Indicates if this match is against a bot opponent';
