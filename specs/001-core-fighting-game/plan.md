# Implementation Plan: KaspaClash Core Fighting Game

**Branch**: `001-core-fighting-game` | **Date**: 2025-12-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-core-fighting-game/spec.md`

## Summary

Build a browser-based, real-time multiplayer 1v1 fighting game where every move is executed via Kaspa blockchain transactions, demonstrating sub-second confirmations and microscopic fees. The game features wallet connection, matchmaking, character selection, turn-based combat with on-chain moves, visual animations via Phaser.js, practice mode, leaderboards, and PWA support. Two transaction modes: pure on-chain (wallet popup per move) and enhanced relayer mode (one signature, automatic moves).

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ LTS  
**Framework**: Next.js 16+ (App Router) with React 19+ Server Components  
**Game Engine**: Phaser.js 3.x (client-side only via next/dynamic with { ssr: false })  
**Styling**: Tailwind CSS 3.x + shadcn/ui (Radix UI primitives)  
**Kaspa Integration**: Rusty-Kaspa WASM SDK (@aspect/kaspa-wasm or official kaspa-wasm bindings)  
**Wallet Support**: Kaspium, Kasware browser extensions via standard Kaspa wallet API  
**Storage**: Supabase (PostgreSQL + Realtime subscriptions) for matchmaking, leaderboards, off-chain indexing  
**Real-time**: Supabase Realtime + Kaspa wRPC/WebSocket subscriptions  
**Target Platform**: Modern browsers (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+), mobile responsive  
**Project Type**: Full-stack web application (Next.js monorepo)  
**Performance Goals**: 60fps animations, <2s move confirmation, <3s initial load, <100ms UI response  
**Constraints**: <500KB initial JS bundle, sub-$0.001 transaction fees, mobile-first responsive design  
**Scale/Scope**: ~20 pages/components, real-time 1v1 matches, global leaderboard, 3-4 character roster

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality Compliance

| Requirement | Status | Implementation Approach |
|-------------|--------|------------------------|
| Readability First | ✅ PASS | TypeScript with strict mode, ESLint + Prettier enforced, descriptive naming conventions |
| Single Responsibility | ✅ PASS | Modular architecture: separate services for wallet, matchmaking, game state, blockchain |
| Type Safety | ✅ PASS | TypeScript strict mode, Zod for runtime validation, typed Supabase client |
| Error Handling | ✅ PASS | Custom error classes, toast notifications, transaction retry logic with user feedback |
| Code Duplication | ✅ PASS | Shared hooks, utility functions, component library via shadcn/ui |

### II. User Experience Consistency Compliance

| Requirement | Status | Implementation Approach |
|-------------|--------|------------------------|
| Design System Compliance | ✅ PASS | Tailwind CSS design tokens, shadcn/ui component library, consistent theming |
| Responsive Behavior | ✅ PASS | Mobile-first Tailwind breakpoints, Phaser canvas scaling, touch controls |
| Interaction Patterns | ✅ PASS | Consistent button styles, modal patterns, navigation via shadcn/ui primitives |
| Feedback & Loading States | ✅ PASS | Transaction pending indicators, skeleton loaders, optimistic UI updates |
| Error Communication | ✅ PASS | User-friendly error messages, wallet connection guidance, retry prompts |
| Accessibility | ✅ PASS | Keyboard navigation for menus, ARIA labels, focus management |

### III. Performance Requirements Compliance

| Requirement | Status | Implementation Approach |
|-------------|--------|------------------------|
| Initial Load (<3s) | ✅ PASS | Next.js SSR, code splitting, Phaser dynamic import, optimized assets |
| Interaction Response (<100ms) | ✅ PASS | React state updates, optimistic UI, WebSocket for real-time sync |
| Frame Rate (60fps) | ✅ PASS | Phaser.js hardware-accelerated canvas, sprite sheet animations, object pooling |
| Memory Management | ✅ PASS | Phaser scene cleanup, React effect cleanup, WebSocket lifecycle management |
| Network Efficiency | ✅ PASS | Supabase caching, minimal API payloads, batched leaderboard queries |
| Bundle Size (<10% increase) | ✅ PASS | Dynamic imports for Phaser, tree-shaking, production builds |

### Technical Standards Compliance

| Requirement | Status | Implementation Approach |
|-------------|--------|------------------------|
| Dependency Management | ✅ PASS | Minimal dependencies, audited packages, lockfile enforcement |
| API Design | ✅ PASS | RESTful Next.js API routes, consistent response formats, versioned endpoints |
| State Management | ✅ PASS | React Context for global state, Zustand for game state, no random mutations |
| Logging | ✅ PASS | Structured logging for API routes, client-side error tracking |
| Configuration | ✅ PASS | Environment variables via .env.local, Vercel secrets for production |

**GATE STATUS**: ✅ ALL CHECKS PASS - Proceed to Phase 0 research

## Project Structure

### Documentation (this feature)

```text
specs/001-core-fighting-game/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API specifications)
│   ├── api.yaml         # OpenAPI 3.0 specification
│   └── websocket.md     # WebSocket event contracts
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router pages
│   ├── (game)/                   # Game-related routes (grouped)
│   │   ├── play/                 # Main game arena
│   │   ├── lobby/                # Matchmaking lobby
│   │   ├── practice/             # Practice mode
│   │   └── character-select/     # Character selection
│   ├── (social)/                 # Social features (grouped)
│   │   ├── leaderboard/          # Global rankings
│   │   ├── match/[id]/           # Match details & sharing
│   │   └── profile/[address]/    # Player profile
│   ├── api/                      # API routes
│   │   ├── matchmaking/          # Queue & room management
│   │   ├── relayer/              # Sponsored transaction service
│   │   ├── matches/              # Match history & results
│   │   └── leaderboard/          # Rankings API
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles & Tailwind
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives
│   ├── game/                     # Game-specific components
│   │   ├── GameCanvas.tsx        # Phaser container
│   │   ├── HealthBar.tsx         # Health display
│   │   ├── MoveSelector.tsx      # Move input UI
│   │   └── TransactionStatus.tsx # Tx pending/confirmed indicator
│   ├── wallet/                   # Wallet connection components
│   │   ├── ConnectButton.tsx
│   │   └── WalletProvider.tsx
│   └── shared/                   # Shared UI components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── LoadingSpinner.tsx
│
├── game/                         # Phaser.js game engine
│   ├── scenes/                   # Phaser scenes
│   │   ├── BootScene.ts          # Asset loading
│   │   ├── FightScene.ts         # Main combat scene
│   │   ├── CharacterSelectScene.ts
│   │   └── VictoryScene.ts
│   ├── entities/                 # Game objects
│   │   ├── Fighter.ts            # Character entity
│   │   └── EffectsManager.ts     # Particles & animations
│   ├── config/                   # Game configuration
│   │   ├── characters.ts         # Character definitions
│   │   └── moves.ts              # Move data & damage values
│   └── GameManager.ts            # Phaser game instance wrapper
│
├── lib/                          # Core utilities & services
│   ├── kaspa/                    # Kaspa blockchain integration
│   │   ├── client.ts             # WASM SDK wrapper
│   │   ├── wallet.ts             # Wallet connection logic
│   │   ├── transactions.ts       # Transaction building & signing
│   │   └── subscriptions.ts      # Real-time block/tx listeners
│   ├── supabase/                 # Database client & types
│   │   ├── client.ts
│   │   ├── types.ts              # Generated types
│   │   └── realtime.ts           # Subscription helpers
│   ├── matchmaking/              # Matchmaking logic
│   │   ├── queue.ts
│   │   └── rooms.ts
│   └── utils/                    # Shared utilities
│       ├── format.ts             # Address truncation, etc.
│       └── constants.ts
│
├── hooks/                        # React hooks
│   ├── useWallet.ts              # Wallet state & actions
│   ├── useMatch.ts               # Current match state
│   ├── useGameState.ts           # Phaser bridge hook
│   └── useKaspaSubscription.ts   # Blockchain event hook
│
├── stores/                       # State management (Zustand)
│   ├── walletStore.ts
│   ├── matchStore.ts
│   └── gameStore.ts
│
├── types/                        # TypeScript type definitions
│   ├── game.ts                   # Game entities
│   ├── kaspa.ts                  # Blockchain types
│   └── api.ts                    # API request/response types
│
└── styles/                       # Additional styles
    └── phaser.css                # Canvas container styles

