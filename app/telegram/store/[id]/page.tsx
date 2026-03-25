'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Package, Phone, Store as StoreIcon } from 'lucide-react';
import { TELEGRAM_ROUTES } from '../../../../src/shared/config/constants';
import { formatPrice } from '../../../../src/shared/lib/formatPrice';
import { useTranslation } from '../../../../src/shared/lib/i18n';

interface StoreData {
    id: string;
    name: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    image_url: string | null;
    owner_name: string;
    product_count: number;
}

interface Product {
    id: string;
    name: string;
    base_price: number;
    thumbnail: string | null;
    category_name: string | null;
}

function parseAddress(address: string | null) {
    if (!address) return { text: '', lat: null as null | number, lng: null as null | number };
    const m = address.match(/Coordinates:\s*([-\d.]+),\s*([-\d.]+)/i);
    const text = address.replace(/\s*Coordinates:.*$/i, '').trim();
    return { text, lat: m ? parseFloat(m[1]) : null, lng: m ? parseFloat(m[2]) : null };
}

export default function TgStorePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { t, language } = useTranslation();
    const [store, setStore] = useState<StoreData | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch(`/api/stores/${id}`).then(r => r.json()),
            fetch(`/api/stores/${id}/products?limit=100`).then(r => r.json()),
        ]).then(([storeJson, productsJson]) => {
            setStore(storeJson.data?.store ?? storeJson.store ?? null);
            setProducts(productsJson.data?.products ?? productsJson.products ?? []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="px-4 pt-4 space-y-3 animate-pulse">
            <div className="h-40 rounded-[24px] bg-[var(--color-surface2)]" />
            <div className="h-5 w-2/3 rounded-full bg-[var(--color-surface2)]" />
            <div className="h-4 w-1/2 rounded-full bg-[var(--color-surface2)]" />
        </div>
    );

    if (!store) return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-8 text-center">
                <StoreIcon size={36} className="text-[var(--color-hint)]" />
            <p className="text-[16px] font-bold text-[var(--color-text)]">{t.stores_not_found}</p>
            <Link href={TELEGRAM_ROUTES.PRODUCTS} className="text-[14px] text-[var(--color-primary)] font-semibold">{t.back}</Link>
        </div>
    );

    const { text: addressText, lat, lng } = parseAddress(store.address);

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] pb-6">
            {/* Hero banner */}
            <div className="relative h-44 overflow-hidden bg-[var(--color-surface2)]">
                {store.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <StoreIcon size={48} className="text-[var(--color-hint)] opacity-30" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <Link
                    href={TELEGRAM_ROUTES.PRODUCTS}
                    className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div className="absolute bottom-3 left-4 right-4">
                    <h1 className="text-[22px] font-black text-white leading-tight drop-shadow">{store.name}</h1>
                    {addressText && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="text-white/70 shrink-0" />
                            <p className="text-[12px] text-white/80 line-clamp-1">{addressText}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 mt-4 space-y-4">
                {/* Store info */}
                <div className="bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-border)] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] text-[var(--color-hint)]">{store.owner_name}</p>
                        <span className="px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[12px] font-bold">
                            {t.items_count.replace('{count}', String(store.product_count))}
                        </span>
                    </div>
                    {store.description && (
                        <p className="text-[13px] text-[var(--color-text)] leading-relaxed">
                            {store.description.replace(/\s*Coordinates:.*$/i, '').trim()}
                        </p>
                    )}
                    {store.phone && (
                        <a href={`tel:${store.phone}`} className="flex items-center gap-2 text-[14px] font-semibold text-[var(--color-primary)]">
                            <Phone size={14} /> {store.phone}
                        </a>
                    )}
                    {lat && lng && (
                        <a
                            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[13px] text-[var(--color-hint)] font-medium"
                        >
                            <MapPin size={13} className="text-[var(--color-primary)]" />
                            {t.view}
                        </a>
                    )}
                </div>

                {/* Products */}
                <div>
                    <h2 className="text-[16px] font-bold text-[var(--color-text)] mb-3">{t.products_page_title}</h2>
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center py-10 text-center bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-border)]">
                            <Package size={28} className="text-[var(--color-hint)] opacity-40 mb-2" />
                            <p className="text-[14px] text-[var(--color-hint)]">{t.product_missing}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {products.map(p => (
                                <Link
                                    key={p.id}
                                    href={TELEGRAM_ROUTES.PRODUCT(p.id)}
                                    className="bg-[var(--color-surface)] rounded-[18px] overflow-hidden border border-[var(--color-border)] active:scale-[0.97] transition-transform"
                                >
                                    <div className="aspect-[3/4] bg-[var(--color-surface2)] overflow-hidden">
                                        {p.thumbnail ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package size={24} className="text-[var(--color-hint)] opacity-40" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2.5">
                                        {p.category_name && (
                                            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--color-hint)]">{p.category_name}</p>
                                        )}
                                        <p className="text-[12px] font-bold text-[var(--color-text)] line-clamp-2 mt-0.5">{p.name}</p>
                                        <p className="text-[13px] font-black text-[var(--color-primary)] mt-1">{formatPrice(p.base_price, 'UZS', language)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
