'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Heart, Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { fetchCategories, fetchProducts, getApiToken, toggleFavorite, type ApiCategory, type ApiProduct } from '../../src/lib/apiClient';
import { TELEGRAM_ROUTES } from '../../src/shared/config/constants';
import { useSSERefetch } from '../../src/shared/hooks/useSSERefetch';
import { useTranslation } from '../../src/shared/lib/i18n';
import { formatPrice } from '../../src/shared/lib/formatPrice';
import { repairText } from '../../src/shared/lib/repairText';
import { cn } from '../../src/shared/lib/utils';

const TG_FAVORITES_CACHE_KEY = 'tg_fav_ids_cache';
const DISCOUNTS = ['10', '20', '30', '40', '50'];
const PRICE_PRESETS = [
    ['0', '100000'],
    ['100000', '300000'],
    ['300000', '500000'],
    ['500000', ''],
] as const;

type SortKey = 'popular' | 'newest' | 'price_asc' | 'price_desc';
type Filters = { sort: SortKey; minPrice: string; maxPrice: string; discount: string };

const DEFAULT_FILTERS: Filters = { sort: 'popular', minPrice: '', maxPrice: '', discount: '' };

function labels(language: 'uz' | 'ru' | 'en') {
    return {
        filter: language === 'ru' ? 'Фильтры' : language === 'en' ? 'Filters' : 'Filtrlar',
        apply: language === 'ru' ? 'Показать товары' : language === 'en' ? 'Show products' : "Mahsulotlarni ko'rsatish",
        sort: language === 'ru' ? 'Сортировка' : language === 'en' ? 'Sort' : 'Saralash',
        price: language === 'ru' ? 'Цена' : language === 'en' ? 'Price' : 'Narx',
        discount: language === 'ru' ? 'Скидка' : language === 'en' ? 'Discount' : 'Chegirma',
        selected: language === 'ru' ? 'фильтров выбрано' : language === 'en' ? 'filters selected' : 'filter tanlandi',
        sorts: {
            popular: language === 'ru' ? 'Популярные' : language === 'en' ? 'Popular' : 'Mashhur',
            newest: language === 'ru' ? 'Сначала новые' : language === 'en' ? 'Newest first' : 'Yangi',
            price_asc: language === 'ru' ? 'Сначала дешёвые' : language === 'en' ? 'Cheapest first' : 'Arzon',
            price_desc: language === 'ru' ? 'Сначала дорогие' : language === 'en' ? 'Expensive first' : 'Qimmat',
        },
    };
}

function countActiveFilters(filters: Filters) {
    return (filters.sort !== 'popular' ? 1 : 0)
        + (filters.minPrice || filters.maxPrice ? 1 : 0)
        + (filters.discount ? 1 : 0);
}

function formatPresetLabel(min: string, max: string) {
    const compact = (value: string) => {
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount <= 0) return '0';
        if (amount >= 1_000_000) return `${amount / 1_000_000} mln`;
        return `${Math.round(amount / 1000)} ming`;
    };

    if (!max) {
        return `${compact(min)}+`;
    }

    return `${compact(min)} - ${compact(max)}`;
}

