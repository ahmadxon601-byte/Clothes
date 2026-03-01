'use client';

import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection } from '../../../src/features/admin/components/DataViews';

const permissions = ['users.read', 'users.write', 'products.moderate', 'shops.manage', 'settings.write'];
const roles = ['super_admin', 'moderator', 'support'];

export default function RolesPage() {
  return (
    <AdminShell title='Roles'>
      <AdminPageSection title='Roles and Permissions' description='Permission matrix with checkbox controls.' />
      <section className='admin-card overflow-x-auto p-4'>
        <table className='min-w-[640px] text-sm'>
          <thead>
            <tr className='text-left text-xs uppercase tracking-wide text-[var(--admin-muted)]'>
              <th className='px-3 py-2'>Permission</th>
              {roles.map((role) => (
                <th key={role} className='px-3 py-2'>{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission} className='border-t border-[var(--admin-border)]'>
                <td className='px-3 py-3 font-medium'>{permission}</td>
                {roles.map((role) => (
                  <td key={`${permission}-${role}`} className='px-3 py-3'>
                    <input type='checkbox' defaultChecked={role === 'super_admin' || (role === 'moderator' && !permission.includes('settings'))} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}

