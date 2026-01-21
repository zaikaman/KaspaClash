/**
 * SurvivalScene - Survival mode against 20 AI opponents
 * Based on PracticeScene patterns with wave progression system
 */

import Phaser from "phaser";
import { EventBus } from "@/game/EventBus";
import { GAME_DIMENSIONS, CHARACTER_POSITIONS, UI_POSITIONS } from "@/game/config";
import { CHAR_SPRITE_CONFIG, getCharacterScale, getAnimationScale, getCharacterYOffset, getSoundDelay, getSFXKey } from "@/game/config/sprite-config";
import { CombatEngine, BASE_MOVE_STATS } from "@/game/combat";
import { AIOpponent, type AIDifficulty } from "@/lib/game/ai-opponent";
import { getAIThinkTime } from "@/lib/game/ai-difficulty";
import { getCharacter, CHARACTER_ROSTER } from "@/data/characters";
import type { MoveType, Character } from "@/types";
import { generateSurvivalWaves, getWaveTierName, getWaveTierColor, type WaveConfig, TOTAL_WAVES } from "@/lib/survival/wave-generator";
import { calculateSurvivalScore, getShardsForWave } from "@/lib/survival/score-calculator";

export interface SurvivalSceneConfig {
    playerCharacterId: string;
    playerAddress: string;
}

export interface SurvivalResult {
    wavesCleared: number;
    totalScore: number;
    shardsEarned: number;
    isVictory: boolean;
    finalHealth: number;
    waveDetails: { healthAfter: number; roundsWon: number; totalRounds: number }[];
}

export class SurvivalScene extends Phaser.Scene {
    // Configuration
    private config!: SurvivalSceneConfig;
    private playerCharacter!: Character;
    private currentOpponent!: Character;
    private ai!: AIOpponent;

    // Wave System
    private waves: WaveConfig[] = [];
    private currentWave: number = 1;
    private waveDetails: { healthAfter: number; roundsWon: number; totalRounds: number }[] = [];
    private totalShardsEarned: number = 0;
    private totalScore: number = 0;

    // Combat Engine
    private combatEngine!: CombatEngine;

    // UI Elements
    private player1HealthBar!: Phaser.GameObjects.Graphics;
    private player2HealthBar!: Phaser.GameObjects.Graphics;
    private player1EnergyBar!: Phaser.GameObjects.Graphics;
    private player2EnergyBar!: Phaser.GameObjects.Graphics;
    private player1GuardMeter!: Phaser.GameObjects.Graphics;
    private player2GuardMeter!: Phaser.GameObjects.Graphics;
    private roundTimerText!: Phaser.GameObjects.Text;
    private waveIndicatorText!: Phaser.GameObjects.Text;
    private countdownText!: Phaser.GameObjects.Text;
    private turnIndicatorText!: Phaser.GameObjects.Text;
    private narrativeText!: Phaser.GameObjects.Text;

    // Character sprites
    private player1Sprite!: Phaser.GameObjects.Sprite;
    private player2Sprite!: Phaser.GameObjects.Sprite;

    // Move buttons
    private moveButtons: Map<MoveType, Phaser.GameObjects.Container> = new Map();
    private selectedMove: MoveType | null = null;

    // Timer
    private turnTimer: number = 15;
    private timerEvent?: Phaser.Time.TimerEvent;

    // State
    private phase: "countdown" | "selecting" | "resolving" | "wave_transition" | "match_end" = "countdown";

    // Audio settings
    private bgmVolume: number = 0.3;
    private sfxVolume: number = 0.5;

    // Match result overlay
    private matchResultOverlay!: Phaser.GameObjects.Container;

    // Settings
    private settingsContainer!: Phaser.GameObjects.Container;
    private isSettingsOpen: boolean = false;

    constructor() {
        super({ key: "SurvivalScene" });
    }

    init(data: SurvivalSceneConfig): void {
        this.config = data;
        this.resetFullState();
    }

    private resetFullState(): void {
        this.playerCharacter = getCharacter(this.config.playerCharacterId) ?? CHARACTER_ROSTER[0];
        this.waves = generateSurvivalWaves(this.playerCharacter.id);
        this.currentWave = 1;
        this.waveDetails = [];
        this.totalShardsEarned = 0;
        this.totalScore = 0;
        this.selectedMove = null;
        this.turnTimer = 15;
        this.phase = "countdown";
        this.moveButtons.clear();

        // Set first opponent
        const firstWave = this.waves[0];
        this.currentOpponent = getCharacter(firstWave.characterId) ?? CHARACTER_ROSTER[0];
        this.ai = new AIOpponent(firstWave.difficulty);
    }

    preload(): void {
        // OPTIMIZED: Load player + first few opponents, then dynamically load more
        const {
            loadBackground,
            loadUIAssets,
            loadCharacterSprites,
            loadCommonAudio,
            loadCharacterAudio,
        } = require("../utils/asset-loader");

        // Load survival background
        loadBackground(this, "survival-bg", "/assets/survival.webp");

        // Load UI assets
        loadUIAssets(this);

        // Get first 5 opponents to preload (rest will be loaded dynamically)
        const firstOpponents = this.waves.slice(0, 5).map(w => w.characterId);
        const charactersToLoad = [this.playerCharacter.id, ...firstOpponents];

        loadCharacterSprites(this, charactersToLoad);
        loadCommonAudio(this);
        loadCharacterAudio(this, charactersToLoad);

        // Load survival-specific BGM
        if (!this.cache.audio.exists("bgm_survival")) {
            this.load.audio("bgm_survival", "/assets/audio/dojo.mp3");
        }
    }

    create(): void {
        const { createCharacterAnimations, loadAdditionalCharacter } = require("../utils/asset-loader");

        this.loadAudioSettings();

        // Initialize combat engine
        this.combatEngine = new CombatEngine(
            this.playerCharacter.id,
            this.currentOpponent.id,
            "best_of_1"
        );

        // Create animations for loaded characters
        const firstOpponents = this.waves.slice(0, 5).map(w => w.characterId);
        createCharacterAnimations(this, [this.playerCharacter.id, ...firstOpponents]);

        this.createBackground();
        this.createCharacterSprites();
        this.createHealthBars();
        this.createEnergyBars();
        this.createGuardMeters();
        this.createRoundTimer();
        this.createWaveIndicator();
        this.createMoveButtons();
        this.createNarrativeDisplay();
        this.createTurnIndicator();
        this.createCountdownOverlay();
        this.createSettingsButton();

        this.settingsContainer = this.add.container(0, 0);
        this.createSettingsMenu();

        this.setupEventListeners();
        this.syncUIWithCombatState();
        this.startWave();

        EventBus.emit("survival_scene_ready");

        // Play BGM
        this.sound.pauseOnBlur = false;
        if (!this.sound.get("bgm_survival")?.isPlaying) {
            this.sound.play("bgm_survival", { loop: true, volume: this.bgmVolume });
        }

        this.events.once("shutdown", this.handleShutdown, this);
        this.events.once("destroy", this.handleShutdown, this);

        // Preload remaining opponents in background (waves 6-20)
        this.preloadRemainingOpponents();
    }

