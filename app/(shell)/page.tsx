'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowRight,
    BadgePercent,
    Clock3,
    Compass,
    Headphones,
    Heart,
    ShieldCheck,
    ShoppingBag,
    TrendingUp,
} from 'lucide-react';
import { SITE_ROUTES } from '../../src/shared/config/constants';
import { fetchProducts } from '../../src/lib/apiClient';
import type { ApiProduct } from '../../src/lib/apiClient';
import { formatPrice } from '../../src/shared/lib/formatPrice';
import { repairText, repairTextTree } from '../../src/shared/lib/repairText';
import { stripRichText } from '../../src/shared/lib/richText';
import { translateText, type UiLanguage } from '../../src/shared/lib/translateClient';
import { cn } from '../../src/shared/lib/utils';
import { useWebI18n } from '../../src/shared/lib/webI18n';
import { useWebAuth } from '../../src/context/WebAuthContext';
import { AuthModal } from '../../src/shared/ui/AuthModal';
import { useSSERefetch } from '../../src/shared/hooks/useSSERefetch';

interface HeroBannerProduct {
    id: string;
    name: string;
    name_uz?: string | null;
    name_ru?: string | null;
    name_en?: string | null;
    base_price: number;
    sale_price: number | null;
    thumbnail: string | null;
}

interface HeroBanner {
    id: string;
    title: string;
    title_uz?: string | null;
    title_ru?: string | null;
    title_en?: string | null;
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

const HERO_COPY = repairTextTree({
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
        title: ['Всё', 'в одном', 'месте.'],
        desc: 'Откройте электронику, одежду и товары на каждый день в одном месте с отобранными и надежными предложениями.',
        secondary: 'Категории',
        floating: 'Избранные предложения',
    },
} as const);

const SECTION_COPY = repairTextTree({
    uz: {
        categoryTitle: 'Kategoriyalar',
        categoryDesc: 'Eng ko?p ko?rilayotgan bo?limlar va tavsiya etilgan yo?nalishlar.',
        dealsTitle: 'Kun taklifi',
        dealsAction: 'Barchasini ko?rish',
        popularTitle: 'Ommabop mahsulotlar',
        popularDesc: 'Xaridorlar eng ko?p ko?rgan va tanlagan mahsulotlar.',
        partnerTitleA: 'Biz bilan birga',
        partnerTitleB: 'biznesingizni',
        partnerTitleC: 'rivojlantiring',
        partnerDesc: 'Qulaymarket platformasida o?z do?koningizni oching, mahsulotlaringizni ko?proq xaridorga ko?rsating va savdoni tezroq yo?lga qo?ying.',
        partnerCta: 'Do?kon ochish',
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
        categoryDesc: 'Самые просматриваемые разделы и рекомендуемые направления.',
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
} as const);

const PARTNER_COPY = repairTextTree({
    uz: {
        startZero: '0% komissiya bilan boshlash imkoniyati',
        storefront: "Shaxsiy do'kon sahifasi va mahsulot vitrinasi",
        fastReview: 'Tez ariza va moderatsiya jarayoni',
        bannerOffer: 'uchun maxsus banner taklifi.',
        premiumCollection: 'Tanlangan mahsulot',
        saleLabel: 'aksiya',
    },
    en: {
        startZero: 'Start with 0% commission',
        storefront: 'Personal store page and product storefront',
        fastReview: 'Fast application and moderation flow',
        bannerOffer: 'featured in this banner.',
        premiumCollection: 'Featured product',
        saleLabel: 'off',
    },
    ru: {
        startZero: 'Старт с комиссией 0%',
        storefront: 'Личная страница магазина и витрина товаров',
        fastReview: 'Быстрая заявка и модерация',
        bannerOffer: 'в специальной баннерной подборке.',
        premiumCollection: 'Избранный товар',
        saleLabel: 'скидка',
    },
} as const);

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('marketplace_token');
}

