# Research: KaspaClash Core Fighting Game

**Date**: 2025-12-31  
**Status**: Complete  
**Purpose**: Resolve technical unknowns and document best practices before design phase

---

## 1. Kaspa SDK & Wallet Integration

### Decision: Use @kluster/kaspa-wasm-web + KIP-12 Wallet Provider

**Rationale**: The official rusty-kaspa WASM bindings provide complete access to Kaspa's transaction system. Browser wallet extensions (Kasware, Kastle, Kaspium) implement the KIP-12 provider standard for consistent integration.

**Alternatives Considered**:
- NPM `kaspa` package (v0.13.0) - Rejected: 2 years outdated, Node.js focused
- Direct RPC calls - Rejected: No transaction signing capability
- Custom WASM build - Rejected: Unnecessary complexity

### Package Installation

```bash
# Fresh WASM SDK from GitHub releases
npx @kluster/kaspa-starter-cli

# Or manual installation
npm install @aspect/kaspa-wasm
```

### WASM Initialization (Next.js)

```typescript
// lib/kaspa/client.ts
import init, { initConsolePanicHook, RpcClient } from "@kluster/kaspa-wasm-web";

let initialized = false;

export async function initKaspa(): Promise<void> {
  if (initialized) return;
  await init();
  initConsolePanicHook();
  initialized = true;
}

// next.config.js - Required webpack configuration
module.exports = {
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};
```

### Wallet Connection (KIP-12 Standard)

```typescript
// lib/kaspa/wallet.ts
interface KaspaProvider {
  connect(): Promise<{ address: string }>;
  request(method: string, params?: unknown): Promise<unknown>;
  on(event: string, handler: Function): void;
}

export async function discoverWallet(): Promise<KaspaProvider | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 2000);
    
    window.addEventListener("kaspa:provider", (e: CustomEvent) => {
      clearTimeout(timeout);
      resolve(e.detail);
    }, { once: true });
    
    window.dispatchEvent(new Event("kaspa:requestProvider"));
  });
}

export async function connectWallet(provider: KaspaProvider) {
  const { address } = await provider.connect();
  return address;
}

export async function signTransaction(provider: KaspaProvider, tx: string) {
  return provider.request("kaspa_signTransaction", { transaction: tx });
}
```

### Transaction Flow

1. **Get UTXOs**: `rpc.getUtxosByAddresses([address])`
2. **Create Transaction**: `createTransactions({ entries, outputs, changeAddress })`
3. **Sign**: Via wallet provider `kaspa_signTransaction` or direct private key
4. **Submit**: `rpc.submitTransaction(signedTx)`
5. **Confirm**: Subscribe to `virtual-daa-score-changed` events

### Custom Data Encoding Strategy

**Decision**: Use off-chain indexing with transaction ID references

**Rationale**: Kaspa does NOT support OP_RETURN for arbitrary data. The KRC-20 commit-reveal scheme is overkill for game moves. Instead:

1. Player submits move selection to server with signature
2. Server (relayer) creates transaction with minimal value
3. Transaction ID becomes the move identifier
4. Match state stored in Supabase, linked by transaction IDs

**Alternative for pure on-chain**: Encode move data in output address patterns (not recommended for UX).

### Real-time Event Subscription

```typescript
// lib/kaspa/subscriptions.ts
const rpc = new RpcClient({ url: "wss://testnet.kaspathon.com/wrpc" });

rpc.addEventListener("block-added", (event) => {
  // New block detected - check for our transactions
  const block = event.data;
  for (const tx of block.transactions) {
    if (isGameTransaction(tx)) {
      emitMoveConfirmed(tx.id);
    }
  }
});

await rpc.connect();
await rpc.subscribeBlockAdded();
```

### Key Kaspa Resources

