/**
 * BotBattleScene - Plays back pre-computed bot matches
 * 
 * The match is fully simulated server-side using CombatEngine.
 * This scene just animates the pre-computed turn sequence.
 * Spectators joining mid-match start from the correct turn based on elapsed time.
 * 
 * TAB SWITCHING / VISIBILITY SYNC:
 * When users minimize or switch tabs, Phaser pauses but the server-side match continues.
 * Upon returning, the scene detects visibility change, calculates missed turns,
 * fast-forwards game state without animation, and resumes playback from current turn.
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
    matchCreatedAt: number;       // Server timestamp when match was created
    serverTime?: number;          // Server's current timestamp
    elapsedMs?: number;           // Server-calculated elapsed time since match creation
    bettingStatus?: {             // Server-calculated betting status
        isOpen: boolean;
        secondsRemaining: number;
        reason?: string;
    };
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

    // Visibility sync
    private visibilityChangeHandler: (() => void) | null = null;
    private matchStartTime: number = 0; // When the match actually started (server time)
    private readonly BETTING_WINDOW_MS = 30000; // 30 seconds betting period before match starts

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

        // Calculate when this match's gameplay started (after betting window)
        // Server created the match at matchCreatedAt, gameplay starts 30s later
        this.matchStartTime = data.matchCreatedAt + this.BETTING_WINDOW_MS;

        // Find characters
        this.bot1Character = CHARACTER_ROSTER.find(c => c.id === data.bot1CharacterId) || CHARACTER_ROSTER[0];
        this.bot2Character = CHARACTER_ROSTER.find(c => c.id === data.bot2CharacterId) || CHARACTER_ROSTER[1];

        // Log server sync info
        if (data.serverTime && data.elapsedMs !== undefined) {
            console.log('[BotBattleScene] Server sync:', {
                serverTime: new Date(data.serverTime).toISOString(),
                clientTime: new Date().toISOString(),
                elapsedMs: data.elapsedMs,
                bettingSecondsRemaining: data.bettingStatus?.secondsRemaining,
            });
        }
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

        // Setup visibility handler for tab switching
        this.setupVisibilityHandler();

        // If joining mid-match (not at turn 0), skip betting countdown
        if (this.currentTurnIndex > 0) {
            // Start playback immediately for late joiners
            this.time.delayedCall(500, () => {
                this.startPlayback();
            });
        } else if (this.config.bettingStatus && !this.config.bettingStatus.isOpen) {
            // Betting window already closed, start immediately
            this.time.delayedCall(500, () => {
                this.startPlayback();
            });
        } else {
            // Show server-synchronized betting countdown
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
    // VISIBILITY SYNC (TAB SWITCHING)
    // ==========================================================================

    /**
     * Setup visibility change handler to sync when user returns to tab.
     * When users minimize or switch tabs, Phaser pauses but the server-side
     * match continues. This ensures we fast-forward to the current turn.
     */
    private setupVisibilityHandler(): void {
        if (typeof document === "undefined") return;

        this.visibilityChangeHandler = () => {
            if (document.visibilityState === "visible") {
                console.log("[BotBattleScene] Tab became visible, checking for resync");
                this.handleVisibilityResync();
            }
        };

        document.addEventListener("visibilitychange", this.visibilityChangeHandler);
        this.events.once("shutdown", this.cleanupVisibilityHandler, this);
        this.events.once("destroy", this.cleanupVisibilityHandler, this);
    }

    /**
     * Clean up visibility change handler.
     */
    private cleanupVisibilityHandler(): void {
        if (this.visibilityChangeHandler && typeof document !== "undefined") {
            document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
            this.visibilityChangeHandler = null;
        }
    }

    /**
     * Handle resync when tab becomes visible.
     * Calculate the current server turn and fast-forward if needed.
     */
    private handleVisibilityResync(): void {
        // Calculate what turn we SHOULD be at based on elapsed time
        // This matches the server's getCurrentTurnIndex logic exactly
        const now = Date.now();

        // Check if we're still in betting window
        if (now < this.matchStartTime) {
            console.log("[BotBattleScene] Still in betting window, no resync needed");
            return;
        }

        // Calculate elapsed time since gameplay started (after betting window)
        const gameElapsed = now - this.matchStartTime;
        const expectedTurnIndex = Math.floor(gameElapsed / this.config.turnDurationMs);

        // Clamp to valid range
        const clampedExpectedTurn = Math.min(expectedTurnIndex, this.config.totalTurns - 1);

        // How many turns did we miss while tab was hidden?
        const turnsBehind = Math.max(0, clampedExpectedTurn - this.currentTurnIndex);

        if (turnsBehind > 0) {
            console.log(`[BotBattleScene] Behind by ${turnsBehind} turns, fast-forwarding from ${this.currentTurnIndex} to ${clampedExpectedTurn}`);

            // Stop current playback
            const wasPlaying = this.isPlaying;
            this.isPlaying = false;

            // Cancel all scheduled turn animations
            this.time.removeAllEvents();

            // Fast-forward through missed turns
            this.fastForwardVisibilityGap(clampedExpectedTurn);

            // Resume playback if we were playing
            if (wasPlaying && this.currentTurnIndex < this.config.turns.length) {
                this.isPlaying = true;
                // Small delay before resuming to show updated state
                this.time.delayedCall(500, () => this.playNextTurn());
            } else if (this.currentTurnIndex >= this.config.turns.length) {
                // Match ended while we were away
                this.showMatchEnd();
            }
        } else {
            console.log(`[BotBattleScene] No resync needed (current: ${this.currentTurnIndex}, expected: ${clampedExpectedTurn})`);
        }
    }

    /**
     * Fast-forward through turns that happened while tab was hidden.
     * Updates game state and UI without animations.
     */
    private fastForwardVisibilityGap(targetTurnIndex: number): void {
        const startTurn = this.currentTurnIndex;
        const endTurn = Math.min(targetTurnIndex, this.config.turns.length);

        console.log(`[BotBattleScene] Fast-forwarding from turn ${startTurn} to ${endTurn}`);

        // Process each missed turn
        for (let i = startTurn; i < endTurn; i++) {
            const turn = this.config.turns[i];

            // Track round wins
            if (turn.isRoundEnd && turn.roundWinner) {
                if (turn.roundWinner === "player1") this.bot1RoundsWon++;
                else this.bot2RoundsWon++;

                if (!turn.isMatchEnd) {
                    this.currentRound++;
                }
            }

            this.currentTurnIndex++;
        }

        // Update UI to reflect current state
        if (this.currentTurnIndex > 0 && this.currentTurnIndex <= this.config.turns.length) {
            const currentTurn = this.config.turns[this.currentTurnIndex - 1];
            this.updateUIFromTurn(currentTurn);
            this.roundScoreText.setText(
                `Round ${this.currentRound}  •  ${this.bot1RoundsWon} - ${this.bot2RoundsWon}  (First to 2)`
            );

            // Show notification that we caught up
            this.narrativeText.setText(`⚡ CATCHING UP TO TURN ${this.currentTurnIndex} ⚡`);
            this.narrativeText.setAlpha(1);
            this.tweens.add({
                targets: this.narrativeText,
                alpha: 0,
                delay: 1000,
                duration: 500,
            });
        }

        // Ensure characters are in idle state
        const p1Char = this.bot1Character.id;
        const p2Char = this.bot2Character.id;

        if (this.anims.exists(`${p1Char}_idle`)) {
            const p1IdleScale = getAnimationScale(p1Char, "idle");
            this.player1Sprite.setScale(p1IdleScale);
            this.player1Sprite.play(`${p1Char}_idle`);
        }
        if (this.anims.exists(`${p2Char}_idle`)) {
            const p2IdleScale = getAnimationScale(p2Char, "idle");
            this.player2Sprite.setScale(p2IdleScale);
            this.player2Sprite.play(`${p2Char}_idle`);
        }

        // Reset sprite positions to original
        this.player1Sprite.x = CHARACTER_POSITIONS.PLAYER1.X;
        this.player2Sprite.x = CHARACTER_POSITIONS.PLAYER2.X;
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
        this.cleanupVisibilityHandler();
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
        const text = this.add.text(0, 0, "BOT BATTLE (LIVE)", {
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
        // Use server-provided betting status for accurate synchronization
        const serverSecondsRemaining = this.config.bettingStatus?.secondsRemaining ?? 30;

        console.log('[BotBattleScene] Betting countdown starting with', serverSecondsRemaining, 'seconds (server-synced)');

        // Create betting countdown container
        const container = this.add.container(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y - 50);

        // Background
        const bg = this.add.rectangle(0, 0, 450, 200, 0x000000, 0.85)
            .setStrokeStyle(3, 0xff6b35);
        container.add(bg);

        // "WAITING FOR BETS" title
        const titleText = this.add.text(0, -40, "WAITING FOR BETS...", {
            fontFamily: "Orbitron",
            fontSize: "32px",
            color: "#ffd700",
            fontStyle: "bold",
        }).setOrigin(0.5);
        container.add(titleText);

        // Countdown timer text (server-synchronized)
        const timerText = this.add.text(0, 20, serverSecondsRemaining.toString(), {
            fontFamily: "Orbitron",
            fontSize: "64px",
            color: "#ff6b35",
            fontStyle: "bold",
        }).setOrigin(0.5);
        container.add(timerText);

        // Subtext
        const subText = this.add.text(0, 70, "Match starts when timer reaches 0", {
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

        // Update countdown every second
        let remainingSeconds = serverSecondsRemaining;
        const countdownInterval = this.time.addEvent({
            delay: 1000,
            callback: () => {
                remainingSeconds--;
                if (remainingSeconds > 0) {
                    timerText.setText(remainingSeconds.toString());

                    // Change color as time runs out
                    if (remainingSeconds <= 5) {
                        timerText.setColor("#ff0000");
                    } else if (remainingSeconds <= 10) {
                        timerText.setColor("#ffaa00");
                    }
                } else {
                    countdownInterval.destroy();
                    timerText.setText("0");
                }
            },
            repeat: remainingSeconds - 1,
        });

        // After server-provided duration, start the match
        this.time.delayedCall(serverSecondsRemaining * 1000, () => {
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
        const meetingPointX = GAME_DIMENSIONS.CENTER_X;

        // Calculate HP differences for damage display
        const prevP1Health = this.currentTurnIndex > 0 ?
            this.config.turns[this.currentTurnIndex - 1].bot1Hp : this.config.bot1MaxHp;
        const prevP2Health = this.currentTurnIndex > 0 ?
            this.config.turns[this.currentTurnIndex - 1].bot2Hp : this.config.bot2MaxHp;
        const p1Damage = Math.max(0, prevP1Health - turn.bot1Hp);
        const p2Damage = Math.max(0, prevP2Health - turn.bot2Hp);

        // Check if either player is stunned (from move being "stunned")
        const p1IsStunned = turn.bot1Move === "stunned";
        const p2IsStunned = turn.bot2Move === "stunned";

        // Determine target positions based on stun state (match FightScene exactly)
        let p1TargetX = meetingPointX - 50;
        let p2TargetX = meetingPointX + 50;

        if (p1IsStunned) {
            p1TargetX = p1OriginalX; // P1 stays in place
            p2TargetX = p1OriginalX + 150; // P2 runs to P1
        } else if (p2IsStunned) {
            p2TargetX = p2OriginalX; // P2 stays in place
            p1TargetX = p2OriginalX - 150; // P1 runs to P2
        }

        // Phase 1: Both characters run toward target with run scale (only if not stunned)
        if (!p1IsStunned && this.anims.exists(`${p1Char}_run`)) {
            const p1RunScale = getAnimationScale(p1Char, "run");
            this.player1Sprite.setScale(p1RunScale);
            this.player1Sprite.play(`${p1Char}_run`);
        } else if (p1IsStunned) {
            // Stunned player stays in idle and shows stun effect
            if (this.anims.exists(`${p1Char}_idle`)) {
                const p1IdleScale = getAnimationScale(p1Char, "idle");
                this.player1Sprite.setScale(p1IdleScale);
                this.player1Sprite.play(`${p1Char}_idle`);
            }
            // Visual stun indicator - pulsing red tint
            this.tweens.add({
                targets: this.player1Sprite,
                tint: 0xff6666,
                yoyo: true,
                repeat: 3,
                duration: 200,
                onComplete: () => this.player1Sprite.clearTint()
            });
        }
        if (!p2IsStunned && this.anims.exists(`${p2Char}_run`)) {
            const p2RunScale = getAnimationScale(p2Char, "run");
            this.player2Sprite.setScale(p2RunScale);
            this.player2Sprite.play(`${p2Char}_run`);
        } else if (p2IsStunned) {
            // Stunned player stays in idle and shows stun effect
            if (this.anims.exists(`${p2Char}_idle`)) {
                const p2IdleScale = getAnimationScale(p2Char, "idle");
                this.player2Sprite.setScale(p2IdleScale);
                this.player2Sprite.play(`${p2Char}_idle`);
            }
            // Visual stun indicator - pulsing red tint
            this.tweens.add({
                targets: this.player2Sprite,
                tint: 0xff6666,
                yoyo: true,
                repeat: 3,
                duration: 200,
                onComplete: () => this.player2Sprite.clearTint()
            });
        }

        // Tween both characters toward targets (match FightScene timing: 600ms)
        this.tweens.add({
            targets: this.player1Sprite,
            x: p1TargetX,
            duration: p1IsStunned ? 0 : 600,
            ease: "Power2"
        });

        this.tweens.add({
            targets: this.player2Sprite,
            x: p2TargetX,
            duration: p2IsStunned ? 0 : 600,
            ease: "Power2",
            onComplete: () => {
                // Get moves for readability
                const p1Move = turn.bot1Move;
                const p2Move = turn.bot2Move;

                // Helper: P1 Attack animation with damage display
                const runP1Attack = (): Promise<void> => {
                    return new Promise((resolve) => {
                        if (p1IsStunned) {
                            resolve(); // Skip if stunned
                            return;
                        }

                        // Play P1 animation with proper scale
                        const animKey = `${p1Char}_${p1Move}`;
                        if (this.anims.exists(animKey) || p1Move === "block") {
                            const scale = getAnimationScale(p1Char, p1Move);
                            this.player1Sprite.setScale(scale);

                            // Play Animation immediately
                            if (this.anims.exists(animKey)) {
                                this.player1Sprite.play(animKey);
                            }

                            // Play SFX with proper timing
                            const sfxKey = getSFXKey(p1Char, p1Move);
                            const delay = getSoundDelay(p1Char, p1Move);
                            if (delay > 0) {
                                this.time.delayedCall(delay, () => this.playSFX(sfxKey));
                            } else {
                                this.playSFX(sfxKey);
                            }
                        }

                        // Show P2 damage with hit flash (match FightScene timing: 300ms)
                        if (p2Damage > 0) {
                            this.time.delayedCall(300, () => {
                                this.showFloatingText(
                                    `-${p2Damage}`,
                                    p2TargetX,
                                    CHARACTER_POSITIONS.PLAYER2.Y - 130,
                                    "#ff4444"
                                );

                                // Flash P2 on hit
                                this.tweens.add({
                                    targets: this.player2Sprite,
                                    alpha: 0.5,
                                    yoyo: true,
                                    duration: 50,
                                    repeat: 3
                                });
                            });
                        }

                        // Wait for animation to finish (1200ms like FightScene)
                        this.time.delayedCall(1200, () => resolve());
                    });
                };

                // Helper: P2 Attack animation with damage display
                const runP2Attack = (): Promise<void> => {
                    return new Promise((resolve) => {
                        if (p2IsStunned) {
                            resolve(); // Skip if stunned
                            return;
                        }

                        // Play P2 animation with proper scale
                        const animKey = `${p2Char}_${p2Move}`;
                        if (this.anims.exists(animKey) || p2Move === "block") {
                            const scale = getAnimationScale(p2Char, p2Move);
                            this.player2Sprite.setScale(scale);

                            // Play Animation immediately
                            if (this.anims.exists(animKey)) {
                                this.player2Sprite.play(animKey);
                            }

                            // Play SFX with proper timing
                            const sfxKey = getSFXKey(p2Char, p2Move);
                            const delay = getSoundDelay(p2Char, p2Move);
                            if (delay > 0) {
                                this.time.delayedCall(delay, () => this.playSFX(sfxKey));
                            } else {
                                this.playSFX(sfxKey);
                            }
                        }

                        // Show P1 damage with hit flash (match FightScene timing: 300ms)
                        if (p1Damage > 0) {
                            this.time.delayedCall(300, () => {
                                this.showFloatingText(
                                    `-${p1Damage}`,
                                    p1TargetX,
                                    CHARACTER_POSITIONS.PLAYER1.Y - 130,
                                    "#ff4444"
                                );

                                // Flash P1 on hit
                                this.tweens.add({
                                    targets: this.player1Sprite,
                                    alpha: 0.5,
                                    yoyo: true,
                                    duration: 50,
                                    repeat: 3
                                });
                            });
                        }

                        // Wait for animation to finish
                        this.time.delayedCall(1200, () => resolve());
                    });
                };

                // Execute Sequence - Match FightScene logic exactly
                // Concurrent if either player is blocking
                const isConcurrent = p1Move === "block" || p2Move === "block";

                const executeSequence = async () => {
                    if (isConcurrent) {
                        // Run both simultaneously (when either is blocking)
                        await Promise.all([runP1Attack(), runP2Attack()]);
                    } else {
                        // Sequential: P1 first, then P2 (normal attacks)
                        await runP1Attack();
                        await runP2Attack();
                    }

                    // Use narrative from turn data (server-provided)
                    const narrative = turn.narrative || "Both attacks clash!";
                    this.narrativeText.setText(narrative);
                    this.narrativeText.setAlpha(1);

                    // Update UI/Health Bars
                    this.updateUIFromTurn(turn);
                    this.roundScoreText.setText(
                        `Round ${this.currentRound}  •  ${this.bot1RoundsWon} - ${this.bot2RoundsWon}  (First to 2)`
                    );

                    // --- NEW SEQUENCE: Return to Start Positions FIRST ---

                    // Helper to return characters to start
                    const returnToStartPositions = (): Promise<void> => {
                        return new Promise((resolve) => {
                            // Run back animation
                            if (!p1IsStunned && this.anims.exists(`${p1Char}_run`)) {
                                const p1RunScale = getAnimationScale(p1Char, "run");
                                this.player1Sprite.setScale(p1RunScale);
                                this.player1Sprite.play(`${p1Char}_run`);
                            }
                            if (!p2IsStunned && this.anims.exists(`${p2Char}_run`)) {
                                const p2RunScale = getAnimationScale(p2Char, "run");
                                this.player2Sprite.setScale(p2RunScale);
                                this.player2Sprite.play(`${p2Char}_run`);
                                this.player2Sprite.setFlipX(true);
                            }

                            // Tween back (600ms)
                            this.tweens.add({
                                targets: this.player1Sprite,
                                x: p1OriginalX,
                                duration: p1IsStunned ? 0 : 600,
                                ease: "Power2"
                            });

                            this.tweens.add({
                                targets: this.player2Sprite,
                                x: p2OriginalX,
                                duration: p2IsStunned ? 0 : 600,
                                ease: "Power2",
                                onComplete: () => resolve()
                            });
                        });
                    };

                    await returnToStartPositions();

                    // --- THEN: Handle Death / Idle ---

                    // Fade out narrative (300ms)
                    this.tweens.add({
                        targets: this.narrativeText,
                        alpha: 0,
                        duration: 300,
                    });

                    if (turn.isRoundEnd) {
                        if (turn.roundWinner) {
                            // Normal round end - someone won
                            const loserChar = turn.roundWinner === "player1" ? p2Char : p1Char;
                            const loserSprite = turn.roundWinner === "player1" ? this.player2Sprite : this.player1Sprite;

                            // Play death animation AT START POSITION
                            if (this.anims.exists(`${loserChar}_dead`)) {
                                loserSprite.setScale(getAnimationScale(loserChar, "dead"));
                                loserSprite.play(`${loserChar}_dead`);
                            }

                            // Update scores
                            if (turn.roundWinner === "player1") this.bot1RoundsWon++;
                            else this.bot2RoundsWon++;

                            // Wait for death animation (1.5s)
                            await new Promise<void>((resolve) => this.time.delayedCall(1500, resolve));

                            // Show round result text
                            const winnerName = turn.roundWinner === "player1" ? this.config.bot1Name : this.config.bot2Name;
                            this.narrativeText.setText(`${winnerName.toUpperCase()} WINS THE ROUND!`);
                            this.narrativeText.setAlpha(1);

                            // Reset logic
                            if (!turn.isMatchEnd) {
                                // NOT Match End: Reset for next round
                                this.time.delayedCall(1000, () => {
                                    // Reset HP bars
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

                                    // Reset loser to IDLE for next round
                                    if (this.anims.exists(`${loserChar}_idle`)) {
                                        loserSprite.setScale(getAnimationScale(loserChar, "idle"));
                                        loserSprite.play(`${loserChar}_idle`);
                                    }
                                });
                            } else {
                                // MATCH END: Do NOT reset loser to idle
                                // Loser stays dead on the floor
                                // Winner will do victory jump in showMatchEnd()
                            }

                        } else {
                            // DRAW Logic (Double KO) - Both stay dead if match end
                            // ... (omitted for brevity, can leave as is or adapt similarly if needed)
                            // For simplicity, applying similar return-then-die logic for Draw implies a bigger refactor.
                            // Given the request focused on "the dead animation", I'll assume standard win/loss flow is priority.
                            // But to be safe, let's just make them die here too.

                            if (this.anims.exists(`${p1Char}_dead`)) {
                                this.player1Sprite.setScale(getAnimationScale(p1Char, "dead"));
                                this.player1Sprite.play(`${p1Char}_dead`);
                            }
                            if (this.anims.exists(`${p2Char}_dead`)) {
                                this.player2Sprite.setScale(getAnimationScale(p2Char, "dead"));
                                this.player2Sprite.play(`${p2Char}_dead`);
                            }

                            await new Promise<void>((resolve) => this.time.delayedCall(1500, resolve));

                            this.narrativeText.setText("⚡ DOUBLE KO - DRAW! ⚡");
                            this.narrativeText.setAlpha(1);

                            if (!turn.isMatchEnd) {
                                this.currentRound++;
                                // Reset both to idle
                                this.time.delayedCall(1000, () => {
                                    if (this.anims.exists(`${p1Char}_idle`)) {
                                        this.player1Sprite.setScale(getAnimationScale(p1Char, "idle"));
                                        this.player1Sprite.play(`${p1Char}_idle`);
                                    }
                                    if (this.anims.exists(`${p2Char}_idle`)) {
                                        this.player2Sprite.setScale(getAnimationScale(p2Char, "idle"));
                                        this.player2Sprite.play(`${p2Char}_idle`);
                                    }
                                });
                            }
                        }
                    } else {
                        // NOT Round End - Just reset to idle
                        if (this.anims.exists(`${p1Char}_idle`)) {
                            const p1IdleScale = getAnimationScale(p1Char, "idle");
                            this.player1Sprite.setScale(p1IdleScale);
                            this.player1Sprite.play(`${p1Char}_idle`);
                        }
                        if (this.anims.exists(`${p2Char}_idle`)) {
                            const p2IdleScale = getAnimationScale(p2Char, "idle");
                            this.player2Sprite.setScale(p2IdleScale);
                            this.player2Sprite.play(`${p2Char}_idle`);
                        }
                    }

                    // Schedule next turn
                    const delay = Math.max(100, this.config.turnDurationMs - 3500); // Adjust timing
                    this.time.delayedCall(delay, () => this.playNextTurn());
                };

                executeSequence();
            }
        });
    }

    /**
     * Show floating damage/healing text above a character.
     * Matches FightScene's visual feedback system.
     */
    private showFloatingText(text: string, x: number, y: number, color: string): void {
        const floatingText = this.add.text(x, y, text, {
            fontFamily: "Orbitron",
            fontSize: "24px",
            color: color,
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: "Power2",
            onComplete: () => floatingText.destroy(),
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
