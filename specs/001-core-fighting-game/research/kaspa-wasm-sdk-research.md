# Kaspa WASM SDK Research Summary

> Research conducted: December 31, 2025
> Focus: Browser-based integration for KaspaClash fighting game

---

## 1. Official NPM Packages

### Primary Packages

| Package | Version | Purpose | Weekly Downloads |
|---------|---------|---------|------------------|
| `kaspa` | 0.13.0 | Node.js wrapper (includes WebSocket shim) | ~4 |
| `kaspa-wasm` | 0.13.0 | Pure WASM32 bindings (7.5 MB) | ~19 |

**Recommended for browser apps:** Use the WASM SDK release packages directly from GitHub releases rather than npm packages (they are 2 years old on npm).

### Latest SDK Releases

- **Official releases:** https://github.com/kaspanet/rusty-kaspa/releases
- **Developer builds:** https://kaspa.aspectron.org/nightly/downloads/
- **TypeScript documentation:** https://kaspa.aspectron.org/docs/

### K-Kluster Starter Kit Packages

For hackathon projects, the kaspa-js monorepo provides:
- `@kluster/kaspa-wasm-web` - Web browser WASM package
- `@kluster/kaspa-wasm-node` - Node.js WASM package
- `@kluster/kaspa-starter-cli` - Project scaffolding CLI

```bash
npx @kluster/kaspa-starter-cli
```

---

## 2. WASM Module Initialization

### Browser (Web App)

```html
<html>
<head>
    <script type="module">
        import * as kaspa from './kaspa/kaspa.js';
        
        (async () => {
            // Initialize WASM module
            await kaspa.default('./kaspa/kaspa_bg.wasm');
            
            // Enable panic hooks for debugging
            kaspa.initConsolePanicHook();
            
            console.log("Kaspa SDK version:", kaspa.version());
        })();
    </script>
</head>
</html>
```

### Next.js / React (Vite)

```typescript
// src/init.ts
import init, { initConsolePanicHook } from "@kluster/kaspa-wasm-web";

const boot = async () => {
    // Load WASM module
    await init();
    
    // Enable console panic hooks for debugging
    initConsolePanicHook();
    
    // Start React app after WASM is ready
    await (await import("./index")).startApplicationRendering();
};

boot();
```

### Next.js Configuration

```javascript
// next.config.js
import TerserPlugin from "terser-webpack-plugin";

const nextConfig = {
    output: "export",
    swcMinify: false, // Disable SWC to control names
    
    async headers() {
        return [
            {
                source: "/:all*(.wasm)",
                headers: [{ key: "Content-Type", value: "application/wasm" }],
            },
        ];
    },
    
    webpack: (config, { dev }) => {
        config.experiments = {
            ...(config.experiments || {}),
            asyncWebAssembly: true,
            topLevelAwait: true,
        };
        
        config.module.rules.push({
            test: /\.wasm$/,
            type: "asset/resource",
        });
        
        if (!dev) {
            config.optimization.minimize = true;
            config.optimization.minimizer = [
                new TerserPlugin({
                    terserOptions: {
                        keep_classnames: true,
                        keep_fnames: true,
                    },
                }),
            ];
        }
        
        return config;
    },
};

export default nextConfig;
```

### Node.js Environment

```javascript
// IMPORTANT: Must add WebSocket shim before importing kaspa
globalThis.WebSocket = require('websocket').w3cwebsocket;

const {
    RpcClient,
    Resolver,
    kaspaToSompi,
    initConsolePanicHook
} = require('kaspa');

initConsolePanicHook();
```

---

## 3. Wallet Connection Patterns

### Browser Extension Wallet Discovery (KIP-12)

KIP-12 is the standard for Kaspa browser wallet integration:

```typescript
// lib/kaspaProvider.ts
export interface KaspaProvider {
    request: (method: string, args: any[]) => Promise<any>;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
}

export interface ProviderInfo {
    id: string;
    name: string;
    icon: string;
    methods: string[];
}

// Types for browser events
declare global {
    interface WindowEventMap {
        "kaspa:provider": CustomEvent<{
            info: ProviderInfo;
            provider: KaspaProvider;
        }>;
        "kaspa:requestProvider": CustomEvent;
    }
}
```

### Wallet Discovery Hook

```typescript
export function useKaspaProvider() {
    const [provider, setProvider] = useState<KaspaProvider | null>(null);
    const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);

    useEffect(() => {
        const handleProvider = (e: CustomEvent) => {
            setProvider(e.detail.provider);
            setProviderInfo(e.detail.info);
        };

        window.addEventListener("kaspa:provider", handleProvider);
        window.dispatchEvent(new CustomEvent("kaspa:requestProvider"));

        return () => {
            window.removeEventListener("kaspa:provider", handleProvider);
        };
    }, []);

    return { provider, providerInfo };
}
```

