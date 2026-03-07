'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Heart, Search, Star } from 'lucide-react';
import { mockApi } from '../../../src/services/mockServer';
import type { Product } from '../../../src/shared/types';
import { useFavoritesStore } from '../../../src/features/favorites/model';
import { cn } from '../../../src/shared/lib/utils';
import { formatPrice } from '../../../src/shared/lib/formatPrice';
import { Skeleton } from '../../../src/shared/ui/Skeleton';
import { SITE_ROUTES } from '../../../src/shared/config/constants';
import { useWebI18n } from '../../../src/shared/lib/webI18n';

const CATEGORIES = ['All', 'Shirts', 'Shoes', 'Pants', 'Jackets', 'Accessories'] as const;

export default function FavoritesPage() {
    const { favorites, toggleFavorite } = useFavoritesStore();
    const { tc } = useWebI18n();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
    const [query, setQuery] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        mockApi.listFavorites().then((data) => {
            if (!active) return;
            setProducts(data);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [favorites]);

    const filtered = useMemo(() => {
        const byCategory = category === 'All' ? products : products.filter((p) => p.category === category);
        const q = query.trim().toLowerCase();
        if (!q) return byCategory;
        return byCategory.filter((p) =>
            p.title.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.brand || '').toLowerCase().includes(q),
        );
    }, [category, products, query]);

    return (
        <section className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-8 md:py-12">
            <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-[linear-gradient(145deg,#fbfffc_0%,#f2f8ff_52%,#f7faff_100%)] p-6 md:p-8">
                <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#00c853]/15 blur-3xl" />
                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#5aa6ff]/20 blur-3xl" />

                <div className="relative">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645]">Wishlist</p>
                    <h1 className="mt-1.5 font-[family-name:var(--font-playfair)] text-[clamp(2rem,4.6vw,3.4rem)] font-black leading-none text-[#111111]">
                        Liked Products
                    </h1>
                    <p className="mt-2 max-w-xl text-[14px] text-[#5b6472]">
                        Save the items you love and come back anytime to continue shopping.
                    </p>

                    <div className="mt-6 flex h-12 items-center gap-3 rounded-full border border-black/10 bg-white px-4 shadow-[0_16px_34px_-26px_rgba(0,0,0,0.45)]">
                        <Search size={16} className="text-[#97a0b0]" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search favorites..."
                            className="h-full w-full bg-transparent text-[14px] text-[#111111] outline-none placeholder:text-[#9ca3af]"
                        />
                    </div>
                </div>
            </div>

            <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={cn(
                            'shrink-0 rounded-full border px-5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-all',
                            category === cat
                                ? 'border-transparent bg-[#111111] text-white shadow'
                                : 'border-black/10 bg-white text-[#6b7280] hover:border-black/20 hover:text-[#111111]',
                        )}
                    >
                        {tc(cat)}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-3xl border border-black/8 bg-white p-3">
                                <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                                <Skeleton className="mt-3 h-4 w-2/3" />
                                <Skeleton className="mt-2 h-4 w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-4">
                        {filtered.map((product) => {
                            const img1 = product.images[0] || 'https://placehold.co/640x800/f8f8f8/ccc?text=Product';
                            const seed = product.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                            const off = 10 + (seed % 25);
                            const oldPrice = Math.round((product.price * 1.2) / 1000) * 1000;
                            const rating = 3 + (seed % 3);

                            return (
                                <Link
                                    key={product.id}
                                    href={SITE_ROUTES.PRODUCT(product.id)}
                                    className="group rounded-3xl border border-black/8 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_50px_-24px_rgba(0,0,0,0.24)]"
                                >
                                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#f5f6f8]">
                                        <img src={img1} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <span className="absolute left-3 top-3 rounded-full bg-[#111111] px-2.5 py-1 text-[10px] font-black text-white">-{off}%</span>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleFavorite(product.id);
                                            }}
                                            className="absolute right-3 top-3 rounded-full border border-white/35 bg-white/20 p-2.5 text-white backdrop-blur-md transition-all hover:bg-white/35"
                                        >
                                            <Heart size={14} className="fill-current" />
                                        </button>
                                    </div>

                                    <div className="px-1 pb-1 pt-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">{tc(product.category)}</p>
                                        <h3 className="mt-1 line-clamp-1 text-[14px] font-extrabold text-[#111111]">{product.title}</h3>
                                        <div className="mt-1.5 flex items-center gap-0.5">
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <Star key={`${product.id}-star-${i}`} size={11} className={i < rating ? 'fill-[#00c853] text-[#00c853]' : 'text-[#e5e7eb]'} />
                                            ))}
                                        </div>
                                        <div className="mt-2.5 flex items-end gap-2">
                                            <span className="text-[17px] font-black text-[#111111]">{formatPrice(product.price, product.currency)}</span>
                                            <span className="text-[12px] text-[#c4c9d4] line-through">{formatPrice(oldPrice, product.currency)}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-3xl border border-black/10 bg-white px-6 py-14 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#111111]/5 text-[#111111]/45">
                            <Heart size={28} />
                        </div>
                        <h3 className="mt-4 text-[24px] font-black text-[#111111]">No favorites yet</h3>
                        <p className="mt-2 text-[14px] text-[#6b7280]">Start exploring and save products you like.</p>
                        <Link
                            href="/clothing"
                            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#111111] px-6 text-[12px] font-black uppercase tracking-[0.12em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
                        >
                            Browse Clothing
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
