'use client';
import { useEffect, useState } from 'react';
import { useFavoritesStore } from '../../../src/features/favorites/model';
import { mockApi } from '../../../src/services/mockServer';
import type { Product } from '../../../src/shared/types';
import { ProductCard } from '../../../src/features/products/ui/ProductCard';
import { Skeleton } from '../../../src/shared/ui/Skeleton';
import { Heart } from 'lucide-react';
import { cn } from '../../../src/shared/lib/utils';
import { useTranslation } from '../../../src/shared/lib/i18n';

const CATEGORIES = ['All', 'Shirts', 'Shoes', 'Pants', 'Jackets', 'Accessories'] as const;

export default function FavoritesPage() {
    const { favorites } = useFavoritesStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const { t } = useTranslation();
    const categoryLabels: Record<(typeof CATEGORIES)[number], string> = {
        All: t.all,
        Shirts: t.cat_shirts,
        Shoes: t.cat_shoes,
        Pants: t.cat_pants,
        Jackets: t.cat_jackets,
        Accessories: t.cat_accessories,
    };

    useEffect(() => {
        mockApi.listFavorites().then(data => {
            const filtered = category === 'All'
                ? data
                : data.filter(p => p.category === category);
            setProducts(filtered);
            setLoading(false);
        });
    }, [favorites, category]);

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)]">
            {/* Categories */}
            <div className="flex gap-3 px-6 py-3 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={cn(
                            "inline-flex items-center justify-center h-9 px-5 rounded-full text-[12px] leading-none font-bold transition-all whitespace-nowrap shadow-sm border active:scale-95",
                            category === cat
                                ? "bg-[var(--color-text)] text-[var(--color-bg)] border-transparent"
                                : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-hint)]/30"
                        )}
                    >
                        {categoryLabels[cat] || cat}
                    </button>
                ))}
            </div>

            <div className="px-6 py-4 flex-1 md:px-8">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
                        {[1, 2].map((i) => (
                            <div key={i}>
                                <Skeleton className="aspect-[3.5/4.5] w-full rounded-2xl" />
                                <Skeleton className="h-4 w-3/4 mt-3" />
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
                        {products.map((p) => (
                            <ProductCard key={p.id} product={p} variant="favorite" />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                        <Heart size={48} className="mb-4 opacity-10" />
                        <p className="text-[15px] font-medium">{t.no_favorites}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
