'use client';

import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection, MobileCard, MobileCardList } from '../../../src/features/admin/components/DataViews';

const comments = [
  { id: 'c1', text: 'Great quality, fast delivery.', status: 'pending' },
  { id: 'c2', text: 'Looks different from photos.', status: 'pending' },
];

export default function CommentsPage() {
  return (
    <AdminShell title='Comments'>
      <AdminPageSection title='Comments Moderation' description='Approve, hide or delete user comments.' />
      <MobileCardList>
        {comments.map((item) => (
          <MobileCard key={item.id}>
            <p className='text-sm'>{item.text}</p>
            <div className='mt-3 grid grid-cols-3 gap-2'>
              <button className='rounded-full border border-[var(--admin-border)] py-2 text-xs'>Approve</button>
              <button className='rounded-full border border-[var(--admin-border)] py-2 text-xs'>Hide</button>
              <button className='rounded-full bg-rose-500 py-2 text-xs text-white'>Delete</button>
            </div>
          </MobileCard>
        ))}
      </MobileCardList>
    </AdminShell>
  );
}

