"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CHARACTER_ROSTER } from "@/data/characters";
import type { Character } from "@/types";
import { useWalletStore, selectPersistedAddress, selectIsConnected } from "@/stores/wallet-store";
import { TOTAL_WAVES, MAX_DAILY_PLAYS } from "@/lib/survival/wave-generator";
import { getMaxPossibleShards } from "@/lib/survival/score-calculator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Target02Icon,
    ChartLineData01Icon,
    SquareIcon,
    ChampionIcon,
    Sword01Icon,
} from "@hugeicons/core-free-icons";
import { ClashShardsIcon } from "@/components/currency/ClashShardsIcon";

interface SurvivalMenuProps {
    onStart: (characterId: string) => void;
}

const STARTERS = ["cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"];

interface SurvivalStatus {
    canPlay: boolean;
    playsRemaining: number;
    resetsAt: string;
    stats: {
        bestWaves: number;
        bestScore: number;
        totalRuns: number;
        victories: number;
        rank: number | null;
    };
}

export default function SurvivalMenu({ onStart }: SurvivalMenuProps) {
    const address = useWalletStore(selectPersistedAddress);
    const isConnected = useWalletStore(selectIsConnected);
    const [selectedChar, setSelectedChar] = useState<string>(CHARACTER_ROSTER[0].id);
    const [ownedCharacterIds, setOwnedCharacterIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<SurvivalStatus | null>(null);

    // Fetch status and inventory
    useEffect(() => {
        const fetchData = async () => {
            const defaultOwned = [...STARTERS];

            if (!address) {
                setOwnedCharacterIds(defaultOwned);
                setIsLoading(false);
                return;
            }

            try {
                // Fetch survival status
                const statusRes = await fetch(`/api/survival/status?playerAddress=${encodeURIComponent(address)}`);
                if (statusRes.ok) {
                    const data = await statusRes.json();
                    setStatus(data);
                }

                // Fetch inventory
                const invRes = await fetch(`/api/shop/inventory?playerId=${encodeURIComponent(address)}&pageSize=100&category=character`);
                if (invRes.ok) {
                    const data = await invRes.json();
                    const ownedIds = new Set(data.ownedIds as string[]);
                    const characters = (data.items as any[])
                        .filter(item => item.category === 'character' && ownedIds.has(item.id))
                        .map(item => item.characterId)
                        .filter(Boolean) as string[];
                    setOwnedCharacterIds([...new Set([...defaultOwned, ...characters])]);
                } else {
                    setOwnedCharacterIds(defaultOwned);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setOwnedCharacterIds(defaultOwned);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [address]);

    const selectedCharacter = CHARACTER_ROSTER.find(c => c.id === selectedChar);
    const canStart = status?.canPlay ?? true;
    const playsRemaining = status?.playsRemaining ?? MAX_DAILY_PLAYS;

    const handleStart = () => {
        if (!canStart || !isConnected) return;
        onStart(selectedChar);
    };

    const formatResetTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 w-full max-w-6xl mx-auto items-start">
            {/* Left: Character Selection */}
            <div className="flex-1 w-full">
                <h2 className="text-xl sm:text-2xl font-bold font-orbitron text-white mb-4 sm:mb-6">SELECT FIGHTER</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {CHARACTER_ROSTER.map((char: Character) => {
                        const isOwned = ownedCharacterIds.includes(char.id);

                        return (
                            <div
                                key={char.id}
                                onClick={() => isOwned && setSelectedChar(char.id)}
                                className={`
                                    cursor-pointer rounded-xl border-2 transition-all overflow-hidden relative group
                                    ${selectedChar === char.id
                                        ? "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                        : isOwned
                                            ? "border-cyber-gray/30 bg-black/40 hover:border-red-400/50"
                                            : "border-gray-800 bg-black/60 opacity-60 grayscale cursor-not-allowed"
                                    }
                                `}
                            >
                                <div className="h-32 sm:h-40 bg-black/50 flex items-center justify-center relative overflow-hidden">
                                    <img
                                        src={char.portraitUrl}
                                        alt={char.name}
                                        className="w-full h-full object-cover object-top"
                                    />
                                    {selectedChar === char.id && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-red-500/40 to-transparent"></div>
                                    )}
                                    {!isOwned && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className={`font-orbitron font-bold text-xs sm:text-sm truncate ${selectedChar === char.id ? "text-red-400" : isOwned ? "text-white" : "text-gray-500"}`}>
                                        {char.name}
                                    </h3>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selectedCharacter && (
                    <div className="mt-6 p-4 bg-black/40 border border-red-500/30 rounded-xl">
                        <h3 className="font-orbitron text-red-400 text-lg mb-2">{selectedCharacter.name}</h3>
                        <p className="text-cyber-gray text-sm leading-relaxed">{selectedCharacter.theme}</p>
                    </div>
                )}
            </div>

            {/* Right: Rules & Start */}
            <div className="w-full md:w-96 flex flex-col gap-6 bg-black/40 border border-red-500/20 p-6 sm:p-8 rounded-2xl backdrop-blur-md h-fit">
                {/* Rules */}
                <div>
                    <h2 className="text-xl font-bold font-orbitron text-red-400 mb-4">SURVIVAL RULES</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3 text-cyber-gray">
                            <HugeiconsIcon icon={Target02Icon} className="w-5 h-5 text-red-400" />
                            <span>Fight through <span className="text-white font-bold">{TOTAL_WAVES} waves</span> of AI opponents</span>
                        </div>
                        <div className="flex items-center gap-3 text-cyber-gray">
                            <HugeiconsIcon icon={ChartLineData01Icon} className="w-5 h-5 text-red-400" />
                            <span>Difficulty <span className="text-red-400">escalates</span> with each wave</span>
                        </div>
                        <div className="flex items-center gap-3 text-cyber-gray">
                            <HugeiconsIcon icon={SquareIcon} className="w-5 h-5 text-yellow-400 opacity-70" />
                            <span>Final boss: <span className="text-yellow-400">Mirror match</span> against yourself</span>
                        </div>
                        <div className="flex items-center gap-3 text-cyber-gray">
                            <ClashShardsIcon className="w-5 h-5 text-cyan-400" />
                            <span>Earn up to <span className="text-cyan-400 font-bold">{getMaxPossibleShards()} shards</span> per run</span>
                        </div>
                        <div className="flex items-center gap-3 text-cyber-gray">
                            <HugeiconsIcon icon={ChampionIcon} className="w-5 h-5 text-yellow-400" />
                            <span>Compete for the <span className="text-yellow-400">leaderboard</span></span>
                        </div>
                    </div>
                </div>

                {/* Daily Plays */}
                <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl">
                    <div className="flex justify-between items-center">
                        <span className="text-cyber-gray">DAILY PLAYS</span>
                        <span className="text-white font-bold font-orbitron">{playsRemaining}/{MAX_DAILY_PLAYS}</span>
                    </div>
                    {status?.resetsAt && playsRemaining < MAX_DAILY_PLAYS && (
                        <p className="text-xs text-red-400 mt-2">Resets at {formatResetTime(status.resetsAt)} UTC</p>
                    )}
                </div>

                {/* Personal Stats */}
                {status?.stats && status.stats.totalRuns > 0 && (
                    <div className="p-4 bg-black/30 border border-cyber-gray/20 rounded-xl">
                        <h3 className="text-sm font-orbitron text-cyber-gray mb-3">YOUR STATS</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-cyber-gray">Best Wave</span>
                                <p className="text-white font-bold">{status.stats.bestWaves}/{TOTAL_WAVES}</p>
                            </div>
                            <div>
                                <span className="text-cyber-gray">Best Score</span>
                                <p className="text-cyan-400 font-bold">{status.stats.bestScore.toLocaleString()}</p>
                            </div>
                            <div>
                                <span className="text-cyber-gray">Total Runs</span>
                                <p className="text-white font-bold">{status.stats.totalRuns}</p>
                            </div>
                            <div>
                                <span className="text-cyber-gray">Victories</span>
                                <p className="text-yellow-400 font-bold">{status.stats.victories}</p>
                            </div>
                        </div>
                        {status.stats.rank && (
                            <p className="text-xs text-cyber-gray mt-3">Leaderboard Rank: <span className="text-yellow-400">#{status.stats.rank}</span></p>
                        )}
                    </div>
                )}

                {/* Start Button */}
                <div className="pt-4 border-t border-white/10">
                    {!isConnected ? (
                        <p className="text-center text-cyber-gray text-sm mb-4">Connect wallet to play</p>
                    ) : !canStart ? (
                        <p className="text-center text-red-400 text-sm mb-4">No plays remaining today</p>
                    ) : null}

                    <Button
                        onClick={handleStart}
                        disabled={!canStart || !isConnected || isLoading}
                        className="w-full h-14 text-lg bg-gradient-to-r from-red-600 to-red-500 text-white font-orbitron font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            "LOADING..."
                        ) : canStart ? (
                            <div className="flex items-center justify-center gap-3">
                                <HugeiconsIcon icon={Sword01Icon} className="w-5 h-5" />
                                <span>BEGIN SURVIVAL</span>
                                <HugeiconsIcon icon={Sword01Icon} className="w-5 h-5" />
                            </div>
                        ) : (
                            "NO PLAYS LEFT"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
