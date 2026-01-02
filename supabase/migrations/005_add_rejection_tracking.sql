-- Migration: Add rejection tracking columns to rounds table
-- These columns track when a player rejects their wallet transaction

ALTER TABLE rounds
ADD COLUMN IF NOT EXISTS player1_rejected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS player2_rejected BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN rounds.player1_rejected IS 'True if player1 rejected their wallet transaction for this round';
COMMENT ON COLUMN rounds.player2_rejected IS 'True if player2 rejected their wallet transaction for this round';
