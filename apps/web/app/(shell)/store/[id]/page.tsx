'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, Navigation } from 'lucide-react';
import { mockApi } from '../../../../src/services/mockServer';
import type { Store, Product } from '../../../../src/shared/types';
import { ProductCard } from '../../../../src/features/products/ui/ProductCard';
import { openMapLink } from '../../../../src/shared/lib/openMapLink';
import { Button } from '../../../../src/shared/ui/Button';
import { Skeleton } from '../../../../src/shared/ui/Skeleton';

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const st = await mockApi.getStore(unwrappedParams.id);
            if (st) {
                setStore(st);
                const prods = await mockApi.listStoreProducts(st.id);
                setProducts(prods);
            }
            setLoading(false);
        })();
    }, [unwrappedParams.id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-[100dvh]">
                <Skeleton className="w-full h-48" />
                <div className="p-4 space-y-4">
                    <Skeleton className="w-3/4 h-8" />
                    <Skeleton className="w-1/3 h-6" />
                </div>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-[100dvh] bg-[var(--color-bg)]">
                <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">Store not found</h2>
                <Button onClick={() => router.back()} variant="outline">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen pb-safe bg-[var(--color-surface)] animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="fixed top-0 left-0 right-0 z-10 p-4 pointer-events-none">
                <button
                    onClick={() => router.back()}
                    className="pointer-events-auto p-2.5 bg-black/20 text-white backdrop-blur-md rounded-full active:scale-95"
                >
                    <ChevronLeft size={24} />
                </button>
            </div>

            <div className="w-full h-56 relative bg-[var(--color-bg)]">
                <img src={store.photoUrl} alt={store.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white p-2">
                    <h1 className="text-2xl font-bold leading-tight line-clamp-2 drop-shadow-md">{store.name}</h1>
                    <div className="flex items-center text-sm mt-1 opacity-90 drop-shadow-md">
                        <MapPin size={14} className="mr-1 shrink-0" />
                        <span className="truncate">{store.addressText}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 px-2 -mt-4 bg-[var(--color-bg)] rounded-t-[20px] relative z-20 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
                <div className="px-2 mb-6 mt-2">
                    <Button
                        onClick={() => openMapLink(store.location.lat, store.location.lng, store.name)}
                        className="w-full flex items-center gap-2"
                    >
                        <Navigation size={18} />
                        Do‘konga borish
                    </Button>
                </div>

                <div className="px-2">
                    <h3 className="text-lg font-bold mb-4 text-[var(--color-text)]">Mahsulotlar</h3>
                    {products.length > 0 ? (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-6 pb-6">
                            {products.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-[var(--color-hint)] text-center py-8">Dokonda hozircha mahsulot yo‘q.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
