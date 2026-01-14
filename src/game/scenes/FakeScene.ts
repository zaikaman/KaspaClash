/**
 * FakeScene - Animation Testing Scene
 * Used to test character animations and manually adjust scale values
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { GAME_DIMENSIONS, CHARACTER_POSITIONS } from "../config";
import { CHAR_SPRITE_CONFIG, getAnimationScale, getCharacterYOffset, getSoundDelay, getSFXKey } from "../config/sprite-config";

// All available characters
const ALL_CHARACTERS = [
    "aeon-guard", "bastion-hulk", "block-bruiser", "chrono-drifter",
    "cyber-ninja", "cyber-paladin", "dag-warrior", "gene-smasher",
    "hash-hunter", "heavy-loader", "kitsune-09", "nano-brawler",
    "neon-wraith", "prism-duelist", "razor-bot-7", "scrap-goliath",
    "sonic-striker", "technomancer", "viperblade", "void-reaper"
];

const ANIMATIONS = ["idle", "run", "punch", "kick", "block", "special", "dead"];
const BASE_CHARS = ["cyber-ninja", "block-bruiser", "dag-warrior", "hash-hunter"];

export class FakeScene extends Phaser.Scene {
    // Sprites
    private player1Sprite!: Phaser.GameObjects.Sprite;
    private player2Sprite!: Phaser.GameObjects.Sprite;

    // Current characters
    private p1CharIndex: number = 2; // block-bruiser
    private p2CharIndex: number = 4; // cyber-ninja

    // Current scale (manually adjustable)
    private currentScale: number = 1.0;
    private scaleText!: Phaser.GameObjects.Text;
    private charNameText!: Phaser.GameObjects.Text;
    private animNameText!: Phaser.GameObjects.Text;
    private currentAnim: string = "idle";

    // Y offset (manually adjustable)
    private currentYOffset: number = 0;
    private yOffsetText!: Phaser.GameObjects.Text;

    // Audio Delay Tool
    private soundDelay: number = 0; // ms
    private soundDelayText!: Phaser.GameObjects.Text;
    private debugText!: Phaser.GameObjects.Text;

    // UI
    private buttonContainer!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: "FakeScene" });
    }

    preload(): void {
        // Show loading progress
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(390, 280, 320, 50);

        const loadingText = this.add.text(512, 260, 'Loading...', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ffff, 1);
            progressBar.fillRect(400, 290, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Load arena background
        this.load.image("arena-bg", "/assets/background_2.webp");

        // Load Placeholder SFX (Cyber Ninja) and other base characters
        BASE_CHARS.forEach(charId => {
            this.load.audio(`sfx_${charId}_punch`, `/assets/audio/${charId}-punch.mp3`);
            this.load.audio(`sfx_${charId}_kick`, `/assets/audio/${charId}-kick.mp3`);
            this.load.audio(`sfx_${charId}_special`, `/assets/audio/${charId}-special.mp3`);
        });

        // Specific additional SFX
        this.load.audio("sfx_nano-brawler_punch", "/assets/audio/nano-brawler-punch.mp3");
        this.load.audio("sfx_neon-wraith_special", "/assets/audio/neon-wraith-special.mp3");
        this.load.audio("sfx_prism-duelist_special", "/assets/audio/prism-duelist-special.mp3");
        this.load.audio("sfx_razor-bot-7_punch", "/assets/audio/razor-bot-7-punch.mp3");
        this.load.audio("sfx_razor-bot-7_special", "/assets/audio/razor-bot-7-special.mp3");
        this.load.audio("sfx_scrap-goliath_special", "/assets/audio/scrap-goliath-special.mp3");
        this.load.audio("sfx_sonic-striker_punch", "/assets/audio/sonic-striker-punch.mp3");
        this.load.audio("sfx_sonic-striker_special", "/assets/audio/sonic-striker-special.mp3");
        this.load.audio("sfx_void-reaper_special", "/assets/audio/void-reaper-special.mp3");
        this.load.audio("sfx_aeon-guard_special", "/assets/audio/aeon-guard-special.mp3");
        this.load.audio("sfx_bastion-hulk_special", "/assets/audio/bastion-hulk-special.mp3");

        // Load character spritesheets for initial characters only
        const animations = ["idle", "run", "punch", "kick", "block", "special", "dead"];
        const initialCharactersToLoad = [
            ALL_CHARACTERS[this.p1CharIndex],
            ALL_CHARACTERS[this.p2CharIndex]
        ];

        initialCharactersToLoad.forEach((charId) => {
            const charConfig = CHAR_SPRITE_CONFIG[charId];
            if (!charConfig) return;

            animations.forEach((anim) => {
                const animConfig = charConfig[anim];
                if (!animConfig) return;

                this.load.spritesheet(
                    `char_${charId}_${anim}`,
                    `/characters/${charId}/${anim}.webp`,
                    { frameWidth: animConfig.frameWidth, frameHeight: animConfig.frameHeight }
                );
            });
        });
    }

    create(): void {
        // Background
        const bg = this.add.image(
            GAME_DIMENSIONS.CENTER_X,
            GAME_DIMENSIONS.CENTER_Y,
            "arena-bg"
        );
        bg.setDisplaySize(GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);

        // Create animations for all characters
        this.createAnimations();

        // Title
        this.add.text(GAME_DIMENSIONS.CENTER_X, 30, "ANIMATION TESTING SCENE", {
            fontSize: "24px",
            fontFamily: "Arial Black",
            color: "#00ffff",
        }).setOrigin(0.5);

        // Instructions
        this.add.text(GAME_DIMENSIONS.CENTER_X, 60, "Press < > to switch P1 character | +/- to adjust scale | Click buttons for animations", {
            fontSize: "14px",
            fontFamily: "Arial",
            color: "#ffffff",
        }).setOrigin(0.5);

        // Create character sprites
        this.createCharacterSprites();

        // Create UI
        this.createUI();
        this.createAnimationButtons();
        this.createScaleControls();
        this.createCharacterSwitcher();

        // Keyboard controls
        this.input.keyboard!.on("keydown-LEFT", () => this.switchCharacter(-1));
        this.input.keyboard!.on("keydown-RIGHT", () => this.switchCharacter(1));
        this.input.keyboard!.on("keydown-PLUS", () => this.adjustScale(0.05));
        this.input.keyboard!.on("keydown-MINUS", () => this.adjustScale(-0.05));
        this.input.keyboard!.on("keydown-EQUAL", () => this.adjustScale(0.05)); // = key (same as +)

        // Back button
        this.createBackButton();

        EventBus.emit("current-scene-ready", this);
    }

    private createAnimations(): void {
        ALL_CHARACTERS.forEach((charId) => {
            ANIMATIONS.forEach((animType) => {
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
        });
    }

    private createCharacterSprites(): void {
        const p1Char = ALL_CHARACTERS[this.p1CharIndex];
        const p2Char = ALL_CHARACTERS[this.p2CharIndex];

        // Player 1 sprite (left side)
        const p1BaseY = CHARACTER_POSITIONS.PLAYER1.Y - 50;
        const p1ConfigOffset = getCharacterYOffset(p1Char, "idle");

        this.player1Sprite = this.add.sprite(
            CHARACTER_POSITIONS.PLAYER1.X,
            p1BaseY + p1ConfigOffset + this.currentYOffset,
            `char_${p1Char}_idle`
        );

        this.currentScale = getAnimationScale(p1Char, "idle");
        this.player1Sprite.setScale(this.currentScale);
        this.player1Sprite.setOrigin(0.5, 0.5);
        if (this.anims.exists(`${p1Char}_idle`)) {
            this.player1Sprite.play(`${p1Char}_idle`);
        }

        // Player 2 sprite (right side, flipped) - static reference
        const p2BaseY = CHARACTER_POSITIONS.PLAYER2.Y - 50;
        const p2ConfigOffset = getCharacterYOffset(p2Char, "idle");

        this.player2Sprite = this.add.sprite(
            CHARACTER_POSITIONS.PLAYER2.X,
            p2BaseY + p2ConfigOffset,
            `char_${p2Char}_idle`
        );

        const p2Scale = getAnimationScale(p2Char, "idle");
        this.player2Sprite.setScale(p2Scale);
        this.player2Sprite.setOrigin(0.5, 0.5);
        this.player2Sprite.setFlipX(true);
        if (this.anims.exists(`${p2Char}_idle`)) {
            this.player2Sprite.play(`${p2Char}_idle`);
        }
    }

    private createUI(): void {
        const uiY = 100;

        // Character name display
        this.charNameText = this.add.text(CHARACTER_POSITIONS.PLAYER1.X, uiY, ALL_CHARACTERS[this.p1CharIndex], {
            fontSize: "20px",
            fontFamily: "Arial Black",
            color: "#00ff00",
        }).setOrigin(0.5);

        // Current animation display
        this.animNameText = this.add.text(CHARACTER_POSITIONS.PLAYER1.X, uiY + 25, `Animation: idle`, {
            fontSize: "16px",
            fontFamily: "Arial",
            color: "#ffff00",
        }).setOrigin(0.5);

        // Scale display
        this.scaleText = this.add.text(CHARACTER_POSITIONS.PLAYER1.X, uiY + 50, `Scale: ${this.currentScale.toFixed(3)}`, {
            fontSize: "18px",
            fontFamily: "Arial Black",
            color: "#ff00ff",
        }).setOrigin(0.5);

        // Y offset display
        this.yOffsetText = this.add.text(CHARACTER_POSITIONS.PLAYER1.X, uiY + 75, `Y Offset: ${this.currentYOffset}`, {
            fontSize: "18px",
            fontFamily: "Arial Black",
            color: "#00ffaa",
        }).setOrigin(0.5);

        // Sound Delay display
        this.soundDelayText = this.add.text(CHARACTER_POSITIONS.PLAYER1.X, uiY + 100, `Sound Delay: ${this.soundDelay}ms`, {
            fontSize: "18px",
            fontFamily: "Arial Black",
            color: "#ffaa00",
        }).setOrigin(0.5);

        // Right side character info
        this.add.text(CHARACTER_POSITIONS.PLAYER2.X, uiY, ALL_CHARACTERS[this.p2CharIndex], {
            fontSize: "20px",
            fontFamily: "Arial Black",
            color: "#ff6666",
        }).setOrigin(0.5);

        this.add.text(CHARACTER_POSITIONS.PLAYER2.X, uiY + 25, "(Reference: cyber-ninja)", {
            fontSize: "14px",
            fontFamily: "Arial",
            color: "#aaaaaa",
        }).setOrigin(0.5);
    }

    private createAnimationButtons(): void {
        const buttonY = GAME_DIMENSIONS.HEIGHT - 80;
        const buttonWidth = 90;
        const spacing = 100;
        const startX = GAME_DIMENSIONS.CENTER_X - (ANIMATIONS.length * spacing) / 2 + spacing / 2;

        ANIMATIONS.forEach((anim, index) => {
            const x = startX + index * spacing;

            // Button background
            const bg = this.add.rectangle(x, buttonY, buttonWidth, 40, 0x333333)
                .setStrokeStyle(2, 0x00ffff)
                .setInteractive({ useHandCursor: true });

            // Button text
            const text = this.add.text(x, buttonY, anim.toUpperCase(), {
                fontSize: "12px",
                fontFamily: "Arial Black",
                color: "#ffffff",
            }).setOrigin(0.5);

            // Click handler
            bg.on("pointerdown", () => this.playAnimation(anim));
            bg.on("pointerover", () => {
                bg.setFillStyle(0x555555);
                text.setColor("#00ffff");
            });
            bg.on("pointerout", () => {
                bg.setFillStyle(0x333333);
                text.setColor("#ffffff");
            });
        });
    }

    private createScaleControls(): void {
        const controlY = GAME_DIMENSIONS.HEIGHT - 130;
        const centerX = CHARACTER_POSITIONS.PLAYER1.X;

        // Scale adjustment buttons
        const adjustments = [
            { label: "-0.1", value: -0.1, x: centerX - 150 },
            { label: "-0.05", value: -0.05, x: centerX - 80 },
            { label: "-0.01", value: -0.01, x: centerX - 30 },
            { label: "+0.01", value: 0.01, x: centerX + 30 },
            { label: "+0.05", value: 0.05, x: centerX + 80 },
            { label: "+0.1", value: 0.1, x: centerX + 150 },
        ];

        adjustments.forEach(({ label, value, x }) => {
            const bg = this.add.rectangle(x, controlY, 50, 30, 0x444444)
                .setStrokeStyle(1, 0xffffff)
                .setInteractive({ useHandCursor: true });

            this.add.text(x, controlY, label, {
                fontSize: "12px",
                fontFamily: "Arial",
                color: "#ffffff",
            }).setOrigin(0.5);

            bg.on("pointerdown", () => this.adjustScale(value));
            bg.on("pointerover", () => bg.setFillStyle(0x666666));
            bg.on("pointerout", () => bg.setFillStyle(0x444444));
        });

        // Reset scale button
        const resetBg = this.add.rectangle(centerX, controlY + 40, 100, 30, 0x884400)
            .setStrokeStyle(2, 0xff8800)
            .setInteractive({ useHandCursor: true });

        this.add.text(centerX, controlY + 40, "RESET SCALE", {
            fontSize: "12px",
            fontFamily: "Arial Black",
            color: "#ffffff",
        }).setOrigin(0.5);

        resetBg.on("pointerdown", () => this.resetScale());
        resetBg.on("pointerover", () => resetBg.setFillStyle(0xaa6600));
        resetBg.on("pointerout", () => resetBg.setFillStyle(0x884400));

        // Y offset controls (on the right side, near player 2)
        this.createYOffsetControls();
    }

    private createYOffsetControls(): void {
        const controlY = GAME_DIMENSIONS.HEIGHT - 180;
        const centerX = CHARACTER_POSITIONS.PLAYER1.X;

        // Y offset label
        this.add.text(centerX, controlY - 20, "Y Position Offset", {
            fontSize: "12px",
            fontFamily: "Arial",
            color: "#00ffaa",
        }).setOrigin(0.5);

        // Y offset adjustment buttons
        const yAdjustments = [
            { label: "▲30", value: -30, x: centerX - 120 },
            { label: "▲10", value: -10, x: centerX - 60 },
            { label: "▲1", value: -1, x: centerX - 20 },
            { label: "▼1", value: 1, x: centerX + 20 },
            { label: "▼10", value: 10, x: centerX + 60 },
            { label: "▼30", value: 30, x: centerX + 120 },
        ];

        yAdjustments.forEach(({ label, value, x }) => {
            const bg = this.add.rectangle(x, controlY, 40, 28, 0x224444)
                .setStrokeStyle(1, 0x00ffaa)
                .setInteractive({ useHandCursor: true });

            this.add.text(x, controlY, label, {
                fontSize: "11px",
                fontFamily: "Arial",
                color: "#ffffff",
            }).setOrigin(0.5);

            bg.on("pointerdown", () => this.adjustYOffset(value));
            bg.on("pointerover", () => bg.setFillStyle(0x336666));
            bg.on("pointerout", () => bg.setFillStyle(0x224444));
        });

        // Reset Y offset button
        const resetYBg = this.add.rectangle(centerX, controlY + 30, 100, 25, 0x006644)
            .setStrokeStyle(2, 0x00ffaa)
            .setInteractive({ useHandCursor: true });

        this.add.text(centerX, controlY + 30, "RESET Y", {
            fontSize: "11px",
            fontFamily: "Arial Black",
            color: "#ffffff",
        }).setOrigin(0.5);

        resetYBg.on("pointerdown", () => this.resetYOffset());
        resetYBg.on("pointerover", () => resetYBg.setFillStyle(0x008866));
        resetYBg.on("pointerout", () => resetYBg.setFillStyle(0x006644));

        this.createSoundDelayControls(controlY + 60);
    }

    private createSoundDelayControls(y: number): void {
        const cx = GAME_DIMENSIONS.CENTER_X;

        this.add.text(cx, y, "SOUND DELAY (ms)", {
            fontSize: "14px", fontFamily: "Arial Black", color: "#ffaa00"
        }).setOrigin(0.5);

        const adjustments = [
            { label: "-50", value: -50, x: cx - 80 },
            { label: "-10", value: -10, x: cx - 40 },
            { label: "+10", value: 10, x: cx + 40 },
            { label: "+50", value: 50, x: cx + 80 },
        ];

        adjustments.forEach(({ label, value, x }) => {
            const bg = this.add.rectangle(x, y + 25, 35, 25, 0x443300)
                .setStrokeStyle(1, 0xffaa00)
                .setInteractive({ useHandCursor: true });

            this.add.text(x, y + 25, label, {
                fontSize: "12px", fontFamily: "Arial", color: "#ffffff"
            }).setOrigin(0.5);

            bg.on("pointerdown", () => {
                this.soundDelay = this.soundDelay + value;
                this.soundDelayText.setText(`Sound Delay: ${this.soundDelay}ms`);
            });
            bg.on("pointerover", () => bg.setFillStyle(0x664400));
            bg.on("pointerout", () => bg.setFillStyle(0x443300));
        });

        this.debugText = this.add.text(cx, y + 80, "Debug: Ready", {
            fontSize: "14px", fontFamily: "Monospace", color: "#ffff00"
        }).setOrigin(0.5);

        // Recommended delay button
        const recBg = this.add.rectangle(cx, y + 55, 130, 25, 0x004488)
            .setStrokeStyle(1, 0x00aaff)
            .setInteractive({ useHandCursor: true });

        const recText = this.add.text(cx, y + 55, "USE RECOMMENDED", {
            fontSize: "11px",
            fontFamily: "Arial Black",
            color: "#ffffff",
        }).setOrigin(0.5);

        recBg.on("pointerdown", () => {
            const charId = ALL_CHARACTERS[this.p1CharIndex];
            this.soundDelay = getSoundDelay(charId, this.currentAnim);
            this.soundDelayText.setText(`Sound Delay: ${this.soundDelay}ms`);
            this.debugText.setText(`Used Recommended for ${charId} ${this.currentAnim}: ${this.soundDelay}ms`);
        });

        recBg.on("pointerover", () => recBg.setFillStyle(0x0066aa));
        recBg.on("pointerout", () => recBg.setFillStyle(0x004488));
    }

    private createCharacterSwitcher(): void {
        const switcherY = 160;
        const centerX = CHARACTER_POSITIONS.PLAYER1.X;

        // Previous character button
        const prevBg = this.add.rectangle(centerX - 100, switcherY, 50, 40, 0x336633)
            .setStrokeStyle(2, 0x00ff00)
            .setInteractive({ useHandCursor: true });

        this.add.text(centerX - 100, switcherY, "◀", {
            fontSize: "24px",
            fontFamily: "Arial",
            color: "#ffffff",
        }).setOrigin(0.5);

        prevBg.on("pointerdown", () => this.switchCharacter(-1));
        prevBg.on("pointerover", () => prevBg.setFillStyle(0x448844));
        prevBg.on("pointerout", () => prevBg.setFillStyle(0x336633));

        // Next character button
        const nextBg = this.add.rectangle(centerX + 100, switcherY, 50, 40, 0x336633)
            .setStrokeStyle(2, 0x00ff00)
            .setInteractive({ useHandCursor: true });

        this.add.text(centerX + 100, switcherY, "▶", {
            fontSize: "24px",
            fontFamily: "Arial",
            color: "#ffffff",
        }).setOrigin(0.5);

        nextBg.on("pointerdown", () => this.switchCharacter(1));
        nextBg.on("pointerover", () => nextBg.setFillStyle(0x448844));
        nextBg.on("pointerout", () => nextBg.setFillStyle(0x336633));

        // Character index display
        this.add.text(centerX, switcherY, `${this.p1CharIndex + 1}/${ALL_CHARACTERS.length}`, {
            fontSize: "16px",
            fontFamily: "Arial",
            color: "#aaaaaa",
        }).setOrigin(0.5);
    }

    private createBackButton(): void {
        const backBg = this.add.rectangle(70, 30, 100, 35, 0x333333)
            .setStrokeStyle(2, 0xff4444)
            .setInteractive({ useHandCursor: true });

        this.add.text(70, 30, "← BACK", {
            fontSize: "14px",
            fontFamily: "Arial Black",
            color: "#ffffff",
        }).setOrigin(0.5);

        backBg.on("pointerdown", () => {
            this.scene.start("MainMenuScene");
        });
        backBg.on("pointerover", () => backBg.setFillStyle(0x555555));
        backBg.on("pointerout", () => backBg.setFillStyle(0x333333));
    }

    private switchCharacter(direction: number): void {
        this.p1CharIndex = (this.p1CharIndex + direction + ALL_CHARACTERS.length) % ALL_CHARACTERS.length;
        const newChar = ALL_CHARACTERS[this.p1CharIndex];

        // Check if this character is loaded, if not, load it dynamically
        const idleTextureKey = `char_${newChar}_idle`;
        if (!this.textures.exists(idleTextureKey)) {
            // Need to load this character first
            this.loadCharacter(newChar);
            return;
        }

        // Update sprite texture and animation
        this.updatePlayer1Sprite(newChar, this.currentAnim);
    }

    private loadCharacter(charId: string): void {
        const charConfig = CHAR_SPRITE_CONFIG[charId];
        if (!charConfig) return;

        // Show loading text
        const loadingText = this.add.text(CHARACTER_POSITIONS.PLAYER1.X, CHARACTER_POSITIONS.PLAYER1.Y - 100, 'Loading...', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffff00'
        }).setOrigin(0.5);

        // Load all animations for this character
        const animations = ["idle", "run", "punch", "kick", "block", "special", "dead"];
        animations.forEach((anim) => {
            const animConfig = charConfig[anim];
            if (!animConfig) return;

            this.load.spritesheet(
                `char_${charId}_${anim}`,
                `/characters/${charId}/${anim}.webp`,
                { frameWidth: animConfig.frameWidth, frameHeight: animConfig.frameHeight }
            );
        });

        this.load.start();

        this.load.once('complete', () => {
            loadingText.destroy();

            // Create animations for the newly loaded character
            animations.forEach((animType) => {
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

            // Now update the sprite
            this.updatePlayer1Sprite(charId, this.currentAnim);
        });
    }

    private updatePlayer1Sprite(charId: string, anim: string): void {
        const textureKey = `char_${charId}_${anim}`;
        if (this.textures.exists(textureKey)) {
            this.player1Sprite.setTexture(textureKey);

            // Reset scale to calculated value for new character
            this.currentScale = getAnimationScale(charId, anim);
            this.player1Sprite.setScale(this.currentScale);

            // Apply Y offset from config + manual adjustment
            const baseY = CHARACTER_POSITIONS.PLAYER1.Y - 50;
            const configOffset = getCharacterYOffset(charId, anim);
            this.player1Sprite.setY(baseY + configOffset + this.currentYOffset);

            const animKey = `${charId}_${anim}`;
            if (this.anims.exists(animKey)) {
                this.player1Sprite.play(animKey);
            }
        }

        // Update UI
        this.charNameText.setText(charId);
        this.scaleText.setText(`Scale: ${this.currentScale.toFixed(3)}`);
    }

    private playAnimation(anim: string): void {
        this.currentAnim = anim;
        const charId = ALL_CHARACTERS[this.p1CharIndex];
        const animKey = `${charId}_${anim}`;
        const textureKey = `char_${charId}_${anim}`;

        if (this.textures.exists(textureKey)) {
            // Update texture (needed for size calculations even if delayed)
            this.player1Sprite.setTexture(textureKey);
            this.currentScale = getAnimationScale(charId, anim);
            this.player1Sprite.setScale(this.currentScale);

            // Determine timing
            const isAttackAnim = ["punch", "kick", "special"].includes(anim);

            if (isAttackAnim && this.soundDelay < 0) {
                // NEGATIVE DELAY: Sound early, Animation late
                // 1. Play Sound NOW
                const sfxKey = getSFXKey(charId, anim);

                console.log(`[FakeScene] Negative Delay Case. Playing sound NOW. Time: ${Date.now()}`);
                this.debugText.setText(`Key: ${sfxKey} | Delay: ${this.soundDelay}ms`);

                this.sound.play(sfxKey, { volume: 0.5 });

                // 2. Play Animation LATER
                setTimeout(() => {
                    console.log(`[FakeScene] Playing animation delayed by ${Math.abs(this.soundDelay)}ms. Time: ${Date.now()}`);
                    if (this.anims.exists(animKey)) this.player1Sprite.play(animKey);
                }, Math.abs(this.soundDelay));
            } else {
                // POSITIVE DELAY (or 0): Animation NOW, Sound LATER
                // Trigger SFX if applicable
                if (["punch", "kick", "special"].includes(anim)) {
                    // Use character-specific SFX if available, handling overrides and fallbacks
                    const sfxKey = getSFXKey(charId, anim);

                    console.log(`[FakeScene] Triggering ${anim} for ${charId} (Key: ${sfxKey})`);
                    console.log(`[FakeScene] Current Delay: ${this.soundDelay}ms`);
                    const recDelay = getSoundDelay(charId, anim);
                    this.debugText.setText(`Key: ${sfxKey} | Delay: ${this.soundDelay}ms (Rec: ${recDelay}ms)`);

                    // The `isAttackAnim` variable is already defined above.
                    // This block is inside the `else` of `if (isAttackAnim && this.soundDelay < 0)`.
                    // So, here `isAttackAnim` is true, and `this.soundDelay >= 0`.

                    console.log(`[FakeScene] Positive/Zero Delay Case.`);
                    // POSITIVE DELAY (or 0): Animation NOW, Sound LATER
                    if (this.anims.exists(animKey)) this.player1Sprite.play(animKey);

                    if (this.soundDelay > 0) {
                        console.log(`[FakeScene] Scheduling sound in ${this.soundDelay}ms. Time: ${Date.now()}`);
                        setTimeout(() => {
                            console.log(`[FakeScene] Playing sound NOW. Time: ${Date.now()}`);
                            this.sound.play(sfxKey, { volume: 0.5 });
                        }, this.soundDelay);
                    } else {
                        console.log(`[FakeScene] Playing sound NOW. Time: ${Date.now()}`);
                        this.sound.play(sfxKey, { volume: 0.5 });
                    }
                } else { // Not an attack animation, just play animation
                    if (this.anims.exists(animKey)) this.player1Sprite.play(animKey);
                }
            }
        }

        // Update UI
        this.animNameText.setText(`Animation: ${anim}`);
        this.scaleText.setText(`Scale: ${this.currentScale.toFixed(3)}`);

        // For non-looping animations, return to idle after completion
        if (anim !== "idle" && anim !== "run") {
            this.player1Sprite.once("animationcomplete", () => {
                // Stay on current animation frame (don't auto-return to idle for testing)
            });
        }
    }

    private adjustScale(delta: number): void {
        this.currentScale = Math.max(0.1, Math.min(3.0, this.currentScale + delta));
        this.player1Sprite.setScale(this.currentScale);
        this.scaleText.setText(`Scale: ${this.currentScale.toFixed(3)}`);
    }

    private resetScale(): void {
        const charId = ALL_CHARACTERS[this.p1CharIndex];
        this.currentScale = getAnimationScale(charId, this.currentAnim);
        this.player1Sprite.setScale(this.currentScale);
        this.scaleText.setText(`Scale: ${this.currentScale.toFixed(3)}`);
    }

    private adjustYOffset(delta: number): void {
        const charId = ALL_CHARACTERS[this.p1CharIndex];
        const configOffset = getCharacterYOffset(charId, this.currentAnim);
        const baseY = CHARACTER_POSITIONS.PLAYER1.Y - 50;

        this.currentYOffset = Math.max(-200, Math.min(200, this.currentYOffset + delta));
        this.player1Sprite.setY(baseY + configOffset + this.currentYOffset);
        this.yOffsetText.setText(`Y Offset: ${this.currentYOffset}`);
    }

    private resetYOffset(): void {
        const charId = ALL_CHARACTERS[this.p1CharIndex];
        const configOffset = getCharacterYOffset(charId, this.currentAnim);
        const baseY = CHARACTER_POSITIONS.PLAYER1.Y - 50;

        this.currentYOffset = 0;
        this.player1Sprite.setY(baseY + configOffset);
        this.yOffsetText.setText(`Y Offset: ${this.currentYOffset}`);
    }
}
