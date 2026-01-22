/**
 * BotBattleScene - Plays back pre-computed bot matches
 * 
 * The match is fully simulated server-side using CombatEngine.
 * This scene just animates the pre-computed turn sequence.
 * Spectators joining mid-match start from the correct turn based on elapsed time.
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { GAME_DIMENSIONS, CHARACTER_POSITIONS, UI_POSITIONS } from "../config";
import { getCharacterScale, getCharacterYOffset, getAnimationScale, getSFXKey, getSoundDelay } from "../config/sprite-config";
import { CHARACTER_ROSTER } from "@/data/characters";
import type { MoveType, Character } from "@/types";
import type { BotTurnData } from "@/lib/game/bot-match-service";

/**
 * Bot battle scene configuration - receives pre-computed match data
 */
export interface BotBattleSceneConfig {
    matchId: string;
    bot1CharacterId: string;
    bot2CharacterId: string;
    bot1Name: string;
    bot2Name: string;
    turns: BotTurnData[];
    totalTurns: number;
    startTurnIndex: number;       // Which turn to start from (for late joiners)
    turnDurationMs: number;
    bot1MaxHp: number;
    bot2MaxHp: number;
    bot1MaxEnergy: number;
    bot2MaxEnergy: number;
    matchWinner: "player1" | "player2" | null;
    bot1RoundsWon: number;
    bot2RoundsWon: number;
}

/**
 * BotBattleScene - Animates pre-computed bot battles
 */
export class BotBattleScene extends Phaser.Scene {
    // Config
    private config!: BotBattleSceneConfig;
    private bot1Character!: Character;
    private bot2Character!: Character;

    // UI Elements
    private player1HealthBar!: Phaser.GameObjects.Graphics;
    private player2HealthBar!: Phaser.GameObjects.Graphics;
    private player1EnergyBar!: Phaser.GameObjects.Graphics;
    private player2EnergyBar!: Phaser.GameObjects.Graphics;
    private player1GuardMeter!: Phaser.GameObjects.Graphics;
    private player2GuardMeter!: Phaser.GameObjects.Graphics;
    private roundScoreText!: Phaser.GameObjects.Text;
    private narrativeText!: Phaser.GameObjects.Text;

    // Character sprites
    private player1Sprite!: Phaser.GameObjects.Sprite;
    private player2Sprite!: Phaser.GameObjects.Sprite;

    // Playback state
    private currentTurnIndex: number = 0;
    private isPlaying: boolean = false;
    private bot1RoundsWon: number = 0;
    private bot2RoundsWon: number = 0;
    private currentRound: number = 1;

    // Audio
    private bgmVolume: number = 0.3;
    private sfxVolume: number = 0.5;

    constructor() {
        super({ key: "BotBattleScene" });
    }

    init(data: BotBattleSceneConfig): void {
        this.config = data;
        this.currentTurnIndex = data.startTurnIndex || 0;
        this.isPlaying = false;
        this.bot1RoundsWon = 0;
        this.bot2RoundsWon = 0;
        this.currentRound = 1;

        // Find characters
        this.bot1Character = CHARACTER_ROSTER.find(c => c.id === data.bot1CharacterId) || CHARACTER_ROSTER[0];
        this.bot2Character = CHARACTER_ROSTER.find(c => c.id === data.bot2CharacterId) || CHARACTER_ROSTER[1];
    }

    preload(): void {
        const { preloadFightSceneAssets } = require("../utils/asset-loader");
        preloadFightSceneAssets(this, this.bot1Character.id, this.bot2Character.id);
    }

    create(): void {
        const { createCharacterAnimations } = require("../utils/asset-loader");

        this.loadAudioSettings();

        // Create animations
        createCharacterAnimations(this, [this.bot1Character.id, this.bot2Character.id]);

        // Play BGM
        this.sound.pauseOnBlur = false;
        if (this.cache.audio.exists("bgm_fight")) {
            this.sound.play("bgm_fight", { loop: true, volume: this.bgmVolume });
        }

        // Create scene elements
        this.createBackground();
        this.createUI();
        this.createCharacters();
        this.createBotBadge();

        // If starting mid-match, fast-forward state
        if (this.currentTurnIndex > 0) {
            this.fastForwardToTurn(this.currentTurnIndex);
        }

        // Handle shutdown
        this.events.once("shutdown", this.handleShutdown, this);
        this.events.once("destroy", this.handleShutdown, this);

        // If joining mid-match (not at turn 0), skip betting countdown
        if (this.currentTurnIndex > 0) {
            // Start playback immediately for late joiners
            this.time.delayedCall(500, () => {
                this.startPlayback();
            });
        } else {
            // Show 30-second betting countdown before match starts
            this.showBettingCountdown();
        }

        EventBus.emit("bot_battle_scene_ready", {
            matchId: this.config.matchId,
            bot1: this.bot1Character,
            bot2: this.bot2Character,
        });
    }

