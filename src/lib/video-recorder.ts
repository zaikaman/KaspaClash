/**
 * MP4 Video Exporter
 * Renders replay in a hidden Phaser game
 * Records canvas and encodes to MP4 with audio
 * Captures Phaser's internal audio output (BGM + SFX) while keeping speakers silent
 */

import { Muxer, ArrayBufferTarget } from "mp4-muxer";

// Replay data type (duplicated to avoid import chain issues)
export interface ReplayRoundData {
    roundNumber: number;
    player1Move: string;
    player2Move: string;
    player1DamageDealt: number;
    player2DamageDealt: number;
    player1HealthAfter: number;
    player2HealthAfter: number;
    winnerAddress: string | null;
}

export interface ReplayData {
    matchId: string;
    player1Address: string;
    player2Address: string;
    player1Character: string;
    player2Character: string;
    winnerAddress: string | null;
    player1RoundsWon: number;
    player2RoundsWon: number;
    rounds: ReplayRoundData[];
}

export interface MP4ExportOptions {
    width?: number;
    height?: number;
    frameRate?: number;
    videoBitrate?: number;
    audioBitrate?: number;
    onProgress?: (progress: number, status: string) => void;
    onComplete?: (blob: Blob) => void;
    onError?: (error: Error) => void;
}

/**
 * Check if VideoEncoder and AudioEncoder APIs are available
 */
export function isMP4ExportSupported(): boolean {
    if (typeof window === "undefined") return false;
    return (
        typeof VideoEncoder !== "undefined" &&
        typeof AudioEncoder !== "undefined" &&
        typeof OffscreenCanvas !== "undefined"
    );
}

/**
 * Export a replay to MP4 format with audio
 * Reroutes Phaser's audio to MP4 encoder while muting speaker output
 */
