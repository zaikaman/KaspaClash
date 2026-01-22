-- Bot Betting Schema Migration
-- Enables spectator betting on bot vs bot matches

-- =============================================================================
-- BOT BETTING POOLS
-- =============================================================================

CREATE TABLE public.bot_betting_pools (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bot_match_id text NOT NULL UNIQUE,
  bot1_character_id text NOT NULL,
  bot2_character_id text NOT NULL,
  bot1_total bigint NOT NULL DEFAULT 0 CHECK (bot1_total >= 0),
  bot2_total bigint NOT NULL DEFAULT 0 CHECK (bot2_total >= 0),
  total_pool bigint NOT NULL DEFAULT 0 CHECK (total_pool >= 0),
  total_fees bigint NOT NULL DEFAULT 0 CHECK (total_fees >= 0),
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'locked'::text, 'resolved'::text, 'refunded'::text])),
  winner text CHECK (winner IS NULL OR (winner = ANY (ARRAY['bot1'::text, 'bot2'::text]))),
  betting_closes_at_turn integer NOT NULL DEFAULT 3 CHECK (betting_closes_at_turn > 0),
  match_created_at timestamp with time zone NOT NULL DEFAULT now(),
  locked_at timestamp with time zone,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bot_betting_pools_pkey PRIMARY KEY (id)
);

-- Index for fast lookup by match ID
CREATE INDEX idx_bot_betting_pools_match_id ON public.bot_betting_pools(bot_match_id);
CREATE INDEX idx_bot_betting_pools_status ON public.bot_betting_pools(status);

-- =============================================================================
-- BOT BETS
-- =============================================================================

CREATE TABLE public.bot_bets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pool_id uuid NOT NULL,
  bettor_address text NOT NULL,
  bet_on text NOT NULL CHECK (bet_on = ANY (ARRAY['bot1'::text, 'bot2'::text])),
  amount bigint NOT NULL CHECK (amount >= 100000000), -- Min 1 KAS
  fee_paid bigint NOT NULL DEFAULT 0,
  net_amount bigint NOT NULL DEFAULT 0,
  tx_id text NOT NULL UNIQUE,
  payout_amount bigint,
  payout_tx_id text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'won'::text, 'lost'::text, 'refunded'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone,
  paid_at timestamp with time zone,
  CONSTRAINT bot_bets_pkey PRIMARY KEY (id),
  CONSTRAINT bot_bets_pool_fkey FOREIGN KEY (pool_id) REFERENCES public.bot_betting_pools(id) ON DELETE CASCADE,
  CONSTRAINT bot_bets_bettor_fkey FOREIGN KEY (bettor_address) REFERENCES public.players(address)
);

-- Indexes for efficient queries
CREATE INDEX idx_bot_bets_pool_id ON public.bot_bets(pool_id);
CREATE INDEX idx_bot_bets_bettor_address ON public.bot_bets(bettor_address);
CREATE INDEX idx_bot_bets_status ON public.bot_bets(status);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.bot_betting_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_bets ENABLE ROW LEVEL SECURITY;

-- Pools: Anyone can read, only service role can modify
CREATE POLICY "bot_betting_pools_read_all" ON public.bot_betting_pools
  FOR SELECT USING (true);

CREATE POLICY "bot_betting_pools_service_insert" ON public.bot_betting_pools
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "bot_betting_pools_service_update" ON public.bot_betting_pools
  FOR UPDATE USING (auth.role() = 'service_role');

-- Bets: Anyone can read, players can insert their own bets, only service role can update
CREATE POLICY "bot_bets_read_all" ON public.bot_bets
  FOR SELECT USING (true);

CREATE POLICY "bot_bets_insert_own" ON public.bot_bets
  FOR INSERT WITH CHECK (true); -- Verified in API

CREATE POLICY "bot_bets_service_update" ON public.bot_bets
  FOR UPDATE USING (auth.role() = 'service_role');

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update pool totals when a bet is confirmed
CREATE OR REPLACE FUNCTION update_bot_pool_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    UPDATE public.bot_betting_pools
    SET 
      bot1_total = bot1_total + CASE WHEN NEW.bet_on = 'bot1' THEN NEW.net_amount ELSE 0 END,
      bot2_total = bot2_total + CASE WHEN NEW.bet_on = 'bot2' THEN NEW.net_amount ELSE 0 END,
      total_pool = total_pool + NEW.net_amount,
      total_fees = total_fees + NEW.fee_paid,
      updated_at = now()
    WHERE id = NEW.pool_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-updating pool totals
CREATE TRIGGER bot_bet_confirmed_trigger
  AFTER UPDATE ON public.bot_bets
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_pool_totals();

-- Trigger for initial insert if confirmed directly
CREATE TRIGGER bot_bet_insert_trigger
  AFTER INSERT ON public.bot_bets
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION update_bot_pool_totals();