    // ==========================================================================
    // FAST-FORWARD FOR LATE JOINERS
    // ==========================================================================

    /**
     * Fast-forward game state to a specific turn without animating
     */
    private fastForwardToTurn(targetTurnIndex: number): void {
        for (let i = 0; i < targetTurnIndex && i < this.config.turns.length; i++) {
            const turn = this.config.turns[i];

            // Track round wins
            if (turn.isRoundEnd && turn.roundWinner) {
                if (turn.roundWinner === "player1") this.bot1RoundsWon++;
                else this.bot2RoundsWon++;

                if (!turn.isMatchEnd) {
                    this.currentRound++;
                }
            }
        }

        // Set state from the turn we're starting at
        if (targetTurnIndex > 0 && targetTurnIndex <= this.config.turns.length) {
            const currentTurn = this.config.turns[targetTurnIndex - 1];
            this.updateUIFromTurn(currentTurn);
            this.roundScoreText.setText(
                `Round ${this.currentRound}  •  ${this.bot1RoundsWon} - ${this.bot2RoundsWon}  (First to 2)`
            );
        }
    }

    // ==========================================================================
    // AUDIO
    // ==========================================================================

    private loadAudioSettings(): void {
        try {
            const savedBgm = localStorage.getItem("kaspaclash_bgm_volume");
            const savedSfx = localStorage.getItem("kaspaclash_sfx_volume");
            if (savedBgm !== null) this.bgmVolume = parseFloat(savedBgm);
            if (savedSfx !== null) this.sfxVolume = parseFloat(savedSfx);
        } catch (e) {
            console.warn("Failed to load audio settings", e);
        }
    }

    private playSFX(key: string): void {
        if (this.game.sound.locked) return;
        try {
            this.sound.play(key, { volume: this.sfxVolume });
            this.time.delayedCall(5000, () => {
                const sound = this.sound.get(key);
                if (sound && sound.isPlaying) sound.stop();
            });
        } catch (e) {
            console.warn(`Failed to play SFX: ${key}`, e);
        }
    }

    private handleShutdown(): void {
        const bgm = this.sound.get("bgm_fight");
        if (bgm && bgm.isPlaying) bgm.stop();
    }

    // ==========================================================================
    // BACKGROUND
    // ==========================================================================

    private createBackground(): void {
        if (this.textures.exists("arena-bg")) {
            const bg = this.add.image(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y, "arena-bg");
            bg.setDisplaySize(GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        } else {
            const graphics = this.add.graphics();
            graphics.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a1a2e, 0x1a1a2e, 1);
            graphics.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        }

        // Dark overlay
        this.add.rectangle(
            GAME_DIMENSIONS.CENTER_X,
            GAME_DIMENSIONS.CENTER_Y,
            GAME_DIMENSIONS.WIDTH,
            GAME_DIMENSIONS.HEIGHT,
            0x000000,
            0.3
        );
    }

    private createBotBadge(): void {
        const badge = this.add.container(GAME_DIMENSIONS.CENTER_X, 120);
        const bg = this.add.rectangle(0, 0, 240, 40, 0x000000, 0.8).setStrokeStyle(2, 0xff6b35);
        const text = this.add.text(0, 0, "🤖 BOT BATTLE (LIVE)", {
            fontFamily: "Orbitron",
            fontSize: "18px",
            color: "#ff6b35",
        }).setOrigin(0.5);
        badge.add([bg, text]);

        // Pulse
        this.tweens.add({
            targets: badge,
            alpha: 0.7,
            yoyo: true,
            repeat: -1,
            duration: 1000,
            ease: "Sine.easeInOut",
        });
    }

    // ==========================================================================
    // UI
    // ==========================================================================

