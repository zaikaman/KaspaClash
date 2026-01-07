# Implementation Plan: Battle Pass & Progression System

**Branch**: `main` | **Date**: January 7, 2026 | **Spec**: [spec.md](../001-battle-pass-system/spec.md)

## Summary

This feature introduces a comprehensive progression and engagement system for KaspaClash, including a 50-tier battle pass with seasonal resets, daily quests for structured objectives, an in-game Clash Shards economy with cosmetic shop, character customization (skins/emotes/poses/badges), two new game modes (Survival and Combo Challenge), an achievement system, prestige mechanics for endgame players, and optional Kaspa L1 blockchain verification for leaderboards and milestones. All systems are designed to be free-to-play without pay-to-win elements, leveraging existing match infrastructure and adding persistent progression layers to increase player retention and engagement.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16 (App Router)  
**Primary Dependencies**: 
- **Frontend**: React 18, Phaser.js 3 (game engine), Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes, Supabase Client SDK
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Realtime**: Supabase Realtime (WebSockets) for live updates
- **Blockchain**: Rusty Kaspa WASM SDK, Kasware wallet extension integration
- **Auth**: Supabase Auth (email/password or wallet-based)

**Storage**: Supabase PostgreSQL for all persistent data (player profiles, progression, currency, cosmetics, achievements, leaderboards). Static assets (spritesheets, animations, audio) served from `/public` directory.

**Testing**: Vitest for unit tests, Playwright for E2E tests, manual testing for Phaser game scenes

**Target Platform**: Web (desktop and mobile browsers), deployed on Vercel with Edge Functions

**Project Type**: Full-stack web application (Next.js App Router monorepo structure)

**Performance Goals**: 
- Battle pass UI must render <100ms
- XP calculations and tier unlocks must complete <50ms
- Shop inventory queries must return <200ms
- Phaser game scenes (Survival/Combo) must maintain 60fps
- Supabase Realtime quest progress updates <500ms latency
- Blockchain verification transactions <10 seconds (Kaspa L1 fast blocks)

**Constraints**: 
- All progression data must respect Supabase RLS policies (no client-side trust)
- Cosmetic assets must be pre-loaded or bundled (no user uploads)
- Battle pass season transitions must be atomic and not disrupt active matches
- XP/currency earn rates must be server-validated to prevent cheating
- Blockchain integration must remain optional and not block core gameplay
- Bundle size increase must be minimized (lazy load Phaser scenes, code split shop UI)

**Scale/Scope**: 
- Expected 10,000+ concurrent users during peak
- 50 tiers × multiple seasons of battle pass rewards (hundreds of cosmetic items)
- Dozens of daily quest templates, 100+ achievements across categories
- Real-time leaderboard updates for survival mode
- Efficient storage for achievement progress tracking across all players

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Code Quality
- ✅ **Readability First**: All progression logic, XP calculations, and quest validation will use clear, self-documenting function names
- ✅ **Single Responsibility**: Each service module (ProgressionService, QuestService, ShopService, etc.) will handle one domain
- ✅ **Type Safety**: All database models, API contracts, and Phaser scene configs will be strongly typed with TypeScript interfaces
- ✅ **Error Handling**: All database operations, currency transactions, and blockchain calls will have explicit error handling with user-friendly messages
- ✅ **Code Duplication**: Shared logic (XP calculation formulas, reward granting, UI animations) will be extracted into reusable utilities

### User Experience Consistency
- ✅ **Design System Compliance**: All new UI (battle pass screen, shop, inventory) will use existing shadcn/ui components and Tailwind design tokens
- ✅ **Responsive Behavior**: All progression screens must work on mobile (touch-friendly quest claiming, shop browsing)
- ✅ **Interaction Patterns**: Reward claiming, shop purchases, and tier unlocks will follow existing game confirmation patterns
- ✅ **Feedback & Loading States**: XP gains show animated progress bars, tier unlocks show celebration animations, shop purchases show loading spinners
- ✅ **Error Communication**: Currency insufficient funds, quest claim failures, blockchain errors all show clear, actionable messages
- ✅ **Accessibility**: Battle pass tiers, quest list, shop grid all keyboard-navigable; color not sole indicator for locked/unlocked states

### Performance Requirements
- ✅ **Initial Load**: Battle pass data lazy-loaded after initial app load; not blocking core game
- ✅ **Interaction Response**: Quest claim, shop purchase, tier unlock animations all <100ms response time
- ✅ **Frame Rate**: Survival and Combo Challenge Phaser scenes must maintain 60fps; separate from main menu rendering
- ✅ **Memory Management**: Phaser scenes properly cleaned up when exiting game modes; no sprite leaks
- ✅ **Network Efficiency**: Progression data batched in single queries; shop inventory cached client-side; Supabase Realtime used for live updates only
- ✅ **Bundle Size**: Phaser scenes code-split and lazy-loaded; cosmetic previews use lightweight thumbnails before full assets

