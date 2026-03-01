'use client';

import { useState } from 'react';

type ReasonDialogProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
};

export function ReasonDialog({ open, title, confirmLabel, onClose, onConfirm }: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  return (
    <>
      <button className='fixed inset-0 z-[80] bg-black/50' onClick={onClose} />
      <div className='fixed left-1/2 top-1/2 z-[81] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-[var(--admin-shadow)]'>
        <h3 className='text-lg font-semibold'>{title}</h3>
        <p className='mt-1 text-sm text-[var(--admin-muted)]'>Reason is required</p>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className='admin-input mt-3 h-28 resize-none'
          placeholder='Type rejection reason'
        />
        <div className='mt-4 flex items-center justify-end gap-2'>
          <button onClick={onClose} className='rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm'>
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!reason.trim()) return;
              setLoading(true);
              try {
                await onConfirm(reason.trim());
                setReason('');
                onClose();
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || !reason.trim()}
            className='rounded-full bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'
          >
            {loading ? 'Saving...' : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
