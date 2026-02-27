'use client';
import { useEffect, useState } from 'react';
import { getTelegramWebApp, safeTelegramCall } from './webApp';
import type { UserInfo } from '../shared/types';

const SESSION_KEY = 'tg_auth_session';
const TELEGRAM_SDK_SRC = 'https://telegram.org/js/telegram-web-app.js';
let telegramSdkPromise: Promise<void> | null = null;

function ensureTelegramSdkLoaded(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    if (window.Telegram?.WebApp) return Promise.resolve();
    if (telegramSdkPromise) return telegramSdkPromise;

    telegramSdkPromise = new Promise<void>((resolve) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-telegram-sdk="1"]');
        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => resolve(), { once: true });
            window.setTimeout(() => resolve(), 1500);
            return;
        }

        const script = document.createElement('script');
        script.src = TELEGRAM_SDK_SRC;
        script.async = true;
        script.setAttribute('data-telegram-sdk', '1');
        script.onload = () => resolve();
        script.onerror = () => resolve(); // Never reject with Event object.
        document.head.appendChild(script);
        window.setTimeout(() => resolve(), 1500);
    });

    return telegramSdkPromise;
}

function readSessionUser(): UserInfo | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { user?: UserInfo };
        return parsed?.user ?? null;
    } catch {
        return null;
    }
}

function writeSessionUser(user: UserInfo | null) {
    if (typeof window === 'undefined' || !user) return;
    try {
        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ user, loggedAt: new Date().toISOString() }),
        );
    } catch {
        // ignore storage errors
    }
}

function normalizeTelegramUser(
    user: {
        id?: number;
        first_name?: string;
        last_name?: string;
        username?: string;
        language_code?: string;
        photo_url?: string;
    } | null | undefined,
): UserInfo | null {
    if (!user || typeof user.id !== 'number' || typeof user.first_name !== 'string') {
        return null;
    }

    return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        language_code: user.language_code,
        photo_url: user.photo_url,
    };
}

export function useTelegram() {
    const [isReady, setIsReady] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);

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
                const nextUser = normalizeTelegramUser(webApp?.initDataUnsafe?.user);
                setUser(nextUser);
                writeSessionUser(nextUser);
                setIsReady(true);
                return true;
            } catch {
                return false;
            }
        };

        // Keep a local session fallback for quick restore.
        const sessionUser = readSessionUser();
        if (sessionUser) {
            setUser(sessionUser);
        }

        let timer: number | null = null;
        let cancelled = false;

        const start = async () => {
            await ensureTelegramSdkLoaded();
            if (cancelled) return;

            if (init(getTelegramWebApp())) return;

            timer = window.setInterval(() => {
                if (init(getTelegramWebApp())) {
                    if (timer) {
                        window.clearInterval(timer);
                        timer = null;
                    }
                }
            }, 200);
        };

        start();

        return () => {
            cancelled = true;
            if (timer) window.clearInterval(timer);
        };
    }, []);

    const webApp = getTelegramWebApp();
    const liveUser = normalizeTelegramUser(webApp?.initDataUnsafe?.user);
    const resolvedUser = liveUser ?? user;
    if (liveUser) {
        writeSessionUser(liveUser);
    }

    return {
        WebApp: webApp,
        user: resolvedUser,
        isReady,
    };
}
