/**
 * Kaspa NFT Minter using kaspa-wasm (Server-Side)
 * 
 * This implementation uses the official kaspa-wasm SDK and follows the 
 * KRC721 Inscription standard (Commit/Reveal) to ensure visibility in 
 * standard wallets like Kasware.
 * 
 * ⚠️ SERVER-SIDE ONLY: Uses vault private keys
 */

import type { NetworkType } from '@/types/constants';
import type { CosmeticItem } from '@/types/cosmetic';
import { NETWORK_CONFIG } from '@/types/constants';

// =============================================================================
// TYPES
// =============================================================================

export interface CosmeticNFTMetadata {
    protocol: 'KCLASH-NFT';
    version: '1.0';
    type: 'cosmetic';
    cosmetic: {
        id: string;
        name: string;
        category: string;
        rarity: string;
        thumbnailUrl: string;
        assetPath: string;
    };
    mintedAt: string;
    mintedBy: string;
}

export interface NFTMintResult {
    success: boolean;
    txId?: string;       // Reveal transaction ID (final)
    commitTxId?: string; // Commit transaction ID
    metadata?: CosmeticNFTMetadata;
    error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const KRC721_TICKER = "KCLASH";
const COMMIT_AMOUNT_SOMPI = "3.3"; // Amount to send to P2SH address
const REVEAL_GAS_FEE = "110";      // Higher fee for reveal script
const DEFAULT_PRIORITY_FEE = "1";
const MAX_PAYLOAD_SIZE = 512; // bytes

// =============================================================================
// KASPA-WASM INITIALIZATION
// =============================================================================

let kaspaWasm: any = null;
let initialized = false;

async function initKaspaWasm() {
    if (initialized && kaspaWasm) return kaspaWasm;
    
    try {
        // Use custom WASM build 
        // This has the correct API with Resolver, createTransactions, etc.
        if (typeof window === 'undefined') {
            // Server-side: Setup WebSocket polyfill first
            if (!globalThis.WebSocket) {
                globalThis.WebSocket = require('isomorphic-ws');
            }
            
            // Load custom WASM build from local wasm/ directory
            kaspaWasm = require('./wasm/kaspa.js');
            
            // Verify WASM is loaded
            if (!kaspaWasm.__wasm) {
                console.error('[NFT-Minter-WASM] WASM module not loaded');
                throw new Error('WASM module failed to initialize');
            }
            
            console.log('[NFT-Minter-WASM] Custom WASM build loaded');
        } else {
            // Client-side (shouldn't happen)
            throw new Error('NFT minting is server-side only');
        }
        
        // Initialize panic hook for better error messages
        if (typeof kaspaWasm.initConsolePanicHook === 'function') {
            kaspaWasm.initConsolePanicHook();
        }
        
        initialized = true;
        console.log('[NFT-Minter-WASM] kaspa-wasm initialized');
        return kaspaWasm;
    } catch (error) {
        console.error('[NFT-Minter-WASM] Failed to initialize kaspa-wasm:', error);
        throw new Error('Failed to initialize kaspa-wasm');
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getVaultConfig(network: NetworkType) {
    const isMainnet = network === "mainnet";
    
    const address = isMainnet
        ? process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET
        : process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET;

    const privateKey = isMainnet
        ? process.env.BETTING_VAULT_PRIVATE_KEY_MAINNET
        : process.env.BETTING_VAULT_PRIVATE_KEY_TESTNET;

    if (!address || !privateKey) {
        throw new Error(`Vault not configured for ${network}`);
    }

    return { address, privateKey };
}

function getApiBaseUrl(network: NetworkType): string {
    return network === "mainnet"
        ? "https://api.kaspa.org"
        : "https://api-tn10.kaspa.org";
}

function buildNFTMetadata(cosmetic: CosmeticItem): CosmeticNFTMetadata {
    // Build proper URLs for thumbnail and asset path
    // Use the cosmetic name to construct file paths
    const baseUrl = 'https://kaspaclash.vercel.app';
    
    // Construct paths based on category and name
    let thumbnailUrl = cosmetic.thumbnailUrl;
    let assetPath = cosmetic.assetPath;
    
    // If URLs are undefined, construct them from the cosmetic data
    if (!thumbnailUrl || !assetPath) {
        if (cosmetic.category === 'sticker') {
            // Stickers are in /stickers/ directory, use lowercase name with hyphens
            const stickerName = cosmetic.name.toLowerCase().replace(/\s+/g, '-');
            thumbnailUrl = thumbnailUrl || `${baseUrl}/stickers/${stickerName}.webp`;
            assetPath = assetPath || `${baseUrl}/stickers/${stickerName}.webp`;
        } else if (cosmetic.category === 'character') {
            // Characters are in /characters/ directory
            const charName = cosmetic.name.toLowerCase().replace(/\s+/g, '-');
            thumbnailUrl = thumbnailUrl || `${baseUrl}/characters/${charName}/portrait.webp`;
            assetPath = assetPath || `${baseUrl}/characters/${charName}/spritesheet.webp`;
        } else {
            // Generic fallback
            const itemName = cosmetic.name.toLowerCase().replace(/\s+/g, '-');
            thumbnailUrl = thumbnailUrl || `${baseUrl}/${cosmetic.category}/${itemName}.webp`;
            assetPath = assetPath || `${baseUrl}/${cosmetic.category}/${itemName}.webp`;
        }
    }
    
    return {
        protocol: 'KCLASH-NFT',
        version: '1.0',
        type: 'cosmetic',
        cosmetic: {
            id: cosmetic.id,
            name: cosmetic.name,
            category: cosmetic.category,
            rarity: cosmetic.rarity,
            thumbnailUrl,
            assetPath,
        },
        mintedAt: new Date().toISOString(),
        mintedBy: 'KaspaClash-Treasury',
    };
}

function encodeMetadataPayload(metadata: CosmeticNFTMetadata): string {
    const jsonStr = JSON.stringify(metadata);
    const byteSize = new TextEncoder().encode(jsonStr).length;
    
    if (byteSize > MAX_PAYLOAD_SIZE) {
        // Create minimal version if too large
        const minimalMetadata = {
            protocol: metadata.protocol,
            v: metadata.version,
            type: metadata.type,
            cosmetic: {
                id: metadata.cosmetic.id,
                name: metadata.cosmetic.name.substring(0, 20),
                cat: metadata.cosmetic.category,
                rar: metadata.cosmetic.rarity,
            },
            ts: metadata.mintedAt,
        };
        return JSON.stringify(minimalMetadata);
    }
    
    return jsonStr;
}

async function getUtxos(apiUrl: string, address: string) {
    const res = await fetch(`${apiUrl}/addresses/${address}/utxos`, {
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed to fetch UTXOs: ${res.statusText}`);
    return await res.json();
}

async function submitTransaction(apiUrl: string, txJson: any) {
    const res = await fetch(`${apiUrl}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txJson)
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Submit failed: ${txt}`);
    }
    return await res.json();
}

// =============================================================================
// NFT MINTING
// =============================================================================

/**
 * Mint a cosmetic NFT using kaspa-wasm
 * Follows KRC721 Inscription standard:
 * 1. Commit (Send KAS to P2SH address containing NFT data)
 * 2. Wait for maturity (at least 1 block)
 * 3. Reveal (Spend from P2SH address to player)
 */
export async function mintCosmeticNFT(
    playerAddress: string,
    cosmetic: CosmeticItem,
    network: NetworkType
): Promise<NFTMintResult> {
    let rpcClient: any;
    try {
        console.log('[NFT-Minter-WASM] Minting KRC721 NFT:', cosmetic.name);
        console.log('[NFT-Minter-WASM] Recipient:', playerAddress);
        
        const wasm = await initKaspaWasm();
        const config = getVaultConfig(network);
        const networkId = network === "testnet" ? "testnet-10" : "mainnet";
        
        // 1. Setup metadata & KRC721 payload
        const metadata = buildNFTMetadata(cosmetic);
        const krc721Data = { 
            p: "krc-721", 
            op: "mint", 
            tick: KRC721_TICKER,
            data: metadata // Embed game metadata inside the KRC721 data field
        };

        // 2. Build the Inscription Script (P2SH)
        const privateKey = new wasm.PrivateKey(config.privateKey);
        const publicKey = privateKey.toPublicKey();
        
        // Build KRC721 minting script – this is exactly what wallets recognize
        const script = new wasm.ScriptBuilder()
            .addData(publicKey.toXOnlyPublicKey().toString())
            .addOp(wasm.Opcodes.OpCheckSig)
            .addOp(wasm.Opcodes.OpFalse)
            .addOp(wasm.Opcodes.OpIf)
            .addData(Buffer.from("kspr"))
            .addI64(0n)
            .addData(Buffer.from(JSON.stringify(krc721Data, null, 0)))
            .addOp(wasm.Opcodes.OpEndIf);

        const p2shAddress = wasm.addressFromScriptPublicKey(script.createPayToScriptHashScript(), networkId)!;
        console.log('[NFT-Minter-WASM] P2SH Address generated:', p2shAddress.toString());

        // 3. Connect to RPC for UTXO monitoring
        const { RpcClient, Resolver } = wasm;
        rpcClient = new RpcClient({ resolver: new Resolver(), networkId });
        await rpcClient.connect();
        
        // IMPORTANT: Also subscribe to the P2SH address since we need to know when it receives funds
        await rpcClient.subscribeUtxosChanged([config.address, p2shAddress.toString()]);

        // 4. STEP 1: COMMIT TRANSACTION
        console.log('[NFT-Minter-WASM] Creating COMMIT transaction...');
        const { entries } = await rpcClient.getUtxosByAddresses({ addresses: [config.address] });
        
        const { transactions: commitTxs } = await wasm.createTransactions({
            entries,
            outputs: [{
                address: p2shAddress.toString(),
                amount: wasm.kaspaToSompi(COMMIT_AMOUNT_SOMPI)
            }],
            changeAddress: config.address,
            priorityFee: wasm.kaspaToSompi(DEFAULT_PRIORITY_FEE),
            networkId
        });

        const commitTx = commitTxs[0];
        await commitTx.sign([privateKey]);
        const commitHash = await commitTx.submit(rpcClient);
        console.log('[NFT-Minter-WASM] COMMIT submitted:', commitHash);

        // 5. Wait for COMMIT to be accepted (Maturity)
        console.log('[NFT-Minter-WASM] Waiting for COMMIT maturity...');
        let commitAccepted = false;
        let retryCount = 0;
        while (!commitAccepted && retryCount < 60) {
            const { entries: p2shEntries } = await rpcClient.getUtxosByAddresses({ addresses: [p2shAddress.toString()] });
            if (p2shEntries.length > 0) {
                commitAccepted = true;
                break;
            }
            await new Promise(r => setTimeout(r, 2000));
            retryCount++;
        }

        if (!commitAccepted) throw new Error("Commit transaction timed out");

        // 6. STEP 2: REVEAL TRANSACTION
        console.log('[NFT-Minter-WASM] Creating REVEAL transaction...');
        const { entries: vaultEntries } = await rpcClient.getUtxosByAddresses({ addresses: [config.address] });
        const { entries: p2shEntries } = await rpcClient.getUtxosByAddresses({ addresses: [p2shAddress.toString()] });

        const { transactions: revealTxs } = await wasm.createTransactions({
            priorityEntries: [p2shEntries[0]],
            entries: vaultEntries,
            outputs: [{
                address: playerAddress,
                amount: wasm.kaspaToSompi("0.1") // Minimum dust to player
            }],
            changeAddress: config.address,
            priorityFee: wasm.kaspaToSompi(REVEAL_GAS_FEE),
            networkId
        });

        const revealTx = revealTxs[0];
        // Sign with private key but don't finalize yet (need script injection)
        await revealTx.sign([privateKey], false);

        // Inject the P2SH script signature
        // Find the input that spends from the P2SH address
        const p2shInputIndex = revealTx.transaction.inputs.findIndex((input: any) => input.signatureScript === '');
        if (p2shInputIndex !== -1) {
            const signature = await revealTx.createInputSignature(p2shInputIndex, privateKey);
            revealTx.fillInput(p2shInputIndex, script.encodePayToScriptHashSignatureScript(signature));
        }

        const revealHash = await revealTx.submit(rpcClient);
        console.log('[NFT-Minter-WASM] REVEAL submitted (Inscription Complete):', revealHash);

        return {
            success: true,
            txId: revealHash,
            commitTxId: commitHash,
            metadata,
        };

    } catch (error) {
        console.error('[NFT-Minter-WASM] KRC721 Minting failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    } finally {
        if (rpcClient) {
            try { await rpcClient.disconnect(); } catch (e) {}
        }
    }
}
