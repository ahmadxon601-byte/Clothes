'use client';

import { Eye, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '../../../src/lib/adminApi';
import { useAdminAuth } from '../../../src/context/AdminAuthContext';
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
  Table,
  TD,
  TH,
  THead,
  TR,
} from '../../../src/features/admin/components/DataViews';
import { useUsers } from '../../../src/features/admin/components/hooks';
import { adminApi } from '../../../src/lib/adminApi';
import { useToast } from '../../../src/shared/ui/useToast';

export default function AdminsPage() {
  const { t } = useAdminI18n();
  const { user: me } = useAdminAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewUser, setViewUser] = useState<User | null>(null);

  const query = useUsers({ page, limit: 16, search, role: 'admin' });
  const demoteMut = useMutation({
    mutationFn: (id: string) => adminApi.updateUser(id, { role: 'user' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'admins'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      showToast({ message: t('settings.removeAdmin'), type: 'success' });
    },
  });

  return (
    <AdminShell title={t('admins.title')}>
      <AdminPageSection title={t('admins.management')} description={t('admins.managementDesc')} />

      <FilterBar>
        <div className='relative min-w-[240px] flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]' />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('users.search')} className='admin-input pl-10' />
        </div>
      </FilterBar>

      {query.isLoading ? (
        <SkeletonRows />
      ) : (query.data?.users.length ?? 0) === 0 ? (
        <EmptyState title={t('admins.empty')} description={t('admins.emptyDesc')} />
      ) : (
        <>
          <DesktopTable>
            <Table>
              <THead>
                <tr>
                  <TH>{t('roles.user')}</TH>
                  <TH>{t('settings.adminLogin')}</TH>
                  <TH>{t('users.added')}</TH>
                  <TH className='text-right'>{t('users.actions')}</TH>
                </tr>
              </THead>
              <tbody>
                {query.data?.users.map((item) => (
                  <TR key={item.id} className='hover:bg-transparent'>
                    <TD>
                      <p className='font-semibold'>{item.name || '-'}</p>
                      <p className='text-xs text-[var(--admin-muted)]'>{item.email}</p>
                    </TD>
                    <TD>{item.name || '-'}</TD>
                    <TD>{new Date(item.created_at).toLocaleDateString()}</TD>
                    <TD className='text-right'>
                      <div className='inline-flex items-center gap-1.5'>
                        <button
                          title="Ko'rish"
                          onClick={() => setViewUser(item)}
                          className='flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] bg-transparent text-[var(--admin-muted)] shadow-none outline-none transition hover:bg-transparent hover:text-[var(--admin-muted)] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          disabled={item.id === me?.id || demoteMut.isPending}
                          onClick={() => demoteMut.mutate(item.id)}
                          className='rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500 hover:shadow-none disabled:opacity-40'
                        >
                          {t('settings.removeAdmin')}
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </DesktopTable>

          <MobileCardList>
            {query.data?.users.map((item) => (
              <MobileCard key={item.id}>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='font-semibold'>{item.name || '-'}</p>
                    <p className='text-sm text-[var(--admin-muted)]'>{item.email}</p>
                  </div>
                </div>
                <p className='mt-2 text-xs text-[var(--admin-muted)]'>{new Date(item.created_at).toLocaleDateString()}</p>
                <div className='mt-3 grid grid-cols-2 gap-2'>
                  <button onClick={() => setViewUser(item)} className='flex items-center justify-center rounded-full border border-[var(--admin-border)] py-2'>
                    <Eye size={12} />
                  </button>
                  <button
                    disabled={item.id === me?.id || demoteMut.isPending}
                    onClick={() => demoteMut.mutate(item.id)}
                    className='rounded-full bg-indigo-500 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 hover:shadow-none disabled:opacity-40'
                  >
                    {t('settings.removeAdmin')}
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

      {viewUser && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='admin-card relative w-full max-w-sm p-6'>
            <button onClick={() => setViewUser(null)} className='absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)]'>
              <X size={14} />
            </button>
            <h2 className='mb-4 text-base font-bold'>{t('admins.title')}</h2>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Ism</span>
                <span className='font-semibold'>{viewUser.name || '—'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Email</span>
                <span className='font-semibold'>{viewUser.email}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Rol</span>
                <span className='font-semibold capitalize'>{viewUser.role}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Qo&apos;shilgan</span>
                <span className='font-semibold'>{new Date(viewUser.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
