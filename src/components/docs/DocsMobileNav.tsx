'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { DocsNavContent } from '@/components/docs/DocsNavContent';
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";

export function DocsMobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground">
                    <HugeiconsIcon icon={Menu01Icon} className="w-6 h-6" />
                    <span className="sr-only">Menu</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="h-[80vh] block p-0 overflow-hidden">
                <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
                <DocsNavContent onItemClick={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