    private createUI(): void {
        const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
        const barHeight = 25;

        // Health bars
        this.createHealthBar(UI_POSITIONS.HEALTH_BAR.PLAYER1.X, UI_POSITIONS.HEALTH_BAR.PLAYER1.Y, barWidth, barHeight, "player1");
        this.createHealthBar(UI_POSITIONS.HEALTH_BAR.PLAYER2.X, UI_POSITIONS.HEALTH_BAR.PLAYER2.Y, barWidth, barHeight, "player2");

        // Energy bars
        this.createEnergyBar(UI_POSITIONS.HEALTH_BAR.PLAYER1.X, UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + 30, barWidth, 12, "player1");
        this.createEnergyBar(UI_POSITIONS.HEALTH_BAR.PLAYER2.X, UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + 30, barWidth, 12, "player2");

        // Guard meters
        this.createGuardMeter(UI_POSITIONS.HEALTH_BAR.PLAYER1.X, UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + 45, barWidth, 6, "player1");
        this.createGuardMeter(UI_POSITIONS.HEALTH_BAR.PLAYER2.X, UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + 45, barWidth, 6, "player2");

        // Labels
        const labelStyle = { fontFamily: "monospace", fontSize: "10px", color: "#3b82f6" };
        this.add.text(UI_POSITIONS.HEALTH_BAR.PLAYER1.X + barWidth + 5, UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + 30, "EN", labelStyle);
        this.add.text(UI_POSITIONS.HEALTH_BAR.PLAYER2.X - 20, UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + 30, "EN", labelStyle);

        this.add.text(
            UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
            UI_POSITIONS.HEALTH_BAR.PLAYER1.Y - 18,
            `BOT 1: ${this.config.bot1Name.toUpperCase()} (${this.config.bot1MaxHp} HP)`,
            { fontFamily: "monospace", fontSize: "12px", color: "#ff6b35", fontStyle: "bold" }
        );

        this.add.text(
            UI_POSITIONS.HEALTH_BAR.PLAYER2.X + barWidth,
            UI_POSITIONS.HEALTH_BAR.PLAYER2.Y - 18,
            `BOT 2: ${this.config.bot2Name.toUpperCase()} (${this.config.bot2MaxHp} HP)`,
            { fontFamily: "monospace", fontSize: "12px", color: "#ff6b35", fontStyle: "bold", align: "right" }
        ).setOrigin(1, 0);

        this.roundScoreText = this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            60,
            `Round ${this.currentRound}  •  ${this.bot1RoundsWon} - ${this.bot2RoundsWon}  (First to 2)`,
            { fontFamily: "Orbitron", fontSize: "24px", color: "#ffffff" }
        ).setOrigin(0.5);

