'use client';
import { BottomNav } from '../../src/shared/ui/BottomNav';
import { ToastProvider } from '../../src/shared/ui/Toast';
import { AppHeader, hasUnifiedHeader } from '../../src/shared/ui/AppHeader';
import { usePathname } from 'next/navigation';
import { cn } from '../../src/shared/lib/utils';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hasHeader = hasUnifiedHeader(pathname);

    return (
        <div className="relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden">
            <ToastProvider />
            <AppHeader />
            <main
                className={cn(
                    'absolute inset-0 overflow-y-auto overflow-x-hidden animate-in fade-in duration-300 [overscroll-behavior-y:contain] [-webkit-overflow-scrolling:touch] pb-[var(--shell-nav-total)]',
                    hasHeader ? 'pt-[var(--shell-header-total)]' : 'pt-0',
                )}
            >
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
