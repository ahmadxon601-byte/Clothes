'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Info, CheckCircle2, Clock } from 'lucide-react';
import { useTelegram } from '../../../../src/telegram/useTelegram';
import { ensureMarketplaceToken, getMarketplaceMe, markCachedStoreApproved, readCachedStoreApplication } from '../../../../src/lib/marketplaceAuth';
import type { StoreApplication } from '../../../../src/shared/types';
import { Button } from '../../../../src/shared/ui/Button';
import { Skeleton } from '../../../../src/shared/ui/Skeleton';
import { useAppRoutes } from '../../../../src/shared/config/useAppRoutes';
import { useTranslation } from '../../../../src/shared/lib/i18n';

export default function StoreStatusPage() {
    const router = useRouter();
    const { user } = useTelegram();
    const [application, setApplication] = useState<StoreApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const routes = useAppRoutes();

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const token = await ensureMarketplaceToken(user);
                const me = await getMarketplaceMe(token);
                const cached = readCachedStoreApplication();
                if (!cached) {
                    setApplication(null);
                } else if (me.role === 'seller') {
                    markCachedStoreApproved();
                    setApplication({ ...cached, status: 'APPROVED' });
                } else {
                    setApplication(cached);
                }
            } catch {
                setApplication(readCachedStoreApplication());
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [user]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-[100dvh]">
                <div className="p-4"><Skeleton className="w-full h-8" /></div>
                <div className="p-4 mt-10 flex flex-col items-center justify-center space-y-4">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <Skeleton className="w-1/2 h-6" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[100dvh] bg-[var(--color-bg)]">
            <div className="sticky top-0 z-10 flex items-center p-4 border-b border-[var(--color-border)]">
                <button onClick={() => router.back()} className="mr-3 text-[var(--color-text)]">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-[var(--color-text)]">{t.application_status}</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                {!application ? (
                    <>
                        <Info size={64} className="text-[var(--color-hint)] mb-4" />
                        <h2 className="text-xl font-bold mb-2 text-[var(--color-text)]">{t.no_application}</h2>
                        <p className="text-[var(--color-hint)] mb-8">{t.no_application_desc}</p>
                        <Button onClick={() => router.push(routes.STORE_APPLY)}>
                            {t.apply_now}
                        </Button>
                    </>
                ) : application.status === 'PENDING' ? (
                    <>
                        <Clock size={64} className="text-yellow-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2 text-[var(--color-text)]">{t.status_pending}</h2>
                        <p className="text-[var(--color-hint)]">{t.pending_desc}</p>
                        <div className="mt-8 w-full p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-left">
                            <p className="text-sm text-[var(--color-text)]"><strong>{t.store_name}:</strong> {application.storeName}</p>
                            <p className="text-sm mt-1 text-[var(--color-text)]"><strong>{t.address}:</strong> {application.addressText}</p>
                        </div>
                    </>
                ) : application.status === 'APPROVED' ? (
                    <>
                        <CheckCircle2 size={64} className="text-green-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2 text-[var(--color-text)]">{t.approved_title}</h2>
                        <p className="text-[var(--color-hint)]">{t.approved_desc}</p>
                        <div className="mt-8 w-full p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-left">
                            <p className="text-sm text-[var(--color-text)]"><strong>{t.store_name}:</strong> {application.storeName}</p>
                        </div>
                        {/* Real app would route to Store Admin panel here */}
                        <Button className="mt-8 w-full" onClick={() => router.push(routes.PROFILE)}>{t.back_to_profile}</Button>
                    </>
                ) : (
                    <>
                        <Info size={64} className="text-red-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2 text-[var(--color-text)]">{t.rejected_title}</h2>
                        <p className="text-[var(--color-hint)] mb-8">{t.rejected_desc}</p>
                        <Button onClick={() => router.push(routes.STORE_APPLY)}>
                            {t.reapply}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
