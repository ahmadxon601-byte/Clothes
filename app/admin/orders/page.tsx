'use client';

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
import { useOrderMutation, useOrders } from '../../../src/features/admin/components/hooks';

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const { t } = useAdminI18n();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const query = useOrders({ page, limit: 16, status });
  const mutation = useOrderMutation();

  return (
    <AdminShell title={t('nav.orders')}>
      <AdminPageSection title={t('orders.queue')} description={t('orders.queueDesc')} />

      <FilterBar>
        <select className='admin-input max-w-[240px]' value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value=''>{t('orders.allStatuses')}</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </FilterBar>

      {query.isLoading ? (
        <SkeletonRows />
      ) : (query.data?.orders.length ?? 0) === 0 ? (
        <EmptyState title={t('orders.empty')} description={t('orders.emptyDesc')} />
      ) : (
        <>
          <DesktopTable>
            <Table>
              <THead>
                <tr>
                  <TH>{t('orders.order')}</TH>
                  <TH>{t('orders.customer')}</TH>
                  <TH>{t('orders.total')}</TH>
                  <TH>{t('orders.items')}</TH>
                  <TH>{t('common.status')}</TH>
                  <TH>{t('orders.created')}</TH>
                </tr>
              </THead>
              <tbody>
                {query.data?.orders.map((item) => (
                  <TR key={item.id}>
                    <TD className='font-mono text-xs'>{item.id.slice(0, 8)}</TD>
                    <TD>
                      <p>{item.user_name || '-'}</p>
                      <p className='text-xs text-[var(--admin-muted)]'>{item.user_email || '-'}</p>
                    </TD>
                    <TD>{item.total_price.toLocaleString()}</TD>
                    <TD>{item.items_count}</TD>
                    <TD>
                      <select
                        value={item.status}
                        onChange={(event) => mutation.mutate({ id: item.id, status: event.target.value })}
                        className='admin-input h-9 w-[140px] text-xs'
                      >
                        {statuses.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </TD>
                    <TD>{new Date(item.created_at).toLocaleDateString()}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </DesktopTable>

          <MobileCardList>
            {query.data?.orders.map((item) => (
              <MobileCard key={item.id}>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='font-mono text-xs'>{item.id.slice(0, 8)}</p>
                    <p className='text-sm font-semibold'>{item.user_name || '-'}</p>
                    <p className='text-xs text-[var(--admin-muted)]'>{item.user_email || '-'}</p>
                  </div>
                  <StatusBadge label={item.status} tone={item.status === 'cancelled' ? 'danger' : item.status === 'delivered' ? 'success' : 'warning'} />
                </div>
                <p className='mt-2 text-sm'>{item.total_price.toLocaleString()} UZS</p>
                <p className='text-xs text-[var(--admin-muted)]'>{t('common.itemsCount', { count: item.items_count })}</p>
                <select
                  value={item.status}
                  onChange={(event) => mutation.mutate({ id: item.id, status: event.target.value })}
                  className='admin-input mt-3 h-9 text-xs'
                >
                  {statuses.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
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
    </AdminShell>
  );
}
