'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ChevronLeft, ChevronRight, MapPin, Share2 } from 'lucide-react';
import { mockApi } from '../../../src/services/mockServer';
import type { Product, Store } from '../../../src/shared/types';
import { formatPrice } from '../../../src/shared/lib/formatPrice';
import { CommentList } from '../../../src/features/comments/ui/CommentList';
import { APP_ROUTES } from '../../../src/shared/config/constants';
import { useFavoritesStore } from '../../../src/features/favorites/model';
import { Button } from '../../../src/shared/ui/Button';
import { Skeleton } from '../../../src/shared/ui/Skeleton';
import { cn } from '../../../src/shared/lib/utils';
import { useToast } from '../../../src/shared/ui/useToast';
import { useTranslation } from '../../../src/shared/lib/i18n';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const { favorites, toggleFavorite } = useFavoritesStore();
    const { showToast } = useToast();
    const { t } = useTranslation();

    useEffect(() => {
        (async () => {
            try {
                const prod = await mockApi.getProduct(unwrappedParams.id);
                if (prod) {
                    setProduct(prod);
                    const st = await mockApi.getStore(prod.storeId);
                    if (st) setStore(st);
                }
            } catch (e) {
                showToast({ message: 'Error loading product', type: 'error' });
            } finally {
                setLoading(false);
            }
        })();
    }, [unwrappedParams.id, showToast]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-white">
                <Skeleton className="w-full aspect-[4/5]" />
                <div className="p-6 space-y-4">
                    <Skeleton className="w-3/4 h-8 rounded-xl" />
                    <Skeleton className="w-1/3 h-6 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-[100dvh]">
                <h2 className="text-xl font-bold mb-4">{t.no_results}</h2>
                <Button onClick={() => router.back()} variant="primary">{t.back}</Button>
            </div>
        );
    }

    const isFav = favorites.includes(product.id);

    return (
        <div className="flex flex-col min-h-screen pb-32 bg-[var(--color-bg)] animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header controls layered over image */}
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between p-6 pointer-events-none">
                <button
                    onClick={() => router.back()}
                    className="pointer-events-auto w-12 h-12 flex items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-md rounded-full text-[var(--color-text)] active:scale-95 shadow-sm"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex gap-2 pointer-events-auto">
                    <button className="w-12 h-12 flex items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-md rounded-full text-[var(--color-text)] active:scale-95 shadow-sm">
                        <Share2 size={20} />
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                await toggleFavorite(product.id);
                                showToast({ message: isFav ? t.fav_removed : t.fav_added, type: 'success' });
                            } catch {
                                showToast({ message: t.error_occurred, type: 'error' });
                            }
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-md rounded-full text-[var(--color-text)] active:scale-95 shadow-sm"
                    >
                        <Heart size={20} className={cn(isFav && "fill-[var(--color-danger)] text-[var(--color-danger)]")} />
                    </button>
                </div>
            </div>

            {/* Main Image */}
            <div className="w-full aspect-[3.5/4.5] bg-[var(--color-surface2)] relative">
                <img
                    src={product.images[0] || 'https://placehold.co/800x1000/png?text=No+Image'}
                    alt={product.title}
                    className="object-cover w-full h-full"
                />
            </div>

            <div className="p-8 bg-[var(--color-surface)] -mt-8 rounded-t-[40px] z-10 relative shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-[var(--color-border)]">
                <div className="mb-2">
                    <span className="text-[12px] font-bold text-[var(--color-hint)] uppercase tracking-widest">{product.brand || 'Luxury Wear'}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-[26px] font-bold text-[var(--color-text)] leading-tight">{product.title}</h1>
                </div>

                <div className="mt-4 flex items-center gap-4">
                    <p className="text-[24px] font-black text-[var(--color-primary)]">
                        {formatPrice(product.price, product.currency)}
                    </p>
                    <div className="px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[12px] font-bold rounded-lg border border-[var(--color-primary)]/10">
                        {t.in_stock}
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-[16px] font-bold text-[var(--color-text)] mb-3">{t.description}</h3>
                    <p className="text-[14px] text-[var(--color-hint)] leading-relaxed font-medium">
                        {product.description}
                    </p>
                </div>

                {store && (
                    <Link href={APP_ROUTES.STORE(store.id)} className="mt-8 block group active:scale-[0.98] transition-transform">
                        <div className="flex items-center gap-4 bg-[var(--color-bg)] p-5 rounded-[24px] border border-[var(--color-border)]">
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--color-surface)] shadow-sm shrink-0">
                                <img src={store.photoUrl} alt={store.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-[var(--color-text)] truncate">{store.name}</h4>
                                <div className="flex items-center text-xs text-[var(--color-hint)] mt-1">
                                    <MapPin size={12} className="mr-1 shrink-0 px-[1px]" />
                                    <span className="truncate">{store.addressText}</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center bg-[var(--color-surface)] rounded-full shadow-sm text-[var(--color-hint)] group-hover:text-[var(--color-primary)]">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    </Link>
                )}

                <div className="mt-10">
                    <CommentList productId={product.id} />
                </div>
            </div>

            {/* Bottom Actions Fixed */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-[var(--color-bg)]/80 backdrop-blur-xl border-t border-[var(--color-border)] z-30 flex justify-center">
                <div className="w-full max-w-[400px] flex gap-4">
                    <Button
                        variant="primary"
                        size="lg"
                        className="flex-1 h-16 shadow-lg shadow-[var(--color-primary)]/20"
                    >
                        {t.buy}
                    </Button>
                    <button
                        onClick={() => toggleFavorite(product.id)}
                        className="w-16 h-16 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-[20px] flex items-center justify-center active:scale-95 transition-all shadow-sm"
                    >
                        <Heart size={24} className={cn(isFav && "fill-[var(--color-danger)] text-[var(--color-danger)]")} />
                    </button>
                </div>
            </div>
        </div>
    );
}
