
const main = async () => {
    try {
        console.log("Loading WASM...");
        const kaspa = await import("@dfns/kaspa-wasm");
        const { UtxoEntry, UtxoEntries, ScriptPublicKey } = kaspa as any;

        console.log("Creating SPK...");
        const spk = new ScriptPublicKey(0, new Uint8Array(34).fill(0)); // 34 bytes for version 0 key? or 32 for key + 2 algo? 
        // usually 32 bytes for xonly + 2 for version/algo? 
        // actually existing code used whatever length hexToBytes returned.
        console.log("SPK created.");

        console.log("Creating Entry...");
        const entry = new UtxoEntry(1000n, spk, 0n, false);
        console.log("Entry created.");

        console.log("Creating Entries List...");
        const entries = new UtxoEntries([entry]); // This line is suspected to panic
        console.log("Entries created successfully.");

    } catch (e: any) {
        console.log("Panic caught:", e);
    }
};

main();
