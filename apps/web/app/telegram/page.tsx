'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Heart, Loader2, SlidersHorizontal } from 'lucide-react';
import { fetchProducts, fetchCategories, toggleFavorite, getApiToken, type ApiProduct, type ApiCategory } from '../../src/lib/apiClient';
import { TELEGRAM_ROUTES } from '../../src/shared/config/constants';
import { formatPrice } from '../../src/shared/lib/formatPrice';
import { cn } from '../../src/shared/lib/utils';
import { useSSERefetch } from '../../src/shared/hooks/useSSERefetch';

type SortType = 'newest' | 'popular' | 'price_asc' | 'price_desc';
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SORT_OPTIONS: { value: SortType; label: string }[] = [
    { value: 'newest', label: 'Yangi' },
    { value: 'popular', label: 'Mashhur' },
    { value: 'price_asc', label: 'Narx ↑' },
    { value: 'price_desc', label: 'Narx ↓' },
];

export default function TgHomePage() {
    const router = useRouter();
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [search, setSearch] = useState('');
    const [activeCat, setActiveCat] = useState('');
    const [loading, setLoading] = useState(true);
    const [favs, setFavs] = useState<Set<string>>(new Set());

    // filter state
    const [filterOpen, setFilterOpen] = useState(false);
    const [sort, setSort] = useState<SortType>('newest');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sizeFilter, setSizeFilter] = useState('');
    const [onSale, setOnSale] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeFilterCount =
        (sort !== 'newest' ? 1 : 0) +
        (minPrice ? 1 : 0) +
        (maxPrice ? 1 : 0) +
        (sizeFilter ? 1 : 0) +
        (onSale ? 1 : 0);

    const loadProducts = useCallback((params: {
        search: string; category: string; sort: SortType;
        minPrice: string; maxPrice: string; sizeFilter: string; onSale: boolean;
    }) => {
        setLoading(true);
        fetchProducts({
            limit: 100,
            search: params.search || undefined,
            category: params.category || undefined,
            sort: params.sort,
            min_price: params.minPrice ? Number(params.minPrice) : undefined,
            max_price: params.maxPrice ? Number(params.maxPrice) : undefined,
            on_sale: params.onSale || undefined,
            size: params.sizeFilter || undefined,
        }).then(r => setProducts(r.products))
          .catch(() => {})
          .finally(() => setLoading(false));
    }, []);

    const triggerFetch = useCallback((immediate = false) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const go = () => loadProducts({ search, category: activeCat, sort, minPrice, maxPrice, sizeFilter, onSale });
        if (immediate) go();
        else debounceRef.current = setTimeout(go, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, activeCat, sort, minPrice, maxPrice, sizeFilter, onSale, loadProducts]);

    useEffect(() => {
        fetchCategories().then(setCategories).catch(() => {});
    }, []);

    useEffect(() => {
        triggerFetch(false);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [triggerFetch]);

    useSSERefetch(['products', 'stores'], () => triggerFetch(true));

    const handleFav = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        if (!getApiToken()) { router.push(TELEGRAM_ROUTES.PROFILE); return; }
        try {
            const r = await toggleFavorite(id);
            setFavs(prev => { const next = new Set(prev); r.favorited ? next.add(id) : next.delete(id); return next; });
        } catch { /* ignore */ }
    };

    const clearFilters = () => {
        setSort('newest'); setMinPrice(''); setMaxPrice(''); setSizeFilter(''); setOnSale(false);
    };

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] px-4 py-3">
            {/* Search + filter button row */}
            <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-hint)]" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Mahsulot qidirish..."
                        className="h-11 w-full bg-[var(--color-surface)] rounded-full pl-10 pr-10 text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] border border-[var(--color-border)] outline-none focus:ring-2 ring-[var(--color-primary)]/20" />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[var(--color-hint)]/10 rounded-full">
                            <X size={13} className="text-[var(--color-hint)]" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setFilterOpen(o => !o)}
                    className={cn(
                        'relative shrink-0 w-11 h-11 flex items-center justify-center rounded-full border transition-all',
                        filterOpen || activeFilterCount > 0
                            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                            : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-hint)]'
                    )}
                >
                    <SlidersHorizontal size={18} />
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Filter dropdown */}
            {filterOpen && (
                <div className="mb-3 bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-border)] p-4 space-y-4">
                    {/* Sort */}
                    <div>
                        <p className="text-[11px] font-bold text-[var(--color-hint)] uppercase tracking-widest mb-2">Saralash</p>
                        <div className="flex flex-wrap gap-2">
                            {SORT_OPTIONS.map(opt => (
                                <button key={opt.value} onClick={() => setSort(opt.value)}
                                    className={cn('px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all',
                                        sort === opt.value
                                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                            : 'bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-border)]'
                                    )}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price range */}
                    <div>
                        <p className="text-[11px] font-bold text-[var(--color-hint)] uppercase tracking-widest mb-2">Narx oralig&apos;i</p>
                        <div className="flex gap-2">
                            <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min"
                                type="number"
                                className="flex-1 h-9 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 text-[13px] text-[var(--color-text)] outline-none focus:ring-2 ring-[var(--color-primary)]/20" />
                            <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max"
                                type="number"
                                className="flex-1 h-9 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 text-[13px] text-[var(--color-text)] outline-none focus:ring-2 ring-[var(--color-primary)]/20" />
                        </div>
                    </div>

                    {/* Size */}
                    <div>
                        <p className="text-[11px] font-bold text-[var(--color-hint)] uppercase tracking-widest mb-2">O&apos;lcham</p>
                        <div className="flex flex-wrap gap-2">
                            {SIZES.map(s => (
                                <button key={s} onClick={() => setSizeFilter(sizeFilter === s ? '' : s)}
                                    className={cn('w-10 h-10 rounded-xl text-[12px] font-bold border transition-all',
                                        sizeFilter === s
                                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                            : 'bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-border)]'
                                    )}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* On sale */}
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-[var(--color-text)]">Faqat aksiyada</p>
                        <button onClick={() => setOnSale(o => !o)}
                            className={cn('w-11 h-6 rounded-full border transition-all relative',
                                onSale ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-[var(--color-bg)] border-[var(--color-border)]'
                            )}>
                            <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                                onSale ? 'left-[calc(100%-22px)]' : 'left-0.5')} />
                        </button>
                    </div>

                    {/* Clear */}
                    {activeFilterCount > 0 && (
                        <button onClick={clearFilters}
                            className="w-full h-9 rounded-xl border border-red-400/30 text-red-500 text-[13px] font-semibold bg-red-500/5">
                            Filtrlarni tozalash
                        </button>
                    )}
                </div>
            )}

            {/* Category chips */}
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
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-[var(--color-hint)]"><Search size={28} className="opacity-40 mb-2" /><p className="text-sm">Hech narsa topilmadi</p></div>
            ) : (
                <div className="grid grid-cols-2 gap-3 pb-4">
                    {products.map(p => (
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
