"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon, Tick02Icon, Loading03Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { useWallet } from "@/hooks/useWallet";
import { sendKaspa } from "@/lib/kaspa/wallet";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface StakeDepositProps {
    matchId: string;
    stakeAmountSompi: string; // Stake amount in sompi (as string)
    expiresAt?: string; // ISO timestamp when stake window closes
    isHost: boolean; // True if this player created the room
    onDeposited: () => void; // Called when both players have deposited
    onCancel: () => void; // Called if player cancels
}

/**
 * StakeDeposit Component
 * Shows the stake deposit flow where both players must deposit their stake
 * to the vault wallet before the match can proceed.
 */
export default function StakeDeposit({
    matchId,
    stakeAmountSompi,
    expiresAt,
    isHost,
    onDeposited,
    onCancel,
}: StakeDepositProps) {
    const { address, isConnected } = useWallet();
    const [isDepositing, setIsDepositing] = useState(false);
    const [myDepositConfirmed, setMyDepositConfirmed] = useState(false);
    const [opponentDepositConfirmed, setOpponentDepositConfirmed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(60);
    const channelRef = useRef<RealtimeChannel | null>(null);

    // Timer logic
    useEffect(() => {
        if (!expiresAt) return;

        const updateTimer = () => {
            const now = Date.now();
            const deadline = new Date(expiresAt).getTime();
            const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
            setTimeLeft(remaining);

            if (remaining <= 0) {
                // Auto-cancel if time is up and we haven't both deposited
                // We rely on onCancel to trigger the API call to refund if needed
                if (!myDepositConfirmed || !opponentDepositConfirmed) {
                    console.log("[StakeDeposit] Timer expired, triggering auto-cancel");
                    onCancel();
                }
            }
        };

        const interval = setInterval(updateTimer, 1000);
        updateTimer(); // Initial check

        return () => clearInterval(interval);
    }, [expiresAt, myDepositConfirmed, opponentDepositConfirmed, onCancel]);

    // Convert sompi to KAS for display
    const stakeKas = Number(BigInt(stakeAmountSompi)) / 100000000;

    // Determine vault address based on network
    const isTestnet = address?.startsWith("kaspatest:");
    const vaultAddress = isTestnet
        ? process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_TESTNET
        : process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS_MAINNET ||
        process.env.NEXT_PUBLIC_BETTING_VAULT_ADDRESS;

    // Subscribe to stake confirmation events
    useEffect(() => {
        if (!matchId) return;

        const supabase = getSupabaseClient();
        const channel = supabase
            .channel(`match:${matchId}`)
            .on("broadcast", { event: "stake_confirmed" }, (payload) => {
                console.log("[StakeDeposit] Received stake_confirmed:", payload);
                const data = payload.payload as {
                    playerAddress: string;
                    isPlayer1: boolean;
                    bothConfirmed: boolean;
                };

                // Check if this is our confirmation or opponent's
                if (data.playerAddress === address) {
                    setMyDepositConfirmed(true);
                } else {
                    setOpponentDepositConfirmed(true);
                }

                // If both confirmed, proceed immediately
                if (data.bothConfirmed) {
                    console.log("[StakeDeposit] bothConfirmed=true in stake_confirmed, proceeding");
                    onDeposited();
                }
            })
            .on("broadcast", { event: "stakes_ready" }, (payload) => {
                console.log("[StakeDeposit] Received stakes_ready:", payload);
                // Both deposits confirmed, proceed to match
                onDeposited();
            })
            .subscribe((status) => {
                console.log("[StakeDeposit] Subscription status:", status);
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [matchId, address, onDeposited]);

    // Auto-proceed when both deposits are confirmed locally
    useEffect(() => {
        if (myDepositConfirmed && opponentDepositConfirmed) {
            console.log("[StakeDeposit] Both deposits confirmed locally, proceeding");
            onDeposited();
        }
    }, [myDepositConfirmed, opponentDepositConfirmed, onDeposited]);

    // Handle deposit action
    const handleDeposit = useCallback(async () => {
        if (!isConnected || !address || !vaultAddress) {
            setError("Please connect your wallet");
            return;
        }

        setIsDepositing(true);
        setError(null);

        try {
            // Send stake to vault
            const sompiAmount = Number(BigInt(stakeAmountSompi));
            const txId = await sendKaspa(
                vaultAddress,
                sompiAmount,
                `stake:${matchId}`
            );

            console.log("[StakeDeposit] Transaction sent:", txId);

            // Confirm stake with server
            const response = await fetch("/api/matchmaking/rooms/stake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    matchId,
                    playerAddress: address,
                    txId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error?.message || "Failed to confirm stake");
            }

            const result = await response.json();
            setMyDepositConfirmed(true);

            if (result.bothConfirmed) {
                onDeposited();
            }
        } catch (err) {
            console.error("[StakeDeposit] Error:", err);
            setError(err instanceof Error ? err.message : "Failed to deposit stake");
        } finally {
            setIsDepositing(false);
        }
    }, [address, isConnected, matchId, stakeAmountSompi, vaultAddress, onDeposited]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        // Clean up subscription
        if (channelRef.current) {
            const supabase = getSupabaseClient();
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        onCancel();
    }, [onCancel]);

    return (
        <Card className="w-full max-w-md bg-black/80 border-cyber-gold/30 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-orbitron text-cyber-gold flex items-center justify-center gap-2">
                    <HugeiconsIcon icon={Coins01Icon} className="h-6 w-6" />
                    STAKE DEPOSIT
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Stake Amount Display */}
                <div className="text-center">
                    <div className="text-4xl font-bold font-orbitron text-white">
                        {stakeKas} KAS
                    </div>
                    <div className="text-sm text-cyber-gray mt-1">
                        Stake per player
                    </div>
                    <div className="text-lg font-bold text-green-400 mt-2">
                        Winner takes {stakeKas * 2} KAS
                    </div>
                    <div className="text-xs text-gray-500">
                        (0.1% platform fee)
                    </div>
                </div>

                {/* Timer Display */}
                {expiresAt && (
                    <div className="text-center font-orbitron">
                        <span className={`text-xl ${timeLeft < 10 ? "text-red-500 animate-pulse" : "text-cyber-gold"}`}>
                            Time Remaining: {timeLeft}s
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                            Deposits will auto-refund if time expires
                        </div>
                    </div>
                )}

                {/* Deposit Status */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Your Status */}
                    <div
                        className={`p-4 rounded-lg border-2 transition-all ${myDepositConfirmed
                            ? "border-green-500 bg-green-500/10"
                            : "border-gray-700 bg-gray-800/50"
                            }`}
                    >
                        <div className="text-center">
                            <div className="text-sm text-gray-400 mb-2">
                                {isHost ? "You (Host)" : "You"}
                            </div>
                            {myDepositConfirmed ? (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex items-center justify-center gap-2 text-green-400"
                                >
                                    <HugeiconsIcon icon={Tick02Icon} className="h-5 w-5" />
                                    <span className="font-bold">Deposited</span>
                                </motion.div>
                            ) : (
                                <span className="text-gray-500">Pending</span>
                            )}
                        </div>
                    </div>

                    {/* Opponent Status */}
                    <div
                        className={`p-4 rounded-lg border-2 transition-all ${opponentDepositConfirmed
                            ? "border-green-500 bg-green-500/10"
                            : "border-gray-700 bg-gray-800/50"
                            }`}
                    >
                        <div className="text-center">
                            <div className="text-sm text-gray-400 mb-2">
                                {isHost ? "Opponent" : "Host"}
                            </div>
                            {opponentDepositConfirmed ? (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex items-center justify-center gap-2 text-green-400"
                                >
                                    <HugeiconsIcon icon={Tick02Icon} className="h-5 w-5" />
                                    <span className="font-bold">Deposited</span>
                                </motion.div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-gray-500">
                                    <HugeiconsIcon
                                        icon={Loading03Icon}
                                        className="h-4 w-4 animate-spin"
                                    />
                                    <span>Waiting...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-center"
                        >
                            <p className="text-red-400 text-sm">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Deposit Button */}
                {!myDepositConfirmed && (
                    <Button
                        onClick={handleDeposit}
                        disabled={!isConnected || isDepositing}
                        className="w-full bg-gradient-cyber text-white font-orbitron hover:opacity-90 py-6 text-lg"
                    >
                        {isDepositing ? (
                            <>
                                <HugeiconsIcon
                                    icon={Loading03Icon}
                                    className="mr-2 h-5 w-5 animate-spin"
                                />
                                Depositing...
                            </>
                        ) : (
                            <>
                                <HugeiconsIcon icon={Coins01Icon} className="mr-2 h-5 w-5" />
                                Deposit {stakeKas} KAS
                            </>
                        )}
                    </Button>
                )}

                {/* Waiting Message */}
                {myDepositConfirmed && !opponentDepositConfirmed && (
                    <div className="text-center p-4 bg-cyber-gold/10 border border-cyber-gold/30 rounded-lg">
                        <div className="flex items-center justify-center gap-2 text-cyber-gold">
                            <HugeiconsIcon
                                icon={Loading03Icon}
                                className="h-5 w-5 animate-spin"
                            />
                            <span className="font-orbitron">
                                Waiting for opponent to deposit...
                            </span>
                        </div>
                    </div>
                )}

                {/* Cancel Button */}
                <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
                >
                    <HugeiconsIcon icon={Cancel01Icon} className="mr-2 h-4 w-4" />
                    Cancel Match
                </Button>

                {/* Info Notice */}
                <div className="text-center text-xs text-gray-500">
                    <p>Your stake will be deposited to the secure vault.</p>
                    <p>If the match is cancelled, stakes will be refunded.</p>
                </div>
            </CardContent>
        </Card>
    );
}
