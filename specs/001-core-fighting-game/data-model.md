# Data Model: KaspaClash Core Fighting Game

**Date**: 2025-12-31  
**Status**: Complete  
**Source**: [spec.md](./spec.md) Key Entities section

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     Player      │       │    Character    │
├─────────────────┤       ├─────────────────┤
│ address (PK)    │       │ id (PK)         │
│ display_name    │       │ name            │
│ wins            │       │ theme           │
│ losses          │       │ portrait_url    │
│ rating          │       │ sprite_config   │
│ created_at      │       └─────────────────┘
└────────┬────────┘               │
         │                        │
         │ 1:N                    │ N:1
         ▼                        ▼
┌─────────────────────────────────────────────┐
│                    Match                     │
├─────────────────────────────────────────────┤
│ id (PK)                                     │
│ room_code (UNIQUE)                          │
│ player1_address (FK → Player)               │
│ player2_address (FK → Player)               │
│ player1_character_id (FK → Character)       │
│ player2_character_id (FK → Character)       │
│ format (best_of_3 | best_of_5)              │
│ status (waiting | character_select |        │
│         in_progress | completed)            │
│ winner_address (FK → Player, nullable)      │
│ player1_rounds_won                          │
│ player2_rounds_won                          │
│ created_at                                  │
│ started_at                                  │
│ completed_at                                │
└────────┬────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────┐
│                    Round                     │
├─────────────────────────────────────────────┤
│ id (PK)                                     │
│ match_id (FK → Match)                       │
│ round_number                                │
│ player1_move                                │
│ player2_move                                │
│ player1_damage_dealt                        │
│ player2_damage_dealt                        │
│ player1_health_after                        │
│ player2_health_after                        │
│ winner_address (FK → Player, nullable)      │
│ created_at                                  │
└────────┬────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────┐
│                    Move                      │
├─────────────────────────────────────────────┤
│ id (PK)                                     │
│ round_id (FK → Round)                       │
│ player_address (FK → Player)                │
│ move_type (punch | kick | block | special)  │
│ tx_id (Kaspa transaction ID)                │
│ tx_confirmed_at                             │
│ created_at                                  │
└─────────────────────────────────────────────┘
```

---

## Entity Definitions

### Player

Represents a connected user identified by their Kaspa wallet address.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `address` | TEXT | PRIMARY KEY | Kaspa wallet address (e.g., `kaspa:qz...`) |
| `display_name` | TEXT | NULLABLE | Optional display name, defaults to truncated address |
| `wins` | INTEGER | DEFAULT 0 | Total match wins |
| `losses` | INTEGER | DEFAULT 0 | Total match losses |
| `rating` | INTEGER | DEFAULT 1000 | ELO-style rating for matchmaking |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last profile update |

**Validation Rules**:
- `address` must be a valid Kaspa address format (starts with `kaspa:`)
- `display_name` max 32 characters, alphanumeric + underscores only
- `wins` and `losses` must be >= 0
- `rating` must be between 100 and 3000

**Indexes**:
- `idx_players_rating` on `rating` for matchmaking queries
- `idx_players_wins` on `wins` for leaderboard

---

### Character

A selectable fighter with distinct visual theme and animations.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique identifier (e.g., `cyber-ninja`) |
| `name` | TEXT | NOT NULL | Display name (e.g., "Cyber Ninja") |
| `theme` | TEXT | NOT NULL | Visual theme description |
| `portrait_url` | TEXT | NOT NULL | Path to character portrait image |
| `sprite_config` | JSONB | NOT NULL | Animation configuration |

**sprite_config Schema**:
```typescript
interface SpriteConfig {
  idle: { sheet: string; frames: number; frameRate: number };
  punch: { sheet: string; frames: number; frameRate: number; hitFrame: number };
  kick: { sheet: string; frames: number; frameRate: number; hitFrame: number };
  block: { sheet: string; frames: number; frameRate: number };
  special: { sheet: string; frames: number; frameRate: number; hitFrame: number };
  hurt: { sheet: string; frames: number; frameRate: number };
  victory: { sheet: string; frames: number; frameRate: number };
  defeat: { sheet: string; frames: number; frameRate: number };
}
```

**Initial Character Roster**:
| ID | Name | Theme |
|----|------|-------|
| `cyber-ninja` | Cyber Ninja | Neon lights, fast strikes |
| `dag-warrior` | DAG Warrior | Armored, blockchain motifs |
| `block-brawler` | Block Brawler | Heavy, defensive style |

---

### Match

A game session between two players.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Match identifier |
| `room_code` | TEXT | UNIQUE, NULLABLE | 6-character room code for private matches |
| `player1_address` | TEXT | FK → Player, NOT NULL | Host player address |
| `player2_address` | TEXT | FK → Player, NULLABLE | Joined player address |
| `player1_character_id` | TEXT | FK → Character, NULLABLE | P1's selected character |
| `player2_character_id` | TEXT | FK → Character, NULLABLE | P2's selected character |
| `format` | TEXT | CHECK (best_of_3, best_of_5) | Match format |
| `status` | TEXT | CHECK (waiting, character_select, in_progress, completed) | Current state |
| `winner_address` | TEXT | FK → Player, NULLABLE | Winner (set on completion) |
| `player1_rounds_won` | INTEGER | DEFAULT 0 | P1 round wins |
| `player2_rounds_won` | INTEGER | DEFAULT 0 | P2 round wins |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Match creation time |
| `started_at` | TIMESTAMPTZ | NULLABLE | When gameplay began |
| `completed_at` | TIMESTAMPTZ | NULLABLE | When match ended |

**State Transitions**:
```
waiting → character_select (player2 joins)
character_select → in_progress (both select characters)
in_progress → completed (winner determined or forfeit)
```

**Validation Rules**:
- `room_code` format: 6 uppercase alphanumeric characters
- `player1_address` != `player2_address`
- `winner_address` must be either `player1_address` or `player2_address`
- `player1_rounds_won` + `player2_rounds_won` <= max rounds (3 or 5)

**Indexes**:
- `idx_matches_room_code` on `room_code` for join lookups
- `idx_matches_status` on `status` for matchmaking
- `idx_matches_player1` on `player1_address`
- `idx_matches_player2` on `player2_address`
- `idx_matches_created_at` on `created_at DESC` for history

---

### Round

A single round within a match.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Round identifier |
| `match_id` | UUID | FK → Match, NOT NULL | Parent match |
| `round_number` | INTEGER | NOT NULL | 1, 2, 3, etc. |
| `player1_move` | TEXT | CHECK (punch, kick, block, special), NULLABLE | P1's selected move |
| `player2_move` | TEXT | CHECK (punch, kick, block, special), NULLABLE | P2's selected move |
| `player1_damage_dealt` | INTEGER | NULLABLE | Damage P1 dealt to P2 |
| `player2_damage_dealt` | INTEGER | NULLABLE | Damage P2 dealt to P1 |
| `player1_health_after` | INTEGER | NULLABLE | P1's health after resolution |
| `player2_health_after` | INTEGER | NULLABLE | P2's health after resolution |
| `winner_address` | TEXT | FK → Player, NULLABLE | Round winner (null if tie/ongoing) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Round start time |
| `resolved_at` | TIMESTAMPTZ | NULLABLE | When moves resolved |

**Validation Rules**:
- `round_number` must be sequential per match (1, 2, 3...)
- Health values between 0 and 100
- Damage values between 0 and 50

**Indexes**:
- `idx_rounds_match_id` on `match_id`
- `idx_rounds_match_number` on `(match_id, round_number)` UNIQUE

---

### Move

A player action within a round, linked to blockchain transaction.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Move identifier |
| `round_id` | UUID | FK → Round, NOT NULL | Parent round |
| `player_address` | TEXT | FK → Player, NOT NULL | Player who made the move |
| `move_type` | TEXT | CHECK (punch, kick, block, special), NOT NULL | Selected move |
| `tx_id` | TEXT | NULLABLE | Kaspa transaction ID (null for practice mode) |
| `tx_confirmed_at` | TIMESTAMPTZ | NULLABLE | When transaction confirmed |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Move submission time |
| `is_relayed` | BOOLEAN | DEFAULT FALSE | True if submitted via relayer |

**Validation Rules**:
- One move per player per round: UNIQUE(`round_id`, `player_address`)
- `tx_id` format: 64-character hex string

**Indexes**:
- `idx_moves_round_id` on `round_id`
- `idx_moves_tx_id` on `tx_id` for explorer lookups

---

## Game Constants

### Move Properties

```typescript
const MOVE_PROPERTIES = {
  punch: {
    damage: 10,
    beats: "kick",
    losesTo: "block",
    chargeRequired: 0,
  },
  kick: {
    damage: 15,
    beats: "block",
    losesTo: "punch",
    chargeRequired: 0,
  },
  block: {
    damage: 0,
    beats: "punch",
    losesTo: "kick",
    chargeRequired: 0,
    damageReduction: 1.0, // Negates incoming damage
  },
  special: {
    damage: 25,
    beats: null, // Always deals damage
    losesTo: null,
    chargeRequired: 3, // Requires 3 rounds to charge
  },
} as const;

