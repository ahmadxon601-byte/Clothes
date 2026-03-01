'use client';

import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection, DesktopTable, MobileCard, MobileCardList, Table, TD, TH, THead, TR } from '../../../src/features/admin/components/DataViews';

const banners = [
  { id: 'bn1', title: 'Spring Collection', placement: 'Home hero', active: true },
  { id: 'bn2', title: 'Weekend Sale', placement: 'Category top', active: false },
];

export default function BannersPage() {
  return (
    <AdminShell title='Banners'>
      <AdminPageSection title='Banners' description='Create and edit marketing banners for placements.' actions={<button className='rounded-full bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white'>New banner</button>} />

      <DesktopTable>
        <Table>
          <THead>
            <tr>
              <TH>Title</TH>
              <TH>Placement</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <tbody>
            {banners.map((item) => (
              <TR key={item.id}>
                <TD>{item.title}</TD>
                <TD>{item.placement}</TD>
                <TD>{item.active ? 'Active' : 'Disabled'}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </DesktopTable>

      <MobileCardList>
        {banners.map((item) => (
          <MobileCard key={item.id}>
            <p className='font-semibold'>{item.title}</p>
            <p className='text-sm text-[var(--admin-muted)]'>{item.placement}</p>
            <p className='mt-2 text-xs'>{item.active ? 'Active' : 'Disabled'}</p>
          </MobileCard>
        ))}
      </MobileCardList>
    </AdminShell>
  );
}

