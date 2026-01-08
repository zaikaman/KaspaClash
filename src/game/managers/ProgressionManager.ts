/**
 * Progression Manager
 * Handles XP awards during matches and tier unlock notifications
 */

import Phaser from "phaser";
import { EventBus } from "@/game/EventBus";
import { calculateMatchXP } from "@/lib/progression/xp-calculator";
import { getTierRewards } from "@/lib/progression/tier-rewards";
import { calculateMatchCurrency } from "@/lib/progression/currency-utils";
import type { XPCalculation, TierReward } from "@/types/progression";

/**
 * Match XP calculation parameters
 */
interface MatchXPParams {
    playerId: string;
    won: boolean;
    roundsWon: number;
    roundsLost: number;
    perfectRounds?: number;
    averageComboLength?: number;
}

/**
 * XP Award result from API
 */
interface XPAwardResult {
    success: boolean;
    xpAwarded: number;
    prestigeMultiplier: number;
    finalXP: number;
    newTotalXP: number;
    previousTier: number;
    newTier: number;
    tiersUnlocked: number;
    rewards: TierReward[];
    currencyAwarded: number;
    cosmeticsAwarded: string[];
    currentProgress: {
        currentXP: number;
        xpRequired: number;
        progressPercentage: number;
    };
}

/**
 * Floating XP text configuration
 */
interface FloatingTextConfig {
    x: number;
    y: number;
    text: string;
    color?: string;
    fontSize?: number;
    duration?: number;
}

/**
 * ProgressionManager
 * Manages XP awarding and tier progression in Phaser scenes
 */
export class ProgressionManager {
    private scene: Phaser.Scene;
    private floatingTexts: Phaser.GameObjects.Text[] = [];
    private pendingUnlocks: { tier: number; rewards: TierReward[] }[] = [];
    private boundMatchEndHandler: (data: unknown) => void;
    private boundRoundCompleteHandler: (data: unknown) => void;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        // Bind handlers with proper types
        this.boundMatchEndHandler = (data: unknown) => {
            const typedData = data as {
                winner: string;
                loser: string;
                player1Address: string;
                player2Address: string;
                player1RoundsWon: number;
                player2RoundsWon: number;
                currentPlayerAddress: string;
            };
            this.handleMatchEnd(typedData);
        };

        this.boundRoundCompleteHandler = (data: unknown) => {
            const typedData = data as {
                roundNumber: number;
                winner: string;
                currentPlayerAddress: string;
            };
            this.handleRoundComplete(typedData);
        };

