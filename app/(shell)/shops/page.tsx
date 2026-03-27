'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, MapPin, Search, Store as StoreIcon } from 'lucide-react';
import { useWebI18n } from '../../../src/shared/lib/webI18n';

interface Store {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  product_count: number;
  owner_name: string;
  created_at: string;
}

const DEFAULT_STORE_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop";

export default function ShopsPage() {
  const { w } = useWebI18n();
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = debouncedSearch.trim() ? `?search=${encodeURIComponent(debouncedSearch.trim())}&limit=50` : '?limit=50';
    fetch(`/api/stores${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        setStores(json.data?.stores ?? json.stores ?? []);
        setLoading(false);
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

      {/* Hero */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop"
          alt="Shops"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8af9b3]">{w.shops.marketplace}</p>
          <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-[clamp(2.5rem,6vw,4.5rem)] font-black text-white leading-none">
            {w.shops.fashionShops}
          </h1>
          <p className="mt-3 max-w-sm text-[14px] text-white/70">{w.shops.desc}</p>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-10 md:py-14">

        {/* Search */}
        <div className="mb-8">
          <label className="flex items-center gap-3 h-12 rounded-full border border-black/10 bg-white px-5 w-full sm:max-w-xl shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
            <Search size={15} className="text-[#9ca3af] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={w.shops.searchPlaceholder}
              className="w-full bg-transparent text-[13px] text-[#111111] outline-none placeholder:text-[#9ca3af] dark:text-white"
            />
          </label>
        </div>

        <p className="mb-6 text-[12px] font-semibold text-[#9ca3af] uppercase tracking-[0.12em]">
          {loading ? w.shops.loading : `${stores.length} ${w.shops.found}`}
        </p>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-3xl border border-black/5 bg-[#f8f9fb] p-3 animate-pulse dark:border-white/5 dark:bg-[#1a1a1a]">
                <div className="h-52 rounded-2xl bg-black/8 dark:bg-white/8" />
                <div className="mt-4 px-1 space-y-2">
                  <div className="h-4 w-2/3 rounded-full bg-black/8 dark:bg-white/8" />
                  <div className="h-3 w-1/2 rounded-full bg-black/5 dark:bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="py-24 text-center">
            <StoreIcon size={42} className="mx-auto mb-4 text-[#d1d5db]" />
            <p className="text-[15px] text-[#9ca3af]">{w.shops.none}</p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-5 inline-flex h-10 items-center rounded-full bg-[#111111] px-6 text-[11px] font-black uppercase tracking-[0.14em] text-white hover:bg-[#13ec37] hover:text-[#06200f] transition-all">
                {w.shops.clear}
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <Link
                key={store.id}
                href={`/store/${store.id}`}
                className="group rounded-3xl border border-black/5 bg-[#f8f9fb] p-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_55px_-25px_rgba(0,0,0,0.22)] block dark:border-white/5 dark:bg-[#1a1a1a]"
              >
                <div className="relative h-52 overflow-hidden rounded-2xl bg-black/5">
                  <img
                    src={store.image_url || DEFAULT_STORE_IMAGE}
                    alt={store.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  {Number(store.product_count) > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-white/15 border border-white/30 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white">
                      {store.product_count} {w.shops.items}
                    </span>
                  )}
                  <div className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 group-hover:bg-[#13ec37]">
                    <ArrowRight size={14} className="text-[#06200f]" />
                  </div>
                </div>
                <div className="px-1 pt-4 pb-1">
                  <h3 className="line-clamp-1 text-[16px] font-extrabold text-[#111111] dark:text-white">{store.name}</h3>
                  <p className="mt-1 text-[12px] text-[#9ca3af]">{store.owner_name}</p>
                  {store.address && (
                    <div className="mt-2 flex items-start gap-1.5 text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{store.address.replace(/\s*Coordinates:.*$/i, '')}</span>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-[#9ca3af]">{store.product_count} ta mahsulot</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
