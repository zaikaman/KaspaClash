import React from 'react';

export function GamersShop() {
    return (
        <div className="space-y-12">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                {/* Hero */}
                <div className="bg-gradient-to-br from-purple-500/10 via-transparent to-cyber-gold/10 p-8 rounded-xl border border-purple-500/30">
                    <h1 className="text-4xl font-bold text-cyber-gold mb-3 font-orbitron">Cosmetic Shop</h1>
                    <p className="text-lg text-cyber-gray">
                        Express yourself in the arena with exclusive items. Every purchase is a <strong className="text-white">1 KAS blockchain transaction</strong> to 
                        the treasury vault, minting an <strong className="text-white">NFT directly to your wallet</strong>. Own your style. Own your items. On-chain.
                    </p>
                </div>

                {/* Overview */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose">
                        <div className="bg-black/20 p-6 rounded-xl border border-kaspa/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">🛍️ Browse & Purchase</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Spend Clash Shards</strong> - earned from matches, quests, achievements</li>
                                <li>• <strong className="text-white">Instant ownership</strong> - item added to inventory immediately</li>
                                <li>• <strong className="text-white">No duplicates</strong> - already owned items are hidden from shop</li>
                                <li>• <strong className="text-white">Weekly rotation</strong> - featured items refresh every Monday (UTC)</li>
                            </ul>
                        </div>
                        <div className="bg-black/20 p-6 rounded-xl border border-purple-500/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">⛓️ Blockchain NFT Mint</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">1 KAS transaction</strong> - you send to treasury vault</li>
                                <li>• <strong className="text-white">NFT metadata</strong> - embedded in transaction payload</li>
                                <li>• <strong className="text-white">Your wallet, your NFT</strong> - you pay gas, you own the asset</li>
                                <li>• <strong className="text-white">On-chain proof</strong> - verifiable on Kaspa blockchain explorer</li>
                            </ul>
                        </div>
                        <div className="bg-black/20 p-6 rounded-xl border border-cyber-gold/30">
                            <h3 className="text-lg font-bold text-white mb-3 font-orbitron">🎨 Equip & Showcase</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Full characters</strong> - unlock new fighters for your roster</li>
                                <li>• <strong className="text-white">Stickers</strong> - show off unique profile flair</li>
                                <li>• <strong className="text-white">Permanent ownership</strong> - never expires, always yours</li>
                                <li>• <strong className="text-white">On-chain identity</strong> - your collection travels with your wallet</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Shop Categories */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Shop Categories</h2>
                    <p>
                        The KaspaClash shop features <strong className="text-white">2 main categories</strong>: Characters (unlocking new fighters) and 
                        Stickers (profile decoration). All characters in the shop are complete fighters with unique stats.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 not-prose">
                        <div className="bg-gradient-to-br from-blue-500/20 to-transparent p-6 rounded-xl border border-blue-500/50">
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-2">👤</div>
                                <h3 className="text-xl font-bold text-white font-orbitron">Characters (16 Available)</h3>
                                <p className="text-sm text-muted-foreground">Unlock additional fighters for your roster</p>
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Full fighters</strong> - not skins, complete unique character models</li>
                                <li>• <strong className="text-white">4 archetypes</strong> - Speed, Tank, Tech, Precision (4 extra each)</li>
                                <li>• <strong className="text-white">Starter roster</strong> - comes with 4 free archetype starters</li>
                                <li>• <strong className="text-white">Gameplay impact</strong> - different stats, counters, and playstyles</li>
                                <li>• <strong className="text-white">Rarity progression</strong> - Common → Rare → Epic → Legendary</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/20 to-transparent p-6 rounded-xl border border-purple-500/50">
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-2">😎</div>
                                <h3 className="text-xl font-bold text-white font-orbitron">Stickers (12 Available)</h3>
                                <p className="text-sm text-muted-foreground">Express yourself with profile flair</p>
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• <strong className="text-white">Profile decoration</strong> - display on your player card</li>
                                <li>• <strong className="text-white">Emotions & messages</strong> - GG, EZ, Love, Angry, and more</li>
                                <li>• <strong className="text-white">Character-linked</strong> - stickers tied to specific character themes</li>
                                <li>• <strong className="text-white">Purely cosmetic</strong> - zero impact on combat gameplay</li>
                                <li>• <strong className="text-white">Collector's item</strong> - 12 unique designs across all archetypes</li>
                            </ul>
                        </div>
                    </div>

                    {/* Character List Grid */}
                    <div className="bg-black/20 p-6 rounded-xl border border-white/10 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-3 font-orbitron">📋 Full Character List</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                            <div className="bg-black/30 p-3 rounded-lg border border-kaspa/20">
                                <div className="text-cyber-gold font-bold mb-2">⚡ Speed Archetype</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• <span className="text-gray-400">Cyber Ninja</span> (Free Starter)</li>
                                    <li>• <span className="text-gray-400">Neon Wraith</span> (Common - 150)</li>
                                    <li>• <span className="text-blue-400">Kitsune-09</span> (Rare - 800)</li>
                                    <li>• <span className="text-purple-400">Viperblade</span> (Epic - 1,500)</li>
                                    <li>• <span className="text-orange-400">Chrono-Drifter</span> (Legendary - 2,500)</li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg border border-kaspa/20">
                                <div className="text-cyber-gold font-bold mb-2">🛡️ Tank Archetype</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• <span className="text-gray-400">Block Bruiser</span> (Free Starter)</li>
                                    <li>• <span className="text-gray-400">Heavy-Loader</span> (Common - 150)</li>
                                    <li>• <span className="text-blue-400">Gene-Smasher</span> (Rare - 800)</li>
                                    <li>• <span className="text-purple-400">Bastion Hulk</span> (Epic - 1,500)</li>
                                    <li>• <span className="text-orange-400">Scrap-Goliath</span> (Legendary - 2,500)</li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg border border-kaspa/20">
                                <div className="text-cyber-gold font-bold mb-2">🔧 Tech Archetype</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• <span className="text-gray-400">DAG Warrior</span> (Free Starter)</li>
                                    <li>• <span className="text-gray-400">Cyber-Paladin</span> (Common - 150)</li>
                                    <li>• <span className="text-blue-400">Nano-Brawler</span> (Rare - 800)</li>
                                    <li>• <span className="text-purple-400">Technomancer</span> (Epic - 1,500)</li>
                                    <li>• <span className="text-orange-400">Aeon Guard</span> (Legendary - 2,500)</li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg border border-kaspa/20">
                                <div className="text-cyber-gold font-bold mb-2">🎯 Precision Archetype</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• <span className="text-gray-400">Hash Hunter</span> (Free Starter)</li>
                                    <li>• <span className="text-gray-400">Razor-Bot 7</span> (Common - 150)</li>
                                    <li>• <span className="text-blue-400">Sonic-Striker</span> (Rare - 800)</li>
                                    <li>• <span className="text-purple-400">Prism-Duelist</span> (Epic - 1,500)</li>
                                    <li>• <span className="text-orange-400">Void-Reaper</span> (Legendary - 2,500)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Sticker List Grid */}
                    <div className="bg-black/20 p-6 rounded-xl border border-white/10 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-3 font-orbitron">😎 Full Sticker List</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                            <div className="bg-black/30 p-3 rounded-lg border border-purple-500/20">
                                <div className="text-cyber-gold font-bold mb-2">⚡ Speed (Neon Wraith)</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• <span className="text-gray-400">GG Glitch</span> (Common - 300)</li>
                                    <li>• <span className="text-blue-400">EZ Peazy</span> (Rare - 500)</li>
                                    <li>• <span className="text-purple-400">You Suck</span> (Epic - 800)</li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg border border-purple-500/20">
                                <div className="text-cyber-gold font-bold mb-2">🛡️ Tank (Heavy-Loader)</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• <span className="text-gray-400">Angry</span> (Common - 300)</li>
                                    <li>• <span className="text-blue-400">Mad</span> (Rare - 500)</li>
                                    <li>• <span className="text-purple-400">Scared</span> (Epic - 800)</li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg border border-purple-500/20">
                                <div className="text-cyber-gold font-bold mb-2">🔧 Tech (Cyber-Paladin)</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• <span className="text-gray-400">Like</span> (Common - 300)</li>
                                    <li>• <span className="text-blue-400">Love</span> (Rare - 500)</li>
                                    <li>• <span className="text-purple-400">Question</span> (Epic - 800)</li>
                                </ul>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg border border-purple-500/20">
                                <div className="text-cyber-gold font-bold mb-2">🎯 Precision (Razor-Bot 7)</div>
                                <ul className="text-muted-foreground space-y-1">
                                    <li>• <span className="text-gray-400">Crying</span> (Common - 300)</li>
                                    <li>• <span className="text-blue-400">Sad</span> (Rare - 500)</li>
                                    <li>• <span className="text-purple-400">Confused</span> (Epic - 800)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Rarity System */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Rarity Tiers & Pricing</h2>
                    <p>
                        Items are divided into <strong className="text-white">4 rarity tiers</strong>: Common, Rare, Epic, and Legendary. 
                        Each tier has a fixed price point in Clash Shards.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 not-prose">
                        <div className="bg-gradient-to-br from-blue-500/20 to-transparent p-6 rounded-xl border border-blue-500/50">
                            <h3 className="text-lg font-bold text-white mb-4 font-orbitron">👤 Character Pricing</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.8)]"></div>
                                        <span className="text-sm font-bold text-gray-400">Common</span>
                                    </div>
                                    <span className="text-sm font-bold text-cyber-gold">150 Shards</span>
                                </div>
                                <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                                        <span className="text-sm font-bold text-blue-400">Rare</span>
                                    </div>
                                    <span className="text-sm font-bold text-cyber-gold">800 Shards</span>
                                </div>
                                <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]"></div>
                                        <span className="text-sm font-bold text-purple-400">Epic</span>
                                    </div>
                                    <span className="text-sm font-bold text-cyber-gold">1,500 Shards</span>
                                </div>
                                <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]"></div>
                                        <span className="text-sm font-bold text-orange-400">Legendary</span>
                                    </div>
                                    <span className="text-sm font-bold text-cyber-gold">2,500 Shards</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/20 to-transparent p-6 rounded-xl border border-purple-500/50">
                            <h3 className="text-lg font-bold text-white mb-4 font-orbitron">😎 Sticker Pricing</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.8)]"></div>
                                        <span className="text-sm font-bold text-gray-400">Common</span>
                                    </div>
                                    <span className="text-sm font-bold text-cyber-gold">300 Shards</span>
                                </div>
                                <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                                        <span className="text-sm font-bold text-blue-400">Rare</span>
                                    </div>
                                    <span className="text-sm font-bold text-cyber-gold">500 Shards</span>
                                </div>
                                <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]"></div>
                                        <span className="text-sm font-bold text-purple-400">Epic</span>
                                    </div>
                                    <span className="text-sm font-bold text-cyber-gold">800 Shards</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-cyber-gold/20 to-transparent p-6 rounded-xl border border-cyber-gold/50 mt-6 not-prose text-center">
                        <h3 className="text-lg font-bold text-white mb-2 font-orbitron">💰 Total Collection Cost: 24,400 Shards</h3>
                        <p className="text-xs text-muted-foreground">Unlock every character and sticker available in the gallery.</p>
                    </div>
                </section>

                {/* Weekly Rotation */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Weekly Featured Rotation</h2>
                    <p>
                        Every <strong className="text-white">Monday at 00:00 UTC</strong>, the shop refreshes with a new selection of featured items. 
                        Keep an eye out for discounts and highlighting of rare collectibles.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 not-prose">
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="text-2xl">🔄</div>
                                <div className="text-sm font-bold text-white">20% Featured Discount</div>
                            </div>
                            <p className="text-xs text-muted-foreground">Randomly selected items are discounted by 20% during their featured week.</p>
                        </div>
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="text-2xl">⏳</div>
                                <div className="text-sm font-bold text-white">Limited Time Offers</div>
                            </div>
                            <p className="text-xs text-muted-foreground">Certain promotional items may only be available during specific event rotations.</p>
                        </div>
                    </div>
                </section>

                {/* Blockchain NFT Minting */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Blockchain NFT Minting</h2>
                    <p>
                        When you purchase an item, it is permanently inscribed on the Kaspa blockchain as an NFT.
                    </p>

                    <div className="bg-gradient-to-br from-kaspa/20 to-transparent p-6 rounded-xl border border-kaspa/50 mt-6 not-prose">
                        <h3 className="text-lg font-bold text-white mb-4 font-orbitron">⛓️ Minting Process</h3>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex gap-4">
                                <div className="font-bold text-cyber-gold">1.</div>
                                <p><strong className="text-white">Wallet Sync:</strong> Your connected Kasware wallet provides the address for ownership.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="font-bold text-cyber-gold">2.</div>
                                <p><strong className="text-white">Treasury Tx:</strong> A 1 KAS transaction is sent to the vault with item metadata.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="font-bold text-cyber-gold">3.</div>
                                <p><strong className="text-white">Inscription:</strong> Kaspa's BlockDAG confirms the transaction in ~1 second.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="font-bold text-cyber-gold">4.</div>
                                <p><strong className="text-white">Verification:</strong> The item is added to your permanent on-chain inventory.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Important Notes */}
                <section>
                    <h2 className="text-3xl text-cyber-gold mt-12 mb-6 border-b border-cyber-gold/30 pb-3">Important Information</h2>
                    <div className="space-y-4 not-prose">
                        <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/30">
                            <h3 className="text-lg font-bold text-white mb-2 font-orbitron">⚔️ Characters vs Stickers</h3>
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-white">Characters</strong> provide new gameplay options with unique stats. 
                                <strong className="text-white">Stickers</strong> are purely decorative and do not affect combat strength.
                            </p>
                        </div>
                        <div className="bg-yellow-500/10 p-6 rounded-xl border border-yellow-500/30">
                            <h3 className="text-lg font-bold text-white mb-2 font-orbitron">🔐 Wallet Requirement</h3>
                            <p className="text-sm text-muted-foreground">
                                A Kaspa wallet is required to mint items as NFTs. You can still play without one, but your items won't be on-chain.
                            </p>
                        </div>
                        <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/30">
                            <h3 className="text-lg font-bold text-white mb-2 font-orbitron">❌ No Refunds</h3>
                            <p className="text-sm text-muted-foreground">
                                Due to the irreversible nature of blockchain transactions, all shop purchases are final.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
