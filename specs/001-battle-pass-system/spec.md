# Feature Specification: Battle Pass & Progression System

**Feature Branch**: `001-battle-pass-system`  
**Created**: January 7, 2026  
**Status**: Draft  
**Input**: User description: "Enhance the KaspaClash game with a free battle pass system that rewards players with progression tiers unlocked through gameplay achievements, daily quests, and XP earned from matches, to increase player engagement and retention without any pay-to-win elements. Introduce a variety of cosmetic items such as character skins, emotes, victory poses, and profile badges that players can unlock and equip to personalize their experience, fostering a sense of accomplishment and community flair. Add new game modes including an endless survival mode against escalating AI waves for high-score challenges and a combo challenge mode for practicing and building attack chains, to provide more variety and replayability while keeping core gameplay skill-based. Implement an in-game shop where players can spend a purely earned currency, like Clash Shards, obtained solely from playing matches, completing quests, and achieving milestones, on cosmetic items only, ensuring fairness and motivating consistent play. Include a prestige system for resetting progress in exchange for permanent earn bonuses and exclusive auras, along with replay functionality to review and share matches, all integrated to highlight Kaspa L1's fast transactions for optional on-chain verifications like leaderboard anchors or prestige badges, ultimately making the game more addictive, social, and demonstrative of Kaspa's blockchain strengths."

## User Scenarios & Testing

### User Story 1 - Battle Pass Progression & Unlocks (Priority: P1)

New and returning players want to feel rewarded for playing matches and see tangible progression that motivates them to keep playing without requiring any purchases.

**Why this priority**: Core engagement loop - without progression rewards, players lack motivation to continue playing. This is the foundation for all other systems.

**Independent Test**: Can be fully tested by playing matches, earning XP, and unlocking rewards at tier milestones. Delivers immediate value through visible progression and cosmetic unlocks.

**Acceptance Scenarios**:

1. **Given** a new player completes their first match, **When** the match ends, **Then** they earn XP and see a progress bar showing advancement toward the next battle pass tier
2. **Given** a player reaches a new battle pass tier, **When** the tier unlocks, **Then** they receive rewards (cosmetic items, currency, profile items) and see a celebratory unlock animation
3. **Given** a player views their battle pass screen, **When** they scroll through tiers, **Then** they can see all 50 tiers with locked/unlocked status and what rewards each tier contains
4. **Given** a player earns XP from various sources (match wins, daily quests, achievements), **When** XP is added, **Then** it contributes to their current tier progress and displays correctly
5. **Given** a battle pass season ends, **When** a new season starts, **Then** the player's tier resets to 1 while retaining unlocked cosmetics and their profile shows season history

---

### User Story 2 - Daily Quest System (Priority: P2)

Players want daily objectives that provide focused goals and bonus rewards to encourage regular play sessions without feeling repetitive.

**Why this priority**: Drives daily active users (DAU) and provides structured goals. Can be implemented independently after battle pass core is functional.

**Independent Test**: Can be tested by logging in daily, viewing available quests, completing objectives, and claiming rewards. Delivers standalone value through daily engagement incentives.

**Acceptance Scenarios**:

1. **Given** a player logs in for the day, **When** they view the daily quests screen, **Then** they see 3 active quests with clear objectives and XP/currency rewards
2. **Given** a player completes a quest objective (e.g., "Win 3 matches"), **When** the condition is met, **Then** the quest shows as complete and allows claiming rewards
3. **Given** a player claims all daily quest rewards, **When** the daily reset occurs (24 hours), **Then** 3 new random quests appear
4. **Given** a player has unclaimed quest rewards, **When** they claim them, **Then** they immediately receive Clash Shards and XP with visual feedback
5. **Given** a player skips days, **When** they return, **Then** only current day's quests are available (no retroactive quests)

---

### User Story 3 - Cosmetic Shop & Currency System (Priority: P2)

Players want to spend earned in-game currency on cosmetic items they desire, providing agency and personalization without any pay-to-win mechanics.

