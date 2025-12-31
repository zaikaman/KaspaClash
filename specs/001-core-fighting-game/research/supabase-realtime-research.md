# Supabase Realtime Research for Multiplayer Game

## Executive Summary

Supabase Realtime provides three core features ideal for multiplayer fighting games:
1. **Broadcast** - Low-latency ephemeral messages between clients (game actions, state updates)
2. **Presence** - Track and synchronize player state (online status, matchmaking queue)
3. **Postgres Changes** - Listen to database changes (persistent game records, leaderboards)

For KaspaClash, a combination of **Broadcast for game state** and **Presence for matchmaking** is recommended.

---

## 1. Channel Architecture for Game Rooms

### Recommended Channel Structure

```
Channels:
├── matchmaking:queue          # Global matchmaking presence channel
├── game:${gameId}             # Per-game room for battle state
└── player:${playerId}         # Optional: player-specific notifications
```

### Game Room Channel Pattern

```typescript
// Create a private game room channel
const gameChannel = supabase.channel(`game:${gameId}`, {
  config: { 
    private: true,  // Requires RLS authorization
    broadcast: { 
      self: true,   // Receive own messages for state confirmation
      ack: true     // Get acknowledgment from server
    }
  }
})

// Subscribe to game events
gameChannel
  .on('broadcast', { event: 'game_action' }, (payload) => {
    handleGameAction(payload)
  })
  .on('broadcast', { event: 'game_state' }, (payload) => {
    syncGameState(payload)
  })
  .on('presence', { event: 'sync' }, () => {
    const state = gameChannel.presenceState()
    updatePlayerStatus(state)
  })
  .subscribe()
```

### Channel Naming Conventions

| Channel Pattern | Purpose | Features Used |
|----------------|---------|---------------|
| `matchmaking:queue` | Global matchmaking pool | Presence |
| `game:${gameId}` | Active game session | Broadcast + Presence |
| `lobby:${lobbyId}` | Pre-game lobby | Presence + Broadcast |

---

## 2. Presence for Matchmaking Queue

### How Presence Works

- Each client publishes a small "presence payload" to a shared channel
- Supabase stores each client's payload under a unique presence key
- Three events are triggered:
  - `sync` - Full presence state updated
  - `join` - New client started tracking
  - `leave` - Client stopped tracking (including disconnects)

### Matchmaking Queue Implementation

```typescript
interface QueuePresence {
  oderId: string
  rating: number
  status: 'searching' | 'ready' | 'matched'
  joinedAt: number
  characterId?: string
}

// Join matchmaking queue
const matchmakingChannel = supabase.channel('matchmaking:queue', {
  config: {
    presence: {
      key: oderId  // Custom key for this player
    }
  }
})

matchmakingChannel
  .on('presence', { event: 'sync' }, () => {
    const players = matchmakingChannel.presenceState()
    findMatch(players)
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('Player joined queue:', key, newPresences)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('Player left queue:', key)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await matchmakingChannel.track({
        oderId,
        rating: playerRating,
        status: 'searching',
        joinedAt: Date.now()
      })
    }
  })
```

### Presence Advantages for Matchmaking

1. **Automatic disconnect handling** - Players automatically removed when disconnected
2. **Immediate state sync** - New joiners get current queue state instantly
3. **Conflict-free** - Uses CRDT for eventually consistent state
4. **No database overhead** - Purely in-memory, low latency

### Finding a Match Algorithm

```typescript
const findMatch = (players: Record<string, QueuePresence[]>) => {
  const searching = Object.entries(players)
    .filter(([_, p]) => p[0]?.status === 'searching')
    .sort((a, b) => a[1][0].joinedAt - b[1][0].joinedAt)
  
  // Simple FIFO matching (can add ELO-based matching)
  if (searching.length >= 2) {
    const [player1Key, player1Data] = searching[0]
    const [player2Key, player2Data] = searching[1]
    
    // Create game room and notify players
    createGameRoom(player1Key, player2Key)
  }
}
```

---

## 3. Broadcast vs Database Changes for Game State

### Comparison Table

| Feature | Broadcast | Postgres Changes |
|---------|-----------|------------------|
| **Latency** | 6ms median | Higher (DB roundtrip) |
| **Persistence** | Ephemeral | Persistent |
| **Throughput** | 224k msgs/sec | Limited by DB |
| **RLS Overhead** | Per-join auth | Per-message auth |
| **Use Case** | Real-time game actions | Game records, leaderboards |

### Decision Rationale for KaspaClash

**Use Broadcast for:**
- Player inputs (attacks, blocks, movements)
- Game state synchronization (health, position)
- Timer/countdown sync
- Real-time combat actions

**Use Postgres Changes for:**
- Match results persistence
- Leaderboard updates
- Transaction confirmations
- Player statistics

### Broadcast Message Pattern for Game Actions

