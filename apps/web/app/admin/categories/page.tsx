'use client';

import { useState } from 'react';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection } from '../../../src/features/admin/components/DataViews';

const tree = [
  { id: '1', name: 'Women', children: ['Dresses', 'Outerwear'] },
  { id: '2', name: 'Men', children: ['Shirts', 'Shoes'] },
  { id: '3', name: 'Accessories', children: ['Bags', 'Jewelry'] },
];

export default function CategoriesPage() {
  const [open, setOpen] = useState(false);

  return (
    <AdminShell title='Categories'>
      <AdminPageSection title='Categories Tree' description='Manage category hierarchy and CRUD operations.' actions={<button onClick={() => setOpen(true)} className='rounded-full bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white'>Create category</button>} />
      <section className='admin-card p-4'>
        <ul className='space-y-3'>
          {tree.map((node) => (
            <li key={node.id} className='rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)] p-3'>
              <p className='font-semibold'>{node.name}</p>
              <div className='mt-2 flex flex-wrap gap-2'>
                {node.children.map((item) => (
                  <span key={item} className='admin-chip'>{item}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {open ? (
        <>
          <button className='fixed inset-0 z-[80] bg-black/50' onClick={() => setOpen(false)} />
          <div className='fixed left-1/2 top-1/2 z-[81] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5'>
            <h3 className='text-lg font-semibold'>Create category</h3>
            <input className='admin-input mt-3' placeholder='Category name' />
            <div className='mt-4 flex justify-end gap-2'>
              <button onClick={() => setOpen(false)} className='rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm'>Cancel</button>
              <button onClick={() => setOpen(false)} className='rounded-full bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white'>Save</button>
            </div>
          </div>
        </>
      ) : null}
    </AdminShell>
  );
}

