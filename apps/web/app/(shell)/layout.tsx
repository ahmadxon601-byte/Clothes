'use client';
import { BottomNav } from '../../src/shared/ui/BottomNav';
import { ToastProvider } from '../../src/shared/ui/Toast';
import { AppHeader, hasUnifiedHeader } from '../../src/shared/ui/AppHeader';
import { usePathname } from 'next/navigation';
import { cn } from '../../src/shared/lib/utils';
import Link from 'next/link';
import { Heart, User, Home, Store, Search } from 'lucide-react';
import { APP_ROUTES } from '../../src/shared/config/constants';

const NAV_LINKS = [
    { href: APP_ROUTES.HOME, icon: Home, label: 'Bosh sahifa' },
    { href: APP_ROUTES.PRODUCTS, icon: Store, label: "Do'konlar" },
    { href: APP_ROUTES.SEARCH, icon: Search, label: 'Qidirish' },
    { href: APP_ROUTES.FAVORITES, icon: Heart, label: 'Sevimlilar' },
    { href: APP_ROUTES.PROFILE, icon: User, label: 'Profil' },
];

function DesktopSidebar({ pathname }: { pathname: string }) {
    return (
        <aside className="hidden md:flex flex-col w-[220px] lg:w-[240px] flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] h-full">
            <div className="px-5 py-5 border-b border-[var(--color-border)]">
                <span className="text-[17px] font-bold text-[var(--color-text)]">Clothes MP</span>
            </div>
            <nav className="flex flex-col gap-1 p-3 flex-1">
                {NAV_LINKS.map(({ href, icon: Icon, label }) => {
                    const isActive =
                        href === APP_ROUTES.HOME
                            ? pathname === APP_ROUTES.HOME || pathname === APP_ROUTES.STORES
                            : pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all',
                                isActive
                                    ? 'bg-[var(--color-nav-active-bg)] text-[var(--color-primary-contrast)]'
                                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface2)]',
                            )}
                        >
                            <Icon size={19} />
                            {label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

export default function ShellLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hasHeader = hasUnifiedHeader(pathname);

    return (
        <div className="relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden md:flex md:flex-row">
            <ToastProvider />

            <DesktopSidebar pathname={pathname} />

            <div className="flex-1 min-w-0 overflow-hidden relative md:flex md:flex-col md:h-full">
                <AppHeader />
                <main
                    className={cn(
                        'absolute inset-0 overflow-y-auto overflow-x-hidden animate-in fade-in duration-300 [overscroll-behavior-y:contain] [-webkit-overflow-scrolling:touch] pb-[var(--shell-nav-total)]',
                        hasHeader ? 'pt-[var(--shell-header-total)]' : 'pt-0',
                        'md:static md:inset-auto md:flex-1 md:pb-0',
                        hasHeader ? 'md:pt-0' : '',
                    )}
                >
                    {children}
                </main>
            </div>

            <BottomNav />
        </div>
    );
}
