'use client';
import { useEffect, useState } from 'react';
import { useFavoritesStore } from '../../../src/features/favorites/model';
import { mockApi } from '../../../src/services/mockServer';
import type { Product } from '../../../src/shared/types';
import { ProductCard } from '../../../src/features/products/ui/ProductCard';
import { Skeleton } from '../../../src/shared/ui/Skeleton';
import { ChevronLeft, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../src/shared/lib/utils';

const CATEGORIES = ['All', 'Shirts', 'Shoes', 'Pants', 'Jackets', 'Accessories'];

export default function FavoritesPage() {
    const router = useRouter();
    const { favorites } = useFavoritesStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');

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
        <div className="flex flex-col min-h-full pb-32 bg-[var(--color-bg)]">
            {/* Header */}
            <header className="flex items-center justify-between px-6 pt-6 pb-4">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 flex items-center justify-center bg-[var(--color-surface)] rounded-full shadow-sm text-[var(--color-text)]"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-[20px] font-bold text-[var(--color-text)]">Sevimlilar</h1>
                <div className="w-12" /> {/* Spacer */}
            </header>

            {/* Categories */}
            <div className="flex gap-3 px-6 py-3 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={cn(
                            "px-8 py-3 rounded-full text-[14px] font-bold transition-all whitespace-nowrap shadow-sm border",
                            category === cat
                                ? "bg-[var(--color-text)] text-[var(--color-bg)] border-transparent"
                                : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-hint)]/30"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="px-6 py-4 flex-1">
                {loading ? (
                    <div className="grid grid-cols-2 gap-x-5 gap-y-8">
                        {[1, 2].map((i) => (
                            <div key={i}>
                                <Skeleton className="aspect-[3.5/4.5] w-full rounded-2xl" />
                                <Skeleton className="h-4 w-3/4 mt-3" />
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-5 gap-y-8">
                        {products.map((p) => (
                            <ProductCard key={p.id} product={p} variant="favorite" />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                        <Heart size={48} className="mb-4 opacity-10" />
                        <p className="text-[15px] font-medium">Hali sevimli mahsulotlar yo'q.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
