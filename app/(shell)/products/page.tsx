'use client';

import { Suspense, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, X, SlidersHorizontal, Package, Loader2 } from 'lucide-react';
import { fetchProducts, fetchCategories, type ApiProduct, type ApiCategory } from '../../../src/lib/apiClient';
import { cn } from '../../../src/shared/lib/utils';
import { useSSERefetch } from '../../../src/shared/hooks/useSSERefetch';
import { useTranslation } from '../../../src/shared/lib/i18n';
import { formatPrice } from '../../../src/shared/lib/formatPrice';
import { useTranslatedLabelMap } from '../../../src/shared/hooks/useTranslatedLabelMap';
import { sanitizeProductLabel } from '../../../src/shared/lib/webProductText';


function ProductsPageContent() {
    const { t, language } = useTranslation();
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [search, setSearch] = useState('');
    const [activeParentCat, setActiveParentCat] = useState('');
    const [activeSubCat, setActiveSubCat] = useState('');
    const [loading, setLoading] = useState(true);
    const parentCategories = useMemo(() => categories.filter(cat => !cat.parent_id), [categories]);
    const subcategories = useMemo(() => categories.filter(cat => cat.parent_id === activeParentCat), [categories, activeParentCat]);

    const [filterOpen, setFilterOpen] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minDiscount, setMinDiscount] = useState('');

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeFilterCount =
        (minPrice ? 1 : 0) +
        (maxPrice ? 1 : 0) +
        (minDiscount ? 1 : 0);
    const translatedNames = useTranslatedLabelMap(products.map((product) => ({ id: product.id, label: product.name })), language);
    const localizedCategory = (cat: ApiCategory) => language === 'ru' ? (cat.name_ru || cat.name) : language === 'en' ? (cat.name_en || cat.name) : (cat.name_uz || cat.name);

    const loadProducts = useCallback((params: {
        search: string; category: string;
        minPrice: string; maxPrice: string; minDiscount: string;
    }) => {
        setLoading(true);
        fetchProducts({
            limit: 100,
            search: params.search || undefined,
            category: params.category || undefined,
            min_price: params.minPrice ? Number(params.minPrice) : undefined,
            max_price: params.maxPrice ? Number(params.maxPrice) : undefined,
            min_discount: params.minDiscount ? Number(params.minDiscount) : undefined,
        }).then(r => setProducts(r.products))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const triggerFetch = useCallback((immediate = false) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const go = () => loadProducts({ search, category: activeSubCat || (subcategories.length === 0 ? activeParentCat : ''), minPrice, maxPrice, minDiscount });
        if (immediate) go();
        else debounceRef.current = setTimeout(go, 400);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, activeParentCat, activeSubCat, subcategories.length, minPrice, maxPrice, minDiscount, loadProducts]);

    useEffect(() => {
        fetchCategories().then(setCategories).catch(() => { });
    }, []);

    useEffect(() => {
        const categoryFromQuery = searchParams.get('category');
        if (!categoryFromQuery || categories.length === 0) return;

        const target = categories.find((cat) => cat.id === categoryFromQuery);
        if (!target) return;

        if (target.parent_id) {
            setActiveParentCat(target.parent_id);
            setActiveSubCat(target.id);
        } else {
            setActiveParentCat(target.id);
            setActiveSubCat('');
        }
    }, [categories, searchParams]);

    useEffect(() => {
        triggerFetch(false);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [triggerFetch]);

    useSSERefetch(['products', 'stores'], () => triggerFetch(true));

    const clearFilters = () => {
        setMinPrice(''); setMaxPrice(''); setMinDiscount('');
    };

    return (
        <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0f0f0f]">
            <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8">
                <h1 className="text-[24px] font-black text-[#111111] dark:text-white mb-5">{t.products_page_title}</h1>

                {/* Search + filter button */}
                <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t.placeholder_search}
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
                                ? 'bg-[#13ec37] border-[#13ec37] text-[#052e14] shadow-[0_12px_28px_-16px_rgba(19,236,55,0.95)]'
                                : 'bg-white dark:bg-[#1a1a1a] border-black/8 dark:border-white/8 text-[#9ca3af] hover:border-[#00c853]/45 hover:bg-[#f1fff4] hover:text-[#00a63e] dark:hover:bg-[#122117] dark:hover:text-[#84f89b]'
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
                    <div className="mb-6 overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_20px_44px_-34px_rgba(17,24,39,0.35)] dark:border-white/8 dark:bg-[#1a1a1a]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/6 px-4 py-4 dark:border-white/8 sm:px-5">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9ca3af]">Filterlar</p>
                                <p className="mt-1 text-[14px] font-semibold text-[#111111] dark:text-white">
                                    {activeFilterCount > 0 ? `${activeFilterCount} ta filter tanlangan` : 'Mahsulotlarni aniqroq toping'}
                                </p>
                            </div>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex h-10 items-center rounded-full border border-red-400/30 bg-red-500/5 px-4 text-[13px] font-semibold text-red-500 transition-all hover:bg-red-500/10"
                                >
                                    {t.clear_filters}
                                </button>
                            )}
                        </div>

                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap gap-2 border-b border-black/6 px-4 py-3 dark:border-white/8 sm:px-5">
                                {minPrice && (
                                    <button type="button" onClick={() => setMinPrice('')} className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-semibold text-[#374151] dark:bg-white/8 dark:text-white">
                                        {t.min}: {minPrice}<X size={12} />
                                    </button>
                                )}
                                {maxPrice && (
                                    <button type="button" onClick={() => setMaxPrice('')} className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-semibold text-[#374151] dark:bg-white/8 dark:text-white">
                                        {t.max}: {maxPrice}<X size={12} />
                                    </button>
                                )}
                                {minDiscount && (
                                    <button type="button" onClick={() => setMinDiscount('')} className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-semibold text-[#374151] dark:bg-white/8 dark:text-white">
                                        {minDiscount}%+<X size={12} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.1fr_1fr]">
                            <div className="rounded-[24px] border border-black/8 bg-[#fbfcfe] p-4 dark:border-white/8 dark:bg-[#101010]">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#9ca3af]">{t.price_range}</p>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <label className="rounded-[18px] border border-black/8 bg-white px-3 py-2.5 dark:border-white/8 dark:bg-[#1a1a1a]">
                                        <span className="text-[11px] font-semibold text-[#9ca3af]">{t.min}</span>
                                        <input
                                            value={minPrice}
                                            onChange={e => setMinPrice(e.target.value)}
                                            placeholder="0"
                                            type="number"
                                            className="mt-1 w-full bg-transparent text-[14px] font-semibold text-[#111111] outline-none placeholder:text-[#c0c6d4] dark:text-white"
                                        />
                                    </label>
                                    <label className="rounded-[18px] border border-black/8 bg-white px-3 py-2.5 dark:border-white/8 dark:bg-[#1a1a1a]">
                                        <span className="text-[11px] font-semibold text-[#9ca3af]">{t.max}</span>
                                        <input
                                            value={maxPrice}
                                            onChange={e => setMaxPrice(e.target.value)}
                                            placeholder="∞"
                                            type="number"
                                            className="mt-1 w-full bg-transparent text-[14px] font-semibold text-[#111111] outline-none placeholder:text-[#c0c6d4] dark:text-white"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="rounded-[24px] border border-black/8 bg-[#fbfcfe] p-4 dark:border-white/8 dark:bg-[#101010]">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#9ca3af]">{t.minimum_discount}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {[10, 20, 30, 50].map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setMinDiscount(minDiscount === String(value) ? '' : String(value))}
                                            className={cn(
                                                'rounded-full border px-3 py-2 text-[12px] font-bold transition-all',
                                                minDiscount === String(value)
                                                    ? 'border-[#13ec37] bg-[#13ec37] text-white'
                                                    : 'border-black/8 bg-white text-[#111111] hover:border-[#00c853]/40 hover:bg-[#f1fff4] hover:text-[#008d3a] dark:border-white/8 dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#122117] dark:hover:text-[#84f89b]'
                                            )}
                                        >
                                            {value}%+
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <input value={minDiscount} onChange={e => setMinDiscount(e.target.value)}
                                        type="number" min="1" max="99" placeholder="20"
                                        className="h-11 w-24 rounded-[16px] border border-black/8 bg-white px-3 text-[13px] font-semibold text-[#111111] outline-none focus:ring-2 ring-[#00c853]/20 dark:border-white/8 dark:bg-[#1a1a1a] dark:text-white" />
                                    <span className="text-[13px] text-[#9ca3af]">% va undan ko&apos;p</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Category chips */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
                    <button onClick={() => { setActiveParentCat(''); setActiveSubCat(''); }}
                        className={cn('shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all',
                            !activeParentCat && !activeSubCat ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] border-transparent' : 'bg-white dark:bg-[#1a1a1a] text-[#111111] dark:text-white border-black/8 dark:border-white/8 hover:border-[#00c853]/45 hover:bg-[#f1fff4] hover:text-[#008d3a] dark:hover:bg-[#122117] dark:hover:text-[#84f89b]'
                        )}>{t.all}</button>
                    {parentCategories.map(cat => (
                        <button key={cat.id} onClick={() => {
                            const nextParent = activeParentCat === cat.id ? '' : cat.id;
                            setActiveParentCat(nextParent);
                            setActiveSubCat('');
                        }}
                            className={cn('shrink-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all',
                                activeParentCat === cat.id ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] border-transparent' : 'bg-white dark:bg-[#1a1a1a] text-[#111111] dark:text-white border-black/8 dark:border-white/8 hover:border-[#00c853]/45 hover:bg-[#f1fff4] hover:text-[#008d3a] dark:hover:bg-[#122117] dark:hover:text-[#84f89b]'
                            )}>
                            {cat.sticker ? (
                                <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-[16px] leading-none',
                                    activeParentCat === cat.id ? 'bg-white/16 dark:bg-black/10' : 'bg-[#f3f4f6] dark:bg-white/10'
                                )}>
                                    {cat.sticker}
                                </span>
                            ) : null}
                            <span>{localizedCategory(cat)}</span>
                        </button>
                    ))}
                </div>
                {activeParentCat && subcategories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
                        {subcategories.map(cat => (
                            <button key={cat.id} onClick={() => setActiveSubCat(activeSubCat === cat.id ? '' : cat.id)}
                                className={cn('shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all',
                                    activeSubCat === cat.id ? 'bg-[#13ec37] text-[#052e14] border-[#13ec37] shadow-[0_12px_28px_-18px_rgba(19,236,55,0.95)]' : 'bg-white dark:bg-[#1a1a1a] text-[#111111] dark:text-white border-black/8 dark:border-white/8 hover:border-[#00c853]/45 hover:bg-[#f1fff4] hover:text-[#008d3a] dark:hover:bg-[#122117] dark:hover:text-[#84f89b]'
                                )}>
                                {localizedCategory(cat)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Products grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-[#00c853]" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#9ca3af]">
                        <Package size={40} className="opacity-40" />
                        <p className="text-[15px] font-medium">{t.no_results}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                        {products.map(p => (
                            <Link
                                key={p.id}
                                href={`/product/${p.id}`}
                                className="group overflow-hidden rounded-[20px] border border-black/8 bg-white dark:border-white/8 dark:bg-[#1a1a1a] transition-all hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="aspect-[3/4] w-full overflow-hidden bg-[#f3f4f6] dark:bg-[#111111]">
                                    {p.thumbnail ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.thumbnail} alt={sanitizeProductLabel(translatedNames[p.id] ?? p.name, language)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <Package size={28} className="text-[#d1d5db]" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] text-[#9ca3af] font-medium truncate">{p.store_name}</p>
                                    <h3 className="text-[13px] font-bold text-[#111111] dark:text-white line-clamp-2 mt-0.5">{sanitizeProductLabel(translatedNames[p.id] ?? p.name, language)}</h3>
                                    {(() => {
                                        const bp = Number(p.base_price);
                                        const sp = p.sale_price != null ? Number(p.sale_price) : null;
                                        const cur = sp != null && sp < bp ? sp : bp;
                                        const hasDis = cur < bp;
                                        const pct = hasDis ? Math.round((1 - cur / bp) * 100) : 0;
                                        return (
                                            <div className="mt-1">
                                                <p className="text-[14px] font-black text-[#00c853]">{formatPrice(cur, 'UZS', language)}</p>
                                                {hasDis && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <span className="text-[11px] text-[#9ca3af] line-through">{formatPrice(bp, 'UZS', language)}</span>
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

export default function ProductsPage() {
    return (
        <Suspense fallback={null}>
            <ProductsPageContent />
        </Suspense>
    );
}
