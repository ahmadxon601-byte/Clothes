'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, ChevronDown, Edit3, Eye, Loader2, Package, Plus, Trash2, X } from 'lucide-react';
import { getApiToken, setApiToken, telegramWebAppAuth } from '../../../../src/lib/apiClient';
import { useTelegram } from '../../../../src/telegram/useTelegram';
import { TELEGRAM_ROUTES } from '../../../../src/shared/config/constants';
import { useSSERefetch } from '../../../../src/shared/hooks/useSSERefetch';
import { formatPrice } from '../../../../src/shared/lib/formatPrice';
import { ConfirmDialog } from '../../../../src/shared/ui/ConfirmDialog';
import { RichTextEditor } from '../../../../src/shared/ui/RichTextEditor';
import { useTranslation } from '../../../../src/shared/lib/i18n';

const TELEGRAM_LOGOUT_KEY = 'tg_webapp_logged_out';

interface MyProduct {
  id: string;
  name: string;
  base_price: number;
  sale_price: number | null;
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
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  slug: string;
  parent_id?: string | null;
}

interface DailyDealInvite {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  store_id: string;
  store_name: string;
  campaign_id: string;
  title: string;
  message: string;
  starts_at: string;
  ends_at: string;
  campaign_status: string;
  selected_items: Array<{ product_id: string }>;
}

type View = 'list' | 'create' | 'edit';

const fieldClass =
  'w-full rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3 text-[14px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition-all placeholder:text-[#9ca3af] focus:border-[#22c55e]/55 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(34,197,94,0.12)]';
const fieldErrorClass =
  'w-full rounded-[20px] border border-red-500/80 bg-white/[0.04] px-4 py-3 text-[14px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition-all placeholder:text-[#9ca3af] focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]';
const selectClass = `${fieldClass} appearance-none pr-11 leading-[1.2]`;
const subtleLabelClass =
  'mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#94a3b8]';

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

