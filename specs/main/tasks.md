# Tasks: Battle Pass & Progression System

**Input**: Design documents from `D:\KaspaClash\specs\main\`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅  
**Tests**: Not explicitly requested - focusing on implementation tasks

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project directory structure per plan.md (src/app/battle-pass, src/components/progression, src/lib/progression, src/stores, public/cosmetics)
- [X] T002 [P] Add TypeScript types for progression system in src/types/progression.ts
- [X] T003 [P] Add TypeScript types for quests in src/types/quest.ts
- [X] T004 [P] Add TypeScript types for cosmetics in src/types/cosmetic.ts
- [X] T005 [P] Add TypeScript types for achievements in src/types/achievement.ts
- [X] T006 [P] Add TypeScript types for blockchain anchors in src/types/blockchain.ts
- [X] T007 [P] Setup audio assets in public/assets/audio/ (tier-unlock.mp3, quest-complete.mp3, achievement-unlock.mp3)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Create database migration 020_battle_pass_schema.sql for battle_pass_seasons, battle_pass_tiers, player_progression tables in supabase/migrations/
- [X] T009 Create database migration 021_quests_schema.sql for daily_quests, player_quest_progress tables in supabase/migrations/
- [X] T010 Create database migration 022_cosmetics_shop.sql for cosmetic_items, player_inventory, player_loadouts tables in supabase/migrations/
- [X] T011 Create database migration 023_achievements_schema.sql for achievements, player_achievements tables in supabase/migrations/
- [X] T012 Create database migration 024_blockchain_anchors.sql for blockchain_anchors table in supabase/migrations/
- [ ] T013 Run all database migrations and verify schema creation
- [X] T014 [P] Create RLS policies for player_progression table in supabase/migrations/025_rls_progression.sql
- [X] T015 [P] Create RLS policies for quest tables in supabase/migrations/026_rls_quests.sql
- [X] T016 [P] Create RLS policies for cosmetics tables in supabase/migrations/027_rls_cosmetics.sql
- [X] T017 [P] Create RLS policies for achievements tables in supabase/migrations/028_rls_achievements.sql
- [X] T018 Create performance indexes for leaderboard queries in supabase/migrations/029_indexes.sql
- [X] T019 [P] Implement XP calculation utilities in src/lib/progression/xp-calculator.ts (hybrid exponential-linear curve per research.md)
- [X] T020 [P] Implement tier reward distribution logic in src/lib/progression/tier-rewards.ts
- [X] T021 [P] Implement Clash Shards currency utilities in src/lib/progression/currency-utils.ts
- [X] T022 Create Zustand progression store in src/stores/progression-store.ts
- [X] T023 Create Zustand quest store in src/stores/quest-store.ts
- [X] T024 Create Zustand shop store in src/stores/shop-store.ts
- [X] T025 Create Zustand inventory store in src/stores/inventory-store.ts
- [X] T026 Create Zustand achievement store in src/stores/achievement-store.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Battle Pass Progression & Unlocks (Priority: P1) 🎯 MVP

**Goal**: Players can earn XP from matches, progress through 50 tiers, unlock rewards, and see visual progression feedback

**Independent Test**: Complete matches to earn XP, watch tier progress bar fill, unlock a tier and receive rewards (cosmetics + Clash Shards), view all 50 tiers with locked/unlocked status

### Implementation for User Story 1

- [x] T027 [P] [US1] Create BattlePassTiers component in src/components/progression/BattlePassTiers.tsx (displays all 50 tiers in grid)
- [x] T028 [P] [US1] Create XPProgressBar component in src/components/progression/XPProgressBar.tsx (shows current tier progress)
- [x] T029 [P] [US1] Create TierUnlockModal component in src/components/progression/TierUnlockModal.tsx (celebration animation on tier unlock)
- [x] T030 [US1] Implement battle pass page in src/app/battle-pass/page.tsx (main UI for viewing progression)
- [x] T031 [P] [US1] Create POST /api/progression/award-xp API route in src/app/api/progression/award-xp/route.ts
- [x] T032 [P] [US1] Create POST /api/progression/unlock-tier API route in src/app/api/progression/unlock-tier/route.ts
- [x] T033 [US1] Implement ProgressionManager in src/game/managers/ProgressionManager.ts (handles XP awards during matches)
- [x] T034 [US1] Create Supabase function award-xp-trigger in supabase/functions/award-xp-trigger/ (auto-calculates tier unlocks)
- [x] T035 [US1] Integrate XP awarding with existing match completion logic in match end handlers
- [x] T036 [US1] Add visual feedback animations for XP gains in ProgressionManager
- [x] T037 [US1] Create season transition handler in src/lib/progression/season-manager.ts
- [x] T038 [US1] Implement Supabase function season-transition in supabase/functions/season-transition/ (handles season rollover)
- [x] T039 [US1] Add season history display to player profile

**Checkpoint**: At this point, User Story 1 should be fully functional - players can progress through battle pass by playing matches

---

## Phase 4: User Story 2 - Daily Quest System (Priority: P2)

**Goal**: Players see 3 daily quests with diverse objectives, track progress in real-time, and claim rewards (XP + Clash Shards)

**Independent Test**: Log in to see 3 active quests, complete objectives (win matches, deal damage), watch progress update live, claim rewards, verify new quests appear after 24h reset

### Implementation for User Story 2

- [x] T040 [P] [US2] Create DailyQuestList component in src/components/quests/DailyQuestList.tsx (displays 3 active quests)
- [x] T041 [P] [US2] Create QuestCard component in src/components/quests/QuestCard.tsx (individual quest with progress bar)
- [x] T042 [P] [US2] Create QuestClaimButton component in src/components/quests/QuestClaimButton.tsx (claim rewards with animation)
- [x] T043 [US2] Implement quests page in src/app/quests/page.tsx (main daily quests screen)
- [x] T044 [US2] Implement quest template definitions in src/lib/quests/quest-templates.ts (40+ quest configurations)
- [x] T045 [US2] Implement quest generator in src/lib/quests/quest-generator.ts (selects 1 Easy + 1 Medium + 1 Hard)
- [x] T046 [US2] Implement quest validator in src/lib/quests/quest-validator.ts (server-side completion checking)
- [x] T047 [P] [US2] Create GET /api/quests/daily API route in src/app/api/quests/daily/route.ts (fetch active quests)
- [x] T048 [P] [US2] Create POST /api/quests/claim API route in src/app/api/quests/claim/route.ts (claim quest rewards)
- [x] T049 [P] [US2] Create POST /api/quests/progress API route in src/app/api/quests/progress/route.ts (update progress)
- [x] T050 [US2] Implement Supabase function daily-quest-reset in supabase/functions/daily-quest-reset/ (midnight UTC reset)
- [x] T051 [US2] Setup Supabase Realtime subscription for quest progress updates in src/hooks/useQuestProgress.ts
- [x] T052 [US2] Integrate quest progress tracking with match completion handlers
- [x] T053 [US2] Add quest completion notification system with visual celebration

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - players earn XP from matches AND daily quests

---

## Phase 5: User Story 3 - Cosmetic Shop & Currency System (Priority: P2)

**Goal**: Players can browse shop categorized by cosmetic type, preview items, purchase with Clash Shards, and see weekly featured rotation

**Independent Test**: Earn Clash Shards from matches/quests, open shop, browse categories (Skins/Emotes/Poses/Badges), preview items, purchase cosmetics, verify ownership and currency deduction

### Implementation for User Story 3

- [x] T054 [P] [US3] Create ShopGrid component in src/components/shop/ShopGrid.tsx (grid layout with category tabs)
- [x] T055 [P] [US3] Create CosmeticPreview component in src/components/shop/CosmeticPreview.tsx (modal with item preview)
- [x] T056 [P] [US3] Create PurchaseModal component in src/components/shop/PurchaseModal.tsx (confirmation dialog)
- [x] T057 [P] [US3] Create CategoryFilter component in src/components/shop/CategoryFilter.tsx (tab navigation)
- [x] T058 [P] [US3] Create ClashShardsDisplay component in src/components/currency/ClashShardsDisplay.tsx (balance display)
- [x] T059 [P] [US3] Create TransactionHistory component in src/components/currency/TransactionHistory.tsx (earn/spend log)
- [x] T060 [US3] Implement shop page in src/app/shop/page.tsx (main cosmetic shop screen)
- [x] T061 [US3] Implement shop inventory manager in src/lib/shop/shop-inventory.ts (item catalog management)
- [x] T062 [US3] Implement purchase handler in src/lib/shop/purchase-handler.ts (transaction processing with validation)
- [x] T063 [US3] Implement rotation scheduler in src/lib/shop/rotation-scheduler.ts (weekly featured items)
- [x] T064 [P] [US3] Create GET /api/shop/inventory API route in src/app/api/shop/inventory/route.ts (fetch shop items)
- [x] T065 [P] [US3] Create POST /api/shop/purchase API route in src/app/api/shop/purchase/route.ts (process purchase)
- [x] T066 [P] [US3] Create GET /api/shop/featured API route in src/app/api/shop/featured/route.ts (weekly rotation)
- [x] T067 [US3] Add cosmetic asset organization in public/cosmetics/ (skins, emotes, victory-poses, badges directories)
- [x] T068 [US3] Implement Clash Shards transaction logging for audit trail
- [x] T069 [US3] Add shop item preview assets (thumbnails and full previews)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 work independently - full progression and shop economy functional

---

## Phase 6: User Story 6 - Character Customization & Cosmetics (Priority: P2)

**Goal**: Players can equip owned cosmetics to characters, see equipped items in matches, and view other players' customization

**Independent Test**: Open inventory/loadout screen, equip skin/emote/victory pose to character, enter match and see customization applied, view another player's profile and see their equipped items

### Implementation for User Story 6

- [ ] T070 [P] [US6] Create LoadoutScreen component in src/components/inventory/LoadoutScreen.tsx (cosmetic equip interface)
- [ ] T071 [P] [US6] Create CosmeticSlot component in src/components/inventory/CosmeticSlot.tsx (individual equip slot)
- [ ] T072 [P] [US6] Create EquipButton component in src/components/inventory/EquipButton.tsx (equip/unequip action)
- [ ] T073 [US6] Implement inventory page in src/app/inventory/page.tsx (main loadout screen)
- [ ] T074 [US6] Implement cosmetic loader in src/lib/cosmetics/cosmetic-loader.ts (asset loading for Phaser)
- [ ] T075 [US6] Implement loadout manager in src/lib/cosmetics/loadout-manager.ts (equip/unequip logic)
- [ ] T076 [US6] Implement skin variants mapper in src/lib/cosmetics/skin-variants.ts (spritesheet mapping)
- [ ] T077 [P] [US6] Create POST /api/cosmetics/equip API route in src/app/api/cosmetics/equip/route.ts (save loadout)
- [ ] T078 [P] [US6] Create GET /api/cosmetics/loadout API route in src/app/api/cosmetics/loadout/route.ts (fetch equipped items)
- [ ] T079 [US6] Integrate equipped cosmetics with Phaser character rendering in existing match scenes
- [ ] T080 [US6] Add emote trigger system during pre-match and post-match phases
- [ ] T081 [US6] Add victory pose display system in match end screen
- [ ] T082 [US6] Add profile badge/frame display to player profile view
- [ ] T083 [US6] Create CosmeticPreviewScene in src/game/scenes/CosmeticPreviewScene.ts (3D skin preview for shop)

**Checkpoint**: Full cosmetic ecosystem functional - players can unlock, purchase, equip, and display customization

---

## Phase 7: User Story 4 - Survival Mode (Priority: P3)

**Goal**: Players can launch endless survival mode, face escalating AI waves, track score/waves survived, and compete on leaderboard

**Independent Test**: Start survival mode, defeat multiple waves with increasing difficulty, lose and see final stats (waves/score), earn rewards (XP + Clash Shards), check survival leaderboard for rankings

### Implementation for User Story 4

- [x] T084 [US4] Implement SurvivalScene in src/game/scenes/SurvivalScene.ts (main survival game mode Phaser scene)
- [x] T085 [US4] Implement wave generator in src/lib/survival/wave-generator.ts (AI difficulty scaling formulas)
- [x] T086 [US4] Implement score calculator in src/lib/survival/score-calculator.ts (scoring and reward formulas)
- [x] T087 [US4] Implement leaderboard updater in src/lib/survival/leaderboard-updater.ts (rank management)
- [x] T088 [US4] Implement survival launcher page in src/app/survival/page.tsx (mode selection screen)
- [x] T089 [P] [US4] Create POST /api/survival/start API route in src/app/api/survival/start/route.ts (initialize run)
- [x] T090 [P] [US4] Create POST /api/survival/end API route in src/app/api/survival/end/route.ts (save results)
- [x] T091 [P] [US4] Create GET /api/survival/leaderboard API route in src/app/api/survival/leaderboard/route.ts (fetch rankings)
- [x] T092 [US4] Add wave transition UI in SurvivalScene (wave number, brief rest period)
- [x] T093 [US4] Add survival results screen showing waves survived, score, rewards earned
- [x] T094 [US4] Add survival leaderboard display with top 100 players
- [x] T095 [US4] Integrate milestone wave bonus rewards (every 5 or 10 waves)

**Checkpoint**: Survival mode fully functional as standalone endless challenge mode

---

## Phase 8: User Story 5 - Combo Challenge Mode (Priority: P3)

**Goal**: Players can practice combos through structured challenges, receive real-time feedback, earn stars, and track mastery

**Independent Test**: Enter combo challenge mode, select beginner challenge, follow on-screen instructions, execute combo, receive feedback and star rating, unlock next challenge

### Implementation for User Story 5

- [ ] T096 [US5] Implement ComboChallengeScene in src/game/scenes/ComboChallengeScene.ts (training mode Phaser scene)
- [ ] T097 [US5] Implement challenge definitions in src/lib/combo-challenge/challenge-definitions.ts (all combo sequences)
- [ ] T098 [US5] Implement input feedback system in src/lib/combo-challenge/input-validator.ts (real-time correct/incorrect detection)
- [ ] T099 [US5] Implement star rating calculator in src/lib/combo-challenge/star-calculator.ts (performance scoring)
- [ ] T100 [US5] Implement combo challenge launcher page in src/app/combo-challenge/page.tsx (challenge list screen)
- [ ] T101 [P] [US5] Create GET /api/combo-challenge/challenges API route in src/app/api/combo-challenge/challenges/route.ts (fetch available challenges)
- [ ] T102 [P] [US5] Create POST /api/combo-challenge/complete API route in src/app/api/combo-challenge/complete/route.ts (save completion)
- [ ] T103 [US5] Add on-screen move sequence display with timing windows in ComboChallengeScene
- [ ] T104 [US5] Add visual feedback for correct/incorrect inputs during challenge
- [ ] T105 [US5] Add challenge completion screen with star rating and rewards
- [ ] T106 [US5] Add overall mastery percentage display showing total stars earned

**Checkpoint**: Combo challenge mode functional as skill development tool

---

## Phase 9: User Story 8 - Achievement System (Priority: P3)

**Goal**: Players unlock achievements for diverse accomplishments, see progress tracking, receive rewards, and collect badges

**Independent Test**: Complete achievement-worthy action (win 10 matches), receive unlock notification, view achievements screen with categories, see progress bars for incomplete achievements, earn XP + Clash Shards

### Implementation for User Story 8

- [x] T107 [P] [US8] Create AchievementGrid component in src/components/achievements/AchievementGrid.tsx (organized by category)
- [x] T108 [P] [US8] Create AchievementCard component in src/components/achievements/AchievementCard.tsx (individual achievement)
- [x] T109 [P] [US8] Create AchievementProgressBar component in src/components/achievements/ProgressBar.tsx (progress tracking)
- [x] T110 [P] [US8] Create UnlockNotification component in src/components/achievements/UnlockNotification.tsx (popup celebration)
- [x] T111 [US8] Implement achievements page in src/app/achievements/page.tsx (achievement collection screen)
- [x] T112 [US8] Implement achievement definitions in src/lib/achievements/achievement-definitions.ts (80+ achievements across 5 categories)
- [x] T113 [US8] Implement achievement tracker in src/lib/achievements/achievement-tracker.ts (progress tracking)
- [x] T114 [US8] Implement achievement evaluator in src/lib/achievements/achievement-evaluator.ts (completion checking)
- [x] T115 [US8] Implement AchievementTracker manager in src/game/managers/AchievementTracker.ts (in-game event tracking)
- [x] T116 [P] [US8] Create GET /api/achievements/list API route in src/app/api/achievements/list/route.ts (fetch all achievements)
- [x] T117 [P] [US8] Create POST /api/achievements/unlock API route in src/app/api/achievements/unlock/route.ts (unlock achievement)
- [x] T118 [P] [US8] Create GET /api/achievements/progress API route in src/app/api/achievements/progress/route.ts (fetch progress)
- [x] T119 [US8] Integrate achievement tracking with match events (wins, damage, combos, etc.)
- [x] T120 [US8] Integrate achievement tracking with progression events (tiers, prestige, cosmetics)
- [x] T121 [US8] Add achievement unlock notifications with celebration animations
- [x] T122 [US8] Add achievement mastery badge system for category completion

**Checkpoint**: Comprehensive achievement system tracking diverse player accomplishments

---

## Phase 10: User Story 7 - Prestige System (Priority: P4)

**Goal**: Players at tier 50 can prestige to reset progression in exchange for permanent XP/currency bonuses and exclusive rewards

**Independent Test**: Reach tier 50, view prestige option with clear explanation, confirm prestige, verify tier reset to 1, receive prestige badge and +10% XP multiplier, continue earning XP with bonus applied

### Implementation for User Story 7

- [ ] T123 [P] [US7] Create PrestigeConfirmation component in src/components/progression/PrestigeConfirmation.tsx (modal explaining prestige)
- [ ] T124 [US7] Implement prestige calculator in src/lib/progression/prestige-calculator.ts (multiplier calculations)
- [ ] T125 [US7] Implement prestige handler in src/lib/progression/prestige-handler.ts (reset logic)
- [ ] T126 [P] [US7] Create POST /api/progression/prestige API route in src/app/api/progression/prestige/route.ts (execute prestige)
- [ ] T127 [P] [US7] Create GET /api/progression/prestige-status API route in src/app/api/progression/prestige-status/route.ts (check eligibility)
- [ ] T128 [US7] Add prestige option to battle pass screen when tier 50 reached
- [ ] T129 [US7] Add prestige level display to player profile with visual effects (auras/borders)
- [ ] T130 [US7] Add prestige multiplier application to all XP and currency calculations
- [ ] T131 [US7] Add prestige-exclusive cosmetic rewards at milestone levels
- [ ] T132 [US7] Add prestige level tracking to leaderboards

**Checkpoint**: Prestige system functional as endgame progression for dedicated players

---

## Phase 11: User Story 10 - Blockchain Integration (Priority: P4)

**Goal**: Players can optionally verify achievements and leaderboard rankings on Kaspa L1 blockchain for permanent proof

**Independent Test**: Opt in to blockchain verification, connect Kasware wallet, anchor achievement (leaderboard rank or prestige level), receive verification badge with transaction hash, view on block explorer

### Implementation for User Story 10

- [ ] T133 [US10] Implement Kaspa verifier in src/lib/blockchain/kaspa-verifier.ts (L1 transaction creation using Rusty Kaspa WASM SDK)
- [ ] T134 [US10] Implement anchor formatter in src/lib/blockchain/anchor-formatter.ts (data serialization to OP_RETURN format)
- [ ] T135 [US10] Implement blockchain verification handler in src/lib/blockchain/verification-handler.ts (wallet connection flow)
- [ ] T136 [P] [US10] Create POST /api/blockchain/verify-achievement API route in src/app/api/blockchain/verify-achievement/route.ts (leaderboard verification)
- [ ] T137 [P] [US10] Create POST /api/blockchain/anchor-prestige API route in src/app/api/blockchain/anchor-prestige/route.ts (prestige verification)
- [ ] T138 [P] [US10] Create GET /api/blockchain/verification-status API route in src/app/api/blockchain/verification-status/route.ts (check status)
- [ ] T139 [US10] Add blockchain verification opt-in UI to achievement/leaderboard screens
- [ ] T140 [US10] Add verification badge display on player profiles with transaction details
- [ ] T141 [US10] Add block explorer link integration for Kaspa transactions
- [ ] T142 [US10] Add wallet connection error handling with retry options
- [ ] T143 [US10] Add graceful fallback when wallet not connected or transaction fails

**Checkpoint**: Optional blockchain verification available for players interested in on-chain proof

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T144 [P] Add loading states and skeleton screens for all async operations (tier unlocks, shop loading, quest claiming)
- [ ] T145 [P] Add error boundary components for graceful error handling across all screens
- [ ] T146 [P] Optimize Phaser scene cleanup to prevent memory leaks in Survival and Combo Challenge modes
- [ ] T147 [P] Implement lazy loading for Phaser scenes using dynamic imports
- [ ] T148 [P] Add cosmetic asset preloading strategy with texture atlases
- [ ] T149 [P] Optimize Supabase queries with proper indexes and batching
- [ ] T150 [P] Add comprehensive logging for all currency transactions and tier unlocks
- [ ] T151 [P] Create seed data scripts for initial battle pass season and cosmetic catalog
- [ ] T152 [P] Add responsive design improvements for mobile devices across all screens
- [ ] T153 [P] Add keyboard navigation support for battle pass tiers, shop grid, achievement list
- [ ] T154 [P] Add accessibility improvements (ARIA labels, color contrast, screen reader support)
- [ ] T155 [P] Performance testing for 60fps maintenance in Phaser scenes
- [ ] T156 [P] Load testing for Supabase Realtime subscriptions with concurrent users
- [ ] T157 Create quickstart.md documentation in specs/main/quickstart.md (developer setup guide)
- [ ] T158 Document API endpoints with request/response examples
- [ ] T159 Document database schema with ERD diagrams
- [ ] T160 Security audit for RLS policies and API validation
- [ ] T161 Code review and refactoring for all progression logic
- [ ] T162 Run quickstart.md validation with fresh developer setup

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-11)**: All depend on Foundational phase completion
  - **User Story 1 (Battle Pass)** - P1 Priority - MVP Target
  - **User Story 2 (Daily Quests)** - P2 Priority - Enhances engagement
  - **User Story 3 (Shop)** - P2 Priority - Reward sink
  - **User Story 6 (Customization)** - P2 Priority - Player expression (depends on Shop for item sources)
  - **User Story 4 (Survival)** - P3 Priority - Additional content
  - **User Story 5 (Combo Challenge)** - P3 Priority - Skill development
  - **User Story 8 (Achievements)** - P3 Priority - Collection goals
  - **User Story 7 (Prestige)** - P4 Priority - Endgame content (depends on Battle Pass reaching tier 50)
  - **User Story 10 (Blockchain)** - P4 Priority - Optional feature
- **Polish (Phase 12)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories ✅ **MVP**
- **User Story 2 (P2)**: Can start after Foundational - Integrates with US1 for XP awards but independently testable
- **User Story 3 (P2)**: Can start after Foundational - Uses Clash Shards from US1 but independently testable
- **User Story 6 (P2)**: Depends on US3 for cosmetic items, but can be developed in parallel
- **User Story 4 (P3)**: Can start after Foundational - Awards XP/shards from US1 but independently testable
- **User Story 5 (P3)**: Can start after Foundational - Awards XP/shards from US1 but independently testable
- **User Story 8 (P3)**: Can start after Foundational - Tracks events from multiple stories but independently testable
- **User Story 7 (P4)**: Depends on US1 (requires tier 50 mechanic) - Implement after US1 stable
- **User Story 10 (P4)**: Can start after Foundational - Verifies achievements/prestige but optional

### Within Each User Story

- Components marked [P] can be built in parallel (different files)
- API routes marked [P] can be built in parallel (different endpoints)
- Database migrations must run sequentially (T008 → T009 → T010 → T011 → T012)
- RLS policies can be created in parallel after migrations (T014, T015, T016, T017 all [P])
- Stores can be created in parallel (T022-T026 all after migrations)
- UI components before pages (components are dependencies for pages)
- API routes before integration (backend ready before frontend calls)

### Parallel Opportunities

**Setup Phase (Phase 1)**:
```bash
# All type definition tasks can run in parallel:
T002 [P] progression.ts | T003 [P] quest.ts | T004 [P] cosmetic.ts | T005 [P] achievement.ts | T006 [P] blockchain.ts | T007 [P] audio assets
```

**Foundational Phase (Phase 2)**:
```bash
# Database migrations must be sequential (T008 → T009 → T010 → T011 → T012 → T013)
# But after migrations, RLS policies in parallel:
T014 [P] RLS progression | T015 [P] RLS quests | T016 [P] RLS cosmetics | T017 [P] RLS achievements

