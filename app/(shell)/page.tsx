'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowRight,
    Clock3,
    CreditCard,
    Headphones,
    Heart,
    ShieldCheck,
    ShoppingBag,
    Truck,
} from 'lucide-react';
import { SITE_ROUTES } from '../../src/shared/config/constants';
import { fetchProducts } from '../../src/lib/apiClient';
import type { ApiProduct } from '../../src/lib/apiClient';
import { formatPrice } from '../../src/shared/lib/formatPrice';
import { cn } from '../../src/shared/lib/utils';
import { useWebI18n } from '../../src/shared/lib/webI18n';
import { useWebAuth } from '../../src/context/WebAuthContext';
import { AuthModal } from '../../src/shared/ui/AuthModal';
import { useSSERefetch } from '../../src/shared/hooks/useSSERefetch';

interface HeroBannerProduct {
    id: string;
    name: string;
    base_price: number;
    sale_price: number | null;
    thumbnail: string | null;
}

interface HeroBanner {
    id: string;
    title: string;
    products: HeroBannerProduct[];
}

const WEB_LINKS = {
    HOME: `${SITE_ROUTES.HOME}#home`,
    SHOP: `${SITE_ROUTES.HOME}#deals`,
    CATEGORIES: `${SITE_ROUTES.HOME}#categories`,
    FEATURED: `${SITE_ROUTES.HOME}#featured`,
    PRODUCTS: SITE_ROUTES.PRODUCTS,
};

const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=1200&auto=format&fit=crop',
];

const HERO_COPY = {
    uz: {
        badge: 'Yangi mavsum 2026',
        title: ['Hammasi bir joyda', 'eng yaxshi', 'narxlarda.'],
        desc: 'Elektronika, kiyim-kechak va kundalik mahsulotlarni oson toping. Faqat tanlangan va ishonchli takliflar.',
        secondary: 'Kategoriyalar',
        floating: 'Tanlangan takliflar',
    },
    en: {
        badge: 'New season 2026',
        title: ['Selected', 'products', 'in one place.'],
        desc: 'Browse electronics, accessories, everyday goods, and popular offers in a cleaner storefront layout.',
        secondary: 'Categories',
        floating: 'Selected deals',
    },
    ru: {
        badge: 'Новый сезон 2026',
        title: ['Товары', 'в одном', 'пространстве.'],
        desc: 'Электроника, аксессуары, товары на каждый день и популярные предложения в одном современном каталоге.',
        primary: 'К покупкам',
        secondary: 'Категории',
        floating: 'Избранные предложения',
    },
} as const;

const SECTION_COPY = {
    uz: {
        categoryTitle: 'Kategoriyalar',
        categoryDesc: 'Eng ko‘p ko‘rilayotgan bo‘limlar va tavsiya etilgan yo‘nalishlar.',
        dealsTitle: 'Kun taklifi',
        dealsAction: 'Barchasini ko‘rish',
        popularTitle: 'Ommabop mahsulotlar',
        popularDesc: 'Xaridorlar eng ko‘p ko‘rgan va tanlagan mahsulotlar.',
        partnerTitleA: 'Biz bilan birga',
        partnerTitleB: 'biznesingizni',
        partnerTitleC: 'rivojlantiring',
        partnerDesc: 'Qulaymarket platformasida o‘z do‘koningizni oching, mahsulotlaringizni ko‘proq xaridorga ko‘rsating va savdoni tezroq yo‘lga qo‘ying.',
        partnerCta: 'Do‘kon ochish',
    },
    en: {
        categoryTitle: 'Categories',
        categoryDesc: 'Most viewed sections and recommended directions for shoppers.',
        dealsTitle: 'Deal of the day',
        dealsAction: 'See all',
        popularTitle: 'Popular products',
        popularDesc: 'Products customers view and choose most often.',
        partnerTitleA: 'Grow',
        partnerTitleB: 'your business',
        partnerTitleC: 'with us',
        partnerDesc: 'Open your store on Qulaymarket, reach more buyers, and launch sales with a cleaner marketplace presence.',
        partnerCta: 'Open a store',
    },
    ru: {
        categoryTitle: 'Категории',
        categoryDesc: 'Самые просматриваемые разделы и рекомендованные направления.',
        dealsTitle: 'Предложение дня',
        dealsAction: 'Смотреть все',
        popularTitle: 'Популярные товары',
        popularDesc: 'Товары, которые чаще всего смотрят и выбирают покупатели.',
        partnerTitleA: 'Развивайте',
        partnerTitleB: 'свой бизнес',
        partnerTitleC: 'вместе с нами',
        partnerDesc: 'Откройте магазин на Qulaymarket, покажите товары большему числу покупателей и быстрее запустите продажи.',
        partnerCta: 'Открыть магазин',
    },
} as const;

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('marketplace_token');
}

