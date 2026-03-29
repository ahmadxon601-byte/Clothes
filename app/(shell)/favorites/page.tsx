'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Skeleton } from '../../../src/shared/ui/Skeleton';
import { SITE_ROUTES } from '../../../src/shared/config/constants';
import { useWebI18n } from '../../../src/shared/lib/webI18n';
import { useWebAuth } from '../../../src/context/WebAuthContext';
import { AuthModal } from '../../../src/shared/ui/AuthModal';
import { useSSERefetch } from '../../../src/shared/hooks/useSSERefetch';
import { useTranslation } from '../../../src/shared/lib/i18n';
import { useTranslatedLabelMap } from '../../../src/shared/hooks/useTranslatedLabelMap';
import { sanitizeProductLabel } from '../../../src/shared/lib/webProductText';
import { formatPrice } from '../../../src/shared/lib/formatPrice';

type FavProduct = {
    id: string;
    product_id: string;
    title: string;
    base_price: number;
    sale_price: number | null;
    image_url: string | null;
    brand: string;
    created_at: string;
};

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('marketplace_token');
}

export default function FavoritesPage() {
    const { user, loading: authLoading } = useWebAuth();
    const { w } = useWebI18n();
    const { language } = useTranslation();
    const [products, setProducts] = useState<FavProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<Set<string>>(new Set());
    const [authModal, setAuthModal] = useState(false);
    const translatedTitles = useTranslatedLabelMap(products.map((product) => ({ id: product.product_id, label: product.title })), language);

    const fetchFavorites = async () => {
        const token = getToken();
        if (!token) { setLoading(false); return; }
        try {
            const res = await fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                const data = json?.data ?? json ?? [];
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user]);

    useSSERefetch(['products'], fetchFavorites);

    const toggleFav = async (productId: string) => {
        if (!user) { setAuthModal(true); return; }
        const token = getToken();
        if (!token) return;
        setToggling((p) => { const s = new Set(p); s.add(productId); return s; });
        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ product_id: productId }),
            });
            if (res.ok) setProducts((prev) => prev.filter((p) => p.product_id !== productId));
        } catch { /* ignore */ } finally {
            setToggling((p) => { const s = new Set(p); s.delete(productId); return s; });
        }
    };

    const filtered = useMemo(() => products, [products]);

    if (authLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#00c853]" />
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <AuthModal open={authModal} onClose={() => setAuthModal(false)} defaultTab="login" />
                <section className="mx-auto w-full max-w-[1440px] px-5 py-16 md:px-8 md:py-24 text-center">
                    <div className="mx-auto max-w-md">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f3f4f6] dark:bg-[#1f1f1f]">
                            <Heart size={36} className="text-[#9ca3af]" />
                        </div>
                        <h1 className="mt-5 font-[family-name:var(--font-playfair)] text-[32px] font-black text-[#111111] dark:text-white">{w.favorites.authTitle}</h1>
                        <p className="mt-3 text-[15px] text-[#6b7280] dark:text-[#9ca3af]">{w.favorites.authDesc}</p>
                        <button
                            onClick={() => setAuthModal(true)}
                            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#13ec37] px-7 text-[13px] font-bold text-[#06200f] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-14px_rgba(0,200,83,0.9)]"
                        >
                            {w.favorites.authAction}
                        </button>
                    </div>
                </section>
            </>
        );
    }

    return (
        <section className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-8 md:py-12">
            <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-[linear-gradient(145deg,#fbfffc_0%,#f2f8ff_52%,#f7faff_100%)] p-6 dark:border-white/10 dark:bg-[linear-gradient(145deg,#111_0%,#0d1a12_52%,#0f1520_100%)] md:p-8">
                <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#00c853]/15 blur-3xl" />
                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#5aa6ff]/20 blur-3xl" />
                <div className="relative">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645] dark:text-[#00c853]">{w.favorites.badge}</p>
                    <h1 className="mt-1.5 font-[family-name:var(--font-playfair)] text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-none text-[#111111] dark:text-white">
                        {w.favorites.title}
                    </h1>
                    <p className="mt-2 max-w-xl text-[14px] text-[#5b6472] dark:text-[#9ca3af]">
                        {w.favorites.subtitle}
                    </p>
                </div>
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="grid grid-cols-1 gap-5 min-[460px]:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-3xl border border-black/8 bg-white p-3 dark:border-white/8 dark:bg-[#1a1a1a]">
                                <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                                <Skeleton className="mt-3 h-4 w-2/3" />
                                <Skeleton className="mt-2 h-4 w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5 min-[460px]:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
                        {filtered.map((product) => {
                            const bp = Number(product.base_price);
                            const sp = product.sale_price != null ? Number(product.sale_price) : null;
                            const cur = sp != null && sp < bp ? sp : bp;
                            const hasDis = cur < bp;
                            const pct = hasDis ? Math.round((1 - cur / bp) * 100) : 0;
                            const isBusy = toggling.has(product.product_id);
                            return (
                                <Link
                                    key={product.id}
                                    href={SITE_ROUTES.PRODUCT(product.product_id)}
                                    className="group rounded-3xl border border-black/5 bg-[#f8f9fb] p-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_55px_-25px_rgba(0,0,0,0.22)] dark:border-white/5 dark:bg-[#1a1a1a]"
                                >
                                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white dark:bg-[#242424]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={product.image_url || 'https://placehold.co/640x800/f8f8f8/ccc?text=Product'} alt={sanitizeProductLabel(translatedTitles[product.product_id] ?? product.title, language)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <button
                                            onClick={(e) => { e.preventDefault(); toggleFav(product.product_id); }}
                                            disabled={isBusy}
                                            className="absolute right-3 top-3 rounded-full border border-red-200 bg-white/92 p-2.5 text-red-500 backdrop-blur-md transition-all hover:bg-white disabled:opacity-50"
                                        >
                                            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} className="fill-current text-red-500" />}
                                        </button>
                                    </div>
                                    <div className="px-1 pb-1 pt-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">{product.brand}</p>
                                        <h3 className="mt-1 line-clamp-1 text-[14px] font-extrabold text-[#111111] dark:text-white">{sanitizeProductLabel(translatedTitles[product.product_id] ?? product.title, language)}</h3>
                                        <div className="mt-2.5">
                                            <span className="text-[17px] font-black text-[#00c853]">{formatPrice(cur, 'UZS', language)}</span>
                                            {hasDis && (
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[12px] text-[#9ca3af] line-through">{formatPrice(bp, 'UZS', language)}</span>
                                                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">−{pct}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-3xl border border-black/10 bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-[#1a1a1a]">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#111111]/5 text-[#111111]/45 dark:bg-white/5 dark:text-white/45">
                            <Heart size={28} />
                        </div>
                        <h3 className="mt-4 text-[24px] font-black text-[#111111] dark:text-white">{w.favorites.emptyTitle}</h3>
                        <p className="mt-2 text-[14px] text-[#6b7280] dark:text-[#9ca3af]">{w.favorites.emptyDesc}</p>
                        <Link
                            href="/clothing"
                            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#111111] px-6 text-[12px] font-black uppercase tracking-[0.12em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 dark:bg-white dark:text-[#111111]"
                        >
                            {w.favorites.emptyAction}
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
