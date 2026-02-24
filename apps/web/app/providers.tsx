'use client';

import { useEffect } from 'react';
import { applyTelegramTheme } from '../src/telegram/theme';
import { useTelegram } from '../src/telegram/useTelegram';
import { BackButtonSync } from '../src/telegram/BackButtonSync';
import { getTelegramWebApp, safeTelegramCall } from '../src/telegram/webApp';
import { useSettingsStore } from '../src/features/settings/model';
import { useFavoritesStore } from '../src/features/favorites/model';

export function Providers({ children }: { children: React.ReactNode }) {
    useTelegram();
    const settings = useSettingsStore(s => s.settings);
    const loadSettings = useSettingsStore(s => s.loadSettings);
    const loadFavorites = useFavoritesStore(s => s.loadFavorites);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            loadSettings();
            loadFavorites();
            applyTelegramTheme(useSettingsStore.getState().settings.themeMode || 'auto');

            // Telegram mavzusi o'zgarganda yangilash
            const handleEvent = () => applyTelegramTheme(useSettingsStore.getState().settings.themeMode || 'auto');
            let detach: (() => void) | null = null;

            const attachThemeListener = () => {
                const webApp = getTelegramWebApp();
                const onEvent = webApp?.onEvent;
                const offEvent = webApp?.offEvent;

                if (!onEvent || !offEvent) return false;
                const subscribed = safeTelegramCall(
                    'onEvent(themeChanged)',
                    () => {
                        onEvent('themeChanged', handleEvent);
                        return true;
                    },
                    false,
                );
                if (!subscribed) return false;

                detach = () => {
                    safeTelegramCall('offEvent(themeChanged)', () => offEvent('themeChanged', handleEvent));
                };
                return true;
            };

            if (attachThemeListener()) {
                return () => detach?.();
            }

            const waitTimer = window.setInterval(() => {
                if (attachThemeListener()) {
                    window.clearInterval(waitTimer);
                }
            }, 250);

            return () => {
                window.clearInterval(waitTimer);
                detach?.();
            };
        }
    }, [loadSettings, loadFavorites]);

    useEffect(() => {
        const mode = settings.themeMode || 'auto';
        applyTelegramTheme(mode);
    }, [settings.themeMode]);

    return (
        <>
            <BackButtonSync />
            {children}
        </>
    );
}