const GAME_CONSTANTS = {
  STARTING_HEALTH: 100,
  ROUNDS_TO_WIN_BO3: 2,
  ROUNDS_TO_WIN_BO5: 3,
  MOVE_TIMEOUT_SECONDS: 30,
  RECONNECT_GRACE_SECONDS: 30,
} as const;
```

---

## Database Migrations

### Migration 001: Initial Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players
CREATE TABLE players (
  address TEXT PRIMARY KEY,
  display_name TEXT,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  rating INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_address CHECK (address ~ '^kaspa:[a-z0-9]+$'),
  CONSTRAINT valid_display_name CHECK (display_name IS NULL OR display_name ~ '^[a-zA-Z0-9_]{1,32}$'),
  CONSTRAINT non_negative_stats CHECK (wins >= 0 AND losses >= 0),
  CONSTRAINT valid_rating CHECK (rating >= 100 AND rating <= 3000)
);

-- Characters
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  theme TEXT NOT NULL,
  portrait_url TEXT NOT NULL,
  sprite_config JSONB NOT NULL
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE,
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
  
  CONSTRAINT different_players CHECK (player1_address != player2_address),
  CONSTRAINT valid_room_code CHECK (room_code IS NULL OR room_code ~ '^[A-Z0-9]{6}$'),
  CONSTRAINT valid_winner CHECK (
    winner_address IS NULL OR 
    winner_address = player1_address OR 
    winner_address = player2_address
  )
);

-- Rounds
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  player1_move TEXT CHECK (player1_move IN ('punch', 'kick', 'block', 'special')),
  player2_move TEXT CHECK (player2_move IN ('punch', 'kick', 'block', 'special')),
  player1_damage_dealt INTEGER,
  player2_damage_dealt INTEGER,
  player1_health_after INTEGER CHECK (player1_health_after >= 0 AND player1_health_after <= 100),
  player2_health_after INTEGER CHECK (player2_health_after >= 0 AND player2_health_after <= 100),
  winner_address TEXT REFERENCES players(address),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  UNIQUE (match_id, round_number)
);

-- Moves
CREATE TABLE moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_address TEXT NOT NULL REFERENCES players(address),
  move_type TEXT NOT NULL CHECK (move_type IN ('punch', 'kick', 'block', 'special')),
  tx_id TEXT,
  tx_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_relayed BOOLEAN NOT NULL DEFAULT FALSE,
  
  UNIQUE (round_id, player_address),
  CONSTRAINT valid_tx_id CHECK (tx_id IS NULL OR tx_id ~ '^[a-f0-9]{64}$')
);

-- Indexes
CREATE INDEX idx_players_rating ON players(rating);
CREATE INDEX idx_players_wins ON players(wins DESC);
CREATE INDEX idx_matches_room_code ON matches(room_code) WHERE room_code IS NOT NULL;
CREATE INDEX idx_matches_status ON matches(status) WHERE status != 'completed';
CREATE INDEX idx_matches_player1 ON matches(player1_address);
CREATE INDEX idx_matches_player2 ON matches(player2_address);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX idx_rounds_match_id ON rounds(match_id);
CREATE INDEX idx_moves_round_id ON moves(round_id);
CREATE INDEX idx_moves_tx_id ON moves(tx_id) WHERE tx_id IS NOT NULL;

-- Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;

-- Public read for leaderboards, restricted write
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read rounds" ON rounds FOR SELECT USING (true);
CREATE POLICY "Public read moves" ON moves FOR SELECT USING (true);

-- Service role for all writes (API routes handle authorization)
CREATE POLICY "Service write all" ON players FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write matches" ON matches FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write rounds" ON rounds FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write moves" ON moves FOR ALL USING (auth.role() = 'service_role');
```

