import React from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import MatchmakingQueue from "@/components/matchmaking/MatchmakingQueue";

export default function QueuePage() {
    return (
        <LandingLayout>
            <div className="min-h-screen flex items-center justify-center pt-20">
                <MatchmakingQueue />
            </div>
        </LandingLayout>
    );
}
