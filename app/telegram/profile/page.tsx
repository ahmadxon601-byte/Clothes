'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Bookmark, Settings, LogOut, Store, Package, Loader2, Check, Smartphone, Copy, KeyRound, Percent } from 'lucide-react';
import { useTelegram } from '../../../src/telegram/useTelegram';
import { clearApiToken, getApiToken, setApiToken, telegramWebAppAuth } from '../../../src/lib/apiClient';
import { clearTelegramLoggedOut, isTelegramLoggedOutByUser, markTelegramLoggedOut } from '../../../src/lib/telegramAuthState';
import { TELEGRAM_ROUTES } from '../../../src/shared/config/constants';
import { useTranslation } from '../../../src/shared/lib/i18n';
import { ConfirmDialog } from '../../../src/shared/ui/ConfirmDialog';

interface MeUser {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    telegram_id: number | null;
    access_key: string | null;
}

const TELEGRAM_SESSION_KEY = 'tg_auth_session';

export default function TelegramProfilePage() {
    const { WebApp, user: tgUser, isReady } = useTelegram();
    const { t } = useTranslation();

    const [me, setMe] = useState<MeUser | null>(null);
    const [token, setToken] = useState<string | null>(() => getApiToken());
    const [loading, setLoading] = useState(true);
    const [loggingIn, setLoggingIn] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [keyCopied, setKeyCopied] = useState(false);
    const [authResolved, setAuthResolved] = useState(false);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    // Detect desktop (no Telegram WebApp initData after SDK is given time to load)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const timer = setTimeout(() => {
            const hasWebApp = Boolean(window.Telegram?.WebApp?.initData);
            if (!hasWebApp) setIsDesktop(true);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    // Load token from localStorage, and silently refresh if initData is available
    useEffect(() => {
        if (!isReady) return;
        const initData = WebApp?.initData;
        const isLoggedOut = isTelegramLoggedOutByUser();
        if (initData) {
            if (isLoggedOut) {
                setToken(getApiToken());
                setAuthResolved(true);
                return;
            }
            // Always refresh token from Telegram initData to get latest role
            telegramWebAppAuth(initData)
                .then(newToken => { setApiToken(newToken); setToken(newToken); })
                .catch(() => setToken(getApiToken()))
                .finally(() => setAuthResolved(true));
        } else {
            setToken(getApiToken());
            setAuthResolved(true);
        }
    }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch /api/auth/me when token changes
    useEffect(() => {
        if (!authResolved) return;
        if (!token) { setLoading(false); return; }
        setLoading(true);
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(json => setMe(json?.data ?? json ?? null))
            .catch(() => setMe(null))
            .finally(() => setLoading(false));
    }, [authResolved, token]);

    const handleLogin = async () => {
        const initData = WebApp?.initData;
        if (!initData) return;
        setLoggingIn(true);
        try {
            const newToken = await telegramWebAppAuth(initData);
            clearTelegramLoggedOut();
            setApiToken(newToken);
            setToken(newToken);
        } catch {
            // ignore
        } finally {
            setLoggingIn(false);
        }
    };

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            clearApiToken();
            localStorage.removeItem(TELEGRAM_SESSION_KEY);
        }
        markTelegramLoggedOut();
        setToken(null);
        setMe(null);
        setAuthResolved(true);
        setLogoutDialogOpen(false);
    };

    const displayName = me?.name || tgUser?.first_name || '';
    const username = tgUser?.username ? `@${tgUser.username}` : tgUser?.id ? `ID: ${tgUser.id}` : '';

    // Desktop block
    if (isDesktop) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center mb-4">
                    <Smartphone size={28} className="text-[var(--color-hint)]" />
                </div>
                <h2 className="text-[20px] font-bold text-[var(--color-text)]">{t.telegram_only_title}</h2>
                <p className="mt-2 text-[14px] text-[var(--color-hint)] leading-relaxed max-w-xs">
                    {t.telegram_only_desc}
                </p>
            </div>
        );
    }

    // Loading
    if (loading || !authResolved || (!isReady && !me && !isDesktop)) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    // Not logged in
    if (!token || !me) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
                <div className="w-20 h-20 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-5 overflow-hidden">
                    {tgUser?.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tgUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[32px] text-[var(--color-hint)]">👤</span>
                    )}
                </div>
                <h2 className="text-[20px] font-bold text-[var(--color-text)]">
                    {tgUser?.first_name || t.login_required}
                </h2>
                <p className="mt-2 text-[14px] text-[var(--color-hint)] leading-relaxed max-w-xs">
                    {t.profile_login_desc}
                </p>
                <button
                    onClick={handleLogin}
                    disabled={loggingIn || !WebApp?.initData}
                    className="mt-6 h-12 px-8 rounded-full bg-[var(--color-primary)] text-white font-bold text-[15px] flex items-center gap-2 disabled:opacity-50 active:scale-95 transition-all shadow-[0_4px_14px_rgba(26,229,80,0.3)]"
                >
                    {loggingIn ? <Loader2 size={18} className="animate-spin" /> : null}
                    {t.login_via_telegram}
                </button>
            </div>
        );
    }

    // Logged in
    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] pb-6">
            <ConfirmDialog
                open={logoutDialogOpen}
                title="Akkauntdan chiqilsinmi?"
                message="Ha desangiz akkauntdan chiqasiz. Web App qayta ochilganda qayta kirish so'rovi chiqadi."
                confirmLabel="Ha"
                danger={false}
                onConfirm={handleLogout}
                onCancel={() => setLogoutDialogOpen(false)}
            />
            <div className="px-4 space-y-3">
                {/* Avatar + name */}
                <div className="bg-[var(--color-surface)] rounded-[28px] p-5 shadow-sm border border-[var(--color-border)] flex flex-col items-center">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-[2px] border-[var(--color-primary)] p-0.5 overflow-hidden bg-[var(--color-surface2)]">
                            {tgUser?.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={tgUser.photo_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || 'U')}`}
                                    alt={displayName}
                                    className="w-full h-full object-cover rounded-full"
                                />
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-[var(--color-primary)] border-2 border-[var(--color-surface)] rounded-full flex items-center justify-center">
                            <Check size={11} strokeWidth={4} className="text-white" />
                        </div>
                    </div>
                    <h2 className="mt-3 text-[19px] font-bold text-[var(--color-text)] text-center leading-tight">
                        {displayName || t.user}
                    </h2>
                    <p className="text-[12px] text-[var(--color-hint)] font-medium mt-0.5 capitalize">{me.role}</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {me.phone && (
                            <span className="px-3 py-1.5 bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-full text-[12px] font-medium text-[var(--color-text)]">
                                {me.phone}
                            </span>
                        )}
                        {username && (
                            <span className="px-3 py-1.5 bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-full text-[12px] font-medium text-[var(--color-text)]">
                                {username}
                            </span>
                        )}
                    </div>
                </div>

                {/* Access key card */}
                {me.access_key && (
                    <div className="bg-[var(--color-surface)] rounded-[20px] px-4 py-3 border border-[var(--color-border)] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] shrink-0">
                                <KeyRound size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-hint)]">{t.access_key}</p>
                                <p className="font-mono text-[17px] font-black tracking-[0.2em] text-[var(--color-text)] leading-tight">{me.access_key}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (me.access_key) navigator.clipboard.writeText(me.access_key);
                                setKeyCopied(true);
                                setTimeout(() => setKeyCopied(false), 2000);
                            }}
                            className="w-9 h-9 flex shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface2)] text-[var(--color-primary)] active:scale-95 transition-all"
                        >
                            {keyCopied ? <Check size={15} strokeWidth={3} /> : <Copy size={15} />}
                        </button>
                    </div>
                )}

                {/* Menu */}
                <div className="space-y-2">
                    {[
                        { label: t.favorites, sub: t.saved_products, icon: Bookmark, href: TELEGRAM_ROUTES.FAVORITES },
                        { label: t.settings, sub: t.language_theme_security, icon: Settings, href: TELEGRAM_ROUTES.SETTINGS },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between px-4 py-3.5 bg-[var(--color-surface)] rounded-[20px] shadow-sm border border-[var(--color-border)] active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                    <item.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-[var(--color-text)] leading-tight">{item.label}</p>
                                    <p className="text-[11px] text-[var(--color-hint)] font-medium">{item.sub}</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-[var(--color-hint)] opacity-30" />
                        </Link>
                    ))}
                </div>

                {/* 3 main action buttons */}
                <div className="space-y-2 pt-1">
                    <Link
                        href="/telegram/profile/stores"
                        className="flex items-center justify-between px-4 py-3.5 bg-[var(--color-surface)] rounded-[20px] shadow-sm border border-[var(--color-border)] active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                                <Store size={20} />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-[var(--color-text)] leading-tight">{t.my_store}</p>
                                <p className="text-[11px] text-[var(--color-hint)] font-medium">{t.manage_stores}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-[var(--color-hint)] opacity-30" />
                    </Link>

                    <Link
                        href="/telegram/profile/products"
                        className="flex items-center justify-between px-4 py-3.5 bg-[var(--color-surface)] rounded-[20px] shadow-sm border border-[var(--color-border)] active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                                <Package size={20} />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-[var(--color-text)] leading-tight">{t.my_products}</p>
                                <p className="text-[11px] text-[var(--color-hint)] font-medium">{t.manage_products}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-[var(--color-hint)] opacity-30" />
                    </Link>

                    <Link
                        href={TELEGRAM_ROUTES.PROFILE_DEALS}
                        className="flex items-center justify-between px-4 py-3.5 bg-[var(--color-surface)] rounded-[20px] shadow-sm border border-[var(--color-border)] active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                <Percent size={20} />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-[var(--color-text)] leading-tight">{t.deal_products}</p>
                                <p className="text-[11px] text-[var(--color-hint)] font-medium">{t.manage_deal_products}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-[var(--color-hint)] opacity-30" />
                    </Link>

                    <button
                        onClick={() => setLogoutDialogOpen(true)}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-red-50 dark:bg-red-950/30 rounded-[20px] border border-red-200 dark:border-red-900/40 active:scale-[0.98] transition-all"
                    >
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 text-red-500">
                            <LogOut size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-[15px] font-bold text-red-600 dark:text-red-400 leading-tight">{t.logout}</p>
                            <p className="text-[11px] text-red-400 dark:text-red-500 font-medium">{t.logout_desc}</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
