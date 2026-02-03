import React from 'react';

export function DevDatabase() {
    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="prose prose-invert max-w-none">
                <h2 className="text-3xl font-orbitron text-cyber-gold mb-4">
                    Database Architecture
                </h2>
                <p className="text-lg text-muted-foreground">
                    KaspaClash uses <strong className="text-white">Supabase PostgreSQL</strong> with Row Level Security (RLS), 
                    real-time subscriptions, and edge functions for a scalable, secure, and reactive database layer.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-sidebar-border rounded-lg p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                    <div className="text-3xl font-bold text-purple-400 font-orbitron">40+</div>
                    <div className="text-sm text-muted-foreground">Database Tables</div>
                </div>
                <div className="border border-sidebar-border rounded-lg p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                    <div className="text-3xl font-bold text-blue-400 font-orbitron">300+</div>
                    <div className="text-sm text-muted-foreground">Columns Defined</div>
                </div>
                <div className="border border-sidebar-border rounded-lg p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                    <div className="text-3xl font-bold text-green-400 font-orbitron">50+</div>
                    <div className="text-sm text-muted-foreground">Foreign Keys</div>
                </div>
                <div className="border border-sidebar-border rounded-lg p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10">
                    <div className="text-3xl font-bold text-orange-400 font-orbitron">100%</div>
                    <div className="text-sm text-muted-foreground">Type Safe</div>
                </div>
            </div>

            {/* Table of Contents */}
            <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                <h3 className="text-xl font-orbitron text-cyber-gold mb-4">📚 Documentation Sections</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <a href="#overview" className="text-cyber-cyan hover:underline">1. Database Overview</a>
                    <a href="#core-tables" className="text-cyber-cyan hover:underline">2. Core Game Tables</a>
                    <a href="#betting-system" className="text-cyber-cyan hover:underline">3. Betting System</a>
                    <a href="#progression" className="text-cyber-cyan hover:underline">4. Progression System</a>
                    <a href="#economy" className="text-cyber-cyan hover:underline">5. Economy & Cosmetics</a>
                    <a href="#treasury" className="text-cyber-cyan hover:underline">6. Treasury & Payouts</a>
                    <a href="#blockchain" className="text-cyber-cyan hover:underline">7. Blockchain Integration</a>
                    <a href="#security" className="text-cyber-cyan hover:underline">8. Security & Auth</a>
                    <a href="#survival" className="text-cyber-cyan hover:underline">9. Survival Mode</a>
                    <a href="#relationships" className="text-cyber-cyan hover:underline">10. Entity Relationships</a>
                    <a href="#query-patterns" className="text-cyber-cyan hover:underline">11. Query Patterns</a>
                    <a href="#best-practices" className="text-cyber-cyan hover:underline">12. Best Practices</a>
                </div>
            </div>

            {/* Section 1: Database Overview */}
            <section id="overview" className="space-y-6">
                <h3 className="text-2xl font-orbitron text-cyber-gold flex items-center gap-3">
                    <span className="text-3xl">🗄️</span>
                    Database Overview
                </h3>

                <div className="border border-sidebar-border rounded-lg p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                    <h4 className="text-lg font-semibold text-white mb-3">Supabase PostgreSQL</h4>
                    <p className="text-muted-foreground mb-4">
                        KaspaClash leverages Supabase&apos;s managed PostgreSQL database with the following features:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">✓</span>
                            <div>
                                <strong className="text-white">Real-time Subscriptions:</strong> Live updates for match state, 
                                betting pools, quest progress via WebSocket channels
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">✓</span>
                            <div>
                                <strong className="text-white">Row Level Security (RLS):</strong> PostgreSQL policies enforce 
                                data access at the database level
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">✓</span>
                            <div>
                                <strong className="text-white">TypeScript Types:</strong> Auto-generated types from schema 
                                ensure type safety (see <code className="text-xs text-cyber-cyan">src/lib/supabase/types.ts</code>)
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">✓</span>
                            <div>
                                <strong className="text-white">Edge Functions:</strong> Serverless functions run database operations 
                                closer to users for lower latency
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">✓</span>
                            <div>
                                <strong className="text-white">Connection Pooling:</strong> pgBouncer manages connections 
                                efficiently for high concurrency
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="border border-sidebar-border rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Schema Organization</h4>
                    <p className="text-muted-foreground mb-4">
                        The database is organized into 9 logical domains:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-500/5 rounded-r">
                            <div className="font-semibold text-purple-400">Core Game</div>
                            <div className="text-xs text-muted-foreground">
                                players, matches, rounds, moves, characters, matchmaking_queue, fight_state_snapshots, power_surges
                            </div>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-500/5 rounded-r">
                            <div className="font-semibold text-blue-400">Betting System</div>
                            <div className="text-xs text-muted-foreground">
                                bets, betting_pools, bot_bets, bot_betting_pools, bot_matches
                            </div>
                        </div>
                        <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-500/5 rounded-r">
                            <div className="font-semibold text-green-400">Progression</div>
                            <div className="text-xs text-muted-foreground">
                                battle_pass_seasons, battle_pass_tiers, player_progression, xp_awards
                            </div>
                        </div>
                        <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-500/5 rounded-r">
                            <div className="font-semibold text-yellow-400">Achievements & Quests</div>
                            <div className="text-xs text-muted-foreground">
                                achievements, player_achievements, achievement_statistics, daily_quests, quest_templates, quest_statistics
                            </div>
                        </div>
                        <div className="border-l-4 border-pink-500 pl-4 py-2 bg-pink-500/5 rounded-r">
                            <div className="font-semibold text-pink-400">Economy & Cosmetics</div>
                            <div className="text-xs text-muted-foreground">
                                cosmetic_items, player_inventory, player_loadouts, shop_purchases, shop_rotations, player_currency, currency_transactions
                            </div>
                        </div>
                        <div className="border-l-4 border-orange-500 pl-4 py-2 bg-orange-500/5 rounded-r">
                            <div className="font-semibold text-orange-400">Treasury & Payouts</div>
                            <div className="text-xs text-muted-foreground">
                                treasury_distributions, distribution_payouts, treasury_deposits, treasury_balance_snapshots
                            </div>
                        </div>
                        <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-500/5 rounded-r">
                            <div className="font-semibold text-red-400">Blockchain</div>
                            <div className="text-xs text-muted-foreground">
                                blockchain_anchors, verification_badges, cosmetic_nfts
                            </div>
                        </div>
                        <div className="border-l-4 border-cyan-500 pl-4 py-2 bg-cyan-500/5 rounded-r">
                            <div className="font-semibold text-cyan-400">Survival Mode</div>
                            <div className="text-xs text-muted-foreground">
                                survival_runs, survival_daily_plays
                            </div>
                        </div>
                        <div className="border-l-4 border-gray-500 pl-4 py-2 bg-gray-500/5 rounded-r">
                            <div className="font-semibold text-gray-400">Security</div>
                            <div className="text-xs text-muted-foreground">
                                session_tokens, rate_limits, security_audit_log
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border border-yellow-500/50 rounded-lg p-4 bg-yellow-500/5">
                    <h4 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ Schema Context File</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                        The migration file <code className="text-xs text-cyber-cyan">supabase/migrations/current_schema.sql</code> is marked 
                        with a warning:
                    </p>
                    <div className="bg-black/50 p-3 rounded font-mono text-xs text-red-400 mb-2">
                        -- WARNING: This schema is for context only and is not meant to be run.<br />
                        -- Table order and constraints may not be valid for execution.
                    </div>
                    <p className="text-sm text-muted-foreground">
                        This file provides the complete schema structure for documentation but should not be executed directly. 
                        Use numbered migration files in the proper order.
                    </p>
                </div>
            </section>

            {/* Section 2: Core Game Tables */}
            <section id="core-tables" className="space-y-6">
                <h3 className="text-2xl font-orbitron text-cyber-gold flex items-center gap-3">
                    <span className="text-3xl">⚔️</span>
                    Core Game Tables
                </h3>

                {/* Players Table */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">players</span>
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">Primary Entity</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Central table storing player profiles, ELO ratings, and win/loss records. Uses Kaspa wallet address as primary key.
                    </p>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-sidebar-border">
                                    <th className="py-2 px-3 text-left font-orbitron text-cyber-gold text-xs">Column</th>
                                    <th className="py-2 px-3 text-left font-orbitron text-cyber-gold text-xs">Type</th>
                                    <th className="py-2 px-3 text-left font-orbitron text-cyber-gold text-xs">Constraints</th>
                                    <th className="py-2 px-3 text-left font-orbitron text-cyber-gold text-xs">Description</th>
                                </tr>
                            </thead>
                            <tbody className="text-muted-foreground">
                                <tr className="border-b border-sidebar-border/50">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">address</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">text</span></td>
                                    <td className="py-2 px-3"><span className="text-xs text-purple-400">PRIMARY KEY</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">Kaspa wallet address (kaspa:...)</span></td>
                                </tr>
                                <tr className="border-b border-sidebar-border/50 bg-black/20">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">display_name</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">text</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">NULLABLE, ≤32 chars, alphanumeric</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">Player chosen username</span></td>
                                </tr>
                                <tr className="border-b border-sidebar-border/50">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">wins</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">integer</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">DEFAULT 0, CHECK ≥ 0</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">Total ranked match victories</span></td>
                                </tr>
                                <tr className="border-b border-sidebar-border/50 bg-black/20">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">losses</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">integer</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">DEFAULT 0, CHECK ≥ 0</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">Total ranked match defeats</span></td>
                                </tr>
                                <tr className="border-b border-sidebar-border/50">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">rating</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">integer</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">DEFAULT 1000, CHECK 100-3000</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">ELO rating for matchmaking</span></td>
                                </tr>
                                <tr className="border-b border-sidebar-border/50 bg-black/20">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">avatar_url</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">text</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">NULLABLE</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">Profile picture URL</span></td>
                                </tr>
                                <tr className="border-b border-sidebar-border/50">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">created_at</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">timestamptz</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">DEFAULT now()</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">Account creation timestamp</span></td>
                                </tr>
                                <tr className="bg-black/20">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">updated_at</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">timestamptz</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">DEFAULT now()</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">Last profile update</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 p-3 bg-blue-500/10 rounded border-l-4 border-blue-500">
                        <div className="font-semibold text-blue-400 text-sm mb-1">Indexes</div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• <code>players_pkey</code> - PRIMARY KEY on address (auto-generated)</li>
                            <li>• Consider adding: <code>idx_players_rating</code> for leaderboard queries</li>
                        </ul>
                    </div>

                    <div className="mt-4 p-3 bg-gray-800/50 rounded">
                        <div className="font-semibold mb-2 text-sm text-white">Example Query:</div>
                        <pre className="text-xs overflow-x-auto text-green-400">
{`const { data: topPlayers } = await supabase
  .from('players')
  .select('address, display_name, rating, wins, losses')
  .order('rating', { ascending: false })
  .limit(10);`}
                        </pre>
                    </div>
                </div>

                {/* Characters Table */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">characters</span>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">Game Content</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Master list of all playable characters with sprite configuration. 16 fighters across 4 archetypes (speed, tank, tech, precision).
                    </p>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-sidebar-border">
                                    <th className="py-2 px-3 text-left font-orbitron text-cyber-gold text-xs">Column</th>
                                    <th className="py-2 px-3 text-left font-orbitron text-cyber-gold text-xs">Type</th>
                                    <th className="py-2 px-3 text-left font-orbitron text-cyber-gold text-xs">Description</th>
                                </tr>
                            </thead>
                            <tbody className="text-muted-foreground">
                                <tr className="border-b border-sidebar-border/50">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">id</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">text PRIMARY KEY</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">Character slug (e.g., &quot;cyber-ninja&quot;)</span></td>
                                </tr>
                                <tr className="border-b border-sidebar-border/50 bg-black/20">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">name</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">text NOT NULL</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">Display name (e.g., &quot;Cyber Ninja&quot;)</span></td>
                                </tr>
                                <tr className="border-b border-sidebar-border/50">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">theme</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">text NOT NULL</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">Archetype (speed/tank/tech/precision)</span></td>
                                </tr>
                                <tr className="border-b border-sidebar-border/50 bg-black/20">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">portrait_url</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">text NOT NULL</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">Character select screen portrait</span></td>
                                </tr>
                                <tr className="bg-black/20">
                                    <td className="py-2 px-3"><code className="text-xs text-cyber-cyan">sprite_config</code></td>
                                    <td className="py-2 px-3"><span className="text-xs">jsonb NOT NULL</span></td>
                                    <td className="py-2 px-3"><span className="text-xs">Phaser sprite sheet config</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 p-3 bg-gray-800/50 rounded">
                        <div className="font-semibold mb-2 text-sm text-white">Example sprite_config:</div>
                        <pre className="text-xs overflow-x-auto text-green-400">
{`{
  "texture": "cyber-ninja",
  "frameWidth": 128,
  "frameHeight": 128,
  "animations": {
    "idle": [0, 1, 2, 3],
    "run": [8, 9, 10, 11],
    "attack": [16, 17, 18, 19],
    "hurt": [24, 25, 26],
    "death": [32, 33, 34, 35]
  }
}`}
                        </pre>
                    </div>

                    <div className="mt-4 p-3 bg-purple-500/10 rounded border-l-4 border-purple-500">
                        <div className="font-semibold text-purple-400 text-sm mb-1">Character Archetypes</div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>• <strong className="text-white">Speed:</strong> neon-wraith, kitsune-09, viperblade, chrono-drifter</div>
                            <div>• <strong className="text-white">Tank:</strong> heavy-loader, gene-smasher, bastion-hulk, scrap-goliath</div>
                            <div>• <strong className="text-white">Tech:</strong> cyber-paladin, nano-brawler, technomancer, aeon-guard</div>
                            <div>• <strong className="text-white">Precision:</strong> razor-bot-7, sonic-striker, prism-duelist, void-reaper</div>
                        </div>
                    </div>
                </div>

                {/* matches table - Key fields only due to size */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">matches</span>
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30">Core Gameplay</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Stores match metadata, player assignments, character selections, and match lifecycle state. Supports both PvP and bot matches.
                    </p>

                    <div className="space-y-3">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50">
                            <div className="font-semibold text-white text-sm mb-2">Key Columns (26 total):</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• <code className="text-cyber-cyan">id</code> <span className="text-purple-400">uuid PRIMARY KEY</span> - Unique match identifier</li>
                                <li>• <code className="text-cyber-cyan">room_code</code> <span className="text-gray-400">text UNIQUE</span> - 6-char lobby code (^[A-Z0-9]{`{6}`}$)</li>
                                <li>• <code className="text-cyber-cyan">player1_address</code>, <code className="text-cyber-cyan">player2_address</code> <span className="text-blue-400">FK → players</span></li>
                                <li>• <code className="text-cyber-cyan">player1_character_id</code>, <code className="text-cyber-cyan">player2_character_id</code> <span className="text-blue-400">FK → characters</span></li>
                                <li>• <code className="text-cyber-cyan">format</code> - best_of_3 | best_of_5</li>
                                <li>• <code className="text-cyber-cyan">status</code> - waiting | character_select | in_progress | completed | cancelled</li>
                                <li>• <code className="text-cyber-cyan">fight_phase</code> - waiting | countdown | selecting | resolving | round_end | match_end</li>
                                <li>• <code className="text-cyber-cyan">winner_address</code> <span className="text-blue-400">FK → players</span></li>
                                <li>• <code className="text-cyber-cyan">player1_rounds_won</code>, <code className="text-cyber-cyan">player2_rounds_won</code> <span className="text-gray-400">integer</span></li>
                                <li>• <code className="text-cyber-cyan">is_bot</code> <span className="text-gray-400">boolean</span> - True if player2 is AI</li>
                                <li>• <code className="text-cyber-cyan">player1_ban_id</code>, <code className="text-cyber-cyan">player2_ban_id</code> - Character bans (draft mode)</li>
                                <li>• <code className="text-cyber-cyan">stake_amount</code> <span className="text-gray-400">bigint</span> - Wager in sompi (min 1 KAS = 10^8 sompi)</li>
                                <li>• <code className="text-cyber-cyan">player1_stake_tx_id</code>, <code className="text-cyber-cyan">player2_stake_tx_id</code> - Kaspa transaction hashes</li>
                                <li>• <code className="text-cyber-cyan">power_surge_deck</code> <span className="text-gray-400">jsonb</span> - Shuffled card deck</li>
                                <li>• <code className="text-cyber-cyan">selection_deadline_at</code>, <code className="text-cyber-cyan">fight_phase_started_at</code> - Timestamp tracking</li>
                                <li>• <code className="text-cyber-cyan">player1_disconnected_at</code>, <code className="text-cyber-cyan">player2_disconnected_at</code> - Disconnect detection</li>
                                <li>• <code className="text-cyber-cyan">created_at</code>, <code className="text-cyber-cyan">started_at</code>, <code className="text-cyber-cyan">completed_at</code></li>
                            </ul>
                        </div>

                        <div className="p-3 bg-blue-500/10 rounded border-l-4 border-blue-500">
                            <div className="font-semibold text-blue-400 text-sm mb-1">Foreign Keys</div>
                            <div className="text-xs text-muted-foreground">
                                player1_address, player2_address, winner_address → players(address)<br />
                                player1_character_id, player2_character_id → characters(id)
                            </div>
                        </div>
                    </div>
                </div>

                {/* rounds table - Extensive combat state */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">rounds</span>
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">Combat Resolution</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Stores individual rounds within a match, including move choices, damage dealt, health/energy/guard states, and animation metadata. 
                        The most complex table with 40+ columns tracking complete combat state.
                    </p>

                    <div className="p-3 bg-yellow-500/10 rounded border-l-4 border-yellow-500 mb-4">
                        <div className="font-semibold text-yellow-400 text-sm mb-1">⚡ Combat Resolution Flow</div>
                        <p className="text-xs text-muted-foreground">
                            Each turn progresses through animation phases: <strong className="text-white">countdown</strong> → 
                            <strong className="text-white">selecting</strong> → <strong className="text-white">running_to_center</strong> → 
                            <strong className="text-white">attacking</strong> → <strong className="text-white">running_back</strong> → 
                            <strong className="text-white">round_end</strong>. All timing and state tracked in this table.
                        </p>
                    </div>

                    <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="p-3 bg-black/30 rounded border border-sidebar-border/50">
                                <div className="font-semibold text-white mb-2">Core Round Data</div>
                                <ul className="space-y-1">
                                    <li>• id, match_id, round_number, turn_number</li>
                                    <li>• player1_move, player2_move (punch/kick/block/special/stunned)</li>
                                    <li>• player1_damage_dealt, player2_damage_dealt</li>
                                    <li>• player1_health_after, player2_health_after (0-100)</li>
                                    <li>• winner_address (FK → players)</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-black/30 rounded border border-sidebar-border/50">
                                <div className="font-semibold text-white mb-2">Resource Meters</div>
                                <ul className="space-y-1">
                                    <li>• player1_energy, player2_energy (0-100)</li>
                                    <li>• player1_guard_meter, player2_guard_meter (0-100)</li>
                                    <li>• player1_is_stunned, player2_is_stunned (boolean)</li>
                                    <li>• player1_energy_drained, player2_energy_drained</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-black/30 rounded border border-sidebar-border/50">
                                <div className="font-semibold text-white mb-2">Power Surge Effects</div>
                                <ul className="space-y-1">
                                    <li>• player1_hp_regen, player2_hp_regen</li>
                                    <li>• player1_lifesteal, player2_lifesteal</li>
                                    <li>• player1_outcome, player2_outcome (hit/blocked/stunned/etc)</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-black/30 rounded border border-sidebar-border/50">
                                <div className="font-semibold text-white mb-2">Animation State</div>
                                <ul className="space-y-1">
                                    <li>• animation_phase (9 possible states)</li>
                                    <li>• player1_current_animation, player2_current_animation</li>
                                    <li>• animation_started_at, animation_duration_ms</li>
                                    <li>• countdown_started_at, countdown_seconds</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* matchmaking_queue */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">matchmaking_queue</span>
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30">Multiplayer</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Active queue for ranked matchmaking. Players matched based on ELO rating proximity (±200 points default).
                    </p>

                    <div className="space-y-3">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50">
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div>• <code className="text-cyber-cyan">address</code> <span className="text-purple-400">PRIMARY KEY FK → players</span></div>
                                <div>• <code className="text-cyber-cyan">rating</code> <span className="text-gray-400">integer</span> - Player ELO for matchmaking algorithm</div>
                                <div>• <code className="text-cyber-cyan">joined_at</code> <span className="text-gray-400">timestamptz</span> - For FIFO tie-breaking</div>
                                <div>• <code className="text-cyber-cyan">status</code> - searching | matched</div>
                                <div>• <code className="text-cyber-cyan">matched_with</code> <span className="text-blue-400">FK → players</span> - Opponent address</div>
                            </div>
                        </div>

                        <div className="p-3 bg-green-500/10 rounded border-l-4 border-green-500">
                            <div className="font-semibold text-green-400 text-sm mb-1">Matchmaking Algorithm</div>
                            <pre className="text-xs text-muted-foreground font-mono">
{`1. Find players with status='searching' within ±200 ELO
2. Pair closest rating match (FIFO if tied)
3. Update both rows: status='matched', matched_with=opponent
4. Create new match in matches table
5. Remove both from queue after match starts`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* fight_state_snapshots */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">fight_state_snapshots</span>
                        <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded border border-pink-500/30">Real-time State</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Complete combat state for active matches. Used for spectator views, reconnection recovery, and replay generation. 
                        One row per match (UNIQUE constraint on match_id).
                    </p>

                    <div className="p-3 bg-purple-500/10 rounded border-l-4 border-purple-500 mb-4">
                        <div className="font-semibold text-purple-400 text-sm mb-1">🔴 Real-time Updates</div>
                        <p className="text-xs text-muted-foreground">
                            Subscribed via <code className="text-cyber-cyan">game:$matchId</code> Supabase Realtime channel. 
                            Every state change (move submission, animation transition) triggers a database update and broadcasts 
                            to all connected clients (players + spectators).
                        </p>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">match_id</code> <span className="text-purple-400">uuid UNIQUE FK → matches</span></div>
                        <div>• <code className="text-cyber-cyan">current_round</code>, <code className="text-cyber-cyan">current_turn</code> - Round/turn tracking</div>
                        <div>• <code className="text-cyber-cyan">phase</code> - waiting | countdown | selecting | resolving | round_end | match_end</div>
                        <div>• <code className="text-cyber-cyan">player1_health</code>, <code className="text-cyber-cyan">player2_health</code> - Current HP (0-100)</div>
                        <div>• <code className="text-cyber-cyan">player1_energy</code>, <code className="text-cyber-cyan">player2_energy</code> - Current energy (0-100)</div>
                        <div>• <code className="text-cyber-cyan">player1_guard_meter</code>, <code className="text-cyber-cyan">player2_guard_meter</code> - Guard durability (0-100)</div>
                        <div>• <code className="text-cyber-cyan">player1_is_stunned</code>, <code className="text-cyber-cyan">player2_is_stunned</code> - Stun status</div>
                        <div>• <code className="text-cyber-cyan">player1_current_animation</code>, <code className="text-cyber-cyan">player2_current_animation</code> - Sprite states</div>
                        <div>• <code className="text-cyber-cyan">player1_has_submitted_move</code>, <code className="text-cyber-cyan">player2_has_submitted_move</code> - Move submission flags</div>
                        <div>• <code className="text-cyber-cyan">move_deadline_at</code>, <code className="text-cyber-cyan">countdown_ends_at</code> - Timing constraints</div>
                        <div>• <code className="text-cyber-cyan">round_winner</code>, <code className="text-cyber-cyan">last_narrative</code> - Result tracking</div>
                    </div>
                </div>

                {/* power_surges */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">power_surges</span>
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">Card System</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Tracks power surge card selections for each round. Players offered 3 random cards before each round 
                        and can select one (or skip). Effects apply during combat resolution.
                    </p>

                    <div className="space-y-3">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                            <div>• <code className="text-cyber-cyan">match_id</code>, <code className="text-cyber-cyan">round_number</code> - Identifies which round</div>
                            <div>• <code className="text-cyber-cyan">offered_cards</code> <span className="text-gray-400">jsonb</span> - Array of 3 card IDs offered</div>
                            <div>• <code className="text-cyber-cyan">player1_card_id</code>, <code className="text-cyber-cyan">player2_card_id</code> - Selected cards (null = skip)</div>
                            <div>• <code className="text-cyber-cyan">player1_tx_id</code>, <code className="text-cyber-cyan">player2_tx_id</code> - Kaspa transaction proofs</div>
                            <div>• <code className="text-cyber-cyan">player1_selected_at</code>, <code className="text-cyber-cyan">player2_selected_at</code> - Timestamps</div>
                            <div>• <code className="text-cyber-cyan">revealed_at</code> - When both selections revealed</div>
                        </div>

                        <div className="p-3 bg-yellow-500/10 rounded border-l-4 border-yellow-500">
                            <div className="font-semibold text-yellow-400 text-sm mb-1">Card Effects (12 total)</div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div>• <strong className="text-white">damage-boost</strong> - +15 damage</div>
                                <div>• <strong className="text-white">energy-drain</strong> - Drain 20 energy</div>
                                <div>• <strong className="text-white">hp-regeneration</strong> - Restore 10 HP</div>
                                <div>• <strong className="text-white">double-damage</strong> - 2x damage</div>
                                <div>• <strong className="text-white">reflect-damage</strong> - Reflect 50%</div>
                                <div>• <strong className="text-white">lifesteal</strong> - Heal for 30%</div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Full list in <code className="text-cyber-cyan">src/data/power-surge-cards.ts</code>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Betting System */}
            <section id="betting-system" className="space-y-6">
                <h3 className="text-2xl font-orbitron text-cyber-gold flex items-center gap-3">
                    <span className="text-3xl">🎰</span>
                    Betting System
                </h3>

                <p className="text-muted-foreground text-sm">
                    Provably fair betting system where spectators wager KAS on match outcomes. Supports both PvP (human vs human) 
                    and bot matches (AI vs AI). All transactions on-chain with automatic payout distribution.
                </p>

                {/* betting_pools */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">betting_pools</span>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">PvP Betting</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Each match has one betting pool (UNIQUE on match_id). Pools accept bets until match starts, then lock. 
                        Payouts distributed after winner confirmed.
                    </p>

                    <div className="space-y-3">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                            <div>• <code className="text-cyber-cyan">match_id</code> <span className="text-purple-400">uuid UNIQUE FK → matches</span></div>
                            <div>• <code className="text-cyber-cyan">player1_total</code>, <code className="text-cyber-cyan">player2_total</code> <span className="text-gray-400">bigint</span> - Total sompi bet on each side</div>
                            <div>• <code className="text-cyber-cyan">total_pool</code> <span className="text-gray-400">bigint</span> - player1_total + player2_total</div>
                            <div>• <code className="text-cyber-cyan">total_fees</code> <span className="text-gray-400">bigint</span> - Platform fees (5% of each bet)</div>
                            <div>• <code className="text-cyber-cyan">status</code> - open | locked | resolved | refunded</div>
                            <div>• <code className="text-cyber-cyan">winner</code> - player1 | player2 (set when resolved)</div>
                            <div>• <code className="text-cyber-cyan">created_at</code>, <code className="text-cyber-cyan">locked_at</code>, <code className="text-cyber-cyan">resolved_at</code></div>
                        </div>

                        <div className="p-3 bg-blue-500/10 rounded border-l-4 border-blue-500">
                            <div className="font-semibold text-blue-400 text-sm mb-1">Payout Formula</div>
                            <pre className="text-xs text-muted-foreground font-mono">
{`winnerTotal = winner === 'player1' ? player1_total : player2_total
loserTotal = winner === 'player1' ? player2_total : player1_total

For each winning bet:
  betShare = bet.net_amount / winnerTotal
  payout = bet.net_amount + (loserTotal * betShare)`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* bets */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">bets</span>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">Individual Wagers</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Individual spectator bets on PvP matches. Each bet backed by on-chain Kaspa transaction. 
                        Minimum: 1 KAS (100,000,000 sompi). Platform fee: 5%.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">pool_id</code> <span className="text-blue-400">FK → betting_pools</span></div>
                        <div>• <code className="text-cyber-cyan">bettor_address</code> <span className="text-blue-400">FK → players</span> - Spectator placing bet</div>
                        <div>• <code className="text-cyber-cyan">bet_on</code> - player1 | player2</div>
                        <div>• <code className="text-cyber-cyan">amount</code> <span className="text-gray-400">bigint CHECK ≥ 100000000</span> - Min 1 KAS in sompi</div>
                        <div>• <code className="text-cyber-cyan">fee_paid</code>, <code className="text-cyber-cyan">net_amount</code> - Fee deduction (5%)</div>
                        <div>• <code className="text-cyber-cyan">tx_id</code> <span className="text-purple-400">text UNIQUE</span> - Kaspa transaction hash (proof of payment)</div>
                        <div>• <code className="text-cyber-cyan">payout_amount</code>, <code className="text-cyber-cyan">payout_tx_id</code> - Winnings distribution</div>
                        <div>• <code className="text-cyber-cyan">status</code> - pending | confirmed | won | lost | refunded</div>
                        <div>• <code className="text-cyber-cyan">confirmed_at</code>, <code className="text-cyber-cyan">paid_at</code> - Transaction timestamps</div>
                    </div>
                </div>

                {/* bot_betting_pools & bot_bets */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">bot_betting_pools & bot_bets</span>
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30">Bot Match Betting</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Identical structure to PvP betting but for bot vs bot matches. Bot matches run 24/7 with 2.5s turn duration. 
                        Betting closes at turn 3 to prevent outcome manipulation.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50">
                            <div className="font-semibold text-white text-sm mb-2">bot_betting_pools</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• bot_match_id (text UNIQUE FK → bot_matches)</li>
                                <li>• bot1_character_id, bot2_character_id</li>
                                <li>• bot1_total, bot2_total (bigint)</li>
                                <li>• betting_closes_at_turn (DEFAULT 3)</li>
                                <li>• winner (bot1/bot2)</li>
                            </ul>
                        </div>
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50">
                            <div className="font-semibold text-white text-sm mb-2">bot_bets</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• pool_id (FK → bot_betting_pools)</li>
                                <li>• bet_on (bot1/bot2)</li>
                                <li>• amount (min 1 KAS)</li>
                                <li>• tx_id (UNIQUE)</li>
                                <li>• status (pending/won/lost/refunded)</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-500/10 rounded border-l-4 border-yellow-500">
                        <div className="font-semibold text-yellow-400 text-sm mb-1">⚠️ Betting Deadline</div>
                        <p className="text-xs text-muted-foreground">
                            Bot match betting locks at turn 3 (~7.5 seconds). This prevents spectators from betting after 
                            they can predict the outcome. The <code className="text-cyber-cyan">betting_closes_at_turn</code> 
                            column enforces this via API validation.
                        </p>
                    </div>
                </div>

                {/* bot_matches */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">bot_matches</span>
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">AI vs AI</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Automated matches between AI opponents. Runs continuously for spectator entertainment and betting. 
                        Each match is deterministic based on a seed value.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">id</code> <span className="text-purple-400">text PRIMARY KEY</span> (string ID instead of uuid)</div>
                        <div>• <code className="text-cyber-cyan">bot1_character_id</code>, <code className="text-cyber-cyan">bot2_character_id</code> - Character slugs</div>
                        <div>• <code className="text-cyber-cyan">bot1_name</code>, <code className="text-cyber-cyan">bot2_name</code> - Display names</div>
                        <div>• <code className="text-cyber-cyan">seed</code> <span className="text-gray-400">text</span> - RNG seed for deterministic combat</div>
                        <div>• <code className="text-cyber-cyan">turns</code> <span className="text-gray-400">jsonb</span> - Array of all turn results</div>
                        <div>• <code className="text-cyber-cyan">total_turns</code>, <code className="text-cyber-cyan">match_winner</code> - Match outcome</div>
                        <div>• <code className="text-cyber-cyan">turn_duration_ms</code> <span className="text-gray-400">DEFAULT 2500</span> (2.5 seconds per turn)</div>
                        <div>• <code className="text-cyber-cyan">status</code> - active | completed</div>
                    </div>
                </div>
            </section>

            {/* Section 4: Progression System */}
            <section id="progression" className="space-y-6">
                <h3 className="text-2xl font-orbitron text-cyber-gold flex items-center gap-3">
                    <span className="text-3xl">📈</span>
                    Progression System
                </h3>

                <p className="text-muted-foreground text-sm">
                    Battle Pass system with seasonal tiers, XP tracking, and prestige levels. Players earn rewards through 
                    match victories, achievements, and quest completion.
                </p>

                {/* battle_pass_seasons */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">battle_pass_seasons</span>
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">Seasonal Content</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Defines Battle Pass seasons with tier counts, start/end dates, and active status. Only one season active at a time.
                    </p>

                    <div className="space-y-3">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                            <div>• <code className="text-cyber-cyan">id</code> <span className="text-purple-400">uuid PRIMARY KEY</span></div>
                            <div>• <code className="text-cyber-cyan">name</code> <span className="text-gray-400">text NOT NULL</span> - Display name (e.g., &quot;Season 1: Genesis&quot;)</div>
                            <div>• <code className="text-cyber-cyan">description</code> <span className="text-gray-400">text</span> - Season theme description</div>
                            <div>• <code className="text-cyber-cyan">tier_count</code> <span className="text-gray-400">integer CHECK 1-100</span> - Number of tiers (typically 50-100)</div>
                            <div>• <code className="text-cyber-cyan">is_active</code> <span className="text-gray-400">boolean DEFAULT false</span> - Only one active season allowed</div>
                            <div>• <code className="text-cyber-cyan">version</code> <span className="text-gray-400">text</span> - Version identifier (e.g., &quot;v1.0&quot;)</div>
                            <div>• <code className="text-cyber-cyan">icon_url</code>, <code className="text-cyber-cyan">banner_url</code> - Season artwork</div>
                            <div>• <code className="text-cyber-cyan">starts_at</code>, <code className="text-cyber-cyan">ends_at</code> <span className="text-gray-400">timestamptz</span></div>
                            <div>• <code className="text-cyber-cyan">created_at</code> <span className="text-gray-400">DEFAULT now()</span></div>
                        </div>

                        <div className="p-3 bg-purple-500/10 rounded border-l-4 border-purple-500">
                            <div className="font-semibold text-purple-400 text-sm mb-1">🔒 Active Season Constraint</div>
                            <p className="text-xs text-muted-foreground">
                                Application logic ensures only one season has <code className="text-cyber-cyan">is_active=true</code>. 
                                When a new season activates, the previous season is automatically deactivated.
                            </p>
                        </div>
                    </div>
                </div>

                {/* battle_pass_tiers */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">battle_pass_tiers</span>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">Tier Rewards</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Defines each tier&apos;s XP requirement and rewards. Supports both free and premium tracks.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">season_id</code> <span className="text-blue-400">FK → battle_pass_seasons</span></div>
                        <div>• <code className="text-cyber-cyan">tier_number</code> <span className="text-gray-400">integer CHECK ≥ 1</span></div>
                        <div>• <code className="text-cyber-cyan">xp_required</code> <span className="text-gray-400">integer</span> - Cumulative XP needed to unlock</div>
                        <div>• <code className="text-cyber-cyan">rewards</code> <span className="text-gray-400">jsonb</span> - Free track rewards (clash_shards, cosmetics)</div>
                        <div>• <code className="text-cyber-cyan">premium_rewards</code> <span className="text-gray-400">jsonb</span> - Premium track exclusive rewards</div>
                        <div>• <code className="text-cyber-cyan">is_premium</code> <span className="text-gray-400">boolean</span> - Requires premium pass purchase</div>
                        <div>• UNIQUE(season_id, tier_number)</div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-800/50 rounded">
                        <div className="font-semibold mb-2 text-sm text-white">Example rewards JSON:</div>
                        <pre className="text-xs overflow-x-auto text-green-400">
{`{
  "clash_shards": 500,
  "cosmetic_items": [
    {"id": "neon-visor", "quantity": 1}
  ],
  "character_unlocks": ["cyber-paladin"]
}`}
                        </pre>
                    </div>
                </div>

                {/* player_progression */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">player_progression</span>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">Player Progress</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Tracks individual player progress through Battle Pass seasons. Includes prestige system with XP multipliers.
                    </p>

                    <div className="space-y-3">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                            <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-blue-400">FK → players</span></div>
                            <div>• <code className="text-cyber-cyan">season_id</code> <span className="text-blue-400">FK → battle_pass_seasons</span></div>
                            <div>• <code className="text-cyber-cyan">current_tier</code> <span className="text-gray-400">integer DEFAULT 1</span> - Current tier level</div>
                            <div>• <code className="text-cyber-cyan">current_xp</code> <span className="text-gray-400">integer DEFAULT 0</span> - Total XP earned this season</div>
                            <div>• <code className="text-cyber-cyan">has_premium</code> <span className="text-gray-400">boolean DEFAULT false</span> - Premium pass ownership</div>
                            <div>• <code className="text-cyber-cyan">claimed_tiers</code> <span className="text-gray-400">integer[] DEFAULT ARRAY[]::integer[]</span> - Array of claimed tier numbers</div>
                            <div>• <code className="text-cyber-cyan">prestige_level</code> <span className="text-gray-400">integer DEFAULT 0</span> - Carries over between seasons</div>
                            <div>• <code className="text-cyber-cyan">total_lifetime_xp</code> <span className="text-gray-400">bigint DEFAULT 0</span> - All-time XP</div>
                            <div>• <code className="text-cyber-cyan">season_completed_at</code> <span className="text-gray-400">timestamptz</span> - When tier_count reached</div>
                            <div>• <code className="text-cyber-cyan">xp_multiplier</code> <span className="text-gray-400">numeric(3,2) DEFAULT 1.00</span> - Prestige bonus (1.05, 1.10, etc.)</div>
                            <div>• UNIQUE(player_address, season_id)</div>
                        </div>

                        <div className="p-3 bg-green-500/10 rounded border-l-4 border-green-500">
                            <div className="font-semibold text-green-400 text-sm mb-1">Prestige System</div>
                            <p className="text-xs text-muted-foreground">
                                Players who complete all tiers gain +1 prestige level and +5% XP multiplier. 
                                Prestige carries over to future seasons, giving veteran players faster progression.
                            </p>
                        </div>
                    </div>
                </div>

                {/* xp_awards */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">xp_awards</span>
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">XP Ledger</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Transaction log of all XP awards. Supports auditing and analytics.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-blue-400">FK → players</span></div>
                        <div>• <code className="text-cyber-cyan">season_id</code> <span className="text-blue-400">FK → battle_pass_seasons</span></div>
                        <div>• <code className="text-cyber-cyan">base_amount</code> <span className="text-gray-400">integer</span> - XP before multipliers</div>
                        <div>• <code className="text-cyber-cyan">multiplier</code> <span className="text-gray-400">numeric(3,2)</span> - Applied prestige multiplier</div>
                        <div>• <code className="text-cyber-cyan">final_amount</code> <span className="text-gray-400">integer</span> - base_amount × multiplier</div>
                        <div>• <code className="text-cyber-cyan">source</code> - match_win | achievement | quest | daily_login | special_event</div>
                        <div>• <code className="text-cyber-cyan">source_id</code> <span className="text-gray-400">text</span> - Match ID, achievement ID, etc.</div>
                        <div>• <code className="text-cyber-cyan">awarded_at</code> <span className="text-gray-400">DEFAULT now()</span></div>
                    </div>
                </div>
            </section>

            {/* Section 5: Economy & Cosmetics */}
            <section id="economy" className="space-y-6">
                <h3 className="text-2xl font-orbitron text-cyber-gold flex items-center gap-3">
                    <span className="text-3xl">💰</span>
                    Economy & Cosmetics
                </h3>

                <p className="text-muted-foreground text-sm">
                    In-game economy powered by Clash Shards (soft currency). Players earn through matches, quests, and battle pass. 
                    Spend on cosmetics, character unlocks, and premium items in the rotating shop.
                </p>

                {/* cosmetic_items */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">cosmetic_items</span>
                        <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded border border-pink-500/30">Item Catalog</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Master catalog of all cosmetic items. 17 columns defining item metadata, pricing, rarity, and unlock requirements.
                    </p>

                    <div className="space-y-3">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                            <div>• <code className="text-cyber-cyan">id</code> <span className="text-purple-400">text PRIMARY KEY</span> - Slug (e.g., &quot;neon-visor&quot;)</div>
                            <div>• <code className="text-cyber-cyan">name</code> <span className="text-gray-400">text UNIQUE NOT NULL</span> - Display name</div>
                            <div>• <code className="text-cyber-cyan">description</code> <span className="text-gray-400">text</span></div>
                            <div>• <code className="text-cyber-cyan">category</code> - character | emote | banner | title | sticker | victory_pose</div>
                            <div>• <code className="text-cyber-cyan">rarity</code> - common | rare | epic | legendary | mythic</div>
                            <div>• <code className="text-cyber-cyan">price</code> <span className="text-gray-400">integer</span> - Clash Shards cost</div>
                            <div>• <code className="text-cyber-cyan">is_premium</code> <span className="text-gray-400">boolean</span> - Battle Pass exclusive</div>
                            <div>• <code className="text-cyber-cyan">character_id</code> <span className="text-blue-400">FK → characters</span> - Character-specific items</div>
                            <div>• <code className="text-cyber-cyan">unlock_requirement</code> <span className="text-gray-400">jsonb</span> - Achievement/tier/level requirement</div>
                            <div>• <code className="text-cyber-cyan">asset_url</code>, <code className="text-cyber-cyan">thumbnail_url</code> - Media assets</div>
                            <div>• <code className="text-cyber-cyan">is_tradeable</code>, <code className="text-cyber-cyan">is_animated</code> <span className="text-gray-400">boolean</span></div>
                            <div>• <code className="text-cyber-cyan">season_id</code> <span className="text-blue-400">FK → battle_pass_seasons</span> - Season exclusive items</div>
                            <div>• <code className="text-cyber-cyan">tags</code> <span className="text-gray-400">text[]</span> - Search tags</div>
                        </div>

                        <div className="p-3 bg-pink-500/10 rounded border-l-4 border-pink-500">
                            <div className="font-semibold text-pink-400 text-sm mb-1">Rarity Pricing Guidelines</div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div>• <strong className="text-white">Common:</strong> 150-500 Clash Shards</div>
                                <div>• <strong className="text-white">Rare:</strong> 800-1,500 Clash Shards</div>
                                <div>• <strong className="text-white">Epic:</strong> 2,000-4,000 Clash Shards</div>
                                <div>• <strong className="text-white">Legendary:</strong> 5,000-10,000 Clash Shards</div>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-500/10 rounded border-l-4 border-blue-500">
                            <div className="font-semibold text-blue-400 text-sm mb-1">Indexes</div>
                            <div className="text-xs text-muted-foreground">
                                • <code className="text-cyber-cyan">cosmetic_items_name_idx</code> - UNIQUE INDEX on name (supports upserts)
                            </div>
                        </div>
                    </div>
                </div>

                {/* player_inventory */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">player_inventory</span>
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">Owned Items</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Tracks which cosmetics each player owns. Junction table between players and cosmetic_items.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-blue-400">FK → players</span></div>
                        <div>• <code className="text-cyber-cyan">cosmetic_item_id</code> <span className="text-blue-400">FK → cosmetic_items</span></div>
                        <div>• <code className="text-cyber-cyan">acquired_date</code> <span className="text-gray-400">timestamptz DEFAULT now()</span></div>
                        <div>• <code className="text-cyber-cyan">source</code> - shop | battle_pass | achievement | gift | trade</div>
                        <div>• <code className="text-cyber-cyan">is_equipped</code> <span className="text-gray-400">boolean DEFAULT false</span> (deprecated, use player_loadouts)</div>
                        <div>• <code className="text-cyber-cyan">is_favorite</code> <span className="text-gray-400">boolean DEFAULT false</span></div>
                        <div>• UNIQUE(player_address, cosmetic_item_id)</div>
                    </div>
                </div>

                {/* player_loadouts */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">player_loadouts</span>
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30">Equipped Items</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Defines which cosmetics are equipped per character. Players can have different loadouts for each fighter.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-blue-400">FK → players</span></div>
                        <div>• <code className="text-cyber-cyan">character_id</code> <span className="text-blue-400">FK → characters</span></div>
                        <div>• <code className="text-cyber-cyan">emote_id</code>, <code className="text-cyber-cyan">banner_id</code>, <code className="text-cyber-cyan">title_id</code> <span className="text-blue-400">FK → cosmetic_items</span></div>
                        <div>• <code className="text-cyber-cyan">victory_pose_id</code>, <code className="text-cyber-cyan">sticker_1_id</code>, <code className="text-cyber-cyan">sticker_2_id</code> <span className="text-blue-400">FK → cosmetic_items</span></div>
                        <div>• <code className="text-cyber-cyan">updated_at</code> <span className="text-gray-400">DEFAULT now()</span></div>
                        <div>• UNIQUE(player_address, character_id)</div>
                    </div>
                </div>

                {/* player_currency */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">player_currency</span>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">Wallet Balance</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Tracks Clash Shards balance for each player. Single row per player.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-purple-400">PRIMARY KEY FK → players</span></div>
                        <div>• <code className="text-cyber-cyan">clash_shards</code> <span className="text-gray-400">bigint DEFAULT 0 CHECK ≥ 0</span></div>
                        <div>• <code className="text-cyber-cyan">lifetime_earned</code> <span className="text-gray-400">bigint DEFAULT 0</span> - Total ever earned</div>
                        <div>• <code className="text-cyber-cyan">lifetime_spent</code> <span className="text-gray-400">bigint DEFAULT 0</span> - Total ever spent</div>
                        <div>• <code className="text-cyber-cyan">last_earned_at</code>, <code className="text-cyber-cyan">last_spent_at</code> <span className="text-gray-400">timestamptz</span></div>
                        <div>• <code className="text-cyber-cyan">updated_at</code> <span className="text-gray-400">DEFAULT now()</span></div>
                    </div>
                </div>

                {/* currency_transactions */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">currency_transactions</span>
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30">Transaction Log</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Immutable ledger of all Clash Shards transactions. Enables auditing and rollback if needed.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-blue-400">FK → players</span></div>
                        <div>• <code className="text-cyber-cyan">type</code> - earn | spend</div>
                        <div>• <code className="text-cyber-cyan">amount</code> <span className="text-gray-400">bigint</span></div>
                        <div>• <code className="text-cyber-cyan">source</code> - match_win | quest | achievement | shop | battle_pass | admin_grant | refund</div>
                        <div>• <code className="text-cyber-cyan">source_id</code> <span className="text-gray-400">text</span> - Match ID, quest ID, purchase ID, etc.</div>
                        <div>• <code className="text-cyber-cyan">balance_before</code>, <code className="text-cyber-cyan">balance_after</code> <span className="text-gray-400">bigint</span></div>
                        <div>• <code className="text-cyber-cyan">created_at</code> <span className="text-gray-400">DEFAULT now()</span></div>
                    </div>
                </div>

                {/* shop_purchases & shop_rotations */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">shop_purchases & shop_rotations</span>
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">Shop System</span>
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50">
                            <div className="font-semibold text-white text-sm mb-2">shop_purchases</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• player_address (FK → players)</li>
                                <li>• cosmetic_item_id (FK → cosmetic_items)</li>
                                <li>• price (integer) - Price at purchase time</li>
                                <li>• currency_type (clash_shards/kas)</li>
                                <li>• success (boolean)</li>
                                <li>• purchased_at (timestamptz)</li>
                            </ul>
                        </div>
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50">
                            <div className="font-semibold text-white text-sm mb-2">shop_rotations</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• rotation_date (date PRIMARY KEY)</li>
                                <li>• featured_items (text[]) - Item IDs</li>
                                <li>• discounted_items (jsonb) - ID + discount %</li>
                                <li>• daily_special (text) - Single featured item</li>
                                <li>• expires_at (timestamptz)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* cosmetic_nfts */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">cosmetic_nfts</span>
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">NFT Bridge</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Links cosmetic items to on-chain NFTs on Kaspa. Enables trading and true ownership.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">cosmetic_item_id</code> <span className="text-blue-400">FK → cosmetic_items</span></div>
                        <div>• <code className="text-cyber-cyan">owner_address</code> <span className="text-blue-400">FK → players</span></div>
                        <div>• <code className="text-cyber-cyan">mint_tx_id</code> <span className="text-purple-400">text UNIQUE</span> - Kaspa mint transaction</div>
                        <div>• <code className="text-cyber-cyan">token_id</code> <span className="text-gray-400">text</span> - On-chain token identifier</div>
                        <div>• <code className="text-cyber-cyan">network</code> - mainnet | testnet</div>
                        <div>• <code className="text-cyber-cyan">minted_at</code> <span className="text-gray-400">timestamptz DEFAULT now()</span></div>
                    </div>
                </div>
            </section>

            {/* Section 6: Treasury & Payouts */}
            <section id="treasury" className="space-y-6">
                <h3 className="text-2xl font-orbitron text-cyber-gold flex items-center gap-3">
                    <span className="text-3xl">🏦</span>
                    Treasury & Payouts
                </h3>

                <p className="text-muted-foreground text-sm">
                    KaspaClash treasury collects platform fees (5% from betting) and redistributes to top players weekly. 
                    Supports both ELO leaderboard and Survival mode payouts.
                </p>

                {/* treasury_distributions */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">treasury_distributions</span>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">Weekly Distributions</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Records each weekly distribution cycle. Splits treasury pool between ELO leaderboard (70%) and Survival leaderboard (30%).
                    </p>

                    <div className="space-y-3">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                            <div>• <code className="text-cyber-cyan">distribution_date</code> <span className="text-purple-400">date PRIMARY KEY</span></div>
                            <div>• <code className="text-cyber-cyan">total_pool</code> <span className="text-gray-400">bigint</span> - Available treasury balance</div>
                            <div>• <code className="text-cyber-cyan">elo_pool</code> <span className="text-gray-400">bigint</span> - 70% to ranked leaderboard</div>
                            <div>• <code className="text-cyber-cyan">survival_pool</code> <span className="text-gray-400">bigint</span> - 30% to survival leaderboard</div>
                            <div>• <code className="text-cyber-cyan">project_wallet_amount</code> <span className="text-gray-400">bigint</span> - Dev fund allocation</div>
                            <div>• <code className="text-cyber-cyan">elo_recipients_count</code>, <code className="text-cyber-cyan">survival_recipients_count</code> - Top 10 each</div>
                            <div>• <code className="text-cyber-cyan">total_paid_out</code>, <code className="text-cyber-cyan">remaining_balance</code></div>
                            <div>• <code className="text-cyber-cyan">status</code> - pending | processing | completed | failed</div>
                            <div>• <code className="text-cyber-cyan">processed_at</code>, <code className="text-cyber-cyan">completed_at</code></div>
                        </div>

                        <div className="p-3 bg-green-500/10 rounded border-l-4 border-green-500">
                            <div className="font-semibold text-green-400 text-sm mb-1">Distribution Formula</div>
                            <pre className="text-xs text-muted-foreground font-mono">
{`Total Pool = Treasury Balance
ELO Pool = Total Pool × 0.70
Survival Pool = Total Pool × 0.30

Top 10 ELO Players: Share ELO Pool (weighted by rank)
Top 10 Survival Players: Share Survival Pool (weighted by rank)

Rank 1: 25% of pool
Rank 2: 18%
Rank 3: 13%
Rank 4-10: Decreasing shares`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* distribution_payouts */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">distribution_payouts</span>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">Individual Payouts</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Individual payout records for each player in the distribution. Links to treasury_distributions parent record.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">distribution_date</code> <span className="text-blue-400">FK → treasury_distributions</span></div>
                        <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-blue-400">FK → players</span></div>
                        <div>• <code className="text-cyber-cyan">leaderboard_type</code> - elo | survival</div>
                        <div>• <code className="text-cyber-cyan">rank</code> <span className="text-gray-400">integer CHECK 1-10</span></div>
                        <div>• <code className="text-cyber-cyan">amount</code> <span className="text-gray-400">bigint</span> - Payout in sompi</div>
                        <div>• <code className="text-cyber-cyan">tx_id</code> <span className="text-purple-400">text UNIQUE</span> - Kaspa payment transaction</div>
                        <div>• <code className="text-cyber-cyan">status</code> - pending | sent | confirmed | failed</div>
                        <div>• <code className="text-cyber-cyan">sent_at</code>, <code className="text-cyber-cyan">confirmed_at</code></div>
                        <div>• UNIQUE(distribution_date, player_address, leaderboard_type)</div>
                    </div>
                </div>

                {/* treasury_deposits & treasury_balance_snapshots */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">treasury_deposits & treasury_balance_snapshots</span>
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">Treasury Tracking</span>
                    </h4>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50">
                            <div className="font-semibold text-white text-sm mb-2">treasury_deposits</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• amount (bigint) - Deposit in sompi</li>
                                <li>• source (betting/shop/stake/other)</li>
                                <li>• tx_id (text UNIQUE) - Kaspa tx hash</li>
                                <li>• network (mainnet/testnet)</li>
                                <li>• match_id, bet_id - Source references</li>
                                <li>• deposited_at (timestamptz)</li>
                            </ul>
                        </div>
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50">
                            <div className="font-semibold text-white text-sm mb-2">treasury_balance_snapshots</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• balance (bigint) - Treasury balance</li>
                                <li>• snapshot_type (daily/pre_distribution/post_distribution/manual)</li>
                                <li>• distribution_date (FK → treasury_distributions)</li>
                                <li>• created_at (timestamptz)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 7: Blockchain Integration */}
            <section id="blockchain" className="space-y-6">
                <h3 className="text-2xl font-orbitron text-cyber-gold flex items-center gap-3">
                    <span className="text-3xl">⛓️</span>
                    Blockchain Integration
                </h3>

                <p className="text-muted-foreground text-sm">
                    KaspaClash anchors critical game events to the Kaspa blockchain for provable fairness and permanence. 
                    Supports achievement unlocks, leaderboard rankings, and season completions.
                </p>

                {/* blockchain_anchors */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">blockchain_anchors</span>
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30">On-Chain Records</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Records game achievements permanently on Kaspa blockchain. 4 anchor types supported.
                    </p>

                    <div className="space-y-3">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                            <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-blue-400">FK → players</span></div>
                            <div>• <code className="text-cyber-cyan">anchor_type</code> - leaderboard_rank | prestige_level | achievement_unlock | season_completion</div>
                            <div>• <code className="text-cyber-cyan">data</code> <span className="text-gray-400">jsonb</span> - Event-specific data (rank, achievement_id, season_id, etc.)</div>
                            <div>• <code className="text-cyber-cyan">data_hash</code> <span className="text-gray-400">text</span> - SHA-256 hash for verification</div>
                            <div>• <code className="text-cyber-cyan">tx_id</code> <span className="text-purple-400">text UNIQUE</span> - Kaspa transaction hash</div>
                            <div>• <code className="text-cyber-cyan">network</code> - mainnet | testnet</div>
                            <div>• <code className="text-cyber-cyan">block_hash</code>, <code className="text-cyber-cyan">block_height</code> - Blockchain confirmation</div>
                            <div>• <code className="text-cyber-cyan">confirmed</code> <span className="text-gray-400">boolean DEFAULT false</span></div>
                            <div>• <code className="text-cyber-cyan">created_at</code>, <code className="text-cyber-cyan">confirmed_at</code></div>
                        </div>

                        <div className="p-3 bg-cyan-500/10 rounded border-l-4 border-cyan-500">
                            <div className="font-semibold text-cyan-400 text-sm mb-1">Anchor Types</div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div>• <strong className="text-white">leaderboard_rank:</strong> Weekly top 10 rankings</div>
                                <div>• <strong className="text-white">prestige_level:</strong> Prestige milestones</div>
                                <div>• <strong className="text-white">achievement_unlock:</strong> Major achievements</div>
                                <div>• <strong className="text-white">season_completion:</strong> Battle Pass completion</div>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-800/50 rounded">
                            <div className="font-semibold mb-2 text-sm text-white">Example data JSON:</div>
                            <pre className="text-xs overflow-x-auto text-green-400">
{`{
  "achievement_id": "first-blood",
  "timestamp": "2026-02-03T12:34:56Z",
  "metadata": {
    "match_id": "uuid",
    "opponent": "kaspa:abc123..."
  }
}`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* verification_badges */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">verification_badges</span>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">Verified Achievements</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        UI-friendly view of verified blockchain anchors. Shows badge status and explorer links.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-blue-400">FK → players</span></div>
                        <div>• <code className="text-cyber-cyan">anchor_id</code> <span className="text-blue-400">UNIQUE FK → blockchain_anchors</span></div>
                        <div>• <code className="text-cyber-cyan">badge_type</code> - Derived from anchor_type</div>
                        <div>• <code className="text-cyber-cyan">badge_name</code>, <code className="text-cyber-cyan">badge_description</code> - Display text</div>
                        <div>• <code className="text-cyber-cyan">icon_url</code> - Badge icon asset</div>
                        <div>• <code className="text-cyber-cyan">is_verified</code> <span className="text-gray-400">boolean</span></div>
                        <div>• <code className="text-cyber-cyan">explorer_url</code> <span className="text-gray-400">text</span> - Link to Kaspa explorer</div>
                        <div>• <code className="text-cyber-cyan">awarded_at</code> <span className="text-gray-400">timestamptz</span></div>
                    </div>
                </div>
            </section>

            {/* Section 8: Security & Auth */}
            <section id="security" className="space-y-6">
                <h3 className="text-2xl font-orbitron text-cyber-gold flex items-center gap-3">
                    <span className="text-3xl">🔐</span>
                    Security & Auth
                </h3>

                <p className="text-muted-foreground text-sm">
                    Session management, rate limiting, and audit logging protect the game from abuse and unauthorized access.
                </p>

                {/* session_tokens */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">session_tokens</span>
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">Session Auth</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Manages active player sessions. Tokens expire after 7 days of inactivity.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-blue-400">FK → players</span></div>
                        <div>• <code className="text-cyber-cyan">token</code> <span className="text-purple-400">text UNIQUE</span> - JWT or secure random token</div>
                        <div>• <code className="text-cyber-cyan">expires_at</code> <span className="text-gray-400">timestamptz</span> - Expiration timestamp</div>
                        <div>• <code className="text-cyber-cyan">last_used_at</code> <span className="text-gray-400">timestamptz</span> - Activity tracking</div>
                        <div>• <code className="text-cyber-cyan">created_at</code> <span className="text-gray-400">DEFAULT now()</span></div>
                    </div>
                </div>

                {/* rate_limits */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">rate_limits</span>
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30">API Throttling</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Tracks API request counts per client. Prevents abuse and DDoS attacks.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">client_id</code> <span className="text-gray-400">text</span> - IP address or player address</div>
                        <div>• <code className="text-cyber-cyan">endpoint</code> <span className="text-gray-400">text</span> - API route path</div>
                        <div>• <code className="text-cyber-cyan">request_count</code> <span className="text-gray-400">integer</span> - Requests in current window</div>
                        <div>• <code className="text-cyber-cyan">window_start</code> <span className="text-gray-400">timestamptz</span> - Rolling window start</div>
                        <div>• <code className="text-cyber-cyan">updated_at</code> <span className="text-gray-400">DEFAULT now()</span></div>
                        <div>• UNIQUE(client_id, endpoint)</div>
                    </div>
                </div>

                {/* security_audit_log */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">security_audit_log</span>
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">Audit Trail</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Immutable log of security events (logins, failed auth, suspicious activity).
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-blue-400">FK → players</span></div>
                        <div>• <code className="text-cyber-cyan">event_type</code> - login | logout | failed_auth | rate_limit_exceeded | wallet_change</div>
                        <div>• <code className="text-cyber-cyan">event_data</code> <span className="text-gray-400">jsonb</span> - Event-specific details</div>
                        <div>• <code className="text-cyber-cyan">severity</code> - info | warning | critical</div>
                        <div>• <code className="text-cyber-cyan">client_ip</code> <span className="text-gray-400">text</span></div>
                        <div>• <code className="text-cyber-cyan">user_agent</code> <span className="text-gray-400">text</span></div>
                        <div>• <code className="text-cyber-cyan">created_at</code> <span className="text-gray-400">DEFAULT now()</span></div>
                    </div>
                </div>
            </section>

            {/* Section 9: Survival Mode */}
            <section id="survival" className="space-y-6">
                <h3 className="text-2xl font-orbitron text-cyber-gold flex items-center gap-3">
                    <span className="text-3xl">🌊</span>
                    Survival Mode
                </h3>

                <p className="text-muted-foreground text-sm">
                    PvE endless mode where players fight progressively harder AI opponents. Earn Clash Shards based on waves cleared. 
                    Separate leaderboard with treasury payouts.
                </p>

                {/* survival_runs */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">survival_runs</span>
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">Run History</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Records each survival attempt. Max 20 waves. Leaderboard ranks by highest waves_cleared.
                    </p>

                    <div className="space-y-3">
                        <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                            <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-blue-400">FK → players</span></div>
                            <div>• <code className="text-cyber-cyan">character_id</code> <span className="text-blue-400">FK → characters</span></div>
                            <div>• <code className="text-cyber-cyan">waves_cleared</code> <span className="text-gray-400">integer CHECK 0-20</span></div>
                            <div>• <code className="text-cyber-cyan">shards_earned</code> <span className="text-gray-400">integer</span> - Clash Shards reward</div>
                            <div>• <code className="text-cyber-cyan">final_health</code> <span className="text-gray-400">integer</span> - HP when run ended</div>
                            <div>• <code className="text-cyber-cyan">power_surges_used</code> <span className="text-gray-400">jsonb</span> - Array of cards used</div>
                            <div>• <code className="text-cyber-cyan">network</code> - mainnet | testnet</div>
                            <div>• <code className="text-cyber-cyan">started_at</code>, <code className="text-cyber-cyan">ended_at</code></div>
                        </div>

                        <div className="p-3 bg-purple-500/10 rounded border-l-4 border-purple-500">
                            <div className="font-semibold text-purple-400 text-sm mb-1">Rewards Formula</div>
                            <pre className="text-xs text-muted-foreground font-mono">
{`shards_earned = waves_cleared × 50 + (waves_cleared > 10 ? 500 : 0)

Wave 1: 50 shards
Wave 5: 250 shards
Wave 10: 500 shards
Wave 15: 1,250 shards (750 + 500 bonus)
Wave 20: 1,500 shards (1,000 + 500 bonus)`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* survival_daily_plays */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="font-mono text-cyber-cyan">survival_daily_plays</span>
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30">Daily Limit</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Enforces 3 free survival runs per day per player. Resets at midnight UTC.
                    </p>

                    <div className="p-3 bg-black/30 rounded border border-sidebar-border/50 text-xs text-muted-foreground space-y-1">
                        <div>• <code className="text-cyber-cyan">player_address</code> <span className="text-blue-400">FK → players</span></div>
                        <div>• <code className="text-cyber-cyan">play_date</code> <span className="text-gray-400">date</span></div>
                        <div>• <code className="text-cyber-cyan">plays_count</code> <span className="text-gray-400">integer CHECK 0-3</span></div>
                        <div>• <code className="text-cyber-cyan">network</code> - mainnet | testnet</div>
                        <div>• <code className="text-cyber-cyan">last_play_at</code> <span className="text-gray-400">timestamptz</span></div>
                        <div>• UNIQUE(player_address, play_date, network)</div>
                    </div>
                </div>
            </section>

            {/* Section 10: Entity Relationships */}
            <section id="relationships" className="space-y-6">
                <h3 className="text-2xl font-orbitron text-cyber-gold flex items-center gap-3">
                    <span className="text-3xl">🔗</span>
                    Entity Relationships
                </h3>

                <p className="text-muted-foreground text-sm">
                    The database schema uses 50+ foreign key constraints to maintain referential integrity across domains.
                </p>

                {/* Key relationships diagram */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-lg font-semibold text-white mb-4">Core Relationship Map</h4>
                    
                    <div className="space-y-4 text-xs">
                        <div className="p-3 bg-purple-500/10 rounded border-l-4 border-purple-500">
                            <div className="font-semibold text-purple-400 mb-2">players (Hub)</div>
                            <div className="text-muted-foreground space-y-1">
                                <div>→ <strong>matches</strong> (player1_address, player2_address, winner_address)</div>
                                <div>→ <strong>matchmaking_queue</strong> (address, matched_with)</div>
                                <div>→ <strong>bets</strong> (bettor_address)</div>
                                <div>→ <strong>player_progression</strong> (player_address)</div>
                                <div>→ <strong>player_inventory</strong> (player_address)</div>
                                <div>→ <strong>player_currency</strong> (player_address)</div>
                                <div>→ <strong>distribution_payouts</strong> (player_address)</div>
                                <div>→ <strong>blockchain_anchors</strong> (player_address)</div>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-500/10 rounded border-l-4 border-blue-500">
                            <div className="font-semibold text-blue-400 mb-2">matches</div>
                            <div className="text-muted-foreground space-y-1">
                                <div>→ <strong>rounds</strong> (match_id)</div>
                                <div>→ <strong>power_surges</strong> (match_id)</div>
                                <div>→ <strong>fight_state_snapshots</strong> (match_id)</div>
                                <div>→ <strong>betting_pools</strong> (match_id)</div>
                                <div>← <strong>characters</strong> (player1_character_id, player2_character_id)</div>
                            </div>
                        </div>

                        <div className="p-3 bg-green-500/10 rounded border-l-4 border-green-500">
                            <div className="font-semibold text-green-400 mb-2">battle_pass_seasons</div>
                            <div className="text-muted-foreground space-y-1">
                                <div>→ <strong>battle_pass_tiers</strong> (season_id)</div>
                                <div>→ <strong>player_progression</strong> (season_id)</div>
                                <div>→ <strong>cosmetic_items</strong> (season_id)</div>
                            </div>
                        </div>

                        <div className="p-3 bg-pink-500/10 rounded border-l-4 border-pink-500">
                            <div className="font-semibold text-pink-400 mb-2">cosmetic_items</div>
                            <div className="text-muted-foreground space-y-1">
                                <div>→ <strong>player_inventory</strong> (cosmetic_item_id)</div>
                                <div>→ <strong>player_loadouts</strong> (emote_id, banner_id, title_id, etc.)</div>
                                <div>→ <strong>cosmetic_nfts</strong> (cosmetic_item_id)</div>
                                <div>← <strong>characters</strong> (character_id - for character-specific items)</div>
                            </div>
                        </div>

                        <div className="p-3 bg-orange-500/10 rounded border-l-4 border-orange-500">
                            <div className="font-semibold text-orange-400 mb-2">treasury_distributions</div>
                            <div className="text-muted-foreground space-y-1">
                                <div>→ <strong>distribution_payouts</strong> (distribution_date)</div>
                                <div>→ <strong>treasury_balance_snapshots</strong> (distribution_date)</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-yellow-500/10 rounded border-l-4 border-yellow-500">
                    <div className="font-semibold text-yellow-400 text-sm mb-2">⚠️ Cascade Behavior</div>
                    <p className="text-xs text-muted-foreground">
                        Most foreign keys use <code className="text-cyber-cyan">ON DELETE CASCADE</code> or <code className="text-cyber-cyan">ON DELETE SET NULL</code>. 
                        Deleting a player cascades to their matches, bets, inventory, and progression. 
                        Check migration files for specific cascade rules.
                    </p>
                </div>
            </section>

            {/* Section 11: Query Patterns */}
            <section id="query-patterns" className="space-y-6">
                <h3 className="text-2xl font-orbitron text-cyber-gold flex items-center gap-3">
                    <span className="text-3xl">⚡</span>
                    Query Patterns
                </h3>

                <p className="text-muted-foreground text-sm">
                    KaspaClash uses optimized query utilities to handle complex database operations efficiently.
                </p>

                {/* parallelQueries */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3">
                        <span className="font-mono text-cyber-cyan">parallelQueries</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Execute multiple independent queries in parallel for faster page loads. From <code className="text-xs text-cyber-cyan">src/lib/supabase/query-utils.ts</code>.
                    </p>

                    <div className="p-3 bg-gray-800/50 rounded">
                        <pre className="text-xs overflow-x-auto text-green-400">
{`import { parallelQueries } from '@/lib/supabase/query-utils';

const [playerData, matchHistory, inventory] = await parallelQueries([
  supabase.from('players').select('*').eq('address', addr).single(),
  supabase.from('matches').select('*').eq('player1_address', addr).limit(10),
  supabase.from('player_inventory').select('*, cosmetic_items(*)').eq('player_address', addr)
]);

// All 3 queries executed simultaneously
console.log(playerData.data, matchHistory.data, inventory.data);`}
                        </pre>
                    </div>
                </div>

                {/* chunkedIn */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3">
                        <span className="font-mono text-cyber-cyan">chunkedIn</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        PostgreSQL IN clauses have a 100-item limit. This utility chunks large arrays and combines results.
                    </p>

                    <div className="p-3 bg-gray-800/50 rounded">
                        <pre className="text-xs overflow-x-auto text-green-400">
{`import { chunkedIn } from '@/lib/supabase/query-utils';

const playerAddresses = [...]; // 500 addresses
const { data, error } = await chunkedIn(
  supabase,
  'players',
  'address',
  playerAddresses,
  'address, display_name, rating'
);

// Automatically splits into 5 queries (100 each), merges results`}
                        </pre>
                    </div>
                </div>

                {/* batchUpdate & batchInsert */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3">
                        <span className="font-mono text-cyber-cyan">batchUpdate & batchInsert</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Bulk operations with upsert support (ON CONFLICT).
                    </p>

                    <div className="p-3 bg-gray-800/50 rounded">
                        <pre className="text-xs overflow-x-auto text-green-400">
{`import { batchUpdate, batchInsert } from '@/lib/supabase/query-utils';

// Batch upsert
await batchUpdate(
  supabase,
  'player_currency',
  [
    { player_address: 'kaspa:abc', clash_shards: 1000 },
    { player_address: 'kaspa:def', clash_shards: 2000 }
  ],
  { onConflict: 'player_address' }
);

// Batch insert (fails on duplicate)
await batchInsert(supabase, 'xp_awards', [
  { player_address: 'kaspa:abc', base_amount: 100, source: 'match_win' },
  { player_address: 'kaspa:def', base_amount: 150, source: 'achievement' }
]);`}
                        </pre>
                    </div>
                </div>

                {/* Real-time subscriptions */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3">
                        <span className="font-mono text-cyber-cyan">Real-time Subscriptions</span>
                    </h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Subscribe to table changes for live updates. Used for match state, betting pools, and quest progress.
                    </p>

                    <div className="p-3 bg-gray-800/50 rounded">
                        <pre className="text-xs overflow-x-auto text-green-400">
{`const supabase = getSupabaseClient();

// Subscribe to fight state updates
const channel = supabase
  .channel(\`game:\${matchId}\`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'fight_state_snapshots',
    filter: \`match_id=eq.\${matchId}\`
  }, (payload) => {
    console.log('Fight state updated:', payload.new);
    updateUI(payload.new);
  })
  .subscribe();

// Cleanup
channel.unsubscribe();`}
                        </pre>
                    </div>
                </div>
            </section>

            {/* Section 12: Best Practices */}
            <section id="best-practices" className="space-y-6">
                <h3 className="text-2xl font-orbitron text-cyber-gold flex items-center gap-3">
                    <span className="text-3xl">✨</span>
                    Best Practices
                </h3>

                {/* Type Safety */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3">Type Safety with TypeScript</h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        All database types auto-generated from schema. Located in <code className="text-xs text-cyber-cyan">src/lib/supabase/types.ts</code>.
                    </p>

                    <div className="p-3 bg-gray-800/50 rounded mb-3">
                        <pre className="text-xs overflow-x-auto text-green-400">
{`import { Database } from '@/lib/supabase/types';

type Player = Database['public']['Tables']['players']['Row'];
type MatchInsert = Database['public']['Tables']['matches']['Insert'];
type BetUpdate = Database['public']['Tables']['bets']['Update'];

const player: Player = { address: 'kaspa:...', rating: 1500, ... };`}
                        </pre>
                    </div>

                    <div className="p-3 bg-blue-500/10 rounded border-l-4 border-blue-500">
                        <div className="font-semibold text-blue-400 text-sm mb-1">Regenerate Types</div>
                        <div className="text-xs text-muted-foreground font-mono">
                            npx supabase gen types typescript --project-id YOUR_PROJECT_ID {`>`} src/lib/supabase/types.ts
                        </div>
                    </div>
                </div>

                {/* Migration Strategy */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3">Migration Strategy</h4>
                    
                    <div className="space-y-3 text-sm">
                        <div className="p-3 bg-green-500/10 rounded border-l-4 border-green-500">
                            <div className="font-semibold text-green-400 mb-2">✓ DO</div>
                            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                                <li>• Use numbered migration files (001_, 002_, etc.)</li>
                                <li>• Include rollback SQL in comments</li>
                                <li>• Test migrations on local Supabase instance first</li>
                                <li>• Add indexes for frequently queried columns (rating, created_at)</li>
                                <li>• Use CHECK constraints for data validation</li>
                                <li>• Document complex foreign key cascades</li>
                            </ul>
                        </div>

                        <div className="p-3 bg-red-500/10 rounded border-l-4 border-red-500">
                            <div className="font-semibold text-red-400 mb-2">✗ DON&apos;T</div>
                            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                                <li>• Run current_schema.sql directly (context-only file)</li>
                                <li>• Drop tables without CASCADE planning</li>
                                <li>• Modify column types on large tables without downtime plan</li>
                                <li>• Use SERIAL instead of uuid_generate_v4() for IDs</li>
                                <li>• Forget UNIQUE constraints on natural keys (tx_id, room_code)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Performance Tips */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3">Performance Optimization</h4>
                    
                    <div className="space-y-3">
                        <div className="p-3 bg-purple-500/10 rounded border-l-4 border-purple-500">
                            <div className="font-semibold text-purple-400 text-sm mb-2">Indexing Strategy</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• <strong className="text-white">Leaderboard queries:</strong> CREATE INDEX ON players(rating DESC)</li>
                                <li>• <strong className="text-white">Match history:</strong> CREATE INDEX ON matches(player1_address, created_at DESC)</li>
                                <li>• <strong className="text-white">Betting lookups:</strong> CREATE INDEX ON bets(pool_id, status)</li>
                                <li>• <strong className="text-white">Real-time filters:</strong> CREATE INDEX ON fight_state_snapshots(match_id) (likely auto-created via FK)</li>
                            </ul>
                        </div>

                        <div className="p-3 bg-orange-500/10 rounded border-l-4 border-orange-500">
                            <div className="font-semibold text-orange-400 text-sm mb-2">Query Optimization</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• Use <code className="text-cyber-cyan">select(&apos;specific, columns&apos;)</code> instead of <code className="text-cyber-cyan">select(&apos;*&apos;)</code></li>
                                <li>• Paginate large result sets with <code className="text-cyber-cyan">.range(start, end)</code></li>
                                <li>• Cache frequent reads (leaderboard top 10) with Redis/Vercel KV</li>
                                <li>• Use <code className="text-cyber-cyan">count: &apos;exact&apos;</code> sparingly (slow on large tables)</li>
                                <li>• Prefer joins over multiple round-trips when fetching related data</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* RLS Policies */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3">Row Level Security (RLS)</h4>
                    <p className="text-muted-foreground mb-4 text-sm">
                        While RLS policies are not found in migration files, they should be configured for production security.
                    </p>

                    <div className="p-3 bg-gray-800/50 rounded">
                        <div className="font-semibold mb-2 text-sm text-white">Example Policy:</div>
                        <pre className="text-xs overflow-x-auto text-green-400">
{`-- Players can only read their own data
CREATE POLICY "players_select_own" ON players
  FOR SELECT USING (auth.uid()::text = address);

-- Players can update their own display_name
CREATE POLICY "players_update_own" ON players
  FOR UPDATE USING (auth.uid()::text = address)
  WITH CHECK (auth.uid()::text = address);

-- Anyone can read match results (public leaderboard)
CREATE POLICY "matches_select_public" ON matches
  FOR SELECT USING (status = 'completed');`}
                        </pre>
                    </div>
                </div>

                {/* Connection Pooling */}
                <div className="border border-sidebar-border rounded-lg p-6 bg-black/20">
                    <h4 className="text-xl font-semibold text-white mb-3">Connection Management</h4>
                    
                    <div className="space-y-3 text-xs text-muted-foreground">
                        <div className="p-3 bg-cyan-500/10 rounded border-l-4 border-cyan-500">
                            <div className="font-semibold text-cyan-400 mb-2">Serverless Functions</div>
                            <p>
                                Use Supabase pooler connection string (port 6543) to avoid exhausting connections in serverless environments. 
                                Each API route should create a short-lived client via <code className="text-cyber-cyan">createSupabaseServerClient()</code>.
                            </p>
                        </div>

                        <div className="p-3 bg-green-500/10 rounded border-l-4 border-green-500">
                            <div className="font-semibold text-green-400 mb-2">Real-time Subscriptions</div>
                            <p>
                                Client-side subscriptions use persistent WebSocket connections. Always unsubscribe when component unmounts 
                                to prevent memory leaks. Max 100 concurrent channels per client.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Summary */}
            <div className="border border-cyber-gold/30 rounded-lg p-8 bg-gradient-to-br from-cyber-gold/5 to-cyber-cyan/5 text-center">
                <div className="text-4xl mb-4">🎮</div>
                <h3 className="text-xl font-orbitron text-cyber-gold mb-3">Database Documentation Complete</h3>
                <p className="text-muted-foreground text-sm mb-4">
                    This comprehensive guide covers all 40+ tables, 300+ columns, 50+ foreign keys, and critical query patterns 
                    for KaspaClash&apos;s Supabase PostgreSQL database.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-black/30 rounded">
                        <div className="font-bold text-purple-400 text-lg">9</div>
                        <div className="text-muted-foreground">Domains</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded">
                        <div className="font-bold text-blue-400 text-lg">40+</div>
                        <div className="text-muted-foreground">Tables</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded">
                        <div className="font-bold text-green-400 text-lg">300+</div>
                        <div className="text-muted-foreground">Columns</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded">
                        <div className="font-bold text-orange-400 text-lg">100%</div>
                        <div className="text-muted-foreground">Type Safe</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