# Utility libraries in parallel:
T019 [P] xp-calculator.ts | T020 [P] tier-rewards.ts | T021 [P] currency-utils.ts

# Stores in parallel (after migrations):
T022 progression-store | T023 quest-store | T024 shop-store | T025 inventory-store | T026 achievement-store
```

**User Story 1 (Battle Pass)**:
```bash
# Components in parallel:
T027 [P] BattlePassTiers.tsx | T028 [P] XPProgressBar.tsx | T029 [P] TierUnlockModal.tsx

# API routes in parallel:
T031 [P] award-xp route | T032 [P] unlock-tier route
```

**User Story 2 (Daily Quests)**:
```bash
# Components in parallel:
T040 [P] DailyQuestList.tsx | T041 [P] QuestCard.tsx | T042 [P] QuestClaimButton.tsx

# API routes in parallel:
T047 [P] /api/quests/daily | T048 [P] /api/quests/claim | T049 [P] /api/quests/progress
```

**User Story 3 (Shop)**:
```bash
# Components in parallel:
T054 [P] ShopGrid.tsx | T055 [P] CosmeticPreview.tsx | T056 [P] PurchaseModal.tsx | T057 [P] CategoryFilter.tsx | T058 [P] ClashShardsDisplay.tsx | T059 [P] TransactionHistory.tsx