export async function exportReplayToMP4(
    replayData: ReplayData,
    options: MP4ExportOptions = {}
): Promise<Blob> {
    const {
        width = 1280,
        height = 720,
        frameRate = 30,
        videoBitrate = 8_000_000,
        audioBitrate = 128_000,
        onProgress,
        onError,
    } = options;

    // Check support
    if (!isMP4ExportSupported()) {
        const error = new Error(
            "VideoEncoder/AudioEncoder API is not supported. Please use Chrome, Edge, or Opera."
        );
        onError?.(error);
        throw error;
    }

    return new Promise((resolve, reject) => {
        onProgress?.(5, "Initializing...");

        // Create hidden container for Phaser
        const container = document.createElement("div");
        container.style.cssText = `
            position: fixed;
            left: -9999px;
            top: -9999px;
            width: ${width}px;
            height: ${height}px;
            visibility: hidden;
            pointer-events: none;
        `;
        document.body.appendChild(container);

        // Audio setup
        const sampleRate = 48000;
        const numberOfChannels = 2;
        let audioContext: AudioContext | null = null;
        let scriptProcessor: ScriptProcessorNode | null = null;

        // Dynamically import Phaser and scene
        Promise.all([
            import("phaser"),
            import("@/game/scenes/ReplayScene"),
            import("@/game/EventBus"),
        ])
            .then(async ([PhaserModule, ReplaySceneModule, EventBusModule]) => {
                const Phaser = PhaserModule.default || PhaserModule;
                const { ReplayScene } = ReplaySceneModule;
                const { EventBus } = EventBusModule;

                // Create custom AudioContext
                audioContext = new AudioContext({ sampleRate });

                // MP4 Muxer setup
                const target = new ArrayBufferTarget();
                const muxerOptions: any = {
                    target,
                    video: {
                        codec: "avc",
                        width,
                        height,
                    },
                    audio: {
                        codec: "aac",
                        numberOfChannels,
                        sampleRate,
                    },
                    fastStart: "in-memory",
                };

                const muxer = new Muxer(muxerOptions);

                // Video encoder
                let frameCount = 0;
                let isComplete = false;
                const frameDurationMicros = 1_000_000 / frameRate;

                const videoEncoder = new VideoEncoder({
                    output: (chunk, meta) => {
                        muxer.addVideoChunk(chunk, meta ?? undefined);
                    },
                    error: (e) => {
                        console.error("VideoEncoder error:", e);
                        onError?.(new Error(`VideoEncoder error: ${e.message}`));
                    },
                });

                videoEncoder.configure({
                    codec: "avc1.42001f",
                    width,
                    height,
                    bitrate: videoBitrate,
                    framerate: frameRate,
                });

                // Audio encoder
                let audioTimestamp = 0;
                const audioEncoder = new AudioEncoder({
                    output: (chunk, meta) => {
                        muxer.addAudioChunk(chunk, meta ?? undefined);
                    },
                    error: (e) => {
                        console.error("AudioEncoder error:", e);
                    },
                });

                audioEncoder.configure({
                    codec: "mp4a.40.2", // AAC-LC
                    numberOfChannels,
                    sampleRate,
                    bitrate: audioBitrate,
                });

                // Create Phaser game with AUDIO ENABLED, passing our context
                const gameConfig: Phaser.Types.Core.GameConfig = {
                    type: Phaser.CANVAS,
                    parent: container,
                    width,
                    height,
                    backgroundColor: "#0a0a0a",
                    scene: [],
                    audio: {
                        noAudio: false,
                        context: audioContext, // Use our context
                    },
                    fps: {
                        target: 60,
                        forceSetTimeOut: false,
                    },
                    render: {
                        antialias: true,
                        pixelArt: false,
                    },
                };

                const game = new Phaser.Game(gameConfig);

                // Validate replay data
                if (!replayData.player1Address || !replayData.player2Address) {
                    console.error("Invalid replay data:", replayData);
                    const error = new Error("Invalid replay data: missing player addresses");
                    onError?.(error);
                    container.remove();
                    reject(error);
                    return;
                }

                // Scene config - ENABLE audio in scene so sounds actually play
                const sceneConfig = {
                    matchId: replayData.matchId,
                    player1Address: replayData.player1Address,
                    player2Address: replayData.player2Address,
                    player1Character: replayData.player1Character,
                    player2Character: replayData.player2Character,
                    winnerAddress: replayData.winnerAddress,
                    player1RoundsWon: replayData.player1RoundsWon,
                    player2RoundsWon: replayData.player2RoundsWon,
                    rounds: replayData.rounds,
                    speedMultiplier: 1,
                    muteAudio: false, // Let the scene play full audio
                };

                console.log("Starting ReplayScene with full audio capture:", sceneConfig);

                const estimatedDurationMs = (1.5 + replayData.rounds.length * 5 + 3) * 1000;

                const cleanup = () => {
                    try {
                        EventBus.off("replay:complete");
                        if (scriptProcessor) scriptProcessor.disconnect();
                        if (audioContext && audioContext.state !== "closed") audioContext.close();
                        game.destroy(true);
                        container.remove();
                    } catch (e) {
                        console.warn("Cleanup error:", e);
                    }
                };

                game.events.on("ready", () => {
                    onProgress?.(10, "Starting replay...");

                    // REROUTE AUDIO: Phaser -> Encoder (Silent Speaker)
                    if (audioContext && game.sound) {
                        // 1. Get Phaser's master volume node (it holds the mixed audio from BGM + SFX)
                        // In Phaser 3, game.sound can be cast to WebAudioSoundManager to access masterVolumeNode
                        const soundManager = game.sound as any;
                        const masterNode = soundManager.masterVolumeNode as GainNode;

                        if (masterNode) {
                            // 2. Disconnect from speakers (destination)
                            // This stops the sound from playing out loud
                            try {
                                masterNode.disconnect();
                            } catch (e) {
                                // Sometimes it might not be connected yet, safe to ignore
                            }

                            // 3. Create Capture Node (ScriptProcessor)
                            scriptProcessor = audioContext.createScriptProcessor(4096, 2, 2);

                            // 4. Create Silent Sink
                            // ScriptProcessor needs to flow somewhere to keep 'alive', but we want 0 volume
                            const silentGain = audioContext.createGain();
                            silentGain.gain.value = 0;

                            // 5. Connect the Graph:
                            // Phaser Master -> ScriptProcessor (Capture) -> Silent Gain -> Destination (Speakers)
                            masterNode.connect(scriptProcessor);
                            scriptProcessor.connect(silentGain);
                            silentGain.connect(audioContext.destination);

                            // 6. Capture Logic
                            scriptProcessor.onaudioprocess = (e) => {
                                if (isComplete) return;

                                const left = e.inputBuffer.getChannelData(0);
                                const right = e.inputBuffer.getChannelData(1);

                                try {
                                    const audioData = new AudioData({
                                        format: "f32-planar",
                                        sampleRate,
                                        numberOfFrames: left.length,
                                        numberOfChannels,
                                        timestamp: audioTimestamp,
                                        data: new Float32Array([...left, ...right]),
                                    });

                                    audioEncoder.encode(audioData);
                                    audioData.close();

                                    audioTimestamp += (left.length / sampleRate) * 1_000_000;
                                } catch (err) {
                                    // Ignore encoding errors
                                }
                            };
                        }
                    }

                    // Add and start the scene
                    game.scene.add("ReplayScene", ReplayScene, true, sceneConfig);

                    const scene = game.scene.getScene("ReplayScene");
                    if (!scene) {
                        cleanup();
                        reject(new Error("Failed to get ReplayScene"));
                        return;
                    }

                    // Listen for replay complete
                    EventBus.on("replay:complete", async () => {
                        if (isComplete) return;
                        isComplete = true;

                        onProgress?.(90, "Finalizing video...");

                        try {
                            await videoEncoder.flush();
                            await audioEncoder.flush();
                            muxer.finalize();

                            const buffer = target.buffer;
                            const blob = new Blob([buffer], { type: "video/mp4" });

                            onProgress?.(100, "Complete!");
                            cleanup();
                            resolve(blob);
                        } catch (err) {
                            cleanup();
                            reject(err);
                        }
                    });

                    // Frame capture loop
                    const captureIntervalMs = 1000 / frameRate;
                    let captureIntervalId: ReturnType<typeof setInterval>;

                    const captureFrame = () => {
                        if (isComplete) {
                            clearInterval(captureIntervalId);
                            return;
                        }

                        const canvas = game.canvas;
                        if (canvas) {
                            try {
                                const timestamp = frameCount * frameDurationMicros;
                                const videoFrame = new VideoFrame(canvas, {
                                    timestamp,
                                    duration: frameDurationMicros,
                                });

                                videoEncoder.encode(videoFrame, {
                                    keyFrame: frameCount % (frameRate * 2) === 0,
                                });
                                videoFrame.close();
                                frameCount++;

                                const elapsedMs = frameCount * captureIntervalMs;
                                const progress = Math.min(
                                    85,
                                    10 + Math.round((elapsedMs / estimatedDurationMs) * 75)
                                );
                                onProgress?.(progress, `Recording... (${frameCount} frames)`);
                            } catch (e) {
                                console.warn("Frame capture error:", e);
                            }
                        }
                    };

                    captureIntervalId = setInterval(captureFrame, captureIntervalMs);
                });

                // Timeout safety
                setTimeout(() => {
                    if (!isComplete) {
                        isComplete = true;
                        onError?.(new Error("Export timed out"));
                        cleanup();
                        reject(new Error("Export timed out"));
                    }
                }, 5 * 60 * 1000);
            })
            .catch((err) => {
                container.remove();
                onError?.(err);
                reject(err);
            });
    });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Fetch replay data from API
 */
export async function fetchReplayData(matchId: string): Promise<ReplayData> {
    const response = await fetch(`/api/replay-data?matchId=${encodeURIComponent(matchId)}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch replay data");
    }
    return response.json();
}
