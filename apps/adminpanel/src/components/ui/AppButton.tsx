import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface AppButtonProps extends HTMLMotionProps<'button'> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children?: React.ReactNode;
}

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
    ({ className, variant = 'primary', size = 'md', fullWidth, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {

        const variants = {
            primary: 'bg-accent text-white hover:bg-accent-hover shadow-md',
            secondary: 'bg-pill text-main hover:bg-opacity-80 border border-border',
            ghost: 'bg-transparent text-muted hover:text-main hover:bg-pill',
            danger: 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-xs',
            md: 'px-5 py-2.5 text-sm',
            lg: 'px-8 py-3.5 text-base',
        };

        return (
            <motion.button
                ref={ref}
                whileHover={(!disabled && !isLoading) ? { scale: 1.02 } : {}}
                whileTap={(!disabled && !isLoading) ? { scale: 0.98 } : {}}
                disabled={disabled || isLoading}
                className={cn(
                    'inline-flex items-center justify-center rounded-full font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none gap-2',
                    variants[variant],
                    sizes[size],
                    fullWidth && 'w-full',
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
                {!isLoading && leftIcon}
                {children}
                {!isLoading && rightIcon}
            </motion.button>
        );
    }
);
AppButton.displayName = 'AppButton';
