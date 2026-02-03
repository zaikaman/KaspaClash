'use client';

import React from 'react';

export function DevArchitecture() {
    return (
        <div className="space-y-8">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                
                {/* System Overview */}
                <div className="bg-gradient-to-br from-cyber-gold/10 to-cyber-blue/10 p-8 rounded-2xl border border-cyber-gold/30 mb-8">
                    <h2 className="text-3xl text-cyber-gold mb-4 mt-0">System Architecture</h2>
                    <p className="text-lg mb-0">
                        KaspaClash is a <strong>full-stack Web3 gaming platform</strong> built on a modern TypeScript stack. The architecture leverages Kaspa's BlockDAG for transaction-per-move gameplay, Phaser.js for real-time combat rendering, and Supabase for persistent state management and real-time synchronization.
                    </p>
                </div>

                {/* Technology Stack */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Technology Stack</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 not-prose">
                    {/* Frontend */}
                    <div className="bg-black/40 p-6 rounded-xl border border-cyber-gold/30">
                        <h4 className="text-lg font-bold text-cyber-gold mb-4 font-orbitron">Frontend Layer</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-cyber-gold mt-1">▸</span>
                                <span><strong className="text-white">Next.js 16.1</strong> - App Router, Server Components, API Routes</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyber-gold mt-1">▸</span>
                                <span><strong className="text-white">React 19.2</strong> - Concurrent features, RSC</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyber-gold mt-1">▸</span>
                                <span><strong className="text-white">TypeScript 5.0</strong> - Full type safety across stack</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyber-gold mt-1">▸</span>
                                <span><strong className="text-white">Tailwind CSS 4</strong> - Utility-first styling with custom theme</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyber-gold mt-1">▸</span>
                                <span><strong className="text-white">Framer Motion 12</strong> - Advanced animations</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyber-gold mt-1">▸</span>
                                <span><strong className="text-white">Zustand 5.0</strong> - Lightweight state management</span>
                            </li>
                        </ul>
                    </div>

                    {/* Game Engine */}
                    <div className="bg-black/40 p-6 rounded-xl border border-purple-500/30">
                        <h4 className="text-lg font-bold text-purple-400 mb-4 font-orbitron">Game Engine</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">▸</span>
                                <span><strong className="text-white">Phaser 3.88</strong> - HTML5 game framework</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">▸</span>
                                <span><strong className="text-white">Canvas Renderer</strong> - Hardware-accelerated graphics</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">▸</span>
                                <span><strong className="text-white">Scene Manager</strong> - State machine for game flow</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">▸</span>
                                <span><strong className="text-white">EventBus</strong> - React ↔ Phaser communication</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">▸</span>
                                <span><strong className="text-white">Combat Engine</strong> - Deterministic turn resolution</span>
                            </li>
                        </ul>
                    </div>

                    {/* Backend */}
                    <div className="bg-black/40 p-6 rounded-xl border border-cyan-500/30">
                        <h4 className="text-lg font-bold text-cyan-400 mb-4 font-orbitron">Backend Infrastructure</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">▸</span>
                                <span><strong className="text-white">Next.js API Routes</strong> - Serverless Edge Functions</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">▸</span>
                                <span><strong className="text-white">Supabase PostgreSQL</strong> - Relational database with RLS</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">▸</span>
                                <span><strong className="text-white">Supabase Realtime</strong> - WebSocket-based pub/sub</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">▸</span>
                                <span><strong className="text-white">Vercel Cron Jobs</strong> - Scheduled tasks (payouts, rotations)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">▸</span>
                                <span><strong className="text-white">Cloudinary</strong> - Match replay image generation</span>
                            </li>
                        </ul>
                    </div>

                    {/* Blockchain */}
                    <div className="bg-black/40 p-6 rounded-xl border border-green-500/30">
                        <h4 className="text-lg font-bold text-green-400 mb-4 font-orbitron">Blockchain Layer</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">▸</span>
                                <span><strong className="text-white">Kaspa WASM 0.13+</strong> - Transaction building/signing</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">▸</span>
                                <span><strong className="text-white">kaspalib 0.0.3</strong> - Address utilities</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">▸</span>
                                <span><strong className="text-white">Kasware Wallet</strong> - Browser extension integration</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">▸</span>
                                <span><strong className="text-white">Vault Service</strong> - Server-side transaction signing</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">▸</span>
                                <span><strong className="text-white">NFT Minter</strong> - Client-side cosmetic inscription</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Architecture Diagram */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">System Architecture Diagram</h3>
                
                <div className="my-8 space-y-6">
                    {/* Client Layer */}
                    <div className="bg-gradient-to-br from-cyber-gold/10 to-cyber-gold/5 p-6 rounded-2xl border-2 border-cyber-gold/50">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🖥️</span>
                            <h4 className="text-lg font-bold text-cyber-gold font-orbitron">CLIENT (Browser)</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Next.js React */}
                            <div className="bg-black/40 p-4 rounded-xl border border-cyber-gold/30">
                                <div className="text-white font-semibold mb-3 text-sm">Next.js React</div>
                                <div className="space-y-2">
                                    <div className="bg-cyber-gold/10 px-3 py-2 rounded-lg text-xs">
                                        <div className="text-cyber-gold font-semibold mb-1">UI Components</div>
                                        <div className="text-muted-foreground space-y-0.5">
                                            <div>• Landing</div>
                                            <div>• Matchmaking</div>
                                            <div>• Shop</div>
                                            <div>• Battle Pass</div>
                                        </div>
                                    </div>
                                    <div className="bg-cyber-gold/10 px-3 py-2 rounded-lg text-xs text-muted-foreground">
                                        Zustand Stores
                                    </div>
                                </div>
                            </div>

                            {/* Phaser.js Game */}
                            <div className="bg-black/40 p-4 rounded-xl border border-purple-500/30">
                                <div className="text-white font-semibold mb-3 text-sm">Phaser.js Game Engine</div>
                                <div className="space-y-2">
                                    <div className="bg-purple-500/10 px-3 py-2 rounded-lg text-xs">
                                        <div className="text-purple-400 font-semibold mb-1">Scenes</div>
                                        <div className="text-muted-foreground space-y-0.5">
                                            <div>• Fight</div>
                                            <div>• Select</div>
                                            <div>• Replay</div>
                                            <div>• Survival</div>
                                        </div>
                                    </div>
                                    <div className="bg-purple-500/10 px-3 py-2 rounded-lg text-xs text-muted-foreground">
                                        EventBus ↔ React
                                    </div>
                                </div>
                            </div>

                            {/* Kaspa Wallet */}
                            <div className="bg-black/40 p-4 rounded-xl border border-green-500/30">
                                <div className="text-white font-semibold mb-3 text-sm">💳 Kaspa Wallet</div>
                                <div className="text-xs text-green-400 mb-2">(Kasware Extension)</div>
                                <div className="bg-green-500/10 px-3 py-2 rounded-lg text-xs text-muted-foreground space-y-0.5">
                                    <div>• Transaction Signing</div>
                                    <div>• Move Verification</div>
                                    <div>• NFT Minting</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Connection Arrow */}
                    <div className="flex justify-center">
                        <div className="text-4xl text-purple-400">↓</div>
                    </div>

                    {/* WebSocket Layer */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4 rounded-xl border-2 border-purple-500/50">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">🔌</span>
                            <h4 className="text-base font-bold text-purple-400 font-orbitron">Supabase Realtime (WebSocket Layer)</h4>
                        </div>
                        <div className="bg-black/40 px-4 py-3 rounded-lg text-xs text-muted-foreground">
                            <span className="text-purple-300">Channels:</span> matchmaking:queue • game:matchId • spectate:matchId • progression:playerAddress • quests:daily • shop:featured
                        </div>
                    </div>

                    {/* Connection Arrow */}
                    <div className="flex justify-center">
                        <div className="text-4xl text-cyan-400">↓</div>
                    </div>

                    {/* Server Layer */}
                    <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 p-6 rounded-2xl border-2 border-cyan-500/50">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">⚙️</span>
                            <h4 className="text-lg font-bold text-cyan-400 font-orbitron">SERVER (Vercel Edge)</h4>
                        </div>

                        {/* API Routes */}
                        <div className="mb-4">
                            <div className="text-white font-semibold mb-3 text-sm">Next.js API Routes</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                <div className="bg-black/40 p-3 rounded-lg border border-cyan-500/30">
                                    <div className="text-cyan-300 font-semibold text-xs mb-2">Matchmaking</div>
                                    <div className="text-muted-foreground text-xs space-y-0.5">
                                        <div>• Queue Join</div>
                                        <div>• Room Create</div>
                                        <div>• ELO Ranking</div>
                                    </div>
                                </div>

                                <div className="bg-black/40 p-3 rounded-lg border border-cyan-500/30">
                                    <div className="text-cyan-300 font-semibold text-xs mb-2">Match Management</div>
                                    <div className="text-muted-foreground text-xs space-y-0.5">
                                        <div>• Create Match</div>
                                        <div>• Submit Move</div>
                                        <div>• Resolve Round</div>
                                    </div>
                                </div>

                                <div className="bg-black/40 p-3 rounded-lg border border-cyan-500/30">
                                    <div className="text-cyan-300 font-semibold text-xs mb-2">Progression</div>
                                    <div className="text-muted-foreground text-xs space-y-0.5">
                                        <div>• Award XP</div>
                                        <div>• Unlock Tier</div>
                                        <div>• Prestige</div>
                                    </div>
                                </div>

                                <div className="bg-black/40 p-3 rounded-lg border border-cyan-500/30">
                                    <div className="text-cyan-300 font-semibold text-xs mb-2">Betting</div>
                                    <div className="text-muted-foreground text-xs space-y-0.5">
                                        <div>• Place Bet</div>
                                        <div>• Calc Odds</div>
                                        <div>• Payout</div>
                                    </div>
                                </div>

                                <div className="bg-black/40 p-3 rounded-lg border border-cyan-500/30">
                                    <div className="text-cyan-300 font-semibold text-xs mb-2">Shop/Cosmetics</div>
                                    <div className="text-muted-foreground text-xs space-y-0.5">
                                        <div>• Purchase</div>
                                        <div>• NFT Record</div>
                                        <div>• Inventory</div>
                                    </div>
                                </div>

                                <div className="bg-black/40 p-3 rounded-lg border border-cyan-500/30">
                                    <div className="text-cyan-300 font-semibold text-xs mb-2">Achievements</div>
                                    <div className="text-muted-foreground text-xs space-y-0.5">
                                        <div>• Track Progress</div>
                                        <div>• Unlock</div>
                                        <div>• Evaluate</div>
                                    </div>
                                </div>

                                <div className="bg-black/40 p-3 rounded-lg border border-cyan-500/30">
                                    <div className="text-cyan-300 font-semibold text-xs mb-2">Quests</div>
                                    <div className="text-muted-foreground text-xs space-y-0.5">
                                        <div>• Daily Quests</div>
                                        <div>• Claim</div>
                                        <div>• Validate</div>
                                    </div>
                                </div>

                                <div className="bg-black/40 p-3 rounded-lg border border-cyan-500/30">
                                    <div className="text-cyan-300 font-semibold text-xs mb-2">Treasury</div>
                                    <div className="text-muted-foreground text-xs space-y-0.5">
                                        <div>• Distribution</div>
                                        <div>• Leaderboard</div>
                                        <div>• Payouts</div>
                                    </div>
                                </div>

                                <div className="bg-black/40 p-3 rounded-lg border border-cyan-500/30">
                                    <div className="text-cyan-300 font-semibold text-xs mb-2">Survival</div>
                                    <div className="text-muted-foreground text-xs space-y-0.5">
                                        <div>• Wave Gen</div>
                                        <div>• Score Calc</div>
                                        <div>• Update Rank</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Database and Cron */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-black/40 p-4 rounded-xl border border-cyan-500/30">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">🗄️</span>
                                    <div className="text-white font-semibold text-sm">Supabase PostgreSQL</div>
                                </div>
                                <div className="bg-cyan-500/10 px-3 py-2 rounded-lg text-xs text-muted-foreground">
                                    <div className="text-cyan-300 font-semibold mb-1">Tables:</div>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                                        <div>• players</div>
                                        <div>• matches, rounds</div>
                                        <div>• betting_pools</div>
                                        <div>• bets</div>
                                        <div>• player_progression</div>
                                        <div>• daily_quests</div>
                                        <div>• cosmetic_items</div>
                                        <div>• inventory</div>
                                        <div>• achievements</div>
                                        <div>• treasury_distributions</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/40 p-4 rounded-xl border border-cyan-500/30">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">⏰</span>
                                    <div className="text-white font-semibold text-sm">Cron Jobs (Vercel)</div>
                                </div>
                                <div className="bg-cyan-500/10 px-3 py-2 rounded-lg text-xs text-muted-foreground space-y-1">
                                    <div>• Weekly Treasury (Mon 00:00)</div>
                                    <div>• Daily Quest Reset</div>
                                    <div>• Bot Match Payout (5min)</div>
                                    <div>• Shop Rotation (Weekly)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Connection Arrow */}
                    <div className="flex justify-center">
                        <div className="text-4xl text-green-400">↓</div>
                    </div>

                    {/* Blockchain Layer */}
                    <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-6 rounded-2xl border-2 border-green-500/50">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">⛓️</span>
                            <h4 className="text-lg font-bold text-green-400 font-orbitron">Kaspa Blockchain</h4>
                        </div>
                        
                        <div className="bg-black/40 p-4 rounded-xl border border-green-500/30">
                            <div className="text-green-300 font-semibold mb-3 text-sm">Transaction Layer</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
                                <div className="bg-green-500/10 px-3 py-2 rounded-lg">• Move Transactions (~1s)</div>
                                <div className="bg-green-500/10 px-3 py-2 rounded-lg">• Betting Transactions</div>
                                <div className="bg-green-500/10 px-3 py-2 rounded-lg">• Treasury Payouts</div>
                                <div className="bg-green-500/10 px-3 py-2 rounded-lg">• NFT Inscriptions</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Flow Patterns */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Core Data Flow Patterns</h3>

                {/* Match Flow */}
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6">
                    <h4 className="text-lg font-semibold text-white mb-4 font-orbitron">1. Match Flow (PvP)</h4>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex gap-3">
                            <span className="text-cyber-gold font-mono">①</span>
                            <div>
                                <strong className="text-white">Queue Join:</strong> Player connects wallet → <code className="text-cyan-400">/api/matchmaking/queue</code> validates → Supabase stores queue entry with ELO rating
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyber-gold font-mono">②</span>
                            <div>
                                <strong className="text-white">Matchmaking:</strong> Server matches players by ELO (±200 range). <strong className="text-yellow-400">30-second failover to Smart Bot AI</strong> if no human opponent found
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyber-gold font-mono">③</span>
                            <div>
                                <strong className="text-white">Character Selection:</strong> Ban Phase → Blind Pick → Reveal. <code className="text-purple-400">CharacterSelectScene</code> manages UI, selections saved to <code className="text-cyan-400">matches</code> table
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyber-gold font-mono">④</span>
                            <div>
                                <strong className="text-white">Combat Loop:</strong> Client submits moves via <code className="text-cyan-400">/api/matches/move</code> → Server-side <code className="text-purple-400">CombatEngine</code> resolves turn → Results broadcast via Supabase Realtime → <code className="text-purple-400">FightScene</code> animates
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyber-gold font-mono">⑤</span>
                            <div>
                                <strong className="text-white">Match End:</strong> Winner determined → ELO updated via <code className="text-cyan-400">updateMatchRatings()</code> → Quest progress tracked → Results written to <code className="text-cyan-400">matches</code> table
                            </div>
                        </div>
                    </div>
                </div>

                {/* Betting Flow */}
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6">
                    <h4 className="text-lg font-semibold text-white mb-4 font-orbitron">2. Betting Flow (Spectator Pool & P2P)</h4>
                    
                    <div className="mb-4">
                        <div className="text-purple-300 font-semibold mb-2 text-sm">Spectator Pool Betting (Pooled Odds)</div>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex gap-3">
                                <span className="text-purple-400 font-mono">①</span>
                                <div>
                                    <strong className="text-white">Pool Creation:</strong> Match starts → <code className="text-cyan-400">betting_pools</code> record created with <code className="text-yellow-400">is_open = true</code>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-purple-400 font-mono">②</span>
                                <div>
                                    <strong className="text-white">Place Bet:</strong> Spectator sends KAS to vault → <code className="text-cyan-400">/api/betting/place</code> validates transaction → Bet recorded with <code className="text-yellow-400">tx_id</code> → Pool amounts updated
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-purple-400 font-mono">③</span>
                                <div>
                                    <strong className="text-white">Odds Calculation:</strong> Dynamic odds = <code className="text-cyan-400">Total Pool ÷ Side Pool</code>. Recalculated after each bet. Displayed via <code className="text-purple-400">BettingPanel</code>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-purple-400 font-mono">④</span>
                                <div>
                                    <strong className="text-white">Pool Lock:</strong> Match reaches final round → <code className="text-yellow-400">is_open = false</code> → No more bets accepted
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-purple-400 font-mono">⑤</span>
                                <div>
                                    <strong className="text-white">Payout:</strong> Match ends → <code className="text-cyan-400">/api/betting/payout</code> called → Winners receive <code className="text-yellow-400">(Net Bet × Total Pool) ÷ Winning Pool</code> via vault batch transactions
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-sidebar-border pt-4 mt-4">
                        <div className="text-purple-300 font-semibold mb-2 text-sm">P2P Wagering (Private Rooms with Stakes)</div>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex gap-3">
                                <span className="text-purple-400 font-mono">①</span>
                                <div>
                                    <strong className="text-white">Room Creation:</strong> Player 1 creates private room → Sets stake amount → <code className="text-cyan-400">/api/matchmaking/rooms</code> generates 6-character code → Room stored in <code className="text-cyan-400">matches</code> table with <code className="text-yellow-400">stake_amount</code>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-purple-400 font-mono">②</span>
                                <div>
                                    <strong className="text-white">Room Join:</strong> Player 2 enters room code → System shows stake requirement → 60-second window for both players to send KAS to vault → Transactions validated via <code className="text-yellow-400">player1_stake_tx_id</code> and <code className="text-yellow-400">player2_stake_tx_id</code>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-purple-400 font-mono">③</span>
                                <div>
                                    <strong className="text-white">Stakes Confirmation:</strong> Once both TXs confirmed → <code className="text-yellow-400">stakes_confirmed = true</code> → Character selection begins → Match proceeds normally (no ELO changes for private rooms)
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-purple-400 font-mono">④</span>
                                <div>
                                    <strong className="text-white">Settlement:</strong> Match ends → <code className="text-cyan-400">resolveMatchStakePayout()</code> called → Winner receives <code className="text-yellow-400">(2 × Stake) - 0.1% fee</code> via vault transaction. Loser gets nothing.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bot Match Flow */}
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6">
                    <h4 className="text-lg font-semibold text-white mb-4 font-orbitron">3. Bot Battle Flow (24/7 Automated)</h4>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex gap-3">
                            <span className="text-green-400 font-mono">①</span>
                            <div>
                                <strong className="text-white">Match Simulation:</strong> Server-side <code className="text-purple-400">simulateBotMatch()</code> runs <code className="text-purple-400">CombatEngine</code> with two <code className="text-purple-400">SmartBotOpponent</code> instances → Pre-computes all 27 turns (3 rounds × 9 turns max)
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-green-400 font-mono">②</span>
                            <div>
                                <strong className="text-white">Betting Window:</strong> 30-second countdown before match starts. Fixed 2x odds, 1% house fee. <code className="text-cyan-400">/api/bot-betting/place</code> handles bet placement
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-green-400 font-mono">③</span>
                            <div>
                                <strong className="text-white">Playback:</strong> <code className="text-purple-400">BotBattleScene</code> animates pre-computed turns. Spectators joining mid-match fast-forward to current turn based on elapsed time
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-green-400 font-mono">④</span>
                            <div>
                                <strong className="text-white">Auto-Payout:</strong> Cron job (<code className="text-cyan-400">/api/cron/bot-match-payout</code>) runs every 5 minutes → Detects completed matches → Sends <code className="text-yellow-400">Original Bet × 2</code> to winners via vault
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real-time Synchronization */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Real-Time Synchronization</h3>
                <p>
                    KaspaClash uses <strong>Supabase Realtime</strong> (WebSocket-based pub/sub) for instant state updates across all connected clients. This eliminates polling and ensures sub-100ms latency for game events.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
                    {/* Channels */}
                    <div className="bg-black/40 p-5 rounded-xl border border-sidebar-border">
                        <h4 className="text-white font-semibold mb-3 text-sm">Realtime Channels</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground font-mono">
                            <li><span className="text-cyan-400">matchmaking:queue</span> - Queue updates, player counts</li>
                            <li><span className="text-cyan-400">{'game:{matchId}'}</span> - Match events, round results, move submissions</li>
                            <li><span className="text-cyan-400">{'spectate:{matchId}'}</span> - Spectator view, betting pool updates</li>
                            <li><span className="text-cyan-400">{'progression:{playerAddress}'}</span> - XP gains, tier unlocks, quest progress</li>
                            <li><span className="text-cyan-400">quests:daily</span> - Daily quest refresh notifications</li>
                            <li><span className="text-cyan-400">shop:featured</span> - Weekly rotation updates</li>
                        </ul>
                    </div>

                    {/* Events */}
                    <div className="bg-black/40 p-5 rounded-xl border border-sidebar-border">
                        <h4 className="text-white font-semibold mb-3 text-sm">Broadcast Events</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground font-mono">
                            <li><span className="text-purple-400">move_submitted</span> - Player move confirmation</li>
                            <li><span className="text-purple-400">round_resolved</span> - Combat results with animations</li>
                            <li><span className="text-purple-400">round_starting</span> - Next turn initialization</li>
                            <li><span className="text-purple-400">match_ended</span> - Winner announcement, ELO changes</li>
                            <li><span className="text-purple-400">bet_placed</span> - Pool update, odds recalculation</li>
                            <li><span className="text-purple-400">chat_message</span> - In-game chat delivery</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-yellow-500/10 p-6 rounded-xl border border-yellow-500/30 my-6">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">⚡</div>
                        <div>
                            <div className="font-semibold text-yellow-400 mb-2">HTTP Broadcast Strategy</div>
                            <p className="text-sm text-muted-foreground mb-0">
                                KaspaClash uses <strong>stateless HTTP POST</strong> to Supabase Realtime REST API (<code className="text-cyan-400">/realtime/v1/api/broadcast</code>) instead of maintaining persistent WebSocket connections from serverless functions. This eliminates timeout issues and ensures reliable delivery even in Edge runtime environments.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Game Engine Architecture */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Game Engine Architecture</h3>
                <p>
                    Phaser.js provides the rendering and animation layer. KaspaClash uses a <strong>scene-based architecture</strong> with deterministic combat resolution.
                </p>

                {/* Scenes Table */}
                <div className="overflow-x-auto my-6 not-prose">
                    <table className="w-full border-collapse bg-black/20 rounded-xl overflow-hidden">
                        <thead>
                            <tr className="bg-purple-500/20 border-b border-purple-500/30">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-purple-400">Scene</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-purple-400">Purpose</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-purple-400">Key Features</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-cyan-400">CharacterSelectScene</td>
                                <td className="px-4 py-3 text-muted-foreground">Pre-match fighter selection</td>
                                <td className="px-4 py-3 text-muted-foreground">Ban phase, blind pick, reveal animation</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-cyan-400">FightScene</td>
                                <td className="px-4 py-3 text-muted-foreground">Main battle arena (3485 lines)</td>
                                <td className="px-4 py-3 text-muted-foreground">Server-synced turns, Power Surge cards, animations</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-cyan-400">PracticeScene</td>
                                <td className="px-4 py-3 text-muted-foreground">Offline AI training</td>
                                <td className="px-4 py-3 text-muted-foreground">Local CombatEngine, SmartBotOpponent AI</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-cyan-400">SurvivalScene</td>
                                <td className="px-4 py-3 text-muted-foreground">Endless wave mode</td>
                                <td className="px-4 py-3 text-muted-foreground">Dynamic difficulty scaling, leaderboard tracking</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-cyan-400">ReplayScene</td>
                                <td className="px-4 py-3 text-muted-foreground">Match replay viewer</td>
                                <td className="px-4 py-3 text-muted-foreground">Step-through turns, MP4 export, silent audio capture</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-cyan-400">BotBattleScene</td>
                                <td className="px-4 py-3 text-muted-foreground">Pre-computed bot matches</td>
                                <td className="px-4 py-3 text-muted-foreground">Server-side simulation, mid-match join, tab sync</td>
                            </tr>
                            <tr className="hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-cyan-400">ResultsScene</td>
                                <td className="px-4 py-3 text-muted-foreground">Post-match summary</td>
                                <td className="px-4 py-3 text-muted-foreground">Stats, XP breakdown, share functionality</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Combat Engine */}
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6">
                    <h4 className="text-lg font-semibold text-white mb-4 font-orbitron">Combat Engine</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        The <code className="text-purple-400">CombatEngine</code> class provides <strong>deterministic turn resolution</strong>. Both client and server run identical combat logic to ensure state consistency.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-black/30 p-4 rounded-lg border border-purple-500/30">
                            <div className="text-purple-400 font-semibold mb-2">Core Methods</div>
                            <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                                <li>• <span className="text-white">resolveTurn()</span> - Rock-paper-scissors logic</li>
                                <li>• <span className="text-white">calculateDamage()</span> - Stat-based damage calc</li>
                                <li>• <span className="text-white">applyPowerSurge()</span> - Buff/debuff effects</li>
                                <li>• <span className="text-white">checkRoundEnd()</span> - Win condition detection</li>
                                <li>• <span className="text-white">getState()</span> - Current game state snapshot</li>
                            </ul>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg border border-cyan-500/30">
                            <div className="text-cyan-400 font-semibold mb-2">State Replay Pattern</div>
                            <p className="text-muted-foreground text-xs mb-2">
                                Server-side resolution <strong>replays all previous rounds</strong> to rebuild state:
                            </p>
                            <ol className="space-y-1 text-muted-foreground font-mono text-xs list-decimal list-inside">
                                <li>Fetch all rounds from DB</li>
                                <li>Create fresh CombatEngine</li>
                                <li>Replay rounds 1-N sequentially</li>
                                <li>Apply latest moves to current state</li>
                                <li>Save updated state to <code className="text-cyan-400">fight_state_snapshots</code></li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Smart Bot AI */}
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6">
                    <h4 className="text-lg font-semibold text-white mb-4 font-orbitron">Smart Bot AI</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        <code className="text-purple-400">SmartBotOpponent</code> provides intelligent, adaptive AI using pattern recognition and strategic heuristics.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
                            <div className="text-green-400 font-semibold mb-2">Pattern Detection</div>
                            <ul className="space-y-1 text-muted-foreground">
                                <li>• Tracks last 6 opponent moves</li>
                                <li>• Detects 2-3 move sequences</li>
                                <li>• Counter-picks predicted patterns</li>
                            </ul>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg border border-yellow-500/30">
                            <div className="text-yellow-400 font-semibold mb-2">Strategic Logic</div>
                            <ul className="space-y-1 text-muted-foreground">
                                <li>• Blocks when low health (&lt;30%)</li>
                                <li>• Uses specials at 100 energy</li>
                                <li>• Adapts to stun/vulnerability states</li>
                            </ul>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg border border-blue-500/30">
                            <div className="text-blue-400 font-semibold mb-2">Power Surge Selection</div>
                            <ul className="space-y-1 text-muted-foreground">
                                <li>• Scores cards by game state</li>
                                <li>• Prefers healing when damaged</li>
                                <li>• Picks damage boosts when ahead</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* API Routes Architecture */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">API Routes Architecture</h3>
                <p>
                    All server-side logic runs in <strong>Next.js Edge Functions</strong> deployed on Vercel. Each route follows a consistent pattern: validate → process → broadcast.
                </p>

                {/* API Routes Table */}
                <div className="overflow-x-auto my-6 not-prose">
                    <table className="w-full border-collapse bg-black/20 rounded-xl overflow-hidden text-xs">
                        <thead>
                            <tr className="bg-cyan-500/20 border-b border-cyan-500/30">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-cyan-400">Route</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-cyan-400">Method</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-cyan-400">Purpose</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-white">/api/matchmaking/queue</td>
                                <td className="px-4 py-3 font-mono text-green-400">POST</td>
                                <td className="px-4 py-3 text-muted-foreground">Join/leave matchmaking queue, ELO-based pairing</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-white">/api/matches/create</td>
                                <td className="px-4 py-3 font-mono text-green-400">POST</td>
                                <td className="px-4 py-3 text-muted-foreground">Create new match, initialize combat state</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-white">/api/matches/move</td>
                                <td className="px-4 py-3 font-mono text-green-400">POST</td>
                                <td className="px-4 py-3 text-muted-foreground">Submit player move, trigger resolution when both ready</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-white">/api/betting/place</td>
                                <td className="px-4 py-3 font-mono text-green-400">POST</td>
                                <td className="px-4 py-3 text-muted-foreground">Place bet on match, validate transaction, update pool</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-white">/api/betting/payout/[matchId]</td>
                                <td className="px-4 py-3 font-mono text-green-400">POST</td>
                                <td className="px-4 py-3 text-muted-foreground">Process payouts to winners, batch vault transactions</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-white">/api/progression/award-xp</td>
                                <td className="px-4 py-3 font-mono text-green-400">POST</td>
                                <td className="px-4 py-3 text-muted-foreground">Award XP, check tier unlock, track Battle Pass progress</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-white">/api/quests/daily</td>
                                <td className="px-4 py-3 font-mono text-blue-400">GET</td>
                                <td className="px-4 py-3 text-muted-foreground">Fetch active daily quests, generate if needed</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-white">/api/shop/purchase</td>
                                <td className="px-4 py-3 font-mono text-green-400">POST</td>
                                <td className="px-4 py-3 text-muted-foreground">Process cosmetic purchase, deduct Clash Shards, record NFT</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-white">/api/achievements/unlock</td>
                                <td className="px-4 py-3 font-mono text-green-400">POST</td>
                                <td className="px-4 py-3 text-muted-foreground">Unlock achievement, award rewards, broadcast notification</td>
                            </tr>
                            <tr className="hover:bg-white/5">
                                <td className="px-4 py-3 font-mono text-white">/api/treasury/distributions</td>
                                <td className="px-4 py-3 font-mono text-blue-400">GET</td>
                                <td className="px-4 py-3 text-muted-foreground">Fetch treasury distribution history, payout records</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Blockchain Integration */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Blockchain Integration Patterns</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 not-prose">
                    {/* Client-Side */}
                    <div className="bg-black/40 p-6 rounded-xl border border-green-500/30">
                        <h4 className="text-lg font-bold text-green-400 mb-4 font-orbitron">Client-Side (Kasware)</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">Move Transactions:</strong> 1 KAS self-send with OP_RETURN metadata. Confirms in ~1s. <code className="text-cyan-400">buildMoveTransaction()</code> constructs TX
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">NFT Minting:</strong> Cosmetic purchases trigger 1 KAS to treasury vault with NFT payload. <code className="text-cyan-400">mintCosmeticNFTClient()</code>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">Betting:</strong> Variable KAS amounts to vault address. Validated via <code className="text-cyan-400">tx_id</code> lookup
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Server-Side */}
                    <div className="bg-black/40 p-6 rounded-xl border border-cyan-500/30">
                        <h4 className="text-lg font-bold text-cyan-400 mb-4 font-orbitron">Server-Side (Vault)</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">Payout Service:</strong> Batch transfers from vault using <code className="text-cyan-400">sendBatchFromVault()</code>. Chained UTXOs for reliability
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">Treasury Distribution:</strong> Weekly payouts to top 10 PvP + Survival players. <code className="text-cyan-400">processWeeklyDistribution()</code>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">Transaction Building:</strong> Uses <code className="text-cyan-400">kaspalib</code> for address parsing, <code className="text-cyan-400">Transaction.sign()</code> for signing
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Security & Performance */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Security & Performance Considerations</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 not-prose">
                    {/* Security */}
                    <div className="bg-black/40 p-6 rounded-xl border border-red-500/30">
                        <h4 className="text-lg font-bold text-red-400 mb-4 font-orbitron">Security</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-red-400">🔒</span>
                                <div><strong>Row Level Security (RLS):</strong> All Supabase tables have policies enforcing player-specific access</div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-400">🔒</span>
                                <div><strong>Server-Side Validation:</strong> All game logic runs on server. Client submits intent, server resolves</div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-400">🔒</span>
                                <div><strong>Transaction Verification:</strong> Betting requires valid <code className="text-cyan-400">tx_id</code> from Kaspa blockchain</div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-400">🔒</span>
                                <div><strong>Vault Key Isolation:</strong> Private keys never touch client. Stored in <code className="text-cyan-400">.env</code>, accessed via service role</div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-400">🔒</span>
                                <div><strong>Cron Auth:</strong> <code className="text-cyan-400">withCronAuth()</code> middleware validates <code className="text-cyan-400">CRON_SECRET</code> header</div>
                            </li>
                        </ul>
                    </div>

                    {/* Performance */}
                    <div className="bg-black/40 p-6 rounded-xl border border-blue-500/30">
                        <h4 className="text-lg font-bold text-blue-400 mb-4 font-orbitron">Performance</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">⚡</span>
                                <div><strong>Blockchain Confirmation:</strong> Transactions wait for block confirmation (~1s) before proceeding, ensuring true finality</div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">⚡</span>
                                <div><strong>State Snapshots:</strong> <code className="text-cyan-400">fight_state_snapshots</code> table caches current match state, avoiding full replay</div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">⚡</span>
                                <div><strong>Connection Pooling:</strong> Supabase client reused across requests via singleton pattern</div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">⚡</span>
                                <div><strong>Asset Preloading:</strong> Phaser preloads only characters in current match, not entire roster</div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">⚡</span>
                                <div><strong>Edge Deployment:</strong> Vercel Edge Network ensures &lt;100ms API latency globally</div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Deployment Architecture */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Deployment Architecture</h3>
                <p>
                    KaspaClash uses a <strong>serverless edge deployment</strong> strategy for maximum scalability and minimal operational overhead.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div>
                            <h4 className="text-white font-semibold mb-3">Vercel Platform</h4>
                            <ul className="space-y-2 text-muted-foreground text-xs">
                                <li>• <strong>Edge Runtime:</strong> Global CDN, &lt;50ms cold starts</li>
                                <li>• <strong>Auto-Scaling:</strong> Handles 0→10k requests/sec</li>
                                <li>• <strong>Git Integration:</strong> Deploy on push to <code className="text-cyan-400">main</code></li>
                                <li>• <strong>Environment Variables:</strong> Encrypted secrets management</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-3">Supabase Hosting</h4>
                            <ul className="space-y-2 text-muted-foreground text-xs">
                                <li>• <strong>Managed PostgreSQL:</strong> Automatic backups, read replicas</li>
                                <li>• <strong>Realtime Server:</strong> WebSocket cluster with auto-scaling</li>
                                <li>• <strong>Connection Pooling:</strong> pgBouncer for efficient connection management</li>
                                <li>• <strong>Storage:</strong> S3-compatible blob storage for assets</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-3">Monitoring</h4>
                            <ul className="space-y-2 text-muted-foreground text-xs">
                                <li>• <strong>Vercel Analytics:</strong> Real-time performance metrics</li>
                                <li>• <strong>Supabase Logs:</strong> Query performance, error tracking</li>
                                <li>• <strong>Health Checks:</strong> <code className="text-cyan-400">/api/health</code> endpoint</li>
                                <li>• <strong>Error Reporting:</strong> Structured logging to console</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Development Workflow */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Development Workflow</h3>
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6">
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <div className="flex gap-4">
                            <span className="text-cyber-gold font-bold font-mono">1.</span>
                            <div>
                                <strong className="text-white">Local Development:</strong> <code className="text-cyan-400">npm run dev</code> starts Next.js dev server on <code className="text-cyan-400">localhost:3000</code>. Hot reload for instant feedback.
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-cyber-gold font-bold font-mono">2.</span>
                            <div>
                                <strong className="text-white">Database Migrations:</strong> SQL files in <code className="text-cyan-400">supabase/migrations/</code> executed via Supabase dashboard. Version-controlled schema changes.
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-cyber-gold font-bold font-mono">3.</span>
                            <div>
                                <strong className="text-white">Type Generation:</strong> <code className="text-cyan-400">supabase gen types typescript</code> generates <code className="text-cyan-400">Database</code> types from schema. Ensures type safety.
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-cyber-gold font-bold font-mono">4.</span>
                            <div>
                                <strong className="text-white">Testing:</strong> <code className="text-cyan-400">npm run test</code> runs Vitest unit tests. Critical paths: combat resolution, odds calculation, payout formulas.
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-cyber-gold font-bold font-mono">5.</span>
                            <div>
                                <strong className="text-white">Deployment:</strong> Push to <code className="text-cyan-400">main</code> → Vercel auto-deploys → Preview deployments for PRs.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Notes */}
                <div className="bg-gradient-to-br from-cyber-gold/20 to-cyber-blue/20 p-8 rounded-2xl border border-cyber-gold/50 mt-12">
                    <h3 className="text-2xl text-cyber-gold mb-4 mt-0">Architecture Philosophy</h3>
                    <p className="text-muted-foreground mb-4">
                        KaspaClash prioritizes <strong>developer experience, type safety, and scalability</strong>. The architecture separates concerns clearly: Phaser handles rendering, Next.js handles routing/API, Supabase handles persistence, and Kaspa handles value transfer.
                    </p>
                    <p className="text-muted-foreground mb-0">
                        Every component is designed to be <strong>testable, maintainable, and performant at scale</strong>. The use of TypeScript throughout ensures compile-time safety, while the serverless edge runtime ensures zero-downtime deployments and global performance.
                    </p>
                </div>
            </div>
        </div>
    );
}
