'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DOCS_CONFIG, DocSection } from '@/lib/docs/config';

export function DocsNavContent({ onItemClick }: { onItemClick?: () => void }) {
    const pathname = usePathname();
    const currentSection = pathname.split('/')[2] as DocSection | undefined;

    const activeSectionKey = currentSection && DOCS_CONFIG[currentSection] ? currentSection : 'gamers';
    const activeConfig = DOCS_CONFIG[activeSectionKey];

    return (
        <div className="flex h-full flex-col">
            {/* Section Switcher */}
            <div className="p-4 border-b border-sidebar-border/50">
                <div className="flex items-center space-x-2 bg-sidebar-accent/50 p-1 rounded-lg">
                    {(Object.keys(DOCS_CONFIG) as DocSection[]).map((sectionKey) => {
                        const firstPageSlug = DOCS_CONFIG[sectionKey].categories[0]?.pages[0]?.slug;
                        return (
                            <Link
                                key={sectionKey}
                                href={`/docs/${sectionKey}/${firstPageSlug}`}
                                onClick={onItemClick}
                                className={cn(
                                    "flex-1 text-center text-sm font-medium py-1.5 rounded-md transition-all duration-200",
                                    activeSectionKey === sectionKey
                                        ? "bg-cyber-gold text-black shadow-[0_0_15px_rgba(240,183,31,0.4)] font-bold"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                {DOCS_CONFIG[sectionKey].title.replace('For ', '')}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Links */}
            <div className="h-full py-6 pr-6 lg:py-8 overflow-y-auto custom-scrollbar">
                <div className="w-full pl-6">
                    {activeConfig.categories.map((category, index) => (
                        <div key={index} className="pb-8">
                            <h4 className="mb-3 text-sm font-bold tracking-wider text-cyber-gray uppercase font-orbitron opacity-70">
                                {category.title}
                            </h4>
                            <div className="grid grid-flow-row auto-rows-max text-sm gap-1">
                                {category.pages.map((page) => {
                                    const pageHref = `/docs/${activeSectionKey}/${page.slug}`;
                                    const isActive = pathname === pageHref;

                                    return (
                                        <Link
                                            key={pageHref}
                                            href={pageHref}
                                            onClick={onItemClick}
                                            className={cn(
                                                "group flex w-full items-center rounded-r-md border-l-2 border-transparent px-3 py-2 transition-all duration-200",
                                                isActive
                                                    ? "border-cyber-gold font-bold text-cyber-gold bg-cyber-gold/10"
                                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <span className={cn(
                                                "mr-2 h-1.5 w-1.5 rounded-full transition-all",
                                                isActive ? "bg-cyber-gold shadow-[0_0_8px_var(--color-cyber-gold)]" : "bg-muted-foreground/30 group-hover:bg-white/50"
                                            )} />
                                            {page.title}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
