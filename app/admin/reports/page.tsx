'use client';

import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection, EmptyState } from '../../../src/features/admin/components/DataViews';

export default function ReportsPage() {
  return (
    <AdminShell title='Reports'>
      <AdminPageSection title='Reports Queue' description='Resolve reports with contextual moderation actions.' />
      <EmptyState title='Coming soon' description='Reports management is under development.' />
    </AdminShell>
  );
}
