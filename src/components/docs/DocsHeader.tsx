"use client";

import Link from "next/link";
import { DocsMobileNav } from "@/components/docs/DocsMobileNav";

export function DocsHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-sidebar-border bg-sidebar/80 backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/50">
            <div className="flex h-14 items-center px-4 md:px-8 lg:px-12">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="flex items-center gap-2 mr-6">
                        <img src="/logo.webp" alt="KaspaClash" className="h-8 w-8 object-contain" />
                        <span className="hidden font-orbitron font-bold text-lg text-cyber-gold sm:inline-block drop-shadow-[0_0_8px_rgba(240,183,31,0.5)]">
                            KaspaClash
                        </span>
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 border-l border-white/10">
                        <span className="font-orbitron tracking-wider text-xs bg-white/10 px-2 py-0.5 rounded text-cyber-gold">DOCS</span>
                    </div>
                </div>

                {/* Mobile Header Content */}
                <div className="flex flex-1 items-center justify-between md:justify-end">
                    <Link href="/" className="flex items-center gap-2 md:hidden">
                        <img src="/logo.webp" alt="KaspaClash" className="h-8 w-8 object-contain" />
                        <span className="font-orbitron font-bold text-lg text-cyber-gold drop-shadow-[0_0_8px_rgba(240,183,31,0.5)]">
                            KaspaClash
                        </span>
                    </Link>

                    <DocsMobileNav />
                </div>
            </div>
        </header>
    );
}
