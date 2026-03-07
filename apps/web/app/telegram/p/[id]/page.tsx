'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Heart, MapPin, Store, Tag } from 'lucide-react';
import { cn } from '../../../../src/shared/lib/utils';
import { formatPrice } from '../../../../src/shared/lib/formatPrice';
import { Skeleton } from '../../../../src/shared/ui/Skeleton';
import {
    fetchProductById,
    toggleFavorite,
    fetchFavorites,
    type ApiProductDetail,
} from '../../../../src/lib/apiClient';

export default function TelegramProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [product, setProduct] = useState<ApiProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFav, setIsFav] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

    useEffect(() => {
        fetchProductById(id)
            .then(setProduct)
            .catch(() => {})
            .finally(() => setLoading(false));

        fetchFavorites()
            .then((favs) => setIsFav(favs.some((f) => f.product_id === id)))
            .catch(() => {});
    }, [id]);

    const handleToggleFav = async () => {
        setIsFav((prev) => !prev);
        try {
            await toggleFavorite(id);
        } catch {
            setIsFav((prev) => !prev);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-full bg-[var(--color-bg)]">
                <Skeleton className="w-full aspect-[3/4]" />
                <div className="p-5 space-y-3">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-full gap-3 p-8 text-center">
                <p className="text-[15px] font-bold text-[var(--color-text)]">Mahsulot topilmadi</p>
                <button
                    onClick={() => router.back()}
                    className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-2xl text-[13px] font-semibold"
                >
                    Orqaga
                </button>
            </div>
        );
    }

    const images = product.images?.length
        ? [...product.images].sort((a, b) => a.sort_order - b.sort_order)
        : null;
    const displayImage = images?.[activeImage]?.url ?? product.thumbnail;

    const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[];
    const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[];

    const seed = product.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const discountPct = 10 + (seed % 21);
    const originalPrice = Math.round(product.base_price / (1 - discountPct / 100) / 1000) * 1000;

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] max-w-[500px] mx-auto">

            {/* Image area */}
            <div className="relative w-full aspect-[3/3.8] bg-[var(--color-surface2)] overflow-hidden">
                <img
                    src={displayImage ?? 'https://placehold.co/400x500/png?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                />

                {/* Gradient overlay for buttons */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />

                {/* Back & Fav buttons */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={handleToggleFav}
                        className="w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full active:scale-95 transition-transform"
                    >
                        <Heart
                            size={16}
                            className={cn(isFav ? 'fill-red-500 text-red-500' : 'text-white')}
                        />
                    </button>
                </div>

                {/* Image dots */}
                {images && images.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveImage(i)}
                                className={cn(
                                    'rounded-full transition-all duration-300',
                                    i === activeImage ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                                )}
                            />
                        ))}
                    </div>
                )}

                {/* Image thumbnails row */}
                {images && images.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 flex gap-2 px-4 pb-10 overflow-x-auto no-scrollbar">
                        {images.map((img, i) => (
                            <button
                                key={img.id}
                                onClick={() => setActiveImage(i)}
                                className={cn(
                                    'w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all',
                                    i === activeImage ? 'border-white' : 'border-transparent opacity-60'
                                )}
                            >
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-5 space-y-5 bg-[var(--color-bg)]">

                {/* Category badge */}
                {product.category_name && (
                    <div className="flex items-center gap-1.5">
                        <Tag size={11} className="text-[var(--color-primary)]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                            {product.category_name}
                        </span>
                    </div>
                )}

                {/* Name & Price */}
                <div>
                    <h1 className="text-[19px] font-bold text-[var(--color-text)] leading-tight mb-3">
                        {product.name}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="text-[22px] font-black text-[var(--color-primary)]">
                            {formatPrice(product.base_price, 'UZS')}
                        </span>
                        <span className="text-[13px] text-[var(--color-hint)] line-through">
                            {formatPrice(originalPrice, 'UZS')}
                        </span>
                        <span className="ml-auto text-[10px] font-extrabold px-2 py-0.5 bg-[var(--color-primary)] text-white rounded-full">
                            -{discountPct}%
                        </span>
                    </div>
                </div>

                {/* Variants — sizes */}
                {sizes.length > 0 && (
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-2">
                            O'lcham
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedVariant(selectedVariant === size ? null : size)}
                                    className={cn(
                                        'px-3.5 py-1.5 rounded-xl border text-[12px] font-semibold transition-all',
                                        selectedVariant === size
                                            ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-transparent'
                                            : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
                                    )}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Variants — colors */}
                {colors.length > 0 && (
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-2">
                            Rang
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {colors.map((color) => (
                                <span
                                    key={color}
                                    className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[12px] font-semibold text-[var(--color-text)]"
                                >
                                    {color}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                {product.description && (
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-2">
                            Tavsif
                        </p>
                        <p className="text-[13px] text-[var(--color-text)] leading-relaxed">
                            {product.description}
                        </p>
                    </div>
                )}

                {/* Store */}
                <div className="flex items-center gap-3 p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-surface2)] flex items-center justify-center flex-shrink-0">
                        <Store size={18} className="text-[var(--color-hint)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[var(--color-text)] truncate">{product.store_name}</p>
                        {product.location?.address && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <MapPin size={10} className="text-[var(--color-hint)] flex-shrink-0" />
                                <p className="text-[11px] text-[var(--color-hint)] truncate">{product.location.address}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom padding for nav */}
                <div className="h-2" />
            </div>
        </div>
    );
}
