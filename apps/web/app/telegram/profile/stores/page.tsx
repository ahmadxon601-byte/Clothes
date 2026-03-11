'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Store, Plus, Trash2, Edit3, Eye, Loader2, Clock, CheckCircle, XCircle, Image as ImageIcon, MapPin } from 'lucide-react';
import { getApiToken } from '../../../../src/lib/apiClient';
import { TELEGRAM_ROUTES } from '../../../../src/shared/config/constants';

const InlineMapPicker = dynamic(
    () => import('../../../../src/shared/ui/InlineMapPicker').then(m => m.InlineMapPicker),
    { ssr: false, loading: () => <div className="h-[260px] rounded-[18px] bg-[var(--color-surface2)] animate-pulse" /> }
);

interface MyStore {
    id: string;
    name: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    image_url: string | null;
    created_at: string;
}

interface SellerRequest {
    id: string;
    store_name: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    admin_note: string | null;
}

type View = 'list' | 'apply' | 'edit';

function authHeaders(): Record<string, string> {
    const token = getApiToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function uploadImage(file: File): Promise<string> {
    const token = getApiToken();
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Upload failed');
    return (json.data?.url ?? json.url) as string;
}

async function reverseGeocode(lat: number, lng: number): Promise<{ label: string; full: string }> {
    const coordStr = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'uz,ru,en' } }
        );
        const data = await res.json();
        const address = data.display_name ?? '';
        return address
            ? { label: address, full: `${address} ${coordStr}` }
            : { label: coordStr, full: coordStr };
    } catch {
        return { label: coordStr, full: coordStr };
    }
}

function displayAddress(address: string | null) {
    if (!address) return '';
    return address.replace(/\s*Coordinates:.*$/i, '').trim();
}