### Using discover_kaspa_wallet() (Legacy Pattern)

```javascript
// Discover available wallet extensions
let wallets = discover_kaspa_wallet();

wallets.forEach(wallet => {
    console.log("Wallet:", wallet.name, wallet.icon, wallet.uuid);
    
    // Connect to wallet
    wallet.api.connect().then(result => {
        console.log("Connected:", result);
    });
});
```

### Supported Wallet Extensions

| Wallet | Type | Website |
|--------|------|---------|
| **Kasware** | Browser Extension | https://kasware.xyz/ |
| **Kastle** | Browser Extension | https://kastle.cc |
| **Kaspium** | Mobile | https://kaspium.io |
| **Kaspa NG** | Desktop | https://kaspa-ng.org/ |

---

## 4. Transaction Construction & Signing

### Direct RPC Approach (Using WASM SDK Wallet)

```javascript
const {
    PrivateKey,
    RpcClient,
    Resolver,
    kaspaToSompi,
    createTransactions,
    signTransaction,
} = require('kaspa');

// Create private key
const privateKey = new PrivateKey('your-hex-private-key');
const keypair = privateKey.toKeypair();
const sourceAddress = keypair.toAddress(networkId);

// Connect to RPC
const rpc = new RpcClient({
    resolver: new Resolver(),
    networkId: "mainnet" // or "testnet-10", "testnet-11"
});

await rpc.connect();

// Get UTXOs
const utxos = await rpc.getUtxosByAddresses({ addresses: [sourceAddress] });

// Create transaction
const { transactions } = await createTransactions({
    entries: utxos.entries,
    outputs: [{
        address: destinationAddress,
        amount: kaspaToSompi("1.5")
    }],
    changeAddress: sourceAddress,
    priorityFee: kaspaToSompi("0.0001")
});

// Sign and submit each transaction
for (const tx of transactions) {
    const signedTx = signTransaction(tx, [privateKey]);
    const txId = await rpc.submitTransaction({ transaction: signedTx });
    console.log("Transaction submitted:", txId);
}
```

### Using Generator for Fee Estimation

```javascript
const { Generator, kaspaToSompi } = require('kaspa');

const generator = new Generator({
    entries: utxoEntries,
    outputs: [{ 
        address: destinationAddress, 
        amount: kaspaToSompi("0.2")
    }],
    priorityFee: kaspaToSompi("0.0001"),
    changeAddress: sourceAddress,
});

// Get fee estimate without creating actual transaction
const estimate = await generator.estimate();
console.log("Estimated fees:", estimate);
```

### Using Wallet Framework

```javascript
const { Wallet, Resolver, kaspaToSompi, setDefaultStorageFolder } = require('kaspa');

// Initialize wallet
const wallet = new Wallet({
    resident: false,
    networkId: "testnet-11",
    resolver: new Resolver()
});

// Open existing wallet
await wallet.walletOpen({
    walletSecret: "your-password",
    filename: "wallet-name"
});

// Send transaction
const sendResult = await wallet.accountsSend({
    walletSecret: "your-password",
    accountId: account.accountId,
    priorityFeeSompi: kaspaToSompi("0.001"),
    destination: [{
        address: "kaspa:...",
        amount: kaspaToSompi("1.567")
    }]
});

console.log("Transaction IDs:", sendResult.transactionIds);
```

---

## 5. Real-Time Subscriptions (wRPC/WebSocket)

### Available RPC Events

| Event | Description |
|-------|-------------|
| `block-added` | New block added to DAG |
| `virtual-daa-score-changed` | DAA score updated |
| `virtual-chain-changed` | Virtual chain reorganization |
| `utxos-changed` | UTXO set changes for addresses |

### Subscribing to Events

```typescript
import { RpcClient, Resolver } from "@kluster/kaspa-wasm-web";

const rpc = new RpcClient({
    resolver: new Resolver(),
    networkId: "mainnet",
});

// Subscribe to block additions
rpc.addEventListener("block-added", (event) => {
    console.log("New block:", event.data.block);
});

// Subscribe to DAA score changes
rpc.addEventListener("virtual-daa-score-changed", (event) => {
    console.log("New DAA score:", event.data.virtualDaaScore);
});

// Connect and activate subscriptions
rpc.addEventListener("connect", async () => {
    console.log("Connected to:", rpc.url);
    await rpc.subscribeBlockAdded();
    await rpc.subscribeVirtualDaaScoreChanged();
});

await rpc.connect({
    blockAsyncConnect: true,
    timeoutDuration: 1000,
    retryInterval: 50,
});
```

