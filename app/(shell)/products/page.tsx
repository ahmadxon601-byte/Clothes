'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, SlidersHorizontal, Package, Loader2 } from 'lucide-react';
import { fetchProducts, fetchCategories, type ApiProduct, type ApiCategory } from '../../../src/lib/apiClient';
import { cn } from '../../../src/shared/lib/utils';
import { useSSERefetch } from '../../../src/shared/hooks/useSSERefetch';

type SortType = 'newest' | 'popular' | 'price_asc' | 'price_desc';
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SORT_OPTIONS: { value: SortType; label: string }[] = [
    { value: 'newest', label: 'Yangi' },
    { value: 'popular', label: 'Mashhur' },
    { value: 'price_asc', label: 'Narx ↑' },
    { value: 'price_desc', label: 'Narx ↓' },
];

export default function ProductsPage() {
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [search, setSearch] = useState('');
    const [activeCat, setActiveCat] = useState('');
    const [loading, setLoading] = useState(true);

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

    const clearFilters = () => {
        setSort('newest'); setMinPrice(''); setMaxPrice(''); setSizeFilter(''); setOnSale(false);
    };

    return (
        <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0f0f0f]">
            <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8">
                <h1 className="text-[24px] font-black text-[#111111] dark:text-white mb-5">Mahsulotlar</h1>

                {/* Search + filter button */}
                <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Mahsulot qidirish..."
                            className="h-11 w-full bg-white dark:bg-[#1a1a1a] rounded-full pl-10 pr-10 text-[13px] text-[#111111] dark:text-white placeholder:text-[#9ca3af] border border-black/8 dark:border-white/8 outline-none focus:ring-2 ring-[#00c853]/20"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-black/5 rounded-full">
                                <X size={13} className="text-[#9ca3af]" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setFilterOpen(o => !o)}
                        className={cn(
                            'relative shrink-0 w-11 h-11 flex items-center justify-center rounded-full border transition-all',
                            filterOpen || activeFilterCount > 0
                                ? 'bg-[#13ec37] border-[#13ec37] text-white'
                                : 'bg-white dark:bg-[#1a1a1a] border-black/8 dark:border-white/8 text-[#9ca3af] hover:border-[#00c853]/40'
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
                    <div className="mb-4 bg-white dark:bg-[#1a1a1a] rounded-[20px] border border-black/8 dark:border-white/8 p-5 space-y-5">
                        {/* Sort */}
                        <div>
                            <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Saralash</p>
                            <div className="flex flex-wrap gap-2">
                                {SORT_OPTIONS.map(opt => (
                                    <button key={opt.value} onClick={() => setSort(opt.value)}
                                        className={cn('px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-all',
                                            sort === opt.value
                                                ? 'bg-[#13ec37] text-white border-[#13ec37]'
                                                : 'bg-[#f8f9fb] dark:bg-[#0f0f0f] text-[#111111] dark:text-white border-black/8 dark:border-white/8 hover:border-[#00c853]/40'
                                        )}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price range */}
                        <div>
                            <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Narx oralig&apos;i</p>
                            <div className="flex gap-3">
                                <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min narx"
                                    type="number"
                                    className="flex-1 h-10 bg-[#f8f9fb] dark:bg-[#0f0f0f] border border-black/8 dark:border-white/8 rounded-xl px-3 text-[13px] text-[#111111] dark:text-white outline-none focus:ring-2 ring-[#00c853]/20" />
                                <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max narx"
                                    type="number"
                                    className="flex-1 h-10 bg-[#f8f9fb] dark:bg-[#0f0f0f] border border-black/8 dark:border-white/8 rounded-xl px-3 text-[13px] text-[#111111] dark:text-white outline-none focus:ring-2 ring-[#00c853]/20" />
                            </div>
                        </div>

                        {/* Size */}
                        <div>
                            <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">O&apos;lcham</p>
                            <div className="flex flex-wrap gap-2">
                                {SIZES.map(s => (
                                    <button key={s} onClick={() => setSizeFilter(sizeFilter === s ? '' : s)}
                                        className={cn('w-11 h-11 rounded-xl text-[13px] font-bold border transition-all',
                                            sizeFilter === s
                                                ? 'bg-[#13ec37] text-white border-[#13ec37]'
                                                : 'bg-[#f8f9fb] dark:bg-[#0f0f0f] text-[#111111] dark:text-white border-black/8 dark:border-white/8 hover:border-[#00c853]/40'
                                        )}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* On sale + clear */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <p className="text-[14px] font-semibold text-[#111111] dark:text-white">Faqat aksiyada</p>
                                <button onClick={() => setOnSale(o => !o)}
                                    className={cn('w-11 h-6 rounded-full border transition-all relative',
                                        onSale ? 'bg-[#13ec37] border-[#13ec37]' : 'bg-[#f3f4f6] dark:bg-[#2a2a2a] border-black/8 dark:border-white/8'
                                    )}>
                                    <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                                        onSale ? 'left-[calc(100%-22px)]' : 'left-0.5')} />
                                </button>
                            </div>
                            {activeFilterCount > 0 && (
                                <button onClick={clearFilters}
                                    className="px-4 py-1.5 rounded-full border border-red-400/30 text-red-500 text-[13px] font-semibold bg-red-500/5 hover:bg-red-500/10 transition-all">
                                    Tozalash
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Category chips */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
                    <button onClick={() => setActiveCat('')}
                        className={cn('shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all',
                            !activeCat ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] border-transparent' : 'bg-white dark:bg-[#1a1a1a] text-[#111111] dark:text-white border-black/8 dark:border-white/8 hover:border-[#00c853]/40'
                        )}>Barchasi</button>
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => setActiveCat(activeCat === cat.id ? '' : cat.id)}
                            className={cn('shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all',
                                activeCat === cat.id ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] border-transparent' : 'bg-white dark:bg-[#1a1a1a] text-[#111111] dark:text-white border-black/8 dark:border-white/8 hover:border-[#00c853]/40'
                            )}>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Products grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-[#00c853]" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#9ca3af]">
                        <Package size={40} className="opacity-40" />
                        <p className="text-[15px] font-medium">Hech narsa topilmadi</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {products.map(p => (
                            <Link
                                key={p.id}
                                href={`/product/${p.id}`}
                                className="group overflow-hidden rounded-[20px] border border-black/8 bg-white dark:border-white/8 dark:bg-[#1a1a1a] transition-all hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="aspect-[3/4] w-full overflow-hidden bg-[#f3f4f6] dark:bg-[#111111]">
                                    {p.thumbnail ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.thumbnail} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <Package size={28} className="text-[#d1d5db]" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] text-[#9ca3af] font-medium truncate">{p.store_name}</p>
                                    <h3 className="text-[13px] font-bold text-[#111111] dark:text-white line-clamp-2 mt-0.5">{p.name}</h3>
                                    {(() => {
                                        const bp = Number(p.base_price);
                                        const sp = p.sale_price != null ? Number(p.sale_price) : null;
                                        const cur = sp != null && sp < bp ? sp : bp;
                                        const hasDis = cur < bp;
                                        const pct = hasDis ? Math.round((1 - cur / bp) * 100) : 0;
                                        return (
                                            <div className="mt-1">
                                                <p className="text-[14px] font-black text-[#00c853]">{cur.toLocaleString('ru-RU')} so&apos;m</p>
                                                {hasDis && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <span className="text-[11px] text-[#9ca3af] line-through">{bp.toLocaleString('ru-RU')} so&apos;m</span>
                                                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">−{pct}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