**Why this priority**: Provides clear reward sink and personalization options. Builds on progression system currency rewards.

**Independent Test**: Can be tested by earning Clash Shards through play, browsing shop items, purchasing cosmetics, and equipping them. Delivers value through player expression and choice.

**Acceptance Scenarios**:

1. **Given** a player has earned Clash Shards, **When** they open the shop, **Then** they see cosmetic items organized by category (skins, emotes, victory poses, badges) with prices and preview options
2. **Given** a player selects a shop item, **When** they preview it, **Then** they see a visual demonstration (3D preview for skins, animation for emotes/poses)
3. **Given** a player has sufficient Clash Shards, **When** they purchase an item, **Then** the currency is deducted, the item is added to their inventory, and they receive purchase confirmation
4. **Given** a player owns cosmetic items, **When** they access their inventory/loadout screen, **Then** they can equip items to their profile or characters
5. **Given** shop inventory rotates, **When** rotation occurs, **Then** featured items refresh while maintaining permanent shop sections

---

### User Story 4 - Survival Mode (Priority: P3)

Players want an endless challenge mode that tests their skills against increasingly difficult AI opponents to compete for high scores and earn bonus rewards.

**Why this priority**: Adds replayability and competitive solo content. Can be developed independently as a separate game mode.

**Independent Test**: Can be tested by launching survival mode, fighting wave after wave, tracking scores, and earning rewards. Delivers standalone value as additional content.

**Acceptance Scenarios**:

1. **Given** a player selects survival mode, **When** they start, **Then** they face an AI opponent in wave 1 with standard difficulty
2. **Given** a player defeats a wave, **When** the wave ends, **Then** they receive a brief rest period and the next wave begins with increased AI difficulty and health
3. **Given** a player is defeated in survival, **When** the match ends, **Then** their final wave number, score, and rewards (XP, Clash Shards) are displayed
4. **Given** a player achieves a new personal best, **When** survival ends, **Then** their high score is saved and displayed on a survival leaderboard
5. **Given** a player reaches milestone waves (10, 25, 50), **When** the milestone is hit, **Then** they receive bonus rewards and special recognition

---

### User Story 5 - Combo Challenge Mode (Priority: P3)

Players want a dedicated practice mode to master combat mechanics, learn optimal move chains, and improve their skills in a low-pressure environment.

**Why this priority**: Improves player skill and reduces barrier to competitive play. Can be implemented independently as training content.

**Independent Test**: Can be tested by entering combo challenge mode, following tutorials, executing combos, and receiving feedback. Delivers value through skill development.

**Acceptance Scenarios**:

1. **Given** a player selects combo challenge mode, **When** they enter, **Then** they see a list of combo challenges categorized by difficulty (beginner, intermediate, advanced)
2. **Given** a player starts a combo challenge, **When** it begins, **Then** they see on-screen instructions showing the required move sequence and timing
3. **Given** a player executes moves, **When** inputs are detected, **Then** real-time feedback shows correct/incorrect inputs and combo chain progress
4. **Given** a player successfully completes a combo, **When** the challenge ends, **Then** they earn stars (1-3 based on performance), XP, and unlock next challenge
5. **Given** a player completes all challenges, **When** reviewing their progress, **Then** they see overall mastery percentage and total stars earned

---

### User Story 6 - Character Customization & Cosmetics (Priority: P2)

Players want to personalize their characters with unique skins, emotes, victory poses, and profile badges to express their identity and showcase accomplishments.

**Why this priority**: Core feature for player expression and retention. Depends on shop system but can be developed in parallel.

**Independent Test**: Can be tested by unlocking/purchasing cosmetics, accessing loadout screen, equipping items, and seeing them in matches. Delivers immediate personalization value.

**Acceptance Scenarios**:

