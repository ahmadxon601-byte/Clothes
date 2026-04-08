'use client';

import {
  ArrowDown,
  ArrowUp,
  BadgePercent,
  CheckCircle2,
  Flame,
  Gift,
  Layers3,
  PackagePlus,
  Pencil,
  Plus,
  Save,
  Sparkles,
  TicketPercent,
  Trash2,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection, EmptyState } from '../../../src/features/admin/components/DataViews';
import { getAdminAuthHeaders } from '../../../src/lib/adminApi';
import { useToast } from '../../../src/shared/ui/useToast';
import {
  PRODUCT_QUICK_FILTERS_SETTING_KEY,
  type ProductQuickFilter,
} from '../../../src/shared/lib/productQuickFilters';

type CampaignType =
  | 'trending'
  | 'newest'
  | 'discount_percent'
  | 'buy_x_get_y'
  | 'bundle_price'
  | 'gift'
  | 'free_shipping'
  | 'promo_code'
  | 'flash_sale';

type CampaignStatus = 'active' | 'draft';

type Campaign = {
  id: string;
  name: string;
  label: string;
  type: CampaignType;
  status: CampaignStatus;
  description?: string;
  config: {
    discountPercent?: number;
    buyQty?: number;
    getQty?: number;
    bundleCount?: number;
    bundlePrice?: string;
    giftName?: string;
    promoCode?: string;
    durationHours?: number;
    shippingNote?: string;
  };
};

type FormState = {
  id: string | null;
  name: string;
  label: string;
  type: CampaignType;
  status: CampaignStatus;
  description: string;
  discountPercent: string;
  buyQty: string;
  getQty: string;
  bundleCount: string;
  bundlePrice: string;
  giftName: string;
  promoCode: string;
  durationHours: string;
  shippingNote: string;
};

const CAMPAIGNS_SETTING_KEY = 'marketing_campaigns';

const TYPE_DEFS: Array<{
  type: CampaignType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: 'trending', title: 'Trend aksiya', subtitle: 'Ko‘p ko‘rilgan va ommabop mahsulotlar', icon: TrendingUp },
  { type: 'newest', title: 'Yangi kelganlar', subtitle: 'Yangi qo‘shilgan mahsulotlarni ajratish', icon: Sparkles },
  { type: 'discount_percent', title: 'Foizli chegirma', subtitle: '10%, 30%, 50% kabi aksiyalar', icon: BadgePercent },
  { type: 'buy_x_get_y', title: '1+1 / 2+1 / X+Y', subtitle: 'Sotib ol va bonus mahsulot berish', icon: PackagePlus },
  { type: 'bundle_price', title: 'Set narxi', subtitle: 'Bir nechta mahsulotga umumiy maxsus narx', icon: Layers3 },
  { type: 'gift', title: 'Sovg‘a bilan', subtitle: 'Asosiy xaridga qo‘shimcha sovg‘a', icon: Gift },
  { type: 'free_shipping', title: 'Bepul yetkazish', subtitle: 'Yetkazib berishni aksiya sifatida ko‘rsatish', icon: Truck },
  { type: 'promo_code', title: 'Promo kod', subtitle: 'Maxsus kod bilan chegirma yoki bonus', icon: TicketPercent },
  { type: 'flash_sale', title: 'Flash sale', subtitle: 'Cheklangan soatli yoki qisqa muddatli aksiya', icon: Flame },
];

