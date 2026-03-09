'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Heart, Star } from 'lucide-react';
import { SITE_ROUTES } from '../../src/shared/config/constants';
import { fetchProducts } from '../../src/lib/apiClient';
import type { ApiProduct } from '../../src/lib/apiClient';
import { formatPrice } from '../../src/shared/lib/formatPrice';
import { cn } from '../../src/shared/lib/utils';
import { useWebI18n } from '../../src/shared/lib/webI18n';
import { useWebAuth } from '../../src/context/WebAuthContext';
import { AuthModal } from '../../src/shared/ui/AuthModal';

const CATEGORIES = ['All', 'Jackets', 'Shirts', 'Shoes', 'Pants', 'Hoodies', 'Accessories', 'T-Shirts'] as const;
type Category = (typeof CATEGORIES)[number];

const WEB_LINKS = {
    HOME: `${SITE_ROUTES.HOME}#home`,
    SHOP: `${SITE_ROUTES.HOME}#featured`,
    CATEGORIES: `${SITE_ROUTES.HOME}#categories`,
        SALE: `${SITE_ROUTES.HOME}#sale`,
};

const CATEGORY_BANNERS = [
    {
        title: 'Casual Wear',
        subtitle: 'Relaxed essentials, premium fabrics',
        image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?q=80&w=1800&auto=format&fit=crop',
        href: WEB_LINKS.CATEGORIES,
        badge: 'TRENDING',
        isFeatured: true,
    },
    {
        title: 'Formal Wear',
        subtitle: 'Sharp tailoring for elevated occasions',
        image: 'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?q=80&w=1200&auto=format&fit=crop',
        href: WEB_LINKS.CATEGORIES,
        badge: 'NEW',
    },
    {
        title: 'Street Style',
        subtitle: 'Bold city-inspired silhouettes',
        image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop',
        href: WEB_LINKS.CATEGORIES,
        badge: 'URBAN',
    },
    {
        title: 'Outerwear',
        subtitle: 'Layer-ready pieces for every season',
        image: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?q=80&w=1200&auto=format&fit=crop',
        href: WEB_LINKS.CATEGORIES,
        badge: 'EDIT',
    },
    {
        title: 'Accessories',
        subtitle: 'The final touch for a polished look',
        image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1200&auto=format&fit=crop',
        href: WEB_LINKS.CATEGORIES,
        badge: 'PREMIUM',
    },
];


function useScrollReveal() {
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return;
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.12 },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('marketplace_token');
}

