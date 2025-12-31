-- =============================================================================
-- KaspaClash Initial Database Schema
-- Generated from: specs/001-core-fighting-game/data-model.md
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PLAYERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS players (
    address TEXT PRIMARY KEY,
    display_name TEXT CHECK (display_name IS NULL OR (
        LENGTH(display_name) <= 32 AND
        display_name ~ '^[a-zA-Z0-9_]+$'
    )),
    wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
    losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
    rating INTEGER NOT NULL DEFAULT 1000 CHECK (rating >= 100 AND rating <= 3000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for players
CREATE INDEX IF NOT EXISTS idx_players_rating ON players(rating);
CREATE INDEX IF NOT EXISTS idx_players_wins ON players(wins DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CHARACTERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    theme TEXT NOT NULL,
    portrait_url TEXT NOT NULL,
    sprite_config JSONB NOT NULL
);

-- Insert initial character roster
INSERT INTO characters (id, name, theme, portrait_url, sprite_config) VALUES
    ('cyber-ninja', 'Cyber Ninja', 'Neon lights, fast strikes, cyberpunk aesthetic', '/characters/cyber-ninja/portrait.png', '{
        "idle": {"sheet": "/characters/cyber-ninja/idle.png", "frames": 8, "frameRate": 10},
        "punch": {"sheet": "/characters/cyber-ninja/punch.png", "frames": 6, "frameRate": 12, "hitFrame": 4},
        "kick": {"sheet": "/characters/cyber-ninja/kick.png", "frames": 8, "frameRate": 10, "hitFrame": 5},
        "block": {"sheet": "/characters/cyber-ninja/block.png", "frames": 4, "frameRate": 8},
        "special": {"sheet": "/characters/cyber-ninja/special.png", "frames": 12, "frameRate": 12, "hitFrame": 8},
        "hurt": {"sheet": "/characters/cyber-ninja/hurt.png", "frames": 4, "frameRate": 10},
        "victory": {"sheet": "/characters/cyber-ninja/victory.png", "frames": 10, "frameRate": 8},
        "defeat": {"sheet": "/characters/cyber-ninja/defeat.png", "frames": 8, "frameRate": 8}
    }'::jsonb),
    ('dag-warrior', 'DAG Warrior', 'Armored, blockchain motifs, strong defense', '/characters/dag-warrior/portrait.png', '{
        "idle": {"sheet": "/characters/dag-warrior/idle.png", "frames": 8, "frameRate": 10},
        "punch": {"sheet": "/characters/dag-warrior/punch.png", "frames": 6, "frameRate": 12, "hitFrame": 4},
        "kick": {"sheet": "/characters/dag-warrior/kick.png", "frames": 8, "frameRate": 10, "hitFrame": 5},
        "block": {"sheet": "/characters/dag-warrior/block.png", "frames": 4, "frameRate": 8},
        "special": {"sheet": "/characters/dag-warrior/special.png", "frames": 12, "frameRate": 12, "hitFrame": 8},
        "hurt": {"sheet": "/characters/dag-warrior/hurt.png", "frames": 4, "frameRate": 10},
        "victory": {"sheet": "/characters/dag-warrior/victory.png", "frames": 10, "frameRate": 8},
        "defeat": {"sheet": "/characters/dag-warrior/defeat.png", "frames": 8, "frameRate": 8}
    }'::jsonb),
    ('block-brawler', 'Block Brawler', 'Heavy, defensive style, mining theme', '/characters/block-brawler/portrait.png', '{
        "idle": {"sheet": "/characters/block-brawler/idle.png", "frames": 8, "frameRate": 10},
        "punch": {"sheet": "/characters/block-brawler/punch.png", "frames": 6, "frameRate": 12, "hitFrame": 4},
        "kick": {"sheet": "/characters/block-brawler/kick.png", "frames": 8, "frameRate": 10, "hitFrame": 5},
        "block": {"sheet": "/characters/block-brawler/block.png", "frames": 4, "frameRate": 8},
        "special": {"sheet": "/characters/block-brawler/special.png", "frames": 12, "frameRate": 12, "hitFrame": 8},
        "hurt": {"sheet": "/characters/block-brawler/hurt.png", "frames": 4, "frameRate": 10},
        "victory": {"sheet": "/characters/block-brawler/victory.png", "frames": 10, "frameRate": 8},
        "defeat": {"sheet": "/characters/block-brawler/defeat.png", "frames": 8, "frameRate": 8}
    }'::jsonb),
    ('hash-hunter', 'Hash Hunter', 'Agile, crypto-themed, balanced fighter', '/characters/hash-hunter/portrait.png', '{
        "idle": {"sheet": "/characters/hash-hunter/idle.png", "frames": 8, "frameRate": 10},
        "punch": {"sheet": "/characters/hash-hunter/punch.png", "frames": 6, "frameRate": 12, "hitFrame": 4},
        "kick": {"sheet": "/characters/hash-hunter/kick.png", "frames": 8, "frameRate": 10, "hitFrame": 5},
        "block": {"sheet": "/characters/hash-hunter/block.png", "frames": 4, "frameRate": 8},
        "special": {"sheet": "/characters/hash-hunter/special.png", "frames": 12, "frameRate": 12, "hitFrame": 8},
        "hurt": {"sheet": "/characters/hash-hunter/hurt.png", "frames": 4, "frameRate": 10},
        "victory": {"sheet": "/characters/hash-hunter/victory.png", "frames": 10, "frameRate": 8},
        "defeat": {"sheet": "/characters/hash-hunter/defeat.png", "frames": 8, "frameRate": 8}
    }'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- MATCHES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code TEXT UNIQUE CHECK (room_code IS NULL OR room_code ~ '^[A-Z0-9]{6}$'),
    player1_address TEXT NOT NULL REFERENCES players(address),
    player2_address TEXT REFERENCES players(address),
    player1_character_id TEXT REFERENCES characters(id),
    player2_character_id TEXT REFERENCES characters(id),
    format TEXT NOT NULL DEFAULT 'best_of_3' CHECK (format IN ('best_of_3', 'best_of_5')),
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'character_select', 'in_progress', 'completed')),
    winner_address TEXT REFERENCES players(address),
    player1_rounds_won INTEGER NOT NULL DEFAULT 0,
    player2_rounds_won INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    -- Constraint: players must be different
    CONSTRAINT different_players CHECK (player1_address != player2_address),
    -- Constraint: winner must be one of the players
    CONSTRAINT valid_winner CHECK (
        winner_address IS NULL OR
        winner_address = player1_address OR
        winner_address = player2_address
    )
);

