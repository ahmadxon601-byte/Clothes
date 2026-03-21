'use client';

/**
 * /tg-auth — Telegram Mini App auth entry point.
 * Bot "🛒 Marketplaceni ochish" tugmasi shu sahifaga yo'naltiradi.
 * initData orqali foydalanuvchi autentifikatsiya qilinadi va /telegram ga redirect qilinadi.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { telegramWebAppAuth } from '../../src/lib/apiClient';

export default function TgAuthPage() {
    const router = useRouter();
    const [error, setError] = useState<string>('');

    useEffect(() => {
        let cancelled = false;

        const doAuth = async () => {
            try {
                const tg = (window as any).Telegram?.WebApp;

                if (tg?.initData) {
                    tg.ready?.();
                    tg.expand?.();
                    try {
                        await telegramWebAppAuth(tg.initData);
                    } catch (authErr: any) {
                        // Auth failed — still redirect (user can browse without auth)
                        if (!cancelled) setError(authErr?.message ?? '');
                    }
                }

                // Redirect regardless of auth result — products are public
                if (!cancelled) {
                    router.replace('/telegram');
                }
            } catch {
                if (!cancelled) router.replace('/telegram');
            }
        };

        // Give Telegram SDK time to inject WebApp object
        const timer = setTimeout(doAuth, 400);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[var(--color-bg)] gap-3">
            <div className="w-9 h-9 border-[3px] border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
            {error && (
                <p className="text-[11px] text-[var(--color-hint)] text-center px-6 max-w-xs">
                    {error}
                </p>
            )}
        </div>
    );
}
