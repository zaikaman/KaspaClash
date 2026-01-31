-- Migration: Bot Power Surge Choices
-- Created: 2026-01-31
-- Description: Adds column to store bot's precomputed power surge card choices

-- =============================================================================
-- ADD COLUMN FOR BOT'S POWER SURGE CHOICES
-- =============================================================================
-- For bot matches, we pre-compute which card the bot will "choose" from each
-- round's offered cards. This is stored as a JSONB mapping:
-- { "1": "power_surge_id_1", "2": "power_surge_id_2", ... }
--
-- The key is the round number (1-5), the value is the PowerSurgeCardId the bot
-- will select from that round's offered cards.

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS bot_power_surge_choices JSONB DEFAULT NULL;

COMMENT ON COLUMN public.matches.bot_power_surge_choices IS 
  'For bot matches: precomputed power surge card choices for each round. Format: {"1": "cardId", "2": "cardId", ...}';

-- =============================================================================
-- UPDATE CURRENT SCHEMA FILE
-- =============================================================================
-- Remember to add this column to current_schema.sql after running migration