# API routes in parallel:
T064 [P] /api/shop/inventory | T065 [P] /api/shop/purchase | T066 [P] /api/shop/featured
```

**User Story 6 (Customization)**:
```bash
# Components in parallel:
T070 [P] LoadoutScreen.tsx | T071 [P] CosmeticSlot.tsx | T072 [P] EquipButton.tsx

# API routes in parallel:
T077 [P] /api/cosmetics/equip | T078 [P] /api/cosmetics/loadout
```

**User Story 4 (Survival)**:
```bash
# API routes in parallel:
T089 [P] /api/survival/start | T090 [P] /api/survival/end | T091 [P] /api/survival/leaderboard
```

**User Story 5 (Combo Challenge)**:
```bash
# API routes in parallel:
T101 [P] /api/combo-challenge/challenges | T102 [P] /api/combo-challenge/complete
```

**User Story 8 (Achievements)**:
```bash
# Components in parallel:
T107 [P] AchievementGrid.tsx | T108 [P] AchievementCard.tsx | T109 [P] ProgressBar.tsx | T110 [P] UnlockNotification.tsx

# API routes in parallel:
T116 [P] /api/achievements/list | T117 [P] /api/achievements/unlock | T118 [P] /api/achievements/progress
```

**User Story 7 (Prestige)**:
```bash
# API routes in parallel:
T126 [P] /api/progression/prestige | T127 [P] /api/progression/prestige-status
```

**User Story 10 (Blockchain)**:
```bash
# API routes in parallel:
T136 [P] /api/blockchain/verify-achievement | T137 [P] /api/blockchain/anchor-prestige | T138 [P] /api/blockchain/verification-status
```

**Polish Phase (Phase 12)**:
```bash
# Most polish tasks can run in parallel:
T144 [P] loading states | T145 [P] error boundaries | T146 [P] Phaser cleanup | T147 [P] lazy loading | T148 [P] asset preloading | T149 [P] query optimization | T150 [P] logging | T151 [P] seed data | T152 [P] responsive design | T153 [P] keyboard navigation | T154 [P] accessibility | T155 [P] performance testing | T156 [P] load testing
```

---

## Parallel Example: User Story 1 (Battle Pass)

```bash
# Launch all components together:
Task T027: "Create BattlePassTiers component in src/components/progression/BattlePassTiers.tsx"
Task T028: "Create XPProgressBar component in src/components/progression/XPProgressBar.tsx"
Task T029: "Create TierUnlockModal component in src/components/progression/TierUnlockModal.tsx"