### Technical Standards
- ✅ **Dependency Management**: Phaser.js already in use; no new major dependencies needed (Supabase and Kaspa SDK already integrated)
- ✅ **API Design**: RESTful Next.js API routes for progression/shop; Supabase Realtime for quest progress subscriptions
- ✅ **State Management**: Zustand stores for progression state, shop cart, equipped cosmetics (consistent with existing pattern)
- ✅ **Logging**: All currency transactions, tier unlocks, quest completions logged to Supabase for audit trail
- ✅ **Configuration**: Battle pass tier rewards, quest templates, shop items stored in Supabase config tables (no hardcoded values)

### Development Workflow
- ✅ **Branch Naming**: Working on `main` (solo developer, approved by user)
- ✅ **Commit Messages**: Will follow conventional commits: `feat(progression):`, `feat(shop):`, etc.
- ✅ **Code Review**: Solo developer; self-review with checklist before commit
- ✅ **Documentation**: quickstart.md will document new API endpoints, database schema, and integration points
- ✅ **Incremental Delivery**: Feature broken into 9 user stories (P1-P4) that can be implemented and tested independently

**Constitution Compliance**: ✅ PASSED - No violations. All principles can be met within existing architecture and constraints.

## Project Structure

### Documentation (this feature)

```text
specs/main/
├── plan.md              # This file
├── research.md          # Phase 0 output (next step)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── progression-api.ts
│   ├── quest-api.ts
│   ├── shop-api.ts
│   ├── cosmetics-api.ts
│   ├── survival-api.ts
│   ├── achievements-api.ts
│   └── blockchain-api.ts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── battle-pass/
│   │   └── page.tsx              # Battle pass tier view
│   ├── quests/
│   │   └── page.tsx              # Daily quests screen
│   ├── shop/
│   │   └── page.tsx              # Cosmetic shop
│   ├── inventory/
│   │   └── page.tsx              # Cosmetic loadout/equip
│   ├── achievements/
│   │   └── page.tsx              # Achievement collection
│   ├── survival/
│   │   └── page.tsx              # Survival mode launcher
│   ├── combo-challenge/
│   │   └── page.tsx              # Combo challenge launcher
│   └── api/
│       ├── progression/
│       │   ├── award-xp/
│       │   ├── unlock-tier/
│       │   └── prestige/
│       ├── quests/
│       │   ├── daily/
│       │   ├── claim/
│       │   └── progress/
│       ├── shop/
│       │   ├── inventory/
│       │   ├── purchase/
│       │   └── featured/
│       ├── cosmetics/
│       │   ├── equip/
│       │   └── loadout/
│       ├── achievements/
│       │   ├── unlock/
│       │   └── progress/
│       ├── survival/
│       │   ├── start/
│       │   ├── end/
│       │   └── leaderboard/
│       └── blockchain/
│           ├── verify-achievement/
│           └── anchor-prestige/
├── components/
│   ├── progression/
│   │   ├── BattlePassTiers.tsx
│   │   ├── XPProgressBar.tsx
│   │   ├── TierUnlockModal.tsx
│   │   └── PrestigeConfirmation.tsx
│   ├── quests/
│   │   ├── DailyQuestList.tsx
│   │   ├── QuestCard.tsx
│   │   └── QuestClaimButton.tsx
│   ├── shop/
│   │   ├── ShopGrid.tsx
│   │   ├── CosmeticPreview.tsx
│   │   ├── PurchaseModal.tsx
│   │   └── CategoryFilter.tsx
│   ├── inventory/
│   │   ├── LoadoutScreen.tsx
│   │   ├── CosmeticSlot.tsx
│   │   └── EquipButton.tsx
│   ├── achievements/
│   │   ├── AchievementGrid.tsx
│   │   ├── AchievementCard.tsx
│   │   ├── ProgressBar.tsx
│   │   └── UnlockNotification.tsx
│   └── currency/
│       ├── ClashShardsDisplay.tsx
│       └── TransactionHistory.tsx
├── game/
│   ├── scenes/
│   │   ├── SurvivalScene.ts        # Endless survival mode
│   │   ├── ComboChallengeScene.ts  # Combo training mode
│   │   └── CosmeticPreviewScene.ts # 3D skin preview
│   └── managers/
│       ├── ProgressionManager.ts   # XP/tier logic in-game
│       └── AchievementTracker.ts   # Achievement event tracking
├── lib/
│   ├── progression/
│   │   ├── xp-calculator.ts        # XP award formulas
│   │   ├── tier-rewards.ts         # Reward distribution logic
│   │   └── prestige-calculator.ts  # Prestige multipliers
│   ├── quests/
│   │   ├── quest-generator.ts      # Daily quest selection
│   │   ├── quest-validator.ts      # Server-side completion check
│   │   └── quest-templates.ts      # Quest objective definitions
│   ├── shop/
│   │   ├── shop-inventory.ts       # Item catalog management
│   │   ├── purchase-handler.ts     # Transaction processing
│   │   └── rotation-scheduler.ts   # Featured item rotation
│   ├── cosmetics/
│   │   ├── cosmetic-loader.ts      # Asset loading for Phaser
│   │   ├── loadout-manager.ts      # Equip/unequip logic
│   │   └── skin-variants.ts        # Skin spritesheet mapping
│   ├── achievements/
│   │   ├── achievement-definitions.ts # All achievement configs
│   │   ├── achievement-tracker.ts     # Progress tracking
│   │   └── achievement-evaluator.ts   # Completion checking
│   ├── survival/
│   │   ├── wave-generator.ts       # AI difficulty scaling
│   │   ├── score-calculator.ts     # Score/reward formulas
│   │   └── leaderboard-updater.ts  # Rank management
│   └── blockchain/
│       ├── kaspa-verifier.ts       # L1 transaction creation
│       └── anchor-formatter.ts     # Data serialization
├── stores/
│   ├── progression-store.ts        # Battle pass state
│   ├── quest-store.ts              # Daily quest state
│   ├── shop-store.ts               # Shop cart/filters
│   ├── inventory-store.ts          # Equipped cosmetics
│   └── achievement-store.ts        # Achievement progress
└── types/
    ├── progression.ts              # XP, Tier, Season types
    ├── quest.ts                    # Quest, Objective types
    ├── cosmetic.ts                 # Item, Skin, Emote types
    ├── achievement.ts              # Achievement, Criteria types
    └── blockchain.ts               # Verification, Anchor types

supabase/
├── migrations/
│   ├── 020_battle_pass_schema.sql
│   ├── 021_quests_schema.sql
│   ├── 022_cosmetics_shop.sql
│   ├── 023_achievements_schema.sql
│   └── 024_blockchain_anchors.sql
└── functions/
    ├── award-xp-trigger/           # Auto-calculate tier unlocks
    ├── daily-quest-reset/          # Cron job for quest refresh
    └── season-transition/          # Handle season rollover

public/
├── cosmetics/
│   ├── skins/
│   │   ├── [character-id]/
│   │   │   ├── [skin-id]_idle.png
│   │   │   ├── [skin-id]_attack.png
│   │   │   └── ... (all animation frames)
│   │   └── thumbnails/             # Lightweight previews
│   ├── emotes/
│   │   └── [emote-id]_anim.png
│   ├── victory-poses/
│   │   └── [pose-id]_anim.png
│   └── badges/
│       └── [badge-id].svg
└── audio/
    ├── tier-unlock.mp3
    ├── quest-complete.mp3
    └── achievement-unlock.mp3
```

