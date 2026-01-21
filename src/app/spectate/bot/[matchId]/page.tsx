"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import GameLayout from "@/components/layout/GameLayout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BotMatch } from "@/lib/game/bot-match-service";

// Dynamic import with SSR disabled
const BotSpectatorClient = dynamic(
    () => import("./BotSpectatorClient").then((mod) => mod.BotSpectatorClient),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-orange-400 text-lg font-orbitron">Loading bot battle...</p>
                </div>
            </div>
        )
    }
);

export default function BotSpectatePage() {
    const params = useParams();
    const matchId = params.matchId as string;

    const [match, setMatch] = useState<(BotMatch & { currentTurnIndex: number }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMatch() {
            try {
                const response = await fetch(`/api/bot-games?matchId=${encodeURIComponent(matchId)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.match) {
                        setMatch({
                            ...data.match,
                            currentTurnIndex: data.currentTurnIndex,
                        });
                    } else {
                        setError("Match not found");
                    }
                } else {
                    setError("Failed to load match");
                }
            } catch (err) {
                console.error("Failed to fetch bot match:", err);
                setError("Failed to connect");
            } finally {
                setLoading(false);
            }
        }

        fetchMatch();
    }, [matchId]);

    if (loading) {
        return (
            <GameLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-orange-400 text-lg font-orbitron">Loading bot match...</p>
                    </div>
                </div>
            </GameLayout>
        );
    }

    if (error || !match) {
        return (
            <GameLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white font-orbitron mb-4">
                            {error || "Match Not Found"}
                        </h2>
                        <p className="text-cyber-gray mb-8">This bot match may have ended or doesn't exist.</p>
                        <Link href="/spectate">
                            <Button className="bg-gradient-cyber text-white border-0 font-orbitron">
                                Back to Spectate
                            </Button>
                        </Link>
                    </div>
                </div>
            </GameLayout>
        );
    }

    return <BotSpectatorClient match={match} />;
}
