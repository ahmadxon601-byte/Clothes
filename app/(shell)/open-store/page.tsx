'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowRight, LocateFixed, Loader2, UserRound } from 'lucide-react';
import { cn } from '../../../src/shared/lib/utils';
import { useWebI18n } from '../../../src/shared/lib/webI18n';
import { useWebAuth } from '../../../src/context/WebAuthContext';
import { AuthModal } from '../../../src/shared/ui/AuthModal';

type FormState = {
    storeName: string;
    ownerName: string;
    phone: string;
    address: string;
    description: string;
    images: string[];
};

type MapState = {
    centerLat: number;
    centerLng: number;
    markerLat: number;
    markerLng: number;
    zoom: number;
    selected: boolean;
};

const DEFAULT_LAT = 41.0011;
const DEFAULT_LNG = 71.6681;

const MapPickerLeaflet = dynamic(
    () => import('../../../src/shared/ui/MapPickerLeaflet').then((m) => m.MapPickerLeaflet),
    { ssr: false, loading: () => <div className="h-[260px] w-full animate-pulse rounded-2xl bg-[#f3f5f8] dark:bg-[#111111]" /> }
);

function formatResolvedAddress(body: any, lat: number, lng: number) {
    const addr = body?.address ?? {};
    const parts = [
        addr.road || addr.pedestrian || addr.footway,
        addr.house_number,
        addr.neighbourhood || addr.suburb || addr.quarter,
        addr.city || addr.town || addr.village || addr.county,
        addr.state,
        addr.postcode,
        addr.country,
    ].filter(Boolean);

    return parts.length ? parts.join(', ') : body?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function parseCoords(input: string) {
    const match = input.match(/Coordinates:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i);
    if (!match) return null;
    return { lat: Number(match[1]), lng: Number(match[2]) };
}

export default function OpenStorePage() {
    const router = useRouter();
    const { w } = useWebI18n();
    const { user, loading: authLoading, refreshStore } = useWebAuth();
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [authModal, setAuthModal] = useState(false);
    const [form, setForm] = useState<FormState>({
        storeName: '',
        ownerName: '',
        phone: '',
        address: '',
        description: '',
        images: [],
    });
    const [loading, setLoading] = useState(false);
    const [addressLoading, setAddressLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const latestReverseRef = useRef(0);
    const [map, setMap] = useState<MapState>({
        centerLat: DEFAULT_LAT,
        centerLng: DEFAULT_LNG,
        markerLat: DEFAULT_LAT,
        markerLng: DEFAULT_LNG,
        zoom: 12,
        selected: false,
    });

    const onChange = (key: 'storeName' | 'ownerName' | 'phone' | 'address' | 'description', value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleStoreImages = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        event.currentTarget.value = '';
        if (!files.length) return;

        const remainingSlots = 10 - form.images.length;
        if (remainingSlots <= 0) {
            setResult({ type: 'error', message: "Do'kon uchun eng ko'pi bilan 10 ta rasm yuklash mumkin." });
            return;
        }

        const limitedFiles = files.slice(0, remainingSlots);
        if (files.length > limitedFiles.length) {
            setResult({ type: 'info', message: "Faqat birinchi 10 ta rasm saqlandi." });
        }

        Promise.all(
            limitedFiles.map(
                (file) =>
                    new Promise<string>((resolve, reject) => {
                        if (!file.type.startsWith('image/')) {
                            reject(new Error('Faqat rasm yuklash mumkin.'));
                            return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => resolve(String(reader.result ?? ''));
                        reader.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi."));
                        reader.readAsDataURL(file);
                    }),
            ),
        )
            .then((encoded) => {
                const filtered = encoded.filter(Boolean);
                if (!filtered.length) return;
                setForm((prev) => ({ ...prev, images: [...prev.images, ...filtered].slice(0, 10) }));
                setResult(null);
            })
            .catch((err: unknown) => {
                setResult({
                    type: 'error',
                    message: err instanceof Error ? err.message : "Rasm yuklashda xatolik yuz berdi.",
                });
            });
    };

    const removeStoreImage = (index: number) => {
        setForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, imageIndex) => imageIndex !== index),
        }));
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        const requestId = latestReverseRef.current + 1;
        latestReverseRef.current = requestId;
        setAddressLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
                headers: {
                    'Accept-Language': 'uz,ru,en',
                },
            });
            const body = await res.json().catch(() => ({}));
            if (latestReverseRef.current !== requestId) return;
            onChange('address', formatResolvedAddress(body, lat, lng));
        } catch {
            if (latestReverseRef.current !== requestId) return;
            onChange('address', `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        } finally {
            if (latestReverseRef.current === requestId) {
                setAddressLoading(false);
            }
        }
    };

    const pickMyLocation = () => {
        if (!navigator.geolocation) {
            setResult({ type: 'error', message: w.openStore.geoUnsupported });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setMap((prev) => ({
                    ...prev,
                    centerLat: lat,
                    centerLng: lng,
                    markerLat: lat,
                    markerLng: lng,
                    selected: true,
                }));
                void reverseGeocode(lat, lng);
            },
            () => {
                setResult({ type: 'error', message: w.openStore.geoDenied });
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);

        if (!user) { setAuthModal(true); return; }

        if (!form.storeName.trim() || !form.ownerName.trim() || !form.phone.trim() || !form.address.trim() || !map.selected) {
            setResult({ type: 'error', message: w.openStore.fillRequired });
            return;
        }
        if (form.images.length < 1) {
            setResult({ type: 'error', message: "Kamida 1 ta do'kon rasmi yuklang." });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('marketplace_token') ?? '';
            const res = await fetch(`/api/stores/request`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    store_name: form.storeName.trim(),
                    store_description: `${form.description.trim()}\nCoordinates: ${map.markerLat.toFixed(6)}, ${map.markerLng.toFixed(6)}`.trim(),
                    owner_name: form.ownerName.trim(),
                    phone: form.phone.trim(),
                    address: form.address.trim(),
                    image_url: form.images[0] ?? null,
                    image_urls: form.images,
                }),
            });

            const body = await res.json().catch(() => ({}));
            if (res.ok) {
                await refreshStore();
                router.replace('/my-store');
                return;
            }

            if (res.status === 409) {
                setResult({
                    type: 'info',
                    message: 'Sizda allaqachon kutilayotgan ariza mavjud. Iltimos, tasdiqlanishini kuting.',
                });
                return;
            }

            setResult({ type: 'error', message: body?.error ?? body?.message ?? w.openStore.submitError });
        } catch {
            setResult({ type: 'error', message: w.openStore.serverError });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#00c853]" />
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <AuthModal open={authModal} onClose={() => setAuthModal(false)} defaultTab="login" />
                <section className="pb-14 md:pb-20">
                    <div className="relative h-[48vh] min-h-[340px] w-full overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2200&auto=format&fit=crop"
                            alt="Open your store"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
                        <div className="absolute inset-0 mx-auto flex w-full max-w-[1280px] items-end px-6 pb-10 md:px-10 md:pb-14">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8af9b3]">{w.openStore.partner}</p>
                                <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-[clamp(2.2rem,6vw,4.5rem)] font-black leading-none text-white">
                                    {w.openStore.title}
                                </h1>
                                <p className="mt-4 max-w-lg text-[14px] leading-6 text-white/75">{w.openStore.subtitle}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mx-auto mt-8 w-full max-w-[900px] px-6 md:mt-10 md:px-10">
                        <div className="rounded-[28px] border border-black/10 bg-white p-7 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.25)] text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f4f6]">
                                <UserRound size={28} className="text-[#9ca3af]" />
                            </div>
                            <h2 className="mt-4 text-[22px] font-black text-[#111111]">Kirish talab qilinadi</h2>
                            <p className="mt-2 text-[14px] text-[#6b7280]">Do'kon ochish uchun avval tizimga kiring yoki ro'yxatdan o'ting.</p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <button
                                    onClick={() => setAuthModal(true)}
                                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[#13ec37] px-7 text-[12px] font-black uppercase tracking-[0.12em] text-[#06200f] transition-all hover:shadow-[0_16px_34px_-14px_rgba(0,200,83,0.9)]"
                                >
                                    Kirish / Ro'yxat
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </>
        );
    }

    return (
        <>
        <AuthModal open={authModal} onClose={() => setAuthModal(false)} defaultTab="login" />
        <section className="pb-14 md:pb-20">
            <div className="relative h-[48vh] min-h-[340px] w-full overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2200&auto=format&fit=crop"
                    alt="Open your store"
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
                <div className="absolute inset-0 mx-auto flex w-full max-w-[1280px] items-end px-6 pb-10 md:px-10 md:pb-14">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8af9b3]">{w.openStore.partner}</p>
                        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-[clamp(2.2rem,6vw,4.5rem)] font-black leading-none text-white">
                            {w.openStore.title}
                        </h1>
                        <p className="mt-4 max-w-lg text-[14px] leading-6 text-white/75">
                            {w.openStore.subtitle}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto mt-8 w-full max-w-[900px] px-6 md:mt-10 md:px-10">
                <form onSubmit={onSubmit} className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.25)] md:p-7 dark:border-white/10 dark:bg-[#1a1a1a]">
                    <h2 className="text-[22px] font-black text-[#111111] dark:text-white">{w.openStore.formTitle}</h2>
                    <p className="mt-1 text-[13px] text-[#6b7280] dark:text-[#9ca3af]">{w.openStore.formDesc}</p>

                    <div className="mt-5 grid gap-4">
                        <label className="grid gap-1.5">
                            <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{w.openStore.storeName}</span>
                            <input
                                value={form.storeName}
                                onChange={(e) => onChange('storeName', e.target.value)}
                                className="h-11 rounded-xl border border-black/12 px-3 text-[14px] outline-none transition-all focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                                placeholder={w.openStore.storeNamePlaceholder}
                                disabled={loading}
                            />
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-1.5">
                                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{w.openStore.ownerName}</span>
                                <input
                                    value={form.ownerName}
                                    onChange={(e) => onChange('ownerName', e.target.value)}
                                    className="h-11 rounded-xl border border-black/12 px-3 text-[14px] outline-none transition-all focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                                    placeholder={w.openStore.ownerNamePlaceholder}
                                    disabled={loading}
                                />
                            </label>
                            <label className="grid gap-1.5">
                                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{w.openStore.phone}</span>
                                <input
                                    value={form.phone}
                                    onChange={(e) => onChange('phone', e.target.value)}
                                    className="h-11 rounded-xl border border-black/12 px-3 text-[14px] outline-none transition-all focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                                    placeholder={w.openStore.phonePlaceholder}
                                    disabled={loading}
                                />
                            </label>
                        </div>

                        <label className="grid gap-1.5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{w.openStore.addressMap}</span>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={pickMyLocation}
                                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/15 bg-white px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#111111] dark:border-white/10 dark:bg-white/10 dark:text-white"
                                    >
                                        <LocateFixed size={13} />
                                        {w.openStore.myLocation}
                                    </button>
                                </div>
                            </div>

                            <MapPickerLeaflet
                                embedded
                                initialLat={map.markerLat}
                                initialLng={map.markerLng}
                onChange={(formatted) => {
                                    const coords = parseCoords(formatted);
                                    if (!coords) return;
                                    setMap((prev) => ({
                                        ...prev,
                                        markerLat: coords.lat,
                                        markerLng: coords.lng,
                                        centerLat: coords.lat,
                                        centerLng: coords.lng,
                                        selected: true,
                                    }));
                                    onChange('address', formatted.replace(/\s*Coordinates:.*$/i, '').trim());
                                }}
                                onConfirm={(formatted) => {
                                    const coords = parseCoords(formatted);
                                    if (!coords) return;
                                    setMap((prev) => ({
                                        ...prev,
                                        markerLat: coords.lat,
                                        markerLng: coords.lng,
                                        centerLat: coords.lat,
                                        centerLng: coords.lng,
                                        selected: true,
                                    }));
                                    onChange('address', formatted.replace(/\s*Coordinates:.*$/i, '').trim());
                                }}
                                onClose={() => {}}
                            />
                            <input type="hidden" name="latitude" value={map.markerLat.toFixed(6)} />
                            <input type="hidden" name="longitude" value={map.markerLng.toFixed(6)} />

                            <div className="rounded-xl border border-black/12 bg-[#f9fafb] px-3 py-2.5 text-[13px] text-[#4b5563] dark:border-white/10 dark:bg-[#111111] dark:text-[#d1d5db]">
                                {addressLoading ? w.openStore.resolving : (form.address || w.openStore.notPicked)}
                            </div>
                            <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                                {w.openStore.pickedCoords}: {map.markerLat.toFixed(6)}, {map.markerLng.toFixed(6)}
                            </p>
                        </label>

                        <label className="grid gap-1.5">
                            <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{w.openStore.descLabel}</span>
                            <textarea
                                value={form.description}
                                onChange={(e) => onChange('description', e.target.value)}
                                className="min-h-[110px] rounded-xl border border-black/12 px-3 py-2.5 text-[14px] outline-none transition-all focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                                placeholder={w.openStore.descPlaceholder}
                                disabled={loading}
                            />
                        </label>

                        <label className="grid gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{w.openStore.storeImages}</span>
                                <span className="text-[11px] font-semibold text-[#6b7280] dark:text-[#9ca3af]">{form.images.length}/10</span>
                            </div>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleStoreImages}
                                disabled={loading || form.images.length >= 10}
                                className="sr-only"
                            />
                            <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                disabled={loading || form.images.length >= 10}
                                className="flex w-full items-center gap-4 rounded-xl border border-black/12 bg-white px-3 py-2 text-left text-[13px] text-[#374151] dark:border-white/10 dark:bg-[#111111] dark:text-[#d1d5db] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className="inline-flex rounded-full bg-[#13ec37] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#06200f]">
                                    {w.openStore.chooseFiles}
                                </span>
                                <span>
                                    {form.images.length > 0
                                        ? `${form.images.length} ${w.openStore.filesSelected}`
                                        : w.openStore.noFilesChosen}
                                </span>
                            </button>
                            <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">{w.openStore.imagesHint}</p>
                            {form.images.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {form.images.map((image, index) => (
                                        <div key={`${index}-${image.slice(0, 20)}`} className="relative overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                                            <img src={image} alt={`Store image ${index + 1}`} className="h-28 w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeStoreImage(index)}
                                                className="absolute right-1.5 top-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white"
                                            >
                                                O'chirish
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </label>
                    </div>

                    {result && (
                        <div
                            className={cn(
                                'mt-4 rounded-xl px-3 py-2.5 text-[13px] font-semibold',
                                result.type === 'success' && 'bg-[#e7f9ef] text-[#0a7b35] dark:bg-[#00c853]/10 dark:text-[#4ade80]',
                                result.type === 'error' && 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
                                result.type === 'info' && 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
                            )}
                        >
                            {result.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#13ec37] px-6 text-[12px] font-black uppercase tracking-[0.12em] text-[#06200f] transition-all hover:shadow-[0_16px_34px_-14px_rgba(0,200,83,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? w.openStore.submitting : w.openStore.submit}
                        <ArrowRight size={14} />
                    </button>
                </form>
            </div>
        </section>
        </>
    );
}