**Structure Decision**: Full-stack Next.js App Router monorepo with clear separation of concerns:
- **Next.js pages** (`app/`) for UI screens and API routes
- **React components** (`components/`) organized by feature domain
- **Phaser scenes** (`game/scenes/`) for new game modes (Survival, Combo Challenge)
- **Business logic** (`lib/`) for calculations, validation, and integrations
- **State management** (`stores/`) using Zustand for client-side state
- **Database migrations** (`supabase/migrations/`) for schema changes
- **Static assets** (`public/`) for cosmetic spritesheets and audio

This structure maintains consistency with existing KaspaClash architecture while clearly delineating new progression features.

## Complexity Tracking

**No violations requiring justification** - All constitution principles are satisfied within existing architectural patterns and constraints.

---

## Phase 0: Research & Planning

**Objective**: Resolve all technical unknowns and establish implementation patterns before design phase.

### Research Tasks

1. **Battle Pass Progression Curves**
   - Research industry-standard XP curves for 50-tier systems (linear vs exponential)
   - Analyze target completion rates (casual players reaching tier 30, hardcore reaching tier 50)
   - Document XP formula recommendations with examples

2. **XP Economy Balancing**
   - Research earn rates from various sources (match wins, quest completion, achievements)
   - Calculate average playtime required to progress tiers
   - Document multiplier effects (prestige bonuses, seasonal events)

3. **Daily Quest Design Patterns**
   - Research quest objective variety (win-based, performance-based, character-specific)
   - Analyze reset timing and timezone handling best practices
   - Document quest difficulty balancing (easy/medium/hard mix)

4. **Cosmetic Shop UX**
   - Research best practices for category filtering, search, and previews
   - Analyze featured item rotation strategies (weekly vs daily)
   - Document purchase flow patterns (cart vs direct purchase)