1. **Given** a player unlocks a character skin, **When** they equip it in the loadout screen, **Then** their character appears with the new skin in all matches and menus
2. **Given** a player unlocks emotes, **When** they use an emote during match preparation or victory, **Then** the character performs the emote animation
3. **Given** a player unlocks a victory pose, **When** they win a match, **Then** their character performs the custom victory pose instead of the default
4. **Given** a player unlocks profile badges, **When** they equip badges to their profile, **Then** the badges display on their player card visible to all players
5. **Given** a player views another player's profile, **When** the profile loads, **Then** they see that player's equipped cosmetics, badges, and customization

---

### User Story 7 - Prestige System (Priority: P4)

Dedicated players want the option to reset their battle pass progress in exchange for permanent bonuses and exclusive prestige rewards that demonstrate their commitment.

**Why this priority**: Endgame content for highly engaged players. Can be implemented after core progression is stable.

**Independent Test**: Can be tested by reaching max tier, choosing to prestige, receiving permanent bonuses, and continuing progression. Delivers value for long-term players.

**Acceptance Scenarios**:

1. **Given** a player reaches tier 50, **When** they view the prestige option, **Then** they see a clear explanation of what resets, what they keep, and what bonuses they gain
2. **Given** a player confirms prestige, **When** it activates, **Then** their tier resets to 1, they receive a prestige level badge and permanent XP/currency boost (e.g., +10% per prestige)
3. **Given** a player has prestiged, **When** they earn XP, **Then** the prestige bonus multiplier applies to all XP gains
4. **Given** a player has multiple prestige levels, **When** viewing their profile, **Then** their prestige level is prominently displayed with exclusive auras/visual effects
5. **Given** prestige rewards exist, **When** a player reaches certain prestige levels, **Then** they unlock exclusive cosmetics only available through prestige

---

### User Story 8 - Match Replay System (Priority: P3)

Players want to review their completed matches to analyze gameplay, share victories, and learn from defeats with full replay functionality.

**Why this priority**: Enhances social features and learning. Can be implemented independently using existing match data. Note: Basic replay functionality already exists in the codebase.

**Independent Test**: Can be tested by playing a match, accessing replay from match history, watching the replay with controls, and sharing it. Delivers value for improvement and sharing.

**Acceptance Scenarios**:

1. **Given** a player completes a match, **When** they view their match history, **Then** each match has a "Watch Replay" button
2. **Given** a player starts a replay, **When** it loads, **Then** the match plays back with full combat animations and UI showing both players' perspectives
3. **Given** a replay is playing, **When** the player uses controls, **Then** they can pause, play, speed up (2x, 4x), and scrub through the replay timeline
4. **Given** a player watches a replay, **When** they finish, **Then** they see match statistics and have options to share or re-watch
5. **Given** a player wants to share a replay, **When** they use the share feature, **Then** they get a shareable link or can export the match as a video file

---

### User Story 9 - Achievement System (Priority: P3)

Players want to unlock achievements for accomplishing specific feats and milestones that provide goals beyond standard progression.

**Why this priority**: Adds depth to progression and rewards mastery. Can be implemented independently with event tracking.

**Independent Test**: Can be tested by completing achievement conditions, receiving unlock notifications, and viewing achievement collection. Delivers standalone collection value.

**Acceptance Scenarios**:

1. **Given** a player performs an achievement-worthy action (e.g., "Win 100 matches"), **When** the condition is met, **Then** they see an achievement unlock notification with XP/currency rewards
2. **Given** a player views the achievements screen, **When** it loads, **Then** they see all achievements organized by category with progress bars for incomplete ones
3. **Given** achievements have tiers (bronze, silver, gold), **When** a player completes a tier, **Then** the next tier becomes active with increased requirements
4. **Given** a player unlocks all achievements in a category, **When** completion occurs, **Then** they earn a special mastery badge and bonus rewards
5. **Given** rare/secret achievements exist, **When** a player discovers them, **Then** they receive surprise unlocks without prior visibility

---

### User Story 10 - Blockchain Integration for Leaderboards & Prestige (Priority: P4)

Players want optional on-chain verification of their achievements and leaderboard rankings using Kaspa L1 to demonstrate authenticity and permanence.

