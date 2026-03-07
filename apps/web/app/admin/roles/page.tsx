'use client';

import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection, EmptyState } from '../../../src/features/admin/components/DataViews';

export default function RolesPage() {
  return (
    <AdminShell title='Roles'>
      <AdminPageSection title='Roles and Permissions' description='Permission matrix with checkbox controls.' />
      <EmptyState title='Coming soon' description='Roles and permissions management is under development.' />
    </AdminShell>
  );
}
