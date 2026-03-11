'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Heart, Loader2 } from 'lucide-react';
import { fetchProducts, fetchCategories, toggleFavorite, getApiToken, type ApiProduct, type ApiCategory } from '../../src/lib/apiClient';
import { TELEGRAM_ROUTES } from '../../src/shared/config/constants';
import { formatPrice } from '../../src/shared/lib/formatPrice';
import { cn } from '../../src/shared/lib/utils';
import { useSSERefetch } from '../../src/shared/hooks/useSSERefetch';

export default function TgHomePage() {
    const router = useRouter();
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [search, setSearch] = useState('');
    const [activeCat, setActiveCat] = useState('');
    const [loading, setLoading] = useState(true);
    const [favs, setFavs] = useState<Set<string>>(new Set());

    const loadData = useCallback(() => {
        Promise.all([
            fetchProducts({ limit: 100 }),
            fetchCategories(),
        ]).then(([p, c]) => {
            setProducts(p.products);
            setCategories(c);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useSSERefetch(['products', 'stores'], loadData);

    const filtered = useMemo(() => {
        let list = products;
        if (activeCat) list = list.filter(p => p.category_id === activeCat);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || (p.store_name || '').toLowerCase().includes(q));
        }
        return list;
    }, [products, activeCat, search]);

    const handleFav = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        if (!getApiToken()) {
            router.push(TELEGRAM_ROUTES.PROFILE);
            return;
        }
        try {
            const r = await toggleFavorite(id);
            setFavs(prev => { const next = new Set(prev); r.favorited ? next.add(id) : next.delete(id); return next; });
        } catch { /* ignore */ }
    };

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] px-4 py-3">
            <div className="relative mb-3">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-hint)]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Mahsulot qidirish..."
                    className="h-11 w-full bg-[var(--color-surface)] rounded-full pl-10 pr-10 text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] border border-[var(--color-border)] outline-none focus:ring-2 ring-[var(--color-primary)]/20" />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[var(--color-hint)]/10 rounded-full">
                        <X size={13} className="text-[var(--color-hint)]" />
                    </button>
                )}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-3">
                <button onClick={() => setActiveCat('')} className={cn('shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all', !activeCat ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-transparent' : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]')}>Barchasi</button>
                {categories.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCat(activeCat === cat.id ? '' : cat.id)}
                        className={cn('shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all', activeCat === cat.id ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-transparent' : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]')}>
                        {cat.name}
                    </button>
                ))}
            </div>
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[var(--color-primary)]" /></div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-[var(--color-hint)]"><Search size={28} className="opacity-40 mb-2" /><p className="text-sm">Hech narsa topilmadi</p></div>
            ) : (
                <div className="grid grid-cols-2 gap-3 pb-4">
                    {filtered.map(p => (
                        <Link key={p.id} href={TELEGRAM_ROUTES.PRODUCT(p.id)} className="bg-[var(--color-surface)] rounded-[20px] overflow-hidden border border-[var(--color-border)] active:scale-[0.98] transition-transform">
                            <div className="relative aspect-[3/4] bg-[var(--color-surface2)]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.thumbnail || 'https://placehold.co/400x533/f5f5f5/ccc?text=No+Image'} alt={p.name} className="w-full h-full object-cover" />
                                <button onClick={e => handleFav(e, p.id)} className={cn('absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-surface)]/80 backdrop-blur-sm', favs.has(p.id) ? 'text-red-500' : 'text-[var(--color-hint)]')}>
                                    <Heart size={14} className={cn(favs.has(p.id) && 'fill-current')} />
                                </button>
                            </div>
                            <div className="p-3">
                                <p className="text-[10px] text-[var(--color-hint)] font-medium truncate">{p.store_name}</p>
                                <h3 className="text-[13px] font-bold text-[var(--color-text)] line-clamp-2 mt-0.5">{p.name}</h3>
                                <p className="text-[14px] font-black text-[var(--color-primary)] mt-1">{formatPrice(p.base_price, 'UZS')}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
