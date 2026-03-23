'use client';

import { Eye, Search, ShieldOff, Shield, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminI18n } from '../../../src/context/AdminI18nContext';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import {
  AdminPageSection,
  DesktopTable,
  EmptyState,
  FilterBar,
  MobileCard,
  MobileCardList,
  SkeletonRows,
  StatusBadge,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '../../../src/features/admin/components/DataViews';
import { useStoreMutation, useStores } from '../../../src/features/admin/components/hooks';
import { useToast } from '../../../src/shared/ui/useToast';
import { adminApi } from '../../../src/lib/adminApi';
import type { StoreItem } from '../../../src/lib/adminApi';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--admin-muted)]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export default function ShopsPage() {
  const { t } = useAdminI18n();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewStore, setViewStore] = useState<StoreItem | null>(null);
  const [deleteStore, setDeleteStore] = useState<StoreItem | null>(null);

  const query = useStores({ page, limit: 12, search });
  const mutation = useStoreMutation();
  const { showToast } = useToast();

  const qc = useQueryClient();
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/stores/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'stores'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  async function toggleShop(id: string, isActive: boolean) {
    await mutation.mutateAsync({ id, payload: { is_active: !isActive } });
    showToast({ message: isActive ? t('stores.suspendedMsg') : t('stores.activatedMsg'), type: isActive ? 'error' : 'success' });
  }

  return (
    <AdminShell title={t('stores.title')}>
      <AdminPageSection title={t('stores.management')} description={t('stores.managementDesc')} />

      <FilterBar>
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('stores.searchPlaceholder')} className="admin-input pl-10" />
        </div>
      </FilterBar>

      {query.isLoading ? (
        <SkeletonRows />
      ) : (query.data?.stores.length ?? 0) === 0 ? (
        <EmptyState title={t('stores.empty')} description={t('stores.emptyDesc')} />
      ) : (
        <>
          <DesktopTable>
            <Table>
              <THead>
                <tr>
                  <TH>{t('common.shop')}</TH>
                  <TH>{t('stores.owner')}</TH>
                  <TH>{t('stores.products')}</TH>
                  <TH>{t('common.status')}</TH>
                  <TH className="text-right">{t('users.actions')}</TH>
                </tr>
              </THead>
              <tbody>
                {query.data?.stores.map((item) => (
                  <TR key={item.id} className="hover:bg-transparent">
                    <TD>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-[var(--admin-muted)]">{item.address || t('common.noAddress')}</p>
                    </TD>
                    <TD>
                      <p>{item.owner_name || '-'}</p>
                      <p className="text-xs text-[var(--admin-muted)]">{item.owner_email || '-'}</p>
                    </TD>
                    <TD>{item.product_count}</TD>
                    <TD>
                      <StatusBadge label={item.is_active ? t('common.active') : t('common.suspended')} tone={item.is_active ? 'success' : 'danger'} />
                    </TD>
                    <TD className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button title="Ko'rish" onClick={() => setViewStore(item)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] bg-transparent text-[var(--admin-muted)] shadow-none outline-none transition hover:bg-transparent hover:text-[var(--admin-muted)] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0">
                          <Eye size={14} />
                        </button>
                        <button title={item.is_active ? t('common.suspend') : t('common.activate')} onClick={() => toggleShop(item.id, item.is_active)} className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500 hover:shadow-none">
                          {item.is_active ? t('common.suspend') : t('common.activate')}
                        </button>
                        <button title="O'chirish" onClick={() => setDeleteStore(item)} className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-500 hover:shadow-none">
                          O&apos;chirish
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </DesktopTable>

          <MobileCardList>
            {query.data?.stores.map((item) => (
              <MobileCard key={item.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-[var(--admin-muted)]">{item.owner_name || item.owner_email}</p>
                  </div>
                  <StatusBadge label={item.is_active ? t('common.active') : t('common.suspended')} tone={item.is_active ? 'success' : 'danger'} />
                </div>
                <p className="mt-2 text-xs text-[var(--admin-muted)]">{t('stores.productsCount', { count: item.product_count })}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button onClick={() => setViewStore(item)} className="flex items-center justify-center rounded-full border border-[var(--admin-border)] py-2"><Eye size={12} /></button>
                  <button onClick={() => toggleShop(item.id, item.is_active)} className="flex items-center justify-center rounded-full border border-[var(--admin-border)] py-2">
                    {item.is_active ? <ShieldOff size={12} /> : <Shield size={12} />}
                  </button>
                  <button onClick={() => setDeleteStore(item)} className="flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/30 py-2 text-rose-500"><Trash2 size={12} /></button>
                </div>
              </MobileCard>
            ))}
          </MobileCardList>
        </>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button disabled={page <= 1} className="rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm disabled:opacity-50" onClick={() => setPage((p) => Math.max(p - 1, 1))}>{t('common.previous')}</button>
        <button className="rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm" onClick={() => setPage((p) => p + 1)}>{t('common.next')}</button>
      </div>

      {/* View modal */}
      {viewStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="admin-card relative w-full max-w-sm p-6">
            <button onClick={() => setViewStore(null)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)]"><X size={14} /></button>
            <h2 className="mb-4 text-base font-bold">Do&apos;kon ma&apos;lumotlari</h2>
            <div className="space-y-3 text-sm">
              <Row label="Nomi" value={viewStore.name} />
              <Row label="Egasi" value={viewStore.owner_name || '—'} />
              <Row label="Email" value={viewStore.owner_email || '—'} />
              <Row label="Manzil" value={viewStore.address || '—'} />
              <Row label="Mahsulotlar" value={String(viewStore.product_count)} />
              <div className="flex justify-between">
                <span className="text-[var(--admin-muted)]">Holat</span>
                <StatusBadge label={viewStore.is_active ? t('common.active') : t('common.suspended')} tone={viewStore.is_active ? 'success' : 'danger'} />
              </div>
              <Row label="Sana" value={new Date(viewStore.created_at).toLocaleDateString()} />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="admin-card w-full max-w-sm p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500"><Trash2 size={22} /></div>
            <h2 className="text-base font-bold">Do&apos;konni o&apos;chirish</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]"><span className="font-semibold text-[var(--admin-fg)]">{deleteStore.name}</span> o&apos;chirilsinmi?</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setDeleteStore(null)} className="flex-1 rounded-full border border-[var(--admin-border)] py-2 text-sm">Bekor</button>
              <button onClick={async () => { await deleteMut.mutateAsync(deleteStore.id); showToast({ message: "O'chirildi", type: 'error' }); setDeleteStore(null); }} disabled={deleteMut.isPending} className="flex-1 rounded-full bg-rose-500 py-2 text-sm font-semibold text-white disabled:opacity-50">O&apos;chirish</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
