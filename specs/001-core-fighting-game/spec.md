# Feature Specification: KaspaClash Core Fighting Game

**Feature Branch**: `001-core-fighting-game`  
**Created**: 2025-12-31  
**Status**: Draft  
**Input**: User description: "Build a browser-based, real-time multiplayer fighting game called KaspaClash that showcases Kaspa's sub-second block times and microscopic transaction fees in the most fun, memorable, and visually impressive way possible."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete a 1v1 Match with On-Chain Moves (Priority: P1)

Two players connect their Kaspa wallets, enter a match, and play a complete best-of-3 fighting round where every move (punch, kick, block, special attack) is executed via real Kaspa transactions. Moves resolve within 2 seconds, and both players experience smooth animations, health bar updates, and a clear winner declaration.

**Why this priority**: This is the core proof-of-concept that demonstrates Kaspa's speed advantage. Without this working flawlessly, the game has no value. It directly addresses the hackathon's "Gaming & Interactive" track and the primary goal of proving "internet-speed" blockchain transactions.

**Independent Test**: Two users can open the game in separate browsers, connect wallets, play a full match, and verify all moves were recorded on-chain via Kaspa explorer.

**Acceptance Scenarios**:

1. **Given** two players with connected Kaspa wallets in a match lobby, **When** both players select their moves and confirm transactions, **Then** both transactions confirm within 2 seconds and corresponding move animations play simultaneously for both players.

2. **Given** a match in progress with both players at starting health, **When** Player A selects "punch" and Player B selects "block", **Then** the block animation plays, punch damage is reduced, health bars update correctly, and a visual feedback indicator shows "BLOCKED!"

3. **Given** a match where one player's health reaches zero, **When** the final damaging move lands, **Then** a KO animation plays, the round winner is declared, and the match progresses to the next round (or victory screen if best-of-3 complete).

4. **Given** a completed best-of-3 match, **When** one player wins 2 rounds, **Then** a victory celebration screen displays with the winner's character, match stats, and a shareable link to view the match on Kaspa explorer.

---

### User Story 2 - Connect Wallet and Enter Matchmaking (Priority: P2)

A new player visits the game, connects their Kaspa wallet with one click, and enters Quick Play matchmaking to find an opponent. The player can also create a private room with a shareable code or join an existing room.

**Why this priority**: Wallet connection and matchmaking are prerequisites for gameplay. A smooth onboarding experience is critical for user retention and hackathon demo impressions.

**Independent Test**: A single user can connect their wallet, see their Kaspa address displayed, and enter the matchmaking queue (even if no opponent is found, the queue state is visible).

**Acceptance Scenarios**:

1. **Given** a user on the landing page without a connected wallet, **When** they click "Connect Wallet", **Then** a wallet selection popup appears showing compatible Kaspa wallets (Kaspium, Kasware, or WalletConnect-compatible options).

2. **Given** a user has selected their wallet, **When** they approve the connection request in their wallet, **Then** the game displays their truncated Kaspa address and available balance, and the main menu becomes accessible.

3. **Given** a connected user on the main menu, **When** they click "Quick Play", **Then** they enter a matchmaking queue with a visible "Searching for opponent..." indicator and estimated wait time.

4. **Given** a connected user, **When** they click "Create Private Room", **Then** a unique 6-character room code is generated and displayed with a "Copy Link" button for sharing.

5. **Given** a user with a room code, **When** they enter the code in "Join Room", **Then** they are connected to the waiting host and the character selection screen loads.

---

### User Story 3 - Select Character and Prepare for Battle (Priority: P3)

After matchmaking connects two players, both enter a character selection screen where they choose from a roster of themed fighters. Each character has distinct visual design and personality. After selection, a pre-match screen shows both characters facing off before the fight begins.

**Why this priority**: Character selection adds personality and replayability to the game. It's a standard fighting game expectation and contributes to the visual polish that wins hackathon UX/UI awards.

**Independent Test**: A user can browse the character roster, see each character's design and name, select a character, and see their choice confirmed before a match.

**Acceptance Scenarios**:

1. **Given** two matched players on the character selection screen, **When** the screen loads, **Then** both players see a roster of at least 3 distinct fighters with unique names, portraits, and visual themes.

2. **Given** a player hovering over a character, **When** they click to select, **Then** their choice is confirmed with a visual indicator, and the opponent sees that a selection was made (without revealing which character).

3. **Given** both players have confirmed their character selections, **When** a 5-second countdown completes, **Then** a dramatic "VS" screen displays both selected characters with their names, followed by the arena loading.

---

### User Story 4 - Practice Against Bot Without Transactions (Priority: P4)

A player who wants to learn the game or doesn't have Kaspa funds can enter Practice Mode, where they fight against an AI bot. Moves are simulated locally without requiring real blockchain transactions.