function imageFor(product: { thumbnail: string | null } | undefined, index: number) {
    return product?.thumbnail || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

export default function WebsiteHomePage() {
    const { w, language, tc } = useWebI18n();
    const { user, loading: authLoading } = useWebAuth();
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
    const [dailyDealProducts, setDailyDealProducts] = useState<ApiProduct[]>([]);
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());
    const [authModal, setAuthModal] = useState(false);

    const heroCopy = HERO_COPY[language] ?? HERO_COPY.uz;
    const sectionCopy = SECTION_COPY[language] ?? SECTION_COPY.uz;

    const loadProducts = useCallback(() => {
        fetchProducts({ limit: 24 }).then(({ products: data }) => setProducts(data)).catch(() => { });
    }, []);

    const loadDailyDeals = useCallback(async () => {
        try {
            const res = await fetch('/api/daily-deals/active', { cache: 'no-store' });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) return;
            setDailyDealProducts(json?.data?.products ?? json?.products ?? []);
        } catch {
            setDailyDealProducts([]);
        }
    }, []);

    const loadHeroBanner = useCallback(async () => {
        try {
            const res = await fetch('/api/banners', { cache: 'no-store' });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) return;
            setHeroBanner(json?.data?.banner ?? json?.banner ?? null);
        } catch {
            setHeroBanner(null);
        }
    }, []);

    const loadWishlist = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setWishlist(new Set());
            return;
        }

        try {
            const res = await fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) return;
            const data = json?.data ?? json ?? [];
            const ids = Array.isArray(data)
                ? data
                    .map((item: { product_id?: string }) => item.product_id)
                    .filter((id: string | undefined): id is string => Boolean(id))
                : [];
            setWishlist(new Set(ids));
        } catch { }
    }, []);

    useEffect(() => { loadProducts(); }, [loadProducts]);
    useEffect(() => { void loadHeroBanner(); }, [loadHeroBanner]);
    useEffect(() => { void loadDailyDeals(); }, [loadDailyDeals]);
    useEffect(() => {
        if (authLoading) return;
        void loadWishlist();
    }, [authLoading, loadWishlist, user]);

    useSSERefetch(['products', 'banners', 'daily_deals'], () => {
        loadProducts();
        void loadHeroBanner();
        void loadDailyDeals();
    });

    const heroProduct = heroBanner?.products?.[0] ?? products[0];
    const heroTitleLines = useMemo(() => {
        if (!heroBanner?.title?.trim()) {
            return heroCopy.title;
        }

        const words = heroBanner.title.trim().split(/\s+/);
        if (words.length <= 2) {
            return [heroBanner.title, '', ''].filter(Boolean);
        }

        const firstBreak = Math.ceil(words.length / 3);
        const secondBreak = Math.ceil((words.length * 2) / 3);
        const lines = [
            words.slice(0, firstBreak).join(' '),
            words.slice(firstBreak, secondBreak).join(' '),
            words.slice(secondBreak).join(' '),
        ].filter(Boolean);

        return lines.length ? lines : heroCopy.title;
    }, [heroBanner?.title, heroCopy.title]);
    const heroDescription = heroBanner
        ? heroBanner.products.length > 1
            ? `${heroBanner.products.slice(0, 3).map((product) => product.name).join(', ')} uchun maxsus banner taklifi.`
            : `${heroProduct?.name ?? 'Tanlangan mahsulot'} uchun maxsus banner taklifi.`
        : heroCopy.desc;
    const heroFloatingTitle = heroBanner ? heroBanner.title : heroCopy.floating;
    const dealProducts = useMemo(() => {
        if (dailyDealProducts.length) return dailyDealProducts.slice(0, 3);
        const discounted = products.filter((product) => {
            const base = Number(product.base_price);
            const sale = product.sale_price != null ? Number(product.sale_price) : null;
            return sale != null && sale < base;
        });
        return (discounted.length ? discounted : products).slice(0, 3);
    }, [dailyDealProducts, products]);
    const popularProducts = useMemo(() => products.slice(0, 5), [products]);

    const serviceItems = useMemo(
        () => [
            { icon: Truck, title: w.home.services[0]?.title ?? 'Tez Yetkazish', desc: w.home.services[0]?.desc ?? 'Buyurtmalarni tez yuborish' },
            { icon: ShieldCheck, title: w.home.services[1]?.title ?? 'Ishonchli To‘lov', desc: w.home.services[1]?.desc ?? 'Himoyalangan checkout' },
            { icon: CreditCard, title: w.home.services[2]?.title ?? 'Qulay Qaytarish', desc: w.home.services[2]?.desc ?? 'Soddalashtirilgan qaytarish tartibi' },
            { icon: Headphones, title: w.home.services[3]?.title ?? 'Qo‘llab-quvvatlash', desc: w.home.services[3]?.desc ?? 'Savollarga tezkor javob' },
        ],
        [w.home.services],
    );

    const toggleWishlist = async (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
        event.preventDefault();
        event.stopPropagation();
        if (!user) {
            setAuthModal(true);
            return;
        }

        const token = getToken();
        if (!token) {
            setAuthModal(true);
            return;
        }

        const wasInWish = wishlist.has(id);
        setWishlist((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ product_id: id }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error ?? 'Favorites request failed');
            const favorited = json?.data?.favorited ?? json?.favorited;
            if (typeof favorited === 'boolean') {
                setWishlist((prev) => {
                    const next = new Set(prev);
                    favorited ? next.add(id) : next.delete(id);
                    return next;
                });
            }
        } catch {
            setWishlist((prev) => {
                const next = new Set(prev);
                wasInWish ? next.add(id) : next.delete(id);
                return next;
            });
        }
    };

    return (
        <div id="home" className="w-full bg-[#f5f6f8] text-[#111111] dark:bg-[#0f0f0f] dark:text-white">
            <AuthModal open={authModal} onClose={() => setAuthModal(false)} defaultTab="login" />

            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-2 py-5 md:px-4 md:py-6 lg:gap-12 lg:px-6">
                <section className="grid gap-8 overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,rgba(19,236,55,0.08),rgba(255,255,255,0.96),rgba(19,236,55,0.05))] p-5 shadow-[0_24px_80px_-40px_rgba(17,24,39,0.28)] dark:bg-[linear-gradient(135deg,rgba(19,236,55,0.14),rgba(19,19,19,0.96),rgba(19,236,55,0.08))] md:grid-cols-[1.1fr_0.9fr] md:p-8 lg:rounded-[40px] lg:p-10">
                    <div className="flex max-w-[620px] flex-col justify-center">
                        <h1 className="max-w-[11ch] text-[clamp(2.6rem,5.6vw,4.8rem)] font-black leading-[1.03] tracking-[-0.05em] text-[#111111] dark:text-white">
                            {heroTitleLines[0] ?? ''}
                            {heroTitleLines[1] ? (
                                <>
                                    <br />
                                    <span className="text-[#10be33]">{heroTitleLines[1]}</span>
                                </>
                            ) : null}
                            {heroTitleLines[2] ? (
                                <>
                                    <br />
                                    {heroTitleLines[2]}
                                </>
                            ) : null}
                        </h1>
                        <p className="mt-6 max-w-[48ch] text-[15px] leading-8 text-[#5f6571] dark:text-white/70">
                            {heroDescription}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link
                                href={WEB_LINKS.CATEGORIES}
                                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-[12px] font-bold text-[#111111] shadow-[0_18px_45px_-28px_rgba(17,24,39,0.35)] transition-all duration-300 hover:-translate-y-0.5 dark:bg-white/10 dark:text-white"
                            >
                                {heroCopy.secondary}
                            </Link>
                        </div>
                    </div>

                    <div className="relative flex min-h-[320px] items-center justify-center pt-3 md:min-h-[420px] md:justify-end">
                        <div className="absolute inset-x-[8%] top-[16%] h-[62%] rounded-full bg-[#13ec37]/15 blur-[70px]" />
                        <Link
                            href={heroProduct ? `/product/${heroProduct.id}` : WEB_LINKS.PRODUCTS}
                            className="group relative block w-full max-w-[460px] rotate-[6deg] overflow-hidden rounded-[28px] bg-[#151819] p-3 shadow-[0_32px_80px_-30px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_40px_90px_-32px_rgba(0,0,0,0.7)]"
                        >
                            <img
                                src={imageFor(heroProduct, 2)}
                                alt={heroProduct?.name ?? 'Hero product'}
                                className="aspect-[1.1] w-full rounded-[22px] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                            <div className="absolute bottom-0 left-2 rounded-[22px] bg-white/92 px-4 py-3 shadow-[0_18px_50px_-28px_rgba(17,24,39,0.4)] backdrop-blur md:bottom-4 md:left-0 dark:bg-[#161616]/90">
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#10be33]">{heroFloatingTitle}</p>
                                <p className="mt-1 text-[14px] font-bold text-[#111111] dark:text-white">{heroProduct?.name ?? 'Premium Collection'}</p>
                                <p className="mt-1 text-[13px] font-black text-[#10be33]">
                                    {formatPrice(
                                        heroProduct?.sale_price != null && Number(heroProduct.sale_price) < Number(heroProduct.base_price)
                                            ? Number(heroProduct.sale_price)
                                            : Number(heroProduct?.base_price ?? 0),
                                        'UZS',
                                    )}
                                </p>
                            </div>
                        </Link>
                    </div>
                </section>

                <section id="deals" className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-end gap-3">
                            <h2 className="text-[clamp(1.7rem,3vw,2.4rem)] font-black tracking-tight uppercase">{sectionCopy.dealsTitle}</h2>
                            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-[#6b7280] shadow-[0_12px_36px_-28px_rgba(17,24,39,0.35)] dark:bg-white/10 dark:text-white/70">
                                <Clock3 size={14} className="text-[#10be33]" />
                                12 : 45 : 08
                            </div>
                        </div>
                        <Link
                            href={WEB_LINKS.PRODUCTS}
                            className="inline-flex h-11 items-center rounded-full bg-[#13ec37] px-5 text-[12px] font-black uppercase tracking-[0.12em] text-[#04230d] transition-all duration-300 hover:-translate-y-0.5"
                        >
                            {sectionCopy.dealsAction}
                        </Link>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        {dealProducts.map((product, index) => {
                            const base = Number(product.base_price);
                            const sale = product.sale_price != null ? Number(product.sale_price) : null;
                            const current = sale != null && sale < base ? sale : base;
                            const discount = current < base ? Math.max(1, Math.round((1 - current / base) * 100)) : 0;
                            const inWish = wishlist.has(product.id);

                            return (
                                <div key={product.id} className="group rounded-[26px] border border-black/5 bg-white p-4 shadow-[0_18px_60px_-34px_rgba(17,24,39,0.32)] transition-all duration-300 hover:-translate-y-2 hover:border-black/10 hover:shadow-[0_28px_70px_-34px_rgba(17,24,39,0.42)] dark:border-white/10 dark:bg-[#151515] dark:hover:border-white/15">
                                    <Link href={`/product/${product.id}`} className="block">
                                        <div className="relative overflow-hidden rounded-[22px] bg-[#eef1f4]">
                                            <div className="pointer-events-none absolute inset-y-0 left-[-65%] z-[1] w-[42%] -skew-x-12 bg-white/20 opacity-0 blur-md transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
                                            <img src={imageFor(product, index)} alt={product.name} className="aspect-[0.95] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            {discount > 0 && (
                                                <span className="absolute left-3 top-3 rounded-full bg-[#10be33] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#04230d] transition-transform duration-300 group-hover:scale-105">
                                                    -{discount}% aksiya
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(event) => toggleWishlist(event, product.id)}
                                                className={cn(
                                                    'absolute right-3 top-3 rounded-full border p-2 transition-all duration-300 group-hover:scale-110',
                                                    inWish ? 'border-red-200 bg-white text-red-500' : 'border-black/10 bg-white/90 text-[#111111]',
                                                )}
                                            >
                                                <Heart size={14} className={inWish ? 'fill-current' : ''} />
                                            </button>
                                        </div>
                                        <div className="px-1 pt-4">
                                            <p className="text-[14px] font-bold text-[#111111] transition-colors duration-300 group-hover:text-[#10be33] dark:text-white dark:group-hover:text-[#84f89b]">{product.name}</p>
                                            <div className="mt-3 flex items-baseline gap-2">
                                                <span className="text-[28px] font-black tracking-tight text-[#2a33ff] transition-transform duration-300 group-hover:translate-x-1 dark:text-[#90a1ff]">{formatPrice(current, 'UZS')}</span>
                                                {current < base && (
                                                    <span className="text-[12px] text-[#9ca3af] line-through">{formatPrice(base, 'UZS')}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section id="featured" className="space-y-5">
                    <div>
                        <h2 className="text-[clamp(1.7rem,3vw,2.4rem)] font-black tracking-tight">{sectionCopy.popularTitle}</h2>
                        <p className="mt-1 text-[14px] text-[#6b7280] dark:text-white/60">{sectionCopy.popularDesc}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {popularProducts.map((product, index) => {
                            const base = Number(product.base_price);
                            const sale = product.sale_price != null ? Number(product.sale_price) : null;
                            const current = sale != null && sale < base ? sale : base;
                            const inWish = wishlist.has(product.id);

                            return (
                                <Link
                                    key={product.id}
                                    href={`/product/${product.id}`}
                                    className="group rounded-[24px] border border-black/5 bg-white p-3 shadow-[0_18px_50px_-34px_rgba(17,24,39,0.28)] transition-all duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-[#151515]"
                                >
                                    <div className="relative overflow-hidden rounded-[18px] bg-[#f0f2f5]">
                                        <img src={imageFor(product, index + 3)} alt={product.name} className="aspect-[0.92] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <button
                                            type="button"
                                            onClick={(event) => toggleWishlist(event, product.id)}
                                            className={cn(
                                                'absolute right-3 top-3 rounded-full bg-white/92 p-2 text-[#111111] shadow-sm',
                                                inWish && 'text-red-500',
                                            )}
                                        >
                                            <Heart size={14} className={inWish ? 'fill-current' : ''} />
                                        </button>
                                    </div>
                                    <div className="px-1 pt-4">
                                        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#10be33]">{tc(product.category_name ?? 'Product')}</p>
                                        <h3 className="mt-2 line-clamp-2 text-[14px] font-bold text-[#111111] dark:text-white">{product.name}</h3>
                                        <p className="mt-1 text-[12px] text-[#6b7280] dark:text-white/55">{product.store_name}</p>
                                        <p className="mt-3 text-[20px] font-black tracking-tight text-[#111111] dark:text-white">{formatPrice(current, 'UZS')}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    {serviceItems.map((item) => (
                        <div
                            key={item.title}
                            className="group rounded-[26px] bg-white px-5 py-7 text-center shadow-[0_18px_50px_-34px_rgba(17,24,39,0.22)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_26px_60px_-30px_rgba(17,24,39,0.3)] dark:bg-[#151515]"
                        >
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#13ec37]/12 text-[#10be33] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#13ec37]/18">
                                <item.icon size={22} />
                            </div>
                            <p className="mt-4 text-[15px] font-bold text-[#111111] transition-colors duration-300 group-hover:text-[#10be33] dark:text-white dark:group-hover:text-[#84f89b]">{item.title}</p>
                            <p className="mt-2 text-[12px] leading-5 text-[#6b7280] dark:text-white/60">{item.desc}</p>
                        </div>
                    ))}
                </section>

                <section className="grid gap-5 overflow-hidden rounded-[30px] bg-white shadow-[0_24px_80px_-40px_rgba(17,24,39,0.28)] dark:bg-[#151515] md:grid-cols-[0.92fr_1.08fr]">
                    <div className="flex flex-col justify-center px-5 py-7 md:px-8 md:py-8">
                        <div className="max-w-[430px]">
                            <p className="text-[clamp(1.7rem,3vw,2.6rem)] font-black leading-[0.92] tracking-[-0.04em] text-[#111111] dark:text-white">
                                <span className="block">{sectionCopy.partnerTitleA}</span>
                                <span className="mt-1 block text-[#10be33]">{sectionCopy.partnerTitleB}</span>
                                <span className="mt-1 block">{sectionCopy.partnerTitleC}</span>
                            </p>
                        </div>
                        <p className="mt-5 max-w-[39ch] text-[13px] leading-7 text-[#6b7280] dark:text-white/68">
                            {sectionCopy.partnerDesc}
                        </p>
                        <div className="hidden mt-5 space-y-3 text-[12px] text-[#111111] dark:text-white/80">
                            <div className="flex items-start gap-3"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#10be33]" /> <span>0% komissiya bilan boshlash imkoniyati</span></div>
                            <div className="flex items-center gap-3"><ShoppingBag size={16} className="text-[#10be33]" /> Shaxsiy do‘kon sahifasi va mahsulot vitrinası</div>
                            <div className="flex items-start gap-3"><ArrowRight size={16} className="mt-0.5 shrink-0 text-[#10be33]" /> <span>Tez ariza va moderatsiya jarayoni</span></div>
                        </div>
                        <div className="mt-5 space-y-3 text-[12px] text-[#111111] dark:text-white/80">
                            <div className="flex items-start gap-3"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#10be33]" /> <span>0% komissiya bilan boshlash imkoniyati</span></div>
                            <div className="flex items-start gap-3"><ShoppingBag size={16} className="mt-0.5 shrink-0 text-[#10be33]" /> <span>Shaxsiy do'kon sahifasi va mahsulot vitrinası</span></div>
                            <div className="flex items-start gap-3"><ArrowRight size={16} className="mt-0.5 shrink-0 text-[#10be33]" /> <span>Tez ariza va moderatsiya jarayoni</span></div>
                        </div>
                        <div className="mt-7">
                            <Link
                                href="/open-store"
                                className="inline-flex h-11 items-center rounded-full bg-[#13ec37] px-5 text-[11px] font-black uppercase tracking-[0.12em] text-[#04230d] transition-all duration-300 hover:-translate-y-0.5"
                            >
                                {sectionCopy.partnerCta}
                            </Link>
                        </div>
                    </div>

                    <div className="min-h-[220px] md:min-h-[380px]">
                        <img
                            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1400&auto=format&fit=crop"
                            alt="Two businessmen meeting"
                            className="h-full w-full object-cover"
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}
