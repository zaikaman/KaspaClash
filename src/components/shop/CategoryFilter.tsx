"use client";

/**
 * Category Filter Component
 * Tab navigation for cosmetic categories
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    UserCircleIcon,
    SmileIcon,
    ChampionIcon,
    Medal01Icon,
    SquareIcon,
    DashboardSquare02Icon,
} from "@hugeicons/core-free-icons";
import type { CosmeticCategory } from "@/types/cosmetic";

interface CategoryFilterProps {
    selectedCategory: CosmeticCategory | "all";
    onCategoryChange: (category: CosmeticCategory | "all") => void;
    className?: string;
}

interface CategoryTab {
    id: CosmeticCategory | "all";
    label: string;
    icon: any;
}

const CATEGORIES: CategoryTab[] = [
    { id: "all", label: "All", icon: DashboardSquare02Icon },
    { id: "character", label: "Characters", icon: UserCircleIcon },
    { id: "sticker", label: "Stickers", icon: SmileIcon },
];

export function CategoryFilter({
    selectedCategory,
    onCategoryChange,
    className,
}: CategoryFilterProps) {
    return (
        <div
            className={cn(
                "flex flex-wrap gap-2 p-1.5 rounded-xl bg-card/30 border border-white/5 backdrop-blur-sm",
                className
            )}
        >
            {CATEGORIES.map((category) => {
                const isActive = selectedCategory === category.id;
                return (
                    <button
                        key={category.id}
                        onClick={() => onCategoryChange(category.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                            isActive
                                ? "bg-gradient-to-r from-cyber-gold/20 to-cyber-orange/20 text-cyber-gold border border-cyber-gold/30 shadow-lg shadow-cyber-gold/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <HugeiconsIcon
                            icon={category.icon}
                            className={cn(
                                "h-4 w-4 transition-colors",
                                isActive ? "text-cyber-gold" : "text-muted-foreground"
                            )}
                        />
                        <span className="hidden sm:inline">{category.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export default CategoryFilter;
