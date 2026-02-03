import React from 'react';

export function GamersAchievements() {
    return (
        <div className="space-y-12">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                {/* Hero */}
                <div className="bg-gradient-to-br from-purple-500/10 via-transparent to-cyber-gold/10 p-8 rounded-xl border border-purple-500/30">
                    <h1 className="text-4xl font-bold text-cyber-gold mb-3 font-orbitron">Achievement System</h1>
                    <p className="text-lg text-cyber-gray">
                        Unlock over <strong className="text-white">80 achievements</strong> across 5 categories. Each achievement rewards XP and Clash Shards, 
                        with higher tiers granting massive bonuses. Track your mastery, complete categories for exclusive badges, and prove yourself 
                        as the ultimate KaspaClash champion.
                    </p>
                </div>

                {/* Overview */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">System Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose">
                        <div className="bg-black/20 p-6 rounded-xl border border-kaspa/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">📊 Progress Tracking</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Real-time updates</strong> - progress tracked automatically</li>
                                <li>• <strong className="text-white">Persistent stats</strong> - never lose your progress</li>
                                <li>• <strong className="text-white">Visual indicators</strong> - see how close you are to unlocking</li>
                                <li>• <strong className="text-white">Recent unlocks</strong> - celebrate achievements as you earn them</li>
                            </ul>
                        </div>
                        <div className="bg-black/20 p-6 rounded-xl border border-purple-500/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">🎁 Instant Rewards</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Auto-unlock</strong> when requirements are met</li>
                                <li>• <strong className="text-white">XP awarded</strong> instantly to Battle Pass</li>
                                <li>• <strong className="text-white">Shards granted</strong> to your account immediately</li>
                                <li>• <strong className="text-white">Badges earned</strong> for special milestones</li>
                            </ul>
                        </div>
                        <div className="bg-black/20 p-6 rounded-xl border border-cyber-gold/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">🏆 Hidden Secrets</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Secret achievements</strong> - discover as you play</li>
                                <li>• <strong className="text-white">Bonus rewards</strong> for ultimate challenges</li>
                                <li>• <strong className="text-white">Mastery badges</strong> for category completion</li>
                                <li>• <strong className="text-white">Legendary titles</strong> for the dedicated</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Tier System */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Achievement Tiers</h2>
                    <p>
                        Achievements are divided into <strong className="text-white">5 tiers</strong> based on difficulty and rarity. 
                        Higher tiers require significantly more effort but grant exponentially better rewards.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6 not-prose">
                        <div className="bg-gradient-to-br from-amber-700/20 to-transparent p-5 rounded-xl border border-amber-700/50">
                            <div className="text-center mb-3">
                                <div className="text-3xl mb-2">🥉</div>
                                <h3 className="text-lg font-bold font-orbitron text-amber-600">Bronze</h3>
                                <p className="text-xs text-muted-foreground">Entry Level</p>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg text-center">
                                <div className="text-sm text-white font-bold">+250 XP</div>
                                <div className="text-sm text-cyber-gold font-bold">+25 Shards</div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Quick wins for new players. Simple objectives like first match or basic milestones.</p>
                        </div>

                        <div className="bg-gradient-to-br from-slate-400/20 to-transparent p-5 rounded-xl border border-slate-400/50">
                            <div className="text-center mb-3">
                                <div className="text-3xl mb-2">🥈</div>
                                <h3 className="text-lg font-bold font-orbitron text-slate-300">Silver</h3>
                                <p className="text-xs text-muted-foreground">Intermediate</p>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg text-center">
                                <div className="text-sm text-white font-bold">+500 XP</div>
                                <div className="text-sm text-cyber-gold font-bold">+50 Shards</div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Moderate challenges requiring consistent play and skill development.</p>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-500/20 to-transparent p-5 rounded-xl border border-yellow-500/50">
                            <div className="text-center mb-3">
                                <div className="text-3xl mb-2">🥇</div>
                                <h3 className="text-lg font-bold font-orbitron text-yellow-400">Gold</h3>
                                <p className="text-xs text-muted-foreground">Advanced</p>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg text-center">
                                <div className="text-sm text-white font-bold">+1,000 XP</div>
                                <div className="text-sm text-cyber-gold font-bold">+100 Shards</div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Demanding objectives for experienced players. Requires dedication and mastery.</p>
                        </div>

                        <div className="bg-gradient-to-br from-cyan-400/20 to-transparent p-5 rounded-xl border border-cyan-400/50">
                            <div className="text-center mb-3">
                                <div className="text-3xl mb-2">💎</div>
                                <h3 className="text-lg font-bold font-orbitron text-cyan-300">Platinum</h3>
                                <p className="text-xs text-muted-foreground">Expert</p>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg text-center">
                                <div className="text-sm text-white font-bold">+2,000 XP</div>
                                <div className="text-sm text-cyber-gold font-bold">+250 Shards</div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Elite challenges for top players. Massive effort yields massive rewards.</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-400/20 to-transparent p-5 rounded-xl border border-blue-400/50">
                            <div className="text-center mb-3">
                                <div className="text-3xl mb-2">💠</div>
                                <h3 className="text-lg font-bold font-orbitron text-blue-300">Diamond</h3>
                                <p className="text-xs text-muted-foreground">Master</p>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg text-center">
                                <div className="text-sm text-white font-bold">+5,000 XP</div>
                                <div className="text-sm text-cyber-gold font-bold">+500 Shards</div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Ultimate challenges. Only the most dedicated players will unlock these.</p>
                        </div>
                    </div>
                </section>

                {/* Categories */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Achievement Categories</h2>
                    <p>
                        KaspaClash features <strong className="text-white">5 distinct categories</strong>, each tracking different aspects of your gameplay. 
                        Complete all achievements in a category to earn an exclusive <strong className="text-white">Mastery Badge</strong>.
                    </p>

                    <div className="space-y-6 mt-6 not-prose">
                        <div className="bg-gradient-to-r from-red-500/10 via-transparent to-transparent p-6 rounded-xl border border-red-500/30">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-red-500/20 text-4xl">⚔️</div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2 font-orbitron">Combat (17 achievements)</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Master the art of battle. Track wins, damage dealt, combos executed, perfect rounds, and win streaks.
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-amber-600 font-bold">Bronze</div>
                                            <div className="text-muted-foreground">First Blood, Combo Starter, Damage Dealer, Block Master</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-slate-300 font-bold">Silver</div>
                                            <div className="text-muted-foreground">Warrior, Combo Artist, Destruction, Perfect Round</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-yellow-400 font-bold">Gold</div>
                                            <div className="text-muted-foreground">Champion, Combo Master, Win Streak 5, Perfect Match</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-cyan-300 font-bold">Platinum+</div>
                                            <div className="text-muted-foreground">Legend, Win Streak 10, Devastator, Immortal, Flawless Fighter</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent p-6 rounded-xl border border-emerald-500/30">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-emerald-500/20 text-4xl">📈</div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2 font-orbitron">Progression (16 achievements)</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Climb the Battle Pass ladder. Earn XP, complete quests, reach tiers, maintain streaks, and prestige.
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-amber-600 font-bold">Bronze</div>
                                            <div className="text-muted-foreground">Rising Star (Tier 5), XP Hunter (5k XP), Quest Starter</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-slate-300 font-bold">Silver</div>
                                            <div className="text-muted-foreground">Climber (Tier 15), XP Veteran, Quest Enthusiast, Quest Streak</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-yellow-400 font-bold">Gold</div>
                                            <div className="text-muted-foreground">Halfway Hero (Tier 25), XP Champion, Quest Master</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-cyan-300 font-bold">Platinum+</div>
                                            <div className="text-muted-foreground">Battle Pass Elite, Quest Legend, Dedication, Max Level, Prestige Warrior</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-500/10 via-transparent to-transparent p-6 rounded-xl border border-blue-500/30">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-blue-500/20 text-4xl">🤝</div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2 font-orbitron">Social (9 achievements)</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Engage with the community. Play matches, face unique opponents, and become an arena legend.
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-amber-600 font-bold">Bronze</div>
                                            <div className="text-muted-foreground">Arena Debut, Social Butterfly (5 opponents)</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-slate-300 font-bold">Silver</div>
                                            <div className="text-muted-foreground">Regular (25 matches), Networker (20 opponents)</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-yellow-400 font-bold">Gold</div>
                                            <div className="text-muted-foreground">Veteran (100 matches), Popular Fighter (50 opponents)</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-cyan-300 font-bold">Platinum+</div>
                                            <div className="text-muted-foreground">Arena Legend (500), Community Star (100), Eternal Warrior (1000)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-500/10 via-transparent to-transparent p-6 rounded-xl border border-purple-500/30">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-purple-500/20 text-4xl">👗</div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2 font-orbitron">Collection (13 achievements)</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Build your cosmetic empire. Shop purchases, shard earnings, and rare item collections.
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-amber-600 font-bold">Bronze</div>
                                            <div className="text-muted-foreground">First Purchase, Fashionista (3 items), Shard Saver (500)</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-slate-300 font-bold">Silver</div>
                                            <div className="text-muted-foreground">Shop Regular (5 buys), Style Icon (10 items), Shard Collector (2.5k)</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-yellow-400 font-bold">Gold</div>
                                            <div className="text-muted-foreground">Big Spender (15), Collector (25), Rare Find (Epic/Legendary)</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-cyan-300 font-bold">Platinum+</div>
                                            <div className="text-muted-foreground">Whale (50), Shard Hoarder (10k), Complete Collection (50), Legendary Collector</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-cyber-gold/10 via-transparent to-transparent p-6 rounded-xl border border-cyber-gold/30">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-cyber-gold/20 text-4xl">👑</div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2 font-orbitron">Mastery (11 achievements)</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Prove ultimate skill. Survival Mode waves, achievement hunting, category completion, and the ultimate 100% title.
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-amber-600 font-bold">Bronze</div>
                                            <div className="text-muted-foreground">Survival Initiate (5 waves), Achievement Hunter (5 unlocks)</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-slate-300 font-bold">Silver</div>
                                            <div className="text-muted-foreground">Survival Veteran (10 waves), Achievement Addict (20)</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-yellow-400 font-bold">Gold</div>
                                            <div className="text-muted-foreground">Survival Expert (15), Combat Mastery, Achievement Collector (40)</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <div className="text-cyan-300 font-bold">Platinum+</div>
                                            <div className="text-muted-foreground">Survival Champion (20), Category Master, Completionist, Ultimate Champion</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Secret Achievements */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Secret Achievements</h2>
                    <p>
                        Some achievements are <strong className="text-white">hidden until unlocked</strong>. These secret challenges reward creative play, 
                        mastery, and dedication with bonus XP and exclusive badges.
                    </p>

                    <div className="bg-gradient-to-br from-purple-500/20 to-transparent p-6 rounded-xl border border-purple-500/50 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">🔒 Known Secret Achievements</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-white">Flawless Fighter</span>
                                    <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">Diamond</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">Win 10 perfect matches (all rounds perfect)</p>
                                <div className="text-xs text-cyber-gold font-bold">+5,000 XP, +500 Shards</div>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-white">Ultra Prestige</span>
                                    <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">Diamond</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">Reach Prestige Level 5</p>
                                <div className="text-xs text-cyber-gold font-bold">+5,000 XP, +500 Shards</div>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-white">Legendary Collector</span>
                                    <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">Diamond</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">Own 3 Legendary cosmetic items</p>
                                <div className="text-xs text-cyber-gold font-bold">+5,000 XP, +500 Shards</div>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg border border-cyber-gold/30 bg-gradient-to-br from-cyber-gold/10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-cyber-gold">Ultimate Champion</span>
                                    <span className="px-2 py-1 rounded-full bg-cyber-gold/20 text-cyber-gold text-xs font-bold">Diamond</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">Unlock ALL achievements in ALL categories</p>
                                <div className="text-xs text-cyber-gold font-bold">+10,000 XP, +1,000 Shards + Ultimate Badge</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tracking Stats */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">How Progress Is Tracked</h2>
                    <p>
                        Achievements track <strong className="text-white">real player statistics</strong> from actual game data. 
                        Progress updates automatically as you play, and achievements unlock instantly when requirements are met.
                    </p>

                    <div className="bg-black/20 p-6 rounded-xl border border-kaspa/30 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">📊 Tracked Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-black/30 p-3 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-1">Combat</div>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>• Total wins/losses</li>
                                    <li>• Damage dealt</li>
                                    <li>• Combos executed</li>
                                    <li>• Blocks successful</li>
                                    <li>• Perfect rounds</li>
                                    <li>• Win streaks</li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-1">Progression</div>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>• Current tier</li>
                                    <li>• Total XP earned</li>
                                    <li>• Quests completed</li>
                                    <li>• Quest streak</li>
                                    <li>• Prestige level</li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-1">Social</div>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>• Matches played</li>
                                    <li>• Unique opponents</li>
                                    <li>• Community engagement</li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-1">Collection</div>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>• Shop purchases</li>
                                    <li>• Cosmetics owned</li>
                                    <li>• Shards earned</li>
                                    <li>• Rarity counts</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mastery Badges */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Mastery Badges</h2>
                    <p>
                        Complete <strong className="text-white">all achievements in a category</strong> to earn an exclusive 
                        <strong className="text-white"> Mastery Badge</strong>. Display these badges on your profile to showcase your expertise.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6 not-prose">
                        <div className="bg-gradient-to-br from-red-500/20 to-transparent p-4 rounded-xl border border-red-500/50 text-center">
                            <div className="text-4xl mb-2">🗡️</div>
                            <div className="text-sm font-bold text-white mb-1">Combat Master</div>
                            <div className="text-xs text-muted-foreground">17/17 Combat</div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500/20 to-transparent p-4 rounded-xl border border-emerald-500/50 text-center">
                            <div className="text-4xl mb-2">📊</div>
                            <div className="text-sm font-bold text-white mb-1">Progression Master</div>
                            <div className="text-xs text-muted-foreground">16/16 Progression</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/20 to-transparent p-4 rounded-xl border border-blue-500/50 text-center">
                            <div className="text-4xl mb-2">👥</div>
                            <div className="text-sm font-bold text-white mb-1">Social Master</div>
                            <div className="text-xs text-muted-foreground">9/9 Social</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500/20 to-transparent p-4 rounded-xl border border-purple-500/50 text-center">
                            <div className="text-4xl mb-2">💎</div>
                            <div className="text-sm font-bold text-white mb-1">Collection Master</div>
                            <div className="text-xs text-muted-foreground">13/13 Collection</div>
                        </div>
                        <div className="bg-gradient-to-br from-cyber-gold/20 to-transparent p-4 rounded-xl border border-cyber-gold/50 text-center">
                            <div className="text-4xl mb-2">👑</div>
                            <div className="text-sm font-bold text-cyber-gold mb-1">Mastery Master</div>
                            <div className="text-xs text-muted-foreground">11/11 Mastery</div>
                        </div>
                    </div>
                </section>

                {/* Strategy Tips */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Tips & Strategy</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                        <div className="bg-emerald-500/10 p-6 rounded-xl border border-emerald-500/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">💡 Efficient Unlocking</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Target tiers:</strong> Focus on Bronze/Silver first for quick wins</li>
                                <li>• <strong className="text-white">Track progress:</strong> Check /achievements regularly to see closest unlocks</li>
                                <li>• <strong className="text-white">Combo synergy:</strong> Work on multiple categories simultaneously</li>
                                <li>• <strong className="text-white">Quest alignment:</strong> Daily quests progress both quest and achievement stats</li>
                                <li>• <strong className="text-white">Prestige bonus:</strong> Higher prestige = faster XP from achievement unlocks</li>
                            </ul>
                        </div>
                        <div className="bg-cyber-gold/10 p-6 rounded-xl border border-cyber-gold/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">🎯 Mastery Roadmap</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Easiest category:</strong> Social (9 achievements, mostly match-count based)</li>
                                <li>• <strong className="text-white">Most rewarding:</strong> Combat (17 achievements, high-tier options)</li>
                                <li>• <strong className="text-white">Passive progress:</strong> Collection (shop purchases accumulate naturally)</li>
                                <li>• <strong className="text-white">Longest grind:</strong> Mastery (requires category completion)</li>
                                <li>• <strong className="text-white">Ultimate goal:</strong> All 5 badges + Ultimate Champion title</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Total Rewards */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Total Rewards Available</h2>
                    <div className="bg-gradient-to-br from-cyber-gold/20 to-purple-500/10 p-8 rounded-xl border border-cyber-gold/50 not-prose">
                        <h3 className="text-2xl font-bold text-white mb-4 font-orbitron text-center">Complete All 80+ Achievements</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-black/30 p-6 rounded-lg text-center">
                                <div className="text-sm text-muted-foreground mb-2">Total XP</div>
                                <div className="text-3xl font-bold text-white mb-2">~80,000+</div>
                                <p className="text-xs text-muted-foreground">Enough to gain multiple Battle Pass tiers</p>
                            </div>
                            <div className="bg-black/30 p-6 rounded-lg text-center">
                                <div className="text-sm text-muted-foreground mb-2">Total Shards</div>
                                <div className="text-3xl font-bold text-cyber-gold mb-2">~8,000+</div>
                                <p className="text-xs text-muted-foreground">Buy multiple legendary cosmetics</p>
                            </div>
                            <div className="bg-black/30 p-6 rounded-lg text-center">
                                <div className="text-sm text-muted-foreground mb-2">Exclusive Badges</div>
                                <div className="text-3xl font-bold text-purple-400 mb-2">6+</div>
                                <p className="text-xs text-muted-foreground">5 category badges + Ultimate Champion badge</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
