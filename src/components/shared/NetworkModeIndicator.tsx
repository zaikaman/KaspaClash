"use client";

/**
 * NetworkModeIndicator Component
 * Displays the current wallet network mode (read-only, based on wallet address)
 * Only visible when wallet is connected
 */

import React from "react";
import { detectNetworkFromAddress } from "@/stores/network-store";
import { NETWORK_CONFIG, type NetworkType } from "@/types/constants";
import { useWalletStore } from "@/stores/wallet-store";

interface NetworkModeIndicatorProps {
    /** Additional CSS classes */
    className?: string;
}

export default function NetworkModeIndicator({
    className = "",
}: NetworkModeIndicatorProps) {
    const walletAddress = useWalletStore((state) => state.address);
    const walletNetwork = useWalletStore((state) => state.network);
    const isConnected = useWalletStore((state) => state.connectionState === "connected");

    // Only show when wallet is connected
    if (!isConnected || !walletAddress) {
        return null;
    }

    // Detect network from wallet address or use stored network
    const currentNetwork: NetworkType = walletNetwork || detectNetworkFromAddress(walletAddress);
    const currentConfig = NETWORK_CONFIG[currentNetwork];

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${currentConfig.badgeClass} ${className}`}
            title={`Connected to Kaspa ${currentConfig.displayName}`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full ${currentNetwork === "mainnet" ? "bg-green-400" : "bg-orange-400"
                    }`}
            />
            {currentConfig.displayName}
        </div>
    );
}
