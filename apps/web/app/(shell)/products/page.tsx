'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, MapPin, Search, Store as StoreIcon } from 'lucide-react';
import { mockApi } from '../../../src/services/mockServer';
import type { Product, Store } from '../../../src/shared/types';
import { APP_ROUTES } from '../../../src/shared/config/constants';
import { Skeleton } from '../../../src/shared/ui/Skeleton';
import { useTranslation } from '../../../src/shared/lib/i18n';
import { cn } from '../../../src/shared/lib/utils';

const CATEGORIES = ['All', 'Jackets', 'Shirts', 'Pants', 'Shoes', 'Accessories'] as const;
type Category = (typeof CATEGORIES)[number];

export default function StoresPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<Category>('All');
    const { t } = useTranslation();
    const categoryLabels: Record<Category, string> = {
        All: t.all,
        Jackets: t.cat_jackets,
        Shirts: t.cat_shirts,
        Pants: t.cat_pants,
        Shoes: t.cat_shoes,
        Accessories: t.cat_accessories,
    };

    useEffect(() => {
        let active = true;
        Promise.all([mockApi.listStores(), mockApi.listProducts()]).then(([storesData, productData]) => {
            if (!active) return;
            setStores(storesData);
            setAllProducts(productData);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);

    const filteredStores =
        category === 'All'
            ? stores
            : stores.filter((store) =>
                allProducts.some((p) => p.storeId === store.id && p.category === category)
            );

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] px-5 py-3">
            <div className="pt-1 pb-0.5">
                <Link href={APP_ROUTES.PRODUCTS} className="flex items-center h-[42px] w-full bg-[var(--color-surface)] rounded-full px-4 gap-3 shadow-sm text-[var(--color-hint)]">
                    <Search size={16} className="opacity-40" />
                    <span className="text-[13px]">{t.search}</span>
                </Link>
            </div>

            <div className="flex gap-2.5 py-2 overflow-x-auto no-scrollbar mb-2">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={cn(
                            "px-5 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap shadow-sm border",
                            category === cat
                                ? "bg-[var(--color-text)] text-[var(--color-bg)] border-transparent"
                                : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-hint)]/30"
                        )}
                    >
                        {categoryLabels[cat] || cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                            <Skeleton className="w-full h-36 rounded-2xl" />
                            <Skeleton className="h-5 w-1/2 mt-3" />
                            <Skeleton className="h-4 w-2/3 mt-2" />
                        </div>
                    ))}
                </div>
            ) : filteredStores.length > 0 ? (
                <div className="space-y-3 pb-4">
                    {filteredStores.map((store) => (
                        <Link
                            key={store.id}
                            href={APP_ROUTES.STORE(store.id)}
                            className="block rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 active:scale-[0.99] transition-transform shadow-sm"
                        >
                            <div className="relative w-full h-36 rounded-2xl overflow-hidden">
                                <img src={store.photoUrl} alt={store.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-black/35 text-white backdrop-blur-sm">
                                    <StoreIcon size={12} />
                                    STORE
                                </div>
                            </div>

                            <div className="pt-3 px-1">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-[16px] font-bold text-[var(--color-text)] leading-tight line-clamp-1">{store.name}</h3>
                                    <ChevronRight size={17} className="text-[var(--color-hint)] shrink-0 mt-0.5" />
                                </div>
                                <div className="mt-1.5 flex items-center text-[12px] text-[var(--color-hint)]">
                                    <MapPin size={13} className="mr-1.5 shrink-0" />
                                    <span className="line-clamp-1">{store.addressText}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-56 text-center text-[var(--color-hint)]">
                    <StoreIcon size={38} className="opacity-30 mb-3" />
                    <p className="text-[14px] font-medium">{t.no_results}</p>
                </div>
            )}
        </div>
    );
}

