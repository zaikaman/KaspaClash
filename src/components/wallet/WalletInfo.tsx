import React from "react";
import { Button } from "@/components/ui/button";

interface WalletInfoProps {
    address: string;
    balance: string;
    onDisconnect: () => void;
}

export default function WalletInfo({ address, balance, onDisconnect }: WalletInfoProps) {
    // Truncate address for display
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
        <div className="flex items-center gap-4 p-1 pr-2 rounded-full border border-cyber-gold/30 bg-black/40 backdrop-blur-md">
            {/* Balance Pill */}
            <div className="px-4 py-1.5 rounded-full bg-cyber-gold/10 border border-cyber-gold/20">
                <span className="text-cyber-gold font-bold font-orbitron text-sm">
                    {balance} <span className="text-xs font-normal opacity-80">KAS</span>
                </span>
            </div>

            {/* Address */}
            <span className="text-white text-sm font-mono tracking-wide hidden sm:inline-block">
                {shortAddress}
            </span>

            {/* Disconnect Button (Icon only on mobile, text on desktop) */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onDisconnect}
                className="text-cyber-gray hover:text-red-500 hover:bg-transparent h-auto p-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
            </Button>
        </div>
    );
}
