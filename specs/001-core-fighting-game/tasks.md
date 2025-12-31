# Tasks: KaspaClash Core Fighting Game

**Input**: Design documents from `/specs/001-core-fighting-game/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: NOT included (not requested in feature specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize Next.js project with all dependencies and base configuration

- [X] T001 Initialize Next.js 16+ project with TypeScript in project root
- [X] T002 Install core dependencies: react@19, phaser@3.88, tailwindcss@4, @supabase/supabase-js
- [X] T003 [P] Install Kaspa dependencies: kaspa-wasm@0.13.0
- [X] T004 [P] Install UI dependencies: shadcn/ui components, lucide-react, zustand
- [X] T005 [P] Configure Tailwind CSS in globals.css with KaspaClash theme
- [X] T006 [P] Configure TypeScript strict mode in tsconfig.json
- [X] T007 Configure next.config.ts with WASM support and async WebAssembly
- [X] T008 [P] Create .env.local.example with required environment variables
- [X] T009 Create base project structure per plan.md (src/app, src/components, src/game, src/lib, src/hooks, src/stores, src/types)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Core Types

- [X] T010 [P] Create base TypeScript types in src/types/index.ts (Player, Character, Match, Round, Move)
- [X] T011 [P] Create WebSocket event types in src/types/websocket.ts per contracts/websocket.md
- [X] T012 [P] Create API response types in src/types/api.ts per contracts/api.yaml
- [X] T013 [P] Create game constants in src/types/constants.ts (MOVE_PROPERTIES, GAME_CONSTANTS)

### Kaspa SDK Foundation

- [X] T014 Create Kaspa WASM loader utility in src/lib/kaspa/loader.ts (dynamic import pattern)
- [X] T015 [P] Create Kaspa types in src/types/kaspa.ts (WalletProvider, Transaction, Address)
- [X] T016 Create wallet discovery service in src/lib/kaspa/wallet-discovery.ts (KIP-12 provider detection)
- [X] T017 Create wallet connection service in src/lib/kaspa/wallet.ts (connect, disconnect, sign)
- [X] T018 Create wallet store in src/stores/wallet-store.ts (Zustand - address, balance, connected)

### Supabase Foundation

- [X] T019 Create Supabase client in src/lib/supabase/client.ts (browser client singleton)
- [X] T020 [P] Create Supabase server client in src/lib/supabase/server.ts (for API routes)
- [X] T021 Create database schema migration in supabase/migrations/001_initial_schema.sql per data-model.md
- [X] T022 [P] Create Row Level Security policies in supabase/migrations/002_rls_policies.sql

### Phaser Foundation

- [X] T023 Create Phaser game config in src/game/config.ts (800x600, WebGL, physics)
- [X] T024 Create EventBus bridge in src/game/EventBus.ts (React ↔ Phaser communication)
- [X] T025 Create PhaserGame wrapper component in src/game/PhaserGame.tsx (dynamic import, ssr: false)

### API Foundation

- [X] T026 Create API error handler in src/lib/api/errors.ts (error codes, response formatting)
- [X] T027 [P] Create API middleware in src/lib/api/middleware.ts (signature verification, rate limiting)
- [X] T028 Create base API route structure with health check in src/app/api/health/route.ts

### UI Foundation

- [X] T029 Create root layout with Tailwind in src/app/layout.tsx
- [X] T030 [P] Create WalletProvider context in src/components/providers/WalletProvider.tsx
- [X] T031 [P] Create base UI components: Button, Card, Dialog in src/components/ui/
- [X] T032 Create ConnectWalletButton component in src/components/wallet/ConnectWalletButton.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Play 1v1 Match (Priority: P1) 🎯 MVP

**Goal**: As a player, I want to play a 1v1 fighting match so that I can experience competitive gameplay with on-chain move verification

**Independent Test**: Connect wallet → Join queue → Match opponent → Select characters → Submit moves → Complete 3-round match → See winner with Kaspa explorer link

### Game Engine for US1

- [ ] T033 [P] [US1] Create FightScene base in src/game/scenes/FightScene.ts (arena, UI zones)
- [ ] T034 [P] [US1] Create FighterSprite class in src/game/sprites/FighterSprite.ts (animations, health bar)
- [ ] T035 [P] [US1] Create MoveButton components in src/game/ui/MoveButton.ts (punch, kick, block, special)
- [ ] T036 [US1] Create round timer display in src/game/ui/RoundTimer.ts (15-second countdown)
- [ ] T037 [US1] Create health bar UI in src/game/ui/HealthBar.ts (100 HP, damage animations)
- [ ] T038 [US1] Create round score display in src/game/ui/RoundScore.ts (best-of-3 tracking)

### Match State Management

- [ ] T039 [US1] Create match store in src/stores/match-store.ts (currentMatch, rounds, moves)
- [ ] T040 [US1] Create game state machine in src/lib/game/state-machine.ts (waiting → character_select → in_progress → completed)

### Move Submission Flow

- [ ] T041 [US1] Create move transaction builder in src/lib/kaspa/move-transaction.ts (build minimal tx for move)
- [ ] T042 [US1] Create move submission service in src/lib/game/move-service.ts (sign, submit, await confirmation)
- [ ] T043 [US1] Integrate move submission with FightScene in src/game/scenes/FightScene.ts (button → tx → confirm)

### Round Resolution

- [ ] T044 [US1] Create round resolver logic in src/lib/game/round-resolver.ts (damage calculation per MOVE_PROPERTIES)
- [ ] T045 [US1] Create round animation handler in src/game/handlers/RoundAnimationHandler.ts (play hit/block effects)

### WebSocket Integration

- [ ] T046 [US1] Create game channel hook in src/hooks/useGameChannel.ts (subscribe to game:${matchId})
- [ ] T047 [US1] Handle round_starting event in src/hooks/useGameChannel.ts (reset round state)
- [ ] T048 [US1] Handle move_submitted event in src/hooks/useGameChannel.ts (show opponent pending)
- [ ] T049 [US1] Handle move_confirmed event in src/hooks/useGameChannel.ts (show confirmed icon)
- [ ] T050 [US1] Handle round_resolved event in src/hooks/useGameChannel.ts (trigger animations, update scores)
- [ ] T051 [US1] Handle match_ended event in src/hooks/useGameChannel.ts (show results, explorer link)

### Game Page

- [ ] T052 [US1] Create match page at src/app/match/[matchId]/page.tsx (load match, render PhaserGame)
- [ ] T053 [US1] Create match results overlay in src/components/game/MatchResults.tsx (winner, stats, explorer link)

### API Endpoints for Match

- [ ] T054 [US1] Create GET /api/matches/[matchId]/route.ts (fetch match state)
- [ ] T055 [US1] Create POST /api/matches/[matchId]/move/route.ts (submit move with txId)
- [ ] T056 [US1] Create GET /api/matches/[matchId]/rounds/route.ts (fetch round history)
- [ ] T057 [US1] Create POST /api/matches/[matchId]/forfeit/route.ts (forfeit match)

**Checkpoint**: User Story 1 complete - full 1v1 match playable with on-chain verification

---

## Phase 4: User Story 2 - Wallet & Matchmaking (Priority: P2)

**Goal**: As a player, I want to connect my Kaspa wallet and find opponents so that I can start playing matches

**Independent Test**: Detect wallet → Connect Kasware/Kaspium → Show balance → Join queue → See queue count → Get matched → Navigate to match

### Wallet UI Enhancements

- [ ] T058 [P] [US2] Create WalletConnectModal in src/components/wallet/WalletConnectModal.tsx (wallet selection)
- [ ] T059 [P] [US2] Create WalletInfo display in src/components/wallet/WalletInfo.tsx (address, balance)
- [ ] T060 [US2] Create wallet hooks in src/hooks/useWallet.ts (connect, disconnect, sign message)

### Matchmaking Queue

- [ ] T061 [US2] Create matchmaking store in src/stores/matchmaking-store.ts (queue status, players in queue)
- [ ] T062 [US2] Create queue presence hook in src/hooks/useMatchmakingQueue.ts (Supabase Presence)
- [ ] T063 [US2] Create MatchmakingQueue component in src/components/matchmaking/MatchmakingQueue.tsx (join/leave, queue count)
- [ ] T064 [US2] Create queue page at src/app/queue/page.tsx (wallet required, queue UI)

### Matchmaking API

- [ ] T065 [US2] Create POST /api/matchmaking/queue/route.ts (join queue endpoint)
- [ ] T066 [US2] Create DELETE /api/matchmaking/queue/route.ts (leave queue endpoint)
- [ ] T067 [US2] Create matchmaking service in src/lib/matchmaking/matchmaker.ts (pair players by rating)

### Room-Based Matching (Private Games)

- [ ] T068 [P] [US2] Create POST /api/matchmaking/rooms/route.ts (create room with code)
- [ ] T069 [P] [US2] Create POST /api/matchmaking/rooms/join/route.ts (join room by code)
- [ ] T070 [US2] Create RoomCreate component in src/components/matchmaking/RoomCreate.tsx
- [ ] T071 [US2] Create RoomJoin component in src/components/matchmaking/RoomJoin.tsx

### Player Registration

- [ ] T072 [US2] Create player registration on first connect in src/lib/player/registration.ts
- [ ] T073 [US2] Create GET /api/players/[address]/route.ts (get player profile)

**Checkpoint**: User Story 2 complete - wallet connection and matchmaking functional

---

## Phase 5: User Story 3 - Character Selection (Priority: P3)

**Goal**: As a player, I want to choose my fighter before a match so that I can express my playstyle

**Independent Test**: After matching → See 4 characters → Select one → Lock in → Wait for opponent → Both revealed → Match starts

### Character Data

- [ ] T074 [P] [US3] Create character definitions in src/data/characters.ts (Cyber Ninja, DAG Warrior, Block Bruiser, Hash Hunter)
- [ ] T075 [P] [US3] Create character sprites/assets placeholder in public/characters/

### Character Selection UI

- [ ] T076 [US3] Create CharacterSelectScene in src/game/scenes/CharacterSelectScene.ts (4 character grid)
- [ ] T077 [US3] Create CharacterCard component in src/game/ui/CharacterCard.ts (portrait, name, theme)
- [ ] T078 [US3] Create selection lock-in UI in src/game/ui/SelectionTimer.ts (countdown to lock)
- [ ] T079 [US3] Create opponent selection indicator in src/game/ui/OpponentStatus.ts (selected/waiting)

### Character Selection Logic

- [ ] T080 [US3] Create character selection handler in src/lib/game/character-selection.ts (select, lock, reveal)
- [ ] T081 [US3] Create POST /api/matches/[matchId]/character/route.ts (submit character selection)
- [ ] T082 [US3] Handle character_selected WebSocket event in src/hooks/useGameChannel.ts
- [ ] T083 [US3] Handle match_starting WebSocket event in src/hooks/useGameChannel.ts (transition to fight)

### Scene Integration

- [ ] T084 [US3] Create scene manager in src/game/SceneManager.ts (CharacterSelect → Fight transitions)

**Checkpoint**: User Story 3 complete - full character selection flow before matches

---

## Phase 6: User Story 4 - Practice Mode (Priority: P4)

**Goal**: As a player, I want to practice against an AI opponent so that I can learn the mechanics without risking losses

**Independent Test**: Select Practice → Choose character → Play against AI → Complete match → Return to menu (no on-chain, no rating impact)

### AI Opponent

- [ ] T085 [P] [US4] Create AI decision engine in src/lib/game/ai-opponent.ts (random/weighted move selection)
- [ ] T086 [US4] Create AI difficulty levels in src/lib/game/ai-difficulty.ts (easy, medium, hard patterns)

### Practice Mode Scene

- [ ] T087 [US4] Create PracticeScene variant in src/game/scenes/PracticeScene.ts (offline mode, AI opponent)
- [ ] T088 [US4] Create practice mode match store in src/stores/practice-store.ts (local state only)
- [ ] T089 [US4] Create practice mode page at src/app/practice/page.tsx (no wallet required)

### Practice UI

- [ ] T090 [US4] Create practice mode menu in src/components/practice/PracticeMenu.tsx (character select, difficulty)
- [ ] T091 [US4] Create practice results screen in src/components/practice/PracticeResults.tsx (no stats saved)

**Checkpoint**: User Story 4 complete - offline practice mode available

---

## Phase 7: User Story 5 - Leaderboard (Priority: P5)

**Goal**: As a player, I want to see a leaderboard of top players so that I can track my ranking

**Independent Test**: Visit leaderboard → See top 50 players → See win count and rating → Find own ranking

### Leaderboard API

- [ ] T092 [P] [US5] Create GET /api/leaderboard/route.ts (paginated leaderboard)
- [ ] T093 [P] [US5] Create leaderboard service in src/lib/leaderboard/service.ts (fetch, sort, rank)

### Leaderboard UI

- [ ] T094 [US5] Create LeaderboardPage at src/app/leaderboard/page.tsx
- [ ] T095 [US5] Create LeaderboardTable in src/components/leaderboard/LeaderboardTable.tsx (rank, address, wins, rating)
- [ ] T096 [US5] Create PlayerRank display in src/components/leaderboard/PlayerRank.tsx (current user's rank)

### Player Stats

- [ ] T097 [US5] Create GET /api/players/[address]/matches/route.ts (match history)
- [ ] T098 [US5] Create PlayerProfile page at src/app/player/[address]/page.tsx
- [ ] T099 [US5] Create MatchHistory component in src/components/player/MatchHistory.tsx

**Checkpoint**: User Story 5 complete - leaderboard and player profiles viewable

---

## Phase 8: User Story 6 - Share Match Highlights (Priority: P6)

**Goal**: As a player, I want to share match highlights so that I can show off my victories

**Independent Test**: Win match → See shareable link → Share URL works → Link shows match summary with transactions

### Share URL Generation

- [ ] T100 [P] [US6] Create share URL builder in src/lib/share/url-builder.ts (generate match summary URL)
- [ ] T101 [P] [US6] Create Open Graph meta generator in src/lib/share/og-meta.ts (title, description, image)

### Share UI

- [ ] T102 [US6] Create ShareMatchButton in src/components/share/ShareMatchButton.tsx (copy link, social share)
- [ ] T103 [US6] Integrate share button in MatchResults component

### Match Summary Page

- [ ] T104 [US6] Create public match page at src/app/m/[matchId]/page.tsx (shareable, no wallet required)
- [ ] T105 [US6] Create MatchSummary component in src/components/share/MatchSummary.tsx (winner, rounds, explorer links)
- [ ] T106 [US6] Generate OG image for match share at src/app/m/[matchId]/opengraph-image.tsx

**Checkpoint**: User Story 6 complete - match results shareable with OG previews

---

## Phase 9: User Story 7 - PWA/Mobile (Priority: P7)

**Goal**: As a player, I want to play on my mobile device so that I can play anywhere

**Independent Test**: Open on mobile → Responsive layout → Touch controls work → Install as PWA

### PWA Configuration

- [ ] T107 [P] [US7] Create manifest.json for PWA in public/manifest.json
- [ ] T108 [P] [US7] Create service worker in public/sw.js (offline caching)
- [ ] T109 [US7] Configure PWA meta tags in src/app/layout.tsx (theme-color, icons)

### Responsive Design

- [ ] T110 [US7] Make FightScene responsive in src/game/scenes/FightScene.ts (scale to viewport)
- [ ] T111 [US7] Create mobile move controls in src/game/ui/MobileControls.ts (touch-friendly buttons)
- [ ] T112 [US7] Add responsive breakpoints to all page components

### Touch Optimization

- [ ] T113 [US7] Add touch event handlers to PhaserGame in src/components/game/PhaserGame.tsx
- [ ] T114 [US7] Create swipe gesture support for moves in src/game/input/TouchInput.ts

**Checkpoint**: User Story 7 complete - mobile-optimized PWA experience

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final polish, performance, and documentation

### Performance Optimization

- [ ] T115 [P] Implement code splitting for game scenes in src/game/
- [ ] T116 [P] Add image optimization for character sprites
- [ ] T117 [P] Configure Supabase connection pooling
- [ ] T118 Optimize bundle size to <500KB (analyze and tree-shake)

### Error Handling & Edge Cases

- [ ] T119 [P] Add reconnection handling in src/hooks/useGameChannel.ts (state_sync on reconnect)
- [ ] T120 [P] Add transaction timeout handling in src/lib/game/move-service.ts
- [ ] T121 Add graceful degradation when relayer unavailable

### Documentation

- [ ] T122 [P] Create README.md with setup instructions
- [ ] T123 [P] Document API endpoints in docs/api.md
- [ ] T124 [P] Create CONTRIBUTING.md for hackathon teammates

### Final Validation

- [ ] T125 Run through quickstart.md validation checklist
- [ ] T126 Verify all constitution.md principles are met (code quality, UX consistency, performance)
- [ ] T127 Demo run: complete full match flow end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - US1 (1v1 Match) and US2 (Wallet/Matchmaking) should be done first as they are P1/P2
  - US3 (Character Select) integrates between US2 and US1 flow
  - US4-US7 can proceed in parallel or priority order
- **Polish (Phase 10)**: Depends on US1-US3 minimum being complete

### User Story Dependencies

| Story | Can Start After | Integrates With |
|-------|-----------------|-----------------|
| US1 (1v1 Match) | Phase 2 Complete | - |
| US2 (Wallet/Matchmaking) | Phase 2 Complete | US1 (starts matches) |
| US3 (Character Select) | Phase 2 Complete | US1 (pre-match flow) |
| US4 (Practice Mode) | Phase 2 Complete | Independent |
| US5 (Leaderboard) | Phase 2 Complete | US1 (uses match data) |
| US6 (Share Highlights) | US1 Complete | US1 (shares match results) |
| US7 (PWA/Mobile) | US1 Complete | All UI components |

### Within Each User Story

- Models/types before services
- Services before UI components
- API endpoints before frontend hooks
- Core implementation before integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, US1, US2, US3, US4 can start in parallel
- Within each story, tasks marked [P] can run in parallel

---

## Parallel Examples

### Phase 2 Parallel Launch
```
# Types (all parallel)
T010: src/types/index.ts
T011: src/types/websocket.ts
T012: src/types/api.ts
T013: src/types/constants.ts

