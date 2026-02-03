'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DOCS_CONFIG, DocSection } from '@/lib/docs/config';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { motion } from 'framer-motion';
import { DocsNavContent } from '@/components/docs/DocsNavContent';

export function DocsSidebar() {
    return (
        <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block border-r border-sidebar-border bg-sidebar/50 backdrop-blur-xl">
            <DocsNavContent />
        </aside>
    );
}
