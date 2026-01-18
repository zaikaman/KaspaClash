-- 010_treasury_schema.sql
-- Treasury Distribution System Tables
-- Weekly distribution: 40% ELO top 10, 40% Survival top 10, 20% treasury reserve

-- =============================================================================
-- TREASURY DEPOSITS TABLE
-- Track all incoming KAS deposits to the betting vault
-- =============================================================================
CREATE TABLE public.treasury_deposits (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_address text NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  tx_id text NOT NULL UNIQUE,
  source text NOT NULL CHECK (source = ANY (ARRAY['betting'::text, 'shop'::text, 'stake'::text, 'other'::text])),
  network text NOT NULL CHECK (network = ANY (ARRAY['mainnet'::text, 'testnet'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'failed'::text])),
  block_height bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone,
  CONSTRAINT treasury_deposits_pkey PRIMARY KEY (id),
  CONSTRAINT treasury_deposits_player_address_fkey FOREIGN KEY (player_address) REFERENCES public.players(address)
);

-- Indexes for treasury deposits
CREATE INDEX treasury_deposits_player_address_idx ON public.treasury_deposits(player_address);
CREATE INDEX treasury_deposits_created_at_idx ON public.treasury_deposits(created_at DESC);
CREATE INDEX treasury_deposits_status_idx ON public.treasury_deposits(status);
CREATE INDEX treasury_deposits_source_idx ON public.treasury_deposits(source);

-- =============================================================================
-- TREASURY DISTRIBUTIONS TABLE
-- Track weekly distribution events
-- =============================================================================
CREATE TABLE public.treasury_distributions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  distribution_week date NOT NULL,
  total_amount bigint NOT NULL CHECK (total_amount >= 0),
  elo_pool_amount bigint NOT NULL CHECK (elo_pool_amount >= 0),
  survival_pool_amount bigint NOT NULL CHECK (survival_pool_amount >= 0),
  reserve_amount bigint NOT NULL CHECK (reserve_amount >= 0),
  network text NOT NULL CHECK (network = ANY (ARRAY['mainnet'::text, 'testnet'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  elo_payouts_count integer NOT NULL DEFAULT 0,
  survival_payouts_count integer NOT NULL DEFAULT 0,
  failed_payouts_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  CONSTRAINT treasury_distributions_pkey PRIMARY KEY (id),
  CONSTRAINT treasury_distributions_week_network_unique UNIQUE (distribution_week, network)
);

-- Index for distribution queries
CREATE INDEX treasury_distributions_created_at_idx ON public.treasury_distributions(created_at DESC);
CREATE INDEX treasury_distributions_status_idx ON public.treasury_distributions(status);

-- =============================================================================
-- DISTRIBUTION PAYOUTS TABLE
-- Track individual payouts to players from each distribution
-- =============================================================================
CREATE TABLE public.distribution_payouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  distribution_id uuid NOT NULL,
  player_address text NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  leaderboard_type text NOT NULL CHECK (leaderboard_type = ANY (ARRAY['elo'::text, 'survival'::text])),
  rank integer NOT NULL CHECK (rank >= 1 AND rank <= 10),
  tx_id text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'confirmed'::text, 'failed'::text])),
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  CONSTRAINT distribution_payouts_pkey PRIMARY KEY (id),
  CONSTRAINT distribution_payouts_distribution_id_fkey FOREIGN KEY (distribution_id) REFERENCES public.treasury_distributions(id),
  CONSTRAINT distribution_payouts_player_address_fkey FOREIGN KEY (player_address) REFERENCES public.players(address)
);

-- Indexes for payout queries
CREATE INDEX distribution_payouts_distribution_id_idx ON public.distribution_payouts(distribution_id);
CREATE INDEX distribution_payouts_player_address_idx ON public.distribution_payouts(player_address);
CREATE INDEX distribution_payouts_status_idx ON public.distribution_payouts(status);
CREATE INDEX distribution_payouts_leaderboard_type_idx ON public.distribution_payouts(leaderboard_type);

-- =============================================================================
-- TREASURY BALANCE SNAPSHOTS TABLE
-- Track vault balance over time for auditing
-- =============================================================================
CREATE TABLE public.treasury_balance_snapshots (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  balance bigint NOT NULL CHECK (balance >= 0),
  network text NOT NULL CHECK (network = ANY (ARRAY['mainnet'::text, 'testnet'::text])),
  snapshot_type text NOT NULL CHECK (snapshot_type = ANY (ARRAY['daily'::text, 'pre_distribution'::text, 'post_distribution'::text, 'manual'::text])),
  distribution_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT treasury_balance_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT treasury_balance_snapshots_distribution_id_fkey FOREIGN KEY (distribution_id) REFERENCES public.treasury_distributions(id)
);

