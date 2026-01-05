
(async () => {
    const kaspa = await import("kaspa-wasm");

    function inspect(name: string, cls: any) {
        if (!cls) { console.log(name, "NOT FOUND"); return; }
        console.log(`\n--- ${name} ---`);
        try {
            console.log("Static:", Object.getOwnPropertyNames(cls));
            console.log("Proto:", Object.getOwnPropertyNames(cls.prototype));
        } catch (e: any) { console.log("Error inspecting:", e.message); }
    }

    inspect("Transaction", kaspa.Transaction);
    inspect("ScriptPublicKey", kaspa.ScriptPublicKey);
    inspect("UtxoEntry", kaspa.UtxoEntry);
    inspect("Address", kaspa.Address);
    inspect("SignableTransaction", kaspa.SignableTransaction);

    // Try to check constructor args length if possible (function.length)
    console.log("\nConstructor arg lengths:");
    console.log("Transaction:", kaspa.Transaction?.length);
    console.log("ScriptPublicKey:", kaspa.ScriptPublicKey?.length);
    console.log("UtxoEntry:", kaspa.UtxoEntry?.length);

})();
