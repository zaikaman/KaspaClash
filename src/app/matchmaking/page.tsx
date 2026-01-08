"use client";

import React, { useState } from "react";
import GameLayout from "@/components/layout/GameLayout";
import DecorativeLine from "@/components/landing/DecorativeLine";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import RoomCreate from "@/components/matchmaking/RoomCreate";
import RoomJoin from "@/components/matchmaking/RoomJoin";

type ViewState = "main" | "create" | "join";

export default function MatchmakingPage() {
    const [view, setView] = useState<ViewState>("main");

    // If showing create or join view, render in centered container
    if (view !== "main") {
        return (
            <GameLayout>
                <div className="relative w-full min-h-screen pt-10 pb-20">
                    {/* Background Grid Lines */}
                    <div className="absolute top-0 bottom-0 left-[70.5px] w-px bg-cyber-orange/10 hidden md:block pointer-events-none"></div>
                    <div className="absolute top-0 bottom-0 right-[70.5px] w-px bg-cyber-gold/10 hidden md:block pointer-events-none"></div>

                    <div className="container mx-auto px-6 lg:px-12 xl:px-24 relative z-10 flex justify-center">
                        {view === "create" && (
                            <RoomCreate
                                onCancel={() => setView("main")}
                            />
                        )}
                        {view === "join" && (
                            <RoomJoin
                                onCancel={() => setView("main")}
                            />
                        )}
                    </div>
                </div>
            </GameLayout>
        );
    }

    return (
        <GameLayout>
            <div className="relative w-full min-h-screen pt-6 sm:pt-10 pb-20">
                {/* Background Grid Lines */}
                <div className="absolute top-0 bottom-0 left-[70.5px] w-px bg-cyber-orange/10 hidden md:block pointer-events-none"></div>
                {/* <div className="absolute top-0 bottom-0 right-[70.5px] w-px bg-cyber-gold/10 hidden md:block pointer-events-none"></div> */}

                <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 relative z-10">
                    <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
                        <h1 className="text-3xl sm:text-4xl lg:text-[60px] font-bold leading-tight mb-4 font-orbitron text-white">
                            ENTER THE <span className="text-cyber-orange">ARENA</span>
                        </h1>
                        <p className="text-cyber-gray text-base sm:text-lg font-montserrat">
                            Choose your battlefield. Fight for glory, earn KAS.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
                        {/* Quick Match Card */}
                        <div className="group relative rounded-[20px] bg-black/40 border border-cyber-gold/30 p-8 hover:border-cyber-gold transition-all hover:bg-black/60 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyber-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-6 w-16 h-16 rounded-xl bg-cyber-gold/10 flex items-center justify-center border border-cyber-gold/20 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-cyber-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>

                                <h3 className="text-2xl font-bold text-white font-orbitron mb-2">QUICK MATCH</h3>
                                <p className="text-cyber-gray text-sm mb-8 flex-grow">
                                    Find a worthy opponent instantly. Ranked matches that impact your global standing.
                                </p>

                                <Link href="/queue" className="w-full">
                                    <Button className="w-full bg-gradient-cyber text-white border-0 font-orbitron hover:opacity-90">
                                        FIND MATCH
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Practice Mode Card */}
                        <div className="group relative rounded-[20px] bg-black/40 border border-emerald-500/30 p-8 hover:border-emerald-500 transition-all hover:bg-black/60 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-6 w-16 h-16 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>

                                <h3 className="text-2xl font-bold text-white font-orbitron mb-2">PRACTICE</h3>
                                <p className="text-cyber-gray text-sm mb-8 flex-grow">
                                    Hone your skills against AI. Master your combos before entering the arena.
                                </p>

                                <Link href="/practice" className="w-full">
                                    <Button className="w-full bg-transparent border border-emerald-500 text-emerald-500 font-orbitron hover:bg-emerald-500/10">
                                        ENTER DOJO
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Create Room Card */}
                        <div className="group relative rounded-[20px] bg-black/40 border border-cyber-blue/30 p-8 hover:border-cyber-blue transition-all hover:bg-black/60 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyber-blue/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-6 w-16 h-16 rounded-xl bg-cyber-blue/10 flex items-center justify-center border border-cyber-blue/20 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-cyber-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>

                                <h3 className="text-2xl font-bold text-white font-orbitron mb-2">CREATE ROOM</h3>
                                <p className="text-cyber-gray text-sm mb-8 flex-grow">
                                    Host a private match. Generate a code and challenge a friend directly.
                                </p>

                                <Button
                                    onClick={() => setView("create")}
                                    className="w-full bg-transparent border border-cyber-blue text-cyber-blue font-orbitron hover:bg-cyber-blue/10"
                                >
                                    CREATE LOBBY
                                </Button>
                            </div>
                        </div>

                        {/* Join Room Card */}
                        <div className="group relative rounded-[20px] bg-black/40 border border-cyber-orange/30 p-8 hover:border-cyber-orange transition-all hover:bg-black/60 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyber-orange/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-6 w-16 h-16 rounded-xl bg-cyber-orange/10 flex items-center justify-center border border-cyber-orange/20 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-cyber-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                </div>

                                <h3 className="text-2xl font-bold text-white font-orbitron mb-2">JOIN ROOM</h3>
                                <p className="text-cyber-gray text-sm mb-8 flex-grow">
                                    Have a code? Enter it here to join an existing lobby.
                                </p>

                                <Button
                                    onClick={() => setView("join")}
                                    className="w-full bg-transparent border border-cyber-orange text-cyber-orange font-orbitron hover:bg-cyber-orange/10"
                                >
                                    ENTER CODE
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DecorativeLine className="mt-20" variant="left-gold-right-red" />
                </div>
            </div>
        </GameLayout>
    );
}