# Then launch API routes together:
Task T031: "Create POST /api/progression/award-xp API route in src/app/api/progression/award-xp/route.ts"
Task T032: "Create POST /api/progression/unlock-tier API route in src/app/api/progression/unlock-tier/route.ts"

# Finally integrate sequentially:
Task T030 → T033 → T034 → T035 → T036 → T037 → T038 → T039
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) 🎯

**Recommended Approach**: Build a minimal viable product with just battle pass progression

1. Complete Phase 1: Setup (T001-T007) - ~1-2 hours
2. Complete Phase 2: Foundational (T008-T026) - ~1 week
   - Database schema and migrations
   - RLS policies and indexes
   - Core utility libraries (XP calculation, tier rewards)
   - Zustand stores
3. Complete Phase 3: User Story 1 (T027-T039) - ~1 week
   - Battle pass UI components
   - XP awarding system
   - Tier unlock mechanics
   - Season management
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Play matches and earn XP
   - Progress through multiple tiers
   - Unlock rewards
   - View all 50 tiers
5. Deploy/demo MVP

**MVP Delivers**: Core engagement loop - players progress through battle pass by playing matches

**Estimated Time**: ~2-3 weeks for solo developer

---

### Incremental Delivery (Recommended)

**Phase-by-Phase Approach**: Build and validate each user story independently

