'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Bookmark, Settings, LogOut, Store, Package, Loader2, Check, Smartphone, Monitor, Eye, EyeOff } from 'lucide-react';
import { useTelegram } from '../../../src/telegram/useTelegram';
import { getApiToken, setApiToken, telegramWebAppAuth } from '../../../src/lib/apiClient';
import { TELEGRAM_ROUTES } from '../../../src/shared/config/constants';
import { useTranslation } from '../../../src/shared/lib/i18n';

interface MeUser {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    telegram_id: number | null;
}

export default function TelegramProfilePage() {
    const { WebApp, user: tgUser, isReady } = useTelegram();
    const { t } = useTranslation();

    const [me, setMe] = useState<MeUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingIn, setLoggingIn] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

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
        if (initData) {
            // Always refresh token from Telegram initData to get latest role
            telegramWebAppAuth(initData)
                .then(newToken => { setApiToken(newToken); setToken(newToken); })
                .catch(() => setToken(getApiToken()));
        } else {
            setToken(getApiToken());
        }
    }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch /api/auth/me when token changes
    useEffect(() => {
        if (!token) { setLoading(false); return; }
        setLoading(true);
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(json => setMe(json?.data ?? json ?? null))
            .catch(() => setMe(null))
            .finally(() => setLoading(false));
    }, [token]);

    const handleLogin = async () => {
        const initData = WebApp?.initData;
        if (!initData) return;
        setLoggingIn(true);
        try {
            const newToken = await telegramWebAppAuth(initData);
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
            localStorage.removeItem('marketplace_token');
        }
        setToken(null);
        setMe(null);
    };

    // Web credentials state
    const isTelegramOnlyEmail = me?.email?.endsWith('@t.me') ?? false;
    const [credOpen, setCredOpen] = useState(false);
    const [credEmail, setCredEmail] = useState('');
    const [credPass, setCredPass] = useState('');
    const [credShowPass, setCredShowPass] = useState(false);
    const [credSaving, setCredSaving] = useState(false);
    const [credError, setCredError] = useState('');
    const [credSuccess, setCredSuccess] = useState(false);

    const handleSetCredentials = async () => {
        setCredError('');
        if (!credEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credEmail)) {
            setCredError("To'g'ri email kiriting"); return;
        }
        if (credPass.length < 6) {
            setCredError('Parol kamida 6 ta belgi'); return;
        }
        setCredSaving(true);
        try {
            const res = await fetch('/api/auth/set-credentials', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: credEmail.trim(), password: credPass }),
            });
            const json = await res.json();
            if (!res.ok) { setCredError(json.error ?? 'Xatolik'); return; }
            setCredSuccess(true);
            setCredOpen(false);
            // Update displayed email
            if (me) setMe({ ...me, email: credEmail.trim() });
        } catch {
            setCredError('Tarmoq xatosi');
        } finally {
            setCredSaving(false);
        }
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
                <h2 className="text-[20px] font-bold text-[var(--color-text)]">Faqat Telegram orqali</h2>
                <p className="mt-2 text-[14px] text-[var(--color-hint)] leading-relaxed max-w-xs">
                    Bu sahifa faqat Telegram Mini App orqali ochiladi. Iltimos, Telegram botdan foydalaning.
                </p>
            </div>
        );
    }

    // Loading
    if (loading || (!isReady && !me && !isDesktop)) {
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
                    {tgUser?.first_name ? `Salom, ${tgUser.first_name}!` : 'Kirish kerak'}
                </h2>
                <p className="mt-2 text-[14px] text-[var(--color-hint)] leading-relaxed max-w-xs">
                    Profilingizni ko&apos;rish uchun Telegram orqali kiring.
                </p>
                <button
                    onClick={handleLogin}
                    disabled={loggingIn || !WebApp?.initData}
                    className="mt-6 h-12 px-8 rounded-full bg-[var(--color-primary)] text-white font-bold text-[15px] flex items-center gap-2 disabled:opacity-50 active:scale-95 transition-all shadow-[0_4px_14px_rgba(26,229,80,0.3)]"
                >
                    {loggingIn ? <Loader2 size={18} className="animate-spin" /> : null}
                    Telegram orqali kirish
                </button>
            </div>
        );
    }

    // Logged in
    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] pb-6">
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
                                <p className="text-[15px] font-bold text-[var(--color-text)] leading-tight">Mening do&apos;konim</p>
                                <p className="text-[11px] text-[var(--color-hint)] font-medium">Do&apos;konlarni boshqarish</p>
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
                                <p className="text-[15px] font-bold text-[var(--color-text)] leading-tight">Mening mahsulotlarim</p>
                                <p className="text-[11px] text-[var(--color-hint)] font-medium">Mahsulotlarni boshqarish</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-[var(--color-hint)] opacity-30" />
                    </Link>

                    {/* Web kirish sozlamalari */}
                    <div className="bg-[var(--color-surface)] rounded-[20px] shadow-sm border border-[var(--color-border)] overflow-hidden">
                        <button
                            onClick={() => { setCredOpen(o => !o); setCredError(''); setCredSuccess(false); }}
                            className="w-full flex items-center justify-between px-4 py-3.5 active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                                    <Monitor size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[15px] font-bold text-[var(--color-text)] leading-tight">Web&apos;da kirish</p>
                                    <p className="text-[11px] font-medium mt-0.5">
                                        {credSuccess || !isTelegramOnlyEmail
                                            ? <span className="text-[var(--color-primary)]">✓ {me?.email}</span>
                                            : <span className="text-amber-500">Sozlanmagan</span>
                                        }
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={18} className={`text-[var(--color-hint)] opacity-30 transition-transform ${credOpen ? 'rotate-90' : ''}`} />
                        </button>

                        {credOpen && (
                            <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-border)]">
                                <p className="pt-3 text-[13px] text-[var(--color-hint)] leading-relaxed">
                                    Email va parol o&apos;rnating — keyin <strong>clothes.uz</strong> saytiga oddiy kirish orqali ham hisobingizga kirishingiz mumkin.
                                </p>
                                <div>
                                    <p className="mb-1.5 text-[12px] font-semibold text-[var(--color-hint)]">Email</p>
                                    <input
                                        value={credEmail}
                                        onChange={e => { setCredEmail(e.target.value); setCredError(''); }}
                                        placeholder="sizning@email.com"
                                        type="email"
                                        inputMode="email"
                                        className="w-full h-12 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] outline-none focus:border-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <p className="mb-1.5 text-[12px] font-semibold text-[var(--color-hint)]">Parol (kamida 6 belgi)</p>
                                    <div className="relative">
                                        <input
                                            value={credPass}
                                            onChange={e => { setCredPass(e.target.value); setCredError(''); }}
                                            placeholder="••••••••"
                                            type={credShowPass ? 'text' : 'password'}
                                            className="w-full h-12 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 pr-11 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] outline-none focus:border-[var(--color-primary)]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setCredShowPass(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-hint)]"
                                        >
                                            {credShowPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                {credError && <p className="text-[13px] text-red-500">{credError}</p>}
                                <button
                                    onClick={handleSetCredentials}
                                    disabled={credSaving}
                                    className="w-full h-11 rounded-full bg-indigo-500 text-white font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                                >
                                    {credSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                                    Saqlash
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-red-50 dark:bg-red-950/30 rounded-[20px] border border-red-200 dark:border-red-900/40 active:scale-[0.98] transition-all"
                    >
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 text-red-500">
                            <LogOut size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-[15px] font-bold text-red-600 dark:text-red-400 leading-tight">Chiqish</p>
                            <p className="text-[11px] text-red-400 dark:text-red-500 font-medium">Hisobdan chiqish</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
