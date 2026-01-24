<div align="center">

# KaspaClash ⚔️

</div>

[![Built for Kaspathon 2026](https://img.shields.io/badge/Built%20for-Kaspathon%202026-00D9FF?style=for-the-badge)](https://kaspathon.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Phaser](https://img.shields.io/badge/Phaser-3.88-blueviolet?style=for-the-badge)](https://phaser.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Kaspa](https://img.shields.io/badge/Kaspa-Powered-49D9D9?style=for-the-badge)](https://kaspa.org)

> **A real-time blockchain-powered fighting game showcasing Kaspa's lightning-fast block times through competitive PvP combat, live betting, and on-chain matchmaking.**

![KaspaClash Banner](https://kaspaclash.vercel.app/logo.webp)

---

## 🎮 Table of Contents

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

## 🎯 Overview

**KaspaClash** is a competitive 1v1 turn-based fighting game that demonstrates the true power of Kaspa's BlockDAG architecture through real-time gameplay mechanics. Players connect their Kaspa wallets to compete in skill-based matches, bet on ongoing fights, climb the leaderboard, and experience blockchain gaming without the traditional latency constraints.

Built for the **Kaspathon 2026 hackathon** under the **Gaming & Interactive** track, KaspaClash leverages Kaspa's sub-second block times to create a seamless gaming experience where **every move you make is a real on-chain transaction** confirmed in sub-seconds—no waiting, no delays, just pure competitive action.

### 🏆 Hackathon Category
- **Primary Track:** Gaming & Interactive
- **Special Mentions Target:** Best UX/UI, Most Creative Use of Kaspa

---

## 💡 Why KaspaClash?

### The Problem
Traditional blockchain games suffer from:
- **Network Latency:** 10-60 second confirmation times make real-time gaming impossible
- **Poor UX:** Players must wait for transactions, breaking immersion
- **Limited Scalability:** High fees and slow throughput prevent mass adoption
- **Complex Onboarding:** Steep learning curves discourage casual gamers

### The Solution: Kaspa's Speed
KaspaClash demonstrates how Kaspa's BlockDAG architecture solves these problems:

- ⚡ **Instant Confirmations:** ~1 second block times enable real-time gameplay where **every single move is verified by a transaction**
- 🎲 **Live Betting:** Spectators can place bets that confirm before the next round
- 🔗 **On-Chain Everything:** All game state, matches, and transactions are blockchain-native
- 🎨 **Seamless UX:** Players experience gaming-first design with blockchain in the background
- 💰 **Low Fees:** Kaspa's efficiency keeps transaction costs negligible

---

## ✨ Key Features

### 🎮 Core Gameplay
- **Turn-Based Combat System:** Strategic rock-paper-scissors style fighting where **every move is a Kaspa transaction** confirmed in real-time
- **20 Unique Characters:** Diverse roster of fighters with unique stats and abilities
- **Multiple Game Modes:**
  - **Ranked Matchmaking:** ELO-based competitive queue with a **30-second failover to Smart Bots** to ensure near-instant entry into combat.
  - **Private Rooms:** 6-character room codes for custom matches
  - **Practice Mode:** Train against the Smart Bot AI in an offline environment.
  - **Survival Mode:** Endless wave-based challenge with escalating difficulty
  - **Spectator Mode:** Watch live matches with real-time betting
  - **Bot Battles:** 24/7 automated bot-vs-bot matches with betting support

### 🏆 Progression & Rewards
- **Battle Pass System:** Progress through 50 tiers by earning XP from matches and quests
- **Daily Quests:** Complete 3 rotating objectives daily (Easy/Medium/Hard difficulty)
- **Achievement System:** Unlock 60+ achievements across 5 categories (Combat, Mastery, Social, Collection, Milestones)
- **Prestige System:** Reset progression at tier 50 for permanent XP/currency multipliers and exclusive rewards
- **Clash Shards Currency:** Earn in-game currency from matches, quests, and achievements
- **Season System:** Seasonal battle pass content with unique rewards and progression resets

### 🛍️ Customization & Shop
- **Cosmetic Shop:** Browse and purchase skins, emotes, victory poses, and profile badges
- **Weekly Featured Rotation:** Special limited-time items with exclusive designs
- **Inventory Management:** Track owned cosmetics and transaction history
- **Currency Economy:** Spend Clash Shards earned from gameplay to unlock new cosmetics

### 🔗 Blockchain Features
- **Kaspa Wallet Integration:** Seamless connection via Kasware wallet
- **True On-Chain Combat:** Every Punch, Kick, and Block is a confirmed blockchain transaction, showcasing Kaspa's unmatched speed
- **Live Betting System:** Spectators can bet on match outcomes with instant confirmations
- **Bot Betting:** Bet on automated bot matches running 24/7 with fixed 2x odds and 1% house fee
- **On-Chain Leaderboard:** Transparent ranking system powered by ELO ratings
- **Match History:** All game results stored with blockchain verification
- **Transaction Verification:** Real-time bet confirmation and payout tracking
- **Automated Payouts:** Instant KAS payouts to winners via scheduled cron jobs
- **Treasury System:** Automated weekly KAS payouts to top leaderboard players

### 📹 Replay & Sharing
- **High-Quality MP4 Export:** Convert any match replay into a sharable video file directly in the browser
- **Silent Audio Capture:** Advanced audio routing captures full BGM and SFX without playing sound through speakers
- **Client-Side Processing:** No server costs or queues - renders locally using a hidden accelerated game instance
- **Smart Muxing:** Combines perfectly timed video frames with AAC-encoded audio for professional-quality results

### 💬 Social Features
- **Real-Time Chat:** Instant in-game messaging system for active matches
- **Quick Chat Presets:** One-tap communication tokens (GG, Nice!, GL HF, etc.)
- **Collapsible UI:** Unobtrusive chat panel with Floating Action Button (FAB) design
- **Spectator Isolation:** Secure channel separation ensures private player strategy

### 🎭 Live Spectator Chat
- **Real-Time Sync:** Instant message delivery to all spectators via Supabase Realtime
- **Dual Contexts:** Distinct commentary logic for **Bot Matches** (tech-themed) vs **Player Matches** (strategy-themed)
- **Automated Engagement:** Sophisticated fake message generator creates lively chat environments with:
- **Context Awareness:** Reacts to specific game events (big hits, blocks, crits) in real-time
- **Dynamic Personas:** 40+ realistic usernames with varying typing styles
- **Smart Variety:** 200+ unique message templates to prevent repetition
- **Premium UI:** Glassmorphic design with dynamic layout adjustment (compact during betting, full-height during match)

### 🎨 User Experience
- **Responsive Design:** Optimized for desktop, tablet, and mobile
- **Real-Time Updates:** Supabase Realtime for instant game state synchronization
- **Progressive Web App:** Installable with offline character previews
- **Smooth Animations:** Framer Motion + Phaser.js for fluid gameplay
- **Cyberpunk Aesthetic:** Neon-lit UI matching Kaspa's futuristic brand

---

## 🛠 Technology Stack

### Frontend
- **[Next.js 16.1](https://nextjs.org/)** - React framework with App Router and Server Components
- **[React 19.2](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript 5.0](https://www.typescriptlang.org/)** - Type-safe development
- **[Phaser 3.88](https://phaser.io/)** - HTML5 game engine for combat scenes
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[Framer Motion 12](https://www.framer.com/motion/)** - Advanced animation library
- **[Zustand 5.0](https://zustand-demo.pmnd.rs/)** - Lightweight state management

### Blockchain
- **[Kaspa WASM 0.13](https://github.com/kaspanet/rusty-kaspa)** - Core Kaspa SDK for wallet operations
- **[kaspalib 0.0.3](https://www.npmjs.com/package/kaspalib)** - Kaspa address utilities
- **[Kasware Wallet](https://kasware.xyz/)** - Browser wallet connection

### Backend
- **[Supabase](https://supabase.com/)** - PostgreSQL database with Row Level Security
- **[Supabase Realtime](https://supabase.com/realtime)** - WebSocket-based live updates
- **Next.js API Routes** - Serverless functions for game logic
- **[Cloudinary](https://cloudinary.com/)** - Match replay image generation

### Development Tools
- **[ESLint 9](https://eslint.org/)** - Code linting
- **[PostCSS](https://postcss.org/)** - CSS processing
- **Vercel** - Deployment platform (recommended)

---

## 🏗 Game Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Next.js    │  │   Phaser.js  │  │   Kaspa Wallet    │  │
│  │  React App   │  │  Game Engine │  │     (Kasware)     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬────────┘  │
│         │                 │                     │           │
│         └─────────────────┴─────────────────────┘           │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Supabase      │
                    │  Realtime      │
                    │  (WebSocket)   │
                    └───────┬────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                      Server (Next.js)                       │
├───────────────────────────┴─────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            API Routes (Serverless)                   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  • Matchmaking      • Match Management               │   │
│  │  • Betting          • Leaderboard                    │   │
│  │  • Player Profiles  • Game State Logic               │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│              ┌────────────────────────┐                     │
│              │  Supabase PostgreSQL   │                     │
│              │  (Database + RLS)      │                     │
│              └────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   Kaspa Blockchain      │
              │  (Transaction Layer)    │
              └─────────────────────────┘
```

### Data Flow

#### Match Flow
1. **Queue Join:** Player connects wallet → API validates → Supabase stores queue entry
2. **Matchmaking:** Server matches players by ELO. If no human opponent is found within **30 seconds**, the system automatically pairs the player with a **Smart Bot** to minimize wait times.
3. **Character Select:** Both players choose fighters → Broadcast selections → Lock when both ready (Bots select instantly)
4. **Combat Rounds:** 
   - Client submits moves via API
   - Server validates + resolves combat using deterministic engine
   - Results broadcast to both players + spectators
5. **Match End:** Winner determined → ELO updated → Results written to database

#### Betting Flow
1. **Pool Creation:** Match starts → Betting pool created → Open for bets
2. **Place Bet:** Spectator sends KAS to vault → API records bet with tx_id → Pool updated
3. **Lock Pool:** Match reaches final round → Pool locked → No more bets accepted
4. **Resolve:** Match ends → Payouts calculated using odds → Winners receive funds

#### Bot Betting Flow
1. **Match Creation:** Server generates bot vs bot match with pre-computed turns
2. **Betting Window:** 30-second window opens before match starts
3. **Place Bet:** Users bet on Bot 1 or Bot 2 (Fixed 2x Odds)
4. **House Fee:** 1% service fee deducted from bet amount
5. **Auto-Resolution:** Match plays out, winner determined automatically
6. **Instant Payout:** The system automatically triggers batch payouts from vault to winners

#### Chat Flow
1. **Send Message:** Player enters message or clicks quick chat
2. **Local Echo:** Message displays immediately for sender (optimistic UI)
3. **Broadcast:** Event sent to Supabase Realtime channel
4. **Receive:** Opponent receives broadcast → Deduplicates → Displays message

---

## 🚀 Getting Started

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

# Cloudinary (optional, for match replay images)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

4. **Set up Supabase database**

Run migrations in your Supabase SQL editor:
```bash
# Navigate to Supabase dashboard → SQL Editor → New Query
# Copy and execute files in order:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_rls_policies.sql
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
- Switch to testnet for development

---

## 📁 Project Structure

```
KaspaClash/
├── public/                          # Static assets
│   ├── assets/
│   │   ├── audio/                   # Game sound effects & music (AI-generated)
│   │   │   ├── 3-2-1-fight.mp3
│   │   │   ├── character-selection.mp3
│   │   │   ├── dojo.mp3
│   │   │   ├── victory.mp3
│   │   │   └── [character]-[move].mp3
│   │   └── icons/                   # PWA icons
│   ├── characters/                  # Character assets (AI-generated)
│   │   ├── cyber-ninja/
│   │   ├── dag-warrior/
│   │   ├── block-bruiser/
│   │   └── hash-hunter/
│   │       ├── portrait.webp        # Character select portrait
│   │       ├── idle.webp            # Animation spritesheets
│   │       ├── punch.webp
│   │       ├── kick.webp
│   │       ├── block.webp
│   │       ├── special.webp
│   │       └── [other animations]
│   ├── manifest.json                # PWA manifest
│   └── sw.js                        # Service worker
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── api/                     # API routes (serverless functions)
│   │   │   ├── achievements/        # Achievement system endpoints
│   │   │   │   ├── list/            # GET - Fetch all achievements
│   │   │   │   ├── unlock/          # POST - Unlock achievement
│   │   │   │   └── progress/        # GET - Fetch progress
│   │   │   ├── betting/             # Betting system endpoints
│   │   │   │   ├── place/           # POST - Place bet
│   │   │   │   ├── pool/            # GET - Get betting pool
│   │   │   │   └── payout/          # POST - Process payouts
│   │   │   ├── health/              # GET - Health check
│   │   │   ├── leaderboard/         # GET - Fetch rankings
│   │   │   ├── matches/             # Match management
│   │   │   │   ├── [matchId]/       # GET - Match details
│   │   │   │   ├── create/          # POST - Create match
│   │   │   │   ├── move/            # POST - Submit move
│   │   │   │   └── resolve/         # POST - Resolve round
│   │   │   ├── matchmaking/
│   │   │   │   ├── queue/           # POST - Join/leave queue
│   │   │   │   └── rooms/           # POST - Create/join private room
│   │   │   ├── players/
│   │   │   │   ├── [address]/       # GET - Player profile
│   │   │   │   └── create/          # POST - Create player
│   │   │   ├── progression/         # Battle Pass progression endpoints
│   │   │   │   ├── award-xp/        # POST - Award XP
│   │   │   │   ├── unlock-tier/     # POST - Unlock tier
│   │   │   │   ├── prestige/        # POST - Execute prestige
│   │   │   │   └── prestige-status/ # GET - Check eligibility
│   │   │   ├── quests/              # Daily quest system endpoints
│   │   │   │   ├── daily/           # GET - Fetch active quests
│   │   │   │   ├── claim/           # POST - Claim quest rewards
│   │   │   │   └── progress/        # POST - Update progress
│   │   │   ├── shop/                # Cosmetic shop endpoints
│   │   │   │   ├── inventory/       # GET - Fetch shop items
│   │   │   │   ├── purchase/        # POST - Process purchase
│   │   │   │   └── featured/        # GET - Weekly rotation
│   │   │   └── survival/            # Survival mode endpoints
│   │   │       ├── start/           # POST - Initialize run
│   │   │       ├── end/             # POST - Save results
│   │   │       └── leaderboard/     # GET - Fetch rankings
│   │   ├── achievements/
│   │   │   └── page.tsx             # Achievement collection screen
│   │   ├── battle-pass/
│   │   │   └── page.tsx             # Battle Pass progression screen
│   │   ├── leaderboard/
│   │   │   └── page.tsx             # Leaderboard page
│   │   ├── m/[matchId]/             # Short URL for matches
│   │   │   └── page.tsx
│   │   ├── match/[matchId]/         # Full match page
│   │   │   └── page.tsx
│   │   ├── matchmaking/
│   │   │   └── page.tsx             # Matchmaking hub
│   │   ├── player/[address]/        # Player profile
│   │   │   └── page.tsx
│   │   ├── practice/
│   │   │   └── page.tsx             # Practice mode
│   │   ├── quests/
│   │   │   └── page.tsx             # Daily quests screen
│   │   ├── queue/
│   │   │   └── page.tsx             # Queue waiting room
│   │   ├── replay/[matchId]/        # Match replay viewer
│   │   │   └── page.tsx
│   │   ├── shop/
│   │   │   └── page.tsx             # Cosmetic shop screen
│   │   ├── spectate/
│   │   │   ├── page.tsx             # Spectator lobby
│   │   │   └── [matchId]/           # Live spectate match
│   │   │       └── page.tsx
│   │   ├── survival/
│   │   │   └── page.tsx             # Survival mode launcher
│   │   ├── layout.tsx               # Root layout with providers
│   │   ├── page.tsx                 # Landing page
│   │   └── globals.css              # Global styles
│   │
│   ├── components/                  # React components
│   │   ├── achievements/
│   │   │   ├── AchievementCard.tsx  # Individual achievement display
│   │   │   ├── AchievementGrid.tsx  # Achievement collection grid
│   │   │   ├── ProgressBar.tsx      # Progress tracking
│   │   │   └── UnlockNotification.tsx # Achievement unlock popup
│   │   ├── betting/
│   │   │   └── BettingPanel.tsx     # Live betting UI for spectators
│   │   ├── currency/
│   │   │   ├── ClashShardsDisplay.tsx # Currency balance display
│   │   │   └── TransactionHistory.tsx # Earn/spend log
│   │   ├── game/
│   │   │   └── MatchResults.tsx     # Post-match results display
│   │   ├── landing/
│   │   │   ├── DecorativeLine.tsx   # Cyberpunk design elements
│   │   │   ├── LandingHeader.tsx
│   │   │   └── LandingLayout.tsx
│   │   ├── leaderboard/
│   │   │   └── LeaderboardTable.tsx
│   │   ├── matchmaking/
│   │   │   ├── MatchmakingQueue.tsx
│   │   │   ├── RoomCreate.tsx       # Private room creation
│   │   │   ├── RoomJoin.tsx         # Room code entry
│   │   │   └── StakeDeposit.tsx     # Optional match staking
│   │   ├── player/
│   │   │   ├── MatchHistory.tsx
│   │   │   ├── ProfileEditModal.tsx
│   │   │   └── ProfileHeaderClient.tsx
│   │   ├── practice/
│   │   │   ├── PracticeGameClient.tsx
│   │   │   ├── PracticeMenu.tsx
│   │   │   └── PracticeResults.tsx
│   │   ├── progression/
│   │   │   ├── BattlePassTiers.tsx  # 50-tier grid display
│   │   │   ├── PrestigeConfirmation.tsx # Prestige modal
│   │   │   ├── TierUnlockModal.tsx  # Tier unlock celebration
│   │   │   └── XPProgressBar.tsx    # Current tier progress
│   │   ├── providers/
│   │   │   └── WalletProvider.tsx   # Wallet context provider
│   │   ├── quests/
│   │   │   ├── DailyQuestList.tsx   # 3 active quests display
│   │   │   ├── QuestCard.tsx        # Individual quest card
│   │   │   └── QuestClaimButton.tsx # Claim rewards button
│   │   ├── share/
│   │   │   ├── MatchSummary.tsx
│   │   │   ├── ShareMatchButton.tsx
│   │   │   └── TransactionTimeline.tsx
│   │   ├── shared/
│   │   │   └── NetworkModeIndicator.tsx
│   │   ├── shop/
│   │   │   ├── CategoryFilter.tsx   # Shop category tabs
│   │   │   ├── CosmeticPreview.tsx  # Item preview modal
│   │   │   ├── PurchaseModal.tsx    # Purchase confirmation
│   │   │   └── ShopGrid.tsx         # Shop item grid
│   │   ├── survival/
│   │   │   ├── SurvivalLauncher.tsx # Mode selection screen
│   │   │   ├── SurvivalResults.tsx  # Post-run stats
│   │   │   └── WaveTransition.tsx   # Wave number display
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── table.tsx
│   │   └── wallet/
│   │       ├── ConnectWalletButton.tsx
│   │       ├── WalletConnectModal.tsx
│   │       └── WalletInfo.tsx
│   │
│   ├── data/
│   │   └── characters.ts            # Character definitions & stats
│   │
│   ├── game/                        # Phaser game engine
│   │   ├── combat/
│   │   │   ├── CombatEngine.ts      # Core combat resolution logic
│   │   │   ├── CharacterStats.ts    # Character-specific stats
│   │   │   ├── types.ts             # Combat type definitions
│   │   │   └── index.ts
│   │   ├── handlers/                # Event handlers
│   │   ├── input/                   # Input management
│   │   ├── managers/
│   │   │   ├── AchievementTracker.ts # In-game achievement tracking
│   │   │   └── ProgressionManager.ts # XP award management
│   │   ├── scenes/
│   │   │   ├── CharacterSelectScene.ts
│   │   │   ├── FightScene.ts        # Main battle arena (3485 lines)
│   │   │   ├── PracticeScene.ts
│   │   │   ├── ReplayScene.ts
│   │   │   ├── ResultsScene.ts
│   │   │   └── SurvivalScene.ts     # Survival mode scene
│   │   ├── sprites/                 # Sprite management
│   │   ├── ui/                      # In-game UI elements
│   │   ├── AudioKeys.ts             # Audio asset constants
│   │   ├── config.ts                # Phaser configuration
│   │   ├── EventBus.ts              # React ↔ Phaser communication
│   │   ├── PhaserGame.tsx           # React wrapper component
│   │   └── SceneManager.ts
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useBettingPool.ts        # Betting state management
│   │   ├── useGameChannel.ts        # Realtime game events (674 lines)
│   │   ├── useMatchmakingQueue.ts   # Queue management (407 lines)
│   │   ├── useQuestProgress.ts      # Quest progress tracking
│   │   ├── useSpectatorChannel.ts   # Spectator mode events
│   │   └── useWallet.ts             # Wallet connection state
│   │
│   ├── lib/                         # Core libraries
│   │   ├── achievements/
│   │   │   ├── achievement-definitions.ts # 80+ achievement configs
│   │   │   ├── achievement-evaluator.ts # Completion checking
│   │   │   └── achievement-tracker.ts # Progress tracking
│   │   ├── api/                     # API client utilities
│   │   ├── betting/
│   │   │   ├── betting-service.ts   # Odds calculation & payouts (422 lines)
│   │   │   └── payout-service.ts
│   │   ├── cloudinary/              # Image generation for match replays
│   │   ├── game/
│   │   │   └── state-machine.ts     # Game state transitions (368 lines)
│   │   ├── kaspa/
│   │   │   ├── wallet.ts            # Kaspa wallet integration (407 lines)
│   │   │   ├── wallet-discovery.ts
│   │   │   ├── move-transaction.ts  # Optional on-chain move storage
│   │   │   └── loader.ts
│   │   ├── leaderboard/             # Ranking algorithms
│   │   ├── matchmaking/             # Matchmaking logic
│   │   ├── player/                  # Player management
│   │   ├── progression/
│   │   │   ├── currency-utils.ts    # Clash Shards utilities
│   │   │   ├── prestige-calculator.ts # Prestige multipliers
│   │   │   ├── prestige-handler.ts  # Prestige reset logic
│   │   │   ├── season-manager.ts    # Season transitions
│   │   │   ├── tier-rewards.ts      # Reward distribution
│   │   │   └── xp-calculator.ts     # XP curve calculations
│   │   ├── quests/
│   │   │   ├── quest-generator.ts   # Daily quest selection
│   │   │   ├── quest-templates.ts   # 40+ quest definitions
│   │   │   └── quest-validator.ts   # Server-side validation
│   │   ├── rating/                  # ELO rating system
│   │   ├── share/                   # Social sharing utilities
│   │   ├── shop/
│   │   │   ├── purchase-handler.ts  # Transaction processing
│   │   │   ├── rotation-scheduler.ts # Weekly featured items
│   │   │   └── shop-inventory.ts    # Item catalog management
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser client
│   │   │   └── types.ts             # Generated database types
│   │   ├── survival/
│   │   │   ├── leaderboard-updater.ts # Rank management
│   │   │   ├── score-calculator.ts  # Scoring formulas
│   │   │   └── wave-generator.ts    # AI difficulty scaling
│   │   └── utils.ts                 # Shared utilities
│   │
│   ├── stores/                      # Zustand state stores
│   │   ├── achievement-store.ts     # Achievement state
│   │   ├── inventory-store.ts       # Cosmetic inventory
│   │   ├── match-store.ts           # Match state
│   │   ├── matchmaking-store.ts     # Queue state
│   │   ├── network-store.ts         # Network status
│   │   ├── practice-store.ts        # Practice mode state
│   │   ├── progression-store.ts     # Battle Pass state
│   │   ├── quest-store.ts           # Quest state
│   │   ├── shop-store.ts            # Shop state
│   │   └── wallet-store.ts          # Wallet state (167 lines)
│   │
│   └── types/                       # TypeScript definitions
│       ├── achievement.ts           # Achievement types
│       ├── api.ts                   # API response types
│       ├── blockchain.ts            # Blockchain anchor types
│       ├── constants.ts             # Game constants
│       ├── cosmetic.ts              # Cosmetic item types
│       ├── database.ts              # Database types
│       ├── index.ts                 # Core game types (255 lines)
│       ├── kaspa.ts                 # Kaspa SDK types
│       ├── kaspalib.d.ts            # kaspalib type declarations
│       ├── progression.ts           # Progression types
│       ├── quest.ts                 # Quest types
│       └── websocket.ts             # Realtime event types
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql   # Core database schema (128 lines)
│       ├── 002_rls_policies.sql     # Row Level Security policies
│       ├── 020_battle_pass_schema.sql # Battle Pass tables
│       ├── 021_quests_schema.sql    # Daily quest tables
│       ├── 022_cosmetics_shop.sql   # Shop & inventory tables
│       ├── 023_achievements_schema.sql # Achievement tables
│       ├── 024_blockchain_anchors.sql # Blockchain verification
│       ├── 025_rls_progression.sql  # Progression RLS policies
│       ├── 026_rls_quests.sql       # Quest RLS policies
│       ├── 027_rls_cosmetics.sql    # Cosmetics RLS policies
│       ├── 028_rls_achievements.sql # Achievement RLS policies
│       └── 029_indexes.sql          # Performance indexes
│
├── components.json                  # shadcn/ui configuration
├── eslint.config.mjs                # ESLint configuration
├── next.config.ts                   # Next.js configuration
├── package.json                     # Dependencies
├── postcss.config.mjs               # PostCSS configuration
├── tailwind.config.ts               # Tailwind CSS configuration
└── tsconfig.json                    # TypeScript configuration
```

---

## 🏆 Progression System

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
- **Cosmetics:** Skins, emotes, victory poses, badges
- **Milestone Rewards:** Special items at tiers 10, 25, 50

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

### Achievement System

Unlock 80+ achievements across 5 categories:

#### Categories
1. **Combat (25 achievements):** Win streaks, perfect rounds, specific move mastery
2. **Mastery (20 achievements):** Character-specific challenges, advanced combos
3. **Social (15 achievements):** Matchmaking, spectating, betting
4. **Collection (10 achievements):** Cosmetic unlocks, shop purchases
5. **Milestones (10 achievements):** Prestige levels, total matches, lifetime stats

#### Achievement Rewards
- **XP Bonuses:** 50-1000 XP per achievement
- **Clash Shards:** 25-500 shards per achievement
- **Cosmetic Unlocks:** Exclusive badges and profile frames
- **Mastery Badges:** Complete all achievements in a category for special rewards

### Prestige System

For dedicated players who reach tier 50:

#### Prestige Benefits
- **Permanent Bonuses:**
  - +10% XP multiplier per prestige level (stacks)
  - +5% Clash Shards earnings per prestige level
  - Exclusive cosmetic rewards at prestige levels 1, 5, 10
  
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
- **Skins:** Character-specific alternate appearances
- **Emotes:** Animated expressions for pre/post-match
- **Victory Poses:** Special animations for match victories
- **Profile Badges:** Decorative profile customization

#### Shop Features
- **Weekly Featured Rotation:** 4-6 limited-time exclusive items
- **Rarity Tiers:** Common, Rare, Epic, Legendary
- **Preview System:** View cosmetics before purchasing
- **Transaction History:** Track all Clash Shards spending

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
- **Leaderboard:** Top 100 players by waves survived

#### Rewards
- **XP Earned:** 50 XP per wave survived
- **Clash Shards:** 25 shards per wave + bonus for milestones
- **Exclusive Cosmetics:** Unlockable only through survival achievements

### Treasury System

A decentralized automated reward system powered by Kaspa:

#### Weekly Distribution
Every **Monday at 00:00 UTC**, the treasury automatically distributes accumulated funds from betting fees and cosmetics buying fees to top players:

- **40% to Top 10 ELO Players:** Reward for competitive excellence.
- **40% to Top 10 Survival Players:** Reward for PvE mastery.
- **20% Reserve:** Retained for future prize pools and development.

#### Funding
- The treasury is funded by a **0.1% fee** on all betting pools and 1 KAS for each cosmetics purchase.
- Funds are stored in a secure vault address.
- Distributions are executed on-chain via chained batch transactions for reliability.

---

## 🎲 Game Mechanics

### Combat System

KaspaClash uses a **turn-based combat engine** with simultaneous move submission:

#### Move Types
1. **Punch** 🥊
   - Base Damage: 10 (modified by character stats)
   - Energy Cost: 0 (free)
   - Priority: 3 (medium speed)
   - Beats: Special (stuns opponent)
   - Loses to: Block, Kick (staggers)

2. **Kick** 🦵
   - Base Damage: 15 (modified by character stats)
   - Energy Cost: 25
   - Priority: 2 (slow)
   - Beats: Punch (staggers), Block (reflects back at blocker)
   - Loses to: Special

3. **Block** 🛡️
   - Damage: 0
   - Energy Cost: 0 (free)
   - Priority: 4 (fastest)
   - Effect: Reduces incoming damage by 50-65% (character-dependent), builds guard meter (+25)
   - Beats: Punch, Kick (reflects kick back)
   - Loses to: Special (guard shattered)

4. **Special** ⚡
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
- **Kick vs Block:** Kick is reflected - blocker guards, kicker takes self-damage
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
- **Match Victory (Best of 5):** First to win 3 rounds
- **Double KO:** If both players reach 0 HP simultaneously, player with higher HP percentage wins
- **Timeout:** If move not submitted within 20 seconds, the match is cancelled
- **Disconnect:** If player disconnects for 30+ seconds, opponent wins by forfeit

### Smart Bot Opponent

To ensure a seamless experience and zero waiting time, KaspaClash features a sophisticated AI decision engine:

- **Intelligent Decision Making:** The bot analyzes current health, energy, guard meters, and move history to choose the optimal strategy.
- **Realistic Matchmaking:** Bots are assigned names and ratings (±100 ELO of the player) to simulate a real competitive environment.
- **Failover Logic:** If you remain in the matchmaking queue for more than **30 seconds** without a human match, the system automatically transitions you into a bot match.
- **On-Chain Consistency:** Bot matches follow the same rules as PvP matches, with server-side settlement ensuring fair gameplay.

---

## 🔗 Kaspa Integration

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

### Transaction Flow

#### Betting Transaction
1. **User Action:** Spectator clicks "Bet 10 KAS on Player 1"
2. **Wallet Prompt:** Kasware opens with pre-filled transaction
3. **Confirmation:** User approves in ~1 second
4. **Backend:** API receives tx_id, validates on blockchain
5. **Pool Update:** Bet amount added to pool, odds recalculated
6. **UI Update:** Live odds refresh via Realtime for all spectators

#### Key Advantages
- **No Gas Fees:** Kaspa's negligible transaction costs (~0.0001 KAS)
- **Instant Confirmations:** 1-second block times = real-time updates
- **Network Security:** Proof-of-Work consensus without speed compromise
- **Scalability:** BlockDAG allows parallel block creation

### Testnet vs Mainnet

Development uses **Kaspa testnet** for safety:
```typescript
// Automatically detected from wallet
const isTestnet = address.startsWith("kaspatest:");

// Use appropriate vault address
const vaultAddress = isTestnet
  ? process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET
  : process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET;
```

### Blockchain Data Storage

While game state is managed in Supabase for performance, key events are **optionally** anchored on-chain:
- Match creation transactions
- Final match results
- Betting pool resolutions
- Large payouts (>100 KAS)

---

## 📡 API Documentation

### Authentication
All protected endpoints require wallet signature verification:
```typescript
// Example header
Authorization: Bearer <wallet-signed-message>
```

### Matchmaking Endpoints

#### POST `/api/matchmaking/queue`
Join or leave the matchmaking queue.

**Request Body:**
```json
{
  "action": "join" | "leave",
  "playerAddress": "kaspa:qz...",
  "characterId": "cyber-ninja"
}
```

**Response:**
```json
{
  "success": true,
  "queueSize": 5,
  "estimatedWait": 30
}
```

#### POST `/api/matchmaking/rooms`
Create or join a private room.

**Request Body:**
```json
{
  "action": "create" | "join",
  "playerAddress": "kaspa:qz...",
  "roomCode": "ABC123", // for join
  "characterId": "dag-warrior"
}
```

### Match Endpoints

#### GET `/api/matches/[matchId]`
Fetch match details and current state.

**Response:**
```json
{
  "id": "uuid",
  "player1Address": "kaspa:qz...",
  "player2Address": "kaspa:qz...",
  "player1Character": "cyber-ninja",
  "player2Character": "block-bruiser",
  "status": "in_progress",
  "currentRound": 2,
  "player1RoundsWon": 1,
  "player2RoundsWon": 0,
  "state": {
    "player1Health": 75,
    "player2Health": 60,
    "player1Energy": 80,
    "player2Energy": 50
  }
}
```

#### POST `/api/matches/move`
Submit a move for the current round.

**Request Body:**
```json
{
  "matchId": "uuid",
  "playerAddress": "kaspa:qz...",
  "move": "punch" | "kick" | "block" | "special"
}
```

### Betting Endpoints

#### GET `/api/betting/pool?matchId=uuid`
Get current betting pool and odds.

**Response:**
```json
{
  "matchId": "uuid",
  "player1Total": "5000000000", // sompi
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
Place a bet on a match.

**Request Body:**
```json
{
  "matchId": "uuid",
  "bettorAddress": "kaspa:qz...",
  "betOn": "player1" | "player2",
  "amount": "1000000000", // sompi
  "txId": "transaction-hash"
}
```

### Leaderboard Endpoints

#### GET `/api/leaderboard?limit=50&sortBy=rating`
Fetch top players.

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

**Request Body:**
```json
{
  "playerAddress": "kaspa:qz...",
  "xpAmount": 150,
  "source": "match_completion"
}
```

**Response:**
```json
{
  "success": true,
  "newXp": 2350,
  "currentTier": 15,
  "tierUnlocked": false,
  "prestigeMultiplier": 1.2
}
```

#### POST `/api/progression/unlock-tier`
Unlock a battle pass tier and claim rewards.

**Request Body:**
```json
{
  "playerAddress": "kaspa:qz...",
  "tierNumber": 16
}
```

**Response:**
```json
{
  "success": true,
  "rewards": {
    "clashShards": 150,
    "cosmetics": ["skin_cyber_ninja_02"]
  }
}
```

#### POST `/api/progression/prestige`
Execute prestige for a player at tier 50.

**Request Body:**
```json
{
  "playerAddress": "kaspa:qz..."
}
```

**Response:**
```json
{
  "success": true,
  "prestigeLevel": 3,
  "bonuses": {
    "xpMultiplier": 1.3,
    "shardMultiplier": 1.15
  },
  "rewards": ["prestige_badge_03", "prestige_aura_gold"]
}
```

### Quest Endpoints

#### GET `/api/quests/daily?playerAddress=kaspa:qz...`
Fetch active daily quests for a player.

**Response:**
```json
{
  "quests": [
    {
      "id": "uuid",
      "difficulty": "easy",
      "description": "Play 3 matches",
      "objectiveType": "play_matches",
      "targetValue": 3,
      "currentProgress": 1,
      "xpReward": 100,
      "shardReward": 50,
      "isCompleted": false,
      "isClaimed": false,
      "expiresAt": "2026-01-16T00:00:00Z"
    }
  ]
}
```

#### POST `/api/quests/claim`
Claim rewards for a completed quest.

**Request Body:**
```json
{
  "playerAddress": "kaspa:qz...",
  "questId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "rewards": {
    "xp": 100,
    "clashShards": 50
  }
}
```

#### POST `/api/quests/progress`
Update progress for a quest.

**Request Body:**
```json
{
  "playerAddress": "kaspa:qz...",
  "questId": "uuid",
  "progressIncrement": 1
}
```

### Shop Endpoints

#### GET `/api/shop/inventory`
Fetch all available cosmetic items.

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "itemId": "skin_dag_warrior_02",
      "name": "DAG Warrior Neon Skin",
      "type": "skin",
      "rarity": "epic",
      "price": 800,
      "isFeatured": false,
      "characterId": "dag-warrior",
      "previewUrl": "https://...",
      "thumbnailUrl": "https://..."
    }
  ]
}
```

#### POST `/api/shop/purchase`
Purchase a cosmetic item with Clash Shards.

**Request Body:**
```json
{
  "playerAddress": "kaspa:qz...",
  "cosmeticId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "item": {
    "itemId": "skin_dag_warrior_02",
    "name": "DAG Warrior Neon Skin"
  },
  "remainingShards": 2450
}
```

#### GET `/api/shop/featured`
Get weekly featured items.

**Response:**
```json
{
  "featured": [
    {
      "itemId": "emote_legendary_taunt",
      "name": "Legendary Taunt",
      "type": "emote",
      "rarity": "legendary",
      "price": 2000,
      "endsAt": "2026-01-22T00:00:00Z"
    }
  ]
}
```

### Achievement Endpoints

#### GET `/api/achievements/list?playerAddress=kaspa:qz...`
Fetch all achievements and player progress.

**Response:**
```json
{
  "achievements": [
    {
      "id": "uuid",
      "achievementId": "win_10_matches",
      "name": "Veteran Fighter",
      "description": "Win 10 ranked matches",
      "category": "combat",
      "requirementType": "win_matches",
      "requirementValue": 10,
      "xpReward": 200,
      "shardReward": 100,
      "progress": 7,
      "isUnlocked": false
    }
  ]
}
```

#### POST `/api/achievements/unlock`
Unlock an achievement (server-validated).

**Request Body:**
```json
{
  "playerAddress": "kaspa:qz...",
  "achievementId": "win_10_matches"
}
```

**Response:**
```json
{
  "success": true,
  "achievement": {
    "name": "Veteran Fighter",
    "xpReward": 200,
    "shardReward": 100,
    "cosmeticReward": "badge_veteran"
  }
}
```

### Survival Endpoints

#### POST `/api/survival/start`
Initialize a survival mode run.

**Request Body:**
```json
{
  "playerAddress": "kaspa:qz...",
  "characterId": "cyber-ninja"
}
```

**Response:**
```json
{
  "success": true,
  "runId": "uuid",
  "startingWave": 1
}
```

#### POST `/api/survival/end`
Save survival run results.

**Request Body:**
```json
{
  "playerAddress": "kaspa:qz...",
  "runId": "uuid",
  "wavesSurvived": 23,
  "finalScore": 5640
}
```

**Response:**
```json
{
  "success": true,
  "rewards": {
    "xp": 1150,
    "clashShards": 575
  },
  "leaderboardRank": 42
}
```

#### GET `/api/survival/leaderboard?limit=100`
Fetch survival mode rankings.

**Response:**
```json
{
  "entries": [
    {
      "rank": 1,
      "playerAddress": "kaspa:qz...",
      "displayName": "SurvivalKing",
      "wavesSurvived": 47,
      "score": 12850,
      "characterUsed": "block-bruiser"
    }
  ]
}
```

---

## 🗄 Database Schema

### Core Tables

#### `players`
```sql
CREATE TABLE players (
  address TEXT PRIMARY KEY,              -- Kaspa wallet address
  display_name TEXT,                     -- Username
  avatar_url TEXT,                       -- Cloudinary URL
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 1000,           -- ELO rating
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `matches`
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT UNIQUE,                 -- 6-character code
  player1_address TEXT REFERENCES players(address),
  player2_address TEXT REFERENCES players(address),
  player1_character TEXT NOT NULL,
  player2_character TEXT NOT NULL,
  format TEXT DEFAULT 'best_of_3',       -- best_of_3 | best_of_5
  status TEXT DEFAULT 'waiting',          -- waiting | in_progress | completed
  winner_address TEXT REFERENCES players(address),
  state JSONB NOT NULL,                  -- Current game state
  move_history JSONB[],                  -- Array of all moves
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);
```

### Progression Tables

#### `battle_pass_seasons`
```sql
CREATE TABLE battle_pass_seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `battle_pass_tiers`
```sql
CREATE TABLE battle_pass_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES battle_pass_seasons(id),
  tier_number INTEGER NOT NULL,
  xp_required INTEGER NOT NULL,
  rewards JSONB NOT NULL,                -- {shards: 100, cosmetics: [...]}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season_id, tier_number)
);
```

#### `player_progression`
```sql
CREATE TABLE player_progression (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_address TEXT REFERENCES players(address),
  season_id UUID REFERENCES battle_pass_seasons(id),
  current_xp INTEGER DEFAULT 0,
  current_tier INTEGER DEFAULT 1,
  clash_shards INTEGER DEFAULT 0,
  prestige_level INTEGER DEFAULT 0,
  lifetime_xp BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_address, season_id)
);
```

#### `daily_quests`
```sql
CREATE TABLE daily_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id TEXT NOT NULL,
  difficulty TEXT NOT NULL,              -- easy | medium | hard
  description TEXT NOT NULL,
  objective_type TEXT NOT NULL,          -- win_matches | deal_damage | etc
  target_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  shard_reward INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `player_quest_progress`
```sql
CREATE TABLE player_quest_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_address TEXT REFERENCES players(address),
  quest_id UUID REFERENCES daily_quests(id),
  current_progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  is_claimed BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_address, quest_id)
);
```

#### `achievements`
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,                -- combat | mastery | social | collection | milestones
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  shard_reward INTEGER NOT NULL,
  cosmetic_reward TEXT,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `player_achievements`
```sql
CREATE TABLE player_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_address TEXT REFERENCES players(address),
  achievement_id UUID REFERENCES achievements(id),
  progress INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_address, achievement_id)
);
```

#### `cosmetic_items`
```sql
CREATE TABLE cosmetic_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                    -- skin | emote | victory_pose | badge
  rarity TEXT NOT NULL,                  -- common | rare | epic | legendary
  price INTEGER NOT NULL,                -- Cost in Clash Shards
  is_featured BOOLEAN DEFAULT false,
  character_id TEXT,                     -- NULL for universal items
  preview_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `player_inventory`
```sql
CREATE TABLE player_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_address TEXT REFERENCES players(address),
  cosmetic_id UUID REFERENCES cosmetic_items(id),
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_address, cosmetic_id)
);
```

### Betting Tables

#### `betting_pools`
```sql
CREATE TABLE betting_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID UNIQUE REFERENCES matches(id),
  player1_total BIGINT DEFAULT 0,        -- Total bets on player1 (sompi)
  player2_total BIGINT DEFAULT 0,
  total_pool BIGINT DEFAULT 0,
  total_fees BIGINT DEFAULT 0,
  status TEXT DEFAULT 'open',            -- open | locked | resolved | refunded
  winner TEXT,                           -- player1 | player2
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
  bet_on TEXT NOT NULL,                  -- player1 | player2
  amount BIGINT NOT NULL,                -- Amount in sompi
  fee_paid BIGINT DEFAULT 0,
  net_amount BIGINT NOT NULL,
  tx_id TEXT UNIQUE NOT NULL,            -- Kaspa transaction ID
  payout_amount BIGINT,
  payout_tx_id TEXT,
  status TEXT DEFAULT 'pending',          -- pending | confirmed | won | lost | refunded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);
```

#### `bot_betting_pools`
```sql
CREATE TABLE bot_betting_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_match_id TEXT UNIQUE NOT NULL,
  bot1_character_id TEXT NOT NULL,
  bot2_character_id TEXT NOT NULL,
  bot1_total BIGINT DEFAULT 0,
  bot2_total BIGINT DEFAULT 0,
  total_pool BIGINT DEFAULT 0,
  total_fees BIGINT DEFAULT 0,
  status TEXT DEFAULT 'open',            -- open | locked | resolved | refunded
  winner TEXT,                           -- bot1 | bot2
  betting_closes_at_turn INTEGER DEFAULT 3,
  match_created_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

#### `bot_bets`
```sql
CREATE TABLE bot_bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID REFERENCES bot_betting_pools(id),
  bettor_address TEXT REFERENCES players(address),
  bet_on TEXT NOT NULL,                  -- bot1 | bot2
  amount BIGINT NOT NULL,                -- Amount in sompi
  fee_paid BIGINT DEFAULT 0,
  net_amount BIGINT NOT NULL,
  tx_id TEXT UNIQUE NOT NULL,            -- Kaspa transaction ID
  payout_amount BIGINT,
  payout_tx_id TEXT,
  status TEXT DEFAULT 'pending',          -- pending | confirmed | won | lost | refunded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);
```

### Realtime Channels

KaspaClash uses Supabase Realtime for live updates:

- **`matchmaking:queue`** - Queue updates, player counts
- **`game:${matchId}`** - Match events, round results, move submissions
- **`spectate:${matchId}`** - Spectator view, betting pool updates
- **`progression:${playerAddress}`** - XP gains, tier unlocks, quest progress
- **`quests:daily`** - Daily quest refresh notifications
- **`shop:featured`** - Weekly featured item rotation updates

---

## 🛠 Development Guide

### Local Development Workflow

1. **Start development server:**
```bash
npm run dev
```

2. **Access the app:**
- Main app: http://localhost:3000
- API routes: http://localhost:3000/api/*

3. **Debugging:**
- Use React DevTools for component state
- Use Phaser DevTools for game scene debugging
- Check browser console for EventBus messages

### Key Development Commands

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix auto-fixable issues
npm run type-check   # TypeScript type checking (if configured)

# Database
# (Run SQL files manually in Supabase dashboard)
```

### Environment-Specific Behavior

**Development Mode:**
- Uses Kaspa testnet by default
- Shows debug overlays in Phaser
- Verbose logging enabled
- Hot module replacement for fast iteration

**Production Mode:**
- Mainnet support 
- Optimized bundles
- Error boundaries active
- Analytics tracking 

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

## 🚢 Deployment

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

Required for production:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ DATABASE_URL
- ✅ NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET
- ✅ BETTING_VAULT_PRIVATE_KEY_MAINNET
- ✅ NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET
- ✅ BETTING_VAULT_PRIVATE_KEY_TESTNET

Recommended / optional:
- ⭕ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
- ⭕ CLOUDINARY_API_KEY
- ⭕ CLOUDINARY_API_SECRET
- ⭕ RELAYER_PRIVATE_KEY
- ⭕ KASPA_RPC_URL
- ⭕ KASPA_RPC_URL_TESTNET
- ⭕ NODE_ENV

### Custom Domain Setup

In Vercel dashboard:
1. Go to Project Settings → Domains
2. Add your domain (e.g., `kaspaclash.gg`)
3. Configure DNS records as instructed
4. Enable automatic HTTPS

### Performance Optimization

- **Image Optimization:** Next.js automatic image optimization
- **Code Splitting:** Automatic route-based splitting
- **Compression:** Gzip/Brotli enabled by default
- **Caching:** Static assets cached with CDN
- **WASM Loading:** Kaspa WASM loaded asynchronously

---

## 🤖 AI Attribution

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

## 🤝 Contributing

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
- **Testing:** Test all game logic thoroughly
- **Commits:** Use conventional commit messages

### Areas for Contribution

- 🎮 New game modes (tournaments, teams, draft pick, combo challenge)
- 🎨 Additional characters with unique abilities (currently 20 characters)
- 🛍️ Character customization & loadout system (equip owned cosmetics)
- 🔗 Blockchain verification for achievements & prestige levels
- 🌐 Internationalization (i18n)
- ♿ Accessibility improvements
- 📱 Mobile UX enhancements
- 🔊 Sound effect refinements
- 📊 Analytics and telemetry
- 🧪 Test coverage
- 📚 Additional documentation
- 🎭 More cosmetic items and weekly featured rotations

---

## 📄 License

**MIT License**

Copyright (c) 2026 KaspaClash

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 🙏 Acknowledgments

- **Kaspa Community** - For building the fastest PoW blockchain
- **Kaspathon Organizers** - For hosting this incredible hackathon
- **Phaser Team** - For the amazing game engine
- **Supabase Team** - For the best PostgreSQL-as-a-Service platform
- **Vercel** - For seamless Next.js deployment
- **AI Community** - For tools that made this project possible

---

## 📞 Contact & Links

- **Live Demo:** [https://kaspaclash.vercel.app](https://kaspaclash.vercel.app) _(example)_
- **GitHub:** [https://github.com/yourusername/KaspaClash](https://github.com/yourusername/KaspaClash)
- **Twitter/X:** [@KaspaClash](#) _(if applicable)_
- **Discord:** Join the [Kaspa Community Discord](https://discord.gg/kaspa)
- **Kaspathon:** [https://kaspathon.com](https://kaspathon.com)

---

## 🎉 Built for Kaspathon 2026

**Show us your Kode-fu! ⚔️**

This project was created for Kaspathon 2026, showcasing how Kaspa's lightning-fast block times enable entirely new categories of blockchain applications. KaspaClash proves that real-time gaming on a PoW blockchain isn't just possible—it's practical, scalable, and fun.

**Thank you for checking out KaspaClash! May your blocks be fast and your combos legendary. 🥋✨**

---

<p align="center">
  <img src="https://img.shields.io/badge/Powered%20by-Kaspa-49D9D9?style=for-the-badge" alt="Powered by Kaspa" />
  <img src="https://img.shields.io/badge/Built%20with-AI-FF6B6B?style=for-the-badge" alt="Built with AI" />
  <img src="https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge" alt="Made with Love" />
</p>
