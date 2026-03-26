'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { telegramWebAppAuth } from '../../src/lib/apiClient';
import { clearTelegramLoggedOut, isTelegramLoggedOutByUser } from '../../src/lib/telegramAuthState';

export default function TgAuthPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [showRestorePrompt, setShowRestorePrompt] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const redirectToApp = () => {
            if (!cancelled) router.replace('/telegram');
        };

        const doAuth = async () => {
            try {
                const tg = (window as any).Telegram?.WebApp;

                if (tg?.initData) {
                    tg.ready?.();
                    tg.expand?.();

                    if (isTelegramLoggedOutByUser()) {
                        if (!cancelled) setShowRestorePrompt(true);
                        return;
                    }

                    try {
                        await telegramWebAppAuth(tg.initData);
                    } catch (authErr: any) {
                        if (!cancelled) setError(authErr?.message ?? '');
                    }
                }

                redirectToApp();
            } catch {
                redirectToApp();
            }
        };

        const timer = setTimeout(doAuth, 400);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [router]);

    const handleRestoreChoice = async (shouldLogin: boolean) => {
        const tg = (window as any).Telegram?.WebApp;
        if (!tg?.initData) {
            router.replace('/telegram');
            return;
        }

        if (!shouldLogin) {
            router.replace('/telegram');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            await telegramWebAppAuth(tg.initData);
            clearTelegramLoggedOut();
        } catch (authErr: any) {
            setError(authErr?.message ?? '');
        } finally {
            setSubmitting(false);
            router.replace('/telegram');
        }
    };

    return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-bg)] px-5">
            {showRestorePrompt ? (
                <div className="w-full max-w-sm rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
                    <h1 className="text-center text-[18px] font-bold text-[var(--color-text)]">
                        Tizimdagi akkaunt bilan kirilsinmi?
                    </h1>
                    <p className="mt-2 text-center text-[13px] leading-6 text-[var(--color-hint)]">
                        Ha desangiz Telegram akkauntingiz bilan qayta kiriladi, yo&apos;q desangiz mehmon sifatida davom etasiz.
                    </p>
                    <div className="mt-5 flex gap-3">
                        <button
                            onClick={() => handleRestoreChoice(false)}
                            disabled={submitting}
                            className="flex-1 rounded-full border border-[var(--color-border)] px-4 py-3 text-[13px] font-bold text-[var(--color-text)] disabled:opacity-60"
                        >
                            Yo&apos;q
                        </button>
                        <button
                            onClick={() => handleRestoreChoice(true)}
                            disabled={submitting}
                            className="flex-1 rounded-full bg-[var(--color-primary)] px-4 py-3 text-[13px] font-bold text-white disabled:opacity-60"
                        >
                            {submitting ? 'Kutilmoqda...' : 'Ha'}
                        </button>
                    </div>
                    {error ? (
                        <p className="mt-3 text-center text-[11px] text-[var(--color-hint)]">{error}</p>
                    ) : null}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
                    {error ? (
                        <p className="max-w-xs px-6 text-center text-[11px] text-[var(--color-hint)]">{error}</p>
                    ) : null}
                </div>
            )}
        </div>
    );
}
