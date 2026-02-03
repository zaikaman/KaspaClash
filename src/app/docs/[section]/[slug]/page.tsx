import { notFound } from 'next/navigation';
import { DOCS_CONFIG, DocSection } from '@/lib/docs/config';

// Content Components
import { GamersOverview } from '@/components/docs/content/GamersOverview';
import { GamersMechanics } from '@/components/docs/content/GamersMechanics';
import { GamersBattlePass } from '@/components/docs/content/GamersBattlePass';
import { GamersQuests } from '@/components/docs/content/GamersQuests';
import { GamersAchievements } from '@/components/docs/content/GamersAchievements';
import { GamersShop } from '@/components/docs/content/GamersShop';
import { GamersBetting } from '@/components/docs/content/GamersBetting';
import { GamersTreasury } from '@/components/docs/content/GamersTreasury';

import { DevArchitecture } from '@/components/docs/content/DevArchitecture';
import { DevGettingStarted } from '@/components/docs/content/DevGettingStarted';
import { DevEngine } from '@/components/docs/content/DevEngine';
import { DevBlockchain } from '@/components/docs/content/DevBlockchain';
import { DevRealtime } from '@/components/docs/content/DevRealtime';
import { DevAPI } from '@/components/docs/content/DevAPI';
import { DevDatabase } from '@/components/docs/content/DevDatabase';

const CONTENT_MAP: Record<string, React.ComponentType> = {
    // Gamers
    'overview': GamersOverview,
    'mechanics': GamersMechanics,
    'battle-pass': GamersBattlePass,
    'quests': GamersQuests,
    'achievements': GamersAchievements,
    'shop': GamersShop,
    'betting': GamersBetting,
    'treasury': GamersTreasury,

    // Developers
    'architecture': DevArchitecture,
    'getting-started': DevGettingStarted,
    'phaser-engine': DevEngine,
    'kaspa-integration': DevBlockchain,
    'realtime-sync': DevRealtime,
    'api': DevAPI,
    'database': DevDatabase,
};

export default async function DocPage({
    params,
}: {
    params: Promise<{ section: string; slug: string }>;
}) {
    const { section, slug } = await params;

    // Validate section
    if (!['gamers', 'developers'].includes(section)) {
        return notFound();
    }

    const config = DOCS_CONFIG[section as DocSection];
    const page = config.categories
        .flatMap(c => c.pages)
        .find(p => p.slug === slug);

    if (!page) {
        return notFound();
    }

    const ContentComponent = CONTENT_MAP[slug];

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl font-orbitron text-cyber-gold drop-shadow-[0_0_10px_rgba(240,183,31,0.3)]">
                    {page.title}
                </h1>
                <p className="text-xl text-muted-foreground">
                    {page.description}
                </p>
            </div>

            <div className="border-t border-white/10 my-8" />

            {ContentComponent ? (
                <ContentComponent />
            ) : (
                <div className="prose prose-invert max-w-none">
                    <p>Content not found for {slug}</p>
                </div>
            )}
        </div>
    );
}
