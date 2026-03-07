'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Search, Check } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminI18n } from '../../../src/context/AdminI18nContext';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import {
  AdminPageSection,
  DesktopTable,
  Table,
  THead,
  TH,
  TR,
  TD,
  MobileCardList,
  MobileCard,
  StatusBadge,
  EmptyState,
  SkeletonRows,
} from '../../../src/features/admin/components/DataViews';
import { adminApi } from '../../../src/lib/adminApi';
import type { Banner, Product } from '../../../src/lib/adminApi';

// ── Product picker dialog ─────────────────────────────────────────────────────
function ProductPickerDialog({
  selected,
  onClose,
  onSave,
}: {
  selected: string[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const { t } = useAdminI18n();
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<string[]>(selected);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products-picker', search],
    queryFn: () => adminApi.getProducts({ limit: 50, page: 1, ...(search ? { search } : {}) }),
  });

  const products = data?.products ?? [];

  function toggle(id: string) {
    if (picked.includes(id)) {
      setPicked(picked.filter((p) => p !== id));
    } else {
      if (picked.length >= 10) return;
      setPicked([...picked, id]);
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='admin-card flex h-[80vh] w-full max-w-lg flex-col gap-3 overflow-hidden p-4'>
        <div className='flex items-center justify-between'>
          <h3 className='font-semibold text-[var(--admin-text)]'>{t('banners.selectProducts')}</h3>
          <button onClick={onClose} className='rounded-lg p-1 hover:bg-[var(--admin-pill)]'>
            <X className='size-4' />
          </button>
        </div>

        <div className='flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-pill)] px-3 py-2'>
          <Search className='size-4 text-[var(--admin-muted)]' />
          <input
            className='flex-1 bg-transparent text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]'
            placeholder={t('banners.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {picked.length >= 10 && (
          <p className='text-xs text-amber-500'>{t('banners.maxProducts')}</p>
        )}

        <div className='flex-1 overflow-y-auto space-y-1'>
          {isLoading ? (
            <SkeletonRows />
          ) : products.length === 0 ? (
            <p className='py-8 text-center text-sm text-[var(--admin-muted)]'>{t('common.notFound')}</p>
          ) : (
            products.map((p: Product) => {
              const isSelected = picked.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    isSelected ? 'bg-blue-500/15 text-blue-500' : 'hover:bg-[var(--admin-pill)] text-[var(--admin-text)]'
                  }`}
                >
                  <div className={`flex size-5 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-[var(--admin-border)]'}`}>
                    {isSelected && <Check className='size-3 text-white' />}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='truncate text-sm font-medium'>{p.name}</p>
                    {(p.price ?? p.base_price) != null && (
                      <p className='text-xs text-[var(--admin-muted)]'>{(p.price ?? p.base_price)?.toLocaleString()} UZS</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className='flex gap-2 pt-2 border-t border-[var(--admin-border)]'>
          <span className='flex-1 text-sm text-[var(--admin-muted)]'>{picked.length} / 10</span>
          <button onClick={onClose} className='admin-btn-secondary px-4 py-2 text-sm'>
            {t('common.reject')}
          </button>
          <button onClick={() => { onSave(picked); onClose(); }} className='admin-btn px-4 py-2 text-sm'>
            {t('common.done')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Banner form dialog ────────────────────────────────────────────────────────
function BannerDialog({
  banner,
  onClose,
}: {
  banner?: Banner;
  onClose: () => void;
}) {
  const { t } = useAdminI18n();
  const qc = useQueryClient();
  const [title, setTitle] = useState(banner?.title ?? '');
  const [isActive, setIsActive] = useState(banner?.is_active ?? true);
  const [productIds, setProductIds] = useState<string[]>(banner?.product_ids ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');

  const createMut = useMutation({
    mutationFn: () => adminApi.createBanner({ title, is_active: isActive, product_ids: productIds }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'banners'] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () => adminApi.updateBanner(banner!.id, { title, is_active: isActive, product_ids: productIds }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'banners'] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const isPending = createMut.isPending || updateMut.isPending;

  function submit() {
    if (!title.trim()) { setError(t('banners.titlePlaceholder')); return; }
    if (banner) updateMut.mutate();
    else createMut.mutate();
  }

  const selectedNames = (banner?.products ?? []).filter((p) => productIds.includes(p.id));

  return (
    <>
      <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4'>
        <div className='admin-card w-full max-w-md space-y-4 p-6'>
          <div className='flex items-center justify-between'>
            <h3 className='font-semibold text-[var(--admin-text)]'>
              {banner ? t('banners.edit') : t('banners.add')}
            </h3>
            <button onClick={onClose} className='rounded-lg p-1 hover:bg-[var(--admin-pill)]'>
              <X className='size-4' />
            </button>
          </div>

          <div className='space-y-3'>
            <div>
              <label className='mb-1 block text-sm font-medium text-[var(--admin-text)]'>
                {t('banners.titleLabel')}
              </label>
              <input
                className='admin-input w-full'
                placeholder={t('banners.titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className='flex items-center gap-3'>
              <span className='text-sm text-[var(--admin-text)]'>{t('common.active')}</span>
              <button onClick={() => setIsActive(!isActive)} className='text-blue-500'>
                {isActive
                  ? <ToggleRight className='size-7' />
                  : <ToggleLeft className='size-7 text-[var(--admin-muted)]' />}
              </button>
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-[var(--admin-text)]'>
                {t('banners.selectProducts')}
              </label>
              <button
                onClick={() => setPickerOpen(true)}
                className='admin-btn-secondary w-full py-2 text-sm text-left px-3'
              >
                {productIds.length === 0 ? t('banners.noProducts') : `${productIds.length} ta mahsulot tanlandi`}
              </button>
              {productIds.length > 0 && (
                <div className='mt-2 flex flex-wrap gap-1'>
                  {productIds.map((id) => {
                    const name = selectedNames.find((p) => p.id === id)?.name ?? id.slice(0, 8) + '...';
                    return (
                      <span key={id} className='inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-500'>
                        {name}
                        <button onClick={() => setProductIds(productIds.filter((p) => p !== id))}>
                          <X className='size-3' />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {error && <p className='text-sm text-rose-500'>{error}</p>}

          <div className='flex gap-2 pt-2'>
            <button onClick={onClose} className='admin-btn-secondary flex-1 py-2 text-sm'>
              {t('common.reject')}
            </button>
            <button onClick={submit} disabled={isPending} className='admin-btn flex-1 py-2 text-sm'>
              {isPending ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      </div>

      {pickerOpen && (
        <ProductPickerDialog
          selected={productIds}
          onClose={() => setPickerOpen(false)}
          onSave={setProductIds}
        />
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BannersPage() {
  const { t } = useAdminI18n();
  const qc = useQueryClient();
  const [params] = useState({ page: 1, limit: 20 });
  const [dialogBanner, setDialogBanner] = useState<Banner | null | undefined>(undefined);
  // undefined = closed, null = create new, Banner object = edit

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'banners', params],
    queryFn: () => adminApi.getBanners(params),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApi.updateBanner(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });

  const banners = data?.banners ?? [];

  return (
    <AdminShell title={t('banners.title')}>
      <AdminPageSection
        title={t('banners.title')}
        description={t('banners.subtitle')}
        actions={
          <button
            onClick={() => setDialogBanner(null)}
            className='admin-btn flex items-center gap-2 px-4 py-2 text-sm'
          >
            <Plus className='size-4' />
            {t('banners.add')}
          </button>
        }
      />

      {isLoading ? (
        <SkeletonRows />
      ) : error ? (
        <EmptyState title={t('common.error')} description={String(error)} />
      ) : banners.length === 0 ? (
        <EmptyState title={t('banners.empty')} description={t('banners.subtitle')} />
      ) : (
        <>
          {/* Desktop table */}
          <DesktopTable>
            <Table>
              <THead>
                <tr>
                  <TH>{t('banners.titleLabel')}</TH>
                  <TH>{t('common.status')}</TH>
                  <TH>{t('banners.selectedProducts')}</TH>
                  <TH className='text-right'>—</TH>
                </tr>
              </THead>
              <tbody>
                {banners.map((b) => (
                  <TR key={b.id}>
                    <TD className='font-medium'>{b.title}</TD>
                    <TD>
                      <StatusBadge
                        label={b.is_active ? t('banners.active') : t('banners.inactive')}
                        tone={b.is_active ? 'success' : 'neutral'}
                      />
                    </TD>
                    <TD>
                      <span className='text-sm text-[var(--admin-muted)]'>
                        {b.products?.length ?? b.product_ids?.length ?? 0} ta
                      </span>
                    </TD>
                    <TD className='text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <button
                          onClick={() => toggleMut.mutate({ id: b.id, is_active: !b.is_active })}
                          className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]'
                        >
                          {b.is_active
                            ? <ToggleRight className='size-4 text-emerald-500' />
                            : <ToggleLeft className='size-4 text-[var(--admin-muted)]' />}
                        </button>
                        <button
                          onClick={() => setDialogBanner(b)}
                          className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]'
                        >
                          <Pencil className='size-4 text-blue-500' />
                        </button>
                        <button
                          onClick={() => { if (confirm(t('banners.deleteConfirm'))) deleteMut.mutate(b.id); }}
                          className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]'
                        >
                          <Trash2 className='size-4 text-rose-500' />
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </DesktopTable>

          {/* Mobile cards */}
          <MobileCardList>
            {banners.map((b) => (
              <MobileCard key={b.id}>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='font-semibold text-[var(--admin-text)]'>{b.title}</p>
                    <p className='mt-0.5 text-sm text-[var(--admin-muted)]'>
                      {b.products?.length ?? b.product_ids?.length ?? 0} {t('common.items')}
                    </p>
                    <div className='mt-2'>
                      <StatusBadge
                        label={b.is_active ? t('banners.active') : t('banners.inactive')}
                        tone={b.is_active ? 'success' : 'neutral'}
                      />
                    </div>
                  </div>
                  <div className='flex gap-1'>
                    <button
                      onClick={() => toggleMut.mutate({ id: b.id, is_active: !b.is_active })}
                      className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]'
                    >
                      {b.is_active
                        ? <ToggleRight className='size-4 text-emerald-500' />
                        : <ToggleLeft className='size-4 text-[var(--admin-muted)]' />}
                    </button>
                    <button onClick={() => setDialogBanner(b)} className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]'>
                      <Pencil className='size-4 text-blue-500' />
                    </button>
                    <button
                      onClick={() => { if (confirm(t('banners.deleteConfirm'))) deleteMut.mutate(b.id); }}
                      className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]'
                    >
                      <Trash2 className='size-4 text-rose-500' />
                    </button>
                  </div>
                </div>
              </MobileCard>
            ))}
          </MobileCardList>
        </>
      )}

      {dialogBanner !== undefined && (
        <BannerDialog
          banner={dialogBanner ?? undefined}
          onClose={() => setDialogBanner(undefined)}
        />
      )}
    </AdminShell>
  );
}
