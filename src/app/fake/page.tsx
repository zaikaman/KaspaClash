"use client";

/**
 * Fake Scene Page - Animation Testing
 * Used to manually test and adjust character animation scales
 */

import React, { useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(
    () => import("@/game/PhaserGame").then((mod) => mod.PhaserGame),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[600px] bg-black/50 border border-cyber-gray/30 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-cyber-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-cyber-gold font-orbitron tracking-widest uppercase text-sm">Loading Animation Tester...</p>
                </div>
            </div>
        )
    }
);

export default function FakePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
            {/* Header */}
            <div className="bg-black/80 border-b border-cyan-500/30 py-4 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-cyan-400">Animation Testing Scene</h1>
                    <a
                        href="/"
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                    >
                        ← Back to Home
                    </a>
                </div>
            </div>

            {/* Game Container */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div
                    className="mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/20"
                    style={{ width: "1024px", maxWidth: "100%" }}
                >
                    <PhaserGame
                        currentScene="FakeScene"
                    />
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-gray-800/50 rounded-xl p-6 max-w-3xl mx-auto">
                    <h2 className="text-lg font-bold text-cyan-400 mb-3">Instructions</h2>
                    <ul className="text-gray-300 space-y-2 text-sm">
                        <li>• Use <span className="text-yellow-400">◀ ▶</span> buttons or <span className="text-yellow-400">← →</span> arrow keys to switch characters</li>
                        <li>• Click animation buttons at bottom to test each animation</li>
                        <li>• Use scale adjustment buttons to fine-tune character size</li>
                        <li>• Note down the optimal scale values for each character/animation</li>
                        <li>• The <span className="text-magenta-400">Scale: X.XXX</span> value shows current scale</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
