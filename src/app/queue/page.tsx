import React from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import MatchmakingQueue from "@/components/matchmaking/MatchmakingQueue";

export default function QueuePage() {
    return (
        <LandingLayout>
            <div className="min-h-screen flex items-center justify-center pt-24 sm:pt-20 px-4 sm:px-6">
                <MatchmakingQueue />
            </div>
        </LandingLayout>
    );
}
