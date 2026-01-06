"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon, Loading03Icon, Coins01Icon } from "@hugeicons/core-free-icons";
import { useWallet } from "@/hooks/useWallet";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Quick stake amounts in KAS
const QUICK_STAKES = [1, 5, 10, 25, 50, 100];

interface RoomCreateProps {
  onRoomCreated?: (matchId: string, roomCode: string, stakeAmount?: number) => void;
  onCancel?: () => void;
}

export default function RoomCreate({ onRoomCreated, onCancel }: RoomCreateProps) {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Stake settings
  const [enableStake, setEnableStake] = useState(false);
  const [stakeAmount, setStakeAmount] = useState<string>("10");
  const [createdStakeAmount, setCreatedStakeAmount] = useState<number | null>(null);

  // Subscribe to match updates when room is created
  useEffect(() => {
    if (!matchId) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`room:${matchId}`)
      // Listen for broadcast events (more reliable, sent explicitly by server)
      .on("broadcast", { event: "player_joined" }, (payload) => {
        console.log("[RoomCreate] Received player_joined broadcast:", payload);
        router.push(`/match/${matchId}`);
      })
      // Also listen for postgres_changes as backup
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          console.log("[RoomCreate] Match updated:", payload);
          const newData = payload.new as { player2_address?: string; status?: string };

          // If player2 joined, navigate to match
          if (newData.player2_address) {
            console.log("[RoomCreate] Opponent joined! Navigating to match...");
            router.push(`/match/${matchId}`);
          }
        }
      )
      .subscribe((status) => {
        console.log("[RoomCreate] Subscription status:", status);
      });

    channelRef.current = channel;

    return () => {
      console.log("[RoomCreate] Cleaning up subscription");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [matchId, router]);

  const handleCreateRoom = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    // Validate stake amount if enabled
    const stakeValue = enableStake ? parseFloat(stakeAmount) : undefined;
    if (enableStake) {
      if (isNaN(stakeValue!) || stakeValue! < 1) {
        setError("Minimum stake is 1 KAS");
        return;
      }
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/matchmaking/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          stakeAmount: stakeValue,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to create room");
      }

      const data = await response.json();
      setRoomCode(data.roomCode);
      setMatchId(data.matchId);
      setCreatedStakeAmount(stakeValue || null);
      onRoomCreated?.(data.matchId, data.roomCode, stakeValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!roomCode) return;

    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      console.error("Failed to copy to clipboard");
    }
  };

  const handleCancel = () => {
    // Clean up subscription before canceling
    if (channelRef.current) {
      const supabase = getSupabaseClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    onCancel?.();
  };

  if (roomCode) {
    return (
      <Card className="w-full max-w-md bg-black/60 border-cyber-gold/30 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl font-orbitron text-cyber-gold">
            ROOM CREATED
          </CardTitle>
          <CardDescription className="text-cyber-gray text-sm sm:text-base">
            Share this code with your opponent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Room Code Display */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <div className="bg-black/80 border-2 border-cyber-gold rounded-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto text-center">
              <span className="text-2xl sm:text-4xl font-bold font-orbitron text-white tracking-widest">
                {roomCode}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              className="border-cyber-gold/50 hover:bg-cyber-gold/10 h-10 w-10 sm:h-auto sm:w-auto"
            >
              {copied ? (
                <HugeiconsIcon icon={Tick02Icon} className="h-5 w-5 text-green-500" />
              ) : (
                <HugeiconsIcon icon={Copy01Icon} className="h-5 w-5 text-cyber-gold" />
              )}
            </Button>
          </div>

          {/* Stake Info */}
          {createdStakeAmount && (
            <div className="bg-cyber-gold/10 border border-cyber-gold/30 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-cyber-gold font-orbitron">
                <HugeiconsIcon icon={Coins01Icon} className="h-5 w-5" />
                <span className="text-lg font-bold">{createdStakeAmount} KAS</span>
                <span className="text-sm text-cyber-gray">stake per player</span>
              </div>
              <p className="text-xs text-cyber-gray mt-1">
                Winner takes {createdStakeAmount * 2} KAS (0.1% fee)
              </p>
            </div>
          )}

          {/* Waiting Status */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin text-cyber-gold" />
              <span className="text-cyber-gray">Waiting for opponent to join...</span>
            </div>
          </div>

          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
          >
            Cancel Room
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-black/60 border-cyber-gold/30 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl sm:text-2xl font-orbitron text-cyber-gold">
          CREATE PRIVATE ROOM
        </CardTitle>
        <CardDescription className="text-cyber-gray text-sm sm:text-base">
          Challenge a specific opponent with a room code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Stake Toggle */}
        <div className="space-y-3 sm:space-y-4">
          <button
            type="button"
            onClick={() => setEnableStake(!enableStake)}
            className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-lg border-2 transition-all ${enableStake
                ? "border-cyber-gold bg-cyber-gold/10"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <HugeiconsIcon icon={Coins01Icon} className={`h-5 w-5 sm:h-6 sm:w-6 ${enableStake ? "text-cyber-gold" : "text-gray-400"}`} />
              <div className="text-left">
                <div className={`text-sm sm:text-base font-semibold ${enableStake ? "text-cyber-gold" : "text-gray-300"}`}>
                  Add Stakes
                </div>
                <div className="text-xs text-gray-500">
                  Both players bet KAS, winner takes all
                </div>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${enableStake ? "bg-cyber-gold" : "bg-gray-600"}`}>
              <div className={`w-5 h-5 mt-0.5 rounded-full bg-white transition-transform ${enableStake ? "translate-x-6" : "translate-x-0.5"}`} />
            </div>
          </button>

          {/* Stake Amount (shown when enabled) */}
          {enableStake && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-sm text-gray-400">Stake Amount (KAS)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-orbitron text-lg focus:border-cyber-gold focus:outline-none"
                placeholder="Enter stake amount"
              />

              {/* Quick stake buttons */}
              <div className="flex gap-2 flex-wrap">
                {QUICK_STAKES.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setStakeAmount(amount.toString())}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${stakeAmount === amount.toString()
                        ? "bg-cyber-gold text-black font-bold"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      }`}
                  >
                    {amount} KAS
                  </button>
                ))}
              </div>

              {/* Prize pool preview */}
              {parseFloat(stakeAmount) >= 1 && (
                <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <span className="text-sm text-gray-400">Total Prize Pool: </span>
                  <span className="text-lg font-bold text-green-400 font-orbitron">
                    {(parseFloat(stakeAmount) * 2).toFixed(0)} KAS
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleCreateRoom}
            disabled={!isConnected || isCreating}
            className="w-full bg-gradient-cyber hover:opacity-90 font-orbitron"
          >
            {isCreating ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                Creating Room...
              </>
            ) : enableStake ? (
              `Create Room (${stakeAmount} KAS Stake)`
            ) : (
              "Create Room"
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleCancel}
            className="w-full text-cyber-gray hover:text-white"
          >
            Back
          </Button>
        </div>

        {!isConnected && (
          <p className="text-center text-sm text-yellow-500">
            Connect your wallet to create a room
          </p>
        )}
      </CardContent>
    </Card>
  );
}