- **Testnet Faucet**: https://faucet-tn10.kaspanet.io/
- **Hackathon Nodes**: `testnet.kaspathon.com` / `mainnet.kaspathon.com`
- **Documentation**: https://kaspa.aspectron.org/docs/
- **Starter Kit**: https://github.com/Kaspathon/KaspaDev-Resources

---

## 2. Phaser.js + Next.js Integration

### Decision: Use next/dynamic with SSR disabled + EventBus pattern

**Rationale**: Phaser.js requires browser APIs (canvas, WebGL) unavailable during SSR. The official `phaserjs/template-nextjs` provides a battle-tested pattern for React integration.

**Alternatives Considered**:
- iframe isolation - Rejected: Complex communication, poor DX
- Custom SSR shim - Rejected: Fragile, maintenance burden
- react-phaser-fiber - Rejected: Outdated, limited Phaser 3 support

### Dynamic Import Pattern

```typescript
// components/game/GameCanvas.tsx
"use client";

import dynamic from "next/dynamic";

const PhaserGame = dynamic(
  () => import("./PhaserGame").then((mod) => mod.PhaserGame),
  { ssr: false, loading: () => <GameLoadingPlaceholder /> }
);

export function GameCanvas({ matchId }: { matchId: string }) {
  return <PhaserGame matchId={matchId} />;
}
```

### React-Phaser Bridge Architecture

```typescript
// game/EventBus.ts
import { Events } from "phaser";

export const EventBus = new Events.EventEmitter();

// Events emitted by Phaser → React
EventBus.emit("move-animation-complete", { move: "punch", player: 1 });
EventBus.emit("health-changed", { player: 1, health: 75 });
EventBus.emit("round-ended", { winner: 1 });

// Events emitted by React → Phaser
EventBus.emit("execute-move", { move: "kick", player: 1 });
EventBus.emit("start-round", { round: 2 });
```

### Game Manager Wrapper

```typescript
// game/GameManager.ts
import Phaser from "phaser";
import { EventBus } from "./EventBus";
import { BootScene, FightScene, VictoryScene } from "./scenes";

export class GameManager {
  private game: Phaser.Game | null = null;

  init(parent: HTMLElement): void {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: 1280,
      height: 720,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BootScene, FightScene, VictoryScene],
    });
  }

  destroy(): void {
    EventBus.removeAllListeners();
    this.game?.destroy(true);
    this.game = null;
  }
}
```

### Memory Management

```typescript
// components/game/PhaserGame.tsx
"use client";

import { useLayoutEffect, useRef } from "react";
import { GameManager } from "@/game/GameManager";

export function PhaserGame({ matchId }: { matchId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameManager | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    gameRef.current = new GameManager();
    gameRef.current.init(containerRef.current);

    return () => {
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [matchId]);

  return <div ref={containerRef} className="w-full h-full" />;
}
```

### Responsive Canvas

```typescript
// Game config
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: 1280,
  height: 720, // 16:9 base resolution
},

// Listen for resize in scenes
this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
  // Reposition UI elements relative to new size
});
```

### Sprite Sheet Animation (Fighting Game)

```typescript
// scenes/BootScene.ts - Load sprite sheets
this.load.spritesheet("fighter-idle", "/assets/sprites/fighter-idle.png", {
  frameWidth: 128,
  frameHeight: 128,
});

// scenes/FightScene.ts - Create animations
this.anims.create({
  key: "punch",
  frames: this.anims.generateFrameNumbers("fighter-punch", { start: 0, end: 7 }),
  frameRate: 12,
  repeat: 0,
});

// Trigger hitbox on specific frame
fighter.on(Phaser.Animations.Events.ANIMATION_UPDATE, (anim, frame) => {
  if (anim.key === "punch" && frame.index === 4) {
    this.checkHit(fighter);
  }
});
```

### Particle Effects (Phaser 3.60+)

