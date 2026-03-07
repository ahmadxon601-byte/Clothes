'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useTelegram } from '../../../../src/telegram/useTelegram';
import { cachePendingStoreApplication, ensureMarketplaceToken } from '../../../../src/lib/marketplaceAuth';
import { useAppRoutes } from '../../../../src/shared/config/useAppRoutes';
import { Button } from '../../../../src/shared/ui/Button';
import { Input } from '../../../../src/shared/ui/Input';
import { useToast } from '../../../../src/shared/ui/useToast';
import { validators } from '../../../../src/shared/lib/validators';
import { useTranslation } from '../../../../src/shared/lib/i18n';

export default function StoreApplyPage() {
    const router = useRouter();
    const { user } = useTelegram();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const routes = useAppRoutes();

    const [formData, setFormData] = useState({
        storeName: '',
        addressText: '',
        lat: '',
        lng: '',
        photoUrl: '', // Start empty for upload
    });
    const [loading, setLoading] = useState(false);
    const saveApplicationLocally = () => {
        cachePendingStoreApplication({
            id: crypto.randomUUID(),
            userId: user ? String(user.id) : 'local-user',
            storeName: formData.storeName,
            addressText: formData.addressText,
            location: {
                lat: parseFloat(formData.lat) || 41.2995,
                lng: parseFloat(formData.lng) || 69.2401,
            },
            photoUrl: formData.photoUrl,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validators.required(formData.storeName) || !validators.required(formData.addressText)) {
            showToast({ message: t.fill_all_fields, type: 'error' });
            return;
        }
        setLoading(true);
        try {
            const token = await ensureMarketplaceToken(user);
            const body = {
                store_name: formData.storeName,
                store_description: '',
                owner_name: user ? `${user.first_name} ${user.last_name ?? ''}`.trim() : 'Marketplace User',
                phone: '',
                address: formData.addressText,
            };
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ''}/api/stores/request`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok && res.status !== 409) {
                throw new Error(result?.error ?? result?.message ?? 'Request failed');
            }

            saveApplicationLocally();
            showToast({ message: t.application_received, type: 'success' });
            router.replace(routes.STORE_STATUS);
        } catch (err: any) {
            showToast({ message: err?.message || t.error_occurred, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-[100dvh] bg-[var(--color-bg)] animate-in slide-in-from-right-8 duration-300">
            <div className="sticky top-0 z-10 flex items-center p-4 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
                <button onClick={() => router.back()} className="mr-3 text-[var(--color-text)]">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-[var(--color-text)]">{t.store_apply}</h1>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-5 flex-1 mt-2">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-hint)] mb-2 ml-1">{t.store_name}</label>
                    <Input
                        placeholder={t.store_name}
                        value={formData.storeName}
                        onChange={(e) => setFormData(p => ({ ...p, storeName: e.target.value }))}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-hint)] mb-2 ml-1">{t.address}</label>
                    <Input
                        placeholder="Toshkent sh., Yunusobod t."
                        value={formData.addressText}
                        onChange={(e) => setFormData(p => ({ ...p, addressText: e.target.value }))}
                        disabled={loading}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-hint)] mb-2 ml-1">Latitude</label>
                        <Input
                            placeholder="41.2995"
                            value={formData.lat}
                            onChange={(e) => setFormData(p => ({ ...p, lat: e.target.value }))}
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-hint)] mb-2 ml-1">Longitude</label>
                        <Input
                            placeholder="69.2401"
                            value={formData.lng}
                            onChange={(e) => setFormData(p => ({ ...p, lng: e.target.value }))}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-hint)] mb-2.5 ml-1">{t.store_image}</label>
                    <div
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="relative aspect-video w-full rounded-[24px] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center overflow-hidden transition-all active:scale-[0.98] group cursor-pointer"
                    >
                        {formData.photoUrl ? (
                            <>
                                <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-sm font-bold bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">{t.change}</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-[var(--color-hint)]">
                                <div className="w-12 h-12 rounded-full bg-[var(--color-surface2)] flex items-center justify-center mb-3">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                </div>
                                <span className="text-sm font-bold">{t.upload_image}</span>
                                <span className="text-[11px] mt-1 opacity-60">PNG, JPG (max 5MB)</span>
                            </div>
                        )}
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setFormData(p => ({ ...p, photoUrl: reader.result as string }));
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="pt-6">
                    <Button type="submit" isLoading={loading} className="w-full">
                        {t.submit_application}
                    </Button>
                </div>
            </form>
        </div>
    );
}
