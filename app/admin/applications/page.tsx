'use client';

import { Filter, Search } from 'lucide-react';
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
import { useApplications, useUpdateApplication } from '../../../src/features/admin/components/hooks';
import { useToast } from '../../../src/shared/ui/useToast';

export default function ApplicationsPage() {
  const { t } = useAdminI18n();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const { showToast } = useToast();

  const query = useApplications({ page, limit: 12, status, search });
  const mutation = useUpdateApplication();

  const appliedFilters = useMemo(() => [search ? `Search: ${search}` : '', status ? `Status: ${status}` : ''].filter(Boolean), [search, status]);
  const statusLabel = (value: string) => {
    if (value === 'pending') return t('applications.pending');
    if (value === 'approved') return t('applications.approved');
    if (value === 'rejected') return t('applications.rejected');
    return value;
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
      ) : (query.data?.requests.length ?? 0) === 0 ? (
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
                {query.data?.requests.map((item) => (
                  <TR key={item.id} className='hover:bg-transparent'>
                    <TD>
                      <p className='font-semibold'>{item.store_name}</p>
                      <p className='text-xs font-semibold text-[var(--admin-muted)]'>
                        {item.request_type === 'store_update' ? "Do'kon tahriri" : "Yangi do'kon"}
                      </p>
                      <p className='text-xs text-[var(--admin-muted)]'>{item.store_address || t('common.noAddress')}</p>
                    </TD>
                    <TD>{item.user_name || item.user_email}</TD>
                    <TD>{item.store_phone || '-'}</TD>
                    <TD>
                      <StatusBadge label={statusLabel(item.status)} tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'} />
                    </TD>
                    <TD className='text-right'>
                      <div className='inline-flex gap-2'>
                        <button
                          className='rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500 hover:shadow-none'
                          onClick={() => mutation.mutate({ id: item.id, status: 'approved' }, { onSuccess: () => showToast({ message: t('applications.approvedMsg'), type: 'success' }) })}
                        >
                          {t('applications.approve')}
                        </button>
                        <button className='rounded-full bg-rose-500 px-3 py-1 text-xs text-white transition hover:bg-rose-500 hover:shadow-none' onClick={() => setRejectId(item.id)}>
                          {t('applications.reject')}
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </DesktopTable>

          <MobileCardList>
            {query.data?.requests.map((item) => (
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
                <div className='mt-3 flex gap-2'>
                  <button
                    className='flex-1 rounded-full bg-emerald-500 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 hover:shadow-none'
                    onClick={() => mutation.mutate({ id: item.id, status: 'approved' }, { onSuccess: () => showToast({ message: t('applications.approvedMsg'), type: 'success' }) })}
                  >
                    {t('applications.approve')}
                  </button>
                  <button className='flex-1 rounded-full bg-rose-500 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 hover:shadow-none' onClick={() => setRejectId(item.id)}>
                    {t('applications.reject')}
                  </button>
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
