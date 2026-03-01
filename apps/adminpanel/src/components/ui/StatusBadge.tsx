import React from 'react';
import { cn } from '../../lib/utils';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    status: 'active' | 'pending' | 'rejected' | 'neutral';
    label: string;
}

export const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
    ({ className, status, label, ...props }, ref) => {
        const statusStyles = {
            active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
            pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
            rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
            neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
        };

        const dotColors = {
            active: 'bg-emerald-500',
            pending: 'bg-amber-500',
            rejected: 'bg-red-500',
            neutral: 'bg-slate-500',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider',
                    statusStyles[status],
                    className
                )}
                {...props}
            >
                <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[status])} />
                {label}
            </div>
        );
    }
);
StatusBadge.displayName = 'StatusBadge';
