import { useEffect, useRef } from "react";
import { useWallet } from "@/hooks/useWallet";

/**
 * Hook to clean up abandoned bot matches when user navigates away from an active match.
 * Checks for bot matches where the user has been disconnected for 30+ seconds
 * and auto-completes them with the bot as the winner.
 */
export function useAbandonedMatchCleanup() {
  const { address } = useWallet();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check once per page load
    if (!address || hasCheckedRef.current) return;

    hasCheckedRef.current = true;

    const checkAbandonedMatches = async () => {
      try {
        const response = await fetch("/api/matches/cleanup-abandoned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.completedMatches && result.completedMatches.length > 0) {
            console.log(
              `[AbandonedMatchCleanup] Completed ${result.completedMatches.length} abandoned bot match(es)`
            );
          }
        }
      } catch (error) {
        console.error("[AbandonedMatchCleanup] Error:", error);
      }
    };

    // Check immediately and then every 30 seconds
    checkAbandonedMatches();
    const interval = setInterval(checkAbandonedMatches, 30000);

    return () => clearInterval(interval);
  }, [address]);
}
