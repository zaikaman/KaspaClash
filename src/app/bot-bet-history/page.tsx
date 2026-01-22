"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect old bot-bet-history URL to unified bet-history page
 */
export default function BotBetHistoryRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/bet-history");
    }, [router]);

    return null;
}
