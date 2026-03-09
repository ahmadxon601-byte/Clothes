'use client';

import { useEffect, useState } from 'react';
import { Edit3, Loader2, Package, Plus, Trash2, X, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useWebAuth } from '../../../src/context/WebAuthContext';
import { AuthModal } from '../../../src/shared/ui/AuthModal';

interface Product {
  id: string;
  name: string;
  base_price: number;
  sku: string;
  is_active: boolean;
  views: number;
  created_at: string;
  category_name: string | null;
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
    description: '',
    category_id: '',
    store_id: '',
  });
  const [formError, setFormError] = useState('');
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

  const openCreate = () => {
    setForm({ name: '', base_price: '', description: '', category_id: '', store_id: stores[0]?.id ?? '' });
    setFormError('');
    setEditProduct(null);
    setCreateOpen(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      base_price: String(p.base_price),
      description: '',
      category_id: '',
      store_id: p.store_id,
    });
    setFormError('');
    setEditProduct(p);
    setCreateOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name.trim()) { setFormError("Nomi kiritilmadi"); return; }
    if (!form.base_price || isNaN(Number(form.base_price))) { setFormError("Narx noto'g'ri"); return; }
    setSaving(true);
    try {
      let res: Response;
      if (editProduct) {
        res = await fetch(`/api/products/${editProduct.id}`, {
          method: 'PUT',
          headers: authHeader(),
          body: JSON.stringify({
            name: form.name.trim(),
            base_price: Number(form.base_price),
            ...(form.description.trim() && { description: form.description.trim() }),
            ...(form.category_id && { category_id: form.category_id }),
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
              <div className="p-4">
                <p className="line-clamp-1 text-[14px] font-bold text-[#111111] dark:text-white">{p.name}</p>
                <p className="mt-0.5 text-[12px] text-[#6b7280]">{p.store_name}</p>
                {p.category_name && (
                  <p className="mt-0.5 text-[11px] text-[#9ca3af]">{p.category_name}</p>
                )}
                <p className="mt-2 text-[16px] font-black text-[#00c853]">
                  {Number(p.base_price).toLocaleString()} so'm
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-black/8 px-4 py-2.5 dark:border-white/8">
                <span className="text-[11px] text-[#9ca3af]">{p.views} ko'rishlar</span>
                <div className="flex items-center gap-1">
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
              onClick={() => { setCreateOpen(false); setEditProduct(null); }}
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
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border border-black/12 px-3 py-2.5 text-[14px] outline-none focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                    placeholder="Masalan: Erkaklar ko'ylagi"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280] dark:text-[#9ca3af]">Narxi (so'm)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.base_price}
                    onChange={(e) => setForm((p) => ({ ...p, base_price: e.target.value }))}
                    className="w-full rounded-xl border border-black/12 px-3 py-2.5 text-[14px] outline-none focus:border-[#00c853] dark:border-white/10 dark:bg-[#111111] dark:text-white"
                    placeholder="50000"
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
              </div>
              {formError && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">{formError}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => { setCreateOpen(false); setEditProduct(null); }}
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
