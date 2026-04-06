'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Heart, Loader2, Package, Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../../src/shared/lib/utils';
import { useSettingsStore } from '../../../src/features/settings/model';
import { useTranslation } from '../../../src/shared/lib/i18n';
import { useTranslatedLabelMap } from '../../../src/shared/hooks/useTranslatedLabelMap';
import { sanitizeProductLabel } from '../../../src/shared/lib/webProductText';
import { formatPrice } from '../../../src/shared/lib/formatPrice';

interface Product {
  id: string;
  name: string;
  base_price: number;
  sale_price: number | null;
  thumbnail: string | null;
  category_name: string | null;
  store_name: string;
  store_id: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('marketplace_token') : null;
}

export default function ClothingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; name_uz: string | null; name_ru: string | null; name_en: string | null; sticker?: string | null; parent_id?: string | null }[]>([]);
  const lang = useSettingsStore((s) => s.settings.language);
  const { t, language } = useTranslation();
  const [activeParentCategory, setActiveParentCategory] = useState('');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState<Set<string>>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('fav_ids_cache') : null;
      return cached ? new Set<string>(JSON.parse(cached)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minDiscount, setMinDiscount] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parentCategories = useMemo(() => categories.filter((cat) => !cat.parent_id), [categories]);
  const subcategories = useMemo(() => categories.filter((cat) => cat.parent_id === activeParentCategory), [categories, activeParentCategory]);

  const activeFilterCount =
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minDiscount ? 1 : 0);
  const translatedNames = useTranslatedLabelMap(products.map((product) => ({ id: product.id, label: product.name })), language);
  const categoryLabel = (cat: { id: string; name: string; name_uz: string | null; name_ru: string | null; name_en: string | null; parent_id?: string | null; sticker?: string | null }) =>
    lang === 'ru' ? (cat.name_ru || cat.name) : lang === 'en' ? (cat.name_en || cat.name) : (cat.name_uz || cat.name);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        const rows: { product_id: string }[] = json?.data ?? json ?? [];
        const ids = rows.map((r) => r.product_id);
        setFavIds(new Set(ids));
        try { localStorage.setItem('fav_ids_cache', JSON.stringify(ids)); } catch { /* noop */ }
      })
      .catch(() => {});
  }, []);

  const toggleFav = useCallback(async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setToggling((p) => { const s = new Set(p); s.add(productId); return s; });
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: productId }),
      });
      if (res.ok) {
        const json = await res.json();
        const favorited = json.data?.favorited ?? json.favorited;
        setFavIds((prev) => {
          const s = new Set(prev);
          favorited ? s.add(productId) : s.delete(productId);
          try { localStorage.setItem('fav_ids_cache', JSON.stringify([...s])); } catch { /* noop */ }
          return s;
        });
      }
    } catch { /* noop */ } finally {
      setToggling((p) => { const s = new Set(p); s.delete(productId); return s; });
    }
  }, []);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((json) => setCategories(json.data?.categories ?? json.categories ?? []));
  }, []);

  const doFetch = useCallback((params: {
    query: string; category: string;
    minPrice: string; maxPrice: string; minDiscount: string;
  }) => {
    setLoading(true);
    const p = new URLSearchParams({ limit: '80' });
    if (params.category) p.set('category', params.category);
    if (params.query.trim()) p.set('search', params.query.trim());
    if (params.minPrice) p.set('min_price', params.minPrice);
    if (params.maxPrice) p.set('max_price', params.maxPrice);
    if (params.minDiscount) p.set('min_discount', params.minDiscount);
    fetch(`/api/products?${p}`)
      .then((r) => r.json())
      .then((json) => { setProducts(json.data?.products ?? json.products ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const triggerFetch = useCallback((immediate = false) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const go = () => doFetch({ query, category: activeSubcategory || (subcategories.length === 0 ? activeParentCategory : ''), minPrice, maxPrice, minDiscount });
    if (immediate) go();
    else debounceRef.current = setTimeout(go, 400);
  }, [query, activeParentCategory, activeSubcategory, subcategories.length, minPrice, maxPrice, minDiscount, doFetch]);

  useEffect(() => {
    triggerFetch(false);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [triggerFetch]);

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinDiscount('');
  };

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-12 md:px-10 md:py-16">
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645]">{t.all_products_badge}</p>
        <h1 className="mt-1.5 font-[family-name:var(--font-playfair)] text-[clamp(2rem,5vw,3.5rem)] font-black tracking-tight text-[#111111] dark:text-white">{t.products_page_title}</h1>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder_search}
            className="h-11 w-full rounded-full border border-black/10 bg-white pl-10 pr-10 text-[14px] text-[#111111] outline-none placeholder:text-[#9ca3af] ring-[#00c853]/20 focus:ring-2 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/5">
              <X size={13} className="text-[#9ca3af]" />
            </button>
          )}
        </div>
        <button
          onClick={() => setFilterOpen((open) => !open)}
          className={cn(
            'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all',
            filterOpen || activeFilterCount > 0
              ? 'border-[#13ec37] bg-[#13ec37] text-white'
              : 'border-black/10 bg-white text-[#9ca3af] hover:border-[#00c853]/40 dark:border-white/10 dark:bg-[#1a1a1a]'
          )}
        >
          <SlidersHorizontal size={18} />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

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
                  {t.min}: {minPrice}
                  <X size={12} />
                </button>
              )}
              {maxPrice && (
                <button type="button" onClick={() => setMaxPrice('')} className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-semibold text-[#374151] dark:bg-white/8 dark:text-white">
                  {t.max}: {maxPrice}
                  <X size={12} />
                </button>
              )}
              {minDiscount && (
                <button type="button" onClick={() => setMinDiscount('')} className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-semibold text-[#374151] dark:bg-white/8 dark:text-white">
                  {minDiscount}%+
                  <X size={12} />
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
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    type="number"
                    className="mt-1 w-full bg-transparent text-[14px] font-semibold text-[#111111] outline-none placeholder:text-[#c0c6d4] dark:text-white"
                  />
                </label>
                <label className="rounded-[18px] border border-black/8 bg-white px-3 py-2.5 dark:border-white/8 dark:bg-[#1a1a1a]">
                  <span className="text-[11px] font-semibold text-[#9ca3af]">{t.max}</span>
                  <input
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="1000000"
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
                <input
                  value={minDiscount}
                  onChange={(e) => setMinDiscount(e.target.value)}
                  type="number"
                  min="1"
                  max="99"
                  placeholder="20"
                  className="h-11 w-24 rounded-[16px] border border-black/8 bg-white px-3 text-[13px] font-semibold text-[#111111] outline-none ring-[#00c853]/20 focus:ring-2 dark:border-white/8 dark:bg-[#1a1a1a] dark:text-white"
                />
                <span className="text-[13px] text-[#9ca3af]">% va undan ko&apos;p</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2 pb-1">
          <button
            onClick={() => { setActiveParentCategory(''); setActiveSubcategory(''); }}
            className={`rounded-full border px-5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-all ${activeParentCategory === '' && activeSubcategory === '' ? 'border-transparent bg-[#111111] text-white shadow dark:bg-white dark:text-[#111111]' : 'border-black/10 bg-white text-[#6b7280] hover:border-[#00c853]/45 hover:bg-[#f1fff4] hover:text-[#008d3a] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-[#9ca3af] dark:hover:bg-[#122117] dark:hover:text-[#84f89b]'}`}
          >
            {t.all}
          </button>
          {parentCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                const nextParent = activeParentCategory === cat.id ? '' : cat.id;
                setActiveParentCategory(nextParent);
                setActiveSubcategory('');
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-all ${activeParentCategory === cat.id ? 'border-transparent bg-[#111111] text-white shadow dark:bg-white dark:text-[#111111]' : 'border-black/10 bg-white text-[#6b7280] hover:border-[#00c853]/45 hover:bg-[#f1fff4] hover:text-[#008d3a] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-[#9ca3af] dark:hover:bg-[#122117] dark:hover:text-[#84f89b]'}`}
            >
              {cat.sticker ? (
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[16px] leading-none ${activeParentCategory === cat.id ? 'bg-white/16 dark:bg-black/10' : 'bg-[#f3f4f6] dark:bg-white/10'}`}>
                  {cat.sticker}
                </span>
              ) : null}
              <span>{categoryLabel(cat)}</span>
            </button>
          ))}
        </div>
      )}

      {activeParentCategory && subcategories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2 pb-1">
          {subcategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveSubcategory(activeSubcategory === cat.id ? '' : cat.id)}
              className={`rounded-full border px-5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-all ${activeSubcategory === cat.id ? 'border-[#13ec37] bg-[#13ec37] text-[#052e14] shadow' : 'border-black/10 bg-white text-[#6b7280] hover:border-[#00c853]/45 hover:bg-[#f1fff4] hover:text-[#008d3a] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-[#9ca3af] dark:hover:bg-[#122117] dark:hover:text-[#84f89b]'}`}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={32} className="animate-spin text-[#00c853]" />
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 text-center">
          <Package size={42} className="mx-auto mb-4 text-[#d1d5db]" />
          <p className="text-[15px] text-[#9ca3af]">{t.no_results}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 min-[460px]:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group rounded-3xl border border-black/5 bg-[#f8f9fb] p-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_55px_-25px_rgba(0,0,0,0.22)] dark:border-white/5 dark:bg-[#1a1a1a]"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white dark:bg-[#242424]">
                {product.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.thumbnail} alt={sanitizeProductLabel(translatedNames[product.id] ?? product.name, language)} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#f3f4f6]">
                    <Package size={32} className="text-[#d1d5db]" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={(event) => toggleFav(event, product.id)}
                  disabled={toggling.has(product.id)}
                  className={`absolute right-3 top-3 z-10 rounded-full border p-2.5 backdrop-blur-md transition-all disabled:opacity-60 ${favIds.has(product.id) ? 'border-red-200 bg-white/92 text-red-500' : 'border-white/30 bg-white/15 text-white hover:bg-white/90 hover:text-[#111111]'}`}
                >
                  {toggling.has(product.id)
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Heart size={13} className={favIds.has(product.id) ? 'fill-current text-red-500' : ''} />
                  }
                </button>
              </div>
              <div className="px-1 pb-1 pt-4">
                {product.category_name && (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">{product.category_name}</p>
                )}
                <h3 className="mt-1 line-clamp-1 text-[14px] font-extrabold text-[#111111] dark:text-white">{sanitizeProductLabel(translatedNames[product.id] ?? product.name, language)}</h3>
                <p className="mt-0.5 text-[11px] text-[#9ca3af]">{product.store_name}</p>
                <div className="mt-2.5">
                  {(() => {
                    const bp = Number(product.base_price);
                    const sp = product.sale_price != null ? Number(product.sale_price) : null;
                    const cur = sp != null && sp < bp ? sp : bp;
                    const hasDis = cur < bp;
                    const pct = hasDis ? Math.round((1 - cur / bp) * 100) : 0;
                    return (
                      <>
                        <span className="text-[17px] font-black text-[#00c853]">
                          {formatPrice(cur, 'UZS', language)}
                        </span>
                        {hasDis && (
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="text-[12px] text-[#9ca3af] line-through">{formatPrice(bp, 'UZS', language)}</span>
                            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">-{pct}%</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
