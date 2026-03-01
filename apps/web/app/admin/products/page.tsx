'use client';

import { Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { useProductMutation, useProducts } from '../../../src/features/admin/components/hooks';
import { useToast } from '../../../src/shared/ui/useToast';

function discount(oldPrice?: number | null, price?: number) {
  if (!oldPrice || !price || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [mobileMulti, setMobileMulti] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const query = useProducts({ page, limit: 16, search, status });
  const mutation = useProductMutation();
  const { showToast } = useToast();

  const appliedFilters = useMemo(() => [search ? `Search: ${search}` : '', status ? `Status: ${status}` : ''].filter(Boolean), [search, status]);

  const allIds = query.data?.products.map((item) => item.id) ?? [];
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id));

  return (
    <AdminShell
      title='Products'
      actions={
        <div className='flex items-center gap-2'>
          <button onClick={() => setShowFilters(true)} className='rounded-full border border-[var(--admin-border)] bg-[var(--admin-pill)] px-3 py-2 text-xs font-semibold lg:hidden'>
            <Filter className='mr-1 inline size-4' /> Filters
          </button>
          <button onClick={() => setMobileMulti((prev) => !prev)} className='rounded-full border border-[var(--admin-border)] bg-[var(--admin-pill)] px-3 py-2 text-xs font-semibold lg:hidden'>
            {mobileMulti ? 'Done' : 'Select'}
          </button>
        </div>
      }
    >
      <AdminPageSection title='Product Moderation' description='Approve, reject, block and bulk process products.' />

      <FilterBar>
        <div className='relative min-w-[240px] flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]' />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search by product, SKU or shop' className='admin-input pl-10' />
        </div>
        <select className='admin-input max-w-[220px]' value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value=''>All statuses</option>
          <option value='active'>Active</option>
          <option value='inactive'>Inactive</option>
        </select>
      </FilterBar>

      <MobileFilterSheet open={showFilters} onClose={() => setShowFilters(false)} applied={appliedFilters}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search by product, SKU or shop' className='admin-input' />
        <select className='admin-input' value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value=''>All statuses</option>
          <option value='active'>Active</option>
          <option value='inactive'>Inactive</option>
        </select>
      </MobileFilterSheet>

      {selected.length > 0 ? (
        <div className='admin-card mb-3 flex items-center justify-between gap-2 p-3'>
          <p className='text-sm font-semibold'>{selected.length} selected</p>
          <div className='flex items-center gap-2'>
            <button
              className='rounded-full border border-[var(--admin-border)] px-3 py-1 text-xs'
              onClick={() => {
                Promise.all(selected.map((id) => mutation.mutateAsync({ id, payload: { is_active: true } }))).then(() => {
                  setSelected([]);
                  showToast({ message: 'Selected products approved', type: 'success' });
                });
              }}
            >
              Approve
            </button>
            <button
              className='rounded-full bg-rose-500 px-3 py-1 text-xs text-white'
              onClick={() => {
                Promise.all(selected.map((id) => mutation.mutateAsync({ id, payload: { is_active: false } }))).then(() => {
                  setSelected([]);
                  showToast({ message: 'Selected products blocked', type: 'error' });
                });
              }}
            >
              Block
            </button>
          </div>
        </div>
      ) : null}

      {query.isLoading ? (
        <SkeletonRows />
      ) : (query.data?.products.length ?? 0) === 0 ? (
        <EmptyState title='No products found' description='Try changing filters or search query.' />
      ) : (
        <>
          <DesktopTable>
            <Table>
              <THead>
                <tr>
                  <TH>
                    <input
                      type='checkbox'
                      checked={allSelected}
                      onChange={(e) => setSelected(e.target.checked ? allIds : [])}
                      aria-label='Select all products'
                    />
                  </TH>
                  <TH>Product</TH>
                  <TH>Shop</TH>
                  <TH>Price</TH>
                  <TH>Discount</TH>
                  <TH>Status</TH>
                  <TH className='text-right'>Actions</TH>
                </tr>
              </THead>
              <tbody>
                {query.data?.products.map((item) => {
                  const currentPrice = item.price ?? item.base_price ?? 0;
                  const oldPrice = item.old_price ?? null;
                  const off = discount(oldPrice, currentPrice);
                  return (
                    <TR key={item.id}>
                      <TD>
                        <input
                          type='checkbox'
                          checked={selected.includes(item.id)}
                          onChange={(event) =>
                            setSelected((prev) => (event.target.checked ? [...prev, item.id] : prev.filter((value) => value !== item.id)))
                          }
                          aria-label={`Select ${item.name}`}
                        />
                      </TD>
                      <TD>
                        <div className='flex items-center gap-3'>
                          <div className='size-11 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)]'>
                            {item.thumbnail ? <img src={item.thumbnail} alt={item.name} className='size-full object-cover' /> : null}
                          </div>
                          <div>
                            <p className='font-semibold'>{item.name}</p>
                            <p className='text-xs text-[var(--admin-muted)]'>{item.sku || '-'}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>{item.store_name || '-'}</TD>
                      <TD>
                        <p className='font-semibold'>{currentPrice.toLocaleString()}</p>
                        {oldPrice ? <p className='text-xs text-[var(--admin-muted)] line-through'>{oldPrice.toLocaleString()}</p> : null}
                      </TD>
                      <TD>{off > 0 ? <StatusBadge label={`-${off}%`} tone='success' /> : '-'}</TD>
                      <TD>
                        <StatusBadge label={item.is_active ? 'Active' : 'Blocked'} tone={item.is_active ? 'success' : 'danger'} />
                      </TD>
                      <TD className='text-right'>
                        <div className='inline-flex gap-2'>
                          <button
                            className='rounded-full border border-[var(--admin-border)] px-3 py-1 text-xs'
                            onClick={() => mutation.mutate({ id: item.id, payload: { is_active: true } }, { onSuccess: () => showToast({ message: 'Product approved', type: 'success' }) })}
                          >
                            Approve
                          </button>
                          <button
                            className='rounded-full border border-[var(--admin-border)] px-3 py-1 text-xs'
                            onClick={() => mutation.mutate({ id: item.id, payload: { is_active: !item.is_active } }, { onSuccess: () => showToast({ message: item.is_active ? 'Product blocked' : 'Product unblocked', type: 'info' }) })}
                          >
                            {item.is_active ? 'Block' : 'Unblock'}
                          </button>
                          <button className='rounded-full bg-rose-500 px-3 py-1 text-xs text-white' onClick={() => setRejectId(item.id)}>
                            Reject
                          </button>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </DesktopTable>

          <MobileCardList>
            {query.data?.products.map((item) => {
              const currentPrice = item.price ?? item.base_price ?? 0;
              const oldPrice = item.old_price ?? null;
              const off = discount(oldPrice, currentPrice);
              const checked = selected.includes(item.id);

              return (
                <MobileCard key={item.id}>
                  <div className='flex items-start gap-3'>
                    {mobileMulti ? (
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={(event) =>
                          setSelected((prev) => (event.target.checked ? [...prev, item.id] : prev.filter((value) => value !== item.id)))
                        }
                        className='mt-1'
                        aria-label={`Select ${item.name}`}
                      />
                    ) : null}
                    <div className='flex-1'>
                      <div className='mb-1 flex items-center justify-between gap-2'>
                        <p className='font-semibold'>{item.name}</p>
                        <StatusBadge label={item.is_active ? 'Active' : 'Blocked'} tone={item.is_active ? 'success' : 'danger'} />
                      </div>
                      <p className='text-sm text-[var(--admin-muted)]'>{item.store_name || '-'}</p>
                      <div className='mt-2 flex items-center gap-2'>
                        <p className='text-sm font-semibold'>{currentPrice.toLocaleString()}</p>
                        {oldPrice ? <p className='text-xs text-[var(--admin-muted)] line-through'>{oldPrice.toLocaleString()}</p> : null}
                        {off > 0 ? <StatusBadge label={`-${off}%`} tone='success' /> : null}
                      </div>
                    </div>
                  </div>
                  <div className='mt-3 grid grid-cols-3 gap-2'>
                    <button
                      className='rounded-full border border-[var(--admin-border)] py-2 text-xs font-semibold'
                      onClick={() => mutation.mutate({ id: item.id, payload: { is_active: true } })}
                    >
                      Approve
                    </button>
                    <button
                      className='rounded-full border border-[var(--admin-border)] py-2 text-xs font-semibold'
                      onClick={() => mutation.mutate({ id: item.id, payload: { is_active: !item.is_active } })}
                    >
                      {item.is_active ? 'Block' : 'Unblock'}
                    </button>
                    <button className='rounded-full bg-rose-500 py-2 text-xs font-semibold text-white' onClick={() => setRejectId(item.id)}>
                      Reject
                    </button>
                  </div>
                </MobileCard>
              );
            })}
          </MobileCardList>
        </>
      )}

      {mobileMulti && selected.length > 0 ? (
        <div className='fixed inset-x-0 bottom-20 z-40 flex items-center justify-between border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-3 shadow-[var(--admin-shadow)] lg:hidden'>
          <p className='text-sm font-semibold'>{selected.length} selected</p>
          <div className='flex gap-2'>
            <button
              className='rounded-full border border-[var(--admin-border)] px-3 py-2 text-xs'
              onClick={() => Promise.all(selected.map((id) => mutation.mutateAsync({ id, payload: { is_active: true } }))).then(() => setSelected([]))}
            >
              Approve
            </button>
            <button
              className='rounded-full bg-rose-500 px-3 py-2 text-xs text-white'
              onClick={() => Promise.all(selected.map((id) => mutation.mutateAsync({ id, payload: { is_active: false } }))).then(() => setSelected([]))}
            >
              Block
            </button>
          </div>
        </div>
      ) : null}

      <div className='mt-4 flex justify-end gap-2'>
        <button disabled={page <= 1} className='rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm disabled:opacity-50' onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
          Previous
        </button>
        <button className='rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm' onClick={() => setPage((prev) => prev + 1)}>
          Next
        </button>
      </div>

      <ReasonDialog
        open={Boolean(rejectId)}
        title='Reject product'
        confirmLabel='Reject'
        onClose={() => setRejectId(null)}
        onConfirm={async (reason) => {
          if (!rejectId) return;
          await mutation.mutateAsync({ id: rejectId, payload: { is_active: false, rejection_reason: reason } });
          showToast({ message: 'Product rejected', type: 'error' });
        }}
      />
    </AdminShell>
  );
}