# Clients (parallel)
T019: src/lib/supabase/client.ts
T020: src/lib/supabase/server.ts
T023: src/game/config.ts
T024: src/game/EventBus.ts
```

### User Story 1 Parallel Launch
```
# Game engine components (parallel)
T033: src/game/scenes/FightScene.ts
T034: src/game/sprites/FighterSprite.ts
T035: src/game/ui/MoveButton.ts
```

### User Story 2+3+4 Parallel (after Phase 2)
```
# Different stories, no conflicts
Team A → US2: Wallet/Matchmaking
Team B → US3: Character Selection  
Team C → US4: Practice Mode
```

---

## Implementation Strategy

### MVP First (Hackathon Demo)

1. ✅ Complete Phase 1: Setup
2. ✅ Complete Phase 2: Foundational (CRITICAL)
3. ✅ Complete Phase 3: US1 (1v1 Match)
4. ✅ Complete Phase 4: US2 (Wallet/Matchmaking)
5. ✅ Complete Phase 5: US3 (Character Select)
6. **STOP and DEMO**: Full match flow ready for hackathon judges

### Incremental Delivery

| Milestone | Stories Included | Demo Capability |
|-----------|------------------|-----------------|
| MVP | US1 + US2 + US3 | Connect wallet → Match → Fight → Win |
| Enhanced | + US4 | Add practice mode for new players |
| Social | + US5 + US6 | Leaderboard and sharing |
| Mobile | + US7 | PWA mobile experience |

---

## Notes

- **No tests included**: Tests were not requested in the feature specification
- **Kaspa SDK**: Uses fresh @aspect-staking/kaspa-wasm-web from research.md
- **Phaser**: Dynamic import with `{ ssr: false }` required for all game components
- **Supabase Realtime**: Use Broadcast for game events, Presence for queue
- **Constitution Compliance**: All tasks align with code quality, UX consistency, and performance principles
- **Performance Targets**: <3s initial load, 60fps gameplay, <2s move confirmation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Phase 1: Setup | 9 | 5 |
| Phase 2: Foundational | 23 | 14 |
| Phase 3: US1 (1v1 Match) | 25 | 6 |
| Phase 4: US2 (Wallet/Matchmaking) | 16 | 5 |
| Phase 5: US3 (Character Select) | 11 | 2 |
| Phase 6: US4 (Practice Mode) | 7 | 1 |
| Phase 7: US5 (Leaderboard) | 8 | 2 |
| Phase 8: US6 (Share Highlights) | 7 | 2 |
| Phase 9: US7 (PWA/Mobile) | 8 | 2 |
| Phase 10: Polish | 13 | 7 |
| **TOTAL** | **127** | **46** |
