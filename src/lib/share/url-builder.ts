/**
 * Share URL Builder
 * Generates shareable URLs for match summaries and replays
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Parameters for generating a match share URL.
 */
export interface MatchShareParams {
  /** Match ID */
  matchId: string;
  /** Optional winner character name for UTM */
  winnerCharacter?: string;
  /** Optional source for tracking */
  source?: "twitter" | "copy" | "direct";
}

/**
 * Generated share URLs.
 */
export interface ShareUrls {
  /** Direct match URL */
  matchUrl: string;
  /** Replay URL */
  replayUrl: string;
  /** Twitter share URL with pre-filled text */
  twitterUrl: string;
  /** Copy-friendly URL */
  copyUrl: string;
}

// =============================================================================
// URL BUILDERS
// =============================================================================

/**
 * Get the base URL for the application.
 * Uses environment variable in production, window.location in browser, or fallback.
 */
export function getBaseUrl(): string {
  // Server-side: use env variable
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL || "https://kaspaclash.com";
  }
  // Client-side: use window.location
  return window.location.origin;
}

/**
 * Build a match share URL.
 */
export function buildMatchUrl(matchId: string, source?: string): string {
  const baseUrl = getBaseUrl();
  const url = new URL(`/m/${matchId}`, baseUrl);
  
  if (source) {
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", "share");
    url.searchParams.set("utm_campaign", "match_share");
  }
  
  return url.toString();
}

/**
 * Build a replay URL for watching the match.
 */
export function buildReplayUrl(matchId: string, source?: string): string {
  const baseUrl = getBaseUrl();
  const url = new URL(`/replay/${matchId}`, baseUrl);
  
  if (source) {
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", "share");
    url.searchParams.set("utm_campaign", "replay_share");
  }
  
  return url.toString();
}

/**
 * Build a Twitter share URL.
 */
export function buildTwitterShareUrl(params: MatchShareParams): string {
  const { matchId, winnerCharacter } = params;
  
  const matchUrl = buildMatchUrl(matchId, "twitter");
  
  // Build the share text
  let text: string;
  if (winnerCharacter) {
    text = `I just won a match with ${winnerCharacter} in KaspaClash! ⚔️\n\nWatch the full replay! The first real-time fighter on BlockDAG. #KaspaClash #BlockDAG`;
  } else {
    text = `Check out this match on KaspaClash! ⚔️\n\nWatch the full replay! The first real-time fighter on BlockDAG. #KaspaClash #BlockDAG`;
  }
  
  // Use replay URL for Twitter shares so people can watch the match
  const replayUrl = buildReplayUrl(matchId, "twitter");
  
  const twitterUrl = new URL("https://twitter.com/intent/tweet");
  twitterUrl.searchParams.set("text", text);
  twitterUrl.searchParams.set("url", replayUrl);
  
  return twitterUrl.toString();
}

/**
 * Generate all share URLs for a match.
 */
export function generateShareUrls(params: MatchShareParams): ShareUrls {
  const { matchId, winnerCharacter } = params;
  
  return {
    matchUrl: buildMatchUrl(matchId),
    replayUrl: buildReplayUrl(matchId),
    twitterUrl: buildTwitterShareUrl({ matchId, winnerCharacter }),
    copyUrl: buildReplayUrl(matchId, "copy"), // Use replay URL for copy
  };
}

// =============================================================================
// SHARE UTILITIES
// =============================================================================

/**
 * Copy URL to clipboard with fallback.
 */
export async function copyToClipboard(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch {
    console.error("Failed to copy to clipboard");
    return false;
  }
}

/**
 * Open Twitter share dialog.
 */
export function shareOnTwitter(params: MatchShareParams): void {
  const url = buildTwitterShareUrl(params);
  window.open(url, "_blank", "width=550,height=420");
}

/**
 * Use Web Share API if available, with fallback to copy.
 */
export async function shareMatch(params: MatchShareParams): Promise<{ method: "native" | "clipboard"; success: boolean }> {
  const { matchId, winnerCharacter } = params;
  const matchUrl = buildMatchUrl(matchId, "native");
  
  // Try native share first
  if (navigator.share) {
    try {
      await navigator.share({
        title: "KaspaClash Match",
        text: winnerCharacter
          ? `Check out my ${winnerCharacter} victory in KaspaClash!`
          : "Check out this KaspaClash match!",
        url: matchUrl,
      });
      return { method: "native", success: true };
    } catch (error) {
      // User cancelled or share failed, fall back to clipboard
      if ((error as Error).name !== "AbortError") {
        console.warn("Native share failed, falling back to clipboard");
      }
    }
  }
  
  // Fallback to clipboard
  const success = await copyToClipboard(matchUrl);
  return { method: "clipboard", success };
}

/**
 * Generate a short match ID for display.
 */
export function formatMatchId(matchId: string): string {
  if (matchId.length <= 8) return matchId;
  return `${matchId.slice(0, 4)}...${matchId.slice(-4)}`;
}