export default function TgHomePage() {
    const router = useRouter();
    const { t, language } = useTranslation();
    const text = labels(language);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [search, setSearch] = useState('');
    const [activeParentCat, setActiveParentCat] = useState('');
    const [activeSubCat, setActiveSubCat] = useState('');
    const [loading, setLoading] = useState(true);
    const [favs, setFavs] = useState<Set<string>>(new Set());
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const categoryLabel = (cat: ApiCategory, withSticker = false) => {
        const name = repairText(language === 'ru' && cat.name_ru ? cat.name_ru : language === 'en' && cat.name_en ? cat.name_en : cat.name_uz || cat.name);
        return withSticker && cat.sticker ? `${cat.sticker} ${name}` : name;
    };
    const parentCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
    const subcategories = useMemo(() => categories.filter((c) => c.parent_id === activeParentCat), [categories, activeParentCat]);
    const activeCategory = activeSubCat || (subcategories.length === 0 ? activeParentCat : '');
    const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);
    const draftFilterCount = useMemo(() => countActiveFilters(draft), [draft]);

    const syncFavCache = useCallback((ids: string[]) => {
        try {
            localStorage.setItem(TG_FAVORITES_CACHE_KEY, JSON.stringify(ids));
            window.dispatchEvent(new CustomEvent('tg-favorites-updated', { detail: ids }));
        } catch {}
    }, []);

    const loadProducts = useCallback(() => {
        setLoading(true);
        fetchProducts({
            limit: 100,
            search: search || undefined,
            category: activeCategory || undefined,
            sort: filters.sort,
            min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
            max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
            min_discount: filters.discount ? Number(filters.discount) : undefined,
        }).then((r) => setProducts(r.products)).catch(() => {}).finally(() => setLoading(false));
    }, [activeCategory, filters, search]);

    useEffect(() => { fetchCategories().then(setCategories).catch(() => {}); }, []);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(loadProducts, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [loadProducts]);
    useSSERefetch(['products', 'stores'], () => loadProducts());

    useEffect(() => {
        try {
            const raw = localStorage.getItem(TG_FAVORITES_CACHE_KEY);
            if (raw) setFavs(new Set(JSON.parse(raw)));
        } catch {}
        const token = getApiToken();
        if (!token) return;
        fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json().catch(() => ({})))
            .then((json) => {
                const ids = (json?.data ?? json ?? []).map((item: { product_id?: string }) => item.product_id).filter(Boolean);
                setFavs(new Set(ids));
                syncFavCache(ids);
            }).catch(() => {});
    }, [syncFavCache]);

    useEffect(() => {
        if (!filterOpen) return;
        setDraft(filters);
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [filterOpen, filters]);

    const toggleFav = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        if (!getApiToken()) return void router.push(TELEGRAM_ROUTES.PROFILE);
        try {
            const res = await toggleFavorite(id);
            setFavs((prev) => {
                const next = new Set(prev);
                res.favorited ? next.add(id) : next.delete(id);
                syncFavCache([...next]);
                return next;
            });
        } catch {}
    };

    const chips = [
        filters.sort !== 'popular' ? { key: 'sort', label: text.sorts[filters.sort], clear: () => setFilters((s) => ({ ...s, sort: 'popular' })) } : null,
        filters.minPrice || filters.maxPrice ? { key: 'price', label: `${text.price}: ${filters.minPrice || '0'}-${filters.maxPrice || '∞'}`, clear: () => setFilters((s) => ({ ...s, minPrice: '', maxPrice: '' })) } : null,
        filters.discount ? { key: 'discount', label: `${text.discount}: ${filters.discount}%+`, clear: () => setFilters((s) => ({ ...s, discount: '' })) } : null,
    ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>;

    return (
        <div className="flex min-h-full flex-col bg-[var(--color-bg)] px-4 py-3">
            <div className="mb-2 flex gap-2">
                <div className="relative min-w-0 flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-hint)]" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} className="h-11 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-10 text-[13px] text-[var(--color-text)] outline-none focus:ring-2 ring-[var(--color-primary)]/20" />
                    {search ? <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-hint)]/10"><X size={13} className="text-[var(--color-hint)]" /></button> : null}
                </div>
                <button onClick={() => setFilterOpen(true)} className={cn('relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border', activeFilterCount ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-hint)]')}>
                    <SlidersHorizontal size={18} />
                    {activeFilterCount ? <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">{activeFilterCount}</span> : null}
                </button>
            </div>

            {chips.length ? <div className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">{chips.map((chip) => <button key={chip.key} onClick={chip.clear} className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-3 py-2 text-[11px] font-semibold text-[var(--color-primary)]">{chip.label}<X size={12} /></button>)}<button onClick={() => setFilters(DEFAULT_FILTERS)} className="shrink-0 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-400">{t.clear_filters}</button></div> : null}

            {filterOpen ? <div className="fixed inset-0 z-[180]">
                <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
                <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[500px] rounded-t-[30px] border border-b-0 border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
                    <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[var(--color-hint)]/30" />
                    <div className="flex items-center justify-between px-4 pb-3 pt-4">
                        <div>
                            <p className="text-[18px] font-black text-[var(--color-text)]">{text.filter}</p>
                            <p className="mt-1 text-[12px] text-[var(--color-hint)]">{draftFilterCount} {text.selected}</p>
                        </div>
                        <button onClick={() => setFilterOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-hint)]"><X size={16} /></button>
                    </div>
                    <div className="max-h-[74vh] overflow-y-auto px-4 pb-28">
                        <section className="mb-4 rounded-[24px] bg-[var(--color-bg)] p-4">
                            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-hint)]">{text.sort}</p>
                            <div className="grid grid-cols-2 gap-2">
                                {(['popular', 'newest', 'price_asc', 'price_desc'] as SortKey[]).map((value) => <button key={value} onClick={() => setDraft((s) => ({ ...s, sort: value }))} className={cn('flex items-center justify-between rounded-[18px] border px-4 py-3 text-[13px] font-bold', draft.sort === value ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]')}>{text.sorts[value]}{draft.sort === value ? <Check size={14} /> : null}</button>)}
                            </div>
                        </section>

                        <section className="mb-4 rounded-[24px] bg-[var(--color-bg)] p-4">
                            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-hint)]">{text.price}</p>
                            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {PRICE_PRESETS.map(([min, max]) => <button key={`${min}-${max}`} onClick={() => setDraft((s) => ({ ...s, minPrice: min, maxPrice: max }))} className={cn('shrink-0 rounded-full border px-4 py-2.5 text-[12px] font-bold', draft.minPrice === min && draft.maxPrice === max ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]')}>{formatPresetLabel(min, max)}</button>)}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input value={draft.minPrice} onChange={(e) => setDraft((s) => ({ ...s, minPrice: e.target.value }))} type="number" placeholder="Min" className="h-11 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[14px] text-[var(--color-text)] outline-none" />
                                <input value={draft.maxPrice} onChange={(e) => setDraft((s) => ({ ...s, maxPrice: e.target.value }))} type="number" placeholder="Max" className="h-11 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[14px] text-[var(--color-text)] outline-none" />
                            </div>
                        </section>

                        <section className="rounded-[24px] bg-[var(--color-bg)] p-4">
                            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-hint)]">{text.discount}</p>
                            <div className="flex flex-wrap gap-2">
                                {DISCOUNTS.map((value) => <button key={value} onClick={() => setDraft((s) => ({ ...s, discount: s.discount === value ? '' : value }))} className={cn('rounded-full border px-4 py-2.5 text-[13px] font-bold', draft.discount === value ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]')}>{value}%+</button>)}
                            </div>
                        </section>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3">
                        <div className="flex gap-3">
                            <button onClick={() => setDraft(DEFAULT_FILTERS)} className="h-12 flex-1 rounded-full border border-[var(--color-border)] text-[13px] font-bold text-[var(--color-text)]">{t.clear_filters}</button>
                            <button onClick={() => { setFilters(draft); setFilterOpen(false); }} className="h-12 flex-[1.35] rounded-full bg-[var(--color-primary)] text-[13px] font-black text-white">{text.apply}</button>
                        </div>
                    </div>
                </div>
            </div> : null}

            <div className="mb-3 flex flex-wrap gap-2">
                <button onClick={() => { setActiveParentCat(''); setActiveSubCat(''); }} className={cn('max-w-full rounded-full border px-4 py-1.5 text-[12px] font-semibold', !activeParentCat && !activeSubCat ? 'border-transparent bg-[var(--color-text)] text-[var(--color-bg)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]')}><span className="block max-w-[42vw] truncate">{t.all}</span></button>
                {parentCategories.map((cat) => <button key={cat.id} onClick={() => { const next = activeParentCat === cat.id ? '' : cat.id; setActiveParentCat(next); setActiveSubCat(''); }} className={cn('max-w-full rounded-full border px-4 py-1.5 text-[12px] font-semibold', activeParentCat === cat.id ? 'border-transparent bg-[var(--color-text)] text-[var(--color-bg)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]')}><span className="block max-w-[42vw] truncate">{categoryLabel(cat, true)}</span></button>)}
            </div>
            {activeParentCat && subcategories.length > 0 ? <div className="mb-3 flex flex-wrap gap-2">{subcategories.map((cat) => <button key={cat.id} onClick={() => setActiveSubCat(activeSubCat === cat.id ? '' : cat.id)} className={cn('max-w-full rounded-full border px-4 py-1.5 text-[12px] font-semibold', activeSubCat === cat.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]')}><span className="block max-w-[42vw] truncate">{categoryLabel(cat)}</span></button>)}</div> : null}

            {loading ? <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[var(--color-primary)]" /></div> : products.length === 0 ? <div className="flex flex-col items-center py-16 text-[var(--color-hint)]"><Search size={28} className="mb-2 opacity-40" /><p className="text-sm">{t.no_results}</p></div> : <div className="grid grid-cols-2 gap-3 pb-4">{products.map((p) => {
                const bp = Number(p.base_price);
                const sp = p.sale_price != null ? Number(p.sale_price) : null;
                const cur = sp != null && sp < bp ? sp : bp;
                const dis = cur < bp ? Math.round((1 - cur / bp) * 100) : 0;

                return <Link key={p.id} href={TELEGRAM_ROUTES.PRODUCT(p.id)} className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] transition-transform active:scale-[0.98]">
                    <div className="relative aspect-[3/4] bg-[var(--color-surface2)]">
                        <img src={p.thumbnail || 'https://placehold.co/400x533/f5f5f5/ccc?text=No+Image'} alt={p.name} className="h-full w-full object-cover" />
                        {dis > 0 ? <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-[9px] font-black text-white">-{dis}%</span> : null}
                        <button onClick={(e) => toggleFav(e, p.id)} className={cn('absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm', favs.has(p.id) ? 'border-red-200 bg-white/92 text-red-500' : 'border-white/30 bg-[var(--color-surface)]/80 text-[var(--color-hint)]')}>
                            <Heart size={14} className={cn(favs.has(p.id) && 'fill-current text-red-500')} />
                        </button>
                    </div>
                    <div className="p-3">
                        <p className="truncate text-[10px] font-medium text-[var(--color-hint)]">{p.store_name}</p>
                        <h3 className="mt-0.5 line-clamp-2 text-[13px] font-bold text-[var(--color-text)]">{p.name}</h3>
                        <p className="mt-1 text-[14px] font-black text-[var(--color-primary)]">{formatPrice(cur, 'UZS', language)}</p>
                        {dis > 0 ? <span className="text-[11px] text-[var(--color-hint)] line-through">{formatPrice(bp, 'UZS', language)}</span> : null}
                    </div>
                </Link>;
            })}</div>}
        </div>
    );
}
