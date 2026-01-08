"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Menu01Icon,
    Cancel01Icon,
    GithubIcon,
    BookOpen01Icon,
    Rocket01Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function LandingHeader() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const scrollToSection = (id: string) => {
        setIsMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-cyber-black/80 backdrop-blur-md border-b border-white/5">
            <nav className="container mx-auto px-6 lg:px-12 xl:px-24 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <img
                        src="/logo.webp"
                        alt="KaspaClash Logo"
                        className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                    <span className="text-2xl font-bold bg-gradient-cyber bg-clip-text text-transparent font-orbitron">
                        KaspaClash
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium font-orbitron tracking-wide">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="text-white hover:text-cyber-gold transition-colors"
                    >
                        HOME
                    </button>
                    <button
                        onClick={() => scrollToSection("features")}
                        className="text-white hover:text-cyber-gold transition-colors"
                    >
                        FEATURES
                    </button>
                    <Link
                        href="https://github.com/kaspanet/kaspa-clash"
                        target="_blank"
                        className="text-white hover:text-cyber-gold transition-colors flex items-center gap-2"
                    >
                        <HugeiconsIcon icon={GithubIcon} className="w-4 h-4" />
                        GITHUB
                    </Link>
                    <Link
                        href="/docs"
                        className="text-white hover:text-cyber-gold transition-colors flex items-center gap-2"
                    >
                        <HugeiconsIcon icon={BookOpen01Icon} className="w-4 h-4" />
                        DOCS
                    </Link>
                </div>

                {/* CTA Button */}
                <div className="hidden md:block">
                    <Link href="/matchmaking">
                        <Button className="bg-gradient-cyber text-white border-0 font-bold text-sm px-6 hover:shadow-[0_0_20px_rgba(240,183,31,0.3)] transition-all duration-300 font-orbitron h-10 gap-2">
                            <HugeiconsIcon icon={Rocket01Icon} className="w-4 h-4" />
                            PLAY NOW
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden text-white p-2 hover:text-cyber-gold transition-colors"
                >
                    <HugeiconsIcon icon={isMobileMenuOpen ? Cancel01Icon : Menu01Icon} className="w-6 h-6" />
                </button>
            </nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-[73px] bg-cyber-black/95 backdrop-blur-xl z-40 p-6 flex flex-col gap-6 animate-in slide-in-from-top-4">
                    <button
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            setIsMobileMenuOpen(false);
                        }}
                        className="text-lg font-bold font-orbitron text-white text-left"
                    >
                        HOME
                    </button>
                    <button
                        onClick={() => scrollToSection("features")}
                        className="text-lg font-bold font-orbitron text-white text-left"
                    >
                        FEATURES
                    </button>
                    <Link
                        href="https://github.com/kaspanet/kaspa-clash"
                        target="_blank"
                        className="text-lg font-bold font-orbitron text-white flex items-center gap-2"
                    >
                        <HugeiconsIcon icon={GithubIcon} className="w-5 h-5" />
                        GITHUB
                    </Link>
                    <Link
                        href="/docs"
                        className="text-lg font-bold font-orbitron text-white flex items-center gap-2"
                    >
                        <HugeiconsIcon icon={BookOpen01Icon} className="w-5 h-5" />
                        DOCS
                    </Link>

                    <div className="h-px bg-white/10 my-2" />

                    <Link href="/matchmaking" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full bg-gradient-cyber text-white border-0 font-bold text-lg py-6 font-orbitron">
                            PLAY NOW
                        </Button>
                    </Link>
                </div>
            )}
        </header>
    );
}