```typescript
// Create hit effect emitter
const hitParticles = this.add.particles(0, 0, "spark", {
  speed: { min: 100, max: 300 },
  angle: { min: -30, max: 30 },
  scale: { start: 1, end: 0 },
  lifespan: 300,
  quantity: 20,
  emitting: false, // Manual trigger only
});

// Trigger on hit
hitParticles.setPosition(hitX, hitY);
hitParticles.explode(20);
```

---

## 3. Supabase Realtime for Matchmaking

### Decision: Presence for queue + Broadcast for game state

**Rationale**: Presence provides automatic disconnect handling and instant state sync for the matchmaking queue. Broadcast offers 6ms median latency for real-time combat actions without database roundtrips.

**Alternatives Considered**:
- Pure database polling - Rejected: High latency, poor UX
- Socket.io custom server - Rejected: Additional infrastructure, Vercel incompatible
- Firebase Realtime DB - Rejected: Lock-in, less PostgreSQL integration

### Channel Architecture

| Channel | Type | Purpose |
|---------|------|---------|
| `matchmaking:queue` | Presence | Track players searching for matches |
| `game:${gameId}` | Broadcast + Presence | Real-time game state sync |
| `player:${playerId}` | Broadcast | Player-specific notifications |

### Matchmaking Queue (Presence)

```typescript
// lib/matchmaking/queue.ts
import { supabase } from "@/lib/supabase/client";

export async function joinQueue(playerAddress: string) {
  const channel = supabase.channel("matchmaking:queue");
  
  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const players = Object.values(state).flat();
      
      if (players.length >= 2) {
        // Attempt to match with another player
        attemptMatch(players);
      }
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          address: playerAddress,
          joinedAt: Date.now(),
          rating: 1000, // For skill-based matching
        });
      }
    });
    
  return channel;
}
```

### Game Room (Broadcast)

```typescript
// lib/matchmaking/rooms.ts
export async function joinGameRoom(gameId: string, playerId: string) {
  const channel = supabase.channel(`game:${gameId}`, {
    config: { private: true },
  });

  channel
    .on("broadcast", { event: "move" }, ({ payload }) => {
      // Handle opponent move
      EventBus.emit("opponent-move", payload);
    })
    .on("broadcast", { event: "state-sync" }, ({ payload }) => {
      // Full state resync (for reconnection)
      EventBus.emit("state-sync", payload);
    })
    .on("presence", { event: "leave" }, ({ key }) => {
      // Opponent disconnected
      handleDisconnection(key);
    });

  return channel;
}

export async function sendMove(channel: RealtimeChannel, move: GameMove) {
  await channel.send({
    type: "broadcast",
    event: "move",
    payload: move,
  });
}
```

### Database Schema (Matchmaking & Persistence)

```sql
-- Players table
CREATE TABLE players (
  address TEXT PRIMARY KEY,
  display_name TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_address TEXT REFERENCES players(address),
  player2_address TEXT REFERENCES players(address),
  status TEXT CHECK (status IN ('waiting', 'character_select', 'in_progress', 'completed')),
  format TEXT CHECK (format IN ('best_of_3', 'best_of_5')) DEFAULT 'best_of_3',
  winner_address TEXT REFERENCES players(address),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Match rounds (for history/replay)
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id),
  round_number INTEGER,
  player1_move TEXT,
  player2_move TEXT,
  player1_damage INTEGER,
  player2_damage INTEGER,
  player1_health INTEGER,
  player2_health INTEGER,
  winner_address TEXT,
  tx_id_player1 TEXT, -- Kaspa transaction ID
  tx_id_player2 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

-- Players can read all, update only self
CREATE POLICY "Public read" ON players FOR SELECT USING (true);
CREATE POLICY "Self update" ON players FOR UPDATE USING (auth.uid()::text = address);

-- Games readable by participants
CREATE POLICY "Participant read" ON games FOR SELECT 
  USING (player1_address = auth.uid()::text OR player2_address = auth.uid()::text);
```

### Performance Metrics

