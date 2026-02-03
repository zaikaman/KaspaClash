import React from 'react';

export function GamersMechanics() {
    return (
        <div className="space-y-12">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                {/* Hero */}
                <div className="bg-gradient-to-br from-cyber-gold/10 via-transparent to-blue-500/10 p-8 rounded-xl border border-cyber-gold/30">
                    <h1 className="text-4xl font-bold text-cyber-gold mb-3 font-orbitron">Combat Mechanics</h1>
                    <p className="text-lg text-cyber-gray">
                        KaspaClash is a simultaneous, turn-based fighter where every decision matters. This page documents the
                        exact combat rules, timing, and Power Surge effects used in the live game logic.
                    </p>
                </div>

                {/* Core Combat Loop */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Core Combat Loop</h2>
                    <ol className="list-decimal pl-6 space-y-3 text-muted-foreground">
                        <li>
                            <strong className="text-white">Round start:</strong> A new round begins after the countdown. In PvP, move deadlines are
                            synchronized by the server.
                        </li>
                        <li>
                            <strong className="text-white">Power Surge draft:</strong> You’re offered 3 random cards and must select one within 15 seconds.
                            The chosen surge is confirmed via transaction in PvP and lasts for <strong className="text-white">one round</strong>.
                        </li>
                        <li>
                            <strong className="text-white">Move selection:</strong> Each turn has a 15-second timer. You choose one move—Punch, Kick, Block, or Special.
                        </li>
                        <li>
                            <strong className="text-white">Simultaneous resolution:</strong> Both moves resolve together using the resolution matrix and
                            character modifiers. Damage, guard, stun, and energy effects are applied.
                        </li>
                        <li>
                            <strong className="text-white">Energy regen:</strong> After each turn, energy regenerates based on your character’s stats.
                        </li>
                        <li>
                            <strong className="text-white">Round end:</strong> A round ends when a player’s HP reaches 0. Double KO results in a draw with no round awarded.
                        </li>
                        <li>
                            <strong className="text-white">Match end:</strong> Best-of-3 requires 2 round wins; best-of-5 requires 3 round wins.
                        </li>
                    </ol>
                </section>

                {/* Move Set */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Moves & Base Stats</h2>
                    <div className="not-prose rounded-xl border border-cyber-gold/30 bg-black/20 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                            <div className="text-cyber-gold font-semibold">Move</div>
                            <div className="text-cyber-gold font-semibold">Damage</div>
                            <div className="text-cyber-gold font-semibold">Energy Cost</div>
                            <div className="text-cyber-gold font-semibold">Priority</div>
                            <div className="text-cyber-gold font-semibold">Notes</div>

                            <div className="text-white">Punch</div>
                            <div className="text-white">10</div>
                            <div className="text-white">0</div>
                            <div className="text-white">3</div>
                            <div className="text-muted-foreground">Counters Special</div>

                            <div className="text-white">Kick</div>
                            <div className="text-white">15</div>
                            <div className="text-white">25</div>
                            <div className="text-white">2</div>
                            <div className="text-muted-foreground">Counters Punch</div>

                            <div className="text-white">Block</div>
                            <div className="text-white">0</div>
                            <div className="text-white">0</div>
                            <div className="text-white">4</div>
                            <div className="text-muted-foreground">Counters Kick</div>

                            <div className="text-white">Special</div>
                            <div className="text-white">25</div>
                            <div className="text-white">50 × cost modifier</div>
                            <div className="text-white">1</div>
                            <div className="text-muted-foreground">Counters Block</div>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                        Special cost varies by character via a <strong className="text-white">special cost modifier</strong> (typically 0.85–1.30).
                    </p>
                </section>

                {/* Resolution Matrix */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Resolution Matrix</h2>
                    <p>
                        Combat resolves using a deterministic matrix:
                        <strong className="text-white"> Punch &gt; Special, Kick &gt; Punch, Block &gt; Kick, Special &gt; Block</strong>.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li><strong className="text-white">Punch vs Special:</strong> Punch lands; Special is stunned and deals no damage.</li>
                        <li><strong className="text-white">Kick vs Punch:</strong> Kick lands; Punch is staggered.</li>
                        <li><strong className="text-white">Block vs Kick:</strong> Kick is reflected; attacker takes 30% of kick damage.</li>
                        <li><strong className="text-white">Special vs Block:</strong> Block is shattered; damage is amplified by 1.5×.</li>
                        <li><strong className="text-white">Block vs Punch:</strong> Damage is reduced based on the defender’s block effectiveness.</li>
                    </ul>
                </section>

                {/* Guard & Status */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Guard & Status Effects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                        <div className="bg-black/20 p-6 rounded-xl border border-cyber-gold/30">
                            <h3 className="text-lg font-bold text-white font-orbitron mb-2">🛡️ Guard Meter</h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>Block adds <strong className="text-white">+25 guard</strong>.</li>
                                <li>If your block is hit, add an extra <strong className="text-white">+15 guard</strong>.</li>
                                <li>At <strong className="text-white">100 guard</strong>, your guard breaks and the meter resets.</li>
                                <li>Block damage reduction is based on your character’s <strong className="text-white">block effectiveness</strong> (0.25–0.85).</li>
                            </ul>
                        </div>
                        <div className="bg-black/20 p-6 rounded-xl border border-cyber-blue/30">
                            <h3 className="text-lg font-bold text-white font-orbitron mb-2">⚠️ Status Effects</h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li><strong className="text-white">Stun:</strong> You lose your next action (e.g., Special interrupted by Punch).</li>
                                <li><strong className="text-white">Stagger:</strong> Your next turn deals <strong className="text-white">50% damage</strong>.</li>
                                <li><strong className="text-white">Guard Break:</strong> Triggered by shatter or max guard; meter resets to 0.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Energy & Character Stats */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Energy & Character Stats</h2>
                    <p>
                        Energy is required for Kick and Special. Each character has unique HP, max energy, regen speed, and damage modifiers.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li><strong className="text-white">Energy regen:</strong> 15–25 per turn depending on character.</li>
                        <li><strong className="text-white">Max energy:</strong> Ranges by archetype and character.</li>
                        <li><strong className="text-white">Special cost:</strong> Base 50 × special cost modifier (0.85–1.30).</li>
                        <li><strong className="text-white">Damage modifiers:</strong> Each move type has a per-character multiplier.</li>
                    </ul>
                </section>

                {/* Archetype Counter System */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Archetype Counter System</h2>
                    <p>
                        Characters belong to one of four archetypes. If you counter your opponent’s archetype, your damage is
                        increased by <strong className="text-white">20% (1.2×)</strong> on all successful hits.
                    </p>
                    <div className="not-prose grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-black/20 p-4 rounded-lg border border-cyber-gold/30 text-center">
                            <p className="text-white font-bold">Speed</p>
                            <p className="text-muted-foreground text-sm">Counters Tech</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-lg border border-cyber-gold/30 text-center">
                            <p className="text-white font-bold">Tech</p>
                            <p className="text-muted-foreground text-sm">Counters Tank</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-lg border border-cyber-gold/30 text-center">
                            <p className="text-white font-bold">Tank</p>
                            <p className="text-muted-foreground text-sm">Counters Precision</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-lg border border-cyber-gold/30 text-center">
                            <p className="text-white font-bold">Precision</p>
                            <p className="text-muted-foreground text-sm">Counters Speed</p>
                        </div>
                    </div>
                </section>

                {/* Power Surges */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Power Surge System (15 Cards)</h2>
                    <p>
                        At the start of each round, you draft one of three random Power Surge cards. The effect lasts for that round only.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                        <div className="bg-black/20 p-5 rounded-xl border border-emerald-500/30">
                            <h3 className="text-base font-bold text-emerald-300 mb-3">Offense & Burst</h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li><strong className="text-white">DAG Overclock:</strong> +40% damage dealt.</li>
                                <li><strong className="text-white">Pruned Rage:</strong> +30% damage, opponent can’t block.</li>
                                <li><strong className="text-white">Finality Fist:</strong> Special +70% damage, costs +24 energy.</li>
                                <li><strong className="text-white">Chainbreaker:</strong> Bypass block, +15% damage.</li>
                                <li><strong className="text-white">Orphan Smasher:</strong> Counter hits deal +75% damage.</li>
                            </ul>
                        </div>
                        <div className="bg-black/20 p-5 rounded-xl border border-blue-500/30">
                            <h3 className="text-base font-bold text-blue-300 mb-3">Defense & Control</h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li><strong className="text-white">Sompi Shield:</strong> Take 45% less damage.</li>
                                <li><strong className="text-white">Block Fortress:</strong> Blocks reflect 120% damage.</li>
                                <li><strong className="text-white">Hash Hurricane:</strong> 35% chance to dodge attack.</li>
                                <li><strong className="text-white">Mempool Congest:</strong> Stun opponent (costs 6 HP).</li>
                                <li><strong className="text-white">Blue Set Heal:</strong> Restore 10 HP over time.</li>
                            </ul>
                        </div>
                        <div className="bg-black/20 p-5 rounded-xl border border-purple-500/30">
                            <h3 className="text-base font-bold text-purple-300 mb-3">Energy & Tempo</h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li><strong className="text-white">10BPS Barrage:</strong> +20 energy regen on kick or punch.</li>
                                <li><strong className="text-white">Tx Storm:</strong> +25 energy, lose 4 HP.</li>
                                <li><strong className="text-white">Vaultbreaker:</strong> Steal 50 energy on hit.</li>
                                <li><strong className="text-white">GhostDAG:</strong> Opponent loses 30 energy every turn.</li>
                                <li><strong className="text-white">BPS Syphon:</strong> Heal for 35% of damage dealt.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Blockchain Timing */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Blockchain Timing & Fairness</h2>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li><strong className="text-white">Move privacy:</strong> Moves are submitted without revealing the choice until both players lock in.</li>
                        <li><strong className="text-white">On-chain confirmation:</strong> In PvP, moves and surge selections are verified through Kaspa transactions.</li>
                        <li><strong className="text-white">Server deadlines:</strong> All players share the same move deadline timestamp to ensure fairness.</li>
                        <li><strong className="text-white">Practice mode:</strong> Local/off-chain resolution with identical combat rules.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
