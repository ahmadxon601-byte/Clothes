'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Loader2, Megaphone, Plus, Store, Trash2, X } from 'lucide-react';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { adminApi } from '../../../src/lib/adminApi';
import { useToast } from '../../../src/shared/ui/useToast';
import { useSSERefetch } from '../../../src/shared/hooks/useSSERefetch';

type StoreItem = { id: string; name: string; owner_name?: string | null };
type Campaign = {
  id: string;
  title: string;
  message: string | null;
  status: string;
  starts_at: string;
  ends_at: string;
  total_invites?: number;
  accepted_invites?: number;
  pending_invites?: number;
  selected_products?: number;
};

export default function DailyDealsAdminPage() {
  const { showToast } = useToast();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmCampaign, setConfirmCampaign] = useState<Campaign | null>(null);
  const [form, setForm] = useState({
    title: 'Qulaymarket chegirmasi',
    message: "Qulaymarket bugun chegirma o'tkazmoqda. Tovaringizni qo'shishni istaysizmi?",
    starts_at: '',
    ends_at: '',
    store_ids: [] as string[],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [storesRes, campaignsRes] = await Promise.all([
        adminApi.get<{ stores: StoreItem[] }>('/api/admin/stores?limit=100'),
        adminApi.get<{ campaigns: Campaign[] }>('/api/admin/daily-deals?limit=20'),
      ]);
      setStores(storesRes.stores ?? []);
      setCampaigns(campaignsRes.campaigns ?? []);
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : "Ma'lumotlarni yuklab bo'lmadi", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const toLocal = (d: Date) => {
      const pad = (v: number) => String(v).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setForm((prev) => ({ ...prev, starts_at: prev.starts_at || toLocal(now), ends_at: prev.ends_at || toLocal(end) }));
    void loadData();
  }, []);

  useSSERefetch(['daily_deals'], () => {
    void loadData();
  });

  const submit = async () => {
    if (!form.title.trim() || !form.message.trim() || !form.starts_at || !form.ends_at) return;
    setSaving(true);
    try {
      await adminApi.post('/api/admin/daily-deals', form);
      showToast({ message: 'Chegirma muvaffaqiyatli yaratildi', type: 'success' });
      setForm((prev) => ({ ...prev, store_ids: [] }));
      await loadData();
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : "Chegirmani yaratib bo'lmadi", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const removeCampaign = async (id: string) => {
    setDeletingId(id);
    try {
      await adminApi.delete(`/api/admin/daily-deals/${id}`);
      setCampaigns((prev) => prev.filter((campaign) => campaign.id !== id));
      showToast({ message: "Chegirma o'chirildi", type: 'success' });
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : "Chegirmani o'chirib bo'lmadi", type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminShell title='Chegirma yaratish'>
      <div className='space-y-6'>
        <section className='admin-card p-5'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='grid size-11 place-items-center rounded-2xl bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]'>
              <Megaphone className='size-5' />
            </div>
            <div>
              <h2 className='text-lg font-bold'>Yangi chegirma yaratish</h2>
              <p className='text-sm text-[var(--admin-muted)]'>Do'konlarga taklif yuboriladi, ular mahsulot tanlab qatnashadi.</p>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <input className='admin-input' value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder='Chegirma nomi' />
            <input className='admin-input' type='datetime-local' value={form.starts_at} onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))} />
            <textarea className='admin-input min-h-28 md:col-span-2' value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Do'konlarga yuboriladigan matn" />
            <input className='admin-input' type='datetime-local' value={form.ends_at} onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))} />

            <div className='rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)] p-4 md:col-span-2'>
              <p className='mb-3 text-sm font-semibold'>Taklif yuboriladigan do'konlar</p>
              <div className='grid gap-2 md:grid-cols-2 xl:grid-cols-3'>
                {stores.map((store) => {
                  const checked = form.store_ids.includes(store.id);
                  return (
                    <label key={store.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 text-sm ${checked ? 'border-[var(--admin-accent)] bg-[var(--admin-card)]' : 'border-[var(--admin-border)] bg-[var(--admin-card)]/70'}`}>
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            store_ids: e.target.checked ? [...prev.store_ids, store.id] : prev.store_ids.filter((id) => id !== store.id),
                          }))
                        }
                      />
                      <span className='min-w-0 truncate'>{store.name}</span>
                    </label>
                  );
                })}
              </div>
              <p className='mt-2 text-xs text-[var(--admin-muted)]'>Hech narsa tanlanmasa barcha faol do'konlarga yuboriladi.</p>
            </div>
          </div>

          <div className='mt-4'>
            <button onClick={submit} disabled={saving} className='admin-btn rounded-full'>
              {saving ? <Loader2 className='size-4 animate-spin' /> : <Plus className='size-4' />}
              Chegirma yaratish
            </button>
          </div>
        </section>

        <section className='admin-card p-5'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-bold'>Yaratilgan chegirmalar</h2>
            {loading ? <Loader2 className='size-4 animate-spin text-[var(--admin-muted)]' /> : null}
          </div>
          <div className='grid gap-3'>
            {campaigns.map((campaign) => (
              <div key={campaign.id} className='rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)] p-4'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div>
                    <p className='text-base font-bold'>{campaign.title}</p>
                    <p className='mt-1 text-sm text-[var(--admin-muted)]'>{campaign.message}</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='admin-chip'>{campaign.status}</span>
                    <button
                      type='button'
                      onClick={() => setConfirmCampaign(campaign)}
                      disabled={deletingId === campaign.id}
                      className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400 transition-colors hover:bg-rose-500/20 disabled:opacity-60'
                      title="Chegirmani o'chirish"
                    >
                      {deletingId === campaign.id ? <Loader2 className='size-4 animate-spin' /> : <Trash2 className='size-4' />}
                    </button>
                  </div>
                </div>
                <div className='mt-3 flex flex-wrap gap-2 text-xs text-[var(--admin-muted)]'>
                  <span className='inline-flex items-center gap-1 rounded-full bg-[var(--admin-card)] px-3 py-1'><CalendarDays className='size-3.5' /> {new Date(campaign.starts_at).toLocaleString()}</span>
                  <span className='inline-flex items-center gap-1 rounded-full bg-[var(--admin-card)] px-3 py-1'><CalendarDays className='size-3.5' /> {new Date(campaign.ends_at).toLocaleString()}</span>
                  <span className='inline-flex items-center gap-1 rounded-full bg-[var(--admin-card)] px-3 py-1'><Store className='size-3.5' /> {campaign.total_invites ?? 0} do'kon</span>
                  <span className='inline-flex items-center gap-1 rounded-full bg-[var(--admin-card)] px-3 py-1'>{campaign.accepted_invites ?? 0} qabul qildi</span>
                  <span className='inline-flex items-center gap-1 rounded-full bg-[var(--admin-card)] px-3 py-1'>{campaign.selected_products ?? 0} mahsulot tanlandi</span>
                </div>
              </div>
            ))}
            {!loading && campaigns.length === 0 ? <p className='text-sm text-[var(--admin-muted)]'>Hali chegirma yo'q.</p> : null}
          </div>
        </section>
      </div>

      {confirmCampaign ? (
        <div className='fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
          <div className='admin-card w-full max-w-md rounded-[28px] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)]'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-400'>
                  <Trash2 className='size-5' />
                </div>
                <h3 className='text-xl font-bold text-[var(--admin-text)]'>Chegirmani o'chirish</h3>
                <p className='mt-2 text-sm leading-6 text-[var(--admin-muted)]'>
                  <span className='font-semibold text-[var(--admin-text)]'>{confirmCampaign.title}</span> rostdan ham o'chirilsinmi?
                  Bu amal qaytarilmaydi.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setConfirmCampaign(null)}
                className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-text)]'
              >
                <X className='size-4' />
              </button>
            </div>

            <div className='mt-6 flex items-center justify-center gap-3'>
              <button
                type='button'
                onClick={() => setConfirmCampaign(null)}
                className='inline-flex h-11 items-center justify-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-card)] px-5 text-sm font-semibold text-[var(--admin-text)] transition-colors hover:bg-[var(--admin-pill)]'
              >
                Bekor
              </button>
              <button
                type='button'
                onClick={async () => {
                  const id = confirmCampaign.id;
                  setConfirmCampaign(null);
                  await removeCampaign(id);
                }}
                className='inline-flex h-11 items-center justify-center rounded-full bg-rose-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-rose-400'
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
