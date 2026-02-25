'use client';

import { ChevronLeft, Moon, SlidersHorizontal, Sun } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useSettingsStore } from '../../features/settings/model';
import { useTranslation } from '../lib/i18n';
import { LanguageSelector } from './LanguageSelector';

const HEADER_ROUTES = new Set(['/', '/search', '/favorites', '/profile']);

export function hasUnifiedHeader(pathname: string | null): boolean {
    if (!pathname) return false;
    return HEADER_ROUTES.has(pathname);
}

const iconButtonClass = 'w-9 h-9 flex items-center justify-center bg-[var(--color-surface)] rounded-full shadow-sm text-[var(--color-text)] active:scale-95 transition-all';

export function AppHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation();
    const settings = useSettingsStore((s) => s.settings);
    const updateSettings = useSettingsStore((s) => s.updateSettings);

    if (!hasUnifiedHeader(pathname)) return null;

    const toggleTheme = () => {
        updateSettings({ themeMode: settings.themeMode === 'dark' ? 'light' : 'dark' });
    };

    let title = '';
    let titleClass = 'text-[18px] font-bold text-[var(--color-text)] text-center';
    let left = <div className="w-9 h-9" />;
    let right = <div className="w-9 h-9" />;

    if (pathname === '/') {
        title = 'Clothes MP';
        titleClass = 'text-[17px] font-bold text-[var(--color-text)] text-center';
        left = (
            <button onClick={toggleTheme} className={iconButtonClass}>
                {settings.themeMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
        );
        right = <LanguageSelector />;
    } else if (pathname === '/search') {
        title = t.search_results;
        left = (
            <button onClick={() => router.back()} className={iconButtonClass}>
                <ChevronLeft size={17} />
            </button>
        );
        right = (
            <button className={iconButtonClass}>
                <SlidersHorizontal size={17} />
            </button>
        );
    } else if (pathname === '/favorites') {
        title = t.favorites;
        titleClass = 'text-[20px] font-bold text-[var(--color-text)] text-center';
        left = (
            <button onClick={() => router.back()} className={iconButtonClass}>
                <ChevronLeft size={17} />
            </button>
        );
    } else if (pathname === '/profile') {
        title = t.profile;
        left = (
            <button onClick={() => router.back()} className={iconButtonClass}>
                <ChevronLeft size={17} />
            </button>
        );
    }

    return (
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[70] pt-[env(safe-area-inset-top)] bg-[var(--color-header-bg)] glass-blur border-b border-[var(--color-header-border)]">
            <div className="h-[56px] px-5 grid grid-cols-[36px_1fr_36px] items-center">
                {left}
                <h1 className={titleClass}>{title}</h1>
                <div className="justify-self-end">{right}</div>
            </div>
        </header>
    );
}
