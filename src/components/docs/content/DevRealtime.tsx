import React from 'react';

export function DevRealtime() {
    return (
        <div className="space-y-8">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                
                {/* Hero */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 rounded-2xl border border-purple-500/30 mb-8">
                    <h2 className="text-3xl text-cyber-gold mb-4 mt-0">Realtime Sync</h2>
                    <p className="text-lg mb-0">
                        KaspaClash uses <strong>Supabase Realtime</strong> for WebSocket-based state synchronization with sub-100ms latency. This guide covers channel architecture, event broadcasting, presence tracking, and the hybrid approach that keeps critical state on-chain while enabling instant UI updates.
                    </p>
                </div>

                {/* Architecture Overview */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Architecture: Blockchain + Realtime Hybrid</h3>
                <p>
                    KaspaClash combines <strong>blockchain finality</strong> (Kaspa) with <strong>instant synchronization</strong> (Supabase Realtime) to achieve both security and responsiveness.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-green-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">🔗 Blockchain (Source of Truth)</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Move Verification:</strong> Every move is a Kaspa transaction with OP_RETURN payload</li>
                            <li>• <strong className="text-white">Bet Settlement:</strong> Betting pool deposits verified on-chain before acceptance</li>
                            <li>• <strong className="text-white">Immutable Proof:</strong> Match outcomes and moves are permanently recorded</li>
                            <li>• <strong className="text-white">~1s Finality:</strong> Kaspa's BlockDAG confirms transactions within 1-2 seconds</li>
                            <li>• <strong className="text-white">Anti-Cheat:</strong> Server validates every transaction exists on blockchain</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">⚡ Realtime (Instant Sync)</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">State Broadcasting:</strong> Round results, health/energy updates pushed to all clients</li>
                            <li>• <strong className="text-white">Presence Tracking:</strong> Player online/offline status, character selection readiness</li>
                            <li>• <strong className="text-white">Spectator Feeds:</strong> Live match updates for viewers, synchronized betting odds</li>
                            <li>• <strong className="text-white">Chat/Stickers:</strong> In-game communication without blockchain overhead</li>
                            <li>• <strong className="text-white">&lt;100ms Latency:</strong> WebSocket-based instant delivery to all subscribers</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Data Flow Example: Move Submission</div>
                    
                    <div className="space-y-3 text-xs">
                        <div className="flex gap-4">
                            <div className="w-20 flex-shrink-0">
                                <div className="bg-cyan-500/20 px-3 py-1 rounded border border-cyan-500/30 text-cyan-400 text-center text-xs">
                                    Client
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">1. Player submits move (Punch) - triggers Kaspa transaction</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-20 flex-shrink-0">
                                <div className="bg-green-500/20 px-3 py-1 rounded border border-green-500/30 text-green-400 text-center text-xs">
                                    Blockchain
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">2. Transaction confirmed on Kaspa (~1 second)</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-20 flex-shrink-0">
                                <div className="bg-orange-500/20 px-3 py-1 rounded border border-orange-500/30 text-orange-400 text-center text-xs">
                                    Server
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">3. Backend verifies txId exists, broadcasts "move_confirmed" to Realtime channel</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-20 flex-shrink-0">
                                <div className="bg-purple-500/20 px-3 py-1 rounded border border-purple-500/30 text-purple-400 text-center text-xs">
                                    Realtime
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">4. Both players + all spectators receive instant update (&lt;100ms)</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-20 flex-shrink-0">
                                <div className="bg-cyan-500/20 px-3 py-1 rounded border border-cyan-500/30 text-cyan-400 text-center text-xs">
                                    Client
                                </div>
                            </div>
                            <div className="flex-1 text-muted-foreground">
                                <div className="text-white mb-1">5. UI updates: show opponent's "locked in" status, enable combat animations</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Channel Architecture */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Channel Architecture</h3>
                <p>
                    Supabase Realtime channels are <strong>topic-based subscriptions</strong> where clients listen for specific events. KaspaClash uses multiple channel types for different game systems.
                </p>

                <div className="overflow-x-auto my-6 not-prose">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-cyber-gold/30">
                                <th className="text-left p-3 text-white font-semibold">Channel Name</th>
                                <th className="text-left p-3 text-white font-semibold">Type</th>
                                <th className="text-left p-3 text-white font-semibold">Purpose</th>
                                <th className="text-left p-3 text-white font-semibold">Key Events</th>
                            </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                            <tr className="border-b border-white/10 bg-cyan-500/5">
                                <td className="p-3"><code className="text-cyan-400">game:{'${matchId}'}</code></td>
                                <td className="p-3">Broadcast + Presence</td>
                                <td className="p-3">Active match coordination</td>
                                <td className="p-3">round_starting, move_confirmed, round_resolved, match_ended</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">chat:{'${matchId}'}</code></td>
                                <td className="p-3">Broadcast</td>
                                <td className="p-3">Spectator chat messages</td>
                                <td className="p-3">chat_message</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-purple-500/5">
                                <td className="p-3"><code className="text-cyan-400">matchmaking:queue</code></td>
                                <td className="p-3">Broadcast</td>
                                <td className="p-3">Queue updates, match pairing</td>
                                <td className="p-3">match_found</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">betting:{'${matchId}'}</code></td>
                                <td className="p-3">Postgres Changes</td>
                                <td className="p-3">Betting pool updates</td>
                                <td className="p-3">INSERT/UPDATE on betting_pools table</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-green-500/5">
                                <td className="p-3"><code className="text-cyan-400">currency:{'${playerId}'}</code></td>
                                <td className="p-3">Postgres Changes</td>
                                <td className="p-3">Player currency updates</td>
                                <td className="p-3">UPDATE on player_currency table</td>
                            </tr>
                            <tr className="bg-blue-500/5">
                                <td className="p-3"><code className="text-cyan-400">progression:{'${playerAddress}'}</code></td>
                                <td className="p-3">Broadcast</td>
                                <td className="p-3">XP/tier progress notifications</td>
                                <td className="p-3">xp_gained, tier_unlocked, quest_completed</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Realtime Primitives */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Supabase Realtime Primitives</h3>
                <p>
                    Supabase Realtime provides three core mechanisms for state synchronization. KaspaClash uses all three based on use case requirements.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-cyan-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">📡 Broadcast</h4>
                        <div className="text-muted-foreground text-xs space-y-2">
                            <div><strong className="text-white">Purpose:</strong> One-to-many event publishing</div>
                            <div><strong className="text-white">Pattern:</strong> Server sends events, all clients listen</div>
                            <div><strong className="text-white">Use Cases:</strong> Match events (round_starting, round_resolved), character selection, chat messages</div>
                            <div><strong className="text-white">Persistence:</strong> Ephemeral - messages not stored</div>
                            <div><strong className="text-white">API:</strong> <code className="text-green-400">channel.send()</code> (server), <code className="text-green-400">.on("broadcast")</code> (client)</div>
                        </div>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">👥 Presence</h4>
                        <div className="text-muted-foreground text-xs space-y-2">
                            <div><strong className="text-white">Purpose:</strong> Track who's online and their state</div>
                            <div><strong className="text-white">Pattern:</strong> Each client broadcasts their status</div>
                            <div><strong className="text-white">Use Cases:</strong> Player ready state, character selection lock, typing indicators</div>
                            <div><strong className="text-white">Persistence:</strong> Automatic cleanup on disconnect</div>
                            <div><strong className="text-white">API:</strong> <code className="text-green-400">channel.track()</code> (update), <code className="text-green-400">.presenceState()</code> (read)</div>
                        </div>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-orange-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">🗄️ Postgres Changes</h4>
                        <div className="text-muted-foreground text-xs space-y-2">
                            <div><strong className="text-white">Purpose:</strong> Real-time database change notifications</div>
                            <div><strong className="text-white">Pattern:</strong> Listen to INSERT/UPDATE/DELETE on tables</div>
                            <div><strong className="text-white">Use Cases:</strong> Currency updates, betting pool changes, quest progress</div>
                            <div><strong className="text-white">Persistence:</strong> Database-backed, survives restarts</div>
                            <div><strong className="text-white">API:</strong> <code className="text-green-400">.on("postgres_changes", ...)</code></div>
                        </div>
                    </div>
                </div>

                {/* Game Channel Implementation */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Game Channel Implementation (Players)</h3>
                <p>
                    The <code className="text-cyan-400">useGameChannel</code> hook manages bidirectional communication for active match participants. Players both send and receive events.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Hook Setup Example</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-cyan-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`import { useGameChannel } from '@/hooks/useGameChannel';
import { EventBus } from '@/game/EventBus';

function MatchClient({ matchId, playerAddress, playerRole }) {
  const { state, subscribe, trackPresence, sendChatMessage } = useGameChannel({
    matchId,
    playerAddress,
    playerRole,
    
    // Event handlers
    onRoundStarting: (payload) => {
      console.log('Round starting:', payload.roundNumber);
      EventBus.emit('game:roundStarting', payload);
    },
    
    onRoundResolved: (payload) => {
      console.log('Round resolved:', payload.player1.move, 'vs', payload.player2.move);
      // Update health displays, trigger combat animations
      updateHealthBars(payload.player1Health, payload.player2Health);
    },
    
    onMatchEnded: (payload) => {
      console.log('Match ended:', payload.winner, payload.reason);
      showResultsScreen(payload);
    }
  });
  
  useEffect(() => {
    subscribe(); // Connect to game:{matchId} channel
  }, [subscribe]);
  
  // Track ready state when character selected
  const handleCharacterLock = async () => {
    await trackPresence(true); // Update presence: isReady = true
  };
  
  return (
    <div>
      <ConnectionStatus isConnected={state.isConnected} />
      <PlayersList players={Array.from(state.players.values())} />
    </div>
  );
}`}
                    </pre>
                </div>

                <div className="overflow-x-auto my-6 not-prose">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-cyber-gold/30">
                                <th className="text-left p-3 text-white font-semibold">Event Name</th>
                                <th className="text-left p-3 text-white font-semibold">Direction</th>
                                <th className="text-left p-3 text-white font-semibold">Payload</th>
                                <th className="text-left p-3 text-white font-semibold">When Triggered</th>
                            </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                            <tr className="border-b border-white/10 bg-cyan-500/5">
                                <td className="p-3"><code className="text-cyan-400">character_selected</code></td>
                                <td className="p-3">Client → All</td>
                                <td className="p-3">player, characterId, locked</td>
                                <td className="p-3">Player hovers/locks character during selection</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">match_starting</code></td>
                                <td className="p-3">Server → All</td>
                                <td className="p-3">matchId, players, startsAt</td>
                                <td className="p-3">Both players locked in, countdown begins</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-purple-500/5">
                                <td className="p-3"><code className="text-cyan-400">round_starting</code></td>
                                <td className="p-3">Server → All</td>
                                <td className="p-3">roundNumber, health, moveDeadline</td>
                                <td className="p-3">New round begins, reset move selection UI</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">move_submitted</code></td>
                                <td className="p-3">Server → All</td>
                                <td className="p-3">player, txId, submittedAt</td>
                                <td className="p-3">Move transaction broadcast (not confirmed yet)</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-green-500/5">
                                <td className="p-3"><code className="text-cyan-400">move_confirmed</code></td>
                                <td className="p-3">Server → All</td>
                                <td className="p-3">player, txId, blockHeight</td>
                                <td className="p-3">Kaspa confirms transaction on-chain</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">round_resolved</code></td>
                                <td className="p-3">Server → All</td>
                                <td className="p-3">moves, damage, health, winner</td>
                                <td className="p-3">Both moves confirmed, combat calculated</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-blue-500/5">
                                <td className="p-3"><code className="text-cyan-400">match_ended</code></td>
                                <td className="p-3">Server → All</td>
                                <td className="p-3">winner, reason, stats, ratings</td>
                                <td className="p-3">Match concludes (KO, rounds won, timeout, forfeit)</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">chat_message</code></td>
                                <td className="p-3">Client → All</td>
                                <td className="p-3">sender, message, timestamp</td>
                                <td className="p-3">Player sends in-match quick chat</td>
                            </tr>
                            <tr className="bg-pink-500/5">
                                <td className="p-3"><code className="text-cyan-400">sticker_displayed</code></td>
                                <td className="p-3">Client → All</td>
                                <td className="p-3">sender, stickerId, timestamp</td>
                                <td className="p-3">Player displays emote sticker above character</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Spectator Channel */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Spectator Channel (Read-Only)</h3>
                <p>
                    Spectators use <code className="text-cyan-400">useSpectatorChannel</code> for <strong>read-only access</strong> to the same <code className="text-cyan-400">game:{'${matchId}'}</code> channel. They receive all match events but cannot send presence or game actions.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Spectator Hook Example</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-purple-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`import { useSpectatorChannel } from '@/hooks/useSpectatorChannel';

function SpectatorClient({ matchId }) {
  const { state, subscribe } = useSpectatorChannel({
    matchId,
    
    onRoundStarting: (payload) => {
      // Update spectator UI with round info
      updateRoundDisplay(payload.roundNumber);
    },
    
    onRoundResolved: (payload) => {
      // Show combat results to spectators
      displayCombatAnimation(payload);
      updateHealthBars(payload.player1Health, payload.player2Health);
    },
    
    onMatchEnded: (payload) => {
      // Settle bets, show final results
      settleBets(payload.winner);
      showMatchResults(payload);
    }
  });
  
  useEffect(() => {
    subscribe(); // Listen to game:{matchId} (no presence tracking)
  }, [subscribe]);
  
  return (
    <SpectatorView isConnected={state.isConnected} error={state.error} />
  );
}`}
                    </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-cyan-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Player Channel (Bidirectional)</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Presence:</strong> Tracks isReady state, character selection</li>
                            <li>• <strong className="text-white">Send Events:</strong> character_selected, chat_message, sticker_displayed</li>
                            <li>• <strong className="text-white">Receive Events:</strong> All match events (round_starting, etc.)</li>
                            <li>• <strong className="text-white">Use Case:</strong> Active match participants</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Spectator Channel (Read-Only)</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">No Presence:</strong> Invisible to players, doesn't affect match state</li>
                            <li>• <strong className="text-white">No Sending:</strong> Cannot influence match, only observe</li>
                            <li>• <strong className="text-white">Receive Events:</strong> All match events (same as players)</li>
                            <li>• <strong className="text-white">Use Case:</strong> Viewing matches, betting, highlights</li>
                        </ul>
                    </div>
                </div>

                {/* Server-Side Broadcasting */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Server-Side Broadcasting</h3>
                <p>
                    The backend uses <code className="text-cyan-400">broadcastToChannel()</code> to push authoritative state updates to all connected clients after blockchain verification.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Broadcast Helper (Direct REST API)</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-orange-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`// src/lib/supabase/broadcast.ts
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Broadcasts event to Realtime channel via REST API (bypasses WebSocket).
 * Includes retry logic for reliability.
 */
export async function broadcastToChannel(
  supabase: SupabaseClient,
  channelName: string,
  event: string,
  payload: Record<string, unknown>,
  maxRetries = 2
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Realtime REST API endpoint
  const broadcastUrl = \`\${supabaseUrl}/realtime/v1/api/broadcast\`;
  
  const body = {
    messages: [{
      topic: channelName,
      event: event,
      payload: payload,
      ref: null
    }]
  };
  
  const response = await fetch(broadcastUrl, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': \`Bearer \${serviceKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(\`Broadcast failed: \${response.status}\`);
  }
}`}
                    </pre>
                </div>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Usage in Match Resolution</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-green-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`// Backend API route: /api/match/resolve-round
import { broadcastToChannel } from '@/lib/supabase/broadcast';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  // 1. Verify both move transactions on Kaspa blockchain
  const player1TxValid = await verifyKaspaTransaction(player1TxId);
  const player2TxValid = await verifyKaspaTransaction(player2TxId);
  
  if (!player1TxValid || !player2TxValid) {
    return new Response('Invalid transactions', { status: 400 });
  }
  
  // 2. Calculate combat results
  const result = calculateCombat(player1Move, player2Move);
  
  // 3. Update database
  await updateMatchState(matchId, result);
  
  // 4. Broadcast to all clients (players + spectators)
  const supabase = getSupabaseServerClient();
  
  await broadcastToChannel(
    supabase,
    \`game:\${matchId}\`,
    'round_resolved',
    {
      roundNumber: currentRound,
      player1: { move: player1Move, damageDealt: result.p1Damage },
      player2: { move: player2Move, damageDealt: result.p2Damage },
      player1Health: result.p1HealthAfter,
      player2Health: result.p2HealthAfter,
      roundWinner: result.winner,
      isMatchOver: result.isMatchOver
    }
  );
  
  return new Response('Round resolved', { status: 200 });
}`}
                    </pre>
                </div>

                {/* Postgres Changes */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Postgres Changes (Database-Driven Sync)</h3>
                <p>
                    For state backed by the database (currency, betting pools, quests), KaspaClash uses <strong>Postgres Changes</strong> to automatically push updates when rows change.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Currency Realtime Example</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-pink-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`// src/hooks/useCurrencyRealtime.ts
import { createClient } from '@supabase/supabase-js';

export function useCurrencyRealtime({ playerId, enabled = true }) {
  useEffect(() => {
    if (!enabled || !playerId) return;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Subscribe to player_currency table changes for this player
    const channel = supabase
      .channel(\`currency:\${playerId}\`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'player_currency',
          filter: \`player_id=eq.\${playerId}\`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new;
            
            // Update Zustand store
            setCurrency({
              playerId,
              clashShards: newData.clash_shards,
              totalEarned: newData.total_earned,
              totalSpent: newData.total_spent,
              lastUpdated: new Date()
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerId, enabled]);
}`}
                    </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-cyan-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">When to Use Broadcast</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Ephemeral Events:</strong> Don't need database persistence</li>
                            <li>• <strong className="text-white">Match State:</strong> Round results, move confirmations</li>
                            <li>• <strong className="text-white">Chat/Stickers:</strong> Transient communication</li>
                            <li>• <strong className="text-white">Low Latency:</strong> Fastest delivery method (&lt;100ms)</li>
                            <li>• <strong className="text-white">Custom Payloads:</strong> Flexible event structure</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">When to Use Postgres Changes</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Persistent State:</strong> Data stored in database</li>
                            <li>• <strong className="text-white">Currency/XP:</strong> Balance updates, progression</li>
                            <li>• <strong className="text-white">Betting Pools:</strong> Pool totals, odds changes</li>
                            <li>• <strong className="text-white">Automatic Sync:</strong> No manual broadcast calls needed</li>
                            <li>• <strong className="text-white">Row-Level Security:</strong> Respects Postgres RLS policies</li>
                        </ul>
                    </div>
                </div>

                {/* Presence Tracking */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Presence Tracking</h3>
                <p>
                    Presence enables <strong>real-time awareness</strong> of who's connected and their current state. KaspaClash uses it for character selection coordination and player readiness.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Presence API Example</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-blue-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`const channel = supabase.channel(\`game:\${matchId}\`, {
  config: {
    presence: { key: playerAddress } // Unique key per user
  }
});

// Set up presence listeners
channel
  .on('presence', { event: 'sync' }, () => {
    const presenceState = channel.presenceState();
    console.log('All online players:', presenceState);
    
    // Update UI with player list
    updatePlayerList(Object.values(presenceState));
  })
  .on('presence', { event: 'join' }, ({ newPresences }) => {
    console.log('Player joined:', newPresences);
    showNotification(\`\${newPresences[0].address} joined\`);
  })
  .on('presence', { event: 'leave' }, ({ leftPresences }) => {
    console.log('Player left:', leftPresences);
    showNotification(\`\${leftPresences[0].address} left\`);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      // Track own presence
      await channel.track({
        address: playerAddress,
        role: playerRole,
        isReady: false,
        characterId: null
      });
    }
  });

// Update presence when character locked
async function lockCharacter(characterId: string) {
  await channel.track({
    address: playerAddress,
    role: playerRole,
    isReady: true,
    characterId: characterId
  });
}`}
                    </pre>
                </div>

                {/* State Management Integration */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">State Management Integration</h3>
                <p>
                    Realtime events update <strong>Zustand stores</strong> which trigger React re-renders. The <code className="text-cyan-400">EventBus</code> bridges Realtime hooks to Phaser game scenes.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Data Flow: Realtime → Zustand → React/Phaser</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-cyan-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`// 1. Realtime event received
const handleRoundResolved = useCallback((payload: RoundResolvedPayload) => {
  console.log('[GameChannel] round_resolved:', payload);
  
  // 2. Update Zustand store (React state)
  matchActions.resolveRound(
    payload.player1.move,
    payload.player2.move,
    payload.player1.damageDealt,
    payload.player2.damageDealt
  );
  
  matchActions.setPlayerHealth('player1', payload.player1Health);
  matchActions.setPlayerHealth('player2', payload.player2Health);
  
  // 3. Emit to Phaser EventBus (game engine)
  EventBus.emit('game:roundResolved', payload);
  
  // 4. User callback (optional custom logic)
  onRoundResolved?.(payload);
}, [matchActions, onRoundResolved]);

// Zustand store automatically triggers React re-renders
export const useMatchStore = create<MatchState>()((set) => ({
  currentRound: { player1Health: 100, player2Health: 100 },
  
  actions: {
    setPlayerHealth: (player, health) => {
      set((state) => ({
        currentRound: {
          ...state.currentRound,
          [\`\${player}Health\`]: health
        }
      }));
    }
  }
}));

// React components subscribe to store
function HealthBar({ player }: { player: 'player1' | 'player2' }) {
  const health = useMatchStore((state) => 
    state.currentRound[\`\${player}Health\`]
  );
  
  return <div style={{ width: \`\${health}%\` }} />;
}`}
                    </pre>
                </div>

                {/* Error Handling */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Error Handling & Retry Logic</h3>
                <p>
                    Production Realtime connections must handle network errors, reconnections, and stale state gracefully.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-red-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Connection States</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">SUBSCRIBED:</strong> Active connection, receiving events</li>
                            <li>• <strong className="text-white">CHANNEL_ERROR:</strong> Connection failed, implement retry</li>
                            <li>• <strong className="text-white">TIMED_OUT:</strong> Subscription timeout, retry needed</li>
                            <li>• <strong className="text-white">CLOSED:</strong> Channel closed (user unsubscribed)</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-green-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">Retry Strategy</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Max Retries:</strong> Attempt 3 times before failing</li>
                            <li>• <strong className="text-white">Exponential Backoff:</strong> 5s, 10s, 15s delays</li>
                            <li>• <strong className="text-white">User Notification:</strong> Show connection error UI</li>
                            <li>• <strong className="text-white">State Sync:</strong> Fetch latest state on reconnect</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Retry Logic Implementation</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-orange-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`const retryCountRef = useRef(0);
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

channel.subscribe((status, err) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected successfully');
    retryCountRef.current = 0; // Reset retry count
    setState({ isConnected: true, error: null });
  }
  
  else if (status === 'CHANNEL_ERROR') {
    console.warn('Channel error:', err);
    
    if (retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current++;
      const delay = RETRY_DELAY * retryCountRef.current;
      
      console.log(\`Retrying in \${delay}ms (attempt \${retryCountRef.current}/\${MAX_RETRIES})\`);
      
      setTimeout(() => {
        channel.subscribe(); // Retry subscription
      }, delay);
    } else {
      console.error('Max retries reached');
      setState({ 
        isConnected: false, 
        error: 'Failed to connect after retries' 
      });
    }
  }
  
  else if (status === 'TIMED_OUT') {
    console.warn('Subscription timed out, retrying...');
    setTimeout(() => channel.subscribe(), RETRY_DELAY);
  }
});`}
                    </pre>
                </div>

                {/* Best Practices */}
                <div className="bg-gradient-to-br from-cyber-gold/20 to-cyber-blue/20 p-8 rounded-2xl border border-cyber-gold/50 mt-12">
                    <h3 className="text-2xl text-cyber-gold mb-4 mt-0">Best Practices</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <div className="text-green-400 font-semibold mb-2">✓ Do This</div>
                            <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• Always clean up subscriptions in useEffect cleanup</li>
                                <li>• Use presence for user status, broadcast for events</li>
                                <li>• Implement retry logic for network errors</li>
                                <li>• Filter own events to avoid duplicate processing</li>
                                <li>• Validate payloads before updating state</li>
                                <li>• Use EventBus to bridge Realtime → Phaser</li>
                                <li>• Keep channel names consistent (game:{'{matchId}'})</li>
                                <li>• Monitor connection status, show offline UI</li>
                            </ul>
                        </div>
                        <div>
                            <div className="text-red-400 font-semibold mb-2">✗ Avoid This</div>
                            <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• Don't trust client-sent events without server validation</li>
                                <li>• Don't use Realtime for blockchain-verified actions</li>
                                <li>• Don't subscribe to channels unnecessarily (memory leak)</li>
                                <li>• Don't ignore connection errors (retry or notify user)</li>
                                <li>• Don't send large payloads (&gt;1KB) via broadcast</li>
                                <li>• Don't use presence for state (it's for who's online)</li>
                                <li>• Don't create multiple subscriptions to same channel</li>
                                <li>• Don't assume events arrive in order (add timestamps)</li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
