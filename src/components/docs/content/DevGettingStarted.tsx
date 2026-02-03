import React from 'react';

export function DevGettingStarted() {
    return (
        <div className="space-y-8">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                
                {/* Hero */}
                <div className="bg-gradient-to-br from-cyber-gold/10 to-cyber-blue/10 p-8 rounded-2xl border border-cyber-gold/30 mb-8">
                    <h2 className="text-3xl text-cyber-gold mb-4 mt-0">Getting Started</h2>
                    <p className="text-lg mb-0">
                        This guide will walk you through setting up a local development environment for KaspaClash. Follow these steps carefully to get the full stack running—from Next.js frontend to Supabase backend to Kaspa blockchain integration.
                    </p>
                </div>

                {/* Prerequisites */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Prerequisites</h3>
                <p>
                    Before starting, ensure you have the following tools and accounts configured. KaspaClash is a modern full-stack application that requires specific versions for compatibility.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-cyan-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Required Software</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">Node.js 20+</strong> - Runtime environment. LTS version recommended. <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer" className="text-cyber-gold underline">Download</a>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">npm/pnpm/yarn</strong> - Package manager. <code className="text-cyan-400">npm</code> comes with Node.js. <code className="text-cyan-400">pnpm</code> recommended for speed.
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">Git</strong> - Version control. <a href="https://git-scm.com/" target="_blank" rel="noopener noreferrer" className="text-cyber-gold underline">Download</a>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">Code Editor</strong> - VS Code recommended with TypeScript/React extensions
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-green-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">External Services</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">Supabase Account</strong> - Free tier works. <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-cyber-gold underline">Sign up</a>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">Kasware Wallet</strong> - Browser extension for Kaspa transactions. <a href="https://kasware.xyz/" target="_blank" rel="noopener noreferrer" className="text-cyber-gold underline">Install</a>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">Cloudinary Account</strong> - (Optional) For saving profile images. <a href="https://cloudinary.com/" target="_blank" rel="noopener noreferrer" className="text-cyber-gold underline">Sign up</a>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">▸</span>
                                <div>
                                    <strong className="text-white">Testnet KAS</strong> - Get testnet funds from <a href="https://faucet.kaspanet.io/" target="_blank" rel="noopener noreferrer" className="text-cyber-gold underline">faucet</a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Installation Steps */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Installation Steps</h3>

                {/* Step 1: Clone */}
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-cyber-gold/20 flex items-center justify-center text-cyber-gold font-bold">1</div>
                        <h4 className="text-lg font-semibold text-white font-orbitron m-0">Clone the Repository</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Clone the KaspaClash repository from GitHub to your local machine.
                    </p>
                    <pre className="bg-black/60 p-4 rounded-lg border border-cyber-gold/30 overflow-x-auto text-sm">
                        <code className="text-green-400">git clone https://github.com/yourusername/KaspaClash.git</code><br />
                        <code className="text-green-400">cd KaspaClash</code>
                    </pre>
                </div>

                {/* Step 2: Install Dependencies */}
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-cyber-gold/20 flex items-center justify-center text-cyber-gold font-bold">2</div>
                        <h4 className="text-lg font-semibold text-white font-orbitron m-0">Install Dependencies</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Install all required npm packages. This includes Next.js, React, Phaser, Kaspa WASM, Supabase client, and more.
                    </p>
                    <pre className="bg-black/60 p-4 rounded-lg border border-cyan-500/30 overflow-x-auto text-sm">
                        <code className="text-green-400"># Using npm</code><br />
                        <code className="text-green-400">npm install</code><br /><br />
                        <code className="text-green-400"># Or using pnpm (faster)</code><br />
                        <code className="text-green-400">pnpm install</code><br /><br />
                        <code className="text-green-400"># Or using yarn</code><br />
                        <code className="text-green-400">yarn install</code>
                    </pre>
                    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                        <div className="text-blue-400 font-semibold text-xs mb-1">💡 Expected Install Time</div>
                        <div className="text-muted-foreground text-xs">
                            Installation takes 2-5 minutes depending on network speed. Total dependencies: ~2600 packages.
                        </div>
                    </div>
                </div>

                {/* Step 3: Supabase Setup */}
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-cyber-gold/20 flex items-center justify-center text-cyber-gold font-bold">3</div>
                        <h4 className="text-lg font-semibold text-white font-orbitron m-0">Set Up Supabase Database</h4>
                    </div>
                    
                    <div className="space-y-4 text-sm">
                        <div>
                            <div className="text-white font-semibold mb-2">3.1 Create a New Project</div>
                            <ul className="text-muted-foreground space-y-1 ml-4">
                                <li>• Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-cyber-gold underline">Supabase Dashboard</a></li>
                                <li>• Click "New Project"</li>
                                <li>• Choose a project name (e.g., "kaspaclash-dev")</li>
                                <li>• Set a strong database password (save this!)</li>
                                <li>• Select a region close to you</li>
                                <li>• Click "Create new project" and wait ~2 minutes for provisioning</li>
                            </ul>
                        </div>

                        <div>
                            <div className="text-white font-semibold mb-2">3.2 Run Database Migrations</div>
                            <ul className="text-muted-foreground space-y-1 ml-4">
                                <li>• Open your Supabase project dashboard</li>
                                <li>• Navigate to <strong className="text-white">SQL Editor</strong> (left sidebar)</li>
                                <li>• Click "New Query"</li>
                                <li>• Copy the entire contents of <code className="text-cyan-400">supabase/migrations/current_schema.sql</code></li>
                                <li>• Paste into the SQL editor and click "Run"</li>
                                <li>• Wait for confirmation (creates ~20 tables)</li>
                            </ul>
                        </div>

                        <div>
                            <div className="text-white font-semibold mb-2">3.3 Seed Cosmetics Data</div>
                            <ul className="text-muted-foreground space-y-1 ml-4">
                                <li>• In SQL Editor, create another new query</li>
                                <li>• Copy contents of <code className="text-cyan-400">supabase/migrations/003_seed_cosmetics.sql</code></li>
                                <li>• Paste and run</li>
                            </ul>
                        </div>

                        <div>
                            <div className="text-white font-semibold mb-2">3.4 Get API Keys</div>
                            <ul className="text-muted-foreground space-y-1 ml-4">
                                <li>• Go to <strong className="text-white">Project Settings</strong> → <strong className="text-white">API</strong></li>
                                <li>• Copy your <code className="text-cyan-400">Project URL</code></li>
                                <li>• Copy your <code className="text-cyan-400">anon/public</code> key</li>
                                <li>• Copy your <code className="text-cyan-400">service_role</code> key (keep this secret!)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Step 4: Environment Variables */}
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-cyber-gold/20 flex items-center justify-center text-cyber-gold font-bold">4</div>
                        <h4 className="text-lg font-semibold text-white font-orbitron m-0">Configure Environment Variables</h4>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                        Create a <code className="text-cyan-400">.env.local</code> file in the project root directory. This file stores sensitive configuration and is never committed to git.
                    </p>

                    <div className="mb-4">
                        <div className="text-white font-semibold mb-2 text-sm">Copy the template:</div>
                        <pre className="bg-black/60 p-4 rounded-lg border border-purple-500/30 overflow-x-auto text-xs">
                            <code className="text-green-400">cp .env.local.example .env.local</code>
                        </pre>
                    </div>

                    <div className="text-white font-semibold mb-2 text-sm">Edit <code className="text-cyan-400">.env.local</code> with your values:</div>
                    <pre className="bg-black/60 p-4 rounded-lg border border-green-500/30 overflow-x-auto text-xs text-muted-foreground font-mono leading-relaxed">
{`# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Vault Configuration (REQUIRED for betting/treasury)
NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET=kaspatest:qr...your_vault_address
BETTING_VAULT_PRIVATE_KEY_TESTNET=your_private_key_here

# Optional: Mainnet (for production)
NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET=kaspa:qr...your_vault_address
BETTING_VAULT_PRIVATE_KEY_MAINNET=your_private_key_here

# Kaspa RPC (uses defaults if not specified)
KASPA_RPC_URL_TESTNET=wss://baryon-10.kaspa.green/kaspa/testnet-10/wrpc/borsh

# Cloudinary (Optional - for match replay images)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret`}
                    </pre>

                    <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                        <div className="text-yellow-400 font-semibold text-xs mb-2">⚠️ Vault Setup (Important for Betting)</div>
                        <div className="text-muted-foreground text-xs space-y-1">
                            <p>To enable betting and treasury features, you need a <strong className="text-white">vault wallet</strong>:</p>
                            <ol className="ml-4 mt-2 space-y-1">
                                <li>1. Create a new Kasware wallet (or use an existing one)</li>
                                <li>2. Switch to <strong className="text-white">Testnet</strong> in Kasware settings</li>
                                <li>3. Copy your testnet address (starts with <code className="text-cyan-400">kaspatest:</code>)</li>
                                <li>4. Export your private key (Settings → Export Private Key)</li>
                                <li>5. Fund it with testnet KAS from <a href="https://faucet.kaspanet.io/" target="_blank" rel="noopener noreferrer" className="text-cyber-gold underline">faucet</a></li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Step 5: Run Development Server */}
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-cyber-gold/20 flex items-center justify-center text-cyber-gold font-bold">5</div>
                        <h4 className="text-lg font-semibold text-white font-orbitron m-0">Run the Development Server</h4>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                        Start the Next.js development server with Turbopack for fast hot-reloading.
                    </p>

                    <pre className="bg-black/60 p-4 rounded-lg border border-cyber-gold/30 overflow-x-auto text-sm">
                        <code className="text-green-400">npm run dev</code>
                    </pre>

                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                        <p>Expected output:</p>
                        <pre className="bg-black/60 p-3 rounded-lg border border-white/10 text-green-400">
{`▲ Next.js 16.1.1 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Starting...
✓ Ready in 1.2s`}
                        </pre>
                    </div>
                </div>

                {/* Step 6: Verify Installation */}
                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-cyber-gold/20 flex items-center justify-center text-cyber-gold font-bold">6</div>
                        <h4 className="text-lg font-semibold text-white font-orbitron m-0">Verify Installation</h4>
                    </div>
                    
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <div>
                            <strong className="text-white">1. Open the Application</strong>
                            <p>Navigate to <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="text-cyber-gold underline">http://localhost:3000</a> in your browser</p>
                        </div>

                        <div>
                            <strong className="text-white">2. Connect Kasware Wallet</strong>
                            <ul className="ml-4 mt-1 space-y-1">
                                <li>• Click "Connect Wallet" button</li>
                                <li>• Approve the connection in Kasware popup</li>
                                <li>• Ensure wallet is on <strong className="text-white">Testnet</strong></li>
                            </ul>
                        </div>

                        <div>
                            <strong className="text-white">3. Test Core Features</strong>
                            <ul className="ml-4 mt-1 space-y-1">
                                <li>• ✓ Landing page loads with character carousel</li>
                                <li>• ✓ Navigate to Practice mode and fight a bot</li>
                                <li>• ✓ Check leaderboard (should be empty initially)</li>
                                <li>• ✓ Browse shop (cosmetics should load from DB)</li>
                            </ul>
                        </div>

                        <div>
                            <strong className="text-white">4. Check Health Endpoint</strong>
                            <p>Verify backend is running: <a href="http://localhost:3000/api/health" target="_blank" rel="noopener noreferrer" className="text-cyber-gold underline">http://localhost:3000/api/health</a></p>
                            <p className="text-xs mt-1">Expected response: <code className="text-green-400">{`{"status":"ok","timestamp":"..."}`}</code></p>
                        </div>
                    </div>
                </div>

                {/* Development Workflow */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Development Workflow</h3>
                <p>
                    Understanding the local development workflow will help you iterate quickly and debug efficiently.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-cyan-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Hot Reloading</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">React Components:</strong> Auto-refresh on save</li>
                            <li>• <strong className="text-white">API Routes:</strong> Restart required (<code className="text-cyan-400">Ctrl+C</code> → <code className="text-cyan-400">npm run dev</code>)</li>
                            <li>• <strong className="text-white">Phaser Scenes:</strong> Reload page to see changes</li>
                            <li>• <strong className="text-white">Tailwind CSS:</strong> Instant updates via JIT compiler</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Useful Commands</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground font-mono">
                            <li><span className="text-green-400">npm run dev</span> - Start dev server</li>
                            <li><span className="text-green-400">npm run build</span> - Production build</li>
                            <li><span className="text-green-400">npm run lint</span> - Run ESLint</li>
                            <li><span className="text-green-400">npm run test</span> - Run Vitest tests</li>
                        </ul>
                    </div>
                </div>

                {/* Troubleshooting */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Common Issues & Solutions</h3>

                <div className="space-y-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-red-500/30">
                        <div className="text-red-400 font-semibold mb-2 text-sm">❌ "Cannot find module '@/lib/supabase/server'"</div>
                        <div className="text-muted-foreground text-xs">
                            <strong className="text-white">Cause:</strong> Environment variables not set or Supabase client not initialized.<br />
                            <strong className="text-white">Solution:</strong> Verify <code className="text-cyan-400">.env.local</code> exists with correct Supabase URL/keys. Restart dev server.
                        </div>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-yellow-500/30">
                        <div className="text-yellow-400 font-semibold mb-2 text-sm">⚠️ "Failed to load Kaspa WASM"</div>
                        <div className="text-muted-foreground text-xs">
                            <strong className="text-white">Cause:</strong> Browser doesn't support WebAssembly or WASM file not served correctly.<br />
                            <strong className="text-white">Solution:</strong> Use a modern browser (Chrome, Edge, Firefox). Clear cache and reload. Check console for specific error.
                        </div>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-orange-500/30">
                        <div className="text-orange-400 font-semibold mb-2 text-sm">⚠️ Phaser game not rendering</div>
                        <div className="text-muted-foreground text-xs">
                            <strong className="text-white">Cause:</strong> Canvas element not mounted or Phaser config error.<br />
                            <strong className="text-white">Solution:</strong> Check browser console for Phaser errors. Ensure <code className="text-cyan-400">public/characters/</code> assets exist. Hard refresh (<code className="text-cyan-400">Ctrl+Shift+R</code>).
                        </div>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-blue-500/30">
                        <div className="text-blue-400 font-semibold mb-2 text-sm">💡 Database query errors</div>
                        <div className="text-muted-foreground text-xs">
                            <strong className="text-white">Cause:</strong> Missing tables or RLS policies blocking queries.<br />
                            <strong className="text-white">Solution:</strong> Re-run <code className="text-cyan-400">current_schema.sql</code> in Supabase SQL Editor. Check table names match codebase. Verify RLS policies allow anonymous access where needed.
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="bg-gradient-to-br from-cyber-gold/20 to-cyber-blue/20 p-8 rounded-2xl border border-cyber-gold/50 mt-12">
                    <h3 className="text-2xl text-cyber-gold mb-4 mt-0">Next Steps</h3>
                    <p className="text-muted-foreground mb-4">
                        Now that you have KaspaClash running locally, explore these areas to deepen your understanding:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-cyber-gold mt-1">→</span>
                            <div>
                                <strong className="text-white">Architecture Guide:</strong> Understand the system design, data flows, and component interactions
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-cyber-gold mt-1">→</span>
                            <div>
                                <strong className="text-white">API Documentation:</strong> Learn about all available endpoints and their request/response formats
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-cyber-gold mt-1">→</span>
                            <div>
                                <strong className="text-white">Database Schema:</strong> Explore table structures, relationships, and RLS policies
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-cyber-gold mt-1">→</span>
                            <div>
                                <strong className="text-white">Kaspa Integration:</strong> Dive into transaction building, wallet integration, and blockchain verification
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-cyber-gold mt-1">→</span>
                            <div>
                                <strong className="text-white">Game Engine:</strong> Study Phaser scenes, combat logic, and animation systems
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
