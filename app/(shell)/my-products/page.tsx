'use client';

import { useEffect, useMemo, useState } from 'react';
import { Camera, ChevronDown, Edit3, Loader2, Package, Plus, Trash2, X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useWebAuth } from '../../../src/context/WebAuthContext';
import { AuthModal } from '../../../src/shared/ui/AuthModal';
import { useSSERefetch } from '../../../src/shared/hooks/useSSERefetch';
import { ConfirmDialog } from '../../../src/shared/ui/ConfirmDialog';
import { useSettingsStore } from '../../../src/features/settings/model';
import { RichTextEditor } from '../../../src/shared/ui/RichTextEditor';
import { stripRichText } from '../../../src/shared/lib/richText';
import { DEPARTMENTS, getDepartmentBySlug, type DepartmentKey } from '../../../src/shared/lib/productCategoryMeta';
import { useWebI18n } from '../../../src/shared/lib/webI18n';

interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  sale_price: number | null;
  sku: string;
  is_active: boolean;
  review_status: 'pending' | 'approved' | 'rejected';
  review_note: string | null;
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
  name_uz: string | null;
  name_ru: string | null;
  name_en: string | null;
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

const MAX_PRODUCT_IMAGES = 20;

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('marketplace_token') : null;

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

export default function MyProductsPage() {
  const { user, loading } = useWebAuth();
  const { w } = useWebI18n();
  const language = useSettingsStore((s) => s.settings.language);
  const p = (w as typeof w & {
    myProducts?: {
      authTitle: string;
      authDesc: string;
      title: string;
      count: string;
      add: string;
      noStore: string;
      openStore: string;
      empty: string;
      emptyDesc: string;
      addShort: string;
      editTitle: string;
      createTitle: string;
      store: string;
      name: string;
      namePlaceholder: string;
      nameRequired: string;
      basePrice: string;
      invalidPrice: string;
      discount: string;
      currentPrice: string;
      stock: string;
      parentCategory: string;
      parentCategoryMissing: string;
      subcategory: string;
      description: string;
      descriptionPlaceholder: string;
      images: string;
      image: string;
      uploadedImages: string;
      imageError: string;
      cancel: string;
      save: string;
    };
  }).myProducts ?? {
    authTitle: 'My Products',
    authDesc: 'Sign in to manage your products.',
    title: 'My Products',
    count: 'products',
    add: 'New product',
    noStore: 'You do not have a store yet',
    openStore: 'Open Store',
    empty: 'No products',
    emptyDesc: 'No products have been added yet.',
    addShort: 'Add',
    editTitle: 'Edit product',
    createTitle: 'New product',
    store: 'Store',
    name: 'Name',
    namePlaceholder: 'For example: Men\'s shirt',
    nameRequired: 'Product name is required',
    basePrice: 'Base price (sum) *',
    invalidPrice: 'Enter a valid price',
    discount: 'Discount %',
    currentPrice: 'Current price',
    stock: 'Quantity',
    parentCategory: 'Main category',
    parentCategoryMissing: 'Main category not found',
    subcategory: 'Subcategory',
    description: 'Description (optional)',
    descriptionPlaceholder: 'A short note about the product...',
    images: 'Images (optional)',
    image: 'Image',
    uploadedImages: 'images uploaded',
    imageError: 'There is an image upload error. Select up to {count} images.',
    cancel: 'Cancel',
    save: 'Save',
  };
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({
    open: false,
    tab: 'login',
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [dailyDealInvites, setDailyDealInvites] = useState<DailyDealInvite[]>([]);
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
  const [inviteSavingId, setInviteSavingId] = useState<string | null>(null);
  const [inviteSelections, setInviteSelections] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [parentCategoryMenuOpen, setParentCategoryMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [department, setDepartment] = useState<DepartmentKey>('electronics');

  useEffect(() => {
    const hidden = createOpen || Boolean(deleteProduct);
    window.dispatchEvent(new CustomEvent('web-shell-header-visibility', { detail: { hidden } }));
    return () => {
      window.dispatchEvent(new CustomEvent('web-shell-header-visibility', { detail: { hidden: false } }));
    };
  }, [createOpen, deleteProduct]);

  const getCategoryLabel = (cat: Category) => {
    const value = language === 'ru'
      ? cat.name_ru || cat.name
      : language === 'en'
        ? cat.name_en || cat.name
        : cat.name_uz || cat.name;
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  };

  const categoryPlaceholder =
    language === 'ru'
      ? '— Категория не выбрана —'
      : language === 'en'
        ? '— No category selected —'
        : '— Kategoriya tanlanmagan —';
  const fieldClass =
    'w-full rounded-[20px] border border-black/10 bg-[#f8fafc] px-4 py-3 text-[14px] text-[#111111] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-200 placeholder:text-[#94a3b8] focus:border-[#22c55e]/55 focus:bg-white focus:shadow-[0_0_0_4px_rgba(34,197,94,0.12)] dark:border-white/8 dark:bg-[#101010] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:placeholder:text-[#9ca3af] dark:focus:bg-[#141414]';
  const fieldErrorClass =
    'w-full rounded-[20px] border border-red-500/80 bg-[#fff7f7] px-4 py-3 text-[14px] text-[#111111] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-200 placeholder:text-[#94a3b8] focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)] dark:bg-[#101010] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';
  const selectClass = `${fieldClass} appearance-none pr-11 leading-[1.2]`;
  const subtleLabelClass =
    'mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7280] dark:text-[#94a3b8]';
  const parentCategories = useMemo(
    () => categories.filter((category) => !category.parent_id),
    [categories]
  );
  const subcategories = useMemo(
    () => categories.filter((category) => category.parent_id),
    [categories]
  );
  const selectedParentCategory = parentCategories.find((category) => category.id === parentCategoryId) ?? null;
  const filteredCategories = subcategories.filter((category) => category.parent_id === parentCategoryId);
  const selectedCategory = categories.find((c) => c.id === form.category_id) ?? null;
  const selectedCategoryLabel = selectedCategory ? getCategoryLabel(selectedCategory) : categoryPlaceholder;
  const selectedParentCategoryLabel = selectedParentCategory ? getCategoryLabel(selectedParentCategory) : categoryPlaceholder;
  const availableDepartments = DEPARTMENTS.filter(({ key }) =>
    parentCategories.some((category) => getDepartmentBySlug(category.slug) === key)
  );

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

  const loadDailyDealInvites = async () => {
    try {
      const res = await fetch('/api/daily-deals/my-invites', { headers: authHeader() });
      const json = await res.json().catch(() => ({}));
      const invites = json.data?.invites ?? json.invites ?? [];
      setDailyDealInvites(invites);
      setInviteSelections((prev) => {
        const next = { ...prev };
        for (const invite of invites as DailyDealInvite[]) {
          if (!next[invite.id]) {
            next[invite.id] = Array.isArray(invite.selected_items) ? invite.selected_items.map((item) => item.product_id) : [];
          }
        }
        return next;
      });
    } catch {
      setDailyDealInvites([]);
    }
  };

  useEffect(() => {
    if (user) {
      loadProducts();
      loadStores();
      loadCategories();
      loadDailyDealInvites();
    } else if (!loading) {
      setFetching(false);
    }
  }, [user, loading]);

  useSSERefetch(['products', 'daily_deals'], () => {
    loadProducts();
    loadDailyDealInvites();
  });

  const respondToInvite = async (invite: DailyDealInvite, status: 'accepted' | 'rejected') => {
    setFormError('');
    setSuccessMessage('');
    if (status === 'accepted' && !(inviteSelections[invite.id]?.length)) {
      setFormError('Kunlik chegirma uchun kamida bitta mahsulot tanlang.');
      return;
    }

    setInviteSavingId(invite.id);
    try {
      const res = await fetch(`/api/daily-deals/invites/${invite.id}`, {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify({ status, product_ids: inviteSelections[invite.id] ?? [] }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Taklifga javob berib bo‘lmadi');
      setSuccessMessage(status === 'accepted' ? 'Kunlik chegirmaga mahsulotlar yuborildi.' : 'Taklif rad etildi.');
      loadDailyDealInvites();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Taklifga javob berib bo‘lmadi');
    } finally {
      setInviteSavingId(null);
    }
  };

  useEffect(() => {
    if (!categories.length || !parentCategoryId) return;

    const selectedParent = parentCategories.find((category) => category.id === parentCategoryId);
    if (!selectedParent) return;

    setDepartment(getDepartmentBySlug(selectedParent.slug));

    const nestedSubcategories = subcategories.filter((category) => category.parent_id === parentCategoryId);
    setForm((prev) => {
      if (nestedSubcategories.length === 0) {
        return prev.category_id === selectedParent.id ? prev : { ...prev, category_id: selectedParent.id };
      }

      if (nestedSubcategories.some((category) => category.id === prev.category_id)) {
        return prev;
      }

      return { ...prev, category_id: nestedSubcategories[0]?.id ?? '' };
    });
  }, [categories, parentCategoryId, parentCategories, subcategories]);

  const openCreate = () => {
    const defaultParent = parentCategories[0] ?? null;
    const defaultSubcategory = defaultParent
      ? subcategories.find((category) => category.parent_id === defaultParent.id) ?? null
      : null;
    setDepartment(getDepartmentBySlug(defaultParent?.slug));
    setParentCategoryId(defaultParent?.id ?? '');
    setForm({ name: '', base_price: '', discount: '', current_price: '', stock: '1', description: '', category_id: defaultSubcategory?.id ?? defaultParent?.id ?? '', store_id: stores[0]?.id ?? '' });
    setFormImages([]);
    setFormError('');
    setFormErrors({});
    setSuccessMessage('');
    setParentCategoryMenuOpen(false);
    setCategoryMenuOpen(false);
    setEditProduct(null);
    setCreateOpen(true);
  };

  const openEdit = async (p: Product) => {
    const existingCategory = categories.find((item) => item.id === (p.category_id ?? ''));
    const resolvedParent = existingCategory?.parent_id
      ? parentCategories.find((category) => category.id === existingCategory.parent_id) ?? null
      : existingCategory ?? null;
    setDepartment(getDepartmentBySlug(resolvedParent?.slug));
    setParentCategoryId(resolvedParent?.id ?? '');
    setForm({
      name: p.name,
      base_price: String(p.base_price),
      discount: '',
      current_price: String(p.base_price),
      stock: '1',
      description: p.description ?? '',
      category_id: p.category_id ?? '',
      store_id: p.store_id,
    });
    setFormImages(p.thumbnail ? [p.thumbnail] : []);
    setFormError('');
    setFormErrors({});
    setSuccessMessage('');
    setParentCategoryMenuOpen(false);
    setCategoryMenuOpen(false);
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
      setForm(prev => {
        const base: typeof prev = { ...prev, description: detail?.description ?? '' };
        if (variants.length > 0) {
          const v = variants[0];
          return {
            ...base,
            stock: v.stock != null ? String(v.stock) : '1',
            current_price: v.price != null ? String(v.price) : prev.base_price,
            discount: v.price != null && v.price < p.base_price
              ? String(Math.round((1 - v.price / p.base_price) * 100))
              : '',
          };
        }
        return base;
      });
    } catch { /* noop */ }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const token = getToken();
    if (!token) {
      setFormError("Sessiya topilmadi. Qayta login qiling.");
      return;
    }

    setFormError('');
    if (formErrors.images) {
      setFormErrors((prev) => ({ ...prev, images: false }));
    }
    setSuccessMessage('');

    const selectedFiles = Array.from(files);
    if (formImages.length + selectedFiles.length > MAX_PRODUCT_IMAGES) {
      setFormErrors((prev) => ({ ...prev, images: true }));
      setFormError(`Ko'pi bilan ${MAX_PRODUCT_IMAGES} ta rasm yuklash mumkin.`);
      return;
    }

    setUploadingImg(true);
    try {
      const urls: string[] = [];
      for (const file of selectedFiles) {
        if (file.size > 4 * 1024 * 1024) {
          throw new Error(`${file.name}: 4MB dan kichik rasm tanlang`);
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
        if (url) urls.push(url);
      }

      if (urls.length === 0) {
        throw new Error('Rasm yuklanmadi');
      }

      setFormImages((prev) => [...prev, ...urls]);
    } catch (e) {
      setFormErrors((prev) => ({ ...prev, images: true }));
      setFormError(e instanceof Error ? e.message : 'Rasm yuklashda xatolik');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSave = async () => {
    setFormError('');
    const errors: Record<string, boolean> = {};
    const descriptionText = stripRichText(form.description);
    if (!form.name.trim()) errors.name = true;
    if (!form.base_price || isNaN(Number(form.base_price)) || Number(form.base_price) <= 0) errors.price = true;
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setSaving(true);
    const finalPrice = form.current_price ? Number(form.current_price) : Number(form.base_price);
    const variantPayload = { variants: [{ price: finalPrice, stock: Number(form.stock) || 1 }] };
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
            ...(descriptionText && { description: form.description }),
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
            ...(descriptionText && { description: form.description }),
            ...(form.category_id && { category_id: form.category_id }),
            ...(form.store_id && { store_id: form.store_id }),
            ...imagePayload,
            ...variantPayload,
          }),
        });
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error ?? 'Xatolik yuz berdi');
      }
      setCreateOpen(false);
      setEditProduct(null);
      setSuccessMessage(editProduct ? "Ariza yuborildi. Ko'rib chiqilmoqda." : "Mahsulot adminga ko'rib chiqish uchun yuborildi.");
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
    if (p.review_status !== 'approved') {
      setSuccessMessage('');
      setFormError("Tasdiqlanmagan mahsulotni faollashtirib bo'lmaydi.");
      return;
    }
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? "Holatni o'zgartirib bo'lmadi");
      }
      loadProducts();
    } catch {
      setFormError("Holatni o'zgartirib bo'lmadi");
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
          <h1 className="mt-4 text-[24px] font-black text-[#111111] dark:text-white">{p.authTitle}</h1>
          <p className="mt-2 text-[14px] text-[#6b7280]">{p.authDesc}</p>
          <button
            onClick={() => setAuthModal({ open: true, tab: 'login' })}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#13ec37] px-7 text-[13px] font-bold text-[#06200f]"
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
          <h1 className="text-[28px] font-black text-[#111111] dark:text-white">{p.title}</h1>
          <p className="mt-1 text-[14px] text-[#6b7280]">{products.length} {p.count}</p>
        </div>
        {stores.length > 0 && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-[#13ec37] px-5 py-2.5 text-[13px] font-bold text-[#06200f] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(0,200,83,0.5)]"
          >
            <Plus size={15} /> {p.add}
          </button>
        )}
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {dailyDealInvites.length > 0 ? (
        <div className="mb-6 space-y-4">
          {dailyDealInvites.map((invite) => {
            const storeProducts = products.filter((product) => product.store_id === invite.store_id && product.review_status === 'approved');
            const selectedIds = inviteSelections[invite.id] ?? [];

            return (
              <div key={invite.id} className="rounded-3xl border border-[#13ec37]/20 bg-[#effff2] p-5 dark:border-[#13ec37]/20 dark:bg-[#0f2012]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#0d8f2a]">Chegirma taklifi</p>
                    <h2 className="mt-2 text-[20px] font-black text-[#111111] dark:text-white">{invite.title}</h2>
                    <p className="mt-2 max-w-[70ch] text-[14px] text-[#46604c] dark:text-[#b7d7be]">{invite.message}</p>
                    <p className="mt-2 text-[12px] text-[#46604c] dark:text-[#b7d7be]">
                      {invite.store_name} · {new Date(invite.starts_at).toLocaleString()} - {new Date(invite.ends_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${invite.status === 'accepted' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : invite.status === 'rejected' ? 'bg-red-500/15 text-red-600 dark:text-red-300' : 'bg-white text-[#0d8f2a]'}`}>
                    {invite.status}
                  </span>
                </div>

                {invite.status === 'pending' ? (
                  <>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {storeProducts.map((product) => {
                        const checked = selectedIds.includes(product.id);
                        return (
                          <label key={product.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition-transform duration-200 hover:-translate-y-0.5 ${checked ? 'border-[#13ec37] bg-white dark:bg-[#16351d]' : 'border-[#13ec37]/15 bg-white/70 dark:bg-[#132417]'}`}>
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
                            />
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-[#0d170f]">
                              {product.thumbnail ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-[#13ec37]">
                                  <Package size={18} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold text-[#111111] dark:text-white">{product.name}</p>
                              <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">{Number(product.sale_price ?? product.base_price).toLocaleString()} UZS</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {storeProducts.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-[#13ec37]/20 bg-white/60 px-4 py-5 text-[13px] text-[#46604c] dark:bg-[#132417] dark:text-[#b7d7be]">
                        Bu do'konda hali tasdiqlangan mahsulot topilmadi. Avval mahsulot qo'shib, admin tasdig'idan o'tkazing.
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => respondToInvite(invite, 'accepted')}
                        disabled={inviteSavingId === invite.id}
                        className="inline-flex items-center gap-2 rounded-full bg-[#13ec37] px-5 py-2.5 text-[13px] font-bold text-[#06200f]"
                      >
                        {inviteSavingId === invite.id ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                        Qabul qilish
                      </button>
                      <button
                        onClick={() => respondToInvite(invite, 'rejected')}
                        disabled={inviteSavingId === invite.id}
                        className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-[13px] font-bold text-red-600 dark:bg-[#1a1a1a]"
                      >
                        Rad etish
                      </button>
                    </div>
                  </>
                ) : invite.status === 'accepted' ? (
                  <p className="mt-4 text-[13px] font-semibold text-[#0d8f2a] dark:text-[#72f58a]">{selectedIds.length} ta mahsulot kunlik chegirmaga yuborilgan.</p>
                ) : (
                  <p className="mt-4 text-[13px] font-semibold text-red-600 dark:text-red-300">Bu taklif rad etilgan.</p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {stores.length === 0 ? (
        <div className="rounded-3xl border border-black/10 bg-white p-10 text-center dark:border-white/10 dark:bg-[#1a1a1a]">
          <Package size={40} className="mx-auto text-[#9ca3af]" />
          <p className="mt-3 text-[15px] font-semibold text-[#111111] dark:text-white">{p.noStore}</p>
          <p className="mt-1 text-[13px] text-[#6b7280]">Mahsulot qo'shish uchun avval do'kon oching.</p>
          <Link href="/open-store" className="mt-5 inline-flex h-10 items-center rounded-full bg-[#13ec37] px-6 text-[12px] font-bold text-[#06200f]">
            {p.openStore}
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-black/10 bg-white p-10 text-center dark:border-white/10 dark:bg-[#1a1a1a]">
          <Package size={40} className="mx-auto text-[#9ca3af]" />
          <p className="mt-3 text-[15px] font-semibold text-[#111111] dark:text-white">{p.empty}</p>
          <p className="mt-1 text-[13px] text-[#6b7280]">{p.emptyDesc}</p>
          <button onClick={openCreate} className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#13ec37] px-6 text-[12px] font-bold text-[#06200f]">
            <Plus size={13} /> {p.addShort}
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
                  {(p.review_status !== 'approved' || !p.is_active) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold text-white">
                        {p.review_status === 'pending' ? "Ko'rib chiqilmoqda" : p.review_status === 'rejected' ? 'Rad etilgan' : 'Nofaol'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 pb-2">
                  <p className="line-clamp-1 text-[14px] font-bold text-[#111111] dark:text-white">{p.name}</p>
                  <p className="mt-0.5 text-[12px] text-[#6b7280]">{p.store_name}</p>
                  {p.category_name && (
                    <p className="mt-0.5 text-[11px] text-[#9ca3af]">
                      {(() => {
                        const matched = categories.find((c) => c.id === p.category_id);
                        return matched ? getCategoryLabel(matched) : p.category_name;
                      })()}
                    </p>
                  )}
                  {(() => {
                    const bp = Number(p.base_price);
                    const sp = p.sale_price != null ? Number(p.sale_price) : null;
                    const cur = sp != null && sp < bp ? sp : bp;
                    const hasDis = cur < bp;
                    const pct = hasDis ? Math.round((1 - cur / bp) * 100) : 0;
                    return (
                      <div className="mt-2">
                        <p className="text-[16px] font-black text-[#00c853]">{cur.toLocaleString('ru-RU')} so&apos;m</p>
                        {hasDis && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[12px] text-[#9ca3af] line-through">{bp.toLocaleString('ru-RU')} so&apos;m</span>
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">−{pct}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {p.review_status !== 'approved' ? (
                    <p className={`mt-2 text-[11px] font-semibold ${p.review_status === 'pending' ? 'text-amber-500' : 'text-rose-500'}`}>
                      {p.review_status === 'pending' ? "Admin tasdig'i kutilmoqda" : p.review_note || 'Mahsulot rad etilgan'}
                    </p>
                  ) : null}
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
          <div className="relative w-full max-w-[430px] overflow-hidden rounded-[32px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,251,0.98))] shadow-[0_32px_90px_-36px_rgba(0,0,0,0.65)] ring-1 ring-black/5 dark:bg-[linear-gradient(180deg,rgba(28,28,28,0.96),rgba(18,18,18,0.98))] dark:border-white/8 dark:ring-white/5">
            <div className="soft-scrollbar max-h-[90vh] overflow-y-auto pr-1">
            <div className="relative p-6 sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-3 border-b border-black/5 pb-4 dark:border-white/8">
                <h2 className="text-[24px] font-black tracking-[-0.03em] text-[#111111] dark:text-white">
                  {editProduct ? p.editTitle : p.createTitle}
                </h2>
                <button
                  onClick={() => { setCreateOpen(false); setEditProduct(null); setFormImages([]); setCategoryMenuOpen(false); }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/[0.03] text-[#6b7280] transition-all hover:rotate-90 hover:text-[#111111] dark:bg-white/[0.03] dark:text-[#9ca3af] dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4">
                {/* Store selector (only on create) */}
                {!editProduct && stores.length > 1 && (
                  <label className="block">
                    <span className={subtleLabelClass}>{p.store}</span>
                    <div className="relative">
                      <select
                        value={form.store_id}
                        onChange={(e) => setForm((p) => ({ ...p, store_id: e.target.value }))}
                        className={selectClass}
                      >
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    </div>
                  </label>
                )}
                <label className="block">
                  <span className={subtleLabelClass}>{p.name}</span>
                  <input
                    value={form.name}
                    onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); if (formErrors.name) setFormErrors(p => ({ ...p, name: false })); }}
                    className={formErrors.name ? fieldErrorClass : fieldClass}
                    placeholder={p.namePlaceholder}
                  />
                  {formErrors.name && <p className="mt-1 text-[12px] text-red-500">{p.nameRequired}</p>}
                </label>
                <label className="block">
                  <span className={subtleLabelClass}>{p.basePrice}</span>
                  <input
                    type="number"
                    min="0"
                    value={form.base_price}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (formErrors.price) setFormErrors(p => ({ ...p, price: false }));
                      setForm((p) => ({ ...p, base_price: v, current_price: calcCurrentPrice(v, p.discount) }));
                    }}
                    className={formErrors.price ? fieldErrorClass : fieldClass}
                    placeholder="50000"
                  />
                  {formErrors.price && <p className="mt-1 text-[12px] text-red-500">{p.invalidPrice}</p>}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={subtleLabelClass}>{p.discount}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discount}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((p) => ({ ...p, discount: v, current_price: calcCurrentPrice(p.base_price, v) }));
                      }}
                      className={fieldClass}
                      placeholder="0"
                    />
                  </label>
                  <label className="block">
                    <span className={subtleLabelClass}>{p.currentPrice}</span>
                    <input
                      type="number"
                      min="0"
                      value={form.current_price}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((p) => ({ ...p, current_price: v, discount: calcDiscount(p.base_price, v) }));
                      }}
                      className={fieldClass}
                      placeholder="50000"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className={subtleLabelClass}>{p.stock}</span>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                    className={fieldClass}
                    placeholder="1"
                  />
                </label>
                <label className="block">
                  <span className={subtleLabelClass}>{p.parentCategory}</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setParentCategoryMenuOpen((prev) => !prev)}
                      className={`${fieldClass} flex items-center justify-between pr-4 text-left ${parentCategoryMenuOpen ? 'border-[#22c55e]/55 bg-white shadow-[0_0_0_4px_rgba(34,197,94,0.12)] dark:bg-[#141414]' : ''}`}
                      aria-haspopup="listbox"
                      aria-expanded={parentCategoryMenuOpen}
                    >
                      <span className={`${selectedParentCategory ? 'text-[#111111] dark:text-white' : 'text-[#94a3b8]'}`}>
                        {parentCategories.length ? selectedParentCategoryLabel : p.parentCategoryMissing}
                      </span>
                      <ChevronDown className={`size-4 text-[#94a3b8] transition-transform ${parentCategoryMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {parentCategoryMenuOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-[22px] border border-black/10 bg-[rgba(255,255,255,0.98)] p-2 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(18,18,18,0.98)] dark:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)]">
                        <div className="soft-scrollbar max-h-60 space-y-1 overflow-y-auto pr-1">
                          {parentCategories.map((category) => {
                            const active = parentCategoryId === category.id;
                            return (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => {
                                  setParentCategoryId(category.id);
                                  setParentCategoryMenuOpen(false);
                                  setCategoryMenuOpen(false);
                                }}
                                className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-[14px] transition-colors ${active ? 'bg-[#13ec37] text-[#06200f]' : 'text-[#111111] hover:bg-[#f3f4f6] dark:text-[#d1d5db] dark:hover:bg-white/5 dark:hover:text-white'}`}
                              >
                                {getCategoryLabel(category)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </label>
                <label className="block">
                  <span className={subtleLabelClass}>{p.subcategory}</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => filteredCategories.length > 0 && setCategoryMenuOpen((prev) => !prev)}
                      className={`${fieldClass} flex items-center justify-between pr-4 text-left ${categoryMenuOpen ? 'border-[#22c55e]/55 bg-white shadow-[0_0_0_4px_rgba(34,197,94,0.12)] dark:bg-[#141414]' : ''} ${filteredCategories.length === 0 ? 'cursor-not-allowed opacity-70' : ''}`}
                      aria-haspopup="listbox"
                      aria-expanded={categoryMenuOpen}
                    >
                      <span className={`${selectedCategory ? 'text-[#111111] dark:text-white' : 'text-[#94a3b8]'}`}>
                        {filteredCategories.length ? selectedCategoryLabel : "Bu kategoriya uchun subkategoriya yo'q"}
                      </span>
                      <ChevronDown className={`size-4 text-[#94a3b8] transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {categoryMenuOpen && filteredCategories.length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-[22px] border border-black/10 bg-[rgba(255,255,255,0.98)] p-2 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(18,18,18,0.98)] dark:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)]">
                        <div className="soft-scrollbar max-h-60 space-y-1 overflow-y-auto pr-1">
                          {filteredCategories.map((c) => {
                            const active = form.category_id === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => { setForm((p) => ({ ...p, category_id: c.id })); setCategoryMenuOpen(false); }}
                                className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-[14px] transition-colors ${active ? 'bg-[#13ec37] text-[#06200f]' : 'text-[#111111] hover:bg-[#f3f4f6] dark:text-[#d1d5db] dark:hover:bg-white/5 dark:hover:text-white'}`}
                              >
                                {getCategoryLabel(c)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </label>
                <label className="block">
                  <span className={subtleLabelClass}>{p.description}</span>
                  <RichTextEditor
                    value={form.description}
                    onChange={(value) => setForm((p) => ({ ...p, description: value }))}
                    placeholder={p.descriptionPlaceholder}
                  />
                </label>
                {/* Image upload */}
                <div>
                  <span className={subtleLabelClass}>{p.images}</span>
                  <div className={`flex flex-wrap gap-2.5 rounded-[24px] border p-3 ${formErrors.images ? 'border-red-500/80 bg-red-50/40 dark:bg-red-500/10' : 'border-black/10 bg-[#f8fafc] dark:border-white/8 dark:bg-white/[0.02]'}`}>
                    {formImages.map((url, i) => (
                      <div key={i} className="relative h-20 w-20 overflow-hidden rounded-[18px] border border-black/10 bg-white dark:border-white/10 dark:bg-white/5">
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
                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-[18px] border border-dashed border-black/12 bg-white text-[#64748b] transition-all hover:border-[#22c55e]/50 hover:bg-[#22c55e]/8 hover:text-[#16a34a] dark:border-white/15 dark:bg-[#101010] dark:text-[#94a3b8]">
                      {uploadingImg ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Camera size={18} />
                          <span className="text-[9px] font-bold">{p.image}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        disabled={uploadingImg || formImages.length >= MAX_PRODUCT_IMAGES}
                        onChange={(e) => handleImageUpload(e.target.files)}
                      />
                    </label>
                  </div>
                  <p className={`mt-1 text-[12px] ${formErrors.images ? 'text-red-500' : 'text-[#6b7280] dark:text-[#9ca3af]'}`}>
                    {formImages.length}/{MAX_PRODUCT_IMAGES} {p.uploadedImages}
                  </p>
                  {formErrors.images && (
                    <p className="mt-1 text-[12px] text-red-500">
                      {p.imageError.replace('{count}', String(MAX_PRODUCT_IMAGES))}
                    </p>
                  )}
                </div>
              </div>
              {formError && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">{formError}</p>}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => { setCreateOpen(false); setEditProduct(null); setFormImages([]); setParentCategoryMenuOpen(false); setCategoryMenuOpen(false); }}
                  className="flex-1 h-12 rounded-full border border-white/10 bg-black/[0.03] text-[13px] font-black text-[#111111] transition-colors hover:bg-black/[0.05] dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]"
                >
                  {p.cancel}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#13ec37] text-[13px] font-black text-[#052e16] transition-transform hover:translate-y-[-1px] disabled:opacity-60"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {p.save}
                </button>
              </div>
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
