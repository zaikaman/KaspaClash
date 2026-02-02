import Phaser from "phaser";
import type { PowerSurgeCard } from "@/types/power-surge";

export interface PowerSurgeCardViewConfig {
    scene: Phaser.Scene;
    card: PowerSurgeCard;
    x: number;
    y: number;
    scale?: number;
}

export class PowerSurgeCardView {
    static readonly CARD_WIDTH = 200;
    static readonly CARD_HEIGHT = 300;

    static create(config: PowerSurgeCardViewConfig): Phaser.GameObjects.Container {
        const { scene, card, x, y, scale = 1 } = config;

        const container = scene.add.container(x, y);
        container.setScale(scale);

        // 1. Background (Image or Generated)
        if (scene.textures.exists(card.iconKey)) {
            const cardImage = scene.add.image(0, 0, card.iconKey);
            cardImage.setDisplaySize(this.CARD_WIDTH, this.CARD_HEIGHT);
            cardImage.setOrigin(0.5, 0.5);
            container.add(cardImage);

            // Dark overlay for bottom half to make text readable
            const textOverlay = scene.add.graphics();
            textOverlay.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.9, 0.9);
            textOverlay.fillRect(-this.CARD_WIDTH / 2, 0, this.CARD_WIDTH, this.CARD_HEIGHT / 2);
            container.add(textOverlay);
        } else {
            // Fallback to glassmorphic background
            const bg = scene.add.graphics();
            this.drawCardBackground(bg, card);
            container.add(bg);
        }

        // 2. Neon Border Glow
        const glowBorder = scene.add.graphics();
        this.drawGlowBorder(glowBorder, card.glowColor, 1.0);
        container.add(glowBorder);

        // 3. Title
        const title = scene.add.text(0, 5, card.name, {
            fontFamily: "monospace",
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold",
            align: "center",
            stroke: "#000000",
            strokeThickness: 3,
            wordWrap: { width: this.CARD_WIDTH - 30 },
        });
        title.setOrigin(0.5);
        container.add(title);

        // 4. Description
        const description = scene.add.text(0, 45, card.description, {
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#e2e8f0",
            align: "center",
            stroke: "#000000",
            strokeThickness: 2,
            wordWrap: { width: this.CARD_WIDTH - 40 },
        });
        description.setOrigin(0.5);
        container.add(description);

        // 5. DAG Decoration
        this.drawDAGGraph(scene, container, card.glowColor);

        return container;
    }

    private static drawCardBackground(
        graphics: Phaser.GameObjects.Graphics,
        card: PowerSurgeCard
    ): void {
        const backgroundColor = 0x1a1a2e;

        // Dark glassmorphic background
        graphics.fillStyle(backgroundColor, 0.9);
        graphics.fillRoundedRect(
            -this.CARD_WIDTH / 2,
            -this.CARD_HEIGHT / 2,
            this.CARD_WIDTH,
            this.CARD_HEIGHT,
            16
        );

        // Inner gradient overlay
        graphics.fillGradientStyle(
            card.glowColor,
            card.glowColor,
            backgroundColor,
            backgroundColor,
            0.15,
            0.15,
            0,
            0
        );
        graphics.fillRoundedRect(
            -this.CARD_WIDTH / 2 + 4,
            -this.CARD_HEIGHT / 2 + 4,
            this.CARD_WIDTH - 8,
            this.CARD_HEIGHT - 8,
            14
        );
    }

    private static drawGlowBorder(
        graphics: Phaser.GameObjects.Graphics,
        color: number,
        intensity: number
    ): void {
        // Outer blooming glow
        for (let i = 1; i <= 3; i++) {
            graphics.lineStyle(2 + i * 2, color, (0.15 / i) * intensity);
            graphics.strokeRoundedRect(
                -this.CARD_WIDTH / 2 - i,
                -this.CARD_HEIGHT / 2 - i,
                this.CARD_WIDTH + i * 2,
                this.CARD_HEIGHT + i * 2,
                16 + i
            );
        }

        // Main sharp neon border
        graphics.lineStyle(3, color, 1.0 * intensity);
        graphics.strokeRoundedRect(
            -this.CARD_WIDTH / 2,
            -this.CARD_HEIGHT / 2,
            this.CARD_WIDTH,
            this.CARD_HEIGHT,
            16
        );

        // High-tech corner accents
        const cornerSize = 25;
        graphics.lineStyle(4, 0xffffff, 0.5 * intensity);

        // Top Left
        graphics.beginPath();
        graphics.moveTo(-this.CARD_WIDTH / 2 + cornerSize, -this.CARD_HEIGHT / 2);
        graphics.lineTo(-this.CARD_WIDTH / 2, -this.CARD_HEIGHT / 2);
        graphics.lineTo(-this.CARD_WIDTH / 2, -this.CARD_HEIGHT / 2 + cornerSize);
        graphics.strokePath();

        // Bottom Right
        graphics.beginPath();
        graphics.moveTo(this.CARD_WIDTH / 2 - cornerSize, this.CARD_HEIGHT / 2);
        graphics.lineTo(this.CARD_WIDTH / 2, this.CARD_HEIGHT / 2);
        graphics.lineTo(this.CARD_WIDTH / 2, this.CARD_HEIGHT / 2 - cornerSize);
        graphics.strokePath();

        // Inner highlight
        graphics.lineStyle(1, 0xffffff, 0.2);
        graphics.strokeRoundedRect(
            -this.CARD_WIDTH / 2 + 2,
            -this.CARD_HEIGHT / 2 + 2,
            this.CARD_WIDTH - 4,
            this.CARD_HEIGHT - 4,
            14
        );
    }

    private static drawDAGGraph(scene: Phaser.Scene, container: Phaser.GameObjects.Container, color: number): void {
        const graphics = scene.add.graphics();
        const baseY = this.CARD_HEIGHT / 2 - 25;

        // Circuitry-style DAG decoration
        graphics.lineStyle(1.5, color, 0.6);

        // Create a network of connected nodes
        const nodes = [
            { x: -60, y: baseY + 10 },
            { x: -30, y: baseY - 5 },
            { x: 0, y: baseY + 5 },
            { x: 30, y: baseY - 5 },
            { x: 60, y: baseY + 10 }
        ];

        // Draw lines
        graphics.beginPath();
        graphics.moveTo(nodes[0].x, nodes[0].y);
        for (let i = 1; i < nodes.length; i++) {
            graphics.lineTo(nodes[i].x, nodes[i].y);
        }
        graphics.strokePath();

        // Draw little square "blocks" at each node
        nodes.forEach(node => {
            graphics.fillStyle(color, 0.8);
            graphics.fillRect(node.x - 3, node.y - 3, 6, 6);

            // Add a small glow to each block
            graphics.lineStyle(1, 0xffffff, 0.5);
            graphics.strokeRect(node.x - 4, node.y - 4, 8, 8);
        });

        container.add(graphics);
    }
}
