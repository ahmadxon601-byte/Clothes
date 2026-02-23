'use client';
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, error, icon, ...props }, ref) => {
        return (
            <div className="relative w-full">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-tg-hint)]">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={cn(
                        "flex h-14 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-2 text-[15px] font-medium text-[var(--color-text)] placeholder:text-[var(--color-hint)]/60 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm outline-none",
                        icon && "pl-[48px]",
                        error && "ring-red-500 focus-visible:ring-red-500",
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1.5 text-xs text-red-500">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';
