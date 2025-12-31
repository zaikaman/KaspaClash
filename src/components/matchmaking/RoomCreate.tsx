"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Loader2 } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

interface RoomCreateProps {
  onRoomCreated?: (matchId: string, roomCode: string) => void;
  onCancel?: () => void;
}

export default function RoomCreate({ onRoomCreated, onCancel }: RoomCreateProps) {
  const { address, isConnected } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/matchmaking/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to create room");
      }

      const data = await response.json();
      setRoomCode(data.roomCode);
      setMatchId(data.matchId);
      onRoomCreated?.(data.matchId, data.roomCode);
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

  if (roomCode) {
    return (
      <Card className="w-full max-w-md bg-black/60 border-cyber-gold/30 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-orbitron text-cyber-gold">
            ROOM CREATED
          </CardTitle>
          <CardDescription className="text-cyber-gray">
            Share this code with your opponent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Room Code Display */}
          <div className="flex items-center justify-center gap-4">
            <div className="bg-black/80 border-2 border-cyber-gold rounded-lg px-8 py-4">
              <span className="text-4xl font-bold font-orbitron text-white tracking-widest">
                {roomCode}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              className="border-cyber-gold/50 hover:bg-cyber-gold/10"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5 text-cyber-gold" />
              )}
            </Button>
          </div>

          {/* Waiting Status */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-cyber-gold" />
              <span className="text-cyber-gray">Waiting for opponent to join...</span>
            </div>
          </div>

          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={onCancel}
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
        <CardTitle className="text-2xl font-orbitron text-cyber-gold">
          CREATE PRIVATE ROOM
        </CardTitle>
        <CardDescription className="text-cyber-gray">
          Challenge a specific opponent with a room code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={handleCreateRoom}
            disabled={!isConnected || isCreating}
            className="w-full bg-gradient-cyber hover:opacity-90 font-orbitron"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Room...
              </>
            ) : (
              "Create Room"
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
            Connect your wallet to create a room
          </p>
        )}
      </CardContent>
    </Card>
  );
}
