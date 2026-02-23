'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search, Moon, Globe, Sun } from 'lucide-react';
import { ProductCard } from '../../src/features/products/ui/ProductCard';
import { Skeleton } from '../../src/shared/ui/Skeleton';
import { mockApi } from '../../src/services/mockServer';
import { useSettingsStore } from '../../src/features/settings/model';
import type { Product } from '../../src/shared/types';
import { cn } from '../../src/shared/lib/utils';
import Link from 'next/link';

const CATEGORIES = ['All', 'Jackets', 'Shirts', 'Pants', 'Shoes', 'Accessories'];

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

export default function HomePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const [activePromo, setActivePromo] = useState(0);

    const settings = useSettingsStore(s => s.settings);
    const updateSettings = useSettingsStore(s => s.updateSettings);

    const fetchProducts = useCallback(async (cat: string) => {
        setLoading(true);
        try {
            const res = await mockApi.listProducts({
                category: cat === 'All' ? undefined : cat,
            });
            setProducts(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const catParam = searchParams.get('category');
        if (catParam && CATEGORIES.includes(catParam)) {
            setCategory(catParam);
        } else {
            setCategory('All');
        }
    }, [searchParams]);

    useEffect(() => {
        fetchProducts(category);
    }, [category, fetchProducts]);

    useEffect(() => {
        const timer = setInterval(() => {
            setActivePromo((prev) => (prev + 1) % PROMOS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [activePromo]); // Reset interval if manually changed

    const nextPromo = () => setActivePromo((prev) => (prev + 1) % PROMOS.length);
    const prevPromo = () => setActivePromo((prev) => (prev - 1 + PROMOS.length) % PROMOS.length);

    const toggleTheme = () => {
        updateSettings({ themeMode: settings.themeMode === 'dark' ? 'light' : 'dark' });
    };

    const currentPromo = PROMOS[activePromo];

    return (
        <div className="flex flex-col min-h-full pb-32">
            {/* Custom Header */}
            <header className="flex items-center justify-between px-6 pt-6 pb-4">
                <button
                    onClick={toggleTheme}
                    className="w-12 h-12 flex items-center justify-center bg-[var(--color-surface)] rounded-full shadow-sm text-[var(--color-text)] active:scale-95 transition-all"
                >
                    {settings.themeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <h1 className="text-[20px] font-bold text-[var(--color-text)]">Clothes MP</h1>
                <button className="w-12 h-12 flex items-center justify-center bg-[var(--color-surface)] rounded-full shadow-sm text-[var(--color-text)]">
                    <Globe size={20} />
                </button>
            </header>

            {/* Search Bar Link */}
            <div className="px-6 py-2">
                <Link href="/search" className="flex items-center h-[56px] w-full bg-[var(--color-surface)] rounded-full px-5 gap-3 shadow-sm text-[var(--color-hint)]">
                    <Search size={22} className="opacity-40" />
                    <span className="text-[15px]">Mahsulot qidirish...</span>
                </Link>
            </div>

            {/* Promo Banner */}
            <div className="px-6 py-4">
                <div className="group relative h-[210px] rounded-[32px] overflow-hidden flex shadow-lg transition-all duration-700">
                    <div className={cn("w-[55%] p-8 flex flex-col justify-between transition-colors duration-700 relative z-10", currentPromo.bg)}>
                        <div className="animate-in fade-in slide-in-from-left-6 duration-700">
                            <span className="inline-block px-3 py-1.5 bg-[#121417]/10 backdrop-blur-md text-[#121417] text-[11px] font-bold rounded-full mb-4 uppercase tracking-[0.05em] border border-[#121417]/10">{currentPromo.badge}</span>
                            <h2 className="text-[22px] font-black text-[#121417] leading-tight tracking-tight drop-shadow-sm">{currentPromo.title}</h2>
                        </div>
                        <button className="w-fit flex items-center gap-2.5 bg-[#121417] text-white px-7 py-3.5 rounded-2xl text-[14px] font-bold active:scale-95 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                            Sotib olish
                            <ChevronRight size={16} strokeWidth={3} className="opacity-80" />
                        </button>
                    </div>
                    <div className="w-[45%] bg-[#E6E8E6] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent z-10" />
                        <img
                            key={activePromo}
                            src={currentPromo.image}
                            className="absolute inset-0 w-full h-full object-cover animate-in fade-in zoom-in-110 duration-1000 origin-center"
                            alt="promo"
                        />
                    </div>

                    {/* Navigation Buttons */}
                    <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.preventDefault(); prevPromo(); }}
                            className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-full pointer-events-auto active:scale-90 transition-all border border-white/20 hover:bg-white/40"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); nextPromo(); }}
                            className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-full pointer-events-auto active:scale-90 transition-all border border-white/20 hover:bg-white/40"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Dots indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 backdrop-blur-sm bg-black/10 p-1.5 rounded-full">
                        {PROMOS.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-500",
                                    activePromo === i ? "w-5 bg-white shadow-sm" : "w-1.5 bg-black/20"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-3 px-6 py-3 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={cn(
                            "px-8 py-3.5 rounded-full text-[14px] font-bold transition-all whitespace-nowrap shadow-sm border",
                            category === cat
                                ? "bg-[var(--color-text)] text-[var(--color-bg)] border-transparent"
                                : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-hint)]/30"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Product Feed */}
            <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[20px] font-bold text-[var(--color-text)]">Special for you</h2>
                    <Link href="/search" className="text-[var(--color-primary)] text-[15px] font-bold">See All</Link>
                </div>
                {loading ? (
                    <div className="grid grid-cols-2 gap-x-5 gap-y-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i}>
                                <Skeleton className="aspect-[3.5/4.5] w-full rounded-3xl" />
                                <Skeleton className="h-4 w-3/4 mt-3" />
                                <Skeleton className="h-4 w-1/2 mt-1" />
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-5 gap-y-8">
                        {products.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <Search size={40} className="mb-2 opacity-10" />
                        <p className="text-[15px] font-medium">No products found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
