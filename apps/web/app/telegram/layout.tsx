'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, User, Store, Sun, Moon, Globe } from 'lucide-react';
import { cn } from '../../src/shared/lib/utils';
import { ToastProvider } from '../../src/shared/ui/Toast';
import { useSettingsStore } from '../../src/features/settings/model';

const TG_NAV = [
    { href: '/telegram', icon: Home },
    { href: '/telegram/store', icon: Store },
    { href: '/telegram/favorites', icon: Heart },
    { href: '/telegram/profile', icon: User },
];

const LANGS = ['uz', 'en', 'ru'] as const;

function TelegramHeader() {
    const { settings, updateSettings } = useSettingsStore();

    const isDark = settings.themeMode === 'dark';
    const toggleTheme = () =>
        updateSettings({ themeMode: isDark ? 'light' : 'dark' });

    const currentLangIdx = LANGS.indexOf(settings.language as typeof LANGS[number]);
    const nextLang = LANGS[(currentLangIdx + 1) % LANGS.length];
    const toggleLang = () => updateSettings({ language: nextLang });

    return (
        <header className="flex items-center justify-center gap-1 px-4 py-3 bg-[var(--color-bg)]">
            <button
                onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-hint)] hover:text-[var(--color-text)] active:scale-90 transition-all"
            >
                {isDark ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            <span className="text-[17px] font-black text-[var(--color-text)] tracking-tight px-2">
                Clothes MP
            </span>

            <button
                onClick={toggleLang}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-hint)] hover:text-[var(--color-text)] active:scale-90 transition-all relative"
                title={nextLang.toUpperCase()}
            >
                <Globe size={17} />
                <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-black text-[var(--color-primary)] leading-none">
                    {settings.language.toUpperCase()}
                </span>
            </button>
        </header>
    );
}

function TelegramBottomNav() {
    const pathname = usePathname();

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
        >
            <nav className="flex items-center gap-1 px-3 py-2 rounded-[28px] bg-[var(--color-surface)] shadow-xl border border-[var(--color-border)]">
                {TG_NAV.map(({ href, icon: Icon }) => {
                    const isActive =
                        pathname === href ||
                        (href !== '/telegram' && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center justify-center px-4 py-1"
                        >
                            <div
                                className={cn(
                                    'w-10 h-8 flex items-center justify-center rounded-2xl transition-all duration-200',
                                    isActive ? 'bg-[var(--color-primary)]' : ''
                                )}
                            >
                                <Icon
                                    size={20}
                                    className={cn(
                                        'transition-colors duration-200',
                                        isActive ? 'text-white' : 'text-[var(--color-hint)]'
                                    )}
                                />
                            </div>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

export default function TelegramLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="relative w-full flex flex-col bg-[var(--color-bg)]"
            style={{ minHeight: '100dvh' }}
        >
            <ToastProvider />
            <TelegramHeader />
            <main
                className="flex-1 overflow-y-auto overflow-x-hidden [overscroll-behavior-y:contain] [-webkit-overflow-scrolling:touch]"
                style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
            >
                {children}
            </main>
            <TelegramBottomNav />
        </div>
    );
}
