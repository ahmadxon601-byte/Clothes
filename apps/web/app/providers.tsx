'use client';

import { useEffect } from 'react';
import { applyTelegramTheme } from '../src/telegram/theme';
import { useTelegram } from '../src/telegram/useTelegram';
import { BackButtonSync } from '../src/telegram/BackButtonSync';
import { useSettingsStore } from '../src/features/settings/model';
import { useFavoritesStore } from '../src/features/favorites/model';

export function Providers({ children }: { children: React.ReactNode }) {
    useTelegram();
    const settings = useSettingsStore(s => s.settings);
    const loadSettings = useSettingsStore(s => s.loadSettings);
    const loadFavorites = useFavoritesStore(s => s.loadFavorites);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            applyTelegramTheme();
            loadSettings();
            loadFavorites();

            // Telegram mavzusi o'zgarganda yangilash
            const handleEvent = () => applyTelegramTheme();
            const webApp = (window as any).Telegram?.WebApp;
            if (webApp) {
                webApp.onEvent('themeChanged', handleEvent);
                return () => webApp.offEvent('themeChanged', handleEvent);
            }
        }
    }, [loadSettings, loadFavorites]);

    useEffect(() => {
        const root = window.document.documentElement;
        const mode = settings.themeMode || 'auto';

        if (mode === 'dark') {
            root.classList.add('dark');
        } else if (mode === 'light') {
            root.classList.remove('dark');
        } else {
            // Auto: check system preference or Telegram's hint
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (isDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [settings.themeMode]);

    return (
        <>
            <BackButtonSync />
            {children}
        </>
    );
}
