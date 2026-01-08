import React from "react";
import GameLayout from "@/components/layout/GameLayout";
import MatchmakingQueue from "@/components/matchmaking/MatchmakingQueue";

export default function QueuePage() {
    return (
        <GameLayout>
            <div className="min-h-screen flex items-center justify-center pt-10 px-4 sm:px-6">
                <MatchmakingQueue />
            </div>
        </GameLayout>
    );
}