```typescript
// Send game action
gameChannel.send({
  type: 'broadcast',
  event: 'game_action',
  payload: {
    playerId: currentPlayer.id,
    action: 'attack',
    data: {
      attackType: 'special',
      frame: currentFrame,
      timestamp: Date.now()
    }
  }
})

// Game state sync (sent by authoritative source)
gameChannel.send({
  type: 'broadcast',
  event: 'game_state',
  payload: {
    frame: currentFrame,
    players: {
      [player1Id]: { health: 80, position: { x: 100, y: 0 } },
      [player2Id]: { health: 65, position: { x: 400, y: 0 } }
    },
    timestamp: Date.now()
  }
})
```

---

## 4. Latency Considerations

### Benchmark Results (Official Supabase)

| Metric | Value |
|--------|-------|
| Concurrent Users | 32,000 |
| Message Throughput | 224,000 msgs/sec |
| **Median Latency** | **6 ms** |
| P95 Latency | 28 ms |
| P99 Latency | 213 ms |

### Latency Optimization Strategies

1. **Use Broadcast over Postgres Changes** for real-time game state
2. **Client-side prediction** - Don't wait for server confirmation for local actions
3. **Delta compression** - Only send changed state, not full state
4. **Message batching** - Batch multiple inputs per frame if needed
5. **Acknowledge critical messages** - Use `ack: true` only when confirmation needed

### Fighting Game Latency Approach

```typescript
// Optimistic local execution + server reconciliation
const handlePlayerInput = (input: PlayerInput) => {
  // 1. Apply locally immediately (client prediction)
  applyInputLocally(input)
  
  // 2. Send to server
  gameChannel.send({
    type: 'broadcast',
    event: 'player_input',
    payload: { input, frame: currentFrame }
  })
}

// Server reconciliation on state sync
const handleGameStateSync = (serverState: GameState) => {
  if (serverState.frame > lastConfirmedFrame) {
    reconcileState(serverState)
    lastConfirmedFrame = serverState.frame
  }
}
```

---

## 5. Row-Level Security Patterns

### RLS for Realtime Authorization

```sql
-- Enable RLS on realtime.messages
-- This is used for private channel authorization

-- Allow authenticated users to join their own game rooms
CREATE POLICY "players can join their games"
ON "realtime"."messages"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_id = (SELECT realtime.topic())::uuid
    AND player_id = auth.uid()
  )
  AND realtime.messages.extension IN ('broadcast', 'presence')
);

-- Allow players to send messages to their game rooms
CREATE POLICY "players can broadcast in their games"
ON "realtime"."messages"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_id = (SELECT realtime.topic())::uuid
    AND player_id = auth.uid()
  )
  AND realtime.messages.extension IN ('broadcast', 'presence')
);
```

### Player Data RLS Patterns

```sql
-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  rating INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Players can read all player profiles
CREATE POLICY "public player profiles"
ON players FOR SELECT
TO authenticated
USING (true);

-- Players can only update their own profile
CREATE POLICY "players update own profile"
ON players FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

### Game Records RLS

```sql
-- Game records table
CREATE TABLE game_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES players(id),
  player2_id UUID REFERENCES players(id),
  winner_id UUID REFERENCES players(id),
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  bet_amount BIGINT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE game_records ENABLE ROW LEVEL SECURITY;

-- Players can only see games they participated in
CREATE POLICY "players see own games"
ON game_records FOR SELECT
TO authenticated
USING (player1_id = auth.uid() OR player2_id = auth.uid());

-- Only server can insert/update game records (use service role)
CREATE POLICY "server manages games"
ON game_records FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## 6. Matchmaking Queue Database Schema

### Schema Design

```sql
-- Active matchmaking queue (for persistence/recovery)
CREATE TABLE matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) UNIQUE,
  rating INTEGER NOT NULL,
  bet_tier TEXT CHECK (bet_tier IN ('free', 'low', 'medium', 'high')),
  bet_amount BIGINT DEFAULT 0,
  status TEXT CHECK (status IN ('searching', 'matched', 'cancelled')) DEFAULT 'searching',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  matched_at TIMESTAMPTZ,
  matched_with UUID REFERENCES players(id),
  game_id UUID
);

ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Players can see their own queue status
CREATE POLICY "players see own queue"
ON matchmaking_queue FOR SELECT
TO authenticated
USING (player_id = auth.uid());

-- Index for fast matching
CREATE INDEX idx_matchmaking_search 
ON matchmaking_queue(status, bet_tier, rating, joined_at)
WHERE status = 'searching';
```

### Hybrid Approach: Presence + Database

```typescript
// Join queue: Both Presence (real-time) and Database (persistence)
const joinMatchmakingQueue = async (playerId: string, betTier: string, rating: number) => {
  // 1. Insert into database for persistence
  const { data, error } = await supabase
    .from('matchmaking_queue')
    .insert({
      player_id: playerId,
      bet_tier: betTier,
      rating: rating,
      status: 'searching'
    })
    .select()
    .single()
  
  if (error) throw error
  
  // 2. Track in Presence for real-time matching
  await matchmakingChannel.track({
    oderId: playerId,
    rating,
    betTier,
    status: 'searching',
    queueId: data.id,
    joinedAt: Date.now()
  })
  
  return data
}

// Leave queue: Clean up both
const leaveMatchmakingQueue = async (playerId: string) => {
  // 1. Remove from Presence
  await matchmakingChannel.untrack()
  
  // 2. Update database
  await supabase
    .from('matchmaking_queue')
    .update({ status: 'cancelled' })
    .eq('player_id', playerId)
    .eq('status', 'searching')
}
```

