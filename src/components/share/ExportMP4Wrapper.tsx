"use client";

/**
 * Client-side wrapper for ExportMP4Button
 * This prevents SSR import chain issues with Phaser
 */

import dynamic from "next/dynamic";

// Dynamically import ExportMP4Button to avoid SSR issues
const ExportMP4Button = dynamic(
    () => import("./ExportMP4Button").then((mod) => mod.ExportMP4Button),
    {
        ssr: false,
        loading: () => (
            <div className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-600/50 to-orange-600/50 text-white/50 font-orbitron rounded-lg">
                <div className="w-5 h-5 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
            </div>
        ),
    }
);

interface ExportMP4WrapperProps {
    matchId: string;
    disabled?: boolean;
}

export function ExportMP4Wrapper({ matchId, disabled }: ExportMP4WrapperProps) {
    return <ExportMP4Button matchId={matchId} disabled={disabled} />;
}
