<div align="center">

# KaspaClash

</div>

[![Built for Kaspathon 2026](https://img.shields.io/badge/Built%20for-Kaspathon%202026-00D9FF?style=for-the-badge)](https://kaspathon.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Phaser](https://img.shields.io/badge/Phaser-3.88-blueviolet?style=for-the-badge)](https://phaser.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Kaspa](https://img.shields.io/badge/Kaspa-Powered-49D9D9?style=for-the-badge)](https://kaspa.org)

> **A real-time blockchain-powered fighting game showcasing Kaspa's lightning-fast block times through competitive PvP combat, live betting, and on-chain matchmaking.**

<div align="center">
  <a href="https://kaspaclash.vercel.app"><strong>PLAY NOW →</strong></a>
</div>

![KaspaClash Banner](https://kaspaclash.vercel.app/logo.webp)

---

## Table of Contents

- [Overview](#overview)
- [Why KaspaClash?](#why-kaspaclash)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Game Architecture](#game-architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Progression System](#progression-system)
- [Game Mechanics](#game-mechanics)
- [Kaspa Integration](#kaspa-integration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [AI Attribution](#ai-attribution)
- [Contributing](#contributing)
- [License](#license)

---

<a id="overview"></a>
## Overview

**KaspaClash** is a competitive 1v1 turn-based fighting game that demonstrates the true power of Kaspa's BlockDAG architecture through real-time gameplay mechanics. Players connect their Kaspa wallets to compete in skill-based matches, bet on ongoing fights, climb the leaderboard, and experience blockchain gaming without the traditional latency constraints.

The game supports both **Kaspa testnet-10** and **mainnet**, automatically detecting the connected wallet's network and routing transactions accordingly.

Built for the **Kaspathon 2026 hackathon** under the **Gaming & Interactive** track, KaspaClash leverages Kaspa's sub-second block times to create a seamless gaming experience where **every move you make is a real on-chain transaction that must be confirmed in a block before gameplay continues** -- demonstrating true blockchain speed with ~1 second confirmations, not optimistic UI tricks.

### Hackathon Category
- **Primary Track:** Gaming & Interactive
- **Special Mentions Target:** Best UX/UI, Most Creative Use of Kaspa

---

<a id="why-kaspaclash"></a>
## Why KaspaClash?

### The Problem
Traditional blockchain games suffer from:
- **Network Latency:** 10-60 second confirmation times make real-time gaming impossible
- **Poor UX:** Players must wait for transactions, breaking immersion
- **Limited Scalability:** High fees and slow throughput prevent mass adoption
- **Complex Onboarding:** Steep learning curves discourage casual gamers

### The Solution: Kaspa's Speed
KaspaClash demonstrates how Kaspa's BlockDAG architecture solves these problems:

- **Real Block Confirmations:** With Kaspa's 10 BPS (100ms blocks), transactions confirm in ~1 second. **The game actually waits for blockchain confirmation before each move executes** -- this isn't optimistic UI, it's genuine on-chain verification happening faster than traditional blockchains can even broadcast
- **Live Betting:** Spectators can place bets that confirm before the next round
- **On-Chain Everything:** All game state, matches, and transactions are blockchain-native
- **Seamless UX:** Players experience gaming-first design with blockchain in the background
- **Low Fees:** Kaspa's efficiency keeps transaction costs negligible

---

<a id="key-features"></a>
## Key Features

### Core Gameplay
- **Turn-Based Combat System:** Strategic rock-paper-scissors style fighting where **every move is a Kaspa transaction that is verified and confirmed in a block before the turn resolves** -- the game literally waits for blockchain confirmation (typically ~1 second with Kaspa's 10 BPS)
- **Power Surge Cards:** Choose from 3 random round boosts at the start of each round (15 unique cards). Balanced effects with strategic trade-offs -- no auto-pick legendaries. Each card selection is also a Kaspa transaction that is verified and confirmed in a block before confirming on the UI.
- **20 Unique Characters:** Diverse roster across 4 archetypes (Speed, Tech, Tank, Precision) with **Tier-Based Scaling** (Common to Legendary). Higher tiers possess reinforced stats and stronger counters.
- **Multiple Game Modes:**
  - **Ranked Matchmaking:** ELO-based competitive queue with a **30-second failover to Smart Bots** to ensure near-instant entry into combat.
  - **Private Rooms:** 6-character room codes for custom matches with **P2P Wagering** (Challenge your friends with real KAS stakes).
  - **Practice Mode:** Train against the Smart Bot AI in an offline environment.
  - **Survival Mode:** Endless wave-based challenge with escalating difficulty (max 3 daily plays with anti-cheat tracking)
  - **Spectator Mode:** Watch live matches with real-time betting
  - **Bot Battles:** 24/7 automated bot-vs-bot matches with betting support

### Progression & Rewards
- **Battle Pass System:** Progress through 50 tiers by earning XP from matches and quests
- **Daily Quests:** Complete 3 rotating objectives daily (Easy/Medium/Hard difficulty)
- **Achievement System:** Unlock achievements across 5 categories (Combat, Progression, Social, Collection, Mastery) with 5 tier levels (Bronze, Silver, Gold, Platinum, Diamond)
- **Prestige System:** Reset progression at tier 50 for permanent XP/currency multipliers and exclusive rewards
- **Clash Shards Currency:** Earn in-game currency from matches, quests, and achievements with a full transaction ledger
- **Season System:** Seasonal battle pass content with unique rewards and progression resets

### Customization & Shop
- **Client-Side NFT Cosmetics:** Every cosmetic item purchased triggers a **1 KAS transaction to the treasury vault** with KRC-721 NFT metadata embedded in the payload, inscribing your cosmetic on-chain.
- **Cosmetic Shop:** Browse and purchase skins, stickers, victory poses, and profile badges/frames
- **Inventory Management:** Track owned cosmetics and transaction history
- **Player Loadouts:** Equip owned cosmetics per character
- **Currency Economy:** Spend Clash Shards earned from gameplay to unlock new cosmetics

### Blockchain Features
- **Kaspa Wallet Integration:** Seamless connection via Kasware wallet with public key signature authentication
- **Dual Network Support:** Fully supports both Kaspa **testnet-10** and **mainnet** -- the game auto-detects the connected wallet's network
- **True On-Chain Combat:** Every Punch, Kick, and Block is a confirmed blockchain transaction. **The game verifies each transaction is included in a block before executing the move** -- showcasing Kaspa's genuine ~1 second confirmation speed, not optimistic UI workarounds
- **Live Betting System:** Spectators can bet on match outcomes with instant confirmations (minimum 1 KAS)
- **Bot Betting:** Bet on automated bot matches running 24/7 with fixed 2x odds and 1% house fee
- **On-Chain Leaderboard:** Transparent ranking system powered by ELO ratings
- **Match History:** All game results stored with blockchain verification
- **Transaction Verification:** Real-time bet confirmation and payout tracking
- **Automated Payouts:** Instant KAS payouts to winners via scheduled cron jobs
- **Treasury System:** Automated weekly KAS payouts to top leaderboard players funded by betting fees and cosmetic purchases

### Replay & Sharing
- **High-Quality MP4 Export:** Convert any match replay into a sharable video file directly in the browser
- **Silent Audio Capture:** Advanced audio routing captures full BGM and SFX without playing sound through speakers
- **Client-Side Processing:** No server costs or queues -- renders locally using a hidden accelerated game instance
- **Smart Muxing:** Combines perfectly timed video frames with AAC-encoded audio for professional-quality results

### Social Features
- **Real-Time Chat:** Instant in-game messaging system for active matches with sticker support
- **Quick Chat Presets:** One-tap communication tokens (GG, Nice!, GL HF, etc.)
- **Collapsible UI:** Unobtrusive chat panel with Floating Action Button (FAB) design
- **Spectator Isolation:** Secure channel separation ensures private player strategy

### Live Spectator Chat
- **Real-Time Sync:** Instant message delivery to all spectators via Supabase Realtime
- **Dual Contexts:** Distinct commentary logic for **Bot Matches** (tech-themed) vs **Player Matches** (strategy-themed)
- **Automated Engagement:** Sophisticated fake message generator creates lively chat environments with:
- **Context Awareness:** Reacts to specific game events (big hits, blocks, crits) in real-time
- **Dynamic Personas:** 40+ realistic usernames with varying typing styles
- **Smart Variety:** 200+ unique message templates to prevent repetition
- **Premium UI:** Glassmorphic design with dynamic layout adjustment (compact during betting, full-height during match)

### User Experience
- **Real-Time Updates:** Supabase Realtime for instant game state synchronization
- **Progressive Web App:** Installable with offline character previews
- **Smooth Animations:** Framer Motion + Phaser.js for fluid gameplay
- **Cyberpunk Aesthetic:** Neon-lit UI matching Kaspa's futuristic brand
- **In-App Documentation:** Comprehensive docs section for both gamers and developers

---

<a id="technology-stack"></a>
## Technology Stack

### Frontend
- **[Next.js 16.1](https://nextjs.org/)** - React framework with App Router, Server Components, and Turbopack
- **[React 19.2](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[Phaser 3.88](https://phaser.io/)** - HTML5 game engine for combat scenes
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling (CSS-based configuration)
- **[Framer Motion 12](https://www.framer.com/motion/)** - Advanced animation library
- **[Zustand 5.0](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[Zod 4](https://zod.dev/)** - Runtime schema validation for API inputs

### Blockchain
- **[Kaspa WASM 0.13+](https://github.com/kaspanet/rusty-kaspa)** - Native SDK used for transaction building, signing, and wallet signature verification
- **[kaspalib 0.0.3](https://www.npmjs.com/package/kaspalib)** - Kaspa address utilities
- **[Kasware Wallet](https://kasware.xyz/)** - Browser wallet for player transactions
- **Client-Side NFT Minting:** Users mint KRC-721 NFTs directly from their wallets using transaction payloads with embedded metadata.

### Backend
- **[Supabase](https://supabase.com/)** - PostgreSQL database with Row Level Security
- **[Supabase Realtime](https://supabase.com/realtime)** - WebSocket-based live updates and broadcast channels
- **Next.js API Routes** - Serverless functions for game logic
- **[Cloudinary](https://cloudinary.com/)** - Image uploads for match sharing
- **Cron Jobs** - Scheduled bot match payouts and weekly treasury distributions

### Testing
- **[Vitest 4](https://vitest.dev/)** - Unit testing framework with path alias support

### Development Tools
- **[ESLint 9](https://eslint.org/)** - Code linting
- **[PostCSS](https://postcss.org/)** - CSS processing
- **Vercel** - Deployment platform (recommended)

---

<a id="game-architecture"></a>
## Game Architecture

### System Overview

```
+-----------------------------------------------------------------+
|                      Client (Browser)                           |
+-----------------------------------------------------------------+
|  +----------------+  +----------------+  +-------------------+  |
|  |   Next.js      |  |   Phaser.js    |  |   Kaspa Wallet    |  |
|  |  React App     |  |  Game Engine   |  |     (Kasware)     |  |
|  +--------+-------+  +--------+-------+  +----------+--------+  |
|           |                   |                      |          |
|           +-------------------+----------------------+          |
|                               |                                 |
+-----------------------------------------------------------------+
                                |
                    +-----------v----------+
                    |  Supabase            |
                    |  Realtime            |
                    |  (WebSocket)         |
                    +-----------+----------+
                                |
+-----------------------------------------------------------------+
|                      Server (Next.js)                           |
+-------------------------------+---------------------------------+
|                                                                 |
|  +-----------------------------------------------------------+  |
|  |            API Routes (Serverless)                        |  |
|  +-----------------------------------------------------------+  |
|  |  - Matchmaking      - Match Management                    |  |
|  |  - Betting          - Leaderboard                         |  |
|  |  - Player Profiles  - Game State Logic                    |  |
|  |  - Auth (Kaspa Sig) - Treasury                            |  |
|  |  - Bot Games        - Cron (Payouts)                      |  |
|  +-----------------------------------------------------------+  |
|                               |                                 |
|              +----------------v-----------+                     |
|              |  Supabase PostgreSQL       |                     |
|              |  (40+ Tables + RLS)        |                     |
|              +----------------------------+                     |
+-----------------------------------------------------------------+
                                |
                                v
              +-----------------------------+
              |   Kaspa Blockchain          |
              |  (Testnet-10 & Mainnet)     |
              +-----------------------------+
```

### Data Flow

#### Match Flow
1. **Queue Join:** Player connects wallet -> API validates via signature auth -> Supabase stores queue entry
2. **Matchmaking:** Server matches players by ELO. If no human opponent is found within **30 seconds**, the system automatically pairs the player with a **Smart Bot** to minimize wait times.
3. **Strategic Ban & Pick:**
   - **Ban Phase:** Both players blindly ban one character from the roster.
   - **Blind Pick:** Players select their fighter (excluding bans). Choices are hidden until both lock in.
   - **Reveal:** Dramatic unveil of the selected fighters before combat begins.
4. **Combat Rounds:**
   - Client submits moves via API
   - Server validates + resolves combat using deterministic engine
   - Results broadcast to both players + spectators
5. **Match End:** Winner determined -> ELO updated -> Results written to database

#### Betting Flow
1. **Pool Creation:** Match starts -> Betting pool created -> Open for bets
2. **Place Bet:** Spectator sends KAS to vault -> API records bet with tx_id -> Pool updated
3. **Lock Pool:** Match reaches final round -> Pool locked -> No more bets accepted
4. **Resolve:** Match ends -> Payouts calculated using odds -> Winners receive funds

#### Bot Betting Flow
1. **Match Creation:** Server generates bot vs bot match with pre-computed turns
2. **Betting Window:** 30-second window opens before match starts
3. **Place Bet:** Users bet on Bot 1 or Bot 2 (Fixed 2x Odds)
4. **House Fee:** 1% service fee deducted from bet amount
5. **Auto-Resolution:** Match plays out, winner determined automatically
6. **Instant Payout:** The system automatically triggers batch payouts from vault to winners

#### Chat Flow
1. **Send Message:** Player enters message or clicks quick chat / sends sticker
2. **Local Echo:** Message displays immediately for sender (optimistic UI)
3. **Broadcast:** Event sent to Supabase Realtime channel
4. **Receive:** Opponent receives broadcast -> Deduplicates -> Displays message

---

<a id="getting-started"></a>
## Getting Started

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm, pnpm, or yarn** package manager
- **Kasware Wallet** browser extension ([Download](https://kasware.xyz/))
- **Supabase Account** (free tier works) - [Sign up](https://supabase.com/)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/KaspaClash.git
cd KaspaClash
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. **Set up environment variables**

Create `.env.local` in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database URL (for migrations)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Kaspa Network (optional, defaults to testnet in dev)
NEXT_PUBLIC_KASPA_NETWORK=testnet

# Betting Vault Addresses (for receiving bets)
NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET=kaspatest:your-testnet-address
NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET=kaspa:your-mainnet-address

# Vault Private Keys (for automated payouts)
BETTING_VAULT_PRIVATE_KEY_TESTNET=your-testnet-private-key
BETTING_VAULT_PRIVATE_KEY_MAINNET=your-mainnet-private-key

# Cloudinary (optional, for match sharing images)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# Kaspa RPC (optional)
KASPA_RPC_URL=your-mainnet-rpc-url
KASPA_RPC_URL_TESTNET=your-testnet-rpc-url
```

4. **Set up Supabase database**

Run migrations in your Supabase SQL editor:
```bash
# Navigate to Supabase dashboard -> SQL Editor -> New Query
# Copy and execute the schema file:
# supabase/migrations/current_schema.sql
#
# Then seed cosmetics data:
# supabase/migrations/003_seed_cosmetics.sql
```

5. **Run the development server**
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

6. **Open the application**
Navigate to [http://localhost:3000](http://localhost:3000)

7. **Connect Kasware wallet**
- Install Kasware extension
- Create/import a wallet
- Click "Connect Wallet" in KaspaClash
- Switch to testnet-10 for development

---

<a id="project-structure"></a>
## Project Structure

```
KaspaClash/
├── public/                          # Static assets
│   ├── assets/
│   │   ├── audio/                   # Game sound effects & music (AI-generated)
│   │   └── icons/                   # Move type icons (punch, kick, block, special)
│   ├── cards/                       # Power Surge card images (15 cards)
│   ├── characters/                  # Character assets (AI-generated, 20 characters)
│   │   ├── cyber-ninja/
│   │   ├── dag-warrior/
│   │   ├── block-bruiser/
│   │   ├── hash-hunter/
│   │   └── ... (16 more)
│   │       ├── portrait.webp        # Character select portrait
│   │       ├── idle.webp            # Animation spritesheets
│   │       ├── punch.webp
│   │       ├── kick.webp
│   │       ├── block.webp
│   │       ├── special.webp
│   │       └── [other animations]
│   ├── icons/                       # PWA icons
│   ├── stickers/                    # In-game chat stickers (12 stickers)
│   ├── wasm/                        # Kaspa WASM binaries (bundled)
│   ├── manifest.json                # PWA manifest
│   └── sw.js                        # Service worker
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout with providers
│   │   ├── page.tsx                 # Landing page
│   │   ├── globals.css              # Global styles
│   │   ├── api/                     # API routes (serverless functions)
│   │   │   ├── achievements/        # Achievement system
│   │   │   │   ├── list/            # GET - Fetch all achievements
│   │   │   │   ├── progress/        # GET - Fetch progress
│   │   │   │   └── unlock/          # POST - Unlock achievement
│   │   │   ├── auth/
│   │   │   │   └── login/           # POST - Kaspa wallet signature auth
│   │   │   ├── battle-pass/
│   │   │   │   └── claim/           # POST - Claim tier rewards
│   │   │   ├── betting/             # PvP betting system
│   │   │   │   ├── claim/           # POST - Claim winnings
│   │   │   │   ├── history/         # GET - Bet history
│   │   │   │   ├── payout/[matchId]/ # POST - Process payouts
│   │   │   │   ├── place/           # POST - Place bet
│   │   │   │   └── pool/[matchId]/  # GET - Get betting pool
│   │   │   ├── bot-betting/         # Bot match betting system
│   │   │   │   ├── history/         # GET - Bot bet history
│   │   │   │   ├── payout/[matchId]/ # POST - Bot match payouts
│   │   │   │   ├── place/           # POST - Place bot bet
│   │   │   │   └── pool/[matchId]/  # GET - Bot betting pool
│   │   │   ├── bot-games/           # Bot match management
│   │   │   │   ├── route.ts         # GET/POST - Bot matches
│   │   │   │   └── sync/            # POST - Sync bot match state
│   │   │   ├── cron/                # Scheduled tasks
│   │   │   │   ├── bot-match-payout/ # Automated bot betting payouts
│   │   │   │   └── weekly-distribution/ # Treasury distribution
│   │   │   ├── currency/
│   │   │   │   └── [playerId]/      # GET - Player currency balance
│   │   │   ├── health/              # GET - Health check
│   │   │   ├── leaderboard/         # GET - Fetch rankings
│   │   │   ├── matches/             # Match management
│   │   │   │   ├── cleanup-abandoned/ # POST - Cleanup stale matches
│   │   │   │   ├── live/            # GET - Active matches list
│   │   │   │   └── [matchId]/       # Match-specific endpoints
│   │   │   │       ├── route.ts     # GET - Match details
│   │   │   │       ├── ban/         # POST - Ban character
│   │   │   │       ├── bot-auto-move/ # POST - Bot AI move
│   │   │   │       ├── disconnect/  # POST - Handle disconnect
│   │   │   │       ├── fight-state/ # GET - Real-time fight state
│   │   │   │       ├── forfeit/     # POST - Forfeit match
│   │   │   │       ├── move/        # POST - Submit move
│   │   │   │       ├── move-timeout/ # POST - Handle move timeout
│   │   │   │       ├── power-surge/ # POST - Select power surge card
│   │   │   │       ├── reject/      # POST - Reject match
│   │   │   │       ├── rounds/      # GET - Round history
│   │   │   │       ├── select/      # POST - Select character
│   │   │   │       ├── skip-stunned-turn/ # POST - Skip stunned turn
│   │   │   │       ├── submit-stunned-move/ # POST - Submit while stunned
│   │   │   │       ├── timeout/     # POST - Match timeout
│   │   │   │       └── verify/      # POST - Verify match state
│   │   │   ├── matchmaking/
│   │   │   │   ├── create-bot-match/ # POST - Create bot match
│   │   │   │   ├── queue/           # POST/DELETE - Join/leave queue
│   │   │   │   └── rooms/           # Private room management
│   │   │   │       ├── route.ts     # POST - Create room
│   │   │   │       ├── cancel/      # POST - Cancel room
│   │   │   │       ├── join/        # POST - Join room
│   │   │   │       └── stake/       # POST - Set room stake
│   │   │   ├── player/
│   │   │   │   └── characters/      # GET - Player's owned characters
│   │   │   ├── players/
│   │   │   │   └── [address]/       # Player profile endpoints
│   │   │   │       ├── route.ts     # GET - Player profile
│   │   │   │       ├── matches/     # GET - Match history
│   │   │   │       └── profile/     # PUT - Update profile
│   │   │   ├── progression/         # Battle Pass progression
│   │   │   │   ├── award-xp/        # POST - Award XP
│   │   │   │   ├── player/[address]/ # GET - Player progression
│   │   │   │   ├── prestige/        # POST - Execute prestige
│   │   │   │   ├── prestige-status/ # GET - Check eligibility
│   │   │   │   ├── season/          # GET - Current season info
│   │   │   │   └── unlock-tier/     # POST - Unlock tier
│   │   │   ├── quests/              # Daily quest system
│   │   │   │   ├── claim/           # POST - Claim quest rewards
│   │   │   │   ├── daily/           # GET - Fetch active quests
│   │   │   │   └── progress/        # POST - Update progress
│   │   │   ├── replay-data/         # GET - Match replay data
│   │   │   ├── shop/                # Cosmetic shop
│   │   │   │   ├── featured/        # GET - Weekly rotation
│   │   │   │   ├── inventory/       # GET - Fetch shop items
│   │   │   │   ├── nfts/            # NFT management
│   │   │   │   │   ├── route.ts     # GET - List NFTs
│   │   │   │   │   ├── player/[address]/ # GET - Player NFTs
│   │   │   │   │   └── verify/      # POST - Verify NFT
│   │   │   │   ├── purchase/        # POST - Process purchase
│   │   │   │   └── test-nft-mint/   # POST - Test NFT minting
│   │   │   ├── survival/            # Survival mode
│   │   │   │   ├── end/             # POST - Save results
│   │   │   │   ├── leaderboard/     # GET - Fetch rankings
│   │   │   │   ├── start/           # POST - Initialize run
│   │   │   │   └── status/          # GET - Current run status
│   │   │   ├── treasury/            # Treasury system
│   │   │   │   ├── balance/         # GET - Vault balance
│   │   │   │   ├── distribute/      # POST - Trigger distribution
│   │   │   │   └── distributions/   # GET - Distribution history
│   │   │   └── verify-mempool/      # POST - Verify mempool tx
│   │   │
│   │   ├── achievements/            # Achievement collection page
│   │   ├── battle-pass/             # Battle Pass progression page
│   │   ├── bet-history/             # Betting history page
│   │   ├── bot-bet-history/         # Bot betting history page
│   │   ├── docs/                    # In-app documentation
│   │   │   ├── layout.tsx           # Docs layout with sidebar
│   │   │   ├── page.tsx             # Docs landing page
│   │   │   └── [section]/[slug]/    # Dynamic docs routes
│   │   ├── fake/                    # Bot battle spectator page
│   │   ├── leaderboard/             # Leaderboard page
│   │   ├── m/[matchId]/             # Short URL for match sharing (with OG image)
│   │   ├── match/[matchId]/         # Full match page
│   │   ├── matchmaking/             # Matchmaking hub
│   │   ├── player/[address]/        # Player profile
│   │   ├── practice/                # Practice mode
│   │   ├── quests/                  # Daily quests page
│   │   ├── queue/                   # Queue waiting room
│   │   ├── replay/[matchId]/        # Match replay viewer
│   │   ├── shop/                    # Cosmetic shop page
│   │   ├── spectate/                # Live spectating
│   │   │   ├── [matchId]/           # PvP match spectator
│   │   │   └── bot/[matchId]/       # Bot match spectator
│   │   └── survival/                # Survival mode launcher
│   │
│   ├── components/                  # React components
│   │   ├── achievements/
│   │   │   ├── AchievementCard.tsx
│   │   │   ├── AchievementGrid.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── UnlockNotification.tsx
│   │   ├── betting/
│   │   │   ├── BettingPanel.tsx      # PvP betting UI
│   │   │   ├── BotBettingPanel.tsx   # Bot match betting UI
│   │   │   └── WinningNotification.tsx
│   │   ├── currency/
│   │   │   ├── ClashShardsDisplay.tsx
│   │   │   ├── ClashShardsIcon.tsx
│   │   │   └── TransactionHistory.tsx
│   │   ├── docs/                    # Documentation components
│   │   │   ├── DocsHeader.tsx
│   │   │   ├── DocsMobileNav.tsx
│   │   │   ├── DocsNavContent.tsx
│   │   │   ├── DocsSidebar.tsx
│   │   │   ├── MermaidDiagram.tsx
│   │   │   └── content/             # 15 doc content components
│   │   │       ├── DevAPI.tsx
│   │   │       ├── DevArchitecture.tsx
│   │   │       ├── DevBlockchain.tsx
│   │   │       ├── DevDatabase.tsx
│   │   │       ├── DevEngine.tsx
│   │   │       ├── DevGettingStarted.tsx
│   │   │       ├── DevRealtime.tsx
│   │   │       ├── GamersAchievements.tsx
│   │   │       ├── GamersBattlePass.tsx
│   │   │       ├── GamersBetting.tsx
│   │   │       ├── GamersMechanics.tsx
│   │   │       ├── GamersOverview.tsx
│   │   │       ├── GamersQuests.tsx
│   │   │       ├── GamersShop.tsx
│   │   │       └── GamersTreasury.tsx
│   │   ├── game/
│   │   │   └── MatchResults.tsx
│   │   ├── landing/
│   │   │   ├── DecorativeLine.tsx
│   │   │   ├── LandingHeader.tsx
│   │   │   └── LandingLayout.tsx
│   │   ├── layout/
│   │   │   ├── GameHeader.tsx
│   │   │   ├── GameLayout.tsx
│   │   │   └── GameSidebar.tsx
│   │   ├── leaderboard/
│   │   │   ├── LeaderboardTable.tsx
│   │   │   └── SurvivalLeaderboardTable.tsx
│   │   ├── matchmaking/
│   │   │   ├── BlockDAGVisualizer.tsx
│   │   │   ├── MatchmakingHUD.tsx
│   │   │   ├── MatchmakingQueue.tsx
│   │   │   ├── RoomCreate.tsx
│   │   │   ├── RoomJoin.tsx
│   │   │   └── StakeDeposit.tsx
│   │   ├── player/
│   │   │   ├── MatchHistory.tsx
│   │   │   ├── ProfileEditModal.tsx
│   │   │   └── ProfileHeaderClient.tsx
│   │   ├── practice/
│   │   │   ├── PracticeGameClient.tsx
│   │   │   ├── PracticeMenu.tsx
│   │   │   └── PracticeResults.tsx
│   │   ├── progression/
│   │   │   ├── BattlePassTiers.tsx
│   │   │   ├── PrestigeConfirmation.tsx
│   │   │   ├── TierUnlockModal.tsx
│   │   │   └── XPProgressBar.tsx
│   │   ├── providers/
│   │   │   └── WalletProvider.tsx
│   │   ├── quests/
│   │   │   ├── DailyQuestList.tsx
│   │   │   ├── QuestCard.tsx
│   │   │   └── QuestClaimButton.tsx
│   │   ├── share/
│   │   │   ├── ExportMP4Button.tsx
│   │   │   ├── ExportMP4Wrapper.tsx
│   │   │   ├── MatchSummary.tsx
│   │   │   ├── ShareMatchButton.tsx
│   │   │   └── TransactionTimeline.tsx
│   │   ├── shared/
│   │   │   └── NetworkModeIndicator.tsx
│   │   ├── shop/
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── CosmeticPreview.tsx
│   │   │   ├── PurchaseModal.tsx
│   │   │   └── ShopGrid.tsx
│   │   ├── spectate/
│   │   │   └── SpectatorChat.tsx
│   │   ├── survival/
│   │   │   ├── SurvivalGameClient.tsx
│   │   │   ├── SurvivalMenu.tsx
│   │   │   └── SurvivalResults.tsx
│   │   ├── tutorial/
│   │   │   └── TutorialOverlay.tsx
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── table.tsx
│   │   └── wallet/
│   │       ├── ConnectWalletButton.tsx
│   │       ├── WalletConnectModal.tsx
│   │       └── WalletInfo.tsx
│   │
│   ├── data/
│   │   └── characters.ts            # Character definitions & stats (20 characters)
│   │
│   ├── game/                        # Phaser game engine
│   │   ├── AudioKeys.ts             # Audio asset constants
│   │   ├── config.ts                # Phaser configuration
│   │   ├── EventBus.ts              # React <-> Phaser communication
│   │   ├── PhaserGame.tsx           # React wrapper component
│   │   ├── SceneManager.ts          # Scene lifecycle management
│   │   ├── combat/
│   │   │   ├── CharacterStats.ts    # Character-specific stats
│   │   │   ├── CombatEngine.ts      # Core combat resolution logic
│   │   │   ├── SurgeEffects.ts      # Power Surge card effect application
│   │   │   ├── types.ts             # Combat type definitions
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   └── sprite-config.ts     # Spritesheet frame definitions
│   │   ├── handlers/
│   │   │   └── RoundAnimationHandler.ts
│   │   ├── input/
│   │   │   └── TouchInput.ts        # Mobile touch controls
│   │   ├── managers/
│   │   │   ├── AchievementTracker.ts # In-game achievement tracking
│   │   │   └── ProgressionManager.ts # XP award management
│   │   ├── scenes/
│   │   │   ├── BotBattleScene.ts    # Bot-vs-bot spectator scene
│   │   │   ├── CharacterSelectScene.ts
│   │   │   ├── FakeScene.ts         # Fake bot battle scene
│   │   │   ├── FightScene.ts        # Main battle arena
│   │   │   ├── PracticeScene.ts
│   │   │   ├── ReplayScene.ts
│   │   │   ├── ResultsScene.ts
│   │   │   └── SurvivalScene.ts     # Survival mode scene
│   │   ├── sprites/
│   │   │   └── FighterSprite.ts     # Character sprite rendering
│   │   ├── ui/                      # In-game UI elements
│   │   │   ├── CharacterCard.ts
│   │   │   ├── ChatPanel.ts
│   │   │   ├── HealthBar.ts
│   │   │   ├── MobileControls.ts
│   │   │   ├── MoveButton.ts
│   │   │   ├── OfflinePowerSurgeCards.ts
│   │   │   ├── OpponentStatus.ts
│   │   │   ├── PowerSurgeCards.ts
│   │   │   ├── PowerSurgeCardView.ts
│   │   │   ├── RoundScore.ts
│   │   │   ├── RoundTimer.ts
│   │   │   ├── SelectionTimer.ts
│   │   │   ├── SpectatorPowerSurgeCards.ts
│   │   │   ├── StatsOverlay.ts
│   │   │   ├── StickerPicker.ts
│   │   │   ├── TextFactory.ts
│   │   │   ├── TransactionPrompt.ts
│   │   │   ├── TransactionToast.ts
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── asset-loader.ts      # Asset preloading utilities
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAbandonedMatchCleanup.ts
│   │   ├── useBettingPool.ts        # Betting state management
│   │   ├── useCurrencyRealtime.ts   # Real-time currency updates
│   │   ├── useGameChannel.ts        # Realtime game events
│   │   ├── useMatchmakingQueue.ts   # Queue management
│   │   ├── useOwnedCharacters.ts    # Character ownership
│   │   ├── useQuestProgress.ts      # Quest progress tracking
│   │   ├── useSpectatorChannel.ts   # Spectator mode events
│   │   ├── useSpectatorChat.ts      # Spectator chat hook
│   │   └── useWallet.ts             # Wallet connection state
│   │
│   ├── lib/                         # Core libraries
│   │   ├── utils.ts                 # Shared utilities (cn, etc.)
│   │   ├── video-recorder.ts        # MP4 replay recording
│   │   ├── achievements/
│   │   │   ├── achievement-definitions.ts
│   │   │   ├── achievement-evaluator.ts
│   │   │   ├── achievement-tracker.ts
│   │   │   └── player-stats-fetcher.ts
│   │   ├── api/                     # API utilities
│   │   │   ├── auth-middleware.ts    # Kaspa signature auth
│   │   │   ├── client.ts            # API client
│   │   │   ├── errors.ts            # Error handling
│   │   │   ├── middleware.ts        # Request middleware
│   │   │   ├── security-headers.ts  # Security headers
│   │   │   └── validators.ts        # Zod validators
│   │   ├── betting/
│   │   │   ├── betting-service.ts   # Odds calculation & pool management
│   │   │   ├── bot-payout-service.ts # Bot match payout processing
│   │   │   └── payout-service.ts    # PvP payout processing
│   │   ├── chat/
│   │   │   └── fake-chat-service.ts # Spectator fake chat generator
│   │   ├── cloudinary/
│   │   │   └── upload.ts            # Image upload for match sharing
│   │   ├── docs/
│   │   │   └── config.ts            # Documentation navigation config
│   │   ├── game/
│   │   │   ├── ai-difficulty.ts     # AI difficulty scaling
│   │   │   ├── ai-opponent.ts       # AI decision engine
│   │   │   ├── bot-match-lifecycle.ts # Bot match lifecycle
│   │   │   ├── bot-match-service.ts # Bot match management
│   │   │   ├── bot-move-helper.ts   # Bot move generation
│   │   │   ├── character-selection.ts # Ban/pick logic
│   │   │   ├── combat-resolver.ts   # Server-side combat resolution
│   │   │   ├── fight-state-service.ts # Fight state persistence
│   │   │   ├── move-service.ts      # Move validation & submission
│   │   │   ├── power-surge-service.ts # Power Surge card logic
│   │   │   ├── round-resolver.ts    # Round resolution engine
│   │   │   ├── smart-bot-opponent.ts # Smart bot AI
│   │   │   └── state-machine.ts     # Game state transitions
│   │   ├── kaspa/
│   │   │   ├── loader.ts            # WASM loader
│   │   │   ├── move-transaction.ts  # On-chain move storage
│   │   │   ├── nft-minter-client.ts # Client-side NFT minting
│   │   │   ├── nft-minter-server.ts # Server-side NFT verification
│   │   │   ├── nft-minter-wasm.ts   # WASM-based NFT minting
│   │   │   ├── nft-minter.ts        # NFT minting orchestrator
│   │   │   ├── vault-service.ts     # Treasury vault operations
│   │   │   ├── wallet-discovery.ts  # Wallet detection
│   │   │   └── wallet.ts            # Kaspa wallet integration
│   │   ├── leaderboard/
│   │   │   └── service.ts           # Ranking algorithms
│   │   ├── matchmaking/
│   │   │   └── matchmaker.ts        # Matchmaking logic
│   │   ├── player/
│   │   │   ├── match-history.ts     # Match history queries
│   │   │   └── registration.ts      # Player registration
│   │   ├── progression/
│   │   │   ├── currency-utils.ts    # Clash Shards utilities
│   │   │   ├── prestige-calculator.ts # Prestige multipliers
│   │   │   ├── prestige-cosmetics.ts # Prestige-exclusive cosmetics
│   │   │   ├── prestige-handler.ts  # Prestige reset logic
│   │   │   ├── season-manager.ts    # Season transitions
│   │   │   ├── tier-rewards.ts      # Reward distribution
│   │   │   └── xp-calculator.ts     # XP curve calculations
│   │   ├── quests/
│   │   │   ├── quest-generator.ts   # Daily quest selection
│   │   │   ├── quest-service.ts     # Quest CRUD operations
│   │   │   ├── quest-templates.ts   # Quest definitions
│   │   │   ├── quest-validator.ts   # Server-side validation
│   │   │   └── win-streak-service.ts # Win streak tracking
│   │   ├── rating/
│   │   │   └── elo.ts               # ELO rating system
│   │   ├── share/
│   │   │   ├── og-meta.ts           # OpenGraph metadata
│   │   │   └── url-builder.ts       # Share URL generation
│   │   ├── shop/
│   │   │   ├── purchase-handler.ts  # Transaction processing
│   │   │   ├── purchase-service.ts  # Purchase orchestration
│   │   │   ├── rotation-scheduler.ts # Weekly featured items
│   │   │   └── shop-inventory.ts    # Item catalog management
│   │   ├── supabase/
│   │   │   ├── broadcast.ts         # Realtime broadcast helpers
│   │   │   ├── client.ts            # Browser client
│   │   │   ├── query-utils.ts       # Query helpers
│   │   │   ├── server.ts            # Server-side client
│   │   │   └── types.ts             # Database types
│   │   ├── survival/
│   │   │   ├── leaderboard-updater.ts # Rank management
│   │   │   ├── score-calculator.ts  # Scoring formulas
│   │   │   └── wave-generator.ts    # AI difficulty scaling
│   │   ├── treasury/
│   │   │   └── treasury-service.ts  # Treasury distribution logic
│   │   └── utils/
│   │       ├── bot-detection.ts     # Bot detection helpers
│   │       ├── network-filter.ts    # Network-aware filtering
│   │       └── request-deduplication.ts # Request dedup
│   │
│   ├── stores/                      # Zustand state stores
│   │   ├── achievement-store.ts
│   │   ├── inventory-store.ts
│   │   ├── match-store.ts
│   │   ├── matchmaking-store.ts
│   │   ├── network-store.ts
│   │   ├── practice-store.ts
│   │   ├── progression-store.ts
│   │   ├── quest-store.ts
│   │   ├── shop-store.ts
│   │   ├── tutorial-store.ts
│   │   └── wallet-store.ts
│   │
│   ├── types/                       # TypeScript definitions
│   │   ├── achievement.ts
│   │   ├── api.ts
│   │   ├── blockchain.ts
│   │   ├── constants.ts
│   │   ├── cosmetic.ts
│   │   ├── database.ts
│   │   ├── fight-state.ts           # Fight state types
│   │   ├── index.ts                 # Core game types
│   │   ├── kaspa.ts
│   │   ├── kaspalib.d.ts
│   │   ├── power-surge.ts           # Power Surge card types
│   │   ├── progression.ts
│   │   ├── quest.ts
│   │   ├── supabase.ts              # Supabase generated types
│   │   └── websocket.ts
│   │
│   └── utils/
│       └── device.ts                # Device detection utilities
│
├── scripts/
│   ├── calc_frames.py               # Spritesheet frame calculator
│   ├── gen_sprite_config.py         # Sprite config generator
│   ├── test_frames.py               # Frame validation tests
│   └── frame_config.txt             # Frame configuration data
│
├── supabase/
│   └── migrations/
│       ├── current_schema.sql       # Full database schema (40+ tables)
│       └── 003_seed_cosmetics.sql   # Cosmetic item seed data
│
├── tests/                           # Vitest unit tests
│   ├── achievements.test.ts
│   ├── betting-service.test.ts
│   ├── character-stats.test.ts
│   ├── combat-engine.test.ts
│   ├── elo-rating.test.ts
│   ├── power-surge-cards.test.ts
│   ├── power-surge-types.test.ts
│   └── utils.test.ts
│
├── specs/                           # Project specifications
│   └── main/
│       ├── plan.md
│       ├── research.md
│       ├── spec.md
│       └── tasks.md
│
├── components.json                  # shadcn/ui configuration
├── eslint.config.mjs                # ESLint configuration
├── next.config.ts                   # Next.js configuration
├── package.json                     # Dependencies
├── postcss.config.mjs               # PostCSS configuration
├── vitest.config.ts                 # Vitest test configuration
└── tsconfig.json                    # TypeScript configuration
```

---

<a id="progression-system"></a>
## Progression System

### Battle Pass (50 Tiers)

KaspaClash features a comprehensive Battle Pass system with seasonal progression:

#### XP System
- **XP Sources:**
  - Match completion: Base XP + performance bonuses
  - Daily quests: 100-500 XP per quest
  - Achievements: 50-1000 XP per unlock
  - Survival mode: XP based on waves survived

- **XP Curve:** Hybrid exponential-linear progression
  - Early tiers (1-10): ~500-800 XP per tier
  - Mid tiers (11-30): ~800-1200 XP per tier
  - Late tiers (31-50): ~1200-2000 XP per tier

#### Tier Rewards
Each tier unlocks rewards including:
- **Clash Shards:** 50-500 shards per tier

#### Season System
- **Duration:** 8-12 weeks per season
- **Season Transition:** Automatic rollover with progress reset
- **Season History:** Track lifetime progress across all seasons

### Daily Quests

Complete 3 rotating daily objectives for bonus rewards:

#### Quest Difficulties
- **Easy (100 XP + 50 Shards):** Play 3 matches, deal 500 damage
- **Medium (250 XP + 100 Shards):** Win 2 matches, execute 5 combos
- **Hard (500 XP + 200 Shards):** Win 3 matches in a row, perfect block 10 times

#### Quest Features
- **Daily Reset:** Midnight UTC automatic refresh
- **Quest Pool:** 40+ unique quest templates across multiple categories
- **Progress Tracking:** Real-time progress updates via Supabase Realtime
- **Smart Generation:** Ensures variety with weighted random selection
- **Win Streak Tracking:** Dedicated service for streak-based quest objectives

### Achievement System

Unlock achievements across 5 categories with 5 tier levels:

#### Categories
1. **Combat:** Win streaks, perfect rounds, specific move mastery
2. **Progression:** Battle Pass milestones, prestige levels
3. **Social:** Matchmaking, spectating, betting
4. **Collection:** Cosmetic unlocks, shop purchases
5. **Mastery:** Character-specific challenges, advanced combos

#### Achievement Tiers
- **Bronze** -> **Silver** -> **Gold** -> **Platinum** -> **Diamond**

#### Achievement Rewards
- **XP Bonuses:** 50-1000 XP per achievement
- **Clash Shards:** 25-500 shards per achievement

### Prestige System

For dedicated players who reach tier 50:

#### Prestige Benefits
- **Permanent Bonuses:**
  - +10% XP multiplier per prestige level (stacks)
  - +5% Clash Shards earnings per prestige level
  - Exclusive prestige cosmetics at prestige levels 1, 5, 10

- **Visual Recognition:**
  - Prestige badge on profile with animated effects
  - Special nameplate borders and auras
  - Leaderboard prestige level display

#### Prestige Process
1. Reach Battle Pass tier 50
2. Option to prestige becomes available
3. Confirm reset (tier progress returns to 1, rewards retained)
4. Receive prestige badge + multipliers
5. Continue earning XP with enhanced bonuses

### Cosmetic Shop

Spend earned Clash Shards on customization:

#### Shop Categories
- **Characters:** 20 different characters with a variety of stats
- **Stickers:** Animated chat expressions for in-game use

#### Shop Features
- **Rarity Tiers:** Common, Rare, Epic, Legendary
- **Preview System:** View cosmetics before purchasing
- **Transaction History:** Track all Clash Shards spending
- **NFT Inscription:** Each purchase inscribes an NFT on-chain through payload

#### Pricing
- **Common:** 100-250 Shards
- **Rare:** 300-500 Shards
- **Epic:** 600-1000 Shards
- **Legendary:** 1200-2500 Shards

### Survival Mode

Endless wave-based challenge mode:

#### Gameplay
- **Wave System:** Fight progressively harder AI opponents
- **Difficulty Scaling:** +10% HP, +5% damage per wave
- **Milestone Bonuses:** Extra rewards every 5 waves
- **Leaderboard:** Top players by waves survived
- **Daily Play Limit:** Maximum 3 runs per day with anti-cheat session tracking

#### Rewards
- **XP Earned:** 50 XP per wave survived
- **Clash Shards:** 25 shards per wave + bonus for milestones
- **Exclusive Cosmetics:** Unlockable only through survival achievements

### Treasury System

A decentralized automated reward system powered by Kaspa:

#### Weekly Distribution
Every **Monday at 00:00 UTC**, the treasury automatically distributes accumulated funds from betting fees and cosmetic purchase fees to top players:

- **40% to Top 10 ELO Players:** Weighted distribution based on rank 
- **40% to Top 10 Survival Players:** Weighted distribution based on rank
- **20% to Project Wallet:** Supports ongoing development and operations
- **Minimum Reserve:** Always keeps at least 10 KAS in treasury for transaction fees

#### Distribution Weights
Rewards are distributed using a **rank-based weighted system** that favors higher placement:

| Rank | Share Weight | % of Pool (with 10 players) | % of Pool (with 2 players) |
|------|--------------|-----------------------------|-----------------------------|
| 1st  | 20 shares    | 20%                         | 55.6%                       |
| 2nd  | 16 shares    | 16%                         | 44.4%                       |
| 3rd  | 14 shares    | 14%                         | --                          |
| 4th  | 12 shares    | 12%                         | --                          |
| 5th  | 10 shares    | 10%                         | --                          |
| 6th  | 9 shares     | 9%                          | --                          |
| 7th  | 7 shares     | 7%                          | --                          |
| 8th  | 6 shares     | 6%                          | --                          |
| 9th  | 4 shares     | 4%                          | --                          |
| 10th | 2 shares     | 2%                          | --                          |

**Dynamic Scaling:** If fewer than 10 players are on a leaderboard, the shares are recalculated proportionally to ensure **100% of the pool is always distributed**. For example, with only 2 players, Rank 1 receives 55.6% and Rank 2 receives 44.4%.

#### Funding
- The treasury is funded by a **0.1% fee** on all betting pools and 1 KAS for each cosmetic purchase
- Funds are stored in a secure vault address
- Distributions are executed on-chain via chained batch transactions for reliability
- Balance snapshots are tracked for auditing

---

<a id="game-mechanics"></a>
## Game Mechanics

### Pre-Match Strategy

KaspaClash matches begin before the first punch is thrown. The selection phase tests your knowledge of the meta:

1.  **Ban Phase:**
    *   Players are presented with the full roster of 20 characters.
    *   Each player simultaneously selects one character to **BAN**.
    *   Banned characters cannot be picked by either player.
    *   *Bot Behavior:* Smart Bots will analyze your owned characters and strategically ban your highest-tier or most-played fighter.

2.  **Blind Pick Phase:**
    *   Players select their champion from the remaining pool.
    *   **Blind Selection:** You cannot see your opponent's choice until you lock in yours.
    *   This prevents "counter-picking" and forces players to rely on their main strategies.

### Combat System

KaspaClash uses a **turn-based combat engine** with simultaneous move submission:

#### Move Types
1. **Punch**
   - Base Damage: 10 (modified by character stats)
   - Energy Cost: 0 (free)
   - Priority: 3 (medium speed)
   - Beats: Special (stuns opponent)
   - Loses to: Block, Kick (staggers)

2. **Kick**
   - Base Damage: 15 (modified by character stats)
   - Energy Cost: 25
   - Priority: 2 (slow)
   - Beats: Punch (staggers), Block (reflects back at blocker)
   - Loses to: Special

3. **Block**
   - Damage: 0
   - Energy Cost: 0 (free)
   - Priority: 4 (fastest)
   - Effect: Reduces incoming damage by 50-65% (character-dependent), builds guard meter (+25)
   - Beats: Punch, Kick (reflects kick back)
   - Loses to: Special (guard shattered)

4. **Special**
   - Base Damage: 25 (modified by character stats)
   - Energy Cost: 42-62 (character-dependent, base 50)
   - Priority: 1 (very slow)
   - Effect: High damage, shatters blocks, but vulnerable to punches
   - Beats: Block (shatters guard), Kick
   - Loses to: Punch (gets stunned)

#### Energy & Guard System
- **Starting Energy:** 85-105 (character-dependent)
- **Max Energy:** 85-105 (character-dependent)
- **Regeneration:** +20 energy per turn (automatic for all characters)
- **Guard Meter:** 0-100, builds by +25 when blocking
- **Guard Break:** At 100 guard meter, player is stunned and meter resets to 0
- **Stun Effect:** Stunned players skip their next turn entirely (cannot act or defend)

#### Combat Resolution
Moves are resolved using a **resolution matrix**:
```
         Punch      Kick       Block      Special
Punch    Both Hit   Staggered  Blocked    Stuns Enemy
Kick     Hit        Both Hit   Reflected  Hit
Block    Guard      Guard      Nothing    Shattered
Special  Stunned    Hit        Shatter    Both Hit
```

**Key Interactions:**
- **Punch vs Special:** Punch user hits and stuns special user (special misses)
- **Kick vs Block:** Kick is reflected -- blocker guards, kicker takes self-damage
- **Special vs Block:** Special shatters guard, dealing full damage
- **Guard Break:** Reaching 100 guard meter stuns the player (resets to 0)

#### Round Structure
1. **Move Selection:** 20-second timer for both players to choose
2. **Validation:** Server validates moves and energy costs (insufficient energy = auto-block)
3. **Simultaneous Resolution:** CombatEngine resolves both moves using resolution matrix
4. **Damage Application:** HP reduced, energy spent, guard meter updated
5. **Effects Applied:** Stun, stagger, guard breaks applied for next turn
6. **Energy Regen:** Both players regenerate +20 energy (capped at max)
7. **Round End Check:** If either player reaches 0 HP, round ends
8. **Next Turn:** Repeat steps 1-7 until round ends

#### Victory Conditions
- **Round Victory:** First player to reduce opponent's HP to 0
- **Match Victory (Best of 3):** First to win 2 rounds
- **Double KO:** If both players reach 0 HP simultaneously, player with higher HP percentage wins
- **Timeout:** If move not submitted within 20 seconds, the match is cancelled
- **Disconnect:** If player disconnects for 30+ seconds, opponent wins by forfeit

### Power Surge Cards

At the start of each round, players are offered **3 randomly selected Power Surge cards** from a pool of 15 unique abilities. These powerful round-specific boosts add strategic depth and unpredictability to every match.

#### How It Works
1. **Card Selection:** Both players see the same 3 cards at the beginning of each round
2. **15-Second Window:** Players have 15 seconds to select one card or skip
3. **Blockchain Transaction:** Selecting a card costs **1 KAS** and must be confirmed in a block
4. **Synchronized Phase:** The game waits for BOTH players to complete their selections before starting the round timer
5. **Round Duration:** Card effects last for ONE round only
6. **Strategic Choice:** All 15 cards are balanced with trade-offs -- no "auto-pick" legendary cards

#### Card Catalog (15 Unique Cards)

Each card features balanced effects with strategic considerations:

| Card Name | Effect | Strategic Notes |
|-----------|--------|-----------------|
| **DAG Overclock** | +40% damage dealt | High risk, high reward damage boost |
| **Block Fortress** | Blocks reflect 120% damage | Punishes aggressive opponents severely |
| **Tx Storm** | +25 energy, lose 4 HP | Trade health for tactical resource advantage |
| **Mempool Congest** | Stun opponent (Costs 6 HP) | Pay HP to guarantee your turn goes first |
| **Blue Set Heal** | Restore 10 HP over time | Sustain and survival for close matches |
| **Orphan Smasher** | Counter deals +75% damage | Rewards high-skill prediction plays |
| **10BPS Barrage** | +20 energy regen on kick or punch | Continuous pressure without depletion |
| **Pruned Rage** | +30% damage, opponent can't block | Ultimate aggression with unblockable attacks |
| **Sompi Shield** | Take 45% less damage | Extreme damage mitigation for one round |
| **Hash Hurricane** | 35% chance to dodge attack | High-stakes RNG defensive maneuver |
| **GhostDAG** | Opponent loses 30 Energy every turn | Drain opponent resource to limit their options |
| **Finality Fist** | Special +70% dmg, costs +24 energy | Turn your special into a match-ender |
| **BPS Syphon** | Heal for 35% of damage dealt | Life-steal to swing health advantage |
| **Vaultbreaker** | Steal 50 energy on hit | Deprive opponent while boosting yourself |
| **Chainbreaker** | Bypass block, +15% damage | Bypass blocks completely |

#### Design Philosophy
- **No Tiers:** Unlike character rarities, all Power Surge cards are presented equally -- no "common" vs "legendary" visual hierarchy
- **Balanced Trade-offs:** Every card has strategic pros and cons (e.g., +damage but -defense, +energy but -HP)
- **Pre-computed Decks:** Cards are generated when the match starts and stored in the database to prevent race conditions
- **Synchronized Exit:** Both players remain on the selection screen until BOTH transactions confirm, ensuring fair simultaneous gameplay
- **Round-Only Duration:** Effects reset between rounds, preventing snowballing

#### Technical Implementation
Power Surge cards are fully integrated into the combat engine:
- Pre-computed deck stored in `matches.power_surge_deck` (JSONB column)
- Selection recorded in `power_surges` table with transaction IDs
- Combat engine applies effects via `SurgeEffects.ts` during damage calculation
- Real-time sync ensures both players see the same cards

### Counter & Tier System

#### The Triangle of Power
Combat revolves around a strict advantage system:
*   **Block** counters **Punch** (Reflects damage)
*   **Punch** counters **Special** (Interrupts & Stuns)
*   **Special** counters **Block** (Shatters Guard)
*   **Kick** acts as a wild-card, beating Punch but losing to Special.

#### Tier Scaling
Characters are minted with specific rarities that define their combat potential. Higher tiers are statistically superior but skill remains king:

| Tier | Stat Multiplier | Description |
| :--- | :---: | :--- |
| **Common** | 1.0x | Standard baseline stats. |
| **Uncommon** | 1.1x | Slight edge in Health and Energy. |
| **Rare** | 1.25x | Noticeable power increase. Enhanced counter-damage. |
| **Epic** | 1.5x | Powerful fighters with high HP pools. |
| **Legendary** | 2.0x | Boss-level stats. Require coordinated play to defeat. |

*Note: While Legendary characters hit harder, a "Counter Hit" (e.g. Punching a Special) deals massive bonus damage, allowing a skilled Common player to defeat a Legendary opponent through prediction.*

### Smart Bot Opponent

To ensure a seamless experience and zero waiting time, KaspaClash features a sophisticated AI decision engine:

- **Intelligent Decision Making:** The bot analyzes current health, energy, guard meters, and move history to choose the optimal strategy.
- **Realistic Matchmaking:** Bots are assigned names and ratings (+/-100 ELO of the player) to simulate a real competitive environment.
- **Failover Logic:** If you remain in the matchmaking queue for more than **30 seconds** without a human match, the system automatically transitions you into a bot match.
- **On-Chain Consistency:** Bot matches follow the same rules as PvP matches, with server-side settlement ensuring fair gameplay.
- **Difficulty Scaling:** AI difficulty adapts based on context via dedicated difficulty scaling logic.

---

<a id="kaspa-integration"></a>
## Kaspa Integration

### Real Blockchain Verification

**KaspaClash doesn't fake blockchain speed -- it proves it.**

Unlike most blockchain games that use "optimistic UI" (showing results immediately while transactions process in the background), KaspaClash **actually waits for on-chain confirmation** before each move executes:

```typescript
// src/lib/game/move-service.ts - Real implementation
export async function waitForBlockConfirmation(txId: string) {
  // 1. Check if transaction is in mempool (unconfirmed)
  const result = await checkBlockConfirmation(txId, network);

  if (result.confirmed) {
    // 2. Transaction confirmed in a block!
    console.log(`TX CONFIRMED in block after ${elapsed}ms`);
    return { confirmed: true };
  }

  // 3. Retry up to 12 times with 100ms delays (~1.2 seconds max)
  // Kaspa's 10 BPS means transactions confirm in ~1 second
}

// Called during move submission
const confirmStatus = await waitForBlockConfirmation(txId);
// Game WAITS here until blockchain confirms
// Only then does the round resolve
```

**This means:**
- Every punch, kick, and block is a real blockchain transaction
- The game literally pauses until Kaspa confirms the transaction
- Typical confirmation time: **~1 second** (showcasing Kaspa's 10 BPS)
- No optimistic UI tricks -- what you see is blockchain-verified reality

**Why this matters for Kaspathon judges:**
Most blockchain games sacrifice decentralization for speed by using optimistic updates. KaspaClash proves Kaspa is fast enough to be the source of truth WITHOUT compromising on true blockchain verification. This is only possible because of Kaspa's BlockDAG architecture and 10 blocks per second throughput.

### Wallet Connection

KaspaClash integrates with **Kasware wallet** for seamless blockchain interactions:

```typescript
// src/lib/kaspa/wallet.ts
import type { KaswareWallet } from "@/types/kaspa";

// Connect to Kasware
export async function connectWallet(): Promise<WalletConnection> {
  const kasware = window.kasware;
  const accounts = await kasware.requestAccounts();
  const address = accounts[0];
  const network = await kasware.getNetwork();

  return { address, network };
}

// Send KAS (for betting)
export async function sendKaspa(
  toAddress: string,
  amount: number // in sompi
): Promise<string> {
  const txId = await window.kasware.sendKaspa(toAddress, amount);
  return txId;
}
```

### Authentication

KaspaClash uses Kaspa wallet signatures for authentication instead of traditional username/password:

```typescript
// src/lib/api/auth-middleware.ts
// Uses kaspa-wasm verifyMessage to validate wallet signatures
// Session tokens stored in session_tokens table
```

### Transaction Flow

#### Move Submission with Block Confirmation
1. **User Action:** Player selects a move (Punch/Kick/Block)
2. **Wallet Prompt:** Kasware opens with 1 KAS transaction
3. **Broadcast:** User approves, wallet broadcasts to Kaspa network
4. **Verification Loop:** Game checks blockchain every 100ms
5. **Confirmation:** Transaction appears in block (~1 second with 10 BPS)
6. **Execution:** Round resolves only after blockchain confirms
7. **Combat:** Damage calculated and game state updates

#### Betting Transaction
1. **User Action:** Spectator clicks "Bet 10 KAS on Player 1"
2. **Wallet Prompt:** Kasware opens with pre-filled transaction
3. **Confirmation:** User approves in ~1 second
4. **Backend:** API receives tx_id, validates on blockchain
5. **Pool Update:** Bet amount added to pool, odds recalculated
6. **UI Update:** Live odds refresh via Realtime for all spectators

#### Key Advantages
- **Real Blockchain Speed:** Kaspa's 10 BPS (100ms blocks) enable ~1 second confirmations
- **No Optimistic UI:** Game waits for actual block inclusion before proceeding
- **No Gas Fees:** Kaspa's negligible transaction costs (~0.0001 KAS)
- **Network Security:** Proof-of-Work consensus without speed compromise
- **Scalability:** BlockDAG allows parallel block creation

### Testnet-10 and Mainnet Support

The game fully supports both **Kaspa testnet-10** and **mainnet**. The network is automatically detected from the connected wallet:

```typescript
// Automatically detected from wallet
const isTestnet = address.startsWith("kaspatest:");

// Use appropriate vault address
const vaultAddress = isTestnet
  ? process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET
  : process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET;
```

Development uses **testnet-10** for safety, while the production deployment supports mainnet for real KAS transactions.

### Blockchain Data Storage

While game state is managed in Supabase for performance, key assets and events are recorded on-chain:
- **Client-Side NFT Minting:** When purchasing cosmetics, users send 1 KAS to the treasury vault with KRC-721 NFT metadata embedded in the transaction payload.
- **On-Chain Metadata:** Each NFT transaction contains a JSON payload with the `KCLASH-NFT v1.0` protocol, including cosmetic details, rarity, and asset links.
- **Payment & Inscription:** The 1 KAS payment serves dual purpose -- funding the treasury while inscribing the NFT on-chain with immutable metadata.
- **Match creation transactions**
- **Final match results**
- **Betting pool resolutions**
- **Large payouts (>100 KAS)**

---

<a id="api-documentation"></a>
## API Documentation

All API routes are implemented as Next.js serverless functions under `src/app/api/`. Input validation is handled with Zod schemas.

### Authentication

Authentication uses Kaspa wallet signature verification via kaspa-wasm:

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "address": "kaspa:qz...",
  "message": "Sign in to KaspaClash",
  "signature": "base64-signature",
  "publicKey": "hex-public-key"
}
```

### Health Check

```
GET /api/health
```

Returns service status.

### Matchmaking Endpoints

#### POST `/api/matchmaking/queue`
Join the matchmaking queue. Validates Kaspa address and checks player rating for match pairing.

#### DELETE `/api/matchmaking/queue`
Leave the matchmaking queue.

#### POST `/api/matchmaking/create-bot-match`
Create a bot match when no human opponent is found within the timeout window.

#### POST `/api/matchmaking/rooms`
Create a private room.

#### POST `/api/matchmaking/rooms/join`
Join an existing private room by room code.

#### POST `/api/matchmaking/rooms/cancel`
Cancel a private room.

#### POST `/api/matchmaking/rooms/stake`
Set the KAS stake for a private room.

### Match Endpoints

#### GET `/api/matches/[matchId]`
Fetch match details and current state.

#### GET `/api/matches/live`
Fetch currently active matches (for spectator lobby).

#### POST `/api/matches/cleanup-abandoned`
Clean up stale/abandoned matches.

#### POST `/api/matches/[matchId]/ban`
Submit a character ban during the ban phase.

#### POST `/api/matches/[matchId]/select`
Submit a character selection during the pick phase.

#### POST `/api/matches/[matchId]/move`
Submit a move for the current turn.

**Request Body:**
```json
{
  "matchId": "uuid",
  "playerAddress": "kaspa:qz...",
  "move": "punch",
  "txId": "kaspa-transaction-hash"
}
```

#### GET `/api/matches/[matchId]/fight-state`
Get real-time fight state (health, energy, guard meter, round info, animations).

#### GET `/api/matches/[matchId]/rounds`
Get round history for a match.

#### POST `/api/matches/[matchId]/power-surge`
Select a Power Surge card for the current round.

#### POST `/api/matches/[matchId]/forfeit`
Forfeit the current match.

#### POST `/api/matches/[matchId]/disconnect`
Handle player disconnect.

#### POST `/api/matches/[matchId]/timeout`
Handle match timeout.

#### POST `/api/matches/[matchId]/move-timeout`
Handle move submission timeout.

#### POST `/api/matches/[matchId]/bot-auto-move`
Trigger bot AI move for bot matches.

#### POST `/api/matches/[matchId]/skip-stunned-turn`
Skip a stunned player's turn.

#### POST `/api/matches/[matchId]/submit-stunned-move`
Submit a move while the player is stunned.

#### POST `/api/matches/[matchId]/reject`
Reject a match invitation.

#### POST `/api/matches/[matchId]/verify`
Verify match state integrity.

### Betting Endpoints (PvP)

#### GET `/api/betting/pool/[matchId]`
Get current betting pool and odds.

**Response:**
```json
{
  "matchId": "uuid",
  "player1Total": "5000000000",
  "player2Total": "3000000000",
  "totalPool": "8000000000",
  "odds": {
    "player1": 1.6,
    "player2": 2.67
  },
  "status": "open"
}
```

#### POST `/api/betting/place`
Place a bet on a match. Minimum bet is 1 KAS (100,000,000 sompi).

**Request Body:**
```json
{
  "matchId": "uuid",
  "bettorAddress": "kaspa:qz...",
  "betOn": "player1",
  "amount": "1000000000",
  "txId": "transaction-hash"
}
```

#### POST `/api/betting/claim`
Claim winnings from a resolved bet.

#### GET `/api/betting/history`
Get betting history for a player.

#### POST `/api/betting/payout/[matchId]`
Process payouts for a resolved match.

### Bot Betting Endpoints

#### GET `/api/bot-betting/pool/[matchId]`
Get bot match betting pool.

#### POST `/api/bot-betting/place`
Place a bet on a bot match. Fixed 2x odds with 1% house fee.

#### POST `/api/bot-betting/payout/[matchId]`
Process payouts for a resolved bot match.

#### GET `/api/bot-betting/history`
Get bot betting history.

### Bot Games Endpoints

#### GET `/api/bot-games`
Fetch active bot matches.

#### POST `/api/bot-games`
Create a new bot match.

#### POST `/api/bot-games/sync`
Synchronize bot match state.

### Player Endpoints

#### GET `/api/players/[address]`
Fetch player profile including wins, losses, rating, and display name.

#### GET `/api/players/[address]/matches`
Fetch player match history.

#### PUT `/api/players/[address]/profile`
Update player profile (display name, avatar).

#### GET `/api/player/characters`
Fetch player's owned characters.

### Leaderboard Endpoints

#### GET `/api/leaderboard`
Fetch top players. Supports sorting by `rating`, `wins`, or `winRate`.

**Query Parameters:**
- `limit` - Number of results (default: 50)
- `sortBy` - Sort field: `rating`, `wins`, `winRate`

**Response:**
```json
{
  "entries": [
    {
      "rank": 1,
      "address": "kaspa:qz...",
      "displayName": "CyberNinja",
      "wins": 45,
      "losses": 12,
      "rating": 1850,
      "winRate": 0.789,
      "prestigeLevel": 2
    }
  ]
}
```

### Progression Endpoints

#### POST `/api/progression/award-xp`
Award XP to a player for match completion or other activities.

#### GET `/api/progression/player/[address]`
Get player's current progression state (tier, XP, prestige level).

#### POST `/api/progression/unlock-tier`
Unlock a battle pass tier and claim rewards.

#### POST `/api/progression/prestige`
Execute prestige for a player at tier 50.

#### GET `/api/progression/prestige-status`
Check prestige eligibility.

#### GET `/api/progression/season`
Get current season information.

### Quest Endpoints

#### GET `/api/quests/daily`
Fetch active daily quests for a player.

**Query Parameters:**
- `playerAddress` - Player's Kaspa wallet address

#### POST `/api/quests/claim`
Claim rewards for a completed quest.

#### POST `/api/quests/progress`
Update progress for a quest.

### Currency Endpoints

#### GET `/api/currency/[playerId]`
Fetch player's Clash Shards balance.

### Shop Endpoints

#### GET `/api/shop/inventory`
Fetch all available cosmetic items.

#### GET `/api/shop/featured`
Get weekly featured items.

#### POST `/api/shop/purchase`
Purchase a cosmetic item with Clash Shards. Triggers a 1 KAS NFT inscription transaction.

#### GET `/api/shop/nfts`
List all minted NFTs.

#### GET `/api/shop/nfts/player/[address]`
Get NFTs owned by a specific player.

#### POST `/api/shop/nfts/verify`
Verify an NFT's on-chain status.

#### POST `/api/shop/test-nft-mint`
Test NFT minting flow (development only).

### Achievement Endpoints

#### GET `/api/achievements/list`
Fetch all achievements and player progress.

**Query Parameters:**
- `playerAddress` - Player's Kaspa wallet address

#### GET `/api/achievements/progress`
Fetch achievement progress for a player.

#### POST `/api/achievements/unlock`
Unlock an achievement (server-validated).

### Battle Pass Endpoints

#### POST `/api/battle-pass/claim`
Claim a battle pass tier reward.

### Survival Endpoints

#### POST `/api/survival/start`
Initialize a survival mode run (max 3 daily plays, anti-cheat session tracking).

#### POST `/api/survival/end`
Save survival run results.

#### GET `/api/survival/leaderboard`
Fetch survival mode rankings.

#### GET `/api/survival/status`
Get current survival run status.

### Treasury Endpoints

#### GET `/api/treasury/balance`
Get treasury vault balance, KAS amount, and next distribution date.

#### POST `/api/treasury/distribute`
Trigger a treasury distribution (admin/cron).

#### GET `/api/treasury/distributions`
Get distribution history.

### Cron Endpoints

#### POST `/api/cron/bot-match-payout`
Automated cron job for processing bot match payouts.

#### POST `/api/cron/weekly-distribution`
Automated cron job for weekly treasury distributions.

### Replay Endpoints

#### GET `/api/replay-data`
Fetch match replay data for client-side replay rendering.

### Verification Endpoints

#### POST `/api/verify-mempool`
Verify a transaction exists in the Kaspa mempool.

---

<a id="database-schema"></a>
## Database Schema

The database is hosted on Supabase (PostgreSQL) with Row Level Security (RLS) policies. The full schema is defined in `supabase/migrations/current_schema.sql` containing **40+ tables**.

### Core Tables

#### `players`
```sql
CREATE TABLE players (
  address TEXT PRIMARY KEY,              -- Kaspa wallet address
  display_name TEXT,
  avatar_url TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 1000,           -- ELO rating (100-3000)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `matches`
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT UNIQUE,
  player1_address TEXT REFERENCES players(address),
  player2_address TEXT REFERENCES players(address),
  player1_character TEXT NOT NULL,
  player2_character TEXT NOT NULL,
  format TEXT DEFAULT 'best_of_3',        -- best_of_3 | best_of_5
  status TEXT DEFAULT 'waiting',          -- waiting | character_select | in_progress | completed | cancelled
  winner_address TEXT REFERENCES players(address),
  state JSONB NOT NULL,
  move_history JSONB[],
  power_surge_deck JSONB,                -- Pre-computed Power Surge card decks
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);
```

#### `rounds`
Stores per-round data with moves, damage, health, energy, guard meter, stun states, and animation phases.

#### `moves`
Individual move records (punch | kick | block | special | stunned).

#### `fight_state_snapshots`
Real-time fight state for live spectating: health, energy, guard meter, round data, animations.

### Betting Tables

#### `betting_pools`
```sql
CREATE TABLE betting_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID UNIQUE REFERENCES matches(id),
  player1_total BIGINT DEFAULT 0,
  player2_total BIGINT DEFAULT 0,
  total_pool BIGINT DEFAULT 0,
  total_fees BIGINT DEFAULT 0,
  status TEXT DEFAULT 'open',             -- open | locked | resolved | refunded
  winner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

#### `bets`
```sql
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID REFERENCES betting_pools(id),
  bettor_address TEXT REFERENCES players(address),
  bet_on TEXT NOT NULL,                   -- player1 | player2
  amount BIGINT NOT NULL,                 -- Min 100000000 (1 KAS)
  fee_paid BIGINT DEFAULT 0,
  net_amount BIGINT NOT NULL,
  tx_id TEXT UNIQUE NOT NULL,
  payout_amount BIGINT,
  payout_tx_id TEXT,
  status TEXT DEFAULT 'pending',          -- pending | confirmed | won | lost | refunded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);
```

#### `bot_betting_pools` / `bot_bets`
Mirrors the PvP betting tables but for automated bot-vs-bot matches.

#### `bot_matches`
Automated bot-vs-bot match records.

#### `bet_claim_attempts`
Audit trail for bet claim attempts (type: player | bot).

### Progression Tables

#### `battle_pass_seasons`
Season definitions with tier counts, start/end dates.

#### `battle_pass_tiers`
Tier rewards per season (XP requirements, shard/cosmetic rewards).

#### `player_progression`
Per-player seasonal progression: current XP, tier, prestige level, lifetime XP.

#### `player_currency`
Clash Shards balances.

#### `currency_transactions`
Full transaction ledger for all Clash Shards earned and spent.

#### `xp_awards`
XP award audit log.

### Quest Tables

#### `quest_templates`
Quest definitions with objective types: `win_matches`, `play_matches`, `deal_damage`, etc.

#### `daily_quests`
Player daily quest assignments with difficulty, progress tracking, and expiration.

#### `quest_statistics`
Quest completion statistics.

### Achievement Tables

#### `achievements`
Achievement definitions with categories (`combat`, `progression`, `social`, `collection`, `mastery`) and tiers (`bronze`, `silver`, `gold`, `platinum`, `diamond`).

#### `player_achievements`
Per-player achievement progress and unlock status.

#### `achievement_statistics`
Per-player achievement stats tracking.

### Shop & Cosmetics Tables

#### `cosmetic_items`
Shop items with categories (`character`, `sticker`, `victory_pose`, `profile_badge`, `profile_frame`) and rarities (`common`, `rare`, `epic`, `legendary`, `prestige`).

#### `player_inventory`
Owned cosmetics per player.

#### `player_loadouts`
Equipped cosmetics per character.

#### `cosmetic_nfts`
KRC-721 NFT minting records with on-chain transaction data.

#### `shop_purchases`
Purchase records.

#### `shop_rotations`
Weekly featured item rotations.

### Treasury Tables

#### `treasury_distributions`
Weekly distribution records.

#### `treasury_deposits`
Incoming deposit records.

#### `treasury_balance_snapshots`
Balance tracking snapshots for auditing.

#### `distribution_payouts`
Individual payout records per distribution.

### Security & Infrastructure Tables

#### `session_tokens`
Authentication session tokens.

#### `rate_limits`
API rate limiting records.

#### `security_audit_log`
Security event logging.

#### `matchmaking_queue`
Active matchmaking queue entries.

#### `blockchain_anchors`
On-chain data anchoring for leaderboard ranks, prestige levels, etc.

#### `verification_badges`
Blockchain verification badges.

### Additional Tables

#### `characters`
Character definitions stored in the database.

#### `power_surges`
Power Surge card selections per match/round with transaction IDs.

#### `survival_runs`
Survival mode run results.

#### `survival_sessions`
Anti-cheat session tracking for survival mode.

#### `survival_daily_plays`
Daily play limit tracking (max 3 per day).

### Realtime Channels

KaspaClash uses Supabase Realtime for live updates:

- **`matchmaking:queue`** - Queue updates, player counts
- **`game:${matchId}`** - Match events, round results, move submissions
- **`spectate:${matchId}`** - Spectator view, betting pool updates
- **`progression:${playerAddress}`** - XP gains, tier unlocks, quest progress
- **`quests:daily`** - Daily quest refresh notifications
- **`shop:featured`** - Weekly featured item rotation updates

---

<a id="development-guide"></a>
## Development Guide

### Local Development Workflow

1. **Start development server:**
```bash
npm run dev
```

2. **Access the app:**
- Main app: http://localhost:3000
- API routes: http://localhost:3000/api/*
- In-app docs: http://localhost:3000/docs

3. **Debugging:**
- Use React DevTools for component state
- Use Phaser DevTools for game scene debugging
- Check browser console for EventBus messages

### Key Development Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run Vitest in watch mode
npm run test:run     # Run all tests once

# Code Quality
npm run lint         # Run ESLint

# Database
npm run seed:cosmetics  # Seed cosmetic items
```

### Environment-Specific Behavior

**Development Mode:**
- Uses Kaspa testnet-10 by default
- Shows debug overlays in Phaser
- Verbose logging enabled
- Hot module replacement via Turbopack

**Production Mode:**
- Supports both testnet-10 and mainnet (auto-detected from wallet)
- Optimized bundles
- Error boundaries active

### Testing Game Mechanics

#### Practice Mode
Test combat without blockchain:
1. Navigate to `/practice`
2. Select character
3. Fight against AI
4. No wallet required

#### Matchmaking Testing
Requires two browser sessions:
1. Open two incognito windows
2. Connect different wallets
3. Both join queue simultaneously
4. Test match flow

#### Betting Testing
1. Start a match in one session
2. Open spectator view in another: `/spectate/[matchId]`
3. Connect wallet and place test bet
4. Verify transaction on Kaspa explorer

---

<a id="deployment"></a>
## Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub:**
```bash
git push origin main
```

2. **Connect to Vercel:**
- Visit [vercel.com](https://vercel.com)
- Import your repository
- Vercel auto-detects Next.js

3. **Set environment variables in Vercel dashboard:**
- All variables from `.env.local`
- Use Vercel's environment variable UI

4. **Deploy:**
```bash
vercel --prod
```

### Environment Variables Checklist

**Required for production:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET`
- `BETTING_VAULT_PRIVATE_KEY_MAINNET`
- `NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET`
- `BETTING_VAULT_PRIVATE_KEY_TESTNET`

**Recommended / optional:**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RELAYER_PRIVATE_KEY`
- `KASPA_RPC_URL`
- `KASPA_RPC_URL_TESTNET`
- `NODE_ENV`

### Cron Jobs

Configure the following cron jobs in your hosting platform:

- **Bot Match Payouts:** `POST /api/cron/bot-match-payout` -- processes pending bot match payouts
- **Weekly Distribution:** `POST /api/cron/weekly-distribution` -- triggers treasury distributions every Monday at 00:00 UTC

### Custom Domain Setup

In Vercel dashboard:
1. Go to Project Settings -> Domains
2. Add your domain 
3. Configure DNS records as instructed
4. Enable automatic HTTPS

### Performance Optimization

- **Image Optimization:** Next.js automatic image optimization
- **Code Splitting:** Automatic route-based splitting
- **Compression:** Gzip/Brotli enabled by default
- **Caching:** Static assets cached with CDN
- **WASM Loading:** Kaspa WASM loaded asynchronously
- **Turbopack:** Used in development for fast hot module replacement

---

<a id="ai-attribution"></a>
## AI Attribution

KaspaClash is an **AI-augmented development project**, demonstrating how modern engineering workflows can be supercharged by generative intelligence. By utilizing AI as a strategic "force multiplier," we have delivered a high-fidelity, blockchain-integrated experience that pushes the boundaries of solo development.

### Technical Stack & AI Integration

#### Engineering & Architecture
- **Claude 4.5 (Sonnet & Opus):** Acted as a lead architect for complex system design, Kaspa WASM integration, and real-time state management.
- **Gemini 3 Flash:** Utilized for rapid prototyping and ensuring idiomatic TypeScript patterns across the codebase.

#### Creative Direction & Assets
- **Ludo AI:** Generated the foundational visual library, including character sprites and UI components, which were then curated and integrated into the Phaser engine.
- **Suno AI & ElevenLabs:** Provided the high-fidelity audio landscape, from atmospheric background tracks to synthesized voice announcements.

### AI Disclosure Statement

In accordance with hackathon guidelines, AI tools were utilized to accelerate asset creation and assist in code generation. **The project's vision, core architecture, and critical blockchain integrations were driven by human oversight**, with every line of code reviewed and refined to meet production standards. KaspaClash stands as a testament to the synergy between human creativity and AI-powered productivity.

---

<a id="contributing"></a>
## Contributing

Contributions are welcome! KaspaClash is open source under the MIT License.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch:**
```bash
git checkout -b feature/amazing-feature
```

3. **Make your changes**
4. **Commit with descriptive messages:**
```bash
git commit -m "feat: Add tournament mode"
```

5. **Push to your fork:**
```bash
git push origin feature/amazing-feature
```

6. **Open a Pull Request**

### Development Guidelines

- **Code Style:** Follow existing TypeScript/React patterns
- **Naming:** Use descriptive names (no abbreviations)
- **Comments:** Document complex logic and game mechanics
- **Types:** Use TypeScript strictly, avoid `any`
- **Testing:** Test all game logic thoroughly with Vitest
- **Commits:** Use conventional commit messages

### Areas for Contribution

- New game modes (tournaments, teams, draft pick, combo challenge)
- Additional characters with unique abilities (currently 20 characters)
- Character customization & loadout system enhancements
- Blockchain verification for achievements & prestige levels
- Internationalization (i18n)
- Accessibility improvements
- Mobile UX enhancements
- Sound effect refinements
- Analytics and telemetry
- Test coverage expansion
- Additional documentation
- More cosmetic items and weekly featured rotations

---

<a id="license"></a>
## License

**MIT License**

Copyright (c) 2026 KaspaClash

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## Acknowledgments

- **Kaspa Community** - For building the fastest PoW blockchain
- **Kaspathon Organizers** - For hosting this incredible hackathon
- **Phaser Team** - For the amazing game engine
- **Supabase Team** - For the best PostgreSQL-as-a-Service platform
- **Vercel** - For seamless Next.js deployment
- **AI Community** - For tools that made this project possible

---

## Contact & Links

- **Live Demo:** [https://kaspaclash.vercel.app](https://kaspaclash.vercel.app)
- **GitHub:** [https://github.com/zaikaman/KaspaClash](https://github.com/zaikaman/KaspaClash)
- **Kaspathon:** [https://kaspathon.com](https://kaspathon.com)

---

## Built for Kaspathon 2026

This project was created for Kaspathon 2026, showcasing how Kaspa's lightning-fast block times enable entirely new categories of blockchain applications. KaspaClash proves that real-time gaming on a PoW blockchain isn't just possible -- it's practical, scalable, and fun.

---

<p align="center">
  <img src="https://img.shields.io/badge/Powered%20by-Kaspa-49D9D9?style=for-the-badge" alt="Powered by Kaspa" />
  <img src="https://img.shields.io/badge/Built%20with-AI-FF6B6B?style=for-the-badge" alt="Built with AI" />
</p>
