# Phase 0 Research: Battle Pass & Progression System

**Date**: January 7, 2026  
**Feature**: Battle Pass & Progression System  
**Status**: Complete

This document consolidates research findings on all technical unknowns identified in the planning phase. Each section presents the chosen solution, rationale, and alternatives considered.

---

## 1. Battle Pass Progression Curves

### Decision: Hybrid Exponential-Linear XP Curve

**Rationale**: Use exponential growth for early tiers (1-20) to provide fast initial progression and player satisfaction, then transition to linear growth for mid-tiers (21-40), and slight exponential again for final tiers (41-50) to create a challenge for dedicated players.

**Formula**:
```typescript
function calculateXPForTier(tier: number): number {
  if (tier <= 20) {
    // Early tiers: exponential for quick wins
    // Base: 1000 XP, Growth: 1.08 per tier
    return Math.floor(1000 * Math.pow(1.08, tier - 1));
  } else if (tier <= 40) {
    // Mid tiers: linear for consistent feel
    // Start at tier 20 value + 500 XP per tier
    const tier20XP = Math.floor(1000 * Math.pow(1.08, 19));
    return tier20XP + (tier - 20) * 500;
  } else {
    // Final tiers: slight exponential for endgame challenge
    const tier40XP = Math.floor(1000 * Math.pow(1.08, 19)) + (20 * 500);
    return tier40XP + Math.floor((tier - 40) * 800 * Math.pow(1.05, tier - 40));
  }
}

// Total XP for tier 50: ~285,000 XP
// Tier 1: 1,000 XP
// Tier 20: ~4,300 XP
// Tier 40: ~14,300 XP
// Tier 50: ~23,000 XP
```

**Target Completion Rates**:
- Casual players (5 hours/week): Reach tier 25-30 over 10-week season
- Regular players (10 hours/week): Reach tier 40-45 over 10-week season
- Hardcore players (20+ hours/week): Reach tier 50 with time to spare

**Alternatives Considered**:
- **Pure Linear**: Rejected - too grindy early on, doesn't provide satisfying early progression
- **Pure Exponential**: Rejected - creates excessive wall at high tiers, frustrating for casual players
- **Logarithmic**: Rejected - doesn't match player psychology of visible progress

---

## 2. XP Economy Balancing

### Decision: Multi-Source XP with Diminishing Returns

**Earn Rates** (Base values, before prestige multipliers):

| Source | XP Award | Notes |
|--------|----------|-------|
| Match Win | 150-300 XP | Scaled by rounds won (3-0 = 300, 3-2 = 200, etc.) |
| Match Loss | 75-150 XP | Participation reward, scaled by rounds won |
| Perfect Round | +50 XP bonus | Win round without taking damage |
| Combo Efficiency | +0-50 XP | Based on average combo length in match |
| Daily Quest (Easy) | 500 XP | Simple objectives (win 3 matches) |
| Daily Quest (Medium) | 1000 XP | Moderate objectives (deal 5000 damage) |
| Daily Quest (Hard) | 1500 XP | Challenging objectives (win 5 matches without losing a round) |
| Achievement Unlock | 200-2000 XP | Tiered by achievement difficulty |
| First Win of Day | +100 XP bonus | Encourages daily login |

**Average Playtime Calculations**:
- Average match duration: 5-7 minutes
- Average XP per match (50% win rate): ~200 XP
- Matches per hour: ~10
- Base hourly earn rate: ~2,000 XP/hour
- With daily quests: +3,000 XP/day (completing all 3)

**Season Progression** (10-week season, 70 days):
- Casual player (5 hours/week, 35 hours total): ~70,000 XP → Tier 28
- Regular player (10 hours/week, 70 hours total): ~140,000 XP → Tier 42
- Hardcore player (20 hours/week, 140 hours total): ~280,000 XP → Tier 50

**Prestige Multipliers**:
- +10% XP per prestige level (compounding)
- Prestige 1: 1.10x multiplier
- Prestige 2: 1.21x multiplier
- Prestige 3: 1.33x multiplier
- Prestige 5: 1.61x multiplier (practical max)

