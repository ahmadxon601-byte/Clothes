'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Camera, Edit3, MapPin, Phone, Trash2, X, Loader2, Clock, XCircle, CheckCircle2 } from 'lucide-react';
import { useWebAuth } from '../../../src/context/WebAuthContext';
import { useWebI18n } from '../../../src/shared/lib/webI18n';
import { useSSERefetch } from '../../../src/shared/hooks/useSSERefetch';
import { ConfirmDialog } from '../../../src/shared/ui/ConfirmDialog';
import { useSettingsStore } from '../../../src/features/settings/model';

async function loadWithRetry<T>(loader: () => Promise<T>, retries = 2, delayMs = 400): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await loader();
        } catch (error) {
            lastError = error;
            if (attempt === retries) break;
            await new Promise((resolve) => window.setTimeout(resolve, delayMs));
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error('Komponentni yuklab bo\'lmadi. Sahifani yangilang.');
}

const MapPickerLeaflet = dynamic(
    () => loadWithRetry(() => import('../../../src/shared/ui/MapPickerLeaflet')).then((m) => m.MapPickerLeaflet),
    { ssr: false }
);

const MapDisplay = dynamic(
    () => loadWithRetry(() => import('../../../src/shared/ui/MapDisplay')).then((m) => m.MapDisplay),
    { ssr: false, loading: () => <div className="h-[160px] w-full bg-[#f3f4f6] dark:bg-[#111111] animate-pulse" /> }
);

type StoreData = {
    id: string;
    name: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    image_url?: string | null;
    owner_name?: string | null;
    created_at: string;
};

type RequestData = {
    id: string;
    store_name: string;
    status: 'pending' | 'rejected' | 'approved';
    created_at: string;
    admin_note: string | null;
    request_type?: 'store_create' | 'store_update';
    target_store_id?: string | null;
};

