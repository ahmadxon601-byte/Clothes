'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, Loader2, Package, Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  base_price: number;
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
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '60' });
    if (activeCategory) params.set('category', activeCategory);
    if (query.trim()) params.set('search', query.trim());
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((json) => {
        setProducts(json.data?.products ?? json.products ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeCategory, query]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className={`mx-auto max-w-[1280px] px-6 md:px-10 py-12 md:py-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645]">Barcha mahsulotlar</p>
        <h1 className="mt-1.5 font-[family-name:var(--font-playfair)] text-[clamp(2rem,5vw,3.5rem)] font-black tracking-tight text-[#111111] dark:text-white">Mahsulotlar</h1>
      </div>

      <div className="mb-5">
        <div className="flex h-11 items-center gap-2.5 rounded-full border border-black/10 bg-white px-4 dark:border-white/10 dark:bg-[#1a1a1a]">
          <Search size={16} className="text-[#9ca3af]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mahsulot qidirish..."
            className="h-full w-full bg-transparent text-[14px] text-[#111111] outline-none placeholder:text-[#9ca3af] dark:text-white"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="no-scrollbar mb-8 flex flex-nowrap gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory('')}
            className={`shrink-0 px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] transition-all border ${activeCategory === '' ? 'bg-[#111111] text-white border-transparent shadow dark:bg-white dark:text-[#111111]' : 'bg-white border-black/10 text-[#6b7280] hover:border-black/20 hover:text-[#111111] dark:bg-[#1a1a1a] dark:border-white/10 dark:text-[#9ca3af]'}`}
          >
            Barchasi
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] transition-all border ${activeCategory === cat.id ? 'bg-[#111111] text-white border-transparent shadow dark:bg-white dark:text-[#111111]' : 'bg-white border-black/10 text-[#6b7280] hover:border-black/20 hover:text-[#111111] dark:bg-[#1a1a1a] dark:border-white/10 dark:text-[#9ca3af]'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-3xl border border-black/5 bg-[#f8f9fb] p-3 animate-pulse dark:border-white/5 dark:bg-[#1a1a1a]">
              <div className="aspect-[3/4] rounded-2xl bg-black/8 dark:bg-white/8" />
              <div className="mt-3 space-y-2 px-1">
                <div className="h-3 w-2/3 rounded-full bg-black/8" />
                <div className="h-4 w-1/2 rounded-full bg-black/8" />
              </div>
            </div>
          ))}
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
                  <span className="text-[17px] font-black text-[#111111] dark:text-white">
                    {Number(product.base_price).toLocaleString()} so&apos;m
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
