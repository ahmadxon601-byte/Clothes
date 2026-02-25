'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import type { Product } from '../../../shared/types';
import { APP_ROUTES } from '../../../shared/config/constants';
import { formatPrice } from '../../../shared/lib/formatPrice';
import { useFavoritesStore } from '../../favorites/model';
import { cn } from '../../../shared/lib/utils';
import { useState } from 'react';

export function ProductCard({ product, variant = 'default' }: { product: Product, variant?: 'default' | 'favorite' }) {
    const { favorites, toggleFavorite } = useFavoritesStore();
    const isFav = favorites.includes(product.id);
    const [imgError, setImgError] = useState(false);

    // Hardcoded logic for "ONLY X LEFT" badge to match screenshot look
    const showBadge = product.price > 100; // Just as an example differentiator
    const stockStatus = showBadge ? `ONLY ${Math.floor(Math.random() * 3) + 1} LEFT` : null;

    return (
        <Link href={APP_ROUTES.PRODUCT(product.id)} className="block group">
            <div className="relative rounded-2xl overflow-hidden bg-[var(--color-surface2)] aspect-[1/1.2] isolate">
                <img
                    src={!imgError && product.images[0] ? product.images[0] : 'https://placehold.co/400x500/png?text=No+Image'}
                    alt={product.title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImgError(true)}
                />

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(product.id);
                    }}
                    className="absolute top-3 right-3 p-2 bg-[var(--color-surface)]/80 backdrop-blur-md rounded-full text-[var(--color-text)] transition-all active:scale-90 shadow-sm z-20"
                >
                    {variant === 'favorite' ? (
                        <div className="text-[var(--color-danger)]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </div>
                    ) : (
                        <Heart size={18} className={cn(isFav && "fill-red-500 text-red-500")} />
                    )}
                </button>

                {stockStatus && (
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[10px] font-extrabold rounded-full z-10 uppercase tracking-tighter">
                        {stockStatus}
                    </div>
                )}
            </div>
            <div className="mt-1.5 px-1">
                <p className="text-[8.5px] text-[var(--color-hint)] font-medium uppercase tracking-wider mb-0.5">{product.brand || 'Luxury Wear'}</p>
                <h3 className="text-[12px] font-semibold text-[var(--color-text)] line-clamp-1">{product.title}</h3>
                <div className="mt-0.5 flex items-center justify-between">
                    <p className="font-bold text-[13px] text-[var(--color-text)] leading-tight">{formatPrice(product.price, product.currency)}</p>
                    <div className="bg-[var(--color-surface2)] text-[10.5px] font-bold py-0.5 px-2 rounded-lg text-[var(--color-hint)] shadow-sm">
                        L
                    </div>
                </div>
                <p className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    Available in 2 stores
                </p>
            </div>
        </Link>
    );
}
