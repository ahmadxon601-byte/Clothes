'use client';
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
    selected?: boolean;
}

export const Chip = forwardRef<HTMLDivElement, ChipProps>(
    ({ className, selected, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer active:scale-95",
                selected
                    ? "bg-[var(--color-tg-primary)] text-[var(--color-tg-primary-text)]"
                    : "bg-[var(--color-tg-secondary-bg)] text-[var(--color-tg-text)]",
                className
            )}
            {...props}
        />
    )
);
Chip.displayName = 'Chip';
