'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Star } from 'lucide-react';
import { mockApi } from '../../../src/services/mockServer';
import type { Product } from '../../../src/shared/types';
import { formatPrice } from '../../../src/shared/lib/formatPrice';
import { cn } from '../../../src/shared/lib/utils';
import { useWebI18n } from '../../../src/shared/lib/webI18n';

const ALL_CATS = ['All', 'Jackets', 'Shirts', 'Shoes', 'Pants', 'Hoodies', 'Accessories', 'T-Shirts'] as const;
type Cat = (typeof ALL_CATS)[number];

export default function ShopPage() {
    const { w, tc } = useWebI18n();
    const [products, setProducts] = useState<Product[]>([]);
    const [active, setActive] = useState<Cat>('All');
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLElement>(null);

    useEffect(() => { mockApi.listProducts().then(setProducts); }, []);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.05 });
        obs.observe(el); return () => obs.disconnect();
    }, []);

    const filtered = useMemo(() => active === 'All' ? products : products.filter(p => p.category === active), [active, products]);
    const toggle = (id: string) => setWishlist(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    return (
        <section ref={ref as React.RefObject<HTMLElement>} className={cn('mx-auto max-w-[1280px] px-6 md:px-10 py-12 md:py-16 transition-all duration-700', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')}>
            {/* Heading */}
            <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645]">{w.shopPage.allProducts}</p>
                <h1 className="mt-1.5 font-[family-name:var(--font-playfair)] text-[clamp(2rem,5vw,3.5rem)] font-black tracking-tight text-[#111111]">{w.shopPage.shopEverything}</h1>
            </div>

            {/* Filters */}
            <div className="no-scrollbar mb-8 flex flex-nowrap gap-2 overflow-x-auto pb-1">
                {ALL_CATS.map(cat => (
                    <button key={cat} onClick={() => setActive(cat)}
                        className={cn('shrink-0 px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] transition-all duration-200 border',
                            active === cat ? 'bg-[#111111] text-white border-transparent shadow' : 'bg-white border-black/10 text-[#6b7280] hover:border-black/20 hover:text-[#111111]')}>
                        {tc(cat)}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-4">
                {filtered.map(product => {
                    const seed = product.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                    const off = 10 + (seed % 30);
                    const oldPrice = Math.round((product.price * 1.2) / 1000) * 1000;
                    const rating = 3 + (seed % 3);
                    const img1 = product.images[0] || 'https://placehold.co/640x800/f8f8f8/ccc?text=Product';
                    const inWish = wishlist.has(product.id);
                    return (
                        <div key={product.id} className="group rounded-3xl border border-black/5 bg-[#f8f9fb] p-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_55px_-25px_rgba(0,0,0,0.22)]">
                            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white">
                                <img src={img1} alt={product.title} className="absolute inset-0 h-full w-full object-cover" />
                                <span className="absolute left-3 top-3 rounded-full bg-[#111111] px-2.5 py-1 text-[10px] font-black text-white">-{off}%</span>
                                <button onClick={() => toggle(product.id)} className={cn('absolute right-3 top-3 rounded-full border p-2.5 backdrop-blur-md transition-all', inWish ? 'border-red-200 bg-white/92 text-red-500' : 'border-white/30 bg-white/15 text-white')}>
                                    <Heart size={13} className={inWish ? 'fill-current text-red-500' : ''} />
                                </button>
                            </div>
                            <div className="px-1 pt-4 pb-1">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">{tc(product.category)}</p>
                                <h3 className="mt-1 line-clamp-1 text-[14px] font-extrabold text-[#111111]">{product.title}</h3>
                                <div className="mt-1.5 flex items-center gap-0.5">
                                    {Array.from({ length: 5 }, (_, i) => <Star key={i} size={11} className={i < rating ? 'fill-[#00c853] text-[#00c853]' : 'text-[#e5e7eb]'} />)}
                                </div>
                                <div className="mt-2.5 flex items-end gap-2">
                                    <span className="text-[17px] font-black text-[#111111]">{formatPrice(product.price, product.currency)}</span>
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
