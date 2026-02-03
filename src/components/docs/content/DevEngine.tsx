import React from 'react';

export function DevEngine() {
    return (
        <div className="space-y-8">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                
                {/* Hero */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 rounded-2xl border border-purple-500/30 mb-8">
                    <h2 className="text-3xl text-cyber-gold mb-4 mt-0">Phaser Game Engine</h2>
                    <p className="text-lg mb-0">
                        KaspaClash uses <strong>Phaser 3.88</strong> as its HTML5 game engine, handling all combat rendering, animations, and visual effects. This guide covers the complete architecture—from React integration to scene lifecycle, sprite management, combat resolution, and audio systems.
                    </p>
                </div>

                {/* Core Architecture */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Core Architecture</h3>
                <p>
                    The Phaser engine operates independently from React while maintaining bidirectional communication through the <code className="text-cyan-400">EventBus</code>. This architecture enables smooth 60fps gameplay while allowing React to control game state and UI overlays.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-cyan-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Game Canvas</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Resolution:</strong> 1280×720 (16:9)</li>
                            <li>• <strong className="text-white">Rendering:</strong> WebGL with Canvas fallback</li>
                            <li>• <strong className="text-white">FPS Target:</strong> 60fps locked</li>
                            <li>• <strong className="text-white">Scale Mode:</strong> FIT with auto-center</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Performance</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Power:</strong> high-performance GPU</li>
                            <li>• <strong className="text-white">Batching:</strong> 4096 sprites/batch</li>
                            <li>• <strong className="text-white">Parallel Loads:</strong> 32 max downloads</li>
                            <li>• <strong className="text-white">Physics:</strong> Disabled (turn-based)</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-pink-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">SSR Compatibility</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Dynamic Import:</strong> Client-side only</li>
                            <li>• <strong className="text-white">Event System:</strong> SSR-safe emitter</li>
                            <li>• <strong className="text-white">Hydration:</strong> No mismatches</li>
                            <li>• <strong className="text-white">Framework:</strong> Next.js 16 compatible</li>
                        </ul>
                    </div>
                </div>

                {/* React Integration */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">React ↔ Phaser Integration</h3>
                <p>
                    The <code className="text-cyan-400">PhaserGame.tsx</code> component wraps the Phaser instance, handling dynamic loading, lifecycle management, and state synchronization.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Component Lifecycle</div>
                    
                    <div className="space-y-4 text-xs">
                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-blue-500/20 px-3 py-1 rounded border border-blue-500/30 text-blue-400 text-center">
                                    Mount
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">1. Dynamic Phaser Import</div>
                                <div>Loads Phaser library client-side (avoids SSR errors)</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-green-500/20 px-3 py-1 rounded border border-green-500/30 text-green-400 text-center">
                                    Initialize
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">2. Game Instance Creation</div>
                                <div>Creates <code className="text-cyan-400">new Phaser.Game(config)</code> with optimized settings</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-purple-500/20 px-3 py-1 rounded border border-purple-500/30 text-purple-400 text-center">
                                    Scene Add
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">3. Register All Scenes</div>
                                <div>Adds all 7 scenes to SceneManager (none auto-start)</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-cyan-500/20 px-3 py-1 rounded border border-cyan-500/30 text-cyan-400 text-center">
                                    Scene Start
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">4. Launch Initial Scene</div>
                                <div>Starts <code className="text-cyan-400">currentScene</code> with <code className="text-cyan-400">sceneConfig</code> data</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-orange-500/20 px-3 py-1 rounded border border-orange-500/30 text-orange-400 text-center">
                                    EventBus
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">5. Attach Listeners</div>
                                <div>Subscribes to <code className="text-cyan-400">scene:ready</code> and <code className="text-cyan-400">scene:change</code> events</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-red-500/20 px-3 py-1 rounded border border-red-500/30 text-red-400 text-center">
                                    Cleanup
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">6. Destroy on Unmount</div>
                                <div>Calls <code className="text-cyan-400">game.destroy(true)</code>, removes EventBus listeners</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">EventBus Communication</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                            <div className="text-cyan-400 font-semibold mb-2">React → Phaser</div>
                            <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• <code className="text-green-400">game:submitMove</code> - Player selected move</li>
                                <li>• <code className="text-green-400">game:roundStarting</code> - Server round start</li>
                                <li>• <code className="text-green-400">game:roundResolved</code> - Combat results</li>
                                <li>• <code className="text-green-400">game:matchEnded</code> - Match finished</li>
                                <li>• <code className="text-green-400">game:chatMessage</code> - Incoming chat</li>
                                <li>• <code className="text-green-400">game:stickerMessage</code> - Sticker display</li>
                            </ul>
                        </div>
                        <div>
                            <div className="text-purple-400 font-semibold mb-2">Phaser → React</div>
                            <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• <code className="text-orange-400">move:selected</code> - Move button clicked</li>
                                <li>• <code className="text-orange-400">request-surrender</code> - Forfeit button</li>
                                <li>• <code className="text-orange-400">game:sendChat</code> - Send chat message</li>
                                <li>• <code className="text-orange-400">game:sendSticker</code> - Send sticker</li>
                                <li>• <code className="text-orange-400">scene:ready</code> - Scene loaded</li>
                                <li>• <code className="text-orange-400">animation:complete</code> - Animation done</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Scene System */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Scene Architecture</h3>
                <p>
                    KaspaClash implements a <strong>scene-based architecture</strong> with 7 distinct scenes for different game modes and states. Each scene follows the Phaser lifecycle: <code className="text-cyan-400">init()</code> → <code className="text-cyan-400">preload()</code> → <code className="text-cyan-400">create()</code> → <code className="text-cyan-400">update()</code>.
                </p>

                <div className="overflow-x-auto my-6 not-prose">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-cyber-gold/30">
                                <th className="text-left p-3 text-white font-semibold">Scene</th>
                                <th className="text-left p-3 text-white font-semibold">Purpose</th>
                                <th className="text-left p-3 text-white font-semibold">Network</th>
                                <th className="text-left p-3 text-white font-semibold">Key Features</th>
                            </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                            <tr className="border-b border-white/10 bg-cyan-500/5">
                                <td className="p-3">
                                    <code className="text-cyan-400">CharacterSelectScene</code>
                                </td>
                                <td className="p-3">Pre-match character selection with ban phase</td>
                                <td className="p-3"><span className="text-green-400">✓ Online</span></td>
                                <td className="p-3">2-phase (ban/pick), 10×2 grid, timer sync, bot support</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3">
                                    <code className="text-cyan-400">FightScene</code>
                                </td>
                                <td className="p-3">Main 1v1 PvP combat arena</td>
                                <td className="p-3"><span className="text-green-400">✓ Online</span></td>
                                <td className="p-3">Server-synced state, Power Surge cards, chat, spectator mode, reconnection</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-purple-500/5">
                                <td className="p-3">
                                    <code className="text-cyan-400">PracticeScene</code>
                                </td>
                                <td className="p-3">Offline AI battles (mirrors FightScene)</td>
                                <td className="p-3"><span className="text-orange-400">✗ Offline</span></td>
                                <td className="p-3">Local SmartBot AI, precomputed Power Surge decks, instant response</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3">
                                    <code className="text-cyan-400">SurvivalScene</code>
                                </td>
                                <td className="p-3">20-wave AI gauntlet with progression</td>
                                <td className="p-3"><span className="text-orange-400">✗ Offline</span></td>
                                <td className="p-3">Wave system, health carry-over, tier scaling, shard rewards</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-blue-500/5">
                                <td className="p-3">
                                    <code className="text-cyan-400">BotBattleScene</code>
                                </td>
                                <td className="p-3">Watch bot vs bot simulations</td>
                                <td className="p-3"><span className="text-orange-400">✗ Offline</span></td>
                                <td className="p-3">Automated combat, spectator-only, auto-advance rounds</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3">
                                    <code className="text-cyan-400">ReplayScene</code>
                                </td>
                                <td className="p-3">Playback recorded matches</td>
                                <td className="p-3"><span className="text-orange-400">✗ Offline</span></td>
                                <td className="p-3">JSON move log replay, pause/resume, speed controls</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-pink-500/5">
                                <td className="p-3">
                                    <code className="text-cyan-400">ResultsScene</code>
                                </td>
                                <td className="p-3">Post-match results screen</td>
                                <td className="p-3"><span className="text-blue-400">~ Hybrid</span></td>
                                <td className="p-3">Stats display, ELO changes, rewards breakdown</td>
                            </tr>
                            <tr className="bg-yellow-500/5">
                                <td className="p-3">
                                    <code className="text-cyan-400">FakeScene</code>
                                </td>
                                <td className="p-3">Testing/development scene</td>
                                <td className="p-3"><span className="text-orange-400">✗ Offline</span></td>
                                <td className="p-3">Sprite testing, animation preview, dev tools</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Combat Engine */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Combat Engine</h3>
                <p>
                    The <code className="text-cyan-400">CombatEngine</code> is the core game logic system, handling turn-based combat resolution with character stats, move priority, and damage calculation. It operates <strong>deterministically</strong>—identical inputs always produce identical outputs.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-green-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Move System</h4>
                        <div className="space-y-3 text-xs text-muted-foreground">
                            <div>
                                <div className="text-green-400 font-semibold mb-1">Punch</div>
                                <div>• Base Damage: 20 | Energy Cost: 5 | Priority: 3</div>
                                <div className="text-white/60">Fast, reliable damage dealer</div>
                            </div>
                            <div>
                                <div className="text-blue-400 font-semibold mb-1">Kick</div>
                                <div>• Base Damage: 30 | Energy Cost: 10 | Priority: 2</div>
                                <div className="text-white/60">Higher damage, slower execution</div>
                            </div>
                            <div>
                                <div className="text-cyan-400 font-semibold mb-1">Block</div>
                                <div>• Damage Reduction: 40-85% | Energy Cost: 5 | Priority: 5</div>
                                <div className="text-white/60">Defensive stance, builds guard meter</div>
                            </div>
                            <div>
                                <div className="text-purple-400 font-semibold mb-1">Special</div>
                                <div>• Base Damage: 50 | Energy Cost: 40-60 | Priority: 1</div>
                                <div className="text-white/60">Powerful finisher, character-dependent cost</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Character Stats</h4>
                        <div className="space-y-3 text-xs text-muted-foreground">
                            <div>
                                <div className="text-white mb-1"><strong>Archetypes:</strong></div>
                                <div>• <span className="text-red-400">Tank</span> - High HP, low energy (Heavy Loader: 135 HP)</div>
                                <div>• <span className="text-cyan-400">Speed</span> - Fast regen, glass cannon (Neon Wraith: 92 HP, 120 energy)</div>
                                <div>• <span className="text-yellow-400">Tech</span> - Balanced stats (Cyber Paladin: 110 HP)</div>
                                <div>• <span className="text-green-400">Bruiser</span> - Damage focus (Gene Smasher: high damage mods)</div>
                            </div>
                            <div>
                                <div className="text-white mb-1"><strong>Modifiers:</strong></div>
                                <div>• Damage multipliers per move type (0.8× - 1.5×)</div>
                                <div>• Block effectiveness (25% - 85% reduction)</div>
                                <div>• Special cost modifier (0.9× - 1.3×)</div>
                                <div>• Energy regen per turn (15 - 25)</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Turn Resolution Algorithm</div>
                    
                    <div className="space-y-3 text-xs">
                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-cyber-gold/20 flex items-center justify-center text-cyber-gold font-bold flex-shrink-0">1</div>
                            <div className="flex-1">
                                <div className="text-white mb-1">Validate Moves</div>
                                <div className="text-muted-foreground">Check energy costs, apply stun states (stunned = auto-skip)</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-cyber-gold/20 flex items-center justify-center text-cyber-gold font-bold flex-shrink-0">2</div>
                            <div className="flex-1">
                                <div className="text-white mb-1">Calculate Surge Effects</div>
                                <div className="text-muted-foreground">Apply Power Surge modifiers (damage multipliers, buffs, debuffs)</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-cyber-gold/20 flex items-center justify-center text-cyber-gold font-bold flex-shrink-0">3</div>
                            <div className="flex-1">
                                <div className="text-white mb-1">Determine Priority</div>
                                <div className="text-muted-foreground">Higher priority acts first (Block=5, Punch=3, Kick=2, Special=1)</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-cyber-gold/20 flex items-center justify-center text-cyber-gold font-bold flex-shrink-0">4</div>
                            <div className="flex-1">
                                <div className="text-white mb-1">Resolve Damage</div>
                                <div className="text-muted-foreground">Apply damage with character modifiers, block reduction, critical hits</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-cyber-gold/20 flex items-center justify-center text-cyber-gold font-bold flex-shrink-0">5</div>
                            <div className="flex-1">
                                <div className="text-white mb-1">Update Resources</div>
                                <div className="text-muted-foreground">Deduct energy, apply regen, update guard meters, check HP thresholds</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-cyber-gold/20 flex items-center justify-center text-cyber-gold font-bold flex-shrink-0">6</div>
                            <div className="flex-1">
                                <div className="text-white mb-1">Check Win Conditions</div>
                                <div className="text-muted-foreground">HP ≤ 0 = round loss, 3 rounds won = match victory</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Power Surge System */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Power Surge Cards</h3>
                <p>
                    Every 3 turns, players select a <strong>Power Surge card</strong> that modifies combat for the entire round. All 15 cards are balanced and have strategic situational value.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-cyan-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Card List (15 Total)</h4>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                            <li>• <strong className="text-green-400">DAG Overclock:</strong> +40% damage dealt</li>
                            <li>• <strong className="text-cyan-400">Block Fortress:</strong> Blocks reflect 120% damage</li>
                            <li>• <strong className="text-yellow-400">Tx Storm:</strong> +25 energy, lose 4 HP</li>
                            <li>• <strong className="text-red-400">Mempool Congest:</strong> Stun opponent (costs 6 HP)</li>
                            <li>• <strong className="text-blue-400">Blue Set Heal:</strong> Restore 10 HP over time</li>
                            <li>• <strong className="text-pink-400">Orphan Smasher:</strong> Counter deals +75% damage</li>
                            <li>• <strong className="text-green-400">10BPS Barrage:</strong> +20 energy regen on kick/punch</li>
                            <li>• <strong className="text-red-400">Pruned Rage:</strong> +30% damage, opponent can't block</li>
                            <li>• <strong className="text-yellow-400">Sompi Shield:</strong> Take 45% less damage</li>
                            <li>• <strong className="text-purple-400">Hash Hurricane:</strong> 35% chance to dodge attack</li>
                            <li>• <strong className="text-gray-400">GhostDAG:</strong> Opponent loses 30 energy every turn</li>
                            <li>• <strong className="text-purple-400">Finality Fist:</strong> Special +70% dmg, costs +24 energy</li>
                            <li>• <strong className="text-green-400">BPS Syphon:</strong> Heal for 35% of damage dealt</li>
                            <li>• <strong className="text-orange-400">Vaultbreaker:</strong> Steal 50 energy on hit</li>
                            <li>• <strong className="text-red-400">Chainbreaker:</strong> Bypass block, +15% damage</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Card Balance</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Equal Power:</strong> All cards are balanced and equal in strength</li>
                            <li>• <strong className="text-white">No Tiers:</strong> No rarity system - every card has strategic value</li>
                            <li>• <strong className="text-white">Random Selection:</strong> 3 cards offered randomly each surge round</li>
                            <li>• <strong className="text-white">Situational:</strong> Best card depends on match state, not inherent power</li>
                            <li>• <strong className="text-white">Counter Play:</strong> Different effects counter different strategies</li>
                            <li>• <strong className="text-white">Trade-offs:</strong> Some cards have HP costs for powerful effects</li>
                        </ul>
                    </div>
                </div>

                {/* Asset Loading */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Asset Loading & Optimization</h3>
                <p>
                    KaspaClash implements <strong>on-demand asset loading</strong> to minimize initial bundle size and load times. Character sprites use custom frame dimensions with 6×6 grid spritesheets.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Loading Strategy</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div>
                            <div className="text-cyan-400 font-semibold mb-2">Character Assets</div>
                            <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• <strong className="text-white">Spritesheets:</strong> 7 per character (idle, run, punch, kick, block, special, dead)</li>
                                <li>• <strong className="text-white">Frame Layout:</strong> 6×6 grid (36 frames), variable dimensions per character</li>
                                <li>• <strong className="text-white">Loading:</strong> Only match participants (2 characters vs 20 total)</li>
                                <li>• <strong className="text-white">Animation:</strong> 24fps, loops for idle/run, one-shot for attacks</li>
                                <li>• <strong className="text-white">Portraits:</strong> WebP → SVG → PNG → idle.png fallback chain</li>
                            </ul>
                        </div>
                        <div>
                            <div className="text-purple-400 font-semibold mb-2">Audio Assets</div>
                            <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• <strong className="text-white">BGM:</strong> Menu, Fight, Practice (looped, 0.3 volume default)</li>
                                <li>• <strong className="text-white">SFX:</strong> Punch, kick, block, special (character-specific)</li>
                                <li>• <strong className="text-white">UI Sounds:</strong> Hover, click, countdown, victory/defeat</li>
                                <li>• <strong className="text-white">Format:</strong> MP3 (universal browser support)</li>
                                <li>• <strong className="text-white">Behavior:</strong> <code className="text-cyan-400">pauseOnBlur: false</code> keeps music playing</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Sprite Configuration Example</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-purple-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`// src/game/config/sprite-config.ts
export const CHAR_SPRITE_CONFIG = {
  "cyber-ninja": {
    "idle": { frameWidth: 232, frameHeight: 450 },
    "punch": { frameWidth: 269, frameHeight: 260 },
    "kick": { frameWidth: 345, frameHeight: 305 },
    "special": { frameWidth: 525, frameHeight: 426 },
    // ... 3 more animations
  },
  // ... 19 more characters
};

// Auto-calculates scale to fit 200px height
export function getCharacterScale(charId: string): number {
  const config = CHAR_SPRITE_CONFIG[charId]["idle"];
  return 200 / config.frameHeight;
}`}
                    </pre>
                </div>

                {/* Animation System */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Animation & VFX System</h3>
                <p>
                    Animations are choreographed using Phaser's tween system, with precise timing for attack sequences, hurt reactions, and visual feedback.
                </p>

                <div className="grid grid-cols-1 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-orange-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Combat Animation Sequence</h4>
                        <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                                <div className="w-16 text-cyan-400">0ms</div>
                                <div className="flex-1">
                                    <div className="text-white">Phase 1: Run Forward</div>
                                    <div>Both characters play run animation, move toward center (600ms duration)</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-16 text-green-400">+600ms</div>
                                <div className="flex-1">
                                    <div className="text-white">Phase 2: Player 1 Attack</div>
                                    <div>P1 plays attack animation (punch/kick/block/special), SFX plays with character-specific delays</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-16 text-yellow-400">+900ms</div>
                                <div className="flex-1">
                                    <div className="text-white">Damage Display</div>
                                    <div>Floating damage number appears above target, target sprite flickers (alpha 0.5 → 1 × 3 repeats)</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-16 text-orange-400">+1200ms</div>
                                <div className="flex-1">
                                    <div className="text-white">Energy/HP Effects</div>
                                    <div>Show energy drain (-X EN) or HP regen (+X HP) from Power Surge effects</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-16 text-purple-400">+1800ms</div>
                                <div className="flex-1">
                                    <div className="text-white">Phase 3: Player 2 Attack</div>
                                    <div>P2 plays attack animation, repeat damage/effect display (unless both block = concurrent)</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-16 text-pink-400">+3000ms</div>
                                <div className="flex-1">
                                    <div className="text-white">Phase 4: Return</div>
                                    <div>Both characters play run animation backward, move to original positions (600ms)</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-16 text-blue-400">+3600ms</div>
                                <div className="flex-1">
                                    <div className="text-white">Back to Idle</div>
                                    <div>Health/energy bars sync, narrative text displays turn summary, return to idle loop</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-pink-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Visual Effects</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Camera Shake:</strong> Intensity 5-15 based on damage dealt</li>
                            <li>• <strong className="text-white">Flash Effects:</strong> Red tint on hit, white flash on block</li>
                            <li>• <strong className="text-white">Damage Numbers:</strong> Float upward with fade-out tween (color-coded: white/yellow/red)</li>
                            <li>• <strong className="text-white">Particle Effects:</strong> Slash trails for specials, block sparks, energy aura</li>
                            <li>• <strong className="text-white">Stun Indicator:</strong> Spinning stars above character head with tween loop</li>
                            <li>• <strong className="text-white">Victory/Defeat:</strong> Slow-motion final blow, winner poses, loser collapses</li>
                        </ul>
                    </div>
                </div>

                {/* UI Components */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Phaser UI Components</h3>
                <p>
                    All in-game UI is built with Phaser's native graphics/text objects for consistency with the canvas rendering pipeline.
                </p>

                <div className="overflow-x-auto my-6 not-prose">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-cyber-gold/30">
                                <th className="text-left p-3 text-white font-semibold">Component</th>
                                <th className="text-left p-3 text-white font-semibold">File</th>
                                <th className="text-left p-3 text-white font-semibold">Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                            <tr className="border-b border-white/10 bg-cyan-500/5">
                                <td className="p-3"><code className="text-cyan-400">HealthBar</code></td>
                                <td className="p-3">ui/HealthBar.ts</td>
                                <td className="p-3">Gradient health bar with smooth lerp animation</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">MoveButton</code></td>
                                <td className="p-3">ui/MoveButton.ts</td>
                                <td className="p-3">Interactive move selection with hover/click states, energy cost display</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-purple-500/5">
                                <td className="p-3"><code className="text-cyan-400">PowerSurgeCards</code></td>
                                <td className="p-3">ui/PowerSurgeCards.ts</td>
                                <td className="p-3">3-card selection UI with glassmorphic design, timer, rarity glow</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">ChatPanel</code></td>
                                <td className="p-3">ui/ChatPanel.ts</td>
                                <td className="p-3">In-game chat with scroll, message history, input field</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-pink-500/5">
                                <td className="p-3"><code className="text-cyan-400">StickerPicker</code></td>
                                <td className="p-3">ui/StickerPicker.ts</td>
                                <td className="p-3">Emoji/sticker display above characters with float animation</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">SelectionTimer</code></td>
                                <td className="p-3">ui/SelectionTimer.ts</td>
                                <td className="p-3">Circular countdown timer with red pulse warning</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-blue-500/5">
                                <td className="p-3"><code className="text-cyan-400">CharacterCard</code></td>
                                <td className="p-3">ui/CharacterCard.ts</td>
                                <td className="p-3">Character selection card with portrait, name, stats overlay</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">StatsOverlay</code></td>
                                <td className="p-3">ui/StatsOverlay.ts</td>
                                <td className="p-3">Character stat comparison panel (HP, energy, archetypes)</td>
                            </tr>
                            <tr className="bg-green-500/5">
                                <td className="p-3"><code className="text-cyan-400">TransactionToast</code></td>
                                <td className="p-3">ui/TransactionToast.ts</td>
                                <td className="p-3">Blockchain transaction confirmation with fade-out</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Development */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Development Workflow</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-cyan-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Adding a New Character</h4>
                        <ol className="space-y-2 text-xs text-muted-foreground ml-4">
                            <li>1. Add 7 spritesheets to <code className="text-cyan-400">public/characters/{'{'}id{'}'}/</code></li>
                            <li>2. Calculate frame dimensions (6×6 grid) and add to <code className="text-cyan-400">sprite-config.ts</code></li>
                            <li>3. Define combat stats in <code className="text-cyan-400">combat/CharacterStats.ts</code></li>
                            <li>4. Add character data to <code className="text-cyan-400">data/characters.ts</code></li>
                            <li>5. Test in <code className="text-cyan-400">FakeScene</code> for animation preview</li>
                        </ol>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Creating a New Scene</h4>
                        <ol className="space-y-2 text-xs text-muted-foreground ml-4">
                            <li>1. Extend <code className="text-cyan-400">Phaser.Scene</code> in <code className="text-cyan-400">src/game/scenes/</code></li>
                            <li>2. Implement lifecycle: <code className="text-cyan-400">init()</code>, <code className="text-cyan-400">preload()</code>, <code className="text-cyan-400">create()</code>, <code className="text-cyan-400">update()</code></li>
                            <li>3. Register in <code className="text-cyan-400">PhaserGame.tsx</code> with <code className="text-cyan-400">game.scene.add()</code></li>
                            <li>4. Emit <code className="text-cyan-400">scene:ready</code> event in <code className="text-cyan-400">create()</code></li>
                            <li>5. Handle cleanup in <code className="text-cyan-400">shutdown()</code> lifecycle hook</li>
                        </ol>
                    </div>
                </div>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Testing & Debugging</div>
                    
                    <div className="space-y-3 text-xs">
                        <div>
                            <div className="text-cyan-400 mb-1">Phaser DevTools</div>
                            <div className="text-muted-foreground">
                                Enable scene inspector in browser console: <code className="text-green-400">window.__PHASER_GAME__.scene.scenes[0]</code>
                            </div>
                        </div>
                        
                        <div>
                            <div className="text-purple-400 mb-1">FakeScene Testing</div>
                            <div className="text-muted-foreground">
                                Visit <code className="text-green-400">/fake</code> route to test character sprites, animations, and VFX without full match setup
                            </div>
                        </div>
                        
                        <div>
                            <div className="text-orange-400 mb-1">EventBus Monitoring</div>
                            <div className="text-muted-foreground">
                                All events logged to console in development mode. Use browser network tab to inspect Supabase Realtime messages
                            </div>
                        </div>
                        
                        <div>
                            <div className="text-pink-400 mb-1">Performance Profiling</div>
                            <div className="text-muted-foreground">
                                Enable FPS counter: <code className="text-green-400">game.config.fps.target</code>. Check render stats: <code className="text-green-400">game.renderer.info</code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Best Practices */}
                <div className="bg-gradient-to-br from-cyber-gold/20 to-cyber-blue/20 p-8 rounded-2xl border border-cyber-gold/50 mt-12">
                    <h3 className="text-2xl text-cyber-gold mb-4 mt-0">Best Practices</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <div className="text-green-400 font-semibold mb-2">✓ Do This</div>
                            <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• Use EventBus for React ↔ Phaser communication</li>
                                <li>• Preload only assets needed for current scene</li>
                                <li>• Destroy tweens/timers in scene shutdown()</li>
                                <li>• Keep game logic in CombatEngine, not scenes</li>
                                <li>• Use Phaser's object pooling for particles</li>
                                <li>• Test animations in FakeScene first</li>
                                <li>• Leverage SSR-safe dynamic imports</li>
                            </ul>
                        </div>
                        <div>
                            <div className="text-red-400 font-semibold mb-2">✗ Avoid This</div>
                            <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• Don't call Phaser methods in React render()</li>
                                <li>• Don't use physics system (unnecessary overhead)</li>
                                <li>• Don't hardcode positions (use config constants)</li>
                                <li>• Don't forget to unsubscribe EventBus listeners</li>
                                <li>• Don't load all 20 characters upfront</li>
                                <li>• Don't mix DOM and Phaser UI (z-index conflicts)</li>
                                <li>• Don't mutate CombatEngine state directly</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
