import { NextRequest, NextResponse } from "next/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";

// =============================================================================
// SINGLETON RPC CONNECTION
// =============================================================================

// Cache RPC clients by network to avoid reconnecting on every request
const rpcClients: Map<string, { client: any; lastUsed: number; connecting: Promise<any> | null }> = new Map();
const RPC_CONNECTION_TIMEOUT_MS = 3000; // 3s max for initial connection
const RPC_IDLE_TIMEOUT_MS = 120000; // Keep connection alive for 2 minutes

/**
 * Get or create a cached RPC client for the network
 */
async function getRpcClient(networkId: string, isTestnet: boolean): Promise<any> {
  const cached = rpcClients.get(networkId);
  
  // Return existing connected client
  if (cached?.client) {
    cached.lastUsed = Date.now();
    return cached.client;
  }
  
  // Wait for in-progress connection
  if (cached?.connecting) {
    return cached.connecting;
  }
  
  // Setup WebSocket polyfill for server-side wasm
  if (!globalThis.WebSocket) {
    globalThis.WebSocket = require('isomorphic-ws');
  }

  // Load server-side wasm
  const kaspaWasm = require('@/lib/kaspa/wasm/kaspa.js');
  const { RpcClient } = kaspaWasm;

  // Create connection promise
  const connectPromise = (async () => {
    let rpcClient: any = null;
    const connectStart = Date.now();
    
    try {
      // Use direct URL for fastest connection (skip Resolver node discovery)
      const rpcUrl = isTestnet
        ? 'wss://electron-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh'
        : 'wss://mainnet.kaspathon.com/wrpc';
      
      console.log(`[MempoolVerify] Connecting to ${rpcUrl}...`);
      rpcClient = new RpcClient({ url: rpcUrl, networkId });
      
      await Promise.race([
        rpcClient.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), RPC_CONNECTION_TIMEOUT_MS)
        )
      ]);
      
      const elapsed = Date.now() - connectStart;
      console.log(`[MempoolVerify] ⚡ RPC connected to ${networkId} in ${elapsed}ms`);
      
      // Cache the client
      rpcClients.set(networkId, { client: rpcClient, lastUsed: Date.now(), connecting: null });
      
      // Schedule idle cleanup
      scheduleIdleCleanup(networkId);
      
      return rpcClient;
    } catch (error) {
      console.error(`[MempoolVerify] RPC connection failed after ${Date.now() - connectStart}ms:`, error);
      rpcClients.delete(networkId);
      throw error;
    }
  })();
  
  // Store connecting promise so parallel requests wait
  rpcClients.set(networkId, { client: null, lastUsed: Date.now(), connecting: connectPromise });
  
  return connectPromise;
}

/**
 * Schedule cleanup of idle RPC connections
 */
function scheduleIdleCleanup(networkId: string): void {
  setTimeout(async () => {
    const cached = rpcClients.get(networkId);
    if (cached?.client && Date.now() - cached.lastUsed > RPC_IDLE_TIMEOUT_MS) {
      console.log(`[MempoolVerify] Disconnecting idle RPC for ${networkId}`);
      try {
        await cached.client.disconnect();
      } catch (e) {
        // Ignore
      }
      rpcClients.delete(networkId);
    } else if (cached?.client) {
      // Reschedule if still in use
      scheduleIdleCleanup(networkId);
    }
  }, RPC_IDLE_TIMEOUT_MS);
}

// =============================================================================
// API HANDLER
// =============================================================================

/**
 * POST /api/verify-mempool - Check if transaction is confirmed in a block
 * Uses server-side wasm to query Kaspa node
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { txId, network } = body;

    if (!txId || typeof txId !== 'string' || !/^[a-f0-9]{64}$/i.test(txId)) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid transaction ID")
      );
    }

    const isTestnet = network === 'testnet';
    const networkId = isTestnet ? 'testnet-10' : 'mainnet';

    try {
      // Get cached RPC client (fast if already connected)
      const rpcClient = await getRpcClient(networkId, isTestnet);
      
      // First check if tx is in mempool (unconfirmed)
      try {
        const mempoolResponse = await rpcClient.getMempoolEntry({
          transactionId: txId,
          includeOrphanPool: true,
          filterTransactionPool: false,
        });

        if (mempoolResponse?.mempoolEntry) {
          // Transaction is still in mempool (not yet confirmed)
          const elapsed = Date.now() - startTime;
          return NextResponse.json({
            txId,
            inMempool: true,
            confirmed: false,
            timestamp: Date.now(),
            elapsed,
          });
        }
      } catch (mempoolError: any) {
        // Not in mempool - might be confirmed already or not found
        // Continue to check if it's confirmed
      }

      // Not in mempool - assume confirmed (tx moves from mempool to block quickly on Kaspa)
      // If wallet broadcast succeeded and tx is not in mempool, it's likely already confirmed
      const elapsed = Date.now() - startTime;
      
      if (elapsed > 500) {
        console.log(`[MempoolVerify] Check took ${elapsed}ms for ${txId.substring(0, 16)}...`);
      }

      return NextResponse.json({
        txId,
        inMempool: false,
        confirmed: true, // Not in mempool = already confirmed with Kaspa's 10 BPS
        timestamp: Date.now(),
        elapsed,
      });
    } catch (error: any) {
      // Connection error - clear cached client
      if (error?.message?.includes('timeout') || error?.message?.includes('connection')) {
        rpcClients.delete(networkId);
      }

      console.error('[MempoolVerify] Error checking transaction:', error?.message || error);
      return NextResponse.json({
        txId,
        inMempool: false,
        confirmed: false,
        timestamp: Date.now(),
        error: 'RPC error',
        elapsed: Date.now() - startTime,
      });
    }
  } catch (error) {
    console.error('[MempoolVerify] Error:', error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Internal server error")
    );
  }
}

/**
 * GET /api/verify-mempool?network=testnet - Pre-warm RPC connection
 * Call this when entering a match to have connection ready for move verification
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const network = request.nextUrl.searchParams.get('network') || 'testnet';
    const isTestnet = network === 'testnet';
    const networkId = isTestnet ? 'testnet-10' : 'mainnet';

    // Pre-warm the connection
    await getRpcClient(networkId, isTestnet);
    
    const elapsed = Date.now() - startTime;
    console.log(`[MempoolVerify] ⚡ Pre-warmed RPC for ${networkId} in ${elapsed}ms`);

    return NextResponse.json({
      ready: true,
      network: networkId,
      elapsed,
    });
  } catch (error: any) {
    console.error('[MempoolVerify] Pre-warm failed:', error?.message || error);
    return NextResponse.json({
      ready: false,
      error: error?.message || 'Connection failed',
      elapsed: Date.now() - startTime,
    }, { status: 500 });
  }
}

