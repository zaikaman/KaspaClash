"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";
import WalletInfo from "@/components/wallet/WalletInfo";
import NetworkModeIndicator from "@/components/shared/NetworkModeIndicator";
import { useWallet } from "@/hooks/useWallet";

export default function LandingHeader() {
    const pathname = usePathname();
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

    // Use real wallet hook
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

    // Discover wallets when modal opens
    useEffect(() => {
        if (isWalletModalOpen) {
            discoverWallets().then(wallets => {
                console.log("Discovered wallets:", wallets);
            });
        }
    }, [isWalletModalOpen, discoverWallets]);

    const handleConnect = async (walletType: string) => {
        try {
            console.log(`Attempting to connect wallet: ${walletType}`);
            // Just connect - the discovery process will find the wallet
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
        <header className="relative z-50">
            <nav className="container mx-auto px-6 lg:px-12 xl:px-24 py-6 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <img
                        src="/logo.webp"
                        alt="KaspaClash Logo"
                        className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                    <span className="text-2xl font-bold bg-gradient-cyber bg-clip-text text-transparent font-orbitron">
                        KaspaClash
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8 text-base font-medium">
                    <Link
                        href="/"
                        className={`hover:text-cyber-gold transition-colors ${pathname === "/" ? "text-cyber-gold" : "text-white"}`}
                    >
                        Home
                    </Link>
                    <Link
                        href="/matchmaking"
                        className={`hover:text-cyber-gold transition-colors ${pathname === "/matchmaking" ? "text-cyber-gold" : "text-white"}`}
                    >
                        Play Now
                    </Link>
                    <Link
                        href="/leaderboard"
                        className={`hover:text-cyber-gold transition-colors ${pathname === "/leaderboard" ? "text-cyber-gold" : "text-white"}`}
                    >
                        Leaderboard
                    </Link>
                    <Link
                        href="/docs"
                        className={`hover:text-cyber-gold transition-colors ${pathname === "/docs" ? "text-cyber-gold" : "text-white"}`}
                    >
                        Docs
                    </Link>
                </div>

                {/* Network Mode & Wallet / CTA */}
                <div className="hidden md:flex items-center gap-3">
                    <NetworkModeIndicator />
                    {isConnected && truncatedAddress ? (
                        <WalletInfo
                            address={truncatedAddress}
                            fullAddress={address || undefined}
                            balance={balance || "0"}
                            onDisconnect={handleDisconnect}
                        />
                    ) : (
                        <Button
                            onClick={() => setIsWalletModalOpen(true)}
                            disabled={isConnecting}
                            className="bg-gradient-cyber text-white border-0 font-semibold text-[17px] hover:opacity-90 transition-opacity font-orbitron h-auto py-3 px-6"
                        >
                            {isConnecting ? "Connecting..." : "Connect Wallet"}
                        </Button>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button className="md:hidden text-white p-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </nav>

            {/* Wallet Modal */}
            <WalletConnectModal
                isOpen={isWalletModalOpen}
                onClose={() => setIsWalletModalOpen(false)}
                onConnect={handleConnect}
            />
        </header>
    );
}
