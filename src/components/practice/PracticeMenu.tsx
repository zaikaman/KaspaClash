import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CHARACTER_ROSTER } from "@/data/characters";
import type { Character } from "@/types";

interface PracticeMenuProps {
    onStart: (characterId: string, difficulty: string) => void;
}

const DIFFICULTIES = [
    { id: "easy", label: "BEGINNER", color: "bg-green-600", icon: "🌱" },
    { id: "medium", label: "FIGHTER", color: "bg-amber-500", icon: "⚔️" },
    { id: "hard", label: "CHAMPION", color: "bg-red-600", icon: "🏆" },
];

export default function PracticeMenu({ onStart }: PracticeMenuProps) {
    const [selectedChar, setSelectedChar] = useState<string>(CHARACTER_ROSTER[0].id);
    const [difficulty, setDifficulty] = useState<string>("medium");

    const selectedCharacter = CHARACTER_ROSTER.find(c => c.id === selectedChar);

    return (
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 w-full max-w-5xl mx-auto items-start">
            {/* Left: Character Selection */}
            <div className="flex-1 w-full">
                <h2 className="text-xl sm:text-2xl font-bold font-orbitron text-white mb-4 sm:mb-6">SELECT FIGHTER</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {CHARACTER_ROSTER.map((char: Character) => (
                        <div
                            key={char.id}
                            onClick={() => setSelectedChar(char.id)}
                            className={`
                                cursor-pointer rounded-xl border-2 transition-all overflow-hidden relative group
                                ${selectedChar === char.id
                                    ? "border-cyber-orange bg-cyber-orange/10 shadow-[0_0_20px_rgba(224,54,9,0.3)]"
                                    : "border-cyber-gray/30 bg-black/40 hover:border-cyber-gold/50"
                                }
                            `}
                        >
                            {/* Character Portrait */}
                            <div className="h-32 sm:h-40 bg-black/50 flex items-center justify-center relative overflow-hidden">
                                <img
                                    src={char.portraitUrl}
                                    alt={char.name}
                                    className="w-full h-full object-cover object-top"
                                    onError={(e) => {
                                        // Fallback to emoji if portrait fails to load (should not happen now)
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                                <span className="text-4xl hidden">🥋</span>
                                {selectedChar === char.id && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-cyber-orange/40 to-transparent"></div>
                                )}
                            </div>

                            <div className="p-3">
                                <h3 className={`font-orbitron font-bold text-sm mb-1 ${selectedChar === char.id ? "text-cyber-orange" : "text-white"}`}>
                                    {char.name}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Selected character info */}
                {selectedCharacter && (
                    <div className="mt-6 p-4 bg-black/40 border border-cyber-gray/30 rounded-xl">
                        <h3 className="font-orbitron text-cyber-gold text-lg mb-2">{selectedCharacter.name}</h3>
                        <p className="text-cyber-gray text-sm leading-relaxed">{selectedCharacter.theme}</p>
                    </div>
                )}
            </div>

            {/* Right: Difficulty & Start */}
            <div className="w-full md:w-80 flex flex-col gap-6 sm:gap-8 bg-black/40 border border-cyber-gold/20 p-6 sm:p-8 rounded-2xl backdrop-blur-md h-fit">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold font-orbitron text-white mb-4 sm:mb-6">DIFFICULTY</h2>
                    <div className="flex flex-col gap-3">
                        {DIFFICULTIES.map((diff) => (
                            <Button
                                key={diff.id}
                                variant="outline"
                                onClick={() => setDifficulty(diff.id)}
                                className={`
                                    w-full justify-between h-12 font-orbitron uppercase border-opacity-50 transition-all
                                    ${difficulty === diff.id
                                        ? "!bg-[#F0B71F] !text-black !border-[#F0B71F] font-bold shadow-[0_0_15px_rgba(240,183,31,0.4)]"
                                        : "text-cyber-gray hover:text-white border-cyber-gray hover:border-white bg-transparent hover:bg-white/5"
                                    }
                                `}
                            >
                                <span className="flex items-center gap-2">
                                    <span>{diff.icon}</span>
                                    <span>{diff.label}</span>
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                    <Button
                        onClick={() => onStart(selectedChar, difficulty)}
                        className="w-full h-14 text-lg bg-gradient-cyber text-white font-orbitron font-bold shadow-[0_0_20px_rgba(240,183,31,0.3)] hover:shadow-[0_0_30px_rgba(240,183,31,0.5)] transition-all"
                    >
                        START TRAINING
                    </Button>
                </div>
            </div>
        </div>
    );
}
