'use client';
import { useEffect, useState } from 'react';
import { getTelegramWebApp, safeTelegramCall } from './webApp';


export function useTelegram() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const init = (webApp: ReturnType<typeof getTelegramWebApp>) => {
            if (!webApp) return false;
            const ok = safeTelegramCall(
                'ready/expand',
                () => {
                    webApp.ready?.();
                    webApp.expand?.();
                    return true;
                },
                false,
            );
            if (!ok) {
                // Telegram WebView ba'zan SDK metodlaridan Event throw qiladi.
                // App crash bo'lmasligi uchun xatoni yutib, keyingi tickda qayta urinib ko'ramiz.
                return false;
            }
            try {
                setIsReady(true);
                return true;
            } catch {
                return false;
            }
        };

        if (init(getTelegramWebApp())) return;

        const timer = window.setInterval(() => {
            if (init(getTelegramWebApp())) {
                window.clearInterval(timer);
            }
        }, 200);

        return () => window.clearInterval(timer);
    }, []);

    const webApp = getTelegramWebApp();

    return {
        WebApp: webApp,
        user: webApp?.initDataUnsafe?.user ?? null,
        isReady,
    };
}