### UtxoProcessor for Address Monitoring

```typescript
import { 
    UtxoProcessor, 
    UtxoContext, 
    RpcClient, 
    Resolver 
} from '@kluster/kaspa-wasm-web';

const rpc = new RpcClient({
    resolver: new Resolver(),
    networkId: "mainnet"
});

await rpc.connect();

const processor = new UtxoProcessor({ rpc, networkId: "mainnet" });
const context = new UtxoContext({ processor });

// Register addresses to track
await context.trackAddresses([address]);

// Listen for UTXO events
processor.addEventListener("pending", (event) => {
    console.log("Pending transaction:", event);
});

processor.addEventListener("maturity", (event) => {
    console.log("Transaction confirmed:", event);
});
```

---

## 6. Custom Data in Transactions

### Important Limitation

**Kaspa does NOT have OP_RETURN equivalent in the traditional sense.** The network uses a UTXO model similar to Bitcoin but without arbitrary data storage in transactions.

### Data Encoding Approaches

#### Option 1: KRC-20 Protocol (via Kasplex)

KRC-20 uses a commit-reveal scheme with data inscriptions:

```javascript
// The WASM SDK includes commit-reveal support
await wallet.accountsCommitReveal({
    walletSecret,
    accountId: account.accountId,
    // ... commit-reveal parameters
});
```

- Repository: https://github.com/argonmining/kasplex
- Used for: Token metadata, inscriptions

#### Option 2: Transaction Metadata (Off-Chain)

For game state like match results, the recommended approach is:

1. **On-chain:** Use transaction as proof of payment/commitment
2. **Off-chain:** Store actual game data (match results, player actions) indexed by transaction ID

```typescript
// Store match result with transaction as anchor
interface MatchResult {
    txId: string;          // On-chain transaction ID
    matchId: string;
    winner: string;
    timestamp: number;
    gameData: object;      // Stored off-chain (IPFS, database)
}
```

#### Option 3: P2SH Scripts

For complex logic, use Pay-to-Script-Hash:

```javascript
import { ScriptBuilder, payToScriptHashScript } from 'kaspa';

const scriptBuilder = new ScriptBuilder();
// Build custom script...
const p2shScript = payToScriptHashScript(scriptBuilder);
```

---

## 7. Transaction Fees

### Fee Structure

Kaspa uses a **mass-based fee system**:
- Fees are calculated based on transaction "mass" (size + compute)
- Mass is measured in "grams"
- Minimum fee: Typically ~0.0001 KAS for simple transactions

### Fee Calculation

```javascript
import { 
    calculateTransactionFee, 
    calculateTransactionMass,
    kaspaToSompi 
} from 'kaspa';

// Calculate mass for a transaction
const mass = calculateTransactionMass(transaction);

// Get fee estimate from network
const feeEstimate = await rpc.getFeeEstimate();
console.log("Fee estimate:", feeEstimate);

// Priority fee (user-specified)
const priorityFee = kaspaToSompi("0.0001"); // 0.0001 KAS
```

### Current Network Stats

- **Mainnet:** 10 blocks per second (10 BPS)
- **Fast finality:** Near-instant confirmation
- **Low fees:** Minimal transaction costs

---

## 8. Transaction Confirmations

### DAA Score Tracking

```typescript
// Monitor DAA score for confirmation depth
rpc.addEventListener("virtual-daa-score-changed", (event) => {
    const currentDaaScore = event.data.virtualDaaScore;
    
    // Check confirmation depth for a transaction
    const confirmations = currentDaaScore - txDaaScore;
    console.log(`Transaction has ${confirmations} confirmations`);
});

await rpc.subscribeVirtualDaaScoreChanged();
```

### Transaction States

| State | Description |
|-------|-------------|
| `pending` | Transaction in mempool, not yet confirmed |
| `stasis` | Waiting for dependencies |
| `maturity` | Transaction confirmed and mature |
| `reorg` | Transaction affected by chain reorganization |

### Listening for Confirmations

```typescript
processor.addEventListener("maturity", (event: IMaturityEvent) => {
    // Transaction is fully confirmed
    const record: ITransactionRecord = event.data;
    console.log("Confirmed TX:", record.id);
});
```

---

## 9. Development Networks

### Testnet

- **Testnet-10:** `testnet-10`
- **Testnet-11:** `testnet-11` (recommended for development)
- **Faucet:** https://faucet-tn10.kaspanet.io/

### Hackathon Public Nodes

