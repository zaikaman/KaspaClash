import Phaser from "phaser";
import { getCharacterCombatStats } from "@/game/combat/CharacterStats";
import { getCharacterColor } from "@/data/characters";
import type { Character } from "@/types";
import { GAME_DIMENSIONS } from "../config";

export class StatsOverlay extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Graphics;
    private panel: Phaser.GameObjects.Container;
    private isVisible: boolean = false;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);
        this.setDepth(1000); // Ensure it's on top of everything

        // 1. Full screen dimmer background
        this.background = scene.add.graphics();
        this.background.fillStyle(0x000000, 0.8);
        this.background.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.background.setInteractive(new Phaser.Geom.Rectangle(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT), Phaser.Geom.Rectangle.Contains);
        this.background.on("pointerdown", () => this.hide());
        this.add(this.background);

        // 2. Main Panel Container
        this.panel = scene.add.container(GAME_DIMENSIONS.CENTER_X, GAME_DIMENSIONS.CENTER_Y);
        this.add(this.panel);

        // Initial Hide
        this.setVisible(false);
        this.setAlpha(0);

        scene.add.existing(this);
    }

    public show(character: Character): void {
        this.panel.removeAll(true); // Clear previous content
        this.buildPanelContent(character);

        this.isVisible = true;
        this.setVisible(true);

        // Animation
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 200,
            ease: "Power2"
        });

        this.panel.setScale(0.9);
        this.scene.tweens.add({
            targets: this.panel,
            scale: 1,
            duration: 200,
            ease: "Back.easeOut"
        });
    }

    public hide(): void {
        if (!this.isVisible) return;
        this.isVisible = false;

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 150,
            onComplete: () => {
                this.setVisible(false);
            }
        });
    }

    private buildPanelContent(character: Character): void {
        const stats = getCharacterCombatStats(character.id);
        const colors = getCharacterColor(character.id);
        const width = 500;
        const height = 400; // Increased height to fit theme
        const radius = 16;

        // Panel Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x111111, 0.95);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
        bg.lineStyle(2, colors.primary);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
        this.panel.add(bg);

        // Title
        const title = this.scene.add.text(0, -height / 2 + 40, character.name.toUpperCase(), {
            fontFamily: "Orbitron, sans-serif",
            fontSize: "32px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.panel.add(title);

        // Theme Text
        const themeText = this.scene.add.text(0, -height / 2 + 80, `"${character.theme}"`, {
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            color: "#aaaaaa",
            fontStyle: "italic",
            align: "center",
            wordWrap: { width: width - 60 }
        }).setOrigin(0.5, 0);
        this.panel.add(themeText);

        // Stats Grid Container
        const gridY = -height / 2 + 150;
        const col1X = -120;
        const col2X = 120;

        this.addStatRow(col1X, gridY, "HP", stats.maxHp.toString(), colors.primary);
        this.addStatRow(col2X, gridY, "Energy", stats.maxEnergy.toString(), colors.secondary);

        this.addStatRow(col1X, gridY + 50, "Regen", `${stats.energyRegen}/turn`, "#ffffff");
        this.addStatRow(col2X, gridY + 50, "Guard", `${(1 - stats.blockEffectiveness) * 100}% Block`, "#ffffff"); // Convert 0.4 effectiveness to 60% block

        // Modifiers Section
        const modY = gridY + 110;
        const modTitle = this.scene.add.text(0, modY, "DAMAGE MODIFIERS", {
            fontFamily: "Orbitron, sans-serif",
            fontSize: "16px",
            color: "#888888"
        }).setOrigin(0.5);
        this.panel.add(modTitle);

        const mods = stats.damageModifiers;
        const modLabels = [
            { l: "PUNCH", v: mods.punch },
            { l: "KICK", v: mods.kick },
            { l: "SPECIAL", v: mods.special },
        ];

        modLabels.forEach((m, i) => {
            const x = (i - 1) * 140; // -140, 0, 140
            const valStr = m.v === 1 ? "100%" : `${Math.round(m.v * 100)}%`;
            const color = m.v > 1 ? "#4ade80" : (m.v < 1 ? "#f87171" : "#bbbbbb");

            this.addStatBox(x, modY + 40, m.l, valStr, color);
        });

        // Close Button (X)
        const closeBtn = this.scene.add.container(width / 2 - 30, -height / 2 + 30);
        const closeCircle = this.scene.add.graphics();
        closeCircle.fillStyle(0x333333, 1);
        closeCircle.fillCircle(0, 0, 15);
        const closeX = this.scene.add.text(0, 0, "×", { fontSize: "24px", color: "#ffffff" }).setOrigin(0.5, 0.55);
        closeBtn.add([closeCircle, closeX]);
        closeBtn.setSize(30, 30);
        closeBtn.setInteractive({ useHandCursor: true })
            .on("pointerover", () => closeCircle.fillStyle(0x555555, 1)) // Hover effect not updating cleanly in container without redraw, simplification
            .on("pointerdown", () => this.hide());

        this.panel.add(closeBtn);
    }

    private addStatRow(x: number, y: number, label: string, value: string, color: number | string): void {
        const l = this.scene.add.text(x, y, label, {
            fontFamily: "Orbitron, sans-serif", fontSize: "14px", color: "#888888"
        }).setOrigin(0.5, 1);

        const v = this.scene.add.text(x, y + 5, value, {
            fontFamily: "Orbitron, sans-serif", fontSize: "24px", color: typeof color === 'number' ? `#${color.toString(16)}` : color, fontStyle: "bold"
        }).setOrigin(0.5, 0);

        this.panel.add([l, v]);
    }

    private addStatBox(x: number, y: number, label: string, value: string, color: string): void {
        const box = this.scene.add.graphics();
        box.lineStyle(1, 0x444444);
        box.strokeRoundedRect(x - 60, y, 120, 50, 8);

        const l = this.scene.add.text(x, y + 10, label, {
            fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#666666"
        }).setOrigin(0.5, 0);

        const v = this.scene.add.text(x, y + 25, value, {
            fontFamily: "Orbitron, sans-serif", fontSize: "16px", color: color, fontStyle: "bold"
        }).setOrigin(0.5, 0);

        this.panel.add([box, l, v]);
    }
}
