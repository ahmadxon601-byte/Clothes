'use client';

import { useEffect, useState } from 'react';
import { Camera, Edit3, Loader2, Package, Plus, Trash2, X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useWebAuth } from '../../../src/context/WebAuthContext';
import { AuthModal } from '../../../src/shared/ui/AuthModal';
import { useSSERefetch } from '../../../src/shared/hooks/useSSERefetch';
import { ConfirmDialog } from '../../../src/shared/ui/ConfirmDialog';

interface Product {
  id: string;
  name: string;
  base_price: number;
  sku: string;
  is_active: boolean;
  views: number;
  created_at: string;
  category_name: string | null;
  category_id: string | null;
  store_id: string;
  store_name: string;
  thumbnail: string | null;
}

interface Store {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('marketplace_token') : null;

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

export default function MyProductsPage() {
  const { user, loading } = useWebAuth();
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({
    open: false,
    tab: 'login',
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetching, setFetching] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '',
    base_price: '',
    discount: '',
    current_price: '',
    size: '',
    stock: '1',
    description: '',
    category_id: '',
    store_id: '',
  });

  const calcCurrentPrice = (base: string, disc: string) => {
    const b = Number(base); const d = Number(disc);
    if (!b || isNaN(b) || isNaN(d)) return '';
    return String(Math.round(b * (1 - d / 100)));
  };
  const calcDiscount = (base: string, cur: string) => {
    const b = Number(base); const c = Number(cur);
    if (!b || !c || isNaN(b) || isNaN(c)) return '';
    return String(Math.round((1 - c / b) * 100));
  };
  const [formImages, setFormImages] = useState<string[]>([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [formError, setFormError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products/my', { headers: authHeader() });
      const json = await res.json();
      setProducts(json.data?.products ?? json.products ?? []);
    } catch {
      /* noop */
    } finally {
      setFetching(false);
    }
  };

  const loadStores = async () => {
    try {
      const res = await fetch('/api/stores/my/all', { headers: authHeader() });
      const json = await res.json();
      setStores(json.data?.stores ?? json.stores ?? []);
    } catch {
      /* noop */
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      setCategories(json.data?.categories ?? json.categories ?? []);
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    if (user) {
      loadProducts();
      loadStores();
      loadCategories();
    } else if (!loading) {
      setFetching(false);
    }
  }, [user, loading]);

  useSSERefetch(['products'], loadProducts);

  const openCreate = () => {
    setForm({ name: '', base_price: '', discount: '', current_price: '', size: '', stock: '1', description: '', category_id: '', store_id: stores[0]?.id ?? '' });
    setFormImages([]);
    setFormError('');
    setFormErrors({});
    setEditProduct(null);
    setCreateOpen(true);
  };

  const openEdit = async (p: Product) => {
    setForm({
      name: p.name,
      base_price: String(p.base_price),
      discount: '',
      current_price: String(p.base_price),
      size: '',
      stock: '1',
      description: '',
      category_id: p.category_id ?? '',
      store_id: p.store_id,
    });
    setFormImages(p.thumbnail ? [p.thumbnail] : []);
    setFormError('');
    setFormErrors({});
    setEditProduct(p);
    setCreateOpen(true);
    // Load variant data
    try {
      const res = await fetch(`/api/products/${p.id}`);
      const json = await res.json();
      const detail = json.data?.product ?? json.product;
      const imgs: { url: string; sort_order: number }[] = detail?.images ?? [];
      if (imgs.length > 0) setFormImages(imgs.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order).map((i: { url: string }) => i.url));
      const variants: { size?: string; price?: number; stock?: number }[] = detail?.variants ?? [];
      if (variants.length > 0) {
        const v = variants[0];
        setForm(prev => ({
          ...prev,
          size: v.size ?? '',
          stock: v.stock != null ? String(v.stock) : '1',
          current_price: v.price != null ? String(v.price) : prev.base_price,
          discount: v.price != null && v.price < p.base_price
            ? String(Math.round((1 - v.price / p.base_price) * 100))
            : '',
        }));
      }
    } catch { /* noop */ }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImg(true);
    const token = getToken();
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const json = await res.json();
        const url = json.data?.url ?? json.url;
        if (url) urls.push(url);
      }
    }
    setFormImages((prev) => [...prev, ...urls]);
    setUploadingImg(false);
  };

  const handleSave = async () => {
    setFormError('');
    const errors: Record<string, boolean> = {};
    if (!form.name.trim()) errors.name = true;
    if (!form.base_price || isNaN(Number(form.base_price)) || Number(form.base_price) <= 0) errors.price = true;
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setSaving(true);
    const finalPrice = form.current_price ? Number(form.current_price) : Number(form.base_price);
    const variantPayload = { variants: [{ size: form.size || undefined, price: finalPrice, stock: Number(form.stock) || 1 }] };
    try {
      let res: Response;
      const imagePayload = formImages.length > 0
        ? { images: formImages.map((url, i) => ({ url, sort_order: i })) }
        : {};
      if (editProduct) {
        res = await fetch(`/api/products/${editProduct.id}`, {
          method: 'PUT',
          headers: authHeader(),
          body: JSON.stringify({
            name: form.name.trim(),
            base_price: Number(form.base_price),
            ...(form.description.trim() && { description: form.description.trim() }),
            category_id: form.category_id || null,
            ...imagePayload,
            ...variantPayload,
          }),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({
            name: form.name.trim(),
            base_price: Number(form.base_price),
            ...(form.description.trim() && { description: form.description.trim() }),
            ...(form.category_id && { category_id: form.category_id }),
            ...(form.store_id && { store_id: form.store_id }),
            ...imagePayload,
            ...variantPayload,
          }),
        });
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? 'Xatolik yuz berdi');
      }
      setCreateOpen(false);
      setEditProduct(null);
      loadProducts();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE', headers: authHeader() });
      setDeleteProduct(null);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      /* noop */
    }
  };

  const toggleActive = async (p: Product) => {
    try {
      await fetch(`/api/products/${p.id}`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
    } catch {
      /* noop */
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#00c853]" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthModal open={authModal.open} onClose={() => setAuthModal({ open: false, tab: 'login' })} defaultTab={authModal.tab} />
        <section className="mx-auto w-full max-w-[1280px] px-4 py-20 text-center">
          <Package size={48} className="mx-auto text-[#9ca3af]" />
          <h1 className="mt-4 text-[24px] font-black text-[#111111] dark:text-white">Kirish kerak</h1>
          <p className="mt-2 text-[14px] text-[#6b7280]">Mahsulotlaringizni boshqarish uchun kiring.</p>
          <button
            onClick={() => setAuthModal({ open: true, tab: 'login' })}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#00c853] px-7 text-[13px] font-bold text-[#06200f]"
          >
            Kirish
          </button>
        </section>
      </>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-8 md:py-12">
      {/* ConfirmDialog placeholder — delete uses its own modal in this page */}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-black text-[#111111] dark:text-white">Mening Mahsulotlarim</h1>
          <p className="mt-1 text-[14px] text-[#6b7280]">{products.length} ta mahsulot</p>
        </div>
        {stores.length > 0 && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-[#00c853] px-5 py-2.5 text-[13px] font-bold text-[#06200f] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(0,200,83,0.5)]"
          >
            <Plus size={15} /> Yangi mahsulot
          </button>
        )}
      </div>

      {stores.length === 0 ? (
        <div className="rounded-3xl border border-black/10 bg-white p-10 text-center dark:border-white/10 dark:bg-[#1a1a1a]">
          <Package size={40} className="mx-auto text-[#9ca3af]" />
          <p className="mt-3 text-[15px] font-semibold text-[#111111] dark:text-white">Do'koningiz yo'q</p>
          <p className="mt-1 text-[13px] text-[#6b7280]">Mahsulot qo'shish uchun avval do'kon oching.</p>
          <Link href="/open-store" className="mt-5 inline-flex h-10 items-center rounded-full bg-[#00c853] px-6 text-[12px] font-bold text-[#06200f]">
            Do'kon Ochish
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-black/10 bg-white p-10 text-center dark:border-white/10 dark:bg-[#1a1a1a]">
          <Package size={40} className="mx-auto text-[#9ca3af]" />
          <p className="mt-3 text-[15px] font-semibold text-[#111111] dark:text-white">Mahsulotlar yo'q</p>
          <p className="mt-1 text-[13px] text-[#6b7280]">Hali hech qanday mahsulot qo'shilmagan.</p>
          <button onClick={openCreate} className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#00c853] px-6 text-[12px] font-bold text-[#06200f]">
            <Plus size={13} /> Qo'shish
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-[22px] border border-black/10 bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.2)] dark:border-white/10 dark:bg-[#1a1a1a]"
            >
              {/* Thumbnail */}
              <Link href={`/product/${p.id}`} className="block">
                <div className="relative h-[180px] w-full bg-[#f3f4f6] dark:bg-[#111111]">
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package size={36} className="text-[#d1d5db]" />
                    </div>
                  )}
                  {!p.is_active && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold text-white">Nofaol</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 pb-2">
                  <p className="line-clamp-1 text-[14px] font-bold text-[#111111] dark:text-white">{p.name}</p>
                  <p className="mt-0.5 text-[12px] text-[#6b7280]">{p.store_name}</p>
                  {p.category_name && (
                    <p className="mt-0.5 text-[11px] text-[#9ca3af]">{p.category_name}</p>
                  )}
                  <p className="mt-2 text-[16px] font-black text-[#00c853]">
                    {Number(p.base_price).toLocaleString()} so&apos;m
                  </p>
                </div>
              </Link>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-black/8 px-4 py-2.5 dark:border-white/8">
                <span className="text-[11px] text-[#9ca3af]">{p.views} ko'rishlar</span>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/product/${p.id}`}
                    title="Ko'rish"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-[#6b7280] transition-colors hover:text-[#00c853] dark:border-white/10"
                  >
                    <ExternalLink size={13} />
                  </Link>
                  <button
                    title={p.is_active ? 'Yashirish' : "Ko'rsatish"}
                    onClick={() => toggleActive(p)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-[#6b7280] transition-colors hover:text-amber-500 dark:border-white/10"
                  >
                    {p.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    title="Tahrirlash"
                    onClick={() => openEdit(p)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-[#6b7280] transition-colors hover:text-blue-500 dark:border-white/10"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    title="O'chirish"
                    onClick={() => setDeleteProduct(p)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-[#6b7280] transition-colors hover:text-rose-500 dark:border-white/10"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {createOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm overflow-y-auto rounded-[28px] border border-black/10 bg-white shadow-[0_30px_70px_-30px_rgba(0,0,0,0.45)] dark:border-white/10 dark:bg-[#1a1a1a]">
            <button
              onClick={() => { setCreateOpen(false); setEditProduct(null); setFormImages([]); }}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[#6b7280] hover:text-[#111111] dark:border-white/10 dark:hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="p-6">
              <h2 className="text-[20px] font-black text-[#111111] dark:text-white">
                {editProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
              </h2>
              <div className="mt-4 space-y-3">
                {/* Store selector (only on create) */}
                {!editProduct && stores.length > 1 && (
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">Do'kon</span>
                    <select
                      value={form.store_id}
                      onChange={(e) => setForm((p) => ({ ...p, store_id: e.target.value }))}
                      className="w-full rounded-xl border border-black/12 px-3 py-2.5 text-[14px] outline-none focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">Nomi</span>
                  <input
                    value={form.name}
                    onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); if (formErrors.name) setFormErrors(p => ({ ...p, name: false })); }}
                    className={`w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none focus:border-[#00c853] dark:bg-[#111111] dark:text-white ${formErrors.name ? 'border-red-500' : 'border-black/12 dark:border-white/10'}`}
                    placeholder="Masalan: Erkaklar ko'ylagi"
                  />
                  {formErrors.name && <p className="mt-1 text-[12px] text-red-500">Mahsulot nomi majburiy</p>}
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">O'lcham</span>
                  <input
                    value={form.size}
                    onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}
                    className="w-full rounded-xl border border-black/12 px-3 py-2.5 text-[14px] outline-none focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                    placeholder="S, M, L, XL ..."
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">Asl narx (so&apos;m) *</span>
                  <input
                    type="number"
                    min="0"
                    value={form.base_price}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (formErrors.price) setFormErrors(p => ({ ...p, price: false }));
                      setForm((p) => ({ ...p, base_price: v, current_price: calcCurrentPrice(v, p.discount) }));
                    }}
                    className={`w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none focus:border-[#00c853] dark:bg-[#111111] dark:text-white ${formErrors.price ? 'border-red-500' : 'border-black/12 dark:border-white/10'}`}
                    placeholder="50000"
                  />
                  {formErrors.price && <p className="mt-1 text-[12px] text-red-500">To&apos;g&apos;ri narx kiriting</p>}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">Aksiya %</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discount}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((p) => ({ ...p, discount: v, current_price: calcCurrentPrice(p.base_price, v) }));
                      }}
                      className="w-full rounded-xl border border-black/12 px-3 py-2.5 text-[14px] outline-none focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                      placeholder="0"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">Hozir narxi</span>
                    <input
                      type="number"
                      min="0"
                      value={form.current_price}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((p) => ({ ...p, current_price: v, discount: calcDiscount(p.base_price, v) }));
                      }}
                      className="w-full rounded-xl border border-black/12 px-3 py-2.5 text-[14px] outline-none focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                      placeholder="50000"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">Soni (dona)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                    className="w-full rounded-xl border border-black/12 px-3 py-2.5 text-[14px] outline-none focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                    placeholder="1"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">Kategoriya</span>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                    className="w-full rounded-xl border border-black/12 px-3 py-2.5 text-[14px] outline-none focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                  >
                    <option value="">— Kategoriya tanlanmagan —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">Tavsif (ixtiyoriy)</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-black/12 px-3 py-2.5 text-[14px] outline-none focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                    placeholder="Mahsulot haqida qisqacha..."
                  />
                </label>
                {/* Image upload */}
                <div>
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">Rasmlar (ixtiyoriy)</span>
                  <div className="flex flex-wrap gap-2">
                    {formImages.map((url, i) => (
                      <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-black/15 bg-[#f9fafb] text-[#9ca3af] transition-colors hover:border-[#00c853] hover:text-[#00c853] dark:border-white/15 dark:bg-[#111111]">
                      {uploadingImg ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Camera size={18} />
                          <span className="text-[9px] font-bold">Rasm</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        disabled={uploadingImg}
                        onChange={(e) => handleImageUpload(e.target.files)}
                      />
                    </label>
                  </div>
                </div>
              </div>
              {formError && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">{formError}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => { setCreateOpen(false); setEditProduct(null); setFormImages([]); }}
                  className="flex-1 h-11 rounded-full border border-black/10 text-[13px] font-bold text-[#111111] dark:border-white/10 dark:text-white"
                >
                  Bekor
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#00c853] text-[13px] font-black text-[#06200f] disabled:opacity-60"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteProduct && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#1a1a1a]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <Trash2 size={22} />
            </div>
            <h2 className="text-[18px] font-black text-[#111111] dark:text-white">Mahsulotni o'chirish</h2>
            <p className="mt-1 text-[13px] text-[#6b7280]">
              <span className="font-bold text-[#111111] dark:text-white">{deleteProduct.name}</span> o'chirilsinmi?
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setDeleteProduct(null)} className="flex-1 h-11 rounded-full border border-black/10 text-[13px] font-bold dark:border-white/10 dark:text-white">
                Bekor
              </button>
              <button
                onClick={() => handleDelete(deleteProduct.id)}
                className="flex-1 h-11 rounded-full bg-rose-500 text-[13px] font-black text-white"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
