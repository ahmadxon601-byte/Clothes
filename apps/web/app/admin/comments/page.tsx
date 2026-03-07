'use client';

import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection, EmptyState } from '../../../src/features/admin/components/DataViews';

export default function CommentsPage() {
  return (
    <AdminShell title='Comments'>
      <AdminPageSection title='Comments Moderation' description='Approve, hide or delete user comments.' />
      <EmptyState title='Coming soon' description='Comments moderation is under development.' />
    </AdminShell>
  );
}
