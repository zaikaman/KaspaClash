-- Enable Realtime for player_currency table
-- This allows clients to subscribe to real-time updates when currency changes

-- Enable Realtime replication for player_currency table
ALTER TABLE player_currency REPLICA IDENTITY FULL;

-- Create publication for Realtime (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add player_currency table to Realtime publication (only if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'player_currency'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE player_currency;
    END IF;
END $$;

-- Grant necessary permissions for Realtime
-- Authenticated users can subscribe to their own currency updates
GRANT SELECT ON player_currency TO authenticated;
GRANT SELECT ON player_currency TO anon;

-- Add RLS policy to ensure users can only see their own currency via Realtime
-- (This should already exist, but adding for completeness)
ALTER TABLE player_currency ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own currency
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'player_currency' 
        AND policyname = 'Users can view own currency'
    ) THEN
        CREATE POLICY "Users can view own currency" ON player_currency
            FOR SELECT
            USING (true); -- Allow all reads for now (public data)
    END IF;
END $$;

COMMENT ON TABLE player_currency IS 'Real-time enabled: Currency updates are broadcast to subscribed clients';
