'use client';

import { BarChart3, Files, ShoppingBag, Store, Users } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
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

const growthData = [
  { day: 'Mon', value: 220 },
  { day: 'Tue', value: 240 },
  { day: 'Wed', value: 205 },
  { day: 'Thu', value: 260 },
  { day: 'Fri', value: 290 },
  { day: 'Sat', value: 310 },
  { day: 'Sun', value: 360 },
];

export default function DashboardPage() {
  const stats = useAdminStats();
  const applications = useApplications({ page: 1, limit: 5, status: 'pending' });
  const products = useProducts({ page: 1, limit: 5 });

  const cards = [
    { title: 'Users', value: stats.data?.users_count ?? 0, icon: Users },
    { title: 'Products', value: stats.data?.products_count ?? 0, icon: ShoppingBag },
    { title: 'Shops', value: stats.data?.stores_count ?? 0, icon: Store },
    { title: 'Applications', value: stats.data?.pending_seller_requests ?? 0, icon: Files },
  ];

  return (
    <AdminShell title='Dashboard'>
      <AdminPageSection title='Dashboard Overview' description='Realtime moderation and business metrics' />

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

      <section className='admin-card mb-4 p-4'>
        <div className='mb-4 flex items-center gap-2'>
          <BarChart3 className='size-4 text-[var(--admin-accent)]' />
          <p className='text-sm font-semibold'>Platform Growth</p>
        </div>
        <div className='h-64 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id='growthFill' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='#22C55E' stopOpacity={0.35} />
                  <stop offset='100%' stopColor='#22C55E' stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <XAxis dataKey='day' tickLine={false} axisLine={false} stroke='var(--admin-muted)' />
              <YAxis tickLine={false} axisLine={false} stroke='var(--admin-muted)' />
              <Tooltip />
              <Area type='monotone' dataKey='value' stroke='#22C55E' fill='url(#growthFill)' strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className='grid gap-4 xl:grid-cols-2'>
        <div>
          <AdminPageSection title='Latest Applications' />
          {applications.isLoading ? (
            <SkeletonRows />
          ) : (applications.data?.requests.length ?? 0) === 0 ? (
            <EmptyState title='No applications' description='New shop applications will appear here.' />
          ) : (
            <>
              <DesktopTable>
                <Table>
                  <THead>
                    <tr>
                      <TH>Shop</TH>
                      <TH>Applicant</TH>
                      <TH>Status</TH>
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
          <AdminPageSection title='Pending Products' />
          {products.isLoading ? (
            <SkeletonRows />
          ) : (products.data?.products.length ?? 0) === 0 ? (
            <EmptyState title='No products' description='Product queue will appear here.' />
          ) : (
            <>
              <DesktopTable>
                <Table>
                  <THead>
                    <tr>
                      <TH>Product</TH>
                      <TH>Shop</TH>
                      <TH>Views</TH>
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
                    <p className='mt-2 text-xs text-[var(--admin-muted)]'>Views: {item.views}</p>
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
