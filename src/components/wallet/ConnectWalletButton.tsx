"use client";

/**
 * ConnectWalletButton Component
 * Button to connect/disconnect Kaspa wallets
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWallet } from "@/hooks/useWallet";
import { formatAddress } from "@/lib/utils";

/**
 * Wallet icon component.
 */
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

/**
 * ConnectWalletButton props.
 */
interface ConnectWalletButtonProps {
  className?: string;
  variant?: "default" | "kaspa" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "xl";
}

/**
 * ConnectWalletButton component.
 * Shows connect dialog when disconnected, account info when connected.
 */
export function ConnectWalletButton({
  className,
  variant = "kaspa",
  size = "default",
}: ConnectWalletButtonProps) {
  const {
    isConnected,
    isConnecting,
    address,
    balance,
    availableWallets,
    connect,
    disconnect,
  } = useWallet();

  const [isOpen, setIsOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Track when wallets have been discovered
  useEffect(() => {
    // Give wallets time to be discovered
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  const [error, setError] = useState<string | null>(null);

  // Handle wallet connection
  const handleConnect = async (walletName: string) => {
    try {
      setError(null);
      // Find the provider from available wallets
      const wallet = availableWallets.find(
        (w) => w.name.toLowerCase() === walletName.toLowerCase()
      );
      await connect(wallet?.provider);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    await disconnect();
    setIsOpen(false);
  };

  // Connected state - show address and balance
  if (isConnected && address) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <WalletIcon className="size-4" />
            <span>{formatAddress(address)}</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wallet Connected</DialogTitle>
            <DialogDescription>
              Your Kaspa wallet is connected
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Address */}
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-1">Address</p>
              <p className="font-mono text-sm break-all">{address}</p>
            </div>

            {/* Balance */}
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-1">Balance</p>
              <p className="text-2xl font-bold text-kaspa">
                {balance || "Loading..."}
              </p>
            </div>

            {/* Disconnect button */}
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDisconnect}
            >
              Disconnect Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Disconnected state - show connect dialog
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isConnecting}
        >
          <WalletIcon className="size-4" />
          <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription>
            Choose a Kaspa wallet to connect to KaspaClash
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isInitializing ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaspa mx-auto mb-4" />
              Detecting wallets...
            </div>
          ) : availableWallets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No Kaspa wallets detected
              </p>
              <p className="text-sm text-muted-foreground">
                Please install a Kaspa wallet extension like{" "}
                <a
                  href="https://kasware.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-kaspa hover:underline"
                >
                  Kasware
                </a>
                ,{" "}
                <a
                  href="https://kaspium.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-kaspa hover:underline"
                >
                  Kaspium
                </a>
                , or{" "}
                <a
                  href="https://kastle.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-kaspa hover:underline"
                >
                  Kastle
                </a>
              </p>
            </div>
          ) : (
            <>
              {availableWallets.map((wallet) => (
                <Button
                  key={wallet.name}
                  variant="outline"
                  className="w-full justify-start gap-3 h-14"
                  onClick={() => handleConnect(wallet.name)}
                  disabled={isConnecting}
                >
                  {wallet.icon ? (
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      className="size-8 rounded"
                    />
                  ) : (
                    <WalletIcon className="size-8" />
                  )}
                  <div className="text-left">
                    <p className="font-medium">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Click to connect
                    </p>
                  </div>
                </Button>
              ))}
            </>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConnectWalletButton;
