'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, Loader2, Package, Search, X, SlidersHorizontal, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { cn } from '../../../src/shared/lib/utils';
import { useSettingsStore } from '../../../src/features/settings/model';
const BannerCarousel = dynamic(() => import('../../../src/shared/ui/BannerCarousel').then(m => m.BannerCarousel), { ssr: false });

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

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const UZ_MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const UZ_DAYS   = ['Du','Se','Ch','Pa','Ju','Sh','Ya'];

function formatDateLabel(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)} ${UZ_MONTHS[parseInt(m) - 1]} ${y}`;
}

function MiniCalendar({ selected, onSelect }: { selected: string; onSelect: (iso: string) => void }) {
  const today = new Date();
  const [year, setYear]   = useState(selected ? parseInt(selected.split('-')[0]) : today.getFullYear());
  const [month, setMonth] = useState(selected ? parseInt(selected.split('-')[1]) - 1 : today.getMonth());

  const firstDay    = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
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
    <div className="rounded-[16px] border border-black/8 dark:border-white/8 bg-[#f8f9fb] dark:bg-[#111111] p-4 select-none w-72">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ChevronLeft size={16} className="text-[#9ca3af]" />
        </button>
        <span className="text-[14px] font-bold text-[#111111] dark:text-white">{UZ_MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ChevronRight size={16} className="text-[#9ca3af]" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {UZ_DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-bold text-[#9ca3af] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const iso = toIso(day);
          const isSelected = iso === selected;
          const isToday    = iso === todayIso;
          return (
            <button key={i} onClick={() => onSelect(iso)}
              className={cn(
                'h-9 w-full rounded-lg text-[13px] font-semibold transition-all',
                isSelected ? 'bg-[#00c853] text-white' :
                isToday    ? 'border border-[#00c853] text-[#00c853]' :
                             'text-[#111111] dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
              )}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('marketplace_token') : null;
}

export default function ClothingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; name_uz: string | null; name_ru: string | null; name_en: string | null }[]>([]);
  const lang = useSettingsStore((s) => s.settings.language);
  const [activeCategory, setActiveCategory] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [minDiscount, setMinDiscount] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [calOpen, setCalOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilterCount =
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (sizeFilter ? 1 : 0) +
    (minDiscount ? 1 : 0) +
    (createdFrom ? 1 : 0);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        const rows: { product_id: string }[] = json?.data ?? json ?? [];
        setFavIds(new Set(rows.map((r) => r.product_id)));
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
    minPrice: string; maxPrice: string; sizeFilter: string; minDiscount: string; createdFrom: string;
  }) => {
    setLoading(true);
    const p = new URLSearchParams({ limit: '80' });
    if (params.category) p.set('category', params.category);
    if (params.query.trim()) p.set('search', params.query.trim());
    if (params.minPrice) p.set('min_price', params.minPrice);
    if (params.maxPrice) p.set('max_price', params.maxPrice);
    if (params.sizeFilter) p.set('size', params.sizeFilter);
    if (params.minDiscount) p.set('min_discount', params.minDiscount);
    if (params.createdFrom) p.set('created_from', params.createdFrom);
    fetch(`/api/products?${p}`)
      .then((r) => r.json())
      .then((json) => { setProducts(json.data?.products ?? json.products ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const triggerFetch = useCallback((immediate = false) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const go = () => doFetch({ query, category: activeCategory, minPrice, maxPrice, sizeFilter, minDiscount, createdFrom });
    if (immediate) go();
    else debounceRef.current = setTimeout(go, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeCategory, minPrice, maxPrice, sizeFilter, minDiscount, createdFrom, doFetch]);

  useEffect(() => {
    triggerFetch(false);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [triggerFetch]);

  const clearFilters = () => {
    setMinPrice(''); setMaxPrice(''); setSizeFilter('');
    setMinDiscount(''); setCreatedFrom(''); setCalOpen(false);
  };

  return (
    <section className="mx-auto max-w-[1280px] px-6 md:px-10 py-12 md:py-16">
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645]">Barcha mahsulotlar</p>
        <h1 className="mt-1.5 font-[family-name:var(--font-playfair)] text-[clamp(2rem,5vw,3.5rem)] font-black tracking-tight text-[#111111] dark:text-white">Mahsulotlar</h1>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mahsulot qidirish..."
            className="h-11 w-full rounded-full border border-black/10 bg-white pl-10 pr-10 text-[14px] text-[#111111] outline-none placeholder:text-[#9ca3af] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white focus:ring-2 ring-[#00c853]/20"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-black/5 rounded-full">
              <X size={13} className="text-[#9ca3af]" />
            </button>
          )}
        </div>
        <button
          onClick={() => setFilterOpen(o => !o)}
          className={cn(
            'relative shrink-0 w-11 h-11 flex items-center justify-center rounded-full border transition-all',
            filterOpen || activeFilterCount > 0
              ? 'bg-[#00c853] border-[#00c853] text-white'
              : 'bg-white dark:bg-[#1a1a1a] border-black/10 dark:border-white/10 text-[#9ca3af] hover:border-[#00c853]/40'
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
        <div className="mb-6 bg-white dark:bg-[#1a1a1a] rounded-[20px] border border-black/8 dark:border-white/8 p-5 space-y-5">
          {/* Date from */}
          <div>
            <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Yaratilgan sana (dan)</p>
            {createdFrom ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00c853]/10 border border-[#00c853]/20 text-[13px] font-semibold text-[#008d3a] dark:text-[#00c853]">
                  <CalendarDays size={14} />
                  {formatDateLabel(createdFrom)} dan
                </span>
                <button onClick={() => { setCreatedFrom(''); setCalOpen(false); }}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                  <X size={12} className="text-[#9ca3af]" />
                </button>
                <button onClick={() => setCalOpen(o => !o)}
                  className="text-[12px] font-semibold text-[#9ca3af] hover:text-[#111111] dark:hover:text-white underline">
                  O&apos;zgartirish
                </button>
              </div>
            ) : (
              <button onClick={() => setCalOpen(o => !o)}
                className={cn('flex items-center gap-2 px-4 py-1.5 rounded-full border text-[13px] font-semibold transition-all',
                  calOpen
                    ? 'bg-[#00c853] text-white border-[#00c853]'
                    : 'bg-[#f8f9fb] dark:bg-[#0f0f0f] text-[#111111] dark:text-white border-black/8 dark:border-white/8 hover:border-[#00c853]/40'
                )}>
                <CalendarDays size={15} />
                Sana tanlash
              </button>
            )}
            {calOpen && (
              <div className="mt-3">
                <MiniCalendar
                  selected={createdFrom}
                  onSelect={iso => { setCreatedFrom(iso); setCalOpen(false); }}
                />
              </div>
            )}
          </div>

          {/* Price range */}
          <div>
            <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Narx oralig&apos;i (so&apos;m)</p>
            <div className="grid grid-cols-2 gap-3">
              <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min narx"
                type="number"
                className="h-10 bg-[#f8f9fb] dark:bg-[#0f0f0f] border border-black/8 dark:border-white/8 rounded-xl px-3 text-[13px] text-[#111111] dark:text-white outline-none focus:ring-2 ring-[#00c853]/20" />
              <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max narx"
                type="number"
                className="h-10 bg-[#f8f9fb] dark:bg-[#0f0f0f] border border-black/8 dark:border-white/8 rounded-xl px-3 text-[13px] text-[#111111] dark:text-white outline-none focus:ring-2 ring-[#00c853]/20" />
            </div>
          </div>

          {/* Size */}
          <div>
            <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">O&apos;lcham</p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map(s => (
                <button key={s} onClick={() => setSizeFilter(sizeFilter === s ? '' : s)}
                  className={cn('h-10 px-3 rounded-xl text-[13px] font-bold border transition-all',
                    sizeFilter === s
                      ? 'bg-[#00c853] text-white border-[#00c853]'
                      : 'bg-[#f8f9fb] dark:bg-[#0f0f0f] text-[#111111] dark:text-white border-black/8 dark:border-white/8 hover:border-[#00c853]/40'
                  )}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Min discount + clear */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Aksiya (kamida %)</p>
              <div className="flex items-center gap-2">
                <input value={minDiscount} onChange={e => setMinDiscount(e.target.value)}
                  type="number" min="1" max="99" placeholder="20"
                  className="h-10 w-24 bg-[#f8f9fb] dark:bg-[#0f0f0f] border border-black/8 dark:border-white/8 rounded-xl px-3 text-[13px] text-[#111111] dark:text-white outline-none focus:ring-2 ring-[#00c853]/20" />
                <span className="text-[13px] text-[#9ca3af]">% va undan ko&apos;p chegirma</span>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters}
                className="px-4 py-2 rounded-full border border-red-400/30 text-red-500 text-[13px] font-semibold bg-red-500/5 hover:bg-red-500/10 transition-all self-end">
                Tozalash
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2 pb-1">
          <button
            onClick={() => setActiveCategory('')}
            className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] transition-all border ${activeCategory === '' ? 'bg-[#111111] text-white border-transparent shadow dark:bg-white dark:text-[#111111]' : 'bg-white border-black/10 text-[#6b7280] hover:border-black/20 hover:text-[#111111] dark:bg-[#1a1a1a] dark:border-white/10 dark:text-[#9ca3af]'}`}
          >
            Barchasi
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] transition-all border ${activeCategory === cat.id ? 'bg-[#111111] text-white border-transparent shadow dark:bg-white dark:text-[#111111]' : 'bg-white border-black/10 text-[#6b7280] hover:border-black/20 hover:text-[#111111] dark:bg-[#1a1a1a] dark:border-white/10 dark:text-[#9ca3af]'}`}
            >
              {lang === 'ru' ? (cat.name_ru || cat.name) : lang === 'en' ? (cat.name_en || cat.name) : (cat.name_uz || cat.name)}
            </button>
          ))}
        </div>
      )}

      <div className="mb-6">
        <BannerCarousel variant="desktop" />
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={32} className="animate-spin text-[#00c853]" />
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 text-center">
          <Package size={42} className="mx-auto mb-4 text-[#d1d5db]" />
          <p className="text-[15px] text-[#9ca3af]">Mahsulotlar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group rounded-3xl border border-black/5 bg-[#f8f9fb] p-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_55px_-25px_rgba(0,0,0,0.22)] dark:border-white/5 dark:bg-[#1a1a1a]"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white dark:bg-[#242424]">
                {product.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.thumbnail} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#f3f4f6]">
                    <Package size={32} className="text-[#d1d5db]" />
                  </div>
                )}
                <button
                  onClick={(e) => toggleFav(e, product.id)}
                  disabled={toggling.has(product.id)}
                  className={`absolute right-3 top-3 rounded-full p-2.5 backdrop-blur-md border transition-all disabled:opacity-60 ${
                    favIds.has(product.id)
                      ? 'border-[#00c853]/40 bg-[#00c853] text-[#06200f]'
                      : 'border-white/30 bg-white/15 text-white hover:bg-[#00c853] hover:text-[#06200f]'
                  }`}
                >
                  {toggling.has(product.id)
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Heart size={13} className={favIds.has(product.id) ? 'fill-current' : ''} />
                  }
                </button>
              </div>
              <div className="px-1 pt-4 pb-1">
                {product.category_name && (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">{product.category_name}</p>
                )}
                <h3 className="mt-1 line-clamp-1 text-[14px] font-extrabold text-[#111111] dark:text-white">{product.name}</h3>
                <p className="mt-0.5 text-[11px] text-[#9ca3af]">{product.store_name}</p>
                <div className="mt-2.5">
                  {(() => {
                    const bp = Number(product.base_price);
                    const sp = product.sale_price != null ? Number(product.sale_price) : null;
                    const cur = sp != null && sp < bp ? sp : bp;
                    const hasDis = cur < bp;
                    const pct = hasDis ? Math.round((1 - cur / bp) * 100) : 0;
                    const fmt = (n: number) => n.toLocaleString('ru-RU');
                    return (
                      <>
                        <span className="text-[17px] font-black text-[#00c853]">
                          {fmt(cur)} so&apos;m
                        </span>
                        {hasDis && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[12px] text-[#9ca3af] line-through">{fmt(bp)} so&apos;m</span>
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">−{pct}%</span>
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
