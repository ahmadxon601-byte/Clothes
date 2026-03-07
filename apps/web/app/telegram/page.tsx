'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, X, Heart, ChevronRight, MapPin, Tag, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../src/shared/lib/utils';
import { useTranslation } from '../../src/shared/lib/i18n';
import { Skeleton } from '../../src/shared/ui/Skeleton';
import { formatPrice } from '../../src/shared/lib/formatPrice';
import { useTelegram } from '../../src/telegram/useTelegram';
import {
    fetchProducts,
    fetchCategories,
    fetchFavorites,
    toggleFavorite,
    type ApiProduct,
    type ApiCategory,
} from '../../src/lib/apiClient';

// ── Category slug → emoji ─────────────────────────────────────────────────────

const SLUG_EMOJI: Record<string, string> = {
    jackets: '🧥',
    shirts: '👔',
    shoes: '👟',
    pants: '👖',
    hoodies: '🫧',
    accessories: '⌚',
    tshirts: '👕',
    't-shirts': '👕',
    dresses: '👗',
    suits: '🤵',
    bags: '👜',
    hats: '🎩',
};

// ── Promo banners ─────────────────────────────────────────────────────────────

const PROMOS = [
    {
        title: "Birinchi xarid uchun maxsus chegirma!",
        badge: "Maxsus",
        accent: '#D7FF35',
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=400&auto=format&fit=crop",
    },
    {
        title: "Yozgi kolleksiya: 50% gacha chegirma",
        badge: "Sotuv",
        accent: '#13EC37',
        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=400&auto=format&fit=crop",
    },
    {
        title: "Yangi kelgan: Eksklyuziv krossovkalar",
        badge: "Yangi",
        accent: '#35D7FF',
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop",
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

    // Visual discount (cosmetic only, no real discount system in API yet)
    const seed = product.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const discountPct = 10 + (seed % 21);
    const originalPrice = Math.round(product.base_price / (1 - discountPct / 100) / 1000) * 1000;

    const imgSrc = !imgError && product.thumbnail
        ? product.thumbnail
        : 'https://placehold.co/200x200/png?text=No+Image';

    return (
        <Link href={`/telegram/p/${product.id}`} className="block">
            <div className="flex gap-3 p-3 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] active:scale-[0.98] transition-transform duration-150">
                {/* Image */}
                <div className="relative w-[88px] h-[88px] flex-shrink-0 rounded-xl overflow-hidden bg-[var(--color-surface2)]">
                    <img
                        src={imgSrc}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                    <button
                        onClick={(e) => { e.preventDefault(); onToggleFav(product.id); }}
                        className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full"
                    >
                        <Heart
                            size={13}
                            className={cn(isFav ? 'fill-red-500 text-red-500' : 'text-white')}
                        />
                    </button>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                        <p className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-0.5">
                            {product.store_name}
                        </p>
                        <h3 className="text-[13px] font-semibold text-[var(--color-text)] leading-tight line-clamp-2">
                            {product.name}
                        </h3>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 mb-1.5 mt-1">
                            <MapPin size={10} className="text-[var(--color-hint)] opacity-60 flex-shrink-0" />
                            <span className="text-[10px] text-[var(--color-hint)] truncate">
                                {product.category_name ?? 'Mahsulot'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-[var(--color-text)]">
                                {formatPrice(product.base_price, 'UZS')}
                            </span>
                            <span className="text-[10px] text-[var(--color-hint)] line-through">
                                {formatPrice(originalPrice, 'UZS')}
                            </span>
                            <span className="ml-auto text-[9px] font-extrabold px-1.5 py-0.5 bg-[var(--color-primary)] text-[var(--color-primary-contrast)] rounded-full">
                                -{discountPct}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TelegramPage() {
    const { t, language } = useTranslation();
    const { user } = useTelegram();

    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [favIds, setFavIds] = useState<Set<string>>(new Set());
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [activePromo, setActivePromo] = useState(0);

    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Load categories + favorites on mount ──────────────────────────────────
    useEffect(() => {
        fetchCategories()
            .then(setCategories)
            .catch(() => {});

        fetchFavorites()
            .then((favs) => setFavIds(new Set(favs.map((f) => f.product_id))))
            .catch(() => {});
    }, []);

    // ── Load products whenever category or search changes (debounced) ─────────
    const loadProducts = useCallback(async (categoryId: string | null, q: string) => {
        setLoading(true);
        try {
            const result = await fetchProducts({
                category: categoryId ?? undefined,
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
            loadProducts(selectedCategoryId, search);
        }, search ? 400 : 0);
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [selectedCategoryId, search, loadProducts]);

    // ── Promo auto-rotate ─────────────────────────────────────────────────────
    useEffect(() => {
        const timer = setInterval(() => setActivePromo((p) => (p + 1) % PROMOS.length), 4500);
        return () => clearInterval(timer);
    }, []);

    // ── Favorite toggle ───────────────────────────────────────────────────────
    const handleToggleFav = async (productId: string) => {
        // Optimistic UI
        setFavIds((prev) => {
            const next = new Set(prev);
            if (next.has(productId)) next.delete(productId); else next.add(productId);
            return next;
        });
        try {
            await toggleFavorite(productId);
        } catch {
            // Revert on error
            setFavIds((prev) => {
                const next = new Set(prev);
                if (next.has(productId)) next.delete(productId); else next.add(productId);
                return next;
            });
        }
    };

    const promo = PROMOS[activePromo];

    const greeting = user?.first_name
        ? language === 'ru'
            ? `Привет, ${user.first_name}! 👋`
            : language === 'en'
                ? `Hi, ${user.first_name}! 👋`
                : `Salom, ${user.first_name}! 👋`
        : null;

    return (
        <div className="flex flex-col min-h-full px-3 pt-3 pb-2 bg-[var(--color-bg)] max-w-[500px] mx-auto">

            {/* Greeting */}
            {greeting && (
                <p className="text-[13px] font-semibold text-[var(--color-hint)] mb-2 px-1">
                    {greeting}
                </p>
            )}

            {/* Search */}
            <div className="relative mb-3">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-hint)] opacity-50">
                    <Search size={16} />
                </div>
                <input
                    placeholder={t.search}
                    className="h-[42px] w-full bg-[var(--color-surface)] rounded-2xl pl-10 pr-10 outline-none text-[13px] font-medium text-[var(--color-text)] placeholder:text-[var(--color-hint)]/60 border border-[var(--color-border)] focus:ring-2 ring-[var(--color-primary)]/25 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-[var(--color-hint)]/12 rounded-full"
                    >
                        <X size={12} className="text-[var(--color-hint)]" />
                    </button>
                )}
            </div>

            {/* Categories — from real API */}
            <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar -mx-3 px-3">
                {/* All */}
                <button
                    onClick={() => setSelectedCategoryId(null)}
                    className={cn(
                        'flex flex-col items-center gap-1 flex-shrink-0 w-[62px] py-2 rounded-2xl text-[10px] font-bold transition-all border',
                        selectedCategoryId === null
                            ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-transparent'
                            : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]',
                    )}
                >
                    <span className="text-[18px] leading-none">🛍️</span>
                    <span className="leading-tight text-center">{t.all}</span>
                </button>

                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={cn(
                            'flex flex-col items-center gap-1 flex-shrink-0 w-[62px] py-2 rounded-2xl text-[10px] font-bold transition-all border',
                            selectedCategoryId === cat.id
                                ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-transparent'
                                : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]',
                        )}
                    >
                        <span className="text-[18px] leading-none">
                            {SLUG_EMOJI[cat.slug] ?? '📦'}
                        </span>
                        <span className="leading-tight text-center line-clamp-1">{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Promo banner */}
            <div className="relative mb-4 rounded-2xl overflow-hidden h-[130px] flex shadow-sm">
                <div
                    className="w-[58%] flex flex-col justify-between p-4 transition-colors duration-700"
                    style={{ backgroundColor: promo.accent }}
                >
                    <span className="inline-block px-2 py-0.5 bg-black/10 text-[#121417] text-[8px] font-extrabold rounded-full uppercase tracking-wider w-fit border border-black/10">
                        {promo.badge}
                    </span>
                    <p className="text-[13px] font-black text-[#121417] leading-tight mt-1 mb-1">
                        {promo.title}
                    </p>
                    <button
                        onClick={() => setSelectedCategoryId(null)}
                        className="inline-flex items-center gap-1 px-3 h-7 rounded-xl bg-[#121417] text-white text-[11px] font-bold w-fit active:scale-95 transition-transform"
                    >
                        Ko'rish <ChevronRight size={12} />
                    </button>
                </div>
                <div className="flex-1 relative overflow-hidden bg-[#e6e8e6]">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent z-10" />
                    <img
                        key={activePromo}
                        src={promo.image}
                        alt="promo"
                        className="absolute inset-0 w-full h-full object-cover animate-in fade-in zoom-in-105 duration-700 origin-center"
                    />
                </div>
                {/* Dots */}
                <div className="absolute bottom-2 right-3 flex gap-1 z-20">
                    {PROMOS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActivePromo(i)}
                            className={cn(
                                'rounded-full transition-all duration-300',
                                i === activePromo ? 'w-4 h-1.5 bg-[#121417]' : 'w-1.5 h-1.5 bg-[#121417]/30'
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Section label */}
            {!loading && products.length > 0 && (
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                    <div className="flex items-center gap-1.5">
                        <Tag size={13} className="text-[var(--color-primary)]" />
                        <span className="text-[12px] font-bold text-[var(--color-text)]">
                            {selectedCategoryId
                                ? (categories.find((c) => c.id === selectedCategoryId)?.name ?? 'Mahsulotlar')
                                : 'Barcha mahsulotlar'}
                        </span>
                    </div>
                    <span className="text-[10.5px] text-[var(--color-hint)] font-medium">
                        {products.length} ta
                    </span>
                </div>
            )}

            {/* Product list */}
            {loading ? (
                <div className="flex flex-col gap-2.5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-3 p-3 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                            <Skeleton className="w-[88px] h-[88px] rounded-xl flex-shrink-0" />
                            <div className="flex-1 flex flex-col gap-2 justify-center">
                                <Skeleton className="h-3 w-1/3" />
                                <Skeleton className="h-4 w-4/5" />
                                <Skeleton className="h-3 w-1/2" />
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
                <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--color-hint)]">
                    <ShoppingBag size={32} className="opacity-30 mb-3" />
                    <p className="text-[13px] font-semibold">{t.no_search_results}</p>
                    <p className="text-[11px] opacity-60 mt-1">{t.try_different_keywords}</p>
                </div>
            )}
        </div>
    );
}
