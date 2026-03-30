'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ChevronRight, Heart, Mail, MapPin, Phone, UserRound, Edit3, Loader2, Store, Clock, X, Copy, Check, Package, MessageCircleMore } from 'lucide-react';
import { useWebAuth } from '../../../src/context/WebAuthContext';
import { AuthModal } from '../../../src/shared/ui/AuthModal';
import { useSSERefetch } from '../../../src/shared/hooks/useSSERefetch';
import { useWebI18n } from '../../../src/shared/lib/webI18n';

const MapDisplay = dynamic(
    () => import('../../../src/shared/ui/MapDisplay').then((m) => m.MapDisplay),
    { ssr: false, loading: () => <div className="h-[120px] w-full bg-[#f3f4f6] dark:bg-[#111111] animate-pulse" /> }
);

function parseAddress(raw: string): { text: string; lat: number | null; lng: number | null } {
    const m = raw.match(/Coordinates:\s*([-\d.]+),\s*([-\d.]+)/i);
    if (!m) return { text: raw.trim(), lat: null, lng: null };
    const text = raw.replace(/\s+\S*\s*Coordinates:.*$/i, '').trim();
    return { text, lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
}

export default function SiteProfilePage() {
    const { w, language } = useWebI18n();
    const p = w.profilePage;
    const { user, loading, storeStatus, refreshUser, refreshStore } = useWebAuth();
    const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string; is_read: boolean; created_at: string }>>([]);
    const [keyCopied, setKeyCopied] = useState(false);
    const [accessKey, setAccessKey] = useState<string | null>(null);
    const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({ open: false, tab: 'login' });
    const [editOpen, setEditOpen] = useState(false);
    const [editTab, setEditTab] = useState<'profile' | 'password'>('profile');
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState('');
    // Password change
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [pwdSaving, setPwdSaving] = useState(false);
    const [pwdError, setPwdError] = useState('');
    const [pwdSuccess, setPwdSuccess] = useState('');

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('web-shell-header-visibility', { detail: { hidden: editOpen } }));
        return () => {
            window.dispatchEvent(new CustomEvent('web-shell-header-visibility', { detail: { hidden: false } }));
        };
    }, [editOpen]);

    const loadNotifications = () => {
        const token = getToken();
        if (!token) return;
        fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}`, 'X-Language': language } })
            .then(r => r.ok ? r.json() : null)
            .then(json => setNotifications(json?.data ?? []))
            .catch(() => {});
    };

    useEffect(() => {
        if (user) {
            setEditName(user.name);
            setEditEmail(user.email);
            // Fetch access_key from /api/auth/me
            const token = getToken();
            if (token) {
                fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
                    .then(r => r.ok ? r.json() : null)
                    .then(json => { if (json?.data?.access_key) setAccessKey(json.data.access_key); })
                    .catch(() => {});
                loadNotifications();
            }
            void refreshStore();
        }
    }, [user, refreshStore, language]);

    useSSERefetch(['notifications', 'daily_deals'], () => {
        loadNotifications();
    });
    useSSERefetch(['stores', 'seller_requests'], () => {
        void refreshStore();
    });

    const initials = useMemo(() => {
        if (!user) return '?';
        const parts = user.name.trim().split(/\s+/).slice(0, 2);
        return parts.map((p) => p[0]?.toUpperCase() || '').join('') || 'U';
    }, [user]);

    const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('marketplace_token') : null;

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError('');
        if (editName.trim().length < 2) { setEditError(p.nameTooShort); return; }
        if (!editEmail.trim().includes('@')) { setEditError(p.invalidEmail); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/auth/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error ?? p.updateFailed);
            await refreshUser();
            setEditOpen(false);
        } catch (err) {
            setEditError(err instanceof Error ? err.message : p.genericError);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwdError('');
        setPwdSuccess('');
        if (newPwd.length < 6) { setPwdError(p.passwordTooShort); return; }
        if (newPwd !== confirmPwd) { setPwdError(p.passwordsMismatch); return; }
        setPwdSaving(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error ?? p.genericError);
            setPwdSuccess(p.passwordChanged);
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        } catch (err) {
            setPwdError(err instanceof Error ? err.message : p.genericError);
        } finally {
            setPwdSaving(false);
        }
    };

    const storeApproved = storeStatus?.status === 'approved';
    const storePending = storeStatus?.status === 'pending';

    const menu = [
        { href: '/favorites', label: p.favorites, sub: p.favoritesDesc, icon: Heart },
        { href: '/my-products', label: p.products, sub: p.productsDesc, icon: Package },
        {
            label: p.support,
            sub: p.supportDesc,
            icon: MessageCircleMore,
            onClick: () => window.dispatchEvent(new Event('open-support-chat')),
        },
    ];

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#00c853]" />
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <>
                <AuthModal open={authModal.open} onClose={() => setAuthModal({ open: false, tab: 'login' })} defaultTab={authModal.tab} />
                <section className="mx-auto w-full max-w-[1280px] px-4 py-16 md:px-8 md:py-24 text-center">
                    <div className="mx-auto max-w-md">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f3f4f6]">
                            <UserRound size={36} className="text-[#9ca3af]" />
                        </div>
                        <h1 className="mt-5 font-[family-name:var(--font-playfair)] text-[32px] font-black text-[#111111]">{p.title}</h1>
                        <p className="mt-3 text-[15px] text-[#6b7280]">{p.guestDesc}</p>
                        <div className="mt-7 flex flex-wrap justify-center gap-3">
                            <button
                                onClick={() => setAuthModal({ open: true, tab: 'login' })}
                                className="inline-flex h-12 items-center gap-2 rounded-full border border-black/10 bg-white px-7 text-[13px] font-bold text-[#111111] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-16px_rgba(0,0,0,0.5)]"
                            >
                                {p.login}
                            </button>
                            <button
                                onClick={() => setAuthModal({ open: true, tab: 'register' })}
                                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#13ec37] px-7 text-[13px] font-bold text-[#06200f] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-14px_rgba(0,200,83,0.9)]"
                            >
                                {p.register}
                            </button>
                        </div>
                    </div>
                </section>
            </>
        );
    }

    return (
        <section className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-8 md:py-12">
            <div className="relative overflow-hidden rounded-[34px] border border-black/10 bg-[linear-gradient(135deg,#f9fffb_0%,#eef8ff_45%,#f5f7ff_100%)] p-6 shadow-[0_26px_65px_-45px_rgba(0,0,0,0.55)] md:p-8 dark:border-white/10 dark:bg-none dark:bg-[#1a1a1a]">
                <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[#00c853]/18 blur-3xl" />
                <div className="absolute -right-16 -bottom-24 h-56 w-56 rounded-full bg-[#6ea8ff]/20 blur-3xl" />

                <div className="relative grid gap-4 lg:grid-cols-[1.25fr_1fr]">
                    <div className="rounded-3xl border border-black/10 bg-white/88 p-6 backdrop-blur md:p-7 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645]">{p.badge}</p>
                        <div className="mt-4 flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#111111] text-[22px] font-black text-white">
                                {initials}
                            </div>
                            <div>
                                <h1 className="font-[family-name:var(--font-playfair)] text-[32px] font-black leading-none text-[#111111] md:text-[42px] dark:text-white">
                                    {user.name}
                                </h1>
                                <p className="mt-1 text-[13px] text-[#647184] capitalize dark:text-[#9ca3af]">{user.role} {p.accountSuffix}</p>
                            </div>
                        </div>
                        <div className="mt-6 h-[1px] w-full bg-gradient-to-r from-[#00c853]/35 to-transparent" />
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-[14px] font-medium text-[#374151] dark:text-[#9ca3af]">{p.ready}</p>
                            <button
                                onClick={() => setEditOpen(true)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-[11px] font-bold text-[#111111] transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white"
                            >
                                <Edit3 size={12} /> {p.edit}
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280] dark:text-[#9ca3af]">{p.email}</p>
                            <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-[#111111] dark:text-white">
                                <Mail size={14} />{user.email}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280] dark:text-[#9ca3af]">{p.role}</p>
                            <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-[#111111] capitalize dark:text-white">
                                <UserRound size={14} />{user.role}
                            </p>
                        </div>
                        {accessKey && (
                            <div className="rounded-2xl border border-[#00c853]/30 bg-[#f0faf4] p-4 dark:border-[#00c853]/20 dark:bg-[#0e2e1a] sm:col-span-2 lg:col-span-1">
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#00a645]">{p.accessKey}</p>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <p className="font-mono text-[18px] font-black tracking-[0.25em] text-[#111111] dark:text-white">{accessKey}</p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(accessKey);
                                            setKeyCopied(true);
                                            setTimeout(() => setKeyCopied(false), 2000);
                                        }}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#00c853]/30 bg-white text-[#00a645] transition-all hover:bg-[#00c853]/10 dark:bg-[#00c853]/10"
                                    >
                                        {keyCopied ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <p className="mt-1 text-[10px] text-[#6b7280]">{p.accessKeyHint}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Store status block */}
            <div className="mt-5">
                {notifications.length > 0 && (
                    <div className="mb-5 rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#1a1a1a]">
                        <h2 className="text-[17px] font-extrabold text-[#111111] dark:text-white">{p.notifications}</h2>
                        <div className="mt-4 space-y-3">
                            {notifications.slice(0, 3).map((item) => (
                                <div key={item.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-[13px] font-bold text-[#111111] dark:text-white">{item.title}</p>
                                    <p className="mt-1 text-[12px] text-[#6b7280] dark:text-[#9ca3af]">{item.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {storeApproved && storeStatus?.status === 'approved' && (
                    <div className="rounded-3xl border border-[#00c853]/30 bg-[#f0faf4] p-5 dark:bg-[#0e2e1a] dark:border-[#00c853]/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00c853]/15 text-[#008d3a]">
                                    <Store size={18} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#00a645]">{p.myStore}</p>
                                    <h2 className="text-[18px] font-extrabold text-[#111111] dark:text-white">{storeStatus.store.name}</h2>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#00c853]/15 px-2 py-0.5 text-[10px] font-bold text-[#00a645]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#00c853]" />
                                        {p.approved}
                                    </span>
                                </div>
                            </div>
                            <Link
                                href="/my-store"
                                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#00c853]/30 bg-white px-4 text-[11px] font-bold text-[#008d3a] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(0,200,83,0.3)] dark:bg-[#00c853]/10 dark:text-[#4ade80]"
                            >
                                {p.manage} <ChevronRight size={13} />
                            </Link>
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            {storeStatus.store.phone && (
                                <div className="flex items-center gap-2 rounded-2xl border border-[#00c853]/20 bg-white p-3 dark:bg-[#00c853]/5">
                                    <Phone size={13} className="shrink-0 text-[#00a645]" />
                                    <p className="text-[13px] font-semibold text-[#111111] dark:text-white">{storeStatus.store.phone}</p>
                                </div>
                            )}
                            {storeStatus.store.address && (() => {
                                const { text, lat, lng } = parseAddress(storeStatus.store.address);
                                return (
                                    <div className="rounded-2xl border border-[#00c853]/20 bg-white overflow-hidden dark:bg-[#00c853]/5">
                                        {lat !== null && lng !== null ? (
                                            <a
                                                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block pointer-events-auto"
                                            >
                                                <div className="pointer-events-none">
                                                    <MapDisplay lat={lat} lng={lng} height={120} />
                                                </div>
                                            </a>
                                        ) : null}
                                        <div className="flex items-start gap-2 p-3">
                                            <MapPin size={13} className="shrink-0 mt-0.5 text-[#00a645]" />
                                            <p className="line-clamp-2 text-[13px] font-semibold text-[#111111] dark:text-white">{text}</p>
                                        </div>
                                    </div>
                                );
                            })()}
                            {storeStatus.store.description && (() => {
                                const { text: descText, lat: descLat, lng: descLng } = parseAddress(storeStatus.store.description);
                                return (
                                    <div className="rounded-2xl border border-[#00c853]/20 bg-white overflow-hidden dark:bg-[#00c853]/5">
                                        {descLat !== null && descLng !== null && (
                                            <a
                                                href={`https://www.openstreetmap.org/?mlat=${descLat}&mlon=${descLng}&zoom=15`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block pointer-events-auto"
                                            >
                                                <div className="pointer-events-none">
                                                    <MapDisplay lat={descLat} lng={descLng} height={120} />
                                                </div>
                                            </a>
                                        )}
                                        {descText && (
                                            <div className="flex items-center gap-2 p-3">
                                                <Store size={13} className="shrink-0 text-[#00a645]" />
                                                <p className="line-clamp-1 text-[13px] font-semibold text-[#111111] dark:text-white">{descText}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
                {storePending && (
                    <div className="flex items-center gap-3 rounded-3xl border border-orange-200 bg-orange-50 p-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                            <Clock size={18} />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-extrabold text-[#111111] dark:text-white">{p.pendingTitle}</h2>
                            <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                                {p.pendingDesc}
                                {storeStatus?.status === 'pending' && storeStatus.request.store_name ? ` · ${storeStatus.request.store_name}` : ''}
                            </p>
                        </div>
                    </div>
                )}
                {!storeApproved && !storePending && (
                    <Link
                        href="/open-store"
                        className="group flex items-center justify-between rounded-3xl border border-black/10 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(0,0,0,0.24)] dark:border-white/10 dark:bg-[#1a1a1a]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00c853]/12 text-[#008d3a]">
                                <Store size={18} />
                            </div>
                            <div>
                                <h2 className="text-[17px] font-extrabold text-[#111111] dark:text-white">{p.openStore}</h2>
                                <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">{p.openStoreDesc}</p>
                            </div>
                        </div>
                        <ChevronRight size={17} className="text-[#9ca3af] transition-transform group-hover:translate-x-0.5" />
                    </Link>
                )}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
                {menu.map((item) =>
                    item.href ? (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="group rounded-3xl border border-black/10 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(0,0,0,0.24)] dark:border-white/10 dark:bg-[#1a1a1a]"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00c853]/12 text-[#008d3a]">
                                        <item.icon size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-[17px] font-extrabold text-[#111111] dark:text-white">{item.label}</h2>
                                        <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">{item.sub}</p>
                                    </div>
                                </div>
                                <ChevronRight size={17} className="text-[#9ca3af] transition-transform group-hover:translate-x-0.5" />
                            </div>
                        </Link>
                    ) : (
                        <button
                            key={item.label}
                            type="button"
                            onClick={item.onClick}
                            className="group rounded-3xl border border-black/10 bg-white p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(0,0,0,0.24)] dark:border-white/10 dark:bg-[#1a1a1a]"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00c853]/12 text-[#008d3a]">
                                        <item.icon size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-[17px] font-extrabold text-[#111111] dark:text-white">{item.label}</h2>
                                        <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">{item.sub}</p>
                                    </div>
                                </div>
                                <ChevronRight size={17} className="text-[#9ca3af] transition-transform group-hover:translate-x-0.5" />
                            </div>
                        </button>
                    ),
                )}

            </div>

            {/* Edit profile modal */}
            {editOpen && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-[420px] rounded-[28px] border border-black/10 bg-white shadow-[0_30px_70px_-30px_rgba(0,0,0,0.45)] dark:border-white/10 dark:bg-[#1a1a1a]">
                        <button
                            onClick={() => { setEditOpen(false); setEditError(''); setPwdError(''); setPwdSuccess(''); }}
                            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[#6b7280] hover:text-[#111111] dark:border-white/10 dark:text-[#9ca3af] dark:hover:text-white"
                        >
                            <X size={16} />
                        </button>
                        <div className="p-7">
                            <h2 className="text-[20px] font-black text-[#111111] dark:text-white">{p.editProfileTitle}</h2>
                            {/* Tabs */}
                            <div className="mt-4 flex gap-1 rounded-xl bg-[#f3f4f6] p-1 dark:bg-[#111111]">
                                <button
                                    type="button"
                                    onClick={() => setEditTab('profile')}
                                    className={`flex-1 rounded-lg py-2 text-[12px] font-bold transition-all ${editTab === 'profile' ? 'bg-white text-[#111111] shadow dark:bg-[#1a1a1a] dark:text-white' : 'text-[#6b7280] dark:text-[#9ca3af]'}`}
                                >
                                    {p.profileTab}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditTab('password')}
                                    className={`flex-1 rounded-lg py-2 text-[12px] font-bold transition-all ${editTab === 'password' ? 'bg-white text-[#111111] shadow dark:bg-[#1a1a1a] dark:text-white' : 'text-[#6b7280] dark:text-[#9ca3af]'}`}
                                >
                                    {p.passwordTab}
                                </button>
                            </div>

                            {/* Profile tab */}
                            {editTab === 'profile' && (
                                <form onSubmit={handleUpdateProfile} className="mt-4 grid gap-3">
                                    <label className="grid gap-1.5">
                                        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{p.name}</span>
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="h-11 rounded-xl border border-black/12 px-3 text-[14px] outline-none focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                                            disabled={saving}
                                        />
                                    </label>
                                    <label className="grid gap-1.5">
                                        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{p.email}</span>
                                        <input
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            className="h-11 rounded-xl border border-black/12 px-3 text-[14px] outline-none focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                                            disabled={saving}
                                        />
                                    </label>
                                    {editError && <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">{editError}</p>}
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setEditOpen(false)} className="flex-1 h-11 rounded-full border border-black/10 text-[12px] font-bold text-[#111111] dark:border-white/10 dark:text-white">{p.cancel}</button>
                                        <button type="submit" disabled={saving} className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#13ec37] text-[12px] font-black text-[#06200f] disabled:opacity-60">
                                            {saving && <Loader2 size={13} className="animate-spin" />}
                                            {p.save}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Password tab */}
                            {editTab === 'password' && (
                                <form onSubmit={handleChangePassword} className="mt-4 grid gap-3">
                                    {[
                                        { label: p.currentPassword, value: currentPwd, setter: setCurrentPwd },
                                        { label: p.newPassword, value: newPwd, setter: setNewPwd },
                                        { label: p.confirmPassword, value: confirmPwd, setter: setConfirmPwd },
                                    ].map(({ label, value, setter }) => (
                                        <label key={label} className="grid gap-1.5">
                                            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{label}</span>
                                            <input
                                                type="password"
                                                value={value}
                                                onChange={(e) => setter(e.target.value)}
                                                className="h-11 rounded-xl border border-black/12 px-3 text-[14px] outline-none focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                                                disabled={pwdSaving}
                                            />
                                        </label>
                                    ))}
                                    {pwdError && <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">{pwdError}</p>}
                                    {pwdSuccess && <p className="rounded-xl bg-[#00c853]/10 px-3 py-2 text-[12px] font-semibold text-[#008d3a]">{pwdSuccess}</p>}
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setEditOpen(false)} className="flex-1 h-11 rounded-full border border-black/10 text-[12px] font-bold text-[#111111] dark:border-white/10 dark:text-white">{p.cancel}</button>
                                        <button type="submit" disabled={pwdSaving} className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#111111] text-[12px] font-black text-white disabled:opacity-60 dark:bg-white dark:text-[#111111]">
                                            {pwdSaving && <Loader2 size={13} className="animate-spin" />}
                                            {p.changePassword}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div className="hidden"><MapPin /></div>
        </section>
    );
}
