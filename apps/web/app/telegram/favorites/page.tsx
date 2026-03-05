'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, AlertCircle } from 'lucide-react';
import { fetchFavorites, toggleFavorite, getApiToken, type ApiFavorite } from '../../../src/lib/apiClient';
import { formatPrice } from '../../../src/shared/lib/formatPrice';
import { Skeleton } from '../../../src/shared/ui/Skeleton';
import { cn } from '../../../src/shared/lib/utils';

export default function TelegramFavoritesPage() {
    const [favorites, setFavorites] = useState<ApiFavorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [noAuth, setNoAuth] = useState(false);

    useEffect(() => {
        const token = getApiToken();
        if (!token) {
            setNoAuth(true);
            setLoading(false);
            return;
        }
        fetchFavorites()
            .then(setFavorites)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = async (fav: ApiFavorite) => {
        // Optimistic remove
        setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
        try {
            await toggleFavorite(fav.product_id);
        } catch {
            // Revert on error
            setFavorites((prev) => [fav, ...prev]);
        }
    };

    return (
        <div className="flex flex-col min-h-full px-3 pt-4 pb-2 bg-[var(--color-bg)] max-w-[500px] mx-auto">

            {/* Header */}
            <div className="flex items-center gap-2 mb-4 px-0.5">
                <Heart size={18} className="text-[var(--color-primary)]" />
                <h1 className="text-[16px] font-bold text-[var(--color-text)]">Sevimlilar</h1>
                {favorites.length > 0 && (
                    <span className="ml-auto text-[11px] font-semibold text-[var(--color-hint)]">
                        {favorites.length} ta
                    </span>
                )}
            </div>

            {/* No auth state */}
            {noAuth && (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3 px-4">
                    <div className="w-16 h-16 rounded-3xl bg-[var(--color-surface)] flex items-center justify-center border border-[var(--color-border)]">
                        <AlertCircle size={28} className="text-[var(--color-hint)] opacity-50" />
                    </div>
                    <p className="text-[14px] font-semibold text-[var(--color-text)]">
                        Tizimga kirish kerak
                    </p>
                    <p className="text-[12px] text-[var(--color-hint)] leading-relaxed">
                        Sevimlilarni ko'rish uchun botdan kirganingizda avtomatik autentifikatsiya qilinadi.
                    </p>
                    <Link
                        href="/telegram"
                        className="mt-2 inline-flex items-center gap-2 px-5 h-10 rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[13px] font-bold"
                    >
                        <ShoppingBag size={16} />
                        Mahsulotlarga o'tish
                    </Link>
                </div>
            )}

            {/* Loading skeletons */}
            {loading && !noAuth && (
                <div className="flex flex-col gap-2.5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 p-3 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                            <Skeleton className="w-[80px] h-[80px] rounded-xl flex-shrink-0" />
                            <div className="flex-1 flex flex-col gap-2 justify-center">
                                <Skeleton className="h-3 w-1/4" />
                                <Skeleton className="h-4 w-4/5" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && !noAuth && favorites.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-[var(--color-surface)] flex items-center justify-center mb-4 border border-[var(--color-border)]">
                        <Heart size={28} className="text-[var(--color-hint)] opacity-40" />
                    </div>
                    <p className="text-[14px] font-semibold text-[var(--color-text)]">Hali sevimlilar yo'q</p>
                    <p className="text-[12px] text-[var(--color-hint)] mt-1 mb-5">Mahsulotlarda ❤️ bosib qo'shing</p>
                    <Link
                        href="/telegram"
                        className="inline-flex items-center gap-2 px-5 h-10 rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[13px] font-bold"
                    >
                        <ShoppingBag size={16} />
                        Mahsulotlarga o'tish
                    </Link>
                </div>
            )}

            {/* Favorites list — from real API */}
            {!loading && favorites.length > 0 && (
                <div className="flex flex-col gap-2.5">
                    {favorites.map((fav) => (
                        <Link key={fav.id} href={`/p/${fav.product_id}`} className="block">
                            <div className="flex gap-3 p-3 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] active:scale-[0.98] transition-transform duration-150">
                                <div className="w-[80px] h-[80px] flex-shrink-0 rounded-xl overflow-hidden bg-[var(--color-surface2)]">
                                    <img
                                        src={fav.image_url || 'https://placehold.co/200x200/png?text=No+Image'}
                                        alt={fav.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/png?text=No+Image';
                                        }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-0.5">
                                            {fav.brand}
                                        </p>
                                        <h3 className="text-[13px] font-semibold text-[var(--color-text)] line-clamp-2 leading-tight">
                                            {fav.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[13px] font-bold text-[var(--color-text)]">
                                            {formatPrice(fav.base_price, 'UZS')}
                                        </span>
                                        <button
                                            onClick={(e) => { e.preventDefault(); handleToggle(fav); }}
                                            className="ml-auto w-8 h-8 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10"
                                        >
                                            <Heart size={15} className="fill-red-500 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