### Migration 002: Seed Characters

```sql
INSERT INTO characters (id, name, theme, portrait_url, sprite_config) VALUES
('cyber-ninja', 'Cyber Ninja', 'Neon-lit assassin with lightning-fast strikes', '/assets/sprites/cyber-ninja/portrait.png', '{
  "idle": {"sheet": "/assets/sprites/cyber-ninja/idle.png", "frames": 8, "frameRate": 10},
  "punch": {"sheet": "/assets/sprites/cyber-ninja/punch.png", "frames": 6, "frameRate": 15, "hitFrame": 3},
  "kick": {"sheet": "/assets/sprites/cyber-ninja/kick.png", "frames": 8, "frameRate": 12, "hitFrame": 4},
  "block": {"sheet": "/assets/sprites/cyber-ninja/block.png", "frames": 4, "frameRate": 10},
  "special": {"sheet": "/assets/sprites/cyber-ninja/special.png", "frames": 12, "frameRate": 15, "hitFrame": 8},
  "hurt": {"sheet": "/assets/sprites/cyber-ninja/hurt.png", "frames": 4, "frameRate": 12},
  "victory": {"sheet": "/assets/sprites/cyber-ninja/victory.png", "frames": 12, "frameRate": 10},
  "defeat": {"sheet": "/assets/sprites/cyber-ninja/defeat.png", "frames": 8, "frameRate": 8}
}'::jsonb),
('dag-warrior', 'DAG Warrior', 'Armored fighter channeling blockchain power', '/assets/sprites/dag-warrior/portrait.png', '{
  "idle": {"sheet": "/assets/sprites/dag-warrior/idle.png", "frames": 8, "frameRate": 8},
  "punch": {"sheet": "/assets/sprites/dag-warrior/punch.png", "frames": 6, "frameRate": 12, "hitFrame": 4},
  "kick": {"sheet": "/assets/sprites/dag-warrior/kick.png", "frames": 8, "frameRate": 10, "hitFrame": 5},
  "block": {"sheet": "/assets/sprites/dag-warrior/block.png", "frames": 4, "frameRate": 10},
  "special": {"sheet": "/assets/sprites/dag-warrior/special.png", "frames": 14, "frameRate": 12, "hitFrame": 10},
  "hurt": {"sheet": "/assets/sprites/dag-warrior/hurt.png", "frames": 4, "frameRate": 12},
  "victory": {"sheet": "/assets/sprites/dag-warrior/victory.png", "frames": 10, "frameRate": 10},
  "defeat": {"sheet": "/assets/sprites/dag-warrior/defeat.png", "frames": 8, "frameRate": 8}
}'::jsonb),
('block-brawler', 'Block Brawler', 'Heavy-hitting tank with devastating counters', '/assets/sprites/block-brawler/portrait.png', '{
  "idle": {"sheet": "/assets/sprites/block-brawler/idle.png", "frames": 6, "frameRate": 8},
  "punch": {"sheet": "/assets/sprites/block-brawler/punch.png", "frames": 8, "frameRate": 10, "hitFrame": 5},
  "kick": {"sheet": "/assets/sprites/block-brawler/kick.png", "frames": 10, "frameRate": 10, "hitFrame": 6},
  "block": {"sheet": "/assets/sprites/block-brawler/block.png", "frames": 4, "frameRate": 10},
  "special": {"sheet": "/assets/sprites/block-brawler/special.png", "frames": 16, "frameRate": 12, "hitFrame": 12},
  "hurt": {"sheet": "/assets/sprites/block-brawler/hurt.png", "frames": 4, "frameRate": 12},
  "victory": {"sheet": "/assets/sprites/block-brawler/victory.png", "frames": 10, "frameRate": 8},
  "defeat": {"sheet": "/assets/sprites/block-brawler/defeat.png", "frames": 8, "frameRate": 8}
}'::jsonb);
```

