-- Migration: Create cosmetic_nfts table for tracking NFT mints
-- Description: Tracks Kaspa NFTs minted for cosmetic items
-- Each purchase now mints an NFT to the player's wallet

-- Create cosmetic_nfts table
CREATE TABLE IF NOT EXISTS cosmetic_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT NOT NULL REFERENCES players(address) ON DELETE CASCADE,
    cosmetic_id UUID NOT NULL REFERENCES cosmetic_items(id) ON DELETE CASCADE,
    mint_tx_id TEXT NOT NULL UNIQUE, -- Kaspa transaction ID
    network TEXT NOT NULL CHECK (network IN ('mainnet', 'testnet')),
    metadata JSONB NOT NULL, -- Full NFT metadata from mint
    minted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_cosmetic_nfts_player_id ON cosmetic_nfts(player_id);
CREATE INDEX IF NOT EXISTS idx_cosmetic_nfts_cosmetic_id ON cosmetic_nfts(cosmetic_id);
CREATE INDEX IF NOT EXISTS idx_cosmetic_nfts_mint_tx_id ON cosmetic_nfts(mint_tx_id);
CREATE INDEX IF NOT EXISTS idx_cosmetic_nfts_network ON cosmetic_nfts(network);
CREATE INDEX IF NOT EXISTS idx_cosmetic_nfts_minted_at ON cosmetic_nfts(minted_at DESC);

-- Add composite index for player + cosmetic lookups
CREATE INDEX IF NOT EXISTS idx_cosmetic_nfts_player_cosmetic ON cosmetic_nfts(player_id, cosmetic_id);

-- Enable Row Level Security
ALTER TABLE cosmetic_nfts ENABLE ROW LEVEL SECURITY;

-- Policy: Players can view their own NFTs
CREATE POLICY "Players can view own NFTs"
    ON cosmetic_nfts
    FOR SELECT
    USING (player_id = current_setting('request.jwt.claim.sub', true)::text);

-- Policy: Public read access (for NFT verification)
CREATE POLICY "Public read access to NFTs"
    ON cosmetic_nfts
    FOR SELECT
    USING (true);

-- Policy: Only service role can insert NFT records
CREATE POLICY "Service role can insert NFTs"
    ON cosmetic_nfts
    FOR INSERT
    WITH CHECK (
        current_setting('request.jwt.claim.role', true) = 'service_role'
    );

-- Add comment
COMMENT ON TABLE cosmetic_nfts IS 'Tracks NFTs minted for cosmetic items on Kaspa blockchain';
COMMENT ON COLUMN cosmetic_nfts.mint_tx_id IS 'Kaspa transaction ID of the NFT mint';
COMMENT ON COLUMN cosmetic_nfts.metadata IS 'Full NFT metadata including protocol version and cosmetic details';
COMMENT ON COLUMN cosmetic_nfts.network IS 'Kaspa network where NFT was minted (mainnet or testnet)';
