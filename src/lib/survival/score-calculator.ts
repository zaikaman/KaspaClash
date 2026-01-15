/**
 * Score Calculator for Survival Mode
 * Calculate scores and shard rewards based on wave progression
 */

/**
 * Shard reward tiers by wave range
 * - Waves 1-5: 10 shards per wave = 50 total
 * - Waves 6-10: 15 shards per wave = 75 total
 * - Waves 11-15: 20 shards per wave = 100 total
 * - Waves 16-19: 25 shards per wave = 100 total
 * - Wave 20 (Boss): 100 shards bonus
 * Total possible: 425 shards per successful run
 */
const SHARD_REWARDS: { range: [number, number]; shardsPerWave: number }[] = [
    { range: [1, 5], shardsPerWave: 10 },
    { range: [6, 10], shardsPerWave: 15 },
    { range: [11, 15], shardsPerWave: 20 },
    { range: [16, 19], shardsPerWave: 25 },
];

const BOSS_VICTORY_BONUS = 100;
const VICTORY_MULTIPLIER = 1.5;

/**
 * Score multipliers based on performance
 */
const SCORE_BASE_PER_WAVE = 1000;
const HEALTH_BONUS_MULTIPLIER = 10;
const FLAWLESS_WAVE_BONUS = 500;

export interface ScoreResult {
    totalScore: number;
    waveScore: number;
    healthBonus: number;
    victoryBonus: number;
    shardsEarned: number;
    breakdown: {
        waveNumber: number;
        waveScore: number;
        shardsForWave: number;
    }[];
}

/**
 * Calculate shards earned for a specific wave
 */
export function getShardsForWave(waveNumber: number, isWaveCleared: boolean): number {
    if (!isWaveCleared) return 0;

    // Boss wave bonus
    if (waveNumber === 20) {
        return BOSS_VICTORY_BONUS;
    }

    // Find the tier for this wave
    for (const tier of SHARD_REWARDS) {
        if (waveNumber >= tier.range[0] && waveNumber <= tier.range[1]) {
            return tier.shardsPerWave;
        }
    }

    return 0;
}

/**
 * Calculate total shards earned up to a wave (inclusive)
 */
export function calculateTotalShards(wavesCleared: number, isVictory: boolean): number {
    let total = 0;

    for (let wave = 1; wave <= wavesCleared; wave++) {
        total += getShardsForWave(wave, true);
    }

    // Add boss bonus if they cleared wave 20
    if (isVictory && wavesCleared === 20) {
        total += BOSS_VICTORY_BONUS;
    }

    return total;
}

/**
 * Calculate score for a single wave
 */
export function calculateWaveScore(
    waveNumber: number,
    healthRemaining: number,
    roundsWon: number,
    totalRounds: number
): number {
    // Base score increases with wave number
    const baseScore = SCORE_BASE_PER_WAVE * waveNumber;

    // Health bonus: remaining health * multiplier
    const healthBonus = healthRemaining * HEALTH_BONUS_MULTIPLIER;

    // Flawless bonus: won without losing any rounds
    const flawlessBonus = roundsWon === totalRounds ? FLAWLESS_WAVE_BONUS : 0;

    return Math.floor(baseScore + healthBonus + flawlessBonus);
}

/**
 * Calculate complete score result for a survival run
 */
export function calculateSurvivalScore(
    wavesCleared: number,
    finalHealth: number,
    isVictory: boolean,
    waveDetails?: { healthAfter: number; roundsWon: number; totalRounds: number }[]
): ScoreResult {
    const breakdown: ScoreResult["breakdown"] = [];
    let waveScore = 0;

    // Calculate score for each cleared wave
    for (let wave = 1; wave <= wavesCleared; wave++) {
        const details = waveDetails?.[wave - 1];
        const wavePoints = details
            ? calculateWaveScore(wave, details.healthAfter, details.roundsWon, details.totalRounds)
            : SCORE_BASE_PER_WAVE * wave;

        waveScore += wavePoints;
        breakdown.push({
            waveNumber: wave,
            waveScore: wavePoints,
            shardsForWave: getShardsForWave(wave, true),
        });
    }

    // Health bonus for final health
    const healthBonus = finalHealth * HEALTH_BONUS_MULTIPLIER * (wavesCleared / 5);

    // Victory bonus: 50% extra for completing all 20 waves
    const victoryBonus = isVictory ? Math.floor(waveScore * (VICTORY_MULTIPLIER - 1)) : 0;

    // Calculate total shards
    let shardsEarned = 0;
    for (const item of breakdown) {
        shardsEarned += item.shardsForWave;
    }
    if (isVictory) {
        shardsEarned += BOSS_VICTORY_BONUS;
    }

    const totalScore = Math.floor(waveScore + healthBonus + victoryBonus);

    return {
        totalScore,
        waveScore,
        healthBonus: Math.floor(healthBonus),
        victoryBonus,
        shardsEarned,
        breakdown,
    };
}

/**
 * Get max possible shards for display
 */
export function getMaxPossibleShards(): number {
    let total = 0;
    for (let wave = 1; wave <= 19; wave++) {
        total += getShardsForWave(wave, true);
    }
    // Add boss bonus
    total += BOSS_VICTORY_BONUS;
    return total;
}

/**
 * Format score with commas for display
 */
export function formatScore(score: number): string {
    return score.toLocaleString();
}

/**
 * Get tier ranking based on waves cleared
 */
export function getSurvivalRank(wavesCleared: number): string {
    if (wavesCleared >= 20) return "CHAMPION";
    if (wavesCleared >= 15) return "LEGEND";
    if (wavesCleared >= 10) return "WARRIOR";
    if (wavesCleared >= 5) return "FIGHTER";
    return "ROOKIE";
}
