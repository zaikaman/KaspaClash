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

        // Stats Panel Background - Increased height for rating animation
        const panel = this.add.rectangle(0, 0, 600, 260, 0x111111, 0.9)
            .setStrokeStyle(2, 0x333333);
        container.add(panel);

        const leftX = -150;
        const rightX = 150;
        const headerY = -80;
        const scoreY = -30;
        const ratingY = 50;

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

        // Rating Changes Display
        const ratingChanges = this.resultsData.result.ratingChanges;
        if (ratingChanges) {
            const myRating = isWinner ? ratingChanges.winner : ratingChanges.loser;
            const opRating = isWinner ? ratingChanges.loser : ratingChanges.winner;

            // Rating label
            container.add(this.add.text(0, ratingY - 20, "RATING", {
                fontFamily: "Exo 2", fontSize: "16px", color: "#666666"
            }).setOrigin(0.5));

            // My Rating Text (Start at 'before')
            const myRatingText = this.add.text(leftX, ratingY + 15, `${myRating.before}`, {
                fontFamily: "Orbitron", fontSize: "56px", color: "#ffffff",
                stroke: "#000000", strokeThickness: 4
            }).setOrigin(0.5);
            container.add(myRatingText);

            // My Change Text (e.g. +25)
            const myChangeStr = myRating.change >= 0 ? `+${myRating.change}` : `${myRating.change}`;
            const myChangeColor = myRating.change >= 0 ? "#49eacb" : "#ef4444";
            const myChangeText = this.add.text(leftX, ratingY + 60, myChangeStr, {
                fontFamily: "Orbitron", fontSize: "24px", color: myChangeColor,
                fontStyle: "bold"
            }).setOrigin(0.5).setAlpha(0).setScale(0.5);
            container.add(myChangeText);

            // Opponent Rating Text
            const opRatingText = this.add.text(rightX, ratingY + 15, `${opRating.before}`, {
                fontFamily: "Orbitron", fontSize: "56px", color: "#ffffff",
                stroke: "#000000", strokeThickness: 4
            }).setOrigin(0.5);
            container.add(opRatingText);

            // Opponent Change Text
            const opChangeStr = opRating.change >= 0 ? `+${opRating.change}` : `${opRating.change}`;
            const opChangeColor = opRating.change >= 0 ? "#49eacb" : "#ef4444";
            const opChangeText = this.add.text(rightX, ratingY + 60, opChangeStr, {
                fontFamily: "Orbitron", fontSize: "24px", color: opChangeColor,
                fontStyle: "bold"
            }).setOrigin(0.5).setAlpha(0).setScale(0.5);
            container.add(opChangeText);

            // Animate my rating
            this.tweens.addCounter({
                from: myRating.before,
                to: myRating.after,
                duration: 2000,
                ease: "Power2",
                delay: 800,
                onUpdate: (tween) => {
                    const val = Math.round(tween.getValue());
                    myRatingText.setText(`${val}`);
                    // Pulse effect on update
                    if (Math.random() > 0.8 && myRating.change !== 0) {
                        myRatingText.setTint(myRating.change > 0 ? 0x49eacb : 0xef4444);
                        setTimeout(() => myRatingText.clearTint(), 50);
                    }
                },
                onComplete: () => {
                    myRatingText.setText(`${myRating.after}`); // Ensure final value
                    myRatingText.setTint(myRating.change >= 0 ? 0x49eacb : 0xef4444); // Final tint

                    // Show change text with pop effect
                    this.tweens.add({
                        targets: myChangeText,
                        alpha: 1,
                        scale: 1,
                        y: ratingY + 55, // slight move up
                        duration: 500,
                        ease: "Back.out"
                    });
                }
            });

            // Animate opponent rating
            this.tweens.addCounter({
                from: opRating.before,
                to: opRating.after,
                duration: 2000,
                ease: "Power2",
                delay: 800,
                onUpdate: (tween) => {
                    const val = Math.round(tween.getValue());
                    opRatingText.setText(`${val}`);
                },
                onComplete: () => {
                    opRatingText.setText(`${opRating.after}`);

                    this.tweens.add({
                        targets: opChangeText,
                        alpha: 1,
                        scale: 1,
                        y: ratingY + 55,
                        duration: 500,
                        ease: "Back.out"
                    });
                }
            });
        }

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
        const buttonSpacing = 280;

        // Watch Replay Button (left)
        this.createButton(
            GAME_DIMENSIONS.CENTER_X - buttonSpacing,
            y,
            "⏵ WATCH REPLAY",
            () => {
                window.location.href = `/replay/${this.resultsData.matchId}`;
            },
            0x6366f1 // Purple for replay
        );

        // Share Link Button (center)
        this.createButton(
            GAME_DIMENSIONS.CENTER_X,
            y,
            "📋 COPY REPLAY LINK",
            () => {
                const replayUrl = `${window.location.origin}/replay/${this.resultsData.matchId}`;
                navigator.clipboard.writeText(replayUrl).then(() => {
                    this.showCopiedNotification();
                }).catch(() => {
                    // Fallback for older browsers
                    const textArea = document.createElement("textarea");
                    textArea.value = replayUrl;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-999999px";
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textArea);
                    this.showCopiedNotification();
                });
            },
            0x49eacb // Cyber gold for share
        );

        // Return to Menu Button (right)
        this.createButton(
            GAME_DIMENSIONS.CENTER_X + buttonSpacing,
            y,
            "🏠 RETURN TO MENU",
            () => {
                window.location.href = "/";
            },
            0x6b7280 // Gray for menu
        );
    }

    private showCopiedNotification() {
        const notification = this.add.text(
            GAME_DIMENSIONS.CENTER_X,
            680,
            "✓ Replay link copied to clipboard!",
            {
                fontFamily: "Exo 2",
                fontSize: "18px",
                color: "#22c55e",
            }
        ).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: notification,
            alpha: 1,
            y: 670,
            duration: 300,
            ease: "Back.out",
            onComplete: () => {
                this.tweens.add({
                    targets: notification,
                    alpha: 0,
                    delay: 2000,
                    duration: 300,
                    onComplete: () => notification.destroy()
                });
            }
        });
    }

    private createButton(x: number, y: number, text: string, callback: () => void, color: number = 0x49eacb) {
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 250, 60, color)
            .setInteractive({ useHandCursor: true });

        // Lighter version of the color for hover
        const hoverColor = this.lightenColor(color, 0.2);

        // Gradient effect or styling
        const textObj = this.add.text(0, 0, text, {
            fontFamily: "Orbitron",
            fontSize: "16px",
            color: "#000000",
            fontStyle: "bold"
        }).setOrigin(0.5);

        container.add([bg, textObj]);

        bg.on("pointerover", () => {
            bg.setFillStyle(hoverColor);
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 200,
                ease: "Back.out"
            });
        });

        bg.on("pointerout", () => {
            bg.setFillStyle(color);
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

    private lightenColor(color: number, amount: number): number {
        const r = Math.min(255, ((color >> 16) & 0xff) + Math.floor(255 * amount));
        const g = Math.min(255, ((color >> 8) & 0xff) + Math.floor(255 * amount));
        const b = Math.min(255, (color & 0xff) + Math.floor(255 * amount));
        return (r << 16) | (g << 8) | b;
    }
}
