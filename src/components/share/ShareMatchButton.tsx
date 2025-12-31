import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface ShareMatchButtonProps {
    matchId: string;
    winnerCharacter: string;
}

export default function ShareMatchButton({ matchId, winnerCharacter }: ShareMatchButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const url = `${window.location.origin}/m/${matchId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleTwitterShare = () => {
        const url = `${window.location.origin}/m/${matchId}`;
        const text = `I just won a match with ${winnerCharacter} in KaspaClash! The first real-time fighter on BlockDAG.`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    };

    return (
        <div className="flex gap-4">
            <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 border-cyber-gold text-cyber-gold hover:bg-cyber-gold/10 font-orbitron"
            >
                {copied ? "COPIED!" : "COPY LINK"}
            </Button>
            <Button
                onClick={handleTwitterShare}
                className="flex-1 bg-[#1DA1F2] hover:bg-[#1a94df] text-white border-0 font-orbitron flex items-center gap-2 justify-center"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                SHARE
            </Button>
        </div>
    );
}