        this.setupEventListeners();
    }

    /**
     * Setup event listeners for match events
     */
    private setupEventListeners(): void {
        // Listen for match end events
        EventBus.on("match:end", this.boundMatchEndHandler);
        EventBus.on("round:complete", this.boundRoundCompleteHandler);
    }

    /**
     * Handle match end event
     */
    private async handleMatchEnd(data: {
        winner: string;
        loser: string;
        player1Address: string;
        player2Address: string;
        player1RoundsWon: number;
        player2RoundsWon: number;
        currentPlayerAddress: string;
    }): Promise<void> {
        const isWinner = data.winner === data.currentPlayerAddress;
        const roundsWon = isWinner
            ? (data.currentPlayerAddress === data.player1Address
                ? data.player1RoundsWon
                : data.player2RoundsWon)
            : (data.currentPlayerAddress === data.player1Address
                ? data.player1RoundsWon
                : data.player2RoundsWon);
        const roundsLost = isWinner
            ? (data.currentPlayerAddress === data.player1Address
                ? data.player2RoundsWon
                : data.player1RoundsWon)
            : (data.currentPlayerAddress === data.player1Address
                ? data.player2RoundsWon
                : data.player1RoundsWon);

        try {
            await this.awardMatchXP({
                playerId: data.currentPlayerAddress,
                won: isWinner,
                roundsWon,
                roundsLost,
                perfectRounds: 0, // TODO: Track perfect rounds
                averageComboLength: 0, // TODO: Track combo length
            });
        } catch (error) {
            console.error("[ProgressionManager] Failed to award match XP:", error);
        }
    }

    /**
     * Handle round complete event (for mid-match XP display)
     */
    private handleRoundComplete(data: {
        roundNumber: number;
        winner: string;
        currentPlayerAddress: string;
    }): void {
        // Show small XP indicator for round win
        if (data.winner === data.currentPlayerAddress) {
            const roundXP = 25; // Base XP per round win
            this.showXPGain(roundXP, {
                x: this.scene.cameras.main.centerX,
                y: this.scene.cameras.main.centerY - 100,
            });
        }
    }

    /**
     * Award XP for match completion
     */
    async awardMatchXP(params: MatchXPParams): Promise<XPAwardResult | null> {
        const { playerId, won, roundsWon, roundsLost, perfectRounds = 0, averageComboLength = 0 } = params;

        // Calculate base XP locally
        const baseXP = calculateMatchXP({
            won,
            roundsWon,
            roundsLost,
            perfectRounds,
            averageComboLength,
        });

        // Calculate currency locally
        const baseCurrency = calculateMatchCurrency(won, roundsWon);

        try {
            // Call API to award XP
            const response = await fetch("/api/progression/award-xp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    playerId,
                    amount: baseXP,
                    source: won ? "match_win" : "match_loss",
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to award XP");
            }

            const result: XPAwardResult = await response.json();

            // Show XP gain animation
            this.showXPGain(result.finalXP, {
                x: this.scene.cameras.main.centerX,
                y: this.scene.cameras.main.height - 150,
            });

            // Handle tier unlocks
            if (result.tiersUnlocked > 0) {
                this.handleTierUnlocks(result);
            }

            // Emit event for UI updates
            EventBus.emit("progression:xp-awarded", {
                xpAwarded: result.finalXP,
                newTier: result.newTier,
                previousTier: result.previousTier,
                tiersUnlocked: result.tiersUnlocked,
                rewards: result.rewards,
                currencyAwarded: result.currencyAwarded,
                currentProgress: result.currentProgress,
            });

            return result;
        } catch (error) {
            console.error("[ProgressionManager] Error awarding XP:", error);

            // Still show local XP estimate
            this.showXPGain(baseXP, {
                x: this.scene.cameras.main.centerX,
                y: this.scene.cameras.main.height - 150,
            });

            return null;
        }
    }

    /**
     * Show floating XP text animation
     */
    showXPGain(
        amount: number,
        position: { x: number; y: number },
        config?: Partial<FloatingTextConfig>
    ): void {
        const {
            color = "#49BD91",
            fontSize = 32,
            duration = 2000,
        } = config || {};

        const text = this.scene.add
            .text(position.x, position.y, `+${amount} XP`, {
                fontFamily: "Orbitron, sans-serif",
                fontSize: `${fontSize}px`,
                color,
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 4,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: "#000000",
                    blur: 4,
                    fill: true,
                },
            })
            .setOrigin(0.5)
            .setDepth(9999)
            .setAlpha(0);

        this.floatingTexts.push(text);

        // Animate in
        this.scene.tweens.add({
            targets: text,
            alpha: 1,
            y: position.y - 30,
            scale: 1.2,
            duration: 300,
            ease: "Back.easeOut",
            onComplete: () => {
                // Float up and fade out
                this.scene.tweens.add({
                    targets: text,
                    y: position.y - 100,
                    alpha: 0,
                    scale: 0.8,
                    duration: duration - 300,
                    ease: "Sine.easeIn",
                    onComplete: () => {
                        text.destroy();
                        const index = this.floatingTexts.indexOf(text);
                        if (index > -1) {
                            this.floatingTexts.splice(index, 1);
                        }
                    },
                });
            },
        });

        // Play XP sound if available
        if (this.scene.sound.get("sfx_xp_gain")) {
            this.scene.sound.play("sfx_xp_gain", { volume: 0.5 });
        }
    }

    /**
     * Show currency gain animation
     */
    showCurrencyGain(
        amount: number,
        position: { x: number; y: number }
    ): void {
        const text = this.scene.add
            .text(position.x, position.y, `+${amount} ◆`, {
                fontFamily: "Orbitron, sans-serif",
                fontSize: "24px",
                color: "#49BD91",
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(9999)
            .setAlpha(0);

        this.scene.tweens.add({
            targets: text,
            alpha: 1,
            y: position.y - 50,
            duration: 300,
            ease: "Back.easeOut",
            onComplete: () => {
                this.scene.tweens.add({
                    targets: text,
                    y: position.y - 100,
                    alpha: 0,
                    duration: 1500,
                    ease: "Sine.easeIn",
                    onComplete: () => text.destroy(),
                });
            },
        });
    }

    /**
     * Handle tier unlocks
     */
    handleTierUnlocks(result: XPAwardResult): void {
        // Collect all unlocked tiers
        for (let tier = result.previousTier + 1; tier <= result.newTier; tier++) {
            const tierRewards = getTierRewards(tier, false);
            this.pendingUnlocks.push({ tier, rewards: tierRewards });
        }

        // Emit event for tier unlock modal
        EventBus.emit("progression:tiers-unlocked", {
            tiers: this.pendingUnlocks,
            currencyAwarded: result.currencyAwarded,
            cosmeticsAwarded: result.cosmeticsAwarded,
        });

        // Play tier unlock sound if available
        if (this.scene.sound.get("sfx_tier_unlock")) {
            this.scene.sound.play("sfx_tier_unlock", { volume: 0.7 });
        }
    }

    /**
     * Clear pending unlocks (after user acknowledges)
     */
    clearPendingUnlocks(): void {
        this.pendingUnlocks = [];
    }

    /**
     * Get pending unlock count
     */
    getPendingUnlockCount(): number {
        return this.pendingUnlocks.length;
    }

    /**
     * Cleanup manager
     */
    destroy(): void {
        // Remove event listeners using stored bound handlers
        EventBus.off("match:end", this.boundMatchEndHandler);
        EventBus.off("round:complete", this.boundRoundCompleteHandler);

        // Cleanup floating texts
        this.floatingTexts.forEach((text) => text.destroy());
        this.floatingTexts = [];

        // Clear pending unlocks
        this.pendingUnlocks = [];
    }
}

export default ProgressionManager;
