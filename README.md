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

Built for the **Kaspathon 2026 hackathon** under the **Gaming & Interactive** track, KaspaClash leverages Kaspa's sub-second block times to create a seamless gaming experience where blockchain transactions feel instant—no waiting, no delays, just pure competitive action.

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

- ⚡ **Instant Confirmations:** ~1 second block times enable real-time gameplay
- 🎲 **Live Betting:** Spectators can place bets that confirm before the next round
- 🔗 **On-Chain Everything:** All game state, matches, and transactions are blockchain-native
- 🎨 **Seamless UX:** Players experience gaming-first design with blockchain in the background
- 💰 **Low Fees:** Kaspa's efficiency keeps transaction costs negligible

---

## ✨ Key Features

### 🎮 Core Gameplay
- **Turn-Based Combat System:** Strategic rock-paper-scissors style fighting with energy management
- **4 Unique Characters:** Each fighter embodies a Kaspa concept (Speed, DAG, Security, PoW)
- **Multiple Game Modes:**
  - **Ranked Matchmaking:** ELO-based competitive queue
  - **Private Rooms:** 6-character room codes for custom matches
  - **Practice Mode:** Offline AI training
  - **Spectator Mode:** Watch live matches with real-time betting

### 🔗 Blockchain Features
- **Kaspa Wallet Integration:** Seamless connection via Kasware wallet
- **Live Betting System:** Spectators can bet on match outcomes with instant confirmations
- **On-Chain Leaderboard:** Transparent ranking system powered by ELO ratings
- **Match History:** All game results stored permanently on-chain
- **Transaction Verification:** Real-time bet confirmation and payout tracking

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
2. **Matchmaking:** Server matches players by ELO → Creates match record → Notifies via Realtime
3. **Character Select:** Both players choose fighters → Broadcast selections → Lock when both ready
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
│   │   │   └── players/
│   │   │       ├── [address]/       # GET - Player profile
│   │   │       └── create/          # POST - Create player
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
│   │   ├── queue/
│   │   │   └── page.tsx             # Queue waiting room
│   │   ├── replay/[matchId]/        # Match replay viewer
│   │   │   └── page.tsx
│   │   ├── spectate/
│   │   │   ├── page.tsx             # Spectator lobby
│   │   │   └── [matchId]/           # Live spectate match
│   │   │       └── page.tsx
│   │   ├── layout.tsx               # Root layout with providers
│   │   ├── page.tsx                 # Landing page
│   │   └── globals.css              # Global styles
│   │
│   ├── components/                  # React components
│   │   ├── betting/
│   │   │   └── BettingPanel.tsx     # Live betting UI for spectators
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
│   │   ├── providers/
│   │   │   └── WalletProvider.tsx   # Wallet context provider
│   │   ├── share/
│   │   │   ├── MatchSummary.tsx
│   │   │   ├── ShareMatchButton.tsx
│   │   │   └── TransactionTimeline.tsx
│   │   ├── shared/
│   │   │   └── NetworkModeIndicator.tsx
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
│   │   ├── scenes/
│   │   │   ├── CharacterSelectScene.ts
│   │   │   ├── FightScene.ts        # Main battle arena (3485 lines)
│   │   │   ├── PracticeScene.ts
│   │   │   ├── ReplayScene.ts
│   │   │   └── ResultsScene.ts
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
│   │   ├── useSpectatorChannel.ts   # Spectator mode events
│   │   └── useWallet.ts             # Wallet connection state
│   │
│   ├── lib/                         # Core libraries
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
│   │   ├── rating/                  # ELO rating system
│   │   ├── share/                   # Social sharing utilities
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser client
│   │   │   └── types.ts             # Generated database types
│   │   └── utils.ts                 # Shared utilities
│   │
│   ├── stores/                      # Zustand state stores
│   │   ├── match-store.ts           # Match state
│   │   ├── matchmaking-store.ts     # Queue state
│   │   ├── network-store.ts         # Network status
│   │   ├── practice-store.ts        # Practice mode state
│   │   └── wallet-store.ts          # Wallet state (167 lines)
│   │
│   └── types/                       # TypeScript definitions
│       ├── api.ts                   # API response types
│       ├── constants.ts             # Game constants
│       ├── database.ts              # Database types
│       ├── index.ts                 # Core game types (255 lines)
│       ├── kaspa.ts                 # Kaspa SDK types
│       ├── kaspalib.d.ts            # kaspalib type declarations
│       └── websocket.ts             # Realtime event types
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql   # Database schema (128 lines)
│       └── 002_rls_policies.sql     # Row Level Security policies
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
      "winRate": 0.789
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

### Realtime Channels

KaspaClash uses Supabase Realtime for live updates:

- **`matchmaking:queue`** - Queue updates, player counts
- **`game:${matchId}`** - Match events, round results, move submissions
- **`spectate:${matchId}`** - Spectator view, betting pool updates

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

**KaspaClash is a 100% AI-powered project.** Every aspect of the codebase, including all visual and audio assets, was generated using AI tools. This project demonstrates the potential of AI-assisted development in creating complex, production-ready blockchain applications.

### AI Tools Used

#### Code Generation
- **GitHub Copilot** - Real-time code completion and suggestion
- **Claude 4.5 Sonnet** - Architecture design, complex logic, documentation
- **Claude 4.5 Opus** - TypeScript type generation, API design, debugging assistance

#### Visual Assets
All visual and audio assets were generated using a single tool:

- **Ludo AI** — All character sprites, portraits, backgrounds, UI icons, and animation sprite sheets
- Ludo AI was used exclusively for asset generation; any post-processing or integration was performed manually by the developer.

#### Audio Assets
All sound effects and background music were created using:
- **ElevenLabs** - Voice synthesis for announcements
- **Suno AI** - Background music tracks (dojo.mp3, character-selection.mp3)
- **Adobe Podcast Enhance** - Audio cleanup and normalization

#### Content Creation
- **Claude 4.5 Sonnet** - This README, code comments, documentation

### Development Approach

1. **Conceptualization:** AI-assisted brainstorming for game mechanics and Kaspa integration
2. **Architecture:** AI-generated system design and data flow diagrams
3. **Implementation:** Iterative development with AI code generation
4. **Asset Creation:** Prompt engineering for consistent visual style
5. **Testing:** AI-assisted test case generation and debugging
6. **Documentation:** Comprehensive docs written with AI assistance

### AI Disclosure Statement

As required by Kaspathon rules: **AI tools were used extensively throughout this project. The developer's role was prompt engineering, architecture decisions, integration, and quality assurance. All generated code was reviewed, tested, and modified where necessary to ensure functionality and adherence to best practices.**

This project serves as a case study in AI-powered game development, demonstrating that with proper guidance and iteration, AI can produce professional-grade, blockchain-integrated applications.

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

- 🎮 New game modes (tournaments, teams, draft pick)
- 🎨 Additional characters with unique abilities
- 🌐 Internationalization (i18n)
- ♿ Accessibility improvements
- 📱 Mobile UX enhancements
- 🔊 Sound effect refinements
- 📊 Analytics and telemetry
- 🧪 Test coverage
- 📚 Additional documentation

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
