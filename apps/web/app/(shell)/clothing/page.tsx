'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Search, Star } from 'lucide-react';
import { mockApi } from '../../../src/services/mockServer';
import type { Product } from '../../../src/shared/types';
import { formatPrice } from '../../../src/shared/lib/formatPrice';
import { cn } from '../../../src/shared/lib/utils';
import { useWebI18n } from '../../../src/shared/lib/webI18n';
import { useFavoritesStore } from '../../../src/features/favorites/model';

const CLOTHING_CATS = ['All Clothing', 'Jackets', 'Shirts', 'Pants', 'Hoodies', 'T-Shirts'];

export default function ClothingPage() {
    const { w, tc } = useWebI18n();
    const { favorites, toggleFavorite } = useFavoritesStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [active, setActive] = useState('All Clothing');
    const [query, setQuery] = useState('');
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLElement>(null);

    useEffect(() => { mockApi.listProducts().then(setProducts); }, []);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.05 });
        obs.observe(el); return () => obs.disconnect();
    }, []);

    const CLOTHING_KEYS = ['Jackets', 'Shirts', 'Pants', 'Hoodies', 'T-Shirts'];
    const filtered = useMemo(() => {
        const base = products.filter(p => CLOTHING_KEYS.includes(p.category));
        const byCategory = active === 'All Clothing' ? base : base.filter(p => p.category === active);
        const q = query.trim().toLowerCase();
        if (!q) return byCategory;
        return byCategory.filter((p) =>
            p.title.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
    }, [active, products, query]);

    return (
        <section ref={ref as React.RefObject<HTMLElement>} className={cn('mx-auto max-w-[1280px] px-6 md:px-10 py-12 md:py-16 transition-all duration-700', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')}>
            <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645]">{w.clothingPage.category}</p>
                <h1 className="mt-1.5 font-[family-name:var(--font-playfair)] text-[clamp(2rem,5vw,3.5rem)] font-black tracking-tight text-[#111111] dark:text-white">{w.clothingPage.title}</h1>
            </div>
            <div className="mb-5">
                <div className="flex h-11 items-center gap-2.5 rounded-full border border-black/10 bg-white px-4 dark:border-white/10 dark:bg-[#1a1a1a]">
                    <Search size={16} className="text-[#9ca3af]" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search products..."
                        className="h-full w-full bg-transparent text-[14px] text-[#111111] outline-none placeholder:text-[#9ca3af] dark:text-white"
                    />
                </div>
            </div>
            <div className="no-scrollbar mb-8 flex flex-nowrap gap-2 overflow-x-auto pb-1">
                {CLOTHING_CATS.map(cat => (
                    <button key={cat} onClick={() => setActive(cat)}
                        className={cn('shrink-0 px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] transition-all border',
                            active === cat ? 'bg-[#111111] text-white border-transparent shadow dark:bg-white dark:text-[#111111]' : 'bg-white border-black/10 text-[#6b7280] hover:border-black/20 hover:text-[#111111] dark:bg-[#1a1a1a] dark:border-white/10 dark:text-[#9ca3af] dark:hover:border-white/20 dark:hover:text-white')}>
                        {tc(cat)}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-4">
                {filtered.map(product => {
                    const seed = product.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                    const off = 10 + (seed % 30);
                    const oldPrice = Math.round((product.price * 1.2) / 1000) * 1000;
                    const rating = 3 + (seed % 3);
                    const img1 = product.images[0] || 'https://placehold.co/640x800/f8f8f8/ccc?text=Product';
                    const inWish = favorites.includes(product.id);
                    return (
                        <div key={product.id} className="group rounded-3xl border border-black/5 bg-[#f8f9fb] p-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_55px_-25px_rgba(0,0,0,0.22)] dark:border-white/5 dark:bg-[#1a1a1a]">
                            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white dark:bg-[#242424]">
                                <img src={img1} alt={product.title} className="absolute inset-0 h-full w-full object-cover" />
                                <span className="absolute left-3 top-3 rounded-full bg-[#111111] px-2.5 py-1 text-[10px] font-black text-white">-{off}%</span>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        void toggleFavorite(product.id);
                                    }}
                                    className={cn('absolute right-3 top-3 rounded-full p-2.5 backdrop-blur-md transition-all', inWish ? 'bg-[#00c853] text-[#06200f]' : 'border border-white/30 bg-white/15 text-white')}
                                >
                                    <Heart size={13} className={inWish ? 'fill-current' : ''} />
                                </button>
                            </div>
                            <div className="px-1 pt-4 pb-1">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">{tc(product.category)}</p>
                                <h3 className="mt-1 line-clamp-1 text-[14px] font-extrabold text-[#111111] dark:text-white">{product.title}</h3>
                                <div className="mt-1.5 flex items-center gap-0.5">
                                    {Array.from({ length: 5 }, (_, i) => <Star key={i} size={11} className={i < rating ? 'fill-[#00c853] text-[#00c853]' : 'text-[#e5e7eb]'} />)}
                                </div>
                                <div className="mt-2.5 flex items-end gap-2">
                                    <span className="text-[17px] font-black text-[#111111] dark:text-white">{formatPrice(product.price, product.currency)}</span>
                                    <span className="text-[12px] text-[#c4c9d4] line-through">{formatPrice(oldPrice, product.currency)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
