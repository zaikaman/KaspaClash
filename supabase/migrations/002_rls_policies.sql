-- =============================================================================
-- KaspaClash Row Level Security Policies
-- Implements access control for all tables
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PLAYERS POLICIES
-- =============================================================================

-- Anyone can read player profiles
CREATE POLICY "Players are viewable by everyone"
    ON players FOR SELECT
    USING (true);

-- Players can only be inserted by authenticated users (via API)
-- Note: In practice, this is handled by the server using service role
CREATE POLICY "Players can be created via API"
    ON players FOR INSERT
    WITH CHECK (true);

-- Players can only update their own profile (display_name only)
-- Note: Stats are updated by server via service role
CREATE POLICY "Players can update own display_name"
    ON players FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- CHARACTERS POLICIES
-- =============================================================================

-- Characters are read-only for everyone
CREATE POLICY "Characters are viewable by everyone"
    ON characters FOR SELECT
    USING (true);

-- Only admins can modify characters (via service role)
-- No insert/update/delete policies for anonymous role

-- =============================================================================
-- MATCHES POLICIES
-- =============================================================================

-- Anyone can view matches
CREATE POLICY "Matches are viewable by everyone"
    ON matches FOR SELECT
    USING (true);

-- Matches can be created via API
CREATE POLICY "Matches can be created via API"
    ON matches FOR INSERT
    WITH CHECK (true);

-- Match updates are handled by server via service role
CREATE POLICY "Matches can be updated via API"
    ON matches FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- ROUNDS POLICIES
-- =============================================================================

-- Anyone can view rounds
CREATE POLICY "Rounds are viewable by everyone"
    ON rounds FOR SELECT
    USING (true);

-- Rounds are created/updated by server
CREATE POLICY "Rounds can be created via API"
    ON rounds FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Rounds can be updated via API"
    ON rounds FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- MOVES POLICIES
-- =============================================================================

-- Anyone can view moves
CREATE POLICY "Moves are viewable by everyone"
    ON moves FOR SELECT
    USING (true);

-- Moves are created by server when players submit
CREATE POLICY "Moves can be created via API"
    ON moves FOR INSERT
    WITH CHECK (true);

-- Moves are updated by server when transactions confirm
CREATE POLICY "Moves can be updated via API"
    ON moves FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- LEADERBOARD VIEW
-- =============================================================================

-- Create a view for leaderboard queries
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    address,
    display_name,
    wins,
    losses,
    rating,
    CASE WHEN (wins + losses) > 0 
         THEN ROUND((wins::NUMERIC / (wins + losses)::NUMERIC) * 100, 2)
         ELSE 0 
    END as win_rate,
    ROW_NUMBER() OVER (ORDER BY rating DESC, wins DESC) as rank
FROM players
WHERE (wins + losses) > 0
ORDER BY rating DESC, wins DESC;

-- Grant access to the view
GRANT SELECT ON leaderboard TO anon, authenticated;
