'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { BadgePercent, Heart, Loader2, Package, Search, SlidersHorizontal, TrendingUp, X } from 'lucide-react';
import { fetchProducts, type ApiProduct } from '../../../src/lib/apiClient';
import { cn } from '../../../src/shared/lib/utils';
import { useSSERefetch } from '../../../src/shared/hooks/useSSERefetch';
import { useTranslation } from '../../../src/shared/lib/i18n';
import { formatPrice } from '../../../src/shared/lib/formatPrice';
import {
    parseProductQuickFilters,
    PRODUCT_QUICK_FILTERS_SETTING_KEY,
    type ProductQuickFilter,
} from '../../../src/shared/lib/productQuickFilters';
import { useTranslatedLabelMap } from '../../../src/shared/hooks/useTranslatedLabelMap';
import { sanitizeProductLabel } from '../../../src/shared/lib/webProductText';
import { useWebAuth } from '../../../src/context/WebAuthContext';
import { AuthModal } from '../../../src/shared/ui/AuthModal';

interface ProductsPageClientProps {
    initialProducts: ApiProduct[];
}

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('marketplace_token') : null;
}

function ProductsPageContent({ initialProducts }: ProductsPageClientProps) {
    const { t, language } = useTranslation();
    const { user, loading: authLoading } = useWebAuth();
    const [products, setProducts] = useState<ApiProduct[]>(initialProducts);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(initialProducts.length === 0);
    const [quickFilters, setQuickFilters] = useState<ProductQuickFilter[]>([]);
    const [activeQuickFilterId, setActiveQuickFilterId] = useState<string | null>(null);

    const [filterOpen, setFilterOpen] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minDiscount, setMinDiscount] = useState('');
    const [favIds, setFavIds] = useState<Set<string>>(() => {
        try {
            const cached = typeof window !== 'undefined' ? localStorage.getItem('fav_ids_cache') : null;
            return cached ? new Set<string>(JSON.parse(cached)) : new Set<string>();
        } catch {
            return new Set<string>();
        }
    });
    const [toggling, setToggling] = useState<Set<string>>(new Set());
    const [authModal, setAuthModal] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeQuickFilter = useMemo(
        () => quickFilters.find((item) => item.id === activeQuickFilterId) ?? null,
        [activeQuickFilterId, quickFilters]
    );
    const quickDiscount = activeQuickFilter?.mode === 'discount' && activeQuickFilter.value ? String(activeQuickFilter.value) : '';
    const quickSort = activeQuickFilter?.mode === 'popular' ? 'popular' : activeQuickFilter?.mode === 'newest' ? 'newest' : '';

    const activeFilterCount =
        (activeQuickFilter ? 1 : 0) +
        (minPrice ? 1 : 0) +
        (maxPrice ? 1 : 0) +
        (minDiscount ? 1 : 0);
    const translatedNames = useTranslatedLabelMap(products.map((product) => ({ id: product.id, label: product.name })), language);
    const discountSummary = minDiscount
        ? language === 'ru'
            ? `Vse tovary so skidkoy ${minDiscount}%`
            : language === 'en'
                ? `All products with ${minDiscount}% discount`
                : `Barcha ${minDiscount}% lik tovarlar`
        : '';
    const discountHint = language === 'ru'
        ? 'Ctoby uvidet vse skidki, izmenite ili uberite znachenie v filtre.'
        : language === 'en'
            ? 'To see all discounts, change or remove the value in the filter.'
            : "Barcha chegirmalarni ko'rish uchun filterdan qiymatni o'zgartiring yoki olib tashlang.";
    const filterPanelLabel = language === 'ru' ? 'Filtry' : language === 'en' ? 'Filters' : 'Filterlar';
    const filterPanelHint = language === 'ru'
        ? 'Bystro nahodite podhodyashchie tovary po cene i skidke.'
        : language === 'en'
            ? 'Quickly find matching products by price and discount.'
            : "Narx va chegirma bo'yicha mos mahsulotlarni tezroq toping.";

    const loadProducts = useCallback((params: {
        search: string;
        sort: string;
        exactDiscount: string;
        minPrice: string;
        maxPrice: string;
        minDiscount: string;
    }) => {
        setLoading(true);
        fetchProducts({
            limit: 100,
            search: params.search || undefined,
            sort: (params.sort || undefined) as 'newest' | 'popular' | undefined,
            min_price: params.minPrice ? Number(params.minPrice) : undefined,
            max_price: params.maxPrice ? Number(params.maxPrice) : undefined,
            exact_discount: params.exactDiscount ? Number(params.exactDiscount) : undefined,
            min_discount: params.minDiscount ? Number(params.minDiscount) : undefined,
        }).then((result) => setProducts(result.products))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const triggerFetch = useCallback((immediate = false) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const run = () => loadProducts({ search, sort: quickSort, exactDiscount: quickDiscount, minPrice, maxPrice, minDiscount });
        if (immediate) run();
        else debounceRef.current = setTimeout(run, 400);
    }, [search, quickSort, quickDiscount, minPrice, maxPrice, minDiscount, loadProducts]);

    useEffect(() => {
        let ignore = false;
        const fallback: ProductQuickFilter[] = [];

        fetch(`/api/ui-settings?key=${PRODUCT_QUICK_FILTERS_SETTING_KEY}`)
            .then((r) => r.json().catch(() => ({})))
            .then((json) => {
                if (ignore) return;
                const value = json?.data?.value ?? json?.value ?? null;
                setQuickFilters(parseProductQuickFilters(value, fallback));
            })
            .catch(() => {
                if (!ignore) setQuickFilters(fallback);
            });

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        if (activeQuickFilterId && !quickFilters.some((item) => item.id === activeQuickFilterId)) {
            setActiveQuickFilterId(null);
        }
    }, [activeQuickFilterId, quickFilters]);

    useEffect(() => {
        if (authLoading) return;
        const token = getToken();
        if (!token) {
            setFavIds(new Set());
            return;
        }

        fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json().catch(() => ({})))
            .then((json) => {
                const rows: Array<{ product_id?: string }> = json?.data ?? json ?? [];
                const ids = rows.map((row) => row.product_id).filter(Boolean) as string[];
                setFavIds(new Set(ids));
                try {
                    localStorage.setItem('fav_ids_cache', JSON.stringify(ids));
                } catch { }
            })
            .catch(() => { });
    }, [authLoading, user]);

    useEffect(() => {
        const hasActiveFilters = Boolean(search || quickSort || quickDiscount || minPrice || maxPrice || minDiscount);
        if (!hasActiveFilters && initialProducts.length > 0) {
            setLoading(false);
            return () => {
                if (debounceRef.current) clearTimeout(debounceRef.current);
            };
        }

        triggerFetch(false);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [initialProducts.length, maxPrice, minDiscount, minPrice, quickDiscount, quickSort, search, triggerFetch]);

    useSSERefetch(['products', 'stores'], () => triggerFetch(true));

    const toggleFav = useCallback(async (e: React.MouseEvent, productId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            setAuthModal(true);
            return;
        }

        const token = getToken();
        if (!token) return;

        setToggling((prev) => {
            const next = new Set(prev);
            next.add(productId);
            return next;
        });

        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ product_id: productId }),
            });

            if (!res.ok) return;

            const json = await res.json().catch(() => ({}));
            const favorited = json?.data?.favorited ?? json?.favorited;
            if (typeof favorited === 'boolean') {
                setFavIds((prev) => {
                    const next = new Set(prev);
                    favorited ? next.add(productId) : next.delete(productId);
                    try {
                        localStorage.setItem('fav_ids_cache', JSON.stringify([...next]));
                    } catch { }
                    return next;
                });
            }
        } catch {
            // ignore
        } finally {
            setToggling((prev) => {
                const next = new Set(prev);
                next.delete(productId);
                return next;
            });
        }
    }, [user]);

    const setDiscountFilterValue = (value: string) => {
        if (activeQuickFilter?.mode === 'discount') {
            setActiveQuickFilterId(null);
        }
        setMinDiscount(value);
    };

    const clearFilters = () => {
        setActiveQuickFilterId(null);
        setMinPrice('');
        setMaxPrice('');
        setMinDiscount('');
    };

    const closeFilterOnFilledBlur = (value: string) => {
        if (value.trim()) {
            setFilterOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0f0f0f]">
            <AuthModal open={authModal} onClose={() => setAuthModal(false)} defaultTab="login" />
            <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8">
                <h1 className="mb-5 text-[24px] font-black text-[#111111] dark:text-white">{t.products_page_title}</h1>

                <div className="mb-3 flex gap-2">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t.placeholder_search}
                            className="h-11 w-full rounded-full border border-black/8 bg-white pl-10 pr-10 text-[13px] text-[#111111] outline-none placeholder:text-[#9ca3af] focus:ring-2 ring-[#00c853]/20 dark:border-white/8 dark:bg-[#1a1a1a] dark:text-white"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/5">
                                <X size={13} className="text-[#9ca3af]" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setFilterOpen((open) => !open)}
                        className={cn(
                            'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all',
                            filterOpen || activeFilterCount > 0
                                ? 'border-[#13ec37] bg-[#13ec37] text-[#052e14] shadow-[0_12px_28px_-16px_rgba(19,236,55,0.95)]'
                                : 'border-black/8 bg-white text-[#9ca3af] hover:border-[#00c853]/45 hover:bg-[#f1fff4] hover:text-[#00a63e] dark:border-white/8 dark:bg-[#1a1a1a] dark:hover:bg-[#122117] dark:hover:text-[#84f89b]'
                        )}
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                </div>

                <div className="mb-5 overflow-x-auto pb-1">
                    <div className="flex min-w-max items-center gap-3">
                        {quickFilters.map((item) => {
                            const Icon = item.mode === 'popular' ? TrendingUp : item.mode === 'discount' ? BadgePercent : null;
                            const isActive = activeQuickFilterId === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveQuickFilterId((prev) => prev === item.id ? null : item.id);
                                        if (item.mode === 'discount') {
                                            setMinDiscount('');
                                        }
                                    }}
                                    className={cn(
                                        'inline-flex h-12 items-center gap-3 rounded-full border px-5 text-[14px] font-black transition-all',
                                        isActive
                                            ? 'border-[#d9dde3] bg-white text-[#0f172a] shadow-[0_14px_30px_-20px_rgba(15,23,42,0.28)] dark:border-[#12d220]/40 dark:bg-[#1a1a1a] dark:text-white dark:shadow-[0_12px_28px_-18px_rgba(18,210,32,0.35)]'
                                            : 'border-transparent bg-[#efefef] text-[#0f172a] hover:bg-white dark:border-white/10 dark:bg-[#181818] dark:text-white dark:hover:bg-[#202020]'
                                    )}
                                >
                                    {Icon ? (
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#12d220] text-white">
                                            <Icon size={14} strokeWidth={2.4} />
                                        </span>
                                    ) : null}
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {minDiscount && (
                    <div className="mb-5 flex items-start gap-3">
                        <span className="mt-1 h-10 w-1.5 shrink-0 rounded-full bg-[#13ec37]" />
                        <div className="min-w-0">
                            <p className="text-[15px] font-black tracking-tight text-[#111111] dark:text-white">{discountSummary}</p>
                            <p className="mt-1 text-[12px] leading-5 text-[#8b95a7]">{discountHint}</p>
                        </div>
                    </div>
                )}

                {filterOpen && (
                    <div className="mb-6 overflow-hidden rounded-[24px] border border-white/7 bg-[#141416] shadow-[0_20px_45px_-34px_rgba(0,0,0,0.6)] dark:border-white/7 dark:bg-[#141416]">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-5 sm:py-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2.5">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#13ec37] text-[#052e14]">
                                        <SlidersHorizontal size={15} />
                                    </span>
                                    <p className="text-[14px] font-black tracking-tight text-white">{filterPanelLabel}</p>
                                </div>
                                <p className="mt-2 hidden text-[12px] text-[#8b95a7] sm:block">{filterPanelHint}</p>
                            </div>
                            {activeFilterCount > 0 ? (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex h-9 items-center rounded-full border border-white/8 bg-white/5 px-3.5 text-[12px] font-semibold text-white transition-all hover:border-red-400/30 hover:text-red-400"
                                >
                                    {t.clear_filters}
                                </button>
                            ) : null}
                        </div>

                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap gap-2 border-t border-white/6 px-3 pb-3 pt-0 sm:px-5 sm:pb-4">
                                {activeQuickFilter && (
                                    <button type="button" onClick={() => setActiveQuickFilterId(null)} className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/6 px-3 py-1.5 text-[12px] font-semibold text-white transition-all hover:border-[#13ec37]/35 hover:text-[#84f89b]">
                                        {activeQuickFilter.label}<X size={12} />
                                    </button>
                                )}
                                {minPrice && (
                                    <button type="button" onClick={() => setMinPrice('')} className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/6 px-3 py-1.5 text-[12px] font-semibold text-white transition-all hover:border-[#13ec37]/35 hover:text-[#84f89b]">
                                        {t.min}: {minPrice}<X size={12} />
                                    </button>
                                )}
                                {maxPrice && (
                                    <button type="button" onClick={() => setMaxPrice('')} className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/6 px-3 py-1.5 text-[12px] font-semibold text-white transition-all hover:border-[#13ec37]/35 hover:text-[#84f89b]">
                                        {t.max}: {maxPrice}<X size={12} />
                                    </button>
                                )}
                                {minDiscount && (
                                    <button type="button" onClick={() => setDiscountFilterValue('')} className="inline-flex items-center gap-2 rounded-full border border-[#13ec37]/25 bg-[#122117] px-3 py-1.5 text-[12px] font-semibold text-[#84f89b] transition-all hover:border-[#13ec37]/45">
                                        {minDiscount}%+<X size={12} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="grid gap-3 border-t border-white/6 p-3 sm:p-5 lg:grid-cols-[1.05fr_0.95fr]">
                            <div className="rounded-[18px] border border-white/6 bg-[#101113] p-3 sm:rounded-[20px] sm:p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8ea3c7]">{t.price_range}</p>
                                    <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8b95a7]">UZS</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                                    <label className="rounded-[14px] border border-white/7 bg-white/4 px-3.5 py-3 transition-all focus-within:border-[#13ec37]/35 focus-within:bg-white/7 sm:rounded-[16px] sm:px-4">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8ea3c7]">{t.min}</span>
                                        <input
                                            value={minPrice}
                                            onChange={(e) => setMinPrice(e.target.value)}
                                            onBlur={() => closeFilterOnFilledBlur(minPrice)}
                                            placeholder="0"
                                            type="number"
                                            className="mt-2 w-full bg-transparent text-[18px] font-black tracking-tight text-white outline-none placeholder:text-[#5f6775] sm:text-[20px]"
                                        />
                                    </label>
                                    <label className="rounded-[14px] border border-white/7 bg-white/4 px-3.5 py-3 transition-all focus-within:border-[#13ec37]/35 focus-within:bg-white/7 sm:rounded-[16px] sm:px-4">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8ea3c7]">{t.max}</span>
                                        <input
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(e.target.value)}
                                            onBlur={() => closeFilterOnFilledBlur(maxPrice)}
                                            placeholder="1000000"
                                            type="number"
                                            className="mt-2 w-full bg-transparent text-[18px] font-black tracking-tight text-white outline-none placeholder:text-[#5f6775] sm:text-[20px]"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="rounded-[18px] border border-white/6 bg-[#101113] p-3 sm:rounded-[20px] sm:p-4">
                                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#8ea3c7]">{t.minimum_discount}</p>
                                <div className="flex flex-wrap gap-2">
                                    {[10, 20, 30, 50].map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => {
                                                setDiscountFilterValue(minDiscount === String(value) ? '' : String(value));
                                                setFilterOpen(false);
                                            }}
                                            className={cn(
                                                'rounded-full border px-3.5 py-2 text-[12px] font-black tracking-tight transition-all sm:px-4 sm:text-[13px]',
                                                minDiscount === String(value)
                                                    ? 'border-[#13ec37] bg-[#13ec37] text-[#052e14]'
                                                    : 'border-white/8 bg-white/4 text-white hover:border-[#13ec37]/30 hover:bg-white/7 hover:text-[#84f89b]'
                                            )}
                                        >
                                            {value}%+
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center gap-2.5 sm:gap-3">
                                    <input
                                        value={minDiscount}
                                        onChange={(e) => setDiscountFilterValue(e.target.value)}
                                        onBlur={() => closeFilterOnFilledBlur(minDiscount)}
                                        type="number"
                                        min="1"
                                        max="99"
                                        placeholder="20"
                                        className="h-11 w-20 rounded-[14px] border border-white/8 bg-white/4 px-3.5 text-[16px] font-black tracking-tight text-white outline-none transition-all placeholder:text-[#5f6775] focus:border-[#13ec37]/35 focus:bg-white/7 sm:h-12 sm:w-24 sm:rounded-[16px] sm:px-4 sm:text-[18px]"
                                    />
                                    <span className="text-[12px] leading-5 text-[#8b95a7] sm:text-[13px]">{t.and_more}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-[#00c853]" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-[#9ca3af]">
                        <Package size={40} className="opacity-40" />
                        <p className="text-[15px] font-medium">{t.no_results}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.id}`}
                                className="group overflow-hidden rounded-[20px] border border-black/8 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-white/8 dark:bg-[#1a1a1a]"
                            >
                                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f3f4f6] dark:bg-[#111111]">
                                    <button
                                        type="button"
                                        aria-label={t.favorites}
                                        onClick={(event) => toggleFav(event, product.id)}
                                        disabled={toggling.has(product.id)}
                                        className={cn(
                                            'absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/8 bg-white/92 text-[#111111] shadow-sm backdrop-blur transition-all',
                                            'dark:border-white/10 dark:bg-[#111111]/88 dark:text-white',
                                            toggling.has(product.id) && 'cursor-wait opacity-70',
                                        )}
                                    >
                                        <Heart size={16} className={cn(favIds.has(product.id) && 'fill-red-500 text-red-500')} />
                                    </button>
                                    {product.thumbnail ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={product.thumbnail} alt={sanitizeProductLabel(translatedNames[product.id] ?? product.name, language)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <Package size={28} className="text-[#d1d5db]" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="truncate text-[10px] font-medium text-[#9ca3af]">{product.store_name}</p>
                                    <h3 className="mt-0.5 line-clamp-2 text-[13px] font-bold text-[#111111] dark:text-white">{sanitizeProductLabel(translatedNames[product.id] ?? product.name, language)}</h3>
                                    {(() => {
                                        const bp = Number(product.base_price);
                                        const sp = product.sale_price != null ? Number(product.sale_price) : null;
                                        const cur = sp != null && sp < bp ? sp : bp;
                                        const hasDis = cur < bp;
                                        const pct = hasDis ? Math.round((1 - cur / bp) * 100) : 0;

                                        return (
                                            <div className="mt-1">
                                                <p className="text-[14px] font-black text-[#00c853]">{formatPrice(cur, 'UZS', language)}</p>
                                                {hasDis && (
                                                    <div className="mt-0.5 flex items-center gap-1">
                                                        <span className="text-[11px] text-[#9ca3af] line-through">{formatPrice(bp, 'UZS', language)}</span>
                                                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">-{pct}%</span>
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

export default function ProductsPageClient({ initialProducts }: ProductsPageClientProps) {
    return (
        <Suspense fallback={null}>
            <ProductsPageContent initialProducts={initialProducts} />
        </Suspense>
    );
}
