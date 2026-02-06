import { Scene } from "phaser";
import type { MatchResult, PlayerRole } from "@/types";
import { GAME_DIMENSIONS } from "../config";
import { useTutorialStore } from "../../stores/tutorial-store";
import { EventBus } from "../EventBus";

interface ResultsSceneData {
    result: MatchResult;
    playerRole: PlayerRole | null;
    matchId: string;
    player1CharacterId: string;
    player2CharacterId: string;
    isPrivateRoom?: boolean;
    isSpectator?: boolean;
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
        const isSpectator = this.resultsData.isSpectator === true;
        const isWinner = !isSpectator &&
            ((this.resultsData.result.winner === "player1" && this.resultsData.playerRole === "player1") ||
            (this.resultsData.result.winner === "player2" && this.resultsData.playerRole === "player2"));

        // Victory/Defeat Text - spectators see "PLAYER X WINS"
        let titleText: string;
        let titleColor: string;
        let glowColor: number;
        if (isSpectator) {
            const winnerLabel = this.resultsData.result.winner === "player1" ? "PLAYER 1" : "PLAYER 2";
            titleText = `${winnerLabel} WINS`;
            titleColor = "#a855f7"; // Purple for spectator
            glowColor = 0xa855f7;
        } else {
            titleText = isWinner ? "VICTORY" : "DEFEAT";
            titleColor = isWinner ? "#49eacb" : "#ef4444";
            glowColor = isWinner ? 0x49eacb : 0xef4444;
        }

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
        let reasonText: string;
        if (isSpectator) {
            const forfeitLabel = this.resultsData.result.winner === "player1" ? "PLAYER 2" : "PLAYER 1";
            reasonText =
                this.resultsData.result.reason === "knockout" ? "KNOCKOUT!" :
                    this.resultsData.result.reason === "timeout" ? "TIME OUT" :
                        this.resultsData.result.reason === "forfeit" ? `${forfeitLabel} FORFEITED` :
                            "DECISION";
        } else {
            reasonText =
                this.resultsData.result.reason === "knockout" ? "KNOCKOUT!" :
                    this.resultsData.result.reason === "timeout" ? "TIME OUT" :
                        this.resultsData.result.reason === "forfeit" ? (isWinner ? "OPPONENT FORFEITED" : "YOU FORFEITED") :
                            "DECISION";
        }

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
        const isSpectator = this.resultsData.isSpectator === true;

        // Stats Panel Background - Increased height for rating animation
        const panel = this.add.rectangle(0, 0, 600, 260, 0x111111, 0.9)
            .setStrokeStyle(2, 0x333333);
        container.add(panel);

        const leftX = -150;
        const rightX = 150;
        const headerY = -80;
        const scoreY = -30;
        const ratingY = 50;

        // Headers - spectators see Player 1 / Player 2
        const leftHeader = isSpectator ? "PLAYER 1" : "YOU";
        const rightHeader = isSpectator ? "PLAYER 2" : "OPPONENT";
        const leftColor = isSpectator
            ? (this.resultsData.result.winner === "player1" ? "#a855f7" : "#ef4444")
            : (isWinner ? "#49eacb" : "#ef4444");
        const rightColor = isSpectator
            ? (this.resultsData.result.winner === "player2" ? "#a855f7" : "#ef4444")
            : (!isWinner ? "#49eacb" : "#ef4444");

        container.add(this.add.text(leftX, headerY, leftHeader, {
            fontFamily: "Exo 2", fontSize: "24px", color: leftColor
        }).setOrigin(0.5));

        container.add(this.add.text(rightX, headerY, rightHeader, {
            fontFamily: "Exo 2", fontSize: "24px", color: rightColor
        }).setOrigin(0.5));

        // Scores - spectators always see P1 on left, P2 on right
        const leftScore = isSpectator
            ? this.resultsData.result.player1RoundsWon
            : (this.resultsData.playerRole === "player1" ? this.resultsData.result.player1RoundsWon : this.resultsData.result.player2RoundsWon);
        const rightScore = isSpectator
            ? this.resultsData.result.player2RoundsWon
            : (this.resultsData.playerRole === "player1" ? this.resultsData.result.player2RoundsWon : this.resultsData.result.player1RoundsWon);

