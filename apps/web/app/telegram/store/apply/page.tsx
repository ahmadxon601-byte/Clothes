'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Upload, MapPin, Store, CheckCircle } from 'lucide-react';
import { useTelegram } from '../../../../src/telegram/useTelegram';
import { cachePendingStoreApplication, ensureMarketplaceToken } from '../../../../src/lib/marketplaceAuth';
import { useToast } from '../../../../src/shared/ui/useToast';
import { useTranslation } from '../../../../src/shared/lib/i18n';
import { MapPicker, type LatLng } from '../../../../src/shared/ui/MapPicker';

// Namangan city center default
const NAMANGAN: LatLng = { lat: 41.0011, lng: 71.6681 };

export default function TelegramStoreApplyPage() {
    const router = useRouter();
    const { user } = useTelegram();
    const { showToast } = useToast();
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        storeName: '',
        addressText: '',
        photoUrl: '',
    });
    const [location, setLocation] = useState<LatLng>(NAMANGAN);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.storeName.trim() || !formData.addressText.trim()) {
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
            cachePendingStoreApplication({
                id: crypto.randomUUID(),
                userId: user ? String(user.id) : 'local-user',
                storeName: formData.storeName,
                addressText: formData.addressText,
                location: { lat: location.lat, lng: location.lng },
                photoUrl: formData.photoUrl,
            });
            setSuccess(true);
        } catch (err: any) {
            showToast({ message: err?.message || t.error_occurred, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center bg-[var(--color-bg)] max-w-[500px] mx-auto">
                <div className="w-20 h-20 rounded-3xl bg-[var(--color-primary)]/15 flex items-center justify-center mb-5">
                    <CheckCircle size={40} className="text-[var(--color-primary)]" />
                </div>
                <h2 className="text-[20px] font-black text-[var(--color-text)] mb-2">{t.application_received}</h2>
                <p className="text-[13px] text-[var(--color-hint)] leading-relaxed mb-8">
                    {t.pending_desc}
                </p>
                <button
                    onClick={() => router.replace('/telegram/profile')}
                    className="w-full h-12 rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[14px] font-bold active:scale-[0.98] transition-all"
                >
                    {t.back_to_profile}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] max-w-[500px] mx-auto">

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-3 py-3 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)]">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 flex items-center justify-center bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] text-[var(--color-text)] active:scale-95 transition-all"
                >
                    <ChevronLeft size={18} />
                </button>
                <h1 className="text-[16px] font-bold text-[var(--color-text)]">{t.store_apply}</h1>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-3 pt-4 pb-6">

                {/* Store name */}
                <div>
                    <label className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-2 ml-1 block">
                        {t.store_name}
                    </label>
                    <div className="relative">
                        <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-hint)] opacity-60" />
                        <input
                            placeholder={t.store_name}
                            value={formData.storeName}
                            onChange={(e) => setFormData(p => ({ ...p, storeName: e.target.value }))}
                            disabled={loading}
                            className="h-12 w-full bg-[var(--color-surface)] rounded-2xl pl-10 pr-4 outline-none text-[14px] font-medium text-[var(--color-text)] placeholder:text-[var(--color-hint)]/50 border border-[var(--color-border)] focus:ring-2 ring-[var(--color-primary)]/25 transition-all disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-2 ml-1 block">
                        {t.address}
                    </label>
                    <div className="relative">
                        <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-hint)] opacity-60" />
                        <input
                            placeholder="Namangan sh., ..."
                            value={formData.addressText}
                            onChange={(e) => setFormData(p => ({ ...p, addressText: e.target.value }))}
                            disabled={loading}
                            className="h-12 w-full bg-[var(--color-surface)] rounded-2xl pl-10 pr-4 outline-none text-[14px] font-medium text-[var(--color-text)] placeholder:text-[var(--color-hint)]/50 border border-[var(--color-border)] focus:ring-2 ring-[var(--color-primary)]/25 transition-all disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Map location picker */}
                <div>
                    <label className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-2 ml-1 block">
                        Joylashuv (xaritadan tanlang)
                    </label>
                    <MapPicker
                        value={location}
                        onChange={setLocation}
                        height="200px"
                    />
                </div>

                {/* Photo upload */}
                <div>
                    <label className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-2 ml-1 block">
                        {t.store_image}
                    </label>
                    <div
                        onClick={() => document.getElementById('tg-file-upload')?.click()}
                        className={`relative w-full rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center overflow-hidden cursor-pointer active:scale-[0.98] transition-all ${formData.photoUrl ? 'aspect-[16/9]' : 'h-[110px]'}`}
                    >
                        {formData.photoUrl ? (
                            <>
                                <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <span className="text-white text-[12px] font-bold bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                                        {t.change}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-[var(--color-hint)]">
                                <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface2)] flex items-center justify-center">
                                    <Upload size={18} />
                                </div>
                                <span className="text-[12px] font-bold">{t.upload_image}</span>
                                <span className="text-[10px] opacity-60">PNG, JPG (max 5MB)</span>
                            </div>
                        )}
                        <input
                            id="tg-file-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setFormData(p => ({ ...p, photoUrl: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                            }}
                        />
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
                >
                    {loading && (
                        <div className="w-5 h-5 border-2 border-[var(--color-primary-contrast)]/30 border-t-[var(--color-primary-contrast)] rounded-full animate-spin" />
                    )}
                    {t.submit_application}
                </button>

            </form>
        </div>
    );
}
