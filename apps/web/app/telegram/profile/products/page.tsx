'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Plus, Trash2, Edit3, Eye, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { getApiToken, setApiToken, telegramWebAppAuth } from '../../../../src/lib/apiClient';
import { useTelegram } from '../../../../src/telegram/useTelegram';
import { formatPrice } from '../../../../src/shared/lib/formatPrice';
import { TELEGRAM_ROUTES } from '../../../../src/shared/config/constants';
import { useSSERefetch } from '../../../../src/shared/hooks/useSSERefetch';
import { ConfirmDialog } from '../../../../src/shared/ui/ConfirmDialog';

interface MyProduct {
    id: string;
    name: string;
    base_price: number;
    description: string | null;
    category_id: string | null;
    category_name: string | null;
    store_name: string;
    store_id: string;
    thumbnail: string | null;
    is_active: boolean;
}

interface MyStore {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

type View = 'list' | 'create' | 'edit';

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

const inputCls = "w-full h-12 rounded-[14px] border bg-[var(--color-surface)] px-4 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] outline-none focus:border-[var(--color-primary)]";
const selectCls = `${inputCls} appearance-none cursor-pointer`;

export default function ProfileProductsPage() {
    const { WebApp, isReady } = useTelegram();
    const [products, setProducts] = useState<MyProduct[]>([]);
    const [stores, setStores] = useState<MyStore[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('list');
    const [editProduct, setEditProduct] = useState<MyProduct | null>(null);

    // Create form
    const [name, setName] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');
    const [discount, setDiscount] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');
    const [size, setSize] = useState('');
    const [stock, setStock] = useState('1');
    const [desc, setDesc] = useState('');
    const [storeId, setStoreId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Field-level validation errors
    const [createErrors, setCreateErrors] = useState<Record<string, boolean>>({});
    const [editErrors, setEditErrors] = useState<Record<string, boolean>>({});

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; onConfirm: () => void }>({
        open: false,
        message: '',
        onConfirm: () => {},
    });

    // Edit form
    const [editName, setEditName] = useState('');
    const [editOriginalPrice, setEditOriginalPrice] = useState('');
    const [editDiscount, setEditDiscount] = useState('');
    const [editCurrentPrice, setEditCurrentPrice] = useState('');
    const [editSize, setEditSize] = useState('');
    const [editStock, setEditStock] = useState('1');
    const [editDesc, setEditDesc] = useState('');
    const [editCategoryId, setEditCategoryId] = useState('');
    const [editImages, setEditImages] = useState<{ file?: File; preview: string; url?: string }[]>([]);

    const fileRef = useRef<HTMLInputElement>(null);
    const editFileRef = useRef<HTMLInputElement>(null);

    const fetchAll = async () => {
        const token = getApiToken();
        if (!token) { setLoading(false); return; }
        try {
            const [productsRes, storesRes, catsRes] = await Promise.all([
                fetch('/api/products/my', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/stores/my/all', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/categories'),
            ]);
            const [pJson, sJson, cJson] = await Promise.all([productsRes.json(), storesRes.json(), catsRes.json()]);
            setProducts(pJson.data?.products ?? pJson.products ?? []);
            const myStores: MyStore[] = sJson.data?.stores ?? sJson.stores ?? [];
            setStores(myStores);
            setCategories(cJson.data?.categories ?? cJson.categories ?? []);
            if (myStores.length > 0 && !storeId) setStoreId(myStores[0].id);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isReady) return;
        const initData = WebApp?.initData;
        if (initData) {
            telegramWebAppAuth(initData)
                .then(t => { setApiToken(t); })
                .catch(() => {})
                .finally(() => fetchAll());
        } else {
            fetchAll();
        }
    }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

    useSSERefetch(['products'], fetchAll);

    // Price auto-calculation helpers
    const calcCurrentPrice = (op: string, disc: string) => {
        const o = Number(op); const d = Number(disc);
        if (!o || isNaN(o) || isNaN(d)) return '';
        return String(Math.round(o * (1 - d / 100)));
    };
    const calcDiscount = (op: string, cp: string) => {
        const o = Number(op); const c = Number(cp);
        if (!o || !c || isNaN(o) || isNaN(c)) return '';
        return String(Math.round((1 - c / o) * 100));
    };

    const handleCreate = async () => {
        const errors: Record<string, boolean> = {};
        if (!name.trim()) errors.name = true;
        if (!originalPrice || isNaN(Number(originalPrice)) || Number(originalPrice) <= 0) errors.originalPrice = true;
        if (!storeId) errors.store = true;
        if (Object.keys(errors).length > 0) { setCreateErrors(errors); return; }
        setCreateErrors({});

        const finalPrice = currentPrice ? Number(currentPrice) : Number(originalPrice);

        setSubmitting(true); setError('');
        try {
            const uploadedImages = await Promise.all(
                images.map(async (img, i) => ({ url: await uploadImage(img.file), sort_order: i }))
            );
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    name: name.trim(), base_price: Number(originalPrice),
                    description: desc || undefined, store_id: storeId,
                    category_id: categoryId || undefined, images: uploadedImages,
                    variants: [{ size: size || undefined, price: finalPrice, stock: Number(stock) || 1 }],
                }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? 'Xatolik'); return; }
            setName(''); setOriginalPrice(''); setDiscount(''); setCurrentPrice('');
            setSize(''); setStock('1'); setDesc(''); setCategoryId(''); setImages([]);
            await fetchAll();
            setView('list');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Xatolik');
        } finally { setSubmitting(false); }
    };

    const handleEditOpen = async (product: MyProduct) => {
        setEditProduct(product);
        setEditName(product.name);
        setEditOriginalPrice(String(product.base_price));
        setEditDiscount('');
        setEditCurrentPrice(String(product.base_price));
        setEditSize('');
        setEditStock('1');
        setEditDesc(product.description ?? '');
        setEditCategoryId(product.category_id ?? '');
        setEditErrors({});
        // Load existing images and variant data
        try {
            const res = await fetch(`/api/products/${product.id}`);
            const json = await res.json();
            const p = json.data?.product ?? json.product;
            const imgs: { url: string; sort_order: number }[] = p?.images ?? [];
            setEditImages(imgs.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order).map((i: { url: string }) => ({ preview: i.url, url: i.url })));
            const variants: { size?: string; price?: number; stock?: number }[] = p?.variants ?? [];
            if (variants.length > 0) {
                const v = variants[0];
                if (v.size) setEditSize(v.size);
                if (v.stock != null) setEditStock(String(v.stock));
                if (v.price != null) {
                    setEditCurrentPrice(String(v.price));
                    if (product.base_price && v.price !== product.base_price) {
                        setEditDiscount(String(Math.round((1 - v.price / product.base_price) * 100)));
                    }
                }
            }
        } catch {
            setEditImages(product.thumbnail ? [{ preview: product.thumbnail, url: product.thumbnail }] : []);
        }
        setError('');
        setView('edit');
    };

    const handleUpdate = async () => {
        if (!editProduct) return;
        const errors: Record<string, boolean> = {};
        if (!editName.trim()) errors.name = true;
        if (!editOriginalPrice || isNaN(Number(editOriginalPrice)) || Number(editOriginalPrice) <= 0) errors.originalPrice = true;
        if (Object.keys(errors).length > 0) { setEditErrors(errors); return; }
        setEditErrors({});

        const finalPrice = editCurrentPrice ? Number(editCurrentPrice) : Number(editOriginalPrice);

        setSubmitting(true); setError('');
        try {
            const finalImages = await Promise.all(
                editImages.map(async (img, i) => {
                    if (img.file) {
                        const url = await uploadImage(img.file);
                        return { url, sort_order: i };
                    }
                    return { url: img.url!, sort_order: i };
                })
            );
            const res = await fetch(`/api/products/${editProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    name: editName.trim(), base_price: Number(editOriginalPrice),
                    description: editDesc || undefined,
                    category_id: editCategoryId || null,
                    images: finalImages,
                    variants: [{ size: editSize || undefined, price: finalPrice, stock: Number(editStock) || 1 }],
                }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? 'Xatolik'); return; }
            await fetchAll();
            setView('list');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Xatolik');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (productId: string) => {
        setConfirmDialog({
            open: true,
            message: "Mahsulotni o'chirishni tasdiqlaysizmi?",
            onConfirm: async () => {
                setConfirmDialog(d => ({ ...d, open: false }));
                try {
                    await fetch(`/api/products/${productId}`, { method: 'DELETE', headers: authHeaders() });
                    await fetchAll();
                } catch { /* ignore */ }
            },
        });
    };

    const addImageToList = (file: File, target: 'create' | 'edit') => {
        const preview = URL.createObjectURL(file);
        if (target === 'create') setImages(prev => [...prev, { file, preview }]);
        else setEditImages(prev => [...prev, { file, preview }]);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
        </div>
    );

    // ── Image strip component (reused in create/edit) ──
    const ImageStrip = ({ imgs, onRemove, onAdd, fileInputRef }: {
        imgs: { preview: string }[];
        onRemove: (i: number) => void;
        onAdd: (f: File) => void;
        fileInputRef: React.RefObject<HTMLInputElement | null>;
    }) => (
        <div className="space-y-2">
            {imgs.length > 0 && (
                // First image: full-width, screen-width-fitted
                <div className="relative w-full aspect-[3/4] rounded-[20px] overflow-hidden bg-[var(--color-surface2)] border border-[var(--color-border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgs[0].preview} alt="" className="w-full h-full object-contain bg-[var(--color-surface2)]" />
                    <button onClick={() => onRemove(0)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                        <X size={13} className="text-white" />
                    </button>
                </div>
            )}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {imgs.slice(1).map((img, idx) => (
                    <div key={idx + 1} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface2)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => onRemove(idx + 1)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                            <X size={10} className="text-white" />
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 shrink-0 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center gap-1"
                >
                    <ImageIcon size={18} className="text-[var(--color-hint)]" />
                    <span className="text-[10px] text-[var(--color-hint)]">Rasm</span>
                </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => {
                Array.from(e.target.files ?? []).forEach(f => onAdd(f));
                e.target.value = '';
            }} />
        </div>
    );

    // ── Create form ──
    if (view === 'create') {
        return (
            <>
                <ConfirmDialog
                    open={confirmDialog.open}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(d => ({ ...d, open: false }))}
                />
                <div className="px-4 pb-8">
                    <button onClick={() => { setView('list'); setError(''); setCreateErrors({}); }} className="flex items-center gap-2 mb-5 text-[var(--color-hint)] text-[14px] font-medium">
                        <ArrowLeft size={18} /> Orqaga
                    </button>
                    <h2 className="text-[20px] font-bold text-[var(--color-text)] mb-5">Yangi mahsulot</h2>
                    <div className="space-y-3">
                        <ImageStrip
                            imgs={images}
                            onRemove={i => setImages(prev => prev.filter((_, idx) => idx !== i))}
                            onAdd={f => addImageToList(f, 'create')}
                            fileInputRef={fileRef}
                        />
                        <div>
                            <input
                                value={name}
                                onChange={e => { setName(e.target.value); if (createErrors.name) setCreateErrors(p => ({ ...p, name: false })); }}
                                placeholder="Mahsulot nomi *"
                                className={`${inputCls} ${createErrors.name ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                            />
                            {createErrors.name && <p className="mt-1 text-[12px] text-red-500">Mahsulot nomi majburiy</p>}
                        </div>
                        <input
                            value={size}
                            onChange={e => setSize(e.target.value)}
                            placeholder="O'lcham (S, M, L, XL ...)"
                            className={`${inputCls} border-[var(--color-border)]`}
                        />
                        <div>
                            <input
                                value={originalPrice}
                                onChange={e => {
                                    const v = e.target.value;
                                    setOriginalPrice(v);
                                    if (createErrors.originalPrice) setCreateErrors(p => ({ ...p, originalPrice: false }));
                                    setCurrentPrice(calcCurrentPrice(v, discount));
                                }}
                                placeholder="Asl narx (UZS) *"
                                type="number"
                                inputMode="numeric"
                                className={`${inputCls} ${createErrors.originalPrice ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                            />
                            {createErrors.originalPrice && <p className="mt-1 text-[12px] text-red-500">To&apos;g&apos;ri narx kiriting</p>}
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input
                                    value={discount}
                                    onChange={e => {
                                        const v = e.target.value;
                                        setDiscount(v);
                                        setCurrentPrice(calcCurrentPrice(originalPrice, v));
                                    }}
                                    placeholder="Aksiya %"
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    max="100"
                                    className={`${inputCls} border-[var(--color-border)]`}
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    value={currentPrice}
                                    onChange={e => {
                                        const v = e.target.value;
                                        setCurrentPrice(v);
                                        setDiscount(calcDiscount(originalPrice, v));
                                    }}
                                    placeholder="Hozir narxi (UZS)"
                                    type="number"
                                    inputMode="numeric"
                                    className={`${inputCls} border-[var(--color-border)]`}
                                />
                            </div>
                        </div>
                        <input
                            value={stock}
                            onChange={e => setStock(e.target.value)}
                            placeholder="Soni (dona)"
                            type="number"
                            inputMode="numeric"
                            min="0"
                            className={`${inputCls} border-[var(--color-border)]`}
                        />
                        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Tavsif" rows={3} className="w-full rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] outline-none focus:border-[var(--color-primary)] resize-none" />
                        <div>
                            <select
                                value={storeId}
                                onChange={e => { setStoreId(e.target.value); if (createErrors.store) setCreateErrors(p => ({ ...p, store: false })); }}
                                className={`${selectCls} ${createErrors.store ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                            >
                                {stores.length === 0 ? <option value="">Do&apos;kon yo&apos;q</option> : stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {createErrors.store && <p className="mt-1 text-[12px] text-red-500">Do&apos;kon tanlang</p>}
                        </div>
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={`${selectCls} border-[var(--color-border)]`}>
                            <option value="">Kategoriya</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {stores.length === 0 && (
                            <div className="p-3 rounded-[14px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                                <p className="text-[13px] text-amber-600 dark:text-amber-400">
                                    Avval do&apos;kon oching.{' '}
                                    <Link href="/telegram/profile/stores" className="underline font-bold">Do&apos;kon ochish</Link>
                                </p>
                            </div>
                        )}
                        {error && <p className="text-red-500 text-[13px]">{error}</p>}
                        <button onClick={handleCreate} disabled={submitting || stores.length === 0} className="w-full h-12 rounded-full bg-[var(--color-primary)] text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                            Mahsulot qo&apos;shish
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ── Edit form ──
    if (view === 'edit' && editProduct) {
        return (
            <>
                <ConfirmDialog
                    open={confirmDialog.open}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(d => ({ ...d, open: false }))}
                />
                <div className="px-4 pb-8">
                    <button onClick={() => { setView('list'); setError(''); setEditErrors({}); }} className="flex items-center gap-2 mb-5 text-[var(--color-hint)] text-[14px] font-medium">
                        <ArrowLeft size={18} /> Orqaga
                    </button>
                    <h2 className="text-[20px] font-bold text-[var(--color-text)] mb-5">Mahsulotni tahrirlash</h2>
                    <div className="space-y-3">
                        <ImageStrip
                            imgs={editImages}
                            onRemove={i => setEditImages(prev => prev.filter((_, idx) => idx !== i))}
                            onAdd={f => addImageToList(f, 'edit')}
                            fileInputRef={editFileRef}
                        />
                        <div>
                            <input
                                value={editName}
                                onChange={e => { setEditName(e.target.value); if (editErrors.name) setEditErrors(p => ({ ...p, name: false })); }}
                                placeholder="Mahsulot nomi *"
                                className={`${inputCls} ${editErrors.name ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                            />
                            {editErrors.name && <p className="mt-1 text-[12px] text-red-500">Mahsulot nomi majburiy</p>}
                        </div>
                        <input
                            value={editSize}
                            onChange={e => setEditSize(e.target.value)}
                            placeholder="O'lcham (S, M, L, XL ...)"
                            className={`${inputCls} border-[var(--color-border)]`}
                        />
                        <div>
                            <input
                                value={editOriginalPrice}
                                onChange={e => {
                                    const v = e.target.value;
                                    setEditOriginalPrice(v);
                                    if (editErrors.originalPrice) setEditErrors(p => ({ ...p, originalPrice: false }));
                                    setEditCurrentPrice(calcCurrentPrice(v, editDiscount));
                                }}
                                placeholder="Asl narx (UZS) *"
                                type="number"
                                inputMode="numeric"
                                className={`${inputCls} ${editErrors.originalPrice ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                            />
                            {editErrors.originalPrice && <p className="mt-1 text-[12px] text-red-500">To&apos;g&apos;ri narx kiriting</p>}
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input
                                    value={editDiscount}
                                    onChange={e => {
                                        const v = e.target.value;
                                        setEditDiscount(v);
                                        setEditCurrentPrice(calcCurrentPrice(editOriginalPrice, v));
                                    }}
                                    placeholder="Aksiya %"
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    max="100"
                                    className={`${inputCls} border-[var(--color-border)]`}
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    value={editCurrentPrice}
                                    onChange={e => {
                                        const v = e.target.value;
                                        setEditCurrentPrice(v);
                                        setEditDiscount(calcDiscount(editOriginalPrice, v));
                                    }}
                                    placeholder="Hozir narxi (UZS)"
                                    type="number"
                                    inputMode="numeric"
                                    className={`${inputCls} border-[var(--color-border)]`}
                                />
                            </div>
                        </div>
                        <input
                            value={editStock}
                            onChange={e => setEditStock(e.target.value)}
                            placeholder="Soni (dona)"
                            type="number"
                            inputMode="numeric"
                            min="0"
                            className={`${inputCls} border-[var(--color-border)]`}
                        />
                        <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Tavsif" rows={3} className="w-full rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-hint)] outline-none focus:border-[var(--color-primary)] resize-none" />
                        <select value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)} className={`${selectCls} border-[var(--color-border)]`}>
                            <option value="">Kategoriya</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {error && <p className="text-red-500 text-[13px]">{error}</p>}
                        <button onClick={handleUpdate} disabled={submitting} className="w-full h-12 rounded-full bg-[var(--color-primary)] text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                            Saqlash
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ── List view ──
    return (
        <>
            <ConfirmDialog
                open={confirmDialog.open}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(d => ({ ...d, open: false }))}
            />
            <div className="px-4 pb-8">
                <div className="flex items-center justify-between mb-5">
                    <Link href="/telegram/profile" className="flex items-center gap-2 text-[var(--color-hint)] text-[14px] font-medium">
                        <ArrowLeft size={18} /> Profil
                    </Link>
                    <h2 className="text-[17px] font-bold text-[var(--color-text)]">Mening mahsulotlarim</h2>
                    <div className="w-16" />
                </div>

                {products.length > 0 ? (
                    <div className="space-y-3 mb-5">
                        {products.map(product => (
                            <div key={product.id} className="bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-border)] p-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--color-surface2)] shrink-0">
                                        {product.thumbnail ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package size={22} className="text-[var(--color-hint)]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-bold text-[var(--color-text)] truncate">{product.name}</p>
                                        <p className="text-[12px] font-semibold text-[var(--color-primary)]">{formatPrice(product.base_price, 'UZS')}</p>
                                        <p className="text-[11px] text-[var(--color-hint)] truncate">{product.store_name}{product.category_name ? ` · ${product.category_name}` : ''}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Link
                                        href={TELEGRAM_ROUTES.PRODUCT(product.id)}
                                        className="flex-1 h-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center gap-1.5 text-[12px] font-bold active:scale-95 transition-all"
                                    >
                                        <Eye size={14} /> Ko&apos;rish
                                    </Link>
                                    <button
                                        onClick={() => handleEditOpen(product)}
                                        className="flex-1 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center gap-1.5 text-[12px] font-bold active:scale-95 transition-all"
                                    >
                                        <Edit3 size={14} /> Tahrir
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="flex-1 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center gap-1.5 text-[12px] font-bold active:scale-95 transition-all"
                                    >
                                        <Trash2 size={14} /> O&apos;chirish
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-12 text-center mb-5">
                        <div className="w-14 h-14 rounded-full bg-[var(--color-surface2)] border border-[var(--color-border)] flex items-center justify-center mb-3">
                            <Package size={24} className="text-[var(--color-hint)]" />
                        </div>
                        <p className="text-[16px] font-bold text-[var(--color-text)]">Mahsulot yo&apos;q</p>
                        <p className="text-[13px] text-[var(--color-hint)] mt-1">Yangi mahsulot qo&apos;shing</p>
                    </div>
                )}

                <button
                    onClick={() => { setView('create'); setError(''); setCreateErrors({}); }}
                    className="w-full h-12 rounded-full bg-[var(--color-primary)] text-white font-bold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_4px_14px_rgba(26,229,80,0.25)]"
                >
                    <Plus size={18} />
                    Mahsulot qo&apos;shish
                </button>
            </div>
        </>
    );
}
