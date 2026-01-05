"use client";

import React from "react";
import GameSidebar from "./GameSidebar";
import WalletInfo from "@/components/wallet/WalletInfo";
import NetworkModeIndicator from "@/components/shared/NetworkModeIndicator";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";

interface GameLayoutProps {
    children: React.ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
    const {
        address,
        balance,
        truncatedAddress,
        isConnected,
        isConnecting,
        connect,
        disconnect,
        discoverWallets
    } = useWallet();

    const [isWalletModalOpen, setIsWalletModalOpen] = React.useState(false);

    // Discover wallets when modal opens
    React.useEffect(() => {
        if (isWalletModalOpen) {
            discoverWallets().then(wallets => {
                console.log("Discovered wallets:", wallets);
            });
        }
    }, [isWalletModalOpen, discoverWallets]);

    const handleConnect = async (walletType: string) => {
        try {
            await connect();
            setIsWalletModalOpen(false);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnect();
        } catch (error) {
            console.error("Failed to disconnect wallet:", error);
        }
    };

    return (
        <div className="min-h-screen bg-cyber-black text-white font-montserrat flex overflow-hidden">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/60" />
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
                    style={{ backgroundImage: "url('/assets/hero.webp')" }}
                />
                {/* Gradient Mesh */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-black via-transparent to-cyber-black" />
            </div>

            {/* Sidebar */}
            <GameSidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-64 relative z-10 flex flex-col h-screen overflow-hidden">
                {/* Top Bar for Wallet/Profile */}
                <header className="h-20 px-8 flex items-center justify-end gap-4 border-b border-white/5 backdrop-blur-sm">
                    <NetworkModeIndicator />

                    {isConnected && truncatedAddress ? (
                        <div className="bg-black/40 border border-cyber-gold/30 rounded-full pl-2 pr-4 py-1 flex items-center gap-3">
                            {/* Avatar Placeholder */}
                            <div className="w-8 h-8 rounded-full bg-gradient-cyber p-[2px]">
                                <img src="/logo.webp" alt="Avatar" className="w-full h-full rounded-full bg-black object-cover" />
                            </div>
                            <WalletInfo
                                address={truncatedAddress}
                                fullAddress={address || undefined}
                                balance={balance || "0"}
                                onDisconnect={handleDisconnect}
                            />
                        </div>
                    ) : (
                        <Button
                            onClick={() => setIsWalletModalOpen(true)}
                            disabled={isConnecting}
                            className="bg-cyber-gold/20 text-cyber-gold border border-cyber-gold font-semibold text-sm hover:bg-cyber-gold hover:text-black transition-all font-orbitron h-auto py-2 px-6 rounded-none clip-path-polygon-[10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px]"
                        >
                            {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
                        </Button>
                    )}
                </header>

                {/* Scrollable Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto w-full h-full">
                        {children}
                    </div>
                </main>
            </div>

            <WalletConnectModal
                isOpen={isWalletModalOpen}
                onClose={() => setIsWalletModalOpen(false)}
                onConnect={handleConnect}
            />
        </div>
    );
}
