'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../../shared/lib/utils';

export function AdminPageSection({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
      <div>
        <h2 className='text-xl font-bold text-[var(--admin-text)]'>{title}</h2>
        {description ? <p className='text-sm text-[var(--admin-muted)]'>{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className='admin-card mb-4 hidden flex-wrap items-stretch gap-2 p-3 lg:flex'>{children}</div>;
}

export function MobileFilterSheet({ open, onClose, children, applied }: { open: boolean; onClose: () => void; children: ReactNode; applied?: string[] }) {
  return (
    <>
      <div className='mb-3 flex items-center gap-2 lg:hidden'>
        {applied?.map((item) => (
          <span key={item} className='admin-chip inline-flex items-center gap-1'>
            {item}
          </span>
        ))}
      </div>
      {open ? (
        <>
          <button className='fixed inset-0 z-[70] bg-black/50 lg:hidden' onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.2 }}
            className='fixed inset-x-0 bottom-0 z-[71] rounded-t-[24px] border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 lg:hidden'
          >
            <div className='mb-3 flex items-center justify-between'>
              <p className='text-sm font-semibold'>Filters</p>
              <button onClick={onClose} className='rounded-lg border border-[var(--admin-border)] p-2' aria-label='Close'>
                <X className='size-4' />
              </button>
            </div>
            <div className='space-y-2 pb-8'>{children}</div>
          </motion.div>
        </>
      ) : null}
    </>
  );
}

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const toneClasses = {
    success: 'bg-emerald-500/15 text-emerald-500',
    warning: 'bg-amber-500/15 text-amber-500',
    danger: 'bg-rose-500/15 text-rose-500',
    neutral: 'bg-slate-500/15 text-slate-500',
  };

  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', toneClasses[tone])}>{label}</span>;
}

export function DesktopTable({ children }: { children: ReactNode }) {
  return <div className='admin-card hidden overflow-hidden lg:block'>{children}</div>;
}

export function Table({ children }: { children: ReactNode }) {
  return <table className='min-w-full text-left text-sm'>{children}</table>;
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className='sticky top-0 bg-[var(--admin-pill)] text-xs uppercase tracking-wide text-[var(--admin-muted)]'>{children}</thead>;
}

export function TH({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3 font-semibold', className)}>{children}</th>;
}

export function TD({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 align-middle text-[var(--admin-text)]', className)}>{children}</td>;
}

export function TR({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn('border-t border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-pill)]', className)}>{children}</tr>;
}

export function MobileCardList({ children }: { children: ReactNode }) {
  return <div className='space-y-3 lg:hidden'>{children}</div>;
}

export function MobileCard({ children }: { children: ReactNode }) {
  return <article className='admin-card p-4'>{children}</article>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className='admin-card grid place-items-center p-10 text-center'>
      <p className='text-base font-semibold text-[var(--admin-text)]'>{title}</p>
      <p className='mt-1 text-sm text-[var(--admin-muted)]'>{description}</p>
    </div>
  );
}

export function SkeletonRows() {
  return (
    <div className='space-y-3'>
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className='admin-card h-20 animate-pulse bg-[var(--admin-pill)]' />
      ))}
    </div>
  );
}
