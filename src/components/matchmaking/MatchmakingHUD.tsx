"use client";

import React, { useEffect, useState } from "react";
import { BlockDAGVisualizer } from "./BlockDAGVisualizer";
import { Button } from "@/components/ui/button";

interface MatchmakingHUDProps {
    waitTimeSeconds: number;
    playerCount: number;
    onCancel: () => void;
    currentBotMatchProgress?: number; // Optional prop if we want to show bot countdown
}

export default function MatchmakingHUD({
    waitTimeSeconds,
    playerCount,
    onCancel
}: MatchmakingHUDProps) {
    const [logs, setLogs] = useState<string[]>([]);

    // Simulate terminal logs
    useEffect(() => {
        const potentialLogs = [
            "Syncing with Kaspa Mainnet nodes...",
            "Validating Proof-of-Work (RandomX)...",
            "Mempool status: UNCONGESTED",
            "Broadcasting transaction intent...",
            "Searching for peer [KAS-7B-...]...",
            "Verifying block headers...",
            "DAG structure optimized.",
            "Latency check: 45ms",
            "Connecting to relay node 0x8F...",
        ];

        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                const newLog = potentialLogs[Math.floor(Math.random() * potentialLogs.length)];
                const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + "." + Math.floor(Math.random() * 999);
                setLogs(prev => [`[${timestamp}] ${newLog}`, ...prev].slice(0, 8)); // Keep last 8 logs
            }
        }, 800);

        return () => clearInterval(interval);
    }, []);

    // Format time mm:ss
    const formattedTime = new Date(waitTimeSeconds * 1000).toISOString().substr(14, 5);

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black animate-[fadeInFromBlack_1s_ease-out_forwards]">
            {/* Arrival Flash */}
            <div className="absolute inset-0 bg-white z-[60] animate-[flashOut_1.5s_ease-out_forwards] pointer-events-none"></div>

            {/* Background Visualizer - Now Absolute z-0 */}
            <div className="absolute inset-0 z-0">
                <BlockDAGVisualizer />
            </div>

            {/* Scanlines / CRT Effect Overlay - z-10 */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>

            <style jsx>{`
                @keyframes flashOut {
                    0% { opacity: 1; }
                    100% { opacity: 0; visibility: hidden; }
                }
                @keyframes fadeInFromBlack {
                    0% { filter: brightness(0); }
                    100% { filter: brightness(1); }
                }
            `}</style>

            {/* Central HUD */}
            <div className="relative z-20 w-full h-full max-w-[1920px] flex flex-col lg:flex-row items-center lg:items-stretch justify-between p-8 gap-8">

                {/* Left Panel: System Logs */}
                <div className="w-full lg:w-1/4 order-2 lg:order-1 flex items-end pb-12">
                    <div className="bg-black/60 border-l-2 border-cyber-cyan/50 p-4 w-full font-mono text-xs text-cyber-cyan/80 shadow-[0_0_15px_rgba(73,217,217,0.1)] backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-2 border-b border-cyber-cyan/20 pb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-bold tracking-widest text-white">SYSTEM_LOG</span>
                        </div>
                        <div className="flex flex-col gap-1 overflow-hidden">
                            {logs.map((log, i) => (
                                <div key={i} className="opacity-80 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-cyber-gray block truncate">{log}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center Panel: Scanner Reticle */}
                <div className="w-full lg:w-1/2 order-1 lg:order-2 flex flex-col items-center justify-center relative">
                    {/* Scanner Circle */}
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        <div className="absolute inset-0 border-2 border-cyber-cyan/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                        <div className="absolute inset-4 border border-cyber-cyan/40 rounded-full animate-[spin_3s_linear_infinite_reverse] border-t-transparent border-l-transparent"></div>

                        {/* Crosshairs */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-[1px] bg-cyber-cyan/30"></div>
                            <div className="h-full w-[1px] bg-cyber-cyan/30 absolute"></div>
                        </div>

                        {/* Scanner Bar */}
                        <div className="absolute w-full h-1 bg-cyber-cyan/80 shadow-[0_0_10px_#49D9D9] opacity-70 animate-[scan_2s_ease-in-out_infinite] top-0"></div>

                        {/* Text Status */}
                        <div className="bg-black/80 px-4 py-1 border border-cyber-cyan text-cyber-cyan font-orbitron font-bold tracking-widest text-sm z-10 animate-pulse">
                            SEARCHING
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <h2 className="text-3xl font-bold font-orbitron text-white glitch-text mb-1" data-text="NEURAL LINK ACTIVE">
                            NEURAL LINK ACTIVE
                        </h2>
                        <p className="text-cyber-gray font-mono text-sm">
                            <span className="text-cyber-gold">{playerCount}</span> SIGNALS DETECTED
                        </p>
                    </div>
                </div>

                {/* Right Panel: Match Data */}
                <div className="w-full lg:w-1/4 order-3 flex flex-col gap-4 pt-12">
                    <div className="bg-black/60 border-r-2 border-cyber-purple/50 p-4 font-orbitron text-right backdrop-blur-md">
                        <div className="text-xs text-cyber-gray uppercase tracking-widest mb-1">Elapsed Time</div>
                        <div className="text-4xl font-bold text-white tabular-nums">{formattedTime}</div>
                    </div>

                    <div className="bg-black/60 border-r-2 border-cyber-gold/50 p-4 font-orbitron text-right flex-grow flex flex-col justify-end backdrop-blur-md">
                        <div className="text-xs text-cyber-gray uppercase tracking-widest mb-2">Priority Queue</div>
                        <div className="w-full bg-cyber-gray/20 h-1 mb-1">
                            <div className="h-full bg-cyber-gold animate-[loading_2s_ease-in-out_infinite] w-full origin-left"></div>
                        </div>
                        <div className="text-cyber-gold text-xs">High Frequency Trading Mode</div>
                    </div>

                    <Button
                        onClick={onCancel}
                        variant="outline"
                        className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500 font-orbitron mt-auto"
                    >
                        ABORT LINK
                    </Button>
                </div>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0%, 100% { top: 0%; opacity: 0; }
                    10%, 90% { opacity: 1; }
                    50% { top: 100%; }
                }
                @keyframes loading {
                    0% { transform: scaleX(0); }
                    50% { transform: scaleX(1); }
                    100% { transform: scaleX(0); transform-origin: right; }
                }
            `}</style>
        </div>
    );
}
