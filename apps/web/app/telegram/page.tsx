'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Search, X, Heart, Loader2, SlidersHorizontal, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { fetchProducts, fetchCategories, toggleFavorite, getApiToken, type ApiProduct, type ApiCategory } from '../../src/lib/apiClient';
import { TELEGRAM_ROUTES } from '../../src/shared/config/constants';
import { formatPrice } from '../../src/shared/lib/formatPrice';
import { cn } from '../../src/shared/lib/utils';
import { useSSERefetch } from '../../src/shared/hooks/useSSERefetch';
import { useTranslation } from '../../src/shared/lib/i18n';
const BannerCarousel = dynamic(() => import('../../src/shared/ui/BannerCarousel').then(m => m.BannerCarousel), { ssr: false });

const TG_FAVORITES_CACHE_KEY = 'tg_fav_ids_cache';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const UZ_MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const UZ_DAYS   = ['Du','Se','Ch','Pa','Ju','Sh','Ya'];
const FALLBACK_CATEGORIES: ApiCategory[] = [
    { id: 'accessories', name: 'Accessories', name_uz: null, name_ru: null, name_en: 'Accessories', slug: 'accessories' },
    { id: 'dresses', name: 'Dresses', name_uz: null, name_ru: null, name_en: 'Dresses', slug: 'dresses' },
    { id: 'outerwear', name: 'Outerwear', name_uz: null, name_ru: null, name_en: 'Outerwear', slug: 'outerwear' },
    { id: 'pants', name: 'Pants', name_uz: null, name_ru: null, name_en: 'Pants', slug: 'pants' },
    { id: 'shirts', name: 'Shirts', name_uz: null, name_ru: null, name_en: 'Shirts', slug: 'shirts' },
    { id: 'shoes', name: 'Shoes', name_uz: null, name_ru: null, name_en: 'Shoes', slug: 'shoes' },
    { id: 'sportswear', name: 'Sportswear', name_uz: null, name_ru: null, name_en: 'Sportswear', slug: 'sportswear' },
    { id: 'jackets', name: 'Jackets', name_uz: null, name_ru: null, name_en: 'Jackets', slug: 'jackets' },
];

function formatDateLabel(iso: string) {
    const [y, m, d] = iso.split('-');
    return `${parseInt(d)} ${UZ_MONTHS[parseInt(m) - 1]} ${y}`;
}