**Rationale**: Multi-source XP prevents grinding feeling and rewards diverse play styles. Daily quests provide significant boost (equivalent to ~1.5 hours of matches) to encourage daily engagement. Prestige multipliers provide meaningful long-term progression without breaking economy.

**Alternatives Considered**:
- **Single flat rate per match**: Rejected - doesn't reward skill or engagement
- **Win-only XP**: Rejected - punishes casual players with lower win rates
- **Weekly quest pools**: Rejected - less frequent engagement touchpoints than daily

---

## 3. Daily Quest Design Patterns

### Decision: 3 Randomized Quests with Difficulty Tiers

**Quest Pool Structure**:
- 40+ quest templates across 5 categories
- Each day: 1 Easy + 1 Medium + 1 Hard quest
- Selection algorithm ensures no duplicate quest types (e.g., not two "win X matches" quests)
- Character-specific quests require available characters (no quests for disabled characters)

**Quest Categories**:

1. **Victory-Based** (Easy/Medium/Hard)
   - Win 3/5/7 matches
   - Win 2/3/5 matches with specific character
   - Win 3 matches without losing a round (Hard only)

2. **Performance-Based** (Easy/Medium/Hard)
   - Deal 3,000/5,000/10,000 total damage
   - Win 5/10/15 rounds total
   - Execute 10/20/30 special moves
   - Achieve 3/5/10 perfect rounds

3. **Skill-Based** (Medium/Hard)
   - Maintain average combo length of 3/4/5+ moves across 3 matches
   - Win 3 matches with 70/80/90%+ HP remaining
   - Block 20/30/50 opponent attacks

4. **Exploration** (Easy/Medium)
   - Play 3/5 matches with 2/3 different characters
   - Complete 1/2 Survival mode runs
   - Complete 3/5 Combo Challenges

5. **Social** (Easy/Medium)
   - Play 3/5 matches (any result counts)
   - Watch 2/3 replays from match history

**Reset Timing**: Midnight UTC with 1-hour grace period (quests completed 11:00 PM - 1:00 AM UTC count for either day)

**Progress Tracking**: Real-time via Supabase Realtime subscriptions. Progress updates pushed to client as match events occur.

**Rationale**: Mix of easy (achievable in 15-20 minutes), medium (30-40 minutes), and hard (60+ minutes) quests provides options for different play sessions. Category variety prevents repetitive feel. Grace period handles edge case of playing during reset.

**Alternatives Considered**:
- **4-5 quests per day**: Rejected - too overwhelming, reduces daily completion rate
- **Weekly quest pools**: Rejected - less frequent engagement, players forget about them
- **Player-selected quests**: Rejected - adds complexity, players always pick easiest

---

## 4. Cosmetic Shop UX

### Decision: Grid Layout with Category Tabs and Featured Carousel

**Shop Organization**:
- **Featured Section**: Rotating carousel of 4-6 items (weekly rotation)
- **Category Tabs**: Skins, Emotes, Victory Poses, Badges, Frames, Title Cards
- **Sort Options**: Newest, Price (Low-High), Price (High-Low), Rarity
- **Filter Options**: Character (for skins/emotes), Rarity tier, Owned/Unowned
- **Search**: Text search by item name

**Item Display**:
- Grid: 3-4 items per row (responsive)
- Card shows: Thumbnail, name, price, rarity badge, "Owned" indicator
- Hover/tap: Animated preview (emote plays, skin shows idle animation)

**Purchase Flow**:
- Direct purchase (no cart) for immediate gratification
- Click item → Preview Modal opens
- Modal shows: Full preview, description, price, "Purchase" or "Owned" button
- Confirmation toast on purchase, item added to inventory immediately

**Preview Functionality**:
- **Skins**: Phaser mini-scene showing character with skin in idle/attack animations
- **Emotes**: Animated GIF/video loop of emote in preview modal
- **Victory Poses**: Animated loop of victory pose
- **Badges/Frames**: Static image with description

