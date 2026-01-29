import React from "react";
// GameLayout removed for immersive fullscreen experience
import MatchmakingQueue from "@/components/matchmaking/MatchmakingQueue";

export default function QueuePage() {
    return (
        <main className="w-full h-screen bg-black overflow-hidden relative">
            <MatchmakingQueue />
        </main>
    );
}
