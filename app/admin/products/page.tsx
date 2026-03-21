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
import { useProductMutation, useProducts } from '../../../src/features/admin/components/hooks';
import { useToast } from '../../../src/shared/ui/useToast';
import { RichTextContent } from '../../../src/shared/ui/RichTextContent';
import { stripRichText } from '../../../src/shared/lib/richText';

function discount(oldPrice?: number | null, price?: number) {
  if (!oldPrice || !price || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function productStatusLabel(item: Product, t: (key: string, values?: Record<string, string | number>) => string) {
  if (item.review_status === 'pending') return t('products.filterPending');
  if (item.review_status === 'rejected') return t('products.filterRejected');
  return item.is_active ? t('products.filterApproved') : t('products.blocked');
}

function productStatusTone(item: Product): 'success' | 'warning' | 'danger' {
  if (item.review_status === 'pending') return 'warning';
  if (item.review_status === 'rejected') return 'danger';
  return item.is_active ? 'success' : 'danger';
}

function pendingChanges(item: Product, t: (key: string, values?: Record<string, string | number>) => string) {
  const payload = item.pending_update_payload;
  if (!payload) return [];

  const changes: Array<{ label: string; value: string }> = [];
  if (payload.name !== undefined) changes.push({ label: 'Nomi', value: payload.name });
  if (payload.base_price !== undefined) changes.push({ label: 'Asl narx', value: `${payload.base_price.toLocaleString()} UZS` });
  if (payload.description !== undefined) changes.push({ label: 'Tavsif', value: stripRichText(payload.description ?? '') || 'Bo‘shatiladi' });
  if (payload.category_id !== undefined) changes.push({ label: 'Kategoriya', value: payload.category_id ? 'Yangilanadi' : 'Olib tashlanadi' });
  if (payload.images !== undefined) changes.push({ label: 'Rasmlar', value: `${payload.images.length} ta rasm yangilanadi` });
  if (payload.variants !== undefined && payload.variants[0]) {
    const first = payload.variants[0];
    changes.push({
      label: 'Variant',
      value: `${first.size || 'Standart'} / ${first.price.toLocaleString()} UZS / ${first.stock} dona`,
    });
  }
  return changes;
}

function reviewChanges(item: Product) {
  const payload = item.pending_update_payload;
  if (!payload) return [];

  const changes: Array<{ label: string; value: string }> = [];
  const normalizedPayloadImages = [...(payload.images ?? [])]
    .map((image) => ({ url: image.url, sort_order: image.sort_order }))
    .sort((a, b) => a.sort_order - b.sort_order || a.url.localeCompare(b.url));
  const normalizedCurrentImages = [...(item.current_images ?? [])]
    .map((image) => ({ url: image.url, sort_order: image.sort_order }))
    .sort((a, b) => a.sort_order - b.sort_order || a.url.localeCompare(b.url));
  const normalizedPayloadVariants = [...(payload.variants ?? [])]
    .map((variant) => ({
      size: variant.size ?? null,
      color: variant.color ?? null,
      price: variant.price,
      stock: variant.stock,
    }))
    .sort((a, b) =>
      (a.size || '').localeCompare(b.size || '') ||
      (a.color || '').localeCompare(b.color || '') ||
      a.price - b.price ||
      a.stock - b.stock
    );
  const normalizedCurrentVariants = [...(item.current_variants ?? [])]
    .map((variant) => ({
      size: variant.size ?? null,
      color: variant.color ?? null,
      price: variant.price,
      stock: variant.stock,
    }))
    .sort((a, b) =>
      (a.size || '').localeCompare(b.size || '') ||
      (a.color || '').localeCompare(b.color || '') ||
      a.price - b.price ||
      a.stock - b.stock
    );
  const sameImages =
    payload.images !== undefined &&
    JSON.stringify(normalizedPayloadImages) === JSON.stringify(normalizedCurrentImages);
  const sameVariants =
    payload.variants !== undefined &&
    JSON.stringify(normalizedPayloadVariants) === JSON.stringify(normalizedCurrentVariants);

  if (payload.name !== undefined && payload.name !== item.name) {
    changes.push({ label: 'Nomi', value: `${item.name} -> ${payload.name}` });
  }

  if (payload.base_price !== undefined && payload.base_price !== item.base_price) {
    changes.push({
      label: 'Asl narx',
      value: `${(item.base_price ?? 0).toLocaleString()} UZS -> ${payload.base_price.toLocaleString()} UZS`,
    });
  }

  if (payload.description !== undefined && payload.description !== (item.description ?? null)) {
    changes.push({
      label: 'Tavsif',
      value: `${stripRichText(item.description || '') || "Bo'sh"} -> ${stripRichText(payload.description || '') || "Bo'sh"}`,
    });
  }

  if (payload.category_id !== undefined && payload.category_id !== (item.category_id ?? null)) {
    changes.push({
      label: 'Kategoriya',
      value: `${item.category_name || 'Tanlanmagan'} -> ${item.pending_category_name || 'Tanlanmagan'}`,
    });
  }

  if (payload.images !== undefined && !sameImages) {
    changes.push({ label: 'Rasmlar', value: `${payload.images.length} ta rasmga yangilanadi` });
  }

  if (payload.variants !== undefined && !sameVariants && payload.variants[0]) {
    const first = payload.variants[0];
    changes.push({
      label: 'Yangi variant',
      value: `${first.size || 'Standart'} / ${first.price.toLocaleString()} UZS / ${first.stock} dona`,
    });
  }

  return changes;
}

function canApprove(item: Product) {
  return item.review_status === 'pending' || Boolean(item.pending_update_payload);
}

export default function ProductsPage() {
  const { t } = useAdminI18n();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const query = useProducts({ page, limit: 16, search, status });
  const mutation = useProductMutation();
  const { showToast } = useToast();

  const appliedFilters = useMemo(() => [search ? `Search: ${search}` : '', status ? `Status: ${status}` : ''].filter(Boolean), [search, status]);

  return (
    <AdminShell
      title={t('products.title')}
      actions={
        <button onClick={() => setShowFilters(true)} className='rounded-full border border-[var(--admin-border)] bg-[var(--admin-pill)] px-3 py-2 text-xs font-semibold lg:hidden'>
          <Filter className='mr-1 inline size-4' /> {t('applications.filter')}
        </button>
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
          <option value='pending'>{t('products.filterPending')}</option>
          <option value='approved'>{t('products.filterApproved')}</option>
          <option value='rejected'>{t('products.filterRejected')}</option>
          <option value='active'>{t('products.filterActive')}</option>
          <option value='inactive'>{t('products.filterInactive')}</option>
        </select>
      </FilterBar>

      <MobileFilterSheet open={showFilters} onClose={() => setShowFilters(false)} applied={appliedFilters}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('products.searchPlaceholder')} className='admin-input' />
        <select className='admin-input' value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value=''>{t('products.allStatuses')}</option>
          <option value='pending'>{t('products.filterPending')}</option>
          <option value='approved'>{t('products.filterApproved')}</option>
          <option value='rejected'>{t('products.filterRejected')}</option>
          <option value='active'>{t('products.filterActive')}</option>
          <option value='inactive'>{t('products.filterInactive')}</option>
        </select>
      </MobileFilterSheet>

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
                  const approvable = canApprove(item);
                  return (
                    <TR key={item.id} className='hover:bg-transparent'>
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
                        <StatusBadge label={productStatusLabel(item, t)} tone={productStatusTone(item)} />
                      </TD>
                      <TD className='text-right'>
                        <div className='inline-flex items-center gap-1.5'>
                          <button title="Ko'rish" onClick={() => setViewProduct(item)} className='flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] bg-transparent text-[var(--admin-muted)] shadow-none outline-none transition-colors hover:bg-transparent hover:text-[var(--admin-fg)] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'>
                            <Eye size={14} />
                          </button>
                          <button
                            disabled={!approvable || mutation.isPending}
                            className={`rounded-full px-3 py-1 text-xs font-semibold text-white transition hover:shadow-none ${approvable ? 'bg-emerald-500 hover:bg-emerald-500' : 'cursor-not-allowed bg-slate-600/70 opacity-60'}`}
                            onClick={() => mutation.mutate(
                              { id: item.id, payload: { review_status: 'approved' } },
                              {
                                onSuccess: () => showToast({ message: t('products.approvedMsg'), type: 'success' }),
                                onError: (error: Error) => showToast({ message: error.message || "Tasdiqlab bo'lmadi", type: 'error' }),
                              }
                            )}
                          >
                            {approvable ? t('common.approve') : t('products.filterApproved')}
                          </button>
                          <button
                            className='rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500 hover:shadow-none'
                            onClick={() => mutation.mutate({ id: item.id, payload: { is_active: !item.is_active } }, { onSuccess: () => showToast({ message: item.is_active ? t('products.blockedMsg') : t('products.unblockedMsg'), type: 'info' }) })}
                          >
                            {item.is_active ? t('common.block') : t('common.unblock')}
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
              const approvable = canApprove(item);

              return (
                <MobileCard key={item.id}>
                  <div className='flex items-start gap-3'>
                    <div className='flex-1'>
                      <div className='mb-1 flex items-center justify-between gap-2'>
                        <p className='font-semibold'>{item.name}</p>
                        <StatusBadge label={productStatusLabel(item, t)} tone={productStatusTone(item)} />
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
                      disabled={!approvable || mutation.isPending}
                      className={`rounded-full py-2 text-xs font-semibold text-white transition hover:shadow-none ${approvable ? 'bg-emerald-500 hover:bg-emerald-500' : 'cursor-not-allowed bg-slate-600/70 opacity-60'}`}
                      onClick={() => mutation.mutate(
                        { id: item.id, payload: { review_status: 'approved' } },
                        {
                          onSuccess: () => showToast({ message: t('products.approvedMsg'), type: 'success' }),
                          onError: (error: Error) => showToast({ message: error.message || "Tasdiqlab bo'lmadi", type: 'error' }),
                        }
                      )}
                    >
                      {approvable ? t('common.approve') : t('products.filterApproved')}
                    </button>
                    <button
                      className='rounded-full bg-indigo-500 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 hover:shadow-none'
                      onClick={() => mutation.mutate({ id: item.id, payload: { is_active: !item.is_active } })}
                    >
                      {item.is_active ? t('common.block') : t('common.unblock')}
                    </button>
                  </div>
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

      {/* View modal */}
      {viewProduct && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='admin-card relative w-full max-w-sm p-6'>
            <button
              onClick={() => setViewProduct(null)}
              className='absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/70'
              aria-label="Yopish"
            >
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
              {viewProduct.description ? (
                <div className='pt-2'>
                  <p className='mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]'>Tavsif</p>
                  <RichTextContent
                    html={viewProduct.description}
                    className='rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)] p-3 text-sm [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_ul]:ml-5 [&_ul]:list-disc'
                  />
                </div>
              ) : null}
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Holat</span>
                <StatusBadge label={productStatusLabel(viewProduct, t)} tone={productStatusTone(viewProduct)} />
              </div>
              {viewProduct.review_status === 'pending' && reviewChanges(viewProduct).length > 0 ? (
                <div className='pt-2'>
                  <p className='mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]'>Ko'rib chiqilayotgan o'zgarishlar</p>
                  <div className='space-y-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)] p-3'>
                    {reviewChanges(viewProduct).map((change) => (
                      <div key={`${change.label}-${change.value}`} className='flex justify-between gap-4 text-sm'>
                        <span className='text-[var(--admin-muted)]'>{change.label}</span>
                        <span className='text-right font-semibold'>{change.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {viewProduct.review_note ? <div className='flex justify-between gap-4'><span className='text-[var(--admin-muted)]'>Sabab</span><span className='text-right font-semibold'>{viewProduct.review_note}</span></div> : null}
              <div className='flex justify-between'><span className='text-[var(--admin-muted)]'>Sana</span><span className='font-semibold'>{new Date(viewProduct.created_at).toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