5. **Achievement Systems**
   - Research achievement category structures (combat, mastery, collection, social)
   - Analyze tiered achievement progression (bronze/silver/gold/platinum)
   - Document hidden achievement discovery patterns

6. **Kaspa L1 Integration Patterns**
   - Research optimal data structures for on-chain anchoring (minimal bytes)
   - Analyze transaction fee estimation and gas optimization
   - Document wallet connection flows and error handling

7. **Phaser Scene Management**
   - Research memory management for multiple concurrent Phaser scenes
   - Analyze asset preloading strategies for cosmetic spritesheets
   - Document scene transition patterns (menu → game → results)

8. **Supabase Realtime Best Practices**
   - Research optimal subscription patterns for quest progress updates
   - Analyze RLS policy design for progression data security
   - Document efficient query patterns for leaderboard updates

**Output**: `research.md` with decisions, rationale, and alternatives considered for each research task.

---

## Phase 1: Design & Contracts

**Prerequisites**: Phase 0 research complete, all technical unknowns resolved.

### Deliverables

1. **Data Model** (`data-model.md`)
   - Complete PostgreSQL schema for all entities:
     - `player_profiles` (extended with progression fields)
     - `battle_pass_seasons` (season metadata, active status)
     - `battle_pass_tiers` (XP requirements, reward bundles)
     - `player_progression` (current tier, XP, prestige level per player/season)
     - `daily_quests` (templates and active instances)
     - `player_quest_progress` (completion tracking)
     - `cosmetic_items` (catalog with metadata)
     - `player_inventory` (ownership tracking)
     - `player_loadouts` (equipped cosmetics per character)
     - `achievements` (definitions and criteria)
     - `player_achievements` (progress and unlock status)
     - `survival_runs` (leaderboard entries)
     - `combo_challenge_progress` (stars and completion)
     - `blockchain_anchors` (verification records)
   - Relationships and foreign keys documented
   - RLS policies for each table (player isolation, read/write rules)
   - Indexes for performance (leaderboard queries, progression lookups)

2. **API Contracts** (`contracts/`)
   - TypeScript interfaces for all API endpoints:
     - **Progression API**: `/api/progression/award-xp`, `/api/progression/unlock-tier`, `/api/progression/prestige`
     - **Quest API**: `/api/quests/daily`, `/api/quests/claim`, `/api/quests/progress`
     - **Shop API**: `/api/shop/inventory`, `/api/shop/purchase`, `/api/shop/featured`
     - **Cosmetics API**: `/api/cosmetics/equip`, `/api/cosmetics/loadout`
     - **Achievements API**: `/api/achievements/unlock`, `/api/achievements/progress`
     - **Survival API**: `/api/survival/start`, `/api/survival/end`, `/api/survival/leaderboard`
     - **Blockchain API**: `/api/blockchain/verify-achievement`, `/api/blockchain/anchor-prestige`
   - Request/response schemas with validation rules
   - Error codes and messages documented

3. **Quickstart Guide** (`quickstart.md`)
   - Developer setup instructions (database migrations, seed data)
   - Local testing workflows (quest reset simulation, season transitions)
   - Integration points with existing systems (match completion hooks, wallet connections)
   - Example code snippets for common operations

4. **Agent Context Update**
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`
   - Add new patterns: battle pass tier unlocking, quest validation, cosmetic equipping, Phaser scene lifecycle
   - Preserve existing context between markers

**Output**: Complete data model, API contracts, and developer documentation ready for implementation.

---

## Phase 2: Task Planning

**Status**: ⏸️ NOT STARTED (requires `/speckit.tasks` command - separate from `/speckit.plan`)

This phase will break down implementation into specific, ordered tasks mapped to user stories. It will be generated by the `/speckit.tasks` command after Phase 1 is complete.

Expected task categories:
- Database migrations and schema setup
- API endpoint implementation (progression, quests, shop, etc.)
- React UI components (battle pass screen, quest list, shop, inventory)
- Phaser game scenes (Survival, Combo Challenge)
- Business logic services (XP calculation, quest generation, achievement tracking)
- Supabase Realtime subscriptions (quest progress, leaderboard updates)
- Blockchain integration (Kaspa L1 anchoring, wallet connections)
- Testing and validation

**Output**: `tasks.md` with prioritized, sequenced implementation tasks.

---

## Next Steps

1. ✅ **Complete Phase 0 research** to resolve all technical decisions
2. ⏳ **Generate Phase 1 deliverables** (data model, contracts, quickstart)
3. ⏸️ **Run `/speckit.tasks`** to generate Phase 2 implementation task breakdown
4. 🔄 **Begin implementation** following task priorities

**Current Phase**: Moving to Phase 0 (Research)
