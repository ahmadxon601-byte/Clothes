'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Info, CheckCircle2, Clock } from 'lucide-react';
import { useTelegram } from '../../../../src/telegram/useTelegram';
import { mockApi } from '../../../../src/services/mockServer';
import type { StoreApplication } from '../../../../src/shared/types';
import { Button } from '../../../../src/shared/ui/Button';
import { Skeleton } from '../../../../src/shared/ui/Skeleton';
import { APP_ROUTES } from '../../../../src/shared/config/constants';

export default function StoreStatusPage() {
    const router = useRouter();
    const { user } = useTelegram();
    const [application, setApplication] = useState<StoreApplication | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            const uid = user ? String(user.id) : 'mock_user_123';
            const app = await mockApi.getMyApplication(uid);
            setApplication(app || null);
            setLoading(false);
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
                <h1 className="text-xl font-bold text-[var(--color-text)]">Ariza holati</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                {!application ? (
                    <>
                        <Info size={64} className="text-[var(--color-hint)] mb-4" />
                        <h2 className="text-xl font-bold mb-2 text-[var(--color-text)]">Arizangiz yo‘q</h2>
                        <p className="text-[var(--color-hint)] mb-8">Siz hali do‘kon ochish uchun ariza bermagansiz.</p>
                        <Button onClick={() => router.push(APP_ROUTES.STORE_APPLY)}>
                            Ariza berish
                        </Button>
                    </>
                ) : application.status === 'PENDING' ? (
                    <>
                        <Clock size={64} className="text-yellow-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2 text-[var(--color-text)]">Kutilmoqda</h2>
                        <p className="text-[var(--color-hint)]">Arizangiz adminga yuborildi. Tasdiqlanishi kutilmoqda.</p>
                        <div className="mt-8 w-full p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-left">
                            <p className="text-sm text-[var(--color-text)]"><strong>Do‘kon nomi:</strong> {application.storeName}</p>
                            <p className="text-sm mt-1 text-[var(--color-text)]"><strong>Manzil:</strong> {application.addressText}</p>
                        </div>
                    </>
                ) : application.status === 'APPROVED' ? (
                    <>
                        <CheckCircle2 size={64} className="text-green-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2 text-[var(--color-text)]">Tasdiqlandi!</h2>
                        <p className="text-[var(--color-hint)]">Do‘koningiz ACTIVE holatda. Endi mahsulot sota olasiz.</p>
                        <div className="mt-8 w-full p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-left">
                            <p className="text-sm text-[var(--color-text)]"><strong>Do‘kon nomi:</strong> {application.storeName}</p>
                        </div>
                        {/* Real app would route to Store Admin panel here */}
                        <Button className="mt-8 w-full" onClick={() => router.push(APP_ROUTES.PROFILE)}>Profilga qaytish</Button>
                    </>
                ) : (
                    <>
                        <Info size={64} className="text-red-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2 text-[var(--color-text)]">Rad etildi</h2>
                        <p className="text-[var(--color-hint)] mb-8">Arizangiz tasdiqlanmadi. Iltimos qayta urinib ko‘ring.</p>
                        <Button onClick={() => router.push(APP_ROUTES.STORE_APPLY)}>
                            Qayta ariza berish
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
