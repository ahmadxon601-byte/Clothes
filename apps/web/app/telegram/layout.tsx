'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, User } from 'lucide-react';
import { cn } from '../../src/shared/lib/utils';
import { ToastProvider } from '../../src/shared/ui/Toast';

const TG_NAV = [
    { href: '/telegram', icon: Home, label: 'Bosh sahifa' },
    { href: '/telegram/favorites', icon: Heart, label: 'Sevimlilar' },
    { href: '/telegram/profile', icon: User, label: 'Profil' },
];

function TelegramBottomNav() {
    const pathname = usePathname();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)]"
            style={{ background: 'var(--color-surface)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex items-center justify-around h-[58px] max-w-[500px] mx-auto px-4">
                {TG_NAV.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center gap-[3px] flex-1 py-2"
                        >
                            <div className={cn(
                                'w-10 h-8 flex items-center justify-center rounded-2xl transition-all duration-200',
                                isActive ? 'bg-[var(--color-primary)]/15' : ''
                            )}>
                                <Icon
                                    size={20}
                                    className={cn(
                                        'transition-colors duration-200',
                                        isActive
                                            ? 'text-[var(--color-primary)]'
                                            : 'text-[var(--color-hint)]'
                                    )}
                                />
                            </div>
                            <span className={cn(
                                'text-[10px] font-semibold transition-colors duration-200',
                                isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-hint)]'
                            )}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export default function TelegramLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="relative w-full flex flex-col bg-[var(--color-bg)]"
            style={{ minHeight: '100dvh' }}
        >
            <ToastProvider />
            <main
                className="flex-1 overflow-y-auto overflow-x-hidden [overscroll-behavior-y:contain] [-webkit-overflow-scrolling:touch]"
                style={{ paddingBottom: 'calc(58px + env(safe-area-inset-bottom, 0px))' }}
            >
                {children}
            </main>
            <TelegramBottomNav />
        </div>
    );
}