---

## 7. Handling Disconnection and Reconnection

### Automatic Disconnect Handling with Presence

Presence automatically handles disconnections:
- When a WebSocket connection drops, the player's presence is removed
- `leave` event is triggered for other clients
- No manual cleanup required

### Reconnection Strategy

```typescript
// Supabase client handles reconnection automatically
// But we need to re-sync game state

let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

const setupGameChannel = (gameId: string) => {
  const channel = supabase.channel(`game:${gameId}`, {
    config: { private: true }
  })

  channel.subscribe(async (status, err) => {
    if (status === 'SUBSCRIBED') {
      reconnectAttempts = 0
      // Re-sync game state after reconnection
      requestGameStateSync()
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Channel error:', err)
      handleDisconnection()
    } else if (status === 'TIMED_OUT') {
      reconnectAttempts++
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        // supabase-js handles reconnection automatically
        console.log(`Reconnecting... attempt ${reconnectAttempts}`)
      } else {
        handlePermanentDisconnection()
      }
    }
  })

  return channel
}

// Request state sync after reconnection
const requestGameStateSync = () => {
  gameChannel.send({
    type: 'broadcast',
    event: 'sync_request',
    payload: { 
      playerId: currentPlayer.id,
      lastKnownFrame: lastConfirmedFrame
    }
  })
}
```

### Game State Recovery

```typescript
// Handle sync request from reconnected player
gameChannel.on('broadcast', { event: 'sync_request' }, (payload) => {
  // Only host/authoritative client responds
  if (isAuthoritative) {
    gameChannel.send({
      type: 'broadcast',
      event: 'game_state',
      payload: getCurrentGameState()
    })
  }
})

// Detect opponent disconnection via Presence
gameChannel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
  const disconnectedPlayer = leftPresences[0]
  
  // Start grace period for reconnection
  startReconnectionTimer(disconnectedPlayer.playerId, {
    timeout: 30000, // 30 seconds to reconnect
    onTimeout: () => handlePlayerForfeit(disconnectedPlayer.playerId)
  })
})

gameChannel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
  // Cancel forfeit timer if player reconnects
  cancelReconnectionTimer(newPresences[0].playerId)
})
```

---

## 8. Complete Game Flow Architecture

### Flow Diagram

```
1. MATCHMAKING
   └── Player joins matchmaking:queue channel
   └── Tracks presence with rating/bet tier
   └── Server/client monitors for matches
   └── On match: Create game record in DB

2. GAME INITIALIZATION
   └── Create game:${gameId} private channel
   └── Both players join and track presence
   └── Verify both players connected
   └── Initialize game state

3. GAMEPLAY
   └── Broadcast player inputs
   └── Local prediction + server reconciliation
   └── Periodic state sync broadcasts
   └── Health/position updates via broadcast

4. GAME END
   └── Detect win condition
   └── Record result in database
   └── Trigger Kaspa transaction (if betting)
   └── Update player ratings
   └── Clean up channels
```

### Code Structure Recommendation

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts           # Supabase client setup
│       ├── realtime/
│       │   ├── channels.ts     # Channel factory functions
│       │   ├── matchmaking.ts  # Matchmaking logic
│       │   └── game-room.ts    # Game room management
│       └── database/
│           ├── players.ts      # Player CRUD
│           ├── games.ts        # Game records
│           └── matchmaking.ts  # Queue persistence
├── hooks/
│   ├── useMatchmaking.ts       # Matchmaking hook
│   ├── useGameRoom.ts          # Game room hook
│   └── usePresence.ts          # Generic presence hook
└── types/
    └── realtime.ts             # TypeScript types for payloads
```

---

## 9. Quotas and Limits (Pro Plan)

| Quota | Pro Plan Limit |
|-------|----------------|
| Concurrent connections | 500 |
| Messages per second | 500 |
| Channel joins per second | 500 |
| Channels per connection | 100 |
| Presence keys per object | 10 |
| Presence messages per second | 50 |
| Broadcast payload size | 3,000 KB |

**Recommendation:** For a fighting game with 2 players per match, these limits are more than sufficient. At 60 FPS game updates, you'd send ~60-120 messages/second per game, well within limits.

---

## 10. Security Best Practices

1. **Always use private channels** for game rooms (`private: true`)
2. **Validate all inputs server-side** - Never trust client game state
3. **Use RLS for database operations** - Protect game records and player data
4. **Implement rate limiting** - Prevent spam/abuse of broadcast messages
5. **Verify player identity** - Use Supabase Auth JWT for authorization
6. **Audit transactions** - Log all bet-related operations
7. **Implement anti-cheat** - Server-side game logic validation

---

## References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Broadcast Documentation](https://supabase.com/docs/guides/realtime/broadcast)
- [Presence Documentation](https://supabase.com/docs/guides/realtime/presence)
- [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Realtime Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)
- [Multiplayer Announcement Blog](https://supabase.com/blog/supabase-realtime-multiplayer-general-availability)
