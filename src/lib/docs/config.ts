
export type DocSection = 'gamers' | 'developers';

export interface DocPage {
    title: string;
    slug: string;
    description: string;
}

export interface DocCategory {
    title: string;
    pages: DocPage[];
}

export const DOCS_CONFIG: Record<DocSection, { title: string; categories: DocCategory[] }> = {
    gamers: {
        title: 'For Gamers',
        categories: [
            {
                title: 'Getting Started',
                pages: [
                    { title: 'Overview', slug: 'overview', description: 'What is KaspaClash?' },
                    { title: 'Game Mechanics', slug: 'mechanics', description: 'How to play and win' },
                ],
            },
            {
                title: 'Progression',
                pages: [
                    { title: 'Battle Pass', slug: 'battle-pass', description: 'Tiers, XP, and Rewards' },
                    { title: 'Daily Quests', slug: 'quests', description: 'Daily challenges and rewards' },
                    { title: 'Achievements', slug: 'achievements', description: 'Unlockables and milestones' },
                ],
            },
            {
                title: 'Economy',
                pages: [
                    { title: 'Shop & Cosmetics', slug: 'shop', description: 'Skins, emotes, and customization' },
                    { title: 'Betting System', slug: 'betting', description: 'Live PVP and Bot betting' },
                    { title: 'Treasury', slug: 'treasury', description: 'Community reward distribution' },
                ],
            },
        ],
    },
    developers: {
        title: 'For Developers',
        categories: [
            {
                title: 'Introduction',
                pages: [
                    { title: 'Architecture', slug: 'architecture', description: 'System overview and tech stack' },
                    { title: 'Getting Started', slug: 'getting-started', description: 'Local development setup' },
                ],
            },
            {
                title: 'Technical Deep Dive',
                pages: [
                    { title: 'Game Engine', slug: 'phaser-engine', description: 'Phaser + React integration' },
                    { title: 'Blockchain', slug: 'kaspa-integration', description: 'Wallet and transaction flow' },
                    { title: 'Realtime', slug: 'realtime-sync', description: 'Supabase Realtime events' },
                ],
            },
            {
                title: 'Reference',
                pages: [
                    { title: 'API Reference', slug: 'api', description: 'Backend API endpoints' },
                    { title: 'Database Schema', slug: 'database', description: 'Supabase tables and relations' },
                ],
            },
        ],
    },
};

export const DEFAULT_DOC_PATH = '/docs/gamers/overview';
