import { HugeiconsIcon } from "@hugeicons/react";
import { ChampionIcon, UserIcon, Robot01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

interface MatchSummaryProps {
    matchData: {
        id: string;
        winner: { name: string; address: string };
        loser: { name: string; address: string };
        score?: string;
        status?: string;
    };
}

export default function MatchSummary({ matchData }: MatchSummaryProps) {
    return (
        <div className="bg-black/40 border border-cyber-gold/30 rounded-2xl p-8 backdrop-blur-md max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <span className="text-cyber-gray text-sm uppercase tracking-widest font-bold">MATCH RESULT</span>
                <h2 className="text-4xl md:text-6xl font-bold font-orbitron text-white mt-2">
                    {matchData.winner.name} WINS!
                </h2>
                {matchData.score && (
                    <div className="text-2xl font-mono text-cyber-gold mt-2">
                        {matchData.score}
                    </div>
                )}
                <div className="flex justify-center mt-4">
                    <span className="bg-cyber-gold/20 text-cyber-gold border border-cyber-gold px-4 py-1 rounded text-sm font-mono flex items-center gap-2">
                        <HugeiconsIcon icon={Tick02Icon} className="w-4 h-4 text-green-500 animate-pulse" />
                        Verified on Kaspa BlockDAG
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-12">
                {/* Player 1 (Winner) */}
                <div className="text-center flex-1">
                    <div className="w-32 h-32 rounded-full border-4 border-cyber-gold mx-auto mb-4 bg-black flex items-center justify-center relative shadow-[0_0_30px_rgba(240,183,31,0.3)]">
                        <HugeiconsIcon icon={UserIcon} className="w-16 h-16 text-white" />
                        <div className="absolute -bottom-3 bg-cyber-gold text-black px-3 py-0.5 text-xs font-bold rounded">WINNER</div>
                    </div>
                    <h3 className="text-xl font-bold text-white font-orbitron">{matchData.winner.name}</h3>
                    <p className="text-cyber-gray font-mono text-sm">{matchData.winner.address}</p>
                </div>

                <div className="text-2xl font-black font-orbitron text-cyber-gray italic">
                    VS
                </div>

                {/* Player 2 (Loser) */}
                <div className="text-center flex-1">
                    <div className="w-24 h-24 rounded-full border-2 border-cyber-gray/50 mx-auto mb-4 bg-black flex items-center justify-center grayscale opacity-80">
                        <HugeiconsIcon icon={Robot01Icon} className="w-12 h-12 text-cyber-gray" />
                    </div>
                    <h3 className="text-lg font-bold text-cyber-gray font-orbitron">{matchData.loser.name}</h3>
                    <p className="text-cyber-gray/50 font-mono text-xs">{matchData.loser.address}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-black/30 p-4 rounded text-center border border-white/5">
                    <div className="text-cyber-gray text-xs uppercase mb-1">Duration</div>
                    <div className="text-white font-mono">1m 45s</div>
                </div>
                <div className="bg-black/30 p-4 rounded text-center border border-white/5">
                    <div className="text-cyber-gray text-xs uppercase mb-1">Total Hits</div>
                    <div className="text-white font-mono">42</div>
                </div>
                <div className="bg-black/30 p-4 rounded text-center border border-white/5">
                    <div className="text-cyber-gray text-xs uppercase mb-1">Max Combo</div>
                    <div className="text-white font-mono">8x</div>
                </div>
                <div className="bg-black/30 p-4 rounded text-center border border-white/5">
                    <div className="text-cyber-gray text-xs uppercase mb-1">Sats Earned</div>
                    <div className="text-cyber-gold font-mono font-bold">5,000</div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
                {/* Removed VIEW TX button - replaced by TransactionTimeline component */}
            </div>
        </div>
    );
}