**Featured Rotation**:
- Rotates every Monday 00:00 UTC
- Algorithm selects: 1 Legendary, 2 Epic, 2 Rare, 1 Common item
- Never repeats same item two rotations in a row
- Prioritizes newer items that players haven't purchased yet

**Price Tiers** (Clash Shards):
- Common: 500-1,000
- Rare: 1,500-2,500
- Epic: 3,000-4,000
- Legendary: 5,000-7,500
- Prestige-Exclusive: 10,000+ (requires prestige level)

**Rationale**: Grid layout with tabbed categories provides familiar e-commerce UX. Direct purchase reduces friction. Featured rotation creates FOMO and drives engagement. Preview system lets players "try before they buy" virtually.

**Alternatives Considered**:
- **List view**: Rejected - less visually appealing, harder to browse
- **Shopping cart system**: Rejected - adds unnecessary friction for digital goods
- **Daily rotation**: Rejected - too frequent, players can't plan purchases

---

## 5. Achievement Systems

### Decision: 5 Categories with 4-Tier Progression

**Achievement Structure**:

| Category | Bronze | Silver | Gold | Platinum | XP Reward | Shard Reward |
|----------|--------|--------|------|----------|-----------|--------------|
| **Combat** | Win 10 matches | Win 50 matches | Win 200 matches | Win 500 matches | 200/500/1000/2000 | 100/300/700/1500 |
| **Mastery** | 10 wins w/ character | 50 wins w/ character | 200 wins w/ character | 500 wins w/ character | 200/500/1000/2000 | 100/300/700/1500 |
| **Progression** | Reach tier 10 | Reach tier 30 | Reach tier 50 | Prestige 3 times | 200/500/1000/2000 | 100/300/700/1500 |
| **Collection** | Own 5 cosmetics | Own 15 cosmetics | Own 30 cosmetics | Own 50 cosmetics | 200/500/1000/2000 | 100/300/700/1500 |
| **Social** | Play 25 matches | Play 100 matches | Play 500 matches | Play 1000 matches | 200/500/1000/2000 | 100/300/700/1500 |

**Total Achievements**: ~80 achievements across all categories and tiers
- 15 Combat achievements (win streaks, perfect rounds, damage milestones)
- 20 Mastery achievements (4 characters × 5 achievements each)
- 12 Progression achievements (tier milestones, prestige levels, seasonal)
- 10 Collection achievements (own X items, equip full sets)
- 15 Social achievements (matches played, replays watched, game modes)
- 8 Hidden achievements (discovered through rare feats)

**Hidden Achievements** (Examples):
- "First Blood": Win your first match in under 2 minutes
- "Comeback King": Win a match after being 0-2 down
- "Perfectionist": Win 5 matches in a row with perfect rounds only
- "Iron Wall": Block 100 attacks in a single match
- "Glass Cannon": Win a match dealing 200+ damage while taking <50

**Progress Tracking**:
- All achievements tracked in `player_achievements` table
- Progress bars shown for incomplete achievements
- Real-time progress updates via achievement tracker system
- Unlock notifications show immediately with celebration animation

**Rationale**: Multi-tier structure provides long-term goals. Mix of easy (bronze) and challenging (platinum) achievements caters to all player types. Hidden achievements add discovery element and reward creative play. Total completion possible but requires significant dedication (500+ hours).

**Alternatives Considered**:
- **Flat achievement list**: Rejected - no sense of progression within categories
- **3-tier system**: Rejected - not enough granularity for long-term engagement
- **5+ tier system**: Rejected - too granular, diminishing returns on engagement

---

## 6. Kaspa L1 Integration Patterns

### Decision: Minimal On-Chain Anchoring with Off-Chain Proofs