function createId() {
  return `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyForm(): FormState {
  return {
    id: null,
    name: '',
    label: '',
    type: 'discount_percent',
    status: 'active',
    description: '',
    discountPercent: '',
    buyQty: '1',
    getQty: '1',
    bundleCount: '2',
    bundlePrice: '',
    giftName: '',
    promoCode: '',
    durationHours: '24',
    shippingNote: '',
  };
}

function typeMeta(type: CampaignType) {
  return TYPE_DEFS.find((item) => item.type === type) ?? TYPE_DEFS[0];
}

function normalizeCampaign(raw: unknown): Campaign | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.type !== 'string') return null;
  if (!TYPE_DEFS.some((row) => row.type === item.type)) return null;
  const type = item.type as CampaignType;

  return {
    id: typeof item.id === 'string' && item.id ? item.id : createId(),
    name: typeof item.name === 'string' ? item.name : '',
    label: typeof item.label === 'string' ? item.label : '',
    type,
    status: item.status === 'draft' ? 'draft' : 'active',
    description: typeof item.description === 'string' ? item.description : '',
    config: typeof item.config === 'object' && item.config ? {
      discountPercent: Number((item.config as Record<string, unknown>).discountPercent) || undefined,
      buyQty: Number((item.config as Record<string, unknown>).buyQty) || undefined,
      getQty: Number((item.config as Record<string, unknown>).getQty) || undefined,
      bundleCount: Number((item.config as Record<string, unknown>).bundleCount) || undefined,
      bundlePrice: typeof (item.config as Record<string, unknown>).bundlePrice === 'string' ? (item.config as Record<string, unknown>).bundlePrice as string : undefined,
      giftName: typeof (item.config as Record<string, unknown>).giftName === 'string' ? (item.config as Record<string, unknown>).giftName as string : undefined,
      promoCode: typeof (item.config as Record<string, unknown>).promoCode === 'string' ? (item.config as Record<string, unknown>).promoCode as string : undefined,
      durationHours: Number((item.config as Record<string, unknown>).durationHours) || undefined,
      shippingNote: typeof (item.config as Record<string, unknown>).shippingNote === 'string' ? (item.config as Record<string, unknown>).shippingNote as string : undefined,
    } : {},
  };
}

function parseCampaigns(raw: string | null): Campaign[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCampaign).filter((item): item is Campaign => Boolean(item));
  } catch {
    return [];
  }
}

function swapItems(items: Campaign[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function resolveLabel(form: FormState) {
  if (form.label.trim()) return form.label.trim();
  if (form.type === 'discount_percent' && form.discountPercent) return `${form.discountPercent}%`;
  if (form.type === 'buy_x_get_y') return `${form.buyQty || '1'}+${form.getQty || '1'}`;
  if (form.type === 'bundle_price') return `${form.bundleCount || '2'} talik set`;
  if (form.type === 'gift') return form.giftName.trim() || 'Sovg‘a';
  if (form.type === 'promo_code') return form.promoCode.trim() || 'Promo';
  if (form.type === 'flash_sale') return 'Flash sale';
  if (form.type === 'free_shipping') return 'Bepul yetkazish';
  if (form.type === 'trending') return 'Trendda';
  return 'Eng yangi';
}

function resolveCampaignLabel(item: Campaign) {
  if (item.label.trim()) return item.label.trim();
  if (item.type === 'discount_percent' && item.config.discountPercent) return `${item.config.discountPercent}%`;
  if (item.type === 'buy_x_get_y') return `${item.config.buyQty ?? 1}+${item.config.getQty ?? 1}`;
  if (item.type === 'bundle_price') return `${item.config.bundleCount ?? 2} talik set`;
  if (item.type === 'gift') return item.config.giftName || 'Sovg‘a';
  if (item.type === 'promo_code') return item.config.promoCode || 'Promo';
  if (item.type === 'flash_sale') return 'Flash sale';
  if (item.type === 'free_shipping') return 'Bepul yetkazish';
  if (item.type === 'trending') return 'Trendda';
  return 'Eng yangi';
}

function campaignSummary(item: Campaign) {
  if (item.type === 'discount_percent') return `${item.config.discountPercent ?? 0}% chegirma`;
  if (item.type === 'buy_x_get_y') return `${item.config.buyQty ?? 1} ta ol, ${item.config.getQty ?? 1} ta bonus`;
  if (item.type === 'bundle_price') return `${item.config.bundleCount ?? 2} ta mahsulot, set narxi ${item.config.bundlePrice || 'belgilanmagan'}`;
  if (item.type === 'gift') return `Sovg‘a: ${item.config.giftName || 'nom berilmagan'}`;
  if (item.type === 'promo_code') return `Kod: ${item.config.promoCode || 'yo‘q'}`;
  if (item.type === 'flash_sale') return `${item.config.durationHours ?? 24} soatlik aksiya`;
  if (item.type === 'free_shipping') return item.config.shippingNote || 'Bepul yetkazish';
  if (item.type === 'trending') return 'Ommabop mahsulotlarni ajratadi';
  return 'Yangi qo‘shilgan mahsulotlarni ajratadi';
}

function campaignFieldHint(type: CampaignType) {
  if (type === 'discount_percent') return 'Chegirma foizini kiriting.';
  if (type === 'buy_x_get_y') return 'Nechta mahsulot olinishi va nechta bonus berilishini belgilang.';
  if (type === 'bundle_price') return 'Set ichidagi mahsulot soni va umumiy narxni kiriting.';
  if (type === 'gift') return 'Qaysi sovg‘a berilishini yozing.';
  if (type === 'promo_code') return 'Foydalanuvchi kiritadigan promo kodni belgilang.';
  if (type === 'flash_sale') return 'Aksiya necha soat davom etishini kiriting.';
  if (type === 'free_shipping') return 'Yetkazib berish shartini qisqa yozing.';
  if (type === 'trending') return 'Qo‘shimcha sozlama talab qilinmaydi.';
  return 'Qo‘shimcha sozlama talab qilinmaydi.';
}

function deriveQuickFilters(campaigns: Campaign[]): ProductQuickFilter[] {
  const mapped: Array<ProductQuickFilter | null> = campaigns
    .filter((item) => item.status === 'active')
    .map((item) => {
      const label = resolveCampaignLabel(item);
      if (item.type === 'trending') return { id: item.id, label, mode: 'popular' };
      if (item.type === 'newest') return { id: item.id, label, mode: 'newest' };
      if (item.type === 'discount_percent' && item.config.discountPercent) {
        return { id: item.id, label, mode: 'discount', value: item.config.discountPercent };
      }
      return null;
    });

  return mapped.filter((item): item is ProductQuickFilter => item !== null);
}

function CampaignBadge({ item }: { item: Campaign }) {
  const meta = typeMeta(item.type);
  const Icon = meta.icon;

  return (
    <div className='inline-flex h-10 items-center gap-2.5 rounded-full border border-white/10 bg-[#171717] px-4 text-[13px] font-black text-white shadow-[0_14px_28px_-18px_rgba(0,0,0,0.45)]'>
      <span className='flex h-5 w-5 items-center justify-center rounded-full bg-[#12d220] text-white'>
        <Icon className='size-3.5' />
      </span>
      <span>{resolveCampaignLabel(item)}</span>
    </div>
  );
}

export default function AdminActionsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    let ignore = false;

    fetch(`/api/admin/ui-settings?key=${CAMPAIGNS_SETTING_KEY}`, {
      headers: getAdminAuthHeaders(),
    })
      .then((r) => r.json().catch(() => ({})))
      .then((json) => {
        if (ignore) return;
        const value = json?.data?.value ?? json?.value ?? null;
        setItems(parseCampaigns(value));
      })
      .catch(() => {
        if (!ignore) setItems([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const editing = useMemo(() => items.find((item) => item.id === form.id) ?? null, [form.id, items]);
  const selectedType = typeMeta(form.type);
  const storefrontFilters = useMemo(() => deriveQuickFilters(items), [items]);
  const activeCount = useMemo(() => items.filter((item) => item.status === 'active').length, [items]);

  const canSubmit = useMemo(() => {
    const titleOk = form.name.trim().length > 1;
    if (!titleOk) return false;
    if (form.type === 'discount_percent') return Number(form.discountPercent) > 0 && Number(form.discountPercent) < 100;
    if (form.type === 'buy_x_get_y') return Number(form.buyQty) > 0 && Number(form.getQty) > 0;
    if (form.type === 'bundle_price') return Number(form.bundleCount) > 1 && form.bundlePrice.trim().length > 0;
    if (form.type === 'gift') return form.giftName.trim().length > 0;
    if (form.type === 'promo_code') return form.promoCode.trim().length > 0;
    if (form.type === 'flash_sale') return Number(form.durationHours) > 0;
    return true;
  }, [form]);

  const previewCampaign: Campaign = useMemo(() => ({
    id: 'preview',
    name: form.name.trim() || selectedType.title,
    label: resolveLabel(form),
    type: form.type,
    status: form.status,
    description: form.description.trim(),
    config: {
      discountPercent: Number(form.discountPercent) || undefined,
      buyQty: Number(form.buyQty) || undefined,
      getQty: Number(form.getQty) || undefined,
      bundleCount: Number(form.bundleCount) || undefined,
      bundlePrice: form.bundlePrice.trim() || undefined,
      giftName: form.giftName.trim() || undefined,
      promoCode: form.promoCode.trim() || undefined,
      durationHours: Number(form.durationHours) || undefined,
      shippingNote: form.shippingNote.trim() || undefined,
    },
  }), [form, selectedType.title]);

  const resetForm = () => setForm(emptyForm());

  const fillForm = (item: Campaign) => {
    setForm({
      id: item.id,
      name: item.name,
      label: item.label,
      type: item.type,
      status: item.status,
      description: item.description || '',
      discountPercent: item.config.discountPercent ? String(item.config.discountPercent) : '',
      buyQty: item.config.buyQty ? String(item.config.buyQty) : '1',
      getQty: item.config.getQty ? String(item.config.getQty) : '1',
      bundleCount: item.config.bundleCount ? String(item.config.bundleCount) : '2',
      bundlePrice: item.config.bundlePrice || '',
      giftName: item.config.giftName || '',
      promoCode: item.config.promoCode || '',
      durationHours: item.config.durationHours ? String(item.config.durationHours) : '24',
      shippingNote: item.config.shippingNote || '',
    });
  };

  const saveAll = async (campaigns: Campaign[], successMessage = 'Aksiyalar saqlandi') => {
    setSaving(true);
    try {
      const requests = [
        fetch('/api/admin/ui-settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders(),
          },
          body: JSON.stringify({ key: CAMPAIGNS_SETTING_KEY, value: JSON.stringify(campaigns) }),
        }),
        fetch('/api/admin/ui-settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders(),
          },
          body: JSON.stringify({
            key: PRODUCT_QUICK_FILTERS_SETTING_KEY,
            value: JSON.stringify(deriveQuickFilters(campaigns)),
          }),
        }),
      ];

      const responses = await Promise.all(requests);
      for (const response of responses) {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error ?? body?.message ?? 'Saqlab bo‘lmadi');
      }
      showToast({ message: successMessage, type: 'success' });
      return true;
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : 'Saqlab bo‘lmadi', type: 'error' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitForm = async () => {
    if (!canSubmit) return;

    const nextItem: Campaign = {
      id: form.id ?? createId(),
      name: form.name.trim(),
      label: resolveLabel(form),
      type: form.type,
      status: form.status,
      description: form.description.trim(),
      config: {
        discountPercent: Number(form.discountPercent) || undefined,
        buyQty: Number(form.buyQty) || undefined,
        getQty: Number(form.getQty) || undefined,
        bundleCount: Number(form.bundleCount) || undefined,
        bundlePrice: form.bundlePrice.trim() || undefined,
        giftName: form.giftName.trim() || undefined,
        promoCode: form.promoCode.trim() || undefined,
        durationHours: Number(form.durationHours) || undefined,
        shippingNote: form.shippingNote.trim() || undefined,
      },
    };

    const previousItems = items;
    const nextItems = form.id
      ? items.map((item) => item.id === form.id ? nextItem : item)
      : [...items, nextItem];

    setItems(nextItems);
    const saved = await saveAll(nextItems, form.id ? 'Aksiya yangilandi' : 'Aksiya qo‘shildi');
    if (saved) {
      resetForm();
      return;
    }

    setItems(previousItems);
  };

  const moveItem = async (from: number, to: number) => {
    const nextItems = swapItems(items, from, to);
    if (nextItems === items) return;

    const previousItems = items;
    setItems(nextItems);
    const saved = await saveAll(nextItems, 'Aksiyalar tartibi yangilandi');
    if (!saved) setItems(previousItems);
  };

  const deleteItem = async (id: string) => {
    const previousItems = items;
    const previousForm = form;
    const nextItems = items.filter((row) => row.id !== id);

    setItems(nextItems);
    if (form.id === id) resetForm();

    const saved = await saveAll(nextItems, 'Aksiya o‘chirildi');
    if (!saved) {
      setItems(previousItems);
      setForm(previousForm);
    }
  };

  return (
    <AdminShell
      title='Aksiya konstruktori'
      actions={
        <button
          type='button'
          onClick={() => void saveAll(items)}
          disabled={saving || loading}
          className='admin-btn inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50'
        >
          <Save className='size-4' />
          {saving ? 'Saqlanmoqda...' : 'Barchasini saqlash'}
        </button>
      }
    >
      <AdminPageSection
        title='Aksiya konstruktori'
        description='Sahifani soddalashtirdik: aksiya turini tanlang, kerakli maydonlarni to‘ldiring va saqlang.'
      />

      <div className='marketing-builder grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]'>
        <section className='admin-card overflow-hidden p-0'>
          <div className='border-b border-[var(--admin-border)] bg-[linear-gradient(135deg,rgba(18,210,32,0.12),rgba(18,210,32,0.02)_45%,transparent_85%)] px-5 py-4'>
            <h2 className='text-[20px] font-black text-[var(--admin-fg)]'>{editing ? 'Aksiyani tahrirlash' : 'Yangi aksiya yaratish'}</h2>
            <p className='mt-1 max-w-[44ch] text-[13px] leading-5 text-[var(--admin-muted)]'>
              Faqat kerakli maydonlar ko‘rsatiladi. Murakkab konstruktor o‘rniga oddiy forma ishlaydi.
            </p>
          </div>

          <div className='space-y-5 p-5'>
            <div className='grid gap-3 rounded-[22px] border border-[var(--admin-border)] bg-[var(--admin-pill)] p-4 md:grid-cols-3'>
              <div className='rounded-[18px] border border-[var(--admin-border)] bg-[var(--admin-card)] p-3'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]'>1-qadam</p>
                <p className='mt-1 text-sm font-semibold text-[var(--admin-fg)]'>Turini tanlang</p>
              </div>
              <div className='rounded-[18px] border border-[var(--admin-border)] bg-[var(--admin-card)] p-3'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]'>2-qadam</p>
                <p className='mt-1 text-sm font-semibold text-[var(--admin-fg)]'>Kerakli maydonni to‘ldiring</p>
              </div>
              <div className='rounded-[18px] border border-[var(--admin-border)] bg-[var(--admin-card)] p-3'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]'>3-qadam</p>
                <p className='mt-1 text-sm font-semibold text-[var(--admin-fg)]'>Saqlang va ro‘yxatda tekshiring</p>
              </div>
            </div>

            <div className='grid gap-3 md:grid-cols-2'>
              <label className='block'>
                <span className='mb-1.5 block text-xs font-semibold text-[var(--admin-muted)]'>Aksiya nomi</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className='admin-input h-11 w-full rounded-[16px] px-4'
                  placeholder='Masalan: Yozgi 1+1 kampaniya'
                />
              </label>
            </div>

            <div>
              <div className='mb-2 flex items-center justify-between gap-3'>
                <span className='text-xs font-semibold text-[var(--admin-muted)]'>Aksiya turi</span>
                <span className='rounded-full border border-[var(--admin-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--admin-muted)]'>
                  {selectedType.title}
                </span>
              </div>
              <div className='grid gap-3 md:grid-cols-[minmax(0,220px)_1fr]'>
                <select
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as CampaignType }))}
                  className='admin-input h-11 rounded-[16px] px-4'
                >
                  {TYPE_DEFS.map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.title}
                    </option>
                  ))}
                </select>
                <div className='rounded-[18px] border border-[var(--admin-border)] bg-[var(--admin-pill)] px-4 py-3'>
                  <p className='text-sm font-semibold text-[var(--admin-fg)]'>{selectedType.title}</p>
                  <p className='mt-1 text-xs leading-5 text-[var(--admin-muted)]'>{selectedType.subtitle}</p>
                </div>
              </div>
            </div>

            <div className='grid gap-3 md:grid-cols-2'>
              <label className='block'>
                <span className='mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]'>Holat</span>
                <div className='grid grid-cols-2 gap-2'>
                  {(['active', 'draft'] as CampaignStatus[]).map((status) => (
                    <button
                      key={status}
                      type='button'
                      onClick={() => setForm((prev) => ({ ...prev, status }))}
                      className={form.status === status
                        ? 'rounded-[18px] border border-[#12d220]/40 bg-[linear-gradient(180deg,rgba(18,210,32,0.14),rgba(18,210,32,0.05))] px-4 py-2.5 text-sm font-semibold text-[var(--admin-fg)] transition-all duration-200'
                        : 'rounded-[18px] border border-[var(--admin-border)] bg-[linear-gradient(180deg,rgba(24,41,68,0.92),rgba(20,33,56,0.92))] px-4 py-2.5 text-sm font-semibold text-[var(--admin-muted)] transition-all duration-200 hover:border-[#12d220]/20 hover:text-[var(--admin-fg)]'}
                    >
                      {status === 'active' ? 'Faol' : 'Draft'}
                    </button>
                  ))}
                </div>
              </label>
              <label className='block'>
                <span className='mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]'>Qisqa izoh</span>
                <input
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className='admin-input h-11 rounded-[16px] border-white/8 bg-[linear-gradient(180deg,rgba(24,41,68,0.94),rgba(20,33,56,0.94))] px-4 text-[15px] placeholder:text-[#6f87aa]'
                  placeholder='Ichki tavsif yoki menejer uchun izoh'
                />
              </label>
            </div>

            <div className='rounded-[18px] border border-dashed border-[var(--admin-border)] bg-[var(--admin-pill)] px-4 py-3 text-sm text-[var(--admin-muted)]'>
              {campaignFieldHint(form.type)}
            </div>

            {form.type === 'discount_percent' ? (
              <label className='block'>
                <span className='mb-1.5 block text-xs font-semibold text-[var(--admin-muted)]'>Chegirma foizi</span>
                <input
                  type='number'
                  min='1'
                  max='99'
                  value={form.discountPercent}
                  onChange={(event) => setForm((prev) => ({ ...prev, discountPercent: event.target.value }))}
                  className='admin-input w-full'
                  placeholder='30'
                />
              </label>
            ) : null}

            {form.type === 'buy_x_get_y' ? (
              <div className='grid gap-3 md:grid-cols-2'>
                <label className='block'>
                  <span className='mb-1.5 block text-xs font-semibold text-[var(--admin-muted)]'>Sotib olinadi</span>
                  <input
                    type='number'
                    min='1'
                    value={form.buyQty}
                    onChange={(event) => setForm((prev) => ({ ...prev, buyQty: event.target.value }))}
                    className='admin-input w-full'
                    placeholder='1'
                  />
                </label>
                <label className='block'>
                  <span className='mb-1.5 block text-xs font-semibold text-[var(--admin-muted)]'>Bonus beriladi</span>
                  <input
                    type='number'
                    min='1'
                    value={form.getQty}
                    onChange={(event) => setForm((prev) => ({ ...prev, getQty: event.target.value }))}
                    className='admin-input w-full'
                    placeholder='1'
                  />
                </label>
              </div>
            ) : null}

            {form.type === 'bundle_price' ? (
              <div className='grid gap-3 md:grid-cols-2'>
                <label className='block'>
                  <span className='mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]'>Set ichidagi mahsulot soni</span>
                  <input
                    type='number'
                    min='2'
                    value={form.bundleCount}
                    onChange={(event) => setForm((prev) => ({ ...prev, bundleCount: event.target.value }))}
                    className='admin-input h-11 rounded-[16px] border-white/8 bg-[linear-gradient(180deg,rgba(24,41,68,0.94),rgba(20,33,56,0.94))] px-4 text-[15px]'
                    placeholder='2'
                  />
                </label>
                <label className='block'>
                  <span className='mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]'>Set narxi</span>
                  <input
                    value={form.bundlePrice}
                    onChange={(event) => setForm((prev) => ({ ...prev, bundlePrice: event.target.value }))}
                    className='admin-input h-11 rounded-[16px] border-white/8 bg-[linear-gradient(180deg,rgba(24,41,68,0.94),rgba(20,33,56,0.94))] px-4 text-[15px] placeholder:text-[#8aa0c1]'
                    placeholder='99000 UZS'
                  />
                </label>
              </div>
            ) : null}

            {form.type === 'gift' ? (
              <label className='block'>
                <span className='mb-1.5 block text-xs font-semibold text-[var(--admin-muted)]'>Sovg‘a nomi</span>
                <input
                  value={form.giftName}
                  onChange={(event) => setForm((prev) => ({ ...prev, giftName: event.target.value }))}
                  className='admin-input w-full'
                  placeholder='Masalan: Mini sumka'
                />
              </label>
            ) : null}

            {form.type === 'promo_code' ? (
              <label className='block'>
                <span className='mb-1.5 block text-xs font-semibold text-[var(--admin-muted)]'>Promo kod</span>
                <input
                  value={form.promoCode}
                  onChange={(event) => setForm((prev) => ({ ...prev, promoCode: event.target.value.toUpperCase() }))}
                  className='admin-input w-full'
                  placeholder='SALE30'
                />
              </label>
            ) : null}

            {form.type === 'flash_sale' ? (
              <label className='block'>
                <span className='mb-1.5 block text-xs font-semibold text-[var(--admin-muted)]'>Davomiyligi, soat</span>
                <input
                  type='number'
                  min='1'
                  value={form.durationHours}
                  onChange={(event) => setForm((prev) => ({ ...prev, durationHours: event.target.value }))}
                  className='admin-input w-full'
                  placeholder='24'
                />
              </label>
            ) : null}

            {form.type === 'free_shipping' ? (
              <label className='block'>
                <span className='mb-1.5 block text-xs font-semibold text-[var(--admin-muted)]'>Yetkazish izohi</span>
                <input
                  value={form.shippingNote}
                  onChange={(event) => setForm((prev) => ({ ...prev, shippingNote: event.target.value }))}
                  className='admin-input w-full'
                  placeholder='Toshkent bo‘ylab bepul'
                />
              </label>
            ) : null}

            <div className='rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,41,68,0.98),rgba(18,30,50,0.88))] p-4'>
              <div className='mb-3 flex items-center justify-between gap-3'>
                <div>
                  <p className='text-[11px] font-semibold uppercase tracking-[0.22em] text-[#91a6c6]'>Qisqa preview</p>
                  <p className='mt-1.5 text-[18px] font-black leading-none tracking-tight text-[var(--admin-fg)]'>{previewCampaign.name}</p>
                </div>
                <span className={previewCampaign.status === 'active' ? 'rounded-full border border-[#12d220]/25 bg-[#12d220]/10 px-4 py-1.5 text-[12px] font-semibold text-[#12d220]' : 'rounded-full border border-[var(--admin-border)] bg-[rgba(255,255,255,0.02)] px-4 py-1.5 text-[12px] font-semibold text-[var(--admin-muted)]'}>
                  {previewCampaign.status === 'active' ? 'Faol' : 'Draft'}
                </span>
              </div>
              <div className='rounded-[22px] border border-white/7 bg-[linear-gradient(180deg,rgba(19,29,46,0.55),rgba(19,29,46,0.18))] p-4'>
                <CampaignBadge item={previewCampaign} />
                <p className='mt-3 text-[14px] leading-6 text-[#9eb1cf]'>{campaignSummary(previewCampaign)}</p>
              </div>
            </div>

            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => void submitForm()}
                disabled={!canSubmit}
                className='inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[linear-gradient(180deg,#1f8f4e,#1b7f47)] px-6 text-[15px] font-semibold text-white transition-all duration-200 hover:brightness-105 disabled:opacity-50'
              >
                {editing ? <Pencil className='size-4' /> : <Plus className='size-4' />}
                {editing ? 'Aksiyani yangilash' : 'Aksiya qo‘shish'}
              </button>
              {editing ? (
                <button
                  type='button'
                  onClick={resetForm}
                  className='h-12 rounded-full border border-[var(--admin-border)] bg-[rgba(255,255,255,0.02)] px-5 text-sm font-semibold text-[var(--admin-muted)] transition-colors duration-200 hover:text-[var(--admin-fg)]'
                >
                  Bekor
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className='space-y-6'>
          <div className='admin-card p-5'>
            <div className='mb-4 flex items-center justify-between gap-3'>
              <div>
                <p className='text-sm font-semibold text-[var(--admin-fg)]'>Aksiyalar ro‘yxati</p>
                <p className='mt-1 text-xs text-[var(--admin-muted)]'>Bu yerda yaratilgan aksiyalarni ko‘rasiz, tahrirlaysiz va tartibini o‘zgartirasiz.</p>
              </div>
              <div className='flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--admin-muted)]'>
                <span className='rounded-full border border-[var(--admin-border)] px-3 py-1'>{items.length} ta jami</span>
                <span className='rounded-full border border-[#12d220]/20 bg-[#12d220]/10 px-3 py-1 text-[#12d220]'>{activeCount} ta faol</span>
              </div>
            </div>

            {loading ? (
              <p className='text-sm text-[var(--admin-muted)]'>Yuklanmoqda...</p>
            ) : items.length === 0 ? (
              <EmptyState title='Aksiyalar hali yo‘q' description='Chap tomondagi konstruktordan birinchi aksiyani yarating.' />
            ) : (
              <div className='space-y-3'>
                {items.map((item, index) => {
                  const meta = typeMeta(item.type);
                  const Icon = meta.icon;

                  return (
                    <div key={item.id} className='rounded-[22px] border border-[var(--admin-border)] bg-[var(--admin-pill)] p-4 transition-all'>
                      <div className='flex flex-wrap items-start justify-between gap-4'>
                        <div className='min-w-0 flex-1'>
                          <div className='flex flex-wrap items-center gap-3'>
                            <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--admin-card)] text-[#12d220]'>
                              <Icon className='size-4.5' />
                            </span>
                            <div className='min-w-0 flex-1'>
                              <div className='flex flex-wrap items-center gap-2'>
                                <p className='text-[15px] font-black text-[var(--admin-fg)]'>{item.name}</p>
                                <span className='rounded-full border border-[var(--admin-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--admin-muted)]'>
                                  {meta.title}
                                </span>
                              </div>
                              <p className='mt-1 text-xs text-[var(--admin-muted)]'>{campaignSummary(item)}</p>
                            </div>
                            <span className={item.status === 'active' ? 'rounded-full border border-[#12d220]/25 bg-[#12d220]/10 px-2.5 py-1 text-[11px] font-semibold text-[#12d220]' : 'rounded-full border border-[var(--admin-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--admin-muted)]'}>
                              {item.status === 'active' ? 'Faol' : 'Draft'}
                            </span>
                          </div>
                          <div className='mt-3'>
                            <CampaignBadge item={item} />
                          </div>
                          {item.description ? (
                            <p className='mt-3 text-sm text-[var(--admin-muted)]'>{item.description}</p>
                          ) : null}
                        </div>

                        <div className='flex flex-wrap items-center gap-2'>
                          <button
                            type='button'
                            onClick={() => void moveItem(index, index - 1)}
                            className='flex h-9 w-9 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-fg)]'
                            aria-label='Yuqoriga'
                          >
                            <ArrowUp className='size-4' />
                          </button>
                          <button
                            type='button'
                            onClick={() => void moveItem(index, index + 1)}
                            className='flex h-9 w-9 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-fg)]'
                            aria-label='Pastga'
                          >
                            <ArrowDown className='size-4' />
                          </button>
                          <button
                            type='button'
                            onClick={() => fillForm(item)}
                            className='inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--admin-border)] px-3 text-[12px] font-semibold text-[var(--admin-muted)] transition-colors hover:text-sky-500'
                          >
                            <Pencil className='size-4' />
                            Tahrirlash
                          </button>
                          <button
                            type='button'
                            onClick={() => void deleteItem(item.id)}
                            className='inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--admin-border)] px-3 text-[12px] font-semibold text-[var(--admin-muted)] transition-colors hover:text-rose-500'
                          >
                            <Trash2 className='size-4' />
                            O‘chirish
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className='admin-card overflow-hidden p-0'>
            <div className='border-b border-[var(--admin-border)] px-5 py-4'>
              <p className='text-sm font-semibold text-[var(--admin-fg)]'>Saytda ko‘rinadigan filterlar</p>
              <p className='mt-1 text-xs text-[var(--admin-muted)]'>Faqat faol `Trend`, `Yangi` va foizli aksiyalar mahsulot filteriga chiqadi.</p>
            </div>
            <div className='p-4'>
              <div className='rounded-[20px] border border-[var(--admin-border)] bg-[var(--admin-pill)] p-4'>
                {storefrontFilters.length === 0 ? (
                  <div className='flex items-center gap-2 text-sm text-[var(--admin-muted)]'>
                    <CheckCircle2 className='size-4 text-[#12d220]' />
                    Hozircha storefront filteriga chiqadigan faol aksiya yo‘q.
                  </div>
                ) : (
                  <div className='flex flex-wrap gap-3'>
                    {storefrontFilters.map((item) => (
                      <div key={item.id} className='inline-flex min-h-10 items-center gap-2.5 rounded-full border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-2 text-[13px] font-black leading-4 text-[var(--admin-fg)]'>
                        <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#12d220] text-white'>
                          <BadgePercent className='size-3.5' />
                        </span>
                        <span className='break-words'>{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
