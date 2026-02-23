'use client';
import { useEffect, useState } from 'react';
import { Search, ChevronLeft, SlidersHorizontal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../src/shared/lib/utils';
import { APP_ROUTES } from '../../../src/shared/config/constants';
import { mockApi } from '../../../src/services/mockServer';
import { ProductCard } from '../../../src/features/products/ui/ProductCard';
import { Skeleton } from '../../../src/shared/ui/Skeleton';
import type { Product } from '../../../src/shared/types';

const CATEGORIES = [
    'Jackets', 'Shirts', 'Shoes', 'Pants', 'Hoodies', 'Accessories', 'T-Shirts'
];

export default function SearchPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!search.trim() && !activeCategory) {
            setProducts([]);
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            const results = await mockApi.listProducts({
                q: search,
                category: activeCategory || undefined
            });
            setProducts(results);
            setLoading(false);
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [search, activeCategory]);

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] pb-32">
            {/* Header */}
            <header className="flex items-center justify-between px-6 pt-6 pb-4">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 flex items-center justify-center bg-[var(--color-surface)] rounded-full shadow-sm border border-[var(--color-border)] text-[var(--color-text)]"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-[20px] font-bold text-[var(--color-text)]">Qidiruv</h1>
                <button className="w-12 h-12 flex items-center justify-center bg-[var(--color-surface)] rounded-full shadow-sm border border-[var(--color-border)] text-[var(--color-text)]">
                    <SlidersHorizontal size={20} />
                </button>
            </header>

            {/* Search Input */}
            <div className="px-6 py-4">
                <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-hint)] opacity-50">
                        <Search size={22} />
                    </div>
                    <input
                        autoFocus
                        placeholder="Mahsulot qidirish"
                        className="h-[56px] w-full bg-[var(--color-surface2)] rounded-full pl-[56px] pr-12 outline-none font-medium text-[15px] text-[var(--color-text)] focus:ring-2 ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-hint)]/60"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[var(--color-hint)]/10 rounded-full"
                        >
                            <X size={14} className="text-[var(--color-hint)]" />
                        </button>
                    )}
                </div>
            </div>

            {/* Tags / Categories Selection */}
            {!search && (
                <div className="px-6 pt-4">
                    <div className="flex flex-wrap gap-3">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                                className={cn(
                                    "px-8 py-3.5 border rounded-full text-[14px] font-bold transition-all shadow-sm active:scale-95",
                                    activeCategory === cat
                                        ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                                        : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-hint)]/30"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Results */}
            <div className="px-6 mt-6">
                {(search || activeCategory) && (
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-[var(--color-text)]">
                            {loading ? 'Qidirilmoqda...' : `${products.length} ta mahsulot topildi`}
                        </h2>
                        {products.length > 0 && !loading && (
                            <span className="text-xs font-medium text-[var(--color-hint)]">Natijalar</span>
                        )}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (search || activeCategory) ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-[var(--color-surface2)] rounded-full flex items-center justify-center mb-4 text-[var(--color-hint)] opacity-50">
                            <Search size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-text)]">Hech narsa topilmadi</h3>
                        <p className="text-sm text-[var(--color-hint)] mt-1 max-w-[200px]">
                            Boshqa kalit so'zlar bilan qidirib ko'ring
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
