import React from 'react';

export function GamersBetting() {
    return (
        <div className="space-y-12">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                {/* Hero */}
                <div className="bg-gradient-to-br from-kaspa/10 via-transparent to-purple-500/10 p-8 rounded-xl border border-kaspa/30">
                    <h1 className="text-4xl font-bold text-cyber-gold mb-3 font-orbitron">Live Betting</h1>
                    <p className="text-lg text-cyber-gray">
                        Watch matches unfold in real-time and place <strong className="text-white">on-chain bets</strong> using KAS. Spectate, analyze, predict—then 
                        cash out when your fighter wins. Every bet is a <strong className="text-white">blockchain transaction</strong> with instant Kaspa confirmations (~1 second). 
                        Win big on player matches or grind 24/7 bot battles with fixed 2x odds.
                    </p>
                </div>

                {/* Overview */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">How Betting Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose">
                        <div className="bg-black/20 p-6 rounded-xl border border-kaspa/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">🎯 Spectate & Analyze</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Watch live matches</strong> - player vs player or bot battles</li>
                                <li>• <strong className="text-white">See HP/Energy bars</strong> - track fighter conditions in real-time</li>
                                <li>• <strong className="text-white">Check player stats</strong> - win rate, ELO rating, character tier</li>
                                <li>• <strong className="text-white">Live odds update</strong> - pool reacts to every bet placed</li>
                            </ul>
                        </div>
                        <div className="bg-black/20 p-6 rounded-xl border border-purple-500/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">💰 Place Your Bet</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Minimum 1 KAS</strong> - no maximum (high rollers welcome)</li>
                                <li>• <strong className="text-white">Send to vault</strong> - one transaction to betting pool address</li>
                                <li>• <strong className="text-white">Instant confirmation</strong> - Kaspa's ~1 second block time</li>
                                <li>• <strong className="text-white">0.1% fee</strong> - ultra-low house cut goes to treasury</li>
                            </ul>
                        </div>
                        <div className="bg-black/20 p-6 rounded-xl border border-cyber-gold/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">🏆 Win & Withdraw</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Match ends</strong> - winner determined by best-of-3 rounds</li>
                                <li>• <strong className="text-white">Auto-payout</strong> - backend calculates your share of the pool</li>
                                <li>• <strong className="text-white">Profit = odds × bet</strong> - dynamic odds based on pool distribution</li>
                                <li>• <strong className="text-white">Sent to your wallet</strong> - KAS arrives in 1-2 seconds</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Two Betting Modes */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Betting Modes</h2>
                    <p>
                        KaspaClash offers <strong className="text-white">3 distinct betting experiences</strong>: Player Matches (dynamic odds, parimutuel pools), 
                        P2P Player Betting (fixed 2x, challenge friends), and Bot Battles (fixed 2x odds, 24/7 availability). Choose your preferred style or mix all three for maximum action.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 not-prose">
                        <div className="bg-gradient-to-br from-purple-500/20 to-transparent p-6 rounded-xl border border-purple-500/50">
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-2">⚔️</div>
                                <h3 className="text-xl font-bold text-white font-orbitron">Player Matches (Parimutuel)</h3>
                                <p className="text-sm text-muted-foreground">Dynamic odds, unlimited upside</p>
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Dynamic odds</strong> - shift based on pool distribution</li>
                                <li>• <strong className="text-white">Underdog potential</strong> - bet small, win big if crowd is wrong</li>
                                <li>• <strong className="text-white">Pool-based payouts</strong> - winners split the total pool</li>
                                <li>• <strong className="text-white">Watch live gameplay</strong> - every punch, kick, and block in real-time</li>
                                <li>• <strong className="text-white">Betting window</strong> - open until final round starts</li>
                                <li>• <strong className="text-white">Higher variance</strong> - odds can be 1.2x or 5.0x depending on pool</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-cyan-500/20 to-transparent p-6 rounded-xl border border-cyan-500/50">
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-2">🤝</div>
                                <h3 className="text-xl font-bold text-white font-orbitron">P2P Player Betting</h3>
                                <p className="text-sm text-muted-foreground">Challenge friends, fixed 2x</p>
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Fixed 2x odds</strong> - winner takes all, loser gets nothing</li>
                                <li>• <strong className="text-white">Create/accept offers</strong> - set your own bet amount</li>
                                <li>• <strong className="text-white">Direct competition</strong> - prove you're the better predictor</li>
                                <li>• <strong className="text-white">Same fee as pools</strong> - 0.1% house cut</li>
                                <li>• <strong className="text-white">Challenge friends</strong> - settle rivalries with KAS</li>
                                <li>• <strong className="text-white">Medium variance</strong> - simple double-or-nothing</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-kaspa/20 to-transparent p-6 rounded-xl border border-kaspa/50">
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-2">🤖</div>
                                <h3 className="text-xl font-bold text-white font-orbitron">Bot Battles (House Model)</h3>
                                <p className="text-sm text-muted-foreground">Fixed 2x odds, 24/7 uptime</p>
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Fixed 2x odds</strong> - always double your bet on wins (before fee)</li>
                                <li>• <strong className="text-white">1% house fee</strong> - slightly higher cut for guaranteed odds</li>
                                <li>• <strong className="text-white">Always available</strong> - new match starts every ~2 minutes</li>
                                <li>• <strong className="text-white">30-second betting window</strong> - tight countdown before match starts</li>
                                <li>• <strong className="text-white">Auto-generated battles</strong> - bots use same combat engine as players</li>
                                <li>• <strong className="text-white">Lower variance</strong> - predictable returns, grind-friendly</li>
                            </ul>
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="bg-black/20 p-6 rounded-xl border border-white/10 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">📊 Quick Comparison</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/20">
                                        <th className="text-left text-cyber-gold py-2">Feature</th>
                                        <th className="text-center text-purple-400 py-2">Player Matches</th>
                                        <th className="text-center text-cyan-400 py-2">P2P Player Bets</th>
                                        <th className="text-center text-kaspa py-2">Bot Battles</th>
                                    </tr>
                                </thead>
                                <tbody className="text-muted-foreground">
                                    <tr className="border-b border-white/5">
                                        <td className="py-2 font-bold text-white">Odds System</td>
                                        <td className="text-center">Dynamic (Pool-based)</td>
                                        <td className="text-center">Fixed 2x</td>
                                        <td className="text-center">Fixed 2x</td>
                                    </tr>
                                    <tr className="border-b border-white/5">
                                        <td className="py-2 font-bold text-white">House Fee</td>
                                        <td className="text-center">0.1%</td>
                                        <td className="text-center">0.1%</td>
                                        <td className="text-center">1%</td>
                                    </tr>
                                    <tr className="border-b border-white/5">
                                        <td className="py-2 font-bold text-white">Betting Window</td>
                                        <td className="text-center">Until Final Round</td>
                                        <td className="text-center">Before Match Start</td>
                                        <td className="text-center">30 Seconds</td>
                                    </tr>
                                    <tr className="border-b border-white/5">
                                        <td className="py-2 font-bold text-white">Availability</td>
                                        <td className="text-center">When Players Queue</td>
                                        <td className="text-center">When Offers Exist</td>
                                        <td className="text-center">24/7</td>
                                    </tr>
                                    <tr className="border-b border-white/5">
                                        <td className="py-2 font-bold text-white">Potential Returns</td>
                                        <td className="text-center">1.05x - 10.0x+</td>
                                        <td className="text-center">2.0x (always)</td>
                                        <td className="text-center">2.0x (always)</td>
                                    </tr>
                                    <tr className="border-b border-white/5">
                                        <td className="py-2 font-bold text-white">Match Duration</td>
                                        <td className="text-center">3-10 minutes</td>
                                        <td className="text-center">3-10 minutes</td>
                                        <td className="text-center">1-2 minutes</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-bold text-white">Best For</td>
                                        <td className="text-center">High-stakes, skill reads</td>
                                        <td className="text-center">Rivalry, 1v1 challenges</td>
                                        <td className="text-center">Grinding, consistency</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* P2P Player Betting */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">P2P Wagering: Private Room Stakes</h2>
                    <p>
                        Create <strong className="text-white">private rooms with KAS stakes</strong> and challenge friends directly. Battle head-to-head with real money on the line—winner takes the pot, 
                        loser walks away empty. Perfect for settling rivalries or proving you're the superior fighter.
                    </p>

                    <div className="bg-gradient-to-br from-cyan-500/20 to-transparent p-6 rounded-xl border border-cyan-500/50 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">⚙️ How Private Room Wagering Works</h3>
                        <div className="space-y-4 text-sm text-muted-foreground">
                            <div>
                                <div className="text-white font-bold mb-2">1. Create Staked Room</div>
                                <p>Navigate to Matchmaking → Create Private Room → Set your stake amount (min 1 KAS). The system generates a unique <strong className="text-white">6-character room code</strong> that you 
                                can share with your opponent. Your room is locked until someone joins.</p>
                            </div>
                            <div>
                                <div className="text-white font-bold mb-2">2. Join & Deposit Stakes</div>
                                <p>Your opponent enters the room code and sees the stake requirement. Both players have <strong className="text-white">60 seconds</strong> to send their stake amount to the vault. 
                                If either player fails to deposit in time, the room expires and any confirmed deposits are refunded.</p>
                            </div>
                            <div>
                                <div className="text-white font-bold mb-2">3. Fight for the Pot</div>
                                <p>Once both stakes are confirmed on-chain, character selection begins. The match plays out normally (best-of-3 rounds). <strong className="text-white">No ELO changes</strong> in private rooms—this is pure wagering.</p>
                            </div>
                            <div>
                                <div className="text-white font-bold mb-2">4. Winner Takes All</div>
                                <p>The vault automatically sends <strong className="text-white">(2 × Stake Amount) - 0.1% fee</strong> to the winner. If you both bet 50 KAS, the winner gets 99.9 KAS back. 
                                Loser gets nothing—classic double-or-nothing.</p>
                            </div>
                        </div>
                    </div>

                    {/* Example Scenario */}
                    <div className="bg-black/20 p-6 rounded-xl border border-white/10 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">📋 Example: Challenge Your Friend</h3>
                        <div className="space-y-3 text-sm">
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyan-400 font-bold mb-2">Setup</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• <strong className="text-white">You</strong> create private room with 50 KAS stake</li>
                                    <li>• <strong className="text-white">Your friend</strong> joins room and deposits 50 KAS</li>
                                    <li>• Total pot: <strong className="text-white">100 KAS</strong> (locked in vault)</li>
                                    <li>• Fee: <strong className="text-white">0.1 KAS</strong> (0.1% of 100)</li>
                                    <li>• Net pot: <strong className="text-white">99.9 KAS</strong></li>
                                    <li>• Both pick characters and fight</li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyan-400 font-bold mb-2">You Win</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• Your payout: <strong className="text-white">99.9 KAS</strong></li>
                                    <li>• Your profit: <strong className="text-white">99.9 - 50 = 49.9 KAS</strong></li>
                                    <li>• Friend's loss: <strong className="text-white">50 KAS</strong></li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyan-400 font-bold mb-2">Friend Wins</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• Friend's payout: <strong className="text-white">99.9 KAS</strong></li>
                                    <li>• Friend's profit: <strong className="text-white">49.9 KAS</strong></li>
                                    <li>• Your loss: <strong className="text-white">50 KAS</strong></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Player Match Betting (Parimutuel) */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Player Matches: Parimutuel Betting</h2>
                    <p>
                        Bet on real human matches using <strong className="text-white">pool-based odds</strong>. All bets go into a shared pool, and winners split 
                        the total based on how much they wagered. If the crowd bets heavily on one fighter, backing the underdog can yield massive returns.
                    </p>

                    <div className="bg-gradient-to-br from-purple-500/20 to-transparent p-6 rounded-xl border border-purple-500/50 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">⚙️ How Odds Work</h3>
                        <div className="space-y-4 text-sm text-muted-foreground">
                            <div>
                                <div className="text-white font-bold mb-2">Formula: Odds = Total Pool ÷ Your Side's Pool</div>
                                <p>If Player 1 has 100 KAS bet on them and the total pool is 150 KAS, Player 1 backers get <strong className="text-white">1.5x odds</strong>. 
                                Player 2 (with 50 KAS) has <strong className="text-white">3.0x odds</strong> because 150 ÷ 50 = 3.0.</p>
                            </div>
                            <div>
                                <div className="text-white font-bold mb-2">Live Odds Updates</div>
                                <p>Every time someone bets, the pool rebalances and odds shift in real-time. If you bet early on an underdog and the crowd piles in later, 
                                your effective odds lock in higher than late bettors.</p>
                            </div>
                            <div>
                                <div className="text-white font-bold mb-2">Payout Calculation</div>
                                <p>Your payout = <strong className="text-white">(Your Net Bet × Total Pool) ÷ Winning Side Pool</strong>. Net bet = your bet minus 0.1% fee. 
                                If you bet 10 KAS on Player 2 and they win, your payout depends on how much total KAS was bet across both sides.</p>
                            </div>
                        </div>
                    </div>

                    {/* Example Scenario */}
                    <div className="bg-black/20 p-6 rounded-xl border border-white/10 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">📋 Example Scenario</h3>
                        <div className="space-y-3 text-sm">
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-2">Setup</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• Total pool: <strong className="text-white">200 KAS</strong></li>
                                    <li>• Player 1 pool: <strong className="text-white">150 KAS</strong> (75% of pool)</li>
                                    <li>• Player 2 pool: <strong className="text-white">50 KAS</strong> (25% of pool)</li>
                                    <li>• You bet: <strong className="text-white">10 KAS on Player 2</strong></li>
                                    <li>• Fee paid: <strong className="text-white">0.01 KAS</strong> (0.1% of 10)</li>
                                    <li>• Net bet: <strong className="text-white">9.99 KAS</strong></li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-2">Player 2 Wins</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• Your odds: <strong className="text-white">200 ÷ 50 = 4.0x</strong></li>
                                    <li>• Your payout: <strong className="text-white">(9.99 × 200) ÷ 50 = 39.96 KAS</strong></li>
                                    <li>• Your profit: <strong className="text-white">39.96 - 10 = 29.96 KAS</strong> (3x return)</li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-2">Player 1 Wins</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• You lose your <strong className="text-white">10 KAS bet</strong></li>
                                    <li>• Player 1 backers win at <strong className="text-white">1.33x odds</strong></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Betting Window */}
                    <div className="bg-gradient-to-br from-red-500/20 to-transparent p-6 rounded-xl border border-red-500/50 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">⏱️ Betting Window & Pool Lock</h3>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <div>
                                <div className="text-white font-bold mb-2">Open Phase</div>
                                <p>Pool opens when match enters character select phase. You can bet anytime during rounds 1 and 2. Odds update live as bets come in.</p>
                            </div>
                            <div>
                                <div className="text-white font-bold mb-2">Lock Trigger</div>
                                <p>Pool automatically <strong className="text-white">locks when final round (Round 3) starts</strong>. No more bets accepted. This prevents 
                                late bettors from exploiting obvious outcomes (e.g., one fighter at 5% HP).</p>
                            </div>
                            <div>
                                <div className="text-white font-bold mb-2">Final Odds</div>
                                <p>Once locked, odds freeze. Winners are calculated using the final pool distribution at lock time.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bot Battle Betting */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Bot Battles: House Model</h2>
                    <p>
                        When no player matches are available, bet on <strong className="text-white">24/7 automated bot vs bot matches</strong>. These battles use 
                        a <strong className="text-white">house model with fixed 2x odds</strong> and 1% fee. Simpler, faster, always online.
                    </p>

                    <div className="bg-gradient-to-br from-kaspa/20 to-transparent p-6 rounded-xl border border-kaspa/50 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">⚙️ How It Works</h3>
                        <div className="space-y-4 text-sm text-muted-foreground">
                            <div>
                                <div className="text-white font-bold mb-2">Fixed 2x Payout</div>
                                <p>Win = receive <strong className="text-white">exactly 2x your original bet</strong> (before fee). Bet 10 KAS, win 20 KAS. Simple math, 
                                no pool distribution complexity.</p>
                            </div>
                            <div>
                                <div className="text-white font-bold mb-2">1% Fee Structure</div>
                                <p>The house takes 1% of your bet upfront. So if you bet 10 KAS, <strong className="text-white">0.1 KAS goes to treasury</strong>, and your 
                                effective bet is 9.9 KAS. Win returns 20 KAS (your original amount doubled).</p>
                            </div>
                            <div>
                                <div className="text-white font-bold mb-2">30-Second Countdown</div>
                                <p>New bot match starts every ~2 minutes. When a match spawns, you have <strong className="text-white">30 seconds to place bets</strong> before 
                                the battle begins. Timer is visible in the betting panel.</p>
                            </div>
                            <div>
                                <div className="text-white font-bold mb-2">Pre-Computed Battles</div>
                                <p>Bot matches are <strong className="text-white">generated server-side before betting opens</strong>. All moves are pre-determined using 
                                the same combat engine as player matches. This ensures fairness—outcome isn't influenced by bet amounts.</p>
                            </div>
                        </div>
                    </div>

                    {/* Bot Betting Example */}
                    <div className="bg-black/20 p-6 rounded-xl border border-white/10 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">📋 Bot Betting Example</h3>
                        <div className="space-y-3 text-sm">
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-2">Your Bet</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• You bet: <strong className="text-white">10 KAS on Bot 1</strong></li>
                                    <li>• Fee (1%): <strong className="text-white">0.1 KAS</strong></li>
                                    <li>• Net amount: <strong className="text-white">9.9 KAS</strong></li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-2">Bot 1 Wins</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• Payout: <strong className="text-white">10 KAS × 2 = 20 KAS</strong></li>
                                    <li>• Profit: <strong className="text-white">20 - 10 = 10 KAS</strong></li>
                                    <li>• Effective return: <strong className="text-white">2.0x</strong> (before fee consideration)</li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-2">Bot 2 Wins</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• You lose: <strong className="text-white">10 KAS</strong></li>
                                    <li>• No refund or partial returns</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bot Match Cycle */}
                    <div className="bg-gradient-to-br from-orange-500/20 to-transparent p-6 rounded-xl border border-orange-500/50 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">🔁 Match Cycle</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-2">1. Match Spawns</div>
                                <p className="text-muted-foreground">Server generates new bot battle with pre-computed turns</p>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-2">2. Betting Opens</div>
                                <p className="text-muted-foreground">30-second countdown starts. Place bets on Bot 1 or Bot 2</p>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-2">3. Battle Plays</div>
                                <p className="text-muted-foreground">Match executes in ~60-90 seconds. Watch live or skip ahead</p>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg">
                                <div className="text-cyber-gold font-bold mb-2">4. Payouts</div>
                                <p className="text-muted-foreground">Winners get 2x payout sent to wallet. New match spawns immediately</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Betting Strategy */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Betting Strategy</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                        <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">🧠 Player Match Tips</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Check ELO ratings</strong> - higher rating = stronger player (usually)</li>
                                <li>• <strong className="text-white">Character tier matters</strong> - Legendary fighters have stat advantage</li>
                                <li>• <strong className="text-white">Watch HP/Energy</strong> - mid-match swings can shift odds dramatically</li>
                                <li>• <strong className="text-white">Bet underdogs early</strong> - lock in high odds before crowd realizes</li>
                                <li>• <strong className="text-white">Avoid heavy favorites</strong> - 1.2x odds rarely worth the risk</li>
                                <li>• <strong className="text-white">Pool lock awareness</strong> - final round = no more bets, plan ahead</li>
                            </ul>
                        </div>

                        <div className="bg-purple-500/10 p-6 rounded-xl border border-purple-500/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">⚡ Bot Battle Tips</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">50/50 odds always</strong> - both bots have equal chance (pre-computed)</li>
                                <li>• <strong className="text-white">Grind consistency</strong> - use bot battles to build bankroll steadily</li>
                                <li>• <strong className="text-white">Fast turnaround</strong> - new match every ~2 minutes, perfect for volume</li>
                                <li>• <strong className="text-white">No skill reads</strong> - purely RNG, don't overthink it</li>
                                <li>• <strong className="text-white">Lower ROI long-term</strong> - 1% fee higher than player matches (0.1%)</li>
                                <li>• <strong className="text-white">Great for downtime</strong> - bet while waiting for player matches</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Technical Details */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Technical Details</h2>
                    
                    <div className="bg-gradient-to-br from-kaspa/20 to-transparent p-6 rounded-xl border border-kaspa/50 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">⛓️ Blockchain Integration</h3>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <div>
                                <div className="text-white font-bold mb-2">Transaction Flow</div>
                                <ol className="space-y-2 list-decimal pl-5">
                                    <li>Click "Bet X KAS on Player/Bot Y" in spectator UI</li>
                                    <li>Kasware wallet opens with pre-filled transaction to vault address</li>
                                    <li>You approve, wallet broadcasts to Kaspa network</li>
                                    <li>Backend receives tx_id, validates transaction on-chain (~1 second)</li>
                                    <li>Bet recorded in database, pool updates, odds recalculate</li>
                                    <li>Real-time sync to all spectators via Supabase Realtime</li>
                                </ol>
                            </div>
                            <div>
                                <div className="text-white font-bold mb-2">Payout Automation</div>
                                <p>When a match ends, the backend automatically:</p>
                                <ol className="space-y-2 list-decimal pl-5 mt-2">
                                    <li>Identifies winner (player1/player2 or bot1/bot2)</li>
                                    <li>Fetches all confirmed bets from pool</li>
                                    <li>Calculates payouts using odds formula (player) or 2x (bot)</li>
                                    <li>Sends batch transaction from vault to all winners</li>
                                    <li>Updates bet status to "won" with payout_tx_id and amount</li>
                                </ol>
                            </div>
                            <div>
                                <div className="text-white font-bold mb-2">Network Detection</div>
                                <p>The system auto-detects your wallet's network (mainnet or testnet) and uses the appropriate vault address. Testnet bets use 
                                kaspatest: addresses, mainnet uses kaspa: addresses.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/20 p-6 rounded-xl border border-white/10 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">🔐 Security & Fairness</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-cyber-gold font-bold mb-2">Player Matches</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• <strong className="text-white">Live combat engine</strong> - same code as actual gameplay</li>
                                    <li>• <strong className="text-white">Pool lock</strong> - prevents exploiting final round outcomes</li>
                                    <li>• <strong className="text-white">On-chain verification</strong> - all bets recorded with tx_id</li>
                                </ul>
                            </div>
                            <div>
                                <div className="text-cyber-gold font-bold mb-2">Bot Battles</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• <strong className="text-white">Pre-computed turns</strong> - outcome decided before betting opens</li>
                                    <li>• <strong className="text-white">Server-side generation</strong> - no client manipulation possible</li>
                                    <li>• <strong className="text-white">Deterministic engine</strong> - same moves = same result every time</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Important Info */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Important Information</h2>
                    <div className="space-y-4 not-prose">
                        <div className="bg-yellow-500/10 p-6 rounded-xl border border-yellow-500/30">
                            <h3 className="text-lg font-bold text-white mb-2 font-orbitron">⚠️ Minimum Bet & Limits</h3>
                            <p className="text-sm text-muted-foreground">
                                Minimum bet is <strong className="text-white">1 KAS</strong>. No maximum—bet as much as you want. However, betting enormous amounts 
                                on player matches will shift odds against you (you become the favorite with low returns).
                            </p>
                        </div>

                        <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/30">
                            <h3 className="text-lg font-bold text-white mb-2 font-orbitron">🚨 Risk Warning</h3>
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-white">Betting involves real cryptocurrency</strong>. You can lose your entire bet. House always has an edge 
                                (0.1% on player matches, 1% on bot battles). Never bet more than you can afford to lose. This is entertainment, not investment.
                            </p>
                        </div>

                        <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/30">
                            <h3 className="text-lg font-bold text-white mb-2 font-orbitron">💼 Treasury Fee</h3>
                            <p className="text-sm text-muted-foreground">
                                All betting fees go to the <strong className="text-white">KaspaClash Community Treasury</strong>. The treasury automatically distributes 
                                funds every Monday to top leaderboard players and supports ongoing development.
                            </p>
                        </div>

                        <div className="bg-green-500/10 p-6 rounded-xl border border-green-500/30">
                            <h3 className="text-lg font-bold text-white mb-2 font-orbitron">✅ No Double-Dipping</h3>
                            <p className="text-sm text-muted-foreground">
                                You <strong className="text-white">cannot bet on your own matches</strong>. The system prevents active players from placing bets on 
                                matches they're participating in. This ensures fairness and prevents collusion.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