1. **Weeks 1-3**: Setup + Foundational + User Story 1 → **MVP Release** 🎯
   - Foundation complete, battle pass functional
   - Players can earn XP and unlock tiers
   - Deploy and gather feedback

2. **Weeks 4-5**: User Story 2 (Daily Quests) → **Engagement Update**
   - Add daily objectives for structured goals
   - Boost XP earning with quest rewards
   - Deploy and measure DAU retention

3. **Weeks 5-6**: User Story 3 (Shop) + User Story 6 (Customization) → **Cosmetics Update**
   - Add shop with Clash Shards economy
   - Add loadout system for equipped cosmetics
   - Players can now personalize characters
   - Deploy and measure shop engagement

4. **Weeks 7-8**: User Story 4 (Survival) + User Story 5 (Combo Challenge) → **Game Modes Update**
   - Add endless survival mode
   - Add combo training mode
   - More variety and replayability
   - Deploy and measure mode popularity

5. **Weeks 9-10**: User Story 8 (Achievements) → **Collection Update**
   - Add 80+ achievements across categories
   - More long-term goals
   - Deploy and measure completion rates

6. **Weeks 11-12**: User Story 7 (Prestige) + User Story 10 (Blockchain) → **Endgame Update**
   - Add prestige system for dedicated players
   - Add optional blockchain verification
   - Deploy final feature set