-- Index for balance snapshot queries
CREATE INDEX treasury_balance_snapshots_created_at_idx ON public.treasury_balance_snapshots(created_at DESC);
CREATE INDEX treasury_balance_snapshots_network_idx ON public.treasury_balance_snapshots(network);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS on treasury tables
ALTER TABLE public.treasury_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_balance_snapshots ENABLE ROW LEVEL SECURITY;

-- Treasury deposits: Anyone can view, server inserts
CREATE POLICY "Anyone can view treasury deposits"
  ON public.treasury_deposits FOR SELECT
  USING (true);

CREATE POLICY "Server can insert treasury deposits"
  ON public.treasury_deposits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Server can update treasury deposits"
  ON public.treasury_deposits FOR UPDATE
  USING (true);

-- Treasury distributions: Anyone can view
CREATE POLICY "Anyone can view treasury distributions"
  ON public.treasury_distributions FOR SELECT
  USING (true);

CREATE POLICY "Server can insert treasury distributions"
  ON public.treasury_distributions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Server can update treasury distributions"
  ON public.treasury_distributions FOR UPDATE
  USING (true);

-- Distribution payouts: Anyone can view
CREATE POLICY "Anyone can view distribution payouts"
  ON public.distribution_payouts FOR SELECT
  USING (true);

CREATE POLICY "Server can insert distribution payouts"
  ON public.distribution_payouts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Server can update distribution payouts"
  ON public.distribution_payouts FOR UPDATE
  USING (true);

-- Balance snapshots: Anyone can view
CREATE POLICY "Anyone can view balance snapshots"
  ON public.treasury_balance_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Server can insert balance snapshots"
  ON public.treasury_balance_snapshots FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get total deposits since last distribution
CREATE OR REPLACE FUNCTION public.get_deposits_since_last_distribution(p_network text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_distribution_date timestamp with time zone;
  total_deposits bigint;
BEGIN
  -- Get the last completed distribution date
  SELECT completed_at INTO last_distribution_date
  FROM public.treasury_distributions
  WHERE network = p_network AND status = 'completed'
  ORDER BY completed_at DESC
  LIMIT 1;
  
  -- If no previous distribution, count all confirmed deposits
  IF last_distribution_date IS NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO total_deposits
    FROM public.treasury_deposits
    WHERE network = p_network AND status = 'confirmed';
  ELSE
    SELECT COALESCE(SUM(amount), 0) INTO total_deposits
    FROM public.treasury_deposits
    WHERE network = p_network 
      AND status = 'confirmed'
      AND confirmed_at > last_distribution_date;
  END IF;
  
  RETURN total_deposits;
END;
$$;

-- Function to get player's total earnings from distributions
CREATE OR REPLACE FUNCTION public.get_player_distribution_earnings(p_player_address text)
RETURNS TABLE(
  total_earned bigint,
  elo_earnings bigint,
  survival_earnings bigint,
  payout_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(dp.amount), 0)::bigint as total_earned,
    COALESCE(SUM(CASE WHEN dp.leaderboard_type = 'elo' THEN dp.amount ELSE 0 END), 0)::bigint as elo_earnings,
    COALESCE(SUM(CASE WHEN dp.leaderboard_type = 'survival' THEN dp.amount ELSE 0 END), 0)::bigint as survival_earnings,
    COUNT(*)::integer as payout_count
  FROM public.distribution_payouts dp
  WHERE dp.player_address = p_player_address
    AND dp.status = 'confirmed';
END;
$$;

-- Function to check if distribution is already running for this week
CREATE OR REPLACE FUNCTION public.can_run_distribution(p_network text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_week date;
  existing_distribution uuid;
BEGIN
  -- Get the start of the current week (Monday)
  current_week := date_trunc('week', CURRENT_DATE)::date;
  
  -- Check if there's already a distribution for this week
  SELECT id INTO existing_distribution
  FROM public.treasury_distributions
  WHERE distribution_week = current_week
    AND network = p_network
    AND status IN ('pending', 'processing', 'completed');
  
  RETURN existing_distribution IS NULL;
END;
$$;
