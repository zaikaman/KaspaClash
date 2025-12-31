import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface Character {
    id: string;
    name: string;
    description: string;
    image: string;
}

const CHARACTERS: Character[] = [
    { id: "cyber-ninja", name: "Cyber Ninja", description: "Agile striker with high speed.", image: "/assets/character-ninja.webp" }, // Placeholder asset
    { id: "block-bruiser", name: "Block Bruiser", description: "Heavy hitter with strong defense.", image: "/assets/character-bruiser.webp" }, // Placeholder asset
    { id: "dag-warrior", name: "DAG Warrior", description: "Balanced fighter with ranged attacks.", image: "/assets/character-warrior.webp" }, // Placeholder asset
];

interface PracticeMenuProps {
    onStart: (characterId: string, difficulty: string) => void;
}

export default function PracticeMenu({ onStart }: PracticeMenuProps) {
    const [selectedChar, setSelectedChar] = useState<string>(CHARACTERS[0].id);
    const [difficulty, setDifficulty] = useState<string>("medium");

    return (
        <div className="flex flex-col md:flex-row gap-12 w-full max-w-5xl mx-auto items-start">
            {/* Left: Character Selection */}
            <div className="flex-1 w-full">
                <h2 className="text-2xl font-bold font-orbitron text-white mb-6">SELECT FIGHTER</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CHARACTERS.map((char) => (
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
                            {/* Portrait Placeholder */}
                            <div className="h-48 bg-black/50 flex items-center justify-center relative">
                                <span className="text-4xl">🥋</span>
                                {selectedChar === char.id && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-cyber-orange/40 to-transparent"></div>
                                )}
                            </div>

                            <div className="p-4">
                                <h3 className={`font-orbitron font-bold text-lg mb-1 ${selectedChar === char.id ? "text-cyber-orange" : "text-white"}`}>
                                    {char.name}
                                </h3>
                                <p className="text-xs text-cyber-gray leading-relaxed">
                                    {char.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Difficulty & Start */}
            <div className="w-full md:w-80 flex flex-col gap-8 bg-black/40 border border-cyber-gold/20 p-8 rounded-2xl backdrop-blur-md h-fit">
                <div>
                    <h2 className="text-2xl font-bold font-orbitron text-white mb-6">DIFFICULTY</h2>
                    <div className="flex flex-col gap-3">
                        {["easy", "medium", "hard"].map((diff) => (
                            <Button
                                key={diff}
                                variant="outline"
                                onClick={() => setDifficulty(diff)}
                                className={`
                                    w-full justify-between h-12 font-orbitron uppercase border-opacity-50
                                    ${difficulty === diff
                                        ? "bg-cyber-gold text-black border-cyber-gold font-bold"
                                        : "text-cyber-gray hover:text-white border-cyber-gray hover:border-white bg-transparent"
                                    }
                                `}
                            >
                                {diff}
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
