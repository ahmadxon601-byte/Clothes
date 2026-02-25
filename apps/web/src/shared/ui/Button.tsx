'use client';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    "inline-flex items-center justify-center rounded-full font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96]",
                    {
                        'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:brightness-105 shadow-sm': variant === 'primary',
                        'bg-[var(--color-text)] text-[var(--color-bg)] hover:brightness-110 shadow-sm': variant === 'secondary',
                        'border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-hint)] shadow-sm': variant === 'outline',
                        'text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5': variant === 'ghost',
                        'h-8 px-4 text-xs': size === 'sm',
                        'h-9 px-5 text-sm': size === 'md',
                        'h-11 px-7 text-base': size === 'lg',
                    },
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';
