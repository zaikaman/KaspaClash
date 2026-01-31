-- Add power_surge_deck column to matches table
-- This stores pre-computed Power Surge cards for all 5 rounds
-- Format: { "1": ["card1", "card2", "card3"], "2": [...], ... }

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS power_surge_deck JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN matches.power_surge_deck IS 'Pre-computed Power Surge cards for all 5 rounds. Generated when match starts.';
