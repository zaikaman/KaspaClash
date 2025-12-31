# WebSocket Event Contracts

**Date**: 2025-12-31  
**Purpose**: Define real-time event contracts for Supabase Realtime channels

---

## Channel Architecture

| Channel Pattern | Type | Purpose |
|-----------------|------|---------|
| `matchmaking:queue` | Presence | Track players searching for matches |
| `game:${matchId}` | Broadcast + Presence | Real-time game state synchronization |

---

## Matchmaking Queue Channel

**Channel**: `matchmaking:queue`  
**Type**: Supabase Presence

### Events

#### Player Join (Presence Track)

When a player enters the matchmaking queue.

```typescript
// Track payload
{
  address: string;        // Kaspa wallet address
  joinedAt: number;       // Unix timestamp (ms)
  rating: number;         // Player ELO rating
}

// Example
{
  address: "kaspa:qz0s...",
  joinedAt: 1735689600000,
  rating: 1000
}
```

#### Queue Sync (Presence State)

Full queue state after any change.

```typescript
// Presence state format
{
  [presenceKey: string]: {
    address: string;
    joinedAt: number;
    rating: number;
    presenceRef: string;
  }[]
}
```

#### Player Leave (Presence Untrack)

Automatic when player disconnects or leaves queue.

---

## Game Room Channel

**Channel**: `game:${matchId}`  
**Type**: Supabase Broadcast + Presence

### Presence Events

#### Player Join

```typescript
// Track payload
{
  address: string;
  role: "player1" | "player2";
  isReady: boolean;
}
```

#### Player Disconnect

```typescript
// Leave event payload
{
  key: string;  // Player's presence key
  leftAt: number;
}
```

### Broadcast Events

All broadcast events follow this structure:

```typescript
interface BroadcastEvent<T> {
  type: "broadcast";
  event: string;
  payload: T;
}
```

---

### Event: `character_selected`

Sent when a player selects their character.

**Direction**: Server → All clients

```typescript
interface CharacterSelectedPayload {
  player: "player1" | "player2";
  characterId: string;     // Only visible after both select
  locked: boolean;
}

// During selection (opponent's choice hidden)
{
  player: "player2",
  characterId: null,
  locked: true
}

// After both select (revealed)
{
  player: "player2",
  characterId: "dag-warrior",
  locked: true
}
```

---

### Event: `match_starting`

Sent when both players have selected characters and match is beginning.

**Direction**: Server → All clients

```typescript
interface MatchStartingPayload {
  matchId: string;
  player1: {
    address: string;
    characterId: string;
  };
  player2: {
    address: string;
    characterId: string;
  };
  format: "best_of_3" | "best_of_5";
  startsAt: number;  // Unix timestamp when countdown ends
}
```

---

### Event: `round_starting`

Sent at the beginning of each round.

**Direction**: Server → All clients

```typescript
interface RoundStartingPayload {
  roundNumber: number;
  player1Health: number;
  player2Health: number;
  player1RoundsWon: number;
  player2RoundsWon: number;
  moveDeadline: number;  // Unix timestamp
}
```

---

### Event: `move_submitted`

Sent when a player submits their move (without revealing the move).

**Direction**: Server → All clients

```typescript
interface MoveSubmittedPayload {
  player: "player1" | "player2";
  txId: string | null;     // Transaction ID if on-chain
  submittedAt: number;
}
```

---

### Event: `move_confirmed`

Sent when a move's transaction is confirmed on Kaspa.

**Direction**: Server → All clients

```typescript
interface MoveConfirmedPayload {
  player: "player1" | "player2";
  txId: string;
  confirmedAt: number;
  blockHeight: number;
}
```

---

### Event: `round_resolved`

Sent when both moves are confirmed and round is resolved.

**Direction**: Server → All clients

```typescript
interface RoundResolvedPayload {
  roundNumber: number;
  player1: {
    move: "punch" | "kick" | "block" | "special";
    damageDealt: number;
    healthAfter: number;
    txId: string;
  };
  player2: {
    move: "punch" | "kick" | "block" | "special";
    damageDealt: number;
    healthAfter: number;
    txId: string;
  };
  roundWinner: "player1" | "player2" | "draw";
  effects: RoundEffect[];
}

interface RoundEffect {
  type: "hit" | "block" | "critical" | "ko";
  target: "player1" | "player2";
  value?: number;
}

// Example
{
  roundNumber: 1,
  player1: {
    move: "punch",
    damageDealt: 10,
    healthAfter: 85,
    txId: "abc123..."
  },
  player2: {
    move: "kick",
    damageDealt: 15,
    healthAfter: 90,
    txId: "def456..."
  },
  roundWinner: "player2",
  effects: [
    { type: "hit", target: "player1", value: 15 },
    { type: "hit", target: "player2", value: 10 }
  ]
}
```