export default function ProfileProductsPage() {
  const { WebApp, isReady } = useTelegram();
  const { t, language } = useTranslation();
  const [products, setProducts] = useState<MyProduct[]>([]);
  const [dailyDealInvites, setDailyDealInvites] = useState<DailyDealInvite[]>([]);
  const [stores, setStores] = useState<MyStore[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [editProduct, setEditProduct] = useState<MyProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [inviteSavingId, setInviteSavingId] = useState<string | null>(null);
  const [inviteSelections, setInviteSelections] = useState<Record<string, string[]>>({});
  const [parentCategoryMenuOpen, setParentCategoryMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; onConfirm: () => void }>({
    open: false,
    message: '',
    onConfirm: () => {},
  });

  const [form, setForm] = useState({
    name: '',
    base_price: '',
    discount: '',
    current_price: '',
    stock: '1',
    description: '',
    category_id: '',
    store_id: '',
  });
  const [formImages, setFormImages] = useState<string[]>([]);
  const [parentCategoryId, setParentCategoryId] = useState('');

  const parentCategories = useMemo(
    () => categories.filter((category) => !category.parent_id),
    [categories]
  );
  const subcategories = useMemo(
    () => categories.filter((category) => category.parent_id),
    [categories]
  );
  const filteredCategories = useMemo(
    () => subcategories.filter((category) => category.parent_id === parentCategoryId),
    [subcategories, parentCategoryId]
  );
  const selectedParentCategory = parentCategories.find((category) => category.id === parentCategoryId) ?? null;
  const selectedCategory = categories.find((category) => category.id === form.category_id) ?? null;

  const getCategoryLabel = (category: Category) =>
    category.name_uz || category.name_ru || category.name_en || category.name;

  const categoryPlaceholder = '— Kategoriya tanlanmagan —';
  const selectedParentCategoryLabel = selectedParentCategory ? getCategoryLabel(selectedParentCategory) : categoryPlaceholder;
  const selectedCategoryLabel = selectedCategory ? getCategoryLabel(selectedCategory) : categoryPlaceholder;

  const calcCurrentPrice = (base: string, disc: string) => {
    const b = Number(base);
    const d = Number(disc);
    if (!b || Number.isNaN(b) || Number.isNaN(d)) return '';
    return String(Math.round(b * (1 - d / 100)));
  };

  const calcDiscount = (base: string, current: string) => {
    const b = Number(base);
    const c = Number(current);
    if (!b || !c || Number.isNaN(b) || Number.isNaN(c)) return '';
    return String(Math.round((1 - c / b) * 100));
  };

  const loadDailyDealInvites = async (tokenArg?: string | null) => {
    const token = tokenArg ?? getApiToken();
    if (!token) {
      setDailyDealInvites([]);
      return;
    }

    try {
      const res = await fetch('/api/daily-deals/my-invites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      const invites = json.data?.invites ?? json.invites ?? [];
      setDailyDealInvites(invites);
      setInviteSelections((prev) => {
        const next = { ...prev };
        for (const invite of invites as DailyDealInvite[]) {
          next[invite.id] = Array.isArray(invite.selected_items)
            ? invite.selected_items.map((item) => item.product_id)
            : [];
        }
        return next;
      });
    } catch {
      setDailyDealInvites([]);
    }
  };

  const fetchAll = async (tokenArg?: string | null) => {
    const token = tokenArg ?? getApiToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [productsRes, storesRes, categoriesRes] = await Promise.all([
        fetch('/api/products/my', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/stores/my/all', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/categories'),
      ]);
      const [productsJson, storesJson, categoriesJson] = await Promise.all([
        productsRes.json(),
        storesRes.json(),
        categoriesRes.json(),
      ]);

      setProducts(productsJson.data?.products ?? productsJson.products ?? []);
      const nextStores: MyStore[] = storesJson.data?.stores ?? storesJson.stores ?? [];
      setStores(nextStores);
      setCategories(categoriesJson.data?.categories ?? categoriesJson.categories ?? []);
      if (nextStores.length > 0) {
        setForm((prev) => ({ ...prev, store_id: prev.store_id || nextStores[0].id }));
      }
      await loadDailyDealInvites(token);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    const initData = WebApp?.initData;
    const isLoggedOut =
      typeof window !== 'undefined' && localStorage.getItem(TELEGRAM_LOGOUT_KEY) === '1';
    if (initData) {
      if (isLoggedOut) {
        fetchAll();
        return;
      }
      telegramWebAppAuth(initData)
        .then((token) => {
          setApiToken(token);
          return fetchAll(token);
        })
        .catch(() => {})
        .finally(() => {});
    } else {
      fetchAll();
    }
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useSSERefetch(['products', 'daily_deals'], () => fetchAll());

  useEffect(() => {
    if (!categories.length || !parentCategoryId) return;
    const nested = subcategories.filter((category) => category.parent_id === parentCategoryId);
    setForm((prev) => {
      if (nested.length === 0) {
        return prev.category_id === parentCategoryId ? prev : { ...prev, category_id: parentCategoryId };
      }
      if (nested.some((category) => category.id === prev.category_id)) return prev;
      return { ...prev, category_id: nested[0].id };
    });
  }, [categories, parentCategoryId, subcategories]);

  const resetForm = () => {
    const defaultParent = parentCategories[0] ?? null;
    const defaultSub = defaultParent
      ? subcategories.find((category) => category.parent_id === defaultParent.id) ?? null
      : null;

    setParentCategoryId(defaultParent?.id ?? '');
    setForm({
      name: '',
      base_price: '',
      discount: '',
      current_price: '',
      stock: '1',
      description: '',
      category_id: defaultSub?.id ?? defaultParent?.id ?? '',
      store_id: stores[0]?.id ?? '',
    });
    setFormImages([]);
    setFormError('');
    setSuccessMessage('');
    setFormErrors({});
    setParentCategoryMenuOpen(false);
    setCategoryMenuOpen(false);
  };

  const respondToInvite = async (invite: DailyDealInvite, status: 'accepted' | 'rejected') => {
    setFormError('');
    setSuccessMessage('');

    if (status === 'accepted' && !(inviteSelections[invite.id]?.length)) {
      setFormError('Chegirma uchun kamida bitta mahsulot tanlang.');
      return;
    }

    setInviteSavingId(invite.id);
    try {
      const res = await fetch(`/api/daily-deals/invites/${invite.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ status, product_ids: inviteSelections[invite.id] ?? [] }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Taklifga javob berib bo‘lmadi');
      setSuccessMessage(status === 'accepted' ? 'Mahsulotlar chegirmaga yuborildi.' : 'Taklif rad etildi.');
      await fetchAll();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Taklifga javob berib bo‘lmadi');
    } finally {
      setInviteSavingId(null);
    }
  };

  const openCreate = () => {
    resetForm();
    setEditProduct(null);
    setView('create');
  };

  const openEdit = async (product: MyProduct) => {
    setEditProduct(product);
    setFormError('');
    setFormErrors({});
    setParentCategoryMenuOpen(false);
    setCategoryMenuOpen(false);

    const currentCategory = categories.find((category) => category.id === product.category_id) ?? null;
    const currentParentId = currentCategory?.parent_id ?? currentCategory?.id ?? '';
    setParentCategoryId(currentParentId);
    setForm({
      name: product.name,
      base_price: String(product.base_price),
      discount: product.sale_price && product.base_price
        ? calcDiscount(String(product.base_price), String(product.sale_price))
        : '',
      current_price: product.sale_price != null ? String(product.sale_price) : String(product.base_price),
      stock: '1',
      description: product.description ?? '',
      category_id: product.category_id ?? '',
      store_id: product.store_id,
    });

    try {
      const res = await fetch(`/api/products/${product.id}`);
      const json = await res.json();
      const data = json.data?.product ?? json.product;
      const images: Array<{ url: string; sort_order: number }> = data?.images ?? [];
      const variants: Array<{ stock?: number }> = data?.variants ?? [];
      setFormImages(images.sort((a, b) => a.sort_order - b.sort_order).map((item) => item.url));
      if (variants[0]?.stock != null) {
        setForm((prev) => ({ ...prev, stock: String(variants[0].stock) }));
      }
    } catch {
      setFormImages(product.thumbnail ? [product.thumbnail] : []);
    }

    setView('edit');
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingImg(true);
    setFormError('');
    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => uploadImage(file)));
      setFormImages((prev) => [...prev, ...uploaded]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t.error_occurred);
    } finally {
      setUploadingImg(false);
    }
  };

  const validate = () => {
    const errors: Record<string, boolean> = {};
    if (!form.name.trim()) errors.name = true;
    if (!form.base_price || Number(form.base_price) <= 0 || Number.isNaN(Number(form.base_price))) errors.price = true;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setFormError('');
    try {
      const currentPrice = form.current_price && Number(form.current_price) > 0
        ? Number(form.current_price)
        : Number(form.base_price);
      const payload = {
        name: form.name.trim(),
        base_price: Number(form.base_price),
        description: form.description || undefined,
        category_id: form.category_id || undefined,
        store_id: form.store_id || undefined,
        images: formImages.map((url, index) => ({ url, sort_order: index })),
        variants: [{ price: currentPrice, stock: Number(form.stock) || 1 }],
      };

      const res = await fetch(editProduct ? `/api/products/${editProduct.id}` : '/api/products', {
        method: editProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? t.error_occurred);
        return;
      }

      await fetchAll();
      setView('list');
      setEditProduct(null);
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t.error_occurred);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    setConfirmDialog({
      open: true,
      message: t.confirm_delete_product,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await fetch(`/api/products/${productId}`, { method: 'DELETE', headers: authHeaders() });
          await fetchAll();
        } catch {
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (view !== 'list') {
    return (
      <>
        <ConfirmDialog
          open={confirmDialog.open}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        />
        <div className="px-4 pb-8">
          <button onClick={() => { setView('list'); setEditProduct(null); setParentCategoryMenuOpen(false); setCategoryMenuOpen(false); }} className="mb-5 flex items-center gap-2 text-[14px] font-medium text-[var(--color-hint)]">
            <ArrowLeft size={18} /> {t.back}
          </button>
          <h2 className="mb-5 text-[20px] font-bold text-[var(--color-text)]">
            {editProduct ? t.edit_product : t.add_new_product}
          </h2>

          <div className="space-y-4">
            {!editProduct && stores.length > 1 && (
              <label className="block">
                <span className={subtleLabelClass}>{t.store}</span>
                <div className="relative">
                  <select value={form.store_id} onChange={(e) => setForm((prev) => ({ ...prev, store_id: e.target.value }))} className={selectClass}>
                    {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                </div>
              </label>
            )}

            <label className="block">
              <span className={subtleLabelClass}>{t.product_name}</span>
              <input value={form.name} onChange={(e) => { setForm((prev) => ({ ...prev, name: e.target.value })); if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: false })); }} className={formErrors.name ? fieldErrorClass : fieldClass} placeholder={t.product_name} />
              {formErrors.name && <p className="mt-1 text-[12px] text-red-500">{t.product_required}</p>}
            </label>

            <label className="block">
              <span className={subtleLabelClass}>{t.original_price} *</span>
              <input type="number" min="0" value={form.base_price} onChange={(e) => { const value = e.target.value; if (formErrors.price) setFormErrors((prev) => ({ ...prev, price: false })); setForm((prev) => ({ ...prev, base_price: value, current_price: calcCurrentPrice(value, prev.discount) })); }} className={formErrors.price ? fieldErrorClass : fieldClass} placeholder="50000" />
              {formErrors.price && <p className="mt-1 text-[12px] text-red-500">To&apos;g&apos;ri narx kiriting</p>}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={subtleLabelClass}>{t.sale_percent}</span>
                <input type="number" min="0" max="100" value={form.discount} onChange={(e) => { const value = e.target.value; setForm((prev) => ({ ...prev, discount: value, current_price: calcCurrentPrice(prev.base_price, value) })); }} className={fieldClass} placeholder="0" />
              </label>
              <label className="block">
                <span className={subtleLabelClass}>{t.current_price}</span>
                <input type="number" min="0" value={form.current_price} onChange={(e) => { const value = e.target.value; setForm((prev) => ({ ...prev, current_price: value, discount: calcDiscount(prev.base_price, value) })); }} className={fieldClass} placeholder="50000" />
              </label>
            </div>

            <label className="block">
              <span className={subtleLabelClass}>{t.quantity}</span>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))} className={fieldClass} placeholder="1" />
            </label>

            <label className="block">
              <span className={subtleLabelClass}>{t.main_category}</span>
              <div className="relative">
                <button type="button" onClick={() => setParentCategoryMenuOpen((prev) => !prev)} className={`${fieldClass} flex items-center justify-between pr-4 text-left`}>
                  <span className={selectedParentCategory ? 'text-white' : 'text-[#94a3b8]'}>{parentCategories.length ? selectedParentCategoryLabel : t.main_category}</span>
                  <ChevronDown className={`size-4 text-[#94a3b8] transition-transform ${parentCategoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {parentCategoryMenuOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-[22px] border border-white/10 bg-[rgba(18,18,18,0.98)] p-2 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                    <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                      {parentCategories.map((category) => (
                        <button key={category.id} type="button" onClick={() => { setParentCategoryId(category.id); setParentCategoryMenuOpen(false); setCategoryMenuOpen(false); }} className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-[14px] transition-colors ${parentCategoryId === category.id ? 'bg-[#13ec37] text-[#06200f]' : 'text-[#d1d5db] hover:bg-white/5 hover:text-white'}`}>
                          {getCategoryLabel(category)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </label>

            <label className="block">
              <span className={subtleLabelClass}>{t.subcategory}</span>
              <div className="relative">
                <button type="button" onClick={() => filteredCategories.length > 0 && setCategoryMenuOpen((prev) => !prev)} className={`${fieldClass} flex items-center justify-between pr-4 text-left ${filteredCategories.length === 0 ? 'cursor-not-allowed opacity-70' : ''}`}>
                  <span className={selectedCategory ? 'text-white' : 'text-[#94a3b8]'}>{filteredCategories.length ? selectedCategoryLabel : t.subcategory}</span>
                  <ChevronDown className={`size-4 text-[#94a3b8] transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {categoryMenuOpen && filteredCategories.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-[22px] border border-white/10 bg-[rgba(18,18,18,0.98)] p-2 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                    <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                      {filteredCategories.map((category) => (
                        <button key={category.id} type="button" onClick={() => { setForm((prev) => ({ ...prev, category_id: category.id })); setCategoryMenuOpen(false); }} className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-[14px] transition-colors ${form.category_id === category.id ? 'bg-[#13ec37] text-[#06200f]' : 'text-[#d1d5db] hover:bg-white/5 hover:text-white'}`}>
                          {getCategoryLabel(category)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </label>

            <label className="block">
              <span className={subtleLabelClass}>{t.optional_description}</span>
              <RichTextEditor value={form.description} onChange={(value) => setForm((prev) => ({ ...prev, description: value }))} placeholder={t.description} />
            </label>

            <div>
              <span className={subtleLabelClass}>{t.optional_images}</span>
              <div className="flex flex-wrap gap-2.5 rounded-[24px] border border-white/8 bg-white/[0.02] p-3">
                {formImages.map((url, index) => (
                  <div key={index} className="relative h-20 w-20 overflow-hidden rounded-[18px] border border-white/10 bg-white/5">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setFormImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-[18px] border border-dashed border-white/15 bg-white/[0.04] text-[#94a3b8] transition-all hover:border-[#22c55e]/50 hover:bg-[#22c55e]/8 hover:text-[#16a34a]">
                  {uploadingImg ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Camera size={18} />
                      <span className="text-[9px] font-bold">{t.image_short}</span>
                    </>
                  )}
                  <input type="file" accept="image/*" multiple className="sr-only" disabled={uploadingImg} onChange={(e) => handleImageUpload(e.target.files)} />
                </label>
              </div>
            </div>

            {formError && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-400">{formError}</p>}

            <div className="mt-6 flex gap-3">
              <button onClick={() => { setView('list'); setEditProduct(null); setParentCategoryMenuOpen(false); setCategoryMenuOpen(false); }} className="h-12 flex-1 rounded-full border border-white/10 bg-white/[0.03] text-[13px] font-black text-white">
                {t.cancel}
              </button>
              <button onClick={handleSave} disabled={saving} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#13ec37] text-[13px] font-black text-[#052e16] disabled:opacity-60">
                {saving && <Loader2 size={13} className="animate-spin" />}
                {t.save}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
      <div className="px-4 pb-8">
        <div className="mb-5 flex items-center justify-between">
          <Link href="/telegram/profile" className="flex items-center gap-2 text-[14px] font-medium text-[var(--color-hint)]">
            <ArrowLeft size={18} /> {t.profile}
          </Link>
          <h2 className="text-[17px] font-bold text-[var(--color-text)]">{t.my_products}</h2>
          <div className="w-16" />
        </div>

        {formError ? (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[12px] font-semibold text-red-300">
            {formError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-[12px] font-semibold text-[var(--color-primary)]">
            {successMessage}
          </div>
        ) : null}

        {dailyDealInvites.length > 0 ? (
          <div className="mb-5 space-y-4">
            {dailyDealInvites.map((invite) => {
              const storeProducts = products.filter((product) => product.store_id === invite.store_id);
              const selectedIds = inviteSelections[invite.id] ?? [];

              return (
                <div
                  key={invite.id}
                  className="rounded-[24px] border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/8 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--color-primary)]">
                        Chegirma taklifi
                      </p>
                      <h3 className="mt-2 text-[18px] font-black text-[var(--color-text)]">{invite.title}</h3>
                      <p className="mt-2 text-[13px] leading-5 text-[var(--color-hint)]">{invite.message}</p>
                      <p className="mt-2 text-[11px] text-[var(--color-hint)]">
                        {invite.store_name} · {new Date(invite.starts_at).toLocaleString()} - {new Date(invite.ends_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                        invite.status === 'accepted'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : invite.status === 'rejected'
                            ? 'bg-red-500/15 text-red-300'
                            : 'bg-white/10 text-white'
                      }`}
                    >
                      {invite.status}
                    </span>
                  </div>

                  {invite.status === 'pending' ? (
                    <>
                      <div className="mt-4 space-y-2">
                        {storeProducts.length > 0 ? (
                          storeProducts.map((product) => {
                            const checked = selectedIds.includes(product.id);
                            const currentPrice =
                              product.sale_price != null && product.sale_price < product.base_price
                                ? product.sale_price
                                : product.base_price;

                            return (
                              <label
                                key={product.id}
                                className={`flex items-center gap-3 rounded-[18px] border px-3 py-3 transition ${
                                  checked
                                    ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10'
                                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) =>
                                    setInviteSelections((prev) => ({
                                      ...prev,
                                      [invite.id]: e.target.checked
                                        ? [...(prev[invite.id] ?? []), product.id]
                                        : (prev[invite.id] ?? []).filter((id) => id !== product.id),
                                    }))
                                  }
                                  className="h-4 w-4 rounded border-white/20 bg-transparent text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                />
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--color-surface2)]">
                                  {product.thumbnail ? (
                                    <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <Package size={18} className="text-[var(--color-hint)]" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[13px] font-bold text-[var(--color-text)]">{product.name}</p>
                                  <p className="mt-1 text-[12px] font-semibold text-[var(--color-primary)]">
                                    {formatPrice(currentPrice, 'UZS', language)}
                                  </p>
                                </div>
                              </label>
                            );
                          })
                        ) : (
                          <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[12px] text-[var(--color-hint)]">
                            Bu do&apos;konda hali tasdiqlangan mahsulot yo&apos;q.
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => respondToInvite(invite, 'accepted')}
                          disabled={inviteSavingId === invite.id}
                          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-[12px] font-bold text-white disabled:opacity-60"
                        >
                          {inviteSavingId === invite.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                          Qabul qilish
                        </button>
                        <button
                          onClick={() => respondToInvite(invite, 'rejected')}
                          disabled={inviteSavingId === invite.id}
                          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/10 text-[12px] font-bold text-red-400 disabled:opacity-60"
                        >
                          Rad etish
                        </button>
                      </div>
                    </>
                  ) : invite.status === 'accepted' ? (
                    <p className="mt-4 text-[12px] font-semibold text-[var(--color-primary)]">
                      {selectedIds.length} ta mahsulot chegirmaga yuborilgan.
                    </p>
                  ) : (
                    <p className="mt-4 text-[12px] font-semibold text-red-400">Bu taklif rad etilgan.</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {products.length > 0 ? (
          <div className="mb-5 space-y-3">
            {products.map((product) => {
              const base = Number(product.base_price);
              const current = product.sale_price != null && Number(product.sale_price) < base ? Number(product.sale_price) : base;
              const hasDiscount = current < base;
              const discount = hasDiscount ? Math.round((1 - current / base) * 100) : 0;
              return (
                <div key={product.id} className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--color-surface2)]">
                      {product.thumbnail ? <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Package size={22} className="text-[var(--color-hint)]" /></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-[var(--color-text)]">{product.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[13px] font-bold text-[var(--color-primary)]">{formatPrice(current, 'UZS', language)}</p>
                        {hasDiscount && (
                          <>
                            <span className="text-[11px] text-[var(--color-hint)] line-through">{formatPrice(base, 'UZS', language)}</span>
                            <span className="rounded-full bg-red-500 px-1 py-0.5 text-[9px] font-bold text-white">-{discount}%</span>
                          </>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-[var(--color-hint)]">{product.store_name}{product.category_name ? ` · ${product.category_name}` : ''}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link href={TELEGRAM_ROUTES.PRODUCT(product.id)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)]/10 text-[12px] font-bold text-[var(--color-primary)]">
                      <Eye size={14} /> {t.view}
                    </Link>
                    <button onClick={() => openEdit(product)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-500/10 text-[12px] font-bold text-blue-500">
                      <Edit3 size={14} /> {t.edit}
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500/10 text-[12px] font-bold text-red-500">
                      <Trash2 size={14} /> {t.delete}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mb-5 flex flex-col items-center py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface2)]">
              <Package size={24} className="text-[var(--color-hint)]" />
            </div>
            <p className="text-[16px] font-bold text-[var(--color-text)]">{t.product_missing}</p>
            <p className="mt-1 text-[13px] text-[var(--color-hint)]">{t.add_product}</p>
          </div>
        )}

        <button onClick={openCreate} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(26,229,80,0.25)]">
          <Plus size={18} />
          {t.add_product}
        </button>
      </div>
    </>
  );
}
