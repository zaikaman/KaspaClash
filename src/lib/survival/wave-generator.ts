/**
 * Wave Generator for Survival Mode
 * Defines 20 waves with escalating AI difficulty
 */

import { CHARACTER_ROSTER } from "@/data/characters";
import type { Character } from "@/types";
import type { AIDifficulty } from "@/lib/game/ai-opponent";

/**
 * Wave configuration defining opponent and difficulty
 */
export interface WaveConfig {
    waveNumber: number;
    characterId: string;
    characterName: string;
    difficulty: AIDifficulty;
    isBossWave: boolean;
    isMirrorMatch: boolean;
}

/**
 * Wave tier definitions for difficulty scaling
 */
const WAVE_TIERS: { range: [number, number]; difficulty: AIDifficulty }[] = [
    { range: [1, 5], difficulty: "easy" },
    { range: [6, 10], difficulty: "medium" },
    { range: [11, 20], difficulty: "hard" },
];

/**
 * Get difficulty for a given wave number
 */
export function getWaveDifficulty(waveNumber: number): AIDifficulty {
    for (const tier of WAVE_TIERS) {
        if (waveNumber >= tier.range[0] && waveNumber <= tier.range[1]) {
            return tier.difficulty;
        }
    }
    return "hard"; // Default to hard for any overflow
}

/**
 * Get a random character that's different from the previous one
 */
function getRandomCharacter(excludeId?: string): Character {
    const availableCharacters = excludeId
        ? CHARACTER_ROSTER.filter(c => c.id !== excludeId)
        : CHARACTER_ROSTER;

    const index = Math.floor(Math.random() * availableCharacters.length);
    return availableCharacters[index];
}

/**
 * Generate all 20 waves for a survival run
 * @param playerCharacterId - The player's chosen character (used for wave 20 mirror match)
 * @returns Array of 20 wave configurations
 */
export function generateSurvivalWaves(playerCharacterId: string): WaveConfig[] {
    const waves: WaveConfig[] = [];
    let lastCharacterId: string | undefined;

    for (let i = 1; i <= 20; i++) {
        const isBossWave = i === 20;
        const isMirrorMatch = isBossWave;

        let character: Character;

        if (isMirrorMatch) {
            // Wave 20: Mirror match against player's own character
            character = CHARACTER_ROSTER.find(c => c.id === playerCharacterId) || CHARACTER_ROSTER[0];
        } else {
            // Random character, avoiding repeats
            character = getRandomCharacter(lastCharacterId);
            lastCharacterId = character.id;
        }

        waves.push({
            waveNumber: i,
            characterId: character.id,
            characterName: character.name,
            difficulty: getWaveDifficulty(i),
            isBossWave,
            isMirrorMatch,
        });
    }

    return waves;
}

/**
 * Get wave configuration for a specific wave number
 * @param waveNumber - Wave number (1-20)
 * @param playerCharacterId - Player's character for mirror match
 * @param previousCharacterId - Previous opponent to avoid repeats
 */
export function getWaveConfig(
    waveNumber: number,
    playerCharacterId: string,
    previousCharacterId?: string
): WaveConfig {
    const isBossWave = waveNumber === 20;
    const isMirrorMatch = isBossWave;

    let character: Character;

    if (isMirrorMatch) {
        character = CHARACTER_ROSTER.find(c => c.id === playerCharacterId) || CHARACTER_ROSTER[0];
    } else {
        character = getRandomCharacter(previousCharacterId);
    }

    return {
        waveNumber,
        characterId: character.id,
        characterName: character.name,
        difficulty: getWaveDifficulty(waveNumber),
        isBossWave,
        isMirrorMatch,
    };
}

/**
 * Get wave tier name for display
 */
export function getWaveTierName(waveNumber: number): string {
    if (waveNumber <= 5) return "ROOKIE";
    if (waveNumber <= 10) return "WARRIOR";
    if (waveNumber <= 15) return "CHAMPION";
    if (waveNumber <= 19) return "LEGEND";
    return "FINAL BOSS";
}

/**
 * Get wave tier color for UI
 */
export function getWaveTierColor(waveNumber: number): string {
    if (waveNumber <= 5) return "#22c55e"; // Green
    if (waveNumber <= 10) return "#3b82f6"; // Blue
    if (waveNumber <= 15) return "#a855f7"; // Purple
    if (waveNumber <= 19) return "#f97316"; // Orange
    return "#ef4444"; // Red for boss
}

/**
 * Constants
 */
export const TOTAL_WAVES = 20;
export const MAX_DAILY_PLAYS = 3;