- **Testnet:** `testnet.kaspathon.com`
- **Mainnet:** `mainnet.kaspathon.com`

### Using Resolver for Auto-Discovery

```typescript
const rpc = new RpcClient({
    resolver: new Resolver(),
    networkId: "testnet-11"
});

// Resolver automatically finds available nodes
await rpc.connect();
console.log("Connected to:", rpc.url);
```

---

## 10. Key SDK Classes & Functions

### Core Classes

| Class | Purpose |
|-------|---------|
| `RpcClient` | WebSocket RPC connection to Kaspa node |
| `Resolver` | Automatic node discovery |
| `Wallet` | Full wallet framework |
| `UtxoProcessor` | UTXO tracking and events |
| `UtxoContext` | Address-specific UTXO context |
| `Generator` | Transaction generation & estimation |
| `PrivateKey` | Private key management |
| `PublicKey` | Public key derivation |
| `Mnemonic` | BIP39 mnemonic generation |
| `XPrv` / `XPub` | Extended key management |
| `Address` | Kaspa address handling |
| `Transaction` | Transaction construction |
| `ScriptBuilder` | Script construction |

### Key Functions

| Function | Purpose |
|----------|---------|
| `kaspaToSompi(amount)` | Convert KAS to sompi (1 KAS = 100,000,000 sompi) |
| `sompiToKaspaString(sompi)` | Convert sompi to display string |
| `createTransactions(options)` | Create transactions from UTXOs |
| `signTransaction(tx, keys)` | Sign a transaction |
| `initConsolePanicHook()` | Enable WASM panic debugging |

---

## 11. Gotchas & Best Practices

### Critical Issues

1. **NPM packages are outdated (2 years old)** - Download SDK from GitHub releases instead
2. **WebSocket shim required for Node.js** - Must set `globalThis.WebSocket` before importing
3. **WASM must be served with correct MIME type** - Configure `Content-Type: application/wasm`
4. **SWC minification breaks class names** - Disable or configure Terser with `keep_classnames`

### Best Practices

1. **Always initialize WASM before using SDK:**
   ```typescript
   await init();
   initConsolePanicHook();
   ```

2. **Use Resolver for node discovery:**
   ```typescript
   const rpc = new RpcClient({
       resolver: new Resolver(),
       networkId: "mainnet"
   });
   ```

3. **Handle disconnections gracefully:**
   ```typescript
   rpc.addEventListener("disconnect", () => {
       // Reconnection logic
   });
   ```

4. **Use bigint for amounts to avoid precision issues:**
   ```typescript
   const amount = kaspaToSompi("1.5"); // Returns bigint
   ```

5. **Test on testnet-11 first before mainnet**

---

## 12. Resources

### Official Documentation

- **WASM SDK Docs:** https://kaspa.aspectron.org/docs/
- **Integration Guide:** https://kaspa-mdbook.aspectron.com/
- **Kaspa Wiki:** https://wiki.kaspa.org

### GitHub Repositories

- **Rusty Kaspa:** https://github.com/kaspanet/rusty-kaspa
- **Kaspa-JS Starter Kit:** https://github.com/K-Kluster/kaspa-js
- **Hackathon Resources:** https://github.com/Kaspathon/KaspaDev-Resources
- **KDApp Tutorial (Rust):** https://github.com/michaelsutton/kdapp

### Community

- **Discord:** https://discord.gg/kaspa
- **Hackathon Channel:** https://discord.com/channels/599153230659846165/1451212885790560417

---

## 13. Recommended Architecture for KaspaClash

Based on research, recommended integration pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     KaspaClash Frontend                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐     ┌─────────────────────────────┐   │
│  │  KIP-12 Wallet  │     │   Direct WASM SDK           │   │
│  │  (Kasware, etc) │     │   (RpcClient + Resolver)    │   │
│  └────────┬────────┘     └─────────────┬───────────────┘   │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Kaspa Service Layer                    │    │
│  │  - Wallet connection (KIP-12 for signing)          │    │
│  │  - RPC for balance/UTXO queries                    │    │
│  │  - Event subscriptions (blocks, DAA score)         │    │
│  └────────────────────────────────────────────────────┘    │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Kaspa Network │
                    │  (via wRPC)    │
                    └────────────────┘
```

### Implementation Notes

1. **Wallet Integration:** Use KIP-12 for transaction signing (user approval)
2. **Read Operations:** Use RpcClient directly for balance checks, UTXO queries
3. **Match Stakes:** Simple P2PKH transactions with priority fees
4. **Game Results:** Store off-chain, reference by transaction ID
5. **Confirmations:** Monitor DAA score changes for finality
