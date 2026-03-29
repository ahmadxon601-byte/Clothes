'use client';

import { useMemo, useState } from 'react';
import { Plus, Eye, Pencil, Trash2, ToggleLeft, ToggleRight, X, Search, Check } from 'lucide-react';
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

function ProductSelector({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useAdminI18n();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products-picker', search],
    queryFn: () => adminApi.getProducts({ limit: 50, page: 1, ...(search ? { search } : {}) }),
  });

  const products = data?.products ?? [];
  const selectedProducts = useMemo(() => {
    const productMap = new Map(products.map((product) => [product.id, product]));
    return selectedIds.map((id) => productMap.get(id)).filter(Boolean) as Product[];
  }, [products, selectedIds]);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((productId) => productId !== id));
      return;
    }

    if (selectedIds.length >= 10) return;
    onChange([...selectedIds, id]);
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-pill)] px-3 py-2'>
        <Search className='size-4 text-[var(--admin-muted)]' />
        <input
          className='flex-1 bg-transparent text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]'
          placeholder={t('banners.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {selectedIds.length >= 10 && (
        <p className='text-xs text-amber-500'>{t('banners.maxProducts')}</p>
      )}

      <div className='rounded-xl border border-[var(--admin-border)] bg-[var(--admin-pill)] p-2'>
        <div className='max-h-56 space-y-1 overflow-y-auto'>
          {isLoading ? (
            <SkeletonRows />
          ) : products.length === 0 ? (
            <p className='py-8 text-center text-sm text-[var(--admin-muted)]'>{t('common.notFound')}</p>
          ) : (
            products.map((product: Product) => {
              const isSelected = selectedIds.includes(product.id);
              return (
                <button
                  key={product.id}
                  type='button'
                  onClick={() => toggle(product.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    isSelected ? 'bg-blue-500/15 text-blue-500' : 'text-[var(--admin-text)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className={`flex size-5 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-[var(--admin-border)]'}`}>
                    {isSelected && <Check className='size-3 text-white' />}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>{product.name}</p>
                    {(product.price ?? product.base_price) != null && (
                      <p className='text-xs text-[var(--admin-muted)]'>{(product.price ?? product.base_price)?.toLocaleString()} UZS</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className='flex items-center justify-between text-xs text-[var(--admin-muted)]'>
        <span>{selectedIds.length} / 10</span>
        <span>{t('banners.selectedProducts')}</span>
      </div>

      {selectedIds.length > 0 ? (
        <div className='flex flex-wrap gap-1'>
          {selectedIds.map((id) => {
            const name = selectedProducts.find((product) => product.id === id)?.name ?? `${id.slice(0, 8)}...`;
            return (
              <span key={id} className='inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-500'>
                {name}
                <button type='button' onClick={() => onChange(selectedIds.filter((productId) => productId !== id))}>
                  <X className='size-3' />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <div className='rounded-lg border border-dashed border-[var(--admin-border)] px-3 py-2 text-sm text-[var(--admin-muted)]'>
          {t('banners.noProducts')}
        </div>
      )}
    </div>
  );
}

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
  const [error, setError] = useState('');

  const createMut = useMutation({
    mutationFn: () => adminApi.createBanner({ title, is_active: isActive, product_ids: productIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () => adminApi.updateBanner(banner!.id, { title, is_active: isActive, product_ids: productIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const isPending = createMut.isPending || updateMut.isPending;

  function submit() {
    if (!title.trim()) {
      setError(t('banners.titlePlaceholder'));
      return;
    }

    if (productIds.length === 0) {
      setError(t('banners.noProducts'));
      return;
    }

    setError('');
    if (banner) updateMut.mutate();
    else createMut.mutate();
  }

  return (
    <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4'>
      <div className='admin-card w-full max-w-xl space-y-4 p-6'>
        <div className='flex items-center justify-between'>
          <h3 className='font-semibold text-[var(--admin-text)]'>
            {banner ? t('banners.edit') : t('banners.add')}
          </h3>
          <button type='button' onClick={onClose} className='rounded-lg p-1 hover:bg-[var(--admin-pill)]'>
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
            <button type='button' onClick={() => setIsActive(!isActive)} className='text-blue-500'>
              {isActive
                ? <ToggleRight className='size-7' />
                : <ToggleLeft className='size-7 text-[var(--admin-muted)]' />}
            </button>
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-[var(--admin-text)]'>
              {t('banners.selectProducts')}
            </label>
            <ProductSelector selectedIds={productIds} onChange={setProductIds} />
          </div>
        </div>

        {error && <p className='text-sm text-rose-500'>{error}</p>}

        <div className='flex gap-2 pt-2'>
          <button type='button' onClick={onClose} className='admin-btn-secondary flex-1 py-2 text-sm'>
            {t('common.reject')}
          </button>
          <button type='button' onClick={submit} disabled={isPending} className='admin-btn flex-1 py-2 text-sm'>
            {isPending ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BannersPage() {
  const { t } = useAdminI18n();
  const qc = useQueryClient();
  const [params] = useState({ page: 1, limit: 20 });
  const [dialogBanner, setDialogBanner] = useState<Banner | null | undefined>(undefined);
  const [viewBanner, setViewBanner] = useState<Banner | null>(null);

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
        actions={(
          <button
            onClick={() => setDialogBanner(null)}
            className='admin-btn flex items-center gap-2 px-4 py-2 text-sm'
          >
            <Plus className='size-4' />
            {t('banners.add')}
          </button>
        )}
      />

      {isLoading ? (
        <SkeletonRows />
      ) : error ? (
        <EmptyState title={t('common.error')} description={String(error)} />
      ) : banners.length === 0 ? (
        <EmptyState title={t('banners.empty')} description={t('banners.subtitle')} />
      ) : (
        <>
          <DesktopTable>
            <Table>
              <THead>
                <tr>
                  <TH>{t('banners.titleLabel')}</TH>
                  <TH>{t('common.status')}</TH>
                  <TH>{t('banners.selectedProducts')}</TH>
                  <TH className='text-right'>-</TH>
                </tr>
              </THead>
              <tbody>
                {banners.map((bannerItem) => (
                  <TR key={bannerItem.id}>
                    <TD className='font-medium'>{bannerItem.title}</TD>
                    <TD>
                      <StatusBadge
                        label={bannerItem.is_active ? t('banners.active') : t('banners.inactive')}
                        tone={bannerItem.is_active ? 'success' : 'neutral'}
                      />
                    </TD>
                    <TD>
                      <span className='text-sm text-[var(--admin-muted)]'>
                        {bannerItem.products?.length ?? bannerItem.product_ids?.length ?? 0} ta
                      </span>
                    </TD>
                    <TD className='text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <button onClick={() => setViewBanner(bannerItem)} className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]' title="Ko'rish">
                          <Eye className='size-4 text-[var(--admin-muted)]' />
                        </button>
                        <button
                          onClick={() => toggleMut.mutate({ id: bannerItem.id, is_active: !bannerItem.is_active })}
                          className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]'
                        >
                          {bannerItem.is_active
                            ? <ToggleRight className='size-4 text-emerald-500' />
                            : <ToggleLeft className='size-4 text-[var(--admin-muted)]' />}
                        </button>
                        <button
                          onClick={() => setDialogBanner(bannerItem)}
                          className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]'
                        >
                          <Pencil className='size-4 text-blue-500' />
                        </button>
                        <button
                          onClick={() => { if (confirm(t('banners.deleteConfirm'))) deleteMut.mutate(bannerItem.id); }}
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

          <MobileCardList>
            {banners.map((bannerItem) => (
              <MobileCard key={bannerItem.id}>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='font-semibold text-[var(--admin-text)]'>{bannerItem.title}</p>
                    <p className='mt-0.5 text-sm text-[var(--admin-muted)]'>
                      {bannerItem.products?.length ?? bannerItem.product_ids?.length ?? 0} {t('common.items')}
                    </p>
                    <div className='mt-2'>
                      <StatusBadge
                        label={bannerItem.is_active ? t('banners.active') : t('banners.inactive')}
                        tone={bannerItem.is_active ? 'success' : 'neutral'}
                      />
                    </div>
                  </div>
                  <div className='flex gap-1'>
                    <button
                      onClick={() => toggleMut.mutate({ id: bannerItem.id, is_active: !bannerItem.is_active })}
                      className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]'
                    >
                      {bannerItem.is_active
                        ? <ToggleRight className='size-4 text-emerald-500' />
                        : <ToggleLeft className='size-4 text-[var(--admin-muted)]' />}
                    </button>
                    <button onClick={() => setDialogBanner(bannerItem)} className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]'>
                      <Pencil className='size-4 text-blue-500' />
                    </button>
                    <button
                      onClick={() => { if (confirm(t('banners.deleteConfirm'))) deleteMut.mutate(bannerItem.id); }}
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

      {viewBanner && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='admin-card relative w-full max-w-sm p-6'>
            <button onClick={() => setViewBanner(null)} className='absolute right-4 top-4 rounded-lg p-1 hover:bg-[var(--admin-pill)]'>
              <X className='size-4' />
            </button>
            <h2 className='mb-4 text-base font-bold'>{viewBanner.title}</h2>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Holat</span>
                <StatusBadge
                  label={viewBanner.is_active ? t('banners.active') : t('banners.inactive')}
                  tone={viewBanner.is_active ? 'success' : 'neutral'}
                />
              </div>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Mahsulotlar</span>
                <span className='font-semibold'>{viewBanner.product_ids?.length ?? 0} ta</span>
              </div>
              {(viewBanner.products?.length ?? 0) > 0 && (
                <div>
                  <p className='mb-1 text-[var(--admin-muted)]'>Mahsulotlar ro&apos;yxati:</p>
                  <ul className='space-y-1'>
                    {viewBanner.products.map((product) => (
                      <li key={product.id} className='flex justify-between rounded-lg bg-[var(--admin-pill)] px-3 py-1.5'>
                        <span>{product.name}</span>
                        {product.price != null && <span className='text-[var(--admin-muted)]'>{product.price.toLocaleString()} UZS</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Yaratilgan</span>
                <span className='font-semibold'>{new Date(viewBanner.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
