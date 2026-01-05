"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

import { HugeiconsIcon } from "@hugeicons/react";
import { NewTwitterIcon } from "@hugeicons/core-free-icons";

interface ShareMatchButtonProps {
    matchId: string;
    winnerCharacter: string;
}

export default function ShareMatchButton({ matchId, winnerCharacter }: ShareMatchButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        // Copy replay URL for sharing
        const url = `${window.location.origin}/replay/${matchId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleTwitterShare = () => {
        // Share replay URL on Twitter
        const url = `${window.location.origin}/replay/${matchId}`;
        const text = `I just won a match with ${winnerCharacter} in KaspaClash! ⚔️ Watch the full replay! The first real-time fighter on BlockDAG.`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    };

    return (
        <div className="flex gap-4">
            <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 border-cyber-gold text-cyber-gold hover:bg-cyber-gold/10 font-orbitron"
            >
                {copied ? "COPIED!" : "COPY REPLAY LINK"}
            </Button>
            <Button
                onClick={handleTwitterShare}
                className="flex-1 bg-[#1DA1F2] hover:bg-[#1a94df] text-white border-0 font-orbitron flex items-center gap-2 justify-center"
            >
                <HugeiconsIcon icon={NewTwitterIcon} className="w-4 h-4" />
                SHARE REPLAY
            </Button>
        </div>
    );
}
