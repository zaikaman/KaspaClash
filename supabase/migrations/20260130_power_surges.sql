-- Migration: Power Surges Table
-- Created: 2026-01-30
-- Description: Stores Power Surge card selections for each round of a match

-- =============================================================================
-- POWER_SURGES TABLE
-- =============================================================================
-- Tracks which Power Surge card each player selected for each round.
-- Both players see the same 3 offered cards per round (stored in offered_cards).
-- Selection identity is hidden until the round starts (revealed flag).

CREATE TABLE IF NOT EXISTS public.power_surges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  
  -- Match and round identification
  match_id uuid NOT NULL,
  round_number integer NOT NULL CHECK (round_number >= 1 AND round_number <= 5),
  
  -- The 3 cards offered this round (same for both players)
  offered_cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Player 1 selection
  player1_card_id text,
  player1_tx_id text,
  player1_selected_at timestamp with time zone,
  
  -- Player 2 selection
  player2_card_id text,
  player2_tx_id text,
  player2_selected_at timestamp with time zone,
  
  -- Reveal state - cards are revealed when round starts
  revealed_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT power_surges_pkey PRIMARY KEY (id),
  CONSTRAINT power_surges_match_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE,
  CONSTRAINT power_surges_match_round_unique UNIQUE (match_id, round_number)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Fast lookup by match
CREATE INDEX IF NOT EXISTS idx_power_surges_match_id ON public.power_surges(match_id);

-- Lookup by match and round
CREATE INDEX IF NOT EXISTS idx_power_surges_match_round ON public.power_surges(match_id, round_number);

-- =============================================================================
-- UPDATE TRIGGER
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_power_surges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_power_surges_updated_at
  BEFORE UPDATE ON public.power_surges
  FOR EACH ROW
  EXECUTE FUNCTION update_power_surges_updated_at();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE public.power_surges ENABLE ROW LEVEL SECURITY;

-- Anyone can read power surge data (for spectators)
CREATE POLICY "Allow public read access" ON public.power_surges
  FOR SELECT USING (true);

-- Only match participants can insert/update their own selections
-- (enforced at API level with wallet auth)
CREATE POLICY "Allow authenticated insert" ON public.power_surges
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON public.power_surges
  FOR UPDATE USING (true);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.power_surges IS 'Power Surge card selections per round in matches';
COMMENT ON COLUMN public.power_surges.offered_cards IS 'JSON array of 3 PowerSurgeCardId strings offered this round';
COMMENT ON COLUMN public.power_surges.player1_card_id IS 'Card ID selected by player 1 (null if no selection)';
COMMENT ON COLUMN public.power_surges.player2_card_id IS 'Card ID selected by player 2 (null if no selection)';
COMMENT ON COLUMN public.power_surges.revealed_at IS 'When both selections were revealed (round start)';