-- Indexes for matches
CREATE INDEX IF NOT EXISTS idx_matches_room_code ON matches(room_code) WHERE room_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1_address);
CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches(player2_address);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);

-- =============================================================================
-- ROUNDS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL CHECK (round_number > 0),
    player1_move TEXT CHECK (player1_move IS NULL OR player1_move IN ('punch', 'kick', 'block', 'special')),
    player2_move TEXT CHECK (player2_move IS NULL OR player2_move IN ('punch', 'kick', 'block', 'special')),
    player1_damage_dealt INTEGER CHECK (player1_damage_dealt IS NULL OR player1_damage_dealt >= 0),
    player2_damage_dealt INTEGER CHECK (player2_damage_dealt IS NULL OR player2_damage_dealt >= 0),
    player1_health_after INTEGER CHECK (player1_health_after IS NULL OR (player1_health_after >= 0 AND player1_health_after <= 100)),
    player2_health_after INTEGER CHECK (player2_health_after IS NULL OR (player2_health_after >= 0 AND player2_health_after <= 100)),
    winner_address TEXT REFERENCES players(address),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Unique constraint: one round per round_number per match
    UNIQUE(match_id, round_number)
);

-- Indexes for rounds
CREATE INDEX IF NOT EXISTS idx_rounds_match_id ON rounds(match_id);

-- =============================================================================
-- MOVES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS moves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    player_address TEXT NOT NULL REFERENCES players(address),
    move_type TEXT NOT NULL CHECK (move_type IN ('punch', 'kick', 'block', 'special')),
    tx_id TEXT,
    tx_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for moves
CREATE INDEX IF NOT EXISTS idx_moves_round_id ON moves(round_id);
CREATE INDEX IF NOT EXISTS idx_moves_tx_id ON moves(tx_id) WHERE tx_id IS NOT NULL;
