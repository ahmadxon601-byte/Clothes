'use client';

import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection, DesktopTable, MobileCard, MobileCardList, Table, TD, TH, THead, TR } from '../../../src/features/admin/components/DataViews';

const reports = [
  { id: 'r1', subject: 'Counterfeit listing', context: 'Product #782', state: 'open' },
  { id: 'r2', subject: 'Harassment in comments', context: 'Comment #91', state: 'open' },
];

export default function ReportsPage() {
  return (
    <AdminShell title='Reports'>
      <AdminPageSection title='Reports Queue' description='Resolve reports with contextual moderation actions.' />
      <DesktopTable>
        <Table>
          <THead>
            <tr>
              <TH>Subject</TH>
              <TH>Context</TH>
              <TH>Status</TH>
              <TH className='text-right'>Action</TH>
            </tr>
          </THead>
          <tbody>
            {reports.map((item) => (
              <TR key={item.id}>
                <TD>{item.subject}</TD>
                <TD>{item.context}</TD>
                <TD>{item.state}</TD>
                <TD className='text-right'><button className='rounded-full border border-[var(--admin-border)] px-3 py-1 text-xs'>Resolve</button></TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </DesktopTable>
      <MobileCardList>
        {reports.map((item) => (
          <MobileCard key={item.id}>
            <p className='font-semibold'>{item.subject}</p>
            <p className='text-sm text-[var(--admin-muted)]'>{item.context}</p>
            <button className='mt-3 w-full rounded-full border border-[var(--admin-border)] py-2 text-xs'>Resolve</button>
          </MobileCard>
        ))}
      </MobileCardList>
    </AdminShell>
  );
}