public/
├── assets/                       # Game assets
│   ├── sprites/                  # Character sprite sheets
│   ├── effects/                  # Particle effects
│   ├── audio/                    # Sound effects
│   └── backgrounds/              # Arena backgrounds
├── icons/                        # PWA icons
└── manifest.json                 # PWA manifest
```

**Structure Decision**: Full-stack Next.js App Router monorepo. Game engine (Phaser.js) is isolated in `/src/game/` and loaded client-side only. Kaspa integration in `/src/lib/kaspa/`. Supabase handles matchmaking state and leaderboards. API routes handle relayer service and match indexing.

## Complexity Tracking

> No violations identified. All constitution checks pass without requiring exceptions.

---

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion (2025-12-31)*

### Design Artifacts Reviewed

| Artifact | Constitution Alignment |
|----------|----------------------|
| `research.md` | ✅ Technology choices documented with rationale and alternatives |
| `data-model.md` | ✅ Entities well-defined, validation rules specified, type-safe schemas |
| `contracts/api.yaml` | ✅ RESTful conventions, consistent error handling, versioned structure |
| `contracts/websocket.md` | ✅ Typed events, clear state machine, error handling documented |
| `quickstart.md` | ✅ Documentation for public API and setup, clear troubleshooting |

### Principle Verification

| Principle | Post-Design Status | Evidence |
|-----------|-------------------|----------|
| I. Code Quality | ✅ CONFIRMED | TypeScript types defined, error codes documented, modular structure |
| II. UX Consistency | ✅ CONFIRMED | Design tokens via Tailwind, loading states in WebSocket events, error payloads user-friendly |
| III. Performance | ✅ CONFIRMED | Phaser dynamic loading, Supabase Realtime (6ms median latency), asset optimization planned |

### Risk Assessment

| Risk | Mitigation | Status |
|------|------------|--------|
| WASM loading complexity | Documented initialization pattern, webpack config specified | ✅ Addressed |
| Kaspa wallet fragmentation | KIP-12 standard, fallback detection | ✅ Addressed |
| Real-time sync latency | Supabase Broadcast chosen over DB polling | ✅ Addressed |
| Bundle size (Phaser ~500KB) | Dynamic import with SSR disabled | ✅ Addressed |

**POST-DESIGN GATE STATUS**: ✅ ALL CHECKS PASS - Ready for Phase 2 task generation

---

## Next Steps

1. Run `/speckit.tasks` to generate the task breakdown
2. Tasks will be organized by user story priority (P1 → P7)
3. Begin implementation with Phase 1: Setup and Phase 2: Foundational
