/**
 * Achievement Tracker Game Manager
 * Phaser scene manager for tracking achievements during gameplay
 * Task: T115 [US8]
 */

import Phaser from "phaser";
import { EventBus } from "@/game/EventBus";

/** Match event data for achievement tracking */
interface MatchEventData {
    winner: string;
    loser: string;
    player1Address: string;
    player2Address: string;
    player1RoundsWon: number;
    player2RoundsWon: number;
    currentPlayerAddress: string;
}

/** Round event data */
interface RoundEventData {
    roundNumber: number;
    winner: string;
    damageDealt: number;
    comboCount: number;
    blocksPerformed: number;
    isPerfectRound: boolean;
    currentPlayerAddress: string;
}

/** Achievement progress update */
interface ProgressUpdate {
    playerId: string;
    trackingKey: string;
    value: number;
    increment?: boolean;
}

/**
 * AchievementTracker
 * Tracks game events and updates achievement progress
 */
export class AchievementTracker {
    private scene: Phaser.Scene;
    private playerId: string | null = null;
    private matchStats = {
        damageDealt: 0,
        combosExecuted: 0,
        blocksPerformed: 0,
        perfectRoundsInMatch: 0,
    };

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupEventListeners();
    }

    /** Set the current player ID */
    setPlayerId(playerId: string): void {
        this.playerId = playerId;
    }

    /** Setup event listeners for game events */
    private setupEventListeners(): void {
        EventBus.on("round-complete", (data: unknown) => this.handleRoundComplete(data as RoundEventData));
        EventBus.on("match-end", (data: unknown) => this.handleMatchEnd(data as MatchEventData));
        EventBus.on("combo-executed", (data: unknown) => this.handleComboExecuted(data as { playerAddress: string; comboLength: number }));
        EventBus.on("block-performed", (data: unknown) => this.handleBlockPerformed(data as { playerAddress: string }));
        EventBus.on("damage-dealt", (data: unknown) => this.handleDamageDealt(data as { playerAddress: string; amount: number }));
    }

    /** Handle round complete event */
    private handleRoundComplete(data: RoundEventData): void {
        if (!this.playerId || data.currentPlayerAddress !== this.playerId) return;

        this.matchStats.damageDealt += data.damageDealt;
        this.matchStats.combosExecuted += data.comboCount;
        this.matchStats.blocksPerformed += data.blocksPerformed;

        if (data.isPerfectRound && data.winner === this.playerId) {
            this.matchStats.perfectRoundsInMatch++;
        }
    }

    /** Handle match end event */
    private async handleMatchEnd(data: MatchEventData): Promise<void> {
        if (!this.playerId) return;

        const isWinner = data.winner === this.playerId;
        const isPerfectMatch = isWinner && this.matchStats.perfectRoundsInMatch >= 3;

        // Send progress update to server
        await this.sendProgressUpdate({
            won: isWinner,
            damageDealt: this.matchStats.damageDealt,
            combosExecuted: this.matchStats.combosExecuted,
            blocksPerformed: this.matchStats.blocksPerformed,
            perfectRoundsInMatch: this.matchStats.perfectRoundsInMatch,
            isPerfectMatch,
            opponentAddress: data.winner === this.playerId
                ? data.loser
                : data.winner,
        });

        // Reset match stats
        this.resetMatchStats();

        // Emit event for UI notification
        EventBus.emit("achievement-check-complete", { playerId: this.playerId });
    }

    /** Handle combo executed event */
    private handleComboExecuted(data: { playerAddress: string; comboLength: number }): void {
        if (data.playerAddress === this.playerId) {
            this.matchStats.combosExecuted++;
        }
    }

    /** Handle block performed event */
    private handleBlockPerformed(data: { playerAddress: string }): void {
        if (data.playerAddress === this.playerId) {
            this.matchStats.blocksPerformed++;
        }
    }

    /** Handle damage dealt event */
    private handleDamageDealt(data: { playerAddress: string; amount: number }): void {
        if (data.playerAddress === this.playerId) {
            this.matchStats.damageDealt += data.amount;
        }
    }

    /** Send progress update to server */
    private async sendProgressUpdate(matchData: {
        won: boolean;
        damageDealt: number;
        combosExecuted: number;
        blocksPerformed: number;
        perfectRoundsInMatch: number;
        isPerfectMatch: boolean;
        opponentAddress: string;
    }): Promise<void> {
        if (!this.playerId) return;

        try {
            const response = await fetch("/api/achievements/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    playerId: this.playerId,
                    matchData,
                }),
            });

            if (response.ok) {
                const result = await response.json();

                // Emit unlock events for any newly unlocked achievements
                if (result.newUnlocks && result.newUnlocks.length > 0) {
                    result.newUnlocks.forEach((unlock: any) => {
                        EventBus.emit("achievement-unlocked", {
                            playerId: this.playerId,
                            achievement: unlock.achievement,
                            xpAwarded: unlock.xpAwarded,
                            currencyAwarded: unlock.currencyAwarded,
                            badgeAwarded: unlock.badgeAwarded,
                        });
                    });
                }
            }
        } catch (error) {
            console.error("[AchievementTracker] Failed to update progress:", error);
        }
    }

    /** Reset match statistics */
    private resetMatchStats(): void {
        this.matchStats = {
            damageDealt: 0,
            combosExecuted: 0,
            blocksPerformed: 0,
            perfectRoundsInMatch: 0,
        };
    }

    /** Cleanup manager */
    destroy(): void {
        // Note: Event listeners use inline lambdas, so they persist until EventBus is cleared
        // For proper cleanup, store references or use EventBus.removeAllListeners() if available
    }
}

export default AchievementTracker;