export default function WebsiteHomePage() {
    const { w, tc } = useWebI18n();
    const { user } = useWebAuth();
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [activeCategory, setActiveCategory] = useState<Category>('All');
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());
    const [authModal, setAuthModal] = useState(false);

    const catReveal = useScrollReveal();
    const prodReveal = useScrollReveal();

    useEffect(() => {
        fetchProducts({ limit: 50 }).then(({ products: data }) => setProducts(data)).catch(() => {});
    }, []);

    const featuredProducts = useMemo(() => {
        if (activeCategory === 'All') return products.slice(0, 8);
        return products.filter((p) => (p.category_name ?? '').toLowerCase().includes(activeCategory.toLowerCase())).slice(0, 8);
    }, [activeCategory, products]);
    const featuredBanner = useMemo(
        () => CATEGORY_BANNERS.find((item) => item.isFeatured) ?? CATEGORY_BANNERS[0],
        [],
    );
    const compactBanners = useMemo(
        () => CATEGORY_BANNERS.filter((item) => item.title !== featuredBanner.title).slice(0, 4),
        [featuredBanner.title],
    );

    const toggleWishlist = async (id: string) => {
        if (!user) { setAuthModal(true); return; }
        const token = getToken();
        if (!token) { setAuthModal(true); return; }
        // Optimistic toggle
        setWishlist((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
        try {
            await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ product_id: id }),
            });
        } catch { /* ignore */ }
    };

    return (
        <div id="home" className="w-full">
            <AuthModal open={authModal} onClose={() => setAuthModal(false)} defaultTab="login" />

            {/* Hero */}
            <section className="relative h-[74vh] min-h-[460px] w-full overflow-hidden md:h-[84vh] md:min-h-[520px] lg:h-[92vh] lg:min-h-[580px]">
                <img
                    src="https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?q=80&w=2000&auto=format&fit=crop"
                    alt="Premium fashion hero"
                    className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-top transition-transform duration-[8s] hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10 md:to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                <div className="absolute inset-0 flex items-center">
                    <div className="mx-auto w-full max-w-[1280px] px-6 md:px-10">
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/90 backdrop-blur-md">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00c853]" />
                            {w.home.heroBadge}
                        </p>
                        <h1 className="mt-5 font-[family-name:var(--font-playfair)] text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] tracking-tight text-white">
                            {w.home.heroTitleTop}<br />
                            {w.home.heroTitleMid}<br />
                            <span className="text-[#00c853]">{w.home.heroTitleAccent}</span>
                        </h1>
                        <p className="mt-6 max-w-sm text-[15px] leading-7 text-white/75">
                            {w.home.heroDesc}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href={WEB_LINKS.SHOP}
                                className="group inline-flex h-13 items-center gap-2.5 rounded-full bg-[#00c853] px-7 text-[12px] font-black uppercase tracking-[0.14em] text-[#06200f] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgba(0,200,83,0.9)]"
                            >
                                {w.home.shopNow}
                                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href={WEB_LINKS.CATEGORIES}
                                className="inline-flex h-13 items-center rounded-full border border-white/30 bg-white/10 px-7 text-[12px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md transition-all duration-300 hover:border-white/50 hover:bg-white/20"
                            >
                                {w.home.newArrivals}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 right-6 hidden rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md md:right-10 lg:block">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">{w.home.limitedOffer}</p>
                    <p className="mt-0.5 text-3xl font-black text-white">{w.home.upTo}</p>
                    <p className="text-[11px] text-white/70">{w.home.selectedItems}</p>
                </div>

                <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-white/40 lg:flex">
                    <div className="h-10 w-[1px] bg-gradient-to-b from-transparent to-white/40" />
                    <span className="text-[9px] uppercase tracking-[0.2em]">{w.home.scroll}</span>
                </div>
            </section>

            <div className="overflow-hidden whitespace-nowrap bg-[#00c853] py-3">
                <div className="inline-block animate-[marquee_28s_linear_infinite] will-change-transform">
                    {[...w.home.ticker, ...w.home.ticker].map((item, i) => (
                        <span key={i} className="mx-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#06200f]">
                            {item} <span className="mx-4 opacity-40">✦</span>
                        </span>
                    ))}
                </div>
            </div>

            <section
                id="categories"
                ref={catReveal.ref as React.RefObject<HTMLElement>}
                className={cn(
                    'mx-auto max-w-[1280px] px-6 pt-2 pb-12 md:px-10 md:pb-16 transition-all duration-700',
                    catReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
                )}
            >
                <div className="mb-7 flex items-end justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645]">{w.home.explore}</p>
                        <h2 className="mt-1.5 font-[family-name:var(--font-playfair)] text-[clamp(1.8rem,4vw,3rem)] font-black tracking-tight text-[#111111] dark:text-white">
                            {w.home.discoverByStyle}
                        </h2>
                    </div>
                    <Link
                        href={WEB_LINKS.CATEGORIES}
                        className="hidden md:inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#111111] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00c853]/40 hover:text-[#00a645] hover:shadow-[0_12px_24px_-14px_rgba(0,200,83,0.75)] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-[#00c853]/40 dark:hover:text-[#00a645]"
                    >
                        {w.home.viewAll} <ArrowRight size={13} />
                    </Link>
                </div>
                <div className="grid gap-4 lg:grid-cols-12 lg:min-h-[620px]">
                    <Link
                        href={featuredBanner.href}
                        aria-label={`${featuredBanner.title} style`}
                        className="group relative isolate overflow-hidden rounded-[40px] bg-black/10 min-h-[260px] md:min-h-[330px] lg:col-span-7 lg:min-h-[620px]"
                    >
                        <img
                            src={featuredBanner.image}
                            alt={w.home.categoryBanners[0]?.title ?? featuredBanner.title}
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 transition-opacity duration-300 group-hover:from-black/85 group-hover:via-black/45" />
                        {featuredBanner.badge && (
                            <span className="absolute left-5 top-5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md">
                                {featuredBanner.badge}
                            </span>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-7">
                            <div className="rounded-[30px] border border-white/15 bg-black/20 p-4 backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-0.5">
                                <h3 className="font-[family-name:var(--font-playfair)] text-[clamp(1.5rem,2.4vw,2.3rem)] font-black leading-[0.95] text-white">
                                    {w.home.categoryBanners[0]?.title ?? featuredBanner.title}
                                </h3>
                                <p className="mt-1.5 max-w-[38ch] text-[12px] leading-5 text-white/80">
                                    {w.home.categoryBanners[0]?.subtitle ?? featuredBanner.subtitle}
                                </p>
                            </div>
                        </div>
                    </Link>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5 lg:min-h-[620px] lg:grid-rows-2">
                        {compactBanners.map((cat, idx) => {
                            const tIndex = idx + 1;
                            return (
                                <Link
                                    key={cat.title}
                                    href={cat.href}
                                    aria-label={`${cat.title} style`}
                                    className="group relative isolate overflow-hidden rounded-[36px] bg-black/10 min-h-[155px] md:min-h-[190px] lg:min-h-[302px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00c853] focus-visible:ring-offset-2"
                                >
                                    <img
                                        src={cat.image}
                                        alt={w.home.categoryBanners[tIndex]?.title ?? cat.title}
                                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/82 group-hover:via-black/38" />
                                    {cat.badge && (
                                        <span className="absolute left-3 top-3 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md">
                                            {cat.badge}
                                        </span>
                                    )}
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="rounded-[26px] border border-white/15 bg-black/25 p-3 backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-0.5">
                                            <h3 className="font-[family-name:var(--font-playfair)] text-[clamp(1.2rem,1.6vw,1.7rem)] font-black leading-[0.95] text-white">
                                                {w.home.categoryBanners[tIndex]?.title ?? cat.title}
                                            </h3>
                                            <p className="mt-1 text-[12px] leading-5 text-white/80 line-clamp-2">
                                                {w.home.categoryBanners[tIndex]?.subtitle ?? cat.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── PRODUCTS ─── */}
            <section
                id="featured"
                ref={prodReveal.ref as React.RefObject<HTMLElement>}
                className={cn(
                    'bg-white pt-6 pb-14 md:pt-8 md:pb-20 transition-all duration-700 dark:bg-[#111111]',
                    prodReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
                )}
            >
                <div className="mx-auto max-w-[1280px] px-6 md:px-10">
                    <div className="flex flex-wrap items-end justify-between gap-5 mb-8">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645]">{w.home.curatedPicks}</p>
                            <h2 className="mt-1.5 font-[family-name:var(--font-playfair)] text-[clamp(1.8rem,4vw,3rem)] font-black tracking-tight text-[#111111] dark:text-white">
                                {w.home.handpicked}
                            </h2>
                        </div>
                        <div className="no-scrollbar flex w-full flex-nowrap items-center gap-2 overflow-x-auto border-b border-black/10 pb-2 dark:border-white/10">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={cn(
                                        'inline-flex items-center justify-center rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00c853] focus-visible:ring-offset-1',
                                        activeCategory === cat
                                            ? 'bg-[#00c853] text-[#06200f] shadow-[0_12px_24px_-14px_rgba(0,200,83,0.75)]'
                                            : 'text-[#475467] hover:bg-white hover:text-[#111827] dark:text-[#9ca3af] dark:hover:bg-white/10 dark:hover:text-white',
                                    )}
                                >
                                    {tc(cat)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-4">
                        {featuredProducts.map((product) => {
                            const seed = product.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
                            const off = 10 + (seed % 30);
                            const oldPrice = Math.round((product.base_price * 1.2) / 1000) * 1000;
                            const rating = 3 + (seed % 3);
                            const primaryImage = product.thumbnail || 'https://placehold.co/640x800/f8f8f8/ccc?text=Product';
                            const inWish = wishlist.has(product.id);

                            return (
                                <div
                                    key={product.id}
                                    className="group rounded-3xl border border-black/5 bg-[#f8f9fb] p-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_55px_-25px_rgba(0,0,0,0.25)] dark:border-white/5 dark:bg-[#1a1a1a]"
                                >
                                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white dark:bg-[#242424]">
                                        <img
                                            src={primaryImage}
                                            alt={product.name}
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                        <span className="absolute left-3 top-3 rounded-full bg-[#111111] px-2.5 py-1 text-[10px] font-black text-white">
                                            -{off}%
                                        </span>
                                        <button
                                            onClick={() => toggleWishlist(product.id)}
                                            className={cn(
                                                'absolute right-3 top-3 rounded-full p-2.5 backdrop-blur-md transition-all duration-300',
                                                inWish
                                                    ? 'bg-[#00c853] text-[#06200f]'
                                                    : 'border border-white/30 bg-white/15 text-white hover:bg-white/25',
                                            )}
                                        >
                                            <Heart size={13} className={inWish ? 'fill-current' : ''} />
                                        </button>
                                    </div>
                                    <div className="px-1 pt-4 pb-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">{tc(product.category_name ?? '')}</p>
                                        <h3 className="mt-1 line-clamp-1 text-[14px] font-extrabold text-[#111111] dark:text-white">{product.name}</h3>
                                        <div className="mt-1.5 flex items-center gap-0.5">
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <Star key={i} size={11} className={i < rating ? 'fill-[#00c853] text-[#00c853]' : 'text-[#e5e7eb]'} />
                                            ))}
                                        </div>
                                        <div className="mt-2.5 flex items-end gap-2">
                                            <span className="text-[17px] font-black text-[#111111] dark:text-white">{formatPrice(product.base_price, 'UZS')}</span>
                                            <span className="text-[12px] text-[#c4c9d4] line-through">{formatPrice(oldPrice, 'UZS')}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── SALE ─── */}
            <section
                id="sale"
                className="relative overflow-hidden bg-[#f0faf4] py-20 md:py-28 dark:bg-[#0a0a0a]"
            >
                <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#00c853]/8 blur-[80px] dark:bg-[#00c853]/15" />
                <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#00c853]/5 blur-[80px] dark:bg-[#00c853]/10" />
                <div className="relative mx-auto max-w-[1280px] px-6 md:px-10 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#00a645] dark:text-[#8af9b3]">{w.home.premiumOffer}</p>
                    <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-[clamp(2rem,5vw,4.5rem)] font-black leading-tight text-[#111111] dark:text-white">
                        {w.home.firstOrderOff}
                    </h3>
                    <p className="mt-5 mx-auto max-w-lg text-[15px] leading-7 text-[#374151]/80 dark:text-white/60">
                        {w.home.saleDesc}
                    </p>
                    <Link
                        href={WEB_LINKS.SHOP}
                        className="mt-8 inline-flex h-13 items-center justify-center rounded-full bg-[#00c853] px-8 text-[12px] font-black uppercase tracking-[0.14em] text-[#06200f] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-14px_rgba(0,200,83,0.85)]"
                    >
                        {w.home.claimOffer}
                    </Link>
                </div>
            </section>

        </div>
    );
}


