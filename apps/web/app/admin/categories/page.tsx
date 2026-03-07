'use client';

import { useQuery } from '@tanstack/react-query';
import { useAdminI18n } from '../../../src/context/AdminI18nContext';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection, EmptyState, SkeletonRows } from '../../../src/features/admin/components/DataViews';
import { adminApi } from '../../../src/lib/adminApi';

interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

function useCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.get<{ categories: Category[] }>('/api/categories'),
  });
}

export default function CategoriesPage() {
  const { t } = useAdminI18n();
  const { data, isLoading } = useCategories();
  const categories = (data as { categories: Category[] } | null)?.categories ?? [];

  return (
    <AdminShell title={t('categories.title')}>
      <AdminPageSection title={t('categories.title')} description={t('categories.dbDesc')} />

      {isLoading ? (
        <SkeletonRows />
      ) : categories.length === 0 ? (
        <EmptyState title={t('categories.empty')} description={t('categories.emptyDesc')} />
      ) : (
        <section className='admin-card p-4'>
          <ul className='space-y-2'>
            {categories.map((cat) => (
              <li key={cat.id} className='flex items-center justify-between rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)] px-4 py-3'>
                <div>
                  <p className='font-semibold'>{cat.name}</p>
                  <p className='text-xs text-[var(--admin-muted)]'>{cat.slug}</p>
                </div>
                <p className='text-xs text-[var(--admin-muted)]'>{new Date(cat.created_at).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AdminShell>
  );
}
