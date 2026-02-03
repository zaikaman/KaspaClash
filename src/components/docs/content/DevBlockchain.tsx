import React from 'react';

export function DevBlockchain() {
    return (
        <div className="space-y-8">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                
                {/* Hero */}
                <div className="bg-gradient-to-br from-blue-500/10 to-green-500/10 p-8 rounded-2xl border border-blue-500/30 mb-8">
                    <h2 className="text-3xl text-cyber-gold mb-4 mt-0">Kaspa Integration</h2>
                    <p className="text-lg mb-0">
                        KaspaClash leverages <strong>Kaspa's BlockDAG architecture</strong> for true real-time blockchain gaming. This guide covers wallet integration, transaction building, WASM SDK usage, and the complete transaction flow from client signing to server verification.
                    </p>
                </div>

                {/* Why Kaspa */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Why Kaspa's BlockDAG Enables Real-Time Gaming</h3>
                <p>
                    Traditional blockchains process transactions sequentially (one block at a time), creating latency bottlenecks. Kaspa's <strong>BlockDAG (Directed Acyclic Graph)</strong> allows parallel block creation at <strong>10 blocks per second</strong>, achieving ~1 second confirmations.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-green-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">⚡ Speed</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">10 BPS:</strong> 10 blocks per second (100ms per block)</li>
                            <li>• <strong className="text-white">~1s Confirmation:</strong> Transactions finalize in 1-2 seconds</li>
                            <li>• <strong className="text-white">No Optimistic UI:</strong> KaspaClash waits for real blockchain confirmation</li>
                            <li>• <strong className="text-white">Faster than Credit Cards:</strong> Sub-second settlement vs 3-5 day ACH</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-blue-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">🔗 Parallel Processing</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">BlockDAG:</strong> Multiple blocks created simultaneously</li>
                            <li>• <strong className="text-white">Scalability:</strong> Handles high transaction throughput</li>
                            <li>• <strong className="text-white">No Congestion:</strong> Parallel paths prevent bottlenecks</li>
                            <li>• <strong className="text-white">Future-Proof:</strong> Designed for global-scale adoption</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">💰 Low Fees</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">~$0.0001/tx:</strong> Minimal transaction costs</li>
                            <li>• <strong className="text-white">1 KAS Moves:</strong> Affordable on-chain verification</li>
                            <li>• <strong className="text-white">No Gas Wars:</strong> Predictable pricing</li>
                            <li>• <strong className="text-white">Microtransactions:</strong> Viable for in-game purchases</li>
                        </ul>
                    </div>
                </div>

                {/* Architecture Overview */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Integration Architecture</h3>
                <p>
                    KaspaClash uses a <strong>hybrid client-server architecture</strong> where clients sign transactions locally (non-custodial), and the server verifies them on-chain before executing game logic.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Transaction Flow</div>
                    
                    <div className="space-y-3 text-xs">
                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-cyan-500/20 px-3 py-1 rounded border border-cyan-500/30 text-cyan-400 text-center">
                                    Client
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">1. User Action (Move Selection, Power Surge, Bet)</div>
                                <div>React UI triggers transaction builder with action parameters</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-cyan-500/20 px-3 py-1 rounded border border-cyan-500/30 text-cyan-400 text-center">
                                    Client
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">2. Build Transaction (Kaspa WASM)</div>
                                <div>Creates transaction with OP_RETURN payload encoding game data (match ID, round, move type)</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-purple-500/20 px-3 py-1 rounded border border-purple-500/30 text-purple-400 text-center">
                                    Kasware
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">3. Sign Transaction (User Wallet)</div>
                                <div>Kasware wallet prompts user to approve transaction. Private key never leaves wallet extension.</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-green-500/20 px-3 py-1 rounded border border-green-500/30 text-green-400 text-center">
                                    Kaspa Network
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">4. Broadcast to Network</div>
                                <div>Signed transaction submitted to Kaspa mempool, propagated to miners</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-green-500/20 px-3 py-1 rounded border border-green-500/30 text-green-400 text-center">
                                    BlockDAG
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">5. Block Confirmation (~1 second)</div>
                                <div>Transaction included in block, confirmed by network consensus</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-orange-500/20 px-3 py-1 rounded border border-orange-500/30 text-orange-400 text-center">
                                    Server
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">6. Verify Transaction</div>
                                <div>Backend queries Kaspa API/RPC to confirm transaction exists, validates payload matches expected action</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-24 flex-shrink-0">
                                <div className="bg-orange-500/20 px-3 py-1 rounded border border-orange-500/30 text-orange-400 text-center">
                                    Server
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">7. Execute Game Logic</div>
                                <div>Update database, broadcast Supabase Realtime event, resolve combat/bet/purchase</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wallet Integration */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Wallet Integration (Client-Side)</h3>
                <p>
                    KaspaClash uses <strong>Kasware</strong> as the primary wallet provider. The <code className="text-cyan-400">wallet.ts</code> service provides a unified API for connection, signing, and transaction management.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Core Wallet Functions</div>
                    
                    <div className="space-y-4 text-xs">
                        <div>
                            <div className="text-cyan-400 mb-2 font-mono">connectWallet(): Promise&lt;WalletConnection&gt;</div>
                            <div className="text-muted-foreground">
                                Connects to Kasware wallet, requests account access, returns address and network. Triggers <code className="text-green-400">window.kasware.requestAccounts()</code>.
                            </div>
                        </div>

                        <div>
                            <div className="text-cyan-400 mb-2 font-mono">tryReconnect(): Promise&lt;WalletConnection | null&gt;</div>
                            <div className="text-muted-foreground">
                                Silent reconnection using <code className="text-green-400">getAccounts()</code> (no popup). Returns existing connection if user previously authorized.
                            </div>
                        </div>

                        <div>
                            <div className="text-cyan-400 mb-2 font-mono">sendKaspa(toAddress, sompi, payload?): Promise&lt;string&gt;</div>
                            <div className="text-muted-foreground">
                                Sends KAS transaction using Kasware's native API. Returns transaction ID. Optional payload for OP_RETURN data (game moves, NFT metadata).
                            </div>
                        </div>

                        <div>
                            <div className="text-cyan-400 mb-2 font-mono">switchNetwork(network): Promise&lt;boolean&gt;</div>
                            <div className="text-muted-foreground">
                                Prompts user to switch between mainnet/testnet. Critical for development testing.
                            </div>
                        </div>

                        <div>
                            <div className="text-cyan-400 mb-2 font-mono">getBalance(): Promise&lt;bigint&gt;</div>
                            <div className="text-muted-foreground">
                                Fetches current wallet balance in sompi (1 KAS = 100,000,000 sompi). Uses <code className="text-green-400">kasware.getBalance()</code>.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Wallet Connection Example</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-cyan-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`// Connect wallet on button click
import { connectWallet, getConnectedAddress } from '@/lib/kaspa/wallet';

async function handleConnect() {
  try {
    const connection = await connectWallet();
    console.log('Connected:', connection.address);
    console.log('Network:', connection.network); // "mainnet" | "testnet"
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

// Send transaction
import { sendKaspa } from '@/lib/kaspa/wallet';

async function sendMove(matchId: string, move: string) {
  const txId = await sendKaspa(
    'kaspatest:qr...vault_address',
    100_000_000, // 1 KAS in sompi
    \`KASCA\${matchId.slice(0, 8)}\${move}\` // OP_RETURN payload
  );
  
  // Submit txId to backend for verification
  await fetch('/api/match/submit-move', {
    method: 'POST',
    body: JSON.stringify({ matchId, move, txId })
  });
}`}
                    </pre>
                </div>

                {/* Transaction Building */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Transaction Building & OP_RETURN Encoding</h3>
                <p>
                    KaspaClash encodes game actions in <strong>OP_RETURN payloads</strong> attached to 1 KAS self-send transactions. This creates immutable on-chain proof of player moves while keeping costs minimal.
                </p>

                <div className="overflow-x-auto my-6 not-prose">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-cyber-gold/30">
                                <th className="text-left p-3 text-white font-semibold">Action Type</th>
                                <th className="text-left p-3 text-white font-semibold">Payload Format</th>
                                <th className="text-left p-3 text-white font-semibold">Amount</th>
                                <th className="text-left p-3 text-white font-semibold">Recipient</th>
                            </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                            <tr className="border-b border-white/10 bg-cyan-500/5">
                                <td className="p-3"><strong className="text-white">Move Submission</strong></td>
                                <td className="p-3"><code className="text-cyan-400">KASCA + matchId(8) + round(2) + move(2)</code></td>
                                <td className="p-3">1 KAS</td>
                                <td className="p-3">Self-send</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><strong className="text-white">Power Surge Select</strong></td>
                                <td className="p-3"><code className="text-cyan-400">SURGE + cardId</code></td>
                                <td className="p-3">1 KAS</td>
                                <td className="p-3">Self-send</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-purple-500/5">
                                <td className="p-3"><strong className="text-white">Spectator Bet</strong></td>
                                <td className="p-3"><code className="text-cyan-400">BET + matchId + playerId</code></td>
                                <td className="p-3">Variable (user choice)</td>
                                <td className="p-3">Betting vault</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><strong className="text-white">Private Room Stake</strong></td>
                                <td className="p-3"><code className="text-cyan-400">STAKE + roomId</code></td>
                                <td className="p-3">Variable (agreed amount)</td>
                                <td className="p-3">Match vault</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-green-500/5">
                                <td className="p-3"><strong className="text-white">Shop Purchase</strong></td>
                                <td className="p-3"><code className="text-cyan-400">NFT metadata JSON</code></td>
                                <td className="p-3">Item price in KAS</td>
                                <td className="p-3">Treasury vault</td>
                            </tr>
                            <tr className="bg-blue-500/5">
                                <td className="p-3"><strong className="text-white">Survival Wave Clear</strong></td>
                                <td className="p-3"><code className="text-cyan-400">WAVE + waveNumber</code></td>
                                <td className="p-3">1 KAS</td>
                                <td className="p-3">Self-send</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Move Transaction Builder Example</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-purple-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`// src/lib/kaspa/move-transaction.ts
const PROTOCOL_PREFIX = "4B41534341"; // "KASCA" in hex

export function buildOpReturnData(
  matchId: string,
  roundNumber: number,
  moveType: MoveType
): string {
  // Truncate match ID to 8 chars and convert to hex
  const matchIdHex = Buffer.from(matchId.slice(0, 8)).toString("hex");
  
  // Round number as 2-digit hex
  const roundHex = roundNumber.toString(16).padStart(2, "0");
  
  // Move type opcode (punch=01, kick=02, block=03, special=04)
  const moveOpcode = MOVE_OPCODES[moveType];
  
  return \`\${PROTOCOL_PREFIX}\${matchIdHex}\${roundHex}\${moveOpcode}\`;
}

// Example: Match "abc12345", Round 3, Kick
// Output: "4B41534341616263313233343503020"
//          ^KASCA    ^abc12345(hex)  ^03 ^02`}
                    </pre>
                </div>

                {/* Server-Side Verification */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Server-Side Verification</h3>
                <p>
                    The backend verifies every transaction on-chain before executing game logic. This ensures players cannot spoof moves or bypass payment requirements.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-orange-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Verification Steps</h4>
                        <ol className="space-y-2 text-xs text-muted-foreground ml-4">
                            <li>1. Client submits <code className="text-cyan-400">txId</code> from wallet</li>
                            <li>2. Server queries Kaspa API: <code className="text-green-400">GET /transactions/{'{'}txId{'}'}</code></li>
                            <li>3. Validate transaction exists on blockchain</li>
                            <li>4. Check sender address matches player wallet</li>
                            <li>5. Verify amount meets minimum (1 KAS for moves)</li>
                            <li>6. Parse OP_RETURN payload, validate data integrity</li>
                            <li>7. Check transaction timestamp within deadline window</li>
                            <li>8. Execute game logic if all checks pass</li>
                        </ol>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-red-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Security Validations</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Replay Protection:</strong> Each txId can only be used once (tracked in database)</li>
                            <li>• <strong className="text-white">Amount Verification:</strong> Bets/stakes must match expected amounts</li>
                            <li>• <strong className="text-white">Address Whitelist:</strong> Vault address matches environment config</li>
                            <li>• <strong className="text-white">Deadline Enforcement:</strong> Transactions submitted after timeout are rejected</li>
                            <li>• <strong className="text-white">Payload Integrity:</strong> OP_RETURN data matches action parameters</li>
                            <li>• <strong className="text-white">Double-Spend Protection:</strong> Kaspa consensus prevents duplicate transactions</li>
                        </ul>
                    </div>
                </div>

                {/* Vault System */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Vault System (Server-Side)</h3>
                <p>
                    The <code className="text-cyan-400">vault-service.ts</code> handles automated treasury operations: receiving bets/stakes, distributing payouts, and processing weekly rewards. Uses <strong>kaspalib</strong> for transaction building with private key management.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Vault Operations</div>
                    
                    <div className="space-y-4 text-xs">
                        <div>
                            <div className="text-orange-400 mb-2 font-mono">getVaultBalance(network): Promise&lt;VaultBalance&gt;</div>
                            <div className="text-muted-foreground">
                                Fetches vault balance by querying Kaspa API for UTXOs, summing amounts. Returns balance in sompi and KAS.
                            </div>
                        </div>

                        <div>
                            <div className="text-orange-400 mb-2 font-mono">sendFromVault(network, toAddress, amount, reason): Promise&lt;VaultTransferResult&gt;</div>
                            <div className="text-muted-foreground">
                                Builds transaction using kaspalib, signs with vault private key, broadcasts to Kaspa network. Used for bet payouts and weekly distributions.
                            </div>
                        </div>

                        <div>
                            <div className="text-orange-400 mb-2 font-mono">getVaultConfig(network): VaultConfig</div>
                            <div className="text-muted-foreground">
                                Reads vault address and private key from environment variables. Critical security: private keys never exposed to client.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Transaction Building with kaspalib</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-green-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`import { Transaction, Address, OutScript } from 'kaspalib';
import { schnorr } from '@noble/curves/secp256k1';

// 1. Fetch UTXOs from Kaspa API
const utxos = await fetch(\`\${apiUrl}/addresses/\${vaultAddress}/utxos\`);

// 2. Build transaction inputs/outputs
const tx = new Transaction({
  inputs: utxos.map(utxo => ({
    prevTxId: utxo.outpoint.transactionId,
    outpoint: utxo.outpoint,
    sigScript: new Uint8Array(),
    sequence: BigInt(0)
  })),
  outputs: [
    {
      value: amountSompi,
      scriptPublicKey: OutScript.address(toAddress, isTestnet)
    },
    // Change output back to vault
    {
      value: changeAmount,
      scriptPublicKey: OutScript.address(vaultAddress, isTestnet)
    }
  ],
  version: 0,
  lockTime: BigInt(0)
});

// 3. Sign transaction with private key
const privateKeyBytes = hexToBytes(privateKey);
const signature = schnorr.sign(txHash, privateKeyBytes);

// 4. Broadcast to Kaspa network
await fetch(\`\${apiUrl}/transactions\`, {
  method: 'POST',
  body: JSON.stringify(signedTx)
});`}
                    </pre>
                </div>

                {/* NFT Minting */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">NFT Minting (Cosmetics)</h3>
                <p>
                    Cosmetic purchases trigger <strong>NFT minting</strong> by embedding metadata in transaction payloads. Each item becomes a verifiable on-chain asset.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">NFT Metadata Structure</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-pink-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`{
  "protocol": "KCLASH-NFT",
  "version": "1.0",
  "type": "cosmetic",
  "cosmetic": {
    "id": "cyber-ninja-skin-01",
    "name": "Neon Samurai Skin",
    "category": "character_skin",
    "rarity": "epic",
    "thumbnailUrl": "https://cdn.kaspaclash.com/...",
    "assetPath": "/cosmetics/skins/cyber-ninja/neon-samurai.png"
  },
  "mintedAt": "2026-02-03T15:30:00Z",
  "mintedBy": "KaspaClash-Treasury"
}`}
                    </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-cyan-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Minting Process</h4>
                        <ol className="space-y-2 text-xs text-muted-foreground ml-4">
                            <li>1. Player purchases cosmetic from shop</li>
                            <li>2. Payment transaction verified on-chain</li>
                            <li>3. Backend builds NFT metadata JSON</li>
                            <li>4. Metadata encoded as compact payload (&lt;512 bytes)</li>
                            <li>5. Vault sends 0.00001 KAS to player with metadata</li>
                            <li>6. Transaction serves as NFT "mint certificate"</li>
                            <li>7. Player owns verifiable on-chain proof</li>
                        </ol>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Ownership Verification</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Explorer Check:</strong> View transaction on Kaspa Explorer</li>
                            <li>• <strong className="text-white">Payload Parsing:</strong> Decode metadata from transaction data</li>
                            <li>• <strong className="text-white">Address Validation:</strong> Verify recipient matches player wallet</li>
                            <li>• <strong className="text-white">Protocol Filter:</strong> Query all "KCLASH-NFT" transactions</li>
                            <li>• <strong className="text-white">Immutable Proof:</strong> Cannot be revoked or altered</li>
                        </ul>
                    </div>
                </div>

                {/* WASM SDK */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Kaspa WASM SDK</h3>
                <p>
                    The <code className="text-cyan-400">@dfns/kaspa-wasm</code> package provides WebAssembly bindings for Kaspa cryptography. KaspaClash uses a <strong>lazy-loading pattern</strong> to avoid SSR issues.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">WASM Initialization Pattern</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-blue-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`// src/lib/kaspa/loader.ts
let kaspaModule: typeof import("kaspa-wasm") | null = null;
let initialized = false;

export async function initKaspa(): Promise<void> {
  if (initialized) return; // Idempotent
  
  if (typeof window === "undefined") {
    console.warn("Kaspa WASM requires browser environment");
    return;
  }
  
  // Dynamic import (client-side only)
  kaspaModule = await import("kaspa-wasm");
  
  // Enable panic hooks for debugging
  kaspaModule.initConsolePanicHook();
  
  initialized = true;
}

// Usage in components
useEffect(() => {
  initKaspa(); // Lazy load when component mounts
}, []);`}
                    </pre>
                </div>

                {/* Network Configuration */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Network Configuration</h3>
                <p>
                    KaspaClash supports both <strong>Mainnet</strong> and <strong>Testnet-10</strong>. Environment variables configure RPC endpoints and vault addresses per network.
                </p>

                <div className="overflow-x-auto my-6 not-prose">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-cyber-gold/30">
                                <th className="text-left p-3 text-white font-semibold">Environment Variable</th>
                                <th className="text-left p-3 text-white font-semibold">Purpose</th>
                                <th className="text-left p-3 text-white font-semibold">Example Value</th>
                            </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                            <tr className="border-b border-white/10 bg-cyan-500/5">
                                <td className="p-3"><code className="text-cyan-400">NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET</code></td>
                                <td className="p-3">Testnet vault address (public)</td>
                                <td className="p-3">kaspatest:qr...</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">BETTING_VAULT_PRIVATE_KEY_TESTNET</code></td>
                                <td className="p-3">Testnet vault private key (secret)</td>
                                <td className="p-3">hex_private_key</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-green-500/5">
                                <td className="p-3"><code className="text-cyan-400">NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET</code></td>
                                <td className="p-3">Mainnet vault address (public)</td>
                                <td className="p-3">kaspa:qr...</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">BETTING_VAULT_PRIVATE_KEY_MAINNET</code></td>
                                <td className="p-3">Mainnet vault private key (secret)</td>
                                <td className="p-3">hex_private_key</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-blue-500/5">
                                <td className="p-3"><code className="text-cyan-400">KASPA_RPC_URL_TESTNET</code></td>
                                <td className="p-3">Testnet RPC endpoint</td>
                                <td className="p-3">wss://baryon-10.kaspa.green/kaspa/testnet-10/wrpc/borsh</td>
                            </tr>
                            <tr className="bg-purple-500/5">
                                <td className="p-3"><code className="text-cyan-400">KASPA_RPC_URL_MAINNET</code></td>
                                <td className="p-3">Mainnet RPC endpoint</td>
                                <td className="p-3">wss://public-mainnet.kaspa.org</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Best Practices */}
                <div className="bg-gradient-to-br from-cyber-gold/20 to-cyber-blue/20 p-8 rounded-2xl border border-cyber-gold/50 mt-12">
                    <h3 className="text-2xl text-cyber-gold mb-4 mt-0">Best Practices</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <div className="text-green-400 font-semibold mb-2">✓ Do This</div>
                            <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• Always verify transactions on-chain before executing logic</li>
                                <li>• Use environment variables for network-specific config</li>
                                <li>• Implement replay protection (track used txIds)</li>
                                <li>• Keep private keys server-side only (never expose)</li>
                                <li>• Use OP_RETURN for immutable game state proofs</li>
                                <li>• Handle network errors gracefully (retry with backoff)</li>
                                <li>• Test on Testnet-10 before mainnet deployment</li>
                                <li>• Monitor vault balance, set low-balance alerts</li>
                            </ul>
                        </div>
                        <div>
                            <div className="text-red-400 font-semibold mb-2">✗ Avoid This</div>
                            <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• Don't trust client-submitted data without verification</li>
                                <li>• Don't hardcode network addresses (use env vars)</li>
                                <li>• Don't skip transaction confirmation checks</li>
                                <li>• Don't reuse transaction IDs (implement deduplication)</li>
                                <li>• Don't expose vault private keys in client bundles</li>
                                <li>• Don't assume instant confirmations (wait ~1s)</li>
                                <li>• Don't use optimistic updates for financial actions</li>
                                <li>• Don't ignore network congestion/fee spikes</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