export default function ProfileStoresPage() {
    const [stores, setStores] = useState<MyStore[]>([]);
    const [requests, setRequests] = useState<SellerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('list');
    const [editStore, setEditStore] = useState<MyStore | null>(null);
    // unique key to force-remount map on form open
    const [mapKey, setMapKey] = useState(0);

    // Apply form
    const [applyName, setApplyName] = useState('');
    const [applyDesc, setApplyDesc] = useState('');
    const [applyPhone, setApplyPhone] = useState('');
    const [applyAddress, setApplyAddress] = useState('');
    const [applyAddressLabel, setApplyAddressLabel] = useState('');
    const [applyGeoLoading, setApplyGeoLoading] = useState(false);
    const [applyOwner, setApplyOwner] = useState('');
    const [applyImgFile, setApplyImgFile] = useState<File | null>(null);
    const [applyImgPreview, setApplyImgPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Edit form
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editAddressLabel, setEditAddressLabel] = useState('');
    const [editGeoLoading, setEditGeoLoading] = useState(false);
    const [editImg, setEditImg] = useState<string | null>(null);
    const [editImgFile, setEditImgFile] = useState<File | null>(null);
    const [editImgPreview, setEditImgPreview] = useState<string | null>(null);

    const applyFileRef = useRef<HTMLInputElement>(null);
    const editFileRef = useRef<HTMLInputElement>(null);
    const geocodeTimer = useRef<number | null>(null);

    const fetchAll = async () => {
        const token = getApiToken();
        if (!token) { setLoading(false); return; }
        try {
            const res = await fetch('/api/stores/my/all', { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            const d = json.data ?? json;
            setStores(d.stores ?? []);
            setRequests((d.requests ?? []).filter((r: SellerRequest) => r.status !== 'approved'));
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // Geocode after map pin change (debounced)
    const handleMapPick = useCallback((lat: number, lng: number, target: 'apply' | 'edit') => {
        if (target === 'apply') setApplyGeoLoading(true);
        else setEditGeoLoading(true);

        if (geocodeTimer.current) window.clearTimeout(geocodeTimer.current);
        geocodeTimer.current = window.setTimeout(async () => {
            const { label, full } = await reverseGeocode(lat, lng);
            if (target === 'apply') {
                setApplyAddress(full);
                setApplyAddressLabel(label);
                setApplyGeoLoading(false);
            } else {
                setEditAddress(full);
                setEditAddressLabel(label);
                setEditGeoLoading(false);
            }
        }, 600);
    }, []);

    const handleApplySubmit = async () => {
        if (!applyName.trim() || !applyOwner.trim()) { setError("Ism va do'kon nomi majburiy"); return; }
        setSubmitting(true); setError('');
        try {
            let imgUrl: string | undefined;
            if (applyImgFile) imgUrl = await uploadImage(applyImgFile);
            const res = await fetch('/api/stores/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    store_name: applyName, store_description: applyDesc || undefined,
                    owner_name: applyOwner, phone: applyPhone || undefined,
                    address: applyAddress || undefined, image_url: imgUrl,
                }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? 'Xatolik yuz berdi'); return; }
            setApplyName(''); setApplyDesc(''); setApplyPhone(''); setApplyAddress('');
            setApplyAddressLabel(''); setApplyOwner(''); setApplyImgFile(null); setApplyImgPreview(null);
            await fetchAll();
            setView('list');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Xatolik yuz berdi');
        } finally { setSubmitting(false); }
    };

    const handleEditOpen = (store: MyStore) => {
        setEditStore(store);
        setEditName(store.name);
        setEditDesc(store.description ?? '');
        setEditPhone(store.phone ?? '');
        setEditAddress(store.address ?? '');
        setEditAddressLabel(displayAddress(store.address));
        setEditImg(store.image_url);
        setEditImgFile(null);
        setEditImgPreview(store.image_url);
        setError('');
        setMapKey(k => k + 1); // force map remount
        setView('edit');
    };

    const handleEditSubmit = async () => {
        if (!editStore || !editName.trim()) { setError("Do'kon nomi majburiy"); return; }
        setSubmitting(true); setError('');
        try {
            let imgUrl = editImg;
            if (editImgFile) imgUrl = await uploadImage(editImgFile);
            const res = await fetch(`/api/stores/${editStore.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    name: editName, description: editDesc || undefined,
                    phone: editPhone || undefined, address: editAddress || undefined,
                    image_url: imgUrl ?? null,
                }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? 'Xatolik yuz berdi'); return; }
            await fetchAll();
            setView('list');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Xatolik yuz berdi');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (storeId: string) => {
        if (!confirm("Do'konni o'chirishni tasdiqlaysizmi?")) return;
        try {
            await fetch(`/api/stores/${storeId}`, { method: 'DELETE', headers: authHeaders() });
            await fetchAll();
        } catch { /* ignore */ }
    };

    const statusBadge = (status: string) => {
        if (status === 'pending') return <span className="flex items-center gap-1 text-amber-500 text-[11px] font-bold"><Clock size={11} />Ko&apos;rib chiqilmoqda</span>;
        if (status === 'approved') return <span className="flex items-center gap-1 text-green-500 text-[11px] font-bold"><CheckCircle size={11} />Tasdiqlandi</span>;
        return <span className="flex items-center gap-1 text-red-500 text-[11px] font-bold"><XCircle size={11} />Rad etildi</span>;
    };

    const inputCls = "w-full h-12 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] outline-none focus:border-[var(--color-primary)]";

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
        </div>
    );

    // ── Apply form ──
    if (view === 'apply') {
        return (
            <div className="px-4 pb-8">
                <button onClick={() => { setView('list'); setError(''); }} className="flex items-center gap-2 mb-5 text-[var(--color-hint)] text-[14px] font-medium">
                    <ArrowLeft size={18} /> Orqaga
                </button>
                <h2 className="text-[20px] font-bold text-[var(--color-text)] mb-5">Do&apos;kon ochish arizasi</h2>

                <div className="space-y-3">
                    {/* Image */}
                    <div
                        onClick={() => applyFileRef.current?.click()}
                        className="relative h-36 rounded-[20px] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden"
                    >
                        {applyImgPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={applyImgPreview} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                            <><ImageIcon size={28} className="text-[var(--color-hint)]" /><p className="text-[13px] text-[var(--color-hint)]">Do&apos;kon rasmi (ixtiyoriy)</p></>
                        )}
                        <input ref={applyFileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) { setApplyImgFile(f); setApplyImgPreview(URL.createObjectURL(f)); }
                        }} />
                    </div>

                    <input value={applyOwner} onChange={e => setApplyOwner(e.target.value)} placeholder="Ism familiya *" className={inputCls} />
                    <input value={applyName} onChange={e => setApplyName(e.target.value)} placeholder="Do'kon nomi *" className={inputCls} />
                    <textarea value={applyDesc} onChange={e => setApplyDesc(e.target.value)} placeholder="Tavsif (ixtiyoriy)" rows={3} className="w-full rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] outline-none focus:border-[var(--color-primary)] resize-none" />
                    <input value={applyPhone} onChange={e => setApplyPhone(e.target.value)} placeholder="Telefon (ixtiyoriy)" className={inputCls} />

                    {/* Embedded map */}
                    <div className="space-y-2">
                        <p className="text-[12px] font-semibold text-[var(--color-hint)]">Joylashuv (ixtiyoriy) — xaritaga bosib tanlang</p>
                        <InlineMapPicker
                            key={`apply-map-${mapKey}`}
                            onPick={(lat, lng) => handleMapPick(lat, lng, 'apply')}
                        />
                        {applyGeoLoading && (
                            <div className="flex items-center gap-2 text-[12px] text-[var(--color-hint)]">
                                <Loader2 size={13} className="animate-spin" /> Manzil aniqlanmoqda...
                            </div>
                        )}
                        {applyAddressLabel && !applyGeoLoading && (
                            <div className="flex items-start gap-1.5 px-3 py-2 rounded-[12px] bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/20">
                                <MapPin size={13} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
                                <p className="text-[12px] text-[var(--color-text)] leading-relaxed">{applyAddressLabel}</p>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-500 text-[13px]">{error}</p>}
                    <button onClick={handleApplySubmit} disabled={submitting} className="w-full h-12 rounded-full bg-[var(--color-primary)] text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                        Ariza yuborish
                    </button>
                </div>
            </div>
        );
    }

    // ── Edit form ──
    if (view === 'edit' && editStore) {
        return (
            <div className="px-4 pb-8">
                <button onClick={() => { setView('list'); setError(''); }} className="flex items-center gap-2 mb-5 text-[var(--color-hint)] text-[14px] font-medium">
                    <ArrowLeft size={18} /> Orqaga
                </button>
                <h2 className="text-[20px] font-bold text-[var(--color-text)] mb-5">Do&apos;konni tahrirlash</h2>

                <div className="space-y-3">
                    <div
                        onClick={() => editFileRef.current?.click()}
                        className="relative h-36 rounded-[20px] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden"
                    >
                        {editImgPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={editImgPreview} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                            <><ImageIcon size={28} className="text-[var(--color-hint)]" /><p className="text-[13px] text-[var(--color-hint)]">Rasm o&apos;zgartirish</p></>
                        )}
                        <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) { setEditImgFile(f); setEditImgPreview(URL.createObjectURL(f)); }
                        }} />
                    </div>

                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Do'kon nomi *" className={inputCls} />
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Tavsif (ixtiyoriy)" rows={3} className="w-full rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] outline-none focus:border-[var(--color-primary)] resize-none" />
                    <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Telefon" className={inputCls} />

                    {/* Embedded map */}
                    <div className="space-y-2">
                        <p className="text-[12px] font-semibold text-[var(--color-hint)]">Joylashuvni yangilash — xaritaga bosib tanlang</p>
                        <InlineMapPicker
                            key={`edit-map-${mapKey}`}
                            onPick={(lat, lng) => handleMapPick(lat, lng, 'edit')}
                        />
                        {editGeoLoading && (
                            <div className="flex items-center gap-2 text-[12px] text-[var(--color-hint)]">
                                <Loader2 size={13} className="animate-spin" /> Manzil aniqlanmoqda...
                            </div>
                        )}
                        {(editAddressLabel || displayAddress(editAddress)) && !editGeoLoading && (
                            <div className="flex items-start gap-1.5 px-3 py-2 rounded-[12px] bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/20">
                                <MapPin size={13} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
                                <p className="text-[12px] text-[var(--color-text)] leading-relaxed">
                                    {editAddressLabel || displayAddress(editAddress)}
                                </p>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-500 text-[13px]">{error}</p>}
                    <button onClick={handleEditSubmit} disabled={submitting} className="w-full h-12 rounded-full bg-[var(--color-primary)] text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                        Saqlash
                    </button>
                </div>
            </div>
        );
    }

    // ── List view ──
    return (
        <div className="px-4 pb-8">
            <div className="flex items-center justify-between mb-5">
                <Link href="/telegram/profile" className="flex items-center gap-2 text-[var(--color-hint)] text-[14px] font-medium">
                    <ArrowLeft size={18} /> Profil
                </Link>
                <h2 className="text-[17px] font-bold text-[var(--color-text)]">Mening do&apos;konlarim</h2>
                <div className="w-16" />
            </div>

            {stores.length > 0 && (
                <div className="space-y-3 mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-hint)]">Faol do&apos;konlar</p>
                    {stores.map(store => (
                        <div key={store.id} className="bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-border)] p-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--color-surface2)] flex items-center justify-center shrink-0">
                                    {store.image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Store size={22} className="text-[var(--color-hint)]" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[15px] font-bold text-[var(--color-text)] truncate">{store.name}</p>
                                    {store.address && (
                                        <p className="text-[11px] text-[var(--color-hint)] truncate">{displayAddress(store.address)}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <Link href={TELEGRAM_ROUTES.STORE(store.id)} className="flex-1 h-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center gap-1.5 text-[12px] font-bold active:scale-95 transition-all">
                                    <Eye size={14} /> Ko&apos;rish
                                </Link>
                                <button onClick={() => handleEditOpen(store)} className="flex-1 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center gap-1.5 text-[12px] font-bold active:scale-95 transition-all">
                                    <Edit3 size={14} /> Tahrir
                                </button>
                                <button onClick={() => handleDelete(store.id)} className="flex-1 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center gap-1.5 text-[12px] font-bold active:scale-95 transition-all">
                                    <Trash2 size={14} /> O&apos;chirish
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {requests.length > 0 && (
                <div className="space-y-2 mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-hint)]">Arizalar</p>
                    {requests.map(req => (
                        <div key={req.id} className="bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-border)] p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[14px] font-bold text-[var(--color-text)]">{req.store_name}</p>
                                {statusBadge(req.status)}
                            </div>
                            {req.admin_note && <p className="mt-1.5 text-[12px] text-[var(--color-hint)]">{req.admin_note}</p>}
                        </div>
                    ))}
                </div>
            )}

            {stores.length === 0 && requests.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center mb-3">
                        <Store size={24} className="text-[var(--color-hint)]" />
                    </div>
                    <p className="text-[16px] font-bold text-[var(--color-text)]">Do&apos;kon yo&apos;q</p>
                    <p className="text-[13px] text-[var(--color-hint)] mt-1">Do&apos;kon ochish uchun ariza bering</p>
                </div>
            )}

            {!requests.some(r => r.status === 'pending') && (
                <button
                    onClick={() => { setView('apply'); setError(''); setMapKey(k => k + 1); }}
                    className="w-full h-12 rounded-full bg-[var(--color-primary)] text-white font-bold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_4px_14px_rgba(26,229,80,0.25)]"
                >
                    <Plus size={18} />
                    Do&apos;kon ochish arizasi
                </button>
            )}
        </div>
    );
}
