"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sword01Icon, ChampionIcon, ViewIcon } from "@hugeicons/core-free-icons";

interface SidebarItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
}

function SidebarItem({ href, icon, label, isActive }: SidebarItemProps) {
    return (
        <Link href={href}>
            <motion.div
                className={cn(
                    "relative flex items-center gap-4 p-4 mb-2 rounded-xl transition-all duration-300 group overflow-hidden",
                    isActive
                        ? "text-cyber-black bg-gradient-cyber shadow-[0_0_15px_rgba(240,183,31,0.4)]"
                        : "text-cyber-gray hover:text-white hover:bg-white/5"
                )}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Active Indicator Line */}
                {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
                )}

                <div className={cn("w-6 h-6 flex-shrink-0", isActive ? "text-cyber-black" : "text-cyber-gold")}>
                    {icon}
                </div>
                <span className="font-orbitron font-medium tracking-wide text-sm md:text-base">
                    {label}
                </span>

                {/* Arrow on hover (only if not active) */}
                {!isActive && (
                    <motion.div
                        className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                    >
                        →
                    </motion.div>
                )}
            </motion.div>
        </Link>
    );
}

export default function GameSidebar() {
    const pathname = usePathname();

    const items = [
        {
            href: "/matchmaking",
            label: "Play",
            icon: <HugeiconsIcon icon={Sword01Icon} className="w-full h-full" />,
        },
        {
            href: "/leaderboard",
            label: "Leaderboard",
            icon: <HugeiconsIcon icon={ChampionIcon} className="w-full h-full" />,
        },
        {
            href: "/spectate",
            label: "Spectate",
            icon: <HugeiconsIcon icon={ViewIcon} className="w-full h-full" />,
        },
        // Add more items like Inventory, Profile, etc. if needed
    ];

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-black/90 backdrop-blur-xl border-r border-cyber-gold/20 flex flex-col z-50">
            {/* Logo Area */}
            <div className="p-6 mb-6">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img
                        src="/logo.webp"
                        alt="KaspaClash Logo"
                        className="w-10 h-10 object-contain"
                    />
                    <h1 className="text-xl font-bold bg-gradient-cyber bg-clip-text text-transparent font-orbitron">
                        KASPA
                        <span className="block text-white text-xs tracking-[0.2em] font-light">CLASH</span>
                    </h1>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2">
                {items.map((item) => (
                    <SidebarItem
                        key={item.href}
                        {...item}
                        isActive={pathname === item.href}
                    />
                ))}
            </nav>

            {/* Footer / User Status */}
            <div className="p-4 border-t border-cyber-gold/20">
                <div className="bg-cyber-black/50 p-3 rounded-lg border border-white/10">
                    <p className="text-xs text-cyber-gray mb-1 uppercase tracking-wider">Server Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                        <span className="text-sm font-semibold text-success">Online</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