    /**
     * Preload remaining opponents in background after scene starts
     */
    private async preloadRemainingOpponents(): Promise<void> {
        const { loadAdditionalCharacter } = require("../utils/asset-loader");

        // Load remaining opponents (after wave 5)
        for (let i = 5; i < this.waves.length; i++) {
            const opponentId = this.waves[i].characterId;
            await loadAdditionalCharacter(this, opponentId);
        }
    }

    private playSFX(key: string): void {
        if (this.game.sound.locked) return;
        try {
            this.sound.play(key, { volume: this.sfxVolume });
            this.time.delayedCall(5000, () => {
                const sound = this.sound.get(key);
                if (sound?.isPlaying) sound.stop();
            });
        } catch (e) {
            console.warn(`Failed to play SFX: ${key}`, e);
        }
    }

    private loadAudioSettings(): void {
        try {
            const savedBgm = localStorage.getItem("kaspaclash_bgm_volume");
            const savedSfx = localStorage.getItem("kaspaclash_sfx_volume");
            if (savedBgm !== null) this.bgmVolume = parseFloat(savedBgm);
            if (savedSfx !== null) this.sfxVolume = parseFloat(savedSfx);
        } catch (e) { /* ignore */ }
    }

    private saveAudioSettings(): void {
        try {
            localStorage.setItem("kaspaclash_bgm_volume", this.bgmVolume.toString());
            localStorage.setItem("kaspaclash_sfx_volume", this.sfxVolume.toString());
        } catch (e) { /* ignore */ }
    }

    private applyBgmVolume(): void {
        const bgm = this.sound.get("bgm_survival");
        if (bgm && "setVolume" in bgm) {
            (bgm as Phaser.Sound.WebAudioSound).setVolume(this.bgmVolume);
        }
    }

    private handleShutdown(): void {
        const bgm = this.sound.get("bgm_survival");
        if (bgm?.isPlaying) bgm.stop();
    }

