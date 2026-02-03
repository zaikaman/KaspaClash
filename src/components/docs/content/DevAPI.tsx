import React from 'react';

export function DevAPI() {
    return (
        <div className="space-y-8">
            <div className="prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-cyber-gold">
                
                {/* Hero */}
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-8 rounded-2xl border border-blue-500/30 mb-8">
                    <h2 className="text-3xl text-cyber-gold mb-4 mt-0">REST API</h2>
                    <p className="text-lg mb-0">
                        KaspaClash exposes a <strong>RESTful API</strong> via Next.js App Router serverless functions. All endpoints handle authentication, input validation, blockchain verification, and return standardized JSON responses with comprehensive error handling.
                    </p>
                </div>

                {/* Architecture */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">API Architecture</h3>
                <p>
                    The API layer sits between React clients and the database/blockchain, enforcing business logic and security constraints. All routes are deployed as <strong>serverless functions</strong> on Vercel Edge Network.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 not-prose">
                    <div className="bg-black/40 p-5 rounded-xl border border-cyan-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">🔐 Security</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Zod Validation:</strong> All inputs validated against schemas</li>
                            <li>• <strong className="text-white">Address Verification:</strong> Kaspa address format checks</li>
                            <li>• <strong className="text-white">Transaction Proofs:</strong> On-chain verification for payments</li>
                            <li>• <strong className="text-white">CORS Protection:</strong> Same-origin policy enforcement</li>
                            <li>• <strong className="text-white">SQL Injection:</strong> Supabase parameterized queries</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-purple-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">⚡ Performance</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Edge Deployment:</strong> &lt;50ms cold starts on Vercel Edge</li>
                            <li>• <strong className="text-white">Connection Pooling:</strong> Supabase client reuse</li>
                            <li>• <strong className="text-white">Optimistic Responses:</strong> Return before broadcast</li>
                            <li>• <strong className="text-white">Caching:</strong> Next.js fetch cache for static data</li>
                            <li>• <strong className="text-white">Parallel Queries:</strong> Promise.all for multi-table reads</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-5 rounded-xl border border-green-500/30">
                        <h4 className="text-white font-semibold mb-3 text-sm">📊 Monitoring</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• <strong className="text-white">Error Logging:</strong> console.error for debugging</li>
                            <li>• <strong className="text-white">Status Codes:</strong> HTTP standards (200, 400, 404, 500)</li>
                            <li>• <strong className="text-white">Health Check:</strong> GET /api/health endpoint</li>
                            <li>• <strong className="text-white">Response Times:</strong> Vercel Analytics tracking</li>
                            <li>• <strong className="text-white">Error Rates:</strong> Grouped by error code</li>
                        </ul>
                    </div>
                </div>

                {/* Error Handling */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Error Handling System</h3>
                <p>
                    All API routes use a <strong>centralized error system</strong> with typed error codes, consistent response structure, and proper HTTP status codes.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Error Response Format</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-red-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`// Standard error response
{
  "error": {
    "code": "INVALID_ADDRESS",
    "message": "Invalid Kaspa address: kaspa:invalid",
    "details": { // Optional, for validation errors
      "field": "address",
      "constraint": "regex"
    }
  }
}`}
                    </pre>
                </div>

                <div className="overflow-x-auto my-6 not-prose">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-cyber-gold/30">
                                <th className="text-left p-3 text-white font-semibold">Error Code</th>
                                <th className="text-left p-3 text-white font-semibold">HTTP Status</th>
                                <th className="text-left p-3 text-white font-semibold">Description</th>
                                <th className="text-left p-3 text-white font-semibold">Example</th>
                            </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                            <tr className="border-b border-white/10 bg-red-500/5">
                                <td className="p-3"><code className="text-cyan-400">BAD_REQUEST</code></td>
                                <td className="p-3">400</td>
                                <td className="p-3">Invalid request parameters</td>
                                <td className="p-3">Missing required field</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">VALIDATION_ERROR</code></td>
                                <td className="p-3">400</td>
                                <td className="p-3">Schema validation failed</td>
                                <td className="p-3">Invalid UUID format</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-orange-500/5">
                                <td className="p-3"><code className="text-cyan-400">INVALID_ADDRESS</code></td>
                                <td className="p-3">400</td>
                                <td className="p-3">Kaspa address malformed</td>
                                <td className="p-3">Missing "kaspa:" prefix</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">UNAUTHORIZED</code></td>
                                <td className="p-3">401</td>
                                <td className="p-3">Authentication required</td>
                                <td className="p-3">Missing signature</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-yellow-500/5">
                                <td className="p-3"><code className="text-cyan-400">FORBIDDEN</code></td>
                                <td className="p-3">403</td>
                                <td className="p-3">Permission denied</td>
                                <td className="p-3">Not player in match</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">NOT_FOUND</code></td>
                                <td className="p-3">404</td>
                                <td className="p-3">Resource doesn't exist</td>
                                <td className="p-3">Match ID not found</td>
                            </tr>
                            <tr className="border-b border-white/10 bg-purple-500/5">
                                <td className="p-3"><code className="text-cyan-400">CONFLICT</code></td>
                                <td className="p-3">409</td>
                                <td className="p-3">State conflict</td>
                                <td className="p-3">Move already submitted</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="p-3"><code className="text-cyan-400">RATE_LIMITED</code></td>
                                <td className="p-3">429</td>
                                <td className="p-3">Too many requests</td>
                                <td className="p-3">Queue spam protection</td>
                            </tr>
                            <tr className="bg-red-500/5">
                                <td className="p-3"><code className="text-cyan-400">INTERNAL_ERROR</code></td>
                                <td className="p-3">500</td>
                                <td className="p-3">Server error</td>
                                <td className="p-3">Database connection failed</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Matchmaking Endpoints */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Matchmaking Endpoints</h3>
                
                <div className="space-y-6 my-6">
                    {/* POST /api/matchmaking/queue */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold border border-blue-500/30">POST</span>
                            <code className="text-sm font-mono text-white">/api/matchmaking/queue</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Join the matchmaking queue. Automatically attempts pairing if another player is waiting.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="text-cyan-400 font-semibold mb-2">Request Body</div>
                                <pre className="bg-black/60 p-3 rounded border border-cyan-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "address": "kaspatest:qr..."
}`}
                                </pre>
                            </div>
                            <div>
                                <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                                <pre className="bg-black/60 p-3 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "success": true,
  "queueSize": 3,
  "matchId": "uuid" // If matched
}`}
                                </pre>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="text-white text-xs font-semibold mb-2">Validation Rules</div>
                            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                                <li>• Address must start with "kaspa:" or "kaspatest:"</li>
                                <li>• Address must be at least 40 characters</li>
                                <li>• Player cannot be in multiple queues simultaneously</li>
                                <li>• Fetches player rating from database (default 1000 for new players)</li>
                            </ul>
                        </div>
                    </div>

                    {/* DELETE /api/matchmaking/queue */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-xs font-bold border border-red-500/30">DELETE</span>
                            <code className="text-sm font-mono text-white">/api/matchmaking/queue</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Leave the matchmaking queue.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="text-cyan-400 font-semibold mb-2">Request Body</div>
                                <pre className="bg-black/60 p-3 rounded border border-cyan-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "address": "kaspatest:qr..."
}`}
                                </pre>
                            </div>
                            <div>
                                <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                                <pre className="bg-black/60 p-3 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "success": true
}`}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* POST /api/matchmaking/rooms */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold border border-blue-500/30">POST</span>
                            <code className="text-sm font-mono text-white">/api/matchmaking/rooms</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Create a private room with 6-character code for friend matches.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="text-cyan-400 font-semibold mb-2">Request Body</div>
                                <pre className="bg-black/60 p-3 rounded border border-cyan-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "action": "create",
  "address": "kaspa:qr...",
  "format": "best_of_3"
}`}
                                </pre>
                            </div>
                            <div>
                                <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                                <pre className="bg-black/60 p-3 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "success": true,
  "roomCode": "ABC123",
  "matchId": "uuid"
}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Match Endpoints */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Match Endpoints</h3>

                <div className="space-y-6 my-6">
                    {/* GET /api/matches/[matchId] */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold border border-green-500/30">GET</span>
                            <code className="text-sm font-mono text-white">/api/matches/[matchId]</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Fetch complete match state including player details, characters, rounds won, and health/energy.</p>
                        
                        <div className="text-xs">
                            <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                            <pre className="bg-black/60 p-4 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "id": "uuid",
  "roomCode": "ABC123", // null for ranked
  "player1Address": "kaspa:qr...",
  "player2Address": "kaspa:qr...",
  "player1CharacterId": "cyber-ninja",
  "player2CharacterId": "block-bruiser",
  "format": "best_of_3",
  "status": "in_progress", // waiting | character_select | in_progress | completed | cancelled
  "winnerAddress": null,
  "player1RoundsWon": 1,
  "player2RoundsWon": 0,
  "createdAt": "2026-02-03T12:00:00Z",
  "startedAt": "2026-02-03T12:01:30Z",
  "completedAt": null,
  "player1": {
    "address": "kaspa:qr...",
    "displayName": "CyberSamurai",
    "rating": 1250
  },
  "player2": {
    "address": "kaspa:qr...",
    "displayName": "BlockMaster",
    "rating": 1180
  }
}`}
                            </pre>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="text-white text-xs font-semibold mb-2">Validation</div>
                            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                                <li>• matchId must be valid UUID format</li>
                                <li>• Returns 404 if match not found</li>
                                <li>• Includes player profiles via JOIN query</li>
                            </ul>
                        </div>
                    </div>

                    {/* POST /api/matches/[matchId]/select */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold border border-blue-500/30">POST</span>
                            <code className="text-sm font-mono text-white">/api/matches/[matchId]/select</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Submit character selection. Broadcasts to Realtime when both players lock in.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="text-cyan-400 font-semibold mb-2">Request Body</div>
                                <pre className="bg-black/60 p-3 rounded border border-cyan-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "address": "kaspa:qr...",
  "characterId": "cyber-ninja",
  "locked": true
}`}
                                </pre>
                            </div>
                            <div>
                                <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                                <pre className="bg-black/60 p-3 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "success": true,
  "matchStarting": true, // Both locked
  "startsAt": 1738591200000
}`}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* GET /api/matches/live */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold border border-green-500/30">GET</span>
                            <code className="text-sm font-mono text-white">/api/matches/live</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Fetch all active matches for spectator list.</p>
                        
                        <div className="text-xs">
                            <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                            <pre className="bg-black/60 p-4 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "matches": [
    {
      "id": "uuid",
      "player1Address": "kaspa:qr...",
      "player2Address": "kaspa:qr...",
      "status": "in_progress",
      "startedAt": "2026-02-03T12:00:00Z"
    }
  ]
}`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Betting Endpoints */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Betting Endpoints</h3>

                <div className="space-y-6 my-6">
                    {/* POST /api/betting/place */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold border border-blue-500/30">POST</span>
                            <code className="text-sm font-mono text-white">/api/betting/place</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Place a bet on a match. Validates transaction ID uniqueness and updates pool totals.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="text-cyan-400 font-semibold mb-2">Request Body</div>
                                <pre className="bg-black/60 p-3 rounded border border-cyan-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "matchId": "uuid",
  "betOn": "player1", // or "player2"
  "amount": "100000000", // 1 KAS in sompi
  "txId": "64-char-hex",
  "bettorAddress": "kaspa:qr..."
}`}
                                </pre>
                            </div>
                            <div>
                                <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                                <pre className="bg-black/60 p-3 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "success": true,
  "bet": {
    "id": "uuid",
    "betOn": "player1",
    "amount": "100000000",
    "feePaid": "5000000", // 5% fee
    "netAmount": "95000000",
    "status": "confirmed"
  }
}`}
                                </pre>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="text-white text-xs font-semibold mb-2">Business Logic</div>
                            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                                <li>• Minimum bet: 1 KAS (100,000,000 sompi)</li>
                                <li>• Fee: 5% deducted from bet amount</li>
                                <li>• Transaction ID cannot be reused</li>
                                <li>• Pool status must be "open" (not locked/closed)</li>
                                <li>• Creates betting pool automatically if doesn't exist</li>
                            </ul>
                        </div>
                    </div>

                    {/* GET /api/betting/pool/[matchId] */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold border border-green-500/30">GET</span>
                            <code className="text-sm font-mono text-white">/api/betting/pool/[matchId]</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Fetch betting pool totals and calculated odds.</p>
                        
                        <div className="text-xs">
                            <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                            <pre className="bg-black/60 p-4 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "pool": {
    "id": "uuid",
    "matchId": "uuid",
    "status": "open",
    "player1Total": "500000000", // 5 KAS
    "player2Total": "300000000", // 3 KAS
    "totalPool": "800000000",
    "player1TotalKas": 5.0,
    "player2TotalKas": 3.0,
    "totalPoolKas": 8.0
  },
  "odds": {
    "player1": 1.6, // 8 / 5 = 1.6x payout
    "player2": 2.67, // 8 / 3 = 2.67x payout
    "player1Percentage": 62.5, // 5/8 * 100
    "player2Percentage": 37.5
  },
  "isOpen": true,
  "isLocked": false,
  "lockReason": null
}`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Player Endpoints */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Player Endpoints</h3>

                <div className="space-y-6 my-6">
                    {/* GET /api/players/[address] */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold border border-green-500/30">GET</span>
                            <code className="text-sm font-mono text-white">/api/players/[address]</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Get player profile and leaderboard rank.</p>
                        
                        <div className="text-xs">
                            <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                            <pre className="bg-black/60 p-4 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "player": {
    "address": "kaspa:qr...",
    "displayName": "CyberNinja",
    "rating": 1250,
    "wins": 42,
    "losses": 18,
    "totalMatches": 60,
    "winRate": 70.0,
    "createdAt": "2026-01-15T10:00:00Z"
  },
  "rank": 127 // null if not ranked
}`}
                            </pre>
                        </div>
                    </div>

                    {/* POST /api/players/[address] */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold border border-blue-500/30">POST</span>
                            <code className="text-sm font-mono text-white">/api/players/[address]</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Register new player or update display name.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="text-cyan-400 font-semibold mb-2">Request Body (Optional)</div>
                                <pre className="bg-black/60 p-3 rounded border border-cyan-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "displayName": "NewName"
}`}
                                </pre>
                            </div>
                            <div>
                                <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                                <pre className="bg-black/60 p-3 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "player": { ... },
  "rank": null,
  "isNewPlayer": true
}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shop Endpoints */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Shop Endpoints</h3>

                <div className="space-y-6 my-6">
                    {/* POST /api/shop/purchase */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold border border-blue-500/30">POST</span>
                            <code className="text-sm font-mono text-white">/api/shop/purchase</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Purchase cosmetic item. Deducts currency and mints NFT if applicable.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="text-cyan-400 font-semibold mb-2">Request Body</div>
                                <pre className="bg-black/60 p-3 rounded border border-cyan-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "playerId": "kaspa:qr...",
  "cosmeticId": "uuid",
  "nftTxId": "64-char-hex", // Optional
  "nftMetadata": { ... } // Optional
}`}
                                </pre>
                            </div>
                            <div>
                                <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                                <pre className="bg-black/60 p-3 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "success": true,
  "purchaseId": "uuid",
  "newBalance": 4500,
  "nftTxId": "64-char-hex"
}`}
                                </pre>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="text-white text-xs font-semibold mb-2">Error Codes</div>
                            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                                <li>• 400: INSUFFICIENT_FUNDS - Not enough Clash Shards</li>
                                <li>• 404: ITEM_NOT_FOUND - Cosmetic doesn't exist</li>
                                <li>• 409: ALREADY_OWNED - Player owns this item</li>
                            </ul>
                        </div>
                    </div>

                    {/* GET /api/shop/inventory */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold border border-green-500/30">GET</span>
                            <code className="text-sm font-mono text-white">/api/shop/inventory?playerId=kaspa:qr...</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Fetch player's owned cosmetics.</p>
                        
                        <div className="text-xs">
                            <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                            <pre className="bg-black/60 p-4 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "inventory": [
    {
      "cosmeticId": "uuid",
      "name": "Neon Samurai Skin",
      "category": "character_skin",
      "purchasedAt": "2026-02-01T14:30:00Z"
    }
  ]
}`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Progression Endpoints */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Progression Endpoints</h3>

                <div className="space-y-6 my-6">
                    {/* GET /api/progression/player/[address] */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold border border-green-500/30">GET</span>
                            <code className="text-sm font-mono text-white">/api/progression/player/[address]</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Get player's battle pass progression and XP.</p>
                        
                        <div className="text-xs">
                            <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                            <pre className="bg-black/60 p-4 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "currentXp": 3450,
  "currentTier": 12,
  "tierProgress": 0.45,
  "prestigeLevel": 2,
  "seasonId": "season-2",
  "unlockedRewards": ["tier-1", "tier-2", ...]
}`}
                            </pre>
                        </div>
                    </div>

                    {/* POST /api/progression/award-xp */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold border border-blue-500/30">POST</span>
                            <code className="text-sm font-mono text-white">/api/progression/award-xp</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Award XP after match completion. Server-side only (internal).</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="text-cyan-400 font-semibold mb-2">Request Body</div>
                                <pre className="bg-black/60 p-3 rounded border border-cyan-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "address": "kaspa:qr...",
  "xpAmount": 150,
  "source": "match_win"
}`}
                                </pre>
                            </div>
                            <div>
                                <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                                <pre className="bg-black/60 p-3 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "success": true,
  "newXp": 3600,
  "tierUnlocked": false,
  "currentTier": 12
}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Utility Endpoints */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Utility Endpoints</h3>

                <div className="space-y-6 my-6">
                    {/* GET /api/health */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold border border-green-500/30">GET</span>
                            <code className="text-sm font-mono text-white">/api/health</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Health check endpoint for monitoring.</p>
                        
                        <div className="text-xs">
                            <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                            <pre className="bg-black/60 p-4 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "status": "healthy", // healthy | degraded | unhealthy
  "timestamp": "2026-02-03T15:30:00Z",
  "version": "0.1.0",
  "checks": {
    "database": "ok",
    "kaspa": "ok"
  }
}`}
                            </pre>
                        </div>
                    </div>

                    {/* POST /api/verify-mempool */}
                    <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold border border-blue-500/30">POST</span>
                            <code className="text-sm font-mono text-white">/api/verify-mempool</code>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Verify if transaction is confirmed on Kaspa blockchain.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="text-cyan-400 font-semibold mb-2">Request Body</div>
                                <pre className="bg-black/60 p-3 rounded border border-cyan-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "txId": "64-char-hex",
  "network": "testnet" // or "mainnet"
}`}
                                </pre>
                            </div>
                            <div>
                                <div className="text-green-400 font-semibold mb-2">Response (200)</div>
                                <pre className="bg-black/60 p-3 rounded border border-green-500/30 overflow-x-auto text-muted-foreground font-mono">
{`{
  "confirmed": true,
  "blockHeight": 125234,
  "txId": "64-char-hex"
}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Validation */}
                <h3 className="text-2xl text-cyber-gold mt-12 mb-6">Input Validation (Zod Schemas)</h3>
                <p>
                    All request bodies are validated using <strong>Zod schemas</strong> before processing. This ensures type safety and provides detailed error messages.
                </p>

                <div className="bg-black/40 p-6 rounded-xl border border-sidebar-border my-6 not-prose">
                    <div className="text-white font-semibold mb-4 text-sm">Validation Example</div>
                    
                    <pre className="bg-black/60 p-4 rounded-lg border border-purple-500/30 overflow-x-auto text-xs text-muted-foreground font-mono">
{`// lib/api/validators.ts
import { z } from 'zod';

export const placeBetSchema = z.object({
  matchId: z.string().uuid("Invalid UUID"),
  betOn: z.enum(["player1", "player2"]),
  amount: z.string()
    .regex(/^\\d+$/, "Amount must be a positive integer")
    .refine((val) => BigInt(val) > 0n, "Amount must be greater than 0"),
  txId: z.string()
    .length(64, "Transaction ID must be exactly 64 characters")
    .regex(/^[a-f0-9]{64}$/i, "Invalid transaction ID"),
  bettorAddress: z.string()
    .min(45)
    .regex(/^(kaspa|kaspatest):[a-z0-9]{40,90}$/, "Invalid Kaspa address")
});

// Usage in API route
export async function POST(request: Request) {
  const body = await request.json();
  const validation = validateBody(body, placeBetSchema);
  
  if (!validation.success) {
    return createErrorResponse(
      new ApiError(ErrorCodes.BAD_REQUEST, validation.error)
    );
  }
  
  const { matchId, betOn, amount, txId, bettorAddress } = validation.data;
  // ... process request
}`}
                    </pre>
                </div>

                {/* Best Practices */}
                <div className="bg-gradient-to-br from-cyber-gold/20 to-cyber-blue/20 p-8 rounded-2xl border border-cyber-gold/50 mt-12">
                    <h3 className="text-2xl text-cyber-gold mb-4 mt-0">API Best Practices</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <div className="text-green-400 font-semibold mb-2">✓ Do This</div>
                            <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• Always validate inputs with Zod schemas</li>
                                <li>• Use TypeScript types for request/response</li>
                                <li>• Return proper HTTP status codes (200, 400, 404, 500)</li>
                                <li>• Include descriptive error messages</li>
                                <li>• Log errors to console for debugging</li>
                                <li>• Use try-catch for all async operations</li>
                                <li>• Verify blockchain transactions before executing logic</li>
                                <li>• Return early for validation failures</li>
                            </ul>
                        </div>
                        <div>
                            <div className="text-red-400 font-semibold mb-2">✗ Avoid This</div>
                            <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• Don't trust client data without validation</li>
                                <li>• Don't return 200 for errors (use 4xx/5xx)</li>
                                <li>• Don't expose internal error details to clients</li>
                                <li>• Don't query database without parameterized queries</li>
                                <li>• Don't ignore error handling (always catch)</li>
                                <li>• Don't use snake_case in responses (use camelCase)</li>
                                <li>• Don't allow duplicate transaction IDs</li>
                                <li>• Don't skip blockchain verification for payments</li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
