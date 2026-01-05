/**
 * Match Results Overlay
 * Displays match winner, stats, and Kaspa explorer link
 */

"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getExplorerLink } from "@/lib/game/move-service";
import { shareMatch, buildMatchUrl } from "@/lib/share/url-builder";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChampionIcon, Globe02Icon, Share05Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { MatchResult, PlayerRole } from "@/types";

/**
 * Match results props.
 */
export interface MatchResultsProps {
  matchId: string;
  result: MatchResult;
  playerRole: PlayerRole;
  onClose: () => void;
  onPlayAgain?: () => void;
  /** Winner character name for share message */
  winnerCharacter?: string;
}

/**
 * Match results overlay component.
 */
export function MatchResults({
  matchId,
  result,
  playerRole,
  onClose,
  onPlayAgain,
  winnerCharacter,
}: MatchResultsProps) {
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared">("idle");
  const isWinner = result.winner === playerRole;
  const isDraw = result.winner === null;

  // Build explorer link for the first transaction
  const explorerLink = useMemo(() => {
    if (result.txIds.length > 0) {
      return getExplorerLink(result.txIds[0]);
    }
    return null;
  }, [result.txIds]);

  // Handle share button click
  const handleShare = async () => {
    const { copied } = await handleShareResult(matchId, isWinner ? winnerCharacter : undefined);
    setShareStatus(copied ? "copied" : "shared");
    setTimeout(() => setShareStatus("idle"), 2000);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-[#49eacb]/30">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {isDraw ? (
              <span className="text-yellow-400">DRAW!</span>
            ) : isWinner ? (
              <span className="text-[#49eacb] flex items-center justify-center gap-2">
                <HugeiconsIcon icon={ChampionIcon} className="w-8 h-8" /> VICTORY!
              </span>
            ) : (
              <span className="text-red-400">DEFEAT</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Final Score */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              <span className={playerRole === "player1" ? "text-[#49eacb]" : "text-white"}>
                {result.player1RoundsWon}
              </span>
              <span className="text-gray-500 mx-3">-</span>
              <span className={playerRole === "player2" ? "text-[#49eacb]" : "text-white"}>
                {result.player2RoundsWon}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {result.reason === "knockout" && "Won by Knockout!"}
              {result.reason === "rounds_won" && "Won by Rounds"}
              {result.reason === "forfeit" && "Opponent Forfeited"}
              {result.reason === "timeout" && "Won by Timeout"}
            </p>
          </div>

          {/* Stats Card */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-400 mb-1">Your Final HP</p>
                  <p className="text-lg font-bold text-[#49eacb]">
                    {playerRole === "player1"
                      ? result.player1FinalHealth
                      : result.player2FinalHealth}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 mb-1">Opponent HP</p>
                  <p className="text-lg font-bold text-red-400">
                    {playerRole === "player1"
                      ? result.player2FinalHealth
                      : result.player1FinalHealth}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match ID and Explorer Link */}
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              Match ID: {matchId.slice(0, 8)}...{matchId.slice(-4)}
            </p>

            {explorerLink && (
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#49eacb] hover:text-[#3dd4b8] transition-colors"
              >
                <HugeiconsIcon icon={Globe02Icon} className="w-4 h-4" />
                View on Kaspa Explorer
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {onPlayAgain && (
              <Button
                onClick={onPlayAgain}
                className="flex-1 bg-[#49eacb] text-black hover:bg-[#3dd4b8]"
              >
                Play Again
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className={`${onPlayAgain ? "flex-1" : "w-full"} border-[#49eacb] text-[#49eacb] hover:bg-[#49eacb]/10`}
            >
              {onPlayAgain ? "Back to Menu" : "Close"}
            </Button>
          </div>

          {/* Share Button */}
          <Button
            onClick={handleShare}
            variant="ghost"
            className={`w-full ${shareStatus !== "idle" ? "text-[#49eacb]" : "text-gray-400"} hover:text-white`}
            disabled={shareStatus !== "idle"}
          >
            <HugeiconsIcon icon={Share05Icon} className="w-4 h-4 mr-2" />
            {shareStatus === "copied" ? "Link Copied!" : shareStatus === "shared" ? "Shared!" : "Share Result"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Handle sharing match result.
 */
async function handleShareResult(matchId: string, winnerCharacter?: string): Promise<{ copied: boolean }> {
  const result = await shareMatch({
    matchId,
    winnerCharacter,
    source: "direct",
  });

  return { copied: result.method === "clipboard" && result.success };
}


