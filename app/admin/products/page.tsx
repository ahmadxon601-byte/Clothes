'use client';

import { Eye, Filter, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Product } from '../../../src/lib/adminApi';
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
import { useProductMutation, useProducts } from '../../../src/features/admin/components/hooks';
import { useToast } from '../../../src/shared/ui/useToast';

function discount(oldPrice?: number | null, price?: number) {
  if (!oldPrice || !price || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export default function ProductsPage() {
  const { t } = useAdminI18n();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [mobileMulti, setMobileMulti] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const query = useProducts({ page, limit: 16, search, status });
  const mutation = useProductMutation();
  const { showToast } = useToast();

  const appliedFilters = useMemo(() => [search ? `Search: ${search}` : '', status ? `Status: ${status}` : ''].filter(Boolean), [search, status]);

  const allIds = query.data?.products.map((item) => item.id) ?? [];
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id));

  return (
    <AdminShell
      title={t('products.title')}
      actions={
        <div className='flex items-center gap-2'>
          <button onClick={() => setShowFilters(true)} className='rounded-full border border-[var(--admin-border)] bg-[var(--admin-pill)] px-3 py-2 text-xs font-semibold lg:hidden'>
            <Filter className='mr-1 inline size-4' /> {t('applications.filter')}
          </button>
          <button onClick={() => setMobileMulti((prev) => !prev)} className='rounded-full border border-[var(--admin-border)] bg-[var(--admin-pill)] px-3 py-2 text-xs font-semibold lg:hidden'>
            {mobileMulti ? t('common.done') : t('common.select')}
          </button>
        </div>
      }
    >
      <AdminPageSection title={t('products.moderation')} description={t('products.moderationDesc')} />

      <FilterBar>
        <div className='relative min-w-[240px] flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]' />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('products.searchPlaceholder')} className='admin-input pl-10' />
        </div>
        <select className='admin-input max-w-[220px]' value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value=''>{t('products.allStatuses')}</option>
          <option value='active'>{t('products.filterActive')}</option>
          <option value='inactive'>{t('products.filterInactive')}</option>
        </select>
      </FilterBar>

      <MobileFilterSheet open={showFilters} onClose={() => setShowFilters(false)} applied={appliedFilters}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('products.searchPlaceholder')} className='admin-input' />
        <select className='admin-input' value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value=''>{t('products.allStatuses')}</option>
          <option value='active'>{t('products.filterActive')}</option>
          <option value='inactive'>{t('products.filterInactive')}</option>
        </select>
      </MobileFilterSheet>

      {selected.length > 0 ? (
        <div className='admin-card mb-3 flex items-center justify-between gap-2 p-3'>
          <p className='text-sm font-semibold'>{t('common.selected', { count: selected.length })}</p>
          <div className='flex items-center gap-2'>
            <button
              className='rounded-full border border-[var(--admin-border)] px-3 py-1 text-xs'
              onClick={() => {
                Promise.all(selected.map((id) => mutation.mutateAsync({ id, payload: { is_active: true } }))).then(() => {
                  setSelected([]);
                  showToast({ message: t('products.bulkApprovedMsg'), type: 'success' });
                });
              }}
            >
              {t('common.approve')}
            </button>
            <button
              className='rounded-full bg-rose-500 px-3 py-1 text-xs text-white'
              onClick={() => {
                Promise.all(selected.map((id) => mutation.mutateAsync({ id, payload: { is_active: false } }))).then(() => {
                  setSelected([]);
                  showToast({ message: t('products.bulkBlockedMsg'), type: 'error' });
                });
              }}
            >
              {t('common.block')}
            </button>
          </div>
        </div>
      ) : null}

      {query.isLoading ? (
        <SkeletonRows />
      ) : (query.data?.products.length ?? 0) === 0 ? (
        <EmptyState title={t('products.empty')} description={t('products.emptyDesc')} />
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
                  <TH>{t('products.name')}</TH>
                  <TH>{t('products.store')}</TH>
                  <TH>{t('products.price')}</TH>
                  <TH>{t('products.discount')}</TH>
                  <TH>{t('common.status')}</TH>
                  <TH className='text-right'>{t('users.actions')}</TH>
                </tr>
              </THead>
              <tbody>
                {query.data?.products.map((item) => {
                  const currentPrice = item.price ?? item.base_price ?? 0;
                  const oldPrice = item.old_price ?? null;
                  const off = discount(oldPrice, currentPrice);
                  return (
                    <TR key={item.id} className='hover:bg-transparent'>
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
                        <StatusBadge label={item.is_active ? t('common.active') : t('products.blocked')} tone={item.is_active ? 'success' : 'danger'} />
                      </TD>
                      <TD className='text-right'>
                        <div className='inline-flex items-center gap-1.5'>
                          <button title="Ko'rish" onClick={() => setViewProduct(item)} className='flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-fg)] transition-colors'>
                            <Eye size={14} />
                          </button>
                          <button
                            className='rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500 hover:shadow-none'
                            onClick={() => mutation.mutate({ id: item.id, payload: { is_active: true } }, { onSuccess: () => showToast({ message: t('products.approvedMsg'), type: 'success' }) })}
                          >
                            {t('common.approve')}
                          </button>
                          <button
                            className='rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500 hover:shadow-none'
                            onClick={() => mutation.mutate({ id: item.id, payload: { is_active: !item.is_active } }, { onSuccess: () => showToast({ message: item.is_active ? t('products.blockedMsg') : t('products.unblockedMsg'), type: 'info' }) })}
                          >
                            {item.is_active ? t('common.block') : t('common.unblock')}
                          </button>
                          <button className='rounded-full bg-rose-500 px-3 py-1 text-xs text-white transition hover:bg-rose-500 hover:shadow-none' onClick={() => setRejectId(item.id)}>
                            {t('common.reject')}
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
                        <StatusBadge label={item.is_active ? t('common.active') : t('products.blocked')} tone={item.is_active ? 'success' : 'danger'} />
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
                      className='rounded-full bg-emerald-500 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 hover:shadow-none'
                      onClick={() => mutation.mutate({ id: item.id, payload: { is_active: true } })}
                    >
                      {t('common.approve')}
                    </button>
                    <button
                      className='rounded-full bg-indigo-500 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 hover:shadow-none'
                      onClick={() => mutation.mutate({ id: item.id, payload: { is_active: !item.is_active } })}
                    >
                      {item.is_active ? t('common.block') : t('common.unblock')}
                    </button>
                    <button className='rounded-full bg-rose-500 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 hover:shadow-none' onClick={() => setRejectId(item.id)}>
                      {t('common.reject')}
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
          <p className='text-sm font-semibold'>{t('common.selected', { count: selected.length })}</p>
          <div className='flex gap-2'>
            <button
              className='rounded-full border border-[var(--admin-border)] px-3 py-2 text-xs'
              onClick={() => Promise.all(selected.map((id) => mutation.mutateAsync({ id, payload: { is_active: true } }))).then(() => setSelected([]))}
            >
              {t('common.approve')}
            </button>
            <button
              className='rounded-full bg-rose-500 px-3 py-2 text-xs text-white'
              onClick={() => Promise.all(selected.map((id) => mutation.mutateAsync({ id, payload: { is_active: false } }))).then(() => setSelected([]))}
            >
              {t('common.block')}
            </button>
          </div>
        </div>
      ) : null}

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
        title={t('products.rejectTitle')}
        confirmLabel={t('common.reject')}
        onClose={() => setRejectId(null)}
        onConfirm={async (reason) => {
          if (!rejectId) return;
          await mutation.mutateAsync({ id: rejectId, payload: { is_active: false, rejection_reason: reason } });
          showToast({ message: t('products.rejectedMsg'), type: 'error' });
        }}
      />

      {/* View modal */}
      {viewProduct && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='admin-card relative w-full max-w-sm p-6'>
            <button onClick={() => setViewProduct(null)} className='absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)]'>
              <X size={14} />
            </button>
            {viewProduct.thumbnail && (
              <img src={viewProduct.thumbnail} alt={viewProduct.name} className='mb-4 h-32 w-full rounded-xl object-cover' />
            )}
            <h2 className='mb-4 text-base font-bold'>{viewProduct.name}</h2>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'><span className='text-[var(--admin-muted)]'>SKU</span><span className='font-semibold'>{viewProduct.sku || '—'}</span></div>
              <div className='flex justify-between'><span className='text-[var(--admin-muted)]'>Narx</span><span className='font-semibold'>{(viewProduct.price ?? viewProduct.base_price ?? 0).toLocaleString()} UZS</span></div>
              <div className='flex justify-between'><span className='text-[var(--admin-muted)]'>Do&apos;kon</span><span className='font-semibold'>{viewProduct.store_name || '—'}</span></div>
              <div className='flex justify-between'><span className='text-[var(--admin-muted)]'>Kategoriya</span><span className='font-semibold'>{viewProduct.category_name || '—'}</span></div>
              <div className='flex justify-between'><span className='text-[var(--admin-muted)]'>Ko&apos;rishlar</span><span className='font-semibold'>{viewProduct.views}</span></div>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Holat</span>
                <StatusBadge label={viewProduct.is_active ? t('common.active') : t('products.blocked')} tone={viewProduct.is_active ? 'success' : 'danger'} />
              </div>
              <div className='flex justify-between'><span className='text-[var(--admin-muted)]'>Sana</span><span className='font-semibold'>{new Date(viewProduct.created_at).toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