**Why this priority**: Showcases Kaspa blockchain technology. Optional feature for advanced users interested in verified achievements.

**Independent Test**: Can be tested by opting in to blockchain verification, anchoring achievements, and viewing verified status. Delivers value for blockchain-interested players.

**Acceptance Scenarios**:

1. **Given** a player reaches a leaderboard top position, **When** they opt in to blockchain verification, **Then** their ranking is anchored to Kaspa L1 with a transaction hash
2. **Given** a player achieves a prestige level, **When** they verify it on-chain, **Then** they receive a blockchain badge visible on their profile with verification link
3. **Given** a player views verified achievements, **When** they click verification details, **Then** they see the Kaspa transaction hash and can view it on a block explorer
4. **Given** blockchain verification is optional, **When** players choose not to use it, **Then** all features work identically without requiring wallet connections
5. **Given** Kaspa L1 fast transactions, **When** verification occurs, **Then** confirmation completes in under 10 seconds with minimal fees

---

### Edge Cases

- What happens when a player gains enough XP to skip multiple battle pass tiers at once? (All rewards should be granted sequentially with appropriate visual feedback)
- How does the system handle daily quest completion near the daily reset time? (Quests must have a clear timezone-based reset with grace period)
- What happens if a player tries to purchase a cosmetic item they already own? (Purchase button should be disabled/show "Owned" status)
- How does survival mode handle disconnections mid-wave? (Progress should not be saved; player resumes from wave 1 on next attempt)
- What happens when a player attempts to prestige but has unclaimed battle pass rewards? (System should warn and require claiming or offer to auto-claim before prestiging)
- How does replay functionality handle matches from previous game versions with different mechanics? (Replays should include version metadata and gracefully handle missing data)
- What happens if a player runs out of Clash Shards while in the shop? (Clear messaging about insufficient funds with prompts to earn more through gameplay)
- How does the system handle season transitions while a player is mid-match? (Season changes should only take effect between matches, not during active gameplay)
- What happens when a daily quest objective becomes impossible (e.g., "Play with character X" when character is temporarily disabled)? (Quest should auto-refresh or provide alternative)
- How does blockchain verification handle network congestion or wallet connection failures? (Graceful fallback with retry options and clear error messaging without blocking gameplay)

## Requirements

### Functional Requirements

#### Battle Pass & Progression

- **FR-001**: System MUST provide a battle pass with 50 tiers per season, where each tier requires progressively more XP to unlock
- **FR-002**: System MUST award XP to players based on match performance (win/loss, rounds won, damage dealt, combo efficiency)
- **FR-003**: System MUST display real-time XP gains and tier progression after each match with visual feedback
- **FR-004**: System MUST grant rewards at each tier milestone, including Clash Shards, cosmetic items, and profile customization options
- **FR-005**: System MUST reset battle pass progression to tier 1 at the start of each season (suggested duration: 8-12 weeks per season)
- **FR-006**: System MUST preserve unlocked cosmetics and earned currency across season resets
- **FR-007**: System MUST display current tier, XP progress to next tier, and total season XP on player profile

#### Daily Quest System

- **FR-008**: System MUST provide 3 daily quests per player that refresh every 24 hours at a consistent reset time (suggested: midnight UTC)
- **FR-009**: System MUST generate quests from a diverse pool including objectives like "Win X matches," "Deal X damage," "Complete X rounds," "Use specific character Y times," "Complete matches without losing a round"
- **FR-010**: System MUST display quest progress in real-time as players complete objectives
- **FR-011**: System MUST reward completed quests with Clash Shards and bonus XP (suggested: 500-1500 XP, 100-300 Clash Shards per quest)
- **FR-012**: System MUST allow manual claiming of quest rewards with visual celebration
- **FR-013**: System MUST track quest completion history for player statistics
- **FR-014**: System MUST not carry over uncompleted quests from previous days

#### Currency System (Clash Shards)

