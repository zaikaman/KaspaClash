import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsMobileNav } from '@/components/docs/DocsMobileNav';
import { DocsHeader } from '@/components/docs/DocsHeader';

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <DocsHeader />
            <div className="flex-1 w-full flex flex-col md:grid md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] relative overflow-hidden">
                <DocsSidebar />
                <main className="flex w-full min-w-0 flex-col overflow-y-auto h-full py-6 lg:py-10 px-4 md:px-8 lg:px-12 custom-scrollbar">
                    <div className="mx-auto w-full max-w-4xl space-y-10 list-[revert]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
