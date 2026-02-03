import React from 'react';

export function GamersTreasury() {
    return (
        <div className="space-y-8">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-cyber-gold/10 to-cyber-blue/10 p-8 rounded-2xl border border-cyber-gold/30 mb-8">
                    <h2 className="text-3xl text-cyber-gold mb-4 mt-0">Community Treasury</h2>
                    <p className="text-lg leading-relaxed mb-0">
                        KaspaClash operates a <strong>fully automated, decentralized reward pool</strong> that distributes real KAS cryptocurrency to top players every week. The Treasury is funded by betting fees and cosmetic purchases, creating a sustainable player-driven economy where <strong>skill directly translates to earnings</strong>.
                    </p>
                </div>

                {/* Weekly Distribution Overview */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Weekly Distribution Schedule</h3>
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl">📅</div>
                        <div>
                            <div className="text-xl font-bold text-white">Every Monday at 00:00 UTC</div>
                            <div className="text-sm text-muted-foreground">Fully automated on-chain distribution</div>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-0">
                        The treasury automatically processes payouts via Kaspa blockchain transactions. No manual intervention—just pure, trustless distribution based on your performance.
                    </p>
                </div>

                {/* Distribution Breakdown */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">How the Treasury is Split</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 not-prose">
                    {/* PvP Pool */}
                    <div className="bg-gradient-to-br from-cyber-gold/20 to-transparent p-6 rounded-xl border border-cyber-gold/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 text-9xl opacity-5 -mr-8 -mt-4">⚔️</div>
                        <div className="relative z-10">
                            <div className="text-4xl mb-2 font-bold text-cyber-gold">40%</div>
                            <h3 className="text-lg font-bold font-orbitron text-white mb-2">Top 10 PvP Players</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Ranked by <strong className="text-cyber-gold">ELO rating</strong> on the global leaderboard.
                            </p>
                            <div className="text-xs text-cyber-gold/80 bg-black/30 px-3 py-2 rounded">
                                Rank #1 gets 20% of the pool<br />
                                Rank #10 gets 2% of the pool
                            </div>
                        </div>
                    </div>

                    {/* Survival Pool */}
                    <div className="bg-gradient-to-br from-cyber-blue/20 to-transparent p-6 rounded-xl border border-cyber-blue/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 text-9xl opacity-5 -mr-8 -mt-4">🌊</div>
                        <div className="relative z-10">
                            <div className="text-4xl mb-2 font-bold text-cyber-gold">40%</div>
                            <h3 className="text-lg font-bold font-orbitron text-white mb-2">Top 10 Survival Players</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Ranked by <strong className="text-cyber-blue">highest wave reached</strong> in Survival mode.
                            </p>
                            <div className="text-xs text-cyber-blue/80 bg-black/30 px-3 py-2 rounded">
                                Rank #1 gets 20% of the pool<br />
                                Rank #10 gets 2% of the pool
                            </div>
                        </div>
                    </div>

                    {/* Dev Fund */}
                    <div className="bg-gradient-to-br from-white/5 to-transparent p-6 rounded-xl border border-sidebar-border relative overflow-hidden">
                        <div className="absolute top-0 right-0 text-9xl opacity-5 -mr-8 -mt-4">🛠️</div>
                        <div className="relative z-10">
                            <div className="text-4xl mb-2 font-bold text-muted-foreground">20%</div>
                            <h3 className="text-lg font-bold font-orbitron text-white mb-2">Development Fund</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Supports ongoing server costs, new features, and game updates.
                            </p>
                            <div className="text-xs text-muted-foreground bg-black/30 px-3 py-2 rounded">
                                Ensures long-term sustainability
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weighted Distribution Explanation */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Rank-Based Weighting System</h3>
                <p>
                    Rewards are <strong>not split equally</strong>—higher ranks earn significantly more. Each rank is assigned a <strong>share weight</strong>, and your payout is calculated as:
                </p>
                <div className="bg-black/40 p-6 rounded-xl border border-cyber-gold/30 my-6">
                    <div className="font-mono text-sm text-center mb-4">
                        <div className="text-cyber-gold text-lg mb-2">Payout Formula</div>
                        <div className="text-white">Your Payout = (Pool Amount × Your Share Weight) ÷ Total Share Weights</div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                        If you're Rank #1, your share weight is <strong className="text-cyber-gold">20</strong>. With 10 players competing, total shares = 100, so you get <strong className="text-cyber-gold">20%</strong> of the pool.
                    </div>
                </div>

                {/* Share Weights Table */}
                <div className="overflow-x-auto my-6 not-prose">
                    <table className="w-full border-collapse bg-black/20 rounded-xl overflow-hidden">
                        <thead>
                            <tr className="bg-cyber-gold/20 border-b border-cyber-gold/30">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-cyber-gold">Rank</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-cyber-gold">Share Weight</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-cyber-gold">% of Pool (10 Players)</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-cyber-gold">% of Pool (2 Players)</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-semibold text-white">1st</td>
                                <td className="px-4 py-3 text-muted-foreground">20 shares</td>
                                <td className="px-4 py-3 text-cyber-gold font-bold">20%</td>
                                <td className="px-4 py-3 text-cyber-gold font-bold">55.6%</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-semibold text-white">2nd</td>
                                <td className="px-4 py-3 text-muted-foreground">16 shares</td>
                                <td className="px-4 py-3 text-cyber-gold">16%</td>
                                <td className="px-4 py-3 text-cyber-gold">44.4%</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-semibold text-white">3rd</td>
                                <td className="px-4 py-3 text-muted-foreground">14 shares</td>
                                <td className="px-4 py-3 text-muted-foreground">14%</td>
                                <td className="px-4 py-3 text-muted-foreground">—</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-semibold text-white">4th</td>
                                <td className="px-4 py-3 text-muted-foreground">12 shares</td>
                                <td className="px-4 py-3 text-muted-foreground">12%</td>
                                <td className="px-4 py-3 text-muted-foreground">—</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-semibold text-white">5th</td>
                                <td className="px-4 py-3 text-muted-foreground">10 shares</td>
                                <td className="px-4 py-3 text-muted-foreground">10%</td>
                                <td className="px-4 py-3 text-muted-foreground">—</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-semibold text-white">6th</td>
                                <td className="px-4 py-3 text-muted-foreground">9 shares</td>
                                <td className="px-4 py-3 text-muted-foreground">9%</td>
                                <td className="px-4 py-3 text-muted-foreground">—</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-semibold text-white">7th</td>
                                <td className="px-4 py-3 text-muted-foreground">7 shares</td>
                                <td className="px-4 py-3 text-muted-foreground">7%</td>
                                <td className="px-4 py-3 text-muted-foreground">—</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-semibold text-white">8th</td>
                                <td className="px-4 py-3 text-muted-foreground">6 shares</td>
                                <td className="px-4 py-3 text-muted-foreground">6%</td>
                                <td className="px-4 py-3 text-muted-foreground">—</td>
                            </tr>
                            <tr className="border-b border-sidebar-border hover:bg-white/5">
                                <td className="px-4 py-3 font-semibold text-white">9th</td>
                                <td className="px-4 py-3 text-muted-foreground">4 shares</td>
                                <td className="px-4 py-3 text-muted-foreground">4%</td>
                                <td className="px-4 py-3 text-muted-foreground">—</td>
                            </tr>
                            <tr className="hover:bg-white/5">
                                <td className="px-4 py-3 font-semibold text-white">10th</td>
                                <td className="px-4 py-3 text-muted-foreground">2 shares</td>
                                <td className="px-4 py-3 text-muted-foreground">2%</td>
                                <td className="px-4 py-3 text-muted-foreground">—</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="bg-cyber-blue/10 p-6 rounded-xl border border-cyber-blue/30 my-6">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">💡</div>
                        <div>
                            <div className="font-semibold text-white mb-2">Dynamic Scaling</div>
                            <p className="text-sm text-muted-foreground mb-0">
                                If fewer than 10 players qualify, the shares are <strong>recalculated proportionally</strong> to ensure <strong className="text-cyber-gold">100% of the pool is always distributed</strong>. For example, with only 2 players, Rank #1 gets 55.6% and Rank #2 gets 44.4%.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Example Calculation */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Example Payout Calculation</h3>
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border mb-6">
                    <div className="text-lg font-semibold text-white mb-4">Scenario: 500 KAS Treasury Balance</div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Treasury Balance:</span>
                            <span className="text-white font-mono">500 KAS</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Minimum Reserve (10 KAS):</span>
                            <span className="text-white font-mono">-10 KAS</span>
                        </div>
                        <div className="border-t border-sidebar-border pt-2 mt-2 flex justify-between items-center">
                            <span className="text-white font-semibold">Distributable Amount:</span>
                            <span className="text-cyber-gold font-mono font-bold">490 KAS</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="bg-black/40 p-4 rounded-lg border border-cyber-gold/30">
                            <div className="text-xs text-cyber-gold mb-2 uppercase font-semibold">PvP Pool (40%)</div>
                            <div className="text-2xl text-white font-bold">196 KAS</div>
                            <div className="text-xs text-muted-foreground mt-2">Split among top 10 ELO players:</div>
                            <div className="mt-3 space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Rank #1 (20%):</span>
                                    <span className="text-cyber-gold font-mono font-bold">39.2 KAS</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Rank #2 (16%):</span>
                                    <span className="text-white font-mono">31.36 KAS</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Rank #10 (2%):</span>
                                    <span className="text-white font-mono">3.92 KAS</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/40 p-4 rounded-lg border border-cyber-blue/30">
                            <div className="text-xs text-cyber-blue mb-2 uppercase font-semibold">Survival Pool (40%)</div>
                            <div className="text-2xl text-white font-bold">196 KAS</div>
                            <div className="text-xs text-muted-foreground mt-2">Split among top 10 Survival players:</div>
                            <div className="mt-3 space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Rank #1 (20%):</span>
                                    <span className="text-cyber-blue font-mono font-bold">39.2 KAS</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Rank #2 (16%):</span>
                                    <span className="text-white font-mono">31.36 KAS</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Rank #10 (2%):</span>
                                    <span className="text-white font-mono">3.92 KAS</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 p-4 rounded-lg border border-sidebar-border mt-4">
                        <div className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Development Fund (20%)</div>
                        <div className="text-xl text-white font-bold">98 KAS</div>
                    </div>
                </div>

                {/* Treasury Funding Sources */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">How the Treasury Gets Funded</h3>
                <p>
                    The treasury accumulates KAS from two primary sources, creating a <strong>player-driven economy</strong>:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 not-prose">
                    {/* Betting Fees */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-transparent p-6 rounded-xl border border-purple-500/30">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-3xl">🎲</div>
                            <div>
                                <h3 className="text-lg font-bold font-orbitron text-white mb-0">Betting Fees</h3>
                                <div className="text-xs text-purple-400">0.1% on Player Matches</div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                            Every bet placed on <strong>player matches</strong> contributes a tiny 0.1% fee to the treasury. With thousands of bets weekly, this adds up fast.
                        </p>
                        <div className="text-xs text-muted-foreground bg-black/30 px-3 py-2 rounded">
                            Example: A 100 KAS bet contributes <strong className="text-purple-400">0.1 KAS</strong> to the treasury.
                        </div>
                    </div>

                    {/* Cosmetic Purchases */}
                    <div className="bg-gradient-to-br from-pink-500/10 to-transparent p-6 rounded-xl border border-pink-500/30">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-3xl">🎨</div>
                            <div>
                                <h3 className="text-lg font-bold font-orbitron text-white mb-0">Cosmetic NFTs</h3>
                                <div className="text-xs text-pink-400">1 KAS per purchase</div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                            When you buy a cosmetic from the shop, you send <strong>1 KAS to the treasury vault</strong> with NFT metadata attached. This inscribes your cosmetic on-chain.
                        </p>
                        <div className="text-xs text-muted-foreground bg-black/30 px-3 py-2 rounded">
                            You spend <strong className="text-pink-400">Clash Shards</strong> in-game, but the NFT mint costs <strong className="text-pink-400">1 KAS</strong> from your wallet.
                        </div>
                    </div>
                </div>

                <div className="bg-yellow-500/10 p-6 rounded-xl border border-yellow-500/30 my-6">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                            <div className="font-semibold text-yellow-400 mb-2">Minimum Reserve Protection</div>
                            <p className="text-sm text-muted-foreground mb-0">
                                The treasury <strong>always keeps at least 10 KAS in reserve</strong> to cover transaction fees for future distributions. This ensures uninterrupted weekly payouts even during low-activity periods.
                            </p>
                        </div>
                    </div>
                </div>

                {/* On-Chain Verification vs Treasury Funding */}
                <div className="bg-cyan-500/10 p-6 rounded-xl border border-cyan-500/30 my-6">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">ℹ️</div>
                        <div>
                            <div className="font-semibold text-cyan-400 mb-3">What Actually Funds the Treasury?</div>
                            <p className="text-sm text-muted-foreground mb-3">
                                KaspaClash uses <strong>1 KAS transactions</strong> throughout the game for on-chain verification, but <strong>not all of these fund the treasury</strong>. Here's the breakdown:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
                                    <div className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                                        <span>✅</span>
                                        <span>Funds Treasury</span>
                                    </div>
                                    <ul className="space-y-1 text-muted-foreground text-xs">
                                        <li>• <strong className="text-purple-400">Betting Fees</strong>: 0.1% → Treasury</li>
                                        <li>• <strong className="text-pink-400">Cosmetic NFTs</strong>: 1 KAS → Treasury</li>
                                    </ul>
                                </div>
                                <div className="bg-black/30 p-4 rounded-lg border border-blue-500/30">
                                    <div className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                                        <span>🔄</span>
                                        <span>Self-Send (Proof Only)</span>
                                    </div>
                                    <ul className="space-y-1 text-muted-foreground text-xs">
                                        <li>• <strong className="text-blue-400">Match Moves</strong>: 1 KAS → Your Wallet</li>
                                        <li>• <strong className="text-blue-400">Power Surge Picks</strong>: 1 KAS → Your Wallet</li>
                                        <li>• <strong className="text-blue-400">Survival Records</strong>: 1 KAS → Your Wallet</li>
                                    </ul>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 mb-0">
                                <strong className="text-cyan-400">Why the self-sends?</strong> These transactions create <strong>immutable on-chain proof</strong> of your actions (moves, card picks, survival waves). You're essentially paying a small gas fee to Kaspa to timestamp your gameplay on the blockchain—ensuring provable fairness without relying on centralized servers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Blockchain Technology */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">On-Chain Distribution Technology</h3>
                <p>
                    Distributions are executed via <strong>Kaspa blockchain transactions</strong>, ensuring full transparency and immutability. No middlemen, no delays—just pure decentralized automation.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-sidebar-border">
                        <div className="text-lg font-semibold text-white mb-2">⚡ Fast Confirmations</div>
                        <p className="text-sm text-muted-foreground mb-0">
                            Kaspa's <strong>~1 second block time</strong> means you receive your payout almost instantly after the distribution runs.
                        </p>
                    </div>
                    <div className="bg-black/40 p-5 rounded-xl border border-sidebar-border">
                        <div className="text-lg font-semibold text-white mb-2">🔗 Chained Batch Transactions</div>
                        <p className="text-sm text-muted-foreground mb-0">
                            All 20 player payouts + dev fund are sent in a <strong>single chained batch</strong>, maximizing reliability and minimizing fees.
                        </p>
                    </div>
                    <div className="bg-black/40 p-5 rounded-xl border border-sidebar-border">
                        <div className="text-lg font-semibold text-white mb-2">🔍 Full Transparency</div>
                        <p className="text-sm text-muted-foreground mb-0">
                            Every distribution is <strong>verifiable on the Kaspa blockchain</strong>. Check your transaction ID on the Kaspa Explorer to confirm your payout.
                        </p>
                    </div>
                    <div className="bg-black/40 p-5 rounded-xl border border-sidebar-border">
                        <div className="text-lg font-semibold text-white mb-2">🔐 Non-Custodial</div>
                        <p className="text-sm text-muted-foreground mb-0">
                            Funds go <strong>directly to your wallet address</strong>. You have full control—KaspaClash never holds your KAS.
                        </p>
                    </div>
                </div>

                {/* Tips for Maximizing Earnings */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">How to Maximize Your Earnings</h3>
                
                <div className="space-y-4 my-6">
                    <div className="bg-gradient-to-r from-cyber-gold/20 to-transparent p-5 rounded-xl border-l-4 border-cyber-gold">
                        <div className="font-semibold text-white mb-2">🎯 Climb the PvP Leaderboard</div>
                        <p className="text-sm text-muted-foreground mb-0">
                            Focus on <strong>ELO rating gains</strong>. Win matches consistently to break into the Top 10 and secure your share of the 40% PvP pool. Remember: Rank #1 earns <strong>10x more</strong> than Rank #10.
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-cyber-blue/20 to-transparent p-5 rounded-xl border-l-4 border-cyber-blue">
                        <div className="font-semibold text-white mb-2">🌊 Dominate Survival Mode</div>
                        <p className="text-sm text-muted-foreground mb-0">
                            Push for <strong>wave milestones</strong> in Survival mode. The top 10 highest wave clears split the 40% Survival pool. Practice your builds and master enemy patterns.
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500/20 to-transparent p-5 rounded-xl border-l-4 border-purple-500">
                        <div className="font-semibold text-white mb-2">📊 Track Weekly Cutoffs</div>
                        <p className="text-sm text-muted-foreground mb-0">
                            Monitor the leaderboards throughout the week. If you're close to breaking into Top 10, grind those last few matches before Monday 00:00 UTC.
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-pink-500/20 to-transparent p-5 rounded-xl border-l-4 border-pink-500">
                        <div className="font-semibold text-white mb-2">💰 Consistency Wins</div>
                        <p className="text-sm text-muted-foreground mb-0">
                            Even Rank #10 earns real KAS. Stay active, maintain your ranking, and <strong>accumulate passive income</strong> over months. Small weekly payouts compound into significant earnings.
                        </p>
                    </div>
                </div>

                {/* FAQ Section */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Common Questions</h3>

                <div className="space-y-4">
                    <details className="bg-black/40 p-5 rounded-xl border border-sidebar-border cursor-pointer hover:border-cyber-gold/50 transition-colors">
                        <summary className="font-semibold text-white cursor-pointer">
                            When exactly do payouts happen?
                        </summary>
                        <p className="text-sm text-muted-foreground mt-3 mb-0">
                            Every <strong>Monday at 00:00 UTC</strong>. The distribution runs automatically via a cron job, and transactions are broadcast to the Kaspa network within minutes. Check your wallet balance shortly after midnight UTC on Mondays.
                        </p>
                    </details>

                    <details className="bg-black/40 p-5 rounded-xl border border-sidebar-border cursor-pointer hover:border-cyber-gold/50 transition-colors">
                        <summary className="font-semibold text-white cursor-pointer">
                            What if there are fewer than 10 players?
                        </summary>
                        <p className="text-sm text-muted-foreground mt-3 mb-0">
                            The system <strong>dynamically recalculates share weights</strong> to ensure 100% of the pool is distributed. For example, with only 3 players, they collectively receive the full 40% PvP or Survival pool, just with adjusted percentages.
                        </p>
                    </details>

                    <details className="bg-black/40 p-5 rounded-xl border border-sidebar-border cursor-pointer hover:border-cyber-gold/50 transition-colors">
                        <summary className="font-semibold text-white cursor-pointer">
                            Can I compete in both PvP and Survival?
                        </summary>
                        <p className="text-sm text-muted-foreground mt-3 mb-0">
                            <strong>Absolutely!</strong> If you rank in the Top 10 for <em>both</em> leaderboards, you'll receive payouts from <em>both</em> pools. Maximize your earnings by excelling in multiple modes.
                        </p>
                    </details>

                    <details className="bg-black/40 p-5 rounded-xl border border-sidebar-border cursor-pointer hover:border-cyber-gold/50 transition-colors">
                        <summary className="font-semibold text-white cursor-pointer">
                            How do I know my payout was successful?
                        </summary>
                        <p className="text-sm text-muted-foreground mt-3 mb-0">
                            Check your <strong>Kaspa wallet balance</strong> and transaction history. Every payout includes a transaction ID that you can verify on the <strong>Kaspa Explorer</strong> for full transparency.
                        </p>
                    </details>

                    <details className="bg-black/40 p-5 rounded-xl border border-sidebar-border cursor-pointer hover:border-cyber-gold/50 transition-colors">
                        <summary className="font-semibold text-white cursor-pointer">
                            What happens if the treasury balance is low?
                        </summary>
                        <p className="text-sm text-muted-foreground mt-3 mb-0">
                            The treasury requires a <strong>minimum of 10 KAS</strong> to trigger distribution (to cover transaction fees). If the balance is below this threshold, the distribution is skipped that week, and the balance rolls over to the next week.
                        </p>
                    </details>

                    <details className="bg-black/40 p-5 rounded-xl border border-sidebar-border cursor-pointer hover:border-cyber-gold/50 transition-colors">
                        <summary className="font-semibold text-white cursor-pointer">
                            Is the treasury controlled by the devs?
                        </summary>
                        <p className="text-sm text-muted-foreground mt-3 mb-0">
                            <strong>No.</strong> The treasury is a <strong>decentralized vault</strong> with automated weekly distributions. All transactions are executed on-chain via smart contract logic. The dev fund (20%) is the only centralized allocation, used strictly for server costs and development.
                        </p>
                    </details>
                </div>

                {/* Final CTA */}
                <div className="bg-gradient-to-br from-cyber-gold/20 to-cyber-blue/20 p-8 rounded-2xl border border-cyber-gold/50 mt-12">
                    <h3 className="text-2xl text-cyber-gold mb-4 mt-0">Ready to Earn?</h3>
                    <p className="text-muted-foreground mb-4">
                        The treasury rewards <strong>consistent skill and dedication</strong>. Every match you play, every wave you clear, every bet you place contributes to the ecosystem. Climb the ranks, dominate the leaderboards, and <strong>turn your gameplay into real cryptocurrency earnings</strong>.
                    </p>
                    <div className="text-sm text-cyber-gold font-semibold">
                        Next distribution: Every Monday at 00:00 UTC
                    </div>
                </div>
            </div>
        </div>
    );
}