7. **Weeks 13-14**: Phase 12 (Polish) → **Quality Update**
   - Performance optimization
   - Accessibility improvements
   - Documentation and testing

**Total Timeline**: ~3-4 months for complete feature set

Each release adds value without breaking previous functionality. Players always have a working game.

---

### Parallel Team Strategy (If Multiple Developers)

**With 3 Developers**:

1. **Week 1-2**: All developers complete Setup + Foundational together
   - Developer A: Database migrations (T008-T013)
   - Developer B: RLS policies and indexes (T014-T018)
   - Developer C: Utility libraries and stores (T019-T026)

2. **Week 3 onward**: Developers work on user stories in parallel
   - **Developer A**: User Story 1 (Battle Pass) - Priority 1
   - **Developer B**: User Story 2 (Daily Quests) - Priority 2
   - **Developer C**: User Story 3 (Shop) - Priority 2

3. Stories complete and integrate independently
   - Each developer deploys their story to feature branch
   - Integration testing before merging to main
   - Releases can be staggered or bundled

**Benefits**: 3x faster delivery, but requires more coordination

**Solo Developer**: Recommended to follow Incremental Delivery approach (one story at a time)

---

## Summary

- **Total Tasks**: 162 tasks across 12 phases
- **MVP Scope**: Phases 1-3 (Tasks T001-T039) - Battle Pass Progression System ✅
- **Full Feature**: All phases (Tasks T001-T162)
- **Estimated Timeline**: 
  - MVP: ~2-3 weeks (solo developer)
  - Full feature: ~3-4 months (solo developer, incremental delivery)
  - Full feature: ~6-8 weeks (3-developer parallel team)

