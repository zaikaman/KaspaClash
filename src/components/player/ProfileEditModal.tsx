"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerAddress: string;
    currentDisplayName: string | null;
    currentAvatarUrl: string | null;
    onProfileUpdated: () => void;
}

export default function ProfileEditModal({
    isOpen,
    onClose,
    playerAddress,
    currentDisplayName,
    currentAvatarUrl,
    onProfileUpdated,
}: ProfileEditModalProps) {
    const [displayName, setDisplayName] = useState(currentDisplayName || "");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
    const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be less than 5MB");
            return;
        }

        setError(null);

        // Create preview and base64
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setAvatarPreview(result);
            setAvatarBase64(result);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const body: { displayName?: string; avatarBase64?: string } = {};

            // Only include fields that changed
            if (displayName && displayName !== currentDisplayName) {
                body.displayName = displayName;
            }

            if (avatarBase64) {
                body.avatarBase64 = avatarBase64;
            }

            if (Object.keys(body).length === 0) {
                setError("No changes to save");
                setIsLoading(false);
                return;
            }

            const response = await fetch(`/api/players/${encodeURIComponent(playerAddress)}/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update profile");
            }

            onProfileUpdated();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-cyber-black border border-cyber-gold/30 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold font-orbitron text-white">
                        EDIT PROFILE
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-cyber-gray hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-cyber-gold/50 bg-black cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {avatarPreview ? (
                                <Image
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-6xl">🥷</span>
                                </div>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-sm font-orbitron">CHANGE</span>
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm text-cyber-gold hover:text-cyber-orange transition-colors font-orbitron"
                        >
                            Upload Avatar
                        </button>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm text-cyber-gray mb-2 font-orbitron">
                            DISPLAY NAME
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter display name"
                            maxLength={32}
                            className="w-full px-4 py-3 bg-black/60 border border-cyber-gold/30 rounded-lg text-white font-mono focus:outline-none focus:border-cyber-gold transition-colors"
                        />
                        <p className="text-xs text-cyber-gray mt-1">
                            1-32 characters, letters, numbers, and underscores only
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 border border-cyber-gray/30 text-cyber-gray hover:text-white hover:border-white transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-cyber-gold to-cyber-orange text-black font-bold font-orbitron hover:opacity-90 transition-opacity"
                            disabled={isLoading}
                        >
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
