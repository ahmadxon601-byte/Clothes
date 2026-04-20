'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ChevronLeft, ChevronRight, Loader2, Store as StoreIcon, MapPin } from 'lucide-react';
import { fetchProductById, fetchProducts, toggleFavorite, getApiToken, type ApiProductDetail, type ApiProduct } from '../../../../src/lib/apiClient';
import { formatPrice } from '../../../../src/shared/lib/formatPrice';
import { TELEGRAM_ROUTES } from '../../../../src/shared/config/constants';
import { useTranslation } from '../../../../src/shared/lib/i18n';
import { getVariantMeta, getDepartmentBySlug } from '../../../../src/shared/lib/productCategoryMeta';
import { repairText } from '../../../../src/shared/lib/repairText';
import { translateHtmlToPlainText, translateText } from '../../../../src/shared/lib/translateClient';
import { cn } from '../../../../src/shared/lib/utils';
import { RichTextContent } from '../../../../src/shared/ui/RichTextContent';

export default function TgProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { t, language } = useTranslation();
    const [product, setProduct] = useState<ApiProductDetail | null>(null);
    const [similar, setSimilar] = useState<ApiProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [imgIdx, setImgIdx] = useState(0);
    const [isFav, setIsFav] = useState(false);
    const [favLoading, setFavLoading] = useState(false);
    const [storeAddress, setStoreAddress] = useState('');
    const [translatedName, setTranslatedName] = useState('');
    const [translatedDescription, setTranslatedDescription] = useState('');
    const [translatedCategory, setTranslatedCategory] = useState('');
    const [translatedSimilar, setTranslatedSimilar] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchProductById(id)
            .then((p) => {
                setProduct(p);
                if (p.store_id) {
                    fetch(`/api/stores/${p.store_id}`)
                        .then((r) => r.json())
                        .then((sj) => {
                            const addr = sj?.data?.store?.address ?? sj?.store?.address ?? '';
                            if (addr) setStoreAddress(String(addr).replace(/\s*Coordinates:.*$/i, '').trim());
                        })
                        .catch(() => {});
                }
                if (p.category_id) {
                    fetchProducts({ category: p.category_id, limit: 9 })
                        .then((r) => {
                            setSimilar(r.products.filter((x) => x.id !== p.id).slice(0, 6));
                        })
                        .catch(() => {});
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!product) return;

        const baseName = repairText(product.name || '');
        const baseDescription = repairText(product.description || '');
        const baseCategory = repairText(product.category_name || '');

        setTranslatedName(baseName);
        setTranslatedDescription(baseDescription);
        setTranslatedCategory(baseCategory);

        if (language === 'uz') return;

        let cancelled = false;

        Promise.all([
            translateText(baseName, language),
            baseDescription ? translateHtmlToPlainText(baseDescription, language) : Promise.resolve(''),
            baseCategory ? translateText(baseCategory, language) : Promise.resolve(''),
        ])
            .then(([name, description, category]) => {
                if (cancelled) return;
                setTranslatedName(name || baseName);
                setTranslatedDescription(description || baseDescription);
                setTranslatedCategory(category || baseCategory);
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [product, language]);

    useEffect(() => {
        if (similar.length === 0) {
            setTranslatedSimilar({});
            return;
        }

        const initial = Object.fromEntries(similar.map((item) => [item.id, repairText(item.name)]));
        setTranslatedSimilar(initial);

        if (language === 'uz') return;

        let cancelled = false;

        Promise.all(
            similar.map(async (item) => [item.id, await translateText(repairText(item.name), language)] as const)
        )
            .then((entries) => {
                if (cancelled) return;
                setTranslatedSimilar(Object.fromEntries(entries));
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [similar, language]);

    const handleFav = async () => {
        if (!getApiToken() || !product) return;
        setFavLoading(true);
        try {
            const r = await toggleFavorite(product.id);
            setIsFav(r.favorited);
        } catch {
            // ignore
        } finally {
            setFavLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-[var(--color-hint)]">{t.product_not_found}</p>
                <button onClick={() => router.back()} className="text-[var(--color-primary)] text-sm font-bold">
                    {t.back}
                </button>
            </div>
        );
    }

    const images = product.images?.length
        ? [...product.images].sort((a, b) => a.sort_order - b.sort_order)
        : [];
    const displayImage = images[imgIdx]?.url || product.thumbnail || 'https://placehold.co/400x533/f5f5f5/ccc?text=No+Image';
    const variantLabel = getVariantMeta(getDepartmentBySlug(product.category_slug), language).label;

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)]">
            <div className="relative aspect-[3.5/4.5] bg-[var(--color-surface2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={displayImage} alt={translatedName || repairText(product.name)} className="w-full h-full object-cover" />

                {images.length > 1 && (
                    <>
                        <button
                            onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-sm rounded-full"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-sm rounded-full"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setImgIdx(i)}
                                    className={cn('h-1.5 rounded-full transition-all', i === imgIdx ? 'bg-[var(--color-primary)] w-4' : 'bg-white/50 w-1.5')}
                                />
                            ))}
                        </div>
                    </>
                )}

                <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none">
                    <button
                        onClick={() => router.back()}
                        className="pointer-events-auto w-9 h-9 flex items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-sm rounded-full"
                    >
                        <ChevronLeft size={17} />
                    </button>
                    <button
                        onClick={handleFav}
                        disabled={favLoading}
                        className="pointer-events-auto w-9 h-9 flex items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-sm rounded-full"
                    >
                        {favLoading ? <Loader2 size={15} className="animate-spin" /> : <Heart size={15} className={cn(isFav && 'fill-red-500 text-red-500')} />}
                    </button>
                </div>
            </div>

            <div className="bg-[var(--color-surface)] -mt-6 rounded-t-[28px] p-5 relative z-10 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
                <p className="text-[10px] font-bold text-[var(--color-hint)] uppercase tracking-widest">{translatedCategory}</p>
                <h1 className="text-[18px] font-bold text-[var(--color-text)] leading-tight mt-1">{translatedName}</h1>

                {(() => {
                    const v = product.variants?.[0];
                    const currentPrice = v?.price ?? product.effective_sale_price ?? product.base_price;
                    const basePrice = product.base_price;
                    const hasDiscount = currentPrice < basePrice;
                    const discountPct = hasDiscount ? Math.round((1 - currentPrice / basePrice) * 100) : 0;

                    return (
                        <div className="mt-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[24px] font-black text-[var(--color-primary)]">{formatPrice(currentPrice, 'UZS', language)}</span>
                                {hasDiscount && (
                                    <>
                                        <span className="text-[14px] text-[var(--color-hint)] line-through">{formatPrice(basePrice, 'UZS', language)}</span>
                                        <span className="px-2 py-0.5 bg-red-500 text-white text-[11px] font-bold rounded-full">-{discountPct}%</span>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                                {v?.size && (
                                    <span className="px-3 py-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full text-[12px] font-medium text-[var(--color-text)]">
                                        {variantLabel}: {v.size}
                                    </span>
                                )}
                                {v?.stock != null && (
                                    <span
                                        className={cn(
                                            'px-3 py-1 rounded-full text-[12px] font-medium border',
                                            v.stock > 0
                                                ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20 text-[var(--color-primary)]'
                                                : 'bg-red-500/10 border-red-500/20 text-red-500'
                                        )}
                                    >
                                        {v.stock > 0 ? t.available_count.replace('{count}', String(v.stock)) : t.sold_out}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {translatedDescription && (
                    language === 'uz' ? (
                        <RichTextContent
                            html={translatedDescription}
                            className="mt-4 text-[13px] text-[var(--color-hint)] leading-relaxed [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_ul]:ml-5 [&_ul]:list-disc"
                        />
                    ) : (
                        <p className="mt-4 text-[13px] text-[var(--color-hint)] leading-relaxed whitespace-pre-line">{translatedDescription}</p>
                    )
                )}

                <Link
                    href={TELEGRAM_ROUTES.STORE(product.store_id)}
                    className="mt-5 flex items-center gap-3 bg-[var(--color-bg)] rounded-[20px] p-4 border border-[var(--color-border)] active:scale-[0.98] transition-transform"
                >
                    <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-[var(--color-surface2)]">
                        <StoreIcon size={18} className="text-[var(--color-hint)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[var(--color-text)] truncate">{repairText(product.store_name)}</p>
                        {(storeAddress || product.location?.address) && (
                            <p className="text-[11px] text-[var(--color-hint)] mt-0.5 flex items-center gap-1">
                                <MapPin size={10} /> {storeAddress || product.location?.address}
                            </p>
                        )}
                    </div>
                    <ChevronRight size={16} className="text-[var(--color-hint)]" />
                </Link>

                {similar.length > 0 && (
                    <div className="mt-6">
                        <h2 className="text-[15px] font-bold text-[var(--color-text)] mb-3">{t.similar_products}</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {similar.map((p) => (
                                <Link
                                    key={p.id}
                                    href={TELEGRAM_ROUTES.PRODUCT(p.id)}
                                    className="bg-[var(--color-bg)] rounded-[16px] overflow-hidden border border-[var(--color-border)] active:scale-[0.98] transition-transform"
                                >
                                    <div className="aspect-[3/4] bg-[var(--color-surface2)]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={p.thumbnail || 'https://placehold.co/300x400/f5f5f5/ccc?text=No+Image'} alt={translatedSimilar[p.id] || repairText(p.name)} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-2">
                                        <p className="text-[12px] font-bold text-[var(--color-text)] line-clamp-1">{translatedSimilar[p.id] || repairText(p.name)}</p>
                                        <p className="text-[12px] font-black text-[var(--color-primary)]">{formatPrice(p.base_price, 'UZS', language)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
