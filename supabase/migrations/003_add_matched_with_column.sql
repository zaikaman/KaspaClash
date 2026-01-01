-- =============================================================================
-- Migration: Add matched_with column to matchmaking_queue
-- Purpose: Enables atomic claim-based matchmaking to prevent race conditions
-- =============================================================================

-- Create matchmaking_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS matchmaking_queue (
    address TEXT PRIMARY KEY REFERENCES players(address),
    rating INTEGER NOT NULL DEFAULT 1000,
    status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'matching', 'matched')),
    matched_with TEXT REFERENCES players(address),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add matched_with column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'matchmaking_queue' 
        AND column_name = 'matched_with'
    ) THEN
        ALTER TABLE matchmaking_queue ADD COLUMN matched_with TEXT REFERENCES players(address);
    END IF;
END $$;

-- Create index for efficient opponent searching
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_searching 
ON matchmaking_queue(status, rating, joined_at) 
WHERE status = 'searching';

-- Create index for matched_with lookups
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_matched_with 
ON matchmaking_queue(matched_with) 
WHERE matched_with IS NOT NULL;
