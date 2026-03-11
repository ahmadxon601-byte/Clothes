'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, X, Store as StoreIcon, Package, Loader2 } from 'lucide-react';
import { TELEGRAM_ROUTES } from '../../../src/shared/config/constants';
import { useSSERefetch } from '../../../src/shared/hooks/useSSERefetch';

interface StoreItem {
    id: string;
    name: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    image_url: string | null;
    owner_name: string;
    product_count: number;
}

export default function TgStoresPage() {
    const [stores, setStores] = useState<StoreItem[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [loading, setLoading] = useState(true);

    const loadStores = async (q?: string) => {
        setLoading(true);
        try {
            const url = new URL('/api/stores', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3010');
            url.searchParams.set('limit', '100');
            if (q) url.searchParams.set('search', q);
            const res = await fetch(url.toString());
            const json = await res.json();
            setStores(json.data?.stores ?? json.stores ?? []);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadStores(); }, []);

    useEffect(() => {
        const t = setTimeout(() => loadStores(searchInput || undefined), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    useSSERefetch(['stores'], () => loadStores(searchInput || undefined));

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] px-4 py-3">
            <div className="relative mb-4">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-hint)]" />
                <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Do'kon qidirish..."
                    className="h-11 w-full bg-[var(--color-surface)] rounded-full pl-10 pr-10 text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] border border-[var(--color-border)] outline-none focus:ring-2 ring-[var(--color-primary)]/20" />
                {searchInput && (
                    <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[var(--color-hint)]/10 rounded-full">
                        <X size={13} className="text-[var(--color-hint)]" />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[var(--color-primary)]" /></div>
            ) : stores.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-[var(--color-hint)]">
                    <StoreIcon size={28} className="opacity-40 mb-2" />
                    <p className="text-sm">Do&apos;konlar topilmadi</p>
                </div>
            ) : (
                <div className="space-y-3 pb-4">
                    {stores.map(store => (
                        <Link key={store.id} href={TELEGRAM_ROUTES.STORE(store.id)}
                            className="flex items-center gap-3 bg-[var(--color-surface)] rounded-[20px] p-3 border border-[var(--color-border)] active:scale-[0.98] transition-transform">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[var(--color-surface2)] shrink-0 flex items-center justify-center">
                                {store.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
                                ) : (
                                    <StoreIcon size={22} className="text-[var(--color-hint)]" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[14px] font-bold text-[var(--color-text)] truncate">{store.name}</h3>
                                {store.description && (
                                    <p className="text-[12px] text-[var(--color-hint)] line-clamp-1 mt-0.5">{store.description}</p>
                                )}
                                <div className="flex items-center gap-1 mt-1">
                                    <Package size={11} className="text-[var(--color-primary)]" />
                                    <span className="text-[11px] text-[var(--color-hint)]">{store.product_count} ta mahsulot</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
