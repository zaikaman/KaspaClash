"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GameButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg" | "icon";
    children: React.ReactNode;
    active?: boolean;
}

export default function GameButton({
    className,
    variant = "primary",
    size = "md",
    children,
    active = false,
    ...props
}: GameButtonProps) {
    const baseStyles =
        "relative font-orbitron font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden";

    const variants = {
        primary:
            "bg-cyber-black text-white border-2 border-cyber-gold hover:bg-cyber-gold/10 hover:shadow-[0_0_15px_rgba(240,183,31,0.5)] active:scale-95",
        secondary:
            "bg-cyber-black text-white border-2 border-cyber-blue hover:bg-cyber-blue/10 hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] active:scale-95",
        danger:
            "bg-cyber-black text-white border-2 border-cyber-orange hover:bg-cyber-orange/10 hover:shadow-[0_0_15px_rgba(224,54,9,0.5)] active:scale-95",
        ghost:
            "bg-transparent text-cyber-gray hover:text-white hover:bg-white/5",
    };

    const sizes = {
        sm: "px-3 py-1 text-xs",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base",
        icon: "p-2",
    };

    // Corner accents for the "tech" look
    const Corner = ({ className }: { className?: string }) => (
        <div className={cn("absolute w-2 h-2 bg-current opacity-80", className)} />
    );

    return (
        <motion.button
            className={cn(baseStyles, variants[variant], sizes[size], active && "bg-cyber-gold/20 shadow-[0_0_15px_rgba(240,183,31,0.3)]", className)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            {...props}
        >
            {/* Background Grid Pattern (Subtle) */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] bg-[length:10px_10px] pointer-events-none" />

            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>

            {/* Glitch Effect on Hover (Optional, maybe for another time) */}

            {/* Decorative Corners for Primary/Secondary/Danger */}
            {variant !== "ghost" && (
                <>
                    {/* Top Left cut */}
                    <div className="absolute top-0 left-0 w-0 h-0 border-t-[8px] border-r-[8px] border-t-white/0 border-r-transparent" />

                    {/* Custom SVG Borders or just simple CSS corners */}
                    {/* Let's use simple CSS boxes for corners */}
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-current" />
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-current" />
                    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-current" />
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-current" />
                </>
            )}
        </motion.button>
    );
}