function parseAddress(raw: string): { text: string; lat: number | null; lng: number | null } {
    const m = raw.match(/Coordinates:\s*([-\d.]+),\s*([-\d.]+)/i);
    if (!m) return { text: raw.trim(), lat: null, lng: null };
    const idx = raw.toLowerCase().indexOf('coordinates:');
    const text = idx > 0 ? raw.slice(0, idx).trim() : '';
    return { text, lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
}

function sanitizePhoneInput(value: string) {
    const hasLeadingPlus = value.trim().startsWith('+');
    const digits = value.replace(/\D/g, '').slice(0, 15);
    return hasLeadingPlus ? `+${digits}` : digits;
}

function isLocalUploadUrl(url: string) {
    return url.startsWith('/uploads/');
}

export default function MyStorePage() {
    const router = useRouter();
    const { user, loading: authLoading, refreshStore } = useWebAuth();
    const { w } = useWebI18n();
    const language = useSettingsStore((s) => s.settings.language);
    const storeText = language === 'ru'
        ? {
            approved: 'Одобрено',
            edit: 'Редактировать',
            delete: 'Удалить',
            phone: 'Телефон',
            address: 'Адрес',
            description: 'Описание',
            editTitle: 'Редактировать магазин',
            editHint: 'Изменения после сохранения не появляются сразу. Сначала их подтверждает администратор.',
            deleteTitle: 'Удалить магазин',
            deleteDesc: 'Это действие нельзя отменить. Ваш магазин будет удален.',
            nameRequired: 'Название магазина обязательно',
            cancel: 'Отмена',
            save: 'Сохранить',
        }
        : language === 'en'
            ? {
                approved: 'Approved',
                edit: 'Edit',
                delete: 'Delete',
                phone: 'Phone',
                address: 'Address',
                description: 'Description',
                editTitle: 'Edit Store',
                editHint: 'Changes do not appear immediately after saving. They are reviewed by admin first.',
                deleteTitle: 'Delete store',
                deleteDesc: 'This action cannot be undone. Your store will be deleted.',
                nameRequired: 'Store name is required',
                cancel: 'Cancel',
                save: 'Save',
            }
            : {
                approved: 'Tasdiqlangan',
                edit: 'Tahrirlash',
                delete: "O'chirish",
                phone: 'Telefon',
                address: 'Manzil',
                description: 'Tavsif',
                editTitle: "Do'konni Tahrirlash",
                editHint: "Saqlash bosilganda o'zgarishlar to'g'ridan-to'g'ri chiqmaydi. Avval admin tasdiqlaydi.",
                deleteTitle: "Do'konni o'chirish",
                deleteDesc: "Bu amalni qaytarib bo'lmaydi. Do'koningiz o'chiriladi.",
                nameRequired: "Do'kon nomi majburiy",
                cancel: 'Bekor',
                save: 'Saqlash',
            };

    const [stores, setStores] = useState<StoreData[]>([]);
    const [requests, setRequests] = useState<RequestData[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    const [editingStore, setEditingStore] = useState<StoreData | null>(null);
    const [deleteStore, setDeleteStore] = useState<StoreData | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({ name: '', description: '', phone: '', address: '' });
    const [formImage, setFormImage] = useState<string | null>(null);
    const [temporaryUploadUrl, setTemporaryUploadUrl] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; onConfirm: () => void }>({
        open: false,
        message: '',
        onConfirm: () => {},
    });

    useEffect(() => {
        const hidden = Boolean(editingStore || deleteStore);
        window.dispatchEvent(new CustomEvent('web-shell-header-visibility', { detail: { hidden } }));
        return () => {
            window.dispatchEvent(new CustomEvent('web-shell-header-visibility', { detail: { hidden: false } }));
        };
    }, [editingStore, deleteStore]);

    const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('marketplace_token') : null;

    const deleteUploadedImage = useCallback(async (url: string | null) => {
        if (!url || !isLocalUploadUrl(url)) return;
        const token = getToken();
        if (!token) return;
        await fetch('/api/upload', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ url }),
        }).catch(() => {});
    }, []);

    const fetchAll = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/stores/my/all', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && json?.data) {
                setStores(json.data.stores ?? []);
                setRequests(json.data.requests ?? []);
            }
        } catch { /* ignore */ } finally {
            setDataLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && !user) { router.replace('/'); return; }
        if (!authLoading && user) fetchAll();
    }, [authLoading, user, router, fetchAll]);

    useSSERefetch(['stores', 'seller_requests'], fetchAll);

    const openEdit = (store: StoreData) => {
        setForm({
            name: store.name,
            description: store.description ? parseAddress(store.description).text : '',
            phone: store.phone ?? '',
            address: store.address ?? '',
        });
        setError('');
        setSuccess('');
        setFormErrors({});
        setFormImage(store.image_url ?? null);
        setTemporaryUploadUrl(null);
        setEditingStore(store);
    };

    const handleImageUpload = async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;

        const token = getToken();
        if (!token) {
            setError("Sessiya topilmadi. Qayta login qiling.");
            return;
        }

        setError('');
        setUploadingImage(true);
        try {
            if (!file.type.startsWith('image/')) {
                throw new Error('Faqat rasm yuklash mumkin.');
            }
            if (file.size > 4 * 1024 * 1024) {
                throw new Error('4MB dan kichik rasm tanlang.');
            }

            const fd = new FormData();
            fd.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.success) {
                throw new Error(json?.error ?? 'Rasm yuklashda xatolik');
            }

            const url = json.data?.url ?? json.url;
            if (!url) {
                throw new Error('Rasm URL topilmadi');
            }

            if (temporaryUploadUrl && temporaryUploadUrl !== url) {
                await deleteUploadedImage(temporaryUploadUrl);
            }
            setFormImage(url);
            setTemporaryUploadUrl(isLocalUploadUrl(url) ? url : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Rasm yuklashda xatolik');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStore) return;
        const errors: Record<string, boolean> = {};
        if (!form.name.trim()) errors.name = true;
        if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
        setFormErrors({});
        setError('');
        setSuccess('');
        setSaving(true);
        try {
            const res = await fetch(`/api/stores/${editingStore.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({
                    name: form.name.trim() || undefined,
                    description: form.description.trim() || undefined,
                    phone: form.phone.trim() || undefined,
                    address: form.address.trim() || undefined,
                    image_url: formImage,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error ?? 'Update failed');
            await Promise.all([fetchAll(), refreshStore()]);
            setEditingStore(null);
            setFormImage(null);
            setTemporaryUploadUrl(null);
            setSuccess("Ariza yuborildi. Ko'rib chiqilmoqda.");
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteStore) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/stores/${deleteStore.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) throw new Error('Delete failed');
            await Promise.all([fetchAll(), refreshStore()]);
            setDeleteStore(null);
        } catch {
            setDeleting(false);
        }
    };

    const handleDeleteRequest = async (reqId: string) => {
        setConfirmDialog({
            open: true,
            message: "Arizani o'chirishni tasdiqlaysizmi?",
            onConfirm: async () => {
                setConfirmDialog(d => ({ ...d, open: false }));
                try {
                    await fetch(`/api/stores/request?id=${reqId}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${getToken()}` },
                    });
                    await fetchAll();
                } catch { /* ignore */ }
            },
        });
    };

    if (authLoading || dataLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#00c853]" />
            </div>
        );
    }

    const pendingRequests = requests.filter((r) => r.status === 'pending');
    const rejectedRequests = requests.filter((r) => r.status === 'rejected');

    return (
        <section className="mx-auto w-full max-w-[900px] px-4 py-8 md:px-8 md:py-12 space-y-5">
            <ConfirmDialog
                open={confirmDialog.open}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(d => ({ ...d, open: false }))}
            />

            {/* Page title */}
            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a645]">{w.myStore.badge}</p>
                <h1 className="mt-1 font-[family-name:var(--font-playfair)] text-[clamp(1.8rem,4vw,2.8rem)] font-black leading-none text-[#111111] dark:text-white">
                    {w.myStore.title}
                </h1>
            </div>

            {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {success}
                </div>
            )}

            {/* Approved stores */}
            {stores.length > 0 && (
                <div className="space-y-4">
                    {stores.map((store) => {
                        const { text: descText, lat: descLat, lng: descLng } = store.description ? parseAddress(store.description) : { text: '', lat: null, lng: null };
                        const { text: addrText, lat: addrLat, lng: addrLng } = store.address ? parseAddress(store.address) : { text: '', lat: null, lng: null };
                        return (
                            <div key={store.id} className="rounded-[28px] border border-black/10 bg-white overflow-hidden shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-[#1a1a1a]">
                                {/* Store header */}
                                <div className="relative overflow-hidden bg-[linear-gradient(135deg,#f9fffb_0%,#eef8ff_45%,#f5f7ff_100%)] p-6 md:p-7 dark:bg-none dark:bg-[#222]">
                                    {store.image_url && (
                                        <>
                                            <img
                                                src={store.image_url}
                                                alt={store.name}
                                                className="absolute inset-0 h-full w-full object-contain"
                                            />
                                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(249,255,251,0.88)_0%,rgba(238,248,255,0.8)_45%,rgba(245,247,255,0.84)_100%)] dark:bg-black/45" />
                                        </>
                                    )}
                                    <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[#00c853]/15 blur-3xl" />
                                    <div className="relative flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#00c853]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#00a645]">
                                                <span className="h-1.5 w-1.5 rounded-full bg-[#00c853]" />
                                                {storeText.approved ?? 'Tasdiqlangan'}
                                            </span>
                                            <h2 className="mt-1.5 text-[clamp(1.4rem,3vw,2rem)] font-black leading-tight text-[#111111] dark:text-white">
                                                {store.name}
                                            </h2>
                                            <p className="mt-0.5 text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                                                {new Date(store.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => openEdit(store)}
                                                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 text-[12px] font-bold text-[#111111] transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:text-white"
                                            >
                                                <Edit3 size={13} /> {storeText.edit ?? 'Tahrirlash'}
                                            </button>
                                            <button
                                                onClick={() => setDeleteStore(store)}
                                                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 text-[12px] font-bold text-red-600 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                                            >
                                                <Trash2 size={13} /> {storeText.delete ?? "O'chirish"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Info grid */}
                                <div className="grid gap-px bg-black/5 dark:bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
                                    {store.phone && (
                                        <div className="bg-white p-4 dark:bg-[#1a1a1a]">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">{storeText.phone ?? 'Telefon'}</p>
                                            <p className="mt-1 flex items-center gap-1.5 text-[14px] font-semibold text-[#111111] dark:text-white">
                                                <Phone size={13} className="text-[#00a645]" />{store.phone}
                                            </p>
                                        </div>
                                    )}
                                    {store.address && (
                                        <div className="bg-white overflow-hidden dark:bg-[#1a1a1a]">
                                            {addrLat !== null && addrLng !== null && (
                                                <a href={`https://www.openstreetmap.org/?mlat=${addrLat}&mlon=${addrLng}&zoom=15`} target="_blank" rel="noopener noreferrer" className="block">
                                                    <div className="pointer-events-none">
                                                        <MapDisplay lat={addrLat} lng={addrLng} height={120} />
                                                    </div>
                                                </a>
                                            )}
                                            <div className="p-4">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">{storeText.address ?? 'Manzil'}</p>
                                                <p className="mt-1 flex items-start gap-1.5 text-[13px] text-[#374151] dark:text-[#d1d5db]">
                                                    <MapPin size={12} className="mt-0.5 shrink-0 text-[#00a645]" />
                                                    {addrText || store.address}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {store.description && descText && (
                                        <div className="bg-white overflow-hidden dark:bg-[#1a1a1a]">
                                            {descLat !== null && descLng !== null && (
                                                <a href={`https://www.openstreetmap.org/?mlat=${descLat}&mlon=${descLng}&zoom=15`} target="_blank" rel="noopener noreferrer" className="block">
                                                    <div className="pointer-events-none">
                                                        <MapDisplay lat={descLat} lng={descLng} height={120} />
                                                    </div>
                                                </a>
                                            )}
                                            <div className="p-4">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">{storeText.description ?? 'Tavsif'}</p>
                                                <p className="mt-1 text-[13px] leading-5 text-[#374151] dark:text-[#d1d5db] line-clamp-3">{descText}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pending requests */}
            {pendingRequests.length > 0 && (
                <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280] dark:text-[#9ca3af]">{w.myStore.pendingSection}</p>
                    {pendingRequests.map((req) => (
                        <div key={req.id} className="flex items-center gap-4 rounded-2xl border border-yellow-200/70 bg-yellow-50/60 px-5 py-4 dark:border-yellow-500/20 dark:bg-yellow-500/5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-500/15">
                                <Clock size={18} className="text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold text-[#111111] dark:text-white truncate">{req.store_name}</p>
                                <p className="text-[12px] font-semibold text-yellow-700 dark:text-yellow-400">
                                    {req.request_type === 'store_update' ? w.myStore.editRequest : w.myStore.newRequest}
                                </p>
                                <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                                    {new Date(req.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-[11px] font-bold text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">
                                ⏳ {w.myStore.pending}
                            </span>
                            <button onClick={() => handleDeleteRequest(req.id)} className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Rejected requests */}
            {rejectedRequests.length > 0 && (
                <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280] dark:text-[#9ca3af]">{w.myStore.rejectedSection}</p>
                    {rejectedRequests.map((req) => (
                        <div key={req.id} className="flex items-center gap-4 rounded-2xl border border-red-200/70 bg-red-50/60 px-5 py-4 dark:border-red-500/20 dark:bg-red-500/5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
                                <XCircle size={18} className="text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold text-[#111111] dark:text-white truncate">{req.store_name}</p>
                                <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">
                                    {req.request_type === 'store_update' ? w.myStore.editRequest : w.myStore.newRequest}
                                </p>
                                {req.admin_note && (
                                    <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af] truncate">{req.admin_note}</p>
                                )}
                            </div>
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-600 dark:bg-red-500/20 dark:text-red-400">
                                {w.myStore.rejected}
                            </span>
                            <button onClick={() => handleDeleteRequest(req.id)} className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {stores.length === 0 && pendingRequests.length === 0 && rejectedRequests.length === 0 && (
                <div className="rounded-[28px] border border-black/10 bg-white p-10 text-center dark:border-white/10 dark:bg-[#1a1a1a]">
                    <CheckCircle2 size={40} className="mx-auto text-[#d1d5db] dark:text-[#4b5563]" />
                    <p className="mt-3 text-[15px] font-semibold text-[#6b7280] dark:text-[#9ca3af]">{w.myStore.empty}</p>
                </div>
            )}

            {/* New store CTA */}
            <div className="rounded-[24px] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#1a1a1a]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-[18px] font-extrabold text-[#111111] dark:text-white">{w.myStore.addTitle}</h3>
                        <p className="mt-1 text-[13px] text-[#6b7280] dark:text-[#9ca3af]">{w.myStore.addDesc}</p>
                    </div>
                    <Link
                        href="/open-store"
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-[#13ec37] px-6 text-[12px] font-black uppercase tracking-[0.12em] text-[#06200f] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-14px_rgba(0,200,83,0.9)]"
                    >
                        {w.myStore.submit} <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            {/* Edit Modal */}
            {editingStore && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-[480px] rounded-[28px] border border-black/10 bg-white shadow-[0_30px_70px_-30px_rgba(0,0,0,0.45)] dark:border-white/10 dark:bg-[#1a1a1a] max-h-[90vh] overflow-y-auto">
                        <button onClick={() => { void deleteUploadedImage(temporaryUploadUrl); setTemporaryUploadUrl(null); setEditingStore(null); }} className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[#6b7280] hover:text-[#111111] dark:border-white/10 dark:text-[#9ca3af] dark:hover:text-white">
                            <X size={16} />
                        </button>
                        <div className="p-7">
                            <h2 className="text-[22px] font-black text-[#111111] dark:text-white">{storeText.editTitle ?? "Do'konni Tahrirlash"}</h2>
                            <p className="mt-0.5 text-[13px] text-[#6b7280] dark:text-[#9ca3af]">{editingStore.name}</p>
                            <p className="mt-2 rounded-xl bg-[#f3fdf6] px-3 py-2 text-[12px] font-semibold text-[#007d35] dark:bg-[#00c853]/10 dark:text-[#7bf0a7]">
                                {storeText.editHint ?? "Saqlash bosilganda o'zgarishlar to'g'ridan-to'g'ri chiqmaydi. Avval admin tasdiqlaydi."}
                            </p>
                            <form onSubmit={handleUpdate} className="mt-5 grid gap-3">
                                {formImage && (
                                    <div className="grid gap-1.5">
                                        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{w.openStore.storeImages}</span>
                                        <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#f8fafc] dark:border-white/10 dark:bg-[#111111]">
                                            <img
                                                src={formImage}
                                                alt={editingStore.name}
                                                className="h-40 w-full object-contain"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="grid gap-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{w.openStore.storeImages}</span>
                                    <div className="flex items-center gap-2">
                                        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-[#f8fafc] px-4 text-[12px] font-bold text-[#111111] transition-colors hover:bg-[#f1f5f9] dark:border-white/10 dark:bg-[#111111] dark:text-white dark:hover:bg-[#151515]">
                                            {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                            {uploadingImage ? 'Yuklanmoqda...' : formImage ? 'Rasmni almashtirish' : 'Rasm yuklash'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                disabled={saving || uploadingImage}
                                                onChange={(e) => handleImageUpload(e.target.files)}
                                            />
                                        </label>
                                        {formImage && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const tempUrl = temporaryUploadUrl;
                                                    setFormImage(null);
                                                    setTemporaryUploadUrl(null);
                                                    if (tempUrl) {
                                                        void deleteUploadedImage(tempUrl);
                                                    }
                                                }}
                                                className="inline-flex h-11 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-[12px] font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                                            >
                                                <Trash2 size={14} />
                                                Olib tashlash
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <label className="grid gap-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{w.openStore.ownerName}</span>
                                    <input
                                        value={editingStore.owner_name ?? user?.name ?? ''}
                                        readOnly
                                        className="h-11 rounded-xl border border-black/12 bg-[#f8fafc] px-3 text-[14px] text-[#111111] outline-none dark:border-white/10 dark:bg-[#111111] dark:text-white"
                                    />
                                </label>
                                <label className="grid gap-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">Do&apos;kon nomi</span>
                                    <input
                                        value={form.name}
                                        onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); if (formErrors.name) setFormErrors(p => ({ ...p, name: false })); }}
                                        className={`h-11 rounded-xl border px-3 text-[14px] outline-none transition-all focus:border-[#00c853] dark:bg-[#111111] dark:text-white ${formErrors.name ? 'border-red-500' : 'border-black/12 dark:border-white/10'}`}
                                        disabled={saving}
                                    />
                                    {formErrors.name && <p className="text-[12px] text-red-500">{storeText.nameRequired ?? "Do'kon nomi majburiy"}</p>}
                                </label>
                                <label className="grid gap-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{storeText.phone ?? 'Telefon'}</span>
                                    <input
                                        value={form.phone}
                                        onChange={(e) => setForm((p) => ({ ...p, phone: sanitizePhoneInput(e.target.value) }))}
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        pattern="[+0-9]*"
                                        className="h-11 rounded-xl border border-black/12 px-3 text-[14px] outline-none transition-all focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                                        disabled={saving}
                                    />
                                </label>
                                {/* Address with embedded map */}
                                <div className="grid gap-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{w.openStore.addressMap}</span>
                                    <MapPickerLeaflet
                                        embedded
                                        initialLat={parseAddress(form.address).lat ?? 41.2995}
                                        initialLng={parseAddress(form.address).lng ?? 69.2401}
                                        onChange={(v) => setForm((p) => ({ ...p, address: v }))}
                                        onConfirm={(v) => setForm((p) => ({ ...p, address: v }))}
                                        onClose={() => {}}
                                    />
                                </div>
                                <label className="grid gap-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">{storeText.description ?? 'Tavsif'}</span>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                        className="min-h-[80px] rounded-xl border border-black/12 px-3 py-2.5 text-[14px] outline-none transition-all focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                                        disabled={saving}
                                    />
                                </label>
                                {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { void deleteUploadedImage(temporaryUploadUrl); setTemporaryUploadUrl(null); setEditingStore(null); setFormImage(null); }} className="flex-1 h-11 rounded-full border border-black/10 text-[12px] font-bold text-[#111111] dark:border-white/10 dark:text-white">{storeText.cancel ?? 'Bekor'}</button>
                                    <button type="submit" disabled={saving} className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#13ec37] text-[12px] font-black uppercase tracking-[0.12em] text-[#06200f] disabled:opacity-60">
                                        {saving && <Loader2 size={13} className="animate-spin" />}
                                        {storeText.save ?? 'Saqlash'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteStore && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-[380px] rounded-[28px] border border-black/10 bg-white p-7 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.45)] dark:border-white/10 dark:bg-[#1a1a1a]">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10">
                            <Trash2 size={24} />
                        </div>
                        <h2 className="mt-4 text-[20px] font-black text-[#111111] dark:text-white">{storeText.deleteTitle ?? "Do'konni o'chirish"}</h2>
                        <p className="mt-1 text-[13px] font-semibold text-[#374151] dark:text-[#d1d5db]">{deleteStore.name}</p>
                        <p className="mt-2 text-[13px] text-[#6b7280] dark:text-[#9ca3af]">{storeText.deleteDesc ?? "Bu amalni qaytarib bo'lmaydi. Do'koningiz o'chiriladi."}</p>
                        <div className="mt-5 flex gap-2">
                            <button onClick={() => setDeleteStore(null)} className="flex-1 h-11 rounded-full border border-black/10 text-[12px] font-bold text-[#111111] dark:border-white/10 dark:text-white">{storeText.cancel ?? 'Bekor'}</button>
                            <button onClick={handleDelete} disabled={deleting} className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-red-500 text-[12px] font-black text-white disabled:opacity-60">
                                {deleting && <Loader2 size={13} className="animate-spin" />}
                                {storeText.delete ?? "O'chirish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
