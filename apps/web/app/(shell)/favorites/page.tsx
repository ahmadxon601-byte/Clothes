'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Heart, Search, Star, Loader2 } from 'lucide-react';
import { cn } from '../../../src/shared/lib/utils';
import { formatPrice } from '../../../src/shared/lib/formatPrice';
import { Skeleton } from '../../../src/shared/ui/Skeleton';
import { SITE_ROUTES } from '../../../src/shared/config/constants';
import { useWebI18n } from '../../../src/shared/lib/webI18n';
import { useWebAuth } from '../../../src/context/WebAuthContext';
import { AuthModal } from '../../../src/shared/ui/AuthModal';

const CATEGORIES = ['All', 'Shirts', 'Shoes', 'Pants', 'Jackets', 'Accessories'] as const;

type FavProduct = {
    id: string;
    product_id: string;
    title: string;
    base_price: number;
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
    const { tc } = useWebI18n();
    const [products, setProducts] = useState<FavProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
    const [query, setQuery] = useState('');
    const [toggling, setToggling] = useState<Set<string>>(new Set());
    const [authModal, setAuthModal] = useState(false);

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

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return products;
        return products.filter((p) => p.title.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q));
    }, [products, query]);

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
                <section className="mx-auto w-full max-w-[1280px] px-4 py-16 md:px-8 md:py-24 text-center">
                    <div className="mx-auto max-w-md">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f3f4f6]">
                            <Heart size={36} className="text-[#9ca3af]" />
                        </div>
                        <h1 className="mt-5 font-[family-name:var(--font-playfair)] text-[32px] font-black text-[#111111]">Sevimlilar</h1>
                        <p className="mt-3 text-[15px] text-[#6b7280]">Sevimli mahsulotlarni saqlash uchun avval kirish yoki ro'yxatdan o'ting.</p>
                        <button
                            onClick={() => setAuthModal(true)}
                            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#00c853] px-7 text-[13px] font-bold text-[#06200f] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-14px_rgba(0,200,83,0.9)]"
                        >
                            Kirish / Ro'yxat
                        </button>
                    </div>
                </section>
            </>
        );
    }

    return (
        <section className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-8 md:py-12">
            <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-[linear-gradient(145deg,#fbfffc_0%,#f2f8ff_52%,#f7faff_100%)] p-6 md:p-8">
                <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#00c853]/15 blur-3xl" />
                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#5aa6ff]/20 blur-3xl" />
                <div className="relative">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645]">Wishlist</p>
                    <h1 className="mt-1.5 font-[family-name:var(--font-playfair)] text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-none text-[#111111]">
                        Sevimli Mahsulotlar
                    </h1>
                    <p className="mt-2 max-w-xl text-[14px] text-[#5b6472]">
                        Yoqqan mahsulotlarni saqlang va istagan vaqt qaytib keling.
                    </p>
                    <div className="mt-6 flex h-12 items-center gap-3 rounded-full border border-black/10 bg-white px-4 shadow-[0_16px_34px_-26px_rgba(0,0,0,0.45)]">
                        <Search size={16} className="text-[#97a0b0]" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Sevimlilar ichida qidirish..."
                            className="h-full w-full bg-transparent text-[14px] text-[#111111] outline-none placeholder:text-[#9ca3af]"
                        />
                    </div>
                </div>
            </div>

            <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={cn(
                            'shrink-0 rounded-full border px-5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-all',
                            category === cat
                                ? 'border-transparent bg-[#111111] text-white shadow'
                                : 'border-black/10 bg-white text-[#6b7280] hover:border-black/20 hover:text-[#111111]',
                        )}
                    >
                        {tc(cat)}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-3xl border border-black/8 bg-white p-3">
                                <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                                <Skeleton className="mt-3 h-4 w-2/3" />
                                <Skeleton className="mt-2 h-4 w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-4">
                        {filtered.map((product) => {
                            const img = product.image_url || 'https://placehold.co/640x800/f8f8f8/ccc?text=Product';
                            const seed = product.product_id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                            const off = 10 + (seed % 25);
                            const oldPrice = Math.round((product.base_price * 1.2) / 1000) * 1000;
                            const rating = 3 + (seed % 3);
                            const isBusy = toggling.has(product.product_id);

                            return (
                                <Link
                                    key={product.id}
                                    href={SITE_ROUTES.PRODUCT(product.product_id)}
                                    className="group rounded-3xl border border-black/8 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_50px_-24px_rgba(0,0,0,0.24)]"
                                >
                                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#f5f6f8]">
                                        <img src={img} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <span className="absolute left-3 top-3 rounded-full bg-[#111111] px-2.5 py-1 text-[10px] font-black text-white">-{off}%</span>
                                        <button
                                            onClick={(e) => { e.preventDefault(); toggleFav(product.product_id); }}
                                            disabled={isBusy}
                                            className="absolute right-3 top-3 rounded-full border border-white/35 bg-[#00c853] p-2.5 text-[#06200f] backdrop-blur-md transition-all hover:opacity-80 disabled:opacity-50"
                                        >
                                            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} className="fill-current" />}
                                        </button>
                                    </div>
                                    <div className="px-1 pb-1 pt-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">{product.brand}</p>
                                        <h3 className="mt-1 line-clamp-1 text-[14px] font-extrabold text-[#111111]">{product.title}</h3>
                                        <div className="mt-1.5 flex items-center gap-0.5">
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <Star key={`${product.id}-star-${i}`} size={11} className={i < rating ? 'fill-[#00c853] text-[#00c853]' : 'text-[#e5e7eb]'} />
                                            ))}
                                        </div>
                                        <div className="mt-2.5 flex items-end gap-2">
                                            <span className="text-[17px] font-black text-[#111111]">{formatPrice(product.base_price, 'UZS')}</span>
                                            <span className="text-[12px] text-[#c4c9d4] line-through">{formatPrice(oldPrice, 'UZS')}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-3xl border border-black/10 bg-white px-6 py-14 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#111111]/5 text-[#111111]/45">
                            <Heart size={28} />
                        </div>
                        <h3 className="mt-4 text-[24px] font-black text-[#111111]">Hali sevimlilar yo'q</h3>
                        <p className="mt-2 text-[14px] text-[#6b7280]">Yoqqan mahsulotlarni saqlashni boshlang.</p>
                        <Link
                            href="/clothing"
                            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#111111] px-6 text-[12px] font-black uppercase tracking-[0.12em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
                        >
                            Kiyimlarni Ko'rish
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
