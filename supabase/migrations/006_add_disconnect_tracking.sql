-- Add disconnect tracking columns to matches table
-- Tracks when players disconnect and allows for 30-second reconnection window

-- Add disconnect timestamp columns
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS player1_disconnected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS player2_disconnected_at timestamp with time zone;

-- Add disconnect timeout seconds (configurable per match, default 30)
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS disconnect_timeout_seconds integer DEFAULT 30;

-- Add index for finding matches with disconnected players
CREATE INDEX IF NOT EXISTS idx_matches_disconnected
ON public.matches (player1_disconnected_at, player2_disconnected_at)
WHERE status = 'in_progress';

-- Comment for clarity
COMMENT ON COLUMN public.matches.player1_disconnected_at IS 'Timestamp when player1 disconnected. NULL if connected.';
COMMENT ON COLUMN public.matches.player2_disconnected_at IS 'Timestamp when player2 disconnected. NULL if connected.';
COMMENT ON COLUMN public.matches.disconnect_timeout_seconds IS 'Seconds to wait before declaring disconnected player as forfeited. Default 30.';
