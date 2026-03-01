'use client';

import { useState } from 'react';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection, DesktopTable, MobileCard, MobileCardList, Table, TD, TH, THead, TR } from '../../../src/features/admin/components/DataViews';

const logs = [
  { id: 'l1', actor: 'admin@clothes.uz', action: 'Approved product #1201', date: '2026-02-27 14:22' },
  { id: 'l2', actor: 'mod@clothes.uz', action: 'Suspended shop #91', date: '2026-02-27 11:04' },
];

export default function AuditLogsPage() {
  const [actor, setActor] = useState('');

  return (
    <AdminShell title='Audit Logs'>
      <AdminPageSection title='Audit Logs' description='Filterable activity logs for compliance and traceability.' />
      <section className='admin-card mb-4 p-3'>
        <input value={actor} onChange={(event) => setActor(event.target.value)} className='admin-input max-w-sm' placeholder='Filter by actor email' />
      </section>

      <DesktopTable>
        <Table>
          <THead>
            <tr>
              <TH>Actor</TH>
              <TH>Action</TH>
              <TH>Date</TH>
            </tr>
          </THead>
          <tbody>
            {logs.filter((item) => item.actor.includes(actor)).map((item) => (
              <TR key={item.id}>
                <TD>{item.actor}</TD>
                <TD>{item.action}</TD>
                <TD>{item.date}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </DesktopTable>

      <MobileCardList>
        {logs.filter((item) => item.actor.includes(actor)).map((item) => (
          <MobileCard key={item.id}>
            <p className='font-semibold'>{item.actor}</p>
            <p className='text-sm text-[var(--admin-muted)]'>{item.action}</p>
            <p className='mt-2 text-xs text-[var(--admin-muted)]'>{item.date}</p>
          </MobileCard>
        ))}
      </MobileCardList>
    </AdminShell>
  );
}

