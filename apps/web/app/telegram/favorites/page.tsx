'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart, Search, Loader2, X } from 'lucide-react';
import { TELEGRAM_ROUTES } from '../../../src/shared/config/constants';
import { getApiToken } from '../../../src/lib/apiClient';

interface FavProduct {
    id: string;
    product_id: string;
    title: string;
    base_price: number;
    sale_price: number | null;
    image_url: string | null;
    brand: string;
    created_at: string;
}

export default function TgFavoritesPage() {
    const [products, setProducts] = useState<FavProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [toggling, setToggling] = useState<Set<string>>(new Set());

    const fetchFavorites = async () => {
        const token = getApiToken();
        if (!token) { setLoading(false); return; }
        try {
            const res = await fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                const data = json?.data ?? json ?? [];
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchFavorites(); }, []);

    const toggleFav = async (productId: string) => {
        const token = getApiToken();
        if (!token) return;
        setToggling(p => { const s = new Set(p); s.add(productId); return s; });
        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ product_id: productId }),
            });
            if (res.ok) setProducts(prev => prev.filter(p => p.product_id !== productId));
        } catch { /* ignore */ } finally {
            setToggling(p => { const s = new Set(p); s.delete(productId); return s; });
        }
    };

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return products;
        return products.filter(p => p.title.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q));
    }, [products, query]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
        </div>
    );

    if (!getApiToken()) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-4">
                <Heart size={28} className="text-[var(--color-hint)]" />
            </div>
            <h2 className="text-[18px] font-bold text-[var(--color-text)]">Sevimlilar</h2>
            <p className="mt-2 text-[13px] text-[var(--color-hint)]">Saqlangan mahsulotlarni ko&apos;rish uchun kirish kerak</p>
            <Link href={TELEGRAM_ROUTES.PROFILE} className="mt-5 h-11 px-7 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-full text-[13px] font-bold">
                Profilga o&apos;tish
            </Link>
        </div>
    );

    if (products.length === 0 && !loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-4">
                <Heart size={28} className="text-[var(--color-hint)]" />
            </div>
            <h2 className="text-[18px] font-bold text-[var(--color-text)]">Hali sevimlilar yo&apos;q</h2>
            <p className="mt-2 text-[13px] text-[var(--color-hint)]">Yoqqan mahsulotlarni saqlashni boshlang</p>
            {/* Link to /telegram (product list) */}
            <Link href={TELEGRAM_ROUTES.HOME} className="mt-5 h-11 px-7 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-full text-[13px] font-bold active:scale-95 transition-transform">
                Mahsulotlarni ko&apos;rish
            </Link>
        </div>
    );

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] px-4 py-3">
            <div className="relative mb-3">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-hint)]" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Sevimlilar ichida qidirish..."
                    className="h-11 w-full bg-[var(--color-surface)] rounded-full pl-10 pr-10 text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] border border-[var(--color-border)] outline-none" />
                {query && (
                    <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[var(--color-hint)]/10 rounded-full">
                        <X size={13} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 pb-4">
                {filtered.map(product => {
                    const bp = Number(product.base_price);
                    const sp = product.sale_price != null ? Number(product.sale_price) : null;
                    const cur = sp != null && sp < bp ? sp : bp;
                    const hasDis = cur < bp;
                    const pct = hasDis ? Math.round((1 - cur / bp) * 100) : 0;
                    const isBusy = toggling.has(product.product_id);
                    return (
                        <Link key={product.id} href={TELEGRAM_ROUTES.PRODUCT(product.product_id)}
                            className="bg-[var(--color-surface)] rounded-[20px] overflow-hidden border border-[var(--color-border)] active:scale-[0.98] transition-transform">
                            <div className="relative aspect-[3/4] bg-[var(--color-surface2)]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={product.image_url || 'https://placehold.co/400x533/f5f5f5/ccc?text=No+Image'} alt={product.title} className="w-full h-full object-cover" />
                                <button onClick={e => { e.preventDefault(); toggleFav(product.product_id); }} disabled={isBusy}
                                    className="absolute right-2 top-2 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white backdrop-blur-sm disabled:opacity-50">
                                    {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Heart size={13} className="fill-current" />}
                                </button>
                            </div>
                            <div className="p-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-hint)] truncate">{product.brand}</p>
                                <h3 className="text-[13px] font-bold text-[var(--color-text)] line-clamp-2 mt-0.5">{product.title}</h3>
                                <div className="mt-1">
                                    <p className="text-[14px] font-black text-[var(--color-primary)]">{cur.toLocaleString('ru-RU')} so&apos;m</p>
                                    {hasDis && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[11px] text-[var(--color-hint)] line-through">{bp.toLocaleString('ru-RU')} so&apos;m</span>
                                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">−{pct}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