### Task Count per User Story

- **Phase 1 (Setup)**: 7 tasks
- **Phase 2 (Foundational)**: 19 tasks (BLOCKING - must complete first)
- **Phase 3 (US1 - Battle Pass)**: 13 tasks - MVP 🎯
- **Phase 4 (US2 - Daily Quests)**: 14 tasks
- **Phase 5 (US3 - Shop)**: 16 tasks
- **Phase 6 (US6 - Customization)**: 14 tasks
- **Phase 7 (US4 - Survival)**: 12 tasks
- **Phase 8 (US5 - Combo Challenge)**: 11 tasks
- **Phase 9 (US8 - Achievements)**: 16 tasks
- **Phase 10 (US7 - Prestige)**: 10 tasks
- **Phase 11 (US10 - Blockchain)**: 11 tasks
- **Phase 12 (Polish)**: 19 tasks

### Parallel Opportunities Identified

- **Setup**: 6 tasks can run in parallel (T002-T007)
- **Foundational**: 8 tasks can run in parallel after migrations (T014-T017, T019-T021, T022-T026 in batches)
- **User Story 1**: 5 tasks can run in parallel (T027-T029, T031-T032)
- **User Story 2**: 6 tasks can run in parallel (T040-T042, T047-T049)
- **User Story 3**: 9 tasks can run in parallel (T054-T059, T064-T066)
- **User Story 6**: 5 tasks can run in parallel (T070-T072, T077-T078)
- **User Story 4**: 3 tasks can run in parallel (T089-T091)
- **User Story 5**: 2 tasks can run in parallel (T101-T102)
- **User Story 8**: 7 tasks can run in parallel (T107-T110, T116-T118)
- **User Story 7**: 2 tasks can run in parallel (T126-T127)
- **User Story 10**: 3 tasks can run in parallel (T136-T138)
- **Polish**: 15 tasks can run in parallel (T144-T156)

