-- Add selection_deadline_at column to matches table
-- This stores the server-managed deadline timestamp for character selection
-- Both players will sync their timers to this deadline

ALTER TABLE public.matches
ADD COLUMN selection_deadline_at timestamp with time zone;

-- Add comment explaining the column
COMMENT ON COLUMN public.matches.selection_deadline_at IS 'Server-managed deadline timestamp for character selection. Both clients sync their timers to this value.';
