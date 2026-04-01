'use client';

import { useRef, useState } from 'react';
import { Plus, Eye, Pencil, Trash2, ToggleLeft, ToggleRight, X, Loader2, ImagePlus } from 'lucide-react';
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
import { adminApi, getAdminAuthHeaders } from '../../../src/lib/adminApi';
import type { Banner } from '../../../src/lib/adminApi';

function bannerHomepageState(banner: Banner) {
  return banner.is_active && banner.show_on_home;
}

function BannerDialog({ banner, onClose }: { banner?: Banner; onClose: () => void }) {
  const { t } = useAdminI18n();
  const qc = useQueryClient();
  const [title, setTitle] = useState(banner?.title ?? '');
  const [isActive, setIsActive] = useState(banner?.is_active ?? true);
  const [showOnHome, setShowOnHome] = useState(banner?.show_on_home ?? true);
  const [imageUrl, setImageUrl] = useState(banner?.image_url ?? '');
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const createMut = useMutation({
    mutationFn: () => adminApi.createBanner({ title, is_active: isActive, show_on_home: showOnHome, image_url: imageUrl || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () => adminApi.updateBanner(banner!.id, { title, is_active: isActive, show_on_home: showOnHome, image_url: imageUrl || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const isPending = createMut.isPending || updateMut.isPending;

  async function uploadBannerImage(file: File) {
    setUploadingImage(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: formData,
      });
      const body = await res.json().catch(() => ({}));
      const nextUrl = body?.data?.url ?? body?.url;

      if (!res.ok || !nextUrl) {
        throw new Error(body?.error ?? body?.message ?? 'Rasm yuklab bo‘lmadi');
      }

      setImageUrl(String(nextUrl));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Rasm yuklab bo‘lmadi');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function submit() {
    if (!title.trim()) {
      setError(t('banners.titlePlaceholder'));
      return;
    }

    if (!imageUrl.trim()) {
      setError('Banner rasmi majburiy');
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

        <div className='space-y-4'>
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

          <div className='flex items-center gap-3'>
            <span className='text-sm text-[var(--admin-text)]'>Homepage&apos;da ko&apos;rinsin</span>
            <button type='button' onClick={() => setShowOnHome(!showOnHome)} className='text-blue-500'>
              {showOnHome
                ? <ToggleRight className='size-7' />
                : <ToggleLeft className='size-7 text-[var(--admin-muted)]' />}
            </button>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-[var(--admin-text)]'>Banner rasmi</label>
            <div className='overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-pill)]'>
              {imageUrl ? (
                <img src={imageUrl} alt={title || 'Banner image'} className='h-48 w-full object-cover' />
              ) : (
                <div className='flex h-48 items-center justify-center text-sm text-[var(--admin-muted)]'>
                  Rasm tanlanmagan
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadBannerImage(file);
              }}
            />
            <div className='mt-3 flex gap-2'>
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending || uploadingImage}
                className='admin-btn-secondary inline-flex items-center gap-2 py-2 text-sm disabled:opacity-50'
              >
                {uploadingImage ? <Loader2 className='size-4 animate-spin' /> : <ImagePlus className='size-4' />}
                {uploadingImage ? t('common.loading') : 'Rasm yuklash'}
              </button>
              {imageUrl && (
                <button
                  type='button'
                  onClick={() => setImageUrl('')}
                  disabled={isPending || uploadingImage}
                  className='admin-btn-secondary inline-flex items-center gap-2 py-2 text-sm text-rose-500 disabled:opacity-50'
                >
                  <Trash2 className='size-4' />
                  Rasmni olib tashlash
                </button>
              )}
            </div>
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

  const homeToggleMut = useMutation({
    mutationFn: ({ id, show_on_home }: { id: string; show_on_home: boolean }) =>
      adminApi.updateBanner(id, { show_on_home }),
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
                  <TH>Rasm</TH>
                  <TH>{t('banners.titleLabel')}</TH>
                  <TH>{t('common.status')}</TH>
                  <TH>Homepage</TH>
                  <TH className='text-right'>-</TH>
                </tr>
              </THead>
              <tbody>
                {banners.map((bannerItem) => (
                  <TR key={bannerItem.id}>
                    <TD>
                      <div className='h-12 w-20 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-pill)]'>
                        {bannerItem.image_url ? (
                          <img src={bannerItem.image_url} alt={bannerItem.title} className='h-full w-full object-cover' />
                        ) : null}
                      </div>
                    </TD>
                    <TD className='font-medium'>{bannerItem.title}</TD>
                    <TD>
                      <StatusBadge
                        label={bannerItem.is_active ? t('banners.active') : t('banners.inactive')}
                        tone={bannerItem.is_active ? 'success' : 'neutral'}
                      />
                    </TD>
                    <TD>
                      <StatusBadge
                        label={bannerHomepageState(bannerItem) ? 'Ko‘rinadi' : 'Ko‘rinmaydi'}
                        tone={bannerHomepageState(bannerItem) ? 'success' : 'neutral'}
                      />
                    </TD>
                    <TD className='text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <button onClick={() => setViewBanner(bannerItem)} className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]' title="Ko'rish">
                          <Eye className='size-4 text-[var(--admin-muted)]' />
                        </button>
                        <button
                          onClick={() => homeToggleMut.mutate({ id: bannerItem.id, show_on_home: !bannerItem.show_on_home })}
                          className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]'
                          title="Homepage"
                        >
                          {bannerItem.show_on_home
                            ? <ToggleRight className='size-4 text-sky-500' />
                            : <ToggleLeft className='size-4 text-[var(--admin-muted)]' />}
                        </button>
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
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </DesktopTable>

          <MobileCardList>
            {banners.map((bannerItem) => (
              <MobileCard key={bannerItem.id}>
                <div className='flex items-start gap-3'>
                  <div className='h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-pill)]'>
                    {bannerItem.image_url ? (
                      <img src={bannerItem.image_url} alt={bannerItem.title} className='h-full w-full object-cover' />
                    ) : null}
                  </div>
                  <div className='flex-1'>
                    <p className='font-semibold text-[var(--admin-text)]'>{bannerItem.title}</p>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      <StatusBadge
                        label={bannerItem.is_active ? t('banners.active') : t('banners.inactive')}
                        tone={bannerItem.is_active ? 'success' : 'neutral'}
                      />
                      <StatusBadge
                        label={bannerHomepageState(bannerItem) ? 'Ko‘rinadi' : 'Ko‘rinmaydi'}
                        tone={bannerHomepageState(bannerItem) ? 'success' : 'neutral'}
                      />
                    </div>
                  </div>
                  <div className='flex gap-1'>
                    <button
                      onClick={() => homeToggleMut.mutate({ id: bannerItem.id, show_on_home: !bannerItem.show_on_home })}
                      className='rounded-lg p-1.5 hover:bg-[var(--admin-pill)]'
                    >
                      {bannerItem.show_on_home
                        ? <ToggleRight className='size-4 text-sky-500' />
                        : <ToggleLeft className='size-4 text-[var(--admin-muted)]' />}
                    </button>
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
        <BannerDialog banner={dialogBanner ?? undefined} onClose={() => setDialogBanner(undefined)} />
      )}

      {viewBanner && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='admin-card relative w-full max-w-sm p-6'>
            <button onClick={() => setViewBanner(null)} className='absolute right-4 top-4 rounded-lg p-1 hover:bg-[var(--admin-pill)]'>
              <X className='size-4' />
            </button>
            <h2 className='mb-4 text-base font-bold'>{viewBanner.title}</h2>
            <div className='space-y-3 text-sm'>
              <div className='overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-pill)]'>
                {viewBanner.image_url ? (
                  <img src={viewBanner.image_url} alt={viewBanner.title} className='h-44 w-full object-cover' />
                ) : (
                  <div className='flex h-32 items-center justify-center text-sm text-[var(--admin-muted)]'>
                    Rasm tanlanmagan
                  </div>
                )}
              </div>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Holat</span>
                <StatusBadge
                  label={viewBanner.is_active ? t('banners.active') : t('banners.inactive')}
                  tone={viewBanner.is_active ? 'success' : 'neutral'}
                />
              </div>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Homepage</span>
                <StatusBadge
                  label={bannerHomepageState(viewBanner) ? 'Ko‘rinadi' : 'Ko‘rinmaydi'}
                  tone={bannerHomepageState(viewBanner) ? 'success' : 'neutral'}
                />
              </div>
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