---

## TypeScript Type Definitions

```typescript
// types/game.ts

export type MoveType = "punch" | "kick" | "block" | "special";
export type MatchFormat = "best_of_3" | "best_of_5";
export type MatchStatus = "waiting" | "character_select" | "in_progress" | "completed";

export interface Player {
  address: string;
  displayName: string | null;
  wins: number;
  losses: number;
  rating: number;
  createdAt: Date;
}

export interface Character {
  id: string;
  name: string;
  theme: string;
  portraitUrl: string;
  spriteConfig: SpriteConfig;
}

export interface SpriteConfig {
  idle: AnimationConfig;
  punch: HitAnimationConfig;
  kick: HitAnimationConfig;
  block: AnimationConfig;
  special: HitAnimationConfig;
  hurt: AnimationConfig;
  victory: AnimationConfig;
  defeat: AnimationConfig;
}

export interface AnimationConfig {
  sheet: string;
  frames: number;
  frameRate: number;
}

export interface HitAnimationConfig extends AnimationConfig {
  hitFrame: number;
}

export interface Match {
  id: string;
  roomCode: string | null;
  player1Address: string;
  player2Address: string | null;
  player1CharacterId: string | null;
  player2CharacterId: string | null;
  format: MatchFormat;
  status: MatchStatus;
  winnerAddress: string | null;
  player1RoundsWon: number;
  player2RoundsWon: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface Round {
  id: string;
  matchId: string;
  roundNumber: number;
  player1Move: MoveType | null;
  player2Move: MoveType | null;
  player1DamageDealt: number | null;
  player2DamageDealt: number | null;
  player1HealthAfter: number | null;
  player2HealthAfter: number | null;
  winnerAddress: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface Move {
  id: string;
  roundId: string;
  playerAddress: string;
  moveType: MoveType;
  txId: string | null;
  txConfirmedAt: Date | null;
  createdAt: Date;
  isRelayed: boolean;
}

// Leaderboard entry (computed)
export interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string | null;
  wins: number;
  losses: number;
  winRate: number;
  rating: number;
}

// Match summary for sharing
export interface MatchSummary {
  matchId: string;
  player1: {
    address: string;
    displayName: string | null;
    character: Character;
    roundsWon: number;
  };
  player2: {
    address: string;
    displayName: string | null;
    character: Character;
    roundsWon: number;
  };
  winner: "player1" | "player2";
  format: MatchFormat;
  completedAt: Date;
  explorerUrl: string;
}
```
