import React from 'react';

export function GamersBattlePass() {
    return (
        <div className="space-y-12">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                {/* Hero */}
                <div className="bg-gradient-to-br from-cyber-gold/10 via-transparent to-blue-500/10 p-8 rounded-xl border border-cyber-gold/30">
                    <h1 className="text-4xl font-bold text-cyber-gold mb-3 font-orbitron">Battle Pass System</h1>
                    <p className="text-lg text-cyber-gray">
                        A 50-tier seasonal progression system that rewards players with XP, Clash Shards, and cosmetic unlocks.
                        Earn XP through quests and achievements, climb tiers for rewards, and prestige for permanent bonuses.
                    </p>
                </div>

                {/* Overview */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">System Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                        <div className="bg-black/20 p-6 rounded-xl border border-kaspa/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">Core Features</h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>✓ <strong className="text-white">50 tiers</strong> per season with hybrid XP curve</li>
                                <li>✓ <strong className="text-white">Free track only</strong> (no premium currently)</li>
                                <li>✓ <strong className="text-white">Seasonal resets</strong> with active season tracking</li>
                                <li>✓ <strong className="text-white">Prestige system</strong> unlocks at tier 50</li>
                                <li>✓ <strong className="text-white">Automatic rewards</strong> when unlocking tiers</li>
                            </ul>
                        </div>
                        <div className="bg-black/20 p-6 rounded-xl border border-cyber-gold/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">Rewards Per Season</h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>💎 <strong className="text-white">3,750+ Clash Shards</strong> total</li>
                                <li>🎨 <strong className="text-white">10 Common</strong> cosmetic unlocks</li>
                                <li>⭐ <strong className="text-white">5 Rare</strong> cosmetic unlocks</li>
                                <li>🌟 <strong className="text-white">2 Epic</strong> cosmetic unlocks (tiers 25, 50)</li>
                                <li>👑 <strong className="text-white">1 Legendary</strong> cosmetic + badge (tier 50)</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Progression Curve */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">XP Progression Curve</h2>
                    <p>
                        KaspaClash uses a <strong className="text-white">hybrid XP curve</strong> designed for fast early progression, 
                        consistent mid-game advancement, and challenging endgame grind. Each tier requires progressively more XP.
                    </p>
                    
                    <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent p-6 rounded-xl border border-emerald-500/30">
                            <div className="text-emerald-400 text-sm font-bold mb-2 uppercase tracking-wide">Phase 1</div>
                            <h3 className="text-xl font-bold text-white mb-2">Tiers 1–20</h3>
                            <p className="text-sm text-muted-foreground mb-3">Exponential Growth</p>
                            <div className="bg-black/30 p-3 rounded-lg font-mono text-xs text-emerald-300">
                                1000 × 1.08^(tier-1)
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Quick wins for new players. Tier 20 requires ~4,316 XP.</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-500/10 to-transparent p-6 rounded-xl border border-blue-500/30">
                            <div className="text-blue-400 text-sm font-bold mb-2 uppercase tracking-wide">Phase 2</div>
                            <h3 className="text-xl font-bold text-white mb-2">Tiers 21–40</h3>
                            <p className="text-sm text-muted-foreground mb-3">Linear Growth</p>
                            <div className="bg-black/30 p-3 rounded-lg font-mono text-xs text-blue-300">
                                tier20_xp + 500 × (tier-20)
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Consistent progression. Each tier adds 500 XP requirement.</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-500/10 to-transparent p-6 rounded-xl border border-purple-500/30">
                            <div className="text-purple-400 text-sm font-bold mb-2 uppercase tracking-wide">Phase 3</div>
                            <h3 className="text-xl font-bold text-white mb-2">Tiers 41–50</h3>
                            <p className="text-sm text-muted-foreground mb-3">Scaled Endgame</p>
                            <div className="bg-black/30 p-3 rounded-lg font-mono text-xs text-purple-300">
                                tier40_xp + 800×(t-40)×1.05^(t-40)
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Challenging final stretch. Tier 50 requires significant effort.</p>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30 mt-6">
                        <p className="text-sm text-blue-200">
                            <strong>Example:</strong> Tier 1 starts at 0 XP. Tier 2 requires 1,000 XP. Tier 10 requires ~2,159 XP. Tier 50 requires substantially more.
                        </p>
                    </div>
                </section>

                {/* Earning XP */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">How to Earn XP</h2>
                    <p>
                        XP is awarded exclusively through <strong className="text-white">Daily Quests</strong> and <strong className="text-white">Achievement Unlocks</strong>. 
                        The progression API tracks all XP gains and automatically unlocks tiers when thresholds are reached.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose mt-6">
                        <div className="bg-black/20 p-6 rounded-xl border border-emerald-500/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">📜 Daily Quests</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-emerald-500/5 p-3 rounded-lg">
                                    <span className="text-sm font-medium text-emerald-300">Easy Quest</span>
                                    <span className="text-sm font-bold text-white">+500 XP</span>
                                </div>
                                <div className="flex items-center justify-between bg-blue-500/5 p-3 rounded-lg">
                                    <span className="text-sm font-medium text-blue-300">Medium Quest</span>
                                    <span className="text-sm font-bold text-white">+1,000 XP</span>
                                </div>
                                <div className="flex items-center justify-between bg-purple-500/5 p-3 rounded-lg">
                                    <span className="text-sm font-medium text-purple-300">Hard Quest</span>
                                    <span className="text-sm font-bold text-white">+1,500 XP</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-4">
                                Complete daily objectives like winning matches, dealing damage, or using specific moves. 
                                Claim rewards in the Quests menu.
                            </p>
                        </div>

                        <div className="bg-black/20 p-6 rounded-xl border border-cyber-gold/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">🏆 Achievements</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Bronze Tier</span>
                                    <span className="text-white font-bold">Variable XP</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Silver Tier</span>
                                    <span className="text-white font-bold">Variable XP</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Gold Tier</span>
                                    <span className="text-white font-bold">Variable XP</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Platinum Tier</span>
                                    <span className="text-white font-bold">Variable XP</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Diamond Tier</span>
                                    <span className="text-white font-bold">Variable XP</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-4">
                                XP rewards are defined per achievement category (Combat, Progression, Social, Collection, Mastery). 
                                Unlock automatically when completing achievement requirements.
                            </p>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/30 mt-6">
                        <p className="text-sm text-amber-200">
                            <strong>Note:</strong> The progression API supports additional XP sources like <code className="text-amber-100">match_win</code>, 
                            <code className="text-amber-100">match_loss</code>, <code className="text-amber-100">survival_mode</code>, 
                            and <code className="text-amber-100">combo_challenge</code>, but these are not currently used by the client.
                        </p>
                    </div>
                </section>

                {/* Tier Rewards */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Tier Reward Structure</h2>
                    <p>
                        Every tier grants <strong className="text-white">Clash Shards</strong> (in-game currency). Specific tiers also unlock 
                        <strong className="text-white"> cosmetic item IDs</strong> which are added to your inventory if they exist in the database.
                    </p>

                    <div className="bg-black/20 p-6 rounded-xl border border-kaspa/30 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">Reward Distribution Table</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-kaspa/20">
                                        <th className="text-left py-2 px-3 font-bold text-kaspa">Tier</th>
                                        <th className="text-left py-2 px-3 font-bold text-kaspa">Clash Shards</th>
                                        <th className="text-left py-2 px-3 font-bold text-kaspa">Cosmetic Unlock</th>
                                    </tr>
                                </thead>
                                <tbody className="text-muted-foreground">
                                    <tr className="border-b border-white/5">
                                        <td className="py-2 px-3">Every Tier (1–50)</td>
                                        <td className="py-2 px-3 text-cyber-gold font-bold">50 + (⌊tier/10⌋ × 25)</td>
                                        <td className="py-2 px-3 text-white">—</td>
                                    </tr>
                                    <tr className="border-b border-white/5 bg-emerald-500/5">
                                        <td className="py-2 px-3">Every 5 Tiers (5, 10, 15...)</td>
                                        <td className="py-2 px-3 text-cyber-gold font-bold">—</td>
                                        <td className="py-2 px-3 text-emerald-400">Common Cosmetic</td>
                                    </tr>
                                    <tr className="border-b border-white/5 bg-blue-500/5">
                                        <td className="py-2 px-3">Every 10 Tiers (10, 20, 30...)</td>
                                        <td className="py-2 px-3 text-cyber-gold font-bold">—</td>
                                        <td className="py-2 px-3 text-blue-400">Rare Cosmetic</td>
                                    </tr>
                                    <tr className="border-b border-white/5 bg-purple-500/5">
                                        <td className="py-2 px-3">Tiers 25 & 50</td>
                                        <td className="py-2 px-3 text-cyber-gold font-bold">—</td>
                                        <td className="py-2 px-3 text-purple-400">Epic Cosmetic</td>
                                    </tr>
                                    <tr className="bg-cyber-gold/5">
                                        <td className="py-2 px-3">Tier 50 Only</td>
                                        <td className="py-2 px-3 text-cyber-gold font-bold">—</td>
                                        <td className="py-2 px-3 text-cyber-gold">Legendary Cosmetic + Badge</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30 mt-4">
                            <p className="text-xs text-blue-200">
                                <strong>Example Shard Progression:</strong> Tier 1 = 50 shards, Tier 10 = 50 shards, Tier 11 = 75 shards, Tier 20 = 75 shards, Tier 21 = 100 shards.
                            </p>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/30 mt-6">
                        <p className="text-sm text-amber-200">
                            <strong>Important:</strong> Cosmetic rewards are item IDs like <code className="text-amber-100">tier_5_cosmetic_common</code>. 
                            They are only granted if a matching cosmetic exists in the <code className="text-amber-100">cosmetic_items</code> database table. 
                            Otherwise, you receive shards only.
                        </p>
                    </div>
                </section>

                {/* Clash Shards Economy */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Clash Shards Economy</h2>
                    <p>
                        <strong className="text-white">Clash Shards</strong> are KaspaClash's in-game currency. Earn shards through matches, quests, 
                        achievements, and tier unlocks. Spend them in the Shop to purchase cosmetics.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose mt-6">
                        <div className="bg-black/20 p-6 rounded-xl border border-emerald-500/30">
                            <h3 className="text-lg font-bold text-white mb-4 font-orbitron">💰 Earning Shards</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <span className="text-muted-foreground">Match Win</span>
                                    <span className="text-emerald-400 font-bold">50 + (10 × rounds won)</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <span className="text-muted-foreground">Match Loss</span>
                                    <span className="text-emerald-400 font-bold">25 + (10 × rounds won)</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <span className="text-muted-foreground">Easy Quest</span>
                                    <span className="text-emerald-400 font-bold">100</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <span className="text-muted-foreground">Medium Quest</span>
                                    <span className="text-emerald-400 font-bold">200</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <span className="text-muted-foreground">Hard Quest</span>
                                    <span className="text-emerald-400 font-bold">300</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-muted-foreground">Achievements</span>
                                    <span className="text-emerald-400 font-bold">100 × tier multiplier</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-4">
                                Achievement multipliers: Bronze 1×, Silver 2×, Gold 3×, Platinum 5×, Diamond 10×
                            </p>
                        </div>

                        <div className="bg-black/20 p-6 rounded-xl border border-purple-500/30">
                            <h3 className="text-lg font-bold text-white mb-4 font-orbitron">🛍️ Spending Shards</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Shop cosmetics</strong> – character skins, stickers, emotes</li>
                                <li>• <strong className="text-white">Victory poses</strong> – animated win celebrations</li>
                                <li>• <strong className="text-white">Profile badges</strong> – account flair and titles</li>
                                <li>• <strong className="text-white">Profile frames</strong> – decorative borders</li>
                            </ul>
                            <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/30 mt-4">
                                <p className="text-xs text-purple-200">
                                    Shop rotation changes weekly with featured items and discounts. Visit <strong>/shop</strong> to browse.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Prestige System */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Prestige System</h2>
                    <p>
                        Upon reaching <strong className="text-white">Tier 50</strong>, you unlock the ability to <strong className="text-white">Prestige</strong>. 
                        Prestiging resets your tier to 1 but grants permanent <strong className="text-white">compounding bonuses</strong> to XP and currency earnings.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose mt-6">
                        <div className="bg-gradient-to-br from-cyber-gold/20 to-transparent p-6 rounded-xl border border-cyber-gold/50">
                            <h3 className="text-lg font-bold text-white mb-4 font-orbitron">⚡ Prestige Bonuses</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start">
                                    <span className="text-cyber-gold mr-2">▸</span>
                                    <div>
                                        <strong className="text-white">Max Prestige Level:</strong> 
                                        <span className="text-muted-foreground ml-2">10</span>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-cyber-gold mr-2">▸</span>
                                    <div>
                                        <strong className="text-white">XP Multiplier:</strong> 
                                        <span className="text-muted-foreground ml-2">+10% per level (compounding)</span>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-cyber-gold mr-2">▸</span>
                                    <div>
                                        <strong className="text-white">Currency Multiplier:</strong> 
                                        <span className="text-muted-foreground ml-2">+10% per level (compounding)</span>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-cyber-gold mr-2">▸</span>
                                    <div>
                                        <strong className="text-white">Formula:</strong> 
                                        <code className="text-cyber-gold ml-2 text-xs">1.1^level</code>
                                    </div>
                                </li>
                            </ul>

                            <div className="bg-black/30 p-3 rounded-lg mt-4">
                                <p className="text-xs text-muted-foreground">
                                    <strong className="text-white">Example:</strong> Prestige 3 = 1.331× XP/shards (33.1% bonus). 
                                    Prestige 10 = 2.594× XP/shards (159.4% bonus).
                                </p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/20 to-transparent p-6 rounded-xl border border-purple-500/50">
                            <h3 className="text-lg font-bold text-white mb-4 font-orbitron">🎖️ Milestone Rewards</h3>
                            <div className="space-y-2 text-sm">
                                <div className="bg-amber-950/30 p-3 rounded-lg border border-amber-700/30">
                                    <strong className="text-amber-400">Prestige 1:</strong>
                                    <p className="text-xs text-muted-foreground mt-1">Bronze border + "Veteran" title</p>
                                </div>
                                <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-500/30">
                                    <strong className="text-slate-300">Prestige 3:</strong>
                                    <p className="text-xs text-muted-foreground mt-1">Silver border + aura effect + "Elite" title</p>
                                </div>
                                <div className="bg-yellow-950/30 p-3 rounded-lg border border-yellow-600/30">
                                    <strong className="text-yellow-400">Prestige 5:</strong>
                                    <p className="text-xs text-muted-foreground mt-1">Gold border + aura + "Master" title + exclusive skin</p>
                                </div>
                                <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-500/30">
                                    <strong className="text-cyan-400">Prestige 7:</strong>
                                    <p className="text-xs text-muted-foreground mt-1">Platinum border + aura + "Champion" title + cosmetics</p>
                                </div>
                                <div className="bg-blue-950/30 p-3 rounded-lg border border-blue-400/30">
                                    <strong className="text-blue-300">Prestige 10:</strong>
                                    <p className="text-xs text-muted-foreground mt-1">Diamond border + aura + "Legend" title + max rewards bundle</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30 mt-6">
                        <p className="text-sm text-red-200">
                            <strong>Warning:</strong> Prestiging resets your tier to 1 and requires re-unlocking all tiers. 
                            You keep all previously claimed rewards, but must earn XP again to reach tier 50.
                        </p>
                    </div>
                </section>

                {/* Tips & Strategy */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Tips & Strategy</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                        <div className="bg-emerald-500/10 p-6 rounded-xl border border-emerald-500/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">💡 Maximizing XP Gains</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Complete all daily quests</strong> – easy way to earn 500-1,500 XP per day</li>
                                <li>• <strong className="text-white">Focus on achievements</strong> – one-time XP rewards stack up quickly</li>
                                <li>• <strong className="text-white">Prestige when ready</strong> – bonuses compound, so earlier prestige = more total XP</li>
                                <li>• <strong className="text-white">Track your progress</strong> – check /battle-pass regularly to see tier status</li>
                            </ul>
                        </div>
                        <div className="bg-cyber-gold/10 p-6 rounded-xl border border-cyber-gold/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">💰 Shard Optimization</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Save shards early</strong> – shop rotations may have limited-time items</li>
                                <li>• <strong className="text-white">Prioritize hard quests</strong> – 300 shards per quest adds up</li>
                                <li>• <strong className="text-white">Diamond achievements</strong> – 1,000 shard rewards are worth the effort</li>
                                <li>• <strong className="text-white">Don't rush prestige</strong> – finish shop purchases before resetting tiers</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
