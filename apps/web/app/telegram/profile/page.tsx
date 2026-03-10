'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Bookmark, Settings, Store, Check, Loader2 } from 'lucide-react';
import { useTelegram } from '../../../src/telegram/useTelegram';
import { getApiToken } from '../../../src/lib/apiClient';
import { useAppRoutes } from '../../../src/shared/config/useAppRoutes';
import { useTranslation } from '../../../src/shared/lib/i18n';

interface MeUser {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    telegram_id: number | null;
}

interface StoreStatus {
    status: 'approved' | 'pending' | 'rejected' | 'none';
    store?: { id: string; name: string };
    request?: { store_name: string; status: string };
}

async function apiFetch<T>(path: string): Promise<T> {
    const token = getApiToken();
    const res = await fetch(path, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    return (json.data ?? json) as T;
}

export default function TelegramProfilePage() {
    const { user: tgUser } = useTelegram();
    const { t } = useTranslation();
    const routes = useAppRoutes();

    const [me, setMe] = useState<MeUser | null>(null);
    const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiFetch<MeUser>('/api/auth/me').catch(() => null),
            apiFetch<StoreStatus>('/api/stores/my').catch(() => ({ status: 'none' as const })),
        ]).then(([meData, statusData]) => {
            setMe(meData);
            setStoreStatus(statusData);
        }).finally(() => setLoading(false));
    }, []);

    const displayName = me?.name || tgUser?.first_name || '';
    const username = tgUser?.username
        ? `@${tgUser.username}`
        : tgUser?.id
            ? `ID: ${tgUser.id}`
            : '';
    const phone = me?.phone || '';

    const menuItems = [
        { label: t.favorites, sub: t.saved_products, icon: Bookmark, href: routes.FAVORITES },
        { label: t.settings, sub: t.language_theme_security, icon: Settings, href: routes.SETTINGS },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)]">
            <div className="px-6 space-y-4">
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
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-[var(--color-primary)] border-2 border-[var(--color-surface)] rounded-full flex items-center justify-center text-white">
                            <Check size={11} strokeWidth={4} />
                        </div>
                    </div>

                    <h2 className="mt-3 text-[19px] font-bold text-[var(--color-text)] text-center leading-tight">
                        {displayName || t.user}
                    </h2>
                    <p className="text-[13px] text-[var(--color-hint)] font-medium">{t.user}</p>

                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {phone && (
                            <span className="px-4 py-2 bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-full text-[13px] font-medium text-[var(--color-text)]">
                                {phone}
                            </span>
                        )}
                        {username && (
                            <span className="px-4 py-2 bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-full text-[13px] font-medium text-[var(--color-text)]">
                                {username}
                            </span>
                        )}
                    </div>
                </div>

                {/* Menu */}
                <div className="space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
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

                {/* Store section */}
                <div className="bg-[var(--color-surface)] rounded-[28px] p-6 shadow-sm border border-[var(--color-border)]">
                    {storeStatus?.status === 'approved' && storeStatus.store ? (
                        <>
                            <h3 className="text-[17px] font-bold text-[var(--color-text)]">Mening do&apos;konim</h3>
                            <p className="mt-1 text-[14px] font-semibold text-[var(--color-primary)]">{storeStatus.store.name}</p>
                            <Link
                                href={routes.STORE_STATUS}
                                className="mt-4 flex h-12 items-center justify-center bg-[var(--color-primary)] text-white rounded-full text-[14px] font-bold shadow-[0_4px_12px_rgba(26,229,80,0.25)] active:scale-95 transition-all"
                            >
                                <Settings size={16} className="mr-2" />
                                {t.seller_panel}
                            </Link>
                        </>
                    ) : storeStatus?.status === 'pending' ? (
                        <>
                            <h3 className="text-[17px] font-bold text-[var(--color-text)]">{t.is_store_owner}</h3>
                            <p className="mt-1.5 text-[13px] text-amber-500 font-medium">
                                Arizangiz ko&apos;rib chiqilmoqda...
                            </p>
                            <Link
                                href={routes.STORE_STATUS}
                                className="mt-4 flex h-12 items-center justify-center bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] rounded-full text-[14px] font-bold active:scale-95 transition-all"
                            >
                                Holatni ko&apos;rish
                            </Link>
                        </>
                    ) : (
                        <>
                            <h3 className="text-[17px] font-bold text-[var(--color-text)]">{t.is_store_owner}</h3>
                            <p className="mt-1.5 text-[13px] text-[var(--color-hint)] font-medium leading-relaxed">
                                {t.list_products_manage_stock}
                            </p>
                            <div className="mt-5 flex gap-2.5">
                                <Link
                                    href={routes.STORE_APPLY}
                                    className="flex-1 h-12 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-full text-[14px] font-bold shadow-[0_4px_12px_rgba(26,229,80,0.25)] active:scale-95 transition-all"
                                >
                                    <Store size={16} className="mr-2" />
                                    {t.add_store}
                                </Link>
                                <Link
                                    href={routes.STORE_STATUS}
                                    className="flex-1 h-12 flex items-center justify-center bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] rounded-full text-[14px] font-bold active:scale-95 transition-all"
                                >
                                    <Settings size={16} className="mr-2" />
                                    {t.seller_panel}
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
