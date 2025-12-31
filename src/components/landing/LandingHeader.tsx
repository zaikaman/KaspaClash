"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";
import WalletInfo from "@/components/wallet/WalletInfo";

export default function LandingHeader() {
    const pathname = usePathname();
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Mock wallet data - in a real app this would come from useWallet hook
    const walletAddress = "kaspa:qxyz...abcd";
    const walletBalance = "1,250";

    const handleConnect = (walletType: string) => {
        // Here we would actually trigger the wallet connection logic
        console.log(`Connecting to ${walletType}...`);
        setIsConnected(true);
        setIsWalletModalOpen(false);
    };

    const handleDisconnect = () => {
        setIsConnected(false);
    };

    return (
        <header className="relative z-50">
            <nav className="container mx-auto px-6 lg:px-12 xl:px-24 py-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-2xl font-bold bg-gradient-cyber bg-clip-text text-transparent font-orbitron">
                    KaspaClash
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

                {/* Wallet / CTA */}
                <div className="hidden md:block">
                    {isConnected ? (
                        <WalletInfo
                            address={walletAddress}
                            balance={walletBalance}
                            onDisconnect={handleDisconnect}
                        />
                    ) : (
                        <Button
                            onClick={() => setIsWalletModalOpen(true)}
                            className="bg-gradient-cyber text-white border-0 font-semibold text-[17px] hover:opacity-90 transition-opacity font-orbitron h-auto py-3 px-6"
                        >
                            Connect Wallet
                        </Button>
                    )}
                </div>

                {/* Mobile Menu Button - TODO: Implement functionality */}
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
