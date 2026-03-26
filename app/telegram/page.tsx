'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Heart, Loader2, SlidersHorizontal, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { fetchProducts, fetchCategories, toggleFavorite, getApiToken, type ApiProduct, type ApiCategory } from '../../src/lib/apiClient';
import { TELEGRAM_ROUTES } from '../../src/shared/config/constants';
import { formatPrice } from '../../src/shared/lib/formatPrice';
import { repairText } from '../../src/shared/lib/repairText';
import { cn } from '../../src/shared/lib/utils';
import { useSSERefetch } from '../../src/shared/hooks/useSSERefetch';
import { useTranslation } from '../../src/shared/lib/i18n';

const TG_FAVORITES_CACHE_KEY = 'tg_fav_ids_cache';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const CALENDAR_TEXT = {
    uz: {
        months: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
        days: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
    },
    ru: {
        months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    },
    en: {
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    },
} as const;
const FALLBACK_CATEGORIES: ApiCategory[] = [
    { id: 'accessories', name: 'Aksessuarlar', name_uz: 'Aksessuarlar', name_ru: 'Аксессуары', name_en: 'Accessories', slug: 'accessories' },
    { id: 'dresses', name: "Ko'ylaklar", name_uz: "Ko'ylaklar", name_ru: 'Платья', name_en: 'Dresses', slug: 'dresses' },
    { id: 'outerwear', name: 'Ustki kiyim', name_uz: 'Ustki kiyim', name_ru: 'Верхняя одежда', name_en: 'Outerwear', slug: 'outerwear' },
    { id: 'pants', name: 'Shimlar', name_uz: 'Shimlar', name_ru: 'Брюки', name_en: 'Pants', slug: 'pants' },
    { id: 'shirts', name: "Ko'ylaklar", name_uz: "Ko'ylaklar", name_ru: 'Рубашки', name_en: 'Shirts', slug: 'shirts' },
    { id: 'shoes', name: 'Poyabzal', name_uz: 'Poyabzal', name_ru: 'Обувь', name_en: 'Shoes', slug: 'shoes' },
    { id: 'sportswear', name: 'Sport kiyimlari', name_uz: 'Sport kiyimlari', name_ru: 'Спортивная одежда', name_en: 'Sportswear', slug: 'sportswear' },
    { id: 'jackets', name: 'Kurtkalar', name_uz: 'Kurtkalar', name_ru: 'Куртки', name_en: 'Jackets', slug: 'jackets' },
];

function formatDateLabel(iso: string, language: 'uz' | 'ru' | 'en') {
    const [y, m, d] = iso.split('-');
    return `${parseInt(d)} ${CALENDAR_TEXT[language].months[parseInt(m) - 1]} ${y}`;
}

