declare module 'kaspalib' {
    export class Transaction {
        constructor(options: {
            version: number;
            inputs: any[];
            outputs: any[];
            lockTime: bigint;
            subnetworkId: Uint8Array;
            gas: bigint;
            payload: Uint8Array;
        });
        sign(privateKey: Uint8Array): boolean;
        toRPCTransaction(): any;
        toBytes(): Uint8Array;
        id: string;
        mass: bigint;
        version: number;
        inputs: any[];
        outputs: any[];
        lockTime: bigint;
        subnetworkId: Uint8Array;
        gas: bigint;
        payload: Uint8Array;
    }

    export const Address: (options: { prefix: string }) => {
        decode: (address: string) => { type: string; payload: Uint8Array; prefix: string };
        encoded: (options: { type: string; payload: Uint8Array; prefix: string }) => string;
    };

    export const OutScript: {
        encode: (options: { version: number; type: string; payload: Uint8Array }) => { version: number; script: Uint8Array };
    };

    export function hexToBytes(hex: string): Uint8Array;
    export function bytesToHex(bytes: Uint8Array): string;
    export function transactionMass(tx: any, params?: any): bigint;

    export const MAXIMUM_STANDARD_TRANSACTION_MASS: number;
    export const MASS_PER_TX_BYTE: number;
}
