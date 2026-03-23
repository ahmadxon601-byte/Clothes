'use client';

import { Eye, Filter, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAdminI18n } from '../../../src/context/AdminI18nContext';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import {
  AdminPageSection,
  DesktopTable,
  EmptyState,
  FilterBar,
  MobileCard,
  MobileCardList,
  MobileFilterSheet,
  SkeletonRows,
  StatusBadge,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '../../../src/features/admin/components/DataViews';
import { ReasonDialog } from '../../../src/features/admin/components/ReasonDialog';
import { useApplications, useStoreMutation, useUpdateApplication } from '../../../src/features/admin/components/hooks';
import { useToast } from '../../../src/shared/ui/useToast';

export default function ApplicationsPage() {
  const { t } = useAdminI18n();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [viewRequestId, setViewRequestId] = useState<string | null>(null);
  const { showToast } = useToast();

  const query = useApplications({ page, limit: 12, status, search });
  const mutation = useUpdateApplication();
  const storeMutation = useStoreMutation();

  const appliedFilters = useMemo(() => [search ? `Search: ${search}` : '', status ? `Status: ${status}` : ''].filter(Boolean), [search, status]);
  const requests = useMemo(() => {
    const items = query.data?.requests ?? [];
    const latestByKey = new Map<string, (typeof items)[number]>();
    const signature = (parts: Array<string | null | undefined>) =>
      parts.map((part) => (part ?? '').trim().toLowerCase()).join('|');

    const updateKeyByCurrentStore = new Map<string, string>();
    for (const item of items) {
      if (item.request_type !== 'store_update') continue;
      const currentStoreSignature = signature([
        item.user_email,
        item.current_store_name,
        item.current_store_phone,
        item.current_store_address,
      ]);
      const stableKey = item.target_store_id ? `store:${item.target_store_id}` : `store-update:${currentStoreSignature}`;
      updateKeyByCurrentStore.set(currentStoreSignature, stableKey);
    }

    const logicalKey = (item: (typeof items)[number]) => {
      if (item.request_type === 'store_update') {
        const currentStoreSignature = signature([
          item.user_email,
          item.current_store_name,
          item.current_store_phone,
          item.current_store_address,
        ]);
        return item.target_store_id ? `store:${item.target_store_id}` : `store-update:${currentStoreSignature}`;
      }

      const createdStoreSignature = signature([
        item.user_email,
        item.store_name,
        item.store_phone,
        item.store_address,
      ]);

      return updateKeyByCurrentStore.get(createdStoreSignature) ?? `store-create:${createdStoreSignature}`;
    };

    for (const item of items) {
      const key = logicalKey(item);
      const existing = latestByKey.get(key);
      if (!existing || new Date(item.created_at).getTime() > new Date(existing.created_at).getTime()) {
        latestByKey.set(key, item);
      }
    }

    return Array.from(latestByKey.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [query.data?.requests]);
  const statusLabel = (value: string) => {
    if (value === 'pending') return t('applications.pending');
    if (value === 'approved') return t('applications.approved');
    if (value === 'rejected') return t('applications.rejected');
    return value;
  };
  const requestChanges = (item: NonNullable<typeof query.data>['requests'][number]) => {
    if (item.request_type !== 'store_update') return [];

    const changes: Array<{ label: string; value: string }> = [];
    if ((item.current_store_name ?? '') !== (item.store_name ?? '')) {
      changes.push({ label: "Do'kon", value: `${item.current_store_name || '-'} -> ${item.store_name || '-'}` });
    }
    if ((item.current_store_phone ?? '') !== (item.store_phone ?? '')) {
      changes.push({ label: 'Telefon', value: `${item.current_store_phone || '-'} -> ${item.store_phone || '-'}` });
    }
    if ((item.current_store_address ?? '') !== (item.store_address ?? '')) {
      changes.push({ label: 'Manzil', value: `${item.current_store_address || '-'} -> ${item.store_address || '-'}` });
    }
    if ((item.current_store_description ?? '') !== (item.store_description ?? '')) {
      changes.push({ label: 'Tavsif', value: `${item.current_store_description || '-'} -> ${item.store_description || '-'}` });
    }

    return changes;
  };
  const viewRequest = requests.find((item) => item.id === viewRequestId) ?? null;
  const toggleStore = (item: NonNullable<typeof query.data>['requests'][number]) => {
    if (!item.store_id || item.store_is_active == null) return;
    storeMutation.mutate(
      { id: item.store_id, payload: { is_active: !item.store_is_active } },
      {
        onSuccess: () =>
          showToast({
            message: item.store_is_active ? t('stores.suspendedMsg') : t('stores.activatedMsg'),
            type: item.store_is_active ? 'info' : 'success',
          }),
      }
    );
  };

  return (
    <AdminShell
      title={t('applications.title')}
      actions={
        <button onClick={() => setShowFilters(true)} className='rounded-full border border-[var(--admin-border)] bg-[var(--admin-pill)] px-3 py-2 text-xs font-semibold lg:hidden'>
          <Filter className='mr-1 inline size-4' /> {t('applications.filter')}
        </button>
      }
    >
      <AdminPageSection title={t('applications.shopApplications')} description={t('applications.shopApplicationsDesc')} />

      <FilterBar>
        <div className='relative min-w-[240px] flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]' />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('applications.searchPlaceholder')} className='admin-input pl-10' />
        </div>
        <select className='admin-input max-w-[220px]' value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value=''>{t('applications.allStatuses')}</option>
          <option value='pending'>{t('applications.pending')}</option>
          <option value='approved'>{t('applications.approved')}</option>
          <option value='rejected'>{t('applications.rejected')}</option>
        </select>
      </FilterBar>

      <MobileFilterSheet open={showFilters} onClose={() => setShowFilters(false)} applied={appliedFilters}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('applications.searchPlaceholder')} className='admin-input' />
        <select className='admin-input' value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value=''>{t('applications.allStatuses')}</option>
          <option value='pending'>{t('applications.pending')}</option>
          <option value='approved'>{t('applications.approved')}</option>
          <option value='rejected'>{t('applications.rejected')}</option>
        </select>
      </MobileFilterSheet>

      {query.isLoading ? (
        <SkeletonRows />
      ) : requests.length === 0 ? (
        <EmptyState title={t('applications.empty')} description={t('applications.emptyDesc')} />
      ) : (
        <>
          <DesktopTable>
            <Table>
              <THead>
                <tr>
                  <TH>{t('common.shop')}</TH>
                  <TH>{t('applications.requester')}</TH>
                  <TH>{t('applications.contact')}</TH>
                  <TH>{t('common.status')}</TH>
                  <TH className='text-right'>{t('users.actions')}</TH>
                </tr>
              </THead>
              <tbody>
                {requests.map((item) => (
                  <TR key={item.id} className='hover:bg-transparent'>
                    <TD>
                      <p className='font-semibold'>{item.store_name}</p>
                      <p className='text-xs font-semibold text-[var(--admin-muted)]'>
                        {item.request_type === 'store_update' ? "Do'kon tahriri" : "Yangi do'kon"}
                      </p>
                      <p className='text-xs text-[var(--admin-muted)]'>{item.store_address || t('common.noAddress')}</p>
                      {requestChanges(item).length > 0 ? (
                        <div className='mt-2 space-y-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-pill)] p-2'>
                          {requestChanges(item).map((change) => (
                            <p key={`${item.id}-${change.label}`} className='text-[11px] text-[var(--admin-muted)]'>
                              <span className='font-semibold text-[var(--admin-text)]'>{change.label}:</span> {change.value}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </TD>
                    <TD>{item.user_name || item.user_email}</TD>
                    <TD>{item.store_phone || '-'}</TD>
                    <TD>
                      <StatusBadge label={statusLabel(item.status)} tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'} />
                    </TD>
                    <TD className='text-right'>
                      <div className='inline-flex items-center gap-2'>
                        <button
                          title="Ko'rish"
                          onClick={() => setViewRequestId(item.id)}
                          className='flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] bg-transparent text-[var(--admin-muted)] shadow-none outline-none transition-colors hover:bg-transparent hover:text-[var(--admin-fg)] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'
                        >
                          <Eye size={14} />
                        </button>
                        {item.status === 'pending' ? (
                          <>
                            <button
                              className='rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500 hover:shadow-none'
                              onClick={() => mutation.mutate({ id: item.id, status: 'approved' }, { onSuccess: () => showToast({ message: t('applications.approvedMsg'), type: 'success' }) })}
                            >
                              {t('applications.approve')}
                            </button>
                            <button className='rounded-full bg-rose-500 px-3 py-1 text-xs text-white transition hover:bg-rose-500 hover:shadow-none' onClick={() => setRejectId(item.id)}>
                              {t('applications.reject')}
                            </button>
                          </>
                        ) : item.status === 'approved' && item.store_id ? (
                          <button
                            className='rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500 hover:shadow-none'
                            onClick={() => toggleStore(item)}
                          >
                            {item.store_is_active ? t('common.suspend') : t('common.activate')}
                          </button>
                        ) : null}
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </DesktopTable>

          <MobileCardList>
            {requests.map((item) => (
              <MobileCard key={item.id}>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='font-semibold'>{item.store_name}</p>
                    <p className='text-xs font-semibold text-[var(--admin-muted)]'>
                      {item.request_type === 'store_update' ? "Do'kon tahriri" : "Yangi do'kon"}
                    </p>
                    <p className='text-sm text-[var(--admin-muted)]'>{item.user_name || item.user_email}</p>
                  </div>
                  <StatusBadge label={statusLabel(item.status)} tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'} />
                </div>
                <p className='mt-2 text-xs text-[var(--admin-muted)]'>{item.store_address || t('common.noAddress')}</p>
                {requestChanges(item).length > 0 ? (
                  <div className='mt-2 space-y-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-pill)] p-2'>
                    {requestChanges(item).map((change) => (
                      <p key={`${item.id}-${change.label}`} className='text-[11px] text-[var(--admin-muted)]'>
                        <span className='font-semibold text-[var(--admin-text)]'>{change.label}:</span> {change.value}
                      </p>
                    ))}
                  </div>
                ) : null}
                <div className='mt-3 grid grid-cols-3 gap-2'>
                  <button
                    className='flex items-center justify-center rounded-full border border-[var(--admin-border)] py-2 text-[var(--admin-muted)]'
                    onClick={() => setViewRequestId(item.id)}
                    title="Ko'rish"
                  >
                    <Eye size={12} />
                  </button>
                  {item.status === 'pending' ? (
                    <>
                      <button
                        className='rounded-full bg-emerald-500 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 hover:shadow-none'
                        onClick={() => mutation.mutate({ id: item.id, status: 'approved' }, { onSuccess: () => showToast({ message: t('applications.approvedMsg'), type: 'success' }) })}
                      >
                        {t('applications.approve')}
                      </button>
                      <button className='rounded-full bg-rose-500 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 hover:shadow-none' onClick={() => setRejectId(item.id)}>
                        {t('applications.reject')}
                      </button>
                    </>
                  ) : item.status === 'approved' && item.store_id ? (
                    <button
                      className='col-span-2 rounded-full bg-indigo-500 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 hover:shadow-none'
                      onClick={() => toggleStore(item)}
                    >
                      {item.store_is_active ? t('common.suspend') : t('common.activate')}
                    </button>
                  ) : (
                    <div className='col-span-2' />
                  )}
                </div>
              </MobileCard>
            ))}
          </MobileCardList>
        </>
      )}

      <div className='mt-4 flex justify-end gap-2'>
        <button disabled={page <= 1} className='rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm disabled:opacity-50' onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
          {t('common.previous')}
        </button>
        <button className='rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm' onClick={() => setPage((prev) => prev + 1)}>
          {t('common.next')}
        </button>
      </div>

      {viewRequest && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='admin-card relative w-full max-w-lg p-6'>
            <button
              onClick={() => setViewRequestId(null)}
              className='absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] bg-transparent text-[var(--admin-muted)] shadow-none outline-none transition-colors hover:bg-transparent hover:text-[var(--admin-fg)] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'
              aria-label="Yopish"
            >
              <X size={14} />
            </button>
            <h2 className='mb-1 text-base font-bold'>
              {viewRequest.request_type === 'store_update' ? "Do'kon o'zgarishlari" : "Do'kon ma'lumotlari"}
            </h2>
            <p className='mb-4 text-sm text-[var(--admin-muted)]'>{viewRequest.user_name || viewRequest.user_email}</p>

            {viewRequest.request_type === 'store_update' ? (
              <div className='space-y-3'>
                <div className='rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)] p-4'>
                  <p className='mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]'>Joriy ma'lumotlar</p>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Nomi</span><span className='text-right font-semibold'>{viewRequest.current_store_name || '-'}</span></div>
                    <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Telefon</span><span className='text-right font-semibold'>{viewRequest.current_store_phone || '-'}</span></div>
                    <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Manzil</span><span className='text-right font-semibold'>{viewRequest.current_store_address || '-'}</span></div>
                    <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Tavsif</span><span className='text-right font-semibold'>{viewRequest.current_store_description || '-'}</span></div>
                  </div>
                </div>
                <div className='rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)] p-4'>
                  <p className='mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]'>Yangi ma'lumotlar</p>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Nomi</span><span className='text-right font-semibold'>{viewRequest.store_name || '-'}</span></div>
                    <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Telefon</span><span className='text-right font-semibold'>{viewRequest.store_phone || '-'}</span></div>
                    <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Manzil</span><span className='text-right font-semibold'>{viewRequest.store_address || '-'}</span></div>
                    <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Tavsif</span><span className='text-right font-semibold'>{viewRequest.store_description || '-'}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)] p-4'>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Nomi</span><span className='text-right font-semibold'>{viewRequest.store_name || '-'}</span></div>
                  <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Telefon</span><span className='text-right font-semibold'>{viewRequest.store_phone || '-'}</span></div>
                  <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Manzil</span><span className='text-right font-semibold'>{viewRequest.store_address || '-'}</span></div>
                  <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Tavsif</span><span className='text-right font-semibold'>{viewRequest.store_description || '-'}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ReasonDialog
        open={Boolean(rejectId)}
        title={t('applications.rejectTitle')}
        confirmLabel={t('applications.reject')}
        onClose={() => setRejectId(null)}
        onConfirm={async (reason) => {
          if (!rejectId) return;
          await mutation.mutateAsync({ id: rejectId, status: 'rejected', reason });
          showToast({ message: t('applications.rejectedMsg'), type: 'info' });
        }}
      />
    </AdminShell>
  );
}