        container.add(this.add.text(leftX, scoreY, `${leftScore} WINS`, {
            fontFamily: "Orbitron", fontSize: "40px", color: "#ffffff"
        }).setOrigin(0.5));

        container.add(this.add.text(0, scoreY, "-", {
            fontFamily: "Orbitron", fontSize: "40px", color: "#666666"
        }).setOrigin(0.5));

        container.add(this.add.text(rightX, scoreY, `${rightScore} WINS`, {
            fontFamily: "Orbitron", fontSize: "40px", color: "#ffffff"
        }).setOrigin(0.5));

        // Check if this is a private room match (no ELO changes)
        const isPrivateRoom = this.resultsData.isPrivateRoom || this.resultsData.result.isPrivateRoom;

        // Rating Changes Display
        const ratingChanges = this.resultsData.result.ratingChanges;
        if (isPrivateRoom) {
            // Private room match - show "No ELO Changed!" message
            container.add(this.add.text(0, ratingY - 20, "RATING", {
                fontFamily: "Exo 2", fontSize: "16px", color: "#666666"
            }).setOrigin(0.5));

            const noEloText = this.add.text(0, ratingY + 25, "NO ELO CHANGED!", {
                fontFamily: "Orbitron", fontSize: "28px", color: "#f59e0b",
                stroke: "#000000", strokeThickness: 3
            }).setOrigin(0.5).setAlpha(0);
            container.add(noEloText);

            const privateRoomNote = this.add.text(0, ratingY + 60, "Private Room Match", {
                fontFamily: "Exo 2", fontSize: "16px", color: "#888888"
            }).setOrigin(0.5).setAlpha(0);
            container.add(privateRoomNote);

            // Animate the "No ELO Changed!" text
            this.tweens.add({
                targets: noEloText,
                alpha: 1,
                scale: { from: 0.5, to: 1 },
                duration: 800,
                delay: 800,
                ease: "Back.out"
            });

            this.tweens.add({
                targets: privateRoomNote,
                alpha: 0.8,
                duration: 500,
                delay: 1200,
                ease: "Power2"
            });

            // Add a subtle pulse effect to make it noticeable
            this.tweens.add({
                targets: noEloText,
                scale: 1.05,
                yoyo: true,
                repeat: 2,
                duration: 400,
                delay: 1600,
                ease: "Sine.easeInOut"
            });
        } else if (ratingChanges) {
            // For spectators: left = player1 (winner if p1 won), right = player2
            // For players: left = you, right = opponent
            let leftRating, rightRating;
            if (isSpectator) {
                leftRating = this.resultsData.result.winner === "player1" ? ratingChanges.winner : ratingChanges.loser;
                rightRating = this.resultsData.result.winner === "player2" ? ratingChanges.winner : ratingChanges.loser;
            } else {
                leftRating = isWinner ? ratingChanges.winner : ratingChanges.loser;
                rightRating = isWinner ? ratingChanges.loser : ratingChanges.winner;
            }

            // Rating label
            container.add(this.add.text(0, ratingY - 20, "RATING", {
                fontFamily: "Exo 2", fontSize: "16px", color: "#666666"
            }).setOrigin(0.5));

            // Left Rating Text (Start at 'before')
            const myRatingText = this.add.text(leftX, ratingY + 15, `${leftRating.before}`, {
                fontFamily: "Orbitron", fontSize: "56px", color: "#ffffff",
                stroke: "#000000", strokeThickness: 4
            }).setOrigin(0.5);
            container.add(myRatingText);

            // Left Change Text (e.g. +25)
            const myChangeStr = leftRating.change >= 0 ? `+${leftRating.change}` : `${leftRating.change}`;
            const myChangeColor = leftRating.change >= 0 ? "#49eacb" : "#ef4444";
            const myChangeText = this.add.text(leftX, ratingY + 60, myChangeStr, {
                fontFamily: "Orbitron", fontSize: "24px", color: myChangeColor,
                fontStyle: "bold"
            }).setOrigin(0.5).setAlpha(0).setScale(0.5);
            container.add(myChangeText);

            // Right Rating Text
            const opRatingText = this.add.text(rightX, ratingY + 15, `${rightRating.before}`, {
                fontFamily: "Orbitron", fontSize: "56px", color: "#ffffff",
                stroke: "#000000", strokeThickness: 4
            }).setOrigin(0.5);
            container.add(opRatingText);

            // Right Change Text
            const opChangeStr = rightRating.change >= 0 ? `+${rightRating.change}` : `${rightRating.change}`;
            const opChangeColor = rightRating.change >= 0 ? "#49eacb" : "#ef4444";
            const opChangeText = this.add.text(rightX, ratingY + 60, opChangeStr, {
                fontFamily: "Orbitron", fontSize: "24px", color: opChangeColor,
                fontStyle: "bold"
            }).setOrigin(0.5).setAlpha(0).setScale(0.5);
            container.add(opChangeText);

            // Animate left rating
            this.tweens.addCounter({
                from: leftRating.before,
                to: leftRating.after,
                duration: 2000,
                ease: "Power2",
                delay: 800,
                onUpdate: (tween) => {
                    const val = Math.round(tween.getValue());
                    myRatingText.setText(`${val}`);
                    // Pulse effect on update
                    if (Math.random() > 0.8 && leftRating.change !== 0) {
                        myRatingText.setTint(leftRating.change > 0 ? 0x49eacb : 0xef4444);
                        setTimeout(() => myRatingText.clearTint(), 50);
                    }
                },
                onComplete: () => {
                    myRatingText.setText(`${leftRating.after}`); // Ensure final value
                    myRatingText.setTint(leftRating.change >= 0 ? 0x49eacb : 0xef4444); // Final tint

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

            // Animate right rating
            this.tweens.addCounter({
                from: rightRating.before,
                to: rightRating.after,
                duration: 2000,
                ease: "Power2",
                delay: 800,
                onUpdate: (tween) => {
                    const val = Math.round(tween.getValue());
                    opRatingText.setText(`${val}`);
                },
                onComplete: () => {
                    opRatingText.setText(`${rightRating.after}`);

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
            // Explanation Text
            container.add(this.add.text(0, 160, "Ranked Match: Wins increase Rating, Losses decrease it.", {
                fontFamily: "Exo 2", fontSize: "14px", color: "#666666", fontStyle: "italic"
            }).setOrigin(0.5));
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
        const isSpectator = this.resultsData.isSpectator === true;
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

        // Return Button (right) - different destination for spectators vs players
        const returnLabel = isSpectator ? "👁 BACK TO SPECTATE" : "🏠 RETURN TO MENU";
        const returnPath = isSpectator ? "/spectate" : "/matchmaking";
        const returnBtn = this.createButton(
            GAME_DIMENSIONS.CENTER_X + buttonSpacing,
            y,
            returnLabel,
            () => {
                if (!isSpectator) {
                    const { isActive, currentStep, setStep } = useTutorialStore.getState();
                    if (isActive && currentStep === 'fighting') {
                        setStep('post_game_tour');
                    }
                }
                EventBus.emit("navigate", { path: returnPath });
            },
            isSpectator ? 0xa855f7 : 0x6b7280 // Purple for spectator, gray for player
        );

        // Add visual hint (pulsing arrow)
        const hintArrow = this.add.text(
            GAME_DIMENSIONS.CENTER_X + buttonSpacing,
            y - 50,
            "▼",
            {
                fontFamily: "monospace",
                fontSize: "24px",
                color: "#49eacb",
            }
        ).setOrigin(0.5);

        const hintText = this.add.text(
            GAME_DIMENSIONS.CENTER_X + buttonSpacing,
            y - 75,
            isSpectator ? "CLICK TO GO BACK" : "CLICK TO RETURN",
            {
                fontFamily: "Exo 2",
                fontSize: "12px",
                color: "#49eacb",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: [hintArrow],
            y: y - 40,
            yoyo: true,
            repeat: -1,
            duration: 600,
            ease: "Sine.easeInOut"
        });

        this.tweens.add({
            targets: [hintText],
            alpha: 0.7,
            yoyo: true,
            repeat: -1,
            duration: 1000,
            ease: "Sine.easeInOut"
        });
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