- **FR-015**: System MUST provide Clash Shards as the sole in-game currency, earned only through gameplay
- **FR-016**: System MUST award Clash Shards for match completion (scaling with performance), quest completion, tier unlocks, and achievement completion
- **FR-017**: System MUST display current Clash Shards balance prominently in UI
- **FR-018**: System MUST persist Clash Shards across sessions and seasons
- **FR-019**: System MUST never allow real money purchases of Clash Shards or any gameplay advantages
- **FR-020**: System MUST provide clear currency transaction history (earned from, spent on)

#### Cosmetic Shop

- **FR-021**: System MUST provide an in-game shop selling only cosmetic items for Clash Shards
- **FR-022**: System MUST categorize shop items into: Character Skins, Emotes, Victory Poses, Profile Badges, Profile Frames, Title Cards
- **FR-023**: System MUST display items with preview functionality showing visual appearance before purchase
- **FR-024**: System MUST rotate featured items on a regular schedule (suggested: weekly) while maintaining permanent shop sections
- **FR-025**: System MUST clearly show item prices, rarity tiers, and ownership status (owned/locked)
- **FR-026**: System MUST prevent duplicate purchases of already-owned items
- **FR-027**: System MUST include items at various price points (suggested range: 500-5000 Clash Shards)
- **FR-028**: System MUST confirm purchases and show transaction success/failure clearly

#### Cosmetic Customization

- **FR-029**: System MUST provide a loadout/customization screen where players equip cosmetic items
- **FR-030**: System MUST apply equipped character skins to player characters in all match modes and menus
- **FR-031**: System MUST allow players to equip and trigger emotes during pre-match and post-match phases
- **FR-032**: System MUST display custom victory poses when a player wins a match
- **FR-033**: System MUST display equipped profile badges, frames, and title cards on player profiles visible to all users
- **FR-034**: System MUST save cosmetic loadout preferences per character
- **FR-035**: System MUST show other players' equipped cosmetics in matches and profile views

#### Survival Mode

- **FR-036**: System MUST provide an endless survival mode where players face consecutive AI opponents in waves
- **FR-037**: System MUST increase AI difficulty with each wave through stat scaling (health, damage, reaction speed)
- **FR-038**: System MUST track current wave number, total score, and damage dealt during survival runs
- **FR-039**: System MUST end survival mode when player's character is defeated
- **FR-040**: System MUST display final statistics (waves survived, score, time) and award rewards based on performance
- **FR-041**: System MUST maintain a survival leaderboard showing top scores and wave records
- **FR-042**: System MUST award bonus XP and Clash Shards for milestone waves (suggested: every 5 or 10 waves)
- **FR-043**: System MUST allow players to restart survival mode immediately after defeat
- **FR-044**: System MUST provide brief rest periods between waves (suggested: 5-10 seconds) for player recovery

#### Combo Challenge Mode

- **FR-045**: System MUST provide a combo challenge mode with structured training scenarios
- **FR-046**: System MUST organize challenges by difficulty level (beginner, intermediate, advanced, expert)
- **FR-047**: System MUST display required move sequences and timing windows for each challenge
- **FR-048**: System MUST provide real-time input feedback showing correct/incorrect moves during challenge attempts
- **FR-049**: System MUST award stars (1-3) based on performance metrics (speed, accuracy, style)
- **FR-050**: System MUST unlock subsequent challenges progressively as players complete earlier ones
- **FR-051**: System MUST award XP and Clash Shards for challenge completion
- **FR-052**: System MUST track overall challenge completion percentage and total stars earned
- **FR-053**: System MUST allow unlimited retry attempts on challenges without penalty

#### Prestige System

