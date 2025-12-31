/**
 * Match Results Overlay
 * Displays match winner, stats, and Kaspa explorer link
 */

"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getExplorerLink } from "@/lib/game/move-service";
import type { MatchResult } from "@/stores/match-store";
import type { PlayerRole } from "@/types";

/**
 * Match results props.
 */
export interface MatchResultsProps {
  matchId: string;
  result: MatchResult;
  playerRole: PlayerRole;
  onClose: () => void;
  onPlayAgain?: () => void;
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
}: MatchResultsProps) {
  const isWinner = result.winner === playerRole;
  const isDraw = result.winner === null;

  // Build explorer link for the first transaction
  const explorerLink = useMemo(() => {
    if (result.txIds.length > 0) {
      return getExplorerLink(result.txIds[0]);
    }
    return null;
  }, [result.txIds]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-[#49eacb]/30">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {isDraw ? (
              <span className="text-yellow-400">DRAW!</span>
            ) : isWinner ? (
              <span className="text-[#49eacb]">🏆 VICTORY!</span>
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
                <ExplorerIcon />
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
            onClick={() => handleShare(matchId)}
            variant="ghost"
            className="w-full text-gray-400 hover:text-white"
          >
            <ShareIcon className="w-4 h-4 mr-2" />
            Share Result
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Handle sharing match result.
 */
function handleShare(matchId: string) {
  const shareUrl = `${window.location.origin}/match/${matchId}`;
  const shareText = `Check out my KaspaClash match! ⚔️`;

  if (navigator.share) {
    navigator.share({
      title: "KaspaClash Match",
      text: shareText,
      url: shareUrl,
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    alert("Link copied to clipboard!");
  }
}

/**
 * Explorer icon component.
 */
function ExplorerIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

/**
 * Share icon component.
 */
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}
