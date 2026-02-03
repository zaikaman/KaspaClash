/**
 * SurvivalScene - Survival mode against 20 AI opponents
 * Based on PracticeScene patterns with wave progression system
 * Includes Power Surge cards with precomputed AI selections
 */

import Phaser from "phaser";
import { EventBus } from "@/game/EventBus";
import { GAME_DIMENSIONS, CHARACTER_POSITIONS, UI_POSITIONS } from "@/game/config";
import { CHAR_SPRITE_CONFIG, getCharacterScale, getAnimationScale, getCharacterYOffset, getSoundDelay, getSFXKey } from "@/game/config/sprite-config";
import { CombatEngine, BASE_MOVE_STATS } from "@/game/combat";
import { calculateSurgeEffects, isBlockDisabled, shouldStunOpponent } from "@/game/combat/SurgeEffects";
import { SmartBotOpponent } from "@/lib/game/smart-bot-opponent";
import { getAIThinkTime } from "@/lib/game/ai-difficulty";
import { getCharacter, CHARACTER_ROSTER } from "@/data/characters";
import type { MoveType, Character } from "@/types";
import { generateSurvivalWaves, getWaveTierName, getWaveTierColor, type WaveConfig, TOTAL_WAVES } from "@/lib/survival/wave-generator";
import { calculateSurvivalScore, getShardsForWave } from "@/lib/survival/score-calculator";
import { isMobileDevice } from "@/utils/device";
import { OfflinePowerSurgeCards } from "@/game/ui/OfflinePowerSurgeCards";
import { PowerSurgeCardView } from "../ui/PowerSurgeCardView";
import type { PowerSurgeCardId } from "@/types/power-surge";
import { getRandomPowerSurgeCards, getPowerSurgeCard } from "@/types/power-surge";
import { TextFactory } from "@/game/ui/TextFactory";

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
    private ai!: SmartBotOpponent;

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

    // Decorative text
    private modeText?: Phaser.GameObjects.Text;

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
    private bgmSlider?: Phaser.GameObjects.Container;
    private sfxSlider?: Phaser.GameObjects.Container;

    // Match result overlay
    private matchResultOverlay!: Phaser.GameObjects.Container;

    // Settings
    private settingsContainer!: Phaser.GameObjects.Container;
    private isSettingsOpen: boolean = false;

    // Visibility sync for tab switching
    private visibilityChangeHandler: (() => void) | null = null;
    private wasPlayingBeforeHidden: boolean = false;

    // Power Surge state - precomputed for all waves
    private powerSurgeUI?: OfflinePowerSurgeCards;
    private precomputedDecks: Map<number, PowerSurgeCardId[]> = new Map(); // wave -> cards
    private precomputedAISelections: Map<number, PowerSurgeCardId> = new Map(); // wave -> AI selection
    private activeSurges: {
        player1: PowerSurgeCardId | null;
        player2: PowerSurgeCardId | null;
    } = { player1: null, player2: null };
    private surgeCardsShownThisWave: boolean = false;
    private lastSurgeWave: number = 0;
    private stunTweens: Map<"player1" | "player2", Phaser.Tweens.Tween> = new Map(); // Track stun tweens for cleanup

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
        this.ai = new SmartBotOpponent();

        // Precompute Power Surge decks and AI selections for all waves
        this.precomputePowerSurgeDecks();
    }

    /**
     * Precompute Power Surge card decks and AI selections for all waves.
     * This ensures consistent cards across the run and instant AI decisions.
     */
    private precomputePowerSurgeDecks(): void {
        this.precomputedDecks.clear();
        this.precomputedAISelections.clear();
        this.activeSurges = { player1: null, player2: null };
        this.surgeCardsShownThisWave = false;
        this.lastSurgeWave = 0;

        // Generate unique decks for each wave (20 waves in survival)
        for (let wave = 1; wave <= TOTAL_WAVES; wave++) {
            // Get 3 random cards
            const deck = getRandomPowerSurgeCards(3);
            const deckIds = deck.map(c => c.id);
            this.precomputedDecks.set(wave, deckIds);

            // AI picks a random card from the deck
            const aiChoice = deckIds[Math.floor(Math.random() * deckIds.length)];
            this.precomputedAISelections.set(wave, aiChoice);
        }

        console.log("[SurvivalScene] Precomputed surge decks for", TOTAL_WAVES, "waves");
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
        const { createCharacterAnimations } = require("../utils/asset-loader");

        this.loadAudioSettings();

        // Initialize combat engine
        this.combatEngine = new CombatEngine(
            this.playerCharacter.id,
            this.currentOpponent.id,
            "best_of_1"
        );

        // Create animations only for player and first opponent (immediate need)
        // Defer remaining opponent animations to preloadRemainingOpponents
        createCharacterAnimations(this, [this.playerCharacter.id, this.currentOpponent.id]);

        // Create critical UI elements first (background, sprites, basic UI)
        this.createBackground();
        this.createCharacterSprites();
        this.createCountdownOverlay(); // Needed for initial countdown

        // Defer non-critical UI creation to next frame to avoid initial lag
        this.time.delayedCall(0, () => {
            this.createHealthBars();
            this.createEnergyBars();
            this.createGuardMeters();
            this.createRoundTimer();
            this.createWaveIndicator();
        });

        // Defer move buttons and other UI to second frame
        this.time.delayedCall(16, () => {
            this.createMoveButtons();
            this.createNarrativeDisplay();
            this.createTurnIndicator();
            this.createSettingsButton();
            this.createSettingsMenu();
        });

        this.setupEventListeners();

        // Defer state sync and wave start to allow UI to render
        this.time.delayedCall(32, () => {
            this.syncUIWithCombatState();
            this.startWave();
            EventBus.emit("survival_scene_ready");
        });

        // Play BGM
        this.sound.pauseOnBlur = false;
        if (!this.sound.get("bgm_survival")?.isPlaying) {
            this.sound.play("bgm_survival", { loop: true, volume: this.bgmVolume });
        }

        this.events.once("shutdown", this.handleShutdown, this);
        this.events.once("destroy", this.handleShutdown, this);

        // Setup visibility handler for tab switching
        this.setupVisibilityHandler();

        // Create animations for first 5 opponents in background (after initial render)
        this.time.delayedCall(100, () => {
            const firstOpponents = this.waves.slice(1, 5).map(w => w.characterId);
            createCharacterAnimations(this, firstOpponents);
        });

        // Preload remaining opponents in background (waves 6-20) - with significant delay
        this.preloadRemainingOpponents();
    }

    // ===========================================================================
    // VISIBILITY SYNC (TAB SWITCHING)
    // ===========================================================================

    /**
     * Setup visibility change handler for pause/resume on tab switching.
     */
    private setupVisibilityHandler(): void {
        if (typeof document === "undefined") return;

        this.visibilityChangeHandler = () => {
            if (document.visibilityState === "hidden") {
                // Tab hidden - pause timers
                console.log("[SurvivalScene] Tab hidden, pausing timers");
                this.wasPlayingBeforeHidden = this.phase === "selecting";
                if (this.timerEvent && !this.timerEvent.paused) {
                    this.timerEvent.paused = true;
                }
            } else if (document.visibilityState === "visible") {
                // Tab visible - resume timers
                console.log("[SurvivalScene] Tab visible, resuming timers");
                if (this.timerEvent && this.timerEvent.paused && this.wasPlayingBeforeHidden) {
                    this.timerEvent.paused = false;
                }
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
     * Preload remaining opponents in background after scene starts.
     * Uses delayed batched loading to avoid blocking the main thread.
     */
    private async preloadRemainingOpponents(): Promise<void> {
        const { loadAdditionalCharacter } = require("../utils/asset-loader");

        // Wait for scene to fully stabilize before loading more assets
        await this.delay(2000);

        // Load remaining opponents (after wave 5) in small batches
        const BATCH_SIZE = 3;
        const BATCH_DELAY_MS = 500; // Delay between batches to keep scene responsive

        for (let i = 5; i < this.waves.length; i++) {
            // Check if scene is still active
            if (!this.scene.isActive()) return;

            const opponentId = this.waves[i].characterId;
            await loadAdditionalCharacter(this, opponentId);

            // Add small delay between batches
            if ((i - 4) % BATCH_SIZE === 0) {
                await this.delay(BATCH_DELAY_MS);
            }
        }

        console.log("[SurvivalScene] All opponents preloaded");
    }

    /**
     * Utility to delay execution without blocking
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => {
            if (this.scene.isActive()) {
                this.time.delayedCall(ms, resolve);
            } else {
                resolve();
            }
        });
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
        this.modeText = TextFactory.createLabel(this, GAME_DIMENSIONS.CENTER_X, 20, "SURVIVAL MODE", {
            fontSize: "14px",
            color: "#ef4444",
            fontStyle: "bold",
        }).setOrigin(0.5);

        // Initial layout check
        this.updateLayout();

        // Listen for resize events to handle rotation
        this.scale.on('resize', this.updateLayout, this);
    }



    /**
     * Update layout based on screen size.
     * Hides decorative text on mobile/small screens.
     */
    private updateLayout(): void {
        // Hide on mobile devices OR small screens
        const shouldHide = isMobileDevice() || window.innerWidth < 1024 || window.innerHeight < 600;

        if (this.modeText) this.modeText.setVisible(!shouldHide);
    }

    private createWaveIndicator(): void {
        const wave = this.waves[this.currentWave - 1];
        const tierName = getWaveTierName(this.currentWave);
        const tierColor = getWaveTierColor(this.currentWave);

        this.waveIndicatorText = TextFactory.createScore(
            this,
            GAME_DIMENSIONS.CENTER_X,
            UI_POSITIONS.ROUND_INDICATOR.Y,
            `WAVE ${this.currentWave}/${TOTAL_WAVES}  •  ${tierName}`
        ).setOrigin(0.5).setColor(tierColor);
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

        const text = TextFactory.createLabel(this, 0, 0, "YOU", {
            fontSize: "14px",
            color: "#22c55e",
            fontStyle: "bold",
            backgroundColor: "#00000080",
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        const arrow = TextFactory.createLabel(this, 0, 20, "▼", {
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

        this.roundTimerText = TextFactory.createTimer(
            this,
            UI_POSITIONS.TIMER.X,
            UI_POSITIONS.TIMER.Y,
            "15"
        ).setOrigin(0.5).setColor("#ef4444");
    }

    private createMoveButtons(): void {
        const moves: MoveType[] = ["punch", "kick", "block", "special"];
        const buttonWidth = 140;
        const buttonHeight = 160;
        const spacing = 20;
        const totalWidth = moves.length * buttonWidth + (moves.length - 1) * spacing;
        const startX = (GAME_DIMENSIONS.WIDTH - totalWidth) / 2 + buttonWidth / 2;
        const y = GAME_DIMENSIONS.HEIGHT - 100;

        // Label
        TextFactory.createSubtitle(
            this,
            GAME_DIMENSIONS.CENTER_X,
            y - 95,
            "YOUR MOVE"
        ).setOrigin(0.5).setColor("#ef4444");

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
        this.narrativeText = TextFactory.createNarrative(
            this,
            GAME_DIMENSIONS.CENTER_X,
            GAME_DIMENSIONS.CENTER_Y - 80,
            ""
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
        const radius = 24;
        // Bottom Left position
        const x = 50;
        const y = GAME_DIMENSIONS.HEIGHT - 50;

        const container = this.add.container(x, y);
        container.setDepth(2000); // Ensure it's above everything else

        const circle = this.add.graphics();
        circle.fillStyle(0x1a1a2e, 0.8);
        circle.fillCircle(0, 0, radius);
        circle.lineStyle(2, 0x4b5563, 1);
        circle.strokeCircle(0, 0, radius);

        // Gear Icon (Simplified geometry)
        const gear = this.add.graphics();
        gear.fillStyle(0x9ca3af, 1);
        gear.fillCircle(0, 0, 8);
        for (let i = 0; i < 8; i++) {
            const angle = Phaser.Math.DegToRad(i * 45);
            const bx = Math.cos(angle) * 12;
            const by = Math.sin(angle) * 12;
            gear.fillCircle(bx, by, 4);
        }
        gear.fillCircle(0, 0, 4); // Center hole (filled with bg color in next step)

        const centerHole = this.add.graphics();
        centerHole.fillStyle(0x1a1a2e, 1);
        centerHole.fillCircle(0, 0, 5);

        container.add([circle, gear, centerHole]);
        container.setSize(radius * 2, radius * 2);

        // Interactive
        const hitArea = new Phaser.Geom.Circle(25, 25, radius);
        container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        container.input!.cursor = 'pointer';

        container.on("pointerover", () => {
            circle.lineStyle(2, 0x3b82f6, 1);
            circle.strokeCircle(0, 0, radius);
            this.tweens.add({ targets: gear, angle: 90, duration: 500, ease: "Back.easeOut" });
        });

        container.on("pointerout", () => {
            circle.lineStyle(2, 0x4b5563, 1);
            circle.strokeCircle(0, 0, radius);
            this.tweens.add({ targets: gear, angle: 0, duration: 500, ease: "Back.easeOut" });
        });

        container.on("pointerdown", () => {
            this.toggleSettingsMenu();
        });
    }

    private createSettingsMenu(): void {
        const width = 280;
        const height = 180;

        // Position menu above the button (bottom-left area)
        const x = 50 + width / 2;
        const y = GAME_DIMENSIONS.HEIGHT - 50 - height / 2 - 20;

        this.settingsContainer = this.add.container(x, y);
        this.settingsContainer.setVisible(false);
        this.settingsContainer.setDepth(2001); // Higher than button

        // Menu Background
        const bg = this.add.graphics();
        bg.fillStyle(0x0f172a, 0.95);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
        bg.lineStyle(1, 0x334155, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
        this.settingsContainer.add(bg);

        // Header
        const title = this.add.text(0, -70, "AUDIO SETTINGS", {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#9ca3af",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.settingsContainer.add(title);

        // BGM Volume Slider
        this.bgmSlider = this.createVolumeSlider(0, -30, "Music", this.bgmVolume, (value) => {
            this.bgmVolume = value;
            this.applyBgmVolume();
            this.saveAudioSettings();
        });
        this.settingsContainer.add(this.bgmSlider);

        // SFX Volume Slider
        this.sfxSlider = this.createVolumeSlider(0, 15, "SFX", this.sfxVolume, (value) => {
            this.sfxVolume = value;
            this.saveAudioSettings();
            // Play a test sound when adjusting
            this.playSFX("sfx_click");
        });
        this.settingsContainer.add(this.sfxSlider);

        // Close button
        const closeBtn = this.add.text(0, 60, "CLOSE", {
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#6b7280"
        }).setOrigin(0.5);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on("pointerover", () => closeBtn.setColor("#ffffff"));
        closeBtn.on("pointerout", () => closeBtn.setColor("#6b7280"));
        closeBtn.on("pointerdown", () => this.toggleSettingsMenu());
        this.settingsContainer.add(closeBtn);
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

        // Clear narrative text from previous round
        this.narrativeText.setText("").setAlpha(0);

        // Show Power Surge cards first, then countdown
        this.showPowerSurgeCards(this.currentWave).then(() => {
            // IMMEDIATELY apply stun effects from Power Surge cards
            // This ensures stunned players see the effect before the selection phase
            this.applyImmediateSurgeEffects();

            this.playSFX("sfx_cd_fight");
            this.time.delayedCall(300, () => this.showCountdown(3));
        });
    }

    /**
     * Show Power Surge card selection UI.
     * Uses precomputed deck and AI selection for this wave.
     */
    private async showPowerSurgeCards(waveNumber: number): Promise<void> {
        // Avoid showing twice for the same wave
        if (this.surgeCardsShownThisWave && this.lastSurgeWave === waveNumber) {
            console.log("[SurvivalScene] Power Surge already shown for this wave");
            return;
        }

        this.surgeCardsShownThisWave = true;
        this.lastSurgeWave = waveNumber;

        // Get precomputed deck and AI selection
        const cardIds = this.precomputedDecks.get(waveNumber);
        const aiSelection = this.precomputedAISelections.get(waveNumber);

        if (!cardIds || cardIds.length === 0 || !aiSelection) {
            console.log("[SurvivalScene] No surge cards for this wave");
            return;
        }

        console.log(`[SurvivalScene] Showing Power Surge cards for wave ${waveNumber}:`, cardIds);
        console.log(`[SurvivalScene] AI pre-selected: ${aiSelection}`);

        return new Promise((resolve) => {
            // Calculate deadline (10 seconds from now)
            const deadline = Date.now() + 10000;

            this.powerSurgeUI = new OfflinePowerSurgeCards({
                scene: this,
                roundNumber: waveNumber,
                cardIds,
                aiSelectedCardId: aiSelection,
                deadline,
                onCardSelected: (cardId: PowerSurgeCardId) => {
                    console.log(`[SurvivalScene] Player selected surge: ${cardId}`);
                    this.activeSurges.player1 = cardId;
                },
                onTimeout: () => {
                    console.log("[SurvivalScene] Power Surge selection timed out");
                },
                onClose: (playerSelection: PowerSurgeCardId | null, aiSelectionId: PowerSurgeCardId) => {
                    this.powerSurgeUI = undefined;

                    // Store active surges
                    this.activeSurges.player1 = playerSelection;
                    this.activeSurges.player2 = aiSelectionId;

                    // Show AI's selection reveal
                    if (aiSelectionId) {
                        const card = getPowerSurgeCard(aiSelectionId);
                        if (card) {
                            console.log(`[SurvivalScene] AI surge: ${card.name}`);
                            this.showSurgeCardReveal("player2", aiSelectionId);
                        }
                    }

                    // Show player's selection reveal (if selected)
                    if (playerSelection) {
                        const card = getPowerSurgeCard(playerSelection);
                        if (card) {
                            this.showSurgeCardReveal("player1", playerSelection);
                        }
                    }

                    resolve();
                },
            });
        });
    }

    /**
     * Show a card reveal popup above the character's head.
     * Replaces the old text-only reveal.
     */
    private showSurgeCardReveal(player: "player1" | "player2", cardId: PowerSurgeCardId): void {
        const card = getPowerSurgeCard(cardId);
        if (!card) return;

        const targetSprite = player === "player1" ? this.player1Sprite : this.player2Sprite;
        if (!targetSprite) return;

        // Create container above character
        // Use PowerSurgeCardView for unified design
        const container = PowerSurgeCardView.create({
            scene: this,
            card,
            x: targetSprite.x,
            y: targetSprite.y - 280,
            scale: 0.7,
        });

        container.setDepth(2000); // Higher than standard UI but lower than overlays
        container.setScale(0); // Start hidden for pop-up

        // "AI SURGE" or "YOUR SURGE" label
        const isOpponent = player === "player2";
        const labelText = isOpponent ? "AI SURGE" : "YOUR SURGE";
        const labelColor = isOpponent ? "#ef4444" : "#22c55e"; // Red for AI in survival

        const label = this.add.text(0, -PowerSurgeCardView.CARD_HEIGHT / 2 - 30, labelText, {
            fontFamily: "monospace",
            fontSize: "20px",
            color: labelColor,
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4,
        });
        label.setOrigin(0.5);
        container.add(label);

        // Animation: Pop in
        this.tweens.add({
            targets: container,
            scaleX: 0.7,
            scaleY: 0.7,
            duration: 500,
            ease: "Back.easeOut",
            onComplete: () => {
                // Hold for 5 seconds
                this.time.delayedCall(5000, () => {
                    if (container && container.active) {
                        // Fade out
                        this.tweens.add({
                            targets: container,
                            alpha: 0,
                            y: container.y - 50,
                            duration: 500,
                            onComplete: () => container.destroy(),
                        });
                    }
                });
            },
        });

        // Apply particles
        this.applySurgeVisualEffect(player, card);
    }

    /**
     * Apply visual glow effect to a character sprite when surge is active.
     */
    private applySurgeVisualEffect(player: "player1" | "player2", card: { glowColor: number }): void {
        const sprite = player === "player1" ? this.player1Sprite : this.player2Sprite;
        const tintColor = card.glowColor;

        // Flash effect (matching FightScene)
        this.tweens.add({
            targets: sprite,
            tint: tintColor,
            duration: 200,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                // Keep a subtle persistent tint for the round
                sprite.setTint(Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.IntegerToColor(0xffffff),
                    Phaser.Display.Color.IntegerToColor(tintColor),
                    100,
                    20 // 20% blend
                ).color);
            },
        });

        // Particle burst at character position
        this.createSurgeParticles(sprite.x, sprite.y, tintColor);
    }

    private createSurgeParticles(x: number, y: number, color: number): void {
        for (let i = 0; i < 15; i++) {
            const particle = this.add.graphics();
            particle.fillStyle(color, 1);
            particle.fillCircle(0, 0, 3 + Math.random() * 3);
            particle.setPosition(x, y);
            particle.setDepth(500);

            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            const targetX = x + Math.cos(angle) * speed;
            const targetY = y + Math.sin(angle) * speed - 50; // Upward bias

            this.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scale: 0,
                duration: 600 + Math.random() * 400,
                ease: "Quad.easeOut",
                onComplete: () => particle.destroy(),
            });
        }
    }

    /**
     * Apply immediate stun effects from Power Surge cards.
     * This is called BEFORE the countdown starts to ensure stunned players
     * see the effect and have their buttons disabled immediately.
     */
    private applyImmediateSurgeEffects(): void {
        // Calculate surge effects
        const surgeResults = calculateSurgeEffects(this.activeSurges.player1, this.activeSurges.player2);
        const p1Mods = surgeResults.player1Modifiers;
        const p2Mods = surgeResults.player2Modifiers;

        // Apply stun to combat engine state immediately
        // The visual effects will be shown when startSelectionPhase() is called
        // Player 1's surge can stun Player 2, and vice versa
        if (shouldStunOpponent(p1Mods)) {
            // Player 1 picked a stun card (like Mempool Congest) -> stun Player 2 (AI)
            this.combatEngine.setPlayerStunned("player2", true);
            console.log("[SurvivalScene] AI is stunned by player's Mempool Congest");
        }
        if (shouldStunOpponent(p2Mods)) {
            // Player 2 (AI) picked a stun card -> stun Player 1
            this.combatEngine.setPlayerStunned("player1", true);
            console.log("[SurvivalScene] Player is stunned by AI's Mempool Congest");
        }
    }

    /**
     * Show stun visual effect on a player (red pulsing tint).
     * This is called during selection phase when a player is stunned.
     */
    private showStunVisualEffect(player: "player1" | "player2"): void {
        const sprite = player === "player1" ? this.player1Sprite : this.player2Sprite;

        // Stop any existing stun tween for this player
        const existingTween = this.stunTweens.get(player);
        if (existingTween) {
            existingTween.stop();
        }

        // Red pulsing tint effect - store reference for cleanup
        const tween = this.tweens.add({
            targets: sprite,
            tint: 0xff4444,
            yoyo: true,
            repeat: -1,
            duration: 300,
            ease: "Sine.easeInOut",
        });
        this.stunTweens.set(player, tween);
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

        // Clear stun visual effects for players who are no longer stunned
        // This happens after a stunned turn completes
        if (!state.player1.isStunned) {
            const p1Tween = this.stunTweens.get("player1");
            if (p1Tween) {
                p1Tween.stop();
                this.stunTweens.delete("player1");
                this.player1Sprite.clearTint();
            }
        }
        if (!state.player2.isStunned) {
            const p2Tween = this.stunTweens.get("player2");
            if (p2Tween) {
                p2Tween.stop();
                this.stunTweens.delete("player2");
                this.player2Sprite.clearTint();
            }
        }

        // Check if BOTH players are stunned
        if (state.player1.isStunned && state.player2.isStunned) {
            // Both stunned - show message, disable buttons, and resolve immediately
            this.turnIndicatorText.setText("BOTH PLAYERS STUNNED!").setColor("#ff4444");
            this.roundTimerText.setText("---");
            this.roundTimerText.setColor("#ff4444");

            // Show narrative explaining what's happening
            this.narrativeText.setText("Both players are stunned!\nSkipping this turn...");
            this.narrativeText.setAlpha(1);
            this.narrativeText.setColor("#ff4444");

            // Show stun visual effects on both players
            this.showStunVisualEffect("player1");
            this.showStunVisualEffect("player2");

            // Disable all buttons visually
            this.moveButtons.forEach(btn => {
                btn.setAlpha(0.3);
                btn.disableInteractive();
                btn.list.forEach((child: any) => {
                    if (child.setTint) child.setTint(0x555555);
                });
            });

            // Flash the stun message
            this.tweens.add({
                targets: this.turnIndicatorText,
                alpha: { from: 1, to: 0.5 },
                duration: 300,
                yoyo: true,
                repeat: 3,
            });

            // Resolve after 2.5 seconds to let players see the stun effect
            this.time.delayedCall(2500, () => {
                // Fade out narrative
                this.tweens.add({
                    targets: this.narrativeText,
                    alpha: 0,
                    duration: 500
                });
                // Both stunned - use 'stunned' move for both
                this.resolveRound("stunned", "stunned");
            });
            return;
        }

        // Check if only player is stunned
        if (state.player1.isStunned) {
            // Player is stunned - show message and disable buttons
            this.turnIndicatorText.setText("YOU ARE STUNNED!").setColor("#ff4444");
            this.roundTimerText.setColor("#ff4444");

            // Show narrative explaining what's happening
            this.narrativeText.setText("You are stunned and cannot act this turn!");
            this.narrativeText.setAlpha(1);
            this.narrativeText.setColor("#ff4444");

            // Show persistent visual stun effect on player
            this.showStunVisualEffect("player1");

            // Disable all buttons visually
            this.moveButtons.forEach(btn => {
                btn.setAlpha(0.3);
                btn.disableInteractive();
                btn.list.forEach((child: any) => {
                    if (child.setTint) child.setTint(0x555555);
                });
            });

            // Flash the stun message
            this.tweens.add({
                targets: this.turnIndicatorText,
                alpha: { from: 1, to: 0.5 },
                duration: 300,
                yoyo: true,
                repeat: 3,
            });

            // AI makes its decision after 2 seconds (player can't act)
            const thinkTime = Math.max(2000, getAIThinkTime(this.waves[this.currentWave - 1].difficulty));
            this.time.delayedCall(thinkTime, () => {
                // Fade out narrative
                this.tweens.add({
                    targets: this.narrativeText,
                    alpha: 0,
                    duration: 500
                });

                // Update AI context with stunned state before deciding
                this.ai.updateContext({
                    botHealth: state.player2.hp,
                    botMaxHealth: state.player2.maxHp,
                    botEnergy: state.player2.energy,
                    botMaxEnergy: state.player2.maxEnergy,
                    botGuardMeter: state.player2.guardMeter,
                    botIsStunned: state.player2.isStunned || false,
                    botIsStaggered: state.player2.isStaggered || false,
                    opponentHealth: state.player1.hp,
                    opponentMaxHealth: state.player1.maxHp,
                    opponentEnergy: state.player1.energy,
                    opponentMaxEnergy: state.player1.maxEnergy,
                    opponentGuardMeter: state.player1.guardMeter,
                    opponentIsStunned: true,
                    opponentIsStaggered: state.player1.isStaggered || false,
                    roundNumber: state.currentRound,
                    turnNumber: state.currentTurn,
                    botRoundsWon: state.player2.roundsWon,
                    opponentRoundsWon: state.player1.roundsWon
                });
                const decision = this.ai.decide();
                const aiMove = decision.move;
                // Player is stunned - use 'stunned' move
                this.resolveRound("stunned", aiMove);
            });
            return;
        }

        // Check if only AI is stunned
        if (state.player2.isStunned) {
            // AI is stunned - show message
            this.turnIndicatorText.setText("OPPONENT IS STUNNED!").setColor("#22c55e");
            this.roundTimerText.setColor("#ef4444");

            // Show narrative
            this.narrativeText.setText("Your opponent is stunned!\nChoose your move wisely!");
            this.narrativeText.setAlpha(1);
            this.narrativeText.setColor("#22c55e");

            // Fade out narrative after 2 seconds
            this.tweens.add({
                targets: this.narrativeText,
                alpha: 0,
                delay: 2000,
                duration: 500
            });

            // Show persistent visual stun effect on AI
            this.showStunVisualEffect("player2");

            // Player can still select their move normally
            // Fall through to normal selection phase below
        }

        // Normal selection phase (player can select move - either both not stunned or only AI is stunned)
        if (!state.player2.isStunned) {
            this.turnIndicatorText.setText("Select your move!").setColor("#888888");
        }
        // If we already set the text above for AI stunned case, keep it

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
            botHealth: state.player2.hp,
            botMaxHealth: state.player2.maxHp,
            botEnergy: state.player2.energy,
            botMaxEnergy: state.player2.maxEnergy,
            botGuardMeter: state.player2.guardMeter,
            botIsStunned: state.player2.isStunned || false,
            botIsStaggered: state.player2.isStaggered || false,
            opponentHealth: state.player1.hp,
            opponentMaxHealth: state.player1.maxHp,
            opponentEnergy: state.player1.energy,
            opponentMaxEnergy: state.player1.maxEnergy,
            opponentGuardMeter: state.player1.guardMeter,
            opponentIsStunned: state.player1.isStunned || false,
            opponentIsStaggered: state.player1.isStaggered || false,
            roundNumber: state.currentRound,
            turnNumber: state.currentTurn,
            botRoundsWon: state.player2.roundsWon,
            opponentRoundsWon: state.player1.roundsWon
        });
    }

    private updateMoveButtonAffordability(): void {
        // Check if player is stunned
        const state = this.combatEngine.getState();
        const isStunned = state.player1.isStunned || false;

        // If stunned, disable all buttons
        if (isStunned) {
            (["punch", "kick", "block", "special"] as MoveType[]).forEach((move) => {
                const container = this.moveButtons.get(move);
                if (container) {
                    container.setAlpha(0.3);
                    container.disableInteractive();
                    container.list.forEach((child: any) => {
                        if (child.setTint) child.setTint(0x555555);
                    });
                }
            });
            return;
        }

        // Check if block is disabled due to opponent's surge effect (e.g., Pruned Rage)
        const surgeEffects = calculateSurgeEffects(this.activeSurges.player1, this.activeSurges.player2);
        const blockDisabled = isBlockDisabled(surgeEffects.player1Modifiers, surgeEffects.player2Modifiers);

        (["punch", "kick", "block", "special"] as MoveType[]).forEach((move) => {
            const canAfford = this.combatEngine.canAffordMove("player1", move);
            const container = this.moveButtons.get(move);
            if (container) {
                // Check if this specific move should be disabled
                const shouldDisable = !canAfford || (move === "block" && blockDisabled);

                if (shouldDisable) {
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
        // Check if player is stunned - cannot select moves when stunned
        const state = this.combatEngine.getState();
        if (state.player1.isStunned) {
            this.showFloatingText("You are stunned!", GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.HEIGHT - 150, "#ff4444");
            return;
        }

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
            botHealth: state.player2.hp,
            botMaxHealth: state.player2.maxHp,
            botEnergy: state.player2.energy,
            botMaxEnergy: state.player2.maxEnergy,
            botGuardMeter: state.player2.guardMeter,
            botIsStunned: state.player2.isStunned || false,
            botIsStaggered: state.player2.isStaggered || false,
            opponentHealth: state.player1.hp,
            opponentMaxHealth: state.player1.maxHp,
            opponentEnergy: state.player1.energy,
            opponentMaxEnergy: state.player1.maxEnergy,
            opponentGuardMeter: state.player1.guardMeter,
            opponentIsStunned: state.player1.isStunned || false,
            opponentIsStaggered: state.player1.isStaggered || false,
            roundNumber: state.currentRound,
            turnNumber: state.currentTurn,
            botRoundsWon: state.player2.roundsWon,
            opponentRoundsWon: state.player1.roundsWon
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
        // Pass active surge effects so they are applied during combat resolution
        const turnResult = this.combatEngine.resolveTurn(
            playerMove,
            aiMove,
            this.activeSurges.player1,
            this.activeSurges.player2
        );
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
        } else if (p1WasStunned) {
            // Stunned player stays in idle and shows stun effect
            if (this.anims.exists(`${p1Char}_idle`)) {
                const p1IdleScale = getAnimationScale(p1Char, 'idle');
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
        if (!p2WasStunned && this.anims.exists(`${p2Char}_run`)) {
            const p2RunScale = getAnimationScale(p2Char, 'run');
            this.player2Sprite.setScale(p2RunScale);
            this.player2Sprite.play(`${p2Char}_run`);
        } else if (p2WasStunned) {
            // Stunned player stays in idle and shows stun effect
            if (this.anims.exists(`${p2Char}_idle`)) {
                const p2IdleScale = getAnimationScale(p2Char, 'idle');
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
                        } else if (turnResult.player2.outcome === "missed") {
                            // Show DODGE! text when Hash Hurricane triggers (attack dodged)
                            this.time.delayedCall(300, () => {
                                this.showFloatingText("DODGE!", p2OriginalX - 50, CHARACTER_POSITIONS.PLAYER2.Y - 130, "#8800ff");
                            });
                        }

                        // Show energy drain effect from surge (e.g., GhostDAG, Vaultbreaker)
                        if (turnResult.player2.energyDrained && turnResult.player2.energyDrained > 0) {
                            this.time.delayedCall(500, () => {
                                this.showFloatingText(
                                    `-${Math.round(turnResult.player2.energyDrained!)} EN`,
                                    p2OriginalX - 50,
                                    CHARACTER_POSITIONS.PLAYER2.Y - 100,
                                    "#3b82f6"
                                );
                            });
                        }

                        // Show HP regen effect if P1 healed (from Blue Set Heal or lifesteal)
                        const p1TotalHeal = (turnResult.player1.hpRegen || 0) + (turnResult.player1.lifesteal || 0);
                        if (p1TotalHeal > 0) {
                            this.time.delayedCall(700, () => {
                                this.showFloatingText(
                                    `+${Math.round(p1TotalHeal)} HP`,
                                    p1OriginalX + 50,
                                    CHARACTER_POSITIONS.PLAYER1.Y - 100,
                                    "#00ff88"
                                );
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
                        } else if (turnResult.player1.outcome === "missed") {
                            // Show DODGE! text when Hash Hurricane triggers (attack dodged)
                            this.time.delayedCall(300, () => {
                                this.showFloatingText("DODGE!", p1OriginalX + 50, CHARACTER_POSITIONS.PLAYER1.Y - 130, "#8800ff");
                            });
                        }

                        // Show energy drain effect from surge (e.g., GhostDAG, Vaultbreaker)
                        if (turnResult.player1.energyDrained && turnResult.player1.energyDrained > 0) {
                            this.time.delayedCall(500, () => {
                                this.showFloatingText(
                                    `-${Math.round(turnResult.player1.energyDrained!)} EN`,
                                    p1OriginalX + 50,
                                    CHARACTER_POSITIONS.PLAYER1.Y - 100,
                                    "#3b82f6"
                                );
                            });
                        }

                        // Show HP regen effect if P2 healed (from Blue Set Heal or lifesteal)
                        const p2TotalHeal = (turnResult.player2.hpRegen || 0) + (turnResult.player2.lifesteal || 0);
                        if (p2TotalHeal > 0) {
                            this.time.delayedCall(700, () => {
                                this.showFloatingText(
                                    `+${Math.round(p2TotalHeal)} HP`,
                                    p2OriginalX - 50,
                                    CHARACTER_POSITIONS.PLAYER2.Y - 100,
                                    "#00ff88"
                                );
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
        const isDraw = state.roundWinner === null;
        const isWin = state.roundWinner === "player1";

        if (isDraw) {
            // Both players dead - play death animation on both
            const p1DeadScale = getAnimationScale(this.playerCharacter.id, "dead");
            const p2DeadScale = getAnimationScale(this.currentOpponent.id, "dead");

            if (this.anims.exists(`${this.playerCharacter.id}_dead`)) {
                this.player1Sprite.setScale(p1DeadScale);
                this.player1Sprite.play(`${this.playerCharacter.id}_dead`);
            }
            if (this.anims.exists(`${this.currentOpponent.id}_dead`)) {
                this.player2Sprite.setScale(p2DeadScale);
                this.player2Sprite.play(`${this.currentOpponent.id}_dead`);
            }
        } else {
            // Normal round end - loser already has death animation playing from resolveRound
            // Don't replay it, just identify winner and loser for celebration
            const loser = state.roundWinner === "player1" ? "player2" : "player1";
            const winner = state.roundWinner === "player1" ? "player1" : "player2";
            const winnerChar = winner === "player1" ? this.playerCharacter.id : this.currentOpponent.id;
            const winnerSprite = winner === "player1" ? this.player1Sprite : this.player2Sprite;

            // Set winner to idle animation before jumping
            if (this.anims.exists(`${winnerChar}_idle`)) {
                winnerSprite.setScale(getAnimationScale(winnerChar, "idle"));
                winnerSprite.play(`${winnerChar}_idle`);
            }

            // Victory celebration jump animation for the winner
            this.tweens.add({
                targets: winnerSprite,
                y: winnerSprite.y - 30,
                duration: 500,
                yoyo: true,
                repeat: 2,
                ease: "Sine.easeOut",
            });
        }

        // Wait 1s after death animation started, then show result text
        this.time.delayedCall(1000, () => {
            if (isDraw) {
                this.countdownText.setText("DRAW - BOTH KO!").setColor("#fbbf24").setAlpha(1);
            } else {
                this.countdownText.setText(isWin ? "ROUND WON!" : "ROUND LOST!").setColor(isWin ? "#22c55e" : "#ef4444").setAlpha(1);
            }
            this.time.delayedCall(2000, () => {
                this.countdownText.setAlpha(0);

                // Re-check state to see if match is now over
                const currentState = this.combatEngine.getState();

                // Check if this was a draw (both KO'd) - rematch with same opponent
                if (isDraw) {
                    // Reset the combat engine for a rematch with the same opponent
                    this.combatEngine = new CombatEngine(this.playerCharacter.id, this.currentOpponent.id, "best_of_1");
                    this.syncUIWithCombatState();
                    // Clear surge effects
                    this.clearSurgeEffects();
                    // Reset sprites to idle
                    this.resetCharacterSprites();
                    // Start new wave (rematch)
                    this.startWave();
                } else if (currentState.isMatchOver) {
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
        // Clear active surges from previous wave
        this.clearSurgeEffects();

        this.currentWave++;
        const wave = this.waves[this.currentWave - 1];
        this.currentOpponent = getCharacter(wave.characterId) ?? CHARACTER_ROSTER[0];
        this.ai = new SmartBotOpponent();
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

    /**
     * Clear surge effects at end of wave.
     */
    private clearSurgeEffects(): void {
        this.activeSurges = { player1: null, player2: null };
        this.surgeCardsShownThisWave = false;

        // Stop all stun tweens
        this.stunTweens.forEach((tween, player) => {
            tween.stop();
        });
        this.stunTweens.clear();

        // Clear any visual tints
        this.player1Sprite.clearTint();
        this.player2Sprite.clearTint();
    }

    /**
     * Reset character sprites to idle animations and positions.
     */
    private resetCharacterSprites(): void {
        const p1Char = this.playerCharacter.id;
        const p2Char = this.currentOpponent.id;

        // Use centralized scaling from sprite-config.ts
        const p1Scale = getAnimationScale(p1Char, "idle");
        const p2Scale = getAnimationScale(p2Char, "idle");

        // Reset position to original
        this.player1Sprite.setX(CHARACTER_POSITIONS.PLAYER1.X);
        this.player2Sprite.setX(CHARACTER_POSITIONS.PLAYER2.X);

        // Apply correct scales
        this.player1Sprite.setScale(p1Scale);
        if (this.anims.exists(`${p1Char}_idle`)) this.player1Sprite.play(`${p1Char}_idle`);

        this.player2Sprite.setScale(p2Scale);
        if (this.anims.exists(`${p2Char}_idle`)) this.player2Sprite.play(`${p2Char}_idle`);
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

        this.playSFX(isVictory ? "sfx_victory" : "sfx_defeat");

        // Play dead animation on AI if player lost
        if (!isVictory) {
            const deadScale = getAnimationScale(this.currentOpponent.id, "dead");
            if (this.anims.exists(`${this.playerCharacter.id}_dead`)) {
                this.player1Sprite.setScale(getAnimationScale(this.playerCharacter.id, "dead"));
                this.player1Sprite.play(`${this.playerCharacter.id}_dead`);
            }
        }

        // Victory celebration jump animation for the player when winning
        if (isVictory) {
            this.tweens.add({
                targets: this.player1Sprite,
                y: this.player1Sprite.y - 30,
                duration: 500,
                yoyo: true,
                repeat: 2,
                ease: "Sine.easeOut",
            });
        }

        // Delay emitting event and showing overlay to let animations complete
        const overlayDelay = 5000;
        this.time.delayedCall(overlayDelay, () => {
            EventBus.emit("survival_ended", result);
            this.createResultOverlay(result);
        });
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

    /**
     * Create a volume slider control.
     */
    private createVolumeSlider(
        x: number,
        y: number,
        label: string,
        initialValue: number,
        onChange: (value: number) => void
    ): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        const sliderWidth = 140;
        const sliderHeight = 8;
        const knobRadius = 10;

        // Label
        const labelText = this.add.text(-120, 0, label, {
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#9ca3af"
        }).setOrigin(0, 0.5);
        container.add(labelText);

        // Track start X
        const trackOffsetX = 10;
        const trackStartX = -sliderWidth / 2 + trackOffsetX;

        // Track background
        const trackBg = this.add.graphics();
        trackBg.fillStyle(0x1e293b, 1);
        trackBg.fillRoundedRect(trackStartX, -sliderHeight / 2, sliderWidth, sliderHeight, 4);
        container.add(trackBg);

        // Track fill (progress)
        const trackFill = this.add.graphics();
        container.add(trackFill);

        // Knob
        const knob = this.add.graphics();
        container.add(knob);

        // Percentage text
        const percentText = this.add.text(sliderWidth / 2 + 25, 0, `${Math.round(initialValue * 100)}%`, {
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#6b7280"
        }).setOrigin(0, 0.5);
        container.add(percentText);

        // Update visual based on value
        const updateSliderVisual = (value: number) => {
            const fillWidth = sliderWidth * value;
            const knobX = trackStartX + fillWidth;

            trackFill.clear();
            trackFill.fillStyle(0x3b82f6, 1);
            trackFill.fillRoundedRect(trackStartX, -sliderHeight / 2, fillWidth, sliderHeight, 4);

            knob.clear();
            knob.fillStyle(0x3b82f6, 1);
            knob.fillCircle(knobX, 0, knobRadius);
            knob.fillStyle(0x1e40af, 1);
            knob.fillCircle(knobX, 0, knobRadius - 3);

            percentText.setText(`${Math.round(value * 100)}%`);
        };

        updateSliderVisual(initialValue);

        // Make the entire track area interactive
        const hitArea = this.add.rectangle(0, 0, 240, 30, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        container.add(hitArea);

        // Drag handling
        let isDragging = false;

        const calculateValue = (pointerX: number): number => {
            const localX = pointerX - container.x - this.settingsContainer.x;
            const trackEndX = trackStartX + sliderWidth;
            const clampedX = Phaser.Math.Clamp(localX, trackStartX, trackEndX);
            return (clampedX - trackStartX) / sliderWidth;
        };

        hitArea.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            isDragging = true;
            const newValue = calculateValue(pointer.x);
            updateSliderVisual(newValue);
            onChange(newValue);
        });

        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if (isDragging) {
                const newValue = calculateValue(pointer.x);
                updateSliderVisual(newValue);
                onChange(newValue);
            }
        });

        this.input.on("pointerup", () => {
            isDragging = false;
        });

        return container;
    }

    private exitSurvival(): void {
        EventBus.off("survival_exit");
        EventBus.emit("survival_exit_complete");
    }

    /**
     * Get active surge effects for combat resolution.
     */
    public getActiveSurgeEffects(): {
        player1: PowerSurgeCardId | null;
        player2: PowerSurgeCardId | null;
    } {
        return { ...this.activeSurges };
    }
}
