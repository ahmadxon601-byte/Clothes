'use client';

import { Files, ShoppingBag, Store, Users } from 'lucide-react';
import { useAdminI18n } from '../../../src/context/AdminI18nContext';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import {
  AdminPageSection,
  DesktopTable,
  EmptyState,
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
import { useAdminStats, useApplications, useProducts } from '../../../src/features/admin/components/hooks';

export default function DashboardPage() {
  const { t } = useAdminI18n();
  const stats = useAdminStats();
  const applications = useApplications({ page: 1, limit: 5, status: 'pending' });
  const products = useProducts({ page: 1, limit: 5 });

  const cards = [
    { title: t('dashboard.users'), value: stats.data?.users_count ?? 0, icon: Users },
    { title: t('dashboard.products'), value: stats.data?.products_count ?? 0, icon: ShoppingBag },
    { title: t('dashboard.stores'), value: stats.data?.stores_count ?? 0, icon: Store },
    { title: t('dashboard.applications'), value: stats.data?.pending_seller_requests ?? 0, icon: Files },
  ];

  return (
    <AdminShell title={t('dashboard.title')}>
      <AdminPageSection title={t('dashboard.overview')} description={t('dashboard.overviewDesc')} />

      <section className='mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4'>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className='admin-card p-4'>
              <div className='mb-3 grid size-10 place-items-center rounded-2xl bg-[var(--admin-pill)]'>
                <Icon className='size-5 text-[var(--admin-accent)]' />
              </div>
              <p className='text-2xl font-bold'>{card.value.toLocaleString()}</p>
              <p className='text-xs text-[var(--admin-muted)]'>{card.title}</p>
            </article>
          );
        })}
      </section>

      <section className='grid gap-4 xl:grid-cols-2'>
        <div>
          <AdminPageSection title={t('dashboard.latestApplications')} />
          {applications.isLoading ? (
            <SkeletonRows />
          ) : (applications.data?.requests.length ?? 0) === 0 ? (
            <EmptyState title={t('dashboard.noApplications')} description={t('dashboard.noApplicationsDesc')} />
          ) : (
            <>
              <DesktopTable>
                <Table>
                  <THead>
                    <tr>
                      <TH>{t('common.shop')}</TH>
                      <TH>{t('applications.requester')}</TH>
                      <TH>{t('common.status')}</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {applications.data?.requests.map((item) => (
                      <TR key={item.id}>
                        <TD>{item.store_name}</TD>
                        <TD>{item.user_name || item.user_email}</TD>
                        <TD>
                          <StatusBadge label={item.status} tone={item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'danger'} />
                        </TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
              </DesktopTable>
              <MobileCardList>
                {applications.data?.requests.map((item) => (
                  <MobileCard key={item.id}>
                    <p className='font-semibold'>{item.store_name}</p>
                    <p className='text-sm text-[var(--admin-muted)]'>{item.user_name || item.user_email}</p>
                    <div className='mt-2'>
                      <StatusBadge label={item.status} tone={item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'danger'} />
                    </div>
                  </MobileCard>
                ))}
              </MobileCardList>
            </>
          )}
        </div>

        <div>
          <AdminPageSection title={t('dashboard.pendingProducts')} />
          {products.isLoading ? (
            <SkeletonRows />
          ) : (products.data?.products.length ?? 0) === 0 ? (
            <EmptyState title={t('dashboard.noProducts')} description={t('dashboard.noProductsDesc')} />
          ) : (
            <>
              <DesktopTable>
                <Table>
                  <THead>
                    <tr>
                      <TH>{t('products.name')}</TH>
                      <TH>{t('products.store')}</TH>
                      <TH>{t('products.views')}</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {products.data?.products.map((item) => (
                      <TR key={item.id}>
                        <TD>{item.name}</TD>
                        <TD>{item.store_name || '-'}</TD>
                        <TD>{item.views}</TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
              </DesktopTable>
              <MobileCardList>
                {products.data?.products.map((item) => (
                  <MobileCard key={item.id}>
                    <p className='font-semibold'>{item.name}</p>
                    <p className='text-sm text-[var(--admin-muted)]'>{item.store_name || '-'}</p>
                    <p className='mt-2 text-xs text-[var(--admin-muted)]'>{t('products.views')}: {item.views}</p>
                  </MobileCard>
                ))}
              </MobileCardList>
            </>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
