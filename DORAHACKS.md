<div align="center">

# KaspaClash

</div>

> **A real-time blockchain-powered fighting game showcasing Kaspa's lightning-fast block times through competitive PvP combat, live betting, and on-chain matchmaking.**

<div align="center">
  <a href="https://kaspaclash.vercel.app">
    <img src="https://img.shields.io/badge/PLAY-NOW-00D9FF?style=for-the-badge" alt="PLAY NOW" />
  </a>
  <a href="https://github.com/zaikaman/KaspaClash">
    <img src="https://img.shields.io/badge/GITHUB-Source_Code-black?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
</div>

![KaspaClash Banner](https://kaspaclash.vercel.app/logo.webp)

---

## Overview

**KaspaClash** is a competitive 1v1 turn-based fighting game that demonstrates the true power of Kaspa's BlockDAG architecture through real-time gameplay. Players connect their Kaspa wallets to compete in skill-based matches, bet on ongoing fights, climb the leaderboard, and experience blockchain gaming without latency constraints.

Built for **Kaspathon 2026** under the **Gaming & Interactive** track.

**Key differentiator:** Every move you make is a **real on-chain transaction that must be confirmed in a block before gameplay continues** — demonstrating true blockchain speed with ~1 second confirmations, not optimistic UI tricks.

The game supports both **Kaspa testnet-10** and **mainnet**, automatically detecting the connected wallet's network.

---

## Why KaspaClash?

### The Problem
Traditional blockchain games suffer from:
- **Network Latency:** 10-60 second confirmation times make real-time gaming impossible
- **Poor UX:** Players must wait for transactions, breaking immersion
- **Complex Onboarding:** Steep learning curves discourage casual gamers

### The Solution: Kaspa's Speed
- **Real Block Confirmations:** With Kaspa's 10 BPS, transactions confirm in ~1 second. The game **waits for blockchain confirmation before each move** — no optimistic UI
- **Live Betting:** Spectators place bets that confirm before the next round
- **On-Chain Everything:** All matches, moves, and transactions are blockchain-native
- **Low Fees:** Kaspa's efficiency keeps transaction costs negligible (~0.0001 KAS)

---

## Key Features

### 🎮 Core Gameplay
- **Turn-Based Combat:** Strategic rock-paper-scissors style fighting where every move is a verified Kaspa transaction
- **Power Surge Cards:** 15 unique round boosts with balanced trade-offs — each selection is also an on-chain transaction
- **20 Unique Characters:** 4 archetypes (Speed, Tech, Tank, Precision) with tier-based scaling (Common → Legendary)
- **Multiple Game Modes:**
  - **Ranked Matchmaking:** ELO-based queue with 30-second Smart Bot failover
  - **Private Rooms:** 6-character room codes with P2P wagering
  - **Practice Mode:** Offline training against AI
  - **Survival Mode:** Endless waves with difficulty scaling (max 3 daily plays)
  - **Spectator Mode:** Watch live matches with real-time betting
  - **Bot Battles:** 24/7 automated matches with betting support

### 📈 Progression & Rewards
- **Battle Pass:** 50 tiers with XP from matches, quests, and achievements
- **Daily Quests:** 3 rotating objectives (Easy/Medium/Hard)
- **Achievement System:** 5 categories × 5 tiers (Bronze → Diamond)
- **Prestige System:** Reset at tier 50 for permanent XP/currency multipliers
- **Clash Shards Currency:** In-game economy with full transaction ledger
- **Season System:** Seasonal content with progression resets

### 🛒 Cosmetic Shop & NFTs
- **Client-Side NFT Cosmetics:** Each purchase triggers a **1 KAS transaction** with KRC-721 NFT metadata embedded in the payload, inscribing your cosmetic on-chain
- **Categories:** Characters, skins, stickers, victory poses, profile badges/frames
- **Rarity Tiers:** Common, Rare, Epic, Legendary

### ⛓️ Blockchain Features
- **Kaspa Wallet Integration:** Seamless Kasware wallet connection with public key signature authentication
- **Dual Network Support:** Auto-detects testnet-10 or mainnet from connected wallet
- **True On-Chain Combat:** Every Punch, Kick, and Block is a confirmed blockchain transaction
- **Live Betting:** Spectators bet on match outcomes with instant confirmations (min 1 KAS)
- **Bot Betting:** Fixed 2x odds on automated bot matches with 1% house fee
- **Automated Payouts:** Instant KAS payouts to winners via cron jobs
- **Treasury System:** Weekly KAS distributions to top leaderboard players funded by betting fees and cosmetic purchases

### 🎬 Replay & Sharing
- **High-Quality MP4 Export:** Convert any match replay into a sharable video directly in browser
- **Silent Audio Capture:** Full BGM and SFX capture without playing through speakers
- **Client-Side Processing:** No server costs — renders locally using a hidden accelerated game instance

### 💬 Social Features
- **Real-Time Chat:** In-game messaging with sticker support and quick chat presets
- **Spectator Chat:** Automated engagement with 40+ personas and 200+ message templates
- **Spectator Isolation:** Secure channel separation for private player strategy

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16.1, React 19.2, TypeScript 5, Phaser 3.88, Tailwind CSS 4, Framer Motion 12, Zustand 5, Zod 4 |
| **Blockchain** | Kaspa WASM 0.13+ (tx building, signing, verification), kaspalib, Kasware Wallet, Client-Side KRC-721 NFT Minting |
| **Backend** | Supabase (PostgreSQL + RLS + Realtime), Next.js API Routes, Cloudinary, Cron Jobs |
| **Testing** | Vitest 4 |
| **Deployment** | Vercel |

---

## Architecture

```
+---------------------------------------------------------------+
|                    Client (Browser)                           |
|  +-------------+  +--------------+  +---------------------+   |
|  |  Next.js    |  |  Phaser.js   |  |  Kaspa Wallet       |   |
|  |  React App  |  |  Game Engine |  |  (Kasware)          |   |
|  +------+------+  +------+-------+  +----------+----------+   |
|         +----------------+---------------------+              |
+---------------------------------------------------------------+
                           |
               +-----------v-----------+
               |  Supabase Realtime    |
               |  (WebSocket)          |
               +-----------+-----------+
                           |
+---------------------------------------------------------------+
|                    Server (Next.js)                           |
|  +----------------------------------------------------------+ |
|  |  API Routes: Matchmaking, Betting, Combat, Progression,  | |
|  |  Auth (Kaspa Sig), Treasury, Bot Games, Cron (Payouts)   | |
|  +----------------------------+-----------------------------+ |
|              +----------------v-----------+                   |
|              |  Supabase PostgreSQL       |                   |
|              |  (40+ Tables + RLS)        |                   |
|              +----------------------------+                   |
+---------------------------------------------------------------+
                           |
             +-------------v--------------+
             |    Kaspa Blockchain        |
             |   (Testnet-10 & Mainnet)   |
             +----------------------------+
```

### Match Flow
1. **Queue Join:** Wallet connect → signature auth → Supabase queue entry
2. **Matchmaking:** ELO-based pairing. No human in 30s → Smart Bot auto-match
3. **Ban & Pick:** Blind ban 1 character → Blind pick → Dramatic reveal
4. **Combat:** Moves submitted → Server validates → Blockchain confirms → Round resolves
5. **Match End:** Winner determined → ELO updated → Results stored

### Betting Flow
1. Match starts → Betting pool created → Open for bets
2. Spectator sends KAS to vault → API records bet with tx_id
3. Final round → Pool locked
4. Match ends → Payouts calculated → Winners receive funds on-chain

---

## Kaspa Integration — The Core Innovation

### Real Blockchain Verification

**KaspaClash doesn't fake blockchain speed — it proves it.**

Unlike most blockchain games that use optimistic UI (showing results while transactions process in the background), KaspaClash **waits for on-chain confirmation** before each move executes:

1. Player selects a move (Punch/Kick/Block/Special)
2. Kasware wallet opens with 1 KAS transaction
3. User approves, wallet broadcasts to Kaspa network
4. **Game checks blockchain every 100ms**
5. Transaction appears in block (~1 second with 10 BPS)
6. **Round resolves ONLY after blockchain confirms**

**This means every punch, kick, and block is a real blockchain transaction.** The game literally pauses until Kaspa confirms. Typical confirmation: ~1 second.

**Why this matters:** Most blockchain games sacrifice decentralization for speed using optimistic updates. KaspaClash proves Kaspa is fast enough to be the **source of truth** WITHOUT compromising on true blockchain verification.

### On-Chain Data
- Every move is a confirmed Kaspa transaction
- Power Surge card selections are on-chain
- NFT cosmetics inscribed via KRC-721 payload metadata
- Betting pools with on-chain transaction verification
- Automated on-chain payouts via chained batch transactions

### Wallet Authentication
Uses Kaspa wallet signatures (via kaspa-wasm `verifyMessage`) for authentication instead of traditional username/password — no accounts needed, just connect your wallet.

---

## Game Mechanics

### Combat System
Turn-based with simultaneous move submission. Resolution matrix:

| | Punch | Kick | Block | Special |
|---|---|---|---|---|
| **Punch** | Both Hit | Staggered | Blocked | Stuns Enemy |
| **Kick** | Hit | Both Hit | Reflected | Hit |
| **Block** | Guard | Guard | Nothing | Shattered |
| **Special** | Stunned | Hit | Shatter | Both Hit |

**Energy & Guard System:**
- Starting Energy: 85-105 (character-dependent) · +20 regen/turn
- Guard Meter: 0-100 · +25 per block · 100 = stun (skip turn)
- Insufficient energy = auto-block

### Power Surge Cards (15 Unique)
At the start of each round, both players see 3 random cards. Selecting one costs 1 KAS (on-chain). Effects last one round only.

| Card | Effect |
|------|--------|
| DAG Overclock | +40% damage |
| Block Fortress | Blocks reflect 120% damage |
| Tx Storm | +25 energy, lose 4 HP |
| Mempool Congest | Stun opponent (costs 6 HP) |
| Blue Set Heal | Restore 10 HP |
| Orphan Smasher | Counter deals +75% damage |
| 10BPS Barrage | +20 energy regen on kick/punch |
| Pruned Rage | +30% damage, opponent can't block |
| Sompi Shield | Take 45% less damage |
| Hash Hurricane | 35% dodge chance |
| GhostDAG | Opponent loses 30 energy/turn |
| Finality Fist | Special +70% dmg, costs +24 energy |
| BPS Syphon | Heal 35% of damage dealt |
| Vaultbreaker | Steal 50 energy on hit |
| Chainbreaker | Bypass block, +15% damage |

### Character Tier Scaling

| Tier | Stat Multiplier |
|------|:---:|
| Common | 1.0x |
| Uncommon | 1.1x |
| Rare | 1.25x |
| Epic | 1.5x |
| Legendary | 2.0x |

A skilled Common player can defeat a Legendary opponent through prediction — counter hits deal massive bonus damage.

### Smart Bot AI
- Analyzes health, energy, guard meters, and move history
- Assigned realistic names and ratings (±100 ELO of player)
- Auto-activates after 30s queue without a human match
- Same rules as PvP — server-side settlement

---

## Treasury System

Automated decentralized reward distribution powered by Kaspa:

**Weekly (Monday 00:00 UTC):**
- 40% to Top 10 ELO Players (weighted by rank)
- 40% to Top 10 Survival Players (weighted by rank)
- 20% to Project Wallet (operations)
- Minimum 10 KAS reserve maintained

**Funding:** 0.1% fee on betting pools + 1 KAS per cosmetic purchase. Distributions executed on-chain via chained batch transactions.

---

## Database

PostgreSQL via Supabase with Row Level Security. **40+ tables** covering:

- **Core:** players, matches, rounds, moves, fight_state_snapshots
- **Betting:** betting_pools, bets, bot_betting_pools, bot_bets, bot_matches
- **Progression:** battle_pass_seasons, battle_pass_tiers, player_progression, player_currency, currency_transactions, xp_awards
- **Quests:** quest_templates, daily_quests, quest_statistics
- **Achievements:** achievements, player_achievements, achievement_statistics
- **Shop:** cosmetic_items, player_inventory, player_loadouts, cosmetic_nfts, shop_purchases, shop_rotations
- **Treasury:** treasury_distributions, treasury_deposits, treasury_balance_snapshots, distribution_payouts
- **Infrastructure:** session_tokens, rate_limits, security_audit_log, matchmaking_queue, blockchain_anchors

### Realtime Channels
- `matchmaking:queue` — Queue updates
- `game:${matchId}` — Match events, moves, rounds
- `spectate:${matchId}` — Spectator view, betting pools
- `progression:${playerAddress}` — XP, tiers, quests

---

## API Endpoints

All routes under `/api/` as Next.js serverless functions with Zod validation:

**Auth:** `POST /api/auth/login` — Kaspa wallet signature verification

**Matchmaking:** Queue join/leave, bot match creation, private rooms (create/join/cancel/stake)

**Matches:** Match details, live matches, character ban/select, move submission, fight state, power surge selection, forfeit, disconnect, timeout handling, bot auto-move, stunned turn handling

**Betting (PvP):** Pool info, place bet (min 1 KAS), claim winnings, history, payouts

**Bot Betting:** Pool info, place bet (2x fixed odds, 1% house fee), payouts, history

**Progression:** Award XP, player progression, unlock tiers, prestige, season info

**Quests:** Daily quests, claim rewards, update progress

**Shop:** Inventory, featured items, purchase (triggers NFT mint), NFT listing/verification

**Achievements:** List, progress, unlock

**Survival:** Start run, end run, leaderboard, status

**Treasury:** Balance, distribute, distribution history

**Cron:** Bot match payouts, weekly treasury distribution

---

## Getting Started

### Prerequisites
- Node.js 20+
- Kasware Wallet extension ([Download](https://kasware.xyz/))
- Supabase account ([Sign up](https://supabase.com/))

### Quick Start
```bash
git clone https://github.com/zaikaman/KaspaClash.git
cd KaspaClash
npm install
# Set up .env.local (Supabase + Kaspa vault addresses + keys)
# Run Supabase migrations (supabase/migrations/current_schema.sql)
npm run dev
# Open http://localhost:3000
```

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase
- `NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET` / `_MAINNET` — Vault addresses
- `BETTING_VAULT_PRIVATE_KEY_TESTNET` / `_MAINNET` — For automated payouts
- `CLOUDINARY_*` — Optional, for match sharing images
- `KASPA_RPC_URL` / `KASPA_RPC_URL_TESTNET` — Optional RPC endpoints

---

## AI Attribution

KaspaClash is an AI-augmented development project:

- **Claude 4.5 (Sonnet & Opus):** System architecture, Kaspa WASM integration, real-time state management
- **Gemini 3 Flash:** Rapid prototyping, TypeScript patterns
- **Ludo AI:** Character sprites and UI visual assets
- **Suno AI & ElevenLabs:** Background music and sound effects

**The project's vision, core architecture, and blockchain integrations were driven by human oversight.** Every line of code was reviewed and refined. AI was used as a productivity multiplier, not a replacement for engineering judgment.

---

## License

MIT License — Copyright (c) 2026 KaspaClash

---

## Links

- **Live Demo:** [https://kaspaclash.vercel.app](https://kaspaclash.vercel.app)
- **GitHub:** [https://github.com/zaikaman/KaspaClash](https://github.com/zaikaman/KaspaClash)
- **Kaspathon:** [https://kaspathon.com](https://kaspathon.com)

---

*Built for Kaspathon 2026 — Proving that real-time gaming on a PoW blockchain isn't just possible, it's practical, scalable, and fun.*