function MiniCalendar({ selected, onSelect }: {
    selected: string;
    onSelect: (iso: string) => void;
}) {
    const today = new Date();
    const [year, setYear]   = useState(selected ? parseInt(selected.split('-')[0]) : today.getFullYear());
    const [month, setMonth] = useState(selected ? parseInt(selected.split('-')[1]) - 1 : today.getMonth());

    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    const cells: (number | null)[] = [
        ...Array(startOffset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const toIso = (d: number) => `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const todayIso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    return (
        <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 select-none">
            <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors">
                    <ChevronLeft size={15} className="text-[var(--color-hint)]" />
                </button>
                <span className="text-[13px] font-bold text-[var(--color-text)]">
                    {UZ_MONTHS[month]} {year}
                </span>
                <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors">
                    <ChevronRight size={15} className="text-[var(--color-hint)]" />
                </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
                {UZ_DAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-[var(--color-hint)] py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const iso = toIso(day);
                    const isSelected = iso === selected;
                    const isToday = iso === todayIso;
                    return (
                        <button key={i} onClick={() => onSelect(iso)}
                            className={cn(
                                'h-8 w-full rounded-lg text-[12px] font-semibold transition-all',
                                isSelected ? 'text-white' :
                                isToday    ? 'border border-[var(--color-primary)] text-[var(--color-primary)]' :
                                             'text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                            )}
                            style={isSelected ? { backgroundColor: 'var(--color-primary)', color: 'white' } : undefined}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function TgHomePage() {
    const router = useRouter();
    const { t, language } = useTranslation();
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [search, setSearch] = useState('');
    const [activeCat, setActiveCat] = useState('');
    const [loading, setLoading] = useState(true);
    const [favs, setFavs] = useState<Set<string>>(new Set());

    const [filterOpen, setFilterOpen] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sizeFilter, setSizeFilter] = useState('');
    const [minDiscount, setMinDiscount] = useState('');
    const [createdFrom, setCreatedFrom] = useState('');
    const [calOpen, setCalOpen] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const syncFavCache = useCallback((ids: string[]) => {
        try {
            localStorage.setItem(TG_FAVORITES_CACHE_KEY, JSON.stringify(ids));
            window.dispatchEvent(new CustomEvent('tg-favorites-updated', { detail: ids }));
        } catch { /* ignore */ }
    }, []);

    const clearFiltersLabel = language === 'en' ? 'Clear filters' : language === 'ru' ? 'Очистить фильтры' : 'Filtrlarni tozalash';

    const categoryLabel = (cat: ApiCategory) => {
        if (language === 'ru' && cat.name_ru) return cat.name_ru;
        if (language === 'en' && cat.name_en) return cat.name_en;
        if (cat.name_uz) return cat.name_uz;
        const key = (cat.slug || cat.name || '').toLowerCase();
        if (key.includes('accessor')) return t.cat_accessories;
        if (key.includes('dress')) return language === 'uz' ? 'Ko\'ylaklar' : language === 'ru' ? 'Платья' : 'Dresses';
        if (key.includes('outerwear')) return language === 'uz' ? 'Ustki kiyim' : language === 'ru' ? 'Верхняя одежда' : 'Outerwear';
        if (key.includes('pant')) return t.cat_pants;
        if (key.includes('shirt')) return t.cat_shirts;
        if (key.includes('shoe')) return t.cat_shoes;
        if (key.includes('sport')) return language === 'uz' ? 'Sport kiyimlari' : language === 'ru' ? 'Спортивная одежда' : 'Sportswear';
        if (key.includes('jacket')) return t.cat_jackets;
        if (key.includes('hood')) return t.cat_hoodies;
        if (key.includes('tshirt') || key.includes('t-shirt')) return t.cat_tshirts;
        return cat.name;
    };

    const activeFilterCount =
        (minPrice ? 1 : 0) +
        (maxPrice ? 1 : 0) +
        (sizeFilter ? 1 : 0) +
        (minDiscount ? 1 : 0) +
        (createdFrom ? 1 : 0);

    const loadProducts = useCallback((params: {
        search: string; category: string;
        minPrice: string; maxPrice: string; sizeFilter: string;
        minDiscount: string; createdFrom: string;
    }) => {
        setLoading(true);
        fetchProducts({
            limit: 100,
            search: params.search || undefined,
            category: params.category || undefined,
            min_price: params.minPrice ? Number(params.minPrice) : undefined,
            max_price: params.maxPrice ? Number(params.maxPrice) : undefined,
            min_discount: params.minDiscount ? Number(params.minDiscount) : undefined,
            size: params.sizeFilter || undefined,
            created_from: params.createdFrom || undefined,
        }).then(r => setProducts(r.products))
          .catch(() => {})
          .finally(() => setLoading(false));
    }, []);

    const triggerFetch = useCallback((immediate = false) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const go = () => loadProducts({ search, category: activeCat, minPrice, maxPrice, sizeFilter, minDiscount, createdFrom });
        if (immediate) go();
        else debounceRef.current = setTimeout(go, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, activeCat, minPrice, maxPrice, sizeFilter, minDiscount, createdFrom, loadProducts]);

    useEffect(() => {
        fetchCategories()
            .then((list) => setCategories(list.length ? list : FALLBACK_CATEGORIES))
            .catch(() => setCategories(FALLBACK_CATEGORIES));
    }, []);

    useEffect(() => {
        try {
            const cached = localStorage.getItem(TG_FAVORITES_CACHE_KEY);
            if (cached) {
                const ids = JSON.parse(cached);
                if (Array.isArray(ids)) setFavs(new Set(ids));
            }
        } catch { /* ignore */ }

        const token = getApiToken();
        if (!token) return;

        fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json().catch(() => ({})))
            .then((json) => {
                const data = json?.data ?? json ?? [];
                if (!Array.isArray(data)) return;
                const ids = data
                    .map((item: { product_id?: string }) => item.product_id)
                    .filter((id: string | undefined): id is string => Boolean(id));
                setFavs(new Set(ids));
                syncFavCache(ids);
            })
            .catch(() => {});
    }, [syncFavCache]);

    useEffect(() => {
        const handleFavoritesUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<string[]>;
            if (!Array.isArray(customEvent.detail)) return;
            setFavs(new Set(customEvent.detail));
        };

        window.addEventListener('tg-favorites-updated', handleFavoritesUpdated as EventListener);
        return () => window.removeEventListener('tg-favorites-updated', handleFavoritesUpdated as EventListener);
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
            setFavs(prev => {
                const next = new Set(prev);
                r.favorited ? next.add(id) : next.delete(id);
                syncFavCache([...next]);
                return next;
            });
        } catch { /* ignore */ }
    };

    const clearFilters = () => {
        setMinPrice(''); setMaxPrice(''); setSizeFilter('');
        setMinDiscount(''); setCreatedFrom(''); setCalOpen(false);
    };

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] px-4 py-3">
            {/* Search + filter button */}
            <div className="flex gap-2 mb-2">
                <div className="relative flex-1 min-w-0">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-hint)]" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}
                        className="h-11 w-full bg-[var(--color-surface)] rounded-full pl-10 pr-10 text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] border border-[var(--color-border)] outline-none focus:ring-2 ring-[var(--color-primary)]/20" />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[var(--color-hint)]/10 rounded-full">
                            <X size={13} className="text-[var(--color-hint)]" />
                        </button>
                    )}
                </div>
                <button onClick={() => setFilterOpen(o => !o)}
                    className={cn('relative shrink-0 w-11 h-11 flex items-center justify-center rounded-full border transition-all',
                        filterOpen || activeFilterCount > 0
                            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                            : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-hint)]'
                    )}>
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

                    {/* Date from */}
                    <div>
                        <p className="text-[11px] font-bold text-[var(--color-hint)] uppercase tracking-widest mb-2">Yaratilgan sana (dan)</p>
                        {createdFrom ? (
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[12px] font-semibold text-[var(--color-primary)]">
                                    <CalendarDays size={13} />
                                    {formatDateLabel(createdFrom)} dan
                                </span>
                                <button onClick={() => { setCreatedFrom(''); setCalOpen(false); }}
                                    className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-hint)]/10">
                                    <X size={12} className="text-[var(--color-hint)]" />
                                </button>
                                <button onClick={() => setCalOpen(o => !o)}
                                    className="text-[12px] font-semibold text-[var(--color-hint)] underline">
                                    O&apos;zgartirish
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setCalOpen(o => !o)}
                                className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-all',
                                    calOpen
                                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                        : 'bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-border)]'
                                )}>
                                <CalendarDays size={14} />
                                Sana tanlash
                            </button>
                        )}
                        {calOpen && (
                            <div className="mt-2">
                                <MiniCalendar
                                    selected={createdFrom}
                                    onSelect={iso => { setCreatedFrom(iso); setCalOpen(false); }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Price range */}
                    <div>
                        <p className="text-[11px] font-bold text-[var(--color-hint)] uppercase tracking-widest mb-2">Narx oralig&apos;i (so&apos;m)</p>
                        <div className="grid grid-cols-2 gap-2">
                            <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min"
                                type="number"
                                className="h-9 w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 text-[13px] text-[var(--color-text)] outline-none focus:ring-2 ring-[var(--color-primary)]/20" />
                            <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max"
                                type="number"
                                className="h-9 w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 text-[13px] text-[var(--color-text)] outline-none focus:ring-2 ring-[var(--color-primary)]/20" />
                        </div>
                    </div>

                    {/* Size */}
                    <div>
                        <p className="text-[11px] font-bold text-[var(--color-hint)] uppercase tracking-widest mb-2">O&apos;lcham</p>
                        <div className="flex flex-wrap gap-1.5">
                            {SIZES.map(s => (
                                <button key={s} onClick={() => setSizeFilter(sizeFilter === s ? '' : s)}
                                    className={cn('h-9 px-3 rounded-xl text-[12px] font-bold border transition-all',
                                        sizeFilter === s
                                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                            : 'bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-border)]'
                                    )}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Min discount */}
                    <div>
                        <p className="text-[11px] font-bold text-[var(--color-hint)] uppercase tracking-widest mb-2">Aksiya (kamida %)</p>
                        <div className="flex items-center gap-2">
                            <input value={minDiscount} onChange={e => setMinDiscount(e.target.value)}
                                type="number" min="1" max="99" placeholder="20"
                                className="h-9 w-24 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 text-[13px] text-[var(--color-text)] outline-none focus:ring-2 ring-[var(--color-primary)]/20" />
                            <span className="text-[12px] text-[var(--color-hint)]">% va undan ko&apos;p</span>
                        </div>
                    </div>

                    {/* Clear */}
                    {activeFilterCount > 0 && (
                        <button onClick={clearFilters}
                            className="w-full h-9 rounded-xl border border-red-400/30 text-red-500 text-[13px] font-semibold bg-red-500/5">
                            {clearFiltersLabel}
                        </button>
                    )}
                </div>
            )}

            {/* Category chips */}
            <div className="mb-3 flex flex-wrap gap-2">
                <button onClick={() => setActiveCat('')}
                    className={cn('max-w-full px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all',
                        !activeCat ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-transparent'
                                   : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]')}>
                    <span className="block max-w-[42vw] truncate">{t.all}</span>
                </button>
                {categories.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCat(activeCat === cat.id ? '' : cat.id)}
                        className={cn('max-w-full px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all',
                            activeCat === cat.id ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-transparent'
                                                 : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]')}>
                        <span className="block max-w-[42vw] truncate">{categoryLabel(cat)}</span>
                    </button>
                ))}
            </div>

            <div className="mb-3">
                <BannerCarousel variant="telegram" productRoute={(id) => TELEGRAM_ROUTES.PRODUCT(id)} />
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
                </div>
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-[var(--color-hint)]">
                    <Search size={28} className="opacity-40 mb-2" />
                    <p className="text-sm">{t.no_results}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 pb-4">
                    {products.map(p => (
                        <Link key={p.id} href={TELEGRAM_ROUTES.PRODUCT(p.id)}
                            className="bg-[var(--color-surface)] rounded-[20px] overflow-hidden border border-[var(--color-border)] active:scale-[0.98] transition-transform">
                            <div className="relative aspect-[3/4] bg-[var(--color-surface2)]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.thumbnail || 'https://placehold.co/400x533/f5f5f5/ccc?text=No+Image'} alt={p.name} className="w-full h-full object-cover" />
                                <button onClick={e => handleFav(e, p.id)}
                                    className={cn('absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full border backdrop-blur-sm',
                                        favs.has(p.id)
                                          ? 'border-red-200 bg-white/92 text-red-500'
                                          : 'border-white/30 bg-[var(--color-surface)]/80 text-[var(--color-hint)]')}>
                                    <Heart size={14} className={cn(favs.has(p.id) && 'fill-current text-red-500')} />
                                </button>
                            </div>
                            <div className="p-3">
                                <p className="text-[10px] text-[var(--color-hint)] font-medium truncate">{p.store_name}</p>
                                <h3 className="text-[13px] font-bold text-[var(--color-text)] line-clamp-2 mt-0.5">{p.name}</h3>
                                {(() => {
                                    const bp = Number(p.base_price);
                                    const sp = p.sale_price != null ? Number(p.sale_price) : null;
                                    const cur = sp != null && sp < bp ? sp : bp;
                                    const hasDis = cur < bp;
                                    const pct = hasDis ? Math.round((1 - cur / bp) * 100) : 0;
                                    return (
                                        <div className="mt-1">
                                            <p className="text-[14px] font-black text-[var(--color-primary)]">{formatPrice(cur, 'UZS')}</p>
                                            {hasDis && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="text-[11px] text-[var(--color-hint)] line-through">{formatPrice(bp, 'UZS')}</span>
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
    );
}
