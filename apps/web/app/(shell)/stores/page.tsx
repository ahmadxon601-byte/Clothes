'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Store as StoreIcon } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '../../../src/features/products/ui/ProductCard';
import { cn } from '../../../src/shared/lib/utils';
import { useTranslation } from '../../../src/shared/lib/i18n';
import { useAppRoutes } from '../../../src/shared/config/useAppRoutes';
import { mockApi } from '../../../src/services/mockServer';
import type { Product, Store } from '../../../src/shared/types';
import { Skeleton } from '../../../src/shared/ui/Skeleton';

const CATEGORIES = ['All', 'Jackets', 'Shirts', 'Shoes', 'Pants', 'Hoodies', 'Accessories', 'T-Shirts'] as const;
type Category = (typeof CATEGORIES)[number];

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<Category>('All');
    const [loading, setLoading] = useState(true);
    const { t, language } = useTranslation();
    const routes = useAppRoutes();
    const categoryLabels: Record<Category, string> = {
        All: t.all,
        Jackets: t.cat_jackets,
        Shirts: t.cat_shirts,
        Shoes: t.cat_shoes,
        Pants: t.cat_pants,
        Hoodies: t.cat_hoodies,
        Accessories: t.cat_accessories,
        'T-Shirts': t.cat_tshirts,
    };

    useEffect(() => {
        let active = true;
        Promise.all([mockApi.listProducts(), mockApi.listStores()])
            .then(([productData, storeData]) => {
                if (!active) return;
                setProducts(productData);
                setStores(storeData);
                setLoading(false);
            })
            .catch(() => {
                if (!active) return;
                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    // Promo carousel (copied from products view)
    const PROMOS = [
        {
            title: "Birinchi xarid uchun maxsus chegirma!",
            badge: "Maxsus Taklif",
            bg: "bg-[#D7FF35]",
            image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=400&auto=format&fit=crop"
        },
        {
            title: "Yozgi kolleksiya: 50% gacha keshbek",
            badge: "Yozgi Sotuv",
            bg: "bg-[#13EC37]",
            image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=400&auto=format&fit=crop"
        },
        {
            title: "Yangi kelgan: Eksklyuziv krossovkalar",
            badge: "Yangi",
            bg: "bg-[#35D7FF]",
            image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop"
        }
    ];

    const [activePromo, setActivePromo] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActivePromo((prev) => (prev + 1) % PROMOS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const nextPromo = () => setActivePromo((prev) => (prev + 1) % PROMOS.length);
    const prevPromo = () => setActivePromo((prev) => (prev - 1 + PROMOS.length) % PROMOS.length);
    const currentPromo = PROMOS[activePromo];
    const promoCtaLabel = language === 'ru' ? 'View Products' : language === 'en' ? 'View Products' : "Mahsulotlarni ko'rish";

    const storeMap = useMemo(() => {
        const map = new Map<string, string>();
        stores.forEach((store) => map.set(store.id, store.name));
        return map;
    }, [stores]);

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();
        return products.filter((product) => {
            const byCategory = activeCategory === 'All' || product.category === activeCategory;
            if (!byCategory) return false;
            if (!query) return true;
            const titleMatch = product.title.toLowerCase().includes(query);
            const storeName = (storeMap.get(product.storeId) || '').toLowerCase();
            return titleMatch || storeName.includes(query);
        });
    }, [activeCategory, products, search, storeMap]);

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] px-5 py-3 md:px-8 lg:px-10">
            <div className="pb-3">
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-hint)] opacity-50">
                        <Search size={18} />
                    </div>
                    <input
                        placeholder={t.search}
                        className="h-[44px] w-full bg-[var(--color-surface)] rounded-full pl-[44px] pr-11 outline-none font-medium text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-hint)]/60 border border-[var(--color-border)] focus:ring-2 ring-[var(--color-primary)]/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[var(--color-hint)]/10 rounded-full"
                            aria-label="Clear search"
                        >
                            <X size={14} className="text-[var(--color-hint)]" />
                        </button>
                    )}
                </div>
            </div>

            {/* Promo block moved to first page */}
            <div className="py-2.5">
                <div className="group relative h-[180px] rounded-[24px] overflow-hidden flex shadow-lg transition-all duration-700">
                    <div className={"w-[60%] p-6 flex flex-col justify-between transition-colors duration-700 relative z-10 " + currentPromo.bg}>
                        <div className="animate-in fade-in slide-in-from-left-6 duration-700">
                            <span className="inline-block px-2.5 py-0.5 bg-[#121417]/10 backdrop-blur-md text-[#121417] text-[8.5px] font-bold rounded-full mb-1.5 uppercase tracking-[0.05em] border border-[#121417]/10">
                                {currentPromo.badge}
                            </span>
                            <h2 className="text-[17px] font-black text-[#121417] leading-tight tracking-tight drop-shadow-sm">
                                {currentPromo.title}
                            </h2>
                            <Link
                                href={routes.PRODUCTS}
                                className="inline-flex items-center gap-2 mt-3 px-4 h-10 rounded-xl bg-[#121417] text-white text-[14px] font-bold shadow-md active:scale-95 transition-transform"
                            >
                                {promoCtaLabel}
                                <ChevronRight size={16} />
                            </Link>
                        </div>
                    </div>
                    <div className="w-[40%] bg-[#E6E8E6] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent z-10" />
                        <img
                            key={activePromo}
                            src={currentPromo.image}
                            className="absolute inset-0 w-full h-full object-cover animate-in fade-in zoom-in-110 duration-1000 origin-center"
                            alt="promo"
                        />
                    </div>

                    <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none z-30">
                        <button
                            onClick={(e) => { e.preventDefault(); prevPromo(); }}
                            className="w-10 h-10 flex items-center justify-center bg-black/10 backdrop-blur-md text-[#121417] rounded-full pointer-events-auto active:scale-90 transition-all border border-black/5 hover:bg-black/20 z-40"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); nextPromo(); }}
                            className="w-10 h-10 flex items-center justify-center bg-black/10 backdrop-blur-md text-[#121417] rounded-full pointer-events-auto active:scale-90 transition-all border border-black/5 hover:bg-black/20 z-40"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex gap-2.5 pb-3 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                            'px-5 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all border',
                            activeCategory === cat
                                ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-transparent'
                                : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
                        )}
                    >
                        {categoryLabels[cat] || cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i}>
                            <Skeleton className="aspect-[3.5/4.5] w-full rounded-3xl" />
                            <Skeleton className="h-4 w-3/4 mt-3" />
                            <Skeleton className="h-4 w-1/2 mt-1" />
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8 pb-4">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            storeName={storeMap.get(product.storeId) || 'Store'}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--color-hint)]">
                    <Search size={28} className="opacity-40 mb-2" />
                    <p className="text-sm font-medium">{t.no_search_results}</p>
                </div>
            )}
        </div>
    );
}