**Why this priority**: Practice mode enables players to experience gameplay without financial barriers, learn controls before risking real matches, and allows demo recordings without requiring two players.

**Independent Test**: A single user can start a practice match, execute all move types, see animations and damage calculations, and complete a match against the bot.

**Acceptance Scenarios**:

1. **Given** a user on the main menu (with or without wallet connected), **When** they click "Practice Mode", **Then** they enter character selection followed by a match against an AI opponent.

2. **Given** a practice match in progress, **When** the player selects a move, **Then** the move executes immediately without any wallet transaction prompt, and the bot responds with its own move.

3. **Given** a practice match, **When** the player wins or loses, **Then** a result screen shows match statistics and offers "Play Again" or "Return to Menu" options.

---

### User Story 5 - View Leaderboard and Match History (Priority: P5)

Players can view a global leaderboard showing top players ranked by wins, and browse their own match history with links to verify each match on Kaspa explorer.

**Why this priority**: On-chain persistence of match data proves the blockchain integration is meaningful, not just superficial. Leaderboards add competitive motivation and social sharing potential.

**Independent Test**: A user can open the leaderboard, see ranked players with win counts, and click on their own match history to see past results with explorer links.

**Acceptance Scenarios**:

1. **Given** a user on the main menu, **When** they click "Leaderboard", **Then** a ranked list displays showing player addresses (truncated), win counts, and win/loss ratios.

2. **Given** a user viewing the leaderboard, **When** they click "My Matches", **Then** a list of their past matches displays with opponent address, result, date, and a "View on Explorer" link.

3. **Given** a completed match, **When** the user clicks "View on Explorer", **Then** a new tab opens showing the Kaspa explorer page with transaction details proving the match occurred on-chain.

---

### User Story 6 - Share Match Highlights (Priority: P6)

After a match, players can generate and share a link that shows match replay data or a summary card suitable for social media sharing.

**Why this priority**: Virality and community engagement are key hackathon success factors. Shareable content extends the game's reach beyond direct players.

**Independent Test**: A user can complete a match, click "Share", and receive a shareable link that displays match results when opened.

**Acceptance Scenarios**:

1. **Given** a completed match on the victory screen, **When** the player clicks "Share Match", **Then** a shareable link is generated and a share modal appears with copy and social media buttons.

2. **Given** someone opens a shared match link, **When** the page loads, **Then** they see a match summary card showing both characters, the winner, round scores, and a "Play KaspaClash" call-to-action.

---

### User Story 7 - Install as Progressive Web App (Priority: P7)

The game works as a responsive Progressive Web App that can be installed on mobile devices and desktops for a native-like experience.

**Why this priority**: PWA support expands accessibility and provides a polished "real app" feel. Mobile-friendly design is increasingly expected and helps with hackathon UX judging.

**Independent Test**: A user on mobile Chrome can install the game to their home screen and launch it as a standalone app with proper icons and splash screen.

**Acceptance Scenarios**:

1. **Given** a user visits the game on a mobile browser, **When** the PWA installation prompt appears, **Then** they can install the game to their home screen with a custom icon.

2. **Given** a user launches the installed PWA, **When** the app opens, **Then** it runs in standalone mode without browser UI, with proper splash screen and full-screen gameplay.

3. **Given** a user is playing on a mobile device, **When** they rotate or resize, **Then** the interface adapts responsively without breaking layouts or cutting off game elements.

---

### Edge Cases

- **Transaction Timeout**: If a player's move transaction doesn't confirm within 10 seconds, the game shows a retry option and doesn't stall the match indefinitely.
- **Opponent Disconnection**: If an opponent disconnects mid-match, the remaining player is notified and can claim a forfeit victory after a 30-second timeout.
- **Insufficient Balance**: If a player's wallet has insufficient KAS for the transaction fee, a friendly error explains the issue and suggests adding funds.
- **Wallet Disconnection**: If wallet connection drops during a match, the game prompts reconnection without losing match state.
- **Simultaneous Move Selection**: Both players select moves within the same block; the game handles transaction ordering deterministically so results are consistent for both players.
- **Browser Refresh**: If a player refreshes during a match, they can rejoin if the match is still active (within the current turn timeout).

## Requirements *(mandatory)*

### Functional Requirements

**Wallet Integration**
- **FR-001**: System MUST support connecting Kaspa-compatible browser wallets (Kaspium, Kasware, or standard wallet protocols).
- **FR-002**: System MUST display the connected wallet's address and available KAS balance.
- **FR-003**: System MUST prompt wallet signature/transaction approval for each game move.
- **FR-004**: System MUST detect and gracefully handle wallet disconnection scenarios.

