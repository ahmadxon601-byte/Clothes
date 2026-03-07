'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
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
import { ReasonDialog } from '../../../src/features/admin/components/ReasonDialog';
import { useUserMutation, useUsers } from '../../../src/features/admin/components/hooks';
import { useToast } from '../../../src/shared/ui/useToast';

export default function UsersPage() {
  const { t } = useAdminI18n();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [targetUser, setTargetUser] = useState<{ id: string; banned: boolean } | null>(null);
  const query = useUsers({ page, limit: 16, search, role });
  const mutation = useUserMutation();
  const { showToast } = useToast();

  return (
    <AdminShell title={t('users.title')}>
      <AdminPageSection title={t('users.management')} description={t('users.managementDesc')} />

      <FilterBar>
        <div className='relative min-w-[240px] flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]' />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('users.search')} className='admin-input pl-10' />
        </div>
        <select className='admin-input max-w-[220px]' value={role} onChange={(e) => setRole(e.target.value)}>
          <option value=''>{t('common.allRoles')}</option>
          <option value='user'>{t('roles.user')}</option>
          <option value='seller'>Seller</option>
          <option value='admin'>Admin</option>
        </select>
      </FilterBar>

      {query.isLoading ? (
        <SkeletonRows />
      ) : (query.data?.users.length ?? 0) === 0 ? (
        <EmptyState title={t('users.empty')} description={t('users.emptyDesc')} />
      ) : (
        <>
          <DesktopTable>
            <Table>
              <THead>
                <tr>
                  <TH>{t('roles.user')}</TH>
                  <TH>{t('common.role')}</TH>
                  <TH>{t('users.added')}</TH>
                  <TH>{t('common.status')}</TH>
                  <TH className='text-right'>{t('users.actions')}</TH>
                </tr>
              </THead>
              <tbody>
                {query.data?.users.map((item) => {
                  const banned = Boolean(item.is_banned);
                  return (
                    <TR key={item.id}>
                      <TD>
                        <p className='font-semibold'>{item.name || '-'}</p>
                        <p className='text-xs text-[var(--admin-muted)]'>{item.email}</p>
                      </TD>
                      <TD>{item.role}</TD>
                      <TD>{new Date(item.created_at).toLocaleDateString()}</TD>
                      <TD>
                        <StatusBadge label={banned ? t('common.banned') : t('common.active')} tone={banned ? 'danger' : 'success'} />
                      </TD>
                      <TD className='text-right'>
                        <button
                          disabled={item.role === 'admin'}
                          className='rounded-full border border-[var(--admin-border)] px-3 py-1 text-xs disabled:opacity-40'
                          onClick={() => setTargetUser({ id: item.id, banned })}
                        >
                          {banned ? t('common.unban') : t('common.ban')}
                        </button>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </DesktopTable>

          <MobileCardList>
            {query.data?.users.map((item) => {
              const banned = Boolean(item.is_banned);
              return (
                <MobileCard key={item.id}>
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <p className='font-semibold'>{item.name || '-'}</p>
                      <p className='text-sm text-[var(--admin-muted)]'>{item.email}</p>
                    </div>
                    <StatusBadge label={banned ? t('common.banned') : t('common.active')} tone={banned ? 'danger' : 'success'} />
                  </div>
                  <div className='mt-2 flex items-center justify-between text-xs text-[var(--admin-muted)]'>
                    <span>{item.role}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    disabled={item.role === 'admin'}
                    className='mt-3 w-full rounded-full border border-[var(--admin-border)] py-2 text-xs font-semibold disabled:opacity-40'
                    onClick={() => setTargetUser({ id: item.id, banned })}
                  >
                    {banned ? t('common.unban') : t('common.ban')}
                  </button>
                </MobileCard>
              );
            })}
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
        open={Boolean(targetUser)}
        title={targetUser?.banned ? t('users.unbanTitle') : t('users.banTitle')}
        confirmLabel={targetUser?.banned ? t('common.unban') : t('common.ban')}
        onClose={() => setTargetUser(null)}
        onConfirm={async (reason) => {
          if (!targetUser) return;
          await mutation.mutateAsync({ id: targetUser.id, payload: { is_banned: !targetUser.banned, reason } });
          showToast({ message: targetUser.banned ? t('users.unbannedMsg') : t('users.bannedMsg'), type: targetUser.banned ? 'success' : 'error' });
        }}
      />
    </AdminShell>
  );
}