function imageFor(product: { thumbnail: string | null } | undefined, index: number) {
    return product?.thumbnail || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function detectSourceLanguage(text: string): UiLanguage {
    if (/[А-Яа-яЁё]/.test(text)) return 'ru';
    if (/[A-Za-z]/.test(text)) return 'uz';
    return 'uz';
}

function looksLikeBrokenName(text: string) {
    const normalized = text.trim().toLowerCase();
    if (!normalized) return true;
    if (/^[a-z]{6,}$/.test(normalized) && !/[aeiou]/.test(normalized)) return true;
    if (/^(.)\1{3,}$/.test(normalized)) return true;
    return false;
}

function decodeTextEntities(text: string) {
    return stripRichText(text || '');
}

function normalizeTranslatedText(text: string) {
    return decodeTextEntities(repairText(text || ''));
}

function getLocalizedValue<T extends { name?: string | null; name_uz?: string | null; name_ru?: string | null; name_en?: string | null }>(
    item: T,
    language: UiLanguage,
) {
    const raw =
        language === 'ru'
            ? item.name_ru || item.name
            : language === 'en'
                ? item.name_en || item.name
                : item.name_uz || item.name;
    return repairText(raw || '');
}

function getLocalizedBannerTitle(banner: HeroBanner, language: UiLanguage) {
    const raw =
        language === 'ru'
            ? banner.title_ru || banner.title
            : language === 'en'
                ? banner.title_en || banner.title
                : banner.title_uz || banner.title;
    return decodeTextEntities(repairText(raw || ''));
}

export default function WebsiteHomePage() {
    const { w, language, tc } = useWebI18n();
    const { user, loading: authLoading } = useWebAuth();
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
    const [dailyDealProducts, setDailyDealProducts] = useState<ApiProduct[]>([]);
    const [dailyDealEndsAt, setDailyDealEndsAt] = useState<string | null>(null);
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());
    const [authModal, setAuthModal] = useState(false);
    const [countdownText, setCountdownText] = useState('00 : 00 : 00');
    const [translatedBannerTitle, setTranslatedBannerTitle] = useState('');
    const [translatedNames, setTranslatedNames] = useState<Record<string, string>>({});

    const heroCopy = HERO_COPY[language] ?? HERO_COPY.uz;
    const sectionCopy = SECTION_COPY[language] ?? SECTION_COPY.uz;
    const partnerCopy = PARTNER_COPY[language] ?? PARTNER_COPY.uz;
    const genericProductLabel = language === 'ru' ? 'Товар' : language === 'en' ? 'Product' : 'Mahsulot';

    const loadProducts = useCallback(() => {
        fetchProducts({ limit: 24 }).then(({ products: data }) => setProducts(data)).catch(() => { });
    }, []);

    const loadDailyDeals = useCallback(async () => {
        try {
            const res = await fetch('/api/daily-deals/active', { cache: 'no-store' });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) return;
            setDailyDealProducts(json?.data?.products ?? json?.products ?? []);
            setDailyDealEndsAt(json?.data?.expires_at ?? json?.expires_at ?? null);
        } catch {
            setDailyDealProducts([]);
            setDailyDealEndsAt(null);
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

    useEffect(() => {
        const formatCountdown = (target: string | null) => {
            if (!target) return '00 : 00 : 00';
            const diff = new Date(target).getTime() - Date.now();
            if (diff <= 0) return '00 : 00 : 00';
            const totalSeconds = Math.floor(diff / 1000);
            const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(totalSeconds % 60).padStart(2, '0');
            return `${hours} : ${minutes} : ${seconds}`;
        };

        setCountdownText(formatCountdown(dailyDealEndsAt));
        const timer = window.setInterval(() => {
            setCountdownText(formatCountdown(dailyDealEndsAt));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [dailyDealEndsAt]);

    useEffect(() => {
        let cancelled = false;

        const translateDynamicCopy = async () => {
            const nameEntries = new Map<string, string>();

            const queueName = (id: string, label: string) => {
                if (!label.trim() || nameEntries.has(id)) return;
                nameEntries.set(id, label);
            };

            products.forEach((product) => queueName(product.id, getLocalizedValue(product, language)));
            dailyDealProducts.forEach((product) => queueName(product.id, getLocalizedValue(product, language)));
            heroBanner?.products.forEach((product) => queueName(product.id, getLocalizedValue(product, language)));

            const nextNames = Object.fromEntries(nameEntries);
            setTranslatedNames(nextNames);

            const heroTitle = heroBanner ? getLocalizedBannerTitle(heroBanner, language) : '';
            setTranslatedBannerTitle(heroTitle);

            if (language === 'uz') return;

            const translatedPairs = await Promise.all(
                Array.from(nameEntries.entries()).map(async ([id, label]) => {
                    try {
                        const translated = await translateText(label, language, detectSourceLanguage(label));
                        return [id, normalizeTranslatedText(translated)] as const;
                    } catch {
                        return [id, label] as const;
                    }
                }),
            );

            let translatedTitle = heroTitle;
            if (heroTitle.trim()) {
                try {
                    translatedTitle = normalizeTranslatedText(
                        await translateText(heroTitle, language, detectSourceLanguage(heroTitle))
                    );
                } catch {
                    translatedTitle = heroTitle;
                }
            }

            if (cancelled) return;
            setTranslatedNames(Object.fromEntries(translatedPairs));
            setTranslatedBannerTitle(translatedTitle);
        };

        void translateDynamicCopy();

        return () => {
            cancelled = true;
        };
    }, [dailyDealProducts, heroBanner, language, products]);

    useSSERefetch(['products', 'banners', 'daily_deals'], () => {
        loadProducts();
        void loadHeroBanner();
        void loadDailyDeals();
    });

    const heroProduct = heroBanner?.products?.[0] ?? products[0];
    const displayName = useCallback(
        (product?: { id: string; name?: string | null; name_uz?: string | null; name_ru?: string | null; name_en?: string | null } | null) => {
            if (!product) return '';
            const label = translatedNames[product.id] ?? getLocalizedValue(product, language);
            return looksLikeBrokenName(label) ? genericProductLabel : label;
        },
        [genericProductLabel, language, translatedNames],
    );
    const heroTitleLines = useMemo(() => {
        const title = translatedBannerTitle.trim();
        if (!title) {
            return heroCopy.title;
        }

        const words = title.split(/\s+/);
        if (words.length <= 2) {
            return [title, '', ''].filter(Boolean);
        }

        const firstBreak = Math.ceil(words.length / 3);
        const secondBreak = Math.ceil((words.length * 2) / 3);
        const lines = [
            words.slice(0, firstBreak).join(' '),
            words.slice(firstBreak, secondBreak).join(' '),
            words.slice(secondBreak).join(' '),
        ].filter(Boolean);

        return lines.length ? lines : heroCopy.title;
    }, [heroCopy.title, translatedBannerTitle]);
    const heroDescription = heroBanner
        ? heroBanner.products.length > 1
            ? `${heroBanner.products.slice(0, 3).map((product) => displayName(product)).join(', ')} ${partnerCopy.bannerOffer}`
            : `${displayName(heroProduct) || partnerCopy.premiumCollection} ${partnerCopy.bannerOffer}`
        : heroCopy.desc;
    const heroFloatingTitle = heroBanner ? translatedBannerTitle || heroCopy.floating : heroCopy.floating;
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
            { icon: Headphones, title: w.home.services[0]?.title ?? '24/7 Qo‘llab-quvvatlash', desc: w.home.services[0]?.desc ?? 'Har qanday savolga tezkor javob' },
            { icon: BadgePercent, title: w.home.services[1]?.title ?? 'Eng Yaxshi Narxlar', desc: w.home.services[1]?.desc ?? 'Doimiy aksiyalar va chegirmalar' },
            { icon: TrendingUp, title: w.home.services[2]?.title ?? 'Trend Mahsulotlar', desc: w.home.services[2]?.desc ?? 'Hozir mashhur bo‘lgan narsalar bir joyda' },
            { icon: Compass, title: w.home.services[3]?.title ?? 'Oson Navigatsiya', desc: w.home.services[3]?.desc ?? 'Kerakli mahsulotni tez toping' },
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

            <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-3 py-4 sm:px-4 md:px-5 md:py-6 lg:gap-10 lg:px-6 xl:gap-12 xl:px-8">
                <section className="relative grid gap-6 overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,rgba(19,236,55,0.08),rgba(255,255,255,0.96),rgba(19,236,55,0.05))] p-4 shadow-[0_24px_80px_-40px_rgba(17,24,39,0.28)] dark:bg-[linear-gradient(135deg,rgba(19,236,55,0.14),rgba(19,19,19,0.96),rgba(19,236,55,0.08))] sm:gap-7 sm:p-5 md:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] md:items-center md:gap-8 md:p-7 lg:rounded-[34px] lg:p-10 xl:grid-cols-[1.12fr_0.88fr]">
                    <div className="relative z-[1] flex min-w-0 max-w-[720px] flex-col justify-center">
                        <span
                            className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#13ec37]/20 bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#0d6c23] shadow-[0_16px_40px_-28px_rgba(19,236,55,0.55)] backdrop-blur dark:bg-white/8 dark:text-[#84f89b] sm:mb-5"
                        >
                            <span className="h-2 w-2 rounded-full bg-[#13ec37]" />
                            {heroCopy.badge}
                        </span>
                        <h1 className="max-w-[10ch] break-words text-[clamp(1.8rem,8vw,4.8rem)] font-black leading-[0.96] tracking-[-0.05em] text-[#111111] dark:text-white sm:text-[clamp(2.1rem,7vw,4.8rem)]">
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
                        <p className="mt-3 max-w-[40ch] text-[13px] leading-6 text-[#5f6571] dark:text-white/70 sm:mt-5 sm:text-[15px] sm:leading-8">
                            {heroDescription}
                        </p>
                    </div>

                    <div className="relative z-[1] flex min-h-[220px] min-w-0 items-center justify-center pt-0 sm:min-h-[280px] sm:pt-3 md:min-h-[380px] md:justify-end lg:min-h-[460px]">
                        <div className="absolute inset-x-[8%] top-[16%] h-[62%] rounded-full bg-[#13ec37]/15 blur-[56px] sm:blur-[70px]" />
                        <div className="pointer-events-none absolute right-[10%] top-[4%] hidden rounded-full border border-white/60 bg-white/85 px-4 py-3 text-left shadow-[0_18px_40px_-28px_rgba(17,24,39,0.32)] backdrop-blur dark:border-white/10 dark:bg-[#161616]/85 sm:block">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#10be33]">{partnerCopy.premiumCollection}</p>
                            <p className="mt-1 text-[13px] font-semibold text-[#111111] dark:text-white">{heroFloatingTitle}</p>
                        </div>
                        <Link
                            href={heroProduct ? `/product/${heroProduct.id}` : WEB_LINKS.PRODUCTS}
                            className="group relative block w-full max-w-[320px] overflow-hidden rounded-[22px] bg-[#151819] p-2 shadow-[0_32px_80px_-30px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_40px_90px_-32px_rgba(0,0,0,0.7)] sm:max-w-[420px] sm:rotate-[3deg] sm:p-3 md:max-w-[470px] md:rotate-[4deg] lg:max-w-[560px] lg:rotate-[6deg]"
                        >
                            <img
                                src={imageFor(heroProduct, 2)}
                                alt={displayName(heroProduct) || 'Hero product'}
                                className="aspect-[1.02] w-full rounded-[18px] object-cover transition-transform duration-500 group-hover:scale-[1.03] sm:aspect-[1.1] sm:rounded-[22px]"
                            />
                            <div className="absolute bottom-2 left-2 right-2 rounded-[16px] bg-white/92 px-3 py-2 shadow-[0_18px_50px_-28px_rgba(17,24,39,0.4)] backdrop-blur sm:right-auto sm:max-w-[80%] sm:rounded-[22px] sm:px-4 sm:py-3 md:bottom-4 md:left-0 dark:bg-[#161616]/90">
                                <p className="line-clamp-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#10be33] sm:text-[10px] sm:tracking-[0.15em]">{heroFloatingTitle}</p>
                                <p className="mt-1 line-clamp-2 text-[13px] font-bold text-[#111111] dark:text-white sm:text-[14px]">{displayName(heroProduct) || partnerCopy.premiumCollection}</p>
                                <p className="mt-1 text-[12px] font-black text-[#10be33] sm:text-[13px]">
                                    {formatPrice(
                                        heroProduct?.sale_price != null && Number(heroProduct.sale_price) < Number(heroProduct.base_price)
                                            ? Number(heroProduct.sale_price)
                                            : Number(heroProduct?.base_price ?? 0),
                                        'UZS',
                                        language,
                                    )}
                                </p>
                            </div>
                        </Link>
                    </div>
                </section>

                <section id="deals" className="space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <h2 className="text-[clamp(1.7rem,3vw,2.4rem)] font-black tracking-tight uppercase">{sectionCopy.dealsTitle}</h2>
                            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-[#6b7280] shadow-[0_12px_36px_-28px_rgba(17,24,39,0.35)] dark:bg-white/10 dark:text-white/70">
                                <Clock3 size={14} className="text-[#10be33]" />
                                {countdownText}
                            </div>
                        </div>
                        <Link
                            href={WEB_LINKS.PRODUCTS}
                            className="inline-flex h-11 items-center rounded-full bg-[#13ec37] px-5 text-[12px] font-black uppercase tracking-[0.12em] text-[#04230d] transition-all duration-300 hover:-translate-y-0.5"
                        >
                            {sectionCopy.dealsAction}
                        </Link>
                    </div>

                    <div className="grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
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
                                            <img src={imageFor(product, index)} alt={displayName(product)} className="aspect-[0.95] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            {discount > 0 && (
                                                <span className="absolute left-3 top-3 rounded-full bg-[#10be33] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#04230d] transition-transform duration-300 group-hover:scale-105">
                                                    -{discount}% {partnerCopy.saleLabel}
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
                                            <p className="line-clamp-2 text-[14px] font-bold text-[#111111] transition-colors duration-300 group-hover:text-[#10be33] dark:text-white dark:group-hover:text-[#84f89b]">{displayName(product)}</p>
                                            <div className="mt-3 flex flex-wrap items-baseline gap-2">
                                                <span className="text-[22px] font-black tracking-tight text-[#10be33] transition-transform duration-300 group-hover:translate-x-1 dark:text-[#84f89b] sm:text-[28px]">{formatPrice(current, 'UZS', language)}</span>
                                                {current < base && (
                                                    <span className="text-[12px] text-[#9ca3af] line-through">{formatPrice(base, 'UZS', language)}</span>
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

                    <div className="grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                                        <img src={imageFor(product, index + 3)} alt={displayName(product)} className="aspect-[0.92] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
                                        <h3 className="mt-2 line-clamp-2 text-[14px] font-bold text-[#111111] dark:text-white">{displayName(product)}</h3>
                                        <p className="mt-1 line-clamp-1 text-[12px] text-[#6b7280] dark:text-white/55">{product.store_name}</p>
                                        <p className="mt-3 text-[20px] font-black tracking-tight text-[#111111] dark:text-white">{formatPrice(current, 'UZS', language)}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {serviceItems.map((item) => (
                        <div
                            key={item.title}
                            className="group rounded-[26px] bg-white px-5 py-7 text-center shadow-[0_18px_50px_-34px_rgba(17,24,39,0.22)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_26px_60px_-30px_rgba(17,24,39,0.3)] active:-translate-y-1 active:shadow-[0_22px_54px_-30px_rgba(17,24,39,0.28)] dark:bg-[#151515]"
                        >
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#13ec37]/12 text-[#10be33] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#13ec37]/18 group-active:scale-105 group-active:bg-[#13ec37]/18">
                                <item.icon size={22} />
                            </div>
                            <p className="mt-4 text-[15px] font-bold text-[#111111] transition-colors duration-300 group-hover:text-[#10be33] group-active:text-[#10be33] dark:text-white dark:group-hover:text-[#84f89b] dark:group-active:text-[#84f89b]">{item.title}</p>
                            <p className="mt-2 text-[12px] leading-5 text-[#6b7280] dark:text-white/60">{item.desc}</p>
                        </div>
                    ))}
                </section>

                <section className="grid gap-5 overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_-40px_rgba(17,24,39,0.28)] dark:bg-[#151515] md:grid-cols-[0.92fr_1.08fr] lg:rounded-[30px]">
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
                            <div className="flex items-center gap-3"><ShoppingBag size={16} className="text-[#10be33]" /> Shaxsiy do'kon sahifasi va mahsulot vitrinasi</div>
                            <div className="flex items-start gap-3"><ArrowRight size={16} className="mt-0.5 shrink-0 text-[#10be33]" /> <span>Tez ariza va moderatsiya jarayoni</span></div>
                        </div>
                        <div className="mt-5 space-y-3 text-[12px] text-[#111111] dark:text-white/80">
                            <div className="flex items-start gap-3"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#10be33]" /> <span>{partnerCopy.startZero}</span></div>
                            <div className="flex items-start gap-3"><ShoppingBag size={16} className="mt-0.5 shrink-0 text-[#10be33]" /> <span>{partnerCopy.storefront}</span></div>
                            <div className="flex items-start gap-3"><ArrowRight size={16} className="mt-0.5 shrink-0 text-[#10be33]" /> <span>{partnerCopy.fastReview}</span></div>
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

