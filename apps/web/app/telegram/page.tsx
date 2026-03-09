'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, X, Heart, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../src/shared/lib/utils';
import { Skeleton } from '../../src/shared/ui/Skeleton';
import { formatPrice } from '../../src/shared/lib/formatPrice';
import {
    fetchProducts,
    fetchFavorites,
    toggleFavorite,
    type ApiProduct,
} from '../../src/lib/apiClient';

// ── Promo banners ─────────────────────────────────────────────────────────────

const PROMOS = [
    {
        title: "Yangi kelgan: Eksklyuziv krossovkalar",
        badge: "YANGI",
        accent: '#00C8D7',
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop",
        bg: '#C0392B',
    },
    {
        title: "Birinchi xarid uchun maxsus chegirma!",
        badge: "MAXSUS",
        accent: '#D7FF35',
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=400&auto=format&fit=crop",
        bg: '#1a1a2e',
    },
    {
        title: "Yozgi kolleksiya: 50% gacha chegirma",
        badge: "SOTUV",
        accent: '#13EC37',
        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=400&auto=format&fit=crop",
        bg: '#0d3b1e',
    },
];

// ── Product card ──────────────────────────────────────────────────────────────

function TgProductCard({
    product,
    isFav,
    onToggleFav,
}: {
    product: ApiProduct;
    isFav: boolean;
    onToggleFav: (id: string) => void;
}) {
    const [imgError, setImgError] = useState(false);

    const imgSrc = !imgError && product.thumbnail
        ? product.thumbnail
        : 'https://placehold.co/200x200/1a1a1a/555555/png?text=No+Image';

    return (
        <Link href={`/telegram/p/${product.id}`} className="block">
            <div className="flex gap-3 p-3 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] active:scale-[0.98] transition-transform duration-150">
                <div className="relative w-[88px] h-[88px] flex-shrink-0 rounded-xl overflow-hidden bg-[var(--color-surface2)]">
                    <img
                        src={imgSrc}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                    <button
                        onClick={(e) => { e.preventDefault(); onToggleFav(product.id); }}
                        className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full"
                    >
                        <Heart size={13} className={cn(isFav ? 'fill-red-500 text-red-500' : 'text-white')} />
                    </button>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                        <p className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-0.5">
                            {product.store_name}
                        </p>
                        <h3 className="text-[13px] font-semibold text-[var(--color-text)] leading-tight line-clamp-2">
                            {product.name}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[13px] font-bold text-[var(--color-text)]">
                            {formatPrice(product.base_price, 'UZS')}
                        </span>
                        {product.category_name && (
                            <span className="text-[10px] text-[var(--color-hint)]">{product.category_name}</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TelegramPage() {
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [favIds, setFavIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [activePromo, setActivePromo] = useState(0);

    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        fetchFavorites()
            .then((favs) => setFavIds(new Set(favs.map((f) => f.product_id))))
            .catch(() => {});
    }, []);

    const loadProducts = useCallback(async (q: string) => {
        setLoading(true);
        try {
            const result = await fetchProducts({
                search: q.trim() || undefined,
                limit: 60,
            });
            setProducts(result.products);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            loadProducts(search);
        }, search ? 400 : 0);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [search, loadProducts]);

    useEffect(() => {
        const timer = setInterval(() => setActivePromo((p) => (p + 1) % PROMOS.length), 4500);
        return () => clearInterval(timer);
    }, []);

    const handleToggleFav = async (productId: string) => {
        setFavIds((prev) => {
            const next = new Set(prev);
            if (next.has(productId)) next.delete(productId); else next.add(productId);
            return next;
        });
        try {
            await toggleFavorite(productId);
        } catch {
            setFavIds((prev) => {
                const next = new Set(prev);
                if (next.has(productId)) next.delete(productId); else next.add(productId);
                return next;
            });
        }
    };

    const promo = PROMOS[activePromo];

    return (
        <div className="flex flex-col min-h-full px-3 pt-2 pb-2 bg-[var(--color-bg)] max-w-[500px] mx-auto">

            {/* Search */}
            <div className="relative mb-3">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-hint)] opacity-60">
                    <Search size={15} />
                </div>
                <input
                    placeholder="Mahsulot qidirish..."
                    className="h-[42px] w-full bg-[var(--color-surface)] rounded-full pl-10 pr-10 outline-none text-[13px] font-medium text-[var(--color-text)] placeholder:text-[var(--color-hint)]/60 border border-[var(--color-border)] focus:ring-2 ring-[var(--color-primary)]/25 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-[var(--color-hint)]/12 rounded-full"
                    >
                        <X size={11} className="text-[var(--color-hint)]" />
                    </button>
                )}
            </div>

            {/* Promo banner */}
            <div className="relative mb-4 rounded-2xl overflow-hidden h-[160px] flex shadow-sm">
                {/* Left colored half */}
                <div
                    className="w-[55%] flex flex-col justify-between p-4 transition-colors duration-700"
                    style={{ backgroundColor: promo.accent }}
                >
                    <span className="inline-block px-2.5 py-0.5 bg-black/15 text-black/80 text-[9px] font-extrabold rounded-full uppercase tracking-widest w-fit">
                        {promo.badge}
                    </span>
                    <p className="text-[13px] font-black text-[#0d1117] leading-snug">
                        {promo.title}
                    </p>
                    <button
                        onClick={() => setSearch('')}
                        className="inline-flex items-center gap-1 px-3 h-7 rounded-xl bg-[#0d1117] text-white text-[11px] font-bold w-fit active:scale-95 transition-transform"
                    >
                        Mahsulotlarni ko&apos;rish <ChevronRight size={12} />
                    </button>
                </div>
                {/* Right image half */}
                <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: promo.bg }}>
                    <img
                        key={activePromo}
                        src={promo.image}
                        alt="promo"
                        className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-700"
                    />
                </div>

                {/* Prev arrow */}
                <button
                    onClick={() => setActivePromo((p) => (p - 1 + PROMOS.length) % PROMOS.length)}
                    className="absolute left-[53%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-black/35 backdrop-blur-sm rounded-full z-10 text-white"
                >
                    <ChevronLeft size={15} />
                </button>
                {/* Next arrow */}
                <button
                    onClick={() => setActivePromo((p) => (p + 1) % PROMOS.length)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-black/35 backdrop-blur-sm rounded-full z-10 text-white"
                >
                    <ChevronRight size={15} />
                </button>
            </div>

            {/* Product list */}
            {loading ? (
                <div className="flex flex-col gap-2.5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-3 p-3 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                            <Skeleton className="w-[88px] h-[88px] rounded-xl flex-shrink-0" />
                            <div className="flex-1 flex flex-col gap-2 justify-center">
                                <Skeleton className="h-3 w-1/3" />
                                <Skeleton className="h-4 w-4/5" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : products.length > 0 ? (
                <div className="flex flex-col gap-2.5 pb-2">
                    {products.map((product) => (
                        <TgProductCard
                            key={product.id}
                            product={product}
                            isFav={favIds.has(product.id)}
                            onToggleFav={handleToggleFav}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--color-hint)]">
                    <Search size={36} className="opacity-25 mb-3" />
                    <p className="text-[13px] font-semibold">Hech narsa topilmadi</p>
                </div>
            )}
        </div>
    );
}
