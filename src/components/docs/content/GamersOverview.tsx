import React from 'react';

export function GamersOverview() {
    return (
        <div className="space-y-12">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-cyber-gold/10 via-transparent to-blue-500/10 p-8 rounded-xl border border-cyber-gold/30 mb-12">
                    <h1 className="text-4xl font-bold text-cyber-gold mb-4 font-orbitron">Welcome to KaspaClash</h1>
                    <p className="lead text-xl text-cyber-gray mb-4">
                        The world's first <strong className="text-cyber-gold">real-time blockchain fighting game</strong> powered by Kaspa's revolutionary BlockDAG architecture. 
                        Experience competitive PvP combat where <strong className="text-white">every move is a real blockchain transaction</strong> confirmed in ~1 second—not optimistic UI, genuine on-chain verification.
                    </p>
                    <p className="text-base text-muted-foreground">
                        KaspaClash demonstrates the true potential of blockchain gaming through sub-second transaction confirmations, 
                        competitive matchmaking, live spectator betting, and a comprehensive progression system—all secured by the Kaspa network. 
                        The game fully supports both <strong className="text-white">Kaspa Mainnet</strong> and <strong className="text-white">Testnet-10</strong> for a seamless transition from practice to high-stakes combat.
                    </p>
                </div>

                {/* What Makes KaspaClash Revolutionary */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">What Makes KaspaClash Revolutionary?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose mb-8">
                        <div className="bg-sidebar-accent/30 p-6 rounded-lg border border-sidebar-border hover:border-cyber-gold/50 transition-colors group">
                            <h3 className="text-lg font-bold font-orbitron text-cyber-gold mb-3 group-hover:text-white transition-colors">⚡ True Real-Time Blockchain Combat</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Unlike traditional blockchain games that use optimistic updates or off-chain computation, KaspaClash actually waits for each move to be 
                                <strong className="text-white"> confirmed in a block before execution</strong>. Kaspa's 10 BPS (100ms blocks) enables ~1 second confirmations—faster than 
                                most blockchains can even broadcast transactions. Every punch, kick, and block is verifiable on-chain.
                            </p>
                        </div>
                        <div className="bg-sidebar-accent/30 p-6 rounded-lg border border-sidebar-border hover:border-cyber-gold/50 transition-colors group">
                            <h3 className="text-lg font-bold font-orbitron text-cyber-gold mb-3 group-hover:text-white transition-colors">🎯 ELO-Based Competitive Matchmaking</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Fair, skill-based matchmaking using a traditional ELO rating system (1000-3000 range). Queue times are optimized with a <strong className="text-white">30-second Smart Bot failover</strong>—if 
                                no human opponent is found, you're paired with an AI tuned to your skill level. Private rooms support custom matches with optional KAS wagering.
                            </p>
                        </div>
                        <div className="bg-sidebar-accent/30 p-6 rounded-lg border border-sidebar-border hover:border-cyber-gold/50 transition-colors group">
                            <h3 className="text-lg font-bold font-orbitron text-cyber-gold mb-3 group-hover:text-white transition-colors">💰 Live Spectator Betting Ecosystem</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Watch high-stakes matches unfold in real-time and place bets using KAS. Betting pools update live as the match progresses, with <strong className="text-white">instant transaction confirmations</strong> and 
                                automated payouts. Bot matches run 24/7 with fixed 2x odds and a transparent 1% house fee—perfect for continuous action.
                            </p>
                        </div>
                        <div className="bg-sidebar-accent/30 p-6 rounded-lg border border-sidebar-border hover:border-cyber-gold/50 transition-colors group">
                            <h3 className="text-lg font-bold font-orbitron text-cyber-gold mb-3 group-hover:text-white transition-colors">🏆 Comprehensive Progression System</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Advance through a <strong className="text-white">50-tier seasonal Battle Pass</strong> by earning XP from matches, daily quests, and achievements. Unlock cosmetic NFTs, 
                                earn Clash Shards currency, and prestige for permanent multipliers. 60+ achievements across 5 categories reward mastery and dedication.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Game Modes */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Game Modes</h2>
                    
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-6 rounded-lg border-l-4 border-blue-500">
                            <h3 className="text-xl font-bold text-white mb-2 font-orbitron">🎮 Ranked Matchmaking</h3>
                            <p className="text-muted-foreground mb-3">
                                Competitive 1v1 matches with ELO-based pairing. Climb the global leaderboard by defeating opponents near your skill level. 
                                Each victory increases your rating, each loss decreases it. Top players receive weekly KAS payouts from the treasury vault.
                            </p>
                            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                                <li><strong className="text-white">Best-of-3 rounds:</strong> First to win 2 rounds claims victory</li>
                                <li><strong className="text-white">Strategic Ban & Pick:</strong> Ban one character, blind pick your fighter</li>
                                <li><strong className="text-white">Smart matchmaking:</strong> Paired with similar skill players within 30 seconds, or matched AI</li>
                                <li><strong className="text-white">ELO adjustments:</strong> Rating changes based on opponent strength and match outcome</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-r from-purple-500/10 to-transparent p-6 rounded-lg border-l-4 border-purple-500">
                            <h3 className="text-xl font-bold text-white mb-2 font-orbitron">🚪 Private Rooms</h3>
                            <p className="text-muted-foreground mb-3">
                                Create custom lobbies with 6-character room codes. Challenge friends directly with optional <strong className="text-white">P2P KAS wagering</strong>. 
                                Private matches don't affect ELO ratings, making them perfect for practice or friendly competition.
                            </p>
                            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                                <li><strong className="text-white">Stake matches:</strong> Both players deposit KAS; winner takes 2x stake minus 0.1% fee</li>
                                <li><strong className="text-white">Casual play:</strong> Zero stakes for friendly sparring sessions</li>
                                <li><strong className="text-white">Custom rules:</strong> Same combat mechanics, full character roster access</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-r from-green-500/10 to-transparent p-6 rounded-lg border-l-4 border-green-500">
                            <h3 className="text-xl font-bold text-white mb-2 font-orbitron">🥋 Practice Mode</h3>
                            <p className="text-muted-foreground mb-3">
                                Train offline against a local AI without blockchain transactions. Perfect for learning character movesets, testing strategies, 
                                or warming up before ranked play. No wallet connection required.
                            </p>
                            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                                <li><strong className="text-white">Instant matches:</strong> No queue, no blockchain—pure gameplay</li>
                                <li><strong className="text-white">Character exploration:</strong> Try all 20 fighters with their unique stats</li>
                                <li><strong className="text-white">Power Surge testing:</strong> Experience all 15 card effects</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-r from-red-500/10 to-transparent p-6 rounded-lg border-l-4 border-red-500">
                            <h3 className="text-xl font-bold text-white mb-2 font-orbitron">🌊 Survival Mode</h3>
                            <p className="text-muted-foreground mb-3">
                                Endless wave-based challenge with escalating difficulty. Fight increasingly powerful AI opponents to test your endurance and skill. 
                                Compete for top spots on the survival leaderboard.
                            </p>
                            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                                <li><strong className="text-white">Progressive difficulty:</strong> Each wave brings tougher enemies</li>
                                <li><strong className="text-white">Leaderboard glory:</strong> Track your best runs against global players</li>
                                <li><strong className="text-white">Skill mastery:</strong> Earn XP and achievements for deep runs</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-r from-yellow-500/10 to-transparent p-6 rounded-lg border-l-4 border-yellow-500">
                            <h3 className="text-xl font-bold text-white mb-2 font-orbitron">👁️ Spectator Mode</h3>
                            <p className="text-muted-foreground mb-3">
                                Watch live matches with real-time betting. Place wagers on player vs player matches or 24/7 bot battles. 
                                All bets are blockchain transactions with instant confirmations and automated payouts.
                            </p>
                            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                                <li><strong className="text-white">Live betting pools:</strong> Dynamic odds based on community predictions</li>
                                <li><strong className="text-white">Bot match betting:</strong> Fixed 2x odds on automated matches, 1% house fee</li>
                                <li><strong className="text-white">Chat integration:</strong> Real-time commentary with other spectators</li>
                                <li><strong className="text-white">Automated payouts:</strong> Winners receive funds instantly via scheduled cron jobs</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Combat System Deep Dive */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Combat System</h2>
                    
                    <div className="bg-sidebar-accent/20 p-6 rounded-lg border border-sidebar-border mb-6">
                        <h3 className="text-xl font-bold text-white mb-3 font-orbitron">Turn-Based Simultaneous Resolution</h3>
                        <p className="text-muted-foreground mb-4">
                            KaspaClash uses a <strong className="text-white">strategic turn-based system</strong> where both players select their moves simultaneously within a 20-second window. 
                            Moves are then resolved using a rock-paper-scissors-style resolution matrix with additional depth from energy management and status effects.
                        </p>
                    </div>

                    <h3 className="text-xl font-bold text-cyber-gold mb-4">Move Types & Mechanics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose mb-6">
                        <div className="bg-blue-900/20 p-4 rounded border border-blue-500/30">
                            <h4 className="text-lg font-semibold text-blue-400 mb-2 font-orbitron">👊 Punch</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p><strong className="text-white">Damage:</strong> 10 (base, modified by character stats)</p>
                                <p><strong className="text-white">Energy Cost:</strong> 0 (Free move)</p>
                                <p><strong className="text-white">Priority:</strong> 3 (Very fast)</p>
                                <p><strong className="text-white">Beats:</strong> Special (interrupts charging)</p>
                                <p><strong className="text-white">Loses to:</strong> Kick (staggered)</p>
                                <p className="text-xs italic pt-2">Your bread-and-butter attack. Fast, free, and perfect for keeping pressure on opponents who spam specials.</p>
                            </div>
                        </div>

                        <div className="bg-purple-900/20 p-4 rounded border border-purple-500/30">
                            <h4 className="text-lg font-semibold text-purple-400 mb-2 font-orbitron">🦶 Kick</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p><strong className="text-white">Damage:</strong> 15 (base)</p>
                                <p><strong className="text-white">Energy Cost:</strong> 25</p>
                                <p><strong className="text-white">Priority:</strong> 2 (Moderate)</p>
                                <p><strong className="text-white">Beats:</strong> Punch (staggers opponent)</p>
                                <p><strong className="text-white">Loses to:</strong> Block (reflected damage)</p>
                                <p className="text-xs italic pt-2">Higher damage but costs energy. Can be reflected by blocks, so use wisely when opponent's guard meter is low.</p>
                            </div>
                        </div>

                        <div className="bg-green-900/20 p-4 rounded border border-green-500/30">
                            <h4 className="text-lg font-semibold text-green-400 mb-2 font-orbitron">🛡️ Block</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p><strong className="text-white">Damage:</strong> 0</p>
                                <p><strong className="text-white">Energy Cost:</strong> 0 (Free)</p>
                                <p><strong className="text-white">Priority:</strong> 4 (Highest)</p>
                                <p><strong className="text-white">Beats:</strong> Kick (reflects damage)</p>
                                <p><strong className="text-white">Loses to:</strong> Special (guard shattered)</p>
                                <p><strong className="text-white">Guard Meter:</strong> +25 when blocking, +15 when hit. Breaks at 100.</p>
                                <p className="text-xs italic pt-2">Defensive option with reflection capability. Beware: blocking too much builds your guard meter, leading to a guard break and vulnerability.</p>
                            </div>
                        </div>

                        <div className="bg-yellow-900/20 p-4 rounded border border-yellow-500/30">
                            <h4 className="text-lg font-semibold text-yellow-400 mb-2 font-orbitron">⚡ Special</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p><strong className="text-white">Damage:</strong> 25 (base, highest damage)</p>
                                <p><strong className="text-white">Energy Cost:</strong> 42-62 (character-dependent, base 50)</p>
                                <p><strong className="text-white">Priority:</strong> 1 (Slowest)</p>
                                <p><strong className="text-white">Beats:</strong> Block (shatters guard), Kick</p>
                                <p><strong className="text-white">Loses to:</strong> Punch (gets stunned)</p>
                                <p className="text-xs italic pt-2">Devastating high-damage move that breaks through blocks but requires energy management. Vulnerable to fast punches.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-sidebar-accent/20 p-6 rounded-lg border border-sidebar-border mb-6">
                        <h3 className="text-xl font-bold text-white mb-3 font-orbitron">Resource Management</h3>
                        <div className="space-y-3 text-muted-foreground">
                            <div>
                                <h4 className="text-white font-semibold mb-1">💚 Health (HP)</h4>
                                <p className="text-sm">Ranges from 90-130 depending on character archetype. Tanks have higher HP pools, speed fighters trade durability for mobility. Reaching 0 HP loses the round.</p>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-1">⚡ Energy</h4>
                                <p className="text-sm">Ranges from 80-120. Required for Kicks (25 energy) and Specials (42-62). Regenerates +20-25 per turn. Energy management is crucial—running out forces you into free moves only.</p>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-1">🛡️ Guard Meter</h4>
                                <p className="text-sm">Builds up when blocking (+25 actively blocking, +15 when blocking an attack). At 100, your guard breaks, leaving you vulnerable with reduced block effectiveness. Resets after guard break or at round end.</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-cyber-gold mb-4">Character Archetypes & Counter System</h3>
                    <p className="text-muted-foreground mb-4">
                        All 20 characters are balanced around <strong className="text-white">four core archetypes</strong>, each with unique stat distributions and strategic roles. 
                        The archetype counter cycle creates additional strategic depth: <strong className="text-cyber-gold">Speed → Tech → Tank → Precision → Speed</strong> (countered archetype takes +20% damage).
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                        <div className="bg-gradient-to-br from-cyan-500/10 to-transparent p-4 rounded border border-cyan-500/30">
                            <h4 className="text-lg font-semibold text-cyan-400 mb-2">⚡ Speed Archetype</h4>
                            <p className="text-xs text-muted-foreground mb-2">Examples: Cyber Ninja, Neon Wraith, Kitsune-09, Viperblade</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                <li><strong className="text-white">HP:</strong> 90-100 (low durability)</li>
                                <li><strong className="text-white">Energy:</strong> 100-120 (high reserves)</li>
                                <li><strong className="text-white">Strategy:</strong> High burst damage, fragile glass cannons</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500/10 to-transparent p-4 rounded border border-orange-500/30">
                            <h4 className="text-lg font-semibold text-orange-400 mb-2">🛡️ Tank Archetype</h4>
                            <p className="text-xs text-muted-foreground mb-2">Examples: Block Bruiser, Heavy-Loader, Gene-Smasher, Bastion Hulk</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                <li><strong className="text-white">HP:</strong> 110-130 (massive health pools)</li>
                                <li><strong className="text-white">Block:</strong> 60-85% damage reduction</li>
                                <li><strong className="text-white">Strategy:</strong> Survive through defense, wear down opponents</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500/10 to-transparent p-4 rounded border border-blue-500/30">
                            <h4 className="text-lg font-semibold text-blue-400 mb-2">🔧 Tech Archetype</h4>
                            <p className="text-xs text-muted-foreground mb-2">Examples: DAG Warrior, Cyber-Paladin, Technomancer, Nano-Brawler</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                <li><strong className="text-white">HP:</strong> 95-120 (balanced)</li>
                                <li><strong className="text-white">Special Cost:</strong> 0.85-1.0x modifier (cheaper abilities)</li>
                                <li><strong className="text-white">Strategy:</strong> Versatile all-rounders with strong special moves</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/10 to-transparent p-4 rounded border border-purple-500/30">
                            <h4 className="text-lg font-semibold text-purple-400 mb-2">🎯 Precision Archetype</h4>
                            <p className="text-xs text-muted-foreground mb-2">Examples: Hash Hunter, Prism Duelist, Sonic Striker, Void Reaper</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                <li><strong className="text-white">Damage:</strong> 1.1-1.3x modifiers across all moves</li>
                                <li><strong className="text-white">HP:</strong> 95-105 (moderate durability)</li>
                                <li><strong className="text-white">Strategy:</strong> Consistent damage output, punish mistakes</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Power Surge Cards */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Power Surge Cards</h2>
                    
                    <div className="bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 p-6 rounded-xl border border-purple-500/30 mb-6">
                        <p className="text-muted-foreground mb-4">
                            At the start of each round, both players are offered <strong className="text-white">3 randomly selected Power Surge cards</strong> from a pool of 15 unique abilities. 
                            You have 7 seconds to choose one card—your selection is a blockchain transaction that must be confirmed before the round begins. 
                            Card effects last for <strong className="text-cyber-gold">one round only</strong>, creating dynamic gameplay that evolves each round.
                        </p>
                        <p className="text-sm text-cyan-400 italic">
                            ⚠️ Choosing a Power Surge card is a real Kaspa transaction. The game waits for blockchain confirmation (~1 second) before applying effects.
                        </p>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-4 font-orbitron">Featured Cards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose">
                        <div className="bg-orange-900/20 p-4 rounded border border-orange-500/40">
                            <h4 className="text-base font-bold text-orange-400 mb-2">🔥 DAG Overclock</h4>
                            <p className="text-xs text-muted-foreground mb-2"><span className="text-orange-300">Legendary</span> • Offense</p>
                            <p className="text-sm text-white mb-2">+40% damage dealt</p>
                            <p className="text-xs text-muted-foreground">Boost your offensive output significantly to overwhelm opponents.</p>
                        </div>

                        <div className="bg-blue-900/20 p-4 rounded border border-blue-500/40">
                            <h4 className="text-base font-bold text-blue-400 mb-2">🛡️ Sompi Shield</h4>
                            <p className="text-xs text-muted-foreground mb-2"><span className="text-blue-300">Rare</span> • Defense</p>
                            <p className="text-sm text-white mb-2">Take 45% less damage</p>
                            <p className="text-xs text-muted-foreground">Drastically reduce incoming damage. Perfect for surviving enemy burst.</p>
                        </div>

                        <div className="bg-purple-900/20 p-4 rounded border border-purple-500/40">
                            <h4 className="text-base font-bold text-purple-400 mb-2">⚡ 10-BPS Barrage</h4>
                            <p className="text-xs text-muted-foreground mb-2"><span className="text-purple-300">Epic</span> • Energy</p>
                            <p className="text-sm text-white mb-2">+20 energy regen on kick or punch</p>
                            <p className="text-xs text-muted-foreground">Keep your energy reserves high while maintaining pressure.</p>
                        </div>

                        <div className="bg-green-900/20 p-4 rounded border border-green-500/40">
                            <h4 className="text-base font-bold text-green-400 mb-2">💚 Blue Set Heal</h4>
                            <p className="text-xs text-muted-foreground mb-2"><span className="text-green-300">Rare</span> • Recovery</p>
                            <p className="text-sm text-white mb-2">Restore 10 HP over time</p>
                            <p className="text-xs text-muted-foreground">Sustainable healing to keep you in the fight longer.</p>
                        </div>

                        <div className="bg-red-900/20 p-4 rounded border border-red-500/40">
                            <h4 className="text-base font-bold text-red-400 mb-2">💀 Mempool Congest</h4>
                            <p className="text-xs text-muted-foreground mb-2"><span className="text-red-300">Epic</span> • Control</p>
                            <p className="text-sm text-white mb-2">Stun opponent (Costs 6 HP)</p>
                            <p className="text-xs text-muted-foreground">Interrupt their strategy at the cost of your own health.</p>
                        </div>

                        <div className="bg-yellow-900/20 p-4 rounded border border-yellow-500/40">
                            <h4 className="text-base font-bold text-yellow-400 mb-2">🌀 Hash Hurricane</h4>
                            <p className="text-xs text-muted-foreground mb-2"><span className="text-yellow-300">Legendary</span> • RNG</p>
                            <p className="text-sm text-white mb-2">35% chance to dodge attack</p>
                            <p className="text-xs text-muted-foreground">Unpredictable evasion to potentially avoid devastating hits.</p>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground mt-6">
                        <strong className="text-white">And 9 more unique cards</strong> including energy manipulation (GhostDAG, Vaultbreaker), damage reflection (Block Fortress), 
                        critical specials (Finality Fist), lifesteal (BPS Syphon), and guard breaking (Chainbreaker). Each card creates unique strategic opportunities and counterplay.
                    </p>
                </section>

                {/* Progression & Rewards */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Progression & Rewards</h2>
                    
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-purple-500/10 to-transparent p-6 rounded-lg border-l-4 border-purple-500">
                            <h3 className="text-xl font-bold text-white mb-2 font-orbitron">🎖️ Battle Pass System</h3>
                            <p className="text-muted-foreground mb-4">
                                Progress through <strong className="text-white">50 seasonal tiers</strong> by earning XP from matches, daily quests, and achievements. 
                                Each tier unlocks rewards including Clash Shards, cosmetic NFTs, profile customizations, and exclusive items. 
                                The hybrid XP curve ensures fast early progression while maintaining challenge for dedicated players.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div className="bg-sidebar-accent/30 p-3 rounded">
                                    <p className="text-cyan-400 font-semibold mb-1">Early Tiers (1-20)</p>
                                    <p className="text-xs text-muted-foreground">Fast progression: 1,000-4,600 XP per tier. Quick wins to hook new players.</p>
                                </div>
                                <div className="bg-sidebar-accent/30 p-3 rounded">
                                    <p className="text-blue-400 font-semibold mb-1">Mid Tiers (21-40)</p>
                                    <p className="text-xs text-muted-foreground">Linear growth: 5,100-14,600 XP. Consistent grind for regular players.</p>
                                </div>
                                <div className="bg-sidebar-accent/30 p-3 rounded">
                                    <p className="text-purple-400 font-semibold mb-1">Late Tiers (41-50)</p>
                                    <p className="text-xs text-muted-foreground">Challenge: 16,000-28,000 XP. Prestige-worthy accomplishment.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-6 rounded-lg border-l-4 border-blue-500">
                            <h3 className="text-xl font-bold text-white mb-2 font-orbitron">📋 Daily Quests</h3>
                            <p className="text-muted-foreground mb-3">
                                Three rotating objectives refresh every 24 hours, offering <strong className="text-white">100-500 XP</strong> and Clash Shards for completion. 
                                Quests range from simple tasks (play 3 matches) to skill challenges (win with 3 different characters).
                            </p>
                            <div className="flex gap-3 text-sm">
                                <div className="flex-1 bg-green-900/20 p-3 rounded border border-green-500/30">
                                    <p className="text-green-400 font-semibold">Easy: 100 XP</p>
                                    <p className="text-xs text-muted-foreground">Complete 3 matches</p>
                                </div>
                                <div className="flex-1 bg-yellow-900/20 p-3 rounded border border-yellow-500/30">
                                    <p className="text-yellow-400 font-semibold">Medium: 250 XP</p>
                                    <p className="text-xs text-muted-foreground">Win 2 ranked matches</p>
                                </div>
                                <div className="flex-1 bg-red-900/20 p-3 rounded border border-red-500/30">
                                    <p className="text-red-400 font-semibold">Hard: 500 XP</p>
                                    <p className="text-xs text-muted-foreground">Perfect round victory</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-yellow-500/10 to-transparent p-6 rounded-lg border-l-4 border-yellow-500">
                            <h3 className="text-xl font-bold text-white mb-2 font-orbitron">🏅 Achievement System</h3>
                            <p className="text-muted-foreground mb-3">
                                Unlock <strong className="text-white">60+ achievements</strong> across 5 categories with 4-tier progression (Bronze → Silver → Gold → Platinum). 
                                Each unlock grants XP and Clash Shards. Hidden achievements reward creative play and mastery.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                <div className="bg-sidebar-accent/30 p-2 rounded text-center">
                                    <p className="text-cyan-400 font-semibold">⚔️ Combat</p>
                                    <p className="text-muted-foreground">Win streaks, damage</p>
                                </div>
                                <div className="bg-sidebar-accent/30 p-2 rounded text-center">
                                    <p className="text-purple-400 font-semibold">🎭 Mastery</p>
                                    <p className="text-muted-foreground">Character wins</p>
                                </div>
                                <div className="bg-sidebar-accent/30 p-2 rounded text-center">
                                    <p className="text-blue-400 font-semibold">📈 Progression</p>
                                    <p className="text-muted-foreground">Tiers, prestige</p>
                                </div>
                                <div className="bg-sidebar-accent/30 p-2 rounded text-center">
                                    <p className="text-green-400 font-semibold">💎 Collection</p>
                                    <p className="text-muted-foreground">Cosmetics owned</p>
                                </div>
                                <div className="bg-sidebar-accent/30 p-2 rounded text-center">
                                    <p className="text-yellow-400 font-semibold">👥 Social</p>
                                    <p className="text-muted-foreground">Matches played</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-6 rounded-lg border-l-4 border-orange-500">
                            <h3 className="text-xl font-bold text-white mb-2 font-orbitron">⭐ Prestige System</h3>
                            <p className="text-muted-foreground mb-3">
                                Upon reaching tier 50, reset your progression for <strong className="text-white">permanent multipliers</strong>: +10% XP and +15% Clash Shards per prestige level. 
                                Gain exclusive cosmetics and demonstrate your dedication with prestige badges.
                            </p>
                            <p className="text-sm text-cyan-400">
                                ✨ Prestige players stand out with special badges, exclusive rewards, and faster progression through all future seasons.
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-green-500/10 to-transparent p-6 rounded-lg border-l-4 border-green-500">
                            <h3 className="text-xl font-bold text-white mb-2 font-orbitron">💎 Clash Shards Economy</h3>
                            <p className="text-muted-foreground mb-3">
                                Earn Clash Shards through gameplay and spend them in the cosmetic shop. Every purchase is a <strong className="text-white">1 KAS blockchain transaction</strong> to the treasury vault 
                                with NFT metadata embedded in the payload—your cosmetics are inscribed on-chain.
                            </p>
                            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                                <li><strong className="text-white">Earn:</strong> Match wins (50-100), quest completion (25-100), achievements (50-1500), tier unlocks (50-500)</li>
                                <li><strong className="text-white">Spend:</strong> Character skins, emotes, victory poses, profile badges, avatar frames</li>
                                <li><strong className="text-white">Weekly rotation:</strong> Featured items with limited-time availability</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Getting Started */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Getting Started</h2>
                    
                    <div className="bg-gradient-to-br from-cyber-gold/10 via-transparent to-blue-500/10 p-6 rounded-xl border border-cyber-gold/30">
                        <ol className="list-decimal pl-6 space-y-3 text-muted-foreground">
                            <li className="text-base">
                                <strong className="text-white">Install Kasware Wallet:</strong> Download the browser extension from <a href="https://kasware.xyz/" className="text-cyber-gold hover:text-white underline" target="_blank" rel="noopener noreferrer">kasware.xyz</a>. 
                                Create a new wallet or import existing Kaspa wallet.
                            </li>
                            <li className="text-base">
                                <strong className="text-white">Connect Wallet:</strong> Click "Connect Wallet" in KaspaClash and approve the request in Kasware. 
                                The game supports both <strong className="text-white">Kaspa Mainnet</strong> and <strong className="text-white">Testnet-10</strong>. Switch networks in your wallet settings to practice for free or play for keeps.
                            </li>
                            <li className="text-base">
                                <strong className="text-white">Try Practice Mode:</strong> No KAS required. Learn the combat system, test all characters, and experiment with Power Surge cards offline.
                            </li>
                            <li className="text-base">
                                <strong className="text-white">Enter Ranked Queue:</strong> Ready to compete? Join matchmaking to face opponents near your skill level. 
                                First match starts you at 1000 ELO—climb the ranks to prove your mastery.
                            </li>
                            <li className="text-base">
                                <strong className="text-white">Complete Daily Quests:</strong> Earn XP and Clash Shards. Progress through the Battle Pass to unlock exclusive cosmetics and rewards.
                            </li>
                        </ol>
                        
                        <div className="mt-6 p-4 bg-blue-900/20 rounded border border-blue-500/40">
                            <p className="text-sm text-blue-300 mb-2"><strong>💡 Pro Tip:</strong></p>
                            <p className="text-sm text-muted-foreground">
                                Start with <strong className="text-white">DAG Warrior</strong> (balanced Tech archetype) or <strong className="text-white">Block Bruiser</strong> (Tank with high defense) 
                                to learn the fundamentals. Once comfortable, explore Speed fighters like Cyber Ninja for high-risk plays or Precision fighters like Hash Hunter for consistent damage.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Why Blockchain Gaming? */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Why Blockchain Gaming Matters</h2>
                    
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            Traditional online games suffer from centralized control: publishers can shut down servers, manipulate economies, or revoke purchased items at will. 
                            <strong className="text-white"> Blockchain gaming fundamentally changes this power dynamic.</strong>
                        </p>
                        
                        <p>
                            KaspaClash demonstrates <strong className="text-cyber-gold">true decentralization</strong> through:
                        </p>
                        
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong className="text-white">Verifiable fairness:</strong> Every match outcome is recorded on-chain. Combat resolution is deterministic—same moves produce same results.
                            </li>
                            <li>
                                <strong className="text-white">True ownership:</strong> Your cosmetic NFTs exist on Kaspa's blockchain. Even if KaspaClash disappears, your assets remain yours.
                            </li>
                            <li>
                                <strong className="text-white">Transparent economy:</strong> All betting pools, payouts, and treasury operations are publicly auditable via blockchain explorer.
                            </li>
                            <li>
                                <strong className="text-white">Instant settlements:</strong> Kaspa's sub-second confirmations enable <em>real</em> real-time gameplay, not off-chain simulations with eventual settlement.
                            </li>
                        </ul>
                        
                        <p>
                            Most importantly, KaspaClash proves blockchain gaming can be <strong className="text-white">fun-first</strong>. 
                            You don't need to understand Kaspa's BlockDAG architecture to enjoy competitive matches—but knowing your victories and cosmetics are secured by cutting-edge technology makes them feel more meaningful.
                        </p>
                    </div>
                </section>

                {/* Next Steps */}
                <section className="mt-12">
                    <div className="bg-gradient-to-r from-cyber-gold/20 to-blue-500/20 p-8 rounded-xl border-2 border-cyber-gold/50 text-center">
                        <h2 className="text-3xl font-bold text-cyber-gold mb-4 font-orbitron">Ready to Enter the Arena?</h2>
                        <p className="text-lg text-white mb-6">
                            Join the revolution in blockchain gaming. Every punch, every victory, every cosmetic—all secured by Kaspa.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="/practice" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
                                Try Practice Mode
                            </a>
                            <a href="/matchmaking" className="px-8 py-3 bg-cyber-gold hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors">
                                Enter Ranked Queue
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