**Total Parallelizable Tasks**: ~68 tasks (42% of all tasks)

### Independent Test Criteria

- **User Story 1**: Play matches → earn XP → unlock tiers → receive rewards ✅
- **User Story 2**: View quests → complete objectives → claim rewards → daily reset ✅
- **User Story 3**: Browse shop → preview items → purchase → verify ownership ✅
- **User Story 6**: Open loadout → equip cosmetics → see in matches → view on profiles ✅
- **User Story 4**: Start survival → defeat waves → lose → see stats → check leaderboard ✅
- **User Story 5**: Select challenge → execute combo → receive feedback → earn stars ✅
- **User Story 8**: Complete achievement → receive notification → view collection ✅
- **User Story 7**: Reach tier 50 → prestige → reset tier → gain bonuses ✅
- **User Story 10**: Opt in → connect wallet → anchor achievement → verify on-chain ✅

All user stories can be tested and validated independently without depending on other stories being complete.

---

## Notes

- **[P] marker**: Tasks with [P] can run in parallel (different files, no shared dependencies)
- **[Story] label**: Maps task to specific user story (US1, US2, etc.) for traceability
- **File paths**: All tasks include exact file paths for implementation
- **Checkpoints**: Each user story phase ends with validation checkpoint
- **MVP Focus**: User Story 1 is the recommended MVP - provides immediate value
- **Incremental Delivery**: Each story adds value without breaking previous stories
- **Format Validation**: All 162 tasks follow required checklist format (checkbox, ID, optional [P], Story label, file path)
- **Tests**: Tests intentionally omitted as not explicitly requested in feature specification
- **Constitution Compliance**: All tasks respect technical constraints from plan.md (RLS policies, server validation, no client trust)

**Status**: ✅ Tasks ready for implementation - all formats validated, dependencies documented, parallel opportunities identified
