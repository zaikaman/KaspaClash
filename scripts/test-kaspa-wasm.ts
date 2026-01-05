
// This file has been updated to use the working Pure JS implementation (kaspalib + @noble/secp256k1)
// instead of the failing WASM implementation.

import { Transaction, Address, OutScript, hexToBytes, bytesToHex } from 'kaspalib';
import { schnorr } from '@noble/secp256k1';
import * as fs from 'fs';

const LOG_FILE = "test_kaspa_wasm_fixed.log";
fs.writeFileSync(LOG_FILE, "");
function log(msg: any, ...args: any[]) {
    const str = [msg, ...args].map(a => typeof a === 'object' ? JSON.stringify(a, (_, v) => typeof v === 'bigint' ? v.toString() : IsBytes(v) ? bytesToHex(v) : v) : a).join(' ');
    fs.appendFileSync(LOG_FILE, str + "\n");
    console.log(str);
}
function IsBytes(v: any) { return v instanceof Uint8Array; }

// API Helpers 
const API_BASE = "https://api.kaspa.org";
const TESTNET_API = "https://api-tn10.kaspa.org";
const API = TESTNET_API;

async function getUtxos(address: string) {
    const res = await fetch(`${API}/addresses/${address}/utxos`);
    if (!res.ok) throw new Error(`Failed to fetch utxos: ${res.statusText}`);
    return await res.json();
}

async function submitTransaction(txJson: any) {
    const res = await fetch(`${API}/transactions`, {
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

async function main() {
    log("Starting Pure JS Kaspa Signing Test (Replaced WASM Script)...");
    const kaspalib = await import('kaspalib');
    log("Max Mass:", kaspalib.MAXIMUM_STANDARD_TRANSACTION_MASS);
    log("Mass/byte:", kaspalib.MASS_PER_TX_BYTE);

    // 1. Setup keys
    const privateKeyHex = "36b55f614748b51c0392efffc033e98f6d8ae1a3834b482b5af71e6ee0226b7d";
    const privateKey = hexToBytes(privateKeyHex);
    // 2. Address Decoding
    const vaultAddrStr = "kaspatest:qrzke33aqkw957ns4rxqxqxf3d9mh56ru20g49502dsdnp8quzhhkfz8cc48l";
    const addrParser = Address({ prefix: "kaspatest" });
    const vaultDecoded = addrParser.decode(vaultAddrStr);

    // 3. Fetch UTXOs
    const utxos = await getUtxos(vaultAddrStr);
    const utxodata = utxos[0];
    const amount = BigInt(utxodata.utxoEntry.amount);
    log(`Selected UTXO Amount: ${amount}`);

    // 4. Create Transaction
    const AMOUNT_TO_SEND = 100000000n; // 1 KAS
    const FEE = 5000n;
    const totalRequired = AMOUNT_TO_SEND + FEE;

    if (amount < totalRequired) {
        throw new Error(`Insufficient funds: Have ${amount}, Need ${totalRequired}`);
    }

    // Recipient (Requests 1 KAS)
    const recipientAddr = "kaspatest:qqk5pq9lwdcltjg8jxvwu9l59a9en7qavzdeu3ge60aluuw63ptcx9jvqkafm";
    const recipientDecoded = addrParser.decode(recipientAddr);

    // Scripts
    const recipientScriptInfo = OutScript.encode({
        version: 0,
        type: recipientDecoded.type,
        payload: recipientDecoded.payload
    });

    // Inputs
    const inputUtxo = {
        transactionId: hexToBytes(utxodata.outpoint.transactionId),
        index: utxodata.outpoint.index,
        amount: amount,
        version: utxodata.utxoEntry.scriptPublicKey.version || 0,
        script: hexToBytes(utxodata.utxoEntry.scriptPublicKey.scriptPublicKey)
    };

    const inputs = [{
        utxo: inputUtxo,
        script: new Uint8Array(0),
        sequence: 0n,
        sigOpCount: 1
    }];

    // Outputs
    const outputs = [
        {
            amount: AMOUNT_TO_SEND,
            version: recipientScriptInfo.version,
            script: recipientScriptInfo.script
        }
    ];

    // Change Output
    const changeAmount = amount - totalRequired;
    if (changeAmount > 0n) {
        log(`Adding change output: ${changeAmount} sompi`);
        const changeScriptInfo = OutScript.encode({
            version: 0,
            type: vaultDecoded.type,
            payload: vaultDecoded.payload
        });

        outputs.push({
            amount: changeAmount,
            version: changeScriptInfo.version,
            script: changeScriptInfo.script
        });
    }

    // Transaction
    const tx = new Transaction({
        version: 0,
        inputs,
        outputs,
        lockTime: 0n,
        subnetworkId: new Uint8Array(20),
        gas: 0n,
        payload: new Uint8Array(0)
    });

    log("Transaction created.");
    log("Calculated Mass:", tx.mass);

    // 5. Sign
    log("Signing...");
    const signed = tx.sign(privateKey);
    if (signed) {
        log("Signing successful!");
    } else {
        throw new Error("Signing returned false");
    }

    // 6. Serialize/Format for Submission
    const rpcTx = tx.toRPCTransaction();
    // @ts-ignore
    delete rpcTx.mass;

    log("Submitting transaction...");

    const submissionPayload = { transaction: rpcTx };

    try {
        const result = await submitTransaction(submissionPayload);
        log("Transaction Submitted! ID:", result.transactionId || JSON.stringify(result));
    } catch (e: any) {
        log("Submission Error:", e.message || e);
    }
}

main().catch(e => {
    log("Main Error:", e.message || e);
});
