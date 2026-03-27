'use client';

import { ChevronLeft, Moon, SlidersHorizontal, Sun } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useSettingsStore } from '../../features/settings/model';
import { useTranslation } from '../lib/i18n';
import { LanguageSelector } from './LanguageSelector';
import { TELEGRAM_ROUTES } from '../config/constants';

const HEADER_ROUTES = new Set([
    TELEGRAM_ROUTES.HOME,
    TELEGRAM_ROUTES.STORES,
    TELEGRAM_ROUTES.PRODUCTS,
    TELEGRAM_ROUTES.SEARCH,
    TELEGRAM_ROUTES.FAVORITES,
    TELEGRAM_ROUTES.PROFILE,
]);

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

    if (pathname === TELEGRAM_ROUTES.HOME || pathname === TELEGRAM_ROUTES.STORES) {
        title = 'Qulaymarket';
        titleClass = 'text-[17px] font-bold text-[var(--color-text)] text-center';
        left = (
            <button onClick={toggleTheme} className={iconButtonClass}>
                {settings.themeMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
        );
        right = <LanguageSelector />;
    } else if (pathname === TELEGRAM_ROUTES.PRODUCTS) {
        title = t.products_page_title;
        titleClass = 'text-[20px] font-bold text-[var(--color-text)] text-center';
        left = (
            <button onClick={() => router.back()} className={iconButtonClass}>
                <ChevronLeft size={17} />
            </button>
        );
    } else if (pathname === TELEGRAM_ROUTES.SEARCH) {
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
    } else if (pathname === TELEGRAM_ROUTES.FAVORITES) {
        title = t.favorites;
        titleClass = 'text-[20px] font-bold text-[var(--color-text)] text-center';
        left = (
            <button onClick={() => router.back()} className={iconButtonClass}>
                <ChevronLeft size={17} />
            </button>
        );
    } else if (pathname === TELEGRAM_ROUTES.PROFILE) {
        title = t.profile;
        left = (
            <button onClick={() => router.back()} className={iconButtonClass}>
                <ChevronLeft size={17} />
            </button>
        );
    }

    return (
        <header className="fixed top-0 inset-x-0 mx-auto w-full max-w-[540px] z-[70] pt-[env(safe-area-inset-top)] bg-[var(--color-header-bg)] glass-blur border-b border-[var(--color-header-border)] md:sticky md:top-0 md:inset-x-auto md:max-w-none md:mx-0 md:z-30">
            <div className="h-[56px] px-5 grid grid-cols-[36px_1fr_36px] items-center">
                {left}
                <h1 className={titleClass}>{title}</h1>
                <div className="justify-self-end">{right}</div>
            </div>
        </header>
    );
}
