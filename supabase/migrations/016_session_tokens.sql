
-- Create session_tokens table for persistent authentication
CREATE TABLE IF NOT EXISTS session_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_address TEXT NOT NULL REFERENCES players(address) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_session_tokens_token ON session_tokens(token);
CREATE INDEX IF NOT EXISTS idx_session_tokens_address ON session_tokens(player_address);

-- RLS Policies
ALTER TABLE session_tokens ENABLE ROW LEVEL SECURITY;

-- Players can see their own sessions (optional, mostly for management)
CREATE POLICY "Users can view own sessions" ON session_tokens
    FOR SELECT
    USING (player_address = current_user);

-- Clean up expired tokens periodically (could be done via cron, but here we just define the table)