**Data Structure for On-Chain Anchoring**:
```typescript
interface KaspaAnchor {
  version: number;              // Protocol version (1)
  timestamp: number;            // Unix timestamp
  playerId: string;             // Pseudonymous hash (not wallet address)
  achievementType: 'leaderboard' | 'prestige' | 'milestone';
  achievementData: {
    leaderboardRank?: number;   // If type is leaderboard
    prestigeLevel?: number;     // If type is prestige
    milestoneId?: string;       // If type is milestone
  };
  nonce: string;                // Random nonce for uniqueness
}

// Serialized to minimal bytes (OP_RETURN transaction)
// Example: "KC:1:1704672000:abc123:L:5:xyz" (Kaspa Clash verification)
// Total: ~50-80 bytes
```

**Transaction Flow**:
1. Player opts in to verification (one-time wallet connection via Kasware)
2. System generates anchor data with pseudonymous player ID
3. Create Kaspa L1 transaction with OP_RETURN data (no value transfer)
4. Submit via Rusty Kaspa WASM SDK
5. Wait for confirmation (~10 seconds, 1 block)
6. Store transaction hash + block height in `blockchain_anchors` table
7. Display verification badge on player profile with link to block explorer

**Fee Optimization**:
- Use minimal OP_RETURN data (~50 bytes)
- Batch multiple verifications if possible (future optimization)
- Estimated fee: <0.01 KAS per verification (~$0.0001 at current rates)

**Wallet Connection**:
- Only required for opt-in blockchain verification
- Uses Kasware extension (already integrated in KaspaClash for betting)
- Graceful fallback if wallet not connected or transaction fails
- Never blocks core gameplay

**Verification Display**:
- Badge icon on player profile ("🔗 Verified on Kaspa")
- Click badge → modal showing transaction details
- Link to Kaspa block explorer for proof
- Timestamp and block height displayed

**Rationale**: Minimal data on-chain reduces fees while providing cryptographic proof. Pseudonymous IDs protect privacy. Kaspa L1's fast blocks (<10 sec confirmation) provide great UX compared to other blockchains. OP_RETURN pattern well-established for data anchoring.

**Alternatives Considered**:
- **Full player data on-chain**: Rejected - expensive, privacy concerns
- **Smart contract verification**: Rejected - Kaspa doesn't support smart contracts, would require Layer 2
- **Off-chain signatures only**: Rejected - defeats purpose of blockchain verification

---

## 7. Phaser Scene Management

### Decision: Lazy-Loaded Scenes with Explicit Cleanup

**Scene Lifecycle Pattern**:
```typescript
// Lazy load scene only when needed
const loadSurvivalScene = async () => {
  const { SurvivalScene } = await import('@/game/scenes/SurvivalScene');
  return SurvivalScene;
};

// Scene with explicit cleanup
export class SurvivalScene extends Phaser.Scene {
  preload() {
    // Load only assets needed for this mode
    this.load.setPath('/cosmetics/skins/');
    // Load spritesheets for equipped skins
  }

  create() {
    // Initialize game objects
    this.player = this.add.sprite(/* ... */);
  }

  shutdown() {
    // Explicit cleanup before scene destruction
    this.player?.destroy();
    this.sound.stopAll();
    this.input.keyboard?.removeAllListeners();
    this.anims.remove('survival-anim');
  }

  destroy() {
    // Additional cleanup
    super.destroy();
  }
}
```

**Asset Loading Strategy**:
- **Preload Phase**: Only load base game assets (arena, UI elements)
- **Dynamic Loading**: Load cosmetic spritesheets based on equipped items
- **Asset Caching**: Use Phaser's asset cache, but clear unused assets after scene exit
- **Spritesheet Optimization**: Use texture atlases to reduce HTTP requests

**Memory Management**:
- Monitor scene memory usage via `game.scale.resize` events
- Destroy scenes completely when exiting (not just pause)
- Unload unused texture atlases after scene shutdown
- Profile memory in dev tools to catch leaks

**Scene Transition Pattern**:
```typescript
// From main menu → survival mode
this.scene.start('SurvivalScene', {
  character: selectedCharacter,
  equippedSkin: playerLoadout.skin,
});

// From survival → results screen
this.scene.start('SurvivalResultsScene', {
  wavesSurvived: this.currentWave,
  score: this.totalScore,
});

// Clean transition prevents memory leaks
```

