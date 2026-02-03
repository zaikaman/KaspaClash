import React from 'react';

export function GamersQuests() {
    return (
        <div className="space-y-12">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                {/* Hero */}
                <div className="bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 p-8 rounded-xl border border-emerald-500/30">
                    <h1 className="text-4xl font-bold text-cyber-gold mb-3 font-orbitron">Daily Quests</h1>
                    <p className="text-lg text-cyber-gray">
                        Complete daily objectives to earn XP and Clash Shards. Every day you receive 3 fresh quests across 
                        three difficulty tiers. Build streaks, unlock rewards, and accelerate your Battle Pass progression.
                    </p>
                </div>

                {/* How It Works */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">How Quests Work</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                        <div className="bg-black/20 p-6 rounded-xl border border-kaspa/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">📅 Daily Reset</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">00:00 UTC</strong> - new quests assigned daily</li>
                                <li>• <strong className="text-white">3 quests per day</strong> - one Easy, one Medium, one Hard</li>
                                <li>• <strong className="text-white">24-hour window</strong> - complete before reset or lose access</li>
                                <li>• <strong className="text-white">Auto-generated</strong> - varied objectives each day</li>
                            </ul>
                        </div>
                        <div className="bg-black/20 p-6 rounded-xl border border-cyber-gold/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">🎯 Progress & Claiming</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Automatic tracking</strong> - progress updates in real-time</li>
                                <li>• <strong className="text-white">Manual claiming</strong> - rewards must be claimed to receive</li>
                                <li>• <strong className="text-white">Grace period</strong> - 1 hour after reset to claim completed quests</li>
                                <li>• <strong className="text-white">No rollover</strong> - unclaimed rewards are lost at expiration</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Difficulty Tiers */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Difficulty Tiers</h2>
                    <p>
                        Each day brings one quest from each difficulty tier. Higher difficulty quests require more effort but grant 
                        significantly better rewards.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 not-prose">
                        <div className="bg-gradient-to-br from-emerald-500/20 to-transparent p-6 rounded-xl border border-emerald-500/50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold font-orbitron text-emerald-400">Easy</h3>
                                <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                                    1-2 Matches
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-black/30 p-3 rounded-lg">
                                    <div className="text-xs text-emerald-300 uppercase tracking-wide mb-1">Rewards</div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white font-bold">+500 XP</span>
                                        <span className="text-sm text-cyber-gold font-bold">+25 Shards</span>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <strong className="text-white">Quick objectives</strong> like playing matches, 
                                    using basic abilities, or dealing light damage.
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500/20 to-transparent p-6 rounded-xl border border-blue-500/50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold font-orbitron text-blue-400">Medium</h3>
                                <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                                    3-5 Matches
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-black/30 p-3 rounded-lg">
                                    <div className="text-xs text-blue-300 uppercase tracking-wide mb-1">Rewards</div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white font-bold">+1,000 XP</span>
                                        <span className="text-sm text-cyber-gold font-bold">+50 Shards</span>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <strong className="text-white">Moderate challenges</strong> requiring multiple wins, 
                                    combo executions, or sustained damage output.
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/20 to-transparent p-6 rounded-xl border border-purple-500/50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold font-orbitron text-purple-400">Hard</h3>
                                <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold">
                                    5+ Matches
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-black/30 p-3 rounded-lg">
                                    <div className="text-xs text-purple-300 uppercase tracking-wide mb-1">Rewards</div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white font-bold">+1,500 XP</span>
                                        <span className="text-sm text-cyber-gold font-bold">+100 Shards</span>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <strong className="text-white">Demanding objectives</strong> like win streaks, 
                                    marathon sessions, or high damage milestones.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quest Types */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Quest Objective Types</h2>
                    <p>
                        Quests are built from <strong className="text-white">10 different objective types</strong>, each tracking 
                        specific actions you perform in matches. The system has <strong className="text-white">36+ unique quest templates </strong> 
                        that rotate daily.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 not-prose">
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xl">🏆</div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white mb-1">Win Matches</h4>
                                    <p className="text-xs text-muted-foreground">Win ranked PvP matches (best-of-3 or best-of-5)</p>
                                    <div className="mt-2 text-xs text-emerald-400">Example: "Win 3 matches"</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 text-xl">🎮</div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white mb-1">Play Matches</h4>
                                    <p className="text-xs text-muted-foreground">Complete matches (win or loss counts)</p>
                                    <div className="mt-2 text-xs text-blue-400">Example: "Play 5 matches"</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 text-xl">💥</div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white mb-1">Deal Damage</h4>
                                    <p className="text-xs text-muted-foreground">Accumulate total damage across matches</p>
                                    <div className="mt-2 text-xs text-red-400">Example: "Deal 2,500 damage"</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 text-xl">⚔️</div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white mb-1">Defeat Opponents</h4>
                                    <p className="text-xs text-muted-foreground">Knock out opponents to win rounds</p>
                                    <div className="mt-2 text-xs text-amber-400">Example: "Defeat 5 opponents"</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 text-xl">🎯</div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white mb-1">Use Abilities</h4>
                                    <p className="text-xs text-muted-foreground">Execute specific moves (Punch, Kick, Block, Special)</p>
                                    <div className="mt-2 text-xs text-purple-400">Example: "Use Special attack 15 times"</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 text-xl">⚡</div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white mb-1">Execute Combos</h4>
                                    <p className="text-xs text-muted-foreground">Chain successful attack sequences</p>
                                    <div className="mt-2 text-xs text-pink-400">Example: "Execute 10 combos"</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 text-xl">🔥</div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white mb-1">Win Streaks</h4>
                                    <p className="text-xs text-muted-foreground">Win consecutive matches without losing</p>
                                    <div className="mt-2 text-xs text-orange-400">Example: "Win 4 matches in a row"</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xl">🌊</div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white mb-1">Survival Waves</h4>
                                    <p className="text-xs text-muted-foreground">Progress through Survival Mode encounters</p>
                                    <div className="mt-2 text-xs text-cyan-400">Example: "Complete 10 waves"</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Daily Streak System */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Daily Streak Bonuses</h2>
                    <p>
                        Complete <strong className="text-white">all 3 quests</strong> in a single day to earn streak bonuses. 
                        Consecutive days build your streak, unlocking scaling rewards that stack with your base quest earnings.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 not-prose">
                        <div className="bg-gradient-to-br from-cyber-gold/20 to-transparent p-6 rounded-xl border border-cyber-gold/50">
                            <h3 className="text-lg font-bold text-white mb-4 font-orbitron">🔥 How Streaks Work</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Start streak:</strong> Complete all 3 quests on Day 1</li>
                                <li>• <strong className="text-white">Build streak:</strong> Complete all 3 quests next day = Day 2 streak</li>
                                <li>• <strong className="text-white">Maintain streak:</strong> Must claim all quests before reset</li>
                                <li>• <strong className="text-white">Break streak:</strong> Missing any quest or not claiming resets to 0</li>
                                <li>• <strong className="text-white">Track progress:</strong> View current/longest streak in Quests page</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/20 to-transparent p-6 rounded-xl border border-purple-500/50">
                            <h3 className="text-lg font-bold text-white mb-4 font-orbitron">💎 Streak Rewards</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/30">
                                    <span className="text-sm text-white">Day 1 Streak</span>
                                    <span className="text-xs text-emerald-400 font-bold">+100 XP, +10 Shards</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/30">
                                    <span className="text-sm text-white">Day 2 Streak</span>
                                    <span className="text-xs text-blue-400 font-bold">+200 XP, +20 Shards</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/30">
                                    <span className="text-sm text-white">Day 3 Streak</span>
                                    <span className="text-xs text-purple-400 font-bold">+300 XP, +30 Shards</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/30">
                                    <span className="text-sm text-white">...</span>
                                    <span className="text-xs text-muted-foreground">Scales up to Day 7</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gradient-to-r from-cyber-gold/20 to-purple-500/20 border border-cyber-gold/30">
                                    <span className="text-sm text-cyber-gold font-bold">Day 7+ Streak</span>
                                    <span className="text-xs text-cyber-gold font-bold">+700 XP, +70 Shards (MAX)</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Bonus rewards are capped at Day 7. Maintaining longer streaks beyond Day 7 still gives maximum bonus.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Claiming Process */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Claiming Rewards</h2>
                    <div className="bg-amber-500/10 p-6 rounded-xl border border-amber-500/30">
                        <h3 className="text-lg font-bold text-white mb-3 font-orbitron">⚠️ Important: Manual Claiming Required</h3>
                        <p className="text-sm text-amber-200 mb-4">
                            Quest rewards are <strong>NOT automatically granted</strong>. You must manually claim completed quests 
                            from the <strong>/quests</strong> page to receive XP and Clash Shards.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-black/30 p-4 rounded-lg">
                                <h4 className="text-sm font-bold text-white mb-2">✅ Claiming Steps</h4>
                                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                                    <li>Complete quest objective (progress bar reaches 100%)</li>
                                    <li>Quest status changes to "Completed"</li>
                                    <li>Click "Claim Rewards" button on quest card</li>
                                    <li>XP and Shards are instantly added to your account</li>
                                </ol>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg">
                                <h4 className="text-sm font-bold text-white mb-2">⏰ Claim Deadlines</h4>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>• <strong className="text-white">Regular deadline:</strong> 00:00 UTC (daily reset)</li>
                                    <li>• <strong className="text-white">Grace period:</strong> +1 hour for completed quests</li>
                                    <li>• <strong className="text-white">After grace period:</strong> Unclaimed rewards are lost</li>
                                    <li>• <strong className="text-white">No rollover:</strong> Cannot claim expired quests</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Prestige Multipliers */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Prestige Multipliers</h2>
                    <p>
                        Quest XP and Clash Shard rewards are affected by your <strong className="text-white">Prestige Level</strong>. 
                        Higher prestige grants compounding bonuses to all quest earnings.
                    </p>

                    <div className="bg-black/20 p-6 rounded-xl border border-kaspa/30 mt-6 not-prose">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-slate-500/20 to-transparent border border-slate-500/30">
                                <div className="text-xs text-slate-400 mb-1">Prestige 0</div>
                                <div className="text-lg font-bold text-white">1.0×</div>
                                <div className="text-xs text-muted-foreground">Base rewards</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-amber-600/20 to-transparent border border-amber-600/30">
                                <div className="text-xs text-amber-400 mb-1">Prestige 1</div>
                                <div className="text-lg font-bold text-white">1.1×</div>
                                <div className="text-xs text-muted-foreground">+10%</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/30">
                                <div className="text-xs text-emerald-400 mb-1">Prestige 3</div>
                                <div className="text-lg font-bold text-white">1.33×</div>
                                <div className="text-xs text-muted-foreground">+33%</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/30">
                                <div className="text-xs text-purple-400 mb-1">Prestige 5</div>
                                <div className="text-lg font-bold text-white">1.61×</div>
                                <div className="text-xs text-muted-foreground">+61%</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/30">
                                <div className="text-xs text-blue-400 mb-1">Prestige 7</div>
                                <div className="text-lg font-bold text-white">1.95×</div>
                                <div className="text-xs text-muted-foreground">+95%</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-cyber-gold/20 to-transparent border border-cyber-gold/50">
                                <div className="text-xs text-cyber-gold mb-1">Prestige 10</div>
                                <div className="text-lg font-bold text-cyber-gold">2.59×</div>
                                <div className="text-xs text-muted-foreground">+159%</div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 text-center">
                            Multipliers apply to both XP and Clash Shards. Formula: 1.1^(prestige_level)
                        </p>
                    </div>
                </section>

                {/* Strategy Tips */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Strategy & Tips</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                        <div className="bg-emerald-500/10 p-6 rounded-xl border border-emerald-500/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">💡 Maximizing Quest Efficiency</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Check daily:</strong> Review quests immediately after reset to plan your day</li>
                                <li>• <strong className="text-white">Stack objectives:</strong> Choose characters/playstyles that complete multiple quests</li>
                                <li>• <strong className="text-white">Hard quest first:</strong> Tackle challenging quests early while you're fresh</li>
                                <li>• <strong className="text-white">Time management:</strong> Reserve 2-3 hours for all quests if pursuing streaks</li>
                                <li>• <strong className="text-white">Claim before reset:</strong> Set a reminder 30 minutes before 00:00 UTC</li>
                            </ul>
                        </div>
                        <div className="bg-cyber-gold/10 p-6 rounded-xl border border-cyber-gold/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">🎯 Common Quest Combos</h3>
                            <div className="space-y-3 text-sm">
                                <div className="bg-black/30 p-3 rounded-lg">
                                    <div className="font-bold text-white mb-1">Win Matches + Deal Damage</div>
                                    <p className="text-xs text-muted-foreground">
                                        Play aggressively to maximize damage while securing wins
                                    </p>
                                </div>
                                <div className="bg-black/30 p-3 rounded-lg">
                                    <div className="font-bold text-white mb-1">Use Abilities + Execute Combos</div>
                                    <p className="text-xs text-muted-foreground">
                                        Focus on chaining moves to complete both simultaneously
                                    </p>
                                </div>
                                <div className="bg-black/30 p-3 rounded-lg">
                                    <div className="font-bold text-white mb-1">Play Matches + Win Streak</div>
                                    <p className="text-xs text-muted-foreground">
                                        Every streak win counts toward play matches total
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quest Variety */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Quest Rotation & Variety</h2>
                    <p>
                        The quest system features <strong className="text-white">12 Easy quests</strong>, 
                        <strong className="text-white"> 12 Medium quests</strong>, and <strong className="text-white">12 Hard quests </strong> 
                        in the rotation pool. Each day, the system intelligently selects quests to ensure variety and avoid repeating recent objectives.
                    </p>

                    <div className="bg-black/20 p-6 rounded-xl border border-kaspa/30 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">🔄 How Quest Selection Works</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• <strong className="text-white">Deterministic generation:</strong> Your daily quests are seeded from your wallet address + date</li>
                            <li>• <strong className="text-white">Anti-repetition:</strong> System avoids assigning the same quest multiple days in a row</li>
                            <li>• <strong className="text-white">Balanced objectives:</strong> Mix of combat, skill, and endurance challenges across difficulties</li>
                            <li>• <strong className="text-white">36 total templates:</strong> With 3 quests per day, a full rotation takes 12 days per difficulty tier</li>
                            <li>• <strong className="text-white">Same for everyone:</strong> All players with the same address get identical quest sets each day</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}
