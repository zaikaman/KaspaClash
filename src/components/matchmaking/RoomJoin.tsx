"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { ClashShardsIcon } from "@/components/currency/ClashShardsIcon";
import { useWallet } from "@/hooks/useWallet";

interface RoomJoinProps {
  onJoined?: (matchId: string, stakeAmountSompi?: string) => void;
  onCancel?: () => void;
}

export default function RoomJoin({ onJoined, onCancel }: RoomJoinProps) {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stakePreview, setStakePreview] = useState<number | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric, uppercase, max 6 chars
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setRoomCode(value);
    setError(null);
    setStakePreview(null); // Reset stake preview when code changes
  };

  const handleJoinRoom = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (roomCode.length !== 6) {
      setError("Room code must be 6 characters");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch("/api/matchmaking/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, roomCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to join room");
      }

      const data = await response.json();

      // If this room has stakes, show preview and pass to callback
      // The parent component will handle showing the StakeDeposit screen
      if (data.stakeAmount) {
        setStakePreview(Number(BigInt(data.stakeAmount)) / 100000000);
      }

      onJoined?.(data.matchId, data.stakeAmount);

      // Navigate to match (the match page will handle stake deposit if needed)
      router.push(`/match/${data.matchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && roomCode.length === 6) {
      handleJoinRoom();
    }
  };

  return (
    <Card className="w-full max-w-md bg-black/60 border-cyber-gold/30 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-orbitron text-cyber-gold">
          JOIN PRIVATE ROOM
        </CardTitle>
        <CardDescription className="text-cyber-gray">
          Enter the room code shared by your opponent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Room Code Input */}
        <div className="space-y-2">
          <label className="text-sm text-cyber-gray block text-center">
            Room Code
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            placeholder="XXXXXX"
            className="w-full bg-black/80 border-2 border-cyber-gold/50 rounded-lg px-6 py-4 text-center text-3xl font-bold font-orbitron text-white tracking-widest placeholder:text-cyber-gray/30 focus:border-cyber-gold focus:outline-none transition-colors"
            maxLength={6}
            autoComplete="off"
            autoFocus
          />
          <p className="text-xs text-cyber-gray text-center">
            {roomCode.length}/6 characters
          </p>
        </div>

        {/* Stake Preview (shown when joining a staked room) */}
        {stakePreview && (
          <div className="bg-cyber-gold/10 border border-cyber-gold/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-cyber-gold font-orbitron">
              <ClashShardsIcon className="h-5 w-5" />
              <span className="text-lg font-bold">{stakePreview} KAS</span>
              <span className="text-sm text-cyber-gray">stake required</span>
            </div>
            <p className="text-xs text-green-400 mt-1">
              Winner takes {stakePreview * 2} KAS
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleJoinRoom}
            disabled={!isConnected || isJoining || roomCode.length !== 6}
            className="w-full bg-gradient-cyber hover:opacity-90 font-orbitron"
          >
            {isJoining ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Room"
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full text-cyber-gray hover:text-white"
          >
            Back
          </Button>
        </div>

        {!isConnected && (
          <p className="text-center text-sm text-yellow-500">
            Connect your wallet to join a room
          </p>
        )}
      </CardContent>
    </Card>
  );
}