- **Median latency**: 6ms (Broadcast)
- **P95 latency**: 28ms
- **Throughput**: 224,000 messages/second
- **Concurrent connections**: 32,000+

### Disconnection Handling

```typescript
// 30-second grace period for reconnection
const RECONNECT_TIMEOUT = 30000;

function handleDisconnection(playerId: string) {
  const timeout = setTimeout(() => {
    // Player didn't reconnect - forfeit
    declareWinner(getOpponentId(playerId));
  }, RECONNECT_TIMEOUT);

  // Cancel if player reconnects
  channel.on("presence", { event: "join" }, ({ key }) => {
    if (key === playerId) {
      clearTimeout(timeout);
      syncGameState(playerId);
    }
  });
}
```

---

## 4. Relayer Service Architecture

### Decision: Server-side transaction sponsorship with signature verification

**Rationale**: The relayer enables "gasless" gameplay by sponsoring transaction fees. Players sign a message once per session; the server verifies and submits transactions on their behalf.

### Flow

1. Player connects wallet and signs a session message
2. Session signature stored client-side (valid for 24h)
3. For each move, player sends signed move data to relayer API
4. Relayer verifies signature, constructs transaction, submits to Kaspa
5. Transaction ID returned to client for confirmation tracking

### API Endpoint

```typescript
// app/api/relayer/move/route.ts
export async function POST(request: Request) {
  const { move, matchId, signature, address } = await request.json();
  
  // Verify player is in this match
  const match = await getMatch(matchId);
  if (!match.hasPlayer(address)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }
  
  // Verify signature
  const isValid = await verifySignature(signature, address, move);
  if (!isValid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }
  
  // Build and submit transaction from hot wallet
  const tx = await buildMoveTransaction(move, matchId, address);
  const txId = await submitTransaction(tx);
  
  return Response.json({ txId });
}
```

### Hot Wallet Security

- Hot wallet holds minimal KAS (auto-refill from treasury)
- Rate limiting: Max 10 transactions per player per minute
- Match validation: Only active matches can submit moves
- Audit logging: All relayer transactions logged

---

## 5. Move Encoding & Game Logic

### Move Types

| Move | Damage | Beats | Loses To | Special |
|------|--------|-------|----------|---------|
| Punch | 10 | Kick | Block | Fast |
| Kick | 15 | Block | Punch | Slow |
| Block | 0 | Punch | Kick | Negates damage |
| Special | 25 | - | - | Requires charge |

### Simultaneous Resolution

Both players submit moves; resolution is deterministic:

```typescript
function resolveRound(move1: Move, move2: Move): RoundResult {
  // Rock-paper-scissors with damage values
  const damage1 = calculateDamage(move1, move2); // What P1 deals
  const damage2 = calculateDamage(move2, move1); // What P2 deals
  
  return {
    player1Damage: damage2, // P1 receives P2's attack
    player2Damage: damage1, // P2 receives P1's attack
    animations: [
      { player: 1, animation: move1.animation },
      { player: 2, animation: move2.animation },
    ],
  };
}
```

---

## 6. PWA Configuration

### manifest.json

```json
{
  "name": "KaspaClash",
  "short_name": "KaspaClash",
  "description": "Real-time blockchain fighting game on Kaspa",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#00d4aa",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker (Next.js)

Use `next-pwa` package for automatic service worker generation:

```javascript
// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  // ...other config
});
```

---

## Summary: All Clarifications Resolved

| Topic | Decision | Confidence |
|-------|----------|------------|
| Kaspa SDK | @kluster/kaspa-wasm-web + KIP-12 | High |
| Custom data | Off-chain indexing by TX ID | High |
| Phaser + Next.js | next/dynamic + EventBus | High |
| Matchmaking | Supabase Presence | High |
| Game sync | Supabase Broadcast | High |
| Relayer | Server-side sponsorship | High |
| PWA | next-pwa package | High |

**No NEEDS CLARIFICATION items remain. Ready for Phase 1 design.**
