import React from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PlayerData {
    rank: number;
    address: string;
    wins: number;
    losses: number;
    rating: number;
    mainCharacter: string;
}

const SAMPLE_DATA: PlayerData[] = [
    { rank: 1, address: "kaspa:qxyz...abcd", wins: 142, losses: 12, rating: 2450, mainCharacter: "Cyber Ninja" },
    { rank: 2, address: "kaspa:qabc...wxyz", wins: 128, losses: 18, rating: 2380, mainCharacter: "DAG Warrior" },
    { rank: 3, address: "kaspa:q789...1234", wins: 115, losses: 22, rating: 2310, mainCharacter: "Block Bruiser" },
    { rank: 4, address: "kaspa:q456...7890", wins: 98, losses: 25, rating: 2150, mainCharacter: "Cyber Ninja" },
    { rank: 5, address: "kaspa:q123...4567", wins: 85, losses: 30, rating: 2040, mainCharacter: "Hash Hunter" },
    { rank: 6, address: "kaspa:qooo...1111", wins: 72, losses: 15, rating: 1980, mainCharacter: "Cyber Ninja" },
    { rank: 7, address: "kaspa:qppp...2222", wins: 65, losses: 40, rating: 1850, mainCharacter: "DAG Warrior" },
];

export default function LeaderboardTable() {
    return (
        <div className="w-full bg-black/40 border border-cyber-gold/20 rounded-2xl overflow-hidden backdrop-blur-md">
            <Table>
                <TableHeader className="bg-cyber-gold/10 border-b border-cyber-gold/20">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[100px] text-cyber-gold font-orbitron font-bold">RANK</TableHead>
                        <TableHead className="text-white font-orbitron">PLAYER</TableHead>
                        <TableHead className="hidden md:table-cell text-white font-orbitron">MAIN</TableHead>
                        <TableHead className="text-right text-white font-orbitron">WINS</TableHead>
                        <TableHead className="text-right text-cyber-orange font-orbitron font-bold">RATING</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {SAMPLE_DATA.map((player) => (
                        <TableRow
                            key={player.rank}
                            className="border-b border-white/5 hover:bg-cyber-gold/5 transition-colors group"
                        >
                            <TableCell className="font-bold font-orbitron text-lg">
                                {player.rank === 1 && <span className="text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">#1</span>}
                                {player.rank === 2 && <span className="text-[#C0C0C0] drop-shadow-[0_0_10px_rgba(192,192,192,0.5)]">#2</span>}
                                {player.rank === 3 && <span className="text-[#CD7F32] drop-shadow-[0_0_10px_rgba(205,127,50,0.5)]">#3</span>}
                                {player.rank > 3 && <span className="text-cyber-gray">#{player.rank}</span>}
                            </TableCell>
                            <TableCell>
                                <Link
                                    href={`/player/${player.address}`}
                                    className="font-mono text-white hover:text-cyber-gold transition-colors"
                                >
                                    {player.address}
                                </Link>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-cyber-gray">
                                {player.mainCharacter}
                            </TableCell>
                            <TableCell className="text-right text-white font-mono">
                                {player.wins}
                            </TableCell>
                            <TableCell className="text-right font-bold text-cyber-orange font-mono">
                                {player.rating}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