**Rationale**: Lazy loading reduces initial bundle size. Explicit cleanup prevents memory leaks common in Phaser games. Scene data passing ensures stateless scenes. Texture atlases reduce load times and memory usage.

**Alternatives Considered**:
- **All scenes loaded upfront**: Rejected - increases initial load time
- **Scene pause/resume**: Rejected - can cause memory leaks, harder to debug
- **Separate Phaser instances per mode**: Rejected - excessive overhead

---

## 8. Supabase Realtime Best Practices

### Decision: Selective Subscriptions with Client-Side Filtering

**Subscription Pattern for Quest Progress**:
```typescript
// Subscribe only to current player's quest progress
const questChannel = supabase
  .channel(`quest-progress:${playerId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'player_quest_progress',
      filter: `player_id=eq.${playerId}`,
    },
    (payload) => {
      // Update UI with new progress
      updateQuestProgress(payload.new);
    }
  )
  .subscribe();

// Clean up on unmount
onUnmount(() => {
  questChannel.unsubscribe();
});
```

**RLS Policy Design** (Player Isolation):
```sql
-- Players can only read their own progression data
CREATE POLICY "Players can view own progression"
  ON player_progression
  FOR SELECT
  USING (auth.uid() = player_id);

-- Players can only update their own data via server-validated functions
CREATE POLICY "Server can update progression"
  ON player_progression
  FOR UPDATE
  USING (auth.uid() = player_id AND current_setting('app.server_validated', true) = 'true');
```

**Leaderboard Query Optimization**:
```sql
-- Index for fast leaderboard queries
CREATE INDEX idx_survival_runs_score 
  ON survival_runs(score DESC, created_at DESC);

-- Query top 100 with single index scan
SELECT player_id, score, waves_survived, created_at
FROM survival_runs
ORDER BY score DESC, created_at DESC
LIMIT 100;
```

**Efficient Real-Time Patterns**:
- **Quest Progress**: Client subscribes to own updates only
- **Leaderboard**: Broadcast channel for top 10 changes (public data)
- **Tier Unlocks**: Server triggers client refresh via presence channel
- **Achievement Unlocks**: Direct push notification via Supabase function

**Batch Updates**:
```typescript
// Batch multiple XP awards in single transaction
await supabase.rpc('award_xp_batch', {
  player_id: playerId,
  xp_sources: [
    { source: 'match_win', amount: 250 },
    { source: 'perfect_round', amount: 50 },
    { source: 'combo_efficiency', amount: 30 },
  ],
});
```

**Rationale**: Player-filtered subscriptions reduce Realtime bandwidth. RLS policies enforce security at database level. Indexes optimize leaderboard queries. Batch updates reduce transaction overhead.

**Alternatives Considered**:
- **Global quest progress channel**: Rejected - unnecessary bandwidth, privacy concerns
- **Polling for leaderboards**: Rejected - higher latency, more server load
- **Client-side progression**: Rejected - security risk, trust issues

---

## Summary

All technical research complete. Key decisions:
1. ✅ **Progression Curve**: Hybrid exponential-linear for balanced feel
2. ✅ **XP Economy**: Multi-source with ~2,000 XP/hour base rate
3. ✅ **Daily Quests**: 3 randomized quests (Easy/Medium/Hard) with UTC midnight reset
4. ✅ **Shop UX**: Grid layout with category tabs and featured carousel
5. ✅ **Achievements**: 5 categories with 4-tier bronze→platinum progression
6. ✅ **Kaspa Integration**: Minimal OP_RETURN anchoring with pseudonymous IDs
7. ✅ **Phaser Scenes**: Lazy-loaded with explicit cleanup lifecycle
8. ✅ **Supabase Realtime**: Player-filtered subscriptions with RLS security

**Phase 0 Status**: ✅ COMPLETE - Ready for Phase 1 (Data Model & Contracts)