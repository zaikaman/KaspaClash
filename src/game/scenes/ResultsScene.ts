import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import type { MatchResult, PlayerRole } from "@/types";
import { GAME_DIMENSIONS } from "../config";

interface ResultsSceneData {
    result: MatchResult;
    playerRole: PlayerRole | null;
    matchId: string;
    player1CharacterId: string;
    player2CharacterId: string;
}

export class ResultsScene extends Scene {
    private resultsData!: ResultsSceneData;

    constructor() {
        super("ResultsScene");
    }

    create(data: ResultsSceneData) {
        this.resultsData = data;
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // Background
        const bg = this.add.rectangle(
            GAME_DIMENSIONS.CENTER_X,
            GAME_DIMENSIONS.CENTER_Y,
            GAME_DIMENSIONS.WIDTH,
            GAME_DIMENSIONS.HEIGHT,
            0x050505
        );

        // Add subtle grid or cyber effect
        const grid = this.add.grid(
            GAME_DIMENSIONS.CENTER_X,
            GAME_DIMENSIONS.CENTER_Y,
            GAME_DIMENSIONS.WIDTH,
            GAME_DIMENSIONS.HEIGHT,
            40,
            40,
            0x0a0a0a,
            0,
            0x1a1a1a,
            0.2
        );

        // Determine if player won
        const isWinner =
            (this.resultsData.result.winner === "player1" && this.resultsData.playerRole === "player1") ||
            (this.resultsData.result.winner === "player2" && this.resultsData.playerRole === "player2");

        // Victory/Defeat Text
        const titleText = isWinner ? "VICTORY" : "DEFEAT";
        const titleColor = isWinner ? "#49eacb" : "#ef4444";
        const glowColor = isWinner ? 0x49eacb : 0xef4444;

        const title = this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            150,
            titleText,
            {
                fontFamily: "Orbitron",
                fontSize: "120px",
                color: titleColor,
                stroke: "#000000",
                strokeThickness: 8,
            }
        ).setOrigin(0.5).setAlpha(0);

        // Glow effect
        const glow = this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            150,
            titleText,
            {
                fontFamily: "Orbitron",
                fontSize: "120px",
                color: titleColor,
            }
        ).setOrigin(0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);

        this.tweens.add({
            targets: [title, glow],
            alpha: 1,
            y: 180,
            duration: 1000,
            ease: "Back.out",
        });

        this.tweens.add({
            targets: glow,
            alpha: 0.5,
            yoyo: true,
            repeat: -1,
            duration: 1500,
            ease: "Sine.easeInOut",
        });

        // Subtitle (Reason)
        const reasonText =
            this.resultsData.result.reason === "knockout" ? "KNOCKOUT!" :
                this.resultsData.result.reason === "timeout" ? "TIME OUT" :
                    this.resultsData.result.reason === "forfeit" ? "OPPONENT FORFEITED" :
                        "DECISION";

        this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            280,
            reasonText,
            {
                fontFamily: "Orbitron",
                fontSize: "32px",
                color: "#ffffff",
                letterSpacing: 4,
            }
        ).setOrigin(0.5).setAlpha(0.8);

        // Display Stats Container
        this.createStatsDisplay(isWinner);

        // Interactive Buttons
        this.createButtons();
    }

    private createStatsDisplay(isWinner: boolean) {
        const container = this.add.container(GAME_DIMENSIONS.CENTER_X, 450);

        // Stats Panel Background
        const panel = this.add.rectangle(0, 0, 600, 200, 0x111111, 0.9)
            .setStrokeStyle(2, 0x333333);
        container.add(panel);

        const leftX = -150;
        const rightX = 150;
        const headerY = -50;
        const scoreY = 0;
        const hpY = 50;

        // Headers
        container.add(this.add.text(leftX, headerY, "YOU", {
            fontFamily: "Exo 2", fontSize: "24px", color: isWinner ? "#49eacb" : "#ef4444"
        }).setOrigin(0.5));

        container.add(this.add.text(rightX, headerY, "OPPONENT", {
            fontFamily: "Exo 2", fontSize: "24px", color: !isWinner ? "#49eacb" : "#ef4444"
        }).setOrigin(0.5));

        // Scores
        const myScore = this.resultsData.playerRole === "player1" ? this.resultsData.result.player1RoundsWon : this.resultsData.result.player2RoundsWon;
        const opScore = this.resultsData.playerRole === "player1" ? this.resultsData.result.player2RoundsWon : this.resultsData.result.player1RoundsWon;

        container.add(this.add.text(leftX, scoreY, `${myScore} WINS`, {
            fontFamily: "Orbitron", fontSize: "40px", color: "#ffffff"
        }).setOrigin(0.5));

        container.add(this.add.text(0, scoreY, "-", {
            fontFamily: "Orbitron", fontSize: "40px", color: "#666666"
        }).setOrigin(0.5));

        container.add(this.add.text(rightX, scoreY, `${opScore} WINS`, {
            fontFamily: "Orbitron", fontSize: "40px", color: "#ffffff"
        }).setOrigin(0.5));



        // Animate container
        container.setScale(0);
        this.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            delay: 500,
            ease: "Back.out"
        });
    }

    private createButtons() {
        const y = 620;

        // Return to Menu Button
        const menuBtn = this.createButton(GAME_DIMENSIONS.CENTER_X, y, "RETURN TO MENU", () => {
            window.location.href = "/";
        });
    }

    private createButton(x: number, y: number, text: string, callback: () => void) {
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 250, 60, 0x49eacb)
            .setInteractive({ useHandCursor: true });

        // Gradient effect or styling
        const textObj = this.add.text(0, 0, text, {
            fontFamily: "Orbitron",
            fontSize: "20px",
            color: "#000000",
            fontStyle: "bold"
        }).setOrigin(0.5);

        container.add([bg, textObj]);

        bg.on("pointerover", () => {
            bg.setFillStyle(0x6affe0);
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 200,
                ease: "Back.out"
            });
        });

        bg.on("pointerout", () => {
            bg.setFillStyle(0x49eacb);
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: "Back.out"
            });
        });

        bg.on("pointerdown", () => {
            this.tweens.add({
                targets: container,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: callback
            });
        });

        return container;
    }
}
