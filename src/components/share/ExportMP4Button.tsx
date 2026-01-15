"use client";

/**
 * Export MP4 Button Component
 * Handles the MP4 export process with progress indication
 * Runs replay in hidden Phaser game at accelerated speed
 */

import React, { useState, useCallback } from "react";
import {
    isMP4ExportSupported,
    exportReplayToMP4,
    downloadBlob,
    fetchReplayData,
} from "@/lib/video-recorder";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";

interface ExportMP4ButtonProps {
    matchId: string;
    disabled?: boolean;
}

export function ExportMP4Button({ matchId, disabled = false }: ExportMP4ButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSupported] = useState(() =>
        typeof window !== "undefined" && isMP4ExportSupported()
    );

    const handleExport = useCallback(async () => {
        if (isExporting || disabled) return;

        setIsExporting(true);
        setProgress(0);
        setStatus("Fetching match data...");
        setError(null);

        try {
            // Fetch replay data
            const replayData = await fetchReplayData(matchId);
            setProgress(5);
            setStatus("Preparing replay...");

            // Export to MP4 - runs at normal speed for correct timing
            const blob = await exportReplayToMP4(replayData, {
                width: 1280,
                height: 720,
                frameRate: 30,
                videoBitrate: 8_000_000,
                onProgress: (prog, stat) => {
                    setProgress(prog);
                    setStatus(stat);
                },
                onError: (err) => setError(err.message),
            });

            // Download the file
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `KaspaClash_Match_${matchId.slice(0, 8)}_${timestamp}.mp4`;
            downloadBlob(blob, filename);

            setProgress(100);
            setStatus("Download complete!");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Export failed");
        } finally {
            // Reset after a short delay
            setTimeout(() => {
                setIsExporting(false);
                setProgress(0);
                setStatus("");
            }, 2000);
        }
    }, [matchId, isExporting, disabled]);

    // Don't render if not supported
    if (!isSupported) {
        return null;
    }

    return (
        <div className="relative">
            <button
                onClick={handleExport}
                disabled={isExporting || disabled}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-orbitron rounded-lg hover:from-red-500 hover:to-orange-500 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExporting ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">{status || `EXPORTING... ${progress}%`}</span>
                    </>
                ) : (
                    <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        <span>EXPORT MP4</span>
                    </>
                )}
            </button>

            {isExporting && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700 rounded-b-lg overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {/* Warning when exporting */}
            {isExporting && (
                <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-500/30 rounded text-center flex items-center justify-center gap-2">
                    <HugeiconsIcon icon={Alert02Icon} className="w-3 h-3 text-yellow-500 animate-pulse" />
                    <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">
                        Do not switch tabs while exporting
                    </p>
                    <HugeiconsIcon icon={Alert02Icon} className="w-3 h-3 text-yellow-500 animate-pulse" />
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="mt-2 p-3 bg-red-900/50 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
            )}

            {/* Export info */}
            {!isExporting && !error && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                    Exports the full match replay as MP4 video (takes ~30-60 seconds)
                </p>
            )}
        </div>
    );
}