---

### Event: `match_ended`

Sent when the match concludes.

**Direction**: Server → All clients

```typescript
interface MatchEndedPayload {
  matchId: string;
  winner: "player1" | "player2";
  winnerAddress: string;
  finalScore: {
    player1RoundsWon: number;
    player2RoundsWon: number;
  };
  reason: "knockout" | "rounds_won" | "forfeit" | "timeout";
  stats: MatchStats;
  shareUrl: string;
  explorerUrl: string;
}

interface MatchStats {
  totalRounds: number;
  player1TotalDamage: number;
  player2TotalDamage: number;
  player1MostUsedMove: string;
  player2MostUsedMove: string;
  matchDurationSeconds: number;
}
```

---

### Event: `opponent_disconnected`

Sent when opponent loses connection.

**Direction**: Server → Remaining player

```typescript
interface OpponentDisconnectedPayload {
  disconnectedAt: number;
  forfeitDeadline: number;  // When forfeit will be triggered
  canClaimForfeit: boolean;
}
```

---

### Event: `opponent_reconnected`

Sent when opponent reconnects within grace period.

**Direction**: Server → All clients

```typescript
interface OpponentReconnectedPayload {
  reconnectedAt: number;
  player: "player1" | "player2";
}
```

---

### Event: `state_sync`

Full state resync for reconnecting player.

**Direction**: Server → Reconnecting client

```typescript
interface StateSyncPayload {
  match: {
    id: string;
    status: "character_select" | "in_progress";
    format: "best_of_3" | "best_of_5";
    currentRound: number;
  };
  player1: {
    address: string;
    characterId: string;
    health: number;
    roundsWon: number;
    hasSubmittedMove: boolean;
  };
  player2: {
    address: string;
    characterId: string;
    health: number;
    roundsWon: number;
    hasSubmittedMove: boolean;
  };
  rounds: RoundSummary[];
  moveDeadline: number | null;
}
```

---

### Event: `error`

Error notification for game-related issues.

**Direction**: Server → Affected client

```typescript
interface ErrorPayload {
  code: string;
  message: string;
  recoverable: boolean;
}

// Error codes
// - "MOVE_TIMEOUT": Player didn't submit move in time
// - "TX_FAILED": Transaction failed to confirm
// - "INVALID_MOVE": Move validation failed
// - "SESSION_EXPIRED": Relayer session expired
```

---

## Client → Server Messages

Clients send messages via Supabase Broadcast. The server listens and responds.

### Message: `ping`

Keepalive message to maintain connection.

```typescript
{
  type: "broadcast",
  event: "ping",
  payload: {
    address: string;
    timestamp: number;
  }
}
```

### Message: `request_sync`

Request full state resync (after reconnection).

```typescript
{
  type: "broadcast",
  event: "request_sync",
  payload: {
    address: string;
    lastKnownRound: number;
  }
}
```

---

## Connection Lifecycle

```
1. Client connects to `game:${matchId}` channel
2. Client tracks presence with player info
3. Server detects presence, sends `state_sync` if reconnection
4. Normal event flow begins
5. On disconnect, server waits 30s before `opponent_disconnected`
6. On reconnect within grace period, `opponent_reconnected` sent
7. On timeout, `match_ended` with reason: "timeout"
8. On match end, client unsubscribes from channel
```

---

## TypeScript Event Types

```typescript
// types/websocket.ts

export type GameEvent = 
  | { event: "character_selected"; payload: CharacterSelectedPayload }
  | { event: "match_starting"; payload: MatchStartingPayload }
  | { event: "round_starting"; payload: RoundStartingPayload }
  | { event: "move_submitted"; payload: MoveSubmittedPayload }
  | { event: "move_confirmed"; payload: MoveConfirmedPayload }
  | { event: "round_resolved"; payload: RoundResolvedPayload }
  | { event: "match_ended"; payload: MatchEndedPayload }
  | { event: "opponent_disconnected"; payload: OpponentDisconnectedPayload }
  | { event: "opponent_reconnected"; payload: OpponentReconnectedPayload }
  | { event: "state_sync"; payload: StateSyncPayload }
  | { event: "error"; payload: ErrorPayload };

export function isGameEvent(event: unknown): event is GameEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    "event" in event &&
    "payload" in event
  );
}
```
