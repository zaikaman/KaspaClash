-- =============================================================================
-- KaspaClash RLS Hardening Migration
-- Restricts public write access and secures sensitive tables
-- =============================================================================

-- 1. PLAYERS TABLE
-- Anyone can still view profiles (required for leaderboard/spectate)
DROP POLICY IF EXISTS "Players are viewable by everyone" ON players;
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);

-- Deny public INSERT/UPDATE (only via service role from API)
DROP POLICY IF EXISTS "Players can be created via API" ON players;
DROP POLICY IF EXISTS "Players can update own display_name" ON players;
DROP POLICY IF EXISTS "Players can update own profile" ON players;

-- 2. MATCHES TABLE
-- Anyone can view matches
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON matches;
CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (true);

-- Deny public INSERT/UPDATE
DROP POLICY IF EXISTS "Matches can be created via API" ON matches;
DROP POLICY IF EXISTS "Matches can be updated via API" ON matches;

-- 3. ROUNDS TABLE
-- Anyone can view rounds
DROP POLICY IF EXISTS "Rounds are viewable by everyone" ON rounds;
CREATE POLICY "Rounds are viewable by everyone" ON rounds FOR SELECT USING (true);

-- Deny public INSERT/UPDATE
DROP POLICY IF EXISTS "Rounds can be created via API" ON rounds;
DROP POLICY IF EXISTS "Rounds can be updated via API" ON rounds;

-- 4. MOVES TABLE
-- Anyone can view moves
DROP POLICY IF EXISTS "Moves are viewable by everyone" ON moves;
CREATE POLICY "Moves are viewable by everyone" ON moves FOR SELECT USING (true);

-- Deny public INSERT/UPDATE
DROP POLICY IF EXISTS "Moves can be created via API" ON moves;
DROP POLICY IF EXISTS "Moves can be updated via API" ON moves;

-- 5. BETTING POOLS (Added in recent migrations)
ALTER TABLE betting_pools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Betting pools are viewable by everyone" ON betting_pools;
CREATE POLICY "Betting pools are viewable by everyone" ON betting_pools FOR SELECT USING (true);

-- 6. BETS TABLE
-- Public can ONLY see their own bets or bets associated with a match (if needed)
-- For now, let's make it read-only for public
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bets are viewable by everyone" ON bets;
CREATE POLICY "Bets are viewable by everyone" ON bets FOR SELECT USING (true);

-- 7. COSMETICS / SHOP TABLES
ALTER TABLE player_cosmetics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Player cosmetics are viewable by everyone" ON player_cosmetics;
CREATE POLICY "Player cosmetics are viewable by everyone" ON player_cosmetics FOR SELECT USING (true);

-- =============================================================================
-- SUMMARY OF CHANGES
-- =============================================================================
-- All INSERT, UPDATE, and DELETE policies for public/anonymous roles have been
-- removed. These operations MUST now be performed via the API using the 
-- service_role key, which bypasses RLS. 
-- This prevents direct database modification if the anon key is compromised.