- **FR-054**: System MUST allow players to prestige after reaching maximum battle pass tier (tier 50)
- **FR-055**: System MUST clearly communicate prestige requirements, benefits, and consequences before activation
- **FR-056**: System MUST reset player battle pass tier to 1 upon prestiging
- **FR-057**: System MUST preserve all unlocked cosmetics, earned currency, and lifetime statistics when prestiging
- **FR-058**: System MUST grant permanent XP and currency multiplier bonuses with each prestige level (suggested: +10% per prestige)
- **FR-059**: System MUST apply prestige multipliers to all future XP and Clash Shards earnings
- **FR-060**: System MUST award exclusive prestige-only cosmetics at specific prestige milestones
- **FR-061**: System MUST display prestige level prominently on player profile with unique visual effects (auras, borders)
- **FR-062**: System MUST track total prestige count and display it on leaderboards
- **FR-063**: System MUST limit prestige to once per season to prevent excessive resets

#### Match Replay System

- **FR-064**: System MUST record all completed matches with full round data for replay functionality
- **FR-065**: System MUST allow players to access replays from their match history for recent matches (suggested: last 20 matches)
- **FR-066**: System MUST play back replays with accurate recreation of combat animations, moves, and outcomes
- **FR-067**: System MUST provide playback controls: play, pause, speed adjustment (1x, 2x, 4x, 8x), timeline scrubbing
- **FR-068**: System MUST display match metadata during replay (player names, characters, round scores, timestamp)
- **FR-069**: System MUST allow replay sharing via generated shareable links
- **FR-070**: System MUST support replay export as video files for external sharing
- **FR-071**: System MUST store replay data efficiently to minimize storage requirements
- **FR-072**: System MUST handle replay data for matches played with different game versions gracefully

#### Achievement System

- **FR-073**: System MUST provide an achievement system with diverse accomplishment goals
- **FR-074**: System MUST categorize achievements by type: Combat (win streaks, perfect rounds), Mastery (character-specific feats), Progression (tier/prestige milestones), Collection (cosmetics owned), Social (matches played with others)
- **FR-075**: System MUST track progress toward incomplete achievements with visible progress bars
- **FR-076**: System MUST notify players immediately when achievements are unlocked with celebratory visuals
- **FR-077**: System MUST award XP and Clash Shards for achievement completion
- **FR-078**: System MUST provide tiered achievements (bronze, silver, gold, platinum) with escalating requirements
- **FR-079**: System MUST include hidden/secret achievements that are discovered through gameplay
- **FR-080**: System MUST display total achievement completion percentage on player profile
- **FR-081**: System MUST persist achievement progress and unlocks across sessions and seasons

#### Blockchain Integration (Optional)

- **FR-082**: System MUST provide optional on-chain verification using Kaspa L1 for leaderboard rankings and prestige milestones
- **FR-083**: System MUST allow players to opt-in to blockchain verification without requiring it for core gameplay
- **FR-084**: System MUST create Kaspa blockchain transactions anchoring verified achievements with timestamp and player identifier
- **FR-085**: System MUST display verification status (verified/unverified) on player profiles and leaderboards
- **FR-086**: System MUST provide transaction hashes and block explorer links for verified achievements
- **FR-087**: System MUST handle blockchain transaction failures gracefully with retry options
- **FR-088**: System MUST complete verification transactions within 10 seconds leveraging Kaspa's fast block times
- **FR-089**: System MUST minimize transaction fees to make verification accessible
- **FR-090**: System MUST protect player privacy by using pseudonymous identifiers on-chain

### Key Entities