        this.narrativeText = this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            GAME_DIMENSIONS.HEIGHT - 100,
            "",
            {
                fontFamily: "Exo 2",
                fontSize: "28px",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: 1000 },
                stroke: "#000000",
                strokeThickness: 4,
            }
        ).setOrigin(0.5).setAlpha(0);

        // Draw initial bars
        this.updateHealthBarDisplay("player1", this.config.bot1MaxHp, this.config.bot1MaxHp);
        this.updateHealthBarDisplay("player2", this.config.bot2MaxHp, this.config.bot2MaxHp);
        this.updateEnergyBarDisplay("player1", this.config.bot1MaxEnergy, this.config.bot1MaxEnergy);
        this.updateEnergyBarDisplay("player2", this.config.bot2MaxEnergy, this.config.bot2MaxEnergy);
        this.updateGuardMeterDisplay("player1", 0);
        this.updateGuardMeterDisplay("player2", 0);
    }

    private createHealthBar(x: number, y: number, w: number, h: number, player: "player1" | "player2"): void {
        const g = this.add.graphics();
        g.fillStyle(0x333333, 1);
        g.fillRoundedRect(x, y, w, h, 4);
        g.lineStyle(2, 0x40e0d0, 1);
        g.strokeRoundedRect(x, y, w, h, 4);

        const hG = this.add.graphics();
        if (player === "player1") this.player1HealthBar = hG;
        else this.player2HealthBar = hG;
    }

    private createEnergyBar(x: number, y: number, w: number, h: number, player: "player1" | "player2"): void {
        const bg = this.add.graphics();
        bg.fillStyle(0x222222, 1);
        bg.fillRoundedRect(x, y, w, h, 2);
        bg.lineStyle(1, 0x3b82f6, 0.5);
        bg.strokeRoundedRect(x, y, w, h, 2);

        const eG = this.add.graphics();
        if (player === "player1") this.player1EnergyBar = eG;
        else this.player2EnergyBar = eG;
    }

    private createGuardMeter(x: number, y: number, w: number, h: number, player: "player1" | "player2"): void {
        const bg = this.add.graphics();
        bg.fillStyle(0x111111, 1);
        bg.fillRect(x, y, w, h);

        const gG = this.add.graphics();
        if (player === "player1") this.player1GuardMeter = gG;
        else this.player2GuardMeter = gG;
    }

    // ==========================================================================
    // CHARACTERS
    // ==========================================================================

    private createCharacters(): void {
        const p1Char = this.bot1Character.id;
        const p2Char = this.bot2Character.id;

        const p1Scale = getCharacterScale(p1Char);
        const p2Scale = getCharacterScale(p2Char);
        const p1YOffset = getCharacterYOffset(p1Char, "idle");
        const p2YOffset = getCharacterYOffset(p2Char, "idle");

        this.player1Sprite = this.add.sprite(
            CHARACTER_POSITIONS.PLAYER1.X,
            CHARACTER_POSITIONS.PLAYER1.Y - 50 + p1YOffset,
            `char_${p1Char}_idle`
        );
        this.player1Sprite.setScale(p1Scale).setOrigin(0.5, 0.5);
        if (this.anims.exists(`${p1Char}_idle`)) {
            this.player1Sprite.play(`${p1Char}_idle`);
        }

        this.player2Sprite = this.add.sprite(
            CHARACTER_POSITIONS.PLAYER2.X,
            CHARACTER_POSITIONS.PLAYER2.Y - 50 + p2YOffset,
            `char_${p2Char}_idle`
        );
        this.player2Sprite.setScale(p2Scale).setOrigin(0.5, 0.5).setFlipX(true);
        if (this.anims.exists(`${p2Char}_idle`)) {
            this.player2Sprite.play(`${p2Char}_idle`);
        }
    }

    // ==========================================================================
    // BAR UPDATES
    // ==========================================================================

    private updateHealthBarDisplay(player: "player1" | "player2", hp: number, maxHp: number): void {
        const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
        const barHeight = 25;
        const pct = Math.min(1, Math.max(0, hp) / (maxHp || 1));
        const innerW = (barWidth - 4) * pct;

        const g = player === "player1" ? this.player1HealthBar : this.player2HealthBar;
        const x = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.X : UI_POSITIONS.HEALTH_BAR.PLAYER2.X;
        const y = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.Y : UI_POSITIONS.HEALTH_BAR.PLAYER2.Y;

        g.clear();
        let color = 0x00ff88;
        if (pct <= 0.25) color = 0xff4444;
        else if (pct <= 0.5) color = 0xffaa00;

        g.fillStyle(color, 1);
        if (player === "player2") {
            g.fillRoundedRect(x + 2 + (barWidth - 4 - innerW), y + 2, innerW, barHeight - 4, 3);
        } else {
            g.fillRoundedRect(x + 2, y + 2, innerW, barHeight - 4, 3);
        }
    }

    private updateEnergyBarDisplay(player: "player1" | "player2", energy: number, maxEnergy: number): void {
        const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
        const barHeight = 12;
        const yOffset = 30;
        const pct = Math.min(1, Math.max(0, energy) / (maxEnergy || 1));
        const innerW = (barWidth - 2) * pct;

        const g = player === "player1" ? this.player1EnergyBar : this.player2EnergyBar;
        const x = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.X : UI_POSITIONS.HEALTH_BAR.PLAYER2.X;
        const y = (player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.Y : UI_POSITIONS.HEALTH_BAR.PLAYER2.Y) + yOffset;

        g.clear();
        g.fillStyle(0x3b82f6, 1);
        if (player === "player2") {
            g.fillRoundedRect(x + 1 + (barWidth - 2 - innerW), y + 1, innerW, barHeight - 2, 2);
        } else {
            g.fillRoundedRect(x + 1, y + 1, innerW, barHeight - 2, 2);
        }
    }

    private updateGuardMeterDisplay(player: "player1" | "player2", guardMeter: number): void {
        const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
        const barHeight = 6;
        const yOffset = 45;
        const pct = Math.min(1, Math.max(0, guardMeter) / 100);
        const innerW = barWidth * pct;

        const g = player === "player1" ? this.player1GuardMeter : this.player2GuardMeter;
        const x = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.X : UI_POSITIONS.HEALTH_BAR.PLAYER2.X;
        const y = (player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.Y : UI_POSITIONS.HEALTH_BAR.PLAYER2.Y) + yOffset;

        g.clear();
        let color = 0xf97316;
        if (pct >= 0.75) color = 0xef4444;

        g.fillStyle(color, 1);
        if (player === "player2") {
            g.fillRect(x + (barWidth - innerW), y, innerW, barHeight);
        } else {
            g.fillRect(x, y, innerW, barHeight);
        }
    }

    private updateUIFromTurn(turn: BotTurnData): void {
        this.updateHealthBarDisplay("player1", turn.bot1Hp, this.config.bot1MaxHp);
        this.updateHealthBarDisplay("player2", turn.bot2Hp, this.config.bot2MaxHp);
        this.updateEnergyBarDisplay("player1", turn.bot1Energy, this.config.bot1MaxEnergy);
        this.updateEnergyBarDisplay("player2", turn.bot2Energy, this.config.bot2MaxEnergy);
        this.updateGuardMeterDisplay("player1", turn.bot1GuardMeter);
        this.updateGuardMeterDisplay("player2", turn.bot2GuardMeter);
    }

    // ==========================================================================
    // BETTING COUNTDOWN
    // ==========================================================================

    private showBettingCountdown(): void {
        const BETTING_DURATION = 30; // 30 seconds for betting

        // Create betting countdown container
        const container = this.add.container(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y - 50);

        // Background
        const bg = this.add.rectangle(0, 0, 450, 120, 0x000000, 0.85)
            .setStrokeStyle(3, 0xff6b35);
        container.add(bg);

        // "WAITING FOR BETS" title
        const titleText = this.add.text(0, 0, "🎮 WAITING FOR BETS... 🎮", {
            fontFamily: "Orbitron",
            fontSize: "32px",
            color: "#ffd700",
            fontStyle: "bold",
        }).setOrigin(0.5);
        container.add(titleText);

        // Subtext
        const subText = this.add.text(0, 35, "Match will start shortly", {
            fontFamily: "Exo 2",
            fontSize: "16px",
            color: "#aaaaaa",
        }).setOrigin(0.5);
        container.add(subText);

        // Pulse animation on title
        this.tweens.add({
            targets: titleText,
            scale: 1.05,
            yoyo: true,
            repeat: -1,
            duration: 800,
            ease: "Sine.easeInOut",
        });

        // After countdown duration, start the match
        this.time.delayedCall(BETTING_DURATION * 1000, () => {
            // Remove countdown UI
            container.destroy();

            // Show "FIGHT!" text briefly
            const fightText = this.add.text(
                GAME_DIMENSIONS.CENTER_X,
                GAME_DIMENSIONS.CENTER_Y,
                "FIGHT!",
                {
                    fontFamily: "Orbitron",
                    fontSize: "72px",
                    color: "#ff6b35",
                    fontStyle: "bold",
                    stroke: "#000000",
                    strokeThickness: 6,
                }
            ).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: fightText,
                alpha: 1,
                scale: { from: 0.5, to: 1.2 },
                duration: 300,
                ease: "Back.easeOut",
                onComplete: () => {
                    this.time.delayedCall(800, () => {
                        this.tweens.add({
                            targets: fightText,
                            alpha: 0,
                            duration: 200,
                            onComplete: () => {
                                fightText.destroy();
                                this.startPlayback();
                            }
                        });
                    });
                }
            });
        });
    }

    // ==========================================================================
    // PLAYBACK
    // ==========================================================================

    private startPlayback(): void {
        // Check if match already finished
        if (this.currentTurnIndex >= this.config.turns.length) {
            this.showMatchEnd();
            return;
        }

        this.isPlaying = true;
        this.playNextTurn();
    }

    private playNextTurn(): void {
        if (!this.isPlaying || this.currentTurnIndex >= this.config.turns.length) {
            this.showMatchEnd();
            return;
        }

        const turn = this.config.turns[this.currentTurnIndex];
        this.animateTurn(turn);
        this.currentTurnIndex++;
    }

    private animateTurn(turn: BotTurnData): void {
        const p1Char = this.bot1Character.id;
        const p2Char = this.bot2Character.id;
        const p1OriginalX = CHARACTER_POSITIONS.PLAYER1.X;
        const p2OriginalX = CHARACTER_POSITIONS.PLAYER2.X;
        const meetX = GAME_DIMENSIONS.CENTER_X;

        // Run to center - set proper scale first
        this.player1Sprite.setScale(getCharacterScale(p1Char));
        this.player2Sprite.setScale(getCharacterScale(p2Char));
        if (this.anims.exists(`${p1Char}_run`)) this.player1Sprite.play(`${p1Char}_run`);
        if (this.anims.exists(`${p2Char}_run`)) this.player2Sprite.play(`${p2Char}_run`);

        this.tweens.add({ targets: this.player1Sprite, x: meetX - 50, duration: 400, ease: "Power2" });
        this.tweens.add({
            targets: this.player2Sprite,
            x: meetX + 50,
            duration: 400,
            ease: "Power2",
            onComplete: () => {
                // Helper: P1 Attack animation
                const runP1Attack = (): Promise<void> => {
                    return new Promise((resolve) => {
                        this.playMoveAnim("player1", turn.bot1Move);
                        // Wait for animation to finish (approx 1.2s)
                        this.time.delayedCall(1200, () => resolve());
                    });
                };

                // Helper: P2 Attack animation
                const runP2Attack = (): Promise<void> => {
                    return new Promise((resolve) => {
                        this.playMoveAnim("player2", turn.bot2Move);
                        // Wait for animation to finish (approx 1.2s)
                        this.time.delayedCall(1200, () => resolve());
                    });
                };

                // Execute Sequence based on move types
                // If one player blocks, both animate simultaneously
                // Otherwise, P1 goes first then P2
                const isConcurrent = turn.bot1Move === "block" || turn.bot2Move === "block";

                const executeSequence = async () => {
                    if (isConcurrent) {
                        // Run both simultaneously
                        await Promise.all([runP1Attack(), runP2Attack()]);
                    } else {
                        // Sequential: P1 first, then P2
                        await runP1Attack();
                        await runP2Attack();
                    }

                    // Show narrative after animations
                    this.showNarrative(turn.narrative);
                    this.updateUIFromTurn(turn);

                    // Handle round end with death animation
                    if (turn.isRoundEnd && turn.roundWinner) {
                        // Play death animation on loser
                        const loserChar = turn.roundWinner === "player1" ? p2Char : p1Char;
                        const loserSprite = turn.roundWinner === "player1" ? this.player2Sprite : this.player1Sprite;

                        if (this.anims.exists(`${loserChar}_dead`)) {
                            loserSprite.setScale(getCharacterScale(loserChar));
                            loserSprite.play(`${loserChar}_dead`);
                        }

                        // Update round score after death animation
                        if (turn.roundWinner === "player1") this.bot1RoundsWon++;
                        else this.bot2RoundsWon++;

                        // Wait for death animation (1.5s), then show round result
                        await new Promise<void>((resolve) => {
                            this.time.delayedCall(1500, () => {
                                // Show round result text
                                const winnerName = turn.roundWinner === "player1" ? this.config.bot1Name : this.config.bot2Name;
                                this.showNarrative(`${winnerName.toUpperCase()} WINS THE ROUND!`);

                                // Reset HP/Energy bars for next round
                                if (!turn.isMatchEnd) {
                                    this.updateHealthBarDisplay("player1", this.config.bot1MaxHp, this.config.bot1MaxHp);
                                    this.updateHealthBarDisplay("player2", this.config.bot2MaxHp, this.config.bot2MaxHp);
                                    this.updateEnergyBarDisplay("player1", this.config.bot1MaxEnergy, this.config.bot1MaxEnergy);
                                    this.updateEnergyBarDisplay("player2", this.config.bot2MaxEnergy, this.config.bot2MaxEnergy);
                                    this.updateGuardMeterDisplay("player1", 0);
                                    this.updateGuardMeterDisplay("player2", 0);

                                    this.currentRound++;
                                    this.roundScoreText.setText(
                                        `Round ${this.currentRound}  •  ${this.bot1RoundsWon} - ${this.bot2RoundsWon}  (First to 2)`
                                    );
                                }

                                // Reset loser to idle after showing result
                                this.time.delayedCall(1000, () => {
                                    if (this.anims.exists(`${loserChar}_idle`)) {
                                        loserSprite.setScale(getCharacterScale(loserChar));
                                        loserSprite.play(`${loserChar}_idle`);
                                    }
                                    resolve();
                                });
                            });
                        });
                    }

                    // Return to positions after brief pause
                    this.time.delayedCall(300, () => {
                        if (this.anims.exists(`${p1Char}_idle`)) {
                            this.player1Sprite.setScale(getCharacterScale(p1Char));
                            this.player1Sprite.play(`${p1Char}_idle`);
                        }
                        if (this.anims.exists(`${p2Char}_idle`)) {
                            this.player2Sprite.setScale(getCharacterScale(p2Char));
                            this.player2Sprite.play(`${p2Char}_idle`);
                        }

                        // Run back
                        if (this.anims.exists(`${p1Char}_run`)) {
                            this.player1Sprite.setScale(getCharacterScale(p1Char));
                            this.player1Sprite.play(`${p1Char}_run`);
                        }
                        if (this.anims.exists(`${p2Char}_run`)) {
                            this.player2Sprite.setScale(getCharacterScale(p2Char));
                            this.player2Sprite.play(`${p2Char}_run`);
                        }

                        this.tweens.add({ targets: this.player1Sprite, x: p1OriginalX, duration: 300, ease: "Power1" });
                        this.tweens.add({
                            targets: this.player2Sprite,
                            x: p2OriginalX,
                            duration: 300,
                            ease: "Power1",
                            onComplete: () => {
                                // Back to idle
                                if (this.anims.exists(`${p1Char}_idle`)) {
                                    this.player1Sprite.setScale(getCharacterScale(p1Char));
                                    this.player1Sprite.play(`${p1Char}_idle`);
                                }
                                if (this.anims.exists(`${p2Char}_idle`)) {
                                    this.player2Sprite.setScale(getCharacterScale(p2Char));
                                    this.player2Sprite.play(`${p2Char}_idle`);
                                }

                                // Schedule next turn
                                const delay = Math.max(100, this.config.turnDurationMs - 3500);
                                this.time.delayedCall(delay, () => this.playNextTurn());
                            }
                        });
                    });
                };

                executeSequence();
            }
        });
    }

    private playMoveAnim(player: "player1" | "player2", move: MoveType): void {
        const sprite = player === "player1" ? this.player1Sprite : this.player2Sprite;
        const charId = player === "player1" ? this.bot1Character.id : this.bot2Character.id;

        if (move === "stunned") return;

        const animKey = `${charId}_${move}`;
        if (this.anims.exists(animKey)) {
            sprite.setScale(getAnimationScale(charId, move));
            sprite.play(animKey);

            const sfxKey = getSFXKey(charId, move);
            const delay = getSoundDelay(charId, move);
            this.time.delayedCall(delay, () => this.playSFX(sfxKey));
        }
    }

    private showNarrative(text: string): void {
        this.narrativeText.setText(text);
        this.narrativeText.setAlpha(1);
        this.tweens.add({
            targets: this.narrativeText,
            alpha: 0,
            duration: 500,
            delay: 2000,
        });
    }

    private showMatchEnd(): void {
        this.isPlaying = false;

        const winner = this.config.matchWinner;
        const winnerName = winner === "player1" ? this.config.bot1Name : this.config.bot2Name;

        this.narrativeText.setText(`🏆 ${winnerName} WINS! 🏆`);
        this.narrativeText.setFontSize(48);
        this.narrativeText.setAlpha(1);

        // Winner animation
        const winnerSprite = winner === "player1" ? this.player1Sprite : this.player2Sprite;
        this.tweens.add({
            targets: winnerSprite,
            y: winnerSprite.y - 30,
            duration: 500,
            yoyo: true,
            repeat: 2,
            ease: "Sine.easeOut",
        });

        EventBus.emit("bot_battle_match_end", {
            matchId: this.config.matchId,
            winner,
        });

        // Notify React layer to start new match
        this.time.delayedCall(5000, () => {
            EventBus.emit("bot_battle_request_new_match");
        });
    }
}

export default BotBattleScene;