    private createAnimations(): void {
        const allCharacters = Object.keys(CHAR_SPRITE_CONFIG);
        const animationTypes = ["idle", "run", "punch", "kick", "block", "special", "dead"];

        allCharacters.forEach((charId) => {
            animationTypes.forEach((animType) => {
                const textureKey = `char_${charId}_${animType}`;
                const animKey = `${charId}_${animType}`;

                if (this.textures.exists(textureKey) && !this.anims.exists(animKey)) {
                    const frameCount = this.textures.get(textureKey).frameTotal - 1;
                    const endFrame = Math.max(0, frameCount - 1);

                    this.anims.create({
                        key: animKey,
                        frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: endFrame }),
                        frameRate: 24,
                        repeat: animType === "idle" || animType === "run" ? -1 : 0,
                    });
                }
            });

            // Fallback animations
            const idleKey = `char_${charId}_idle`;
            ['hurt', 'victory', 'defeat'].forEach(key => {
                const fallbackAnimKey = `${charId}_${key}`;
                if (!this.anims.exists(fallbackAnimKey) && this.textures.exists(idleKey)) {
                    const frameCount = this.textures.get(idleKey).frameTotal - 1;
                    const endFrame = Math.max(0, frameCount - 1);
                    this.anims.create({
                        key: fallbackAnimKey,
                        frames: this.anims.generateFrameNumbers(idleKey, { start: 0, end: endFrame }),
                        frameRate: 24,
                        repeat: 0,
                    });
                }
            });
        });
    }

    update(_time: number, _delta: number): void {
        if (this.phase === "selecting" && this.roundTimerText) {
            this.roundTimerText.setText(`${Math.ceil(this.turnTimer)}`);
        }
    }

    private createBackground(): void {
        if (this.textures.exists("survival-bg")) {
            const bg = this.add.image(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y, "survival-bg");
            bg.setDisplaySize(GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        } else {
            const graphics = this.add.graphics();
            graphics.fillGradientStyle(0x1a0a0a, 0x1a0a0a, 0x2e1a1a, 0x2e1a1a, 1);
            graphics.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        }

        // Survival mode indicator
        if (window.innerWidth >= 768) {
            this.add.text(GAME_DIMENSIONS.CENTER_X, 20, "SURVIVAL MODE", {
                fontFamily: "monospace",
                fontSize: "14px",
                color: "#ef4444",
                fontStyle: "bold",
            }).setOrigin(0.5);
        }
    }

    private createWaveIndicator(): void {
        const wave = this.waves[this.currentWave - 1];
        const tierName = getWaveTierName(this.currentWave);
        const tierColor = getWaveTierColor(this.currentWave);

        this.waveIndicatorText = this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            UI_POSITIONS.ROUND_INDICATOR.Y,
            `WAVE ${this.currentWave}/${TOTAL_WAVES}  •  ${tierName}`,
            { fontFamily: "monospace", fontSize: "16px", color: tierColor }
        ).setOrigin(0.5);
    }

    private createCharacterSprites(): void {
        const p1Char = this.playerCharacter.id;
        const p2Char = this.currentOpponent.id;

        const p1TextureKey = `char_${p1Char}_idle`;
        const p1BaseYOffset = 50;
        const p1ConfigOffset = getCharacterYOffset(p1Char, "idle");

        this.player1Sprite = this.add.sprite(
            CHARACTER_POSITIONS.PLAYER1.X,
            CHARACTER_POSITIONS.PLAYER1.Y - p1BaseYOffset + p1ConfigOffset,
            p1TextureKey
        );

        const p1Scale = getCharacterScale(p1Char);
        this.player1Sprite.setScale(p1Scale);
        this.player1Sprite.setOrigin(0.5, 0.5);
        if (this.anims.exists(`${p1Char}_idle`)) {
            this.player1Sprite.play(`${p1Char}_idle`);
        }

        const p2TextureKey = `char_${p2Char}_idle`;
        const p2BaseYOffset = 50;
        const p2ConfigOffset = getCharacterYOffset(p2Char, "idle");

        this.player2Sprite = this.add.sprite(
            CHARACTER_POSITIONS.PLAYER2.X,
            CHARACTER_POSITIONS.PLAYER2.Y - p2BaseYOffset + p2ConfigOffset,
            p2TextureKey
        );

        const p2Scale = getCharacterScale(p2Char);
        this.player2Sprite.setScale(p2Scale);
        this.player2Sprite.setOrigin(0.5, 0.5);
        this.player2Sprite.setFlipX(true);
        if (this.anims.exists(`${p2Char}_idle`)) {
            this.player2Sprite.play(`${p2Char}_idle`);
        }

        this.createPlayerIndicator();
    }

    private createPlayerIndicator(): void {
        const x = this.player1Sprite.x;
        const y = this.player1Sprite.y - 160;

        const container = this.add.container(x, y);

        const text = this.add.text(0, 0, "YOU", {
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#22c55e",
            fontStyle: "bold",
            backgroundColor: "#00000080",
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        const arrow = this.add.text(0, 20, "▼", {
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#22c55e",
        }).setOrigin(0.5);

        container.add([text, arrow]);

        this.tweens.add({
            targets: container,
            y: y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });
    }

    // Continue in part 2...
    private createHealthBars(): void {
        const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
        const barHeight = 25;

        this.createHealthBar(UI_POSITIONS.HEALTH_BAR.PLAYER1.X, UI_POSITIONS.HEALTH_BAR.PLAYER1.Y, barWidth, barHeight, "player1");
        this.createHealthBar(UI_POSITIONS.HEALTH_BAR.PLAYER2.X, UI_POSITIONS.HEALTH_BAR.PLAYER2.Y, barWidth, barHeight, "player2");

        const state = this.combatEngine.getState();

        this.add.text(
            UI_POSITIONS.HEALTH_BAR.PLAYER1.X,
            UI_POSITIONS.HEALTH_BAR.PLAYER1.Y - 18,
            `YOU: ${state.player1.characterId.toUpperCase()}`,
            { fontFamily: "monospace", fontSize: "12px", color: "#22c55e", fontStyle: "bold" }
        );

        this.add.text(
            UI_POSITIONS.HEALTH_BAR.PLAYER2.X + barWidth,
            UI_POSITIONS.HEALTH_BAR.PLAYER2.Y - 18,
            `WAVE ${this.currentWave}: ${this.currentOpponent.name.toUpperCase()}`,
            { fontFamily: "monospace", fontSize: "12px", color: "#ef4444" }
        ).setOrigin(1, 0);
    }

    private createHealthBar(x: number, y: number, width: number, height: number, player: "player1" | "player2"): void {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x333333, 1);
        graphics.fillRoundedRect(x, y, width, height, 4);
        graphics.lineStyle(2, player === "player1" ? 0x22c55e : 0xef4444, 1);
        graphics.strokeRoundedRect(x, y, width, height, 4);

        const healthGraphics = this.add.graphics();
        if (player === "player1") {
            this.player1HealthBar = healthGraphics;
        } else {
            this.player2HealthBar = healthGraphics;
        }
    }

    private createEnergyBars(): void {
        const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
        const barHeight = 12;
        const yOffset = 30;

        this.createEnergyBar(UI_POSITIONS.HEALTH_BAR.PLAYER1.X, UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + yOffset, barWidth, barHeight, "player1");
        this.createEnergyBar(UI_POSITIONS.HEALTH_BAR.PLAYER2.X, UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + yOffset, barWidth, barHeight, "player2");
    }

    private createEnergyBar(x: number, y: number, width: number, height: number, player: "player1" | "player2"): void {
        const bg = this.add.graphics();
        bg.fillStyle(0x222222, 1);
        bg.fillRoundedRect(x, y, width, height, 2);
        bg.lineStyle(1, 0x3b82f6, 0.5);
        bg.strokeRoundedRect(x, y, width, height, 2);

        const energyGraphics = this.add.graphics();
        if (player === "player1") {
            this.player1EnergyBar = energyGraphics;
        } else {
            this.player2EnergyBar = energyGraphics;
        }
    }

    private createGuardMeters(): void {
        const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
        const barHeight = 6;
        const yOffset = 45;

        this.createGuardMeter(UI_POSITIONS.HEALTH_BAR.PLAYER1.X, UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + yOffset, barWidth, barHeight, "player1");
        this.createGuardMeter(UI_POSITIONS.HEALTH_BAR.PLAYER2.X, UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + yOffset, barWidth, barHeight, "player2");
    }

    private createGuardMeter(x: number, y: number, width: number, height: number, player: "player1" | "player2"): void {
        const bg = this.add.graphics();
        bg.fillStyle(0x111111, 1);
        bg.fillRect(x, y, width, height);

        const guardGraphics = this.add.graphics();
        if (player === "player1") {
            this.player1GuardMeter = guardGraphics;
        } else {
            this.player2GuardMeter = guardGraphics;
        }
    }

    private createRoundTimer(): void {
        const timerBg = this.add.graphics();
        timerBg.fillStyle(0x1a1a2e, 0.9);
        timerBg.fillCircle(UI_POSITIONS.TIMER.X, UI_POSITIONS.TIMER.Y, 35);
        timerBg.lineStyle(3, 0xef4444, 1);
        timerBg.strokeCircle(UI_POSITIONS.TIMER.X, UI_POSITIONS.TIMER.Y, 35);

        this.roundTimerText = this.add.text(
            UI_POSITIONS.TIMER.X,
            UI_POSITIONS.TIMER.Y,
            "15",
            { fontFamily: "monospace", fontSize: "24px", color: "#ef4444", fontStyle: "bold" }
        ).setOrigin(0.5);
    }

    private createMoveButtons(): void {
        const moves: MoveType[] = ["punch", "kick", "block", "special"];
        const buttonWidth = 140;
        const buttonHeight = 160;
        const spacing = 20;
        const totalWidth = moves.length * buttonWidth + (moves.length - 1) * spacing;
        const startX = (GAME_DIMENSIONS.WIDTH - totalWidth) / 2 + buttonWidth / 2;
        const y = GAME_DIMENSIONS.HEIGHT - 100;

        this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            y - 95,
            "YOUR MOVE",
            { fontFamily: "monospace", fontSize: "14px", color: "#ef4444" }
        ).setOrigin(0.5);

        moves.forEach((move, index) => {
            const x = startX + index * (buttonWidth + spacing);
            const button = this.createMoveButton(x, y, buttonWidth, buttonHeight, move);
            this.moveButtons.set(move, button);
        });
    }

    private createMoveButton(x: number, y: number, width: number, height: number, move: MoveType): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);

        let color = 0xffffff;
        if (move === "punch") color = 0xef4444;
        if (move === "kick") color = 0x06b6d4;
        if (move === "block") color = 0x22c55e;
        if (move === "special") color = 0xa855f7;

        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.9);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
        bg.lineStyle(2, color, 0.8);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
        container.add(bg);

        const glow = this.add.graphics();
        glow.fillStyle(color, 0.1);
        glow.fillRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, 8);
        container.add(glow);

        const iconKey = `move_${move}`;
        const icon = this.add.image(0, -20, iconKey);
        icon.setDisplaySize(64, 64);
        container.add(icon);

        const nameText = this.add.text(0, 25, move.toUpperCase(), {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#ffffff",
            fontStyle: "bold",
        }).setOrigin(0.5);
        container.add(nameText);

        const cost = BASE_MOVE_STATS[move].energyCost;
        const costColor = cost === 0 ? "#22c55e" : "#3b82f6";
        const costText = this.add.text(0, 48, `${cost} Energy`, {
            fontFamily: "monospace",
            fontSize: "12px",
            color: costColor,
        }).setOrigin(0.5);
        container.add(costText);

        // Advantage Text
        let advantage = "";
        if (move === "punch") advantage = "Beats Special";
        if (move === "kick") advantage = "Beats Punch";
        if (move === "block") advantage = "Reflects Kick";
        if (move === "special") advantage = "Beats Block";

        const advText = this.add.text(0, 65, advantage, {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#aaaaaa",
            fontStyle: "italic"
        }).setOrigin(0.5);
        container.add(advText);

        const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on("pointerover", () => {
            if (this.phase === "selecting" && this.combatEngine.canAffordMove("player1", move)) {
                this.sound.play("sfx_hover", { volume: 0.5 });
                this.tweens.add({
                    targets: container,
                    y: y - 10,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 200,
                    ease: "Back.easeOut",
                });
            }
        });

        container.on("pointerout", () => {
            if (this.selectedMove !== move) {
                this.tweens.add({
                    targets: container,
                    y: y,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: "Power2",
                });
            }
        });

        container.on("pointerdown", () => {
            if (this.phase === "selecting") {
                this.sound.play("sfx_click", { volume: 0.5 });
                this.selectMove(move);
            }
        });

        return container;
    }

    private createNarrativeDisplay(): void {
        this.narrativeText = this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            GAME_DIMENSIONS.CENTER_Y - 80,
            "",
            {
                fontFamily: "monospace",
                fontSize: "18px",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: 600 },
            }
        ).setOrigin(0.5).setAlpha(0);
    }

    private createTurnIndicator(): void {
        this.turnIndicatorText = this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            130,
            "Select your move!",
            { fontFamily: "monospace", fontSize: "14px", color: "#888888" }
        ).setOrigin(0.5);
    }

    private createCountdownOverlay(): void {
        this.countdownText = this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            GAME_DIMENSIONS.CENTER_Y,
            "",
            { fontFamily: "monospace", fontSize: "72px", color: "#ef4444", fontStyle: "bold" }
        ).setOrigin(0.5).setAlpha(0);
    }

    private createSettingsButton(): void {
        // Simplified settings button
        const x = 50;
        const y = GAME_DIMENSIONS.HEIGHT - 50;

        const btn = this.add.text(x, y, "⚙", {
            fontFamily: "monospace",
            fontSize: "28px",
            color: "#888888"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on("pointerover", () => btn.setColor("#ffffff"));
        btn.on("pointerout", () => btn.setColor("#888888"));
        btn.on("pointerdown", () => this.toggleSettingsMenu());
    }

    private createSettingsMenu(): void {
        // Minimal settings menu
        this.settingsContainer.setVisible(false);
    }

    private toggleSettingsMenu(): void {
        this.isSettingsOpen = !this.isSettingsOpen;
        this.settingsContainer.setVisible(this.isSettingsOpen);
    }

    private setupEventListeners(): void {
        EventBus.on("survival_exit", () => this.exitSurvival());
    }

    private startWave(): void {
        this.phase = "countdown";
        this.playSFX("sfx_cd_fight");
        this.time.delayedCall(300, () => this.showCountdown(3));
    }

    private showCountdown(seconds: number): void {
        let count = seconds;
        const updateCountdown = () => {
            if (count > 0) {
                this.countdownText.setText(count.toString()).setAlpha(1);
                this.tweens.add({
                    targets: this.countdownText,
                    scale: { from: 1.5, to: 1 },
                    alpha: { from: 1, to: 0.5 },
                    duration: 800,
                    onComplete: () => {
                        count--;
                        if (count > 0) updateCountdown();
                        else this.showFight();
                    }
                });
            }
        };
        updateCountdown();
    }

    private showFight(): void {
        this.countdownText.setText("FIGHT!").setAlpha(1);
        this.tweens.add({
            targets: this.countdownText,
            alpha: 0,
            duration: 500,
            delay: 500,
            onComplete: () => this.startSelectionPhase()
        });
    }

    private startSelectionPhase(): void {
        if (this.timerEvent) {
            this.timerEvent.destroy();
            this.timerEvent = undefined;
        }
        this.phase = "selecting";
        this.selectedMove = null;
        this.turnTimer = 15;

        // Get current state to check if player is stunned
        const state = this.combatEngine.getState();

        // Check if player is stunned
        if (state.player1.isStunned) {
            // Player is stunned - show message and disable buttons
            this.turnIndicatorText.setText("YOU ARE STUNNED!").setColor("#ff4444");
            this.roundTimerText.setColor("#ff4444");

            // Disable all buttons visually
            this.moveButtons.forEach(btn => {
                btn.setAlpha(0.3);
                btn.disableInteractive();
            });

            // Flash the stun message
            this.tweens.add({
                targets: this.turnIndicatorText,
                alpha: { from: 1, to: 0.5 },
                duration: 300,
                yoyo: true,
                repeat: 2,
            });

            // AI makes its decision immediately (player can't act)
            const thinkTime = getAIThinkTime(this.waves[this.currentWave - 1].difficulty);
            this.time.delayedCall(thinkTime, () => {
                // Update AI context with stunned state before deciding
                this.ai.updateContext({
                    aiHealth: state.player2.hp,
                    playerHealth: state.player1.hp,
                    roundNumber: state.currentRound,
                    playerRoundsWon: state.player1.roundsWon,
                    aiRoundsWon: state.player2.roundsWon,
                    playerIsStunned: true,
                    aiEnergy: state.player2.energy,
                });
                const decision = this.ai.decide();
                const aiMove = decision.move;
                // Player's move doesn't matter when stunned - use punch as placeholder
                this.resolveRound("punch", aiMove);
            });
            return;
        }

        // Normal selection phase (player not stunned)
        this.turnIndicatorText.setText("Select your move!").setColor("#888888");
        this.roundTimerText.setColor("#ef4444");

        // Reset button visuals and affordability
        this.updateMoveButtonAffordability();

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.phase !== "selecting") return;
                this.turnTimer--;
                if (this.turnTimer <= 5) this.roundTimerText.setColor("#ff0000");
                if (this.turnTimer <= 0) this.onTimerExpired();
            },
            repeat: 14
        });

        this.ai.updateContext({
            aiHealth: state.player2.hp,
            playerHealth: state.player1.hp,
            roundNumber: state.currentRound,
            playerRoundsWon: state.player1.roundsWon,
            aiRoundsWon: state.player2.roundsWon
        });
    }

    private updateMoveButtonAffordability(): void {
        (["punch", "kick", "block", "special"] as MoveType[]).forEach((move) => {
            const canAfford = this.combatEngine.canAffordMove("player1", move);
            const container = this.moveButtons.get(move);
            if (container) {
                if (!canAfford) {
                    container.setAlpha(0.3);
                    container.disableInteractive();
                    // Tint children to grayscale for visual feedback
                    container.list.forEach((child: any) => {
                        if (child.setTint) child.setTint(0x555555);
                    });
                } else {
                    container.setAlpha(1);
                    container.setInteractive();
                    // Clear tint
                    container.list.forEach((child: any) => {
                        if (child.clearTint) child.clearTint();
                    });
                }
            }
        });
    }

    private selectMove(move: MoveType): void {
        if (!this.combatEngine.canAffordMove("player1", move)) {
            this.showFloatingText("Not enough energy!", GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.HEIGHT - 150, "#ff4444");
            return;
        }
        this.selectedMove = move;
        this.turnIndicatorText.setText("AI is thinking...").setColor("#f97316");
        this.moveButtons.forEach(btn => btn.setAlpha(0.4).disableInteractive());
        if (this.timerEvent) {
            this.timerEvent.destroy();
            this.timerEvent = undefined;
        }
        const thinkTime = getAIThinkTime(this.waves[this.currentWave - 1].difficulty);
        this.time.delayedCall(thinkTime, () => this.aiMakeDecision());
    }

    private onTimerExpired(): void {
        if (this.phase !== "selecting") return;
        if (this.timerEvent) {
            this.timerEvent.destroy();
            this.timerEvent = undefined;
        }
        if (!this.selectedMove) this.selectedMove = "punch";
        this.moveButtons.forEach(btn => btn.setAlpha(0.4).disableInteractive());
        const thinkTime = getAIThinkTime(this.waves[this.currentWave - 1].difficulty);
        this.time.delayedCall(thinkTime, () => this.aiMakeDecision());
    }

    private aiMakeDecision(): void {
        const state = this.combatEngine.getState();
        this.ai.updateContext({
            aiHealth: state.player2.hp,
            playerHealth: state.player1.hp,
            roundNumber: state.currentRound,
            playerRoundsWon: state.player1.roundsWon,
            aiRoundsWon: state.player2.roundsWon,
            aiEnergy: state.player2.energy
        });
        const decision = this.ai.decide();
        this.ai.recordPlayerMove(this.selectedMove!);
        this.resolveRound(this.selectedMove!, decision.move);
    }

    private resolveRound(playerMove: MoveType, aiMove: MoveType): void {
        this.phase = "resolving";

        // Store previous health for damage calculation
        const prevState = this.combatEngine.getState();
        const prevP1Health = prevState.player1.hp;
        const prevP2Health = prevState.player2.hp;

        // Execute moves in combat engine
        const turnResult = this.combatEngine.resolveTurn(playerMove, aiMove);
        const state = this.combatEngine.getState();

        const p1Char = this.playerCharacter.id;
        const p2Char = this.currentOpponent.id;

        // Store original positions
        const p1OriginalX = CHARACTER_POSITIONS.PLAYER1.X;
        const p2OriginalX = CHARACTER_POSITIONS.PLAYER2.X;
        const meetingPointX = GAME_DIMENSIONS.CENTER_X;

        // Check if either player was stunned
        const p1WasStunned = turnResult.player1.outcome === "stunned";
        const p2WasStunned = turnResult.player2.outcome === "stunned";

        // Determine movement targets based on stun state
        let p1TargetX: number;
        let p2TargetX: number;

        if (p1WasStunned && !p2WasStunned) {
            p1TargetX = p1OriginalX;
            p2TargetX = p1OriginalX + 100;
        } else if (p2WasStunned && !p1WasStunned) {
            p1TargetX = p2OriginalX - 100;
            p2TargetX = p2OriginalX;
        } else {
            p1TargetX = meetingPointX - 50;
            p2TargetX = meetingPointX + 50;
        }

        // Phase 1: Run animations
        if (!p1WasStunned && this.anims.exists(`${p1Char}_run`)) {
            const p1RunScale = getAnimationScale(p1Char, 'run');
            this.player1Sprite.setScale(p1RunScale);
            this.player1Sprite.play(`${p1Char}_run`);
        }
        if (!p2WasStunned && this.anims.exists(`${p2Char}_run`)) {
            const p2RunScale = getAnimationScale(p2Char, 'run');
            this.player2Sprite.setScale(p2RunScale);
            this.player2Sprite.play(`${p2Char}_run`);
        }

        // Tween to target positions
        this.tweens.add({
            targets: this.player1Sprite,
            x: p1TargetX,
            duration: 600,
            ease: 'Power2',
        });

        this.tweens.add({
            targets: this.player2Sprite,
            x: p2TargetX,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                // Calculate actual damage
                const p1ActualDamage = Math.max(0, prevP1Health - this.combatEngine.getState().player1.hp);
                const p2ActualDamage = Math.max(0, prevP2Health - this.combatEngine.getState().player2.hp);

                // Phase 2: Player 1 Attack
                const runP1Attack = () => {
                    return new Promise<void>((resolve) => {
                        if (p1WasStunned) {
                            resolve();
                            return;
                        }

                        const animKey = `${p1Char}_${playerMove}`;
                        if (this.anims.exists(animKey)) {
                            const scale = getAnimationScale(p1Char, playerMove);
                            this.player1Sprite.setScale(scale);
                            this.player1Sprite.play(animKey);

                            const sfxKey = getSFXKey(p1Char, playerMove);
                            const delay = getSoundDelay(p1Char, playerMove);
                            if (delay > 0) {
                                this.time.delayedCall(delay, () => this.playSFX(sfxKey));
                            } else {
                                this.playSFX(sfxKey);
                            }
                        }

                        this.turnIndicatorText.setText(playerMove.toUpperCase()).setColor("#22c55e");

                        if (p2ActualDamage > 0) {
                            this.time.delayedCall(300, () => {
                                this.showFloatingText(`-${p2ActualDamage}`, p2OriginalX - 50, CHARACTER_POSITIONS.PLAYER2.Y - 130, "#ff4444");
                                this.tweens.add({
                                    targets: this.player2Sprite,
                                    alpha: 0.5,
                                    yoyo: true,
                                    duration: 50,
                                    repeat: 3
                                });
                            });
                        }

                        this.time.delayedCall(1200, () => resolve());
                    });
                };

                // Phase 3: Player 2 (AI) Attack
                const runP2Attack = () => {
                    return new Promise<void>((resolve) => {
                        if (p2WasStunned) {
                            resolve();
                            return;
                        }

                        const animKey = `${p2Char}_${aiMove}`;
                        if (this.anims.exists(animKey)) {
                            const scale = getAnimationScale(p2Char, aiMove);
                            this.player2Sprite.setScale(scale);
                            this.player2Sprite.play(animKey);

                            const sfxKey = getSFXKey(p2Char, aiMove);
                            const p2Delay = getSoundDelay(p2Char, aiMove);
                            if (p2Delay > 0) {
                                this.time.delayedCall(p2Delay, () => this.playSFX(sfxKey));
                            } else {
                                this.playSFX(sfxKey);
                            }
                        }

                        this.turnIndicatorText.setText(aiMove.toUpperCase()).setColor("#ef4444");

                        if (p1ActualDamage > 0) {
                            this.time.delayedCall(300, () => {
                                this.showFloatingText(`-${p1ActualDamage}`, p1OriginalX + 50, CHARACTER_POSITIONS.PLAYER1.Y - 130, "#ff4444");
                                this.tweens.add({
                                    targets: this.player1Sprite,
                                    alpha: 0.5,
                                    yoyo: true,
                                    duration: 50,
                                    repeat: 3
                                });
                            });
                        }

                        this.time.delayedCall(1200, () => resolve());
                    });
                };

                // Execute attack sequence
                (async () => {
                    const isConcurrent = playerMove === "block" || aiMove === "block";

                    if (isConcurrent) {
                        await Promise.all([runP1Attack(), runP2Attack()]);
                    } else {
                        await runP1Attack();
                        await runP2Attack();
                    }

                    // Show narrative
                    let narrative = "";
                    if (p1WasStunned && p2WasStunned) {
                        narrative = "Both players are stunned!";
                    } else if (p1WasStunned) {
                        narrative = `You are STUNNED! AI uses ${aiMove}!`;
                    } else if (p2WasStunned) {
                        narrative = `AI is STUNNED! You use ${playerMove}!`;
                    } else if (p1ActualDamage > 0 && p2ActualDamage > 0) {
                        if (p2ActualDamage > p1ActualDamage) {
                            narrative = `Brutal exchange! You ${playerMove} for ${p2ActualDamage} dmg, but take ${p1ActualDamage}!`;
                        } else if (p1ActualDamage > p2ActualDamage) {
                            narrative = `Fierce clash! AI ${aiMove} for ${p1ActualDamage} dmg, but takes ${p2ActualDamage}!`;
                        } else {
                            narrative = `Devastating trade! Both deal ${p1ActualDamage} damage!`;
                        }
                    } else if (p2ActualDamage > 0) {
                        narrative = `You hit for ${p2ActualDamage} damage!`;
                    } else if (p1ActualDamage > 0) {
                        narrative = `AI hits for ${p1ActualDamage} damage!`;
                    } else {
                        narrative = "Both attacks were blocked or missed!";
                    }
                    this.narrativeText.setText(narrative).setAlpha(1);

                    // Phase 4: Sync UI & Return
                    this.syncUIWithCombatState();

                    // Run back animations
                    if (this.anims.exists(`${p1Char}_run`)) {
                        const p1RunScale = getAnimationScale(p1Char, 'run');
                        this.player1Sprite.setScale(p1RunScale);
                        this.player1Sprite.play(`${p1Char}_run`);
                    }
                    if (this.anims.exists(`${p2Char}_run`)) {
                        const p2RunScale = getAnimationScale(p2Char, 'run');
                        this.player2Sprite.setScale(p2RunScale);
                        this.player2Sprite.play(`${p2Char}_run`);
                        this.player2Sprite.setFlipX(true);
                    }

                    // Tween back to original positions
                    this.tweens.add({
                        targets: this.player1Sprite,
                        x: p1OriginalX,
                        duration: 600,
                        ease: 'Power2',
                    });

                    this.tweens.add({
                        targets: this.player2Sprite,
                        x: p2OriginalX,
                        duration: 600,
                        ease: 'Power2',
                        onComplete: () => {
                            // Check result first to determine animation
                            if (state.isMatchOver || state.isRoundOver) {
                                // Don't return to idle - showRoundEnd will handle death animation
                                if (state.isRoundOver) {
                                    this.showRoundEnd();
                                } else {
                                    // Match is over, play death animation on loser before ending
                                    const loser = state.matchWinner === "player1" ? "player2" : "player1";
                                    const loserChar = loser === "player1" ? p1Char : p2Char;
                                    const loserSprite = loser === "player1" ? this.player1Sprite : this.player2Sprite;

                                    // Play dead animation on loser if it exists
                                    if (this.anims.exists(`${loserChar}_dead`)) {
                                        loserSprite.setScale(getAnimationScale(loserChar, "dead"));
                                        loserSprite.play(`${loserChar}_dead`);
                                    }

                                    // Wait for death animation then end
                                    this.time.delayedCall(1500, () => {
                                        state.matchWinner === "player1" ? this.onWaveComplete() : this.onSurvivalEnd(false);
                                    });
                                }
                            } else {
                                // Phase 5: Return to idle for continuing combat
                                if (this.anims.exists(`${p1Char}_idle`)) {
                                    const p1IdleScale = getAnimationScale(p1Char, 'idle');
                                    this.player1Sprite.setScale(p1IdleScale);
                                    this.player1Sprite.play(`${p1Char}_idle`);
                                }
                                if (this.anims.exists(`${p2Char}_idle`)) {
                                    const p2IdleScale = getAnimationScale(p2Char, 'idle');
                                    this.player2Sprite.setScale(p2IdleScale);
                                    this.player2Sprite.play(`${p2Char}_idle`);
                                }

                                // Fade out narrative text
                                this.tweens.add({
                                    targets: this.narrativeText,
                                    alpha: 0,
                                    duration: 300,
                                });

                                this.startSelectionPhase();
                            }
                        }
                    });
                })();
            }
        });
    }

    private showRoundEnd(): void {
        const state = this.combatEngine.getState();
        const isWin = state.roundWinner === "player1";

        // Play death animation on the loser
        const loser = state.roundWinner === "player1" ? "player2" : "player1";
        const loserChar = loser === "player1" ? this.playerCharacter.id : this.currentOpponent.id;
        const loserSprite = loser === "player1" ? this.player1Sprite : this.player2Sprite;

        // Play dead animation on loser if it exists
        if (this.anims.exists(`${loserChar}_dead`)) {
            loserSprite.setScale(getAnimationScale(loserChar, "dead"));
            loserSprite.play(`${loserChar}_dead`);
        }

        // Wait for death animation to complete (36 frames at 24fps = 1.5s)
        this.time.delayedCall(1500, () => {
            this.countdownText.setText(isWin ? "ROUND WON!" : "ROUND LOST!").setColor(isWin ? "#22c55e" : "#ef4444").setAlpha(1);
            this.time.delayedCall(2000, () => {
                this.countdownText.setAlpha(0);

                // Re-check state to see if match is now over
                const currentState = this.combatEngine.getState();
                if (currentState.isMatchOver) {
                    // Match is over - handle win or loss
                    currentState.matchWinner === "player1" ? this.onWaveComplete() : this.onSurvivalEnd(false);
                } else {
                    // Match continues - start new round
                    this.combatEngine.startNewRound();
                    this.syncUIWithCombatState();
                    this.startSelectionPhase();
                }
            });
        });
    }

    private onWaveComplete(): void {
        const state = this.combatEngine.getState();
        this.waveDetails.push({
            healthAfter: state.player1.hp,
            roundsWon: state.player1.roundsWon,
            totalRounds: state.currentRound
        });
        const shards = getShardsForWave(this.currentWave, true);
        this.totalShardsEarned += shards;

        if (this.currentWave >= TOTAL_WAVES) {
            this.onSurvivalEnd(true);
            return;
        }

        this.phase = "wave_transition";
        this.playSFX("sfx_victory");
        this.countdownText.setText(`WAVE ${this.currentWave} COMPLETE!`).setColor("#22c55e").setAlpha(1);
        const shardsText = this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            GAME_DIMENSIONS.CENTER_Y + 60,
            `+${shards} SHARDS`,
            { fontFamily: "monospace", fontSize: "24px", color: "#fbbf24", fontStyle: "bold" }
        ).setOrigin(0.5);

        this.time.delayedCall(3000, () => {
            this.countdownText.setAlpha(0);
            shardsText.destroy();
            this.advanceToNextWave();
        });
    }

    private advanceToNextWave(): void {
        this.currentWave++;
        const wave = this.waves[this.currentWave - 1];
        this.currentOpponent = getCharacter(wave.characterId) ?? CHARACTER_ROSTER[0];
        this.ai = new AIOpponent(wave.difficulty);
        this.combatEngine = new CombatEngine(this.playerCharacter.id, this.currentOpponent.id, "best_of_1");

        const tierName = getWaveTierName(this.currentWave);
        const tierColor = getWaveTierColor(this.currentWave);
        this.waveIndicatorText.setText(`WAVE ${this.currentWave}/${TOTAL_WAVES}  •  ${tierName}`).setColor(tierColor);
        this.updateOpponentSprite();

        if (wave.isBossWave) {
            this.showBossWaveAnnouncement();
        } else {
            this.syncUIWithCombatState();
            this.startWave();
        }
    }

    private updateOpponentSprite(): void {
        const p2Char = this.currentOpponent.id;
        this.player2Sprite.setTexture(`char_${p2Char}_idle`);
        this.player2Sprite.setY(CHARACTER_POSITIONS.PLAYER2.Y - 50 + getCharacterYOffset(p2Char, "idle"));
        this.player2Sprite.setScale(getCharacterScale(p2Char)).setFlipX(true);
        if (this.anims.exists(`${p2Char}_idle`)) this.player2Sprite.play(`${p2Char}_idle`);
    }

    private showBossWaveAnnouncement(): void {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        const bossText = this.add.text(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y - 40, "⚔️ FINAL BOSS ⚔️", {
            fontFamily: "monospace", fontSize: "48px", color: "#ef4444", fontStyle: "bold"
        }).setOrigin(0.5);
        const mirrorText = this.add.text(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y + 20, "MIRROR MATCH", {
            fontFamily: "monospace", fontSize: "24px", color: "#ffffff"
        }).setOrigin(0.5);

        this.time.delayedCall(3000, () => {
            overlay.destroy();
            bossText.destroy();
            mirrorText.destroy();
            this.syncUIWithCombatState();
            this.startWave();
        });
    }

    private onSurvivalEnd(isVictory: boolean): void {
        this.phase = "match_end";
        const state = this.combatEngine.getState();
        const wavesCleared = isVictory ? TOTAL_WAVES : this.currentWave - 1;
        const scoreResult = calculateSurvivalScore(wavesCleared, state.player1.hp, isVictory, this.waveDetails);

        const result: SurvivalResult = {
            wavesCleared,
            totalScore: scoreResult.totalScore,
            shardsEarned: scoreResult.shardsEarned,
            isVictory,
            finalHealth: state.player1.hp,
            waveDetails: this.waveDetails
        };

        EventBus.emit("survival_ended", result);
        this.playSFX(isVictory ? "sfx_victory" : "sfx_defeat");
        this.createResultOverlay(result);
    }

    private createResultOverlay(result: SurvivalResult): void {
        this.matchResultOverlay = this.add.container(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y);
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.9);
        bg.fillRect(-GAME_DIMENSIONS.WIDTH / 2, -GAME_DIMENSIONS.HEIGHT / 2, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.matchResultOverlay.add(bg);

        const title = this.add.text(0, -120, result.isVictory ? "🏆 CHAMPION! 🏆" : "GAME OVER", {
            fontFamily: "monospace", fontSize: "48px", color: result.isVictory ? "#fbbf24" : "#ef4444", fontStyle: "bold"
        }).setOrigin(0.5);
        this.matchResultOverlay.add(title);

        this.matchResultOverlay.add(this.add.text(0, -60, `Waves Cleared: ${result.wavesCleared}/${TOTAL_WAVES}`, {
            fontFamily: "monospace", fontSize: "24px", color: "#ffffff"
        }).setOrigin(0.5));

        this.matchResultOverlay.add(this.add.text(0, -20, `Score: ${result.totalScore.toLocaleString()}`, {
            fontFamily: "monospace", fontSize: "20px", color: "#3b82f6"
        }).setOrigin(0.5));

        this.matchResultOverlay.add(this.add.text(0, 20, `+${result.shardsEarned} SHARDS`, {
            fontFamily: "monospace", fontSize: "28px", color: "#fbbf24", fontStyle: "bold"
        }).setOrigin(0.5));

        this.matchResultOverlay.add(this.createResultButton(0, 100, "EXIT", () => this.exitSurvival()));
        this.matchResultOverlay.setDepth(100);
    }

    private createResultButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(0xef4444, 1);
        bg.fillRoundedRect(-100, -25, 200, 50, 8);
        const text = this.add.text(0, 0, label, {
            fontFamily: "monospace", fontSize: "18px", color: "#ffffff", fontStyle: "bold"
        }).setOrigin(0.5);
        container.add([bg, text]);
        container.setSize(200, 50).setInteractive({ useHandCursor: true });
        container.on("pointerover", () => container.setScale(1.05));
        container.on("pointerout", () => container.setScale(1));
        container.on("pointerdown", onClick);
        return container;
    }

    private syncUIWithCombatState(): void {
        const state = this.combatEngine.getState();
        const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;

        this.player1HealthBar.clear();
        const p1Pct = Math.max(0, state.player1.hp) / state.player1.maxHp;
        this.player1HealthBar.fillStyle(this.getHealthColor(p1Pct), 1);
        this.player1HealthBar.fillRoundedRect(UI_POSITIONS.HEALTH_BAR.PLAYER1.X + 2, UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + 2, (barWidth - 4) * p1Pct, 21, 3);

        this.player2HealthBar.clear();
        const p2Pct = Math.max(0, state.player2.hp) / state.player2.maxHp;
        const p2W = (barWidth - 4) * p2Pct;
        this.player2HealthBar.fillStyle(this.getHealthColor(p2Pct), 1);
        this.player2HealthBar.fillRoundedRect(UI_POSITIONS.HEALTH_BAR.PLAYER2.X + 2 + (barWidth - 4 - p2W), UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + 2, p2W, 21, 3);

        this.player1EnergyBar.clear();
        const e1Pct = Math.max(0, state.player1.energy) / state.player1.maxEnergy;
        this.player1EnergyBar.fillStyle(0x3b82f6, 1);
        this.player1EnergyBar.fillRoundedRect(UI_POSITIONS.HEALTH_BAR.PLAYER1.X + 1, UI_POSITIONS.HEALTH_BAR.PLAYER1.Y + 30, (barWidth - 2) * e1Pct, 10, 2);

        this.player2EnergyBar.clear();
        const e2Pct = Math.max(0, state.player2.energy) / state.player2.maxEnergy;
        const e2W = (barWidth - 2) * e2Pct;
        this.player2EnergyBar.fillStyle(0x3b82f6, 1);
        this.player2EnergyBar.fillRoundedRect(UI_POSITIONS.HEALTH_BAR.PLAYER2.X + 1 + (barWidth - 2 - e2W), UI_POSITIONS.HEALTH_BAR.PLAYER2.Y + 30, e2W, 10, 2);

        this.updateGuardDisplay("player1", state.player1.guardMeter);
        this.updateGuardDisplay("player2", state.player2.guardMeter);
    }

    private updateGuardDisplay(player: "player1" | "player2", guardMeter: number): void {
        const barWidth = UI_POSITIONS.HEALTH_BAR.PLAYER1.WIDTH;
        const x = player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.X : UI_POSITIONS.HEALTH_BAR.PLAYER2.X;
        const y = (player === "player1" ? UI_POSITIONS.HEALTH_BAR.PLAYER1.Y : UI_POSITIONS.HEALTH_BAR.PLAYER2.Y) + 45;
        const pct = Math.min(1, Math.max(0, guardMeter) / 100);
        const w = barWidth * pct;
        const g = player === "player1" ? this.player1GuardMeter : this.player2GuardMeter;
        g.clear().fillStyle(pct >= 0.75 ? 0xef4444 : 0xf97316, 1);
        player === "player2" ? g.fillRect(x + (barWidth - w), y, w, 6) : g.fillRect(x, y, w, 6);
    }

    private getHealthColor(pct: number): number {
        return pct > 0.5 ? 0x22c55e : pct > 0.25 ? 0xf59e0b : 0xef4444;
    }

    private showFloatingText(text: string, x: number, y: number, color: string): void {
        const t = this.add.text(x, y, text, {
            fontFamily: "monospace", fontSize: "28px", color, fontStyle: "bold", stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5);
        this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 1000, ease: "Power2", onComplete: () => t.destroy() });
    }

    private exitSurvival(): void {
        EventBus.off("survival_exit");
        EventBus.emit("survival_exit_complete");
    }
}
