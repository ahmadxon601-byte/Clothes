'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
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

export default function ShopsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const query = useStores({ page, limit: 12, search });
  const mutation = useStoreMutation();
  const { showToast } = useToast();

  async function toggleShop(id: string, isActive: boolean) {
    const confirm = window.confirm(isActive ? 'Suspend this shop?' : 'Activate this shop?');
    if (!confirm) return;

    await mutation.mutateAsync({ id, payload: { is_active: !isActive } });
    showToast({ message: isActive ? 'Shop suspended' : 'Shop activated', type: isActive ? 'error' : 'success' });
  }

  return (
    <AdminShell title='Shops'>
      <AdminPageSection title='Shops Management' description='Review shops and control activation status.' />

      <FilterBar>
        <div className='relative min-w-[240px] flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]' />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search shops or owner email' className='admin-input pl-10' />
        </div>
      </FilterBar>

      {query.isLoading ? (
        <SkeletonRows />
      ) : (query.data?.stores.length ?? 0) === 0 ? (
        <EmptyState title='No shops found' description='Shops list is empty for this query.' />
      ) : (
        <>
          <DesktopTable>
            <Table>
              <THead>
                <tr>
                  <TH>Shop</TH>
                  <TH>Owner</TH>
                  <TH>Products</TH>
                  <TH>Status</TH>
                  <TH className='text-right'>Actions</TH>
                </tr>
              </THead>
              <tbody>
                {query.data?.stores.map((item) => (
                  <TR key={item.id}>
                    <TD>
                      <p className='font-semibold'>{item.name}</p>
                      <p className='text-xs text-[var(--admin-muted)]'>{item.address || 'No address'}</p>
                    </TD>
                    <TD>
                      <p>{item.owner_name || '-'}</p>
                      <p className='text-xs text-[var(--admin-muted)]'>{item.owner_email || '-'}</p>
                    </TD>
                    <TD>{item.product_count}</TD>
                    <TD>
                      <StatusBadge label={item.is_active ? 'Active' : 'Suspended'} tone={item.is_active ? 'success' : 'danger'} />
                    </TD>
                    <TD className='text-right'>
                      <button className='rounded-full border border-[var(--admin-border)] px-3 py-1 text-xs' onClick={() => toggleShop(item.id, item.is_active)}>
                        {item.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </DesktopTable>

          <MobileCardList>
            {query.data?.stores.map((item) => (
              <MobileCard key={item.id}>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='font-semibold'>{item.name}</p>
                    <p className='text-sm text-[var(--admin-muted)]'>{item.owner_name || item.owner_email}</p>
                  </div>
                  <StatusBadge label={item.is_active ? 'Active' : 'Suspended'} tone={item.is_active ? 'success' : 'danger'} />
                </div>
                <p className='mt-2 text-xs text-[var(--admin-muted)]'>{item.product_count} products</p>
                <button className='mt-3 w-full rounded-full border border-[var(--admin-border)] py-2 text-xs font-semibold' onClick={() => toggleShop(item.id, item.is_active)}>
                  {item.is_active ? 'Suspend' : 'Activate'}
                </button>
              </MobileCard>
            ))}
          </MobileCardList>
        </>
      )}

      <div className='mt-4 flex justify-end gap-2'>
        <button disabled={page <= 1} className='rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm disabled:opacity-50' onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
          Previous
        </button>
        <button className='rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm' onClick={() => setPage((prev) => prev + 1)}>
          Next
        </button>
      </div>
    </AdminShell>
  );
}

