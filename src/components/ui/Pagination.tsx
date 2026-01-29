"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    isLoading = false
}: PaginationProps) {
    // If there's only one page, don't render pagination
    if (totalPages <= 1) return null;

    // Generate page numbers to display
    // We want to show: 1 ... 4 5 6 ... 10
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first and last
            // Show current page and neighbours

            // If near start
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push("...");
                pages.push(totalPages);
            }
            // If near end
            else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push("...");
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            }
            // In middle
            else {
                pages.push(1);
                pages.push("...");
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push("...");
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-8 select-none">
            {/* Previous Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className={`
                    border-cyber-gold/30 hover:bg-cyber-gold/10 text-white font-orbitron
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-300
                `}
            >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5" />
                <span className="sr-only">Previous</span>
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                        {page === "..." ? (
                            <span className="text-cyber-gray font-orbitron px-2">...</span>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => typeof page === 'number' && onPageChange(page)}
                                disabled={isLoading}
                                className={`
                                    min-w-[40px] h-10 rounded-lg font-orbitron font-bold text-sm
                                    flex items-center justify-center
                                    transition-all duration-300
                                    ${currentPage === page
                                        ? "bg-cyber-gold text-black shadow-[0_0_15px_rgba(240,183,31,0.5)]"
                                        : "bg-black/30 text-cyber-gray border border-white/10 hover:border-cyber-gold/50 hover:text-white"
                                    }
                                `}
                            >
                                {page}
                            </motion.button>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Next Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className={`
                    border-cyber-gold/30 hover:bg-cyber-gold/10 text-white font-orbitron
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-300
                `}
            >
                <HugeiconsIcon icon={ArrowRight01Icon} className="w-5 h-5" />
                <span className="sr-only">Next</span>
            </Button>
        </div>
    );
}
