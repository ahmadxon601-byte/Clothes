'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
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

const MapPickerLeaflet = dynamic(
    () => import('../../../../src/shared/ui/MapPickerLeaflet').then((m) => m.MapPickerLeaflet),
    { ssr: false },
);

const NAMANGAN_LAT = 41.0011;
const NAMANGAN_LNG = 71.6726;

function parseCoords(input: string) {
    const m = input.match(/Coordinates:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i);
    return m ? { lat: m[1], lng: m[2] } : null;
}

export default function StoreApplyPage() {
    const router = useRouter();
    const { user } = useTelegram();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const routes = useAppRoutes();

    const [formData, setFormData] = useState({
        storeName: '',
        phone: '',
        description: '',
        addressText: '',
        lat: '',
        lng: '',
        photoUrl: '',
    });
    const [loading, setLoading] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const saveApplicationLocally = () => {
        cachePendingStoreApplication({
            id: crypto.randomUUID(),
            userId: user ? String(user.id) : 'local-user',
            storeName: formData.storeName,
            addressText: formData.addressText,
            location: {
                lat: parseFloat(formData.lat) || NAMANGAN_LAT,
                lng: parseFloat(formData.lng) || NAMANGAN_LNG,
            },
            photoUrl: formData.photoUrl,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validators.required(formData.storeName) || !validators.required(formData.phone)) {
            showToast({ message: t.fill_all_fields, type: 'error' });
            return;
        }
        setLoading(true);
        try {
            const token = await ensureMarketplaceToken(user);
            const body = {
                store_name: formData.storeName,
                store_description: formData.description,
                owner_name: user ? `${user.first_name} ${user.last_name ?? ''}`.trim() : 'Marketplace User',
                phone: formData.phone,
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
        <div className="flex min-h-full flex-col bg-[var(--color-bg)] animate-in slide-in-from-right-8 duration-300">
            <div className="sticky top-0 z-10 flex items-center p-4 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
                <button onClick={() => router.back()} className="mr-3 text-[var(--color-text)]">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-[var(--color-text)]">{t.store_apply}</h1>
            </div>

            <form onSubmit={handleSubmit} className="mt-2 flex-1 space-y-5 p-4 pb-[calc(var(--shell-nav-total)+28px)]">
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
                    <label className="block text-sm font-medium text-[var(--color-hint)] mb-2 ml-1">{t.phone ?? 'Telefon raqam'}</label>
                    <Input
                        placeholder="+998 90 000 00 00"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-hint)] mb-2 ml-1">{t.description ?? 'Tavsif'}</label>
                    <textarea
                        placeholder={t.store_description ?? "Do'kon haqida qisqacha..."}
                        value={formData.description}
                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                        disabled={loading}
                        rows={3}
                        className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-hint)]/60 outline-none focus:ring-2 ring-[var(--color-primary)]/25 resize-none transition-all"
                    />
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

                {formData.addressText && (
                    <div className="px-4 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] text-[var(--color-hint)]">
                        <span className="font-semibold text-[var(--color-text)]">📍 </span>
                        {formData.addressText}
                    </div>
                )}

                {!mapOpen && (
                    <div className="mb-3 space-y-3">
                        <MapPickerLeaflet
                            embedded
                            initialLat={parseFloat(formData.lat) || NAMANGAN_LAT}
                            initialLng={parseFloat(formData.lng) || NAMANGAN_LNG}
                            onChange={(formatted) => {
                                const coords = parseCoords(formatted);
                                if (!coords) return;
                                setFormData((p) => ({ ...p, lat: coords.lat, lng: coords.lng }));
                            }}
                            onConfirm={(formatted) => {
                                const coords = parseCoords(formatted);
                                setFormData((p) => ({
                                    ...p,
                                    addressText: formatted,
                                    lat: coords?.lat ?? p.lat,
                                    lng: coords?.lng ?? p.lng,
                                }));
                            }}
                            onClose={() => {}}
                        />
                        <Button
                            type="button"
                            onClick={() => setMapOpen(true)}
                            className="w-full"
                            disabled={loading}
                        >
                            Lokatsiyani xaritadan tanlash
                        </Button>
                    </div>
                )}

                <div className="pt-6">
                    <Button type="submit" isLoading={loading} className="w-full">
                        {t.submit_application}
                    </Button>
                </div>

            </form>

            {mapOpen && (
                <MapPickerLeaflet
                    initialLat={parseFloat(formData.lat) || NAMANGAN_LAT}
                    initialLng={parseFloat(formData.lng) || NAMANGAN_LNG}
                    onConfirm={(formatted) => {
                        const coords = parseCoords(formatted);
                        setFormData((p) => ({
                            ...p,
                            addressText: formatted,
                            lat: coords?.lat ?? p.lat,
                            lng: coords?.lng ?? p.lng,
                        }));
                        setMapOpen(false);
                    }}
                    onClose={() => setMapOpen(false)}
                />
            )}
        </div>
    );
}