function MiniCalendar({ selected, onSelect, language }: {
    selected: string;
    onSelect: (iso: string) => void;
    language: 'uz' | 'ru' | 'en';
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

    const copy = CALENDAR_TEXT[language];

    return (
        <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 select-none">
            <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors">
                    <ChevronLeft size={15} className="text-[var(--color-hint)]" />
                </button>
                <span className="text-[13px] font-bold text-[var(--color-text)]">
                    {copy.months[month]} {year}
                </span>
                <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors">
                    <ChevronRight size={15} className="text-[var(--color-hint)]" />
                </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
                {copy.days.map(d => (
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
    const [activeParentCat, setActiveParentCat] = useState('');
    const [activeSubCat, setActiveSubCat] = useState('');
    const [loading, setLoading] = useState(true);
    const [favs, setFavs] = useState<Set<string>>(new Set());

    const [filterOpen, setFilterOpen] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sizeFilter, setSizeFilter] = useState('');
    const [minDiscount, setMinDiscount] = useState('');
    const [createdFrom, setCreatedFrom] = useState('');
    const [calOpen, setCalOpen] = useState(false);
    const [draftMinPrice, setDraftMinPrice] = useState('');
    const [draftMaxPrice, setDraftMaxPrice] = useState('');
    const [draftSizeFilter, setDraftSizeFilter] = useState('');
    const [draftMinDiscount, setDraftMinDiscount] = useState('');
    const [draftCreatedFrom, setDraftCreatedFrom] = useState('');
    const [draftCalOpen, setDraftCalOpen] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const syncFavCache = useCallback((ids: string[]) => {
        try {
            localStorage.setItem(TG_FAVORITES_CACHE_KEY, JSON.stringify(ids));
            window.dispatchEvent(new CustomEvent('tg-favorites-updated', { detail: ids }));
        } catch { /* ignore */ }
    }, []);

    const clearFiltersLabel = t.clear_filters;
    const filterTitle = language === 'ru' ? 'Фильтры' : language === 'en' ? 'Filters' : 'Filtrlar';
    const filterApplyLabel = language === 'ru' ? 'Показать товары' : language === 'en' ? 'Show products' : "Mahsulotlarni ko'rsatish";
    const selectedDateLabel = language === 'ru' ? 'Дата' : language === 'en' ? 'Date' : 'Sana';
    const selectedPriceLabel = language === 'ru' ? 'Цена' : language === 'en' ? 'Price' : 'Narx';
    const selectedDiscountLabel = language === 'ru' ? 'Скидка' : language === 'en' ? 'Discount' : 'Chegirma';

    const categoryLabel = (cat: ApiCategory) => {
        if (language === 'ru' && cat.name_ru) return repairText(cat.name_ru);
        if (language === 'en' && cat.name_en) return repairText(cat.name_en);
        if (cat.name_uz) return repairText(cat.name_uz);
        const key = (cat.slug || cat.name || '').toLowerCase();
        if (key.includes('accessor')) return t.cat_accessories;
        if (key.includes('dress')) return language === 'uz' ? "Ko'ylaklar" : language === 'ru' ? 'Платья' : 'Dresses';
        if (key.includes('outerwear')) return language === 'uz' ? 'Ustki kiyim' : language === 'ru' ? 'Верхняя одежда' : 'Outerwear';
        if (key.includes('pant')) return t.cat_pants;
        if (key.includes('shirt')) return t.cat_shirts;
        if (key.includes('shoe')) return t.cat_shoes;
        if (key.includes('sport')) return language === 'uz' ? 'Sport kiyimlari' : language === 'ru' ? 'Спортивная одежда' : 'Sportswear';
        if (key.includes('jacket')) return t.cat_jackets;
        if (key.includes('hood')) return t.cat_hoodies;
        if (key.includes('tshirt') || key.includes('t-shirt')) return t.cat_tshirts;
        return repairText(cat.name);
    };

    const parentCategories = useMemo(
        () => categories.filter(cat => !cat.parent_id),
        [categories]
    );
    const subcategories = useMemo(
        () => categories.filter(cat => cat.parent_id === activeParentCat),
        [categories, activeParentCat]
    );

    const activeFilterCount =
        (minPrice ? 1 : 0) +
        (maxPrice ? 1 : 0) +
        (sizeFilter ? 1 : 0) +
        (minDiscount ? 1 : 0) +
        (createdFrom ? 1 : 0);

    const draftFilterCount =
        (draftMinPrice ? 1 : 0) +
        (draftMaxPrice ? 1 : 0) +
        (draftSizeFilter ? 1 : 0) +
        (draftMinDiscount ? 1 : 0) +
        (draftCreatedFrom ? 1 : 0);

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
        const go = () => loadProducts({ search, category: activeSubCat || (subcategories.length === 0 ? activeParentCat : ''), minPrice, maxPrice, sizeFilter, minDiscount, createdFrom });
        if (immediate) go();
        else debounceRef.current = setTimeout(go, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, activeParentCat, activeSubCat, subcategories.length, minPrice, maxPrice, sizeFilter, minDiscount, createdFrom, loadProducts]);

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

    useEffect(() => {
        if (!filterOpen) return;
        setDraftMinPrice(minPrice);
        setDraftMaxPrice(maxPrice);
        setDraftSizeFilter(sizeFilter);
        setDraftMinDiscount(minDiscount);
        setDraftCreatedFrom(createdFrom);
        setDraftCalOpen(false);
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [filterOpen, minPrice, maxPrice, sizeFilter, minDiscount, createdFrom]);

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

    const clearDraftFilters = () => {
        setDraftMinPrice('');
        setDraftMaxPrice('');
        setDraftSizeFilter('');
        setDraftMinDiscount('');
        setDraftCreatedFrom('');
        setDraftCalOpen(false);
    };

    const openFilters = () => setFilterOpen(true);

    const applyFilters = () => {
        setMinPrice(draftMinPrice);
        setMaxPrice(draftMaxPrice);
        setSizeFilter(draftSizeFilter);
        setMinDiscount(draftMinDiscount);
        setCreatedFrom(draftCreatedFrom);
        setCalOpen(false);
        setFilterOpen(false);
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
                <button onClick={openFilters}
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

            {activeFilterCount > 0 && (
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {createdFrom && (
                        <button
                            onClick={() => setCreatedFrom('')}
                            className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-3 py-2 text-[11px] font-semibold text-[var(--color-primary)]"
                        >
                            <CalendarDays size={12} />
                            {selectedDateLabel}: {formatDateLabel(createdFrom, language)}
                            <X size={12} />
                        </button>
                    )}
                    {(minPrice || maxPrice) && (
                        <button
                            onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                            className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-3 py-2 text-[11px] font-semibold text-[var(--color-primary)]"
                        >
                            {selectedPriceLabel}: {minPrice || '0'}-{maxPrice || '∞'}
                            <X size={12} />
                        </button>
                    )}
                    {sizeFilter && (
                        <button
                            onClick={() => setSizeFilter('')}
                            className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-3 py-2 text-[11px] font-semibold text-[var(--color-primary)]"
                        >
                            {t.size}: {sizeFilter}
                            <X size={12} />
                        </button>
                    )}
                    {minDiscount && (
                        <button
                            onClick={() => setMinDiscount('')}
                            className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-3 py-2 text-[11px] font-semibold text-[var(--color-primary)]"
                        >
                            {selectedDiscountLabel}: {minDiscount}%+
                            <X size={12} />
                        </button>
                    )}
                    <button
                        onClick={clearFilters}
                        className="shrink-0 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-400"
                    >
                        {clearFiltersLabel}
                    </button>
                </div>
            )}

            {filterOpen && (
                <div className="fixed inset-0 z-[180]">
                    <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
                    <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[500px] overflow-hidden rounded-t-[30px] border border-b-0 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-24px_60px_-18px_rgba(0,0,0,0.5)]">
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[var(--color-hint)]/30" />
                        <div className="flex items-center justify-between px-4 pb-3 pt-4">
                            <div>
                                <p className="text-[18px] font-black text-[var(--color-text)]">{filterTitle}</p>
                                <p className="mt-1 text-[12px] text-[var(--color-hint)]">{draftFilterCount} ta filter tanlandi</p>
                            </div>
                            <button
                                onClick={() => setFilterOpen(false)}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-hint)]"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto px-4 pb-28">
                            <div className="space-y-5">
                                <section className="rounded-[24px] bg-[var(--color-bg)] p-4">
                                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-hint)]">{t.created_from}</p>
                                    {draftCreatedFrom ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-2 text-[12px] font-semibold text-[var(--color-primary)]">
                                                <CalendarDays size={13} />
                                                {formatDateLabel(draftCreatedFrom, language)}
                                            </span>
                                            <button
                                                onClick={() => { setDraftCreatedFrom(''); setDraftCalOpen(false); }}
                                                className="rounded-full border border-[var(--color-border)] px-3 py-2 text-[12px] font-semibold text-[var(--color-text)]"
                                            >
                                                {clearFiltersLabel}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDraftCalOpen(o => !o)}
                                            className={cn(
                                                'flex items-center gap-2 rounded-full border px-4 py-3 text-[13px] font-semibold transition-all',
                                                draftCalOpen
                                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                                                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                                            )}
                                        >
                                            <CalendarDays size={15} />
                                            {t.choose_date}
                                        </button>
                                    )}
                                    {draftCalOpen && (
                                        <div className="mt-3">
                                            <MiniCalendar
                                                selected={draftCreatedFrom}
                                                language={language}
                                                onSelect={iso => { setDraftCreatedFrom(iso); setDraftCalOpen(false); }}
                                            />
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-[24px] bg-[var(--color-bg)] p-4">
                                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-hint)]">{t.price_range}</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-hint)]">Min</span>
                                            <input
                                                value={draftMinPrice}
                                                onChange={e => setDraftMinPrice(e.target.value)}
                                                placeholder="0"
                                                type="number"
                                                className="mt-1 h-7 w-full bg-transparent text-[14px] font-semibold text-[var(--color-text)] outline-none"
                                            />
                                        </label>
                                        <label className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-hint)]">Max</span>
                                            <input
                                                value={draftMaxPrice}
                                                onChange={e => setDraftMaxPrice(e.target.value)}
                                                placeholder="1000000"
                                                type="number"
                                                className="mt-1 h-7 w-full bg-transparent text-[14px] font-semibold text-[var(--color-text)] outline-none"
                                            />
                                        </label>
                                    </div>
                                </section>

                                <section className="rounded-[24px] bg-[var(--color-bg)] p-4">
                                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-hint)]">{t.size}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {SIZES.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setDraftSizeFilter(draftSizeFilter === s ? '' : s)}
                                                className={cn(
                                                    'min-w-[50px] rounded-[16px] border px-4 py-3 text-[13px] font-bold transition-all',
                                                    draftSizeFilter === s
                                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_12px_24px_-16px_rgba(34,197,94,0.8)]'
                                                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                                                )}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-[24px] bg-[var(--color-bg)] p-4">
                                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-hint)]">{t.minimum_discount}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['10', '20', '30', '40', '50'].map((value) => (
                                            <button
                                                key={value}
                                                onClick={() => setDraftMinDiscount(draftMinDiscount === value ? '' : value)}
                                                className={cn(
                                                    'rounded-full border px-4 py-2.5 text-[13px] font-bold transition-all',
                                                    draftMinDiscount === value
                                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                                                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                                                )}
                                            >
                                                {value}%+
                                            </button>
                                        ))}
                                        <label className="flex min-w-[110px] items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
                                            <input
                                                value={draftMinDiscount}
                                                onChange={e => setDraftMinDiscount(e.target.value)}
                                                type="number"
                                                min="1"
                                                max="99"
                                                placeholder="20"
                                                className="w-full bg-transparent text-[13px] font-bold text-[var(--color-text)] outline-none"
                                            />
                                            <span className="text-[12px] font-semibold text-[var(--color-hint)]">%</span>
                                        </label>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={clearDraftFilters}
                                    className="h-12 flex-1 rounded-full border border-[var(--color-border)] text-[13px] font-bold text-[var(--color-text)]"
                                >
                                    {clearFiltersLabel}
                                </button>
                                <button
                                    onClick={applyFilters}
                                    className="h-12 flex-[1.3] rounded-full bg-[var(--color-primary)] px-5 text-[13px] font-black text-white shadow-[0_18px_30px_-18px_rgba(34,197,94,0.9)]"
                                >
                                    {filterApplyLabel}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category chips */}
            <div className="mb-3 flex flex-wrap gap-2">
                <button onClick={() => { setActiveParentCat(''); setActiveSubCat(''); }}
                    className={cn('max-w-full px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all',
                        !activeParentCat && !activeSubCat ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-transparent'
                                   : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]')}>
                    <span className="block max-w-[42vw] truncate">{t.all}</span>
                </button>
                {parentCategories.map(cat => (
                    <button key={cat.id} onClick={() => {
                        const nextParent = activeParentCat === cat.id ? '' : cat.id;
                        setActiveParentCat(nextParent);
                        setActiveSubCat('');
                    }}
                        className={cn('max-w-full px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all',
                            activeParentCat === cat.id ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-transparent'
                                                 : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]')}>
                        <span className="block max-w-[42vw] truncate">{categoryLabel(cat)}</span>
                    </button>
                ))}
            </div>
            {activeParentCat && subcategories.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {subcategories.map(cat => (
                        <button key={cat.id} onClick={() => setActiveSubCat(activeSubCat === cat.id ? '' : cat.id)}
                            className={cn('max-w-full px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all',
                                activeSubCat === cat.id ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                                        : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]')}>
                            <span className="block max-w-[42vw] truncate">{categoryLabel(cat)}</span>
                        </button>
                    ))}
                </div>
            )}

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
                                            <p className="text-[14px] font-black text-[var(--color-primary)]">{formatPrice(cur, 'UZS', language)}</p>
                                            {hasDis && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="text-[11px] text-[var(--color-hint)] line-through">{formatPrice(bp, 'UZS', language)}</span>
                                                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">-{pct}%</span>
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