**Matchmaking & Lobbies**
- **FR-005**: System MUST provide Quick Play matchmaking that pairs two waiting players.
- **FR-006**: System MUST allow creation of private rooms with unique shareable codes.
- **FR-007**: System MUST allow players to join private rooms using a room code.
- **FR-008**: System MUST show matchmaking status (searching, opponent found, connecting).

**Character Selection**
- **FR-009**: System MUST display a roster of at least 3 visually distinct fighter characters.
- **FR-010**: System MUST allow both players to select characters within a time limit.
- **FR-011**: System MUST hide opponent's character selection until both confirm.

**Core Gameplay**
- **FR-012**: System MUST support simultaneous turn-based move selection (punch, kick, block, special attack).
- **FR-013**: System MUST execute moves by sending Kaspa transactions with move data encoded.
- **FR-014**: System MUST listen to the Kaspa blockchain in real-time for transaction confirmations.
- **FR-015**: System MUST trigger move animations within 500ms of transaction confirmation.
- **FR-016**: System MUST calculate and display damage based on move interactions (attack vs block, attack vs attack).
- **FR-017**: System MUST maintain and display health bars for both players.
- **FR-018**: System MUST detect KO condition when a player's health reaches zero.
- **FR-019**: System MUST support best-of-3 or best-of-5 match format with round tracking.

**Visual Feedback**
- **FR-020**: System MUST display smooth character animations for all move types.
- **FR-021**: System MUST show particle effects for hits, blocks, and special attacks.
- **FR-022**: System MUST display combo feedback and damage numbers.
- **FR-023**: System MUST show transaction status indicators (pending, confirmed).
- **FR-024**: System MUST display victory/defeat screens with match statistics.

**Practice Mode**
- **FR-025**: System MUST provide a practice mode with AI opponent.
- **FR-026**: Practice mode MUST NOT require wallet transactions for moves.
- **FR-027**: Practice mode MUST use the same visual and gameplay mechanics as online matches.

**Persistence & Leaderboard**
- **FR-028**: System MUST record match results using Kaspa transaction metadata.
- **FR-029**: System MUST display a global leaderboard ranked by player wins.
- **FR-030**: System MUST provide match history with Kaspa explorer links.

**Sharing & Social**
- **FR-031**: System MUST generate shareable links for completed matches.
- **FR-032**: Shared links MUST display match summary without requiring wallet connection.

**Platform & Accessibility**
- **FR-033**: System MUST function as an installable Progressive Web App.
- **FR-034**: System MUST be fully responsive across desktop and mobile screen sizes.
- **FR-035**: System MUST be keyboard-navigable for accessibility.

### Key Entities

- **Player**: Represents a connected user; attributes include wallet address, display name (derived from address), current match status, lifetime win/loss record.

- **Character**: A selectable fighter; attributes include name, visual theme, portrait image, idle/attack/block/special animation sets.

- **Match**: A game session between two players; attributes include match ID, player addresses, character selections, match format (best-of-X), round results, winner, creation timestamp, associated transaction IDs.

- **Round**: A single round within a match; attributes include round number, both players' move selections, damage dealt, resulting health values, round winner.

- **Move**: A player action within a round; attributes include move type (punch/kick/block/special), associated transaction ID, confirmation timestamp, damage value.

- **Transaction Record**: On-chain proof of a game action; attributes include transaction ID, sender address, encoded game data, block height, confirmation time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can complete a full 1v1 match from wallet connection to victory screen in under 5 minutes.
- **SC-002**: Move transactions confirm and trigger animations within 2 seconds of player submission at least 95% of the time.
- **SC-003**: Transaction fees per move remain under $0.001 USD equivalent.
- **SC-004**: Game maintains 60fps during all animations on mid-range devices (2020 smartphone, 5-year-old laptop).
- **SC-005**: First-time users can connect wallet and start their first match within 60 seconds.
- **SC-006**: 90% of users successfully complete their first practice match without errors.
- **SC-007**: Shared match links load and display correctly on mobile and desktop browsers.
- **SC-008**: All game moves are verifiable on Kaspa explorer with correct encoded data.
- **SC-009**: Game remains playable on 3G network speeds with appropriate loading indicators.
- **SC-010**: Demo video can be recorded showing split-screen gameplay + Kaspa explorer proving instant confirmations.

## Assumptions

- Players will use standard Kaspa-compatible browser wallets that support transaction signing.
- The Kaspa mainnet or testnet will maintain sub-second block times during the hackathon period.
- Transaction fees on Kaspa will remain negligible (~0.0001 KAS per transaction).
- Players have basic familiarity with browser wallet connection flows.
- The game will use real Kaspa transactions (mainnet or testnet), not mock/simulated transactions, for all competitive gameplay.
- Character roster will include 3-4 fighters for initial release (expandable later).
- Match format defaults to best-of-3 rounds.
- Leaderboard data will be derived from on-chain transaction metadata, not a separate database.
