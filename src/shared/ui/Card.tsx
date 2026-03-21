'use client';
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("rounded-[20px] bg-[var(--color-tg-bg)] border border-[var(--color-tg-hint)]/10 shadow-sm overflow-hidden", className)}
            {...props}
        />
    )
);
Card.displayName = 'Card';