- **Player Profile**: Represents player identity with username, wallet address (optional), current tier, prestige level, XP total, Clash Shards balance, equipped cosmetics, achievement progress, match history, and statistics
- **Battle Pass Season**: Represents a time-bound progression period with season number, start/end dates, 50 tier definitions with rewards, theme/name, and active status
- **Tier**: Individual progression milestone with tier number, XP requirement, reward bundle (currency, cosmetics, items), unlock status per player
- **Daily Quest**: Time-limited objective with quest ID, description, objective type and target value, XP/currency rewards, completion status, reset timestamp
- **Cosmetic Item**: Customization content with unique ID, type (skin/emote/pose/badge/frame), rarity tier, price in Clash Shards, preview assets, unlock requirement (tier/prestige/achievement), ownership tracking per player
- **Clash Shards**: Primary currency with transaction history, earned sources (match/quest/achievement/tier), spent destinations (shop purchases), current balance
- **Match Record**: Historical match data with match ID, players involved, characters used, outcome, round-by-round data, timestamp, replay data
- **Survival Run**: Survival mode session with run ID, player, waves reached, final score, duration, rewards earned, leaderboard eligibility
- **Combo Challenge**: Training scenario with challenge ID, difficulty tier, required move sequence, timing windows, star thresholds, completion records per player
- **Achievement**: Accomplishment goal with unique ID, category, title/description, objective criteria, tier level, progress tracking per player, XP/currency rewards, associated cosmetics (if any)
- **Prestige Level**: Advanced progression status with prestige number, activation timestamp, permanent bonuses granted (XP/currency multipliers), exclusive rewards unlocked
- **Blockchain Verification Record**: On-chain anchor with Kaspa transaction hash, verified achievement type (leaderboard rank, prestige level, milestone), player identifier, timestamp, block height

## Success Criteria

### Measurable Outcomes

- **SC-001**: Players can complete at least 1 daily quest within a typical 15-minute play session
- **SC-002**: Battle pass tier progression is visible and rewarding, with average players unlocking at least 30 tiers per 10-week season through normal play
- **SC-003**: Average session duration increases by at least 25% compared to pre-feature baseline
- **SC-004**: Daily active user (DAU) retention rate improves by at least 15% week-over-week
- **SC-005**: At least 70% of active players engage with the cosmetic customization system within their first week
- **SC-006**: Shop purchases occur at an average rate of at least 2 cosmetic items per player per week
- **SC-007**: Survival mode is played by at least 40% of the player base within the first month of launch
- **SC-008**: Combo challenge completion rate for beginner challenges exceeds 80%, demonstrating effective skill development
- **SC-009**: At least 10% of players reaching tier 50 choose to prestige within the same season
- **SC-010**: Match replay views account for at least 5% of total matches played, indicating engagement with review features
- **SC-011**: Players who complete daily quests have 40% higher next-day return rate compared to those who don't
- **SC-012**: Blockchain verification (when opted in) completes successfully in under 10 seconds in 95% of cases
- **SC-013**: Average Clash Shards earnings per hour of gameplay remain balanced between 800-1200 shards
- **SC-014**: Achievement unlock rate averages at least 1 achievement per player every 3 play sessions
- **SC-015**: Player satisfaction scores (via in-game feedback) for progression and rewards exceed 4.0/5.0
- **SC-016**: Social sharing of replays and achievements increases external visibility by at least 30% measured by referral traffic
- **SC-017**: Survival mode high score leaderboard attracts active competition with weekly score improvements
- **SC-018**: Prestige system participation grows to at least 20% of the tier-50 player population by end of third season

## Assumptions

- Players value cosmetic customization and will engage with non-pay-to-win progression systems
- Daily quest refresh at a consistent global time (UTC midnight) is acceptable to players across timezones
- 8-12 week season length provides sufficient time for average players to reach meaningful progression (tier 30+) without excessive grind
- XP and Clash Shards earn rates can be balanced through iterative tuning to achieve target progression pacing
- Existing match data structures support replay recording without major architectural changes (basic replay functionality exists)
- Kaspa L1 blockchain infrastructure is accessible and reliable for optional verification features
- Players have sufficient storage for replay data (last 20 matches) without performance degradation
- AI difficulty scaling in survival mode can be implemented using existing combat engine parameters
- Cosmetic item creation (skins, emotes, poses) is feasible within art production capacity
- Shop rotation and featured items can be managed through configuration without requiring deployments
- Prestige multiplier bonuses (+10% per level) provide meaningful incentive without creating excessive power gaps
- Achievement criteria can leverage existing gameplay event tracking systems
- Combo challenge timing windows and input detection can provide consistent feedback across different network conditions
- Blockchain verification remains optional and does not create barriers for non-crypto-native players
- Players understand the difference between permanent unlocks (cosmetics) and seasonal resets (tier progress)
